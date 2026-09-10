/**
 * Whether the reading came through whole, counted once (RN-06, D-20).
 *
 * The three signals RN-06 makes normative are anomalies, refusals and
 * truncations. They are counted HERE, in one place, because the header and
 * the initial collapse both depend on the answer: two readings of the same
 * fact would eventually disagree, and the panel would then declare a whole
 * reading while opening the anomalies it says it does not have.
 * @module webview/domain/integrity
 */

import type { SetProcessData } from '../../host/protocol.ts'
import type { ReadingIntegrity } from './types.ts'

/**
 * Count the three signals of a reading and conclude from them.
 * @param payload - the successful reading the host sent.
 * @returns the counts, and whether any of them degraded the reading.
 */
export function readingIntegrity(payload: SetProcessData): ReadingIntegrity {
  // The anomalies of the bug registry are counted with the others, and by the
  // same rule: a loss reading the bugs opens the anomalies section through the
  // same path every other loss already opens it (feature 008). They are counted
  // and not merged -- the payload keeps the two lists apart, because they have
  // different origins and different vocabularies -- and an older host that
  // sends no registry at all contributes nothing rather than throwing.
  const registryAnomalies = payload.bugs === undefined ? 0 : payload.bugs.anomalias.length
  const anomalies = payload.process.anomalies.length + registryAnomalies
  const refusals = payload.probe.refusals.length
  const truncated = payload.probe.truncated.length

  return {
    degraded: anomalies > 0 || refusals > 0 || truncated > 0,
    anomalies,
    refusals,
    truncated,
  }
}
