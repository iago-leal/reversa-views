/**
 * The display preference, which is the only thing the panel stores (RF-12,
 * RN-01, RN-09, EC-09, D-07).
 *
 * The reading is TOTAL: absence, null, a wrong type, a missing field, a field
 * of the wrong type and a section name that no longer exists all come back as
 * a usable preference. The panel's stored state outlives the panel's code, and
 * a state written by an older version must not be able to break the newer one.
 *
 * The state port does NOT enter here. This module receives values and returns
 * values; who owns the host interface is `bridge/messaging.ts`. That is what
 * makes this testable without doubling an editor.
 * @module webview/domain/preferences
 */

import type { DisplayPreferences, SectionName } from './types.ts'
import { EMPTY_PREFERENCES, SECTION_NAMES } from './types.ts'

/** The section names, as a set, for the discard of EC-09. */
const KNOWN: ReadonlySet<string> = new Set(SECTION_NAMES)

/**
 * Whether a value is a section this version still has.
 * @param value - anything the stored state carried.
 * @returns true when the name is one of the six.
 */
function isSection(value: unknown): value is SectionName {
  return typeof value === 'string' && KNOWN.has(value)
}

/**
 * Read the stored state into a usable preference, whatever it holds.
 *
 * An unknown section name is discarded in silence: it is not an anomaly of the
 * process, and it is not a warning either. It is a preference of a version
 * that no longer exists.
 * @param stored - what the state port returned; anything at all.
 * @returns the preference, always in the declared shape.
 */
export function readPreferences(stored: unknown): DisplayPreferences {
  if (typeof stored !== 'object' || stored === null) return { ...EMPTY_PREFERENCES }

  const raw = (stored as { collapsedSections?: unknown }).collapsedSections
  if (!Array.isArray(raw)) return { ...EMPTY_PREFERENCES }

  return { collapsedSections: raw.filter(isSection) }
}

/**
 * The preference with one section collapsed or expanded.
 *
 * Returns a new preference; the one received is not touched. The whole list is
 * what gets written back, never a merge, so that what is stored is always what
 * the panel last showed.
 * @param preferences - the preference in force.
 * @param section - the section being toggled.
 * @param collapsed - true to collapse it, false to expand it.
 * @returns the new preference.
 */
export function withCollapsed(
  preferences: DisplayPreferences,
  section: SectionName,
  collapsed: boolean,
): DisplayPreferences {
  const without = preferences.collapsedSections.filter((name) => name !== section)
  return { collapsedSections: collapsed ? [...without, section] : without }
}
