# Adendo: tela cheia do painel de linha de comando

> Identificador da feature: `017-tela-cheia-do-painel`
> Data: `2026-09-21`
> Cenário: `greenfield`
> Gerado por: `/reversa-sync`

Até a 016, quem lesse os adendos 014 e 016 encontraria uma interface viva que desenha na tela
alternativa e a devolve em todo caminho de saída, mas que **apaga a tela inteira a cada redesenho**: a
cada tecla, releitura e redimensionamento, `CSI 2J` e o quadro de novo. Era esse branco entre um quadro e
outro, em rajada, que o iTerm2 empurrava para o histórico quando a roda do trackpad virava setas, e o
sintoma relatado era a rolagem infinita com o quadro replicado para cima. Desde a 017 o redesenho é
integral **por posicionamento**: vai ao canto, apaga cada linha antes de escrevê-la, apaga o que sobra
abaixo do corpo, escreve a linha de estado, e envolve tudo em atualização sincronizada, numa única
escrita. O teclado ganhou página e meia página, e a rajada de redimensionamento virou um evento por giro.

A entrega é de mecânica de tela, e o que o adendo precisa deixar registrado é a fronteira dela: nenhum
fato, frase, ordem, contagem, cor ou moldura mudou; a passada, a saída de dados, os códigos de saída e
as amostras ficaram parados, com uma exceção nomeada, a amostra da ajuda, que transcreve a tabela de
teclas e ganhou as duas linhas novas. O que mudou de contrato é um só e está nomeado abaixo: o teclado.

## Vigência

Vigente desde 2026-09-21.

## Resumo da entrega

A interface viva do painel de terminal já desenhava na tela alternativa desde a 014; o que lhe faltava,
medido contra o modo de tela cheia do produto de referência e contra o uso real, era o **comportamento**
de uma aplicação de tela cheia. A 017 elimina o apagamento de tela inteira, acrescenta a rolagem por
página (`PgUp`, `PgDn`) e por meia página (`Ctrl+U`, `Ctrl+D`), e absorve a rajada do redimensionamento
como um evento só. Serve ao Operador, que mantém a ferramenta aberta ao lado do agente por horas, e ao
Retomador, que percorre um quadro longo em segundos.

A resposta tem quatro eixos. O primeiro é o **redesenho sem apagar a tela**, confinado a
`src/cli/terminal.ts`: sincronização aberta, canto, cada linha apagada antes do texto (antes, e não
depois, por causa da quebra pendente na última coluna), apagamento abaixo do corpo a partir da linha
seguinte à última, linha de estado apagada antes na última linha, sincronização fechada; a restauração
fecha a sincronização antes de mostrar o cursor e deixar a tela alternativa. O segundo é o **teclado**:
as sequências com til passam a ser lidas pelo número entre o colchete e o til, e só `5` e `6` são tecla;
`Ctrl+U` e `Ctrl+D` entram como bytes de controle. O terceiro é a **página medida em linhas** numa
seleção que anda em posições: o compositor passa a dizer à máquina de navegação, por um campo opcional
do contexto, em que linha cada título e cada item moram, e a máquina decide o alvo por ele; sem o
campo, a página é `alturaVisivel` posições, e nenhuma chamada existente muda. O quarto é a **rajada
agrupada** dentro do próprio terminal, por `setImmediate`, sem relógio e sem estado no laço.

Três coisas ficaram deliberadamente fora, por decisão do usuário em 2026-09-21: o rastreio de mouse (a
roda funciona pela conversão em setas do emulador, e o rastreio custaria a seleção nativa de texto), o
desenho no buffer principal e qualquer rastro ao sair. Nenhuma bandeira nem variável de ambiente entrou.

Ações: **24 de 24 concluídas**, nenhuma falha. Suíte inteira com 145 arquivos e 2660 testes passando;
`tsc` das três unidades e `check:webview` limpos. Cinco observações estão em "Notas de execução" do
`actions.md`; uma delas refina a D-01 pela razão da D-02 (o apagamento abaixo do corpo posiciona antes
na linha seguinte à última), e nenhuma muda requisito.

## Impacto por artefato da extração

