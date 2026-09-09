/* HERDADO: não editar sem declarar a adaptação em src/heranca/PROCEDENCIA.md
 * origem:      scrum-harness (https://github.com/iago-leal/scrum-harness)
 * caminho:     packages/reversa-probe/tests/snapshot.spec.ts
 * revisão:     420305daa6cdd10858b720a34cb8db67d8e5c5e9 (2026-09-08)
 * copiado em:  2026-09-09
 * adaptações:  A2
 */
/**
 * R1, R3, R4, R6, R7, R10 — assembling the snapshot the Model judges.
 *
 * The interesting requirement is R3's three passes. There is a genuine
 * circularity in REVERSA's layout: `readReversa` needs the feature-dir
 * listing, but the path to list lives inside `active-requirements.json`,
 * which only `readReversa` interprets. The probe breaks it by parsing just
 * the two pointer keys itself — `feature-dir` and `session-dir`, kebab-case
 * — and leaving every judgement to the Model.
 */

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { readReversa } from '../../reversa-domain/src/index.ts'
import { readReversaSnapshot, REVERSA_ADDENDA_CAP } from '../src/snapshot.ts'

let root: string

function write(rel: string, text: string): void {
  const abs = join(root, rel)
  mkdirSync(join(abs, '..'), { recursive: true })
  writeFileSync(abs, text)
}

function installReversa(overrides: Record<string, unknown> = {}): void {
  write('.reversa/state.json', JSON.stringify({
    version: '1.3.3',
    project: 'legacy-shop',
    output_folder: '_reversa_sdd',
    forward_folder: '_reversa_forward',
    phase: 'escavacao',
    completed: ['reconhecimento'],
    pending: ['escavacao', 'interpretacao', 'geracao', 'revisao'],
    ...overrides,
  }))
  write('.reversa/reversa-config.json', JSON.stringify({ version: 1, allowLegacyEdits: false, allowedPaths: [] }))
}

beforeEach(() => { root = mkdtempSync(join(tmpdir(), 'reversa-snap-')) })
afterEach(() => { rmSync(root, { recursive: true, force: true }) })

describe('readReversaSnapshot — no REVERSA installed (R4)', () => {
  it('produces an empty snapshot without throwing', () => {
    const { snapshot, report } = readReversaSnapshot(root)
    expect(snapshot.stateJson).toBeNull()
    expect(snapshot.configJson).toBeNull()
    expect(snapshot.featureDirFiles).toBeNull()
    expect(report.refusals).toEqual([])
  })

  it('feeds the Model, which reports the workspace as not installed', () => {
    const { snapshot } = readReversaSnapshot(root)
    expect(readReversa(snapshot).installed).toBe(false)
  })
})

describe('readReversaSnapshot — the fixed-path pass (R1, R3)', () => {
  it('reads the four JSONs under .reversa/', () => {
    installReversa()
    write('.reversa/active-requirements.json', JSON.stringify({ 'feature-dir': '_reversa_forward/001-x', 'feature-id': '001' }))
    write('.reversa/active-ideation.json', JSON.stringify({ 'session-dir': '_reversa_sdd/brainstorms/001-y', 'session-id': '001' }))
    const { snapshot } = readReversaSnapshot(root)
    expect(snapshot.stateJson).toContain('legacy-shop')
    expect(snapshot.configJson).toContain('allowLegacyEdits')
    expect(snapshot.activeRequirementsJson).toContain('001-x')
    expect(snapshot.activeIdeationJson).toContain('001-y')
  })
})

describe('readReversaSnapshot — the feature-dir pass (R2, R3, R10)', () => {
  beforeEach(() => {
    installReversa()
    write('.reversa/active-requirements.json', JSON.stringify({ 'feature-dir': '_reversa_forward/001-checkout', 'feature-id': '001' }))
  })

  it('lists the feature-dir by basename and reads its bodies', () => {
    write('_reversa_forward/001-checkout/requirements.md', '# req\n')
    write('_reversa_forward/001-checkout/roadmap.md', '# road\n')
    write('_reversa_forward/001-checkout/actions.md', '| a | [X] |\n')
    write('_reversa_forward/001-checkout/progress.jsonl', '{"ts":"x","action":"T1","status":"done"}\n')
    write('_reversa_forward/001-checkout/legacy-impact.md', '# impacto\n')
    write('_reversa_forward/001-checkout/regression-watch.md', '# watch\n')

    const { snapshot, report } = readReversaSnapshot(root)
    expect(snapshot.featureDirFiles).toContain('roadmap.md')
    expect(snapshot.featureDirFiles?.some(name => name.includes('/'))).toBe(false)
    expect(snapshot.actionsMd).toContain('[X]')
    expect(snapshot.progressJsonl).toContain('T1')
    expect(snapshot.legacyImpactMd).toContain('impacto')
    expect(snapshot.regressionWatchMd).toContain('watch')
    expect(report.featureDir).toBe('_reversa_forward/001-checkout')
  })

  it('reports a feature-dir that does not exist as null, not as empty', () => {
    const { snapshot, report } = readReversaSnapshot(root)
    expect(snapshot.featureDirFiles).toBeNull()
    expect(report.featureDir).toBeNull()
  })

  it('refuses a feature-dir outside the root and says why', () => {
    write('.reversa/active-requirements.json', JSON.stringify({ 'feature-dir': '../fora', 'feature-id': '001' }))
    const { snapshot, report } = readReversaSnapshot(root)
    expect(snapshot.featureDirFiles).toBeNull()
    expect(report.featureDir).toBeNull()
    expect(report.refusals.some(r => r.path === '../fora')).toBe(true)
  })

  it('refuses an absolute feature-dir', () => {
    write('.reversa/active-requirements.json', JSON.stringify({ 'feature-dir': '/etc', 'feature-id': '001' }))
    const { report } = readReversaSnapshot(root)
    expect(report.refusals.some(r => r.path === '/etc')).toBe(true)
  })
})

