/* HERDADO: não editar sem declarar a adaptação em src/heranca/PROCEDENCIA.md
 * origem:      scrum-harness (https://github.com/iago-leal/scrum-harness)
 * caminho:     packages/reversa-domain/tests/ideation.spec.ts
 * revisão:     420305daa6cdd10858b720a34cb8db67d8e5c5e9 (2026-09-08)
 * copiado em:  2026-09-09
 * adaptações:  nenhuma
 */
/**
 * R12-R14 — the ideation session (`/reversa-brainstorm`).
 *
 * Two traps cost this component two review rounds, and both are pinned here:
 *
 *  1. The wire keys are kebab-case (`session-dir`, `current-stage`). A draft
 *     named them in camelCase and would have read null from every real file.
 *  2. `current-stage` names the NEXT step, not the current one, so the
 *     metadata and disk alphabets are disjoint — comparing them for equality
 *     flags every healthy session. Worse, the machine also moves BACKWARD:
 *     `reversa-arbiter` writes `options` without producing `decision.md`
 *     when the user asks to diverge again. Expected tokens are therefore a
 *     SET per disk stage, and disk always wins.
 */

import { describe, expect, it } from 'vitest'
import { IdeationContract } from '../src/ideation.ts'

function session(stage: string, files: string[], overrides: Record<string, unknown> = {}) {
  const json = JSON.stringify({
    'session-dir': '_reversa_sdd/brainstorms/001-painel-reversa',
    'session-id': '001',
    'short-name': 'painel-reversa',
    'idea': 'um painel visual para o REVERSA',
    'context': 'legado',
    'started-at': '2026-09-09T10:00:00Z',
    'current-stage': stage,
    ...overrides,
  })
  return IdeationContract.read(json, files)
}

describe('IdeationContract — wire keys are kebab-case (R12)', () => {
  it('reads every documented field and exposes it in camelCase', () => {
    const s = session('framing', ['idea.md'])
    expect(s.sessionDir).toBe('_reversa_sdd/brainstorms/001-painel-reversa')
    expect(s.sessionId).toBe('001')
    expect(s.shortName).toBe('painel-reversa')
    expect(s.idea).toBe('um painel visual para o REVERSA')
    expect(s.context).toBe('legado')
    expect(s.startedAt).toBe('2026-09-09T10:00:00Z')
    expect(s.currentStage).toBe('framing')
  })

  it('reports no active session for an absent or invalid file', () => {
    expect(IdeationContract.read(null, null).present).toBe(false)
    expect(IdeationContract.read('{ broken', null).present).toBe(false)
  })

  it('tolerates a BOM', () => {
    const raw = '\uFEFF' + JSON.stringify({ 'session-id': '001', 'current-stage': 'framing' })
    expect(IdeationContract.read(raw, ['idea.md']).sessionId).toBe('001')
  })
})

describe('IdeationContract — stage from disk (R13)', () => {
  it('derives each stage from the artifact table', () => {
    expect(session('framing', ['idea.md']).stage).toBe('aberta')
    expect(session('options', ['idea.md', 'framing.md']).stage).toBe('enquadrada')
    expect(session('risks', ['idea.md', 'framing.md', 'options.md']).stage).toBe('divergida')
    expect(session('decision', ['idea.md', 'framing.md', 'options.md', 'risks.md']).stage).toBe('desafiada')
    expect(session('pre-spec', ['idea.md', 'framing.md', 'options.md', 'risks.md', 'decision.md']).stage).toBe('decidida')
    expect(session('done', ['idea.md', 'framing.md', 'options.md', 'risks.md', 'decision.md', 'pre-spec.md']).stage).toBe('pronta')
  })

  it('always takes the most advanced artifact present', () => {
    expect(session('done', ['pre-spec.md', 'idea.md']).stage).toBe('pronta')
  })

  it('treats an empty session-dir as anomalous, not as `aberta`', () => {
    const s = session('framing', [])
    expect(s.anomalies.some(a => a.code === 'sessao-sem-idea')).toBe(true)
  })

  it('reports no active session when the folder does not exist', () => {
    const s = IdeationContract.read(JSON.stringify({ 'session-id': '1', 'current-stage': 'framing' }), null)
    expect(s.present).toBe(false)
  })
})

describe('IdeationContract — divergence is a SET, not equality (R14)', () => {
  it('accepts the forward token each agent writes', () => {
    // The agents write the NEXT step; none of these is a divergence.
    const healthy: [string, string[]][] = [
      ['framing', ['idea.md']],
      ['options', ['idea.md', 'framing.md']],
      ['risks', ['idea.md', 'framing.md', 'options.md']],
      ['decision', ['idea.md', 'framing.md', 'options.md', 'risks.md']],
      ['pre-spec', ['idea.md', 'framing.md', 'options.md', 'risks.md', 'decision.md']],
      ['done', ['idea.md', 'framing.md', 'options.md', 'risks.md', 'decision.md', 'pre-spec.md']],
    ]
    for (const [stage, files] of healthy) {
      const s = session(stage, files)
      expect(s.anomalies.filter(a => a.code === 'estagio-divergente'), `stage ${stage}`).toHaveLength(0)
    }
  })

  it('accepts `pre-spec` on a finished session too', () => {
    const s = session('pre-spec', ['idea.md', 'framing.md', 'options.md', 'risks.md', 'decision.md', 'pre-spec.md'])
    expect(s.anomalies.filter(a => a.code === 'estagio-divergente')).toHaveLength(0)
  })

  it('accepts the arbiter rewind: `options` with risks.md on disk', () => {
    // reversa-arbiter option 3 sends the session back to the explorer,
    // writing `options` without producing decision.md. Not a divergence.
    const s = session('options', ['idea.md', 'framing.md', 'options.md', 'risks.md'])
    expect(s.stage).toBe('desafiada')
    expect(s.anomalies.filter(a => a.code === 'estagio-divergente')).toHaveLength(0)
  })

  it('flags a genuine divergence and still lets the disk win', () => {
    const s = session('framing', ['idea.md', 'framing.md', 'options.md', 'risks.md', 'decision.md'])
    expect(s.stage).toBe('decidida')
    const anomaly = s.anomalies.find(a => a.code === 'estagio-divergente')
    expect(anomaly).toBeDefined()
    expect(anomaly?.detail).toContain('framing')
    expect(anomaly?.detail).toContain('decidida')
  })

  it('flags an unknown token', () => {
    const s = session('inventado', ['idea.md', 'framing.md'])
    expect(s.anomalies.some(a => a.code === 'estagio-divergente')).toBe(true)
    expect(s.stage).toBe('enquadrada')
  })
})
