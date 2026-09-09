/**
 * Which workspace root the panel observes, when there is more than one
 * (RF-03, RF-04, RN-05, EC-02).
 *
 * It walks the roots in the editor's own order and stops at the first one
 * whose process comes back installed. Whether a root has an installation is
 * answered by the reading layer itself, never by looking for a file here:
 * that check is exactly the kind of duplicated layout rule RF-14 forbids.
 *
 * The result carries the reading already done, so the caller never reads the
 * chosen root a second time.
 * @module host/root
 */

import type { ReadingResult } from './reading.ts'

/** The chosen root, or the absence of any folder at all. */
export type RootChoice =
  | { kind: 'no-folder' }
  | { kind: 'chosen'; root: string; ignoredRoots: string[]; reading: ReadingResult }

/**
 * Choose the root to observe among the open folders (RN-05).
 * @param roots - every workspace root, in the editor's order.
 * @param read - reads one root; called at most once per root.
 * @returns `no-folder` when there is nothing open, otherwise the observed
 * root, the ones declared as not observed, and the reading already in hand.
 */
export function chooseRoot(
  roots: readonly string[],
  read: (root: string) => ReadingResult,
): RootChoice {
  if (roots.length === 0) return { kind: 'no-folder' }

  let first: ReadingResult | null = null
  for (const root of roots) {
    const reading = read(root)
    if (first === null) first = reading
    if (reading.kind === 'loaded' && reading.entry === 'installed') {
      return { kind: 'chosen', root, ignoredRoots: others(roots, root), reading }
    }
  }

  // Nothing installed anywhere: the first root wins, with the reading taken
  // on the first pass, so no root is read twice.
  const root = roots[0]!
  return { kind: 'chosen', root, ignoredRoots: others(roots, root), reading: first! }
}

/** The roots that were not chosen, in the editor's order. */
function others(roots: readonly string[], chosen: string): string[] {
  return roots.filter((root) => root !== chosen)
}
