/**
 * The only implementation of the ports over the editor's own interface
 * (D-01, RF-20). This file and `extension.ts` are the two allowed to import
 * `vscode` as a value.
 *
 * NO DECISION LIVES HERE. The file translates and nothing else: no reading,
 * no containment, no ordering, no formatting beyond the instant that
 * prefixes a log line. Anything that has to be tested belongs one layer up,
 * where doubles can reach it.
 *
 * The messaging port has no adapter on purpose: it is shaped like the
 * editor's own webview, so the real object satisfies it as it is, which is
 * what keeps the single send and the single listener inside `bridge.ts`.
 * @module host/adapters
 */

import * as vscode from 'vscode'
import type {
  ClipboardPort,
  DraftPort,
  EditorPort,
  LogPort,
  VisibilityPort,
  WorkspacePort,
} from './ports.ts'

/** The language an unsaved summary is opened as, so the editor renders it. */
const DRAFT_LANGUAGE = 'markdown'

/** Whether one view is showing, and when that changes. */
export function visibilityPort(view: vscode.WebviewView): VisibilityPort {
  return {
    isVisible: () => view.visible,
    onVisibilityChange: (listener) => {
      const subscription = view.onDidChangeVisibility(() => listener(view.visible))
      return () => subscription.dispose()
    },
  }
}

/** Opening a document, without taking the focus away from the user (RN-09). */
export function editorPort(): EditorPort {
  return {
    open: async (absolutePath) => {
      const document = await vscode.workspace.openTextDocument(absolutePath)
      await vscode.window.showTextDocument(document, { preserveFocus: true, preview: true })
    },
  }
}

/**
 * Opening an unsaved document with the text the panel composed (RF-12).
 *
 * The title arrives and is NOT applied to the document, and that is a decision
 * rather than an omission: the editor names an untitled document itself, and
 * naming it would take a URI plus an edit -- which is the very writing path
 * the boundary suite now forbids (D-13). The panel therefore puts its title in
 * the first line of the text, where the reader sees it anyway.
 *
 * Nothing is created on disk. The document exists in the memory of the editor
 * until someone saves it, and saving is the user's gesture.
 */
export function draftPort(): DraftPort {
  return {
    open: async (text) => {
      const document = await vscode.workspace.openTextDocument({
        content: text,
        language: DRAFT_LANGUAGE,
      })
      await vscode.window.showTextDocument(document, { preserveFocus: true, preview: false })
    },
  }
}

/** The clipboard of the editor; text in, no file and no dialog (RF-17). */
export function clipboardPort(): ClipboardPort {
  return {
    copy: (text) => Promise.resolve(vscode.env.clipboard.writeText(text)),
  }
}

/** The open folders, as absolute filesystem paths in the editor's order. */
export function workspacePort(): WorkspacePort {
  return {
    roots: () => (vscode.workspace.workspaceFolders ?? []).map((folder) => folder.uri.fsPath),
  }
}

/** The output channel; the instant is prefixed here, the origin by the caller. */
export function logPort(channel: vscode.OutputChannel): LogPort {
  return {
    write: (line) => channel.appendLine(`${new Date().toISOString()} ${line}`),
  }
}
