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
import { effectiveCollapsed } from '../src/webview/domain/sections.ts'
import { EMPTY_PREFERENCES } from '../src/webview/domain/types.ts'
import { composeAnomalies } from '../src/webview/domain/anomalies-view.ts'
import {
  closedDiscoveryFixture,
  greenfieldFixture,
  historyFixture,
  linkedHistoryFixture,
  payloadFixture,
  processFixture,
  undeclaredDiscoveryFixture,
} from './helpers/reversa-fixtures.ts'

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

/**
 * As anomalias do histórico, que a feature 010 acrescenta, somam pela mesma
 * regra (D-12, RF-11): contadas e não fundidas, e nada de um host anterior.
 */
describe('as anomalias do histórico na integridade (feature 010)', () => {
  const perdas = linkedHistoryFixture([
    {
      file: '_reversa_forward/002-x/onboarding.md',
      code: 'tabela-nao-reconhecida',
      detail: '9. Registro de conferências: Marco | Item | Resultado',
    },
    { file: '_reversa_forward/003-y/legacy-impact.md', code: 'artefato-da-entrega-nao-lido', detail: 'vínculo parcial' },
  ])

  it('somam às do processo, do registro e do eixo greenfield', () => {
    const eixo = greenfieldFixture({ anomalias: [{ file: '_reversa_sdd/prd.md', code: 'escopo-do-prd-nao-encontrado' }] })
    const carga = payloadFixture({ history: perdas, greenfield: eixo })
    const integridade = readingIntegrity(carga)
    expect(integridade.anomalies).toBe(carga.process.anomalies.length + carga.bugs.anomalias.length + 1 + 2)
    expect(integridade.degraded).toBe(true)
  })

  it('abrem a seção de anomalias pelo mesmo caminho das outras', () => {
    const colapsadas = effectiveCollapsed(EMPTY_PREFERENCES, readingIntegrity(payloadFixture({ history: perdas })))
    const limpas = effectiveCollapsed(EMPTY_PREFERENCES, readingIntegrity(payloadFixture({ history: linkedHistoryFixture() })))
    expect(colapsadas).not.toContain('anomalies')
    expect(limpas).toContain('anomalies')
  })

  it('o campo ausente, como o de um host anterior, contribui com nada', () => {
    const integridade = readingIntegrity(payloadFixture({ history: historyFixture() }))
    expect(integridade.anomalies).toBe(0)
    expect(integridade.degraded).toBe(false)
  })
})

describe('a contagem passa a vir da composição (feature 011, D-03)', () => {
  it('uma anomalia absorvida deixa de degradar a leitura', () => {
    const carga = payloadFixture({
      process: processFixture({ state: { phase: 'concluido' } }),
      discoveryState: closedDiscoveryFixture(),
    })
    const integridade = readingIntegrity(carga)

    expect(carga.process.anomalies).toHaveLength(1)
    expect(integridade.anomalies).toBe(0)
    expect(integridade.degraded).toBe(false)
  })

  it('a contagem do cabeçalho é a mesma lista que a seção desenha', () => {
    const carga = payloadFixture({
      process: processFixture({ state: { phase: 'concluido' } }),
      discoveryState: undeclaredDiscoveryFixture(),
    })

    expect(readingIntegrity(carga).anomalies).toBe(composeAnomalies(carga).length)
  })

  it('as anomalias do próprio eixo degradam a leitura, como as dos outros três', () => {
    const integridade = readingIntegrity(
      payloadFixture({ discoveryState: undeclaredDiscoveryFixture(['writer']) }),
    )

    expect(integridade.anomalies).toBe(1)
    expect(integridade.degraded).toBe(true)
  })

  it('um host anterior, que não envia o eixo, contribui com nada', () => {
    const carga = payloadFixture({ process: processFixture({ state: { phase: 'documentacao' } }) })
    const integridade = readingIntegrity(carga)

    expect(carga.discoveryState).toBeUndefined()
    expect(integridade.anomalies).toBe(1)
    expect(integridade.degraded).toBe(true)
  })

  it('a leitura que só perdeu a anomalia absorvida não abre mais a seção de anomalias', () => {
    const carga = payloadFixture({
      process: processFixture({ state: { phase: 'concluido' } }),
      discoveryState: closedDiscoveryFixture(),
    })

    expect(effectiveCollapsed(EMPTY_PREFERENCES, readingIntegrity(carga))).toContain('anomalies')
  })
})
