# Requirements: tela cheia do painel de linha de comando

> Identificador: `017-tela-cheia-do-painel`
> Data: `2026-09-21`
> Pasta da extração reversa: `_reversa_sdd/`
> Confidência: 🟢 CONFIRMADO, 🟡 INFERIDO, 🔴 LACUNA / DÚVIDA

## 1. Resumo executivo

A interface viva do painel de terminal, entregue pela 014 e vestida pela 016, já desenha na tela
alternativa do terminal, que é o segundo buffer que o emulador oferece a aplicações como `vim`, sem
histórico de rolagem e apagado ao sair, e a devolve nos quatro caminhos de saída. O que lhe falta,
medido contra o renderizador de tela cheia do produto de referência e contra o uso real, é o
**comportamento** de uma aplicação de tela cheia, e não a tela. O defeito que motivou o pedido é
visível: no iTerm2, rolar com o trackpad replica o quadro para cima, indefinidamente, porque cada
redesenho apaga a tela inteira e a reescreve. Esta feature elimina esse redesenho, acrescenta a
rolagem por página e por meia página, e absorve a rajada do redimensionamento como um evento só.
Serve ao Operador, que mantém a ferramenta aberta ao lado do agente por horas. Nenhum fato, frase,
ordem, contagem, cor ou moldura muda: a entrega é de mecânica de tela.

Sobre a premissa registrada ao fim da sessão anterior, de que o desenho acontecia no buffer
principal: ela **não se confirma**. `src/cli/terminal.ts` escreve `CSI ?1049h` ao entrar e
`CSI ?1049l` ao restaurar desde a 014 (CSI é o introdutor de sequência de controle, os dois bytes
`ESC [` com que começa toda sequência que o terminal obedece), esconde o cursor e é idempotente nos
dois sentidos. A feature parte dessa base e não a reescreve.

Três coisas ficaram deliberadamente fora, por decisão do usuário na sessão de esclarecimento de
2026-09-21: o rastreio de mouse, o desenho no buffer principal e qualquer rastro ao sair. Nenhuma
bandeira nem variável de ambiente nova entra.

## 2. Contexto a partir do legado

O projeto nasceu pelo caminho greenfield: não há `architecture.md`, `domain.md`, `inventory.md` nem
`code-analysis.md`, e tampouco `.reversa/principles.md`. O conhecimento vigente está no PRD, nas
cinco specs de `_reversa_sdd/sdd/` e nos adendos, todos sem linha de superação. O produto de
referência foi lido em duas fontes verificáveis: a documentação pública do modo de tela cheia e as
frases contidas no binário instalado nesta máquina, versão 2.1.278, que é o que o usuário vê todo
dia com `"tui": "fullscreen"` na configuração dele.

