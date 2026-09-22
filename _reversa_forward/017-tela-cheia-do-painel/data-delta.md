# Data delta: tela cheia do painel de linha de comando

> Identificador: `017-tela-cheia-do-painel`
> Data: `2026-09-21`
> Modelo de referência: `_reversa_sdd/sdd/painel-do-processo.md#9-modelo-de-dados`, com os adendos 014 e 016

## 1. Resumo

Nada é persistido, nada é migrado, e a carga do host não muda um campo. O que muda são três
estruturas efêmeras da ferramenta de terminal, todas em `src/cli/`: a união de teclas nomeadas, o
contexto de navegação e a tabela de ajuda. Nenhuma delas atravessa o fim do processo, por força da
RN-05 da 014, e nenhuma aparece na saída de dados.

## 2. Teclas nomeadas (`src/cli/tipos.ts`, `TECLAS`)

| Campo | Antes | Depois | Tipo de mudança |
|---|---|---|---|
| `TECLAS` | quinze nomes | dezenove nomes: entram `pagina-acima`, `pagina-abaixo`, `meia-pagina-acima`, `meia-pagina-abaixo` | acréscimo |
| `TeclaNomeada` | união dos quinze | união dos dezenove | acréscimo |
| `EFEITOS` | cinco efeitos | os mesmos cinco; as teclas novas produzem `nenhum` | sem mudança |

A ordem dos nomes existentes não muda; os novos entram depois de `fim`, ao lado das teclas de
movimento que já existem, e a frase de comentário "quinze teclas" é atualizada.

## 3. Contexto de navegação (`src/cli/navegacao.ts`, `ContextoDeNavegacao`)

| Campo | Antes | Depois | Tipo de mudança |
|---|---|---|---|
| `secoes` | as doze seções na ordem do terminal | idem | sem mudança |
| `itens` | mapa seção → contagem de itens | idem | sem mudança |
| `alturaTotal` | linhas do quadro inteiro | idem | sem mudança |
| `alturaVisivel` | linhas da janela útil | idem | sem mudança |
| `linhas` | inexistente | **opcional**: mapa seção → `{ titulo: number; itens: readonly number[] }`, com a linha do título e a linha principal de cada item no quadro inteiro | acréscimo |

Regras do campo novo:

- É produzido por `contextoDeNavegacao()` em `src/cli/quadro/index.ts`, da mesma montagem que já
  calcula `indiceDaSelecao()` e `blocoDaSelecao()`, de modo que a linha da seleção corrente é
  sempre uma entrada do mapa.
- Toda seção presente em `secoes` tem entrada, mesmo fechada (o título está sempre desenhado) e
  mesmo sem itens (`itens: []`). Seção fechada tem `itens: []`, porque os itens não estão na tela e
  não são posição.
- Ausente, a máquina de navegação move a página por posições: `alturaVisivel` posições para a
  página, metade para a meia página. É a queda definida para chamadas antigas e para as suítes que
  constroem o contexto por `Partial`.
- Invariante conferida por suíte: para o estado corrente, `linhas` da seção selecionada, no título ou
  no item selecionado, é igual a `indiceDaSelecao()`.

## 4. Tabela de ajuda (`src/cli/quadro/ajuda.ts`, `TABELA_DE_AJUDA`)

| Posição | Tecla | Efeito | Escrita em sete bits |
|---|---|---|---|
| depois de `g / G` | `PgUp / PgDn` | Move a seleção uma janela acima e abaixo | idem |
| em seguida | `Ctrl+U / Ctrl+D` | Move a seleção meia janela acima e abaixo | idem |

As duas entradas usam só caracteres de sete bits, e por isso não têm `emSeteBits`. A amostra
`amostras/painel/ajuda.txt`, que transcreve a tabela, é regenerada com as duas linhas (T020); é a
única amostra que a feature muda.

## 5. Sequências do terminal (`src/cli/terminal.ts`)

Não são dados, mas são o único lugar em que valores novos entram, e vale listá-los:

| Constante | Sequência | Uso |
|---|---|---|
| `SINCRONIZAR` | `CSI ?2026h` | Abre cada redesenho |
| `DESSINCRONIZAR` | `CSI ?2026l` | Fecha cada redesenho; também na restauração |
| `CANTO` | `CSI H` | Primeira escrita de cada redesenho |
| `APAGAR_LINHA` | `CSI 2K` | Antes do texto de cada linha, e antes da linha de estado |
| `APAGAR_ABAIXO` | `CSI J` | Depois da última linha do corpo |
| `LIMPAR` (`CSI 2J` `CSI H`) | removida | Nenhum uso restante |

## 6. Estado de navegação (`src/cli/tipos.ts`, `EstadoDeNavegacao`)

Sem mudança de forma. `primeiraLinhaVisivel` passa a ser escrito também pelas transições de página
e meia página, como já é por `topo` e `fim`.

## 7. Saída de dados, passada e amostras

Sem mudança. `src/cli/dados.ts`, `src/cli/passada.ts` e `src/cli/amostras.ts` não são tocados, e as
suítes respectivas passam sem linha alterada. Em `amostras/painel/`, as dez amostras de quadro não
mudam, porque vestem linhas por `vestirLinha` e não passam pelo redesenho do terminal; a da ajuda,
`ajuda.txt`, muda, porque transcreve conteúdo (a tabela da seção 4), e é regenerada pela T020. É a
exceção nomeada na RN-01 e no RF-16.

## 8. Migrações

n/a.
