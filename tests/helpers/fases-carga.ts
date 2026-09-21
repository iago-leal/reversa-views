/**
 * A payload built from ONE `state.json`, for the drawing suites of feature 015:
 * the inherited process and the discovery-state axis both come from the same
 * file, through the real readers, which is what the host does.
 * @module tests/helpers/fases-carga
 */

import { readDiscoveryState } from '../../src/domain/discovery-state.ts'
import type { DiscoveryStateAxis, MapaDeEquivalencias } from '../../src/domain/types.ts'
import type { ReversaProcess } from '../../src/heranca/reversa-domain/src/index.ts'
import type { SetProcessData } from '../../src/host/protocol.ts'
import { payloadFixture, processFixture } from './reversa-fixtures.ts'

/** The process and the axis of one state file. */
export interface LeituraDesenhavel {
  process: ReversaProcess
  eixo: DiscoveryStateAxis
  carga: SetProcessData
}

/**
 * Read one state file the way the host does, and wrap it in a payload.
 * @param stateJson - the file, as text.
 * @param mapa - what a person approved; absent means nothing.
 * @returns the process, the axis and the payload carrying both.
 */
export function lerParaDesenhar(stateJson: string, mapa?: MapaDeEquivalencias): LeituraDesenhavel {
  const process = processFixture({ state: JSON.parse(stateJson) })
  const eixo = readDiscoveryState({ stateJson, anomalias: process.anomalies, equivalencias: mapa })
  return { process, eixo, carga: payloadFixture({ process, discoveryState: eixo }) }
}
