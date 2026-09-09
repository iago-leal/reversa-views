# Requirements: ponte e host da extensão

> Identificador: `002-ponte-e-host`
> Data: `2026-09-09`
> Pasta da extração reversa: `_reversa_sdd/`
> Confidência: 🟢 CONFIRMADO, 🟡 INFERIDO, 🔴 LACUNA / DÚVIDA

## 1. Resumo executivo

Esta feature entrega o lado da extensão que roda em Node: ele registra o painel na barra de
atividades, resolve qual raiz do workspace observar, chama a camada de leitura entregue pela
feature 001 e conversa com a webview por um canal de mensagens de mão dupla. Serve às duas
personas do produto, o Retomador, que quer o painel já preenchido ao abrir o editor, e o Operador,
que pede releitura depois de rodar um agente no terminal.

O problema que ela resolve é de fronteira: a webview não toca o disco, logo tudo o que a tela
mostra precisa chegar por mensagem, e tudo o que ela pede precisa sair por mensagem. Sem um lugar
único para essa travessia, o protocolo se espalha e deixa de ser verificável.

## 2. Contexto a partir do legado

Este repositório é greenfield, e por isso não existem `architecture.md`, `domain.md`,
`inventory.md` nem `code-analysis.md` em `_reversa_sdd/`. O contexto vem do PRD, das specs por
componente e do adendo da feature já entregue, que é a fonte vigente sobre o que existe em código.

| Fonte | Trecho relevante | Confidência |
|-------|------------------|-------------|
| `_reversa_sdd/sdd/ponte-e-host.md#6-requisitos-funcionais` | Treze requisitos do componente, do contêiner de visão à entrega do processo, do relatório da sonda e do momento da leitura | 🟡 |
| `_reversa_sdd/sdd/ponte-e-host.md#9-modelo-de-dados` | Envelope com nome de comando e carga, sem identificador de correlação; cinco comandos da webview e dois do host | 🟡 |
| `_reversa_sdd/sdd/ponte-e-host.md#15-decisoes-tomadas-decision-log` | Provedor em contêiner de visão, canal de mão dupla desde já, política de segurança sem avaliação dinâmica, processo nunca guardado no estado da webview | 🟡 |
| `_reversa_sdd/prd.md#6-restricoes` | A extensão nunca escreve arquivo, em camada alguma; sem rede em tempo de execução; kit de extensão herdado do `vscode-kanban` | 🟡 |
| `_reversa_sdd/prd.md#10-evolucao-prevista-disparar-agentes-pelo-painel` | O canal nasce de mão dupla para que o despacho futuro seja acréscimo, e não reforma | 🟡 |
| `_reversa_sdd/addenda/001-leitura-do-processo.md#impacto-por-artefato-da-extracao` | A dependência obrigatória `leitura-do-processo` deixou de ser promessa; o host a consome por chamada de função sobre a saída CommonJS | 🟢 |
| `_reversa_sdd/sdd/leitura-do-processo.md#6-requisitos-funcionais` | Contrato já cumprido em código: `readReversaSnapshot` devolve retrato e relatório, `readReversa` devolve o processo tipado | 🟢 |
| `_reversa_sdd/sdd/painel-do-processo.md#6-requisitos-funcionais` | O painel desenha cinco estados de entrada e depende desta feature para receber dados e relatar erro | 🟡 |
| `_reversa_sdd/sdd/empacotamento-e-verificacao.md#6-requisitos-funcionais` | Build em duas unidades, VSIX e preview pertencem à feature 005, e não a esta | 🟡 |
| `_reversa_sdd/personas.md#persona-1-o-retomador` | Persona primária, que ordena o desenho: painel preenchido sem comando prévio nem configuração | 🟡 |

Fonte de padrão, fora de `_reversa_sdd/`: `/workspaces/iagoleal/dev/vscode-kanban`, onde a ponte da
webview tem 255 linhas, o arquivo de mensagens tem 126 e o gerador do documento tem 430. O
envelope daquele repositório é literalmente `{ command, data? }`, sem correlação e sem confirmação,
e a regra de que nenhum componente chama a interface do host por conta própria está escrita no
cabeçalho do próprio módulo. 🟢

## 3. Personas e cenários de uso

