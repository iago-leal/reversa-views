/**
 * Containment and opening of the file the panel points at (RF-08, RN-04).
 *
 * The containment is not written here: it is `resolveInside`, inherited from
 * the probe, which already refuses an absolute path, a Windows drive letter
 * and any resolution that escapes the root, and already comes covered by an
 * inherited suite. A second rule written here would only be a rule to
 * diverge from the first.
 *
 * The refusal happens BEFORE the editor is touched, and stays in the output
 * channel. Only the file that vanished reaches the webview, as a warning:
 * RN-09 forbids notification, dialog and focus change.
 * @module host/open-file
 */

import { resolveInside } from '../heranca/reversa-probe/src/index.ts'
import { logLine } from './ports.ts'
import type { EditorPort, LogPort } from './ports.ts'
import type { SetNoticeData } from './protocol.ts'

const ORIGIN = 'open-file'

/**
 * Open, inside the observed root, the path the webview asked for.
 * @param root - the absolute root being observed.
 * @param requested - the path the webview sent, relative to that root.
 * @param editor - the port that opens a document.
 * @param log - where every refusal and every captured failure lands.
 * @returns a warning for the webview when the file could not be opened,
 * `null` when it opened or when the path was refused; never throws.
 */
export async function openFile(
  root: string,
  requested: string,
  editor: EditorPort,
  log: LogPort,
): Promise<SetNoticeData | null> {
  const absolute = resolveInside(root, requested)
  if (absolute === null) {
    log.write(logLine(ORIGIN, 'caminho recusado', `"${requested}" fora da raiz observada ${root}`))
    return null
  }

  try {
    await editor.open(absolute)
    return null
  } catch (cause) {
    const reason = cause instanceof Error ? cause.message : String(cause)
    log.write(logLine(ORIGIN, 'abertura falhou', `${requested}: ${reason}`))
    return { level: 'warning', message: `Não consegui abrir ${requested}.` }
  }
}