| Fonte | Trecho relevante | Confidência |
|-------|------------------|-------------|
| `_reversa_sdd/addenda/014-cli-do-processo.md#resumo-da-entrega` | A ferramenta devolve o terminal nos quatro caminhos de saída, inclusive na suspensão por `Ctrl+Z`; a interface viva desenha o mesmo estado da tela em texto, navegável pelo teclado | 🟢 |
| `_reversa_sdd/addenda/014-cli-do-processo.md#impacto-por-artefato-da-extracao` | A sequência de escape é confinada a `src/cli/terminal.ts`; o que o terminal escreveu por conta própria é o desenho: recorte, janela de rolagem e tradução da ênfase | 🟢 |
| `_reversa_sdd/addenda/014-cli-do-processo.md#o-que-o-texto-deliberadamente-nao-diz` | Sem dependência nova, sem estado entre execuções, sem caminho de arquivo do Reversa; `tests/cli-boundaries.spec.ts` confere por busca nos fontes | 🟢 |
| `_reversa_forward/014-cli-do-processo/interfaces/teclado.md#1-principio` | O teclado é o caminho completo; **não há mouse**. Tabela de teclas confirmada pelo usuário em 2026-09-20 por resposta escrita; `↑`/`↓` movem a seleção linha a linha, `g`/`G` vão ao topo e ao fim, e não há tecla de página | 🟢 |
| `_reversa_forward/014-cli-do-processo/interfaces/teclado.md#4-como-a-decisao-entra-no-codigo` | O reconhecimento dos bytes acontece em função pura, antes da máquina de navegação, que recebe a tecla já nomeada e devolve estado mais efeito nomeado | 🟢 |
| `_reversa_sdd/addenda/016-visual-do-painel-cli.md#impacto-por-artefato-da-extracao` | A linha de estado é escrita por posicionamento absoluto na última linha da janela; a janela útil desconta a linha de estado num lugar só, `alturaUtil()`; a seleção é um bloco de linhas e a rolagem o mantém inteiro; abaixo de 60 colunas as molduras somem e só elas | 🟢 |
| `_reversa_sdd/addenda/016-visual-do-painel-cli.md#o-que-o-texto-deliberadamente-nao-diz` | A fumaça em terminal real é passo humano; as amostras mostram o texto vestido, e não o que cada emulador faz com ele | 🟢 |
| `_reversa_sdd/addenda/016-visual-do-painel-cli.md#resumo-da-entrega` | A apresentação é decidida pelo ambiente, sem perguntar nada ao terminal; o primeiro byte escrito pelo laço é o do primeiro desenho | 🟢 |
| `_reversa_sdd/sdd/painel-do-processo.md#6-requisitos-funcionais` | RF-13: toda decisão de apresentação em função pura fora dos componentes visuais | 🟢 |
| `_reversa_sdd/sdd/painel-do-processo.md#7-requisitos-nao-funcionais` | RNF-03: status distinguível sem cor; o que vale para cor vale para qualquer recurso que o terminal possa não ter | 🟡 |
| `_reversa_sdd/prd.md#6-restricoes` | Zero dependência de tempo de execução e nenhuma escrita no projeto observado | 🟢 |
| `_reversa_sdd/personas.md#persona-2-o-operador` | Quem roda os agentes no terminal e confere se o estágio avançou | 🟢 |
| Documentação do produto de referência, `code.claude.com/docs/en/fullscreen.md` | O modo desenha na tela alternativa, como `vim` e `htop`; a caixa de entrada fica fixa na base; `PgUp`/`PgDn` rolam meia tela, `Ctrl+Home`/`Ctrl+End` vão às pontas, a roda rola algumas linhas; o rastreio de mouse tira a seleção nativa de texto, que passa a pedir `Shift`, `Option` ou `Fn` conforme o emulador; o repintar integral de toda célula é contorno para ConPTY, e não o padrão; tmux abaixo de 3.7, sem saída sincronizada, tremula mais; ao sair, nada fica no scrollback | 🟢 |
| Binário do produto de referência instalado, `~/.local/share/claude/versions/2.1.278`, lido por `strings` | Confirma as frases acima e acrescenta: "Scroll wheel is sending arrow keys", que é o reconhecimento de que os emuladores convertem a roda em setas na tela alternativa quando a aplicação não rastreia o mouse | 🟢 |

Estado de partida, medido nesta data sobre `src/cli/terminal.ts` e `src/cli/laco.ts`: a entrada na
interface viva liga o modo bruto, a tela alternativa e esconde o cursor; a restauração desfaz os
três, e é chamada da saída normal, da falha não prevista, de `SIGINT`, dos dois lados de `SIGTSTP` e
`SIGCONT`, e da dança de abertura do editor. Cada redesenho escreve `CSI 2J` mais `CSI H`, o corpo
inteiro e a linha de estado por posicionamento absoluto, numa única chamada de escrita, o que
significa que a tela é **apagada por inteiro** entre um quadro e outro a cada tecla, releitura e
redimensionamento. O redimensionamento é ouvido em `resize` do fluxo de saída e provoca um redesenho
por evento, sem agrupamento. A rolagem é a da seleção: `↑`/`↓` e `k`/`j` linha a linha, `Tab` por
seção, `g`/`G` às pontas; não há tecla de página nem de meia página. Nenhum modo de mouse é ligado, e
nada é escrito no buffer principal ao sair.

Sintoma relatado pelo usuário em 2026-09-21, no iTerm2 3.7.2, com a roda do trackpad: **a rolagem é
infinita e replica as telas para cima**. Reprodução parcial feita na mesma data num pseudoterminal
de 80 colunas por 24 linhas, com os bytes capturados: a ferramenta entra na tela alternativa, escreve
23 linhas de exatamente 80 colunas e a linha de estado na 24ª, sem transbordo de largura nem de
altura; o que ela escreve está correto, e o sintoma nasce de como o emulador trata o apagamento de
tela inteira repetido em rajada, que é o que a roda do trackpad produz ao virar setas. As duas
preferências do iTerm2 que explicariam o sintoma por configuração, guardar no histórico as linhas da
tela alternativa e desabilitar a tela alternativa, estão no valor padrão nesta máquina. O mecanismo
exato fica para a investigação do plano, a reproduzir com o trackpad no iTerm2; a correção não
depende dele, porque o RF-07 retira o apagamento de tela inteira em qualquer caso.

