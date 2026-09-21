/**
 * The current cycle and the approved stages, as feature 015 derives them from
 * the three lists of phase names and from nothing else in the file.
 * @module tests/domain-fases-ciclo
 */

import { describe, expect, it } from 'vitest'
import { amostra, estado, lerFases, mapaComEtapas } from './helpers/fases-leitura.ts'

const CINCO = ['reconhecimento', 'escavacao', 'interpretacao', 'geracao', 'revisao']

describe('o ciclo corrente', () => {
  it('é o maior inteiro entre as fases de ciclo, e traz as cinco fases nele', () => {
    const { eixo } = lerFases(amostra('ciclo-tres-com-etapas'))

    expect(eixo.ciclo).toEqual({
      numero: 3,
      fases: [
        { canonica: 'reconhecimento', status: 'done', bruto: 'reconhecimento-c3' },
        { canonica: 'escavacao', status: 'pending', bruto: 'escavacao-c3' },
        { canonica: 'interpretacao', status: 'pending', bruto: 'interpretacao-c3' },
        { canonica: 'geracao', status: 'pending', bruto: 'geracao-c3' },
        { canonica: 'revisao', status: 'pending', bruto: 'revisao-c3' },
      ],
    })
  })

  it('lê como pendente, sem nome bruto, a fase que não aparece em lista alguma', () => {
    const { eixo } = lerFases(estado('escavacao-c3', [...CINCO, 'reconhecimento-c3']))

    expect(eixo.ciclo?.fases.map((f) => [f.status, f.bruto])).toEqual([
      ['done', 'reconhecimento-c3'],
      ['current', 'escavacao-c3'],
      ['pending', null],
      ['pending', null],
      ['pending', null],
    ])
  })

  it('segue a precedência herdada: completed vence phase, e phase vence pending', () => {
    const { eixo } = lerFases(estado('escavacao-c2', ['escavacao-c2'], ['escavacao-c2']))

    expect(eixo.ciclo?.fases[1]).toEqual({ canonica: 'escavacao', status: 'done', bruto: 'escavacao-c2' })
  })

  it('com duas grafias do mesmo ciclo, vale a primeira de completed', () => {
    const { eixo } = lerFases(estado('revisao-c2', ['geracao-2', 'geracao-c2']))

    expect(eixo.ciclo?.fases[3]).toEqual({ canonica: 'geracao', status: 'done', bruto: 'geracao-2' })
  })

  it('reconhece qualquer sufixo numérico, e o sublinhado como separador', () => {
    const { eixo } = lerFases(estado('geracao', ['geracao-2', 'revisao-ciclo-2', 'escavacao_c2', 'geracao-2a']))

    expect(eixo.ciclo?.numero).toBe(2)
    expect(eixo.ciclo?.fases.filter((f) => f.status === 'done').map((f) => f.bruto)).toEqual([
      'escavacao_c2',
      'geracao-2',
      'revisao-ciclo-2',
    ])
  })

  it('não mostra os ciclos anteriores', () => {
    const { eixo } = lerFases(amostra('ciclo-tres-com-etapas'))
    const brutos = eixo.ciclo?.fases.map((f) => f.bruto) ?? []

    expect(brutos.some((bruto) => bruto?.endsWith('-c2'))).toBe(false)
  })

  it('vem ausente, e não vazio, em projeto sem fase de ciclo', () => {
    const { eixo } = lerFases(estado('geracao', ['reconhecimento', 'escavacao']))

    expect('ciclo' in eixo).toBe(false)
  })

  it('não lê chave de topo alguma: cycle e cycle_N não mudam o resultado', () => {
    const json = JSON.stringify({ phase: 'geracao', completed: CINCO, pending: [], cycle: 7, cycle_7: { motivo: 'x' } })

    expect('ciclo' in lerFases(json).eixo).toBe(false)
  })

  it('não conta o número de uma etapa como número de ciclo', () => {
    const { eixo } = lerFases(amostra('etapa-em-curso'), mapaComEtapas('re-extracao'))

    expect('ciclo' in eixo).toBe(false)
  })
})

describe('as etapas aprovadas presentes no arquivo', () => {
  it('seguem a ordem do arquivo, com nome bruto, base, sufixo e situação', () => {
    const { eixo } = lerFases(amostra('etapa-em-curso'), mapaComEtapas('re-extracao'))

    expect(eixo.etapas).toEqual([
      { bruto: 're-extracao-003', base: 're-extracao', sufixo: 3, situacao: 'concluida' },
      { bruto: 're-extracao-004', base: 're-extracao', sufixo: 4, situacao: 'concluida' },
      { bruto: 're-extracao-005', base: 're-extracao', sufixo: 5, situacao: 'em-curso' },
    ])
  })

  it('traz os cinco nomes do ciclo três, com a pendente ao fim', () => {
    const mapa = mapaComEtapas('reconciliacao', 'verificacao-regressao', 'saneamento', 'auditoria-cruzada')
    const { eixo } = lerFases(amostra('ciclo-tres-com-etapas'), mapa)

    expect(eixo.etapas?.map((e) => [e.bruto, e.situacao])).toEqual([
      ['reconciliacao', 'concluida'],
      ['verificacao-regressao', 'concluida'],
      ['saneamento', 'concluida'],
      ['auditoria-cruzada', 'concluida'],
      ['verificacao-regressao-c3', 'pendente'],
    ])
  })

  it('lê como concluída a etapa que é o phase e também está em completed', () => {
    const { eixo } = lerFases(amostra('encerrada-sem-declaracao-em-etapa'), mapaComEtapas('documentacao'))

    expect(eixo.etapas).toEqual([{ bruto: 'documentacao', base: 'documentacao', sufixo: null, situacao: 'concluida' }])
  })

  it('não duplica o nome que aparece em duas listas', () => {
    const { eixo } = lerFases(estado('geracao', ['saneamento'], ['saneamento']), mapaComEtapas('saneamento'))

    expect(eixo.etapas).toHaveLength(1)
  })

  it('vêm ausentes quando nenhuma etapa aprovada está no arquivo', () => {
    expect('etapas' in lerFases(amostra('ciclo-tres-com-etapas')).eixo).toBe(false)
    expect('etapas' in lerFases(estado('geracao', CINCO), mapaComEtapas('saneamento')).eixo).toBe(false)
  })

  it('com a etapa em curso, nenhuma das cinco fases herdadas sai como atual', () => {
    const { eixo } = lerFases(amostra('etapa-em-curso'), mapaComEtapas('re-extracao'))

    expect(eixo.etapas?.some((e) => e.situacao === 'em-curso')).toBe(true)
    expect(eixo.ciclo).toBeUndefined()
  })
})
