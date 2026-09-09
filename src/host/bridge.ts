/**
 * The single point of traversal on the host side (RF-05, RF-17, RNF-04).
 *
 * NO OTHER MODULE MAY CALL THE MESSAGING INTERFACE. The reason is not style:
 * a protocol whose send sites are scattered stops being auditable by plain
 * text search, and the audit is what lets this channel be frozen once
 * feature 003 consumes it. If a new message is needed, it goes through here.
 *
 * Three rules of order live here, and only here. Nothing is sent before the
 * webview says it loaded (RN-03). Nothing is sent to a hidden view, because
 * the editor drops it in silence even with the context retained; instead a
 * reread is marked pending and asked for when the view comes back (D-10). A
 * send the editor does not confirm is logged once and never repeated.
 * @module host/bridge
 */

import { logLine } from './ports.ts'
import type { LogPort, MessagingPort, Subscription, VisibilityPort } from './ports.ts'
import type { HostMessage } from './protocol.ts'

const ORIGIN = 'bridge'

/** Everything the bridge needs; all of it received, none of it imported. */
export interface BridgeDeps {
  messaging: MessagingPort
  visibility: VisibilityPort
  log: LogPort
  /** Asked when the view becomes visible again with a reread pending. */
  requestReload: () => void
}

/** The traversal of one webview, from its creation to its disposal. */
export class Bridge {
  private readonly deps: BridgeDeps
  private readonly unwatch: () => void
  private subscription: Subscription | null = null
  private loaded = false
  private pendingReload = false

  constructor(deps: BridgeDeps) {
    this.deps = deps
    this.unwatch = deps.visibility.onVisibilityChange((visible) => {
      if (!visible || !this.pendingReload) return
      this.pendingReload = false
      this.deps.requestReload()
    })
  }

  /** Register the single listener for everything the webview sends. */
  listen(handler: (received: unknown) => void): void {
    this.subscription = this.deps.messaging.onDidReceiveMessage(handler)
  }

  /** The webview said it loaded; from now on payloads may travel (RN-03). */
  ready(): void {
    this.loaded = true
  }

  /**
   * Send one message, or say in the log why it was not sent.
   * @param message - the envelope, already typed by the protocol.
   */
  async send(message: HostMessage): Promise<void> {
    if (!this.loaded) {
      this.deps.log.write(logLine(ORIGIN, 'envio retido', `${message.command} antes do pronto`))
      return
    }
    if (!this.deps.visibility.isVisible()) {
      this.pendingReload = true
      this.deps.log.write(
        logLine(ORIGIN, 'envio adiado', `${message.command} com a visão oculta, releitura pendente`),
      )
      return
    }

    const delivered = await this.deps.messaging.postMessage(message)
    if (!delivered) {
      this.deps.log.write(logLine(ORIGIN, 'entrega incerta', `o editor não confirmou ${message.command}`))
    }
  }

  /** Drop the listener and the visibility watch. */
  dispose(): void {
    this.subscription?.dispose()
    this.subscription = null
    this.unwatch()
  }
}
