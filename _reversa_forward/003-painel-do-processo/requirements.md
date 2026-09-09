# Requirements: painel do processo

> Identificador: `003-painel-do-processo`
> Data: `2026-09-09`
> Pasta da extração reversa: `_reversa_sdd/`
> Confidência: 🟢 CONFIRMADO, 🟡 INFERIDO, 🔴 LACUNA / DÚVIDA

## 1. Resumo executivo

Esta feature entrega a tela. Ela recebe o processo tipado que a ponte da feature 002 envia e o
desenha na barra lateral do editor, com seis eixos, sete estados visíveis e uma ordem de leitura
ditada pela persona primária, que precisa saber o que aguarda decisão dela antes de qualquer
histórico.

O problema que ela resolve é de seleção e de confiança. O processo chega com oito eixos e dezenas
de campos, e despejá-los produz painel denso que ninguém lê; por isso a ordem, a ênfase e a omissão
são o produto. Ao mesmo tempo, painel que mostra estado errado é pior que painel nenhum, e por isso
o diagnóstico entra desde a primeira versão, declarando quando a leitura degradou. É o único
componente que o usuário vê, e é nele que a métrica de sucesso do produto se mede.

## 2. Contexto a partir do legado

Este repositório é greenfield, e por isso `_reversa_sdd/` não traz `architecture.md`, `domain.md`,
`inventory.md` nem `code-analysis.md`. O contexto vem do PRD, das specs por componente e dos dois
adendos vigentes, que são hoje a fonte mais precisa sobre o que existe em código.

| Fonte | Trecho relevante | Confidência |
|-------|------------------|-------------|
| `_reversa_sdd/sdd/painel-do-processo.md#6-requisitos-funcionais` | Quinze requisitos do componente, dos cinco estados de entrada à ordem obrigatória das seções e às funções puras de decisão | 🟡 |
| `_reversa_sdd/sdd/painel-do-processo.md#8-design-e-interface` | Os sete estados visíveis da tela, o painel em coluna única e a proibição de animação e de deslocamento entre releituras | 🟡 |
| `_reversa_sdd/sdd/painel-do-processo.md#11-edge-cases-e-tratamento-de-erros` | Nove casos, do estado vazio ao nome de seção que não existe mais, passando pelo limite de erro por seção | 🟡 |
| `_reversa_sdd/sdd/painel-do-processo.md#15-decisoes-tomadas-decision-log` | Seis decisões fechadas: seis eixos com diagnóstico, ordem pela persona primária, decisão em função pura, conteúdo preservado na releitura, limite de erro por seção, ausência de indicador giratório | 🟡 |
| `_reversa_sdd/prd.md#4-escopo-in` | Os seis eixos agrupados em núcleo e diagnóstico, a leitura automática na ativação e a releitura sob demanda | 🟡 |
| `_reversa_sdd/prd.md#10-evolucao-prevista-disparar-agentes-pelo-painel` | O estágio precisa ser valor de domínio nomeado, e não texto renderizado, porque dele derivará a sugestão de agente | 🟡 |
| `_reversa_sdd/personas.md#persona-1-o-retomador` | Persona primária, que ordena o desenho: sair do painel sabendo o próximo passo, sem abrir arquivo | 🟡 |
| `_reversa_sdd/addenda/002-ponte-e-host.md#impacto-por-artefato-da-extracao` | O canal existe em código, o documento provisório sinaliza pronto e imprime o que chega, e a feature 003 o substitui trocando uma chamada | 🟢 |
| `_reversa_sdd/addenda/001-leitura-do-processo.md#impacto-por-artefato-da-extracao` | O tipo do processo que o painel consome já existe; ao desenhar a tela, o modelo se lê pelo código herdado | 🟢 |
| `_reversa_sdd/sdd/empacotamento-e-verificacao.md#6-requisitos-funcionais` | Teto de tamanho verificado, lista de exclusão, pacote instalável e preview pertencem à feature 005; a sessão de esclarecimentos trouxe para cá apenas o empacotamento mínimo que torna o painel executável | 🟡 |

Fonte normativa fora de `_reversa_sdd/`, entregue pela feature anterior:
`_reversa_forward/002-ponte-e-host/interfaces/protocolo-webview.md`, que descreve o canal com carga,
resposta, erro, idempotência e ordem obrigatória. Ele registra que o protocolo ainda não está
congelado porque o único consumidor dele é esta feature, e que a partir da primeira versão instalada
a regra passa a ser acrescentar sem renomear nem remover. 🟢

