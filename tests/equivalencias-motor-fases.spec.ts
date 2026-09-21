/**
 * As duas perguntas da passagem das fases ao motor local (feature 015, RF-13).
 *
 * Nenhum caso liga para lugar algum. O duplo responde POR TABELA, com a chave
 * sendo o conteúdo da mensagem, e é isso que permite conferir o contrato de
 * `interfaces/motor-local.md` sem o motor no ar.
 * @module tests/equivalencias-motor-fases
 */

import { describe, expect, it, vi } from 'vitest'
import {
  MODELO_PADRAO,
  SISTEMA_DA_COMPARACAO,
  SISTEMA_DA_NATUREZA,
  criarClassificadorDeFases,
} from '../scripts/equivalencias/motor.js'

type Pedido = { model: string; format: string; options: { temperature: number; seed: number }; messages: { content: string }[] }

/** Um transporte que responde por tabela; o que não está nela é corpo inválido. */
function transportePorTabela(tabela: Record<string, unknown>) {
  return vi.fn(async (pedido: Pedido) => {
    const resposta = tabela[pedido.messages[1]?.content ?? '']
    if (resposta instanceof Error) throw resposta
    return { message: { content: typeof resposta === 'string' ? resposta : JSON.stringify(resposta ?? 'nada') } }
  })
}

const natureza = (nome: string, vizinhos: string[] = []) => JSON.stringify({ nome_em_foco: nome, vizinhos })
const par = (a: string, b: string) => JSON.stringify({ a, b })

describe('a pergunta de natureza', () => {
  it('devolve etapa quando o motor responde sobre o nome perguntado', async () => {
    const transporte = transportePorTabela({
      [natureza('reconciliacao', ['escavacao'])]: { nome: 'reconciliacao', leitura: 'etapa', razao: 'fase canônica' },
    })

    expect(await criarClassificadorDeFases({ transporte }).natureza('reconciliacao', ['escavacao'])).toEqual({
      nome: 'reconciliacao',
      leitura: 'etapa',
      razao: 'fase canônica',
    })
  })

  it('devolve nao-e-fase, que é a outra leitura aceita', async () => {
    const transporte = transportePorTabela({ [natureza('iago')]: { nome: 'iago', leitura: 'nao-e-fase', razao: 'pessoa' } })

    expect((await criarClassificadorDeFases({ transporte }).natureza('iago'))?.leitura).toBe('nao-e-fase')
  })

  it('DESCARTA a resposta sobre outro nome, em vez de corrigi-la', async () => {
    const transporte = transportePorTabela({ [natureza('saneamento')]: { nome: 'escavacao', leitura: 'etapa', razao: 'x' } })

    expect(await criarClassificadorDeFases({ transporte }).natureza('saneamento')).toBeNull()
  })

  it('descarta a leitura fora do vocabulário, inclusive a da pergunta única reprovada', async () => {
    const transporte = transportePorTabela({
      [natureza('saneamento')]: { nome: 'saneamento', leitura: 'mesma-etapa', razao: 'x' },
    })

    expect(await criarClassificadorDeFases({ transporte }).natureza('saneamento')).toBeNull()
  })

  it('manda só o nome e os vizinhos, com o enunciado da rodada 3A', async () => {
    const transporte = transportePorTabela({})
    await criarClassificadorDeFases({ transporte }).natureza('saneamento', ['geracao'])
    const pedido = transporte.mock.calls[0]?.[0] as Pedido

    expect(pedido.messages[0]?.content).toBe(SISTEMA_DA_NATUREZA)
    expect(SISTEMA_DA_NATUREZA).toContain('Na dúvida, "etapa"')
    expect(Object.keys(JSON.parse(pedido.messages[1]?.content ?? '{}'))).toEqual(['nome_em_foco', 'vizinhos'])
  })
})

describe('a pergunta de comparação', () => {
  it('devolve mesma e diferentes, e a razão viaja junto', async () => {
    const transporte = transportePorTabela({
      [par('verificacao-de-regressao', 'verificacao-regressao')]: {
        a: 'verificacao-de-regressao',
        b: 'verificacao-regressao',
        leitura: 'mesma',
        razao: 'só muda a preposição',
      },
      [par('re-extracao', 'regressao')]: { a: 're-extracao', b: 'regressao', leitura: 'diferentes', razao: 'trabalhos distintos' },
    })
    const motor = criarClassificadorDeFases({ transporte })

    expect(await motor.comparar('verificacao-de-regressao', 'verificacao-regressao')).toMatchObject({
      leitura: 'mesma',
      razao: 'só muda a preposição',
    })
    expect((await motor.comparar('re-extracao', 'regressao'))?.leitura).toBe('diferentes')
  })

  it('DESCARTA a resposta sobre outro par, inclusive o par invertido', async () => {
    const transporte = transportePorTabela({
      [par('a-x', 'b-x')]: { a: 'b-x', b: 'a-x', leitura: 'mesma', razao: 'x' },
      [par('c-x', 'd-x')]: { a: 'c-x', b: 'outro', leitura: 'mesma', razao: 'x' },
    })
    const motor = criarClassificadorDeFases({ transporte })

    expect(await motor.comparar('a-x', 'b-x')).toBeNull()
    expect(await motor.comparar('c-x', 'd-x')).toBeNull()
  })

  it('usa o enunciado da rodada 3B', async () => {
    const transporte = transportePorTabela({})
    await criarClassificadorDeFases({ transporte }).comparar('a', 'b')

    expect((transporte.mock.calls[0]?.[0] as Pedido).messages[0]?.content).toBe(SISTEMA_DA_COMPARACAO)
  })
})

describe('o pedido e os desfechos de erro, os mesmos da 012', () => {
  it('pede o mesmo modelo, temperatura zero, semente fixa e resposta em JSON', async () => {
    const transporte = transportePorTabela({})
    const motor = criarClassificadorDeFases({ transporte })
    await motor.natureza('x')
    await motor.comparar('a', 'b')

    for (const [pedido] of transporte.mock.calls as [Pedido][]) {
      expect(pedido.model).toBe(MODELO_PADRAO)
      expect(pedido.options.temperature).toBe(0)
      expect(typeof pedido.options.seed).toBe('number')
      expect(pedido.format).toBe('json')
    }
  })

  it('corpo que não é JSON vira não classificado, e a rodada segue', async () => {
    const motor = criarClassificadorDeFases({ transporte: transportePorTabela({ [natureza('x')]: 'não sou json' }) })

    expect(await motor.natureza('x')).toBeNull()
  })

  it('estouro do tempo-limite vira não classificado, e não falha', async () => {
    const transporte = vi.fn(() => new Promise(() => {}))
    const motor = criarClassificadorDeFases({ transporte, tempoLimite: 5 })

    expect(await motor.natureza('x')).toBeNull()
    expect(await motor.comparar('a', 'b')).toBeNull()
  })

  it('conexão recusada na SEGUNDA pergunta de natureza PROPAGA, para que a rodada pare', async () => {
    const recusada = Object.assign(new Error('connect ECONNREFUSED 127.0.0.1:11434'), { code: 'ECONNREFUSED' })
    const transporte = transportePorTabela({
      [natureza('primeiro')]: { nome: 'primeiro', leitura: 'etapa', razao: 'x' },
      [natureza('segundo')]: recusada,
    })
    const motor = criarClassificadorDeFases({ transporte })

    expect(await motor.natureza('primeiro')).not.toBeNull()
    await expect(motor.natureza('segundo')).rejects.toThrow('ECONNREFUSED')
  })
})
