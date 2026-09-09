/**
 * The order of the sections and what starts collapsed (RF-14, RF-22, RN-01,
 * D-20).
 *
 * The order does not depend on the process: a panel whose sections move
 * around between readings cannot be learnt. It is the array of `types.ts`,
 * returned as it is.
 *
 * The initial collapse is where D-20 lives: the three diagnostic sections
 * start closed, EXCEPT the anomalies when the reading degraded, because a
 * reading that lost something has to say what it lost without being asked.
 *
 * The ten-anomaly cut of RF-21 is NOT here: it belongs to the section that
 * draws them, and expanding it is not a preference (D-19).
 * @module webview/domain/sections
 */

import type { DisplayPreferences, ReadingIntegrity, SectionName } from './types.ts'
import { DIAGNOSTIC_SECTIONS, SECTION_NAMES } from './types.ts'

/**
 * The six sections, in the order RF-14 fixes.
 * @returns the names, in order.
 */
export function sectionOrder(): SectionName[] {
  return [...SECTION_NAMES]
}

/**
 * Which sections the panel opens collapsed.
 *
 * A stored preference wins outright, in both readings: the user's choice is
 * not validated against the default, and a preference that closes a core
 * section is respected. An EMPTY preference is the absence of one, and is
 * what falls back to the default of RF-22.
 * @param preferences - the preference already read by `readPreferences`.
 * @param integrity - whether the reading came through whole.
 * @returns the names to draw collapsed.
 */
export function initialCollapsed(
  preferences: DisplayPreferences,
  integrity: ReadingIntegrity,
): SectionName[] {
  if (preferences.collapsedSections.length > 0) return [...preferences.collapsedSections]

  return DIAGNOSTIC_SECTIONS.filter(
    (name) => !(integrity.degraded && name === 'anomalies'),
  ) as SectionName[]
}
