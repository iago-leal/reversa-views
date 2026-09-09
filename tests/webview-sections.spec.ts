/**
 * The order of the sections, which cards are collapsible, and what starts
 * collapsed once a declared preference is told from the absence of one
 * (RF-01, RF-18, RN-02, RN-03, RN-11, D-03, D-04).
 *
 * O caso que antes afirmava o defeito saiu daqui de propósito. Ele fixava a
 * regra antiga, em que a lista vazia devolvia o padrão e o estado de tudo
 * aberto era irrepresentável; a regra mudou por decisão registrada no
 * `requirements.md`, e afrouxar não é o que aconteceu: o que era um caso virou
 * dois, um para a ausência de escolha e outro para a escolha de nada recolher.
 * @module tests/webview-sections
 */

import { describe, expect, it } from 'vitest'
import { COLLAPSIBLE_SECTIONS, SECTION_NAMES } from '../src/webview/domain/types.ts'
import { readingIntegrity } from '../src/webview/domain/integrity.ts'
import { collapsibleSections, effectiveCollapsed, sectionOrder } from '../src/webview/domain/sections.ts'
import { withAll, withCollapsed } from '../src/webview/domain/preferences.ts'
import { payloadFixture, probeFixture, processFixture } from './helpers/reversa-fixtures.ts'

const INTEGRA = readingIntegrity(payloadFixture())

/** Sem escolha declarada, que é o estado de quem nunca mexeu num cartão. */
const SEM_ESCOLHA = { declared: false, collapsedSections: [] }

/** A payload whose reading degraded through exactly one of the three signals. */
function degradado(signal: 'anomalies' | 'refusals' | 'truncated') {
  if (signal === 'anomalies') {
    return payloadFixture({ process: processFixture({ configJson: '{isso não é json' }) })
  }
  if (signal === 'refusals') {
    return payloadFixture({
      probe: probeFixture({ refusals: [{ path: '../fora', reason: 'fora-da-raiz' }] }),
    })
  }
  return payloadFixture({ probe: probeFixture({ truncated: ['/w/grande.md'] }) })
}

describe('ordem das seções', () => {
  it('devolve os oito nomes na ordem de RF-18', () => {
    expect(sectionOrder()).toEqual([
      'blocking',
      'forward',
      'decomposition',
      'history',
      'discovery',
      'policy',
      'anomalies',
      'probe',
    ])
  })

  it('não depende do processo recebido', () => {
    expect(sectionOrder()).toEqual([...SECTION_NAMES])
  })
})

describe('os sete cartões recolhíveis (RN-03)', () => {
  it('são todas as seções menos a faixa de bloqueio', () => {
    expect(collapsibleSections()).toEqual([
      'forward',
      'decomposition',
      'history',
      'discovery',
      'policy',
      'anomalies',
      'probe',
    ])
  })

  it('são sete, e a faixa de bloqueio não é um deles', () => {
    expect(collapsibleSections()).toHaveLength(7)
    expect(collapsibleSections()).not.toContain('blocking')
    expect(collapsibleSections()).toEqual([...COLLAPSIBLE_SECTIONS])
  })

  it('mantêm a ordem em que a tela os desenha', () => {
    const ordem = sectionOrder().filter((nome) => nome !== 'blocking')
    expect(collapsibleSections()).toEqual(ordem)
  })
})

describe('leitura íntegra ou degradada', () => {
  it('declara íntegra quando não há anomalia, recusa nem truncamento', () => {
    expect(INTEGRA.degraded).toBe(false)
    expect(INTEGRA.anomalies).toBe(0)
  })

  it('declara degradada por qualquer um dos três sinais, isolado', () => {
    expect(readingIntegrity(degradado('anomalies')).degraded).toBe(true)
    expect(readingIntegrity(degradado('refusals')).degraded).toBe(true)
    expect(readingIntegrity(degradado('truncated')).degraded).toBe(true)
  })

  it('conta cada sinal separadamente', () => {
    const integridade = readingIntegrity(degradado('truncated'))
    expect(integridade.truncated).toBe(1)
    expect(integridade.refusals).toBe(0)
  })
})

