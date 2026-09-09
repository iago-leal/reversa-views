/**
 * The view provider: who orders the sequence the panel depends on (RF-01,
 * RF-05, RF-07, RF-10, EC-03, EC-07).
 *
 * It resolves the view, serves the document, creates the bridge and hands
 * the single listener to the router. The reread it exposes is the same one
 * the palette command calls, so the two paths of RF-07 are literally the
 * same code, not two implementations that agree today.
 *
 * It never writes the webview state (RN-06): a stale portrait painted as if
 * it were current defeats the whole purpose of the panel, and rereading is
 * cheaper than lying. The editor enters only as a type: every object it
 * touches arrives as a parameter.
 * @module host/provider
 */

import type * as vscode from 'vscode'
import { Bridge } from './bridge.ts'
import { buildDocument, createNonce } from './document.ts'
import { INHERITED_MODEL_REVISION } from './inheritance.ts'
import { openFile } from './open-file.ts'
import { logLine } from './ports.ts'
import type { EditorPort, LogPort, VisibilityPort, WorkspacePort } from './ports.ts'
import { panelBody } from './panel.ts'
import type { ReadingResult } from './reading.ts'
import { chooseRoot } from './root.ts'
import { routeMessage } from './router.ts'

const ORIGIN = 'provider'

/** Everything the provider needs; every editor object arrives from outside. */
export interface ProviderDeps {
  workspace: WorkspacePort
  editor: EditorPort
  log: LogPort
  /** Reads one root; bound to the inherited layer by the activation. */
  readRoot: (root: string) => ReadingResult
  /** The only folders the webview may load a local resource from (RF-09). */
  localResourceRoots: readonly vscode.Uri[]
  /**
   * Where the two assets of the bundle live on disk, as the activation built
   * them. They are rewritten by the webview before they reach the document:
   * the policy refuses a disk path, and the editor is the only one that knows
   * the address it serves them from (D-13).
   */
  assets: { script: vscode.Uri; style: vscode.Uri }
  /** Visibility lives on the view, so it is built when the view exists. */
  visibilityOf: (view: vscode.WebviewView) => VisibilityPort
  createNonce?: () => string
}

/** The panel of the process, for the view `reversaViews.process`. */
export class ProcessViewProvider implements vscode.WebviewViewProvider {
  private readonly deps: ProviderDeps
  private bridge: Bridge | null = null
  private observedRoot: string | null = null

  constructor(deps: ProviderDeps) {
    this.deps = deps
  }

  /** Serve the document and wire the channel; no disk is touched here. */
  resolveWebviewView(view: vscode.WebviewView): void {
    view.webview.options = {
      enableScripts: true,
      localResourceRoots: this.deps.localResourceRoots,
    }

    const nonce = (this.deps.createNonce ?? createNonce)()
    view.webview.html = buildDocument({
      nonce,
      cspSource: view.webview.cspSource,
      body: panelBody({
        nonce,
        scriptUri: view.webview.asWebviewUri(this.deps.assets.script).toString(),
        styleUri: view.webview.asWebviewUri(this.deps.assets.style).toString(),
      }),
    })

    // A view resolved a second time is a new webview: the old bridge goes.
    this.bridge?.dispose()
    const bridge = new Bridge({
      messaging: view.webview,
      visibility: this.deps.visibilityOf(view),
      log: this.deps.log,
      requestReload: () => void this.reload(),
    })
    this.bridge = bridge

    bridge.listen((received) =>
      routeMessage(received, {
        read: () => {
          bridge.ready()
          void this.reload()
        },
        openFile: (path) => void this.open(path),
        log: this.deps.log,
      }),
    )
  }

  /**
   * Reread the process and send it: the single path of RF-07, used by the
   * webview button and by the palette command alike.
   */
  async reload(): Promise<void> {
    const bridge = this.bridge
    if (bridge === null) {
      this.deps.log.write(logLine(ORIGIN, 'releitura ignorada', 'a visão ainda não foi resolvida'))
      return
    }

    await bridge.send({ command: 'setEntry', data: { kind: 'loading' } })

    const choice = chooseRoot(this.deps.workspace.roots(), this.deps.readRoot)
    if (choice.kind === 'no-folder') {
      this.observedRoot = null
      await bridge.send({ command: 'setEntry', data: { kind: 'no-folder' } })
      return
    }

    this.observedRoot = choice.root
    const { reading, root, ignoredRoots } = choice
    if (reading.kind === 'error') {
      await bridge.send({
        command: 'setEntry',
        data: { kind: 'error', message: reading.message, root, ignoredRoots },
      })
      return
    }

    await bridge.send({
      command: 'setProcess',
      data: {
        process: reading.process,
        probe: reading.probe,
        readAt: reading.readAt,
        entry: reading.entry,
        root,
        ignoredRoots,
        inheritedRevision: INHERITED_MODEL_REVISION,
      },
    })
  }

  /** Drop the bridge; the editor disposes the view on its own. */
  dispose(): void {
    this.bridge?.dispose()
    this.bridge = null
  }

  /** Open what the panel points at, inside the observed root (RF-08). */
  private async open(path: string): Promise<void> {
    if (this.observedRoot === null) {
      this.deps.log.write(logLine(ORIGIN, 'abertura recusada', `${path} sem raiz observada`))
      return
    }
    const notice = await openFile(this.observedRoot, path, this.deps.editor, this.deps.log)
    if (notice !== null) await this.bridge?.send({ command: 'setNotice', data: notice })
  }
}
