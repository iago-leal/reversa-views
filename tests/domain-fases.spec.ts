/**
 * The phase-name classifier of feature 015: five steps of precedence, walked
 * over the single table of cases the parity suite also walks.
 * @module tests/domain-fases
 */

import { describe, expect, it } from 'vitest'
import { classificarNome, FASES_CANONICAS } from '../src/domain/fases.ts'
import type { MapaDeEquivalencias } from '../src/domain/types.ts'
import { CASOS_DE_FASE, ETAPAS_APROVADAS } from './helpers/fases-casos.ts'

/** A map with the given stages approved and nothing else. */
function mapaCom(etapas: string[]): MapaDeEquivalencias {
  return {
    pares: [],
    naoAgentes: [],
    etapas: etapas.map((nome) => ({ nome, aprovadoEm: '2026-09-21', evidencia: ['amostra'] })),
  }
}

const MAPA = mapaCom(ETAPAS_APROVADAS)

describe('a precedência dos cinco degraus', () => {
  it.each(CASOS_DE_FASE)('lê "$bruto" como $esperado.tipo: $porque', ({ bruto, esperado }) => {
    expect(classificarNome(bruto, MAPA)).toEqual({ ...esperado, bruto })
  })

  it('guarda o nome bruto em todo julgamento, sem aparar nem normalizar', () => {
    expect(classificarNome(' Documentacao ', MAPA).bruto).toBe(' Documentacao ')
  })

  it('lê concluido-c3 como encerramento, e não como fase de ciclo', () => {
    expect(classificarNome('concluido-c3', MAPA).tipo).toBe('encerramento')
  })

  it('reconhece os dez nomes de ciclo medidos no afla, cada um com a fase e o número', () => {
    for (const ciclo of [2, 3]) {
      for (const fase of FASES_CANONICAS) {
        expect(classificarNome(`${fase}-c${ciclo}`, mapaCom([]))).toEqual({
          tipo: 'ciclo',
          bruto: `${fase}-c${ciclo}`,
          canonica: fase,
          ciclo,
        })
      }
    }
  })
})

describe('a etapa depende da aprovação, e só dela', () => {
  it('sem etapa aprovada, o nome e a variante com sufixo são desconhecidos', () => {
    for (const nome of ['verificacao-regressao', 'verificacao-regressao-c3', 're-extracao-005']) {
      expect(classificarNome(nome, mapaCom([])).tipo, nome).toBe('desconhecida')
    }
  })

  it('aceita o mapa montado à mão com dois campos, sem a lista de etapas', () => {
    const semEtapas: MapaDeEquivalencias = { pares: [], naoAgentes: [] }

    expect(classificarNome('reconciliacao', semEtapas).tipo).toBe('desconhecida')
    expect(classificarNome('geracao-c2', semEtapas).tipo).toBe('ciclo')
  })

  it('vence a base mais longa quando uma etapa aprovada é prefixo da outra', () => {
    const julgado = classificarNome('verificacao-regressao-c3', mapaCom(['verificacao', 'verificacao-regressao']))

    expect(julgado).toMatchObject({ tipo: 'etapa', base: 'verificacao-regressao', sufixo: 3 })
  })

  it('dá o mesmo resultado qualquer que seja a ordem das etapas no mapa', () => {
    const julgado = classificarNome('verificacao-regressao-c3', mapaCom(['verificacao-regressao', 'verificacao']))

    expect(julgado).toMatchObject({ base: 'verificacao-regressao' })
  })

  it('não deixa a etapa aprovada tomar o lugar de uma fase de ciclo', () => {
    // A approved stage named like a canonical prefix must not steal the cycle.
    expect(classificarNome('geracao-c2', mapaCom(['geracao-c'])).tipo).toBe('ciclo')
  })
})
