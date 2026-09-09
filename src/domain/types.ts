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
