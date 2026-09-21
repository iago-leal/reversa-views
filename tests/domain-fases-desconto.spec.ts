/**
 * The discount of feature 015 and the anomaly it adds: every
 * `fase-desconhecida` over a recognised name leaves the screen, whichever list
 * it came from, and the closure declared over pending work gets a name.
 * @module tests/domain-fases-desconto
 */

import { describe, expect, it } from 'vitest'
import { amostra, detalhes, estado, lerFases, mapaComEtapas } from './helpers/fases-leitura.ts'

const QUATRO_ETAPAS = mapaComEtapas('reconciliacao', 'verificacao-regressao', 'saneamento', 'auditoria-cruzada')

describe('o desconto alcança o nome reconhecido, e só ele', () => {
  it('desconta a fase de ciclo em completed sem etapa alguma aprovada', () => {
    const { herdadas, exibidas } = lerFases(estado('geracao', ['reconhecimento', 'escavacao-c2']))

    expect(detalhes(herdadas, 'fase-desconhecida')).toEqual(['escavacao-c2'])
    expect(detalhes(exibidas, 'fase-desconhecida')).toEqual([])
  })

  it('não tira nada da lista herdada: reconhecer não é sanear', () => {
    const json = amostra('ciclo-tres-com-etapas')
    const { herdadas } = lerFases(json, QUATRO_ETAPAS)

    // Ten cycle phases, five stage names and the closing phase, all still there.
    expect(detalhes(herdadas, 'fase-desconhecida')).toHaveLength(16)
  })

  it('desconta nas três listas: phase, completed e pending', () => {
    const { exibidas, eixo } = lerFases(estado('interpretacao-c2', ['escavacao-c2'], ['geracao-c2']))

    expect(detalhes(eixo.absorvidas, 'fase-desconhecida').sort()).toEqual([
      'escavacao-c2',
      'geracao-c2',
      'interpretacao-c2',
    ])
    expect(detalhes(exibidas, 'fase-desconhecida')).toEqual([])
  })

  it('deixa o erro de grafia à vista, ao lado da fase de ciclo descontada', () => {
    const { exibidas } = lerFases(amostra('erros-de-grafia'))

    expect(detalhes(exibidas, 'fase-desconhecida')).toEqual(['escavacão', 'interpretaçao', 'escavacão-c2'])
  })

  it('desconta as duas anomalias quando o mesmo nome está em duas listas', () => {
    const { herdadas, exibidas } = lerFases(estado('geracao', ['escavacao-c2'], ['escavacao-c2']))

    expect(detalhes(herdadas, 'fase-desconhecida')).toEqual(['escavacao-c2', 'escavacao-c2'])
    expect(detalhes(exibidas, 'fase-desconhecida')).toEqual([])
  })

  it('casa a tripla inteira: o mesmo detalhe sob outro arquivo não é descontado', () => {
    const { eixo } = lerFases(estado('geracao', ['escavacao-c2']))
    const outroArquivo = { file: '.reversa/plan.md', code: 'fase-desconhecida', detail: 'escavacao-c2' }

    expect(eixo.absorvidas).not.toContainEqual(outroArquivo)
  })

  it('sem aprovação, a etapa e a variante com sufixo continuam anomalia', () => {
    const { exibidas } = lerFases(estado('geracao', ['verificacao-regressao', 'verificacao-regressao-c3']))

    expect(detalhes(exibidas, 'fase-desconhecida')).toEqual(['verificacao-regressao', 'verificacao-regressao-c3'])
  })

  it('com a base aprovada, as duas saem descontadas', () => {
    const { exibidas } = lerFases(
      estado('geracao', ['verificacao-regressao', 'verificacao-regressao-c3']),
      mapaComEtapas('verificacao-regressao'),
    )

    expect(detalhes(exibidas, 'fase-desconhecida')).toEqual([])
  })

  it('no ciclo três, com as quatro etapas aprovadas, nenhuma fase-desconhecida chega à tela', () => {
    const { exibidas } = lerFases(amostra('ciclo-tres-com-etapas'), QUATRO_ETAPAS)

    expect(detalhes(exibidas, 'fase-desconhecida')).toEqual([])
  })

  it('no ciclo três, sem etapa aprovada, sobram só os cinco nomes de etapa', () => {
    const { exibidas } = lerFases(amostra('ciclo-tres-com-etapas'))

    expect(detalhes(exibidas, 'fase-desconhecida')).toEqual([
      'reconciliacao',
      'verificacao-regressao',
      'saneamento',
      'auditoria-cruzada',
      'verificacao-regressao-c3',
    ])
  })

  it('mantém a regra da 011: a fase de encerramento continua descontada', () => {
    const { exibidas } = lerFases(amostra('terminal-e-nome-estranho'))

    expect(detalhes(exibidas, 'fase-desconhecida')).toEqual(['documentacao'])
  })

  it('a prosa no lugar de fase continua anomalia', () => {
    const { exibidas } = lerFases(amostra('prosa-em-pending'))

    expect(detalhes(exibidas, 'fase-desconhecida')).toHaveLength(2)
  })
})

describe('o encerramento declarado com fase pendente', () => {
  it('registra uma anomalia só, com o phase e os cinco nomes pendentes', () => {
    const { eixo, exibidas } = lerFases(amostra('ciclo-tres-com-etapas'), QUATRO_ETAPAS)

    expect(eixo.extracao.situacao).toBe('encerrada')
    expect(detalhes(exibidas, 'encerramento-com-pendencia')).toEqual([
      'concluido-c3: pending ainda lista escavacao-c3, interpretacao-c3, geracao-c3, revisao-c3, verificacao-regressao-c3',
    ])
  })

  it('sem a aprovação, nomeia só as quatro fases de ciclo', () => {
    const { exibidas } = lerFases(amostra('ciclo-tres-com-etapas'))

    expect(detalhes(exibidas, 'encerramento-com-pendencia')).toEqual([
      'concluido-c3: pending ainda lista escavacao-c3, interpretacao-c3, geracao-c3, revisao-c3',
    ])
    expect(detalhes(exibidas, 'fase-desconhecida')).toContain('verificacao-regressao-c3')
  })

  it('conta a fase canônica pendente, e não só a de ciclo', () => {
    const { exibidas } = lerFases(estado('concluido', ['reconhecimento'], ['revisao']))

    expect(detalhes(exibidas, 'encerramento-com-pendencia')).toEqual(['concluido: pending ainda lista revisao'])
  })

  it('não aparece em projeto encerrado com pending vazio', () => {
    const { eixo } = lerFases(amostra('med-reversa'))

    expect(detalhes(eixo.anomalias, 'encerramento-com-pendencia')).toEqual([])
  })

  it('não aparece quando o pending só guarda nome desconhecido', () => {
    const { eixo } = lerFases(estado('concluido', ['reconhecimento'], ['qualquer-coisa']))

    expect(detalhes(eixo.anomalias, 'encerramento-com-pendencia')).toEqual([])
  })

  it('não aparece em extração em curso, por mais que o pending esteja povoado', () => {
    const { eixo } = lerFases(amostra('fase-concluida-com-pendencia'))

    expect(detalhes(eixo.anomalias, 'encerramento-com-pendencia')).toEqual([])
  })
})