Fonte de código, verificada neste repositório: `src/host/protocol.ts` declara os cinco estados de
entrada, os três comandos do host e os cinco da webview; `src/host/provisional.ts` é o corpo
descartável que esta feature substitui; `src/heranca/reversa-domain/src/index.ts` declara o processo
com os oito eixos, dos quais seis são desenhados aqui. 🟢

## 3. Personas e cenários de uso

| Persona | Objetivo | Cenário-chave |
|---------|----------|---------------|
| O Retomador (primária) | Sair do painel sabendo o próximo passo | Volta a um projeto parado há meses, abre a barra lateral e lê, sem rolar, a fase da descoberta, a feature ativa e o que aguarda decisão dele |
| O Operador | Confirmar que o estágio avançou sem quebrar o ritmo | Roda um agente no terminal, aciona a releitura e vê a contagem de ações mudar, sem que a tela pisque |
| O Retomador, em navegação | Ir do painel ao arquivo | Clica no nome do artefato que o painel aponta e ele abre no editor |
| Ambos, em leitura degradada | Não agir sobre estado falso | Um arquivo do Reversa corrompido produz aviso no cabeçalho e lista de anomalias, em vez de tela que parece íntegra |

## 4. Regras de negócio novas ou alteradas

1. **RN-01:** Toda decisão de apresentação vive em função pura, fora dos componentes visuais.
   Componente visual chama a função e desenha o resultado, sem decidir. 🟡
   - Origem no legado: `_reversa_sdd/sdd/painel-do-processo.md#15-decisoes-tomadas-decision-log`
   - Tipo: nova
2. **RN-02:** A webview não lê disco, não faz requisição e não conhece caminho de arquivo do
   Reversa. Tudo o que ela mostra chegou por mensagem, e tudo o que ela pede sai por mensagem. 🟢
   - Origem no legado: `_reversa_sdd/prd.md#6-restricoes`
   - Tipo: nova
3. **RN-03:** Exatamente um módulo da webview toca a interface do host, tomada uma única vez por
   painel. Nenhum componente a chama por conta própria. 🟢
   - Origem no legado: `_reversa_forward/002-ponte-e-host/interfaces/protocolo-webview.md#2-transporte-e-forma`,
     que fixa a mesma regra nos dois lados
   - Tipo: nova
4. **RN-04:** O estágio da feature, a fase da descoberta e o estado de entrada são valores de
   domínio nomeados dentro do painel, nunca texto já renderizado. O rótulo legível é derivado do
   valor, e não o substitui. 🟡
   - Origem no legado: `_reversa_sdd/prd.md#10-evolucao-prevista-disparar-agentes-pelo-painel`
   - Tipo: nova
5. **RN-05:** Valor que a tela não conhece nunca quebra a renderização. Estágio, fase, código de
   anomalia ou nome de seção fora do vocabulário conhecido são exibidos em forma bruta, com aviso de
   rótulo desconhecido, ou ignorados quando se trate de preferência guardada. 🟡
   - Origem no legado: `_reversa_sdd/sdd/painel-do-processo.md#11-edge-cases-e-tratamento-de-erros`,
     casos EC-05 e EC-09
   - Tipo: nova
6. **RN-06:** O painel nunca omite degradação. Havendo anomalia, recusa ou truncamento, o cabeçalho
   declara a degradação; não havendo nenhum dos três, ele declara que a leitura foi íntegra. O
   silêncio não é resposta válida em nenhum dos dois sentidos. 🟡
   - Origem no legado: `_reversa_sdd/prd.md#8-riscos`, risco de o painel mentir sem avisar
   - Tipo: nova
7. **RN-07:** Nenhum erro do painel vira notificação, diálogo ou mudança de foco. Falha de seção
   aparece na própria seção, e a linha técnica vai ao canal de saída pelo comando de log. 🟢
   - Origem no legado: `_reversa_forward/002-ponte-e-host/interfaces/protocolo-webview.md#6-erros`
   - Tipo: nova
8. **RN-08:** A releitura preserva o conteúdo anterior. O cabeçalho marca que relê, e a substituição
   acontece quando a nova carga chega. Nada pisca, nada anima e nada muda de lugar entre leituras. 🟡
   - Origem no legado: `_reversa_sdd/sdd/painel-do-processo.md#15-decisoes-tomadas-decision-log`
   - Tipo: nova
