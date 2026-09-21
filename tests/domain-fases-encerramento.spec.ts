/**
 * The extraction that closed without declaring it (feature 015, RF-20), and
 * the promise that a project with no cycle and no approved stage reads exactly
 * as it read before (RF-04).
 * @module tests/domain-fases-encerramento
 */

import { describe, expect, it } from 'vitest'
import { amostra, detalhes, estado, lerFases, mapaComEtapas } from './helpers/fases-leitura.ts'

const CINCO = ['reconhecimento', 'escavacao', 'interpretacao', 'geracao', 'revisao']
const CINCO_C2 = CINCO.map((fase) => `${fase}-c2`)

describe('o encerramento sem declaração', () => {
  it('reconhece a forma medida em onze projetos, e desconta a fase-atual-ja-concluida', () => {
    const { eixo, herdadas, exibidas } = lerFases(amostra('encerrada-sem-declaracao'))

    expect(eixo.extracao).toEqual({ situacao: 'encerrada-sem-declaracao', bruto: 'revisao' })
    expect(detalhes(herdadas, 'fase-atual-ja-concluida')).toEqual(['revisao'])
    expect(detalhes(exibidas, 'fase-atual-ja-concluida')).toEqual([])
  })

  it('exige pending vazio: com trabalho pendente, a anomalia continua', () => {
    const { eixo, exibidas } = lerFases(amostra('fase-concluida-com-pendencia'))

    expect(eixo.extracao.situacao).toBe('em-curso')
    expect(detalhes(exibidas, 'fase-atual-ja-concluida')).toEqual(['interpretacao'])
  })

  it('exige o phase em completed', () => {
    const { eixo } = lerFases(estado('revisao', CINCO.slice(0, 4)))

    expect(eixo.extracao.situacao).toBe('em-curso')
  })

  it('exige as cinco fases concluídas: phase repetido em extração curta não basta', () => {
    const { eixo, exibidas } = lerFases(estado('escavacao', ['reconhecimento', 'escavacao']))

    expect(eixo.extracao.situacao).toBe('em-curso')
    expect(detalhes(exibidas, 'fase-atual-ja-concluida')).toEqual(['escavacao'])
  })

  it('exige phase reconhecido: nome desconhecido em completed não encerra', () => {
    const { eixo } = lerFases(amostra('encerrada-sem-declaracao-em-etapa'))

    expect(eixo.extracao.situacao).toBe('em-curso')
  })

  it('alcança a etapa aprovada em phase, depois da aprovação', () => {
    const { eixo, exibidas } = lerFases(amostra('encerrada-sem-declaracao-em-etapa'), mapaComEtapas('documentacao'))

    expect(eixo.extracao).toEqual({ situacao: 'encerrada-sem-declaracao', bruto: 'documentacao' })
    expect(detalhes(exibidas, 'fase-atual-ja-concluida')).toEqual([])
  })

  it('havendo ciclo, pede as cinco fases DO CICLO CORRENTE, e não as canônicas', () => {
    const fechado = lerFases(estado('revisao-c2', [...CINCO, ...CINCO_C2]))
    const aberto = lerFases(estado('reconhecimento-c2', [...CINCO, 'reconhecimento-c2']))

    expect(fechado.eixo.extracao.situacao).toBe('encerrada-sem-declaracao')
    expect(aberto.eixo.extracao.situacao).toBe('em-curso')
  })

  it('cede ao encerramento declarado, que tem precedência', () => {
    const { eixo } = lerFases(estado('concluido', [...CINCO, 'concluido']))

    expect(eixo.extracao.situacao).toBe('encerrada')
  })

  it('só desconta a fase-atual-ja-concluida sobre o phase', () => {
    const { eixo } = lerFases(amostra('encerrada-sem-declaracao'))

    expect(eixo.absorvidas).toEqual([
      { file: '.reversa/state.json', code: 'fase-atual-ja-concluida', detail: 'revisao' },
    ])
  })
})

describe('o projeto sem ciclo, com o mapa sem etapas, lê como antes', () => {
  const ANTIGAS = [
    'med-reversa',
    'terminal-e-nome-estranho',
    'checkpoint-parcial',
    'checkpoint-que-falhou',
    'checkpoint-campos-de-lista',
    'entradas-nao-agentes',
    'parcial-com-status',
    'vocabularios-de-conclusao',
  ]

  it.each(ANTIGAS)('%s: sem campo novo, sem anomalia nova e sem desconto novo', (nome) => {
    const { eixo } = lerFases(amostra(nome))

    expect('ciclo' in eixo).toBe(false)
    expect('etapas' in eixo).toBe(false)
    expect(detalhes(eixo.anomalias, 'encerramento-com-pendencia')).toEqual([])
    expect(eixo.absorvidas.every((a) => a.code === 'fase-desconhecida' && a.detail === eixo.extracao.bruto)).toBe(true)
    expect(eixo.extracao.situacao).not.toBe('encerrada-sem-declaracao')
  })

  it('o mapa sem a lista de etapas e o mapa com a lista vazia dão a mesma leitura', () => {
    const json = amostra('ciclo-tres-com-etapas')

    expect(lerFases(json, { pares: [], naoAgentes: [] }).eixo).toEqual(lerFases(json, mapaComEtapas()).eixo)
  })
})
