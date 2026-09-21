/**
 * Suíte da moldura e dos glifos (T012, feature 016, RF-02, RF-03, RF-14,
 * RN-03). Escrita antes do módulo da moldura.
 *
 * A moldura é função pura: título, conteúdo já recortado, papel da borda e
 * jogo de glifos entram, e saem linhas com trechos. O que se prende aqui é a
 * geometria, que é onde uma caixa quebra: toda linha com a largura exata, o
 * título na borda de cima, o conteúdo defendido contra o que sobrar.
 */

import { describe, expect, it } from 'vitest'
import { GLIFOS } from '../src/cli/quadro/glifos.ts'
import { emoldurar, larguraInterna } from '../src/cli/quadro/moldura.ts'
import { linha, trecho } from '../src/cli/quadro/trechos.ts'
import type { JogoDeGlifos } from '../src/cli/tipos.ts'

const JOGOS: readonly JogoDeGlifos[] = ['unicode', 'sete-bits']

/** Uma caixa de amostra, num jogo e numa largura. */
function caixa(jogo: JogoDeGlifos, largura: number, conteudo: string[] = ['Projeto: reversa-views']) {
  return emoldurar({
    titulo: [trecho('Reversa', 'destaque')],
    conteudo: conteudo.map((texto) => linha([trecho(texto)])),
    largura,
    papel: 'acento',
    glifos: GLIFOS[jogo],
  })
}

describe('os dois jogos de glifos têm a mesma forma (RF-14)', () => {
  it('as chaves são as mesmas', () => {
    expect(Object.keys(GLIFOS['sete-bits']).sort()).toEqual(Object.keys(GLIFOS.unicode).sort())
  })

  it('o jogo de sete bits só tem caracteres de sete bits', () => {
    for (const glifo of Object.values(GLIFOS['sete-bits'])) {
      expect([...glifo].every((ponto) => (ponto.codePointAt(0) ?? 0) < 0x80), glifo).toBe(true)
    }
  })

  it('nenhum glifo é vazio, em nenhum dos jogos', () => {
    for (const jogo of JOGOS) {
      for (const glifo of Object.values(GLIFOS[jogo])) expect(glifo).not.toBe('')
    }
  })
})

describe('as distinções que a cor faz, os glifos fazem também (RN-03)', () => {
  for (const jogo of JOGOS) {
    it(`no jogo ${jogo}, seção aberta, seção fechada e seleção são distintas entre si`, () => {
      const g = GLIFOS[jogo]
      expect(new Set([g.secaoAberta, g.secaoFechada, g.selecao]).size).toBe(3)
    })

    it(`no jogo ${jogo}, os três estados de uma ação continuam sendo três`, () => {
      const g = GLIFOS[jogo]
      expect(new Set([g.acaoFechada, g.acaoProxima, g.acaoAberta]).size).toBe(3)
    })

    it(`no jogo ${jogo}, a observação ativa e a por intervalo se distinguem`, () => {
      expect(GLIFOS[jogo].observacaoAtiva).not.toBe(GLIFOS[jogo].observacaoPorIntervalo)
    })
  }
})

describe('a geometria da caixa (RF-02)', () => {
  for (const jogo of JOGOS) {
    for (const largura of [60, 80, 123]) {
      it(`no jogo ${jogo}, toda linha mede exatamente ${largura} colunas`, () => {
        for (const desenhada of caixa(jogo, largura, ['um', 'dois, mais comprido', ''])) {
          expect([...desenhada.texto].length).toBe(largura)
        }
      })
    }
  }

  it('o título vai na borda superior, e não numa linha a mais', () => {
    const desenhada = caixa('unicode', 60)
    expect(desenhada).toHaveLength(3)
    expect(desenhada[0].texto.startsWith('╭─ Reversa ─')).toBe(true)
    expect(desenhada[0].texto.endsWith('╮')).toBe(true)
    expect(desenhada[2].texto).toBe(`╰${'─'.repeat(58)}╯`)
  })

  it('o conteúdo fica entre os lados, com uma coluna de respiro de cada', () => {
    const [, meio] = caixa('unicode', 60)
    expect(meio.texto.startsWith('│ Projeto: reversa-views')).toBe(true)
    expect(meio.texto.endsWith(' │')).toBe(true)
  })

  it('a largura interna é a largura menos quatro, e o que sobra é cortado', () => {
    expect(larguraInterna(60)).toBe(56)
    const [, meio] = caixa('unicode', 60, ['x'.repeat(200)])
    expect([...meio.texto].length).toBe(60)
    expect(meio.texto).toBe(`│ ${'x'.repeat(56)} │`)
  })

  it('o título maior que a borda é cortado, e a caixa não estoura', () => {
    const desenhada = emoldurar({
      titulo: [trecho('t'.repeat(200), 'titulo')],
      conteudo: [],
      largura: 60,
      papel: 'borda',
      glifos: GLIFOS.unicode,
    })
    expect([...desenhada[0].texto].length).toBe(60)
    expect(desenhada[0].texto.endsWith('─╮')).toBe(true)
  })

  it('no jogo de sete bits, a caixa inteira cabe em sete bits', () => {
    for (const desenhada of caixa('sete-bits', 60)) {
      expect([...desenhada.texto].every((ponto) => (ponto.codePointAt(0) ?? 0) < 0x80)).toBe(true)
    }
    expect(caixa('sete-bits', 60)[0].texto.startsWith('+- Reversa -')).toBe(true)
  })
})

describe('a caixa não decide cor, e não perde o que a linha carregava', () => {
  it('a borda leva o papel pedido, e o título guarda o dele', () => {
    const [topo, meio] = caixa('unicode', 60)
    expect(topo.trechos[0]).toEqual({ texto: '╭─ ', papel: 'acento' })
    expect(topo.trechos.some((t) => t.texto === 'Reversa' && t.papel === 'destaque')).toBe(true)
    expect(meio.trechos[0].papel).toBe('acento')
    expect(meio.trechos.at(-1)?.papel).toBe('acento')
  })

  it('os trechos de cada linha somam o texto dela', () => {
    for (const desenhada of caixa('unicode', 80, ['um', 'dois'])) {
      expect(desenhada.trechos.map((t) => t.texto).join('')).toBe(desenhada.texto)
    }
  })

  it('o artefato e a seleção de uma linha de conteúdo atravessam a caixa', () => {
    const desenhada = emoldurar({
      titulo: [trecho('Aguardando', 'atencao')],
      conteudo: [linha([trecho('razão')], { artefato: 'a/b.md', selecionada: true })],
      largura: 60,
      papel: 'atencao',
      glifos: GLIFOS.unicode,
    })
    expect(desenhada[1].artefato).toBe('a/b.md')
    expect(desenhada[1].selecionada).toBe(true)
    expect(desenhada[0].selecionada).toBe(false)
  })

  it('a seleção do título marca a borda superior, e só ela', () => {
    const desenhada = emoldurar({
      titulo: [trecho('Aguardando', 'atencao')],
      conteudo: [linha([trecho('razão')])],
      largura: 60,
      papel: 'atencao',
      glifos: GLIFOS.unicode,
      selecionada: true,
    })
    expect(desenhada.map((l) => l.selecionada)).toEqual([true, false, false])
  })
})
