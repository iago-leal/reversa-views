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
import { readDecomposition } from '../../src/domain/decomposition.ts'
import type {
  ActiveDecomposition,
  BugContext,
  BugEntry,
  BugRegistry,
  ComponentLink,
  ConferenceLine,
  ConferenceRecord,
  ConferenceState,
  DeliveryAnomaly,
  DeliveryLinkReading,
  DeliveryLinkState,
  DiscoveryStateAnomaly,
  DiscoveryStateAxis,
  CheckpointState,
  GreenfieldAxis,
  HistoryEntry,
  LinkOrigin,
  PlannedComponent,
  ProductPanorama,
  ProjectHistory,
  ScopeItem,
  UnplannedFeature,
  UnspecifiedComponent,
} from '../../src/domain/types.ts'
import { EMPTY_BUG_COUNTS, EMPTY_PANORAMA } from '../../src/domain/types.ts'
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

/**
 * An `actions.md` with the given counts of closed and open actions, in the
 * seven columns the REVERSA template writes.
 *
 * The header is the canonical one on purpose: the reader of feature 006
 * matches it normalized and reads the cells by position, and a fixture with a
 * shorter header would exercise only the fallback.
 */
export function actionsMd(closed: number, open: number): string {
  const rows: string[] = [
    '| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |',
    '|----|-----------|--------------|-------------|--------------|-------------|--------|',
  ]
  const row = (index: number, what: string, mark: string): string =>
    `| T${String(index).padStart(3, '0')} | ${what} | - | - | \`src/x${index}.ts\` | - | \`${mark}\` |`
  for (let i = 1; i <= closed; i += 1) rows.push(row(i, 'feito', '[X]'))
  for (let i = 1; i <= open; i += 1) rows.push(row(closed + i, 'aberto', '[ ]'))
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

/**
 * The decomposition of the active feature, read by the same function the host
 * calls, over the same `actions.md` the process fixture describes.
 */
export function decompositionFixture(closed = 3, open = 2): ActiveDecomposition {
  return readDecomposition(actionsMd(closed, open), closed + open)
}

/** The history of the project, with the entries the caller wants in it. */
export function historyFixture(
  entradas: HistoryEntry[] = [...HISTORY_ENTRIES],
  overrides: Partial<ProjectHistory> = {},
): ProjectHistory {
  return { entradas, truncado: false, total: entradas.length, ...overrides }
}

/** Two features behind the active one: one converged, one paused and open. */
const HISTORY_ENTRIES: readonly HistoryEntry[] = [
  {
    pasta: '_reversa_forward/002-ponte-e-host',
    id: '002',
    nomeCurto: 'ponte-e-host',
    situacao: 'em-aberto',
    marca: 'pausada',
    acoes: { total: 32, fechadas: 30, abertas: 2, emendas: 0 },
    adendo: null,
    resumo: null,
    ultimoEvento: '2026-09-09T14:06:13Z',
  },
  {
    pasta: '_reversa_forward/001-leitura-do-processo',
    id: '001',
    nomeCurto: 'leitura-do-processo',
    situacao: 'convergida',
    marca: 'nenhuma',
    acoes: { total: 21, fechadas: 21, abertas: 0, emendas: 0 },
    adendo: '_reversa_sdd/addenda/001-leitura-do-processo.md',
    resumo: 'A feature entrega a camada de leitura do processo.',
    ultimoEvento: '2026-09-09T10:00:00Z',
  },
]

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
    decomposition: decompositionFixture(),
    history: historyFixture(),
    extensionVersion: '0.6.1',
    builtFromCommit: 'a23711d481021a978720c0bc478b6dabed94fec3',
    builtFromRoot: '/home/alguem/dev/reversa-views',
    bugs: bugsFixture(),
    greenfield: greenfieldFixture(),
    ...overrides,
  }
}

/**
 * One bug of the registry, with only what the caller cares to say.
 *
 * Everything else gets a usable default, which is what keeps a case about the
 * order from having to declare a severity it does not care about. The one field
 * with no default is the identifier: a bug without one is a case of its own and
 * has to be asked for.
 */
