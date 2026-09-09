/* HERDADO: não editar sem declarar a adaptação em src/heranca/PROCEDENCIA.md
 * origem:      scrum-harness (https://github.com/iago-leal/scrum-harness)
 * caminho:     packages/reversa-domain/src/state.ts
 * revisão:     420305daa6cdd10858b720a34cb8db67d8e5c5e9 (2026-09-08)
 * copiado em:  2026-09-09
 * adaptações:  nenhuma
 */
/**
 * The discovery state of REVERSA (comp-72 R1, R2, R3), read from
 * `.reversa/state.json` — the file the orchestrator alone writes and every
 * other agent only reads.
 *
 * The five phases are DERIVED, never trusted. `completed`, `pending` and
 * `phase` are three views of the same truth maintained by an agent across
 * sessions, so they can disagree in a file that was hand-edited or written
 * halfway through a context overflow. {@link StateContract.read} therefore
 * applies a normative precedence and always emits the five canonical
 * phases in order, whatever the file says.
 * @module @scrum-harness/reversa-domain/state
 */

import { AnomalyLog } from './anomaly.ts'
import type { Anomaly } from './anomaly.ts'
import { asFolder, asRecord, asString, asStringList, parseJsonSafe } from './json.ts'

/** The five phases of the discovery pipeline, in the order REVERSA runs them. */
export const PHASES = ['reconhecimento', 'escavacao', 'interpretacao', 'geracao', 'revisao'] as const

/** One of the five canonical phases. */
export type PhaseName = (typeof PHASES)[number]

/** How far the pipeline has got with one phase. */
export type PhaseStatus = 'done' | 'current' | 'pending'

/** A phase and its derived status. */
export interface Phase {
  name: PhaseName
  status: PhaseStatus
}

/** What one agent recorded when it finished, or while it is still working. */
export interface Checkpoint {
  agent: string
  completedAt: string | null
  inProgress: boolean
  files: string[]
  modulesAnalyzed: string[]
  modulesPending: string[]
  extra: Record<string, unknown>
}

/** The keys a checkpoint is known to carry; anything else is preserved in `extra`. */
const KNOWN_CHECKPOINT_KEYS = new Set(['completed_at', 'files', 'modules_analyzed', 'modules_pending'])

/** The state of a REVERSA installation, as the panel shows it. */
export interface DiscoveryState {
  version: string | null
  project: string | null
  userName: string | null
  chatLanguage: string | null
  docLanguage: string | null
  answerMode: string | null
  docLevel: string | null
  outputFolder: string
  forwardFolder: string
  phase: string | null
  completed: string[]
  pending: string[]
  engines: string[]
  agents: string[]
  createdFiles: string[]
  phases: Phase[]
  checkpoints: Checkpoint[]
  anomalies: Anomaly[]
}

const FILE = '.reversa/state.json'

/** Reader for `.reversa/state.json`. */
export const StateContract = {
  /**
   * Read the discovery state, degrading instead of throwing.
   * @param json - the file content, or null when it does not exist.
   */
  read(json: string | null): DiscoveryState {
    const log = new AnomalyLog()
    const { value, cause } = parseJsonSafe(json)
    if (cause !== null) log.add(FILE, cause)

    const record = asRecord(value) ?? {}
    const completed = asStringList(record.completed)
    const pending = asStringList(record.pending)
    const phase = asString(record.phase)

    return {
      version: asString(record.version),
      project: asString(record.project),
      userName: asString(record.user_name),
      chatLanguage: asString(record.chat_language),
      docLanguage: asString(record.doc_language),
      answerMode: asString(record.answer_mode),
      docLevel: asString(record.doc_level),
      outputFolder: asFolder(record.output_folder, '_reversa_sdd'),
      forwardFolder: asFolder(record.forward_folder, '_reversa_forward'),
      phase,
      completed,
      pending,
      engines: asStringList(record.engines),
      agents: asStringList(record.agents),
      createdFiles: asStringList(record.created_files),
      phases: derivePhases({ completed, pending, phase }, log),
      checkpoints: readCheckpoints(record.checkpoints, log),
      anomalies: log.list(),
    }
  },
}

/**
 * Derive the status of the five phases (R2). Precedence is normative so the
 * result never depends on the implementation: `completed` beats `phase`,
 * `phase` beats `pending`, and a phase named nowhere is pending.
 */
function derivePhases(source: { completed: string[]; pending: string[]; phase: string | null }, log: AnomalyLog): Phase[] {
  const completed = new Set(source.completed)
  const known = new Set<string>(PHASES)

  for (const name of [...completed, ...source.pending]) {
    if (!known.has(name)) log.add(FILE, 'fase-desconhecida', name)
  }
  if (source.phase !== null && !known.has(source.phase)) log.add(FILE, 'fase-desconhecida', source.phase)
  if (source.phase !== null && completed.has(source.phase)) log.add(FILE, 'fase-atual-ja-concluida', source.phase)

  return PHASES.map(name => {
    if (completed.has(name)) return { name, status: 'done' as const }
    if (source.phase === name) return { name, status: 'current' as const }
    return { name, status: 'pending' as const }
  })
}

/** Read the checkpoint map (R3), keyed by agent id, preserving unknown keys. */
function readCheckpoints(value: unknown, log: AnomalyLog): Checkpoint[] {
  const record = asRecord(value)
  if (record === null) return []

  const out: Checkpoint[] = []
  for (const [agent, raw] of Object.entries(record)) {
    const entry = asRecord(raw)
    if (entry === null) {
      log.add(FILE, 'tipo-invalido', `checkpoints.${agent}`)
      continue
    }
    const completedAt = asString(entry.completed_at)
    const extra: Record<string, unknown> = {}
    for (const [key, item] of Object.entries(entry)) {
      if (!KNOWN_CHECKPOINT_KEYS.has(key)) extra[key] = item
    }
    out.push({
      agent,
      completedAt,
      inProgress: completedAt === null,
      files: asStringList(entry.files),
      modulesAnalyzed: asStringList(entry.modules_analyzed),
      modulesPending: asStringList(entry.modules_pending),
      extra,
    })
  }
  return out
}
