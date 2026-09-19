# Data delta: vínculo entre spec e entrega, e conferências do onboarding

> Identificador: `010-vinculo-spec-e-conferencias`
> Data: `2026-09-19`
> Roadmap: `_reversa_forward/010-vinculo-spec-e-conferencias/roadmap.md`

Nada persistente muda: a extensão não grava. Este documento descreve o delta das estruturas em
memória e da carga `setProcess`, sobre o modelo vigente em `src/domain/types.ts` depois da 009.

## 1. Sonda: `FeatureFolderRead` (fora da carga)

`src/probe/features.ts`. Campos acrescentados ao fim:

| Campo | Tipo | Sentido |
|-------|------|---------|
| `legacyImpactMd` | `string \| null` | Texto do `legacy-impact.md`; nulo quando ausente ou não lido |
| `onboardingMd` | `string \| null` | Texto do `onboarding.md`; nulo quando ausente ou não lido |
| `naoLidos` | `string[]` | Nomes, entre os dois acima e os três já lidos, presentes na listagem da pasta cujo texto voltou nulo (acima de 256 KiB ou ilegível) |

A listagem da pasta, já feita para o teste de diretório, passa a ser guardada para decidir
presença. Com cinquenta pastas, a leitura abre no máximo cem arquivos novos.

## 2. Estrutura intermediária: `DeliveryLinks` (fora da carga)

`src/domain/delivery-link.ts`, produzida por `readDeliveryLinks(pastas)` e consumida por
`readHistory()` (estado) e por `readGreenfield()` (células).

```ts
type LinkReading = 'lido' | 'ausente' | 'nao-lido'

interface FolderLinks {
  pasta: string                // caminho relativo, chave
  estado: LinkReading
  arquivo: string | null       // caminho do legacy-impact.md, quando presente
  tabelas: number              // tabelas de impacto reconhecidas (D-02)
  celulas: string[]            // células distintas da coluna Componente, na ordem de leitura
}

type DeliveryLinks = Map<string, FolderLinks>
```

Funções puras exportadas, cada uma com suíte própria:

| Função | Entrada | Saída |
|--------|---------|-------|
| `impactTables(md)` | texto do arquivo | linhas da coluna `Componente` de todas as tabelas com colunas `arquivo afetado` e `componente`, e o número de tabelas |
| `declaresSpec(cell, spec)` | célula e nome de spec | `true` quando a célula declara a spec (D-03) |
| `soleComponent(cell)` | célula | o nome kebab quando a célula, sem crases ou negrito envolventes, é só ele (D-04); senão `null` |

## 3. Carga: `HistoryEntry`

Campos opcionais acrescentados **ao fim**:

| Campo | Tipo | Ausente significa |
|-------|------|-------------------|
| `vinculo?` | `DeliveryLinkState` | host anterior à 010: vínculo não lido |
| `conferencias?` | `ConferenceRecord` | host anterior à 010: conferências não lidas |

```ts
interface DeliveryLinkState {
  estado: 'lido' | 'ausente' | 'nao-lido'
  arquivo: string | null       // legacy-impact.md, relativo à raiz, para openFile
  tabelas: number              // 0 com estado 'lido' = arquivo sem tabela de impacto reconhecida
}

type ConferenceState =
  | 'sem-registro'     // onboarding ausente, ou sem a seção (RN-06): sem anomalia
  | 'vazio'            // seção com tabela, sem linha
  | 'lido'
  | 'nao-reconhecido'  // seção sem tabela com Data e Resultado: anomalia tabela-nao-reconhecida
  | 'nao-lido'         // onboarding presente e não lido: parcial, anomalia artefato-da-entrega-nao-lido
  | 'truncado'         // linhas acima de CONFERENCE_ROW_CAP: as primeiras cem são lidas

interface ConferenceLine {
  data: string | null
  marco: string | null
  item: string | null
  resultado: string | null     // exposto como escrito
  observacao: string | null
  registrada: boolean          // data e resultado com conteúdo que não seja traço isolado
}

interface ConferenceRecord {
  estado: ConferenceState
  arquivo: string | null       // onboarding.md, relativo à raiz
  secao: string | null         // título da seção como escrito
  linhas: ConferenceLine[]
  registradas: number
  total: number                // linhas existentes, mesmo acima do teto
}
```