export function bugFixture(partes: Partial<BugEntry> & { id: string | null }): BugEntry {
  const nome = partes.id ?? 'BUG-SEM-ID'
  const entrada: BugEntry = {
    pasta: `_reversa_bugs/painel-do-processo/bugs/${nome}`,
    arquivo: `_reversa_bugs/painel-do-processo/bugs/${nome}/bug.md`,
    apelido: 1,
    titulo: `Defeito ${nome}`,
    estado: 'resolved',
    estadoBruto: 'resolved',
    fase: 'delivering',
    faseBruta: 'delivering',
    severidade: 'low',
    severidadeBruta: 'low',
    prioridade: 'P2',
    prioridadeBruta: 'P2',
    registrado: '2026-09-09',
    alterado: '2026-09-10',
    travado: true,
    encerrado: '2026-09-10',
    bloqueado: false,
    inconsistencia: null,
    ...partes,
  }

  // The raw value follows the recognised one unless the case asked for a raw of
  // its own. Without this, a case that overrides only `estado` would leave the
  // pair disagreeing -- a row whose attribute says `open` and whose text reads
  // "resolvido" -- and the disagreement would be the fixture's, not the code's.
  // The case that wants an unrecognised value states both, which is exactly what
  // an unrecognised value is: a raw with no recognised counterpart.
  return {
    ...entrada,
    estadoBruto: 'estadoBruto' in partes ? entrada.estadoBruto : entrada.estado,
    faseBruta: 'faseBruta' in partes ? entrada.faseBruta : entrada.fase,
    severidadeBruta: 'severidadeBruta' in partes ? entrada.severidadeBruta : entrada.severidade,
    prioridadeBruta: 'prioridadeBruta' in partes ? entrada.prioridadeBruta : entrada.prioridade,
  }
}

/** One context group, with the tally derived from the bugs it receives. */
export function bugContextFixture(
  contexto: string,
  bugs: BugEntry[],
  overrides: Partial<BugContext> = {},
): BugContext {
  const datas = bugs.map((bug) => bug.alterado).filter((data): data is string => data !== null)
  return {
    contexto,
    pasta: `_reversa_bugs/${contexto}`,
    bugs,
    contagem: {
      total: bugs.length,
      abertos: bugs.filter((bug) => bug.estado === 'open').length,
      ativos: bugs.filter((bug) => bug.estado === 'active').length,
      resolvidos: bugs.filter((bug) => bug.estado === 'resolved').length,
      restritos: 0,
    },
    ultimoMovimento:
      datas.length === 0 ? null : datas.reduce((maior, data) => (data > maior ? data : maior)),
    ...overrides,
  }
}

/**
 * The registry of the project, whose tally is SUMMED from the groups.
 *
 * Summed, and not declared, because that is what the reading does: RN-05 makes
 * the disk the authority, and a fixture that let the two disagree by accident
 * would be exercising the divergence in every case instead of in the one that
 * asks for it. The case that wants a divergence overrides `contagem` on
 * purpose.
 */
export function bugsFixture(
  contextos: BugContext[] = [...BUG_CONTEXTS],
  overrides: Partial<BugRegistry> = {},
): BugRegistry {
  const bugs = contextos.flatMap((contexto) => contexto.bugs)
  const soma = (campo: 'total' | 'abertos' | 'ativos' | 'resolvidos' | 'restritos'): number =>
    contextos.reduce((total, contexto) => total + contexto.contagem[campo], 0)

  return {
    presente: true,
    contextos,
    contagem: {
      total: soma('total'),
      abertos: soma('abertos'),
      ativos: soma('ativos'),
      resolvidos: soma('resolvidos'),
      restritos: soma('restritos'),
    },
    lidos: bugs.length,
    truncado: false,
    anomalias: [],
    ...overrides,
  }
}

/** The registry of a project that has no registry folder at all. */
export function absentBugsFixture(): BugRegistry {
  return {
    presente: false,
    contextos: [],
    contagem: { ...EMPTY_BUG_COUNTS },
    lidos: 0,
    truncado: false,
    anomalias: [],
  }
}

/**
 * The registry this project actually had on 2026-09-10: one context, three
 * bugs, all resolved and all locked.
 *
 * It is the shape the onboarding walks the reader through, so a case drawn over
 * it is a case anyone can check against the panel by opening it.
 */
const BUG_CONTEXTS: readonly BugContext[] = [
  bugContextFixture('painel-do-processo', [
    bugFixture({
      id: 'BUG-20260910-74UL',
      apelido: 3,
      titulo: 'Painel conta uma dúvida na feature 007 por menção ao marcador',
      alterado: '2026-09-10',
      registrado: '2026-09-10',
    }),
    bugFixture({
      id: 'BUG-20260909-VHII',
      apelido: 2,
      titulo: 'Extensão instalada anterior à feature 007 não declara procedência',
      severidade: 'medium',
      prioridade: 'P1',
    }),
    bugFixture({
      id: 'BUG-20260909-FJBD',
      apelido: 1,
      titulo: 'Cabeçalho declara leitura degradada por anomalia cenario-ambiguo',
    }),
  ]),
]

