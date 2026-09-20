/**
 * The one composition of the anomaly list the panel draws (feature 011, D-03).
 *
 * Until now the sum lived inline in `App.tsx` and the count lived in
 * `integrity.ts`, two readings of one fact that agreed by coincidence because
 * both were plain concatenations. Feature 011 ends the coincidence: the axis
 * of the discovery state recognises inherited anomalies that the panel then
 * declines to draw, and a discount applied in one place and not the other
 * would have the header declaring a degraded reading over something the
 * section does not show. `integrity.ts` documents that risk in its own words;
 * this module is the answer to it.
 *
 * The discount happens HERE, on the view side, and never in the reading: the
 * inherited layer keeps reporting the disk whole, and deciding what the screen
 * shows is the panel's business (NG-03 of `leitura-do-processo.md`).
 * @module webview/domain/anomalies-view
 */

import type { SetProcessData } from '../../host/protocol.ts'
import type { AbsorbedAnomaly, DisplayAnomaly } from '../../domain/types.ts'

/**
 * Whether one inherited anomaly was absorbed by the discovery-state axis.
 *
 * The whole triple has to match. Matching by code alone would drop every
 * `fase-desconhecida`, the one over a typo included, which is what EC-02
 * exists to catch.
 * @param anomaly - one anomaly of the inherited list.
 * @param absorvidas - what the axis recognised.
 * @returns true when the panel should not draw it.
 */
function foiAbsorvida(
  anomaly: DisplayAnomaly,
  absorvidas: readonly AbsorbedAnomaly[],
): boolean {
  return absorvidas.some(
    (absorvida) =>
      absorvida.file === anomaly.file &&
      absorvida.code === anomaly.code &&
      absorvida.detail === anomaly.detail,
  )
}

/**
 * The anomalies the panel draws, in the order it has always drawn them.
 *
 * Process first, minus what was absorbed, then the bug registry, the
 * greenfield axis, the delivery axis and, last, the discovery-state axis. A
 * host older than any of these fields contributes nothing rather than
 * throwing, which is the rule every feature since 008 has followed.
 * @param payload - the successful reading the host sent.
 * @returns one flat list, ready for the section and for the count.
 */
export function composeAnomalies(payload: SetProcessData): DisplayAnomaly[] {
  const absorvidas = payload.discoveryState?.absorvidas ?? []

  return [
    ...payload.process.anomalies.filter((anomaly) => !foiAbsorvida(anomaly, absorvidas)),
    ...(payload.bugs?.anomalias ?? []),
    ...(payload.greenfield?.anomalias ?? []),
    ...(payload.history?.anomalias ?? []),
    ...(payload.discoveryState?.anomalias ?? []),
  ]
}