| Persona | Objetivo | Cenário-chave |
|---------|----------|---------------|
| O Retomador (primária) | Recuperar o estado do projeto sem reconstruir contexto | Abre o repositório depois de meses, clica no ícone da barra de atividades e encontra o painel já preenchido, sem comando nem configuração |
| O Operador | Confirmar que o estágio avançou sem quebrar o ritmo da sessão | Acaba de rodar um agente no terminal, aciona a releitura e vê o processo atualizado |
| O Retomador, em navegação | Ir do painel ao arquivo | Clica no nome de um artefato que o painel aponta e ele abre no editor |

## 4. Regras de negócio novas ou alteradas

1. **RN-01:** O host nunca abre arquivo para escrita, em nenhuma circunstância. Ele lê pela camada
   de leitura, abre documento no editor e registra no log. 🟢
   - Origem no legado: `_reversa_sdd/prd.md#6-restricoes`, invariante declarado não negociável
   - Tipo: nova
2. **RN-02:** Toda travessia entre host e webview passa por exatamente um módulo de cada lado. Nenhum
   outro módulo chama a interface de mensagens. 🟡
   - Origem no legado: `_reversa_sdd/sdd/ponte-e-host.md#3-goals`, objetivo G-02
   - Tipo: nova
3. **RN-03:** Nenhuma mensagem de dados sai do host antes de a webview sinalizar que carregou. A
   ordem é sempre pronto, depois dados. 🟡
   - Origem no legado: `_reversa_sdd/sdd/ponte-e-host.md#11-edge-cases-e-tratamento-de-erros`, EC-07
   - Tipo: nova
4. **RN-04:** O caminho pedido para abertura é resolvido dentro da raiz observada, e recusado se
   escapar dela. A recusa antecede qualquer chamada ao editor. 🟡
   - Origem no legado: `_reversa_sdd/sdd/ponte-e-host.md#12-seguranca-e-privacidade`
   - Tipo: nova
5. **RN-05:** Havendo várias raízes no workspace, observa-se a primeira que contenha instalação do
   Reversa, e as demais são declaradas à webview como não observadas. Não havendo nenhuma com
   instalação, observa-se a primeira. 🟡
   - Origem no legado: `_reversa_sdd/sdd/ponte-e-host.md#11-edge-cases-e-tratamento-de-erros`, EC-02
   - Tipo: nova
6. **RN-06:** O estado que a webview guarda no host contém apenas preferência de exibição. O
   processo jamais é guardado ali, para que a tela não pinte retrato antigo como se fosse atual. 🟡
   - Origem no legado: `_reversa_sdd/sdd/ponte-e-host.md#15-decisoes-tomadas-decision-log`
   - Tipo: nova
7. **RN-07:** O comando de despacho existe no arquivo de tipos como reservado. Recebê-lo produz
   rejeição registrada no log, nunca abertura de terminal nem erro. 🟡
   - Origem no legado: `_reversa_sdd/prd.md#10-evolucao-prevista-disparar-agentes-pelo-painel`
   - Tipo: nova
8. **RN-08:** O código desta feature é escrito novo, seguindo o padrão do `vscode-kanban`, e não
   copiado byte a byte. O carimbo `/* HERDADO` e o registro em `src/heranca/PROCEDENCIA.md` valem
   apenas para cópia literal, e portanto não se aplicam aqui. O que se herda é decisão de desenho,
   não binário. 🟡
   - Origem no legado: `_reversa_sdd/prd.md#7-dependencias-externas`, que descreve o kit do
     `vscode-kanban` como padrão e decisão
   - Tipo: nova
9. **RN-09:** O host não interrompe o usuário. Não há notificação, diálogo nem mudança de foco do
   editor. Toda comunicação passa pela webview, exceto o canal de saída de log. 🟡
   - Origem no legado: `_reversa_sdd/sdd/ponte-e-host.md#8-design-e-interface`
   - Tipo: nova

## 5. Requisitos Funcionais