/* ------------------------------------------------------------ greenfield */

/**
 * One planned component, with only what the caller cares to say.
 *
 * The default is a CONVERGED component served by one folder, which is what the
 * five components of this project are. A case about a planned one overrides
 * the situation and empties the folders; the fixture does not derive one from
 * the other, because that derivation is the domain's and a fixture that
 * repeated it would be a second copy of the rule.
 */
export function componentFixture(
  partes: Partial<PlannedComponent> & { nome: string },
): PlannedComponent {
  const id = partes.pastas?.[0]?.match(/\/(\d+)-/)?.[1] ?? '001'
  return {
    spec: `_reversa_sdd/sdd/${partes.nome}.md`,
    situacao: 'convergida',
    marca: 'nenhuma',
    pastas: [`_reversa_forward/${id}-${partes.nome}`],
    adendo: `_reversa_sdd/addenda/${id}-${partes.nome}.md`,
    acoes: { total: 20, fechadas: 20, abertas: 0, emendas: 0 },
    ...partes,
  }
}

/** One feature folder the plan did not foresee. */
export function unplannedFixture(
  partes: Partial<UnplannedFeature> & { nomeCurto: string },
): UnplannedFeature {
  return {
    pasta: `_reversa_forward/006-${partes.nomeCurto}`,
    id: '006',
    situacao: 'convergida',
    marca: 'nenhuma',
    ...partes,
  }
}

/** One item of the declared scope of the PRD. */
export function scopeItemFixture(partes: Partial<ScopeItem> & { nome: string }): ScopeItem {
  return { grupo: null, detalhe: null, selo: null, ...partes }
}

/**
 * The five components of this project, as the panel reads them on 2026-09-11:
 * every one converged, each served by the folder of the same name.
 */
const COMPONENTS: readonly PlannedComponent[] = [
  componentFixture({ nome: 'leitura-do-processo', pastas: ['_reversa_forward/001-leitura-do-processo'] }),
  componentFixture({ nome: 'ponte-e-host', pastas: ['_reversa_forward/002-ponte-e-host'] }),
  componentFixture({ nome: 'painel-do-processo', pastas: ['_reversa_forward/003-painel-do-processo'] }),
  componentFixture({ nome: 'heranca-e-sincronia', pastas: ['_reversa_forward/004-heranca-e-sincronia'] }),
  componentFixture({
    nome: 'empacotamento-e-verificacao',
    pastas: ['_reversa_forward/005-empacotamento-e-verificacao'],
  }),
]

/** The folders born outside the plan, newest first, the active one included. */
const UNPLANNED: readonly UnplannedFeature[] = [
  unplannedFixture({
    pasta: '_reversa_forward/009-greenfield-e-features-do-prd',
    id: '009',
    nomeCurto: 'greenfield-e-features-do-prd',
    situacao: 'em-aberto',
    marca: 'ativa',
  }),
  unplannedFixture({
    pasta: '_reversa_forward/008-cronologia-do-ciclo-bugs',
    id: '008',
    nomeCurto: 'cronologia-do-ciclo-bugs',
  }),
  unplannedFixture({
    pasta: '_reversa_forward/007-atualizacao-e-progresso',
    id: '007',
    nomeCurto: 'atualizacao-e-progresso',
  }),
  unplannedFixture({ nomeCurto: 'cartoes-e-cronologia' }),
]

/** A few items of the scope of this project's PRD, in its three groups. */
const SCOPE: readonly ScopeItem[] = [
  scopeItemFixture({
    grupo: 'Núcleo, o que responde "onde estou e o que faço agora"',
    nome: 'Identidade da instalação',
    detalhe: 'projeto, versão do framework, pastas de saída e forward resolvidas.',
    selo: '🟡',
  }),
  scopeItemFixture({
    grupo: 'Núcleo, o que responde "onde estou e o que faço agora"',
    nome: 'Bloqueio humano',
    detalhe: 'destaque do que aguarda decisão sua.',
    selo: '🟡',
  }),
  scopeItemFixture({
    grupo: 'Diagnóstico, o que impede o painel de mentir em silêncio',
    nome: 'Anomalias',
    detalhe: 'toda degradação que o modelo encontrou ao ler.',
    selo: '🟡',
  }),
  scopeItemFixture({
    grupo: 'Comportamento',
    nome: 'Leitura automática na ativação, sem comando prévio nem configuração de caminho.',
    selo: '🟡',
  }),
]