## 3. Personas e cenários de uso

| Persona | Objetivo | Cenário-chave |
|---------|----------|---------------|
| O Operador (primária) 🟢 | Ler o processo numa divisão da janela ao lado do agente, sem que o quadro pisque nem se replique a cada mudança | Ele rola com o trackpad no iTerm2 e a janela se move; rolar para cima no terminal não revela cópia alguma de quadro anterior |
| O Retomador 🟢 | Percorrer um quadro longo em segundos para achar onde o projeto parou | Com a decomposição aberta em dezenas de ações, ele desce por página com `PgDn`, e não linha a linha |
| O Operador remoto 🟡 | Usar a ferramenta num terminal que não escolheu, por `ssh` ou dentro de `tmux` | O emulador não tem saída sincronizada; a ferramenta desenha sem apagar a tela, e o quadro não pisca nem se replica |
| O script 🟢 | Consumir a saída sem pessoa diante da tela | O comando encadeado de ontem produz hoje os mesmos bytes; nada desta feature o alcança |

## 4. Regras de negócio novas ou alteradas

1. **RN-01:** A tela cheia é mecânica da interface viva, e só dela. A passada, a saída de dados e os
   códigos de saída permanecem idênticos byte a byte, e as amostras versionadas de `amostras/painel/`
   não mudam, com uma exceção nomeada: `ajuda.txt`, que transcreve a tabela de ajuda e ganha as duas
   linhas do RF-06. Fora ela, o que muda é como o quadro chega ao terminal, e não o quadro. 🟢
   - Origem no legado: RN-06 da 016 e `_reversa_sdd/addenda/014-cli-do-processo.md#resumo-da-entrega`
   - Tipo: nova, reafirmando regra vigente
2. **RN-02:** Tudo o que a ferramenta liga no terminal ela desliga, na ordem inversa, em todo caminho
   de saída. A regra da 014, devolver o terminal como foi encontrado, passa a cobrir o modo que esta
   feature acrescenta, a saída sincronizada, que precisa estar fechada em toda restauração para o
   caso de saída no meio de um desenho. A restauração continua idempotente e presa aos mesmos
   caminhos: saída normal, falha não prevista, interrupção, suspensão e retomada, e a dança do
   editor. 🟢
   - Origem no legado: RN-08 da 014 e `_reversa_sdd/addenda/014-cli-do-processo.md#resumo-da-entrega`
   - Tipo: alterada, por ampliação do que se restaura
3. **RN-03:** A seleção é o único foco, e a janela nunca se separa dela. Rolar, por tecla ou pela
   roda que o emulador converte em setas, é mover a seleção; a janela segue a seleção como já segue
   hoje, mantendo o bloco do item inteiro. Não existe estado de "janela rolada sem seleção", que
   obrigaria a decidir o que a próxima seta faz. Confirmada pelo usuário em 2026-09-21. 🟢
   - Origem no legado: D-19 da 016, `_reversa_sdd/addenda/016-visual-do-painel-cli.md#impacto-por-artefato-da-extracao`, linha da navegação e rolagem
   - Tipo: nova, generalizando regra vigente
4. **RN-04:** O teclado continua o caminho completo, e continua não havendo mouse. A roda funciona
   pela conversão em setas que os emuladores fazem na tela alternativa quando a aplicação não
   rastreia o mouse, e a ferramenta não a rastreia, para que a seleção nativa de texto continue
   funcionando sem tecla modificadora. Decisão do usuário em 2026-09-21, reafirmando o contrato da
   014. 🟢
   - Origem no legado: `_reversa_forward/014-cli-do-processo/interfaces/teclado.md#1-principio` e RNF-03 de `_reversa_sdd/sdd/painel-do-processo.md#7-requisitos-nao-funcionais`
   - Tipo: nova, reafirmando regra vigente
