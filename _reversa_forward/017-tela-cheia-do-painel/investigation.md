# Investigation: tela cheia do painel de linha de comando

> Identificador: `017-tela-cheia-do-painel`
> Data: `2026-09-21`

## 1. O que se investigou

Três perguntas guiaram a pesquisa: por que o quadro se replica no iTerm2 ao rolar com o trackpad;
como uma aplicação de tela cheia redesenha sem tremular e sem deixar rastro; e quais bytes as teclas
de página produzem. As respostas abaixo vêm do código do projeto, de uma captura em pseudoterminal
feita nesta data, dos fontes e da documentação do produto de referência, e das especificações de
terminal que os emuladores seguem.

## 2. O sintoma

### 2.1 O que a ferramenta escreve

Captura feita com `expect` sobre `node scripts/painel.js`, num pseudoterminal de 80 colunas por 24
linhas, `TERM=xterm-256color`, `COLORTERM=truecolor`, `LANG=pt_BR.UTF-8`:

- Primeiro byte escrito: `CSI ?1049h`, seguido de `CSI ?25l`. A tela alternativa é pedida antes de
  qualquer desenho, como o RF-20 da 016 exige.
- Cada quadro: `CSI 2J` `CSI H`, 23 linhas de exatamente 80 pontos de código, unidas por `\r\n`, e
  `CSI 24;1H` seguido da linha de estado. Nenhuma linha excede a largura; nenhum quadro excede a
  altura útil.
- O pseudoterminal converte `\n` em `\r\n` (o modo bruto do interpretador conserva `ONLCR`), de modo
  que cada quebra chega ao emulador como `\r\r\n`; é inofensivo, e a contagem de largura, feita sem
  o `\r`, dá 80.

Conclusão: a ferramenta cumpre o contrato, e o sintoma nasce no emulador.

### 2.2 O que o iTerm2 faz, por hipótese, em ordem de probabilidade

