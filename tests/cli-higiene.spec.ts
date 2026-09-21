/**
 * Suíte da higiene (T011, feature 016, NFR de segurança, D-20).
 *
 * O que vem do disco é dado, e não comando de tela. Aqui se prova que uma
 * sequência de controle sai como texto visível nos dois jogos de glifos, e
 * que a prosa em português atravessa intacta.
 */

import { describe, expect, it } from 'vitest'
import { neutralizar } from '../src/cli/quadro/higiene.ts'

const ESC = String.fromCharCode(0x1b)
const LIMPAR_A_TELA = `${ESC}[2J${ESC}[H`
const DE_CONTROLE = /[\u0000-\u001f\u007f-\u009f]/

describe('a sequência de limpar a tela sai como texto visível', () => {
  it('no jogo Unicode, pela figura de controle', () => {
    const limpo = neutralizar(`antes${LIMPAR_A_TELA}depois`, 'unicode')
    expect(limpo).toBe('antes␛[2J␛[Hdepois')
    expect(limpo).not.toMatch(DE_CONTROLE)
  })

  it('no jogo de sete bits, pela notação de circunflexo', () => {
    const limpo = neutralizar(`antes${LIMPAR_A_TELA}depois`, 'sete-bits')
    expect(limpo).toBe('antes^[[2J^[[Hdepois')
    expect(limpo).not.toMatch(DE_CONTROLE)
    expect([...limpo].every((ponto) => (ponto.codePointAt(0) ?? 0) < 0x80)).toBe(true)
  })
})

describe('C1 e DEL são neutralizados', () => {
  it('o introdutor de sequência de oito bits vira texto nos dois jogos', () => {
    const csi = String.fromCharCode(0x9b)
    expect(neutralizar(`a${csi}2Jb`, 'unicode')).toBe('a<9B>2Jb')
    expect(neutralizar(`a${csi}2Jb`, 'sete-bits')).toBe('a<9B>2Jb')
  })

  it('DEL tem figura própria e notação própria', () => {
    const del = String.fromCharCode(0x7f)
    expect(neutralizar(`a${del}b`, 'unicode')).toBe('a␡b')
    expect(neutralizar(`a${del}b`, 'sete-bits')).toBe('a^?b')
  })

  it('nenhum código de C0, DEL ou C1 sobrevive', () => {
    const todos = [
      ...Array.from({ length: 0x20 }, (_, i) => i),
      ...Array.from({ length: 0x21 }, (_, i) => 0x7f + i),
    ]
      .map((codigo) => String.fromCharCode(codigo))
      .join('x')
    expect(neutralizar(todos, 'unicode')).not.toMatch(DE_CONTROLE)
    expect(neutralizar(todos, 'sete-bits')).not.toMatch(DE_CONTROLE)
  })
})

describe('o que não é controle atravessa intacto', () => {
  it('o português acentuado não é tocado, em nenhum dos jogos', () => {
    const prosa = 'Decomposição da feature ativa: ação nº 3, já concluída às 14h.'
    expect(neutralizar(prosa, 'unicode')).toBe(prosa)
    expect(neutralizar(prosa, 'sete-bits')).toBe(prosa)
  })

  it('o espaço em branco de controle vira espaço, e não figura', () => {
    expect(neutralizar('um\tdois\ntrês\r\nquatro')).toBe('um dois três  quatro')
  })

  it('é idempotente: neutralizar duas vezes é neutralizar uma', () => {
    const uma = neutralizar(`x${LIMPAR_A_TELA}y`)
    expect(neutralizar(uma)).toBe(uma)
  })
})