5. **RN-05:** A sequência de escape continua confinada a `src/cli/terminal.ts`, e o reconhecimento
   do que o terminal envia continua em função pura em `src/cli/teclas.ts`; as teclas de página e de
   meia página são reconhecidas ali e viram tecla nomeada antes de tocar a máquina de navegação. 🟢
   - Origem no legado: `_reversa_forward/014-cli-do-processo/interfaces/teclado.md#4-como-a-decisao-entra-no-codigo` e D-05 da 014
   - Tipo: nova, reafirmando regra vigente
6. **RN-06:** Nenhuma bandeira nem variável de ambiente entra por esta feature, e a apresentação
   continua decidida pelo ambiente declarado, sem pergunta ao terminal; o primeiro byte escrito pelo
   laço continua sendo o do primeiro desenho. A saída sincronizada é emitida sempre, porque o
   emulador que não a conhece a ignora, e a tela alternativa continua sendo o único regime de
   desenho da interface viva. 🟢
   - Origem no legado: RF-20 e D-07 da 016
   - Tipo: nova, reafirmando regra vigente
7. **RN-07:** Nenhuma dependência de tempo de execução é acrescentada, e nenhum estado sobrevive
   entre execuções. 🟢
   - Origem no legado: RN-08 da 016, RN-05 da 014, `_reversa_sdd/prd.md#6-restricoes`
   - Tipo: nova, reafirmando regra vigente
8. **RN-08:** A referência é inspiração, e não imitação de identidade. O produto de referência pode
   ser nomeado nos documentos da feature, e não em `src/cli/`, onde a guarda dos nomes vigiados de
   `tests/cli-boundaries.spec.ts` continua valendo. 🟢
   - Origem no legado: RN-07 da 016
   - Tipo: nova, reafirmando regra vigente

## 5. Requisitos Funcionais

### Rolagem

| ID | Requisito | Prioridade | Critério de aceite | Confidência |
|----|-----------|------------|--------------------|-------------|
| RF-01 | O sistema deve reconhecer `PgDn` e `PgUp` e mover a seleção uma janela útil abaixo ou acima, presa à última e à primeira linha navegável, com a janela seguindo a seleção | Must | Num quadro de três janelas de altura, três `PgDn` chegam ao fim e o quarto não muda nada; sem linha navegável, nada muda; a posição na linha de estado acompanha; `Tab`, `g`, `G` e as setas continuam com o efeito de hoje | 🟢 |
| RF-02 | O sistema deve reconhecer `Ctrl+D` e `Ctrl+U` como meia janela abaixo e acima, na mesma mecânica do RF-01 | Should | Dois `Ctrl+D` equivalem a um `PgDn` quando a altura útil é par; nenhum dos dois sai da ferramenta nem suspende | 🟡 |
| RF-06 | O sistema deve listar no painel de ajuda as teclas de página e de meia página, e o contrato `interfaces/teclado.md` desta feature deve registrar o acréscimo e reafirmar que não há mouse | Must | A ajuda enumera cada tecla nova com a promessa dela; uma suíte confere, sobre `TABELA_DE_AJUDA`, as quatro teclas com a promessa de cada uma e a ausência da palavra "mouse"; a amostra `amostras/painel/ajuda.txt` é regenerada com as duas linhas novas e a moldura íntegra | 🟢 |

RF-03, RF-04 e RF-05 (roda por rastreio de mouse, ligar e desligar o rastreio, clique) foram
retirados na sessão de esclarecimento de 2026-09-21, com a decisão de não haver mouse. Os
identificadores não são reutilizados.

### Desenho