/**
 * The panorama of the project, whose converged count is COUNTED from the
 * components rather than declared, for the same reason the bug tally is
 * summed: the case that wants a divergence overrides `convergidos` on purpose.
 */
export function panoramaFixture(
  componentes: PlannedComponent[] = [...COMPONENTS],
  overrides: Partial<ProductPanorama> = {},
): ProductPanorama {
  return {
    componentes,
    foraDoPlano: [...UNPLANNED],
    escopo: [...SCOPE],
    escopoEncontrado: true,
    totalDeSpecs: componentes.length,
    truncado: false,
    convergidos: componentes.filter((componente) => componente.situacao === 'convergida').length,
    ...overrides,
  }
}

/**
 * The greenfield axis of this project as it stands: the four artifacts present,
 * five specs, the pipeline done in guided mode, and the metadata one step
 * behind nothing.
 */
export function greenfieldFixture(overrides: Partial<GreenfieldAxis> = {}): GreenfieldAxis {
  return {
    cenario: 'greenfield',
    estagio: 'especificado',
    artefatos: { brief: true, ideacao: true, personas: true, prd: true, specs: 5 },
    caminhos: {
      brief: '_reversa_sdd/newproject-brief.md',
      ideacao: '_reversa_sdd/ideation.md',
      personas: '_reversa_sdd/personas.md',
      prd: '_reversa_sdd/prd.md',
    },
    metadado: {
      modo: 'guiado',
      estagio: 'done',
      iniciadoEm: '2026-09-09T10:31:12Z',
      ultimoCheckpointEm: '2026-09-09T11:03:11Z',
      concluidos: ['ideator', 'researcher', 'drafter', 'spec-sdd'],
      brief: 'criar uma extensao para o VSCode com o intuito de visualizarmos o pipeline do reversa.',
    },
    resumo: 'Criar uma extensão para o VSCode com o intuito de visualizarmos o pipeline do Reversa.',
    panorama: panoramaFixture(),
    anomalias: [],
    truncados: [],
    ...overrides,
  }
}

/** The axis of a legacy project: the two anchors of the extraction, and nothing of `/reversa-new`. */
export function legacyGreenfieldFixture(): GreenfieldAxis {
  return greenfieldFixture({
    cenario: 'legado',
    estagio: 'ausente',
    artefatos: { brief: false, ideacao: false, personas: false, prd: false, specs: 0 },
    caminhos: { brief: null, ideacao: null, personas: null, prd: null },
    metadado: null,
    resumo: null,
    panorama: { ...EMPTY_PANORAMA, foraDoPlano: [...UNPLANNED] },
  })
}

/** The axis of a project with no anchor at all: neither extraction nor `/reversa-new`. */
export function anchorlessGreenfieldFixture(): GreenfieldAxis {
  return { ...legacyGreenfieldFixture(), cenario: 'sem-ancora' }
}

/**
 * The axis of a project that ran `/reversa-new` up to the personas and stopped:
 * the PRD is not written, and the pipeline waits on the drafter.
 */
export function partialGreenfieldFixture(): GreenfieldAxis {
  return greenfieldFixture({
    cenario: 'sem-ancora',
    estagio: 'pesquisado',
    artefatos: { brief: true, ideacao: true, personas: true, prd: false, specs: 0 },
    caminhos: {
      brief: '_reversa_sdd/newproject-brief.md',
      ideacao: '_reversa_sdd/ideation.md',
      personas: '_reversa_sdd/personas.md',
      prd: null,
    },
    metadado: {
      modo: 'guiado',
      estagio: 'drafter',
      iniciadoEm: '2026-09-09T10:31:12Z',
      ultimoCheckpointEm: '2026-09-09T10:50:00Z',
      concluidos: ['ideator', 'researcher'],
      brief: 'criar uma extensao para o VSCode.',
    },
    panorama: { ...EMPTY_PANORAMA, foraDoPlano: [...UNPLANNED] },
  })
}

