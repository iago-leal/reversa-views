/**
 * What the editor is asking for, read off the class it writes on the body
 * (RF-11, EC-06, D-02, D-23).
 *
 * This module does NOT decide colour and does not know a colour set by name:
 * it reports the mode and the high contrast signal, and `primer-themes.ts`
 * translates. That split is what lets the panel repaint on a theme change
 * without rereading anything and without losing a collapsed section.
 *
 * The class source enters as a port rather than as the document, so the
 * reading is testable without a DOM and the module stays inside the webview
 * boundary the suite of T020 checks.
 * @module webview/theme/contrast
 */

import type { EditorTheme } from '../domain/types.ts'

/** The class the editor writes for the dark high contrast theme. */
const HIGH_CONTRAST = 'vscode-high-contrast'

/** The class it adds, alongside the one above, for the light high contrast theme. */
const HIGH_CONTRAST_LIGHT = 'vscode-high-contrast-light'

/** The class of the plain dark theme. */
const DARK = 'vscode-dark'

/** What the panel falls back to when the class says nothing it knows. */
const FALLBACK: EditorTheme = { mode: 'light', highContrast: false }

/** Where the classes come from, and how to hear about them changing. */
export interface ClassSource {
  /** The class list of the body, as one string. */
  classes(): string
  /** Register a listener for changes; returns the function that removes it. */
  subscribe(listener: () => void): () => void
}

/**
 * Read the theme off the class list the editor writes.
 *
 * The reading is by token, never by substring: `vscode-high-contrast-light`
 * contains `vscode-high-contrast`, and the editor writes both at once, so a
 * substring test would call the light high contrast theme dark.
 * @param classes - the class list of the body, as one string.
 * @returns the theme in force; light when the class says nothing known.
 */
export function readEditorTheme(classes: string): EditorTheme {
  const tokens = new Set(classes.split(/\s+/).filter((token) => token.length > 0))

  if (tokens.has(HIGH_CONTRAST_LIGHT)) return { mode: 'light', highContrast: true }
  if (tokens.has(HIGH_CONTRAST)) return { mode: 'dark', highContrast: true }
  if (tokens.has(DARK)) return { mode: 'dark', highContrast: false }

  return { ...FALLBACK }
}

/**
 * Watch the editor's theme, calling back only when it actually changed.
 *
 * The editor rewrites the class list for reasons that are not a theme change,
 * and repainting on each of those would cost a render for nothing. So the
 * last theme read is kept and compared.
 * @param source - where the classes come from.
 * @param onChange - what to do with the new theme.
 * @returns the function that stops the watch.
 */
export function watchEditorTheme(
  source: ClassSource,
  onChange: (theme: EditorTheme) => void,
): () => void {
  let current = readEditorTheme(source.classes())

  return source.subscribe(() => {
    const next = readEditorTheme(source.classes())
    if (next.mode === current.mode && next.highContrast === current.highContrast) return

    current = next
    onChange(next)
  })
}