| ID | Requisito | Prioridade | Critério de aceite | Confidência |
|----|-----------|------------|--------------------|-------------|
| RF-07 | O sistema deve redesenhar sem apagar a tela: posiciona o cursor no canto, escreve cada linha visível apagando o resto dela, apaga o que sobra abaixo do corpo, e escreve a linha de estado; a sequência de um redesenho não contém o apagamento de tela inteira | Must | O texto escrito num redesenho, retiradas as sequências, é o mesmo de hoje; a sequência não contém `2J`; o quadro mais curto que a janela não deixa resíduo do quadro anterior abaixo dele; no iTerm2 3.7.2, rolar com o trackpad em rajada não replica quadro algum para cima, conferido em terminal real como passo humano | 🟢 |
| RF-08 | O sistema deve envolver cada redesenho em atualização sincronizada, abrindo o modo antes da primeira escrita do quadro e fechando depois da última, para que o emulador que o suporta troque o quadro de uma vez | Must | Cada redesenho começa pela abertura e termina pelo fechamento do modo; o modo é fechado também na restauração, para o caso de saída no meio de um desenho; num emulador sem o modo, as duas sequências são inertes e o RF-07 responde sozinho pela ausência de tela apagada | 🟢 |
| RF-09 | O sistema deve tratar a rajada de eventos de redimensionamento como um evento só, redesenhando uma vez com as dimensões mais recentes, e manter a seleção visível e o bloco dela inteiro quando a janela encolhe | Must | Dez eventos de redimensionamento no mesmo giro produzem um redesenho; a janela mais baixa que o bloco selecionado mostra ao menos a linha principal dele; abaixo de 60 colunas as molduras somem e voltam ao crescer, como hoje | 🟢 |
| RF-10 | O sistema deve, ao retomar da suspensão e ao voltar do editor, redesenhar por inteiro pelo mesmo caminho do RF-07, sem depender do que ficou na tela | Must | O redesenho após `SIGCONT` e após o editor é integral e sincronizado, porque passa pelo mesmo `desenhar` do RF-07 e o laço não muda; a dança do editor conserva a ordem restaurar, agir, entrar, desenhar. Não há suíte de sinais: a ordem e a retomada são conferidas em terminal real pelo `onboarding.md` §5 | 🟢 |

### Contrato de máquina

| ID | Requisito | Prioridade | Critério de aceite | Confidência |
|----|-----------|------------|--------------------|-------------|
| RF-16 | O sistema deve manter a passada, a saída de dados, o texto de uso e as amostras versionadas intocados, com uma exceção nomeada: `amostras/painel/ajuda.txt`, que ganha as duas linhas do RF-06 | Must | `tests/cli-passada.spec.ts`, `tests/cli-amostras.spec.ts`, a suíte de uso e a suíte de dados passam sem linha alterada; `amostras/painel/` não muda fora de `ajuda.txt`, e nele a diferença se limita às duas linhas novas | 🟢 |

RF-11 e RF-12 (bandeira e variável de tela, desenho no buffer principal e `TERM=dumb`), RF-13
(bandeira e variável de mouse), RF-14 (texto de uso com as bandeiras novas) e RF-15 (rastro ao sair)
foram retirados na sessão de esclarecimento de 2026-09-21. Os identificadores não são reutilizados.

## 6. Requisitos Não Funcionais

| Tipo | Requisito | Evidência ou justificativa | Confidência |
|------|-----------|----------------------------|-------------|
| Desempenho | Um redesenho de quadro de 500 linhas, do pedido à sequência pronta para escrever, leva menos de 50 ms, e a sequência de um redesenho comum, com o quadro clipado à janela, é uma única chamada de escrita | Piso herdado da 016, que mede a composição; a escrita única é o que faz a atualização sincronizada valer também onde o modo não existe | 🟢 |
| Desempenho | A rajada de redimensionamento não produz mais de um redesenho por giro do laço de eventos | RF-09; no macOS o arrasto da janela emite dezenas de eventos por segundo | 🟢 |
| Desempenho | A rajada de setas que a roda do trackpad produz é absorvida sem perda de tecla e sem replicação de quadro; cada seta reconhecida produz no máximo um redesenho | RF-07; o sintoma relatado nasce exatamente dessa rajada | 🟢 |
| Segurança | Nenhuma sequência de escape fora de `src/cli/terminal.ts`; nenhum valor de cor fora de `src/cli/paleta.ts`; nenhum nome vigiado em `src/cli/`; a higiene de texto da 016 continua valendo para todo texto vindo do disco | Guardas de `tests/cli-boundaries.spec.ts`, mantidas | 🟢 |
| Compatibilidade | A ferramenta funciona inteira, com as mesmas teclas, em iTerm2, Terminal.app, terminal integrado do VS Code, kitty, `tmux` e por `ssh`; a saída sincronizada é acréscimo cuja falta não retira função; o iTerm2 3.7.2 é o emulador de referência da fumaça, por ser onde o sintoma foi visto | RN-04, RN-06; a documentação da referência registra os mesmos limites em tmux antigo | 🟡 |
| Acessibilidade | Nada depende do mouse, e a seleção nativa de texto do emulador continua funcionando sem tecla modificadora | RN-04; a referência documenta que o rastreio a tira | 🟢 |
| Testabilidade | O terminal falso das suítes captura a sequência escrita, e as asserções desta feature são sobre ordem e conteúdo dessa sequência; o reconhecedor das teclas novas é testado como função pura sobre bytes | Molde de `tests/cli-terminal.spec.ts` e `tests/cli-teclas.spec.ts` | 🟢 |
| Observabilidade | Nada novo é registrado | Não há aviso nem bandeira nova | 🟢 |

