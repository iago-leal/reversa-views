/* HERDADO: não editar sem declarar a adaptação em src/heranca/PROCEDENCIA.md
 * origem:      scrum-harness (https://github.com/iago-leal/scrum-harness)
 * caminho:     packages/reversa-domain/src/ideation.ts
 * revisão:     420305daa6cdd10858b720a34cb8db67d8e5c5e9 (2026-09-08)
 * copiado em:  2026-09-09
 * adaptações:  nenhuma
 */
/**
 * The ideation session of REVERSA (comp-73 R12-R14), read from
 * `.reversa/active-ideation.json` and the artifacts of its session folder.
 *
 * Two traps live here, both of which this component walked into before the
 * tests existed:
 *
 *  1. The wire keys are KEBAB-CASE (`session-dir`, `current-stage`). A
 *     draft that named them in camelCase would have read null from every
 *     real file while its own fixtures passed.
 *  2. `current-stage` names the NEXT step, not the current one, so the
 *     metadata and disk alphabets never share a member — comparing them for
 *     equality would flag every healthy session. And the machine moves
 *     BACKWARD too: `reversa-arbiter` writes `options` without producing
 *     `decision.md` when the user asks to diverge again. Expected tokens
 *     are therefore a SET per disk stage, and adding a new return edge means
 *     adding a member, not rewriting the logic.
 *
 * Whatever the metadata says, the disk wins — REVERSA's own rule.
 * @module @scrum-harness/reversa-domain/ideation
 */

import { AnomalyLog } from './anomaly.ts'
import type { Anomaly } from './anomaly.ts'
import { asRecord, asString, parseJsonSafe } from './json.ts'

/** Where the session stands, derived from the artifacts on disk. */
export type IdeationStage = 'aberta' | 'enquadrada' | 'divergida' | 'desafiada' | 'decidida' | 'pronta'

/** The artifact that proves each stage, from the least to the most advanced. */
const STAGE_BY_ARTIFACT: readonly (readonly [string, IdeationStage])[] = [
  ['idea.md', 'aberta'],
  ['framing.md', 'enquadrada'],
  ['options.md', 'divergida'],
  ['risks.md', 'desafiada'],
  ['decision.md', 'decidida'],
  ['pre-spec.md', 'pronta'],
]

/**
 * The `current-stage` tokens each disk stage may legitimately carry. The
 * agents write the NEXT step, and `desafiada` also accepts `options`
 * because `reversa-arbiter` rewinds the session to the explorer there.
 */
const ACCEPTED_TOKENS: Record<IdeationStage, readonly string[]> = {
  aberta: ['framing'],
  enquadrada: ['options'],
  divergida: ['risks'],
  desafiada: ['decision', 'options'],
  decidida: ['pre-spec'],
  pronta: ['pre-spec', 'done'],
}

/** The ideation axis. */
export interface IdeationState {
  present: boolean
  sessionDir: string | null
  sessionId: string | null
  shortName: string | null
  idea: string | null
  context: string | null
  startedAt: string | null
  currentStage: string | null
  stage: IdeationStage | null
  anomalies: Anomaly[]
}

const FILE = '.reversa/active-ideation.json'

/** Reader for the ideation session. */
export const IdeationContract = {
  /**
   * Read the session and derive its stage from the disk.
   * @param json - the content of `active-ideation.json`, or null.
   * @param sessionFiles - the file names in the session folder; null when it does not exist.
   */
  read(json: string | null, sessionFiles: string[] | null): IdeationState {
    const log = new AnomalyLog()
    const { value, cause } = parseJsonSafe(json)
    const record = asRecord(value)

    if (cause !== null || record === null || sessionFiles === null) {
      return {
        present: false,
        sessionDir: null,
        sessionId: null,
        shortName: null,
        idea: null,
        context: null,
        startedAt: null,
        currentStage: null,
        stage: null,
        anomalies: log.list(),
      }
    }

    const currentStage = asString(record['current-stage'])
    const stage = deriveStage(sessionFiles)

    if (stage === null) {
      // REVERSA writes idea.md when it opens the session, so a folder with
      // none of the artifacts is a broken session, not a fresh one.
      log.add(FILE, 'sessao-sem-idea')
    } else if (currentStage !== null && !ACCEPTED_TOKENS[stage].includes(currentStage)) {
      log.add(FILE, 'estagio-divergente', `metadado "${currentStage}" vs disco "${stage}"`)
    }

    return {
      present: true,
      sessionDir: asString(record['session-dir']),
      sessionId: asString(record['session-id']),
      shortName: asString(record['short-name']),
      idea: asString(record.idea),
      context: asString(record.context),
      startedAt: asString(record['started-at']),
      currentStage,
      stage,
      anomalies: log.list(),
    }
  },
}

/** The most advanced artifact present decides the stage. */
function deriveStage(files: readonly string[]): IdeationStage | null {
  const present = new Set(files)
  let stage: IdeationStage | null = null
  for (const [artifact, candidate] of STAGE_BY_ARTIFACT) {
    if (present.has(artifact)) stage = candidate
  }
  return stage
}