/** The axis of a project whose PRD is written and whose `sdd/` folder is still empty. */
export function undecomposedGreenfieldFixture(): GreenfieldAxis {
  return greenfieldFixture({
    cenario: 'sem-ancora',
    estagio: 'redigido',
    artefatos: { brief: true, ideacao: true, personas: true, prd: true, specs: 0 },
    metadado: {
      modo: 'guiado',
      estagio: 'spec-sdd',
      iniciadoEm: '2026-09-09T10:31:12Z',
      ultimoCheckpointEm: '2026-09-09T11:00:00Z',
      concluidos: ['ideator', 'researcher', 'drafter'],
      brief: 'criar uma extensao para o VSCode.',
    },
    panorama: panoramaFixture([], { foraDoPlano: [...UNPLANNED] }),
  })
}

/* ------------------------------------------------------------ feature 010 */

/*
 * The builders of feature 010. Every fixture ABOVE stays without the new
 * fields, on purpose: it is what a host older than feature 010 sends, and the
 * suites that draw it are the proof that the screen names the absence instead
 * of drawing an empty block. The builders below are how a case asks for the
 * fields, explicitly.
 */

/** The reading of the `legacy-impact.md` of one folder, in one of the three states. */
export function deliveryLinkFixture(
  estado: DeliveryLinkReading = 'lido',
  pasta = '_reversa_forward/001-leitura-do-processo',
  tabelas = estado === 'lido' ? 1 : 0,
): DeliveryLinkState {
  return { estado, arquivo: estado === 'ausente' ? null : `${pasta}/legacy-impact.md`, tabelas }
}

/** One row of the register; registered when date and result are both written. */
export function conferenceLineFixture(partes: Partial<ConferenceLine> = {}): ConferenceLine {
  const line = { data: null, marco: null, item: null, resultado: null, observacao: null, ...partes }
  return { ...line, registrada: line.data !== null && line.resultado !== null, ...partes }
}

/**
 * The register of one folder, in any of the six states, coherent with it.
 *
 * `lido` is the shape measured in the 002 of `financas-ali` on 2026-09-19:
 * twenty rows, two registered, one of them "não executável". The others are
 * the smallest record their state allows.
 */
export function conferenceFixture(
  estado: ConferenceState = 'lido',
  pasta = '_reversa_forward/002-ponte-e-host',
  overrides: Partial<ConferenceRecord> = {},
): ConferenceRecord {
  const arquivo = estado === 'sem-registro' ? null : `${pasta}/onboarding.md`
  const secao = estado === 'sem-registro' || estado === 'nao-lido' ? null : '9. Registro de conferências'
  const linhas: ConferenceLine[] =
    estado === 'lido' || estado === 'truncado'
      ? [
          conferenceLineFixture({ data: '2026-09-19', marco: 'M2', item: '1 a 11', resultado: '11 conferem' }),
          ...Array.from({ length: 18 }, (_, i) => conferenceLineFixture({ marco: `M${i % 6}`, item: `passo ${i + 1}` })),
          conferenceLineFixture({ data: '2026-09-19', marco: 'Segredos', resultado: 'não executável' }),
        ]
      : []
  const registradas = linhas.filter((line) => line.registrada).length
  const total = estado === 'truncado' ? 120 : linhas.length
  return { estado, arquivo, secao, linhas, registradas, total, ...overrides }
}

/** One entry of the history, carrying the two fields of feature 010. */
export function linkedEntryFixture(
  entry: HistoryEntry,
  vinculo: DeliveryLinkState = deliveryLinkFixture('lido', entry.pasta),
  conferencias: ConferenceRecord = conferenceFixture('sem-registro', entry.pasta),
): HistoryEntry {
  return { ...entry, vinculo, conferencias }
}

/**
 * The history as a host of feature 010 sends it: every entry with the link and
 * the register, the losses of the axis in their own list.
 */
export function linkedHistoryFixture(
  anomalias: DeliveryAnomaly[] = [],
  entradas: HistoryEntry[] = HISTORY_ENTRIES.map((entry) => linkedEntryFixture(entry)),
): ProjectHistory {
  return { ...historyFixture(entradas), anomalias }
}

/** One link of a component to a folder, with the impact file the folder would have. */
export function componentLinkFixture(pasta: string, origem: LinkOrigin = 'nome'): ComponentLink {
  return { pasta, origem, impacto: `${pasta}/legacy-impact.md` }
}

/** A planned component with its links, one per folder, all of the same origin. */
export function linkedComponentFixture(
  partes: Partial<PlannedComponent> & { nome: string },
  origem: LinkOrigin = 'nome',
): PlannedComponent {
  const c = componentFixture(partes)
  return { ...c, ligacoes: c.pastas.map((pasta) => componentLinkFixture(pasta, origem)), ...partes }
}

