/**
 * The shape of a log line written from the panel (RN-07).
 *
 * The same three parts the host fixed in feature 002 -- who acted, what the
 * act was, and why -- because the two sides write into the SAME output
 * channel, and a channel with two formats is a channel nobody reads.
 *
 * It is declared again here, rather than imported from `host/ports.ts`,
 * because a value import across that boundary would survive into the bundle
 * and drag the host with it (D-06). Four lines duplicated is the price of the
 * boundary, and the suite of T020 is what holds the boundary.
 * @module webview/bridge/log
 */

/**
 * One line for the output channel.
 * @param origin - the webview module writing the line, e.g. `messaging`.
 * @param act - what happened, in the maintainer's language.
 * @param reason - why, naming the command, the section or the path.
 * @returns the formatted line.
 */
export function panelLine(origin: string, act: string, reason: string): string {
  return `${origin} · ${act}: ${reason}`
}
