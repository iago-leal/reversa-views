/**
 * The only module of the webview that touches the host interface (RF-10,
 * RF-12, RF-16, RF-19, D-06, D-17, D-18).
 *
 * It takes the interface once per panel, sends the outgoing commands,
 * registers the single incoming listener, and offers the pair of state
 * functions `domain/preferences.ts` consumes. Everything above it receives
 * values and returns values.
 *
 * The treatment of what arrives is EXHAUSTIVE over the three commands of the
 * protocol: the default case takes a `never`, so a fourth command added to
 * `host/protocol.ts` becomes a type error here instead of a silence (D-18).
 * The shapes come from the protocol by `import type`, and the protocol gains
 * no command, no field and no order in this feature.
 * @module webview/bridge/messaging
 */

import { panelLine } from './log.ts'
import type { HostMessage, WebviewMessage } from '../../host/protocol.ts'
import type { SetEntryData, SetNoticeData, SetProcessData } from '../../host/protocol.ts'

/** The interface the editor hands the panel, as much of it as the panel uses. */
export interface HostApi {
  postMessage(message: WebviewMessage): void
  getState(): unknown
  setState(state: unknown): void
}

/** Where each incoming command goes; the panel side of the channel. */
export interface PanelSink {
  setProcess(data: SetProcessData): void
  setEntry(data: SetEntryData): void
  setNotice(data: SetNoticeData): void
}

/** What the panel can do with the channel. */
export interface Bridge {
  /** Tell the host the panel is mounted; this is what starts the first reading. */
  ready(): void
  /** Ask for another reading. */
  reload(): void
  /** Ask the editor to open a path relative to the observed root. */
  openFile(path: string): void
  /** Write one line to the output channel. */
  log(message: string): void
  /** The stored state, whatever it holds. */
  readState(): unknown
  /** Replace the stored state. */
  writeState(state: unknown): void
  /** The body of the single incoming listener. */
  receive(envelope: unknown): void
}

/** What `createBridge` needs. */
export interface BridgeOptions {
  sink: PanelSink
  api: HostApi
}

/** The interface, taken once and kept: a second call would throw in the editor. */
let taken: HostApi | null = null

/**
 * The host interface, taken exactly once per panel.
 *
 * The editor allows `acquireVsCodeApi` to be called once and once only, and a
 * second mount of the panel has to reuse what the first took. Hence the
 * module-level memo: it is the lifetime of the panel, not of a component.
 * @returns the host interface.
 */
export function hostApi(): HostApi {
  if (taken === null) {
    const global = globalThis as unknown as { acquireVsCodeApi: () => HostApi }
    taken = global.acquireVsCodeApi()
  }
  return taken
}

/**
 * The command that arrived is not one this version declares (RF-19).
 *
 * The parameter is `never` on purpose: adding a fourth command to the
 * protocol without handling it here stops compiling.
 * @param message - the unreachable case.
 * @returns the name of the command, for the log line.
 */
function unreachable(message: never): string {
  return String((message as { command?: unknown }).command)
}

/**
 * Whether a value is an envelope at all.
 * @param value - what arrived on the channel.
 * @returns true when it carries a command name.
 */
function isEnvelope(value: unknown): value is { command: string; data?: unknown } {
  return typeof value === 'object' && value !== null && typeof (value as { command?: unknown }).command === 'string'
}

/**
 * Build the bridge over a host interface and a panel side.
 * @param options - where messages go, and the interface they travel on.
 * @returns the bridge.
 */
export function createBridge(options: BridgeOptions): Bridge {
  const { sink, api } = options

  /**
   * Write one line to the output channel of the extension.
   * @param message - the line.
   */
  const log = (message: string): void => {
    api.postMessage({ command: 'log', data: { message } })
  }

  return {
    ready: () => api.postMessage({ command: 'onLoaded' }),
    reload: () => api.postMessage({ command: 'reload' }),
    log,

    openFile(path: string): void {
      // RF-10 asks for a path relative to the observed root. An absolute one
      // is refused HERE, so that the host never has to decide whether a path
      // it was handed belongs to the workspace it is watching.
      if (path.startsWith('/') || /^[A-Za-z]:[\\/]/.test(path)) {
        log(panelLine('messaging', 'abertura recusada', `${path} não é relativo à raiz observada`))
        return
      }
      api.postMessage({ command: 'openFile', data: { path } })
    },

    readState: () => api.getState(),
    writeState: (state: unknown) => api.setState(state),

    receive(envelope: unknown): void {
      if (!isEnvelope(envelope)) {
        log(panelLine('messaging', 'envelope ignorado', 'chegou sem nome de comando'))
        return
      }

      const message = envelope as HostMessage
      switch (message.command) {
        case 'setProcess':
          sink.setProcess(message.data)
          return
        case 'setEntry':
          sink.setEntry(message.data)
          return
        case 'setNotice':
          sink.setNotice(message.data)
          return
        default:
          log(panelLine('messaging', 'comando ignorado', `${unreachable(message)} não é do protocolo`))
      }
    },
  }
}

/**
 * Register the single incoming listener.
 *
 * It lives here, and nowhere else, because a second listener would double
 * every render the host asks for. `main.tsx` calls it once.
 * @param bridge - the bridge that treats what arrives.
 * @param target - where the messages land; the window of the panel.
 * @returns the function that removes the listener.
 */
export function listenToHost(bridge: Bridge, target: EventTarget): () => void {
  const handler = (event: Event): void => {
    bridge.receive((event as MessageEvent).data)
  }

  target.addEventListener('message', handler)
  return () => target.removeEventListener('message', handler)
}
