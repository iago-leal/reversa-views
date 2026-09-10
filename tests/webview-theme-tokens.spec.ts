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

/**
 * Os tokens da barra sobrevivem à poda (D-16, RF-32, feature 007).
 *
 * A barra é desenhada sobre tokens do conjunto já importado, e não sobre cor
 * literal nem sobre componente do design system. Isso tem uma consequência que
 * não é óbvia: o podador semeia o fecho a partir do que a FOLHA nomeia, de modo
 * que um token que nenhuma regra menciona não chega ao pacote. Estes casos
 * fecham o laço entre a regra escrita e a cor que de fato viaja.
 */
describe('os tokens da barra chegam ao pacote', () => {
  const FOLHA = readFileSync('src/webview/theme/theme.css', 'utf8')

  /** Os dois tokens da barra, como a folha os nomeia. */
  const DA_BARRA = ['--bgColor-neutral-muted', '--bgColor-accent-emphasis']

  it('a folha nomeia o trilho e o preenchimento', () => {
    expect(FOLHA).toContain('.progress__track')
    expect(FOLHA).toContain('.progress__fill')
    for (const token of DA_BARRA) {
      expect(FOLHA, `a folha não nomeia ${token}`).toContain(`var(${token})`)
    }
  })

  it('a barra não usa cor literal, que é o que D-16 recusa', () => {
    const regra = FOLHA.slice(FOLHA.indexOf('.progress {'))
    expect(regra).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
    expect(regra).not.toMatch(/\brgba?\(/)
  })

  it('cada um dos quatro conjuntos declara os dois, e a poda os preserva', () => {
    // Os nomes de ARQUIVO usam hífen; os de `OFFERED_THEMES`, sublinhado.
    const conjuntos = ['light', 'dark', 'light-high-contrast', 'dark-high-contrast']
    const semente = new Set([...collectReferences(FOLHA, new Set())])

    for (const nome of conjuntos) {
      const texto = readFileSync(
        `node_modules/@primer/primitives/dist/css/functional/themes/${nome}.css`,
        'utf8',
      )
      const podado = trimSet(texto, closeOver(readSet(texto), semente))
      for (const token of DA_BARRA) {
        expect(podado, `${nome} perdeu ${token} na poda`).toContain(`${token}:`)
      }
    }
  })

  it('semeado só com os tokens antigos, o conjunto podado NÃO teria a cor da barra', () => {
    // A asserção mede a diferença que a regra nova faz. Sem ela, a barra
    // chegaria ao pacote sem cor, e o defeito seria invisível na suíte.
    const texto = readFileSync(
      'node_modules/@primer/primitives/dist/css/functional/themes/light.css',
      'utf8',
    )
    const semBarra = new Set(['--fgColor-default', '--bgColor-default'])
    const podado = trimSet(texto, closeOver(readSet(texto), semBarra))
    expect(podado).not.toContain('--bgColor-accent-emphasis:')
  })
})