| ID | Requisito | Prioridade | Critério de aceite | Confidência |
|----|-----------|------------|--------------------|-------------|
| RF-01 | Contribuir um contêiner de visão na barra de atividades e registrar nele um provedor de webview, de modo que o painel exista sem comando de paleta | Must | O ícone aparece na barra de atividades após a instalação, e clicar nele abre o painel | 🟡 |
| RF-02 | Ativar a extensão apenas quando o contêiner de visão for aberto, e não na inicialização do editor | Must | O evento de ativação declarado no manifesto é o da visão, e o editor não carrega a extensão antes disso | 🟡 |
| RF-03 | Resolver a raiz a observar a partir das pastas do workspace e declarar à webview qual raiz foi escolhida | Must | Com uma pasta aberta, o painel recebe o processo dela e o caminho da raiz | 🟡 |
| RF-04 | Havendo várias raízes, escolher a primeira que contenha instalação do Reversa e informar as demais como não observadas | Must | Com duas raízes e Reversa na segunda, a mensagem de entrada nomeia a segunda como observada e a primeira como ignorada | 🟡 |
| RF-05 | Enviar o processo à webview somente depois que ela sinalizar que carregou | Must | Nenhuma mensagem de dados sai antes de chegar a mensagem de pronto | 🟡 |
| RF-06 | Receber toda mensagem da webview por um único ouvinte e rejeitar comando não reconhecido, registrando a rejeição no log | Must | Uma mensagem com comando desconhecido gera entrada no log e nenhum efeito colateral | 🟡 |
| RF-07 | Permitir pedir releitura pela webview e por comando de paleta, com resultado idêntico nos dois caminhos | Must | A releitura pela paleta e a pelo botão entregam o mesmo processo à webview | 🟡 |
| RF-08 | Abrir no editor o arquivo apontado pelo painel, recusando caminho fora da raiz observada | Must | Clicar no nome de um artefato abre o arquivo; um caminho com travessia é recusado com registro no log | 🟡 |
| RF-09 | Servir o documento da webview com política de segurança que admita script apenas por nonce e recurso local apenas da pasta de saída da extensão | Must | A política declarada não contém origem coringa, não admite avaliação dinâmica, e todo script carrega o nonce da sessão | 🟡 |
| RF-10 | Manter o contexto da webview quando ela for ocultada, para que o retorno não repita a leitura | Should | Alternar para outra visão e voltar não dispara nova leitura | 🟡 |
| RF-11 | Expor um canal de saída de log com nome próprio, alimentado também pelas mensagens de log da webview | Must | Uma mensagem de log enviada pela webview aparece no canal de saída com o nome da extensão | 🟡 |
| RF-12 | Declarar no arquivo de tipos do protocolo o comando de despacho, marcado como reservado e sem tratador nesta versão | Should | O tipo existe no arquivo de mensagens, e enviá-lo produz rejeição registrada, não erro | 🟡 |
| RF-13 | Entregar à webview, junto com o processo, o relatório da sonda e o momento da leitura | Must | A mensagem de dados carrega os três campos, e o relatório traz `workspace`, `featureDir`, `refusals` e `truncated` | 🟢 |
| RF-14 | Consumir a camada de leitura por chamada de função sobre a saída CommonJS já compilada, chamando `readReversaSnapshot` e depois `readReversa`, sem replicar regra de derivação no host | Must | Uma busca no código do host não encontra leitura direta de arquivo do Reversa nem cálculo de estágio | 🟢 |
| RF-15 | Nomear cada estado de entrada e enviá-lo à webview como valor de domínio: sem diretório, carregando, sem Reversa, instalado e erro | Must | Os cinco valores existem no arquivo de tipos, e cada um é alcançável por um cenário de teste | 🟡 |
| RF-16 | Capturar toda exceção vinda da camada de leitura, registrar a pilha no log e enviar à webview o estado de erro com a mensagem | Must | Uma leitura que lança produz entrada no log e mensagem de erro à webview, sem exceção não capturada no host | 🟡 |
| RF-17 | Manter o módulo de ponte do host como único ponto que chama a interface de mensagens do editor | Must | Uma busca no código do host encontra exatamente uma ocorrência da chamada de envio e uma do registro de ouvinte | 🟡 |
| RF-18 | Acrescentar ao manifesto de pacote apenas o mínimo de extensão que esta feature exige: versão mínima do editor, ponto de entrada, contribuição de contêiner de visão, evento de ativação da visão e a tipagem da interface do editor em dependências de desenvolvimento | Must | O manifesto declara esses cinco itens e nenhum script de empacotamento, nenhuma lista de exclusão de VSIX e nenhum empacotador | 🟢 |
| RF-19 | Entregar um documento provisório de webview, de poucas linhas, que sinaliza pronto, imprime o processo recebido e oferece os botões de reler e de abrir arquivo | Must | Abrir o painel no editor de desenvolvimento mostra o processo impresso, e os dois botões exercitam os comandos de volta | 🟢 |
| RF-20 | Receber por parâmetro, em cada módulo do host, apenas a parte da interface do editor que ele usa, de modo que os testes passem dublês | Must | Todo módulo do host é exercitável sem o editor real, e a configuração do executor de testes permanece sem apelido de módulo | 🟢 |

