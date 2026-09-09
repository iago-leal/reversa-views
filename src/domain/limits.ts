/**
 * The two ceilings feature 006 adds to the run time, in one place (D-14).
 *
 * The precedent is `scripts/limites.js`, which gathered the numbers of the
 * build after they had been found scattered and disagreeing. This module is
 * its counterpart for the code that ships: a number written at the point of
 * use is a number that agrees today and diverges later, and the divergence
 * only shows up on the machine of whoever installed the extension.
 *
 * They live apart from `scripts/limites.js` because that one is loaded by the
 * build in CommonJS and this one is compiled into the extension. Neither can
 * import the other without dragging a whole world along.
 * @module domain/limits
 */

/**
 * The most feature folders read in one pass, in name order.
 *
 * It follows the ceiling of fifty addenda the inherited probe already applies,
 * and for the same reason: a project with hundreds of folders must not turn
 * one panel reading into an unbounded walk of the disk. Six folders is what
 * this repository has today, so the ceiling is a guard and not a limit anyone
 * is meeting.
 */
export const FEATURE_FOLDER_CAP = 50

/**
 * The most bytes of text the webview may send to the host, for the draft and
 * for the clipboard alike.
 *
 * 65.536 bytes is roomy for dozens of features -- the summary of this project
 * is under two thousand -- and it stops an absurd send from travelling a
 * channel that would then carry what nobody reads. Above it the router
 * refuses, and says the size it received beside the ceiling.
 */
export const SUMMARY_TEXT_CAP = 65536
