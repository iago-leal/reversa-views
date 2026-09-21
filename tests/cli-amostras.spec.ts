/**
 * As amostras do painel de terminal (feature 016, RF-17, D-23).
 *
 * Três coisas se conferem aqui. A função é reproduzível, porque amostra que
 * muda sozinha não mostra diferença alguma. O gerado coincide com o gravado,
 * que é o que faz uma mudança de paleta aparecer como diferença no repositório,
 * e não como surpresa num terminal. E o conjunto é o que o requisito pede: uma
 * amostra por degrau de cor e uma por situação de entrada que chega à interface
 * viva, que são três; a raiz inexistente termina antes de existir quadro.
 *
 * Quando esta suíte reprovar depois de uma mudança deliberada de aparência,
 * rode `npm run amostras:painel` e confira a diferença antes de versioná-la.
 */

import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { amostrasDoPainel } from '../src/cli/amostras.ts'
import type { EstadoDasAmostras } from '../src/cli/amostras.ts'

const PASTA = 'amostras/painel'
const estado = JSON.parse(readFileSync(join(PASTA, 'estado.json'), 'utf8')) as EstadoDasAmostras
const geradas = amostrasDoPainel(estado)

/** O caractere de escape, escrito pelo número para não morar em literal. */
const ESCAPE = String.fromCharCode(27)

describe('as amostras são reproduzíveis', () => {
  it('o gerado duas vezes é idêntico', () => {
    expect([...amostrasDoPainel(estado)]).toEqual([...geradas])
  })

  it('o gerado coincide com o gravado, arquivo por arquivo', () => {
    const gravadas = readdirSync(PASTA)
      .filter((nome) => nome.endsWith('.txt'))
      .sort()
    expect(gravadas).toEqual([...geradas.keys()].sort())
    for (const nome of gravadas) {
      const gravado = readFileSync(join(PASTA, nome), 'utf8')
      expect(gravado === geradas.get(nome), `${nome} difere do gerado: rode \`npm run amostras:painel\``).toBe(true)
    }
  })
})

describe('o conjunto é o que o requisito pede', () => {
  it('há uma amostra por degrau de cor no fundo escuro, e a de 24 bits no claro', () => {
    for (const nome of ['grau-24bits-escuro', 'grau-256-escuro', 'grau-16-escuro', 'grau-nenhuma', 'grau-24bits-claro']) {
      expect(geradas.has(`${nome}.txt`), nome).toBe(true)
    }
  })

  it('há uma por situação de entrada que chega à interface viva, e são três', () => {
    const deEntrada = [...geradas.keys()].filter((nome) => nome.startsWith('entrada-'))
    expect(deEntrada.sort()).toEqual(['entrada-falha.txt', 'entrada-integra.txt', 'entrada-sem-reversa.txt'])
  })

  it('há a ajuda, a janela estreita e o jogo de sete bits', () => {
    for (const nome of ['ajuda', 'janela-de-59-colunas', 'sete-bits']) {
      expect(geradas.has(`${nome}.txt`), nome).toBe(true)
    }
  })
})

describe('cada amostra mostra o que o nome dela diz', () => {
  const de = (nome: string): string => geradas.get(`${nome}.txt`) ?? ''

  it('cada degrau escreve a cor na grafia dele, e o sem cor não escreve sequência alguma', () => {
    expect(de('grau-24bits-escuro')).toContain(`${ESCAPE}[38;2;`)
    expect(de('grau-256-escuro')).toContain(`${ESCAPE}[38;5;`)
    expect(de('grau-16-escuro')).toContain(ESCAPE)
    expect(de('grau-16-escuro')).not.toContain('38;')
    expect(de('grau-nenhuma')).not.toContain(ESCAPE)
  })

  it('o fundo claro muda os tons, e não o texto', () => {
    const semVeste = (texto: string): string => texto.split(ESCAPE).map((parte, i) => (i === 0 ? parte : parte.slice(parte.indexOf('m') + 1))).join('')
    expect(de('grau-24bits-claro')).not.toBe(de('grau-24bits-escuro'))
    expect(semVeste(de('grau-24bits-claro'))).toBe(semVeste(de('grau-24bits-escuro')))
    expect(semVeste(de('grau-24bits-escuro'))).toBe(de('grau-nenhuma'))
  })

  it('a janela de 59 colunas sai sem moldura, e as demais com ela', () => {
    expect(de('janela-de-59-colunas')).not.toContain('╭')
    expect(de('grau-nenhuma')).toContain('╭')
  })

  it('o jogo de sete bits não escreve glifo nem moldura fora do ASCII', () => {
    const texto = de('sete-bits')
    expect(texto).toContain('+-')
    expect(texto).not.toMatch(/[╭╮╰╯│─▾▸❯●✓→⎿·]/)
  })

  it('a ajuda mostra o painel das teclas no lugar das seções', () => {
    expect(de('ajuda')).toContain('Teclas')
    expect(de('ajuda')).not.toContain('Ciclo forward')
  })

  it('as três situações de entrada dizem o que encontraram', () => {
    expect(de('entrada-integra')).toContain('Processo lido')
    expect(de('entrada-sem-reversa')).toContain('Reversa não instalado aqui')
    expect(de('entrada-falha')).toContain('Não foi possível ler o processo')
  })
})