## 7. Critérios de Aceitação

```gherkin
Cenário: página abaixo num quadro longo
  Dado um quadro com cem linhas navegáveis e uma janela útil de vinte linhas
  E a seleção na primeira linha navegável
  Quando o usuário tecla PgDn
  Então a seleção vai para a vigésima primeira linha navegável
  E a janela mostra o bloco dela inteiro
  E a linha de estado declara a posição nova

Cenário: página abaixo no fim
  Dado a seleção na última linha navegável
  Quando o usuário tecla PgDn
  Então nada muda, e nenhum redesenho é escrito além do de hoje para tecla sem efeito

Cenário: página sem linha navegável
  Dado um quadro sem linha navegável
  Quando o usuário tecla PgDn ou PgUp
  Então nada muda

Cenário: meia página
  Dado uma janela útil de vinte linhas e a seleção na primeira linha navegável
  Quando o usuário tecla Ctrl+D duas vezes
  Então a seleção está onde um PgDn a deixaria
  E a ferramenta não saiu nem suspendeu

Cenário: roda do trackpad no iTerm2
  Dado a interface viva no iTerm2, que converte a roda em setas na tela alternativa
  Quando o usuário rola com o trackpad em rajada
  Então a seleção desce e a janela a segue
  E rolar para cima no terminal não revela cópia de quadro anterior

Cenário: redesenho sem apagamento de tela
  Dado um quadro desenhado
  Quando o usuário tecla ↓
  Então a sequência escrita abre a atualização sincronizada, posiciona no canto,
       escreve cada linha visível apagando o resto dela, apaga abaixo do corpo,
       escreve a linha de estado e fecha a atualização sincronizada
  E a sequência não contém o apagamento de tela inteira

Cenário: rajada de redimensionamento
  Dado a interface viva aberta
  Quando o fluxo de saída emite dez eventos de redimensionamento no mesmo giro
  Então um único redesenho é escrito, com as dimensões do último evento
  E a seleção continua visível

Cenário: interrupção no meio de um desenho
  Dado a interface viva na tela alternativa
  Quando chega SIGINT
  Então a sequência de restauração fecha a atualização sincronizada,
       mostra o cursor e deixa a tela alternativa, nessa ordem
  E o modo bruto é desligado depois
  E nada é escrito no buffer principal

Cenário: retomada da suspensão
  Dado a interface viva suspensa por Ctrl+Z, com o terminal devolvido
  Quando chega SIGCONT
  Então a ferramenta entra de novo
  E redesenha por inteiro, sincronizado, sem apagamento de tela inteira

Cenário: ajuda com as teclas novas
  Dado a interface viva aberta
  Quando o usuário tecla ?
  Então o painel de ajuda lista PgUp, PgDn, Ctrl+U e Ctrl+D com a promessa de cada um
  E não menciona mouse

Cenário: passada intocada
  Dado a saída redirecionada para arquivo
  Quando a ferramenta roda sem bandeira de modo
  Então os bytes escritos são idênticos aos de antes desta feature
  E nenhuma sequência de tela ou sincronização aparece
```

## 8. Prioridade MoSCoW

| Item | MoSCoW | Justificativa |
|------|--------|---------------|
| RF-07, RF-08, RF-10 | Must | O apagamento de tela inteira a cada redesenho é a causa do sintoma relatado, a replicação do quadro no iTerm2 ao rolar com o trackpad, e é o defeito visível a cada tecla e a cada releitura pela observação |
| RF-01, RF-06 | Must | Rolar por página é a função de tela cheia que o teclado ainda não tem, e a ajuda é o contrato do teclado |
| RF-09 | Must | O redimensionamento já é ouvido; agrupar a rajada e garantir a seleção visível fecha o comportamento |
| RF-16 | Must | Garantia de que a passada, os dados, o uso e as amostras não se movem, salvo a da ajuda, que transcreve conteúdo |
| RF-02 | Should | Meia página é hábito de paginador e sai barato sobre o RF-01 |
| RNF de desempenho | Should | Pisos herdados da 016, ampliados à escrita e à rajada de setas |