## 6. Requisitos Não Funcionais

| Tipo | Requisito | Evidência ou justificativa | Confidência |
|------|-----------|----------------------------|-------------|
| Desempenho | Menos de 1 s entre a mensagem de pronto e a chegada dos dados, incluída a leitura do disco | `_reversa_sdd/sdd/ponte-e-host.md#7-requisitos-nao-funcionais`, RNF-01. A folga é grande: a feature 001 mediu 44 ms para a leitura no workspace de referência, contra teto de 200 ms | 🟢 |
| Desempenho | Custo de ativação nulo quando o painel nunca é aberto | RNF-02 da spec, garantido pelo evento de ativação restrito à visão | 🟡 |
| Segurança | Script apenas por nonce, sem avaliação dinâmica, recurso local restrito à pasta de saída da extensão | RNF-03 da spec. A origem admitia avaliação dinâmica por causa de um editor de código de terceiro, dependência que aqui não existe | 🟡 |
| Segurança | Nenhuma escrita de arquivo em camada alguma do host | `_reversa_sdd/prd.md#6-restricoes` e critério de aceite 7 do PRD | 🟢 |
| Segurança | Nenhuma requisição de rede em tempo de execução | `_reversa_sdd/prd.md#5-nao-objetivos` e seção 10 da spec, que registra dependência de rede como nenhuma | 🟢 |
| Manutenibilidade | Exatamente um ponto de chamada da interface de mensagens em cada lado | RNF-04 da spec, verificável por busca textual | 🟡 |
| Compatibilidade | Versão mínima do editor fixada em 1.78, herdada da origem do kit de extensão, e é ela que o empacotador da feature 005 usará para escolher o alvo | RNF-05 da spec, decidido na sessão de esclarecimentos de 2026-09-09. O `vscode-kanban` declara essa mesma versão | 🟢 |
| Observabilidade | Toda rejeição, toda falha capturada e todo caminho recusado aparecem no canal de saída com nome e motivo | Seção 12 da spec, item de auditoria. Coerente com a preferência por erros barulhentos do projeto | 🟡 |
| Testabilidade | O host é exercitado por teste de unidade com dublês recebidos por parâmetro, sem abrir o editor real e sem apelido de módulo na configuração do executor | `_reversa_sdd/sdd/empacotamento-e-verificacao.md#6-requisitos-funcionais`, RF-09 e NG-03, com a forma decidida na sessão de esclarecimentos de 2026-09-09 | 🟢 |

## 7. Critérios de Aceitação

