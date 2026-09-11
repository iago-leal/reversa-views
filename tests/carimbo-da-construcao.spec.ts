/**
 * Suíte do gerador do carimbo da construção (BUG-20260911-FI3O).
 *
 * O gerador existe desde a feature 007 e nunca teve suíte própria: o que dele
 * se verificava era indireto, pelo manifesto, que confere a ORDEM em que ele
 * roda, e nunca o que ele escreve. A quinta constante deu razão para a suíte
 * existir, porque ela é a primeira cujo valor é um CAMINHO, e caminho tem
 * caractere que quebra literal.
 *
 * Nada aqui escreve arquivo: o que se exercita é `modulo()`, a função pura que
 * produz o texto, e não `principal()`, que lê o git e grava.
 * @module tests/carimbo-da-construcao
 */

import { describe, expect, it } from 'vitest'
import { modulo } from '../scripts/gerar-carimbo-da-construcao.js'

/** Um carimbo completo, como o gerador o monta antes de escrever. */
function carimbo(sobrescritas: Record<string, unknown> = {}) {
  return {
    versao: '0.9.0',
    commit: 'a23711d481021a978720c0bc478b6dabed94fec3',
    origem: 'iago-leal/reversa-views',
    ramo: 'master',
    raiz: '/home/alguem/dev/reversa-views',
    ...sobrescritas,
  }
}

describe('as constantes que a construção declara sobre si', () => {
  it('as quatro que já existiam continuam onde estavam', () => {
    const texto = modulo(carimbo())
    expect(texto).toContain("export const EXTENSION_VERSION = '0.9.0'")
    expect(texto).toContain(
      "export const BUILT_FROM_COMMIT = 'a23711d481021a978720c0bc478b6dabed94fec3'",
    )
    expect(texto).toContain("export const ORIGIN_REPOSITORY: string | null = 'iago-leal/reversa-views'")
    expect(texto).toContain("export const DEFAULT_BRANCH = 'master'")
  })

  it('a raiz do clone entra como quinta constante (BUG-20260911-FI3O)', () => {
    // Reprodução: vermelho enquanto o carimbo não disser de onde a construção
    // foi feita. Sem esse endereço a faixa não tem o que anunciar, e o leitor
    // fica com um comando que só existe dentro do clone.
    expect(modulo(carimbo())).toContain(
      'export const BUILT_FROM_ROOT = "/home/alguem/dev/reversa-views"',
    )
  })

  it('o caminho é escapado, e não interpolado cru', () => {
    // Caminho aceita aspas, barra invertida e quebra de linha, e um literal
    // montado por concatenação com qualquer um deles gera um módulo que não
    // compila. O que sai daqui tem de ser JSON válido em toda raiz.
    const texto = modulo(carimbo({ raiz: 'C:\\Users\\alguém\\O "Projeto"' }))
    const casou = /export const BUILT_FROM_ROOT = (.+)\n/.exec(texto)
    expect(casou, 'a constante sumiu do módulo gerado').not.toBeNull()
    expect(JSON.parse(casou?.[1] ?? '')).toBe('C:\\Users\\alguém\\O "Projeto"')
  })

  it('raiz vazia sai como cadeia vazia, que é o que a tela lê como recuo', () => {
    expect(modulo(carimbo({ raiz: '' }))).toContain('export const BUILT_FROM_ROOT = ""')
  })

  it('o módulo gerado continua declarando que não se edita à mão', () => {
    expect(modulo(carimbo())).toContain('ARQUIVO GERADO')
    expect(modulo(carimbo())).toContain('@module host/build')
  })
})