describe('conjunto efetivo de recolhidas, sem escolha declarada (RN-02, RN-11)', () => {
  it('recolhe o histórico e as três de diagnóstico, em leitura íntegra', () => {
    const recolhidas = effectiveCollapsed(SEM_ESCOLHA, INTEGRA)
    expect(new Set(recolhidas)).toEqual(new Set(['history', 'policy', 'anomalies', 'probe']))
  })

  it('deixa a decomposição expandida, por ser núcleo da retomada', () => {
    expect(effectiveCollapsed(SEM_ESCOLHA, INTEGRA)).not.toContain('decomposition')
  })

  it('deixa as anomalias expandidas em leitura degradada', () => {
    for (const sinal of ['anomalies', 'refusals', 'truncated'] as const) {
      const recolhidas = effectiveCollapsed(SEM_ESCOLHA, readingIntegrity(degradado(sinal)))
      expect(new Set(recolhidas)).toEqual(new Set(['history', 'policy', 'probe']))
    }
  })
})

describe('conjunto efetivo com escolha declarada (RF-01, D-03)', () => {
  it('a escolha vence o padrão, em leitura íntegra', () => {
    const recolhidas = effectiveCollapsed({ declared: true, collapsedSections: ['forward'] }, INTEGRA)
    expect(recolhidas).toEqual(['forward'])
  })

  it('a escolha vence o padrão, em leitura degradada', () => {
    const recolhidas = effectiveCollapsed(
      { declared: true, collapsedSections: ['anomalies'] },
      readingIntegrity(degradado('anomalies')),
    )
    expect(recolhidas).toEqual(['anomalies'])
  })

  it('respeita a escolha que recolhe uma seção de núcleo', () => {
    const recolhidas = effectiveCollapsed(
      { declared: true, collapsedSections: ['decomposition'] },
      INTEGRA,
    )
    expect(recolhidas).toContain('decomposition')
  })

  it('a escolha de nada recolhido mantém tudo aberto, que é o estado antes irrepresentável', () => {
    expect(effectiveCollapsed({ declared: true, collapsedSections: [] }, INTEGRA)).toEqual([])
  })

  it('a escolha de nada recolhido também vence em leitura degradada', () => {
    const recolhidas = effectiveCollapsed(
      { declared: true, collapsedSections: [] },
      readingIntegrity(degradado('anomalies')),
    )
    expect(recolhidas).toEqual([])
  })
})

describe('o defeito que a feature corrige, medido de ponta a ponta (RF-01)', () => {
  it('expandir a última recolhida não fecha as outras no desenho seguinte', () => {
    // A sequência é a do relato: as três de diagnóstico recolhidas, e o
    // usuário abre uma a uma. Antes, ao abrir a terceira, a lista esvaziava, o
    // padrão voltava e as outras duas fechavam junto.
    let preferência = readPreferênciaInicial()
    const recolhidas = [...preferência.collapsedSections]
    expect(recolhidas.length).toBeGreaterThan(1)

    for (const nome of recolhidas) {
      preferência = withCollapsed(preferência, nome, false)
      const restantes = effectiveCollapsed(preferência, INTEGRA)
      expect(restantes, `abrir ${nome} fechou outro cartão`).not.toContain(nome)
    }
    expect(effectiveCollapsed(preferência, INTEGRA)).toEqual([])
  })

  it('recolher tudo e expandir tudo são estáveis entre desenhos', () => {
    expect(effectiveCollapsed(withAll(true), INTEGRA)).toEqual([...COLLAPSIBLE_SECTIONS])
    expect(effectiveCollapsed(withAll(false), INTEGRA)).toEqual([])
  })
})

/** O que a casca segura ao abrir o painel sem estado guardado. */
function readPreferênciaInicial() {
  return {
    declared: true,
    collapsedSections: [...effectiveCollapsed(SEM_ESCOLHA, INTEGRA)],
  }
}
