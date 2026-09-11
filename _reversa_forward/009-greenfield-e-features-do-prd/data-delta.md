# Delta de dados: greenfield e features do PRD

> Identificador: `009-greenfield-e-features-do-prd`
> Data: `2026-09-11`
> Roadmap: `_reversa_forward/009-greenfield-e-features-do-prd/roadmap.md`
> Confidência: 🟢 CONFIRMADO, 🟡 INFERIDO, 🔴 LACUNA

## 1. O que muda, em uma frase

O painel passa a ler, além do que já lia, a presença de quatro artefatos e a lista de uma pasta em
`_reversa_sdd/`, o corpo de dois deles, e um campo de `state.json` que o leitor herdado ignora; e
tudo o que deriva disso vive em memória, viaja num campo novo do protocolo e nunca é gravado.

## 2. Nada de persistente muda

A extensão continua sem escrever arquivo algum. Não há esquema novo em disco, não há migração, e o
`state.json`, o `active-requirements.json` e os artefatos de `_reversa_sdd/` seguem sendo escritos
apenas pelos skills do Reversa. O que este documento descreve é a forma do que o host monta em
memória e envia à tela, e o que a tela deriva dela para desenhar (🟢, RN-09 e RF-09).

## 3. O que é lido do disco, e o que fica de fora

Tudo abaixo relativo a `process.discovery.outputFolder`, que o leitor herdado já resolve a partir de
`output_folder` de `state.json`, com `_reversa_sdd` como padrão (🟢).

| Caminho | Como é lido | Para quê |
|---------|-------------|----------|
| `newproject-brief.md` | presença, e corpo por `readText` sob `REVERSA_FILE_CAP` | estágio `aberto`; linha de resumo (primeira frase de "Ideia original") |
| `ideation.md` | presença apenas | estágio `ideado` |
| `personas.md` | presença apenas | estágio `pesquisado` |
| `prd.md` | presença, e corpo por `readText` sob `REVERSA_FILE_CAP` | estágio `redigido`; escopo declarado; cenário |
| `sdd/` | `listNames`, filtrando `*.md`, ordem de nome, teto `SPEC_CAP` | estágio `especificado`; componentes planejados; cenário |
| `architecture.md`, `domain.md` | presença apenas | cenário legado ou misto (RN-03) |
| `.reversa/state.json` | nenhuma leitura nova: o texto já viaja em `snapshot.stateJson` | metadado `newproject_progress` |

Fica de fora, e é decisão e não esquecimento (🟢, RF-22 e D-11):

- o corpo de `ideation.md`, de `personas.md` e de cada spec, inclusive o campo `Status`;
- `addenda/`, que o histórico já lê por conta própria;
- `.reversa/active-ideation.json`, do brainstorm, que fica para feature futura (D-20);
- qualquer arquivo em `sdd/` que não termine em `.md`, que é ignorado sem anomalia.

Um corpo acima do teto de 256 KiB não é lido pela metade: `readText` devolve nulo, e o eixo declara
o caminho em `truncados`, para o relatório da sonda somar ao que já declara.

## 4. Formas novas em memória

Todas em `src/domain/types.ts`, ao lado das de histórico e de bugs, com nomes em português nos campos
como a casa faz desde a 006 (🟢).

### 4.1 O estágio físico e o metadado

```ts
/** The six physical stages of the greenfield pipeline, in order (RF-03). */
export const GREENFIELD_STAGES = [
  'ausente',       // nenhum dos quatro artefatos
  'aberto',        // newproject-brief.md
  'ideado',        // + ideation.md
  'pesquisado',    // + personas.md
  'redigido',      // + prd.md
  'especificado',  // + ao menos uma spec em sdd/
] as const
export type GreenfieldStage = (typeof GREENFIELD_STAGES)[number]

/** The four scenarios of RN-03, by the anchor rule of /reversa-coding. */
export const PROJECT_SCENARIOS = ['legado', 'greenfield', 'misto', 'sem-ancora'] as const
export type ProjectScenario = (typeof PROJECT_SCENARIOS)[number]

/** What `newproject_progress` said, read tolerantly; null when absent or unreadable. */
export interface GreenfieldMetadata {
  modo: string | null            // "guiado" | "expresso" | outro, desenhado cru se desconhecido
  estagio: string | null         // o token do campo `stage`, cru
  iniciadoEm: string | null      // ISO, convertido só na tela
  ultimoCheckpointEm: string | null
  concluidos: string[]           // `completed_stages`, crus
  brief: string | null
}
```

O estágio físico é o maior contíguo presente: `prd.md` sem `personas.md` deixa o estágio em
`ideado` e abre a anomalia de sequência (D-02). Cada artefato tem presença própria no eixo, para o
cartão de origem desenhar as quatro etapas sempre, com `concluído`, `corrente` ou `pendente`.

### 4.2 O eixo