9. **RN-09:** O painel não guarda o processo, apenas a preferência de exibição, no estado que a
   webview mantém no host. Preferência é a lista de seções recolhidas, e nada além disso. 🟡
   - Origem no legado: `_reversa_sdd/sdd/painel-do-processo.md#9-modelo-de-dados`
   - Tipo: nova

## 5. Requisitos Funcionais

| ID | Requisito | Prioridade | Critério de aceite | Confidência |
|----|-----------|------------|--------------------|-------------|
| RF-01 | Desenhar tela distinta para cada um dos cinco estados de entrada nomeados no protocolo: sem pasta, carregando, sem Reversa, instalado e erro | Must | Cada estado tem título próprio, e nenhum produz tela vazia | 🟡 |
| RF-02 | Exibir no cabeçalho o nome do projeto, a versão do Reversa lida, a raiz observada, o momento da leitura e a ação de reler | Must | Com processo instalado, os cinco itens estão presentes e preenchidos | 🟡 |
| RF-03 | Exibir faixa de bloqueio humano acima de todo o resto, derivada de quatro sinais do processo: entrega concluída sem adendo, migração aguardando decisão, cada decisão de migração pendente nomeada uma a uma, e dúvidas remanescentes na feature ativa | Must | Feature com todas as ações fechadas e sem adendo produz uma razão; migração com duas decisões pendentes produz duas linhas, uma por decisão | 🟡 |
| RF-03a | Compor cada razão da faixa com três partes: o texto que a nomeia, o artefato relacionado como alvo clicável e o comando do Reversa em bloco copiável, sem que o painel o execute | Must | A razão de entrega não convergida mostra o texto, aponta o arquivo de ações da feature e oferece `/reversa-sync` para copiar | 🟡 |
| RF-04 | Desenhar as cinco fases da descoberta na ordem canônica, com status concluída, corrente ou pendente distinguível sem depender de cor | Must | As cinco aparecem mesmo em estado vazio, e a corrente se distingue em tema de alto contraste | 🟡 |
| RF-05 | Listar os checkpoints por agente, separando o que concluiu do que ainda corre, com a data de conclusão quando houver | Must | Checkpoint sem data de conclusão aparece como em andamento | 🟡 |
| RF-06 | Exibir o ciclo forward com oito itens: estágio em rótulo legível, feature ativa, ações fechadas, ações abertas, emendas, dúvidas, features pausadas e adendo | Must | Cada item aparece preenchido ou declarado ausente por nome, nunca em branco | 🟡 |
| RF-07 | Exibir a política de escrita no legado com o veredito vigente e as pastas em que o Reversa pode escrever | Must | Com a política desligada, o painel diz que a edição do legado está desligada e lista as seis pastas próprias | 🟡 |
| RF-08 | Listar toda anomalia com arquivo, código e detalhe, e declarar no cabeçalho se a leitura degradou ou foi íntegra | Must | Uma anomalia produz lista e aviso; zero anomalia produz declaração de leitura íntegra | 🟡 |
| RF-09 | Exibir o relatório da sonda com a raiz lida, a pasta da feature, os caminhos recusados e os arquivos truncados | Must | Uma recusa aparece com o caminho e o motivo | 🟡 |
| RF-10 | Abrir no editor o artefato que o painel aponta, enviando ao host o caminho relativo à raiz observada | Must | O clique envia a mensagem de abrir com caminho relativo, e nenhum componente chama o host diretamente | 🟢 |
| RF-11 | Seguir o tema do editor, incluindo os dois de alto contraste, pela classe que o editor escreve no corpo do documento | Must | Trocar o tema repinta o painel sem releitura e sem perder seções recolhidas | 🟡 |
| RF-12 | Permitir recolher e expandir cada seção, guardando a preferência no estado da webview | Should | Recolher uma seção, ocultar o painel e reexibi-lo mantém a seção recolhida | 🟡 |
| RF-22 | Aplicar, na ausência de preferência guardada, o padrão inicial de exibição: as seções de núcleo expandidas, as três de diagnóstico recolhidas com a contagem visível no título, e a de anomalias expandida sempre que a leitura tiver degradado | Must | Primeira abertura em leitura íntegra mostra ciclo forward e descoberta abertos, e política, anomalias e relatório da sonda fechados com a contagem no título; havendo anomalia, recusa ou truncamento, a de anomalias abre junto | 🟡 |
| RF-23 | Prover a segunda unidade de compilação da webview e o empacotamento do bundle, o bastante para o painel rodar no editor | Must | Um comando produz a saída com host e webview, e uma importação de módulo de plataforma dentro da webview falha na verificação de tipos | 🟡 |
| RF-24 | Podar os tokens do sistema de design por fecho transitivo sobre as referências entre eles, emitindo apenas os quatro conjuntos de cor que a folha do painel de fato alcança | Must | O bundle com os quatro conjuntos cabe no orçamento de 400 KB, e remover da folha um token ainda referenciado quebra a verificação | 🟡 |
| RF-13 | Implementar em funções puras, separadas dos componentes, ao menos o estado de entrada, as razões de bloqueio, o rótulo de estágio, o rótulo de fase e a ordem das seções | Must | As funções são importáveis e exercitáveis sem navegador, e os componentes apenas as chamam | 🟡 |
| RF-14 | Ordenar as seções assim: faixa de bloqueio, ciclo forward, descoberta, política, anomalias, relatório da sonda | Must | A ordem no documento renderizado corresponde à declarada pela função de ordem | 🟡 |
| RF-15 | Reservar no cabeçalho o lugar da ação de despacho, nomeado e vazio, sem desenhar botão | Could | Acrescentar o botão depois não desloca os demais itens do cabeçalho | 🟡 |
| RF-16 | Exibir o aviso que o host envia pelo terceiro comando do canal, hoje usado apenas para arquivo que não existe mais, sem que ele substitua o conteúdo da tela | Must | Pedir a abertura de arquivo ausente mostra o aviso nomeando o arquivo, e o painel permanece preenchido | 🟢 |
| RF-17 | Concentrar em um único módulo o envio e a recepção de mensagens, tomando a interface do host uma vez por painel | Must | A varredura dos fontes da webview encontra uma chamada de envio e um registro de ouvinte, ambos nesse módulo | 🟢 |
| RF-18 | Substituir o corpo provisório entregue pela feature 002, removendo o arquivo e preservando o gerador de documento com a política de segurança e o nonce | Must | O arquivo provisório deixa de existir, o gerador permanece e a suíte do documento continua verde | 🟢 |
| RF-19 | Ignorar mensagem do host que a webview não entenda, registrando a ocorrência pelo comando de log, sem alterar a tela | Must | Envelope com comando desconhecido produz uma linha de log e nenhuma mudança visível | 🟢 |
| RF-20 | Isolar falha de renderização por seção, de modo que a seção defeituosa declare a falha e as demais permaneçam visíveis, com a linha técnica enviada ao log | Must | Erro forçado em uma seção mantém as outras cinco desenhadas | 🟡 |
| RF-21 | Limitar a exibição inicial de anomalias às dez primeiras, mostrando a contagem total e um controle para ver o resto | Should | Com quinze anomalias, a seção mostra dez, o total e o controle | 🟡 |

