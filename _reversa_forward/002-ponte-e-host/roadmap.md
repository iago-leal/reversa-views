# Roadmap: ponte e host da extensão

> Identificador: `002-ponte-e-host`
> Data: `2026-09-09`
> Requirements: `_reversa_forward/002-ponte-e-host/requirements.md`
> Confidência: 🟢 CONFIRMADO, 🟡 INFERIDO, 🔴 LACUNA

## 1. Resumo da abordagem

A feature acrescenta ao repositório a primeira camada que conhece o editor, e o faz de modo que
quase nenhum arquivo dela dependa do editor. A fronteira concentra-se em dois arquivos, o ponto de
entrada e um módulo de adaptadores, e todos os demais recebem por parâmetro apenas a fatia de
interface que usam, o que satisfaz o requisito de testabilidade sem apelido de módulo na
configuração do executor. Sobre essa fronteira ficam doze módulos pequenos, cada um com uma
responsabilidade nomeada: os tipos do protocolo, a ponte que é o único ponto de envio e de escuta,
o roteador dos comandos recebidos, a escolha da raiz observada, a leitura com captura de exceção,
a contenção de caminho, o documento com política de segurança, o corpo provisório da webview e o
provedor que ordena a sequência de pronto seguida de dados.

Nada de regra de derivação é reescrito aqui. A escolha da raiz observada usa a própria camada de
leitura para decidir se há instalação, e a contenção de caminho reusa `resolveInside`, que a sonda
herdada já exporta. O host, por consequência, não sabe onde o Reversa guarda arquivo nem como
calcula estágio, e uma busca no código dele não encontra caminho de arquivo do framework.

O manifesto cresce apenas o que os requisitos exigem, e a única peça de infraestrutura nova fora
de `src/` é o ícone do contêiner de visão. Build, empacotador, VSIX e preview permanecem com a
feature 005, e o painel real permanece com a feature 003, à qual esta entrega deixa pronto o canal
e o documento que o carregará.

## 2. Princípios aplicados

`.reversa/principles.md` não existe neste projeto, de modo que não há princípio formal a verificar,
tal como já ocorrera na feature 001. Os princípios operacionais do mantenedor, registrados no
`CLAUDE.md` global, seguem valendo como filtro de decisão e constam abaixo para rastreabilidade.

| Princípio | Como a feature se relaciona | Status |
|-----------|------------------------------|--------|
| Estabilidade acima de novidade | A ponte reproduz o desenho que o `vscode-kanban` sustenta há anos, com envelope de nome e carga, sem identificador de correlação e sem confirmação | respeita |
| Documentação para quem retorna após meses | O `onboarding.md` desta feature abre o painel por linha de comando, sem depender de configuração de depuração que só a feature 005 entrega | respeita |
| Erros barulhentos | Toda rejeição, toda falha capturada e todo caminho recusado vão ao canal de saída com nome e motivo; nada é engolido por captura silenciosa | respeita |
| Setup reproduzível | As duas dependências novas entram com versão exata, e o arquivo de trava é versionado, como na feature 001 | respeita |
| Proporcionalidade: categoria Aplicação | Camadas explícitas, contratos declarados num arquivo só e testes de unidade em toda decisão; sem infraestrutura além da que os requisitos pedem | respeita |
| Executar, não delegar ao usuário | O onboarding entrega comandos executáveis, e a única etapa manual que resta é olhar a tela, que nenhuma automação substitui | respeita |

## 3. Decisões técnicas

