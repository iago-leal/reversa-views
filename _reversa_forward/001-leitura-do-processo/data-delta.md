# Data Delta: Leitura do processo do Reversa

> Identificador: `001-leitura-do-processo`
> Data: `2026-09-09`
> Roadmap: `_reversa_forward/001-leitura-do-processo/roadmap.md`
> Confidência: 🟢 CONFIRMADO, 🟡 INFERIDO, 🔴 LACUNA

## 1. Resumo

Nada é persistido. A camada recebe uma raiz de workspace e devolve valores em memória; não há
banco, arquivo de saída, cache nem índice. O delta abaixo é conceitual: mapeia o modelo que a spec
descreveu em português para os tipos que chegam prontos da origem, e registra o único tipo que sai.

## 2. Mapeamento entre a spec e os tipos herdados

| Estrutura na spec (`leitura-do-processo.md#9`) | Tipo herdado | Onde vive | Confidência |
|---|---|---|---|
| `RetratoBruto` | `ReversaSnapshot` | `reversa-domain/src/index.ts` | 🟢 |
| `ProcessoDoReversa` | `ReversaProcess` | `reversa-domain/src/index.ts` | 🟢 |
| Relatório da sonda (seção 8 da spec) | `ProbeReport`, embrulhado em `ProbeResult` junto com o retrato | `reversa-probe/src/snapshot.ts` | 🟢 |
| Recusa de caminho fora da raiz | `Refusal { path, reason: 'fora-da-raiz' }` | `reversa-probe/src/snapshot.ts` | 🟢 |
| Anomalia | `Anomaly`, acumulada por `AnomalyLog` | `reversa-domain/src/anomaly.ts` | 🟢 |

### 2.1 `ReversaSnapshot` (o retrato bruto)

Catorze campos, todos texto ou lista, todos anuláveis onde a ausência tem sentido:

| Campo | Fonte no disco | Ausência (`null`) significa |
|---|---|---|
| `stateJson` | `.reversa/state.json` | Reversa não instalado |
| `configJson` | `.reversa/reversa-config.json` | política ausente, tratada como fechada |
| `activeRequirementsJson` | `.reversa/active-requirements.json` | sem feature ativa |
| `activeIdeationJson` | `.reversa/active-ideation.json` | sem sessão de ideação |
| `featureDirFiles` | listagem da pasta apontada por `feature-dir` | pasta ausente ou recusada; lista vazia é pasta recém-criada |
| `ideationDirFiles` | listagem da pasta apontada por `session-dir` | idem |
| `actionsMd`, `requirementsMd`, `progressJsonl`, `legacyImpactMd`, `regressionWatchMd` | arquivos dentro da pasta da feature | arquivo ausente, ilegível ou acima do teto |
| `migrationStateJson` | `<output>/migration/.state.json` | sem migração |
| `addendaFiles`, `addendaBodies` | `<output>/addenda/`, até 50 em ordem de nome | listas vazias, nunca `null` |

A distinção entre `null` e lista vazia em `featureDirFiles` é regra de negócio (RN-06 do
requirements), não estilo.

### 2.2 `ReversaProcess` (o processo tipado)

| Campo | Eixo | Exibido na primeira versão? |
|---|---|---|
| `installed` | identidade | sim |
| `discovery` (`DiscoveryState`: fases, checkpoints, pastas resolvidas, projeto) | descoberta e identidade | sim |
| `policy`, `writableFolders` | política de escrita no legado | sim |
| `forward` (`ForwardState`: estágio, feature, ações, dúvidas, pausadas, adendo) | ciclo forward e bloqueio humano | sim |
| `progress` (`ProgressTrail`) | trilha de execução | não, lido mesmo assim (RF-18) |
| `impact` (`ImpactState`) | impacto no legado | não, lido mesmo assim |
| `watch` (`WatchState`) | regressão vigiada | não, lido mesmo assim |
| `migration` (`MigrationState`) | migração | não, lido mesmo assim |
| `ideation` (`IdeationState`) | ideação | não, lido mesmo assim |
| `migrationStatePath` | caminho resolvido para a sonda | interno |
| `anomalies` | diagnóstico | sim |

A spec fala em oito eixos; a contagem aqui inclui a trilha de progresso, que a spec agrupa com o
ciclo forward. Nenhum campo é adicionado, removido ou renomeado pela cópia.

### 2.3 `ProbeReport` (o relatório da sonda)

`workspace`, `featureDir` e `sessionDir` (as pastas realmente lidas, ou `null`), `refusals` e
`truncated`. Corresponde ao eixo de diagnóstico "relatório da sonda" do PRD, seção 4.

## 3. Campos novos

Nenhum.

## 4. Campos removidos

| Tipo | Motivo |
|---|---|
| `ReversaProcessWire`, `ReversaAnswer`, `ReversaAnswerBody` (em `route.ts`) | Tipos de transporte HTTP da origem, descartados com a rota (RF-15). A extensão consome `ProbeResult` em processo; o formato de mensagem para a webview é decisão da feature 002 |

## 5. Constantes que são contrato

| Constante | Valor | Onde | Decisão que a sustenta |
|---|---|---|---|
| `REVERSA_FILE_CAP` | 262.144 bytes (256 KB) | `reversa-probe/src/files.ts` | Esclarecimento 1, mantida como herdada |
| `REVERSA_ADDENDA_CAP` | 50 | `reversa-probe/src/snapshot.ts` | RNF de limite de recurso |
| `PHASES` | as cinco fases canônicas, em ordem | `reversa-domain/src/state.ts` | RN-01 |

## 6. Migrações necessárias

Nenhuma. Não há estado anterior, e a camada não escreve.

## 7. Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-09-09 | Versão inicial gerada por `/reversa-plan` | reversa |
