/**
 * The only file that knows the names of the colour sets (RF-11, D-02).
 *
 * It imports the four sets RF-11 requires -- light, dark and the two high
 * contrast ones -- plus the size file they all presuppose: without it the
 * rules resolve every measure to nothing, and the panel draws with no spacing
 * at all. The bundler inlines these four sheets, and the trimmer of
 * `scripts/theme-tokens.js` cuts them down to the tokens `theme.css` actually
 * names, which is what keeps them inside the budget (RF-24).
 *
 * Nothing else in the webview names a colour set: the boundary suite of T020
 * is what holds that, and `theme/contrast.ts` deliberately reports what the
 * editor is asking for WITHOUT knowing what it will be translated into.
 * @module webview/theme/primer-themes
 */

import '@primer/primitives/dist/css/base/size/size.css'
import '@primer/primitives/dist/css/functional/themes/light.css'
import '@primer/primitives/dist/css/functional/themes/dark.css'
import '@primer/primitives/dist/css/functional/themes/light-high-contrast.css'
import '@primer/primitives/dist/css/functional/themes/dark-high-contrast.css'

import type { EditorTheme, ThemeAttributes } from '../domain/types.ts'

/** The pair of sets to use outside high contrast. */
const COMMON = { light: 'light', dark: 'dark' } as const

/** The pair of sets to use under high contrast. */
const CONTRAST = { light: 'light_high_contrast', dark: 'dark_high_contrast' } as const

/**
 * The attributes the root element has to carry for a colour set to take
 * effect.
 *
 * BOTH names are always written, and this is not redundancy: the editor can
 * switch theme with the panel open, and when it does the attribute for the
 * other mode has to be already correct. Writing only the mode in force would
 * leave the panel one repaint behind the editor.
 * @param theme - what the editor is asking for.
 * @returns the three attributes, ready to spread onto the root element.
 */
export function themeAttributes(theme: EditorTheme): ThemeAttributes {
  const pair = theme.highContrast ? CONTRAST : COMMON

  return {
    'data-color-mode': theme.mode,
    'data-light-theme': pair.light,
    'data-dark-theme': pair.dark,
  }
}