1. **O apagamento de tela inteira em rajada.** Com o rastreio de mouse desligado, o iTerm2 converte a
   roda em setas na tela alternativa (preferência "Scroll wheel sends arrow keys when in alternate
   screen mode", ligada por padrão). Um gesto de trackpad produz dezenas de `ESC [ B` em sequência, e
   cada uma produz um quadro inteiro que começa por `CSI 2J`. Emuladores que implementam o `2J`
   "rolando" o conteúdo para fora, em vez de apagá-lo no lugar, guardam cada quadro; o iTerm2 faz
   isso na tela principal (é por isso que `clear` nele não apaga o histórico) e pode fazê-lo na
   alternativa em condições que a preferência abaixo controla.
2. **Linhas da tela alternativa guardadas no histórico.** Preferência de perfil "Save lines to
   scrollback in alternate screen mode". Nesta máquina a chave `Scrollback in Alternate Screen` não
   está gravada em `com.googlecode.iterm2`, o que significa valor padrão (desligada). Um perfil
   dinâmico ou uma sessão com perfil diferente do padrão pode diferir; a investigação humana confere
   na janela em que o sintoma foi visto.
3. **Tela alternativa desabilitada no perfil.** Preferência "Disable save/restore alternate screen"
   (chave `Disable Smcup Rmcup`). Também ausente das preferências gravadas, logo no padrão (não
   desabilitada). Se estivesse ligada, o painel desenharia na tela principal, e cada `2J` empurraria
   o quadro anterior para o histórico, exatamente como relatado; é a hipótese mais simples e a mais
   fácil de descartar olhando o perfil.

A D-01 retira o `2J`, e com ele a matéria-prima das três hipóteses: sem apagamento de tela, nada é
rolado para fora nem guardado. O `onboarding.md` traz o roteiro para reproduzir com a construção
anterior e confirmar a ausência com a nova.

## 3. Como as aplicações de tela cheia redesenham

### 3.1 Sem apagar a tela

O padrão de `curses` e de todo paginador é posicionar o cursor e sobrescrever, apagando o que sobra
de cada linha e, ao fim, o que sobra da tela: `CSI H` (cursor ao canto), por linha `CSI 2K` (apaga
a linha inteira) mais o texto, e ao fim `CSI J` (apaga do cursor ao fim da tela). O `2J` só se usa
ao entrar, e mesmo isso é dispensável na tela alternativa, que o `?1049h` já entrega limpa.

A ordem apagar-depois-escrever tem uma armadilha: quando a linha ocupa todas as colunas, o cursor
fica em estado de **quebra pendente** na última coluna, e um `CSI K` (apaga do cursor ao fim da
linha) nesse estado apaga o último glifo, que aqui é o canto direito da moldura. Apagar a linha
antes de escrever (D-02) evita depender de como cada emulador trata a quebra pendente; xterm,
iTerm2 e kitty a tratam do modo DEC, mas emuladores mais novos já divergiram nisso.

### 3.2 Atualização sincronizada

O modo privado 2026 (`CSI ?2026h` para abrir, `CSI ?2026l` para fechar) pede ao emulador que
segure a apresentação até o fechamento, trocando o quadro de uma vez. É reconhecido por iTerm2,
kitty, WezTerm, Alacritty, foot, Ghostty, Windows Terminal e pelo terminal do VS Code em versões
recentes; tmux o repassa a partir da 3.7, e o descarta antes. Emulador que não o conhece ignora
modos privados desconhecidos por especificação. A documentação do produto de referência atribui
ao tmux abaixo de 3.7 a tremulação residual do modo de tela cheia, o que confirma que o modo é
usado lá.

Fechar o modo na restauração é obrigatório: se a ferramenta sair entre o `h` e o `l`, alguns
emuladores mantêm a apresentação suspensa por um tempo limite, e o usuário vê o terminal parado.

### 3.3 Redesenho integral, e não incremental

A 014 decidiu redesenhar por inteiro a cada quadro, porque o editor aberto por `Enter` pode ter
escrito qualquer coisa na tela; a decisão fica. Com apagamento por linha e sincronização, o
redesenho integral é tão barato quanto o incremental para uma janela de terminal, e não guarda
estado.

### 3.4 O produto de referência

A documentação em `code.claude.com/docs/en/fullscreen.md` e as frases do binário 2.1.278 dão o
seguinte, útil aqui: tela alternativa como `vim` e `htop`; repintar toda célula a cada quadro é
contorno (`CLAUDE_CODE_ALT_SCREEN_FULL_REPAINT`) para o ConPTY, e não o padrão, logo o padrão é
escrita posicionada; a roda sem rastreio chega como setas ("Scroll wheel is sending arrow keys");
`PgUp`/`PgDn` rolam meia tela na referência, e aqui rolam uma janela inteira, porque a referência
rola texto corrido e o painel move uma seleção em lista, onde a página inteira é a convenção do
paginador.

## 4. As teclas

| Tecla | Bytes em xterm e emuladores atuais | Observação |
|---|---|---|
| `PgUp` | `ESC [ 5 ~` | Idêntico em iTerm2, Terminal.app, VS Code, kitty, tmux |
| `PgDn` | `ESC [ 6 ~` | Idem |
| `Ctrl+U` | `0x15` | Em modo bruto, byte simples |
| `Ctrl+D` | `0x04` | Em modo bruto, byte simples; só é fim de entrada em modo canônico |
| `Insert`, `Delete`, `Home`, `End` | `ESC [ 2 ~`, `ESC [ 3 ~`, `ESC [ 1 ~`, `ESC [ 4 ~` ou `ESC [ H`, `ESC [ F` | Não mapeadas; o reconhecedor devolve nulo, e a distinção pelo número (D-06) é o que impede `Delete` de virar página |
| `Ctrl+Home`, `Ctrl+End` | variam por emulador (`ESC [ 1 ; 5 H`, `ESC [ 1 ; 5 F`, outros) | Descartadas por variar; `g` e `G` já fazem o papel |

## 5. Página em posições, e não em linhas

A máquina de navegação anda por posições (título de seção, item), e um item pode ocupar mais de
uma linha desde a 016, com o dado secundário em linha própria. Uma página medida em posições
erraria sempre que houvesse dado secundário; uma página medida em linhas exige saber em que linha
cada posição mora. O compositor já sabe: `montar()` calcula a linha da seleção e o tamanho do bloco
dela. Estender `contextoDeNavegacao()` para devolver, por seção, a linha do título e as linhas dos
itens, é o caminho que não inverte dependência alguma: o laço já passa esse contexto à máquina a
cada tecla (D-07).

Com o mapa, página abaixo é: a primeira posição cuja linha é maior ou igual à linha corrente mais a
altura visível, ou a última posição quando não há tal; a janela avança a mesma altura, presa ao
fundo (D-08). Sem o mapa, a máquina cai em mover por posições, definido e testado, para que uma
chamada antiga continue válida.

## 6. Alternativas avaliadas e descartadas

| Alternativa | Por que não |
|---|---|
| Diferença entre quadros (redesenho incremental) | Exige guardar o quadro anterior e presume que a tela está como a ferramenta a deixou, o que o editor e a suspensão desmentem; a 014 já a recusou |
| Rastreio de mouse para controlar a roda | Recusado pelo usuário em 2026-09-21: custa a seleção nativa de texto |
| Temporizador para agrupar o redimensionamento | Relógio no laço e atraso visível; a escrita única já torna cada redesenho atômico |
| Consultar o emulador sobre sincronização (`CSI ? 2026 $ p`) | Violaria a D-07 da 016; o modo é inerte onde não existe |
| `Ctrl+F`/`Ctrl+B` como página | Colidem com hábitos de edição de linha e com `Ctrl+B` do tmux |
| Desenho no buffer principal como regime alternativo | Recusado pelo usuário em 2026-09-21: sem quem o use |

## 7. Fontes

- `src/cli/terminal.ts`, `src/cli/laco.ts`, `src/cli/teclas.ts`, `src/cli/navegacao.ts`,
  `src/cli/quadro/index.ts`, `src/cli/quadro/medidas.ts`, `src/cli/quadro/ajuda.ts`
- `tests/cli-terminal.spec.ts`, `tests/cli-navegacao.spec.ts`, `tests/cli-teclas.spec.ts`
- `_reversa_sdd/addenda/014-cli-do-processo.md`, `_reversa_sdd/addenda/016-visual-do-painel-cli.md`
- `_reversa_forward/014-cli-do-processo/interfaces/teclado.md`
- Captura em pseudoterminal de 2026-09-21 (`expect`, 80×24), descrita na seção 2.1
- Preferências do iTerm2 3.7.2 nesta máquina, lidas por `defaults read com.googlecode.iterm2`
- Documentação do produto de referência: `https://code.claude.com/docs/en/fullscreen.md`
- Binário do produto de referência, `~/.local/share/claude/versions/2.1.278`, por `strings`
- Especificação dos modos privados DEC e do modo 2026: `https://gist.github.com/christianparpart/d8a62cc1ab659194337d73e399004036`
- Sequências de controle do xterm: `https://invisible-island.net/xterm/ctlseqs/ctlseqs.html`
