/**
 * A proposta, nos dois sentidos (T016, RF-12, RF-19).
 *
 * Aprovar é marcar, e promover é ler o que foi marcado. As duas metades vivem
 * no mesmo módulo porque são o mesmo formato visto de dois lados, e separá-las
 * deixaria a escrita livre para mudar sem que a leitura soubesse.
 *
 * O caso que mais importa é o da caixa desmarcada: um formato em que o padrão
 * fosse aprovar transformaria o rito em carimbo, que é justamente o risco
 * nomeado no roadmap.
 * @module tests/equivalencias-proposta
 */

import { describe, expect, it } from 'vitest'
import { escreverProposta, lerMarcados } from '../scripts/equivalencias/proposta.js'

const PARES = [
  { campo: 'status', valor: 'concluido', leitura: 'concluido', razao: 'campo de status', evidencia: ['med-reversa', 'afla'] },
  { campo: 'status', valor: 'failed', leitura: 'falhou', razao: 'status de falha', evidencia: ['scrapping'] },
]
const CHAVES = [{ chave: 'plano_aprovado', razao: 'registro de decisão', evidencia: ['med-reversa'] }]

describe('a escrita da proposta', () => {
  it('nasce com todas as caixas DESMARCADAS, porque aprovar tem de ser um ato', () => {
    const texto = escreverProposta({ pares: PARES, chaves: CHAVES, naoClassificados: [] })

    expect(texto).toContain('- [ ] ')
    expect(texto).not.toContain('- [x] ')
    expect(texto).not.toContain('- [X] ')
  })

  it('mostra o que o motor disse, que é o que permite discordar dele', () => {
    const texto = escreverProposta({ pares: PARES, chaves: CHAVES, naoClassificados: [] })

    expect(texto).toContain('campo de status')
  })

  it('mostra os projetos de evidência, que é o que permite julgar o alcance', () => {
    const texto = escreverProposta({ pares: PARES, chaves: CHAVES, naoClassificados: [] })

    expect(texto).toContain('med-reversa')
    expect(texto).toContain('afla')
  })

  it('nomeia ao fim o que o motor não classificou, em vez de fingir rodada completa', () => {
    const texto = escreverProposta({
      pares: PARES,
      chaves: [],
      naoClassificados: [{ campo: 'status', valor: 'success', causa: 'tempo-limite' }],
    })

    expect(texto).toContain('success')
    expect(texto).toContain('tempo-limite')
  })

  it('escreve proposta legível mesmo quando não há nada a propor', () => {
    const texto = escreverProposta({ pares: [], chaves: [], naoClassificados: [] })

    expect(texto).toContain('nada')
    expect(texto).not.toContain('- [ ] ')
  })
})

describe('a leitura das marcações', () => {
  /**
   * A proposta escrita, com os itens que o caso mandar marcados.
   *
   * O alvo é procurado em qualquer linha do item, e a caixa marcada é a mais
   * próxima ACIMA dela: é assim que uma pessoa marca, olhando o bloco de dados
   * e subindo até a caixa daquele item.
   */
  function marcando(texto: string, ...alvos: string[]): string {
    const linhas = texto.split('\n')
    for (let i = 0; i < linhas.length; i += 1) {
      if (!alvos.some((alvo) => linhas[i].includes(alvo))) continue
      for (let j = i; j >= 0; j -= 1) {
        if (!linhas[j].includes('- [ ]')) continue
        linhas[j] = linhas[j].replace('- [ ]', '- [x]')
        break
      }
    }
    return linhas.join('\n')
  }

  it('devolve APENAS o que está marcado', () => {
    const texto = marcando(escreverProposta({ pares: PARES, chaves: CHAVES, naoClassificados: [] }), '"valor":"concluido"')
    const { pares, chaves } = lerMarcados(texto)

    expect(pares).toEqual([{ campo: 'status', valor: 'concluido', leitura: 'concluido' }])
    expect(chaves).toEqual([])
  })

  it('devolve nada quando nada foi marcado, que é o desfecho de quem leu e não se convenceu', () => {
    const { pares, chaves } = lerMarcados(escreverProposta({ pares: PARES, chaves: CHAVES, naoClassificados: [] }))

    expect(pares).toEqual([])
    expect(chaves).toEqual([])
  })

  it('lê a chave marcada na seção das entradas que não são agentes', () => {
    const texto = marcando(escreverProposta({ pares: [], chaves: CHAVES, naoClassificados: [] }), 'plano_aprovado')
    const { chaves } = lerMarcados(texto)

    expect(chaves).toEqual([{ chave: 'plano_aprovado' }])
  })

  it('aceita `[x]` e `[X]`, porque quem marca à mão usa os dois', () => {
    const base = escreverProposta({ pares: [PARES[0]], chaves: [], naoClassificados: [] })

    expect(lerMarcados(base.replace('- [ ]', '- [x]')).pares).toHaveLength(1)
    expect(lerMarcados(base.replace('- [ ]', '- [X]')).pares).toHaveLength(1)
  })

  it('ignora a prosa e a anotação escrita ao lado do item, sem quebrar', () => {
    const texto = marcando(escreverProposta({ pares: [PARES[0]], chaves: [], naoClassificados: [] }), '"valor":"concluido"')
    const anotado = `${texto}\n\nNota minha: conferir o scrapping depois.\n`

    expect(lerMarcados(anotado).pares).toHaveLength(1)
  })

  it('ignora item da seção dos não classificados, que não tem caixa para marcar', () => {
    const texto = escreverProposta({
      pares: [],
      chaves: [],
      naoClassificados: [{ campo: 'status', valor: 'success', causa: 'tempo-limite' }],
    })

    expect(lerMarcados(texto.replace(/- \[ \]/g, '- [x]')).pares).toEqual([])
  })

  it('sobrevive a arquivo vazio e a arquivo sem bloco algum', () => {
    expect(lerMarcados('')).toEqual({ pares: [], chaves: [] })
    expect(lerMarcados('# título e nada mais')).toEqual({ pares: [], chaves: [] })
  })
})
