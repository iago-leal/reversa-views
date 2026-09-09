/* HERDADO: não editar sem declarar a adaptação em src/heranca/PROCEDENCIA.md
 * origem:      scrum-harness (https://github.com/iago-leal/scrum-harness)
 * caminho:     packages/reversa-domain/src/migration.ts
 * revisão:     420305daa6cdd10858b720a34cb8db67d8e5c5e9 (2026-09-08)
 * copiado em:  2026-09-09
 * adaptações:  nenhuma
 */
/**
 * The migration pipeline of REVERSA (comp-73 R8-R11), read from
 * `<output_folder>/migration/.state.json`.
 *
 * A different schema from the discovery `state.json` — schemaVersion 2 and
 * camelCase — which is why it gets its own contract instead of stretching
 * {@link StateContract} over two unrelated shapes.
 *
 * The state worth surfacing is `awaiting_user_approval`: the pipeline has
 * stopped inside an agent and is waiting on a human decision that nothing
 * announces. Together with a non-empty `pendingDecisions`, it is this
 * axis's equivalent of the forward cycle's `done-sem-adendo` — the reason
 * a panel beats a status line.
 * @module @scrum-harness/reversa-domain/migration
 */

import { AnomalyLog } from './anomaly.ts'
import type { Anomaly } from './anomaly.ts'
import { asRecord, asString, asStringList, parseJsonSafe } from './json.ts'

/** The migration team, in pipeline order. */
export const MIGRATION_AGENTS = [
  'paradigm_advisor',
  'curator',
  'strategist',
  'designer',
  'screen_translator',
  'inspector',
] as const

/** How far the pipeline has got with one agent. */
export type AgentStatus = 'done' | 'current' | 'pending'

/** One agent of the queue and its derived status. */
export interface QueuedAgent {
  agent: string
  status: AgentStatus
}

/** The `currentAgent` object (`reversa-migrate/SKILL.md:86-91`). */
export interface CurrentAgent {
  agent: string | null
  phase: string | null
  status: string | null
  topologyApproved: boolean
  screenModeApproved: boolean
}

/** The migration axis. */
export interface MigrationState {
  present: boolean
  schemaVersion: number | null
  startedAt: string | null
  lastCheckpoint: string | null
  completedAgents: string[]
  pendingAgents: string[]
  pendingDecisions: string[]
  artifacts: Record<string, unknown>
  auto: boolean
  engine: string | null
  reversaVersion: string | null
  briefPath: string | null
  currentAgent: CurrentAgent
  queue: QueuedAgent[]
  awaitingHuman: boolean
  anomalies: Anomaly[]
}

const FILE = 'migration/.state.json'

/** Reader for the migration state. */
export const MigrationContract = {
  /**
   * Read the migration state, degrading instead of throwing.
   * @param json - the file content, or null when it does not exist.
   */
  read(json: string | null): MigrationState {
    const log = new AnomalyLog()
    const { value, cause } = parseJsonSafe(json)
    const record = asRecord(value)

    if (cause !== null || record === null) {
      return empty(log.list())
    }

    const completedAgents = asStringList(record.completedAgents)
    const pendingAgents = asStringList(record.pendingAgents)
    const currentAgent = readCurrentAgent(record.currentAgent, log)
    const pendingDecisions = readDecisions(record.pendingDecisions)

    for (const agent of [...completedAgents, ...pendingAgents]) {
      if (!(MIGRATION_AGENTS as readonly string[]).includes(agent)) {
        log.add(FILE, 'agente-de-migracao-desconhecido', agent)
      }
    }
    if (currentAgent.agent !== null && !(MIGRATION_AGENTS as readonly string[]).includes(currentAgent.agent)) {
      log.add(FILE, 'agente-de-migracao-desconhecido', currentAgent.agent)
    }

    return {
      present: true,
      schemaVersion: typeof record.schemaVersion === 'number' ? record.schemaVersion : null,
      startedAt: asString(record.startedAt),
      lastCheckpoint: asString(record.lastCheckpoint),
      completedAgents,
      pendingAgents,
      pendingDecisions,
      artifacts: asRecord(record.artifacts) ?? {},
      auto: record.auto === true,
      engine: asString(record.engine),
      reversaVersion: asString(record.reversaVersion),
      briefPath: asString(record.briefPath),
      currentAgent,
      queue: deriveQueue(completedAgents, currentAgent.agent),
      awaitingHuman: currentAgent.status === 'awaiting_user_approval' || pendingDecisions.length > 0,
      anomalies: log.list(),
    }
  },
}

/** The state of a workspace with no migration under way. */
function empty(anomalies: Anomaly[]): MigrationState {
  return {
    present: false,
    schemaVersion: null,
    startedAt: null,
    lastCheckpoint: null,
    completedAgents: [],
    pendingAgents: [],
    pendingDecisions: [],
    artifacts: {},
    auto: false,
    engine: null,
    reversaVersion: null,
    briefPath: null,
    currentAgent: { agent: null, phase: null, status: null, topologyApproved: false, screenModeApproved: false },
    queue: deriveQueue([], null),
    awaitingHuman: false,
    anomalies,
  }
}

/**
 * Read `currentAgent`. REVERSA documents it as an object and forbids
 * writing a string; a string is tolerated here as a DECLARED defensive
 * choice, not because a string form was ever observed on disk.
 */
function readCurrentAgent(value: unknown, log: AnomalyLog): CurrentAgent {
  if (typeof value === 'string') {
    log.add(FILE, 'current-agent-nao-objeto', value)
    return { agent: value, phase: null, status: null, topologyApproved: false, screenModeApproved: false }
  }
  const record = asRecord(value)
  if (record === null) {
    return { agent: null, phase: null, status: null, topologyApproved: false, screenModeApproved: false }
  }
  return {
    agent: asString(record.agent),
    phase: asString(record.phase),
    status: asString(record.status),
    topologyApproved: record.topologyApproved === true,
    screenModeApproved: record.screenModeApproved === true,
  }
}

/** Pending decisions may be plain strings or objects; both become strings. */
function readDecisions(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.map(entry => (typeof entry === 'string' ? entry : JSON.stringify(entry)))
}

/**
 * Derive the six agents' statuses. Precedence is normative: `completedAgents`
 * wins — which is what makes a `skipped` agent read as `done`, since REVERSA
 * moves it there — then the current agent, else pending.
 */
function deriveQueue(completed: readonly string[], current: string | null): QueuedAgent[] {
  const done = new Set(completed)
  return MIGRATION_AGENTS.map(agent => {
    if (done.has(agent)) return { agent, status: 'done' as const }
    if (current === agent) return { agent, status: 'current' as const }
    return { agent, status: 'pending' as const }
  })
}