| ID | Decisão | Justificativa | Alternativas descartadas | Confidência |
|----|---------|----------------|--------------------------|-------------|
| D-01 | A dependência do editor concentra-se em dois arquivos, `src/extension.ts` e `src/host/adapters.ts`; todo o resto do host recebe portas por parâmetro e, quando precisa da tipagem, importa `vscode` apenas como tipo | É a forma que satisfaz RF-20 sem tocar no executor de testes: um módulo que não importa valor do editor roda em Node puro. O critério vira busca textual, pois `from 'vscode'` como importação de valor deve aparecer em exatamente dois arquivos | Apelido de módulo no executor apontando para um dublê (muda a configuração compartilhada, contra RF-20); harness com o editor real (NG-03 da spec 5) | 🟢 |
| D-02 | Doze módulos novos sob `src/host/`, com identificadores e comentários de código em inglês, e documentação em português | Todo o código já existente no repositório está em inglês, por vir de duas origens em inglês, e a interface do editor também está. Misturar idiomas dentro de uma expressão custa mais do que ganha | Nomear em português como a documentação (cria fronteira de idioma no meio de cada chamada) | 🟡 |
| D-03 | Um módulo de ponte concentra a única chamada de envio e o único registro de ouvinte; nenhum outro módulo toca a interface de mensagens | RF-17 e RNF-04 pedem exatamente isso, e o `vscode-kanban` prova que a disciplina é o que torna o protocolo congelável | Cada módulo enviando o que lhe cabe (espalha o protocolo e impede a auditoria por busca) | 🟢 |
| D-04 | A mensagem de dados carrega, além de processo, relatório e momento da leitura, o estado de entrada, a raiz observada e as raízes ignoradas; os cinco estados vivem num único tipo união do arquivo de protocolo | RF-13 pede três campos, RF-03 e RF-04 pedem a raiz e as ignoradas, e RF-15 pede os cinco estados nomeados. Anexá-los à mesma mensagem evita que a webview receba processo e estado por caminhos distintos e tenha de os correlacionar sem identificador | Duas mensagens independentes, uma de processo e outra de estado (a spec do protocolo as separa, mas o cenário de workspace sem Reversa exige as duas juntas) | 🟡 |
| D-05 | Um terceiro comando do host para a webview, o de aviso, cobre a falha ao abrir arquivo que não existe mais | EC-05 da spec exige aviso que nomeie o arquivo, e RN-09 proíbe notificação do editor, de modo que o aviso só tem por onde sair pela webview | Registrar apenas no log (o usuário clica e nada acontece); notificação do editor (contraria RN-09) | 🟡 |
| D-06 | A raiz observada é escolhida chamando a camada de leitura em cada raiz, na ordem do workspace, parando na primeira instalada; o resultado dessa leitura é o que se envia, sem segunda passagem | RF-14 proíbe replicar regra de derivação no host, e verificar instalação por existência de arquivo seria justamente isso. O custo medido na feature 001 é de 44 ms por raiz, e o caso de uma raiz só é o comum | Testar a existência de `.reversa/state.json` no host (duplica o layout, contra RF-14); ler todas as raízes e escolher depois (paga leitura que não será usada) | 🟡 |
| D-07 | A contenção de caminho reusa `resolveInside`, exportado por `src/heranca/reversa-probe/src/files.ts`, e o host não escreve regra própria de travessia | A função já recusa caminho absoluto, caminho com unidade de disco do Windows e qualquer resolução que escape da raiz, e já vem coberta por suíte herdada. Escrever outra criaria duas regras para divergir | Comparação de prefixo escrita no host (repete regra já testada e erra nos casos de borda) | 🟢 |
| D-08 | O documento provisório carrega o script embutido no próprio documento, sob o nonce da sessão, sem arquivo em disco | A política admite script por nonce, e é isso que RF-09 exige. Um arquivo em disco exigiria passo de cópia para a pasta de saída, e RF-18 mantém build e empacotamento na feature 005 | Arquivo de script na pasta de saída (exige o passo de build que esta feature não pode criar) | 🟡 |
| D-09 | A política do documento declara origem padrão nenhuma, conexão nenhuma, script apenas por nonce, e folha de estilo, fonte e imagem apenas da origem do próprio webview; a cláusula de avaliação dinâmica não existe | RNF-03 pede política mais restrita que a da origem, cuja única razão para admitir avaliação dinâmica era um avaliador de expressões de terceiro que aqui não existe | Herdar a política do `vscode-kanban` inteira (traz a cláusula que o requisito manda remover) | 🟢 |
| D-10 | O contexto da webview é retido quando ela é ocultada, e a releitura pedida enquanto ela está oculta é marcada como pendente e executada quando ela volta a ficar visível | A documentação da interface diz, com todas as letras, que não se envia mensagem a webview oculta ainda que o contexto seja retido. Marcar pendência mantém RF-07 verdadeiro nos dois caminhos sem guardar processo em memória | Enviar mesmo assim (a mensagem se perde em silêncio); guardar a carga lida para reenviar ao voltar (arrisca pintar retrato antigo, contra RN-06) | 🟢 |
| D-11 | O manifesto ganha seis itens, e não cinco: aos cinco de RF-18 soma-se a contribuição de comandos, exigida por RF-07 | RF-18 fixa o critério de que entra apenas o que os requisitos desta feature exigem, e RF-07 exige releitura por comando de paleta. As três proibições do critério de aceite, empacotador, script de empacotamento e lista de exclusão de VSIX, seguem valendo | Deixar o comando para a feature 005 (RF-07 ficaria sem prova); omitir a contribuição de visão (o contêiner apareceria vazio) | 🟡 |
| D-12 | A tipagem da interface do editor entra fixada em 1.78.0, igual à versão mínima declarada, e o arranjo `types` do compilador passa a incluir `vscode` | O descasamento da origem, que declara mínimo 1.78 e tipa em 1.62, é acidente e não padrão. O arranjo `types` hoje lista apenas `node`, e sem a inclusão o módulo do editor não é encontrado na verificação de tipos | Herdar 1.62.0 da origem (tipa contra interface mais velha que a exigida); deixar `types` como está (a verificação de tipos falha) | 🟢 |
| D-13 | Esta feature não cria configuração de depuração; o onboarding abre o editor de desenvolvimento pela linha de comando | A configuração de depuração é RF-11 da spec de empacotamento, de prioridade Should, e pertence à feature 005. A linha de comando prova o mesmo sem antecipar escopo alheio | Criar a configuração agora (invade a feature 005 e duplica decisão que ela ainda vai tomar) | 🟡 |
| D-14 | O ícone do contêiner de visão é um desenho monocromático em `media/reversa.svg`, fora da pasta de saída e versionado | A contribuição de contêiner exige caminho de ícone, e sem ele o item da barra de atividades não aparece. A pasta de saída é ignorada pelo versionamento, logo o ícone não pode morar nela | Reusar o ícone da origem (é de outro produto); adiar o ícone (RF-01 ficaria sem prova) | 🟢 |
| D-15 | Nove suítes novas em `tests/`, uma por módulo de decisão mais uma sobre o manifesto e uma sobre as fronteiras, sem qualquer mudança na configuração do executor | A configuração já inclui `tests/**/*.spec.ts`, e RF-20 exige que ela permaneça sem apelido de módulo. As duas últimas suítes convertem em teste os cenários que só se verificam por leitura de arquivo | Testar o host só pelo editor de desenvolvimento (contraria a atenção intermitente do mantenedor) | 🟢 |

