/**
 * The approved map of out-of-schema equivalences (feature 012).
 *
 * GENERATED FILE. It is written by `scripts/promover-equivalencias.js`, from
 * the items a person ticked in a proposal, and it is not edited by hand: an
 * edit here would be an approval no one made and no history records.
 *
 * It is VERSIONED, unlike the build stamp and like the inherited revision, and
 * for the same reason those two differ from each other. The stamp changes at
 * every commit, so versioning it would leave the tree dirty after every build.
 * This map changes only when someone decides something, which makes its git
 * history the audit trail of the approvals themselves -- who approved what,
 * when, and against which evidence.
 *
 * It is a MODULE and not a `.json` because of how the package is assembled:
 * `.vscodeignore` excludes everything and lets back in only `out/**` and
 * `media/**`, and `scripts/conteudo-esperado.js` foresees only
 * `extension/out/`. A data file under `src/` would never reach the `.vsix`.
 * Compiled, it travels as `out/domain/equivalencias.js` without the package
 * content list changing at all, and it gets type checking for free.
 *
 * Empty is the honest starting point, and it is also the safe one: with
 * nothing approved, the reading is exactly the reading of feature 011.
 * @module domain/equivalencias
 */

import type { MapaDeEquivalencias } from './types.ts'

/** Everything a person has approved. Nothing, so far. */
export const MAPA_DE_EQUIVALENCIAS: MapaDeEquivalencias = {
  pares: [],
  naoAgentes: [],
}
