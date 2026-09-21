# Delta de dados: visual do painel de linha de comando

> Feature: `016-visual-do-painel-cli`
> Data: `2026-09-21`
> Base: `src/cli/tipos.ts` como a 014 o entregou e a 015 o deixou. O projeto não tem modelo de dados
> extraído em `_reversa_sdd/`; a referência é o `data-delta.md` da 014, seção 3.

Nada aqui é persistido. Todas as estruturas são efêmeras, como a 014 declarou, e continuam sendo.

## 1. A linha e o quadro (alterados)

```ts
const PAPEIS = ['normal', 'titulo', 'acento', 'destaque', 'atenuado',
                'borda', 'concluido', 'atencao', 'falha'] as const
type Papel = (typeof PAPEIS)[number]

interface Trecho { texto: string; papel: Papel }

interface LinhaDoQuadro {
  texto: string          // permanece: a concatenação dos trechos
  trechos: Trecho[]      // novo
  selecionada: boolean   // novo: o que `enfase === 'selecionada'` dizia
  artefato: string | null
}

interface Quadro {
  linhas: LinhaDoQuadro[]
  alturaTotal: number
  linhaDeEstado: LinhaDoQuadro | null   // novo: nulo fora da interface viva
}
```

| Campo | Mudança | Observação |
|---|---|---|
| `LinhaDoQuadro.enfase` | **removido** | Com ele saem `ENFASES` e `Enfase`. De para: `titulo` vira trecho `titulo`; `selecionada` vira `selecionada: true` mais glifo no `acento` e texto no `destaque`; `atenuada` vira `atenuado`; `alerta` vira `atencao` |
| `LinhaDoQuadro.trechos` | novo | Invariante: `trechos.map(t => t.texto).join('') === texto`, presa por suíte |
| `LinhaDoQuadro.selecionada` | novo | Verdadeiro em no máximo uma linha do quadro |
| `Quadro.linhaDeEstado` | novo | Fora de `linhas`, para não rolar e não contar em `alturaTotal` |

## 2. O item e a seção (alterados)

```ts
type MarcaDeEstado = 'fechada' | 'proxima' | 'aberta'

interface ItemDaSecao {
  texto: string                  // agora sem glifo, sem caminho e, na decomposição, sem instante
  artefato: string | null
  alerta?: boolean
  marca?: MarcaDeEstado | null   // novo
  secundarios?: string[]         // novo: uma linha cada, atrás do glifo de continuação
}

type SecaoDoTerminal = SectionName | 'versoes'   // novo
```

`SecaoDesenhada.nome`, `EstadoDeNavegacao.secaoSelecionada`, `EstadoDeNavegacao.secoesFechadas` e
`ContextoDeNavegacao.secoes` passam de `SectionName` a `SecaoDoTerminal`. `SectionName` e
`sectionOrder()`, de `src/webview/domain/`, não mudam.

A marca descreve o que o glifo já dizia, e não julga: `proxima` e `fechada` continuam vindo de
`decompositionView` e de `bugsView`.

## 3. A apresentação (nova)

```ts
type GrauDeCor = 'nenhuma' | '16' | '256' | '24bits'
type Fundo = 'escuro' | 'claro'
type JogoDeGlifos = 'unicode' | 'sete-bits'

interface Apresentacao { grau: GrauDeCor; tema: Fundo; glifos: JogoDeGlifos }
```

`Configuracao` mantém `cor: boolean` e ganha `apresentacao: Apresentacao`. Invariante:
`cor === (apresentacao.grau !== 'nenhuma')`. `LeituraDeArgumentos`, no caso `config`, ganha
`aviso: string | null`.

`EntradaDoQuadro` ganha `apresentacao: { molduras: boolean; glifos: JogoDeGlifos }`. O compositor não
recebe grau nem tema: ele não decide cor.

## 4. Os glifos (novos, `src/cli/quadro/glifos.ts`)