## 6. Requisitos Não Funcionais

| Tipo | Requisito | Evidência ou justificativa | Confidência |
|------|-----------|----------------------------|-------------|
| Usabilidade | As três perguntas do Retomador, fase da descoberta, estágio da feature e bloqueio humano, respondidas sem rolagem em painel de 320 px | Métrica da spec do componente, seção 3 | 🟡 |
| Layout | Nenhuma rolagem horizontal em 300 px; abaixo disso o conteúdo empilha e nada é cortado | RNF-01 e EC-04 da spec do componente | 🟡 |
| Desempenho | Pintura abaixo de 100 ms após a chegada da carga, sobre processo de até 50 KB | RNF-02 da spec do componente; a leitura do disco custou 44 ms no workspace de referência | 🟡 |
| Acessibilidade | Status de fase e de checkpoint distinguíveis sem cor, e toda ação acionável por teclado | RNF-03 da spec do componente; alto contraste é tema suportado, não exceção | 🟡 |
| Testabilidade | Cobertura de 100% de linhas nas funções de decisão; componentes visuais não são cobertos por teste de unidade | RNF-05 da spec do componente | 🟡 |
| Portão de saída | A suíte automatizada verde encerra as ações desta feature. A verificação visual dos sete estados da tela é ação da feature 005, junto do preview, e não bloqueia a conclusão daqui | Decisão do mantenedor na sessão de esclarecimentos, tomada à luz de T031 da feature 002, que travou por ambiente sem interface gráfica | 🟢 |
| Segurança | Nenhuma requisição de rede, nenhuma avaliação dinâmica de código e nenhum conteúdo de artefato interpretado como marcação | NG-02 da spec do componente e a política do documento herdada da feature 002 | 🟢 |
| Observabilidade | Toda rejeição e toda falha isolada produzem uma linha no canal de saída, pelo comando de log do protocolo | Tabela de erros do contrato do canal, última linha | 🟢 |
| Tamanho | Bundle da webview abaixo de 400 KB, já com os quatro conjuntos de cor do sistema de design podados | RNF-04 da spec do componente. No kit de origem os quatro conjuntos sem poda custaram 390 KB dos 400 KB, e é dessa medida que RF-24 nasce. Vale aqui como orçamento a respeitar; a verificação automática que interrompe o build pertence à feature 005 | 🟡 |