describe('readReversaSnapshot — folders come from the state (R3)', () => {
  it('follows a custom output_folder for addenda and migration', () => {
    installReversa({ output_folder: 'especificacoes' })
    write('especificacoes/addenda/001-x.md', '## Vigência\n\nVigente desde 2026-09-09.\n')
    write('especificacoes/migration/.state.json', JSON.stringify({ schemaVersion: 2, completedAgents: [] }))

    const { snapshot } = readReversaSnapshot(root)
    expect(snapshot.addendaFiles).toContain('001-x.md')
    expect(snapshot.migrationStateJson).toContain('schemaVersion')
  })

  it('reads the hidden .state.json of the migration', () => {
    installReversa()
    write('_reversa_sdd/migration/.state.json', JSON.stringify({ schemaVersion: 2 }))
    expect(readReversaSnapshot(root).snapshot.migrationStateJson).toContain('schemaVersion')
  })
})

describe('readReversaSnapshot — addenda caps (R7, R10)', () => {
  it('reads the addenda bodies', () => {
    installReversa()
    write('_reversa_sdd/addenda/001-x.md', 'corpo do adendo')
    const { snapshot } = readReversaSnapshot(root)
    expect(snapshot.addendaBodies['001-x.md']).toBe('corpo do adendo')
  })

  it('caps the number of addenda and reports the truncation', () => {
    installReversa()
    for (let index = 0; index < REVERSA_ADDENDA_CAP + 5; index += 1) {
      write(`_reversa_sdd/addenda/${String(index).padStart(3, '0')}-x.md`, 'x')
    }
    const { snapshot, report } = readReversaSnapshot(root)
    expect(snapshot.addendaFiles).toHaveLength(REVERSA_ADDENDA_CAP)
    expect(report.truncated.length).toBeGreaterThan(0)
  })

  it('returns an empty list when there is no addenda folder', () => {
    installReversa()
    expect(readReversaSnapshot(root).snapshot.addendaFiles).toEqual([])
  })
})

describe('readReversaSnapshot — ideation (R1, R3)', () => {
  it('lists the session-dir when it exists', () => {
    installReversa()
    write('.reversa/active-ideation.json', JSON.stringify({ 'session-dir': '_reversa_sdd/brainstorms/001-y', 'session-id': '001' }))
    write('_reversa_sdd/brainstorms/001-y/idea.md', 'ideia')
    write('_reversa_sdd/brainstorms/001-y/framing.md', 'enquadrado')

    const { snapshot, report } = readReversaSnapshot(root)
    expect(snapshot.ideationDirFiles).toEqual(expect.arrayContaining(['idea.md', 'framing.md']))
    expect(report.sessionDir).toBe('_reversa_sdd/brainstorms/001-y')
  })

  it('reports a missing session-dir as null', () => {
    installReversa()
    write('.reversa/active-ideation.json', JSON.stringify({ 'session-dir': '_reversa_sdd/brainstorms/999-z' }))
    expect(readReversaSnapshot(root).snapshot.ideationDirFiles).toBeNull()
  })
})

describe('readReversaSnapshot — the whole thing feeds the Model (R1)', () => {
  it('produces a process a panel can render', () => {
    installReversa()
    write('.reversa/active-requirements.json', JSON.stringify({ 'feature-dir': '_reversa_forward/001-checkout', 'feature-id': '001' }))
    write('_reversa_forward/001-checkout/requirements.md', '# req\n')
    write('_reversa_forward/001-checkout/roadmap.md', '# road\n')

    const { snapshot } = readReversaSnapshot(root)
    const process = readReversa(snapshot)
    expect(process.installed).toBe(true)
    expect(process.discovery.project).toBe('legacy-shop')
    expect(process.forward.stage).toBe('plan')
    expect(process.policy.allowLegacyEdits).toBe(false)
  })

  it('never throws on a broken installation', () => {
    write('.reversa/state.json', '{ quebrado')
    expect(() => readReversaSnapshot(root)).not.toThrow()
    const { snapshot } = readReversaSnapshot(root)
    expect(() => readReversa(snapshot)).not.toThrow()
  })
})
