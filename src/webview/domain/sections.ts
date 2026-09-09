/**
 * The order of the sections, which of them are cards, and what ends up
 * collapsed (RF-01, RF-18, RN-01, RN-02, RN-03, RN-11, D-03, D-04).
 *
 * The order does not depend on the process: a panel whose sections move
 * around between readings cannot be learnt. It is the array of `types.ts`,
 * returned as it is.
 *
 * The effective collapse is where the correction of feature 006 lands. It used
 * to be called the INITIAL collapse and fell back to the default whenever the
 * list was empty, which made the default outlive the choice: expanding the last
 * collapsed card emptied the list, the default returned, and the other two
 * closed in the same gesture. Now a declared preference wins outright, empty
 * list included, and the default applies only where nothing was ever declared
 * (D-03). Recalculating on every draw is therefore no longer a problem, and
 * the decision stays a pure function, testable without a browser.
 *
 * The ten-anomaly cut of RF-21 is NOT here, and neither is the cut of the
 * decomposition: both belong to the section that draws them, and expanding
 * either is not a preference (D-17).
 * @module webview/domain/sections
 */

import type { DisplayPreferences, ReadingIntegrity, SectionName } from './types.ts'
import { COLLAPSIBLE_SECTIONS, DEFAULT_COLLAPSED, SECTION_NAMES } from './types.ts'

/**
 * The eight sections, in the order RF-18 fixes.
 * @returns the names, in order.
 */
export function sectionOrder(): SectionName[] {
  return [...SECTION_NAMES]
}

/**
 * The seven collapsible cards, in the same order (RN-03).
 *
 * It is what the two global actions walk. The blocking band is left out
 * because it is not a card: it occupies a section name for the sake of failure
 * isolation, and nothing may hide it.
 * @returns the names of the cards, in the order the panel draws them.
 */
export function collapsibleSections(): SectionName[] {
  return [...COLLAPSIBLE_SECTIONS]
}

/**
 * Which cards the panel shows collapsed.
 *
 * A declared preference wins outright: the user's choice is not validated
 * against the default, a preference that closes a core card is respected, and
 * a declared preference that collapses NOTHING keeps everything open. The
 * default of RN-02 and RN-11 applies only in the absence of a declaration,
 * with the one exception that a reading which lost something opens the
 * anomalies without being asked.
 * @param preferences - the preference already read by `readPreferences`.
 * @param integrity - whether the reading came through whole.
 * @returns the names to draw collapsed.
 */
export function effectiveCollapsed(
  preferences: DisplayPreferences,
  integrity: ReadingIntegrity,
): SectionName[] {
  if (preferences.declared) return [...preferences.collapsedSections]

  return DEFAULT_COLLAPSED.filter(
    (name) => !(integrity.degraded && name === 'anomalies'),
  ) as SectionName[]
}
