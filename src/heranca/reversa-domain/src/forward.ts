/* HERDADO: não editar sem declarar a adaptação em src/heranca/PROCEDENCIA.md
 * origem:      scrum-harness (https://github.com/iago-leal/scrum-harness)
 * caminho:     packages/reversa-domain/src/forward.ts
 * revisão:     420305daa6cdd10858b720a34cb8db67d8e5c5e9 (2026-09-08)
 * copiado em:  2026-09-09
 * adaptações:  nenhuma
 */
/**
 * The physical stage of the active forward feature (comp-72 R8, R9).
 *
 * REVERSA is emphatic that the stage is read from the artifacts on disk and
 * never from a self-declared field: `current-stage` in
 * `active-requirements.json` is "metadado informativo" and is deliberately
 * ignored here.
 *
 * The `done` split is what a monitoring panel exists for. A feature whose
 * actions are all ticked is not finished from the project's point of view
 * until `/reversa-sync` folds it back into the extraction as an addendum;
 * until then the specs still describe the old system. `done-sem-adendo` is
 * that actionable gap, and a superseded addendum falls back into it.
 * @module @scrum-harness/reversa-domain/forward
 */

import { countDoubts, scanActions } from './actions.ts'
import { AnomalyLog } from './anomaly.ts'
import type { Anomaly } from './anomaly.ts'
import { asRecord, asString, parseJsonSafe } from './json.ts'

/** Where the active feature stands, read from its artifacts. */
export type Stage =
  | 'sem-feature-ativa'
  | 'vazio'
  | 'requirements'
  | 'plan'
  | 'coding-em-progresso'
  | 'done-sem-adendo'
  | 'done-com-adendo'

/** A feature parked by `/reversa-requirements` for `/reversa-resume` to pick up. */
export interface PausedFeature {
  featureDir: string | null
  featureId: string | null
  shortName: string | null
  pausedAt: string | null
  pausedFromStage: string | null
}

/** Everything the probe read for the forward cycle. */
export interface ForwardInput {
  activeRequirementsJson: string | null
  featureDirFiles: string[] | null
  actionsMd: string | null
  requirementsMd: string | null
  addendaFiles: string[]
  addendaBodies: Record<string, string>
  outputFolder: string
}

/** The forward cycle as the panel shows it. */
export interface ForwardState {
  stage: Stage
  featureDir: string | null
  featureId: string | null
  shortName: string | null
  startedAt: string | null
  doubts: number
  actions: ReturnType<typeof scanActions>
  pausedFeatures: PausedFeature[]
  addendum: string | null
  anomalies: Anomaly[]
}

const FILE = '.reversa/active-requirements.json'
/** The line `/reversa` appends to an addendum once a re-extraction supersedes it. */
const SUPERSEDED = /^\s*Superado pela re-extração de\s/im

/** Reader for the forward cycle. */
export const ForwardContract = {
  /**
   * Classify the active feature by its artifacts (R8) and split `done` (R9).
   * @param input - what the probe read from disk.
   */
  read(input: ForwardInput): ForwardState {
    const log = new AnomalyLog()
    const { value, cause } = parseJsonSafe(input.activeRequirementsJson)
    const record = asRecord(value)

    const actions = scanActions(input.actionsMd)
    log.addAll(actions.anomalies)

    const base = {
      featureDir: record === null ? null : asString(record['feature-dir']),
      featureId: record === null ? null : asString(record['feature-id']),
      shortName: record === null ? null : asString(record['short-name']),
      startedAt: record === null ? null : asString(record['started-at']),
      doubts: countDoubts(input.requirementsMd),
      actions,
      pausedFeatures: record === null ? [] : readPaused(record['paused-features']),
      addendum: null as string | null,
    }

    // No active feature: the file is missing, unreadable, or points nowhere.
    if (cause !== null || record === null || input.featureDirFiles === null) {
      return { ...base, stage: 'sem-feature-ativa', anomalies: log.list() }
    }

    const files = new Set(input.featureDirFiles)
    if (!files.has('requirements.md')) return { ...base, stage: 'vazio', anomalies: log.list() }
    if (!files.has('roadmap.md')) return { ...base, stage: 'requirements', anomalies: log.list() }
    if (!files.has('actions.md')) return { ...base, stage: 'plan', anomalies: log.list() }

    // Any open checkbox anywhere — amendments included — reopens the feature.
    if (actions.hasOpen) return { ...base, stage: 'coding-em-progresso', anomalies: log.list() }

    // Every action closed (vacuously so when there are none): split on the addendum.
    const addendum = findAddendum(base.featureId, input)
    if (addendum === null) return { ...base, stage: 'done-sem-adendo', anomalies: log.list() }

    const body = input.addendaBodies[addendum] ?? ''
    if (SUPERSEDED.test(body)) {
      log.add(`${input.outputFolder}/addenda/${addendum}`, 'adendo-superado')
      return { ...base, stage: 'done-sem-adendo', addendum, anomalies: log.list() }
    }
    return { ...base, stage: 'done-com-adendo', addendum, anomalies: log.list() }
  },
}

/** Find the feature's addendum by the `<feature-id>-…` naming REVERSA uses. */
function findAddendum(featureId: string | null, input: ForwardInput): string | null {
  if (featureId === null) return null
  return input.addendaFiles.find(name => name.startsWith(featureId)) ?? null
}

/** Read the queue of paused features (R8). */
function readPaused(value: unknown): PausedFeature[] {
  if (!Array.isArray(value)) return []
  const out: PausedFeature[] = []
  for (const raw of value) {
    const entry = asRecord(raw)
    if (entry === null) continue
    out.push({
      featureDir: asString(entry['feature-dir']),
      featureId: asString(entry['feature-id']),
      shortName: asString(entry['short-name']),
      pausedAt: asString(entry['paused-at']),
      pausedFromStage: asString(entry['paused-from-stage']),
    })
  }
  return out
}

export { FILE as ACTIVE_REQUIREMENTS_FILE }
