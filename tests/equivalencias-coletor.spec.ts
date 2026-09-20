/**
 * O coletor dos pares inéditos (T015, RF-09, RF-13).
 *
 * Ele é quem decide o que vale perguntar ao motor, e a decisão tem custo: cada
 * par inédito custa cerca de três segundos. Perguntar de novo o que já foi
 * decidido seria pagar duas vezes pela mesma resposta, e é o que o RF-13
 * proíbe.
 *
 * Nada aqui toca disco: o coletor recebe os estados já lidos, na forma em que
 * a casca do comando os entrega, e devolve o que precisa de decisão.
 * @module tests/equivalencias-coletor
 */

import { describe, expect, it } from 'vitest'
import { coletar } from '../scripts/equivalencias/coletar.js'

/** Um projeto lido, na forma que o coletor espera. */
function projeto(nome: string, checkpoints: Record<string, unknown>) {
  return { projeto: nome, stateJson: JSON.stringify({ version: '1.3.3', checkpoints }) }
}

const MAPA_VAZIO = { pares: [], naoAgentes: [] }

describe('o coletor', () => {
  it('isola o par campo mais valor de quem não traz o campo canônico', () => {
    const { pares } = coletar({
      estados: [projeto('med-reversa', { scout: { at: '2026-09-12T09:02:59', status: 'concluido' } })],
      mapa: MAPA_VAZIO,
    })

    expect(pares).toContainEqual(expect.objectContaining({ campo: 'status', valor: 'concluido' }))
  })

  it('ignora o checkpoint que traz `completed_at`, porque o esquema já o resolve', () => {
    const { pares } = coletar({
      estados: [projeto('saudavel', { scout: { completed_at: '2026-09-01T10:00:00Z', files: ['a.md'] } })],
      mapa: MAPA_VAZIO,
    })

    expect(pares).toEqual([])
  })

  it('ignora o checkpoint com `modules_pending` povoado, que é trabalho parcial declarado', () => {
    const { pares } = coletar({
      estados: [projeto('meio', { arq: { modules_pending: ['x'], status: 'concluido' } })],
      mapa: MAPA_VAZIO,
    })

    expect(pares).toEqual([])
  })

  it('junta a evidência de todos os projetos onde o mesmo par apareceu', () => {
    const { pares } = coletar({
      estados: [
        projeto('med-reversa', { scout: { status: 'concluido' } }),
        projeto('afla', { detective_c3: { status: 'concluido' } }),
      ],
      mapa: MAPA_VAZIO,
    })

    expect(pares).toHaveLength(1)
    expect(pares[0].evidencia).toEqual(['afla', 'med-reversa'])
  })

  it('pula o par que o mapa já decidiu, que é o RF-13 em uma linha', () => {
    const { pares } = coletar({
      estados: [projeto('med-reversa', { scout: { status: 'concluido' } })],
      mapa: { pares: [{ campo: 'status', valor: 'concluido', leitura: 'concluido', aprovadoEm: '2026-09-20', evidencia: [] }], naoAgentes: [] },
    })

    expect(pares).toEqual([])
  })

  it('normaliza o valor em caixa e espaços das bordas, e não em acentuação', () => {
    const { pares } = coletar({
      estados: [projeto('x', { a: { status: '  Concluido ' } }), projeto('y', { b: { status: 'concluído' } })],
      mapa: MAPA_VAZIO,
    })

    const valores = pares.map((p) => p.valor).sort()
    expect(valores).toEqual(['concluido', 'concluído'])
  })

  it('trata booleano como a cadeia correspondente, porque declaram a mesma coisa', () => {
    const { pares } = coletar({ estados: [projeto('capacities', { scout: { done: true } })], mapa: MAPA_VAZIO })

    expect(pares).toContainEqual(expect.objectContaining({ campo: 'done', valor: 'true' }))
  })

  it('recolhe à parte a chave que não traz campo de estado algum', () => {
    const { chaves } = coletar({
      estados: [projeto('med-reversa', { plano_aprovado: { at: '2026-09-12T08:57:19', escopo: 'tres fontes' } })],
      mapa: MAPA_VAZIO,
    })

    expect(chaves).toContainEqual(expect.objectContaining({ chave: 'plano_aprovado' }))
  })

  it('pula a chave que o mapa já decidiu', () => {
    const { chaves } = coletar({
      estados: [projeto('med-reversa', { plano_aprovado: { at: 'x' } })],
      mapa: { pares: [], naoAgentes: [{ chave: 'plano_aprovado', aprovadoEm: '2026-09-20', evidencia: [] }] },
    })

    expect(chaves).toEqual([])
  })

  it('devolve nada na segunda passada sobre o mesmo disco, com o mapa já promovido', () => {
    const estados = [projeto('med-reversa', { scout: { status: 'concluido' }, plano_aprovado: { at: 'x' } })]
    const primeira = coletar({ estados, mapa: MAPA_VAZIO })
    const mapa = {
      pares: primeira.pares.map((p) => ({ ...p, leitura: 'concluido' as const, aprovadoEm: '2026-09-20' })),
      naoAgentes: primeira.chaves.map((c) => ({ ...c, aprovadoEm: '2026-09-20' })),
    }

    const segunda = coletar({ estados, mapa })

    expect(segunda.pares).toEqual([])
    expect(segunda.chaves).toEqual([])
  })

  it('atravessa `state.json` ilegível sem estourar, porque um projeto quebrado não para a rodada', () => {
    const { pares } = coletar({
      estados: [{ projeto: 'quebrado', stateJson: '{ não é json' }, projeto('bom', { scout: { status: 'concluido' } })],
      mapa: MAPA_VAZIO,
    })

    expect(pares).toHaveLength(1)
  })
})
