# Contrato: teclado da interface viva, adendo da 017

> Feature `017-tela-cheia-do-painel`. Adendo à tabela confirmada pelo usuário em 2026-09-20 e
> registrada em `_reversa_forward/014-cli-do-processo/interfaces/teclado.md`. As decisões abaixo
> foram tomadas pelo usuário em 2026-09-21, na sessão de esclarecimento desta feature.

## 1. O que não muda

Toda linha da tabela da 014 continua valendo, com o mesmo efeito. O princípio também: o teclado é o
caminho completo, e **não há mouse**. A roda do trackpad e do mouse funciona onde o emulador a
converte em setas na tela alternativa, o que iTerm2, Terminal.app (com "Scroll alternate screen"),
VS Code, kitty e Ghostty fazem por padrão; a ferramenta não liga rastreio de mouse, para que a
seleção nativa de texto do emulador continue funcionando sem tecla modificadora.

## 2. As teclas que entram

| Tecla | Bytes | Tecla nomeada | Efeito | Razão da escolha |
|---|---|---|---|---|
| `PgDn` | `ESC [ 6 ~` | `pagina-abaixo` | Move a seleção para a primeira linha navegável a uma janela útil abaixo, ou para a última; a janela avança uma altura útil, presa ao fundo | Convenção universal de paginador; é a função de tela cheia que faltava ao teclado |
| `PgUp` | `ESC [ 5 ~` | `pagina-acima` | Simétrico, até a primeira linha navegável e o topo | Idem |
| `Ctrl+D` | `0x04` | `meia-pagina-abaixo` | Meia janela útil abaixo, na mesma mecânica | Hábito de `less` e de `vim`; em modo bruto é um byte comum, sem semântica de fim de entrada |
| `Ctrl+U` | `0x15` | `meia-pagina-acima` | Meia janela útil acima | Idem |

Nenhuma das quatro produz efeito nomeado além de `nenhum`: são movimento, como as setas.

## 3. Duas arestas

**As sequências com til.** `PgUp` e `PgDn` chegam como `ESC [ <número> ~`, e o mesmo formato serve a
`Insert` (`2`), `Delete` (`3`), `Home` (`1`) e `End` (`4`) em muitos emuladores. O reconhecedor lê o
número entre o colchete e o til e mapeia só `5` e `6`; qualquer outro devolve nulo, e a tecla não faz
nada. Continua valendo a regra da 014 de reconhecer por bloco e sem temporizador.

**Página em linhas, seleção em posições.** A seleção anda por posições (título de seção ou item), e
um item pode ocupar mais de uma linha. A página é medida em linhas da janela útil, e por isso a
máquina de navegação recebe do compositor, junto do contexto que já recebia, a linha em que cada
posição mora. Sem essa informação, a máquina move uma página como `alturaVisivel` posições, o que
mantém definido o comportamento de qualquer chamada antiga.

## 4. O que nenhuma tecla faz

- Escrever arquivo
- Editar o processo do Reversa
- Disparar agente
- Ligar rastreio de mouse

## 5. Como a decisão entra no código

Como na 014: os bytes viram tecla nomeada em `src/cli/teclas.ts`, função pura; a tecla nomeada entra
em `src/cli/navegacao.ts`, que devolve estado novo e efeito nomeado; a ajuda em
`src/cli/quadro/ajuda.ts` transcreve esta tabela; e uma suíte sobre `TABELA_DE_AJUDA`, que confere
as quatro teclas com a promessa de cada uma e a ausência de "mouse", é o que mantém as três de
acordo (T024). A amostra `amostras/painel/ajuda.txt` acompanha a tabela e é regenerada.