## 9. Esclarecimentos

### Sessão 2026-09-21

Rodada conduzida no chat, por escolha explícita do usuário ("Sem perguntas e respostas"), e não pelo
formulário escrito.

- **Q:** Ao usar o painel hoje, qual lacuna em relação ao modo de tela cheia da referência você
  percebe de fato, e que deve ser o Must desta feature?
  **R:** "A rolagem é infinita e fica replicando as telas para cima." Complementares: o emulador é o
  iTerm2 (3.7.2 nesta máquina) e o gesto é a roda do trackpad. Aplicado no resumo executivo, no
  estado de partida da seção 2, no cenário-chave do Operador, no critério do RF-07, no RNF de
  desempenho da rajada de setas e no cenário "roda do trackpad no iTerm2".
- **Q:** Mouse: rastreio ligado por padrão, desligado por padrão, nenhum mouse, ou só a roda?
  **R:** Nenhum mouse (opção c), seguindo a recomendação da sessão: a roda já funciona pela conversão
  em setas do emulador, e o rastreio custaria a seleção nativa de texto. Aplicado na RN-04; RF-03,
  RF-04, RF-05 e RF-13 retirados; RNF de acessibilidade ajustado.
- **Q:** Rastro ao sair: nada, o quadro final, uma linha de resumo, ou o quadro por bandeira?
  **R:** Nada, como hoje e como a referência (opção a). RF-15 retirado.
- **Q:** Semântica da rolagem: rolar é mover a seleção, rolagem livre da janela, ou misto?
  **R:** Rolar é mover a seleção (opção a). RN-03 confirmada, de 🟡 para 🟢.
- **Q:** Buffer principal (bandeira `--tela=`, variável e `TERM=dumb`): entram como Should, só
  `TERM=dumb`, ou ficam fora?
  **R:** Ficam fora (opção c). RF-11, RF-12 e RF-14 retirados; RN-06 reescrita para dizer que
  nenhuma bandeira nem variável entra e que a tela alternativa é o único regime.

## 10. Lacunas

Nenhuma dúvida aberta. Pendências registradas sem peso de requisito, para o dia em que fizerem
falta:

- Rastreio de mouse (roda com passo próprio e clique para selecionar), recusado em 2026-09-21 pelo
  custo à seleção nativa de texto; voltaria com bandeira para ligar e desligar.
- Desenho no buffer principal para emulador sem tela alternativa, recusado em 2026-09-21 por não
  haver quem o use; o `TERM=dumb` continua caindo na tela alternativa, que o emulador ignora ou não.
- O mecanismo exato pelo qual o iTerm2 3.7.2 replica o quadro diante do `2J` em rajada não foi
  determinado; a investigação do plano o reproduz com o trackpad, e a correção do RF-07 vale
  independentemente do achado.

## 11. Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-09-21 | Versão inicial gerada por `/reversa-requirements`, a partir do pedido "painel de terminal em modo de tela cheia, à maneira do Claude Code: buffer alternativo, restauração do terminal em toda saída e redimensionamento", com a premissa do buffer alternativo corrigida pela leitura de `src/cli/terminal.ts` | reversa |
| 2026-09-21 | Sessão de esclarecimento por `/reversa-clarify`, no chat: sintoma do iTerm2 com o trackpad registrado como Must; mouse, buffer principal e rastro ao sair retirados; RN-03 confirmada; os três marcadores de dúvida resolvidos | reversa |
| 2026-09-21 | Citação literal do marcador de dúvida retirada do histórico, por exigência da guarda do bug 74UL (`tests/forward-marcador-de-duvida-citado.spec.ts`), durante o `/reversa-coding` | reversa |
| 2026-09-21 | Edição manual após o `audit/cross-check.md`, por decisão do usuário no chat: A001, RN-01 e RF-16 admitem a diferença em `amostras/painel/ajuda.txt`; A002, o critério do RF-06 nomeia a suíte sobre `TABELA_DE_AJUDA`; A003, o critério do RF-10 declara a cobertura pelo `onboarding.md` §5 | usuário, via reversa |