```gherkin
Cenário: painel preenchido na abertura
  Dado um workspace com uma única raiz que contém instalação do Reversa
  Quando o usuário abre o contêiner de visão e a webview sinaliza que carregou
  Então o host envia uma mensagem de dados com o processo, o relatório da sonda e o momento da leitura
  E o caminho da raiz observada acompanha a mensagem

Cenário: nada é enviado antes do pronto
  Dado um workspace com instalação do Reversa
  Quando o provedor resolve a webview e a leitura termina antes de a webview carregar
  Então nenhuma mensagem de dados foi enviada até a chegada da mensagem de pronto

Cenário: releitura pelos dois caminhos
  Dado um painel já preenchido
  Quando o usuário aciona a releitura pelo botão da webview e, depois, pelo comando de paleta
  Então o host chama a camada de leitura nas duas vezes
  E as duas mensagens de dados têm a mesma forma

Cenário: editor aberto sem pasta
  Dado um editor aberto sem pasta alguma
  Quando a webview sinaliza que carregou
  Então o host envia o estado de entrada de sem diretório
  E nenhuma leitura de disco é tentada

Cenário: várias raízes com Reversa apenas na segunda
  Dado um workspace com duas raízes, e instalação do Reversa somente na segunda
  Quando a webview sinaliza que carregou
  Então o host observa a segunda raiz
  E declara a primeira como não observada

Cenário: abrir arquivo apontado pelo painel
  Dado um painel preenchido que aponta um artefato dentro da raiz observada
  Quando a webview pede a abertura desse caminho relativo
  Então o host abre o documento no editor

Cenário: caminho com travessia de diretório
  Dado um painel preenchido
  Quando a webview pede a abertura de um caminho que escapa da raiz observada
  Então o host recusa antes de qualquer chamada ao editor
  E registra a recusa no canal de saída com o caminho e o motivo

Cenário: comando desconhecido
  Dado um host com o ouvinte registrado
  Quando chega uma mensagem sem nome de comando reconhecido
  Então o host registra a rejeição no log
  E nenhum efeito colateral ocorre

Cenário: comando reservado de despacho
  Dado um host da primeira versão
  Quando chega o comando de despacho declarado como reservado
  Então o host registra a rejeição nomeando o comando como reservado
  E nenhum terminal é aberto

Cenário: camada de leitura lança exceção
  Dado um workspace em que a leitura falha por defeito não previsto
  Quando a webview sinaliza que carregou
  Então o host captura a exceção, registra a pilha no log e envia o estado de erro com a mensagem
  E nenhuma exceção escapa do host

Cenário: painel alcançável sem comando de paleta
  Dado um editor com a extensão instalada
  Quando o usuário olha a barra de atividades
  Então há um contêiner de visão próprio da extensão
  E clicar nele abre o painel sem que nenhum comando tenha sido executado

Cenário: ativação restrita à visão
  Dado um editor que acabou de iniciar com a extensão instalada
  Quando o usuário nunca abre o contêiner de visão
  Então a extensão não é carregada
  E nenhum código do host executa

Cenário: workspace sem instalação do Reversa
  Dado um workspace com uma raiz que não contém instalação do Reversa
  Quando a webview sinaliza que carregou
  Então o host envia o processo lido, marcado como não instalado
  E o estado de entrada acompanha a mensagem como sem Reversa

Cenário: documento servido com política restrita
  Dado o provedor resolvendo a webview
  Quando o host monta o documento
  Então a política de segurança do documento não contém origem coringa
  E não admite avaliação dinâmica de código
  E cada script declarado carrega o nonce da sessão

Cenário: retorno à visão sem nova leitura
  Dado um painel já preenchido
  Quando o usuário alterna para outra visão e volta
  Então o host não chama a camada de leitura de novo
  E o conteúdo anterior permanece na tela

Cenário: ponto único de travessia
  Dado o código do host
  Quando ele é auditado por busca textual
  Então há exatamente uma chamada de envio de mensagem
  E exatamente um registro de ouvinte de mensagem

Cenário: documento provisório prova o canal
  Dado o host desta versão e o documento provisório de webview
  Quando o painel é aberto no editor de desenvolvimento
  Então o documento sinaliza pronto, recebe o processo e o imprime
  E os botões de reler e de abrir arquivo exercitam os dois comandos de volta

Cenário: host exercitado sem o editor real
  Dado um módulo do host que recebe por parâmetro a parte da interface do editor que usa
  Quando o teste passa um dublê no lugar dela
  Então o módulo executa fora do editor
  E a configuração do executor de testes permanece sem apelido de módulo
```

## 8. Prioridade MoSCoW

