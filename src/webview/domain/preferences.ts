/**
 * The display preference, which is the only thing the panel stores (RF-05,
 * RN-01, RN-09, EC-09, D-01, D-02).
 *
 * The reading is TOTAL: absence, null, a wrong type, a missing field, a field
 * of the wrong type and a section name that no longer exists all come back as
 * a usable preference. The panel's stored state outlives the panel's code, and
 * a state written by an older version must not be able to break the newer one.
 *
 * Since feature 006 the preference carries the mark of a DECLARATION, and that
 * is the whole of the correction. The list alone could not say what the user
 * meant: empty meant both "nothing was ever chosen" and "everything is open",
 * and the second reading never prevailed, so the default came back and closed
 * what the user had just opened. With the mark, an empty list under a declared
 * preference is a legitimate state -- everything expanded -- and the default
 * only ever applies where no choice was made.
 *
 * Nothing is migrated. A state written before the field is read by the rule of
 * D-02: a non-empty list is a choice someone made, an empty one is the absence
 * of a choice, and the ambiguity ends going forward rather than retroactively.
 *
 * The state port does NOT enter here. This module receives values and returns
 * values; who owns the host interface is `bridge/messaging.ts`. That is what
 * makes this testable without doubling an editor.
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
 * @module webview/domain/preferences
 */

import type { DisplayPreferences, SectionName } from './types.ts'
import { COLLAPSIBLE_SECTIONS, EMPTY_PREFERENCES, SECTION_NAMES } from './types.ts'

/** The section names, as a set, for the discard of EC-09. */
const KNOWN: ReadonlySet<string> = new Set(SECTION_NAMES)

/**
 * Whether a value is a section this version still has.
 * @param value - anything the stored state carried.
 * @returns true when the name is one of the eight.
 */
function isSection(value: unknown): value is SectionName {
  return typeof value === 'string' && KNOWN.has(value)
}

/**
 * Read the stored state into a usable preference, whatever it holds.
 *
 * An unknown section name is discarded in silence: it is not an anomaly of the
 * process, and it is not a warning either. It is a preference of a version
 * that no longer exists. Note that the discard does not undeclare the choice:
 * what was stored was chosen by someone, and losing the name of a section that
 * no longer exists is not the same as never having chosen.
 * @param stored - what the state port returned; anything at all.
 * @returns the preference, always in the declared shape.
 */
export function readPreferences(stored: unknown): DisplayPreferences {
  if (typeof stored !== 'object' || stored === null) return { ...EMPTY_PREFERENCES }

  const raw = (stored as { collapsedSections?: unknown }).collapsedSections
  if (!Array.isArray(raw)) return { ...EMPTY_PREFERENCES }

  // A field of the wrong type counts as absent, without anomaly and without a
  // warning on screen: it is not the reader's problem what an older version,
  // or a hand-edited state, left there.
  const mark = (stored as { declared?: unknown }).declared
  const declared = mark === true || (typeof mark !== 'boolean' && raw.length > 0)

  return { declared, collapsedSections: raw.filter(isSection) }
}

/**
 * The preference with one section collapsed or expanded.
 *
 * Returns a new preference; the one received is not touched. The whole list is
 * what gets written back, never a merge, so that what is stored is always what
 * the panel last showed. The result is ALWAYS declared: touching a card is the
 * gesture that turns the absence of a choice into a choice, and it is
 * precisely by failing to record that that the panel used to undo itself.
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
  return { declared: true, collapsedSections: collapsed ? [...without, section] : without }
}

/**
 * The preference of the two global actions: every card collapsed, or every
 * card expanded (RF-02, RF-03).
 *
 * It walks the seven collapsible cards and not the eight section names,
 * because the blocking band is not a card and RN-03 forbids any global action
 * from hiding what waits on a decision of the user.
 *
 * It takes no previous preference on purpose: the result does not depend on
 * one, and reading a state it would entirely overwrite would only suggest that
 * it might.
 * @param collapsed - true to collapse every card, false to expand every card.
 * @returns the new preference, always declared.
 */
export function withAll(collapsed: boolean): DisplayPreferences {
  return { declared: true, collapsedSections: collapsed ? [...COLLAPSIBLE_SECTIONS] : [] }
}
