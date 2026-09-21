/**
 * The reading of the phases end to end, for the suites of feature 015.
 *
 * The inherited anomalies come from the REAL inherited contract and what
 * reaches the screen comes from the REAL composition, so a case here fails
 * when any of the three links changes -- the inherited layer, the axis or the
 * discount -- and not only when the axis does.
 * @module tests/helpers/fases-leitura
 */

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { readDiscoveryState } from '../../src/domain/discovery-state.ts'
import type { DiscoveryStateAxis, MapaDeEquivalencias } from '../../src/domain/types.ts'
import { StateContract } from '../../src/heranca/reversa-domain/src/index.ts'
import { composeAnomalies } from '../../src/webview/domain/anomalies-view.ts'
import { emptyProcessFixture, payloadFixture } from './reversa-fixtures.ts'

/** The file every anomaly of a phase names. */
export const ARQUIVO_DO_ESTADO = '.reversa/state.json'

/** One anomaly in the common shape. */
export interface Tripla {
  file: string
  code: string
  detail?: string
}

/** One fixture of `tests/fixtures/descoberta/`, as text. */
export function amostra(nome: string): string {
  return readFileSync(join(__dirname, '..', 'fixtures', 'descoberta', `${nome}.json`), 'utf8')
}

/** A `state.json` with just the three lists of phase names. */
export function estado(phase: string | null, completed: string[], pending: string[] = []): string {
  return JSON.stringify({ version: '1.3.3', phase, completed, pending, checkpoints: {} })
}

/** A map with the given stages approved and nothing else. */
export function mapaComEtapas(...etapas: string[]): MapaDeEquivalencias {
  return {
    pares: [],
    naoAgentes: [],
    etapas: etapas.map((nome) => ({ nome, aprovadoEm: '2026-09-21', evidencia: ['amostra'] })),
  }
}

/** What one reading yields: the raw inherited list, the axis, and what the screen shows. */
export interface LeituraDeFases {
  herdadas: Tripla[]
  eixo: DiscoveryStateAxis
  exibidas: Tripla[]
}

/**
 * Read one `state.json` through the inherited contract, the axis and the
 * composition, keeping only the anomalies over the state file.
 * @param stateJson - the file, as text.
 * @param mapa - what a person approved; absent means nothing.
 * @returns the three views of the same reading.
 */
export function lerFases(stateJson: string, mapa?: MapaDeEquivalencias): LeituraDeFases {
  const herdadas = StateContract.read(stateJson).anomalies as Tripla[]
  const eixo = readDiscoveryState({ stateJson, anomalias: herdadas, equivalencias: mapa })
  const carga = payloadFixture({
    process: { ...emptyProcessFixture(), anomalies: herdadas } as never,
    discoveryState: eixo,
  })
  const exibidas = (composeAnomalies(carga) as Tripla[]).filter((a) => a.file === ARQUIVO_DO_ESTADO)
  return { herdadas, eixo, exibidas }
}

/** The details of the anomalies with a given code, in order. */
export function detalhes(anomalias: readonly Tripla[], code: string): string[] {
  return anomalias.filter((a) => a.code === code).map((a) => a.detail ?? '')
}