Forma da política de segurança decidida em D-09, com a origem do webview substituída em tempo de
montagem e o nonce gerado por sessão:

```
default-src 'none';
img-src <origem> data:;
style-src <origem>;
font-src <origem>;
script-src 'nonce-<nonce>';
connect-src 'none'
```

## 4. Premissas

Nenhuma. O `requirements.md` chegou ao plano sem marcador `[DÚVIDA]`, depois da sessão de
esclarecimentos de 2026-09-09, e a seção 10 daquele documento declara as três lacunas anteriores
como decisões adiadas, não como dúvidas abertas.

| Premissa | Origem (`requirements.md` seção) | Risco se errada |
|----------|----------------------------------|-----------------|
| n/a | n/a | n/a |

## 5. Delta arquitetural

Não há `_reversa_sdd/architecture.md`, pois o projeto é novo. O delta mede-se contra o estado atual
do repositório, que tem apenas a camada herdada da feature 001, e contra os componentes descritos
nas specs SDD. O adendo `_reversa_sdd/addenda/001-leitura-do-processo.md` é a fonte vigente sobre o
que já existe em código.

| Componente | Arquivo de origem no legado | Tipo de mudança | Resumo |
|------------|------------------------------|-----------------|--------|
| Protocolo do canal (`src/host/protocol.ts`) | `_reversa_sdd/sdd/ponte-e-host.md#9-modelo-de-dados` | contrato-novo | Envelope, três comandos do host, cinco da webview e o tipo união dos cinco estados de entrada, num arquivo só |
| Ponte do host (`src/host/bridge.ts`) | `_reversa_sdd/sdd/ponte-e-host.md#6-requisitos-funcionais` (RF-05, RF-06, RF-17) | componente-novo | Único ponto de envio e de escuta, com a guarda de pronto e o registro de entrega não confirmada |
| Roteador de comandos (`src/host/router.ts`) | `#6` (RF-06, RF-07, RF-11, RF-12) | componente-novo | Despacha os cinco comandos da webview, rejeita o desconhecido e nomeia o reservado |
| Escolha da raiz (`src/host/root.ts`) | `#6` (RF-03, RF-04) e `#11` (EC-02) | componente-novo | Percorre as raízes pela camada de leitura, devolve a observada, as ignoradas e o resultado já lido |
| Leitura e composição (`src/host/reading.ts`) | `#6` (RF-13, RF-14, RF-15, RF-16) | componente-novo | Chama a camada da feature 001, captura exceção, nomeia o estado de entrada e monta a carga |
| Contenção e abertura (`src/host/open-file.ts`) | `#6` (RF-08) e `#12-seguranca-e-privacidade` | componente-novo | Reusa `resolveInside` da sonda, recusa antes de qualquer chamada ao editor e trata o arquivo ausente |
| Documento do webview (`src/host/document.ts`) | `#6` (RF-09) e `#7` (RNF-03) | componente-novo | Política sem avaliação dinâmica, nonce por sessão e recurso local restrito à origem do webview |
| Corpo provisório (`src/host/provisional.ts`) | `requirements.md#5` (RF-19) | componente-novo | Sinaliza pronto, imprime o processo recebido e oferece os dois botões; descartado quando a feature 003 entregar o painel |
| Provedor de visão (`src/host/provider.ts`) | `#6` (RF-01, RF-05, RF-10) e `#11` (EC-03, EC-07) | componente-novo | Resolve a visão, ordena pronto seguido de dados, retém contexto e trata a releitura pendente |
| Portas e adaptadores (`src/host/ports.ts`, `src/host/adapters.ts`) | `requirements.md#5` (RF-20) | componente-novo | As quatro fatias mínimas da interface do editor e a única implementação delas |
| Ativação (`src/extension.ts`) | `#6` (RF-02, RF-07, RF-11) | componente-novo | Registra provedor, comando de paleta e canal de saída; nada mais roda na ativação |
| Manifesto da extensão (`package.json`) | `requirements.md#5` (RF-18) e `_reversa_sdd/sdd/empacotamento-e-verificacao.md#6` | contrato-novo | Versão mínima, ponto de entrada, contêiner, visão, evento de ativação, comando e a tipagem em dependências de desenvolvimento |
| Configuração do compilador (`tsconfig.json`) | `_reversa_sdd/sdd/empacotamento-e-verificacao.md#6` (RF-01, parcial) | regra-alterada | O arranjo `types` passa a incluir `vscode`; nada mais muda, e a separação em duas unidades continua com a feature 005 |
| Suítes do host (`tests/host-*.spec.ts`) | `requirements.md#7` | componente-novo | Nove suítes que cobrem os dezoito cenários, incluindo os que se verificam por leitura do manifesto e do próprio fonte |
| Ícone do contêiner (`media/reversa.svg`) | `requirements.md#5` (RF-01) | componente-novo | Desenho monocromático de 24 por 24, exigido pela contribuição de contêiner |

