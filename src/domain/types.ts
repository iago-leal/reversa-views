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
  // The `actions.md` is present and was not read (bug nº 11, EC-06): none of
  // the four above can be verified, and `sem-acoes` would state a fact the
  // panel never checked.
  'acoes-nao-lidas',
] as const

/** One of the five situations. */
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
  /**
   * Whether the `legacy-impact.md` of the folder was read (feature 010, D-05).
   *
   * APPENDED and optional: ABSENT is a host older than feature 010, which did
   * not read the link at all, and the screen says so by a sentence. Only the
   * state and the path travel; the cells are input of the crossing and stay in
   * the host.
   */
  vinculo?: DeliveryLinkState
  /**
   * The conference register of the `onboarding.md` of the folder (feature 010,
   * RN-05, RN-07). A second axis beside the situation, which it never changes.
   * ABSENT is a host older than feature 010: conferences not read.
   */
  conferencias?: ConferenceRecord
}

/** Every feature folder of the project, newest first (D-16). */
export interface ProjectHistory {
  entradas: HistoryEntry[]
  /** True above the ceiling of folders, which the panel declares. */
  truncado: boolean
  /** How many folders exist, even when not all of them were read. */
  total: number
  /**
   * The losses of the folder reading and of the delivery axis, in the common
   * shape (feature 010, D-12; bug nº 11).
   * APPENDED and optional: ABSENT is a host older than feature 010.
   */
  anomalias?: DeliveryAnomaly[]
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

/* ------------------------------------------------------------ greenfield */

/**
 * The vocabulary of the greenfield axis, which feature 009 adds (RN-01 to
 * RN-08, RF-03, RF-05, RF-07).
 *
 * Types and constants only, for the same reason as everything above: the
 * panel needs these SHAPES and must never reach the code that produces them.
 *
 * The AUTHORITY over what a greenfield project looks like on disk is the
 * `/reversa-new` pipeline, and this file holds the copy the panel needs. The
 * stage is read from the ARTIFACTS, never from the metadata `state.json`
 * keeps about the pipeline: that metadata lags the disk by one step in guided
 * mode as a matter of course, and a panel that believed it would tell the
 * reader the project is one agent behind where it actually is.
 */

/**
 * The six physical stages of the greenfield pipeline, in order (RF-03).
 *
 * The stage is the longest CONTIGUOUS run of artifacts present, in the order
 * of `limits.ts`: `aberto` means the brief alone, and each next stage adds the
 * next artifact. A later artifact present without an earlier one does not
 * advance the stage; it opens an anomaly instead (D-02).
 */
export const GREENFIELD_STAGES = [
  'ausente',
  'aberto',
  'ideado',
  'pesquisado',
  'redigido',
  'especificado',
] as const

/** One of the six stages. */
export type GreenfieldStage = (typeof GREENFIELD_STAGES)[number]

/**
 * The four scenarios of a project, by the anchor rule of `/reversa-coding`
 * (RN-03).
 *
 * Legacy is `architecture.md` and `domain.md` together; greenfield is `prd.md`
 * and at least one spec; both together is mixed; neither is no anchor. The
 * scenario is declared and changes the reading of no other axis.
 */
export const PROJECT_SCENARIOS = ['legado', 'greenfield', 'misto', 'sem-ancora'] as const

/** One of the four scenarios. */
export type ProjectScenario = (typeof PROJECT_SCENARIOS)[number]

/**
 * What `newproject_progress` of `state.json` said, read tolerantly (RF-02,
 * RF-05).
 *
 * Every value is RAW. The mode and the stage are vocabularies of the pipeline
 * and not of this file, so a token the panel does not know is drawn as it came
 * and marked unrecognised, never refused. The whole object is null when the
 * field is absent, which is what a legacy project has, and that is not an
 * anomaly.
 */
export interface GreenfieldMetadata {
  /** `mode`: `guiado` or `expresso` today; drawn raw when neither. */
  modo: string | null
  /** `stage`: the NEXT agent to run, as the pipeline writes it. */
  estagio: string | null
  /** `started_at`, absolute, converted only on screen. */
  iniciadoEm: string | null
  /** `last_checkpoint_at`, absolute, converted only on screen. */
  ultimoCheckpointEm: string | null
  /** `completed_stages`, as written. */
  concluidos: string[]
  /** `brief`, the second source of the summary line (RF-06). */
  brief: string | null
}

/** Which of the artifacts of the pipeline are on disk; the specs by count. */
export interface GreenfieldArtifacts {
  brief: boolean
  ideacao: boolean
  personas: boolean
  prd: boolean
  /** How many specs exist in the folder, even above the ceiling. */
  specs: number
}

/**
 * The path of each artifact present, relative to the observed root, for
 * `openFile` to reach; null when the artifact is absent.
 */
export interface GreenfieldPaths {
  brief: string | null
  ideacao: string | null
  personas: string | null
  prd: string | null
}

/**
 * Where one planned component stands, projected from the history (RN-06,
 * D-08).
 *
 * It is a PROJECTION of the situation of the feature folder and not a second
 * judgment: without a folder the component is planned; a folder still open is
 * in progress; a folder delivered without an addendum is delivered; a folder
 * with an addendum in force has converged. The names are deliberately not the
 * ones of `FEATURE_SITUATIONS`, because a component and a folder are two
 * things, and one spec may be served by more than one folder (RN-05).
 */
export const COMPONENT_SITUATIONS = [
  'planejada',
  'em-andamento',
  'entregue',
  'convergida',
] as const

/** One of the four situations of a component. */
export type ComponentSituation = (typeof COMPONENT_SITUATIONS)[number]

/**
 * One planned component: a spec of the `sdd/` folder, crossed with the
 * history (RF-07).
 *
 * The `Status` field of the spec is NOT read (RN-04): the five specs of this
 * project say "Rascunho" with the five delivered, and a field nobody updates
 * would be drawn as a truth with a seal on it. The disk decides.
 */
export interface PlannedComponent {
  /** The file name of the spec without its extension, which is the name of the component. */
  nome: string
  /** Path of the spec, relative to the observed root. */
  spec: string
  situacao: ComponentSituation
  /** `ativa` when any matched folder is the active one; `pausada` when any is paused. */
  marca: FeatureMark
  /** Every folder that matched, newest first; empty for a planned component. */
  pastas: string[]
  /** The addendum in force of the most advanced folder, when there is one. */
  adendo: string | null
  /** The tally of the most advanced folder; null when no folder matched, declared by name. */
  acoes: { total: number; fechadas: number; abertas: number; emendas: number } | null
  /**
   * One link per folder in `pastas`, in the same order, saying WHY the folder
   * is there: by name or declared (feature 010, D-06, RF-13). APPENDED and
   * optional: ABSENT is a host older than feature 010.
   */
  ligacoes?: ComponentLink[]
}

/** A feature folder the plan did not foresee (RN-05). */
export interface UnplannedFeature {
  pasta: string
  id: string | null
  nomeCurto: string | null
  /** The situation of the FOLDER, as the history judged it, with no projection. */
  situacao: FeatureSituation
  marca: FeatureMark
}

/**
 * One top-level item of the scope section of the PRD, read as prose (RN-14).
 *
 * It has no situation, and that is a rule and not an omission (RN-04): an item
 * of the scope is an axis or a behaviour, not a unit of delivery, and matching
 * it against a folder would be the panel inventing a correspondence.
 */
export interface ScopeItem {
  /** The bold paragraph the item sat under, when there was one. */
  grupo: string | null
  /** The text before the first colon, or the first sentence when there is none. */
  nome: string
  /** The rest of the item, when there was a rest. */
  detalhe: string | null
  /** The confidence seal the item carried, kept apart from the text. */
  selo: string | null
}

/**
 * The panorama of the product: what was planned, what came outside the plan,
 * and what the PRD declared (RF-07, RN-07).
 *
 * `totalDeSpecs` counts what is on DISK and `componentes` carries what was
 * read; the two differ only above the ceiling, and the screen measures its
 * list against the count (RN-05 of feature 006, D-15).
 */
export interface ProductPanorama {
  /** In the order they were read; the order of DISPLAY is decided on screen (D-15). */
  componentes: PlannedComponent[]
  foraDoPlano: UnplannedFeature[]
  escopo: ScopeItem[]
  /** False when the PRD was read and had no recognisable scope section. */
  escopoEncontrado: boolean
  /** How many specs exist in the folder, even when the ceiling cut the reading. */
  totalDeSpecs: number
  /** True when the ceiling stopped the reading of the specs short. */
  truncado: boolean
  /** The N of "N de M componentes planejados convergidos" (RN-07). */
  convergidos: number
  /**
   * The components a delivery declared and no spec names (feature 010, RN-04,
   * D-08). Outside `convergidos` and outside the denominator. APPENDED and
   * optional: ABSENT is a host older than feature 010, which the screen names
   * as "vínculo declarado não lido" rather than drawing an empty block.
   */
  semSpec?: UnspecifiedComponent[]
  /** True when some folder has its `legacy-impact.md` present and not read (feature 010). */
  vinculoParcial?: boolean
}

/** The panorama of a project with no spec and no scope at all. */
export const EMPTY_PANORAMA: ProductPanorama = {
  componentes: [],
  foraDoPlano: [],
  escopo: [],
  escopoEncontrado: false,
  totalDeSpecs: 0,
  truncado: false,
  convergidos: 0,
}

/**
 * Why a piece of the greenfield axis could not be read as expected (D-19).
 *
 * A LOCAL union, by the precedent of `BugAnomalyCode`: the inherited union is
 * closed, and the common shape `DisplayAnomaly` is what the anomalies section
 * draws. What is NOT here is as deliberate as what is: an absent PRD, an empty
 * `sdd/`, an absent metadata field and an unknown mode are all named states of
 * the reading, never anomalies.
 */
export type GreenfieldAnomalyCode =
  /** The metadata `stage` is outside the set accepted for the physical stage (RN-02). */
  | 'estagio-greenfield-divergente'
  /** A later artifact is present without an earlier one (D-02). */
  | 'sequencia-greenfield-com-buraco'
  /** `prd.md` was read and no scope section was recognised (RN-14). */
  | 'escopo-do-prd-nao-encontrado'
  /** Two specs share one name once normalised; only the first is listed. */
  | 'spec-duplicada'
  /** `newproject_progress` is present and is not an object. */
  | 'metadado-greenfield-malformado'
  /** An artifact whose body the reading needed was above the byte ceiling. */
  | 'artefato-greenfield-truncado'

/** One degradation of the greenfield reading, in the inherited shape. */
export interface GreenfieldAnomaly {
  file: string
  code: GreenfieldAnomalyCode
  detail?: string
}

/**
 * The greenfield axis of the project (RF-08).
 *
 * ABSENT from the payload means the reading did not happen -- a host older
 * than this feature. An axis with `cenario: 'legado'` or `'sem-ancora'` means
 * the reading happened and the project was not born by `/reversa-new`. An
 * axis with specs at zero means the decomposition was not made yet. RN-08
 * makes the three distinct, and the screen names each by its own sentence.
 */
export interface GreenfieldAxis {
  cenario: ProjectScenario
  estagio: GreenfieldStage
  artefatos: GreenfieldArtifacts
  caminhos: GreenfieldPaths
  /** Null when `state.json` has no `newproject_progress`, which a legacy project has not. */
  metadado: GreenfieldMetadata | null
  /** One line, derived in the three steps of RF-06; null when neither source had it. */
  resumo: string | null
  panorama: ProductPanorama
  anomalias: GreenfieldAnomaly[]
  /** Paths whose body was not read because a cap was hit. */
  truncados: string[]
}

/** The axis of a project whose output folder holds none of the artifacts. */
export const EMPTY_GREENFIELD: GreenfieldAxis = {
  cenario: 'sem-ancora',
  estagio: 'ausente',
  artefatos: { brief: false, ideacao: false, personas: false, prd: false, specs: 0 },
  caminhos: { brief: null, ideacao: null, personas: null, prd: null },
  metadado: null,
  resumo: null,
  panorama: EMPTY_PANORAMA,
  anomalias: [],
  truncados: [],
}

/* ------------------------------------------ the link and the conferences */

/**
 * The vocabulary of feature 010: the link a delivery DECLARES between itself
 * and the specs, and the conferences a person REGISTERS against it (RN-01 to
 * RN-07, D-05 to D-13).
 *
 * Every field that carries it into the payload is optional and appended at
 * the end of an existing structure, and absent means the reading did not
 * happen, never that it happened and found nothing. A host that read and
 * found nothing sends the named state -- `ausente`, `sem-registro`, an empty
 * list -- and never omits the field.
 */

/** How the `legacy-impact.md` of one folder was read. */
export const DELIVERY_LINK_STATES = ['lido', 'ausente', 'nao-lido'] as const

/** One of the three. */
export type DeliveryLinkReading = (typeof DELIVERY_LINK_STATES)[number]

/** The reading of the link of one folder, as it travels in the history. */
export interface DeliveryLinkState {
  /** `nao-lido` is a file present and above the byte cap: the link is partial. */
  estado: DeliveryLinkReading
  /** The `legacy-impact.md`, relative to the root, for `openFile`; null when absent. */
  arquivo: string | null
  /** Impact tables recognised; zero with `lido` is a file without any. */
  tabelas: number
}

/**
 * The six states of the conference register of one folder (D-11).
 *
 * `sem-registro` is NOT a loss: the register section is a practice of the
 * agent and not a step of the process, and a project without it is the rule.
 */
export const CONFERENCE_STATES = [
  'sem-registro',
  'vazio',
  'lido',
  'nao-reconhecido',
  'nao-lido',
  'truncado',
] as const

/** One of the six. */
export type ConferenceState = (typeof CONFERENCE_STATES)[number]

/** One row of the register, each cell as written, null when the column is absent. */
export interface ConferenceLine {
  data: string | null
  marco: string | null
  item: string | null
  /** Exposed as written: the panel never classifies the result of a test (D-10). */
  resultado: string | null
  observacao: string | null
  /** Date and result both carry something other than a lone dash. */
  registrada: boolean
}

/** The conference register of one folder. */
export interface ConferenceRecord {
  estado: ConferenceState
  /** The `onboarding.md`, relative to the root; null when absent. */
  arquivo: string | null
  /** The heading of the register section as written; null without the section. */
  secao: string | null
  /** The rows read, at most `CONFERENCE_ROW_CAP`. */
  linhas: ConferenceLine[]
  registradas: number
  /** The rows that exist, even above the ceiling. */
  total: number
}

/** Why a folder is linked to a component. */
export const LINK_ORIGINS = ['nome', 'declarada'] as const

/** One of the two. */
export type LinkOrigin = (typeof LINK_ORIGINS)[number]

/** One folder linked to a planned component, and why. */
export interface ComponentLink {
  pasta: string
  origem: LinkOrigin
  /** The `legacy-impact.md` of the folder, so that a declared link is clickable. */
  impacto: string | null
}

/**
 * A component a delivery declared and no spec names (RN-04, D-08).
 *
 * Its situation is the one of the most advanced folder that declares it, by
 * the projection and the rule of advance of the planned components.
 */
export interface UnspecifiedComponent {
  nome: string
  situacao: ComponentSituation
  marca: FeatureMark
  pastas: string[]
  /** The `legacy-impact.md` of each folder, in the order of `pastas`. */
  impactos: string[]
}

/**
 * Why a piece of the delivery axis could not be read as expected (D-12).
 *
 * A LOCAL union, by the precedent of `BugAnomalyCode` and
 * `GreenfieldAnomalyCode`. `tabela-nao-reconhecida` repeats the name of the
 * inherited code on purpose, because it names the same defect.
 *
 * What is NOT here is as deliberate: an absent onboarding, an onboarding
 * without the register section, an absent `legacy-impact.md`, one without any
 * impact table and a cell naming no spec are all named states of the reading,
 * never anomalies.
 */
export type DeliveryAnomalyCode =
  /** A register section with no table carrying `Data` and `Resultado`; detail: section and header found. */
  | 'tabela-nao-reconhecida'
  /**
   * A file of the folder present and not read: `actions.md`, `requirements.md`
   * or `progress.jsonl` (bug nº 11), `legacy-impact.md` or `onboarding.md`
   * (feature 010); detail: which reading is partial.
   */
  | 'artefato-da-entrega-nao-lido'

/** One degradation of the delivery reading, in the common shape. */
export interface DeliveryAnomaly {
  file: string
  code: DeliveryAnomalyCode
  detail?: string
}

/**
 * How far the extraction got, as feature 011 reads it.
 *
 * REVERSA documents five phases and `null` for "not started", and documents no
 * value for "finished". The pipeline writes one anyway, and the measurement of
 * 2026-09-20 found it in seventeen of the sixty-four projects with a
 * `state.json` under `~/dev`, in five spellings. So this is not a typo to be
 * flagged: it is a state to be read.
 */
export type ExtractionSituation =
  /** No phase declared and none finished. */
  | 'nao-iniciada'
  /** A canonical phase, or an unknown one that does not declare closure. */
  | 'em-curso'
  /** The declared phase names a closure, whatever the spelling. */
  | 'encerrada'

/**
 * The situation of the extraction, with the raw value beside the recognised
 * one -- the rule of the house since feature 008, and what NG-05 asks: nothing
 * on disk is normalised, corrected or dropped.
 */
export interface ExtractionState {
  situacao: ExtractionSituation
  /** `phase` exactly as the file carries it; null when the field is absent. */
  bruto: string | null
}

/**
 * How far one agent got with its checkpoint (feature 011).
 *
 * Three states where the inherited layer has two, and the third is the point.
 * `checkpoint-guide.md` of REVERSA declares both registers: `completed_at`
 * with `files` when an agent finishes, `modules_analyzed` with
 * `modules_pending` while it works. A checkpoint carrying neither has
 * declared its conclusion somewhere the schema does not name -- 26 of the 229
 * measured -- and the panel says so instead of claiming it still runs.
 */
export type CheckpointSituation =
  /** `completed_at` is there, or an approved pair reads as a conclusion. */
  | 'concluido'
  /** `modules_pending` is not empty, or an approved pair reads as work under way. */
  | 'em-andamento'
  /** Neither, and no approved pair: the conclusion, if any, was declared outside the canonical field. */
  | 'conclusao-nao-declarada'
  /**
   * An approved pair reads as a failure (feature 012).
   *
   * This one NEVER comes from the schema. No canonical field declares that an
   * agent ended badly, and inventing one would have the panel asserting what
   * no documentation supports. It exists because an approved pair can say it,
   * and only because of that.
   */
  | 'falhou'

/** One checkpoint, judged by feature 011. */
export interface CheckpointState {
  agent: string
  situacao: CheckpointSituation
  /**
   * When it finished, absolute and unconverted, and ONLY when it came from
   * `completed_at`. Taking it from `at`, `data` or `timestamp` would be the
   * panel asserting a conclusion through the field that does not declare it,
   * which is the whole thing this feature exists not to do.
   */
  instante: string | null
  /**
   * Preserved fields whose value is a list of strings, and only when `files`
   * is absent. They are NOT called outputs anywhere: `achados`, `lacunas` and
   * `adrs` have the same shape and are not files (D-08).
   */
  camposComLista: string[]
  /**
   * The approved pair that decided the situation, when the schema did not
   * (feature 012). Null whenever `completed_at` or `modules_pending` decided.
   *
   * Three invariants hold together, and the suite pins all three. A non-null
   * value means the situation came from the map, never from the schema. A
   * non-null `instante` implies this is null, because the instant only ever
   * comes from the canonical field. And `conclusao-nao-declarada` implies this
   * is null, since recognising and not declaring are mutually exclusive.
   */
  reconhecidoPor: { campo: string; valor: string } | null
}

/**
 * Why a piece of the discovery state could not be read as expected (D-02).
 *
 * A LOCAL union, by the precedent of `BugAnomalyCode`, `GreenfieldAnomalyCode`
 * and `DeliveryAnomalyCode`.
 *
 * What is NOT here is as deliberate as what is: a closing phase, a checkpoint
 * that finished, one that is still working and a field under an unexpected
 * name are all named states of the reading, never anomalies.
 */
export type DiscoveryStateAnomalyCode =
  /** A checkpoint with neither `completed_at` nor `modules_pending`; detail: the agent and the missing field. */
  | 'checkpoint-sem-conclusao-declarada'

/** One degradation of the discovery-state reading, in the common shape. */
export interface DiscoveryStateAnomaly {
  file: string
  code: DiscoveryStateAnomalyCode
  detail?: string
}

/**
 * The identity of an INHERITED anomaly this axis recognised, and which the
 * panel therefore does not draw.
 *
 * The identity is the whole triple, never the code alone: absorbing by code
 * would wipe out every `fase-desconhecida`, including the one over a typo,
 * which is exactly what EC-02 exists to catch.
 */
export interface AbsorbedAnomaly {
  file: string
  code: string
  detail?: string
}

/**
 * One entry of the checkpoint map that names no agent at all (feature 012).
 *
 * The measurement of 2026-09-20 found three: `plano_aprovado` in `med-reversa`,
 * `redator_progress` in `TECH+` and `decisoes_autor` in `afla`. They are
 * records of a decision or of a count, living where the agents live.
 *
 * It has no situation, and that is the point: nothing is asked of a conclusion
 * from something that is not an agent. What makes one of these is an approved
 * KEY -- not a field-plus-value pair -- because they carry no state field to
 * translate.
 */
export interface NonAgentEntry {
  chave: string
  /** The same preserved list-valued fields a checkpoint would carry. */
  camposComLista: string[]
}

/**
 * The discovery-state axis of the project (feature 011).
 *
 * ABSENT from the payload means the reading did not happen -- a host older
 * than this feature -- and the panel then draws what it drew before: the
 * inherited anomaly of the closing phase back on screen, and checkpoints in
 * two states. Nothing here replaces the inherited `DiscoveryState` of
 * `state.ts`; it judges beside it, over the same raw file.
 */
export interface DiscoveryStateAxis {
  extracao: ExtractionState
  checkpoints: CheckpointState[]
  anomalias: DiscoveryStateAnomaly[]
  /** Inherited anomalies this axis recognised; the composition discounts them. */
  absorvidas: AbsorbedAnomaly[]
  /**
   * Entries approved as records that are not agents (feature 012).
   *
   * A key lives here OR in `checkpoints`, never in both. Leaving it in the
   * same list under a flag would oblige every consumer to filter, and one of
   * them would eventually forget.
   */
  registrosNaoAgentes: NonAgentEntry[]
}

/** The axis of a project whose `state.json` is absent or could not be read. */
export const EMPTY_DISCOVERY_STATE: DiscoveryStateAxis = {
  extracao: { situacao: 'nao-iniciada', bruto: null },
  checkpoints: [],
  anomalias: [],
  absorvidas: [],
  registrosNaoAgentes: [],
}

/**
 * How one out-of-schema pair is to be read (feature 012).
 *
 * `nao-e-sinal` is deliberately absent. What is not a signal does not become a
 * record: it only stops being asked about again, and that memory lives in the
 * proposal, not in the map.
 */
export type LeituraDeEquivalencia = 'concluido' | 'falhou' | 'em-andamento'

/**
 * One approved pair, which is the unit of recognition (RN-01).
 *
 * The key is `campo` plus `valor`, never the field alone. Across the projects
 * measured on 2026-09-20 the field `status` carried `concluido`, `completed`,
 * `completo` and `success`, and would carry `failed` in a project that failed.
 * Recognising by field would declare finished an agent that aborted.
 */
export interface EquivalenciaDeCampo {
  campo: string
  /** Trimmed and lowercased, never stripped of diacritics: `concluido` and `concluído` are different spellings a human approved separately. */
  valor: string
  leitura: LeituraDeEquivalencia
  /** The day a person approved it, `YYYY-MM-DD`. */
  aprovadoEm: string
  /** Where the pair had been seen when the proposal was written; for human reading only. */
  evidencia: string[]
}

/** One approved key, for an entry that carries no state field (RN-10). */
export interface RegistroNaoAgente {
  chave: string
  aprovadoEm: string
  evidencia: string[]
}

/**
 * Everything a person has approved, which is all the panel is allowed to know.
 *
 * Empty or absent leaves the reading identical to feature 011, and that is the
 * safe default: an unknown pair is never a guess, it is the previous behaviour.
 */
export interface MapaDeEquivalencias {
  pares: readonly EquivalenciaDeCampo[]
  naoAgentes: readonly RegistroNaoAgente[]
}

/** A map that has approved nothing; a COPY, never the shared constant. */
export const EMPTY_MAPA_DE_EQUIVALENCIAS: MapaDeEquivalencias = { pares: [], naoAgentes: [] }
