/**
 * The display preference, which is the only thing the panel stores, read by a
 * total function that never throws (RF-05, RN-09, EC-09, D-01, D-02).
 *
 * A preference written by an older version of the panel outlives the code that
 * wrote it, so the six rows of the reading table in `data-delta.md` are cases
 * here one by one. The row that matters most is the fourth: a declared choice
 * of nothing collapsed, which is the state of everything open, and which the
 * shape before feature 006 could not represent at all.
 * @module tests/webview-preferences
 */

import { describe, expect, it } from 'vitest'
import { readPreferences, withAll, withCollapsed } from '../src/webview/domain/preferences.ts'
import { COLLAPSIBLE_SECTIONS } from '../src/webview/domain/types.ts'

describe('as seis formas do estado guardado (D-02)', () => {
  it('nada gravado, ou valor que não é objeto: sem escolha declarada', () => {
    for (const entrada of [undefined, null, 42, 'policy', []]) {
      expect(readPreferences(entrada)).toEqual({ declared: false, collapsedSections: [] })
    }
  })

  it('lista não vazia sem o campo novo: escolha declarada, preservada', () => {
    const lido = readPreferences({ collapsedSections: ['policy', 'probe'] })
    expect(lido).toEqual({ declared: true, collapsedSections: ['policy', 'probe'] })
  })

  it('lista vazia sem o campo novo: sem escolha declarada', () => {
    expect(readPreferences({ collapsedSections: [] })).toEqual({
      declared: false,
      collapsedSections: [],
    })
  })

  it('escolha declarada de nada recolhido: o estado de tudo aberto', () => {
    const lido = readPreferences({ declared: true, collapsedSections: [] })
    expect(lido).toEqual({ declared: true, collapsedSections: [] })
  })

  it('campo declarado com tipo errado: tratado como ausente, sem aviso', () => {
    expect(readPreferences({ declared: 'sim', collapsedSections: [] })).toEqual({
      declared: false,
      collapsedSections: [],
    })
    expect(readPreferences({ declared: 1, collapsedSections: ['policy'] })).toEqual({
      declared: true,
      collapsedSections: ['policy'],
    })
  })

  it('nome de seção que esta versão não conhece: descartado em silêncio', () => {
    const lido = readPreferences({ collapsedSections: ['policy', 'checkpoints', 'probe'] })
    expect(lido.collapsedSections).toEqual(['policy', 'probe'])
  })
})

describe('leitura total, em toda forma ilegível', () => {
  it('não lança para entrada alguma', () => {
    const ilegíveis: unknown[] = [
      undefined,
      null,
      0,
      '',
      [],
      { collapsedSections: 'policy' },
      { outroCampo: ['policy'] },
      { collapsedSections: [1, 2] },
      { declared: null, collapsedSections: null },
    ]
    for (const entrada of ilegíveis) {
      expect(() => readPreferences(entrada)).not.toThrow()
    }
  })

  it('devolve sempre a forma declarada, e não o objeto recebido', () => {
    const recebido = { declared: true, collapsedSections: ['policy'], lixo: 1 }
    const lido = readPreferences(recebido)

    expect(lido).not.toBe(recebido)
    expect(Object.keys(lido).sort()).toEqual(['collapsedSections', 'declared'])
  })

  it('a lista só de nomes desconhecidos ainda conta como escolha declarada', () => {
    // Quem gravou escolheu; o que se perdeu foi o nome de uma seção que esta
    // versão não tem mais, e EC-09 manda descartá-lo sem transformar a escolha
    // do usuário em ausência de escolha.
    const lido = readPreferences({ collapsedSections: ['checkpoints'] })
    expect(lido).toEqual({ declared: true, collapsedSections: [] })
  })
})

