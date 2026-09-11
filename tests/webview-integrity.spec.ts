/**
 * As anomalias do eixo greenfield contam na integridade da leitura (RN-06,
 * RF-18, D-20).
 *
 * Contadas e não fundidas: a carga mantém as listas separadas, porque têm
 * origens e vocabulários distintos, e a integridade é o único lugar que as
 * soma. Um host anterior, que não envia o eixo, contribui com nada, e não com
 * uma exceção.
 * @module tests/webview-integrity
 */

import { describe, expect, it } from 'vitest'
import { readingIntegrity } from '../src/webview/domain/integrity.ts'
import { greenfieldFixture, payloadFixture } from './helpers/reversa-fixtures.ts'

describe('as anomalias do eixo greenfield na integridade', () => {
  it('uma anomalia do eixo degrada a leitura, sozinha', () => {
    const eixo = greenfieldFixture({
      anomalias: [{ file: '.reversa/state.json', code: 'estagio-greenfield-divergente', detail: 'x' }],
    })
    const integridade = readingIntegrity(payloadFixture({ greenfield: eixo }))
    expect(integridade.degraded).toBe(true)
    expect(integridade.anomalies).toBe(1)
  })

  it('soma com as anomalias do processo e do registro, sem fundir as listas', () => {
    const eixo = greenfieldFixture({
      anomalias: [
        { file: '_reversa_sdd/sdd/painel.md', code: 'spec-duplicada' },
        { file: '_reversa_sdd/prd.md', code: 'escopo-do-prd-nao-encontrado' },
      ],
    })
    const carga = payloadFixture({ greenfield: eixo })
    const integridade = readingIntegrity(carga)
    expect(integridade.anomalies).toBe(carga.process.anomalies.length + carga.bugs.anomalias.length + 2)
    expect(carga.process.anomalies).not.toContainEqual(expect.objectContaining({ code: 'spec-duplicada' }))
  })

  it('o eixo sem anomalia não degrada, e a leitura deste projeto é íntegra', () => {
    const integridade = readingIntegrity(payloadFixture({ greenfield: greenfieldFixture() }))
    expect(integridade.degraded).toBe(false)
    expect(integridade.anomalies).toBe(0)
  })

  it('o campo ausente, como o de um host anterior, contribui com nada e não lança', () => {
    const semEixo = payloadFixture()
    delete (semEixo as { greenfield?: unknown }).greenfield
    expect(() => readingIntegrity(semEixo)).not.toThrow()
    expect(readingIntegrity(semEixo).anomalies).toBe(0)
  })
})