| Artefato | Seção | Tipo de impacto | Delta |
|----------|-------|-----------------|-------|
| `_reversa_sdd/addenda/014-cli-do-processo.md` | resumo da entrega, "a ferramenta devolve o terminal nos quatro caminhos de saída" | `componente-novo` | Continua verdadeira e cobre um modo a mais: a atualização sincronizada (`CSI ?2026`) é fechada em toda restauração, antes do cursor e da tela alternativa, para a saída no meio de um desenho (RF-08, RN-02) |
| `_reversa_sdd/addenda/014-cli-do-processo.md` | impacto por artefato, "o que o terminal escreveu por conta própria é o desenho" | `componente-novo` | Onde se lê que o redesenho apaga a tela e a reescreve, leia: redesenho integral por posicionamento, sem `CSI 2J`, com apagamento por linha antes do texto, apagamento abaixo do corpo e sincronização, numa única escrita; após `SIGCONT` e após o editor, o mesmo `desenhar`, e `laco.ts` sem linha alterada (RF-07, RF-10, D-01 a D-03, D-12) |
| `_reversa_sdd/addenda/014-cli-do-processo.md` | D-05, escape confinado a `terminal.ts` | `componente-novo` | Intacta; entram cinco sequências novas ali e em nenhum outro lugar: `SINCRONIZAR`, `DESSINCRONIZAR`, `CANTO`, `APAGAR_LINHA`, `APAGAR_ABAIXO`; `LIMPAR` foi removida (RN-05) |
| `_reversa_forward/014-cli-do-processo/interfaces/teclado.md` | tabela de teclas, seção 2 | `delta-de-contrato-externo` | Toda linha continua valendo, com quatro a mais: `PgDn` (`Esc [ 6 ~`), `PgUp` (`Esc [ 5 ~`), `Ctrl+D` (`0x04`), `Ctrl+U` (`0x15`), todas de movimento e com efeito `nenhum`. Adendo do contrato em `_reversa_forward/017-tela-cheia-do-painel/interfaces/teclado.md` (RF-01, RF-02, D-05) |
| `_reversa_forward/014-cli-do-processo/interfaces/teclado.md` | seção 1, "não há mouse" | `componente-novo` | Reafirmada por decisão do usuário: nenhum modo de mouse é ligado; a roda funciona pela conversão em setas que o emulador faz na tela alternativa, e a seleção nativa de texto continua sem modificador (RN-04) |
| `_reversa_forward/014-cli-do-processo/interfaces/teclado.md` | seção 4, reconhecimento em função pura | `componente-novo` | Continua pura e por bloco; passa a distinguir as sequências terminadas em til, lidas pelo número (`5` e `6` são tecla; `Home`, `Insert`, `Delete`, `End` e as de função não são), das terminadas em letra, que seguem pelo último byte (D-06) |
| `_reversa_sdd/addenda/016-visual-do-painel-cli.md` | navegação e rolagem, D-19 | `componente-novo` | A seleção continua o único foco e a janela nunca se separa dela; a página e a meia página movem seleção e janela na mesma transição, presas às pontas, e o ajuste de deslocamento do laço vem depois sem mover o que já está visível (RN-03, D-08) |
| `_reversa_sdd/addenda/016-visual-do-painel-cli.md` | contexto de navegação e `alturaUtil()` | `delta-de-dados` | `ContextoDeNavegacao` ganha `linhas`, **opcional**: mapa seção → linha do título e linha principal de cada item no quadro inteiro, `itens: []` para seção fechada, omitido com a ajuda visível; sai da mesma montagem que anota a seleção, e a invariante "linha da seleção no mapa = `indiceDaSelecao()`" é presa por suíte (D-07) |
| `_reversa_sdd/addenda/016-visual-do-painel-cli.md` | linha de estado por posicionamento absoluto, D-17 | `componente-novo` | Continua na última linha da janela; passa a ser apagada antes de escrita, e a vir depois do apagamento abaixo do corpo e antes do fechamento da sincronização (D-01) |
| `_reversa_sdd/addenda/016-visual-do-painel-cli.md` | amostras versionadas, RF-17 e D-23 | `componente-novo` | As dez amostras de quadro não mudam, porque vestem linhas sem passar pelo redesenho; `amostras/painel/ajuda.txt` foi regenerada com as duas linhas novas da tabela e a posição "1–19 de 19" na linha de estado; é a exceção nomeada na RN-01 e no RF-16 (RF-06, D-09) |
| `_reversa_sdd/addenda/016-visual-do-painel-cli.md` | resumo da entrega, "o primeiro byte escrito pelo laço é o do primeiro desenho" | `componente-novo` | Continua verdadeira; o primeiro byte do primeiro desenho passa a ser o da abertura da sincronização, emitida sempre e sem consulta ao terminal (RN-06, D-03) |
| `_reversa_sdd/addenda/016-visual-do-painel-cli.md` | RN-07, nomes vigiados fora de `src/cli/` | `componente-novo` | Intacta: o produto de referência e o emulador são nomeados nos documentos da feature e nas suítes, e em nenhum fonte da ferramenta (RN-08) |
| `_reversa_sdd/sdd/painel-do-processo.md` | 6, requisitos funcionais, RF-13 | `componente-novo` | A decisão da página (`alvoDaPagina`) e a do mapa de linhas são funções puras; o único módulo que toca o terminal continua sendo o de terminal (RN-05) |
| `_reversa_sdd/sdd/painel-do-processo.md` | 9, modelo de dados | `delta-de-dados` | `TECLAS` de quinze para dezenove nomes, por acréscimo; `EFEITOS` sem mudança; `TABELA_DE_AJUDA` com duas linhas a mais. Nada persiste (`data-delta.md` da feature) |
| `_reversa_sdd/sdd/painel-do-processo.md` | 7, RNF-03, distinguível sem cor | `componente-novo` | Estendida ao que o terminal pode não ter: a sincronização é acréscimo cuja falta não retira função; num emulador sem o modo, o redesenho sem apagamento de tela responde sozinho (RF-08) |
| `_reversa_sdd/sdd/ponte-e-host.md` | protocolo e leitura | `componente-novo` | Sem delta: nenhuma mensagem nova, `src/host/` e `src/webview/` intocados; passada e saída de dados idênticas (RF-16) |
| `_reversa_sdd/sdd/empacotamento-e-verificacao.md` | suítes de fronteira | `componente-novo` | `tests/cli-boundaries.spec.ts` sem linha alterada e verde; `tests/cli-terminal.spec.ts` reescrito com mudança de disposição declarada (D-10); `cli-teclas`, `cli-navegacao` e `cli-quadro` só por acréscimo, com a tabela de ajuda conferida por suíte (RF-06, T024) |
| `_reversa_sdd/prd.md` | 6, restrições | `componente-novo` | Intactas: zero dependência de tempo de execução (o agrupamento usa `setImmediate`, do interpretador) e nenhuma escrita no projeto observado (RN-07) |
| `_reversa_sdd/prd.md` | requisitos não funcionais | `componente-novo` | Três pisos: um redesenho comum é uma única escrita; a rajada de redimensionamento produz um redesenho por giro; a composição de 500 linhas continua abaixo de 50 ms |