## 7. Critérios de Aceitação

```gherkin
Cenário: Retomador abre o painel num projeto com Reversa instalado
  Dado um repositório com Reversa instalado e nenhuma configuração prévia da extensão
  Quando o painel é aberto pela primeira vez
  Então o cabeçalho mostra projeto, versão, raiz observada e momento da leitura
  E as seções aparecem na ordem declarada, começando pelo ciclo forward
  E nenhum comando precisou ser executado antes

Cenário: Entrega concluída que ainda não convergiu
  Dado uma feature com todas as ações fechadas e sem adendo correspondente
  Quando o painel desenha a tela
  Então a faixa de bloqueio humano aparece acima de todas as seções
  E ela nomeia a convergência que falta
  E aponta o arquivo de ações dessa feature como alvo clicável
  E oferece o comando de convergência em bloco copiável

Cenário: Dúvidas em aberto contam como bloqueio
  Dado uma feature ativa cujo requirements tem três marcadores de dúvida
  Quando o painel desenha a tela
  Então a faixa lista uma razão nomeando a contagem de dúvidas
  E ela aponta o arquivo de requisitos dessa feature

Cenário: Migração com decisões pendentes nomeadas
  Dado um processo cuja migração aguarda decisão e lista duas decisões pendentes
  Quando o painel desenha a faixa de bloqueio
  Então cada decisão pendente aparece em linha própria, nomeada
  E a espera da migração aparece como razão distinta das duas

Cenário: Migração aguardando decisão humana
  Dado um processo cujo eixo de migração está marcado como aguardando decisão
  Quando o painel desenha a tela
  Então a faixa de bloqueio lista essa razão junto das demais, sem substituí-las

Cenário: Operador relê depois de rodar um agente
  Dado um painel já preenchido
  Quando o usuário aciona a releitura
  Então o cabeçalho indica que a leitura está em curso
  E o conteúdo anterior permanece visível até a nova carga chegar
  E o momento da leitura é atualizado quando ela chega

Cenário: Leitura degradada
  Dado um processo que chega com três anomalias
  Quando o painel desenha a tela
  Então o cabeçalho declara que a leitura degradou
  E a seção de anomalias lista as três com arquivo, código e detalhe
  E as demais seções seguem desenhadas com o que foi possível ler

Cenário: Leitura íntegra
  Dado um processo que chega sem anomalia, sem recusa e sem truncamento
  Quando o painel desenha a tela
  Então o cabeçalho declara que a leitura foi íntegra
  E a seção de anomalias declara que não houve nenhuma

Cenário: Workspace sem Reversa instalado
  Dado que o host informa o estado de entrada sem Reversa
  Quando o painel desenha a tela
  Então ela explica em duas frases o que o Reversa é
  E mostra o comando de instalação em bloco copiável
  E oferece a ação de verificar de novo

Cenário: Nenhuma pasta aberta no editor
  Dado que o host informa o estado de entrada sem pasta
  Quando o painel desenha a tela
  Então ela explica que o painel precisa de uma pasta aberta
  E não oferece ação alguma

Cenário: Falha capturada na leitura
  Dado que o host informa o estado de entrada de erro com uma mensagem
  Quando o painel desenha a tela
  Então ela declara que não foi possível ler
  E mostra a mensagem em bloco
  E oferece a ação de tentar de novo

Cenário: Estado vazio, Reversa recém-instalado
  Dado um processo sem fase iniciada e sem feature ativa
  Quando o painel desenha a tela
  Então as cinco fases aparecem como pendentes
  E o ciclo forward declara que não há feature ativa
  E nenhuma faixa de bloqueio aparece

Cenário: Navegação até o artefato
  Dado um painel que aponta o arquivo de ações da feature ativa
  Quando o usuário aciona o nome desse arquivo
  Então uma mensagem de abrir é enviada ao host com o caminho relativo à raiz observada
  E nenhum componente visual chamou a interface do host diretamente

Cenário: Arquivo apontado não existe mais
  Dado que o usuário acionou o nome de um arquivo removido do disco
  Quando o host responde com o aviso do protocolo
  Então o painel mostra o aviso nomeando o arquivo
  E o conteúdo da tela permanece o que era

Cenário: Troca de tema com o painel aberto
  Dado um painel com duas seções recolhidas
  Quando o usuário troca o tema do editor para alto contraste
  Então o painel repinta pela classe do corpo do documento
  E as duas seções continuam recolhidas
  E nenhuma releitura foi pedida ao host

Cenário: Estágio fora do vocabulário conhecido
  Dado um processo cujo estágio da feature não corresponde a nenhum rótulo conhecido
  Quando o painel desenha o ciclo forward
  Então o valor bruto é exibido entre crases com aviso de rótulo desconhecido
  E a renderização das demais seções não é afetada

Cenário: Preferência guardada com seção que não existe mais
  Dado um estado de webview que lista uma seção removida em versão anterior
  Quando o painel é desenhado
  Então o nome desconhecido é ignorado
  E as seções atuais abrem expandidas

Cenário: Falha de renderização de uma seção
  Dado um defeito que faz a seção de descoberta lançar durante a renderização
  Quando o painel é desenhado
  Então essa seção declara que falhou
  E as outras cinco permanecem visíveis
  E uma linha nomeando a seção é enviada ao canal de saída

Cenário: Muitas anomalias
  Dado um processo com quinze anomalias
  Quando o painel desenha a seção de anomalias
  Então as dez primeiras aparecem
  E a contagem total é exibida
  E um controle permite ver as restantes

Cenário: Mensagem do host que a webview não entende
  Dado um envelope cujo comando não pertence ao protocolo
  Quando ele chega à webview
  Então nada muda na tela
  E uma linha de log é enviada ao host nomeando o comando recebido

Cenário: Painel mais estreito que o mínimo
  Dado um painel arrastado para menos de 300 px de largura
  Quando o conteúdo é desenhado
  Então os elementos empilham
  E a faixa de bloqueio ocupa uma linha
  E não há rolagem horizontal

Cenário: Duas cargas de dados em sequência rápida
  Dado duas releituras acionadas em sequência
  Quando as duas cargas chegam
  Então a última prevalece
  E o momento da leitura exibido é o mais recente

Cenário: Checkpoint ainda em curso
  Dado uma descoberta com um checkpoint sem data de conclusão
  Quando o painel desenha a seção de descoberta
  Então esse checkpoint aparece como em andamento
  E os demais aparecem com a data em que concluíram

Cenário: Política de escrita no legado desligada
  Dado um processo cuja política recusa edição fora das pastas do Reversa
  Quando o painel desenha a seção de política
  Então ela declara que a edição do legado está desligada
  E lista as pastas em que o Reversa pode escrever

Cenário: Caminho recusado pela sonda
  Dado um processo cujo relatório traz um caminho recusado por escapar da raiz
  Quando o painel desenha o relatório da sonda
  Então o caminho aparece com o motivo da recusa
  E os arquivos truncados aparecem em lista própria

Cenário: Preferência de recolhimento sobrevive ao ciclo de visibilidade
  Dado um painel com a seção de descoberta recolhida pelo usuário
  Quando o painel é ocultado e reexibido
  Então a seção continua recolhida
  E nenhuma outra seção mudou de estado

Cenário: Primeira abertura, sem preferência guardada
  Dado um estado de webview vazio
  Quando o painel é desenhado
  Então o ciclo forward e a descoberta aparecem expandidos
  E a política, as anomalias e o relatório da sonda aparecem recolhidos
  E o título de cada seção recolhida mostra a contagem do que ela guarda

Cenário: Primeira abertura com leitura degradada
  Dado um estado de webview vazio e um processo que chega com três anomalias
  Quando o painel é desenhado
  Então a seção de anomalias aparece expandida
  E a política e o relatório da sonda seguem recolhidos
  E o cabeçalho declara que a leitura degradou

Cenário: Build produz as duas unidades
  Dado um clone limpo do repositório com as dependências instaladas
  Quando o comando de construção é executado
  Então a pasta de saída contém o host compilado e o bundle da webview
  E o bundle traz os tokens do sistema de design já podados
  E uma importação de módulo de plataforma dentro da webview falha na verificação de tipos

Cenário: Auditoria da forma do código da webview
  Dado o código-fonte da webview desta feature
  Quando ele é varrido por teste automatizado
  Então a decisão de estado de entrada, as razões de bloqueio, os rótulos e a ordem das seções estão em funções puras importáveis sem navegador
  E há exatamente uma chamada de envio e um registro de ouvinte, ambos no módulo único de mensagens
  E o cabeçalho declara o lugar nomeado e vazio da ação de despacho
  E o arquivo de corpo provisório da feature 002 não existe mais
  E o gerador de documento com política de segurança e nonce permanece
```

