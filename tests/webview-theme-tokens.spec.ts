/**
 * The token trimmer: the closure that keeps the four colour sets inside the
 * budget, and the guard that stops a build which would ship no colour at all
 * (RF-24, D-15, D-16).
 * @module tests/webview-theme-tokens
 */

import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  assertClosureNotEmpty,
  closeOver,
  collectReferences,
  readSet,
  trimSet,
} from '../scripts/theme-tokens.js'

const SET = [
  ':root {',
  '  --fgColor-default: var(--base-color-neutral-1);',
  '  --base-color-neutral-1: #1f2328;',
  '  --bgColor-default: #ffffff;',
  '  --fgColor-orphan: var(--base-color-orphan);',
  '  --base-color-orphan: #abcdef;',
  '}',
].join('\n')

describe('leitura de um conjunto de cor', () => {
  it('separa declaração de estrutura, preservando a estrutura verbatim', () => {
    const linhas = readSet(SET)

    expect(linhas[0]).toEqual({ line: ':root {', references: [] })
    expect(linhas[1].token).toBe('--fgColor-default')
    expect(linhas[1].references).toEqual(['--base-color-neutral-1'])
  })

  it('colhe todo token nomeado por um texto', () => {
    const nomes = collectReferences('a { color: var(--x); border: var( --y , red); }', new Set())
    expect(nomes).toEqual(new Set(['--x', '--y']))
  })
})

describe('fecho transitivo', () => {
  it('retém o token semeado e todos os que ele referencia, em cadeia', () => {
    const mantidos = closeOver(readSet(SET), new Set(['--fgColor-default']))
    expect(mantidos).toEqual(new Set(['--fgColor-default', '--base-color-neutral-1']))
  })

  it('ignora sem lançar o nome semeado que o conjunto não declara', () => {
    expect(() => closeOver(readSet(SET), new Set(['--nao-existe']))).not.toThrow()
    expect(closeOver(readSet(SET), new Set(['--nao-existe']))).toEqual(new Set())
  })

  it('para quando nada novo aparece, mesmo com referência circular', () => {
    const circular = readSet(':root {\n  --a: var(--b);\n  --b: var(--a);\n}')
    expect(closeOver(circular, new Set(['--a']))).toEqual(new Set(['--a', '--b']))
  })
})

describe('poda', () => {
  it('descarta toda declaração fora do fecho e nenhuma dentro dele', () => {
    const podado = trimSet(SET, closeOver(readSet(SET), new Set(['--fgColor-default'])))

    expect(podado).toContain('--fgColor-default')
    expect(podado).toContain('--base-color-neutral-1')
    expect(podado).not.toContain('--fgColor-orphan')
    expect(podado).not.toContain('--bgColor-default')
    expect(podado).toContain(':root {')
  })

  it('reduz um conjunto real do pacote instalado bem acima de noventa por cento', () => {
    const texto = readFileSync(
      'node_modules/@primer/primitives/dist/css/functional/themes/light.css',
      'utf8',
    )
    const semente = new Set(['--fgColor-default', '--bgColor-default', '--borderColor-default'])
    const podado = trimSet(texto, closeOver(readSet(texto), semente))

    expect(podado.length).toBeLessThan(texto.length * 0.1)
    expect(podado).toContain('--fgColor-default')
  })
})

describe('guarda do fecho vazio', () => {
  it('deixa passar o fecho que reteve alguma coisa', () => {
    expect(() => assertClosureNotEmpty(new Set(['--fgColor-default']), 'light.css')).not.toThrow()
  })

  it('interrompe a construção quando o fecho não reteve nada', () => {
    expect(() => assertClosureNotEmpty(new Set(), 'light.css')).toThrow(/light\.css/)
    expect(() => assertClosureNotEmpty(new Set(), 'light.css')).toThrow(/theme-tokens\.js/)
  })
})
