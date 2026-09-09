/* HERDADO: não editar sem declarar a adaptação em src/heranca/PROCEDENCIA.md
 * origem:      scrum-harness (https://github.com/iago-leal/scrum-harness)
 * caminho:     packages/reversa-domain/tests/forward.spec.ts
 * revisão:     420305daa6cdd10858b720a34cb8db67d8e5c5e9 (2026-09-08)
 * copiado em:  2026-09-09
 * adaptações:  nenhuma
 */
/**
 * R8, R9 — the physical stage of the active forward feature.
 *
 * The stage comes from artifacts on disk, never from the `current-stage`
 * field, which REVERSA itself calls "metadado informativo". The `done`
 * split is the actionable part for a monitoring panel: delivered but not
 * yet converged into the extraction (`done-sem-adendo`) is the state that
 * asks a human to run `/reversa-sync`.
 */

import { describe, expect, it } from 'vitest'
import { ForwardContract } from '../src/forward.ts'
import type { ForwardInput } from '../src/forward.ts'

const HEADER = '| ID | D | Dep | Par | Alvo | Conf | Status |\n|---|---|---|---|---|---|---|\n'
const CLOSED = HEADER + '| T001 | a | - | - | `x.js` | 🟢 | `[X]` |\n'
const OPEN = HEADER + '| T001 | a | - | - | `x.js` | 🟢 | `[ ]` |\n'

const ACTIVE = JSON.stringify({
  'schema-version': 1,
  'feature-dir': '_reversa_forward/001-checkout',
  'feature-id': '001',
  'short-name': 'checkout',
  'started-at': '2026-09-09T10:00:00Z',
})

function stage(input: Partial<ForwardInput>) {
  return ForwardContract.read({
    activeRequirementsJson: ACTIVE,
    featureDirFiles: [],
    actionsMd: null,
    requirementsMd: null,
    addendaFiles: [],
    addendaBodies: {},
    outputFolder: '_reversa_sdd',
    ...input,
  })
}

describe('ForwardContract — no active feature (R8)', () => {
  it('reports no active feature when the file is absent', () => {
    expect(stage({ activeRequirementsJson: null }).stage).toBe('sem-feature-ativa')
  })

  it('reports no active feature when the JSON is invalid', () => {
    expect(stage({ activeRequirementsJson: '{ broken' }).stage).toBe('sem-feature-ativa')
  })

  it('reports no active feature when the feature-dir does not exist', () => {
    expect(stage({ featureDirFiles: null }).stage).toBe('sem-feature-ativa')
  })
})

describe('ForwardContract — stage from physical artifacts (R8)', () => {
  it('vazio: the folder exists but has no requirements.md', () => {
    expect(stage({ featureDirFiles: ['notes.txt'] }).stage).toBe('vazio')
  })

  it('requirements: requirements.md present, roadmap.md absent', () => {
    const s = stage({ featureDirFiles: ['requirements.md'], requirementsMd: '# R\n' })
    expect(s.stage).toBe('requirements')
  })

  it('plan: roadmap.md present, actions.md absent', () => {
    expect(stage({ featureDirFiles: ['requirements.md', 'roadmap.md'] }).stage).toBe('plan')
  })

  it('coding-em-progresso: at least one open checkbox', () => {
    const s = stage({ featureDirFiles: ['requirements.md', 'roadmap.md', 'actions.md'], actionsMd: OPEN })
    expect(s.stage).toBe('coding-em-progresso')
  })

  it('never lets current-stage decide', () => {
    const lying = JSON.stringify({
      'feature-dir': '_reversa_forward/001-checkout',
      'feature-id': '001',
      'short-name': 'checkout',
      'current-stage': 'done',
    })
    const s = stage({
      activeRequirementsJson: lying,
      featureDirFiles: ['requirements.md', 'roadmap.md', 'actions.md'],
      actionsMd: OPEN,
    })
    expect(s.stage).toBe('coding-em-progresso')
  })

  it('counts the doubts of requirements.md', () => {
    const s = stage({ featureDirFiles: ['requirements.md'], requirementsMd: 'R1 [DÚVIDA]\nR2 [DÚVIDA]\n' })
    expect(s.doubts).toBe(2)
  })

  it('exposes paused features as a typed list', () => {
    const withPaused = JSON.stringify({
      'feature-dir': '_reversa_forward/002-x',
      'feature-id': '002',
      'short-name': 'x',
      'paused-features': [
        { 'feature-dir': '_reversa_forward/001-checkout', 'feature-id': '001', 'short-name': 'checkout', 'paused-at': '2026-09-08T10:00:00Z', 'paused-from-stage': 'plan' },
      ],
    })
    const s = stage({ activeRequirementsJson: withPaused, featureDirFiles: ['requirements.md'] })
    expect(s.pausedFeatures).toHaveLength(1)
    expect(s.pausedFeatures[0]?.featureId).toBe('001')
    expect(s.pausedFeatures[0]?.pausedFromStage).toBe('plan')
  })
})

