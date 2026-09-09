/**
 * Suíte de coerência entre a constante gerada e o manifesto (T015).
 *
 * A constante existe para que o painel mostre a revisão do modelo sem ler
 * arquivo em tempo de execução (D-06). O preço de um artefato gerado é este
 * teste: quem ressincronizar e esquecer de regenerar descobre aqui, e não pelo
 * painel mostrando um número velho.
 */

import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { parse } from 'yaml'
import { INHERITED_MODEL_REVISION } from '../src/host/inheritance.ts'

const MANIFESTO = parse(readFileSync('src/heranca/manifesto.yml', 'utf8')) as {
  origens: Array<{ nome: string; tipo: string; revisao?: string }>
}

const MODELO = MANIFESTO.origens.find((origem) => origem.nome === 'scrum-harness')

describe('a constante e o manifesto dizem a mesma coisa', () => {
  it('a revisão do modelo é a que o manifesto declara', () => {
    expect(MODELO?.revisao).toBeTruthy()
    expect(INHERITED_MODEL_REVISION).toBe(MODELO?.revisao)
  })

  it('tem a forma de uma revisão do git', () => {
    expect(INHERITED_MODEL_REVISION).toMatch(/^[0-9a-f]{40}$/)
  })
})

describe('o arquivo se declara gerado', () => {
  const FONTE = readFileSync('src/host/inheritance.ts', 'utf8')

  it('avisa que não se edita à mão, e diz de onde veio', () => {
    expect(FONTE).toMatch(/GERADO/)
    expect(FONTE).toContain('src/heranca/manifesto.yml')
  })

  it('exporta a constante e nada mais que leia disco', () => {
    expect(FONTE).not.toMatch(/from\s+'node:/)
    expect(FONTE).not.toMatch(/readFileSync/)
  })
})
