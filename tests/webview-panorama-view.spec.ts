/**
 * A função pura do panorama: ordem, agrupamento e a contagem conferida
 * (RF-12, RN-07, D-15).
 *
 * Uma função decide as três coisas, e é o remédio de D-14 da feature 007
 * aplicado antes de o defeito nascer: selecionar num lugar e exibir noutro é o
 * que faz a lista certa aparecer na ordem errada. O componente só chama.
 *
 * A ordem é por grupo de situação, e a feature ativa encabeça o cartão: é o que
 * faz o Retomador achar o próximo componente sem rolar (RF-12).
 * @module tests/webview-panorama-view
 */

import { describe, expect, it } from 'vitest'
import { panoramaView } from '../src/webview/domain/panorama-view.ts'
import { componentFixture, panoramaFixture } from './helpers/reversa-fixtures.ts'

const MISTO = panoramaFixture([
  componentFixture({ nome: 'zeta', situacao: 'convergida' }),
  componentFixture({ nome: 'beta', situacao: 'planejada', pastas: [], adendo: null, acoes: null }),
  componentFixture({ nome: 'alfa', situacao: 'entregue', adendo: null }),
  componentFixture({ nome: 'delta', situacao: 'em-andamento', marca: 'pausada', adendo: null }),
  componentFixture({ nome: 'gama', situacao: 'convergida' }),
  componentFixture({ nome: 'epsilon', situacao: 'em-andamento', marca: 'ativa', adendo: null }),
  componentFixture({ nome: 'capa', situacao: 'em-andamento', adendo: null }),
])

describe('a ordem dos grupos (RF-12)', () => {
  it('em andamento, depois planejada, depois entregue, depois convergida', () => {
    const vista = panoramaView(MISTO)
    expect(vista.grupos.map((grupo) => grupo.situacao)).toEqual([
      'em-andamento',
      'planejada',
      'entregue',
      'convergida',
    ])
  })

  it('só os grupos com componente aparecem', () => {
    const vista = panoramaView(panoramaFixture())
    expect(vista.grupos.map((grupo) => grupo.situacao)).toEqual(['convergida'])
  })

  it('a ativa encabeça o grupo em andamento, e o resto vai por nome', () => {
    const vista = panoramaView(MISTO)
    expect(vista.grupos[0]?.componentes.map((c) => c.nome)).toEqual(['epsilon', 'capa', 'delta'])
  })

  it('dentro dos demais grupos a ordem é por nome', () => {
    const vista = panoramaView(MISTO)
    expect(vista.grupos[3]?.componentes.map((c) => c.nome)).toEqual(['gama', 'zeta'])
  })

  it('duas passagens sobre a mesma carga dão a mesma saída, e a carga não é mutada', () => {
    const antes = JSON.stringify(MISTO)
    expect(panoramaView(MISTO)).toEqual(panoramaView(MISTO))
    expect(JSON.stringify(MISTO)).toBe(antes)
  })
})

describe('a contagem conferida contra a lista (RN-07, D-15)', () => {
  it('carrega a contagem da leitura e o total de specs como autoridade', () => {
    const vista = panoramaView(panoramaFixture())
    expect(vista.convergidos).toBe(5)
    expect(vista.total).toBe(5)
    expect(vista.divergencia).toBeNull()
  })

  it('declara a divergência quando a contagem e a lista discordam, sem escolher', () => {
    const vista = panoramaView(panoramaFixture(undefined, { convergidos: 3 }))
    expect(vista.convergidos).toBe(3)
    expect(vista.divergencia).toEqual({ contados: 3, listados: 5 })
  })

  it('o total é o de disco, e não o da lista, quando a leitura parou no teto', () => {
    const vista = panoramaView(panoramaFixture(undefined, { totalDeSpecs: 60, truncado: true }))
    expect(vista.total).toBe(60)
    expect(vista.truncado).toBe(true)
    expect(vista.divergencia).toBeNull()
  })

  it('um panorama vazio dá zero grupos, zero de zero, sem lançar', () => {
    const vista = panoramaView(panoramaFixture([]))
    expect(vista.grupos).toEqual([])
    expect(vista.total).toBe(0)
    expect(vista.convergidos).toBe(0)
  })
})