```ts
export interface GreenfieldAxis {
  cenario: ProjectScenario
  estagio: GreenfieldStage
  /** Presence of each artifact, by name of limits.ts; the sdd count stands for the specs. */
  artefatos: { brief: boolean; ideacao: boolean; personas: boolean; prd: boolean; specs: number }
  metadado: GreenfieldMetadata | null
  /** One line, derived in the three steps of D-12; null when neither source had it. */
  resumo: string | null
  /** Path relative to the observed root of each artifact present, for openFile. */
  caminhos: { brief: string | null; ideacao: string | null; personas: string | null; prd: string | null }
  panorama: ProductPanorama
  anomalias: GreenfieldAnomaly[]
  truncados: string[]
}
```

Um host que não realizou a leitura não envia o campo: `greenfield` ausente em `SetProcessData`
significa "leitura não realizada", e a tela o distingue de um eixo com `cenario: 'legado'` e de um
eixo com `cenario: 'greenfield'` e `specs: 0` (RN-08, os três vazios).

### 4.3 O panorama

```ts
/** Where one planned component stands, projected from the history (D-08). */
export const COMPONENT_SITUATIONS = ['planejada', 'em-andamento', 'entregue', 'convergida'] as const
export type ComponentSituation = (typeof COMPONENT_SITUATIONS)[number]

export interface PlannedComponent {
  nome: string                       // basename da spec sem `.md`
  spec: string                       // caminho relativo à raiz, para openFile
  situacao: ComponentSituation
  marca: FeatureMark                 // 'ativa' | 'pausada' | 'nenhuma', do histórico
  pastas: string[]                   // TODAS as pastas casadas, na ordem do histórico; vazio se planejada
  adendo: string | null              // o adendo em vigor da pasta mais avançada, quando há
  acoes: { total; fechadas; abertas; emendas } | null   // da pasta mais avançada; nulo se planejada
}

/** A feature folder the plan did not foresee (RN-05). */
export interface UnplannedFeature {
  pasta: string
  id: string | null
  nomeCurto: string | null
  situacao: FeatureSituation         // a do histórico, sem projeção
  marca: FeatureMark
}

/** One top-level bullet of the PRD scope section (RN-14). */
export interface ScopeItem {
  grupo: string | null               // o rótulo em negrito imediatamente acima, sem o dois-pontos final
  nome: string                       // texto antes do primeiro dois-pontos, ou primeira frase
  detalhe: string | null             // o que vem depois do dois-pontos ou da primeira frase, com a quebra dura desfeita
  selo: string | null                // 🟢 🟡 🔴 retirado do início ou do fim do item; nulo sem selo
}

export interface ProductPanorama {
  componentes: PlannedComponent[]    // já cruzados; a ORDEM de exibição é da tela (D-15)
  foraDoPlano: UnplannedFeature[]
  escopo: ScopeItem[]
  escopoEncontrado: boolean          // falso quando o PRD foi lido e nenhuma seção de escopo foi reconhecida
  /** How many specs exist in sdd/, even when not all were read (SPEC_CAP). */
  totalDeSpecs: number
  truncado: boolean
  convergidos: number                // N de "N de M componentes planejados convergidos"
}
```

A projeção de situação é uma tabela de quatro linhas, e é a única regra nova sobre o histórico:

| `HistoryEntry.situacao` | `PlannedComponent.situacao` |
|-------------------------|-----------------------------|
| `convergida` | `convergida` |
| `entregue-sem-adendo` | `entregue` |
| `em-aberto` | `em-andamento` |
| `sem-acoes` | `em-andamento` |
| sem entrada casada | `planejada` |

### 4.4 O casamento de nomes

A chave de ambos os lados é o nome após minúsculas e remoção de diacríticos, por `normalize('NFD')`
e retirada da faixa combinante, o mesmo passo de `normalizeCell` do herdado, sem a substituição de
pontuação que aquela faz, porque o hífen do nome é significativo (🟢, D-07). Do lado das specs a
chave é o basename sem `.md`; do lado do histórico é `nomeCurto`, e uma entrada com `nomeCurto` nulo
nunca casa e vai para "fora do plano" com o caminho da pasta como nome.

Duas specs que colidam após normalização são uma anomalia `spec-duplicada`, e só a primeira em ordem
de nome entra na lista.

### 4.5 Os códigos de anomalia do eixo

```ts
export type GreenfieldAnomalyCode =
  | 'estagio-greenfield-divergente'   // metadado fora do conjunto aceito para o estágio físico (RN-02)
  | 'sequencia-greenfield-com-buraco' // artefato posterior presente sem o anterior (D-02)
  | 'escopo-do-prd-nao-encontrado'    // prd.md lido e sem seção de escopo reconhecível (RN-14)
  | 'spec-duplicada'                  // duas specs com a mesma chave normalizada (4.4)
  | 'metadado-greenfield-malformado'  // newproject_progress presente e que não é objeto (RF-02)
  | 'artefato-greenfield-truncado'    // brief ou PRD presente e não lido por estar acima do teto, ou escopo parado no teto de itens

export interface GreenfieldAnomaly {
  file: string
  code: GreenfieldAnomalyCode
  detail?: string
}
```

