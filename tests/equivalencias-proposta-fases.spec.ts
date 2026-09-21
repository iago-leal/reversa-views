/**
 * A seção de fases da proposta, nos dois sentidos (feature 015, RF-14, RF-15,
 * RF-21, D-17).
 * @module tests/equivalencias-proposta-fases
 */

import { describe, expect, it } from 'vitest'
import {
  agruparPorFecho,
  escreverProposta,
  lerEtapasMarcadas,
  lerMarcados,
} from '../scripts/equivalencias/proposta.js'

/** Um candidato, com só o que o caso quiser dizer. */
function candidato(nome: string, partes: Record<string, unknown> = {}) {
  return { nome, nomes: [nome], evidencia: ['afla'], lista: 'completed', vizinhos: ['escavacao', nome], classificado: true, ...partes }
}

const TRES = [
  candidato('regressao', { evidencia: ['alfa'] }),
  candidato('verificacao-de-regressao', { evidencia: ['beta'] }),
  candidato('verificacao-regressao', { evidencia: ['gama'], nomes: ['verificacao-regressao', 'verificacao-regressao-c3'] }),
]
const MESMA = { a: 'verificacao-de-regressao', b: 'verificacao-regressao', razao: 'só muda a preposição' }
const VAZIA = { pares: [], chaves: [], naoClassificados: [] }

/** Marca a caixa do item cujo título traz o nome. */
function marcar(texto: string, ...nomes: string[]): string {
  return nomes.reduce((t, nome) => t.replace(`- [ ] \`${nome}\` →`, `- [x] \`${nome}\` →`), texto)
}

describe('o agrupamento é o fecho dos pares mesma', () => {
  it('junta a com c quando a é a mesma que b e b a mesma que c', () => {
    const grupos = agruparPorFecho(['a', 'b', 'c', 'd'], [{ a: 'a', b: 'b' }, { a: 'b', b: 'c' }])

    expect(grupos).toEqual([['a', 'b', 'c'], ['d']])
  })

  it('não forma grupo com nome que não é candidato', () => {
    expect(agruparPorFecho(['a'], [{ a: 'a', b: 'ja-aprovada' }])).toEqual([['a']])
  })
})

