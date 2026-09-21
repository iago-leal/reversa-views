/**
 * Whether the reading came through whole, counted once (RN-06, D-20).
 *
 * The three signals RN-06 makes normative are anomalies, refusals and
 * truncations. They are counted HERE, in one place, because the header and
 * the initial collapse both depend on the answer: two readings of the same
 * fact would eventually disagree, and the panel would then declare a whole
 * reading while opening the anomalies it says it does not have.
 *
 * SHARED PRESENTATION, since feature 014. This module used to serve the panel
 * alone; it now serves TWO surfaces -- the webview and the terminal tool of
 * `src/cli/` -- and it did not move for that. Moving the folder would have
 * touched every component, every suite and every delivered addendum without
 * changing one line of behaviour (D-14), so the change of status is declared
 * here and pinned by a suite: `tests/cli-boundaries.spec.ts` forbids a new
 * presentation rule from being born in `src/cli/quadro/`, and
 * `tests/cli-paridade.spec.tsx` compares what the two surfaces affirm over the
 * same payload. Drawing is what differs between them; deciding is not.
 * @module webview/domain/integrity
 */

import type { SetProcessData } from '../../host/protocol.ts'
import { composeAnomalies } from './anomalies-view.ts'
import type { ReadingIntegrity } from './types.ts'

/**
 * Count the three signals of a reading and conclude from them.
 * @param payload - the successful reading the host sent.
 * @returns the counts, and whether any of them degraded the reading.
 */
export function readingIntegrity(payload: SetProcessData): ReadingIntegrity {
  // Feature 011 moved the sum out of here. It used to add four lists by
  // itself, and the section added the same four inline: two readings of one
  // fact, which agreed only because both were plain concatenations. With the
  // discount of what the discovery-state axis absorbs, they would stop
  // agreeing, and the header would declare a degraded reading over an anomaly
  // the section does not show -- the very failure the paragraph above warns
  // against. So the list is composed ONCE, and counted here.
  const anomalies = composeAnomalies(payload).length
  const refusals = payload.probe.refusals.length
  const truncated = payload.probe.truncated.length

  return {
    degraded: anomalies > 0 || refusals > 0 || truncated > 0,
    anomalies,
    refusals,
    truncated,
  }
}