## 8. Prioridade MoSCoW

| Item | MoSCoW | Justificativa |
|------|--------|---------------|
| RF-01, RF-02 | Must | Sem estado nomeado e sem identidade no cabeçalho não há painel, apenas área em branco |
| RF-03, RF-03a | Must | É a resposta à terceira pergunta do Retomador, e o estado que nada hoje anuncia |
| RF-04, RF-05, RF-06 | Must | Os três eixos do núcleo que respondem onde o processo está |
| RF-07, RF-08, RF-09 | Must | O bloco de diagnóstico é o que impede o painel de mentir em silêncio, risco de maior impacto do PRD |
| RF-10, RF-16 | Must | A navegação é o passo final da jornada da persona primária, e o aviso é a metade dela que pode falhar |
| RF-11 | Must | Alto contraste é tema suportado, e paleta própria está fora do escopo por decisão |
| RF-13, RF-14, RF-17 | Must | São a forma do código que torna o resto verificável sem navegador |
| RF-18 | Must | O corpo provisório da feature 002 existe para ser substituído aqui |
| RF-19, RF-20 | Must | Sem isolamento e sem tolerância a comando desconhecido, um defeito apaga a tela inteira |
| RF-12 | Should | Conforto de leitura, dispensável na primeira instalação |
| RF-22 | Must | O padrão inicial é o que a persona primária vê na primeira abertura, antes de existir qualquer preferência |
| RF-23 | Must | Sem as duas unidades de compilação o painel não roda no editor, e a feature não seria verificável |
| RF-24 | Must | Sem a poda, os quatro conjuntos de cor consomem o orçamento inteiro e o painel não cabe no teto |
| RF-21 | Should | Só importa em processo já degradado em massa, situação rara |
| RF-15 | Could | Reserva de espaço para a evolução prevista, sem valor imediato |
| Cobertura de 100% nas funções de decisão | Must | Métrica declarada da spec, e a única defesa contra regra escondida em componente |
| Pintura abaixo de 100 ms | Should | Folga larga sobre o volume real de dados; medir custa mais que cumprir |
| Teto de 400 KB do bundle | Should | A verificação automática pertence à feature 005; aqui vale como orçamento de projeto |