| Função | Unicode | Sete bits | Colunas |
|---|---|---|---|
| Seção aberta | `▾` | `[-]` | 1 / 3 |
| Seção fechada | `▸` | `[+]` | 1 / 3 |
| Seleção | `❯` | `>` | 1 |
| Ação fechada | `✓` | `x` | 1 |
| Ação próxima | `→` | `*` | 1 |
| Ação aberta | `·` | `-` | 1 |
| Continuação | `⎿` | `` ` `` | 1 |
| Atenção | `!` | `!` | 1 |
| Separador de campos | `·` | `-` | 1 |
| Observação ativa | `●` | `(*)` | 1 / 3 |
| Observação por intervalo | `○` | `( )` | 1 / 3 |
| Há conteúdo acima, abaixo | `↑` `↓` | `^` `v` | 1 |
| Cantos e lados da moldura | `╭ ╮ ╰ ╯ ─ │` | `+ + + + - \|` | 1 |
| Reticências do recorte | `…` | `...` | 1 / 3 |

A marca `[+]`, que hoje vem **depois** do título da seção fechada, passa para **antes** dele, no lugar
do glifo de seção. O separador de campos alcança os ` · ` que `secoes.ts` e `bloqueio.ts` escrevem.

## 5. A paleta (nova, `src/cli/paleta.ts`)

| Papel | Escuro, 24 bits | Escuro, 256 | Claro, 24 bits | Claro, 256 | 16 cores |
|---|---|---|---|---|---|
| `acento` | `215,119,87` | 173 | `215,119,87` | 173 | 33 |
| `destaque` | `215,119,87` | 173 | `174,96,70` | 131 | 33, com peso |
| `atenuado` | `153,153,153` | 246 | `102,102,102` | 241 | intensidade reduzida |
| `borda` | `80,80,80` | 239 | `175,175,175` | 145 | intensidade reduzida |
| `concluido` | `78,186,101` | 71 | `44,122,57` | 28 | 32 |
| `atencao` | `255,193,7` | 214 | `150,108,30` | 94 | 93 |
| `falha` | `255,107,128` | 204 | `171,43,63` | 124 | 31 |
| `titulo` | sem cor, com peso | | | | |
| `normal` | sem cor | | | | |

Contrastes medidos em `investigation.md`, seção 2. `normal` e `titulo` usam a cor de primeiro plano do
próprio terminal, de modo que a ferramenta nunca escreve branco sobre fundo que não conhece.

## 6. A seção "Versões e construção" (nova)

| Linha | Origem do valor | Onde estava |
|---|---|---|
| `Reversa: <versão>` | `discovery.version` | cabeçalho |
| `Modelo herdado: <revisão>` | `revisionLabel(inheritedRevision)` | cabeçalho |
| `Extensão: <versão>` | `extensionVersion` | cabeçalho |
| `Construída de: <revisão>` | `revisionLabel(builtFromCommit)` | cabeçalho |
| Desfecho da conferência, ou a frase de conferência desligada | `updateLabel`, ou o literal de hoje | cabeçalho |
| As linhas de `linhasDaProcedencia`, ao fim (D-16) | `src/cli/quadro/procedencia.ts`, sem mudança | sob o cabeçalho |

Rótulos e funções de origem são os de hoje. `recolhivel: true`, sem contagem, sem item navegável com
artefato. Nome: `versoes`. Título: "Versões e construção". Módulo: `src/cli/quadro/secao-de-versoes.ts`.
A palavra procedência fica reservada à origem da leitura: o tipo `Procedencia` e o módulo
`quadro/procedencia.ts` não mudam de nome nem de conteúdo.

## 7. O que não muda

- `SetProcessData`, o protocolo e o documento de `--dados`, campo por campo e byte a byte
- `EffectiveEntry`, `nextEntry`, `sessionMessages` e tudo em `src/webview/domain/`
- `TECLAS`, `EFEITOS`, `PROCEDENCIAS`, `Observacao`, `Transicao`
- `CODIGOS`

## 8. Migração

Nenhuma. Não há dado gravado em formato antigo. O único arquivo novo com dado é
`amostras/painel/estado.json`, estado fixo de amostra, gerado uma vez e versionado.
