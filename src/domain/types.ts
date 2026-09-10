/**
 * The vocabulary of the two readings feature 006 adds: the decomposition of
 * the active feature and the history of the project (D-07, D-19).
 *
 * Types and constants only. It is declared apart from the modules that judge
 * -- `history.ts` and `decomposition.ts` -- because the panel needs these
 * SHAPES and must never reach the code that produces them: the webview
 * imports this file as a type, the same way it already imports the protocol,
 * and nothing of the reading layer survives into the bundle.
 *
 * The field names follow the inherited tally of `ActionsScan`, which the panel
 * already draws: `total`, `fechadas`, `abertas`, `emendas`. Two shapes that
 * count the same thing under two spellings would be two vocabularies, and the
 * reader would have to learn both.
 * @module domain/types
 */

/** How the list of actions was obtained, which the panel declares to the reader. */
export const DECOMPOSITION_SOURCES = ['tabela', 'varredura', 'ausente'] as const

/** One of the three ways the decomposition can have been read. */
export type DecompositionSource = (typeof DECOMPOSITION_SOURCES)[number]

/** One action of the plan, as `actions.md` writes it. */
export interface PlanAction {
  /** The identifier as it stands in the file, e.g. `T012`. */
  id: string
  descricao: string
  /** The level-2 heading the row sat under; null when the row had none. */
  fase: string | null
  /** True when the row came from the amendments section (RN-05). */
  emenda: boolean
  /** Read from the marker of the row itself, never from a declared field (RN-04). */
  fechada: boolean
  arquivoAlvo: string | null
}

/**
 * The decomposition of the active feature.
 *
 * `lida` is false when there is no active feature or the file was not read,
 * which is a different statement from "there are no actions": RF-13 forbids
 * the panel from making one of them look like the other.
 *
 * `divergencia` is filled only when the inherited count and the length of the
 * list disagree. The inherited count remains the authority on how many actions
 * exist (D-08), and the disagreement is an anomaly to show, not a number to
 * choose between.
 */
export interface ActiveDecomposition {
  lida: boolean
  origem: DecompositionSource
  acoes: PlanAction[]
  divergencia: { contadas: number; listadas: number } | null
}

/** The decomposition of a project with no active feature to decompose. */
export const EMPTY_DECOMPOSITION: ActiveDecomposition = {
  lida: false,
  origem: 'ausente',
  acoes: [],
  divergencia: null,
}

/** Where one feature folder stands, derived from its own artifacts. */
export const FEATURE_SITUATIONS = [
  'convergida',
  'entregue-sem-adendo',
  'em-aberto',
  'sem-acoes',
] as const

/** One of the four situations. */
export type FeatureSituation = (typeof FEATURE_SITUATIONS)[number]

/** What the pointer REVERSA keeps says about one feature folder. */
export const FEATURE_MARKS = ['ativa', 'pausada', 'nenhuma'] as const

/** One of the three marks. */
export type FeatureMark = (typeof FEATURE_MARKS)[number]

/**
 * One feature folder in the history.
 *
 * Situation and mark are two axes and not one, and neither is called stage
 * (D-19). A paused feature can be in any situation, and merging the two would
 * force a choice of which truth to tell; keeping the names apart also avoids
 * creating a second authority over the stage, which goes on coming from the
 * inherited contract.
 */
export interface HistoryEntry {
  /** Path relative to the observed root, for `openFile` to reach. */
  pasta: string
  /** The prefix, when the folder follows the framework's naming. */
  id: string | null
  nomeCurto: string | null
  situacao: FeatureSituation
  marca: FeatureMark
  acoes: { total: number; fechadas: number; abertas: number; emendas: number }
  /** Path of the addendum in force, when there is one. */
  adendo: string | null
  /** One line, derived in the three steps of D-18; null when neither source had it. */
  resumo: string | null
  /** The most recent instant of the trail, absolute, converted only on screen. */
  ultimoEvento: string | null
}