| Item | MoSCoW | Justificativa |
|------|--------|---------------|
| RF-01, RF-02, RF-03 | Must | Sem contêiner, ativação e raiz resolvida não há painel, e a persona primária exige encontrá-lo pronto |
| RF-05, RF-13, RF-14 | Must | São o caminho feliz inteiro: pronto, leitura pela camada da feature 001, dados na tela |
| RF-06, RF-08, RF-09 | Must | Fronteira de segurança. Comando não reconhecido, travessia de caminho e política do documento são a superfície de ataque do componente |
| RF-15, RF-16 | Must | O PRD exige degradar em vez de falhar, e nomear estado é o que permite ao painel desenhar cada um |
| RF-04, RF-11, RF-17 | Must | Ambiguidade de raiz, auditoria por log e ponto único de travessia são exigências explícitas da spec |
| RF-07 | Must | A releitura é o que serve ao Operador, segunda persona, e é o único caminho de atualização nesta versão |
| RF-10 | Should | Melhora a experiência de alternância, mas o painel funciona sem ela ao custo de uma releitura |
| RF-12 | Should | Prepara o despacho futuro. Se ficar de fora, o botão futuro custa mudança de protocolo, não reforma do canal |
| RNF de desempenho | Should | O teto de 1 s tem folga larga diante dos 44 ms medidos na feature 001, logo não ordena decisão de desenho |
| RF-18 | Must | Sem o mínimo de manifesto não há contêiner nem evento de ativação, e os dois primeiros requisitos ficariam sem prova |
| RF-19 | Must | É o que fecha o ciclo dentro desta feature: sem documento carregado, o host nunca recebe a mensagem de pronto |
| RF-20 | Must | Condiciona o desenho de todos os módulos do host, e por isso precisa valer desde a primeira linha |
| RNF de testabilidade | Must | Sem dublês recebidos por parâmetro, o host só é verificável instalando a extensão, o que contraria a atenção intermitente do mantenedor |

## 9. Esclarecimentos

### Sessão 2026-09-09

- **Q:** A quem pertence o manifesto da extensão, dado que a feature 001 criou o manifesto de
  pacote sem nada de extensão e a spec de empacotamento reivindica manifesto e build para a
  feature 005?
  **R:** Mínimo agora, resto na 005. Esta feature acrescenta ao manifesto apenas o que os
  requisitos dela exigem: versão mínima do editor, ponto de entrada, contribuição do contêiner de
  visão, evento de ativação e a tipagem da interface do editor em dependências de desenvolvimento.
  Build, empacotador e VSIX permanecem com a feature 005. Registrado em RF-18.
- **Q:** O painel real é a feature 003. Sem documento carregado, o host nunca recebe a mensagem de
  pronto. Como provar o canal nesta feature?
  **R:** Documento provisório mínimo, de poucas linhas, que sinaliza pronto, imprime o processo
  recebido e oferece os botões de reler e de abrir arquivo. Descartado quando a feature 003
  entregar o painel. Registrado em RF-19.
- **Q:** O executor de testes fixado na feature 001 não tem acesso ao módulo do editor, que só
  existe dentro dele. Como resolver?
  **R:** Injeção por parâmetro. Cada módulo do host recebe apenas a parte da interface do editor
  que usa, e os testes passam dublês. A configuração compartilhada do executor não muda.
  Registrado em RF-20 e no requisito não funcional de testabilidade.
- **Q:** Qual versão mínima do editor declarar no manifesto, sabendo que ela propaga para o alvo
  do empacotador na feature 005?
  **R:** Herdar a da origem do kit de extensão, a versão 1.78. Registrado no requisito não
  funcional de compatibilidade.

## 10. Lacunas

Nenhuma lacuna em aberto. As três que existiam foram resolvidas na sessão de esclarecimentos de
2026-09-09, registrada na seção anterior, e cada resposta virou requisito.

Seguem como decisões adiadas, e não como lacunas, três pontos que a extração já registrava:

- Observação automática do disco, adiada para depois do uso real conforme a premissa 2 do
  `ideation.md`. Esta feature entrega apenas releitura sob demanda.
- Seletor de raiz quando houver várias com instalação do Reversa, questão OQ-01 da spec, adiada
  até o caso ocorrer de verdade. RN-05 resolve o caso escolhendo a primeira.
- Implementação do despacho de agentes, adiada conforme a seção 10 do PRD. RF-12 apenas reserva o
  lugar dela no protocolo.

## Pendências de Qualidade

Um item da checklist de qualidade não foi atendido, e a escolha é deliberada.

- **Q-018, ausência de nome de biblioteca ou produto no documento.** O documento nomeia o
  `vscode-kanban`, o `vitest` e o `@types/vscode`. Removê-los deixaria as três lacunas da seção 10
  sem objeto: cada uma delas é justamente uma decisão sobre um desses artefatos concretos. A
  ancoragem prevalece sobre a regra de estilo aqui, e o restante do documento descreve o quê, não o
  como, conforme Q-017.

## 11. Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-09-09 | Versão inicial gerada por `/reversa-requirements` | reversa |
| 2026-09-09 | Quatro esclarecimentos integrados por `/reversa-clarify`; RF-18, RF-19 e RF-20 acrescentados; lacunas zeradas | reversa |