A forma é a de `DisplayAnomaly`, que a seção de anomalias já recebe desde a 008, e `readingIntegrity()`
passa a somar `greenfield.anomalias.length` aos dois outros contadores (D-19). Nada aqui toca a união
fechada `AnomalyCode` do herdado.

Reconciliado na execução (2026-09-11): os dois últimos códigos entraram durante a fase de testes,
porque o plano os descrevia em prosa (metadado com tipo errado; corpo acima do teto) sem lhes dar
nome, e a seção de anomalias precisa de um código por perda. `PlannedComponent` ganhou `pastas[]` e
`acoes`, `UnplannedFeature` ganhou `id`, `ScopeItem` ganhou `detalhe` e `selo`, e `ProductPanorama`
ganhou `escopoEncontrado`, tudo pelo mesmo motivo: a tela precisava desenhar o que o plano só nomeava.

O que NÃO é anomalia, por decisão (🟢): PRD ausente; `sdd/` ausente ou vazia; `newproject_progress`
ausente, porque projeto legado não o tem; metadado com `mode` ou `stage` de valor desconhecido, que a
tela desenha cru e marca como não reconhecido, pela regra de `lookUp`.

## 5. Limites e literais novos

Em `src/domain/limits.ts`, ao lado de `BUG_CAP` e `BUGS_FOLDER`, pela mesma razão daqueles (🟢, D-18):

| Constante | Valor | Papel |
|-----------|-------|-------|
| `NEWPROJECT_BRIEF_FILE` | `newproject-brief.md` | estágio `aberto`, resumo |
| `IDEATION_FILE` | `ideation.md` | estágio `ideado` |
| `PERSONAS_FILE` | `personas.md` | estágio `pesquisado` |
| `PRD_FILE` | `prd.md` | estágio `redigido`, escopo, cenário |
| `SDD_FOLDER` | `sdd` | specs, cenário |
| `ARCHITECTURE_FILE`, `DOMAIN_FILE` | `architecture.md`, `domain.md` | cenário legado |
| `SPEC_CAP` | 50 | teto de specs lidas, declarado quando corta |
| `SCOPE_ITEM_CAP` | 50 | teto de itens de escopo, declarado quando corta |

Os sete literais são duplicação em relação ao que os skills `/reversa-new`, `/reversa-drafter` e
`/reversa-spec-sdd` escrevem, e ao que a regra de âncora de `/reversa-coding` confere. A duplicação
é aceita e declarada: nenhum pacote herdado exporta esses nomes, e escrevê-los em exatamente um
lugar do lado local é o que torna uma renomeação futura uma edição de uma linha.

## 6. O leitor restrito do escopo do PRD

A regra é RN-14, e o que segue é a mecânica (🟡, D-10; a marca é por depender da forma do PRD que
versões futuras do `/reversa-drafter` produzam, não por dúvida sobre este projeto).

1. Divida o corpo em seções de nível dois. `splitSections` do herdado serve se a chave que ela
   devolve permitir normalizar o título; caso contrário, a divisão fica local, com a mesma expressão.
2. Escolha a primeira seção cujo título, em minúsculas e sem diacríticos, contenha `escopo` e não
   contenha `nao-objetivos`, `nao objetivos` nem `out`. Neste projeto é "Escopo (in)", na linha 60.
3. Sem seção assim, com `prd.md` presente, abra `escopo-do-prd-nao-encontrado` e devolva lista vazia.
4. Percorra a seção linha a linha. Uma linha que comece por `**` e termine por `**` vira o grupo
   corrente. Uma linha que comece por `- ` ou `* ` sem recuo é um item; linhas recuadas são
   subitens, e são ignoradas.
5. Para cada item, retire um selo `🟢`, `🟡` ou `🔴` no início ou no fim, e retire negrito. O nome é o
   texto antes do primeiro dois-pontos; sem dois-pontos, é a primeira frase, cortada no primeiro
   ponto final seguido de espaço ou fim de linha.
6. Pare em `SCOPE_ITEM_CAP` itens e declare `truncado`.

O leitor não interpreta Markdown além disso, e não tenta casar item com pasta nem com spec: o escopo
é prosa listada, sem situação, como RN-04 fixou.

## 7. O que a leitura não faz

- Não avança nem corrige estágio: com `prd.md` sem `personas.md`, o estágio fica em `ideado` e a
  anomalia nomeia o buraco; é o mantenedor quem roda o agente.
- Não lê o `Status` das specs, nem `decisions.decomposicao` do metadado.
- Não considera o brainstorm; o cartão de origem apenas reserva o lugar (D-20).
- Não produz situação para itens do escopo.
- Não grava, em nenhum ramo, inclusive nas anomalias.
