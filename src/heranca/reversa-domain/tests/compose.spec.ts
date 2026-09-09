/* HERDADO: não editar sem declarar a adaptação em src/heranca/PROCEDENCIA.md
 * origem:      scrum-harness (https://github.com/iago-leal/scrum-harness)
 * caminho:     packages/reversa-domain/tests/compose.spec.ts
 * revisão:     420305daa6cdd10858b720a34cb8db67d8e5c5e9 (2026-09-08)
 * copiado em:  2026-09-09
 * adaptações:  nenhuma
 */
/**
 * R16 — the new axes compose additively onto what comp-72 delivered.
 *
 * `readReversa` must keep returning one process, not two objects a View has
 * to marry. The shape comp-72 shipped is frozen here on purpose: adding
 * `impact`, `watch`, `migration` and `ideation` must not move a single
 * existing field. The anomaly union is extended deliberately, and this test
 * is where that decision is recorded rather than discovered as a break.
 */

import { describe, expect, it } from 'vitest'
import { EMPTY_SNAPSHOT, readReversa } from '../src/index.ts'
import type { ReversaSnapshot } from '../src/index.ts'

const STATE = JSON.stringify({
  version: '1.3.3',
  project: 'legacy-shop',
  output_folder: '_reversa_sdd',
  forward_folder: '_reversa_forward',
  phase: 'escavacao',
  completed: ['reconhecimento'],
  pending: ['escavacao', 'interpretacao', 'geracao', 'revisao'],
})

describe('readReversa — the comp-72 shape is untouched (R16)', () => {
  it('still reports the discovery, policy, forward and progress axes', () => {
    const process = readReversa({ ...EMPTY_SNAPSHOT, stateJson: STATE })
    expect(process.installed).toBe(true)
    expect(process.discovery.project).toBe('legacy-shop')
    expect(process.discovery.phases).toHaveLength(5)
    expect(process.policy.allowLegacyEdits).toBe(false)
    expect(process.writableFolders).toHaveLength(6)
    expect(process.forward.stage).toBe('sem-feature-ativa')
    expect(process.progress.events).toEqual([])
  })

  it('keeps working on a fully empty snapshot', () => {
    const process = readReversa(EMPTY_SNAPSHOT)
    expect(process.installed).toBe(false)
    expect(() => readReversa(EMPTY_SNAPSHOT)).not.toThrow()
  })
})

describe('readReversa — the new axes (R16)', () => {
  const snapshot: ReversaSnapshot = {
    ...EMPTY_SNAPSHOT,
    stateJson: STATE,
    legacyImpactMd: '| Arquivo afetado | Componente | Tipo | Severidade | Justificativa |\n|---|---|---|---|---|\n| src/a.js | Pedidos | regra-alterada | HIGH | mudou |\n',
    regressionWatchMd: '| ID | Origem (arquivo, seção) | Regra esperada após mudança | Tipo de verificação | Sinal de violação |\n|---|---|---|---|---|\n| W001 | domain.md, X | regra | presença | some |\n',
    migrationStateJson: JSON.stringify({
      schemaVersion: 2,
      completedAgents: ['paradigm_advisor'],
      pendingAgents: ['curator', 'strategist', 'designer', 'screen_translator', 'inspector'],
      currentAgent: { agent: 'curator', phase: null, status: 'awaiting_user_approval' },
      pendingDecisions: ['manter o banco?'],
    }),
    activeIdeationJson: JSON.stringify({
      'session-dir': '_reversa_sdd/brainstorms/001-x',
      'session-id': '001',
      'short-name': 'x',
      'current-stage': 'options',
    }),
    ideationDirFiles: ['idea.md', 'framing.md'],
  }

  it('exposes impact, watch, migration and ideation', () => {
    const process = readReversa(snapshot)
    expect(process.impact.files).toHaveLength(1)
    expect(process.impact.cenario).toBe('legado')
    expect(process.watch.items).toHaveLength(1)
    expect(process.migration.queue).toHaveLength(6)
    expect(process.migration.awaitingHuman).toBe(true)
    expect(process.ideation.stage).toBe('enquadrada')
  })

  it('gathers the anomalies of every axis in one list', () => {
    const process = readReversa({ ...snapshot, legacyImpactMd: '| Foo | Bar |\n|---|---|\n| a | b |\n' })
    expect(process.anomalies.some(a => a.code === 'tabela-nao-reconhecida')).toBe(true)
  })

  it('reports the new axes as absent when the files are not there', () => {
    const process = readReversa({ ...EMPTY_SNAPSHOT, stateJson: STATE })
    expect(process.impact.files).toEqual([])
    expect(process.watch.items).toEqual([])
    expect(process.migration.present).toBe(false)
    expect(process.ideation.present).toBe(false)
  })

  it('resolves the migration path from the state, not from a literal', () => {
    const custom = JSON.stringify({ output_folder: 'especificacoes' })
    const process = readReversa({ ...EMPTY_SNAPSHOT, stateJson: custom })
    expect(process.migrationStatePath).toBe('especificacoes/migration/.state.json')
  })

  it('falls back to the default output folder for the migration path', () => {
    const process = readReversa(EMPTY_SNAPSHOT)
    expect(process.migrationStatePath).toBe('_reversa_sdd/migration/.state.json')
  })
})
