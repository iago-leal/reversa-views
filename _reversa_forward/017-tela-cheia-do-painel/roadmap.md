# Roadmap: tela cheia do painel de linha de comando

> Identificador: `017-tela-cheia-do-painel`
> Data: `2026-09-21`
> Requirements: `_reversa_forward/017-tela-cheia-do-painel/requirements.md`
> Confidência: 🟢 CONFIRMADO, 🟡 INFERIDO, 🔴 LACUNA

## 1. Resumo da abordagem

A feature é pequena em superfície e precisa em alvo: o único módulo que escreve sequência de escape,
`src/cli/terminal.ts`, troca o redesenho por apagamento de tela inteira pelo redesenho por
posicionamento, linha a linha, envolvido em atualização sincronizada; o reconhecedor de teclas ganha
quatro teclas nomeadas de página e meia página; a máquina de navegação aprende a mover a seleção por
uma janela de linhas, e para isso o compositor passa a dizer em que linha cada posição navegável
mora; o redimensionamento em rajada é agrupado dentro do próprio terminal, sem relógio; e a ajuda
transcreve as teclas novas. O laço, `src/cli/laco.ts`, não muda, porque tudo o que ele faz continua
correto: pede o contexto ao compositor, entrega a tecla à máquina e manda desenhar. Nenhum módulo
fora de `src/cli/` é tocado, nenhuma bandeira entra, e as amostras versionadas, que vestem linhas sem
passar pelo desenho do terminal, continuam idênticas.

A correção do sintoma relatado, a replicação do quadro no iTerm2 ao rolar com o trackpad, não
depende de se explicar o mecanismo do emulador: com o `2J` retirado, não há mais o que replicar. A
explicação fica como passo humano de investigação em `onboarding.md`, com as hipóteses ordenadas.

## 2. Princípios aplicados

`.reversa/principles.md` não existe neste projeto. As restrições que fazem as vezes de princípio vêm
do PRD e dos adendos, e a feature as respeita todas:

| Princípio | Como a feature se relaciona | Status |
|-----------|------------------------------|--------|
| Zero dependência de tempo de execução (`_reversa_sdd/prd.md#6-restricoes`) | Sequências de controle são texto; o agrupamento da rajada usa `setImmediate`, que é do interpretador | respeita |
| A ferramenta não escreve no projeto observado (RN-02 da 014) | Nada é escrito em disco | respeita |
| Sequência de escape só em `src/cli/terminal.ts` (D-05 da 014, RN-05 da 017) | As sequências novas, sincronização e apagamento de linha, entram só ali | respeita |
| Reconhecimento de teclas em função pura (`interfaces/teclado.md` da 014) | As teclas novas entram na mesma tabela pura, e a máquina de navegação continua sem efeito colateral | respeita |
| Apresentação decidida sem perguntar ao terminal (D-07 da 016) | A sincronização é emitida sempre; nenhuma consulta de capacidade | respeita |
| Nomes vigiados fora de `src/cli/` (RN-07 da 016) | O produto de referência e o iTerm2 são nomeados só nos documentos e nas suítes | respeita |

## 3. Decisões técnicas

