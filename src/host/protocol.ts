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

/** What the host sends to the webview. */
export type HostMessage =
  | { command: 'setProcess'; data: SetProcessData }
  | { command: 'setEntry'; data: SetEntryData }
  | { command: 'setNotice'; data: SetNoticeData }

/** What the webview sends to the host. */
export type WebviewMessage =
  | { command: 'onLoaded' }
  | { command: 'reload' }
  | { command: 'openFile'; data: OpenFileData }
  | { command: 'log'; data: LogData }
  | { command: 'dispatch'; data: DispatchData }

/** The three commands the host may send. */
export const HOST_COMMANDS = ['setProcess', 'setEntry', 'setNotice'] as const

/** One of the host commands. */
export type HostCommand = (typeof HOST_COMMANDS)[number]

/**
 * The five commands the webview may send. `dispatch` is RESERVED: it is
 * declared so that implementing agent dispatch later is writing a handler,
 * not changing the channel (RF-12).
 */
export const WEBVIEW_COMMANDS = ['onLoaded', 'reload', 'openFile', 'log', 'dispatch'] as const

/** One of the webview commands. */
export type WebviewCommand = (typeof WEBVIEW_COMMANDS)[number]

/** The command that exists in the type but has no handler in this version. */
export const RESERVED_COMMAND: WebviewCommand = 'dispatch'
