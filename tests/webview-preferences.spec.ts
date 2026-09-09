/**
 * The display preference, which is the only thing the panel stores, read by a
 * total function that never throws (RF-12, RN-09, EC-09, D-07).
 * @module tests/webview-preferences
 */

import { describe, expect, it } from 'vitest'
import { readPreferences, withCollapsed } from '../src/webview/domain/preferences.ts'

describe('leitura da preferência guardada', () => {
  it('devolve preferência vazia diante das cinco formas ilegíveis', () => {
    const ilegiveis: unknown[] = [
      undefined,
      null,
      42,
      { collapsedSections: 'policy' },
      { outroCampo: ['policy'] },
    ]

    for (const entrada of ilegiveis) {
      expect(readPreferences(entrada)).toEqual({ collapsedSections: [] })
    }
  })

  it('não lança em nenhuma das formas ilegíveis', () => {
    for (const entrada of [undefined, null, 0, '', [], { collapsedSections: [1, 2] }]) {
      expect(() => readPreferences(entrada)).not.toThrow()
    }
  })

  it('lê os nomes de seção que reconhece', () => {
    const lido = readPreferences({ collapsedSections: ['policy', 'probe'] })
    expect(lido.collapsedSections).toEqual(['policy', 'probe'])
  })

  it('descarta em silêncio o nome de seção que não existe mais', () => {
    const lido = readPreferences({ collapsedSections: ['policy', 'checkpoints', 'probe'] })
    expect(lido.collapsedSections).toEqual(['policy', 'probe'])
  })

  it('devolve sempre a forma declarada, e não o objeto recebido', () => {
    const recebido = { collapsedSections: ['policy'], lixo: 1 }
    const lido = readPreferences(recebido)

    expect(lido).not.toBe(recebido)
    expect(Object.keys(lido)).toEqual(['collapsedSections'])
  })
})

describe('escrita da preferência', () => {
  it('substitui a lista inteira, sem mesclar com o que estava lá', () => {
    const antes = { collapsedSections: ['policy' as const] }
    const depois = withCollapsed(antes, 'probe', true)

    expect(depois.collapsedSections).toEqual(['policy', 'probe'])
    expect(antes.collapsedSections).toEqual(['policy'])
  })

  it('remove o nome ao expandir', () => {
    const depois = withCollapsed({ collapsedSections: ['policy', 'probe'] }, 'policy', false)
    expect(depois.collapsedSections).toEqual(['probe'])
  })

  it('não duplica nome já presente', () => {
    const depois = withCollapsed({ collapsedSections: ['policy'] }, 'policy', true)
    expect(depois.collapsedSections).toEqual(['policy'])
  })
})