| ID | Decisão | Justificativa | Alternativas descartadas | Confidência |
|----|---------|----------------|--------------------------|-------------|
| D-01 | O redesenho deixa de escrever `CSI 2J`. Passa a: posicionar no canto (`CSI H`), e para cada linha visível, apagar a linha inteira (`CSI 2K`), escrever a linha e descer (`\r\n`, exceto após a última); depois apagar do cursor ao fim da tela (`CSI J`); depois posicionar na última linha da janela, apagar a linha e escrever a linha de estado. Tudo numa única chamada de escrita | É o que retira a tela em branco entre quadros e, com ela, o que o emulador tinha para empurrar ao histórico; `CSI J` limpa o resíduo do quadro anterior abaixo de um corpo mais curto (RF-07) | Redesenho incremental por diferença entre quadros, que exige guardar o quadro anterior e reabre a possibilidade de resíduo quando o editor escreve na tela (a 014 já recusou); manter `2J` e apenas sincronizar, que não corrige o caso do emulador sem sincronização | 🟢 |
| D-02 | O apagamento da linha vem **antes** do texto, e não depois | Uma linha de exatamente `largura` colunas deixa o cursor em estado de quebra pendente na última coluna; um apagamento até o fim da linha nesse estado apaga o último glifo escrito, que é o canto da moldura. Apagar antes evita o problema sem depender de como cada emulador trata a quebra pendente | Apagar depois com `CSI K`; escrever `largura - 1` colunas, que mudaria o texto do quadro e violaria a RN-01 | 🟢 |
| D-03 | Cada redesenho é envolvido em atualização sincronizada, `CSI ?2026h` antes e `CSI ?2026l` depois, e a restauração escreve `CSI ?2026l` antes de mostrar o cursor e deixar a tela alternativa | O emulador que conhece o modo troca o quadro de uma vez; o que não conhece ignora as duas sequências, e a D-01 responde sozinha. Fechar na restauração cobre a saída no meio de um desenho (RF-08, RN-02) | Consultar o terminal sobre o modo (`DECRQM`), que violaria a D-07 da 016; não sincronizar, que deixa tremulação em tmux novo e em emuladores rápidos | 🟢 |
| D-04 | A rajada de `resize` é agrupada em `terminal.ts`, dentro de `aoRedimensionar`: o primeiro evento agenda o ouvinte por `setImmediate`, os seguintes no mesmo giro só marcam pendência, e o cancelamento da assinatura limpa a pendência | Fica no módulo que já toca o mundo, sem relógio e sem estado no laço; é testável com o fluxo falso chamando o ouvinte dez vezes e esperando um giro (RF-09) | Temporizador de dezenas de milissegundos, que agruparia melhor um arrasto real mas introduziria relógio e atraso visível; agrupar no laço, que hoje não tem estado de desenho e não precisa ganhar | 🟢 |
| D-05 | Quatro teclas nomeadas novas em `TECLAS`: `pagina-acima`, `pagina-abaixo`, `meia-pagina-acima`, `meia-pagina-abaixo`. Bytes: `ESC [ 5 ~` e `ESC [ 6 ~` para as páginas; `0x15` (`Ctrl+U`) e `0x04` (`Ctrl+D`) para as meias | São os bytes que xterm e todos os emuladores atuais enviam para `PgUp`/`PgDn`; os controles são os do paginador. Em modo bruto, `0x04` é um byte como outro, sem semântica de fim de entrada | `Ctrl+F`/`Ctrl+B` do `less`, que colidiriam com hábitos de edição de linha; `Ctrl+Home`/`Ctrl+End` da referência, cujos bytes variam por emulador | 🟢 |
| D-06 | O reconhecedor passa a distinguir sequências terminadas em `~`: lê os dígitos entre `ESC [` e `~`, mapeia `5` e `6`, e devolve nulo para qualquer outro número (`Insert`, `Delete`, `Home`, `End` nesse formato). As sequências terminadas em letra continuam mapeadas pelo último byte, como hoje | O mapeamento pelo último byte trataria todas as teclas com `~` como uma só; ler o número é a única forma de separar `PgUp` de `Delete` sem tabela por emulador | Mapear `~` para uma tecla só; tabela de sequências inteiras por emulador | 🟢 |
| D-07 | `ContextoDeNavegacao` ganha um campo **opcional**, `linhas`, o mapa de cada seção para a linha do título dela e as linhas dos itens dela no quadro inteiro, produzido por `contextoDeNavegacao()` a partir da mesma montagem que já calcula `indiceDaSelecao` e `blocoDaSelecao` | A página é medida em linhas e a máquina anda em posições; com o mapa, a página abaixo é a primeira posição cuja linha é maior ou igual à linha corrente mais a altura visível, ou a última posição; a página acima é simétrica. Opcional para que nenhuma chamada existente mude e para que, sem o mapa, a máquina caia em mover por posições, que é comportamento definido | Página como `alturaVisivel` posições, que erra sempre que um item tem dado secundário; expor `posicoes()` para o compositor, que inverteria a dependência | 🟢 |
| D-08 | A página move também a janela: `primeiraLinhaVisivel` avança ou recua uma altura visível (meia, para a meia página), presa ao fundo e ao topo, na mesma transição que move a seleção. O `ajustarDeslocamento` do laço continua depois, e não move nada quando a seleção já está visível | É o que faz a tela andar uma página em vez de a seleção descer até a borda de baixo e a janela ir atrás uma linha; `topo` e `fim` já fazem o mesmo com o deslocamento (RN-03) | Só mover a seleção e deixar o deslocamento para o laço, que produz a seleção colada à borda | 🟢 |
| D-09 | `TABELA_DE_AJUDA` ganha duas linhas, `PgUp / PgDn` e `Ctrl+U / Ctrl+D`, depois de `g / G`, e o contrato `interfaces/teclado.md` desta feature registra as duas como acréscimo à tabela da 014, reafirmando que não há mouse. A amostra `amostras/painel/ajuda.txt`, que transcreve a tabela, é regenerada com as duas linhas: é a única amostra que a feature muda, exceção nomeada na RN-01 e no RF-16 | A ajuda é a transcrição do contrato, e uma suíte sobre `TABELA_DE_AJUDA`, que confere as quatro teclas com a promessa de cada uma e a ausência de "mouse", é o que a mantém honesta; a comparação de `tests/cli-amostras.spec.ts` prende a amostra regenerada (RF-06) | Bandeira para esconder as teclas novas, sem razão; congelar `ajuda.txt`, que deixaria a ajuda sem as teclas novas e feriria o RF-06 | 🟢 |
| D-10 | As suítes de `tests/cli-terminal.spec.ts` que prendem `2J` mudam de expectativa, declaradas no cabeçalho do arquivo e em cada caso como mudança de disposição, no molde da 016; nenhuma expectativa de fato é afrouxada, e entram as asserções de ordem: sincronização aberta e fechada, apagamento antes do texto, `CSI J` após o corpo, linha de estado na última linha, restauração fechando a sincronização antes do cursor, e o agrupamento da rajada | Prender a sequência é a única forma de conferir a D-01 a D-04 sem terminal real | Suíte de captura em pseudoterminal, que testaria o emulador e não a ferramenta | 🟢 |
| D-11 | O mecanismo do iTerm2 é investigado como passo humano, com a versão instalada (3.7.2) e o trackpad, sobre a construção anterior e sobre a nova, e o achado vai para as notas de execução do `actions.md`; ele não condiciona ação alguma | A correção vale por si (RF-07); explicar o emulador tem valor de registro, e não de bloqueio | Bloquear a entrega até explicar; ignorar e não registrar | 🟡 |
| D-12 | `src/cli/laco.ts` não é alterado | O agrupamento mora no terminal, a página mora na máquina e no compositor, e o laço já passa o contexto do compositor à máquina a cada tecla; alterá-lo seria mexer no único módulo com estado sem necessidade. O laço já redesenha por inteiro após `SIGCONT` (`aoRetomar`) e após o editor (`dancar`, na ordem restaurar, agir, entrar, desenhar), e por isso o RF-10 é atendido pelo `desenhar` novo da D-01 e da D-03 sem linha alterada; como não há suíte de sinais, a ordem da dança e a retomada são conferidas em terminal real pelo `onboarding.md` §5 | Agrupar a rajada no laço; tratar as teclas novas como efeitos nomeados; suíte nova do laço com sinais falsos, que custaria um molde inexistente para prender comportamento que não muda | 🟢 |

