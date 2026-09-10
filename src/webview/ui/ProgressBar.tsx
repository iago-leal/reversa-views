/**
 * The progress bar, one piece used by three cards (D-15, RF-30, RF-31, RF-33).
 *
 * The request was for three bars, and three similar snippets diverge on the
 * first correction. So there is one component, and the cards hand it a pair of
 * counts and the sentence they already print beside it.
 *
 * WHY IT IS DRAWN IN SVG, which is the one surprising thing here. The document
 * of the panel is served under a policy whose `style-src` grants no inline
 * style, so a `style` attribute carrying the width would be discarded by the
 * embedded browser and every bar would render empty. Classes could carry the
 * width, but only in steps: a hundred and one rules for a hundred and one
 * percentages, or coarse steps that would draw "43 of 44" as full. The width of
 * an SVG rectangle is a PRESENTATION ATTRIBUTE, which the policy does not
 * reach, so the value stays continuous and the sheet keeps deciding the colour.
 *
 * The native progress element was considered and rejected in the research of
 * this feature: it brings the appearance of each platform, resists consistent
 * styling, and would mean fighting the embedded browser instead of drawing two
 * rectangles.
 *
 * RN-10 is what keeps the bar honest: it is never the only carrier of the
 * information. The text that counts the units stays in the card, and the label
 * repeats it for whoever reads by screen reader, because colour and length
 * alone serve neither high contrast nor assistive technology.
 * @module webview/ui/ProgressBar
 */

import type { ReactNode } from 'react'

/** The height of the rail, in the units the sheet also uses. */
const HEIGHT = 8

/** The rounding of both ends, which is the shape the design system uses. */
const RADIUS = 4

/** What the bar draws. */
export interface ProgressBarProps {
  /** Never negative; above `total` it is clamped for the drawing (RF-33). */
  feitos: number
  /** Zero means no bar at all. */
  total: number
  /** The equivalent text, repeating in words the count written beside it. */
  rotulo: string
}

/**
 * The proportion drawn, as a percentage with at most two decimals.
 *
 * Two decimals is not decoration: with forty-four actions each one is a bit
 * over two percent, and rounding to whole numbers would make two different
 * counts draw the same length.
 * @param feitos - the numerator, already clamped.
 * @param total - the denominator, already known to be positive.
 * @returns something like `83.33%`.
 */
function percentage(feitos: number, total: number): string {
  return `${Number(((feitos / total) * 100).toFixed(2))}%`
}

/**
 * A count the bar can draw: a whole number between zero and the total.
 *
 * Clamping is a decision of RF-33 and not a defensive habit. Above the total
 * the bar draws full rather than overflowing its rail, and the DIVERGENCE that
 * produced such a number keeps the warning it already has in the card — the bar
 * does not get to choose between the two numbers.
 * @param value - the count as the card handed it over.
 * @param total - the denominator.
 * @returns the count to draw and to announce.
 */
function clamp(value: number, total: number): number {
  if (!Number.isFinite(value)) return 0
  if (value < 0) return 0
  return value > total ? total : value
}

/**
 * The bar, or nothing at all when there is nothing to divide by.
 * @param props - the pair of counts and the equivalent text.
 * @returns the bar, or null when the denominator is not positive (RF-33).
 */
export function ProgressBar(props: ProgressBarProps): ReactNode {
  const { total, rotulo } = props

  // A denominator of zero draws no bar. Drawing a full one over a total that
  // does not exist would tell the reader that everything is done in a card
  // that has nothing in it.
  if (!Number.isFinite(total) || total <= 0) return null

  const feitos = clamp(props.feitos, total)

  return (
    <svg
      data-part="progress"
      className="progress"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={feitos}
      aria-valuetext={rotulo}
      height={HEIGHT}
      width="100%"
      preserveAspectRatio="none"
    >
      <rect className="progress__track" width="100%" height={HEIGHT} rx={RADIUS} />
      <rect
        className="progress__fill"
        width={percentage(feitos, total)}
        height={HEIGHT}
        rx={RADIUS}
      />
    </svg>
  )
}