## 9. Esclarecimentos

### Sessão 2026-09-09

- **Q:** Até onde vai a fronteira desta feature com a de empacotamento, dado que o painel precisa de
  compilação própria da webview e de empacotador para virar tela?
  **R:** Empacotamento mínimo aqui, ou seja, segunda configuração de compilador, empacotador e
  recursos estáticos, o bastante para o painel rodar no editor. Pacote instalável, teto de tamanho
  verificado, lista de exclusão e preview continuam com a feature 005. Registrado em RF-23.
- **Q:** A faixa de bloqueio deve sugerir o comando do Reversa em bloco copiável, apenas nomear a
  razão, ou nomear a razão e apontar o artefato relacionado?
  **R:** As duas coisas juntas, isto é, texto da razão, artefato clicável e comando copiável, sem
  que o painel o execute. Registrado em RF-03a.
- **Q:** Quais seções nascem recolhidas na primeira abertura, antes de existir preferência guardada?
  **R:** Só o bloco de núcleo nasce expandido. As três seções de diagnóstico, política, anomalias e
  relatório da sonda, nascem recolhidas, com a contagem visível no título. Registrado em RF-22.
- **Q:** Quais sinais do processo contam como razão de bloqueio humano na faixa do topo?
  **R:** Os quatro, com as decisões de migração nomeadas uma a uma, e não agregadas: entrega
  concluída sem adendo, migração aguardando decisão, cada decisão pendente da migração, e dúvidas
  remanescentes na feature ativa. Registrado em RF-03.
