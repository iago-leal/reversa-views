/**
 * Activation, and nothing else (RF-02, RF-07, RF-11, RNF-02).
 *
 * It creates the output channel, builds the adapters, registers the provider
 * and the two palette commands, and hands every disposable to the editor. It
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
import {
  clipboardPort,
  configPort,
  draftPort,
  editorPort,
  logPort,
  visibilityPort,
  workspacePort,
} from './host/adapters.ts'
import {
  BUILT_FROM_COMMIT,
  DEFAULT_BRANCH,
  EXTENSION_VERSION,
  ORIGIN_REPOSITORY,
} from './host/build.ts'
import { originPort } from './host/net.ts'
import { ProcessViewProvider } from './host/provider.ts'
import { readWorkspace } from './host/reading.ts'

/** The view, the container and the commands, as the manifest declares them. */
const VIEW_ID = 'reversaViews.process'
const OPEN_COMMAND = 'reversaViews.abrir'
const RELOAD_COMMAND = 'reversaViews.reload'
const CHANNEL_NAME = 'Reversa Views'

/**
 * The command the editor generates on its own for a contributed view. It
 * reveals the container and the view in one go, which is exactly what opening
 * the panel means; reimplementing it here would be a second answer to a
 * question the editor already answers.
 */
const FOCUS_COMMAND = `${VIEW_ID}.focus`

/**
 * Wire the extension into the editor.
 * @param context - the activation context the editor hands over.
 */
export function activate(context: vscode.ExtensionContext): void {
  const channel = vscode.window.createOutputChannel(CHANNEL_NAME)
  const log = logPort(channel)

  // The bundle of the panel lives under `out/res/webview`. It is declared as
  // an allowed resource root of its own: a local resource loaded by disk path
  // is refused by the policy, and without this declaration the editor will not
  // rewrite the address either (RF-09, D-13).
  const outRoot = vscode.Uri.joinPath(context.extensionUri, 'out')
  const webviewRoot = vscode.Uri.joinPath(outRoot, 'res', 'webview')

  const provider = new ProcessViewProvider({
    workspace: workspacePort(),
    editor: editorPort(),
    // The two capabilities of feature 006, wired beside the ones that already
    // existed. Neither touches disk, and the activation goes on reading none.
    draft: draftPort(),
    clipboard: clipboardPort(),
    log,
    readRoot: (root) => readWorkspace(root, { log }),
    localResourceRoots: [outRoot, webviewRoot],
    assets: {
      script: vscode.Uri.joinPath(webviewRoot, 'main.js'),
      style: vscode.Uri.joinPath(webviewRoot, 'main.css'),
    },
    visibilityOf: visibilityPort,
    // The provenance of this build, from the stamp generated before the
    // compilation (D-07). It travels in the payload of the reading, like the
    // inherited revision, because the panel may not import a value of the host.
    build: { version: EXTENSION_VERSION, commit: BUILT_FROM_COMMIT },
    // The query of feature 007, assembled HERE and nowhere else. The reading
    // layer goes on not seeing it: it receives none of these three, and the
    // boundary suite holds that by plain text search.
    update: {
      config: configPort(),
      origin: originPort(ORIGIN_REPOSITORY ?? '', { version: EXTENSION_VERSION }),
      repository: ORIGIN_REPOSITORY,
      branch: DEFAULT_BRANCH,
    },
  })

  context.subscriptions.push(
    channel,
    provider,
    vscode.window.registerWebviewViewProvider(VIEW_ID, provider, {
      webviewOptions: { retainContextWhenHidden: true },
    }),
    vscode.commands.registerCommand(OPEN_COMMAND, () =>
      vscode.commands.executeCommand(FOCUS_COMMAND),
    ),
    vscode.commands.registerCommand(RELOAD_COMMAND, () => void provider.reload()),
  )
}

/** Nothing to undo: every disposable went to the editor's own list. */
export function deactivate(): void {}