## 4. Premissas

Nenhuma. O `requirements.md` está sem marcador de dúvida depois da sessão de esclarecimento de 2026-09-21.

## 5. Delta arquitetural

Não há `architecture.md`; os componentes citados vêm das specs de `_reversa_sdd/sdd/` e dos adendos.

| Componente | Arquivo de origem no legado | Tipo de mudança | Resumo |
|------------|------------------------------|-----------------|--------|
| Terminal da interface viva (`src/cli/terminal.ts`) | `_reversa_sdd/addenda/014-cli-do-processo.md#impacto-por-artefato-da-extracao`, linha de `painel-do-processo.md#8-design-e-interface` | regra-alterada | Redesenho por posicionamento com apagamento por linha e sincronização, sem `2J`; restauração fecha a sincronização; rajada de `resize` agrupada |
| Reconhecedor de teclas (`src/cli/teclas.ts`) | `_reversa_forward/014-cli-do-processo/interfaces/teclado.md#4-como-a-decisao-entra-no-codigo` | contrato-alterado | Quatro teclas nomeadas novas; sequências com `~` lidas pelo número |
| Máquina de navegação (`src/cli/navegacao.ts`) | `_reversa_forward/014-cli-do-processo/roadmap.md`, D-06 | regra-alterada | Página e meia página movem seleção e janela juntas, pelo mapa de linhas quando há, por posições quando não há; `ContextoDeNavegacao` ganha `linhas` opcional |
| Compositor do quadro (`src/cli/quadro/index.ts`) | `_reversa_sdd/addenda/016-visual-do-painel-cli.md#impacto-por-artefato-da-extracao`, navegação e rolagem | contrato-alterado | `contextoDeNavegacao()` passa a devolver o mapa de linhas por posição |
| Vocabulário (`src/cli/tipos.ts`) | `_reversa_sdd/addenda/014-cli-do-processo.md`, `painel-do-processo.md#9-modelo-de-dados` | contrato-alterado | `TECLAS` com dezenove nomes |
| Ajuda (`src/cli/quadro/ajuda.ts`) | `_reversa_forward/014-cli-do-processo/requirements.md`, RF-12 | regra-alterada | Duas linhas novas na tabela; a amostra `amostras/painel/ajuda.txt` é regenerada |
| Laço (`src/cli/laco.ts`), passada, dados, uso, amostras fora de `ajuda.txt`, `src/host/`, `src/webview/` | idem | sem mudança | Confirmado por suíte: passada, amostras, dados e uso sem linha alterada; o laço atende o RF-10 sem mudar (D-12) |

## 6. Delta no modelo de dados