Linha em que todas as células são traço isolado não é linha (EC-5UH7). Coluna `marco`, `item` ou
`observacao` ausente dá `null` no campo correspondente.

## 4. Carga: `ProjectHistory`

| Campo | Tipo | Sentido |
|-------|------|---------|
| `anomalias?` | `DeliveryAnomaly[]` | perdas do eixo, na forma `DisplayAnomaly` |

```ts
type DeliveryAnomalyCode =
  | 'tabela-nao-reconhecida'         // seção de registro sem tabela com Data e Resultado; detalhe: seção e cabeçalho encontrado
  | 'artefato-da-entrega-nao-lido'   // legacy-impact.md ou onboarding.md presente e não lido; detalhe: vínculo ou conferência parcial
```

O que **não** é anomalia, e de propósito: onboarding ausente, onboarding sem a seção,
`legacy-impact.md` ausente, `legacy-impact.md` sem tabela de impacto, célula sem nome de spec.

## 5. Carga: `PlannedComponent`

| Campo | Tipo | Sentido |
|-------|------|---------|
| `ligacoes?` | `ComponentLink[]` | uma por pasta ligada, na ordem de `pastas` |

```ts
interface ComponentLink {
  pasta: string
  origem: 'nome' | 'declarada'
  impacto: string | null       // legacy-impact.md da pasta, para a ligação declarada ser clicável
}
```

`pastas`, `situacao`, `marca`, `adendo` e `acoes` mantêm o sentido da 009, agora sobre o conjunto
de pastas ligadas pelos dois caminhos. Uma spec com pasta homônima só tem ligações `nome` (D-06).

## 6. Carga: `ProductPanorama`

| Campo | Tipo | Sentido |
|-------|------|---------|
| `semSpec?` | `UnspecifiedComponent[]` | componentes entregues sem spec, por nome |
| `vinculoParcial?` | `boolean` | alguma pasta tem vínculo `nao-lido` |

```ts
interface UnspecifiedComponent {
  nome: string
  situacao: ComponentSituation   // da pasta mais avançada, pela projeção da 009
  marca: FeatureMark
  pastas: string[]
  impactos: string[]             // legacy-impact.md de cada pasta, na mesma ordem
}
```

`convergidos` e `totalDeSpecs` não mudam de regra: componentes sem spec ficam fora dos dois.
`foraDoPlano` passa a excluir as pastas ligadas por declaração.

## 7. Literais e tetos em `src/domain/limits.ts`

| Nome | Valor | Uso |
|------|-------|-----|
| `LEGACY_IMPACT_FILE` | `'legacy-impact.md'` | sonda e caminho clicável |
| `ONBOARDING_FILE` | `'onboarding.md'` | sonda e caminho clicável |
| `CONFERENCE_ROW_CAP` | `100` | linhas de conferência por pasta |

## 8. Exemplos derivados das medições de 2026-09-19

| Entrada | Saída esperada |
|---------|----------------|
| Este repositório, 001 a 009 | toda spec liga só por `nome`; `semSpec` vazio; `foraDoPlano` com 006 a 009, como na 009; conferências `sem-registro` de 001 a 009 |
| `financas-ali`, 001 | declara `acerto-mensal`, `ajustes`, `fundacao-persistencia`, `ingestao-transacoes` e `telas-e-navegacao`; conferência `sem-registro` |
| `financas-ali`, 002 | seis tabelas de impacto; declara `ajustes`, `fundacao-persistencia`, `telas-e-navegacao`; `semSpec` com `acesso-e-identidade`, `assistente`, `operacao-de-producao`; conferência `lido` com vinte linhas |
| Célula `Verificação local (`_reversa_sdd/sdd/leitura-do-processo.md#7`)` | declara `leitura-do-processo`; `soleComponent` nulo |
| Célula `Tema (`#8`, RF-11)` | não declara; `soleComponent` nulo |

## 9. Migrações

Nenhuma. A regra de acréscimo da 002 cobre as duas direções do protocolo, detalhadas em
`interfaces/protocolo-webview.md`.