/** A component delivered without a spec, declared by one folder unless told otherwise. */
export function unspecifiedFixture(
  partes: Partial<UnspecifiedComponent> & { nome: string },
): UnspecifiedComponent {
  const pastas = partes.pastas ?? ['_reversa_forward/002-infra-remota-auth-assistente']
  return {
    situacao: 'convergida',
    marca: 'nenhuma',
    pastas,
    impactos: pastas.map((pasta) => `${pasta}/legacy-impact.md`),
    ...partes,
  }
}

/** The three components the 002 of `financas-ali` delivered without a spec, out of name order. */
export const UNSPECIFIED: readonly UnspecifiedComponent[] = [
  unspecifiedFixture({ nome: 'operacao-de-producao' }),
  unspecifiedFixture({ nome: 'assistente' }),
  unspecifiedFixture({ nome: 'acesso-e-identidade' }),
]

/**
 * The panorama as a host of feature 010 sends it: the five components of this
 * project linked by name, and the list of components without a spec, empty
 * unless the caller brings one.
 */
export function linkedPanoramaFixture(
  semSpec: UnspecifiedComponent[] = [],
  overrides: Partial<ProductPanorama> = {},
): ProductPanorama {
  const componentes = COMPONENTS.map((c) => ({
    ...c,
    ligacoes: c.pastas.map((pasta) => componentLinkFixture(pasta, 'nome')),
  }))
  return { ...panoramaFixture(componentes), semSpec, vinculoParcial: false, ...overrides }
}

/** The greenfield axis with the panorama of feature 010. */
export function linkedGreenfieldFixture(
  semSpec: UnspecifiedComponent[] = [],
  overrides: Partial<ProductPanorama> = {},
): GreenfieldAxis {
  return greenfieldFixture({ panorama: linkedPanoramaFixture(semSpec, overrides) })
}

/**
 * One checkpoint as feature 011 judges it, with a usable default for what the
 * caller does not care to say.
 * @param partes - what the case is actually about.
 * @returns the judged checkpoint.
 */
export function checkpointStateFixture(
  partes: Partial<CheckpointState> & { agent: string },
): CheckpointState {
  return {
    situacao: 'concluido',
    instante: '2026-09-09T10:00:00Z',
    camposComLista: [],
    ...partes,
  }
}

/**
 * The discovery-state axis, by default of a project mid-extraction with
 * nothing absorbed -- which is the shape that leaves every existing case
 * behaving exactly as it did.
 * @param overrides - what the case is about.
 * @returns the axis.
 */
export function discoveryStateFixture(
  overrides: Partial<DiscoveryStateAxis> = {},
): DiscoveryStateAxis {
  return {
    extracao: { situacao: 'em-curso', bruto: 'geracao' },
    checkpoints: [checkpointStateFixture({ agent: 'scout' })],
    anomalias: [],
    absorvidas: [],
    ...overrides,
  }
}

/**
 * The axis of an extraction that finished, with the inherited anomaly of the
 * closing phase already absorbed.
 *
 * The absorbed triple has to match what `derivePhases` of the inherited layer
 * would have recorded, `detail` included, or the composition discounts
 * nothing: that is the whole point of feature 011, and a fixture that got it
 * wrong would hide the defect it exists to catch.
 * @param bruto - the closing value the file carries.
 * @returns the axis.
 */
export function closedDiscoveryFixture(bruto = 'concluido'): DiscoveryStateAxis {
  return discoveryStateFixture({
    extracao: { situacao: 'encerrada', bruto },
    absorvidas: [{ file: '.reversa/state.json', code: 'fase-desconhecida', detail: bruto }],
  })
}

/**
 * The axis of the `med-reversa`: extraction closed, and every checkpoint with
 * its conclusion declared outside the canonical field.
 * @param agentes - the agent names; the seven measured by default.
 * @returns the axis.
 */
export function undeclaredDiscoveryFixture(
  agentes: string[] = ['plano_aprovado', 'scout', 'archaeologist', 'detective', 'architect', 'writer', 'reviewer'],
): DiscoveryStateAxis {
  const anomalias: DiscoveryStateAnomaly[] = agentes.map((agent) => ({
    file: '.reversa/state.json',
    code: 'checkpoint-sem-conclusao-declarada',
    detail: `${agent}: sem completed_at`,
  }))
  return {
    ...closedDiscoveryFixture(),
    checkpoints: agentes.map((agent) =>
      checkpointStateFixture({ agent, situacao: 'conclusao-nao-declarada', instante: null }),
    ),
    anomalias,
  }
}