Arquivos que a mudança toca, em rascunho para o `legacy-impact.md` do coding. Criados: os doze
módulos sob `src/host/` mais `src/extension.ts`, as nove suítes em `tests/` e `media/reversa.svg`.
Alterados: `package.json`, que ganha as seis chaves de extensão e a dependência de tipagem,
`package-lock.json`, por consequência da instalação, e `tsconfig.json`, no único campo `types`.
Todos os três alterados ficam fora das pastas próprias do Reversa, e portanto dependem da política
de escrita, que hoje está liberada sem restrição de caminho, conforme se registra na seção 9.

## 6. Delta no modelo de dados

- Resumo das mudanças: nada é persistido, e nenhuma migração existe. A feature cria uma única
  estrutura, o protocolo do canal, que vive em memória e atravessa a fronteira do processo. Sobre a
  forma declarada em `_reversa_sdd/sdd/ponte-e-host.md#9-modelo-de-dados` há três deltas: a
  mensagem de dados ganha o estado de entrada, a raiz observada e as raízes ignoradas; um terceiro
  comando do host, o de aviso, cobre o caso do arquivo que sumiu; e os cinco estados de entrada
  passam a viver num tipo união único, em vez de aparecerem apenas como texto de comentário.
- Detalhe completo em: `_reversa_forward/002-ponte-e-host/data-delta.md`

