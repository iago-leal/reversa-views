/**
 * Suíte da paleta (T009, feature 016, RF-01, RN-04, NFR de contraste).
 *
 * A paleta é dado, e o que se confere num dado é se ele está inteiro e se
 * cumpre o que promete. A promessa é de contraste, e ela é medida pela fórmula
 * da WCAG, contra o fundo de cada paleta: 4,5 para papel que veste texto, 3
 * para o acento, que só veste marca, e 2 para a borda, que não é texto.
 *
 * A medição vale nos dois degraus em que o fundo importa, 24 bits e 256. No
 * de 16 quem decide o tom é a paleta do próprio terminal, e não há o que medir.
 */

import { describe, expect, it } from 'vitest'
import { COM_PESO, DEZESSEIS, TONS } from '../src/cli/paleta.ts'
import type { PapelComTom } from '../src/cli/paleta.ts'
import { PAPEIS } from '../src/cli/tipos.ts'
import type { Fundo } from '../src/cli/tipos.ts'

const FUNDOS: readonly Fundo[] = ['escuro', 'claro']
const COM_TOM = PAPEIS.filter((papel) => papel !== 'normal' && papel !== 'titulo') as PapelComTom[]

/** O piso de contraste de cada papel. */
const PISO: Record<PapelComTom, number> = {
  acento: 3,
  destaque: 4.5,
  atenuado: 4.5,
  borda: 2,
  concluido: 4.5,
  atencao: 4.5,
  falha: 4.5,
}

/** A luminância relativa da WCAG 2.1. */
function luminancia([r, g, b]: readonly [number, number, number]): number {
  const canal = (valor: number): number => {
    const s = valor / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * canal(r) + 0.7152 * canal(g) + 0.0722 * canal(b)
}

/** O contraste entre duas cores, de 1 a 21. */
function contraste(
  a: readonly [number, number, number],
  b: readonly [number, number, number],
): number {
  const [clara, escura] = [luminancia(a), luminancia(b)].sort((x, y) => y - x)
  return (clara + 0.05) / (escura + 0.05)
}

/** O tom de um índice da tabela de 256: o cubo de 6 por 6 por 6 e a rampa de cinzas. */
function tomDoIndice(indice: number): readonly [number, number, number] {
  if (indice >= 232) {
    const cinza = 8 + (indice - 232) * 10
    return [cinza, cinza, cinza]
  }
  const nivel = (n: number): number => (n === 0 ? 0 : 55 + n * 40)
  const base = indice - 16
  return [nivel(Math.floor(base / 36)), nivel(Math.floor(base / 6) % 6), nivel(base % 6)]
}

const FUNDO_DE: Record<Fundo, readonly [number, number, number]> = {
  escuro: [0, 0, 0],
  claro: [255, 255, 255],
}

describe('a paleta está inteira', () => {
  it('todo papel com tom tem valor nos dois fundos e nos três degraus', () => {
    for (const fundo of FUNDOS) {
      expect(Object.keys(TONS[fundo]).sort()).toEqual([...COM_TOM].sort())
      for (const papel of COM_TOM) {
        const tom = TONS[fundo][papel]
        expect(tom.vinteEQuatroBits).toHaveLength(3)
        expect(tom.duzentasECinquentaESeis).toBeGreaterThanOrEqual(16)
        expect(tom.duzentasECinquentaESeis).toBeLessThanOrEqual(255)
      }
    }
    expect(Object.keys(DEZESSEIS).sort()).toEqual([...COM_TOM].sort())
  })

  it('no degrau de 16, atenuado e borda saem por intensidade, e não por cor', () => {
    expect(DEZESSEIS.atenuado).toBeNull()
    expect(DEZESSEIS.borda).toBeNull()
    expect(DEZESSEIS.acento).not.toBe(DEZESSEIS.falha)
  })

  it('o peso veste título, e só título', () => {
    expect([...COM_PESO].sort()).toEqual(['destaque', 'titulo'])
  })
})

describe('o acento é um só, e o destaque responde pelo texto (RN-04)', () => {
  it('o acento é o mesmo tom nos dois fundos', () => {
    expect(TONS.claro.acento.vinteEQuatroBits).toEqual(TONS.escuro.acento.vinteEQuatroBits)
  })

  it('nas 256 cores o índice do fundo claro é outro, porque o do escuro reprova sobre branco', () => {
    const doEscuro = tomDoIndice(TONS.escuro.acento.duzentasECinquentaESeis)
    expect(contraste(doEscuro, FUNDO_DE.claro)).toBeLessThan(3)
    expect(TONS.claro.acento.duzentasECinquentaESeis).not.toBe(
      TONS.escuro.acento.duzentasECinquentaESeis,
    )
  })

  it('o destaque é o acento no fundo escuro, e só difere dele no claro', () => {
    expect(TONS.escuro.destaque).toEqual(TONS.escuro.acento)
    expect(TONS.claro.destaque).not.toEqual(TONS.claro.acento)
  })

  it('o acento não passaria como texto sobre branco, e por isso não veste texto', () => {
    expect(contraste(TONS.claro.acento.vinteEQuatroBits, FUNDO_DE.claro)).toBeLessThan(4.5)
  })
})

describe('o contraste de cada papel, contra o fundo da paleta dele', () => {
  for (const fundo of FUNDOS) {
    for (const papel of COM_TOM) {
      it(`\`${papel}\` sobre fundo ${fundo}, em 24 bits, guarda ao menos ${PISO[papel]}`, () => {
        const medido = contraste(TONS[fundo][papel].vinteEQuatroBits, FUNDO_DE[fundo])
        expect(medido).toBeGreaterThanOrEqual(PISO[papel])
      })

      it(`\`${papel}\` sobre fundo ${fundo}, em 256 cores, guarda ao menos ${PISO[papel]}`, () => {
        const tom = tomDoIndice(TONS[fundo][papel].duzentasECinquentaESeis)
        expect(contraste(tom, FUNDO_DE[fundo])).toBeGreaterThanOrEqual(PISO[papel])
      })
    }
  }
})