describe('escrita da preferência', () => {
  it('declara a escolha ao recolher uma seção', () => {
    const depois = withCollapsed({ declared: false, collapsedSections: [] }, 'probe', true)
    expect(depois).toEqual({ declared: true, collapsedSections: ['probe'] })
  })

  it('declara a escolha também ao expandir a última recolhida', () => {
    // É este o caso do defeito: a lista fica vazia, e sem a marca de escolha o
    // padrão voltava e fechava as outras duas na mesma ação (D-01).
    const depois = withCollapsed({ declared: true, collapsedSections: ['probe'] }, 'probe', false)
    expect(depois).toEqual({ declared: true, collapsedSections: [] })
  })

  it('substitui a lista inteira, sem mesclar com o que estava lá', () => {
    const antes = { declared: true, collapsedSections: ['policy' as const] }
    const depois = withCollapsed(antes, 'probe', true)

    expect(depois.collapsedSections).toEqual(['policy', 'probe'])
    expect(antes.collapsedSections).toEqual(['policy'])
  })

  it('não duplica nome já presente', () => {
    const depois = withCollapsed({ declared: true, collapsedSections: ['policy'] }, 'policy', true)
    expect(depois.collapsedSections).toEqual(['policy'])
  })
})

describe('as duas ações globais (RF-02, RF-03)', () => {
  it('recolher tudo recolhe os sete cartões, e só eles', () => {
    const depois = withAll(true)
    expect(depois.declared).toBe(true)
    expect(depois.collapsedSections).toEqual([...COLLAPSIBLE_SECTIONS])
    expect(depois.collapsedSections).not.toContain('blocking')
  })

  it('expandir tudo deixa a lista vazia, e ainda assim declarada', () => {
    expect(withAll(false)).toEqual({ declared: true, collapsedSections: [] })
  })

  it('as duas são reversíveis uma pela outra', () => {
    expect(withAll(false).collapsedSections).toEqual([])
    expect(withAll(true).collapsedSections.length).toBe(COLLAPSIBLE_SECTIONS.length)
  })
})

/**
 * O nome de seção que a feature 008 acrescenta.
 *
 * O acréscimo é compatível nos dois sentidos, e é isso que os casos fixam.
 * Preferência gravada por versão anterior continua válida, porque nada foi
 * renomeado nem removido; e `bugs` passa a ser nome ACEITO, quando antes seria
 * descartado por desconhecido. A segunda metade é a que teria passado
 * despercebida: o descarte de EC-09 é silencioso por desenho, de modo que um
 * nome novo esquecido em `SECTION_NAMES` sumiria da preferência sem aviso.
 */
describe('o nome de seção da feature 008', () => {
  it('`bugs` é nome aceito, e sobrevive à leitura', () => {
    const lido = readPreferences({ declared: true, collapsedSections: ['bugs', 'probe'] })
    expect(lido.collapsedSections).toEqual(['bugs', 'probe'])
  })

  it('preferência gravada por versão anterior continua inteiramente válida', () => {
    const anterior = { declared: true, collapsedSections: ['history', 'policy', 'anomalies', 'probe'] }
    const lido = readPreferences(anterior)

    expect(lido.collapsedSections).toEqual(anterior.collapsedSections)
    expect(lido.declared).toBe(true)
  })

  it('recolher e expandir o cartão novo funciona como o de qualquer outro', () => {
    const recolhido = withCollapsed({ declared: false, collapsedSections: [] }, 'bugs', true)
    expect(recolhido).toEqual({ declared: true, collapsedSections: ['bugs'] })
    expect(withCollapsed(recolhido, 'bugs', false).collapsedSections).toEqual([])
  })

  it('as duas ações globais alcançam o cartão novo', () => {
    expect(withAll(true).collapsedSections).toContain('bugs')
    expect(withAll(false).collapsedSections).toEqual([])
  })

  it('nome de seção que esta versão não tem continua descartado', () => {
    const lido = readPreferences({ declared: true, collapsedSections: ['bugs', 'secao-extinta'] })
    expect(lido.collapsedSections).toEqual(['bugs'])
  })
})
