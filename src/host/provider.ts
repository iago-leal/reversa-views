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
import { openFile } from './open-file.ts'
import { logLine } from './ports.ts'
import type {
  ClipboardPort,
  ConfigPort,
  DraftPort,
  EditorPort,
  LogPort,
  OriginPort,
  VisibilityPort,
  WorkspacePort,
} from './ports.ts'
import { panelBody } from './panel.ts'
import type { ReadingResult } from './reading.ts'
import { routeMessage } from './router.ts'
import { sessionMessages } from './session.ts'
import type { BuildStamp } from './session.ts'
import { interpretReply, queryPlan } from './update.ts'

const ORIGIN = 'provider'

/**
 * What the query to the origin needs, as one optional block (feature 007).
 *
 * It is optional as a whole, and that is the shape of the truth: a provider
 * assembled without it simply never asks anything and never announces an
 * outcome, which is exactly what an older host does and what the preview
 * wants when no query is being exercised.
 */
export interface UpdateDeps {
  /** The setting, asked at the moment of asking (RF-14). */
  config: ConfigPort
  /** The one port that opens a connection. */
  origin: OriginPort
  /** `dono/repositorio`, or null when there is no origin to consult. */
  repository: string | null
  /** The branch of the origin to compare against. */
  branch: string
}

/** Everything the provider needs; every editor object arrives from outside. */
export interface ProviderDeps {
  workspace: WorkspacePort
  editor: EditorPort
  /**
   * The two capabilities of feature 006, received like every other one.
   *
   * The provider hands them the text and learns nothing about what it holds:
   * the summary is composed on the screen, and this side neither reads it nor
   * decides anything from it (D-11, D-12).
   */
  draft: DraftPort
  clipboard: ClipboardPort
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
  /**
   * The provenance of this build (RF-17). Absent, the panel declares it
   * absent, which is what an older host produces.
   */
  build?: BuildStamp
  /** The query to the origin. Absent, no query happens and none is announced. */
  update?: UpdateDeps
}

/** The panel of the process, for the view `reversaViews.process`. */
export class ProcessViewProvider implements vscode.WebviewViewProvider {
  private readonly deps: ProviderDeps
  private bridge: Bridge | null = null
  private observedRoot: string | null = null
  /**
   * Which reading is current, counted up on every reread.
   *
   * A query that started under one reading must not answer over a later one:
   * rereading is the gesture that repeats the query, and an answer from the
   * previous round arriving late would overwrite a fresher outcome with a
   * staler one. The counter is how a late answer knows to keep quiet.
   */
  private generation = 0

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
        openDraft: (text, title) => void this.draft(text, title),
        copyText: (text) => void this.copy(text),
        log: this.deps.log,
      }),
    )
  }

  /**
   * Reread the process and send it: the single path of RF-07, used by the
   * webview button and by the palette command alike.
   *
   * Which envelopes go out, and in what order, is `session.ts` (D-04). What
   * stays here is the sending itself, which needs the bridge, and the memory
   * of the observed root, which the opening of a file needs.
   */
  async reload(): Promise<void> {
    const bridge = this.bridge
    if (bridge === null) {
      this.deps.log.write(logLine(ORIGIN, 'releitura ignorada', 'a visão ainda não foi resolvida'))
      return
    }

    const generation = (this.generation += 1)
    const { messages, observedRoot } = sessionMessages(
      this.deps.workspace.roots(),
      this.deps.readRoot,
      this.deps.build,
    )
    this.observedRoot = observedRoot
    for (const message of messages) await bridge.send(message)

    // The query FOLLOWS the reading, and only a reading it can accompany. The
    // sequences that end without a process -- no folder, or a failure -- have
    // nothing to be current about, and asking anyway would announce an outcome
    // over a panel that is saying it could not read.
    const read = messages.some((message) => message.command === 'setProcess')
    if (read) await this.askOrigin(bridge, generation)
  }

  /**
   * Ask the origin whether this build is current, and say so (RF-09 to RF-16).
   *
   * It does NOT block the reading: the process has already been sent and drawn
   * when this runs, and the outcome arrives later as its own envelope. It does
   * not retry either — a failure is named once and the control goes back to the
   * maintainer, because a silent retry hides a network fault and this project
   * prefers loud errors.
   * @param bridge - the channel of the current webview.
   * @param generation - the reading this query belongs to.
   */
  private async askOrigin(bridge: Bridge, generation: number): Promise<void> {
    const update = this.deps.update
    if (update === undefined) return

    const plan = queryPlan({
      enabled: update.config.checkForUpdates(),
      origin: update.repository,
      commit: this.deps.build?.commit ?? '',
      branch: update.branch,
    })

    if (plan.kind === 'skip') {
      await bridge.send({ command: 'setUpdate', data: plan.status })
      return
    }

    await bridge.send({ command: 'setUpdate', data: { estado: 'consultando' } })

    // A rejection of the port is not expected -- it answers with a named
    // failure instead of throwing -- but a port that broke its own contract
    // must not take down a reading that succeeded.
    const reply = await update.origin
      .compare(plan.base, plan.head)
      .catch(() => ({ kind: 'failure', cause: 'resposta-inesperada' }) as const)

    const status = interpretReply(reply)

    // T041: one line per failed query, in the single shape the host uses for
    // every other failure. The panel says it in its own words; the channel says
    // it in the maintainer's.
    if (status.estado === 'impossivel') {
      this.deps.log.write(
        logLine(ORIGIN, 'consulta à origem impossível', `${update.repository ?? 'origem'}: ${status.causa}`),
      )
    }

    // A reread happened while this was in flight: its own query is the current
    // one, and this answer is about a build state nobody is looking at.
    if (generation !== this.generation) return
    await bridge.send({ command: 'setUpdate', data: status })
  }

  /** Drop the bridge; the editor disposes the view on its own. */
  dispose(): void {
    this.bridge?.dispose()
    this.bridge = null
  }

  /**
   * Open the summary as an unsaved document (RF-12).
   *
   * A failure of the editor is captured and named in the channel, and does not
   * escape into the listener: the panel keeps what it was showing, because a
   * summary that failed to open is no reason to lose the reading behind it.
   * @param text - the text the panel composed.
   * @param title - what the panel would like it called, or nothing.
   */
  private async draft(text: string, title: string | null): Promise<void> {
    try {
      await this.deps.draft.open(text, title)
    } catch (cause) {
      const reason = cause instanceof Error ? cause.message : String(cause)
      this.deps.log.write(logLine(ORIGIN, 'rascunho recusado', reason))
    }
  }

  /**
   * Put the summary on the clipboard (RF-17).
   * @param text - the text the panel composed.
   */
  private async copy(text: string): Promise<void> {
    try {
      await this.deps.clipboard.copy(text)
    } catch (cause) {
      const reason = cause instanceof Error ? cause.message : String(cause)
      this.deps.log.write(logLine(ORIGIN, 'cópia recusada', reason))
    }
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
