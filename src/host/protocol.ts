/**
 * The whole message contract between the host and the webview panel (RF-12,
 * RF-13, RF-15, RNF-04).
 *
 * Types and constants only: no logic, no editor import, nothing that reads.
 * A protocol spread over several files stops being auditable, and the
 * contract in `interfaces/protocolo-webview.md` is written against this one.
 *
 * `ReversaProcess` and `ProbeReport` are imported from the inherited reading
 * layer, never redeclared: the host forwards them untouched (RF-14).
 * @module host/protocol
 */

import type { ReversaProcess } from '../heranca/reversa-domain/src/index.ts'
import type { ProbeReport } from '../heranca/reversa-probe/src/snapshot.ts'
import type {
  ActiveDecomposition,
  BugRegistry,
  DiscoveryStateAxis,
  GreenfieldAxis,
  ProjectHistory,
} from '../domain/types.ts'

/**
 * The envelope, identical in both directions and inherited from the kit:
 * a command name and an optional payload. No correlation id, no ack, no
 * sequence number — each request of this version has one possible answer.
 */
export interface Envelope<TData = unknown> {
  command: string
  data?: TData
}

/** The five situations the panel can be in before drawing anything (RF-15). */
export const ENTRY_KINDS = ['no-folder', 'loading', 'no-reversa', 'installed', 'error'] as const

/** One of the five named entry states. */
export type EntryKind = (typeof ENTRY_KINDS)[number]

/** The two entry states that travel with a process already read. */
export type LoadedEntryKind = Extract<EntryKind, 'installed' | 'no-reversa'>

/** The three entry states that travel without a process. */
export type BareEntryKind = Exclude<EntryKind, LoadedEntryKind>

