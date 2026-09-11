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

/**
 * The most bug folders read in one pass, across every context (RF-15, D-13).
 *
 * It is the same fifty of `FEATURE_FOLDER_CAP` and of the inherited addenda,
 * for the same reason: a registry that grew past what anyone reads must not
 * turn one panel reading into an unbounded walk of the disk. Above it the
 * reading stops and DECLARES itself partial, saying how many exist beside how
 * many were read -- a ceiling that hid what it cut would be worse than none.
 *
 * Three bugs exist in this project today, so the guard is far from binding.
 */
export const BUG_CAP = 50

/**
 * The folder the bug registry lives in, relative to the observed root.
 *
 * The literal is written HERE and not imported, and that is a DUPLICATION in
 * relation to the inherited package: `policy.ts` names the same folder among
 * the ones REVERSA owns, and does not export it. Reaching into a vendored file
 * for the value, or editing it to export one, would cost a declared adaptation
 * in `src/heranca/PROCEDENCIA.md` and a conflict at the next resynchronisation
 * -- a price out of proportion to one string.
 *
 * The duplication is therefore accepted and declared, and it is contained by
 * living in exactly one place on the local side: if the registry is ever
 * renamed, this module is the only local file to change, and the divergence
 * with the inherited one becomes visible at that moment rather than never.
 */
export const BUGS_FOLDER = '_reversa_bugs'

/* ------------------------------------------------ the greenfield artifacts */

/**
 * The names of the artifacts the greenfield pipeline leaves behind, and of the
 * two the legacy extraction leaves (feature 009, D-18, RN-01, RN-03).
 *
 * Every one of them is a DUPLICATION in relation to what the skills of REVERSA
 * write -- `/reversa-new` names the brief, the ideation and the personas,
 * `/reversa-drafter` the PRD, `/reversa-spec-sdd` the folder of specs, and
 * `/reversa-coding` checks the two legacy anchors -- and the duplication is
 * accepted for the same reason `BUGS_FOLDER` above is: no inherited package
 * exports these names, and writing them in exactly one place on the local side
 * is what turns a future renaming into a one-line edit here rather than a hunt
 * through the probe, the domain and the tests.
 *
 * They are the ORDER of the pipeline as well as its vocabulary: the physical
 * stage is the longest contiguous run of them present on disk, in the order
 * they are declared here.
 */
export const NEWPROJECT_BRIEF_FILE = 'newproject-brief.md'
export const IDEATION_FILE = 'ideation.md'
export const PERSONAS_FILE = 'personas.md'
export const PRD_FILE = 'prd.md'

/** The folder of the specs, one `.md` per planned component, inside the output folder. */
export const SDD_FOLDER = 'sdd'

/** The two files whose presence together is the legacy anchor of `/reversa-coding`. */
export const ARCHITECTURE_FILE = 'architecture.md'
export const DOMAIN_FILE = 'domain.md'

/**
 * The most specs read in one pass, in name order (RN-10).
 *
 * The same fifty as the feature folders, the bugs and the inherited addenda,
 * and for the same reason: a folder that grew past what anyone reads must not
 * turn one panel reading into an unbounded walk. Above it the reading DECLARES
 * itself partial, saying how many exist beside how many were read. Five specs
 * exist in this project today.
 */
export const SPEC_CAP = 50

/**
 * The most items read from the scope section of the PRD (RN-14).
 *
 * A scope is prose, and prose has no natural ceiling; this one exists so that
 * a PRD written by a runaway agent cannot fill the panel. Eleven items exist in
 * the PRD of this project today.
 */
export const SCOPE_ITEM_CAP = 50
