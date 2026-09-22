<!--
Template de corpo do actions.md
Carregado por /reversa-to-do e atualizado por /reversa-coding.

REGRAS DE PREENCHIMENTO:
- IDs estáveis: T001, T002, ..., zero-padded três dígitos. Nunca recicle.
- Marcador de paralelismo é [//] no início da linha de ID. Tarefas [//] não compartilham arquivo alvo.
- Coluna "Dependências" lista IDs separados por vírgula. Ações sem dependência usam "-".
- Status inicial é [ ]. /reversa-coding muda para [X] ao concluir.
- /reversa-add acrescenta uma seção "## Emendas" ao final, com o mesmo formato de tabela, IDs E001, E002, ... e status já [X].
- Toda ação precisa ser ATÔMICA: cabe num turno do agente, sem precisar de feedback humano no meio.
-->

# Actions: tela cheia do painel de linha de comando

> Identificador: `017-tela-cheia-do-painel`
> Data: `2026-09-21`
> Roadmap: `_reversa_forward/017-tela-cheia-do-painel/roadmap.md`

## Resumo

| Métrica | Valor |
|---------|-------|
| Total de ações | 24 |
| Paralelizáveis (`[//]`) | 11 |
| Maior cadeia de dependência | 6 |

A feature toca seis módulos de `src/cli/` e quatro suítes, e nenhum arquivo fora disso além da
amostra da ajuda e do README. As ações seguem a divisão do roadmap: o vocabulário entra primeiro e só
por acréscimo; as suítes que mudam de expectativa são reescritas antes do código que as satisfaz, com
a mudança declarada como de disposição, no molde da 016 (D-10); o núcleo tem três frentes independentes,
o reconhecedor, a máquina com o compositor e o terminal, que só se encontram na verificação da fase 4.

A cadeia mais longa é `T001 → T012 → T013 → T020 → T021 → T023`, seis elos: do vocabulário à página na
máquina, daí à amostra da ajuda, que só se regenera com a unidade inteira compilando, daí à
verificação do contrato de máquina e ao README. A largura está nas suítes da fase 2 e nas três
frentes do núcleo.

**Um ponto de ordem que decide a compilação.** `navegar()` em `src/cli/navegacao.ts` é um `switch`
exaustivo sobre `TeclaNomeada` sem `default`. Entre a T001, que acrescenta os quatro nomes à união, e
a T013, que acrescenta os quatro `case`, a unidade de terminal **não compila** (`tsc` acusa função sem
retorno em todo caminho). As duas devem ser executadas em sequência curta, e nenhuma ação que rode
`npm run compile:cli` ou `npm run amostras:painel` pode ficar entre elas; é por isso que a T020 depende
da T013 e não só da T019.

**A amostra da ajuda muda, e é a única.** `amostras/painel/ajuda.txt` é amostra versionada que
transcreve `TABELA_DE_AJUDA`, e `tests/cli-amostras.spec.ts` compara o gerado com o gravado arquivo a
arquivo. A D-09 acrescenta duas linhas à tabela, e por isso a T020 regenera a amostra. A inconsistência
que a versão inicial deste documento levou à auditoria (A001 do `audit/cross-check.md`) foi resolvida
pelo usuário em 2026-09-21 admitindo a diferença: a RN-01, o RF-16, a D-09, o critério de pronto, o
`data-delta.md` e o `onboarding.md` nomeiam `ajuda.txt` como exceção. Da mesma auditoria vieram a T024,
que confere o conteúdo da tabela de ajuda por suíte (A002), e a menção ao RF-10 na T016 (A003).

A fumaça em terminal de verdade é o `onboarding.md`, que é passo humano e não ação; o achado da D-11
(o estado das caixas do iTerm2, o defeito reproduzido ou não na construção anterior, o resultado sobre
a nova e os emuladores em que algo falhou) vai para as notas de execução deste arquivo, como o
roadmap pede, e é o que o critério de pronto confere.

## Fase 1, Preparação

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T001 | Acrescentar a `TECLAS`, depois de `fim` e **sem remover nada**, os quatro nomes `pagina-acima`, `pagina-abaixo`, `meia-pagina-acima` e `meia-pagina-abaixo`, e trocar "quinze" por "dezenove" no comentário de `TeclaNomeada`; `EFEITOS` não muda (D-05, `data-delta.md` seção 2). Até a T013 a unidade não compila, pelo `switch` exaustivo de `navegar` | - | `[//]` | `src/cli/tipos.ts` | 🟢 | `[X]` |
| T002 | Acrescentar a `ContextoDeNavegacao` o campo **opcional** `linhas`, `ReadonlyMap<SecaoDoTerminal, { titulo: number; itens: readonly number[] }>`, a linha do título e a linha principal de cada item no quadro inteiro, com a doc dizendo que seção fechada tem `itens: []` e que, ausente o mapa, a página anda por posições (D-07, `data-delta.md` seção 3) | - | `[//]` | `src/cli/navegacao.ts` | 🟢 | `[X]` |

## Fase 2, Testes

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T003 | Acrescentar os casos das teclas novas: `ESC [ 5 ~` é `pagina-acima`, `ESC [ 6 ~` é `pagina-abaixo`, `0x15` é `meia-pagina-acima`, `0x04` é `meia-pagina-abaixo`; `ESC [ 1 ~`, `2 ~`, `3 ~` e `4 ~` não viram tecla alguma; as sequências terminadas em letra continuam como antes (D-05, D-06, `interfaces/teclado.md` seções 2 e 3) | T001 | `[//]` | `tests/cli-teclas.spec.ts` | 🟢 | `[X]` |
| T004 | Acrescentar a descrição da página **por posições**, com o contexto sem `linhas`: `pagina-abaixo` avança `alturaVisivel` posições e para na última; `pagina-acima` é simétrica e para na primeira; `primeiraLinhaVisivel` avança e recua uma altura visível, presa ao fundo e ao topo; num quadro de três janelas, três `pagina-abaixo` chegam ao fim e o quarto não muda nada; sem posição navegável, nada muda (RF-01, D-07, D-08, RN-03) | T001, T002 | `[//]` | `tests/cli-navegacao.spec.ts` | 🟢 | `[X]` |
| T005 | Acrescentar a descrição da página **pelo mapa `linhas`**: com um item que ocupa duas linhas, o alvo é a primeira posição cuja linha é maior ou igual à corrente mais a altura visível, e não a posição a `alturaVisivel` de distância; a meia página usa metade da altura; dois `meia-pagina-abaixo` deixam a seleção onde um `pagina-abaixo` deixaria quando a altura é par; com seções fechadas (`itens: []`) a página anda pelos títulos (RF-02, D-07) | T004 | - | `tests/cli-navegacao.spec.ts` | 🟢 | `[X]` |
| T006 | Incluir as quatro teclas novas na lista do caso "toda tecla de movimento emite `nenhum`" (D-05, `interfaces/teclado.md` seção 2) | T005 | - | `tests/cli-navegacao.spec.ts` | 🟢 | `[X]` |
| T007 | Acrescentar a descrição de `contextoDeNavegacao().linhas`: toda seção de `secoes` tem entrada, seção fechada tem `itens: []`, e a invariante: para o estado corrente, a linha da seleção no mapa (o título, ou o item selecionado, inclusive um com dado secundário) é igual a `indiceDaSelecao()` (D-07, `data-delta.md` seção 3) | T002 | `[//]` | `tests/cli-quadro.spec.ts` | 🟢 | `[X]` |
| T008 | Reescrever o bloco "o desenho", declarando no cabeçalho do arquivo e em cada caso a mudança de disposição: a sequência de um redesenho não contém `2J`; começa por `CSI ?2026h` e `CSI H`; cada linha vem precedida de `CSI 2K`; as linhas se separam por `\r\n`, sem `\r\n` após a última; `CSI J` vem depois do corpo; a linha de estado vem por `CSI <altura>;1H` seguido de `CSI 2K`; tudo termina por `CSI ?2026l` e sai numa única escrita; retiradas as sequências, o texto é o de hoje (RF-07, RF-08, D-01, D-02, D-03, D-10) | - | `[//]` | `tests/cli-terminal.spec.ts` | 🟢 | `[X]` |
| T009 | Ajustar os casos de entrada e restauração: o primeiro byte depois de `entrar` é o de `CSI ?2026h`; `restaurar` escreve `CSI ?2026l` antes de mostrar o cursor e deixar a tela alternativa, e continua idempotente; o caso de "nenhuma consulta" continua valendo com as sequências novas (RN-02, RN-06, D-03) | T008 | - | `tests/cli-terminal.spec.ts` | 🟢 | `[X]` |
| T010 | Acrescentar a rajada, estendendo a dupla de mentira para guardar e disparar o ouvinte de `resize`: dez emissões no mesmo giro produzem uma chamada ao ouvinte depois de esperar um `setImmediate`; cancelar a assinatura antes do giro produz nenhuma; emissões em dois giros produzem duas (RF-09, D-04) | T009 | - | `tests/cli-terminal.spec.ts` | 🟢 | `[X]` |
| T024 | Acrescentar a descrição da tabela de ajuda: `TABELA_DE_AJUDA` contém, depois de `g / G`, as linhas `PgUp / PgDn` e `Ctrl+U / Ctrl+D` com a promessa de cada uma, tal como em `interfaces/teclado.md` seção 2; nenhuma linha da tabela nem o texto de `painelDeAjuda` contém a palavra "mouse"; toda tecla de movimento nomeada em `TECLAS` tem linha na tabela (RF-06, D-09, `interfaces/teclado.md` seção 5) | T001, T007 | - | `tests/cli-quadro.spec.ts` | 🟢 | `[X]` |

## Fase 3, Núcleo

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T011 | Reconhecer as teclas novas: `CONTROLES` ganha `0x15` e `0x04`; uma tabela própria mapeia o número das sequências terminadas em `~` (`5` e `6`) e qualquer outro número devolve nulo; a sequência terminada em letra continua pelo último byte; o cabeçalho do módulo passa a explicar o til (D-05, D-06, RN-05) | T001 | `[//]` | `src/cli/teclas.ts` | 🟢 | `[X]` |
| T012 | Criar a função pura que decide o alvo da página: dado a lista de posições, o índice corrente e o salto em linhas, com o mapa `linhas` o alvo é a primeira posição cuja linha é maior ou igual à corrente mais o salto (ou a última) para baixo, e a última posição cuja linha é menor ou igual à corrente menos o salto (ou a primeira) para cima; sem o mapa, o índice mais ou menos o salto, preso às pontas (D-07) | T001, T002 | - | `src/cli/navegacao.ts` | 🟢 | `[X]` |
| T013 | Criar `paginar` e os quatro `case` em `navegar`: o salto é `alturaVisivel` para a página e a metade inteira dela, nunca menor que um, para a meia página; a seleção vai ao alvo da T012; `primeiraLinhaVisivel` avança ou recua o salto, preso a zero e a `fundo(contexto)`, na mesma transição; lista vazia devolve o estado; o efeito é `nenhum` (D-08, RN-03, `interfaces/teclado.md` seção 2) | T012 | - | `src/cli/navegacao.ts` | 🟢 | `[X]` |
| T014 | Fazer `linhasDaSecao` anotar, na `Montagem` que devolve, a linha do título e a linha principal de cada item, relativas ao começo da seção, e `[]` de itens quando a seção está fechada, junto da seleção que já anota (D-07) | - | `[//]` | `src/cli/quadro/index.ts` | 🟢 | `[X]` |
| T015 | Fazer `montar` acumular o mapa das seções com o deslocamento de cada uma, e `contextoDeNavegacao()` devolver `linhas` a partir dessa montagem, omitindo o campo quando a ajuda está visível, de modo que a linha da seleção no mapa coincida sempre com `indiceDaSelecao()` (D-07, `data-delta.md` seção 3) | T014, T002 | - | `src/cli/quadro/index.ts` | 🟢 | `[X]` |
| T016 | Trocar o redesenho: declarar `SINCRONIZAR`, `DESSINCRONIZAR`, `CANTO`, `APAGAR_LINHA` e `APAGAR_ABAIXO`, remover `LIMPAR`, e fazer `desenhar` escrever, numa única chamada, a abertura da sincronização, o canto, cada linha precedida do apagamento e separada por `\r\n`, o apagamento abaixo do corpo, a linha de estado na última linha precedida do apagamento, e o fechamento da sincronização; é por este mesmo `desenhar` que o laço, sem mudar, redesenha após `SIGCONT` e após o editor (RF-07, RF-08, RF-10, D-01, D-02, D-03, D-12) | - | `[//]` | `src/cli/terminal.ts` | 🟢 | `[X]` |
| T017 | Fazer `restaurar` escrever `DESSINCRONIZAR` antes de mostrar o cursor e deixar a tela alternativa, mantendo a idempotência e a ordem inversa da entrada (RN-02, D-03) | T016 | - | `src/cli/terminal.ts` | 🟢 | `[X]` |
| T018 | Agrupar a rajada em `aoRedimensionar`: o primeiro evento agenda o ouvinte por `setImmediate`, os seguintes no mesmo giro só marcam pendência, o ouvinte roda uma vez por giro com as dimensões relidas na hora, e o cancelamento da assinatura limpa a pendência para que o ouvinte não seja chamado depois (RF-09, D-04, D-12) | T017 | - | `src/cli/terminal.ts` | 🟢 | `[X]` |

## Fase 4, Integração

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T019 | Acrescentar a `TABELA_DE_AJUDA`, depois de `g / G`, as linhas `PgUp / PgDn`, "Move a seleção uma janela acima e abaixo", e `Ctrl+U / Ctrl+D`, "Move a seleção meia janela acima e abaixo", ambas só de sete bits e por isso sem `emSeteBits` (RF-06, D-09, `data-delta.md` seção 4) | - | `[//]` | `src/cli/quadro/ajuda.ts` | 🟢 | `[X]` |
| T020 | Regenerar a amostra da ajuda com `npm run amostras:painel` e conferir que a diferença em `amostras/painel/` se limita a `ajuda.txt`, e nele às duas linhas novas, com a moldura íntegra; é a exceção nomeada na RN-01 e no RF-16 (D-09, RF-06, RF-16) | T011, T013, T015, T018, T019 | - | `amostras/painel/ajuda.txt` | 🟢 | `[X]` |
| T021 | Confirmar o contrato de máquina e as fronteiras: suíte inteira verde, `tsc` das três unidades e `check:webview` limpos; `git diff` sem linha em `src/cli/laco.ts`, `passada.ts`, `dados.ts`, `amostras.ts`, `uso.ts`, em `tests/cli-passada.spec.ts`, `cli-amostras.spec.ts`, `cli-paridade.spec.tsx` e nas suítes de dados e de uso, e em `amostras/painel/` fora de `ajuda.txt`; `tests/cli-boundaries.spec.ts` verde, com a sequência de escape só em `terminal.ts` e nenhum nome vigiado em `src/cli/` (RF-16, RN-05, RN-08, D-12) | T003, T004, T005, T006, T007, T008, T009, T010, T011, T013, T015, T018, T020, T024 | - | `tests/cli-boundaries.spec.ts` | 🟢 | `[X]` |

## Fase 5, Polimento

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T022 | Atualizar o cabeçalho do módulo e a doc de `Terminal.desenhar` e `Terminal.aoRedimensionar`: o redesenho é integral por posicionamento, sem apagar a tela, envolvido em atualização sincronizada, e a rajada de redimensionamento é agrupada por giro; a frase "apaga e redesenha" sai (D-01, D-03, D-04) | T018 | - | `src/cli/terminal.ts` | 🟢 | `[X]` |
| T023 | Na descrição da interface viva do README, acrescentar numa frase que `PgUp`/`PgDn` e `Ctrl+U`/`Ctrl+D` movem a seleção por janela e meia janela, e que o redesenho não deixa cópia do quadro no histórico do emulador, sem nomear produto de referência nem emulador (RF-06, RN-08, D-09) | T019, T021 | `[//]` | `README.md` | 🟢 | `[X]` |

## Notas de execução

<!--
Reservado para /reversa-coding registrar avisos ou observações que surgiram durante a execução.
Não use isso para corrigir ações, edits manuais ficam fora desse arquivo, vão direto no código.
Também é aqui que entra o achado da D-11, registrado como passo humano do onboarding.md:
o estado das duas caixas do iTerm2, o resultado do passo 1 (defeito reproduzido ou não, com a versão),
o resultado do passo 2, e qualquer emulador em que um passo tenha falhado.
-->

Rodada de `/reversa-coding` em 2026-09-21, na noite (2026-09-22 em UTC, que é o fuso do
`progress.jsonl`). Vinte e quatro ações de vinte e quatro, nenhuma falha. Cinco observações:

1. **A D-01 foi refinada pela razão da D-02.** O plano mandava apagar do cursor ao fim da tela
   (`CSI J`) logo depois da última linha do corpo. A D-02 explica por que o apagamento da linha vem
   antes do texto: uma linha de exatamente `largura` colunas deixa o cursor em quebra pendente na
   última coluna, e apagar dali come o último glifo escrito. O mesmo vale para `CSI J`, que apaga a
   partir da posição corrente. Por isso `desenhar` posiciona antes na linha **seguinte** à última
   (`CSI <n+1>;1H`) e só então apaga abaixo; e quando o corpo enche a janela, não há abaixo, e a
   sequência é omitida. `tests/cli-terminal.spec.ts` prende os dois casos. O `data-delta.md` seção 5
   continua correto; a diferença é de ordem, e não de sequência.
2. **A amostra `ajuda.txt` muda em três linhas, e não em duas.** As duas linhas novas da tabela
   entram com a moldura íntegra, e a linha de estado da amostra passa de "linhas 1–17 de 17" a
   "linhas 1–19 de 19", porque transcreve a altura do painel. É consequência da D-09, e não uma
   terceira mudança; nenhuma outra amostra difere.
3. **O `requirements.md` citava o marcador de dúvida entre crases**, no histórico da sessão de
   esclarecimento, e `tests/forward-marcador-de-duvida-citado.spec.ts` (guarda do bug 74UL) reprovava
   a feature inteira por isso, antes de qualquer linha de código. A citação foi reescrita em prosa,
   ali e na frase equivalente do `roadmap.md` seção 4, com linha no histórico do requirements.
4. **Uma expectativa da T004 estava errada na primeira redação**, e não a máquina: afirmava que três
   páginas levariam a janela ao fundo de um quadro de 200 linhas com janela de 20. A D-08 promete uma
   altura por página, presa ao fundo; o caso passou a afirmar isso, com doze páginas para o fundo.
5. **A fumaça da D-11 foi feita na mesma noite, no iTerm2 3.7.2, e o achado é misto.**
   - Caixas do perfil Default (passo 0.3): "Treat ambiguous-width characters as double width"
     desligada, conforme o arquivo de preferências; "Save lines to scrollback in alternate screen
     mode" e "Disable save/restore alternate screen" sem chave gravada, isto é, no padrão.
   - Passo 1, no painel dividido (18×65) em que o usuário vinha testando: a réplica dos quadros
     **persistiu com a 0.17.0**. A gravação de tela mostra a caixa `Projeto:` e o eco
     `> npm run compile:cli` desenhados abaixo de uma linha de estado, o que só ocorre com os
     quadros no buffer principal: naquela sessão o emulador não honrava `CSI ?1049h`, embora o
     programa o emita sem condição. Causa provável: estado da própria sessão (ajuste por *Edit
     Session*, que não persiste no perfil), pois o mesmo perfil, em janela nova, honra a troca.
   - Passo 2, em painel novo do mesmo perfil, tamanhos 18×65, 55×185 e 55×208, com oitenta setas
     enviadas por AppleScript e depois com o trackpad pelo usuário: nenhuma réplica, um quadro por
     tela, nada no histórico depois de `q`. O emulador, porém, **não converte a rolagem do trackpad
     em setas**: a opção avançada "Scroll wheel sends arrow keys when in alternate screen mode"
     (`AlternateMouseScroll`) está no padrão, desligada; com ela ligada a rolagem passa a mover a
     seleção. Sem relato de mouse, que o RF deixou fora por decisão do usuário, é o único caminho.
   - Achado lateral, a registrar como bug: uma rajada de setas entregue num só bloco de bytes é
     reconhecida como uma única tecla, pela regra por bloco da D-15 da 014; quarenta `Esc [ B`
     em sequência produziram seis redesenhos no pseudoterminal. Não causa réplica, mas torna a
     rolagem por rajada mais lenta do que o gesto.

Verificação da T021: suíte inteira verde (145 arquivos, 2660 testes), `tsc -p ./`, `tsc -p
tsconfig.cli.json` e `check:webview` limpos; `git diff` sem linha em `src/cli/laco.ts`, `passada.ts`,
`dados.ts`, `amostras.ts`, `uso.ts`, em `src/host/`, `src/webview/`, nas suítes de passada, amostras,
paridade, dados e uso, e em `amostras/painel/` fora de `ajuda.txt`.

## Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-09-21 | Versão inicial gerada por `/reversa-to-do` | reversa |
| 2026-09-21 | Edição manual após o `audit/cross-check.md`, por decisão do usuário no chat: A001, T020 promovida a 🟢 e o resumo reescrito; A002, T024 acrescentada e T021 passa a depender dela; A003, T016 cita o RF-10 e a D-12; A005, `[//]` retirado da T022, que compartilha alvo com a T016 | usuário, via reversa |
| 2026-09-21 | Execução por `/reversa-coding`: 24 de 24 ações `[X]`, notas de execução preenchidas | reversa |
| 2026-09-21 | Fumaça da D-11 registrada na nota 5: réplica presa à sessão antiga do iTerm2, painel novo limpo, trackpad depende de `AlternateMouseScroll`, rajada de setas como bug lateral | usuário, via reversa |