/** The payload of a successful reading (RF-03, RF-04, RF-13). */
export interface SetProcessData {
  /** The inherited type, forwarded without transformation. */
  process: ReversaProcess
  /** What the probe actually did: workspace, featureDir, refusals, truncated. */
  probe: ProbeReport
  /** When the reading happened, in a sortable form. */
  readAt: string
  entry: LoadedEntryKind
  /** Absolute path of the observed root. */
  root: string
  /** The other workspace roots, declared as not observed. */
  ignoredRoots: string[]
  /**
   * The revision of the model this reading layer was copied from (RF-14).
   *
   * Added by feature 004, and added is the word: the protocol grows by
   * accretion, so `SetEntryData` stays untouched and a webview built before
   * this field simply ignores it.
   */
  inheritedRevision: string
  /**
   * The actions of the active feature, one by one (feature 006).
   *
   * Absent, rather than empty, is what an older host produces, and the panel
   * has to tell the two apart: "there are no actions" and "I did not read the
   * actions" are different statements, and only one of them is a defect.
   */
  decomposition: ActiveDecomposition
  /**
   * Every feature folder of the project, newest first (feature 006).
   *
   * Feature 010 grows the payload WITHOUT a field of its own at this level: the
   * link a delivery declares and the conferences a person registered belong to
   * the history and to the panorama, so they enter as optional fields at the
   * END of four existing structures -- `HistoryEntry.vinculo` and
   * `.conferencias`, `ProjectHistory.anomalias`, `PlannedComponent.ligacoes`,
   * `ProductPanorama.semSpec` and `.vinculoParcial`. The top of this payload
   * keeps its ten required fields, and the protocol suite counts them.
   */
  history: ProjectHistory
  /**
   * The version of this build, derived and never written by hand (RF-17).
   *
   * It travels here for the same reason `inheritedRevision` does, and by the
   * same precedent RF-17 names: the panel must declare provenance without
   * opening a file, and the frontier forbids the webview from importing any
   * VALUE of `src/host/`. A build stamp read straight from `host/build.ts` by
   * a component would be the host surviving into the bundle.
   *
   * This is an ADDITION, like every field before it: a webview built before it
   * ignores what it does not know.
   */
  extensionVersion: string
  /**
   * The commit this build was made from, WHOLE (RF-17, D-18).
   *
   * Whole, and shortened on screen by the same rule that already shortens the
   * inherited revision: shortening here would destroy the value RF-17 asks to
   * be readable from an attribute.
   */
  builtFromCommit: string
  /**
   * The bug registry of the project, grouped by context (feature 008, D-10).
   *
   * APPENDED at the end, like every field before it: nothing above is renamed
   * or reordered, a webview built before this feature ignores what it does not
   * know, and a host built before it does not send the field at all.
   *
   * That last case is real rather than hypothetical, which is why the panel has
   * to tell absence from emptiness: ABSENT means the reading did not happen,
   * EMPTY means the reading happened and found nothing. Only one of the two is
   * a defect, and drawing them alike would hide it.
   *
   * A bug with `visibility: restricted` never reaches this field: it is
   * filtered in the reading layer, before the payload is assembled, and what
   * travels is only how many were left out (D-11).
   */
  bugs: BugRegistry
  /**
   * The greenfield axis of the project: how it was born by `/reversa-new`, and
   * what the PRD and the specs planned against what the forward cycle delivered
   * (feature 009, D-13).
   *
   * APPENDED at the end, like every field before it, and the same warning
   * applies with the same force: ABSENT means the reading did not happen, and
   * the panel names it as such. It must NOT be read as "the project is not
   * greenfield" -- that is a different statement, and the axis carries it by
   * name in `cenario` (RN-08).
   *
   * What travels is what was DERIVED from the artifacts: presence, stage,
   * scenario, the crossed components and the scope items. The bodies of the
   * brief, the PRD and the specs never cross the channel.
   */
  greenfield: GreenfieldAxis
  /**
   * The root of the clone this build was made in (BUG-20260911-FI3O).
   *
   * APPENDED at the end, by the same rule as every field before it, and with
   * the same consequence: a host built before it sends nothing, and the panel
   * reads the absence as "no address declared" and falls back to the command
   * of the clone. It never reads the absence as a path.
   *
   * It is the OBSERVED root's opposite number, and the two must not be
   * confused. `root` is the workspace the reader has open; this is the clone
   * that produced the extension they are running. The whole of the bug was a
   * panel assuming the two were the same place.
   */
  builtFromRoot: string
  /**
   * How the discovery state reads once the closing phase and the three states
   * of a checkpoint are recognised (feature 011, D-07).
   *
   * OPTIONAL, and appended at the end, by the rule every field before it
   * followed: a host built before this feature sends nothing, and the webview
   * then draws exactly what it drew before -- the inherited anomaly of the
   * closing phase on screen, and checkpoints in two states. The absence is a
   * reading that did not happen, never a project without a discovery.
   *
   * The inherited `process` keeps crossing the channel untransformed, this
   * field included: `process.anomalies` still arrives WHOLE, with nothing
   * discounted. What the axis carries in `absorvidas` is the identity of the
   * ones it recognised, and the discount happens on the webview side, where
   * deciding what the screen shows belongs (NG-03).
   */
  discoveryState?: DiscoveryStateAxis
}

/** The payload for every situation with no process to show. */
export interface SetEntryData {
  kind: BareEntryKind
  /** Present only on `error`. */
  message?: string
  /** Present once a root has been chosen. */
  root?: string
  ignoredRoots?: string[]
}

/** A warning the webview must show, today only a file that vanished (EC-05). */
export interface SetNoticeData {
  level: 'warning'
  message: string
}

/** A path relative to the observed root. */
export interface OpenFileData {
  path: string
}

/** One line the webview wants written to the output channel. */
export interface LogData {
  message: string
}

/** RESERVED: no handler in this version, kept so the future is an addition. */
export interface DispatchData {
  agent: string
}