describe('a escrita da seção', () => {
  const texto = escreverProposta({ ...VAZIA, fases: { candidatos: TRES, mesmas: [MESMA], grafia: [], recusados: [] } })

  it('traz uma caixa por nome, todas desmarcadas', () => {
    expect(texto.match(/- \[ \] `/g)).toHaveLength(3)
    expect(texto).not.toMatch(/- \[[xX]\]/)
  })

  it('põe no mesmo grupo os dois nomes que o motor julgou a mesma etapa, e o terceiro à parte', () => {
    const grupo = texto.indexOf('### Mesma etapa, segundo o motor: verificacao-de-regressao, verificacao-regressao')
    const sozinhos = texto.indexOf('### Sem agrupamento')

    expect(grupo).toBeGreaterThan(-1)
    expect(sozinhos).toBeGreaterThan(grupo)
    expect(texto.indexOf('`regressao` →')).toBeGreaterThan(sozinhos)
  })

  it('mostra a razão do motor SÓ na comparação, sob o grupo', () => {
    const comRazaoFalsa = escreverProposta({
      ...VAZIA,
      fases: { candidatos: [candidato('saneamento', { razao: 'dentro do cânone, diz o motor' })], mesmas: [MESMA], grafia: [], recusados: [] },
    })

    expect(texto).toContain('só muda a preposição')
    expect(comRazaoFalsa).not.toContain('dentro do cânone, diz o motor')
  })

  it('mostra ao lado de cada nome a evidência medida: projetos, grafias, lista e vizinhos', () => {
    expect(texto).toContain('_visto em:_ gama')
    expect(texto).toContain('_gravado como:_ verificacao-regressao, verificacao-regressao-c3 (primeiro em `completed`)')
    expect(texto).toContain('_ao lado de:_ escavacao')
  })

  it('dá caixa ao nome não classificado, e diz que a decisão é sem a sugestão', () => {
    const semClasse = escreverProposta({
      ...VAZIA,
      fases: { candidatos: [candidato('saneamento', { classificado: false })], mesmas: [], grafia: [], recusados: [] },
    })

    expect(semClasse).toContain('- [ ] `saneamento` →')
    expect(semClasse).toContain('não classificado nesta rodada')
  })

  it('lista o erro de grafia e o recusado SEM caixa, e a promoção não tem como aprová-los', () => {
    const comListas = escreverProposta({
      ...VAZIA,
      fases: {
        candidatos: [],
        mesmas: [],
        grafia: [{ nome: 'escavacão-c2', canonica: 'escavacao', evidencia: ['grafia'] }],
        recusados: [{ nome: 'iago', evidencia: ['afla'] }],
      },
    })

    expect(comListas).toContain('`escavacão-c2`, ao lado de `escavacao`')
    expect(comListas).toContain('`iago`')
    expect(comListas).not.toMatch(/- \[[ xX]\]/)
    expect(lerEtapasMarcadas(comListas.replace(/^- `/gm, '- [x] `'))).toEqual([])
  })

  it('nomeia o candidato que o motor ligou a uma etapa já aprovada, com a razão', () => {
    const ligado = escreverProposta({
      ...VAZIA,
      fases: {
        candidatos: [candidato('verificacao-de-regressao')],
        mesmas: [{ a: 'verificacao-de-regressao', b: 'verificacao-regressao', razao: 'abrevia' }],
        grafia: [],
        recusados: [],
      },
    })

    expect(ligado).toContain('### Parecidas com etapa já aprovada')
    expect(ligado).toContain('abrevia')
  })

  it('sem a seção, a proposta é a da 012; com ela, não diz que não há nada a propor', () => {
    expect(escreverProposta(VAZIA)).toContain('Não há nada a propor')
    expect(escreverProposta(VAZIA)).not.toContain('## Fases')
    expect(texto).not.toContain('Não há nada a propor')
  })
})

describe('a leitura das caixas de volta', () => {
  const texto = escreverProposta({
    pares: [{ campo: 'status', valor: 'ok', leitura: 'concluido', razao: 'x', evidencia: ['a'] }],
    chaves: [],
    naoClassificados: [],
    fases: { candidatos: TRES, mesmas: [MESMA], grafia: [], recusados: [] },
  })

  it('nada marcado, nada aprovado', () => {
    expect(lerEtapasMarcadas(texto)).toEqual([])
  })

  it('marcadas duas do mesmo grupo, voltam dois nomes, e a terceira não', () => {
    const marcado = marcar(texto, 'verificacao-regressao', 'verificacao-de-regressao')

    expect(lerEtapasMarcadas(marcado)).toEqual([{ nome: 'verificacao-de-regressao' }, { nome: 'verificacao-regressao' }])
  })

  it('não confunde as duas leituras: a dos pares não vê etapa, e a das etapas não vê par', () => {
    const marcado = marcar(texto, 'regressao').replace('- [ ] `status', '- [x] `status')

    expect(lerMarcados(marcado)).toEqual({ pares: [{ campo: 'status', valor: 'ok', leitura: 'concluido' }], chaves: [] })
    expect(lerEtapasMarcadas(marcado)).toEqual([{ nome: 'regressao' }])
  })

  it('aguenta anotação ao lado do item e bloco ilegível', () => {
    const anotado = marcar(texto, 'regressao').replace('_visto em:_ alfa', '_visto em:_ alfa  <- confirmei com a equipe')
    const quebrado = marcar(texto, 'regressao').replace('{"nome":"regressao"}', '{nome: regressao')

    expect(lerEtapasMarcadas(anotado)).toEqual([{ nome: 'regressao' }])
    expect(lerEtapasMarcadas(quebrado)).toEqual([])
  })
})