- **Q:** O que basta para dar esta feature por concluída, dado que a verificação visual da feature
  anterior travou por ambiente sem interface gráfica?
  **R:** A suíte automatizada verde encerra as ações desta feature. A verificação visual dos sete
  estados vira ação da feature 005, junto do preview. Registrado na tabela de requisitos não
  funcionais, na linha de portão de saída.

### Sessão 2026-09-09, revisão do cross-check

Quatro decisões tomadas sobre os achados de severidade alta de `audit/cross-check.md`.

- **Q:** A decisão D-02 do roadmap dispensa o sistema de design externo e tira cores e medidas
  diretamente das variáveis que o editor injeta, contra a seção 10 da spec do componente, que o
  lista como dependência obrigatória. Confirma a divergência?
  **R:** Não. A divergência é revertida e o sistema de design volta como dependência, com o podador
  de tokens que o kit de origem usa para caber no orçamento. Registrado em RF-24 e na linha de
  tamanho da tabela de requisitos não funcionais.
- **Q:** Em leitura degradada, a seção de anomalias deve nascer expandida, como a spec do componente
  desenha no sexto dos sete estados da tela, ou recolhida, como RF-22 dizia sem exceção?
  **R:** Expandida sempre que a leitura tiver degradado, e recolhida caso contrário. O esclarecimento
  anterior tratava da primeira abertura em leitura íntegra, e não deste caso. Registrado em RF-22 e
  no cenário de primeira abertura com leitura degradada.
- **Q:** RF-23 pedia a cópia dos recursos estáticos, mas não existe recurso estático a copiar nesta
  feature: o único que há é o ícone da barra de atividades, que o manifesto referencia da raiz do
  pacote e que a decisão D-14 mantém onde está. Como fechar?
  **R:** Estreitar RF-23, que passa a pedir a segunda unidade de compilação e o empacotamento do
  bundle. A cópia de recursos estáticos fica inteira com a feature 005, junto do resto de RF-03 da
  spec de empacotamento.
- **Q:** RF-16, RF-19 e RF-21 têm ação e suíte, mas nenhuma decisão registrada no roadmap. O que
  fazer com a lacuna de rastreabilidade?
  **R:** Acrescentar as três decisões ao roadmap na próxima execução de `/reversa-plan`. Nenhum
  requisito muda por causa disso, e nenhuma ação também.

## 10. Lacunas

Nenhuma lacuna aberta. As três dúvidas do documento inicial foram resolvidas na sessão de
esclarecimentos de 2026-09-09 e viraram requisito.

Pontos registrados por dependerem de decisão já tomada em outro documento:

- A biblioteca de interface e os tokens de tema estão fixados na seção 10 da spec do componente.
  A revisão de 2026-09-09 reabriu o ponto e o fechou do mesmo modo: os tokens ficam, e a poda de
  RF-24 é o que os faz caber.
- O congelamento do protocolo acontece com a primeira versão instalada, conforme a seção 9 do
  contrato do canal. Toda mudança que esta feature exigir no protocolo deve ser feita agora, e não
  depois.

Itens que esta feature transfere explicitamente para a feature 005, para que não se percam:

- Verificação automática do teto de tamanho do bundle, capaz de interromper a construção.
- Cópia dos recursos estáticos para a pasta de saída, junto do resto de RF-03 da spec de
  empacotamento.
- Lista de exclusão e geração do pacote instalável.
- Preview fora do editor e a captura dos sete estados da tela.

## 11. Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-09-09 | Versão inicial gerada por `/reversa-requirements` | reversa |
| 2026-09-09 | Cinco dúvidas resolvidas por `/reversa-clarify`; acrescentados RF-03a, RF-22 e RF-23, a linha de portão de saída e cinco cenários | reversa |
| 2026-09-09 | Revisão do `audit/cross-check.md` por `/reversa-clarify`: RF-22 ganha a exceção da leitura degradada, RF-23 estreitado, RF-24 acrescentado, RF-06 corrigido de sete para oito itens, cenário de preferência deixa de citar seção inexistente, um cenário novo | reversa |
