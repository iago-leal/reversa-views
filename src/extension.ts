/**
 * Activation, and nothing else (RF-02, RF-07, RF-11, RNF-02).
 *
 * It creates the output channel, builds the adapters, registers the provider
 * and the palette command, and hands every disposable to the editor. It
 * deliberately does NOT read the disk: the panel only reads after the webview
 * says it loaded, which is what keeps the cost of an activation nobody opens
 * at zero.
 *
 * This file and `host/adapters.ts` are the two that import `vscode` as a
 * value. It is also where the inherited reading layer is bound to the host,
 * so that every module above receives it instead of importing the editor.
 * @module extension
 */

import * as vscode from 'vscode'
import { visibilityPort, editorPort, logPort, workspacePort } from './host/adapters.ts'
import { ProcessViewProvider } from './host/provider.ts'
import { readWorkspace } from './host/reading.ts'

/** The view, the container and the command, as the manifest declares them. */
const VIEW_ID = 'reversaViews.process'
const RELOAD_COMMAND = 'reversaViews.reload'
const CHANNEL_NAME = 'Reversa Views'

/**
 * Wire the extension into the editor.
 * @param context - the activation context the editor hands over.
 */
export function activate(context: vscode.ExtensionContext): void {
  const channel = vscode.window.createOutputChannel(CHANNEL_NAME)
  const log = logPort(channel)

  const provider = new ProcessViewProvider({
    workspace: workspacePort(),
    editor: editorPort(),
    log,
    readRoot: (root) => readWorkspace(root, { log }),
    localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'out')],
    visibilityOf: visibilityPort,
  })

  context.subscriptions.push(
    channel,
    provider,
    vscode.window.registerWebviewViewProvider(VIEW_ID, provider, {
      webviewOptions: { retainContextWhenHidden: true },
    }),
    vscode.commands.registerCommand(RELOAD_COMMAND, () => void provider.reload()),
  )
}

/** Nothing to undo: every disposable went to the editor's own list. */
export function deactivate(): void {}