/** Every feature folder of the project, newest first (D-16). */
export interface ProjectHistory {
  entradas: HistoryEntry[]
  /** True above the ceiling of folders, which the panel declares. */
  truncado: boolean
  /** How many folders exist, even when not all of them were read. */
  total: number
}

/** The history of a project whose forward folder was not read at all. */
export const EMPTY_HISTORY: ProjectHistory = { entradas: [], truncado: false, total: 0 }

/* ------------------------------------------------------------------ bugs */

/**
 * The vocabulary of the bug registry, which feature 008 adds (RN-03, RF-12,
 * D-04).
 *
 * The AUTHORITY over these four vocabularies is the schema of
 * `/reversa-debugger`, and not this file. What is written here is the copy the
 * panel needs in order to decide what is a KNOWN label: a value outside the
 * list is drawn raw and marked unrecognised, never refused and never thrown
 * away. If the schema grows, the panel degrades in the declared way rather
 * than failing, and reconciling the two lists is one line.
 */

/** The three states of the life cycle; blocking is a condition, never a fourth. */
export const BUG_STATES = ['open', 'active', 'resolved'] as const

/** One of the three states. */
export type BugState = (typeof BUG_STATES)[number]

/** The ten phases that detail an active bug, as the schema writes them. */
export const BUG_PHASES = [
  'triaging',
  'mitigating',
  'reproducing',
  'diagnosing',
  'planning',
  'testing',
  'patching',
  'delivering',
  'observing',
  'awaiting-human',
] as const

/** One of the ten phases. */
export type BugPhase = (typeof BUG_PHASES)[number]

/** The phase that means the bug is waiting on a person, which RF-10 raises to the band. */
export const AWAITING_HUMAN_PHASE: BugPhase = 'awaiting-human'

/** How big the damage is, which is not how urgent the fix is. */
export const BUG_SEVERITIES = ['critical', 'high', 'medium', 'low'] as const

/** One of the four severities. */
export type BugSeverity = (typeof BUG_SEVERITIES)[number]

/** How urgent the fix is, which is not how big the damage is. */
export const BUG_PRIORITIES = ['P0', 'P1', 'P2', 'P3'] as const

/** One of the four priorities. */
export type BugPriority = (typeof BUG_PRIORITIES)[number]

/** The two asymmetries RN-04 makes the panel DECLARE rather than resolve. */
export const BUG_INCONSISTENCIES = ['resolvido-sem-trava', 'trava-sem-resolvido'] as const

/** One of the two inconsistencies. */
export type BugInconsistency = (typeof BUG_INCONSISTENCIES)[number]

/**
 * One bug of the registry, as the panel draws it.
 *
 * Every field may be absent, and absent is DIFFERENT from empty: what was not
 * read is declared missing by name, never drawn blank (RF-04, RF-13).
 *
 * The pair of recognised value and raw value repeats the pattern of `Label`,
 * which the screen already uses for stages and phases: the panel draws what it
 * read and marks as unrecognised what it does not know, instead of pretending
 * it read it.
 */
export interface BugEntry {
  /** Path of the bug folder, relative to the observed root. */
  pasta: string
  /** Path of the `bug.md`, which is what the open-file message receives. */
  arquivo: string
  /** The canonical identifier; null when the front matter had none. */
  id: string | null
  /** `display_number`, the human alias; null when absent or not a number. */
  apelido: number | null
  titulo: string | null
  /** One of the three, or null when absent or unrecognised. */
  estado: BugState | null
  /** The value as it came, including when unrecognised. */
  estadoBruto: string | null
  fase: BugPhase | null
  faseBruta: string | null
  severidade: BugSeverity | null
  severidadeBruta: string | null
  prioridade: BugPriority | null
  prioridadeBruta: string | null
  /** `created`, in the day form the registry writes; never an instant (RN-06). */
  registrado: string | null
  /** `updated`, which is also what orders the list. */
  alterado: string | null
  /** True when `DONE.md` is present, which is the FACT of the closing. */
  travado: boolean
  /** The date written in the lock; null with a lock present means a lock without a date. */
  encerrado: string | null
  /** True when `blocking` carried at least one item (RF-10). */
  bloqueado: boolean
  /** Declared, never resolved: RN-04 forbids the panel from choosing. */
  inconsistencia: BugInconsistency | null
}

