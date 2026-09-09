/**
 * The slices of the editor the host is allowed to see (RF-20, D-01).
 *
 * Interfaces only, plus the one function that fixes the shape of a log line:
 * a module that receives ports runs in plain Node, which is what lets every
 * decision of the host be tested with doubles and keeps the shared test
 * runner free of module aliases.
 *
 * `MessagingPort` is deliberately shaped like the editor's own webview, so
 * that the real object satisfies it structurally and needs no adapter. That
 * is what allows the single send and the single listener registration to
 * live in `bridge.ts` (RF-17) instead of leaking into the frontier file.
 * Visibility lives on the view, not the webview, so it is a port of its own.
 * @module host/ports
 */

import type { HostMessage } from './protocol.ts'

/** How a listener is torn down, in the editor's own shape. */
export interface Subscription {
  dispose(): void
}

/** How a listener is torn down, when the host owns the subscription. */
export type Unsubscribe = () => void

/**
 * The message channel of one webview, satisfied structurally by the editor's
 * `Webview`.
 *
 * Only `bridge.ts` may call these two methods (RF-17): concentrating the
 * traversal is what makes the protocol auditable by plain text search. The
 * port deliberately exposes neither the document nor the webview state — the
 * process must never be stored there (RN-06).
 */
export interface MessagingPort {
  /** Send one envelope; resolves to whether the editor confirmed delivery. */
  postMessage(message: HostMessage): PromiseLike<boolean>
  /** Register the single listener for everything the webview sends. */
  onDidReceiveMessage(listener: (received: unknown) => void): Subscription
}

/**
 * Whether the view is showing, and when that changes.
 *
 * It exists because the editor drops, in silence, every message sent to a
 * hidden webview even when the context is retained. The bridge answers that
 * by marking a pending reread rather than losing the request (D-10).
 */
export interface VisibilityPort {
  isVisible(): boolean
  onVisibilityChange(listener: (visible: boolean) => void): Unsubscribe
}

/**
 * The editor as a place to open documents.
 *
 * It exposes opening and nothing else: no write, no save, no close, because
 * RN-01 forbids the host to open any file for writing.
 */
export interface EditorPort {
  /** Open an absolute path as a document, without stealing the focus. */
  open(absolutePath: string): Promise<void>
}

/**
 * The editor as a place to open a document that was never on disk.
 *
 * It is a port of its OWN, and not a method of `EditorPort`, so that whoever
 * reads this file sees three distinct capabilities instead of one that grew:
 * opening a file of the project, opening a draft, and copying text (D-12).
 * Widening the first would have erased the reading that it only opens.
 *
 * Nothing here writes. The editor keeps an unsaved document in memory and
 * gives it no path, and saving is a gesture of the user -- which is the only
 * way the summary of RF-12 can exist without breaking the invariant that the
 * extension never writes a file.
 */
export interface DraftPort {
  /**
   * Open an unsaved document with this text, without stealing the focus.
   * @param text - the content, already composed by the panel.
   * @param title - how the panel would like it called, when it says.
   */
  open(text: string, title: string | null): Promise<void>
}

/**
 * The clipboard of the editor.
 *
 * Text in, nothing out. It touches no file and opens no dialog: the panel
 * confirms the copy in its own header, because the extension does not
 * interrupt the user (RN-09).
 */
export interface ClipboardPort {
  /** Replace the contents of the clipboard with this text. */
  copy(text: string): Promise<void>
}

/**
 * The folders the user has open.
 *
 * It answers one question, and returns absolute filesystem paths in the
 * editor's own order, because RN-05 resolves the ambiguity of several roots
 * by that order. It exposes no configuration, no file system, no watcher.
 */
export interface WorkspacePort {
  /** The absolute path of every workspace root, in the editor's order. */
  roots(): string[]
}

/**
 * The output channel.
 *
 * The only way the host talks to the user outside the webview, and it exists
 * because the project prefers loud errors: every rejection, every captured
 * failure and every refused path lands here with a name and a reason. It
 * exposes no notification, no dialog and no focus change (RN-09).
 */
export interface LogPort {
  /** Write one line, already formatted by {@link logLine}. */
  write(line: string): void
}

/**
 * The single shape of a log line: who acted, what the act was, and why (T029).
 *
 * It lives beside `LogPort` because the format is part of that contract, and
 * one place for it is what keeps the eight error cases of the channel
 * contract legible instead of each module inventing its own wording. The
 * adapter prefixes the instant; the origin and the reason come from here.
 * @param origin - the host module writing the line, e.g. `router`.
 * @param act - what happened, in the maintainer's language.
 * @param reason - why, naming the command, the path or the message.
 */
export function logLine(origin: string, act: string, reason: string): string {
  return `${origin} · ${act}: ${reason}`
}