/**
 * The text of a document the editor is to open unsaved, and how to call it.
 *
 * The text travels READY: it is composed by a pure function on the screen,
 * because the host may contain neither a REVERSA path nor a stage name, and
 * the readable labels live on the other side (D-11).
 */
export interface OpenDraftData {
  text: string
  /** Optional: a host without one uses a title of its own. */
  title?: string
}

/** The text to put on the clipboard of the editor. */
export interface CopyTextData {
  text: string
}

/**
 * The seven outcomes of asking the origin whether this build is current
 * (feature 007, `interfaces/consulta-a-origem.md`).
 *
 * The order is the one the contract writes: from not having asked, through the
 * three answers that inform, to the two that cannot.
 */
export const UPDATE_STATES = [
  'desligada',
  'consultando',
  'em-dia',
  'atrasada',
  'divergente',
  'commit-desconhecido',
  'impossivel',
] as const

/** One of the seven outcomes. */
export type UpdateState = (typeof UPDATE_STATES)[number]

/** Why a query could not be made or could not be understood. */
export const UPDATE_CAUSES = [
  'sem-rede',
  'limite-de-taxa',
  'resposta-inesperada',
  'tempo-esgotado',
] as const

/** One of the four causes. */
export type UpdateCause = (typeof UPDATE_CAUSES)[number]

/**
 * What the origin said, as a DISCRIMINATED union rather than one shape with
 * optional fields.
 *
 * The outcomes share no field: one carries a distance, one carries a cause,
 * and five carry nothing. An optional `commits` in a single shape would invite
 * the panel to draw "0 commits behind" for a query that never happened, which
 * is the one thing the header must not say.
 */
export type UpdateStatus =
  | { estado: 'desligada' }
  | { estado: 'consultando' }
  | { estado: 'em-dia' }
  | { estado: 'atrasada'; commits: number }
  | { estado: 'divergente'; commits: number }
  | { estado: 'commit-desconhecido' }
  | { estado: 'impossivel'; causa: UpdateCause }

/** What the host sends to the webview. */
export type HostMessage =
  | { command: 'setProcess'; data: SetProcessData }
  | { command: 'setEntry'; data: SetEntryData }
  | { command: 'setNotice'; data: SetNoticeData }
  // Feature 007 APPENDS, as the contract of 002 requires: nothing above is
  // renamed, removed or reordered. It travels after the process, never inside
  // it, because the query is asynchronous and a field in `SetProcessData`
  // would either delay the panel or travel empty (D-02).
  | { command: 'setUpdate'; data: UpdateStatus }

/** What the webview sends to the host. */
export type WebviewMessage =
  | { command: 'onLoaded' }
  | { command: 'reload' }
  | { command: 'openFile'; data: OpenFileData }
  | { command: 'log'; data: LogData }
  | { command: 'dispatch'; data: DispatchData }
  | { command: 'openDraft'; data: OpenDraftData }
  | { command: 'copyText'; data: CopyTextData }

/** The four commands the host may send, the fourth appended by feature 007. */
export const HOST_COMMANDS = ['setProcess', 'setEntry', 'setNotice', 'setUpdate'] as const

/** One of the host commands. */
export type HostCommand = (typeof HOST_COMMANDS)[number]

/**
 * The seven commands the webview may send. `dispatch` is RESERVED: it is
 * declared so that implementing agent dispatch later is writing a handler,
 * not changing the channel (RF-12).
 *
 * The two of feature 006 are APPENDED, after the reserved one, because the
 * contract allows adding and forbids renaming and removing: every name that
 * was here keeps its place, and the reserved command keeps being reserved.
 */
export const WEBVIEW_COMMANDS = [
  'onLoaded',
  'reload',
  'openFile',
  'log',
  'dispatch',
  'openDraft',
  'copyText',
] as const

/** One of the webview commands. */
export type WebviewCommand = (typeof WEBVIEW_COMMANDS)[number]

/** The command that exists in the type but has no handler in this version. */
export const RESERVED_COMMAND: WebviewCommand = 'dispatch'
