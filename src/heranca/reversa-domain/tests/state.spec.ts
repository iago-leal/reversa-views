/* HERDADO: não editar sem declarar a adaptação em src/heranca/PROCEDENCIA.md
 * origem:      scrum-harness (https://github.com/iago-leal/scrum-harness)
 * caminho:     packages/reversa-domain/tests/state.spec.ts
 * revisão:     420305daa6cdd10858b720a34cb8db67d8e5c5e9 (2026-09-08)
 * copiado em:  2026-09-09
 * adaptações:  nenhuma
 */
/**
 * R1, R2, R3 — the discovery state of REVERSA.
 *
 * The five phases are always emitted in canonical order and derived, never
 * trusted: `completed`/`pending`/`phase` can disagree in a hand-edited or
 * half-written file, so R2 fixes a normative precedence and the tests walk
 * the whole truth table. Checkpoints are a map keyed by agent id whose
 * fields are all optional — the guide's own Archaeologist example carries
 * `modules_analyzed` with no `completed_at`.
 */

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { PHASES, StateContract } from '../src/state.ts'

const realState = readFileSync(fileURLToPath(new URL('./fixtures/state.real.json', import.meta.url)), 'utf8')

function state(json: string | null) {
  return StateContract.read(json)
}

describe('StateContract.read (R1)', () => {
  it('reads the fields of a real fresh install', () => {
    const s = state(realState)
    expect(s.project).toBe('legacy-shop')
    expect(s.userName).toBe('Iago')
    expect(s.version).toBe('1.3.3')
    expect(s.outputFolder).toBe('_reversa_sdd')
    expect(s.forwardFolder).toBe('_reversa_forward')
    expect(s.phase).toBeNull()
    expect(s.engines).toEqual(['claude-code'])
    expect(s.agents.length).toBeGreaterThan(60)
  })

  it('exposes createdFiles', () => {
    const s = state(JSON.stringify({ created_files: ['CLAUDE.md', '.reversa/state.json'] }))
    expect(s.createdFiles).toEqual(['CLAUDE.md', '.reversa/state.json'])
  })

  it('treats a null phase as not started', () => {
    expect(state(realState).phase).toBeNull()
    expect(state(realState).phases.every(p => p.status === 'pending')).toBe(true)
  })

  it('survives an absent or invalid file without throwing (R13)', () => {
    expect(() => state(null)).not.toThrow()
    expect(() => state('{ broken')).not.toThrow()
    expect(state(null).anomalies[0]?.code).toBe('config-ausente')
    expect(state('{ broken').anomalies[0]?.code).toBe('json-invalido')
  })

  it('tolerates a BOM (R13)', () => {
    const s = state('\uFEFF' + realState)
    expect(s.project).toBe('legacy-shop')
    expect(s.anomalies).toEqual([])
  })

  it('defaults the folders when the value is not a non-empty string', () => {
    for (const bad of ['""', '42', 'null']) {
      const s = state(`{ "output_folder": ${bad}, "forward_folder": ${bad} }`)
      expect(s.outputFolder, bad).toBe('_reversa_sdd')
      expect(s.forwardFolder).toBe('_reversa_forward')
    }
  })
})

describe('StateContract phases — derived, not trusted (R2)', () => {
  it('always emits the five canonical phases in order', () => {
    const s = state('{}')
    expect(s.phases.map(p => p.name)).toEqual([...PHASES])
  })

  it('marks completed phases done and the current one current', () => {
    const s = state(JSON.stringify({
      phase: 'escavacao',
      completed: ['reconhecimento'],
      pending: ['escavacao', 'interpretacao', 'geracao', 'revisao'],
    }))
    const by = Object.fromEntries(s.phases.map(p => [p.name, p.status]))
    expect(by.reconhecimento).toBe('done')
    expect(by.escavacao).toBe('current')
    expect(by.interpretacao).toBe('pending')
    expect(by.revisao).toBe('pending')
  })

  it('completed wins over phase, with a named anomaly', () => {
    const s = state(JSON.stringify({ phase: 'escavacao', completed: ['escavacao'], pending: [] }))
    const escavacao = s.phases.find(p => p.name === 'escavacao')
    expect(escavacao?.status).toBe('done')
    expect(s.anomalies.some(a => a.code === 'fase-atual-ja-concluida')).toBe(true)
  })

  it('phase wins over pending', () => {
    const s = state(JSON.stringify({ phase: 'geracao', completed: [], pending: ['geracao'] }))
    expect(s.phases.find(p => p.name === 'geracao')?.status).toBe('current')
  })

  it('a phase named only by `phase` is still current', () => {
    const s = state(JSON.stringify({ phase: 'revisao', completed: [], pending: [] }))
    expect(s.phases.find(p => p.name === 'revisao')?.status).toBe('current')
  })

  it('a phase mentioned nowhere is pending', () => {
    const s = state(JSON.stringify({ phase: null, completed: [], pending: [] }))
    expect(s.phases.every(p => p.status === 'pending')).toBe(true)
  })

  it('reports an unknown phase as an anomaly without dropping the five', () => {
    const s = state(JSON.stringify({ phase: 'inventada', completed: ['outra'], pending: [] }))
    expect(s.phases).toHaveLength(5)
    expect(s.anomalies.some(a => a.code === 'fase-desconhecida')).toBe(true)
  })

  it('ignores duplicates in the lists', () => {
    const s = state(JSON.stringify({ completed: ['reconhecimento', 'reconhecimento'], pending: [] }))
    expect(s.phases.filter(p => p.status === 'done')).toHaveLength(1)
  })
})

describe('StateContract checkpoints (R3)', () => {
  it('keys each record by the agent id', () => {
    const s = state(JSON.stringify({
      checkpoints: {
        scout: { completed_at: '2026-04-26T10:30:00Z', files: ['_reversa_sdd/inventory.md'] },
      },
    }))
    expect(s.checkpoints).toHaveLength(1)
    expect(s.checkpoints[0]?.agent).toBe('scout')
    expect(s.checkpoints[0]?.completedAt).toBe('2026-04-26T10:30:00Z')
    expect(s.checkpoints[0]?.files).toEqual(['_reversa_sdd/inventory.md'])
  })

  it('treats a checkpoint without completed_at as in progress', () => {
    const s = state(JSON.stringify({
      checkpoints: {
        archaeologist: { modules_analyzed: ['auth', 'orders'], modules_pending: ['payments'] },
      },
    }))
    const cp = s.checkpoints[0]
    expect(cp?.completedAt).toBeNull()
    expect(cp?.inProgress).toBe(true)
    expect(cp?.modulesAnalyzed).toEqual(['auth', 'orders'])
    expect(cp?.modulesPending).toEqual(['payments'])
    expect(cp?.files).toEqual([])
  })

  it('preserves keys the schema does not predict', () => {
    const s = state(JSON.stringify({
      checkpoints: { scout: { completed_at: 'x', surface: { languages: ['js'] } } },
    }))
    expect(s.checkpoints[0]?.extra).toEqual({ surface: { languages: ['js'] } })
  })

  it('accepts an empty checkpoints object', () => {
    expect(state(JSON.stringify({ checkpoints: {} })).checkpoints).toEqual([])
  })

  it('ignores a checkpoint entry that is not an object', () => {
    const s = state(JSON.stringify({ checkpoints: { scout: 'nope' } }))
    expect(s.checkpoints).toEqual([])
    expect(s.anomalies.some(a => a.code === 'tipo-invalido')).toBe(true)
  })
})