## O que o texto deliberadamente não diz

- **O mecanismo exato do iTerm2 não foi determinado.** A correção vale por si: com o `2J` retirado,
  não há mais o que replicar. A fumaça no iTerm2 3.7.2 com o trackpad é passo humano (`onboarding.md`),
  ainda pendente, e o achado vai para as notas de execução do `actions.md` (D-11).
- **Não há suíte de sinais.** A ordem da dança do editor (restaurar, agir, entrar, desenhar) e a
  retomada após `SIGCONT` são atendidas pelo `desenhar` novo sem que o laço mude, e são conferidas em
  terminal real pelo `onboarding.md` §5 (RF-10, D-12).
- **A meia página só equivale a meia página inteira quando a altura é par**, e dois `Ctrl+D` só
  equivalem a um `PgDn` onde as posições moram em linhas contíguas; com item de mais de uma linha, o
  alvo é a primeira posição cuja linha alcança o salto, e não a posição a `alturaVisivel` de distância.
- **A página pelo mapa exige o mapa.** Chamada que não o entrega, como as suítes que constroem o
  contexto por `Partial`, anda por posições, que é comportamento definido e não erro.
- **Sem carga, as onze seções não estão no mapa**, porque não são desenhadas; a máquina cai em posições
  para elas. É a mesma aresta que a 014 já tinha: sem carga, os títulos são posições sem linha.

## Regras sob vigilância

O watch principal está vazio, por ser cenário greenfield. As observações, sem peso de regressão até que
uma extração as confirme, são **W001 a W018**, em
[`_reversa_forward/017-tela-cheia-do-painel/regression-watch.md`](../../_reversa_forward/017-tela-cheia-do-painel/regression-watch.md):

W001, W002, W003, W004, W005, W006, W007, W008, W009, W010, W011, W012, W013, W014, W015, W016, W017,
W018.

## Fontes

- `_reversa_forward/017-tela-cheia-do-painel/legacy-impact.md`
- `_reversa_forward/017-tela-cheia-do-painel/regression-watch.md`
- `_reversa_forward/017-tela-cheia-do-painel/requirements.md`
- `_reversa_forward/017-tela-cheia-do-painel/roadmap.md`
- `_reversa_forward/017-tela-cheia-do-painel/actions.md`, com as "Notas de execução"
- `_reversa_forward/017-tela-cheia-do-painel/progress.jsonl`
- `_reversa_forward/017-tela-cheia-do-painel/data-delta.md`
- `_reversa_forward/017-tela-cheia-do-painel/interfaces/teclado.md`
- `_reversa_forward/017-tela-cheia-do-painel/onboarding.md`
