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

import { SUMMARY_TEXT_CAP } from '../domain/limits.ts'
import { logLine } from './ports.ts'
import type { LogPort } from './ports.ts'
import { RESERVED_COMMAND, WEBVIEW_COMMANDS } from './protocol.ts'

const ORIGIN = 'router'

/** The collaborators the router despatches to; all received (RF-20). */
export interface RouterDeps {
  /** Reread and send the payload; serves `onLoaded` and `reload` alike. */
  read: () => void
  openFile: (path: string) => void
  /** Open an unsaved document with the text the panel composed (RF-12). */
  openDraft: (text: string, title: string | null) => void
  /** Put the text the panel composed on the clipboard (RF-17). */
  copyText: (text: string) => void
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
    case 'openDraft': {
      const text = acceptedText(envelope.data, command, deps.log)
      if (text === null) return
      // A title that is absent or not text is ACCEPTED, and the host uses one
      // of its own: refusing the whole command over the way it is called would
      // cost the reader the summary for the sake of a label.
      deps.openDraft(text, field(envelope.data, 'title'))
      return
    }
    case 'copyText': {
      const text = acceptedText(envelope.data, command, deps.log)
      if (text === null) return
      deps.copyText(text)
      return
    }
  }
}

/**
 * The text of the two commands of feature 006, validated at the frontier
 * (D-14, contract 3.1).
 *
 * The router presumes no shape, and the ceiling is measured in BYTES rather
 * than in characters, because what travels the channel is bytes and an
 * accented text weighs more than it counts. Every refusal names the command
 * and the reason, touches no collaborator and throws at nobody: this runs
 * inside the editor's listener, where an escaping exception is swallowed
 * instead of read.
 * @param data - the payload, of a shape not to be trusted.
 * @param command - the command being validated, for the log line.
 * @param log - the output channel.
 * @returns the text, or null once the refusal has been written.
 */
function acceptedText(data: unknown, command: string, log: LogPort): string | null {
  const text = field(data, 'text')
  if (text === null) {
    log.write(logLine(ORIGIN, 'carga malformada', `${command} sem o campo text em texto`))
    return null
  }
  if (text === '') {
    log.write(logLine(ORIGIN, 'carga recusada', `${command} com texto vazio`))
    return null
  }

  const bytes = new TextEncoder().encode(text).length
  if (bytes > SUMMARY_TEXT_CAP) {
    log.write(
      logLine(ORIGIN, 'carga recusada', `${command} com ${bytes} bytes, acima do teto de ${SUMMARY_TEXT_CAP}`),
    )
    return null
  }
  return text
}

/** One required text field of a payload, or null when it is missing or wrong. */
function field(data: unknown, name: string): string | null {
  if (typeof data !== 'object' || data === null) return null
  const value = (data as Record<string, unknown>)[name]
  return typeof value === 'string' ? value : null
}
