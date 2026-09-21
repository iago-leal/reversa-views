/**
 * A coleta das fases (feature 015): os filtros que vêm antes do motor, a base
 * candidata e os pares que vale comparar.
 * @module tests/equivalencias-fases-coleta
 */

import { describe, expect, it } from 'vitest'
import {
  baseCandidata,
  coletarFases,
  formaDeIdentificador,
  paresElegiveis,
} from '../scripts/equivalencias/coletar-fases.js'
import { basesPossiveis, distanciaDeEdicao, erroDeGrafia } from '../scripts/equivalencias/grafia.js'
import { amostra, estado } from './helpers/fases-leitura.ts'

const SEM_ETAPAS = { pares: [], naoAgentes: [] }

/** Um mapa com as etapas dadas aprovadas. */
function mapaCom(...nomes: string[]) {
  return { ...SEM_ETAPAS, etapas: nomes.map((nome) => ({ nome, aprovadoEm: '2026-09-21', evidencia: [] })) }
}

/** Os nomes dos candidatos de uma coleta. */
function nomes(coleta: { candidatos: { nome: string }[] }): string[] {
  return coleta.candidatos.map((c) => c.nome)
}

describe('a forma de identificador (RN-07)', () => {
  it('aceita o nome legítimo mais longo medido, de 24 caracteres', () => {
    expect(formaDeIdentificador('verificacao-de-regressao')).toBe(true)
  })

  it('recusa o valor com espaço e o nome sem espaço com 41 caracteres', () => {
    expect(formaDeIdentificador('rever o cadastro')).toBe(false)
    expect(formaDeIdentificador('a'.repeat(40))).toBe(true)
    expect(formaDeIdentificador('a'.repeat(41))).toBe(false)
  })

  it('recusa o que não é texto, e o texto vazio', () => {
    for (const valor of ['', null, 3, ['x'], {}]) expect(formaDeIdentificador(valor)).toBe(false)
  })
})

describe('o erro de grafia (RN-12)', () => {
  it('mede a distância em caracteres, e não em unidades de código', () => {
    expect(distanciaDeEdicao('escavacão', 'escavacao')).toBe(1)
    expect(distanciaDeEdicao('escavacão', 'escavacao')).toBe(1)
    expect(distanciaDeEdicao('', 'abc')).toBe(3)
  })

  it('percorre cada base possível de um nome com sufixo', () => {
    expect(basesPossiveis('escavacão-ciclo-2')).toEqual(['escavacão-ciclo-2', 'escavacão', 'escavacão-ciclo'])
    expect(basesPossiveis('reconciliacao')).toEqual(['reconciliacao'])
  })

  it('reconhece o erro sobre o nome inteiro e sobre a base sem o sufixo', () => {
    expect(erroDeGrafia('escavacão')).toBe('escavacao')
    expect(erroDeGrafia('interpretaçao')).toBe('interpretacao')
    expect(erroDeGrafia('escavacão-c2')).toBe('escavacao')
    expect(erroDeGrafia('escavacão-ciclo-2')).toBe('escavacao')
    expect(erroDeGrafia('Escavacao')).toBe('escavacao')
  })

  it('não toma por erro o nome que é outro nome', () => {
    for (const nome of ['reconciliacao', 'regressao', 'saneamento', 're-extracao-005', 'documentacao']) {
      expect(erroDeGrafia(nome), nome).toBeNull()
    }
  })
})

