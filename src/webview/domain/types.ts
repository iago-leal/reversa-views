/**
 * The vocabulary of the panel: types and constants, no logic and no component
 * (RF-13, RF-14, RN-01).
 *
 * Everything the screen decides is decided over these shapes, and every one of
 * them is named here so that a component can be read without guessing what it
 * receives. The shapes of the process, of the probe report and of the payloads
 * are NOT redeclared: they arrive from `src/host/protocol.ts` as types, never
 * as values, so that the protocol stays the single source of those forms
 * (D-06) and nothing of the host survives into the bundle.
 * @module webview/domain/types
 */

import type { EntryKind, SetNoticeData, SetProcessData } from '../../host/protocol.ts'

/**
 * The six sections, in the order RF-14 fixes. The order of this array IS the
 * order of the panel: `sectionOrder()` returns it, and the markup suite reads
 * the rendered document against it.
 */
export const SECTION_NAMES = [
  'blocking',
  'forward',
  'discovery',
  'policy',
  'anomalies',
  'probe',
] as const

/** One of the six sections. */
export type SectionName = (typeof SECTION_NAMES)[number]

/** The three sections of the diagnostic block, which are the ones that start collapsed. */
export const DIAGNOSTIC_SECTIONS: readonly SectionName[] = ['policy', 'anomalies', 'probe']

/**
 * What the panel is showing, which is one of the five entry states of the
 * protocol plus the mark of a reread in flight.
 *
 * The mark is a field of its own, and not a sixth state, because RN-08 makes
 * rereading additive: the previous content stays on screen while it happens.
 */
export interface EffectiveEntry {
  kind: EntryKind
  /** True between the loading command and the payload that answers it. */
  rereading: boolean
  /** The payload being shown, when there is one. */
  loaded: SetProcessData | null
  /** Present only on `error`. */
  message: string | null
  /** Present once a root has been chosen. */
  root: string | null
}

/**
 * One reason the process is waiting on a human, in the three parts RF-03a
 * fixes: what to call it, what to open, and what to run.
 *
 * The command is text to copy. The panel never executes it, and the reserved
 * dispatch of RF-15 is the place where that would one day change.
 */
export interface BlockingReason {
  /** The sentence that names the reason. */
  text: string
  /** Path relative to the observed root, to send with `openFile`; null when there is none. */
  artifact: string | null
  /** The REVERSA command to copy; null when no command applies. */
  command: string | null
}

/**
 * A value turned readable, carrying whether it was recognised.
 *
 * RN-05 forbids an unknown value from breaking the render, and RF-04 of the
 * protocol keeps the raw value travelling untouched. A label is how the two
 * live together: the screen draws `text`, and `known` is what tells it to mark
 * the value as unrecognised instead of pretending it read it.
 */
export interface Label {
  /** What to draw: the readable name, or the raw value when unknown. */
  text: string
  known: boolean
  /** The value as it arrived, always, so the screen can show it verbatim. */
  raw: string
}

/** A phase, a checkpoint or anything else whose status has to read without colour. */
export interface StatusMark {
  label: Label
  /** Short word for the status, drawn as text: RNF of accessibility, not decoration. */
  status: string
}

/**
 * Whether the reading came through whole, and why not when it did not.
 *
 * The three signals are the ones RN-06 makes normative, and they are counted
 * once, here, so that the header and the initial collapse read the same fact
 * rather than each deciding it (D-20).
 */
export interface ReadingIntegrity {
  degraded: boolean
  anomalies: number
  refusals: number
  truncated: number
}

/** What the user chose to keep collapsed; the only thing the panel stores. */
export interface DisplayPreferences {
  collapsedSections: SectionName[]
}

/** The empty preference, which is also what an unreadable stored state becomes. */
export const EMPTY_PREFERENCES: DisplayPreferences = { collapsedSections: [] }

/** The four colour sets the panel offers, as `@primer/primitives` names them. */
export const OFFERED_THEMES = ['light', 'dark', 'light_high_contrast', 'dark_high_contrast'] as const

/** One of the four offered sets. */
export type OfferedTheme = (typeof OFFERED_THEMES)[number]

/** Light or dark, which is all the editor's class ultimately says. */
export type ColorMode = 'light' | 'dark'

/** What the editor is asking for, read off the class it writes on the body. */
export interface EditorTheme {
  mode: ColorMode
  highContrast: boolean
}

/**
 * What the root element has to carry for a colour set to take effect.
 *
 * Both names are always written, because the mode may change underneath -- the
 * editor switching theme with the panel open -- and the attribute for the
 * other mode has to be already correct when it does.
 */
export interface ThemeAttributes {
  'data-color-mode': ColorMode
  'data-light-theme': OfferedTheme
  'data-dark-theme': OfferedTheme
}

/** The warning of the third host command, held beside the content, never in place of it (D-17). */
export type Notice = SetNoticeData | null
