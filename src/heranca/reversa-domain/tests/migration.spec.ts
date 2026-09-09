/* HERDADO: não editar sem declarar a adaptação em src/heranca/PROCEDENCIA.md
 * origem:      scrum-harness (https://github.com/iago-leal/scrum-harness)
 * caminho:     packages/reversa-domain/tests/migration.spec.ts
 * revisão:     420305daa6cdd10858b720a34cb8db67d8e5c5e9 (2026-09-08)
 * copiado em:  2026-09-09
 * adaptações:  nenhuma
 */
/**
 * R8-R11 — the migration pipeline of REVERSA.
 *
 * The state file is `<output_folder>/migration/.state.json`, camelCase and
 * schemaVersion 2 — a different schema from the discovery `state.json`,
 * which is why it gets its own contract rather than sharing one.
 *
 * The state a panel must surface is `awaiting_user_approval`: the pipeline
 * has stopped mid-agent and is waiting on a human decision that nothing in
 * the terminal announces. It is this axis's equivalent of the forward
 * cycle's `done-sem-adendo`.
 */

import { describe, expect, it } from 'vitest'
import { MIGRATION_AGENTS, MigrationContract } from '../src/migration.ts'

function state(overrides: Record<string, unknown> = {}): string {
  return JSON.stringify({
    schemaVersion: 2,
    startedAt: '2026-09-09T10:00:00Z',
    lastCheckpoint: null,
    completedAgents: [],
    pendingAgents: [...MIGRATION_AGENTS],
    currentAgent: { agent: 'paradigm_advisor', phase: null, status: 'running', topologyApproved: false },
    pendingDecisions: [],
    artifacts: {},
    auto: false,
    engine: 'claude-code',
    reversaVersion: '1.3.3',
    briefPath: '_reversa_sdd/migration/migration_brief.md',
    expectedLegacyArtifacts: 'templates/migration/expected_legacy_artifacts.yaml',
    ...overrides,
  })
}

describe('MigrationContract — fields (R8)', () => {
  it('reads the documented fields of the template', () => {
    const m = MigrationContract.read(state())
    expect(m.schemaVersion).toBe(2)
    expect(m.startedAt).toBe('2026-09-09T10:00:00Z')
    expect(m.lastCheckpoint).toBeNull()
    expect(m.engine).toBe('claude-code')
    expect(m.reversaVersion).toBe('1.3.3')
    expect(m.auto).toBe(false)
    expect(m.briefPath).toBe('_reversa_sdd/migration/migration_brief.md')
  })

  it('exposes artifacts as a map, without interpreting the value', () => {
    const m = MigrationContract.read(state({ artifacts: { 'a/b.md': { sha256: 'abc' } } }))
    expect(m.artifacts).toEqual({ 'a/b.md': { sha256: 'abc' } })
  })

  it('does NOT expose expectedLegacyArtifacts — the two template copies disagree', () => {
    const m = MigrationContract.read(state()) as unknown as Record<string, unknown>
    expect('expectedLegacyArtifacts' in m).toBe(false)
  })

  it('reports absence and invalid JSON without throwing', () => {
    expect(MigrationContract.read(null).present).toBe(false)
    expect(() => MigrationContract.read('{ broken')).not.toThrow()
    expect(MigrationContract.read('{ broken').present).toBe(false)
  })

  it('tolerates a BOM', () => {
    expect(MigrationContract.read('\uFEFF' + state()).schemaVersion).toBe(2)
  })
})

describe('MigrationContract — the six-agent queue (R9)', () => {
  it('knows the canonical queue in order', () => {
    expect(MIGRATION_AGENTS).toEqual([
      'paradigm_advisor',
      'curator',
      'strategist',
      'designer',
      'screen_translator',
      'inspector',
    ])
  })

  it('always emits the six with a derived status', () => {
    const m = MigrationContract.read(state())
    expect(m.queue.map(a => a.agent)).toEqual([...MIGRATION_AGENTS])
    expect(m.queue[0]?.status).toBe('current')
    expect(m.queue[1]?.status).toBe('pending')
  })

  it('marks completed agents done', () => {
    const m = MigrationContract.read(state({
      completedAgents: ['paradigm_advisor', 'curator'],
      currentAgent: { agent: 'strategist', phase: null, status: 'running' },
    }))
    const by = Object.fromEntries(m.queue.map(a => [a.agent, a.status]))
    expect(by.paradigm_advisor).toBe('done')
    expect(by.curator).toBe('done')
    expect(by.strategist).toBe('current')
    expect(by.inspector).toBe('pending')
  })

  it('treats a skipped agent as done, since REVERSA moves it to completedAgents', () => {
    const m = MigrationContract.read(state({
      completedAgents: ['paradigm_advisor', 'curator', 'strategist', 'designer', 'screen_translator'],
      currentAgent: { agent: 'inspector', phase: null, status: 'running' },
    }))
    expect(m.queue.find(a => a.agent === 'screen_translator')?.status).toBe('done')
  })

  it('flags an agent outside the canonical queue without breaking', () => {
    const m = MigrationContract.read(state({ completedAgents: ['agente_novo'] }))
    expect(m.queue).toHaveLength(6)
    expect(m.anomalies.some(a => a.code === 'agente-de-migracao-desconhecido')).toBe(true)
  })
})

describe('MigrationContract — currentAgent is an object (R10)', () => {
  it('reads the five documented fields', () => {
    const m = MigrationContract.read(state({
      currentAgent: { agent: 'designer', phase: 'topology', status: 'awaiting_user_approval', topologyApproved: false, screenModeApproved: true },
    }))
    expect(m.currentAgent.agent).toBe('designer')
    expect(m.currentAgent.phase).toBe('topology')
    expect(m.currentAgent.status).toBe('awaiting_user_approval')
    expect(m.currentAgent.topologyApproved).toBe(false)
    expect(m.currentAgent.screenModeApproved).toBe(true)
  })

  it('highlights awaiting_user_approval as the actionable pause', () => {
    const paused = MigrationContract.read(state({
      currentAgent: { agent: 'designer', phase: 'topology', status: 'awaiting_user_approval' },
    }))
    expect(paused.awaitingHuman).toBe(true)

    const running = MigrationContract.read(state())
    expect(running.awaitingHuman).toBe(false)
  })

  it('tolerates a string currentAgent as a declared defensive choice', () => {
    // Not an observed legacy format: REVERSA only forbids WRITING a string.
    const m = MigrationContract.read(state({ currentAgent: 'designer' }))
    expect(m.currentAgent.agent).toBe('designer')
    expect(m.anomalies.some(a => a.code === 'current-agent-nao-objeto')).toBe(true)
  })

  it('accepts a null agent (idle at the end of the pipeline)', () => {
    const m = MigrationContract.read(state({
      completedAgents: [...MIGRATION_AGENTS],
      pendingAgents: [],
      currentAgent: { agent: null, phase: null, status: 'complete' },
    }))
    expect(m.currentAgent.agent).toBeNull()
    expect(m.queue.every(a => a.status === 'done')).toBe(true)
  })
})

describe('MigrationContract — pending decisions (R11)', () => {
  it('exposes pendingDecisions as a typed list', () => {
    const m = MigrationContract.read(state({ pendingDecisions: ['manter Oracle?', 'quebrar o monólito?'] }))
    expect(m.pendingDecisions).toHaveLength(2)
    expect(m.awaitingHuman).toBe(true)
  })

  it('is empty when there is nothing to decide', () => {
    expect(MigrationContract.read(state()).pendingDecisions).toEqual([])
  })
})