describe('ForwardContract — the done split (R9)', () => {
  const doneFiles = ['requirements.md', 'roadmap.md', 'actions.md']

  it('done-sem-adendo when no addendum exists: the actionable state', () => {
    const s = stage({ featureDirFiles: doneFiles, actionsMd: CLOSED })
    expect(s.stage).toBe('done-sem-adendo')
  })

  it('done-com-adendo when a vigent addendum exists', () => {
    const s = stage({
      featureDirFiles: doneFiles,
      actionsMd: CLOSED,
      addendaFiles: ['001-checkout.md'],
      addendaBodies: { '001-checkout.md': '# Adendo\n\n## Vigência\n\nVigente desde 2026-09-09.\n' },
    })
    expect(s.stage).toBe('done-com-adendo')
  })

  it('done-sem-adendo when the addendum was superseded, with an anomaly', () => {
    const s = stage({
      featureDirFiles: doneFiles,
      actionsMd: CLOSED,
      addendaFiles: ['001-checkout.md'],
      addendaBodies: {
        '001-checkout.md': '# Adendo\n\n## Vigência\n\nVigente desde 2026-09-01.\nSuperado pela re-extração de 2026-09-09.\n',
      },
    })
    expect(s.stage).toBe('done-sem-adendo')
    expect(s.anomalies.some(a => a.code === 'adendo-superado')).toBe(true)
  })

  it('matches the addendum by feature-id prefix', () => {
    const s = stage({
      featureDirFiles: doneFiles,
      actionsMd: CLOSED,
      addendaFiles: ['002-outra.md', '001-checkout.md'],
      addendaBodies: { '001-checkout.md': '## Vigência\n\nVigente desde 2026-09-09.\n' },
    })
    expect(s.stage).toBe('done-com-adendo')
  })

  it('an actions.md with zero action rows is done, and still gets the split', () => {
    const s = stage({
      featureDirFiles: doneFiles,
      actionsMd: '# Ações\n\nNada.\n',
      addendaFiles: ['001-checkout.md'],
      addendaBodies: { '001-checkout.md': '## Vigência\n\nVigente desde 2026-09-09.\n' },
    })
    expect(s.stage).toBe('done-com-adendo')
    expect(s.anomalies.some(a => a.code === 'actions-sem-acoes')).toBe(true)
  })

  it('an open amendment keeps the feature in coding, never reaching the split', () => {
    const md = CLOSED + '\n## Emendas\n\n' + HEADER + '| E001 | ajuste | - | - | `y.js` | 🟢 | `[ ]` |\n'
    const s = stage({
      featureDirFiles: doneFiles,
      actionsMd: md,
      addendaFiles: ['001-checkout.md'],
      addendaBodies: { '001-checkout.md': '## Vigência\n\nVigente desde 2026-09-09.\n' },
    })
    expect(s.stage).toBe('coding-em-progresso')
  })
})