- Resumo das mudanças: nada é persistido. Mudam três estruturas efêmeras de `src/cli/tipos.ts` e
  `src/cli/navegacao.ts`: a lista de teclas nomeadas cresce de quinze para dezenove; o contexto de
  navegação ganha o mapa opcional de linhas por posição; a tabela de ajuda ganha duas linhas. A carga
  do host, a saída de dados e o quadro não mudam.
- Detalhe completo em: `_reversa_forward/017-tela-cheia-do-painel/data-delta.md`

## 7. Delta de contratos externos

Não há contrato HTTP, fila ou arquivo. O contrato do teclado, que a 014 fixou como interface com o
usuário, ganha um adendo próprio:

| Contrato | Tipo | Arquivo de detalhe |
|----------|------|--------------------|
| Teclado da interface viva | teclado (bytes do terminal para tecla nomeada) | `_reversa_forward/017-tela-cheia-do-painel/interfaces/teclado.md` |

A linha de comando (`--ajuda`, `--passada`, `--dados`, `--vivo`, `--sem-cor`, `--sem-conferir`,
`--tema=`) e as variáveis de ambiente não mudam, por decisão da sessão de esclarecimento.

## 8. Plano de migração

n/a. Nada persiste entre execuções, e nenhuma chamada existente muda de assinatura: o campo novo do
contexto é opcional e as teclas novas são acréscimo à união.

## 9. Riscos e mitigações

| Risco | Impacto | Probabilidade | Mitigação |
|-------|---------|---------------|-----------|
| O sintoma do iTerm2 persistir mesmo sem `2J`, por mecanismo diferente do suposto | alto | baixo | A fumaça do `onboarding.md` é feita no iTerm2 3.7.2 com o trackpad antes de fechar a entrega; a D-11 registra o achado; se persistir, a investigação sobe para `actions.md` como ação corretiva antes do sync |
| Apagamento de linha e quebra pendente na última coluna se comportarem diferente em algum emulador | médio | baixo | D-02 apaga antes de escrever, o caminho que não depende da quebra pendente; a fumaça cobre Terminal.app e o terminal do VS Code além do iTerm2 |
| A sincronização (`?2026`) ser mal interpretada por um emulador antigo | baixo | baixo | É modo privado DEC; emulador que não o conhece o ignora por especificação; tmux abaixo de 3.7 o descarta, e o painel continua correto pela D-01 |
| `setImmediate` não agrupar um arrasto real, que entrega os eventos em giros distintos | baixo | médio | Cada redesenho já é uma escrita única e atômica pela D-01 e D-03; o agrupamento é economia, e não correção |
| Sequência `ESC [ 5 ~` partida em dois blocos por ligação lenta | baixo | baixo | Mesmo risco já registrado pela 014 para as setas, com a mesma saída (espera curta) caso apareça; não se trata aqui |
| Hábito de `Ctrl+D` como saída em outras ferramentas | baixo | médio | A ajuda diz o que ele faz; `q`, `Esc` e `Ctrl+C` continuam sendo as saídas |
| Reescrita das expectativas de `tests/cli-terminal.spec.ts` afrouxar um fato sem querer | médio | baixo | D-10: cada caso reescrito é declarado como mudança de disposição, e as asserções sobre texto (retiradas as sequências) permanecem iguais |

## 10. Critério de pronto

- [ ] Todas as ações do `actions.md` marcadas `[X]`
- [ ] `cross-check.md` (se executado) sem CRITICAL nem HIGH
- [ ] `regression-watch.md` gerado
- [ ] Suíte inteira verde, `tsc` das três unidades e `check:webview` limpos
- [ ] `tests/cli-passada.spec.ts`, `tests/cli-amostras.spec.ts`, a suíte de dados e a de uso sem linha alterada; em `amostras/painel/`, diferença só em `ajuda.txt`, e nele só as duas linhas novas
- [ ] Fumaça no iTerm2 3.7.2 com o trackpad, conforme `onboarding.md`, sem replicação de quadro, registrada nas notas de execução
- [ ] Re-extração reversa executada e sem regressão vermelha (recomendado, não obrigatório)

## 11. Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-09-21 | Versão inicial gerada por `/reversa-plan` | reversa |
| 2026-09-21 | Edição manual após o `audit/cross-check.md`, por decisão do usuário no chat: A001, D-09 e o critério de pronto admitem a regeneração de `ajuda.txt`; A002, D-09 nomeia a suíte sobre `TABELA_DE_AJUDA`; A003, D-12 cita o RF-10 e a cobertura pelo `onboarding.md`; A007 e A008, delta arquitetural com `ContextoDeNavegacao` no arquivo certo, rótulo do compositor e ponteiros de D-06 e RF-12 corrigidos | usuário, via reversa |
