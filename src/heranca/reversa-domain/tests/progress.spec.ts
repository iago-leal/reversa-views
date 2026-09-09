/* HERDADO: não editar sem declarar a adaptação em src/heranca/PROCEDENCIA.md
 * origem:      scrum-harness (https://github.com/iago-leal/scrum-harness)
 * caminho:     packages/reversa-domain/tests/progress.spec.ts
 * revisão:     420305daa6cdd10858b720a34cb8db67d8e5c5e9 (2026-09-08)
 * copiado em:  2026-09-09
 * adaptações:  nenhuma
 */
/**
 * R11 — the execution trail written by `/reversa-coding`.
 *
 * `progress.jsonl` is append-only and REVERSA never rewrites a line: a
 * mistake is corrected by appending `status: corrected`. The source
 * describes that in a single prose sentence and gives no example anywhere
 * in the repository, so the targeting rule here is a DECLARED defensive
 * choice (target via the `action` field), not a claim about the framework.
 * A line carrying an extra key that plausibly names a target is preserved
 * and flagged rather than guessed at.
 */

import { describe, expect, it } from 'vitest'
import { ProgressContract } from '../src/progress.ts'

function trail(jsonl: string | null) {
  return ProgressContract.read(jsonl)
}

const T1 = '{"ts":"2026-05-05T16:30:00Z","action":"T001","status":"done","files":["src/a.js"]}'
const T2 = '{"ts":"2026-05-05T16:31:00Z","action":"T002","status":"failed","files":[]}'

describe('ProgressContract.read (R11)', () => {
  it('reads one event per line', () => {
    const p = trail(`${T1}\n${T2}\n`)
    expect(p.events).toHaveLength(2)
    expect(p.events[0]?.action).toBe('T001')
    expect(p.events[0]?.status).toBe('done')
    expect(p.events[0]?.files).toEqual(['src/a.js'])
  })

  it('reads a last line with no trailing newline', () => {
    expect(trail(`${T1}\n${T2}`).events).toHaveLength(2)
  })

  it('skips blank lines', () => {
    expect(trail(`${T1}\n\n\n${T2}\n`).events).toHaveLength(2)
  })

  it('ignores a corrupted line and counts it as an anomaly', () => {
    const p = trail(`${T1}\n{ not json\n${T2}\n`)
    expect(p.events).toHaveLength(2)
    expect(p.anomalies.filter(a => a.code === 'linha-corrompida')).toHaveLength(1)
  })

  it('ignores a line without action or without status', () => {
    const p = trail(`{"ts":"x","status":"done"}\n{"ts":"x","action":"T009"}\n`)
    expect(p.events).toHaveLength(0)
    expect(p.anomalies).toHaveLength(2)
  })

  it('preserves keys beyond the minimal shape', () => {
    const p = trail('{"ts":"x","action":"T001","status":"done","files":[],"duration_ms":42}\n')
    expect(p.events[0]?.extra).toEqual({ duration_ms: 42 })
  })

  it('defaults files to an empty list', () => {
    const p = trail('{"ts":"x","action":"T001","status":"done"}\n')
    expect(p.events[0]?.files).toEqual([])
  })

  it('returns an empty trail for an absent file', () => {
    const p = trail(null)
    expect(p.events).toEqual([])
    expect(p.byAction).toEqual([])
  })

  it('tolerates a BOM (R13)', () => {
    expect(trail('\uFEFF' + T1).events).toHaveLength(1)
  })
})

describe('ProgressContract — reduction by action (R11)', () => {
  it('keeps the effective status as the last line referencing the action', () => {
    const later = '{"ts":"2026-05-05T17:00:00Z","action":"T002","status":"done","files":[]}'
    const p = trail(`${T1}\n${T2}\n${later}\n`)
    const t2 = p.byAction.find(a => a.action === 'T002')
    expect(t2?.status).toBe('done')
    expect(t2?.events).toHaveLength(2)
  })

  it('lets a corrected line override the target action', () => {
    const fix = '{"ts":"2026-05-05T18:00:00Z","action":"T001","status":"corrected","files":[]}'
    const p = trail(`${T1}\n${fix}\n`)
    const t1 = p.byAction.find(a => a.action === 'T001')
    expect(t1?.status).toBe('corrected')
    expect(t1?.events).toHaveLength(2)
    expect(t1?.events[0]?.status).toBe('done')
  })

  it('resolves several corrected lines by the last one', () => {
    const fix1 = '{"ts":"2026-05-05T18:00:00Z","action":"T001","status":"corrected","files":["a"]}'
    const fix2 = '{"ts":"2026-05-05T19:00:00Z","action":"T001","status":"corrected","files":["b"]}'
    const p = trail(`${T1}\n${fix1}\n${fix2}\n`)
    const t1 = p.byAction.find(a => a.action === 'T001')
    expect(t1?.status).toBe('corrected')
    expect(t1?.events).toHaveLength(3)
    expect(t1?.files).toEqual(['b'])
  })

  it('flags a corrected line that carries an ambiguous target key', () => {
    const fix = '{"ts":"x","action":"T005","status":"corrected","files":[],"target":"T001"}'
    const p = trail(`${T1}\n${fix}\n`)
    expect(p.anomalies.some(a => a.code === 'corrected-alvo-ambiguo')).toBe(true)
    // The declared rule still applies: the `action` field is the target.
    expect(p.byAction.find(a => a.action === 'T005')?.status).toBe('corrected')
  })

  it('keeps the actions in first-seen order', () => {
    const p = trail(`${T2}\n${T1}\n`)
    expect(p.byAction.map(a => a.action)).toEqual(['T002', 'T001'])
  })
})