describe('a coleta', () => {
  it('propõe só o que ninguém decidiu: nem canônica, nem encerramento, nem ciclo', () => {
    const coleta = coletarFases({
      estados: [{ projeto: 'afla', stateJson: amostra('ciclo-tres-com-etapas') }],
      mapa: SEM_ETAPAS,
    })

    expect(nomes(coleta)).toEqual(['auditoria-cruzada', 'reconciliacao', 'saneamento', 'verificacao-regressao'])
  })

  it('não pergunta de novo a etapa que o mapa já aprovou, nem a variante com sufixo', () => {
    const coleta = coletarFases({
      estados: [{ projeto: 'afla', stateJson: amostra('ciclo-tres-com-etapas') }],
      mapa: mapaCom('verificacao-regressao', 'saneamento'),
    })

    expect(nomes(coleta)).toEqual(['auditoria-cruzada', 'reconciliacao'])
  })

  it('junta as variantes com sufixo num candidato só, com os nomes como evidência', () => {
    const coleta = coletarFases({
      estados: [{ projeto: 'tcr', stateJson: amostra('etapa-em-curso') }],
      mapa: SEM_ETAPAS,
    })

    expect(coleta.candidatos).toHaveLength(1)
    expect(coleta.candidatos[0]).toMatchObject({
      nome: 're-extracao',
      nomes: ['re-extracao-003', 're-extracao-004', 're-extracao-005'],
      evidencia: ['tcr'],
    })
  })

  it('retira o sufixo pela forma estreita, e deixa inteiro o que não a tem', () => {
    expect(baseCandidata('verificacao-regressao-c3')).toBe('verificacao-regressao')
    expect(baseCandidata('re-extracao-005')).toBe('re-extracao')
    expect(baseCandidata('etapa_2')).toBe('etapa')
    expect(baseCandidata('reconciliacao')).toBe('reconciliacao')
    expect(baseCandidata(' Saneamento ')).toBe('saneamento')
  })

  it('acumula os projetos em que o nome aparece, em ordem', () => {
    const coleta = coletarFases({
      estados: [
        { projeto: 'zeta', stateJson: estado('geracao', ['regressao']) },
        { projeto: 'alfa', stateJson: estado('geracao', [], ['regressao-c2']) },
      ],
      mapa: SEM_ETAPAS,
    })

    expect(coleta.candidatos).toEqual([
      expect.objectContaining({ nome: 'regressao', nomes: ['regressao', 'regressao-c2'], evidencia: ['alfa', 'zeta'] }),
    ])
  })

  it('manda o erro de grafia à lista própria, com a fase vizinha, e não aos candidatos', () => {
    const coleta = coletarFases({
      estados: [{ projeto: 'grafia', stateJson: amostra('erros-de-grafia') }],
      mapa: SEM_ETAPAS,
    })

    expect(coleta.candidatos).toEqual([])
    expect(coleta.grafia).toEqual([
      { nome: 'escavacão', canonica: 'escavacao', evidencia: ['grafia'] },
      { nome: 'escavacão-c2', canonica: 'escavacao', evidencia: ['grafia'] },
      { nome: 'interpretaçao', canonica: 'interpretacao', evidencia: ['grafia'] },
    ])
  })

  it('deixa a prosa de fora dos candidatos E dos vizinhos', () => {
    const json = JSON.stringify({ phase: 'revisao', completed: [], pending: ['um texto longo em prosa', 'reconciliacao'] })
    const coleta = coletarFases({ estados: [{ projeto: 'delphi', stateJson: json }], mapa: SEM_ETAPAS })

    expect(nomes(coleta)).toEqual(['reconciliacao'])
    expect(coleta.candidatos[0]?.vizinhos).toEqual(['reconciliacao'])
    expect(JSON.stringify(coleta)).not.toContain('prosa')
  })

  it('não propõe nada diante da amostra que só tem prosa', () => {
    const coleta = coletarFases({
      estados: [{ projeto: 'delphi', stateJson: amostra('prosa-em-pending') }],
      mapa: SEM_ETAPAS,
    })

    expect(coleta).toEqual({ candidatos: [], grafia: [] })
  })

  it('toma os vizinhos da primeira lista, no primeiro projeto em ordem alfabética', () => {
    const coleta = coletarFases({
      estados: [
        { projeto: 'zeta', stateJson: estado('geracao', ['saneamento', 'escavacao']) },
        { projeto: 'alfa', stateJson: estado('geracao', ['reconhecimento', 'saneamento']) },
      ],
      mapa: SEM_ETAPAS,
    })

    expect(coleta.candidatos[0]).toMatchObject({ lista: 'completed', vizinhos: ['reconhecimento', 'saneamento'] })
  })

  it('segue adiante diante de state.json quebrado, e não lê chave de topo alguma', () => {
    const comCiclo = JSON.stringify({ phase: 'geracao', completed: [], pending: [], cycle_2: { motivo: 'segredo' } })
    const coleta = coletarFases({
      estados: [
        { projeto: 'quebrado', stateJson: '{' },
        { projeto: 'ciclo', stateJson: comCiclo },
      ],
      mapa: SEM_ETAPAS,
    })

    expect(coleta).toEqual({ candidatos: [], grafia: [] })
  })

  it('a mesma raiz, em outra ordem de leitura, dá a mesma coleta', () => {
    const estados = [
      { projeto: 'b', stateJson: amostra('ciclo-tres-com-etapas') },
      { projeto: 'a', stateJson: amostra('etapa-em-curso') },
    ]

    expect(coletarFases({ estados: [...estados].reverse(), mapa: SEM_ETAPAS })).toEqual(
      coletarFases({ estados, mapa: SEM_ETAPAS }),
    )
  })
})

describe('os pares elegíveis para a comparação (D-16)', () => {
  it('só compara quem partilha uma palavra', () => {
    const pares = paresElegiveis(['regressao', 'verificacao-regressao', 'saneamento', 're-extracao'], [])

    expect(pares).toEqual([{ a: 'regressao', b: 'verificacao-regressao' }])
  })

  it('desconta as preposições: "de" não é palavra em comum', () => {
    expect(paresElegiveis(['plano-de-voo', 'revisao-de-texto'], [])).toEqual([])
    expect(paresElegiveis(['verificacao-de-regressao', 'verificacao-regressao'], [])).toHaveLength(1)
  })

  it('compara o candidato contra a etapa aprovada, e nunca duas aprovadas entre si', () => {
    const pares = paresElegiveis(['verificacao-de-regressao'], ['regressao', 'verificacao-regressao'])

    expect(pares).toEqual([
      { a: 'regressao', b: 'verificacao-de-regressao' },
      { a: 'verificacao-de-regressao', b: 'verificacao-regressao' },
    ])
  })

  it('ordena o par e não o repete', () => {
    expect(paresElegiveis(['b-x', 'a-x', 'b-x'], [])).toEqual([{ a: 'a-x', b: 'b-x' }])
  })

  it('os três nomes medidos da regressão pedem três pares, e não mais', () => {
    expect(paresElegiveis(['regressao', 'verificacao-regressao', 'verificacao-de-regressao'], [])).toHaveLength(3)
  })
})
