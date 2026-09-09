/**
 * The trust boundary of the host (RF-06, RF-07, RF-11, RF-12).
 *
 * Everything the webview asks for arrives here, and nothing that arrives is
 * assumed to be well formed: the envelope is validated before any
 * collaborator is touched, and what is not recognised becomes a log line
 * with no side effect whatsoever.
 *
 * No path through this function throws back at its caller. It runs inside
 * the editor's listener, where an escaping exception would be swallowed by
 * the editor instead of read by the maintainer.
 * @module host/router
 */

import { logLine } from './ports.ts'
import type { LogPort } from './ports.ts'
import { RESERVED_COMMAND, WEBVIEW_COMMANDS } from './protocol.ts'

const ORIGIN = 'router'

/** The collaborators the router despatches to; all received (RF-20). */
export interface RouterDeps {
  /** Reread and send the payload; serves `onLoaded` and `reload` alike. */
  read: () => void
  openFile: (path: string) => void
  log: LogPort
}

/**
 * Route one envelope from the webview.
 * @param received - whatever the editor delivered; shape not to be trusted.
 * @param deps - the collaborators; none of them is called on a rejection.
 */
export function routeMessage(received: unknown, deps: RouterDeps): void {
  if (typeof received !== 'object' || received === null) {
    deps.log.write(logLine(ORIGIN, 'envelope recusado', `não é objeto: ${typeof received}`))
    return
  }

  const envelope = received as { command?: unknown; data?: unknown }
  const command = envelope.command
  if (typeof command !== 'string' || command === '') {
    deps.log.write(logLine(ORIGIN, 'envelope recusado', 'sem nome de comando'))
    return
  }
  if (!(WEBVIEW_COMMANDS as readonly string[]).includes(command)) {
    deps.log.write(logLine(ORIGIN, 'comando desconhecido', `"${command}"`))
    return
  }
  if (command === RESERVED_COMMAND) {
    deps.log.write(
      logLine(ORIGIN, 'comando recusado', `"${command}" é reservado e não tem tratador nesta versão`),
    )
    return
  }

  switch (command) {
    case 'onLoaded':
    case 'reload':
      deps.read()
      return
    case 'openFile': {
      const path = field(envelope.data, 'path')
      if (path === null) {
        deps.log.write(logLine(ORIGIN, 'carga malformada', 'openFile sem o campo path em texto'))
        return
      }
      deps.openFile(path)
      return
    }
    case 'log': {
      const message = field(envelope.data, 'message')
      if (message === null) {
        deps.log.write(logLine(ORIGIN, 'carga malformada', 'log sem o campo message em texto'))
        return
      }
      deps.log.write(logLine('webview', 'linha', message))
      return
    }
  }
}

/** One required text field of a payload, or null when it is missing or wrong. */
function field(data: unknown, name: string): string | null {
  if (typeof data !== 'object' || data === null) return null
  const value = (data as Record<string, unknown>)[name]
  return typeof value === 'string' ? value : null
}
