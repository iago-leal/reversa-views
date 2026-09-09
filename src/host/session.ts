/**
 * The sequence of messages one reading produces (RF-17, D-04).
 *
 * It used to live inside the provider, where it could only be exercised with
 * the editor nearby. Here it is a pure function: roots and a reader in, the
 * envelopes in order out, plus the root that ended up observed. Nothing in it
 * knows about webviews, views or disposables.
 *
 * The provider stays the owner of sending, of visibility and of opening a
 * file, because all three depend on the editor. What moved is only the rule of
 * which message goes out in what order — and that rule now has a second
 * consumer, the preview of feature 005, which serves the panel outside the
 * editor. Two hosts, one sequence.
 * @module host/session
 */

import { INHERITED_MODEL_REVISION } from './inheritance.ts'
import type { HostMessage } from './protocol.ts'
import type { ReadingResult } from './reading.ts'
import { chooseRoot } from './root.ts'

/** The envelopes of one reading, and the root they came from. */
export interface SessionSequence {
  /** In order, starting with the loading state the panel depends on. */
  messages: HostMessage[]
  /** The observed root, or null when there is no folder at all. */
  observedRoot: string | null
}

/**
 * Build the sequence of one reading.
 * @param roots - every workspace root, in the editor's order.
 * @param read - reads one root; called at most once per root.
 * @returns the envelopes in order, and the observed root.
 */
export function sessionMessages(
  roots: readonly string[],
  read: (root: string) => ReadingResult,
): SessionSequence {
  // The loading state opens every sequence, before any disk is touched: the
  // panel draws it while the reading happens, and a reading that fails still
  // leaves the panel out of whatever it was showing before.
  const messages: HostMessage[] = [{ command: 'setEntry', data: { kind: 'loading' } }]

  const choice = chooseRoot(roots, read)
  if (choice.kind === 'no-folder') {
    messages.push({ command: 'setEntry', data: { kind: 'no-folder' } })
    return { messages, observedRoot: null }
  }

  const { reading, root, ignoredRoots } = choice
  if (reading.kind === 'error') {
    messages.push({
      command: 'setEntry',
      data: { kind: 'error', message: reading.message, root, ignoredRoots },
    })
    return { messages, observedRoot: root }
  }

  messages.push({
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
  return { messages, observedRoot: root }
}