/** What a tally of bugs counts, in the registry and in each context alike. */
export interface BugCounts {
  /** Everything found on disk, restricted ones included (RN-05). */
  total: number
  abertos: number
  ativos: number
  resolvidos: number
  /** How many were left out by RN-02; their content never travels (D-11). */
  restritos: number
}

/** A tally of nothing, which is what an absent registry counts. */
export const EMPTY_BUG_COUNTS: BugCounts = {
  total: 0,
  abertos: 0,
  ativos: 0,
  resolvidos: 0,
  restritos: 0,
}

/**
 * One context of the registry, which is how the registry organises itself on
 * disk (RN-09).
 *
 * The tally is the tally OF THIS CONTEXT, and never of the project: RN-09
 * forbids presenting the two as the same thing.
 */
export interface BugContext {
  /** The bare name of the context folder. */
  contexto: string
  /** Path of the context, relative to the observed root. */
  pasta: string
  /** The bugs of this context, restricted ones already removed. */
  bugs: BugEntry[]
  contagem: BugCounts
  /** The greatest `updated` of the group, which orders the groups (RN-07). */
  ultimoMovimento: string | null
}

/**
 * Why a piece of the registry could not be read as expected (D-04).
 *
 * A LOCAL union, and deliberately not an addition to `AnomalyCode` of the
 * inherited package: that one is a closed union in a vendored file, and
 * extending it would cost a declared adaptation and a conflict at the next
 * resynchronisation, to gain nothing the common shape does not already give.
 * The shape is the same as the inherited `Anomaly` -- file, code, optional
 * detail -- so the anomalies section draws both origins in one list.
 */
export type BugAnomalyCode =
  | 'bug-sem-front-matter'
  | 'front-matter-ilegivel'
  | 'bug-sem-identificador'
  | 'estado-de-bug-desconhecido'
  | 'fase-de-bug-desconhecida'
  | 'severidade-de-bug-desconhecida'
  | 'data-de-bug-invalida'
  | 'trava-sem-data'
  | 'bug-inconsistente'
  | 'bug-ilegivel'

/** One degradation of the registry reading, in the inherited shape. */
export interface BugAnomaly {
  file: string
  code: BugAnomalyCode
  detail?: string
}

/**
 * The structural shape the anomalies section receives, common to both origins
 * (D-04).
 *
 * The code travels as TEXT here, and that is the whole point: the section
 * draws a code it does not know rather than breaking, and neither vocabulary
 * has to learn about the other.
 */
export interface DisplayAnomaly {
  file: string
  code: string
  detail?: string
}

/**
 * The bug registry of the project.
 *
 * `presente` false is what RF-13 makes the panel NAME: a project without the
 * registry folder is an absence to declare, and not an anomaly to record. It
 * is also different from an absent field of the payload, which means the
 * reading did not happen at all.
 */
export interface BugRegistry {
  presente: boolean
  contextos: BugContext[]
  /** The tally of the whole project, counted apart from each context (RN-09). */
  contagem: BugCounts
  /** How many bugs the pass actually read, which the ceiling may cut (RF-15). */
  lidos: number
  /** True when the ceiling stopped the walk short. */
  truncado: boolean
  anomalias: BugAnomaly[]
}

/** The registry of a project that has no registry folder at all. */
export const EMPTY_BUG_REGISTRY: BugRegistry = {
  presente: false,
  contextos: [],
  contagem: EMPTY_BUG_COUNTS,
  lidos: 0,
  truncado: false,
  anomalias: [],
}
