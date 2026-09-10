/**
 * A sequência do desfecho forçado no preview (T040, D-17).
 *
 * O que se fixa é a FORMA da sequência, e não a tela: o processo vai na
 * frente, "consultando" vai junto dele, e o desfecho vai num bloco que o
 * cliente segura pelo atraso, porque entregue no mesmo ciclo ele apagaria o
 * estado em curso antes de alguém o ver. As funções são puras e não tocam
 * disco.
 * @module tests/preview-leitura
 */

import { describe, expect, it } from 'vitest'
import { UPDATE_STATES } from '../src/host/protocol.ts'
import {
  ATRASO_MINIMO_DO_DESFECHO_MS,
  desfechoForcado,
  sequenciaDoDesfecho,
} from '../scripts/preview/leitura.js'

describe('o desfecho forçado, na forma do protocolo', () => {
  it('cada um dos sete produz um desfecho com o próprio nome, e "nenhum" produz nulo', () => {
    for (const estado of UPDATE_STATES) {
      expect(desfechoForcado(estado)?.estado).toBe(estado)
    }
    expect(desfechoForcado('nenhum')).toBeNull()
  })

  it('os que carregam contagem carregam uma no plural, e o impossível nomeia causa distinta de rede', () => {
    expect(desfechoForcado('atrasada')).toMatchObject({ commits: expect.any(Number) })
    expect(desfechoForcado('divergente')).toMatchObject({ commits: expect.any(Number) })
    expect((desfechoForcado('atrasada') as { commits: number }).commits).toBeGreaterThan(1)
    expect(desfechoForcado('impossivel')).toEqual({ estado: 'impossivel', causa: 'limite-de-taxa' })
  })
})

describe('a sequência em duas partes', () => {
  it('sem desfecho pedido, nada é acrescentado', () => {
    expect(sequenciaDoDesfecho('nenhum', 0)).toEqual({ agora: [], depois: null })
  })

  it('o desfecho que responde vai depois, atrás de "consultando" que vai agora', () => {
    const { agora, depois } = sequenciaDoDesfecho('atrasada', 0)
    expect(agora).toEqual([{ command: 'setUpdate', data: { estado: 'consultando' } }])
    expect(depois?.mensagens).toEqual([{ command: 'setUpdate', data: { estado: 'atrasada', commits: 4 } }])
  })

  it('o bloco de depois espera ao menos o mínimo, e o atraso declarado quando é maior', () => {
    expect(sequenciaDoDesfecho('em-dia', 0).depois?.atraso).toBe(ATRASO_MINIMO_DO_DESFECHO_MS)
    expect(sequenciaDoDesfecho('em-dia', 3000).depois?.atraso).toBe(3000)
  })

  it('"consultando" e "desligada" vão agora, sem bloco de depois: nada chega após eles', () => {
    for (const estado of ['consultando', 'desligada']) {
      const { agora, depois } = sequenciaDoDesfecho(estado, 0)
      expect(agora).toEqual([{ command: 'setUpdate', data: { estado } }])
      expect(depois).toBeNull()
    }
  })

  it('os cinco que respondem passam todos por "consultando" antes', () => {
    for (const estado of ['em-dia', 'atrasada', 'divergente', 'commit-desconhecido', 'impossivel']) {
      const { agora, depois } = sequenciaDoDesfecho(estado, 0)
      expect(agora[0]?.data).toEqual({ estado: 'consultando' })
      expect(depois?.mensagens[0]?.data).toMatchObject({ estado })
    }
  })
})
