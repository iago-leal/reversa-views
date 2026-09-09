/**
 * Processes to render, built by the inherited reader rather than by hand.
 *
 * A `ReversaProcess` has eight axes and dozens of fields, and writing one as a
 * literal would be writing a second, divergent, definition of the model. So
 * the fixtures here go the other way: they compose the FILES a REVERSA
 * installation would have, and hand them to `readReversa`, which is the same
 * function the host calls. What the panel is tested against is therefore what
 * the panel will actually receive.
 * @module tests/helpers/reversa-fixtures
 */

import { EMPTY_SNAPSHOT, readReversa } from '../../src/heranca/reversa-domain/src/index.ts'
import type { ReversaProcess, ReversaSnapshot } from '../../src/heranca/reversa-domain/src/index.ts'
import type { ProbeReport } from '../../src/heranca/reversa-probe/src/snapshot.ts'
import type { SetProcessData } from '../../src/host/protocol.ts'

/** What a caller may change about the installation the fixture describes. */
export interface FixtureOptions {
  /** Fields merged into `.reversa/state.json`. */
  state?: Record<string, unknown>
  /** Fields merged into `.reversa/active-requirements.json`; null removes the file. */
  activeRequirements?: Record<string, unknown> | null
  /** The body of `actions.md` of the active feature. */
  actionsMd?: string | null
  /** The body of `requirements.md` of the active feature. */
  requirementsMd?: string | null
  /** File names inside the feature directory. */
  featureDirFiles?: string[] | null
  /** Addenda file names under the output folder. */
  addendaFiles?: string[]
  /** Body of each addendum, by file name. */
  addendaBodies?: Record<string, string>
  /** The body of `.reversa/reversa-config.json`. */
  configJson?: string | null
  /** The body of the migration state file. */
  migrationStateJson?: string | null
}

const BASE_STATE = {
  version: '1.3.3',
  project: 'reversa-views',
  output_folder: '_reversa_sdd',
  forward_folder: '_reversa_forward',
  phase: 'escavacao',
  completed: ['reconhecimento'],
  pending: ['interpretacao', 'geracao', 'revisao'],
  checkpoints: {
    'reversa-explorer': { completed_at: '2026-09-09T10:00:00Z', files: ['a.md'] },
    'reversa-archaeologist': {},
  },
  engines: ['claude-code'],
  agents: ['reversa'],
  created_files: [],
}

const BASE_ACTIVE_REQUIREMENTS = {
  'schema-version': 1,
  'feature-dir': '_reversa_forward/003-painel-do-processo',
  'feature-id': '003',
  'short-name': 'painel-do-processo',
  'started-at': '2026-09-09T14:06:13Z',
  'current-stage': 'coding',
  'stages-completed': ['requirements', 'clarify', 'plan', 'to-do'],
  'paused-features': [],
}

/** An `actions.md` with the given counts of closed and open actions. */
export function actionsMd(closed: number, open: number): string {
  const rows: string[] = ['| ID | Descrição | Status |', '|----|-----------|--------|']
  for (let i = 1; i <= closed; i += 1) rows.push(`| T${String(i).padStart(3, '0')} | feito | \`[X]\` |`)
  for (let i = 1; i <= open; i += 1) {
    rows.push(`| T${String(closed + i).padStart(3, '0')} | aberto | \`[ ]\` |`)
  }
  return `# Actions: fixture\n\n## Fase 1, Preparação\n\n${rows.join('\n')}\n`
}

/** A `requirements.md` carrying `count` open doubt markers. */
export function requirementsMd(doubts: number): string {
  const marks = Array.from({ length: doubts }, (_, i) => `- [DÚVIDA] ponto ${i + 1}`).join('\n')
  return `# Requirements: fixture\n\n## 10. Lacunas\n\n${marks}\n`
}

/** Compose the snapshot of an installation and read it into a process. */
export function processFixture(options: FixtureOptions = {}): ReversaProcess {
  const state = { ...BASE_STATE, ...(options.state ?? {}) }
  const active =
    options.activeRequirements === null
      ? null
      : { ...BASE_ACTIVE_REQUIREMENTS, ...(options.activeRequirements ?? {}) }

  const snapshot: ReversaSnapshot = {
    ...EMPTY_SNAPSHOT,
    stateJson: JSON.stringify(state),
    configJson: options.configJson ?? JSON.stringify({ version: 1, allowLegacyEdits: false }),
    activeRequirementsJson: active === null ? null : JSON.stringify(active),
    featureDirFiles:
      options.featureDirFiles === undefined
        ? ['requirements.md', 'roadmap.md', 'actions.md']
        : options.featureDirFiles,
    actionsMd: options.actionsMd === undefined ? actionsMd(3, 2) : options.actionsMd,
    requirementsMd: options.requirementsMd === undefined ? requirementsMd(0) : options.requirementsMd,
    addendaFiles: options.addendaFiles ?? [],
    addendaBodies: options.addendaBodies ?? {},
    migrationStateJson: options.migrationStateJson ?? null,
  }

  return readReversa(snapshot)
}

/** A process for a workspace where REVERSA is not installed. */
export function emptyProcessFixture(): ReversaProcess {
  return readReversa(EMPTY_SNAPSHOT)
}

/** A probe report, with nothing refused and nothing truncated unless asked. */
export function probeFixture(overrides: Partial<ProbeReport> = {}): ProbeReport {
  return {
    workspace: '/w/reversa-views',
    featureDir: '_reversa_forward/003-painel-do-processo',
    sessionDir: null,
    refusals: [],
    truncated: [],
    ...overrides,
  }
}

/** The payload of a successful reading, ready to hand to the panel. */
export function payloadFixture(overrides: Partial<SetProcessData> = {}): SetProcessData {
  return {
    process: processFixture(),
    probe: probeFixture(),
    readAt: '2026-09-09T15:00:00Z',
    entry: 'installed',
    root: '/w/reversa-views',
    ignoredRoots: [],
    inheritedRevision: '420305daa6cdd10858b720a34cb8db67d8e5c5e9',
    ...overrides,
  }
}
