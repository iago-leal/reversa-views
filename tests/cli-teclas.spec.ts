/**
 * Suíte do reconhecimento de teclas (T008, feature 014, D-15).
 *
 * O reconhecimento é POR BLOCO DE BYTES, e não por byte, e é aqui que a
 * decisão da D-15 se prende: um bloco que seja exatamente `Esc` é a tecla de
 * saída, e um bloco que comece por `Esc [` é seta. Não há temporizador, e um
 * relógio que aparecesse nesta função tiraria a pureza da única que o contrato
 * do teclado exige pura.
 */

import { describe, expect, it } from 'vitest'
import { reconhecerTecla } from '../src/cli/teclas.ts'

/** Um bloco de bytes, como o terminal o entrega. */
function bloco(...bytes: number[]): Uint8Array {
  return Uint8Array.from(bytes)
}

/** Um bloco escrito como texto, que é como a maioria das teclas chega. */
function texto(valor: string): Uint8Array {
  return new TextEncoder().encode(valor)
}

const ESC = 0x1b

describe('a aresta que a D-15 decide', () => {
  it('um bloco que é exatamente `Esc` é a tecla de saída', () => {
    expect(reconhecerTecla(bloco(ESC))).toBe('sair')
  })

  it('um bloco que começa por `Esc [` é seta, e nunca saída', () => {
    expect(reconhecerTecla(bloco(ESC, 0x5b, 0x41))).toBe('acima')
    expect(reconhecerTecla(bloco(ESC, 0x5b, 0x42))).toBe('abaixo')
    expect(reconhecerTecla(bloco(ESC, 0x5b, 0x43))).toBe('abrir-secao')
    expect(reconhecerTecla(bloco(ESC, 0x5b, 0x44))).toBe('fechar-secao')
  })

  it('reconhece o salto para a seção anterior, que chega como `Esc [ Z`', () => {
    expect(reconhecerTecla(bloco(ESC, 0x5b, 0x5a))).toBe('secao-anterior')
  })

  it('uma sequência de escape que não conhece não vira tecla alguma', () => {
    // Disposição (feature 017, D-05): `Esc [ 5 ~` passou a ser a página
    // acima, e a sequência desconhecida deste caso é agora a de `Insert`.
    expect(reconhecerTecla(bloco(ESC, 0x5b, 0x32, 0x7e))).toBeNull()
  })
})

describe('as teclas de página e de meia página (feature 017, D-05, D-06)', () => {
  const TIL = 0x7e

  it('`Esc [ 5 ~` é a página acima e `Esc [ 6 ~` a página abaixo', () => {
    expect(reconhecerTecla(bloco(ESC, 0x5b, 0x35, TIL))).toBe('pagina-acima')
    expect(reconhecerTecla(bloco(ESC, 0x5b, 0x36, TIL))).toBe('pagina-abaixo')
  })

  it('`Ctrl+U` é meia página acima e `Ctrl+D` meia página abaixo, que em modo bruto é um byte comum', () => {
    expect(reconhecerTecla(bloco(0x15))).toBe('meia-pagina-acima')
    expect(reconhecerTecla(bloco(0x04))).toBe('meia-pagina-abaixo')
  })

  it('as outras sequências com til, Home, Insert, Delete e End, não viram tecla alguma', () => {
    for (const numero of [0x31, 0x32, 0x33, 0x34]) {
      expect(reconhecerTecla(bloco(ESC, 0x5b, numero, TIL)), String.fromCharCode(numero)).toBeNull()
    }
  })

  it('a sequência com til é lida pelo número, e não pelo til', () => {
    expect(reconhecerTecla(bloco(ESC, 0x5b, TIL))).toBeNull()
    expect(reconhecerTecla(bloco(ESC, 0x5b, 0x31, 0x35, TIL))).toBeNull()
  })

  it('as sequências terminadas em letra continuam reconhecidas pelo último byte', () => {
    expect(reconhecerTecla(bloco(ESC, 0x5b, 0x41))).toBe('acima')
    expect(reconhecerTecla(bloco(ESC, 0x5b, 0x5a))).toBe('secao-anterior')
  })
})

describe('a tabela confirmada em 2026-09-20', () => {
  const PARES: Array<[string, string]> = [
    ['k', 'acima'],
    ['j', 'abaixo'],
    ['h', 'fechar-secao'],
    ['l', 'abrir-secao'],
    ['r', 'reler'],
    ['a', 'abrir-tudo'],
    ['z', 'fechar-tudo'],
    ['?', 'ajuda'],
    ['g', 'topo'],
    ['G', 'fim'],
    ['q', 'sair'],
  ]

  for (const [tecla, efeito] of PARES) {
    it(`\`${tecla}\` é ${efeito}`, () => {
      expect(reconhecerTecla(texto(tecla))).toBe(efeito)
    })
  }

  it('o salto de seção chega como tabulação', () => {
    expect(reconhecerTecla(bloco(0x09))).toBe('proxima-secao')
  })

  it('a confirmação chega como retorno de carro ou nova linha', () => {
    expect(reconhecerTecla(bloco(0x0d))).toBe('confirmar')
    expect(reconhecerTecla(bloco(0x0a))).toBe('confirmar')
  })
})

describe('os dois sinais, que não são atalhos', () => {
  it('a interrupção sai, porque a restauração é obrigação dela também', () => {
    expect(reconhecerTecla(bloco(0x03))).toBe('sair')
  })

  it('a suspensão suspende, e não sai', () => {
    expect(reconhecerTecla(bloco(0x1a))).toBe('suspender')
  })
})

describe('o que nenhuma tecla faz', () => {
  it('bloco vazio não vira tecla', () => {
    expect(reconhecerTecla(bloco())).toBeNull()
  })

  it('letra fora da tabela não vira tecla', () => {
    expect(reconhecerTecla(texto('w'))).toBeNull()
    expect(reconhecerTecla(texto('K'))).toBeNull()
  })
})