## 7. Delta de contratos externos

Um contrato, e ele não é de rede. O canal entre a webview e o host atravessa a fronteira de
processo que o editor administra, tem dois lados escritos por features diferentes, a 002 e a 003, e
por isso precisa de descrição própria, com carga, resposta, erro, idempotência e tempo. Não há HTTP,
fila nem chamada remota nesta feature, e a seção 10 da spec registra dependência de rede como
nenhuma.

| Contrato | Tipo | Arquivo de detalhe |
|----------|------|--------------------|
| Canal de mensagens entre a webview e o host | mensagem entre processos | `_reversa_forward/002-ponte-e-host/interfaces/protocolo-webview.md` |

## 8. Plano de migração

n/a. Não há dado a migrar, instalação anterior a substituir nem protocolo antigo a preservar. O
canal nasce nesta feature, e o único consumidor futuro dele, o painel da feature 003, ainda não
existe.

## 9. Riscos e mitigações

| Risco | Impacto | Probabilidade | Mitigação |
|-------|---------|---------------|-----------|
| A contribuição de comandos, acrescida por D-11, ser lida como violação do critério de aceite de RF-18, que enumera cinco itens | baixo | média | A decisão está declarada aqui e no relatório final; o critério proíbe nominalmente empacotador, script de empacotamento e lista de exclusão, e nenhum dos três entra. Se o usuário preferir o contrário, RF-07 perde o caminho da paleta e passa a depender só do botão, o que a questão OQ-03 da spec já admitia |
| A tipagem do editor não ser encontrada por o arranjo `types` do compilador listar apenas `node` | alto | alta se esquecido | D-12 torna a inclusão parte da mudança, e a primeira ação do coding depois de instalar a dependência é rodar a verificação de tipos, antes de escrever qualquer módulo |
| Percorrer várias raízes com leitura síncrona atrasar a primeira pintura num workspace grande | médio | baixa | O caso de uma raiz só é o comum, e a medida da feature 001 é de 44 ms contra teto de 1 s. Se o caso aparecer, a mitigação registrada é ler a primeira raiz e adiar as demais, o que a questão OQ-01 da spec já prevê reabrir |
| A contenção de caminho ser lexical, de modo que um vínculo simbólico dentro da raiz aponte para fora dela | baixo | baixa | Consequência declarada na origem e aceita ali pelo mesmo motivo que vale aqui: o host apenas lê e abre documento, nunca escreve. Fica registrada no arquivo do contrato |
| O documento provisório, com script embutido, atrasar a montagem do bundle real da feature 003 | baixo | média | O corpo provisório vive num módulo próprio, e a feature 003 o substitui trocando uma chamada. O documento em si, com política e nonce, permanece |
| A releitura pedida pela paleta com a visão oculta parecer não funcionar | médio | média | D-10 marca a pendência e executa ao voltar a visibilidade, e o canal de saída registra a postergação com o motivo, de modo que o comportamento seja legível |
| O comando reservado de despacho ser confundido com funcionalidade existente | baixo | baixa | RF-12 exige rejeição registrada nomeando o comando como reservado, e a suíte do roteador fixa esse texto |

## 10. Critério de pronto

- [ ] Todas as ações do `actions.md` marcadas `[X]`
- [ ] `cross-check.md` (se executado) sem CRITICAL nem HIGH
- [ ] `regression-watch.md` gerado
- [ ] `npm run typecheck` sem erro, com a tipagem do editor resolvida
- [ ] `npm test` verde, com as nove suítes novas e sem regressão nas dezenove herdadas
- [ ] A busca por importação de valor do editor encontra exatamente dois arquivos
- [ ] A busca por envio de mensagem e por registro de ouvinte encontra exatamente uma ocorrência de cada
- [ ] O painel abre pelo editor de desenvolvimento, imprime o processo e os dois botões respondem
- [ ] Re-extração reversa executada e sem regressão vermelha (recomendado, não obrigatório)

## 11. Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-09-09 | Versão inicial gerada por `/reversa-plan` | reversa |
