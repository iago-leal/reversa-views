/**
 * The order of the sections and what starts collapsed, including the exception
 * that a degraded reading opens the anomalies (RF-14, RF-22, RN-06, D-20).
 * @module tests/webview-sections
 */

import { describe, expect, it } from 'vitest'
import { SECTION_NAMES } from '../src/webview/domain/types.ts'
import { readingIntegrity } from '../src/webview/domain/integrity.ts'
import { initialCollapsed, sectionOrder } from '../src/webview/domain/sections.ts'
import { payloadFixture, probeFixture, processFixture } from './helpers/reversa-fixtures.ts'

const INTEGRA = readingIntegrity(payloadFixture())

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
  it('devolve os seis nomes na ordem de RF-14', () => {
    expect(sectionOrder()).toEqual([
      'blocking',
      'forward',
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

describe('recolhimento inicial', () => {
  it('recolhe as três de diagnóstico, e apenas elas, em leitura íntegra', () => {
    const recolhidas = initialCollapsed({ collapsedSections: [] }, INTEGRA)
    expect(new Set(recolhidas)).toEqual(new Set(['policy', 'anomalies', 'probe']))
  })

  it('deixa as anomalias expandidas em leitura degradada', () => {
    for (const sinal of ['anomalies', 'refusals', 'truncated'] as const) {
      const recolhidas = initialCollapsed(
        { collapsedSections: [] },
        readingIntegrity(degradado(sinal)),
      )
      expect(new Set(recolhidas)).toEqual(new Set(['policy', 'probe']))
    }
  })

  it('deixa a preferência guardada vencer o padrão, em leitura íntegra', () => {
    const recolhidas = initialCollapsed({ collapsedSections: ['forward'] }, INTEGRA)
    expect(recolhidas).toEqual(['forward'])
  })

  it('deixa a preferência guardada vencer o padrão, em leitura degradada', () => {
    const recolhidas = initialCollapsed(
      { collapsedSections: ['anomalies'] },
      readingIntegrity(degradado('anomalies')),
    )
    expect(recolhidas).toEqual(['anomalies'])
  })

  it('respeita a preferência que recolhe uma seção de núcleo', () => {
    const recolhidas = initialCollapsed({ collapsedSections: ['discovery'] }, INTEGRA)
    expect(recolhidas).toContain('discovery')
  })
})
