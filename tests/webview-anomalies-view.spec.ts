/**
 * A composição da lista de anomalias que o painel desenha (feature 011, D-03).
 *
 * Ela existe por uma razão só: o cabeçalho e a seção precisam contar a MESMA
 * coisa. Antes da 011 a soma estava em linha no `App.tsx` e a contagem em
 * `integrity.ts`, duas leituras do mesmo fato que funcionavam por
 * coincidência; com o desconto das absorvidas, a coincidência acabaria, e o
 * painel declararia leitura degradada por uma anomalia que ele não mostra.
 * @module tests/webview-anomalies-view
 */

import { describe, expect, it } from 'vitest'
import { composeAnomalies } from '../src/webview/domain/anomalies-view.ts'
import {
  bugsFixture,
  closedDiscoveryFixture,
  discoveryStateFixture,
  greenfieldFixture,
  payloadFixture,
  processFixture,
  undeclaredDiscoveryFixture,
} from './helpers/reversa-fixtures.ts'

/** A soma que o `App.tsx` fazia em linha antes da feature 011. */
function somaAnterior(carga: ReturnType<typeof payloadFixture>) {
  return [
    ...carga.process.anomalies,
    ...(carga.bugs?.anomalias ?? []),
    ...(carga.greenfield?.anomalias ?? []),
    ...(carga.history?.anomalias ?? []),
  ]
}

describe('a composição sem o eixo, que é o host anterior', () => {
  it('devolve exatamente a soma de antes, na mesma ordem', () => {
    const carga = payloadFixture({ process: processFixture({ state: { phase: 'documentacao' } }) })

    expect(carga.discoveryState).toBeUndefined()
    expect(composeAnomalies(carga)).toEqual(somaAnterior(carga))
  })

  it('devolve lista vazia quando nada degradou', () => {
    expect(composeAnomalies(payloadFixture())).toEqual([])
  })

  it('preserva a ordem das quatro origens, processo primeiro e entrega por último', () => {
    const carga = payloadFixture({
      process: processFixture({ state: { phase: 'documentacao' } }),
      bugs: bugsFixture(),
      greenfield: greenfieldFixture({
        anomalias: [{ file: '_reversa_sdd/prd.md', code: 'escopo-do-prd-nao-encontrado' }],
      }),
    })
    const composta = composeAnomalies(carga)

    expect(composta[0]?.code).toBe('fase-desconhecida')
    expect(composta.at(-1)?.code).toBe('escopo-do-prd-nao-encontrado')
  })
})

describe('a composição com o eixo', () => {
  it('desconta a anomalia que o eixo absorveu', () => {
    const carga = payloadFixture({
      process: processFixture({ state: { phase: 'concluido' } }),
      discoveryState: closedDiscoveryFixture(),
    })

    expect(carga.process.anomalies).toHaveLength(1)
    expect(composeAnomalies(carga)).toEqual([])
  })

  it('deixa a carga herdada intacta: quem desconta é a exibição, não a leitura', () => {
    const carga = payloadFixture({
      process: processFixture({ state: { phase: 'concluido' } }),
      discoveryState: closedDiscoveryFixture(),
    })
    composeAnomalies(carga)

    expect(carga.process.anomalies).toHaveLength(1)
  })

  it('desconta só o que casa a tripla, e deixa a outra anomalia de fase em pé', () => {
    const carga = payloadFixture({
      process: processFixture({
        state: { phase: 'concluido', completed: ['reconhecimento', 'documentacao'] },
      }),
      discoveryState: closedDiscoveryFixture(),
    })
    const composta = composeAnomalies(carga)

    expect(carga.process.anomalies).toHaveLength(2)
    expect(composta).toHaveLength(1)
    expect(composta[0]?.detail).toBe('documentacao')
  })

  it('acrescenta as anomalias do próprio eixo, por último', () => {
    const carga = payloadFixture({
      process: processFixture({ state: { phase: 'concluido' } }),
      discoveryState: undeclaredDiscoveryFixture(),
    })
    const composta = composeAnomalies(carga)

    expect(composta).toHaveLength(7)
    expect(composta.every((a) => a.code === 'checkpoint-sem-conclusao-declarada')).toBe(true)
  })

  it('não desconta nada quando o eixo nada absorveu', () => {
    const carga = payloadFixture({
      process: processFixture({ state: { phase: 'documentacao' } }),
      discoveryState: discoveryStateFixture(),
    })

    expect(composeAnomalies(carga)).toEqual(somaAnterior(carga))
  })
})
