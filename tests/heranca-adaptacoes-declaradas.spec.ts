/**
 * As adaptações declaradas de verdade, julgadas contra a árvore de verdade
 * (BUG-20260919-BQBJ).
 *
 * As outras suítes da herança julgam fixtures montadas à mão; esta lê o
 * `adaptacoes.yml`, o manifesto e os arquivos herdados que estão no disco, e
 * pergunta se cada declaração reaplica sobre a origem que ela mesma implica.
 * Foi a falta dessa pergunta que deixou A4 e A5 sem indentação por doze dias.
 */

import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { lerArvoreLocal, lerDeclaracoes } from '../scripts/heranca/leitura.js'
import { julgar } from '../scripts/heranca/verificar.js'

/** A raiz do repositório. */
const RAIZ = join(__dirname, '..')

const { manifesto, adaptacoes } = lerDeclaracoes(RAIZ)

/** Uma adaptação declarada, pelo identificador. */
function declarada(id: string): { original: string; adaptado: string } {
  const item = adaptacoes.adaptacoes.find((candidata: { id: string }) => candidata.id === id)
  expect(item, id).toBeDefined()
  return item
}

describe('a árvore herdada real', () => {
  it('toda declaração reaplica sobre a origem que ela implica, sem precisar da origem', () => {
    const resultado = julgar({
      manifesto,
      adaptacoes,
      local: lerArvoreLocal(RAIZ, manifesto),
      origens: null,
    })
    const naoReaplicam = resultado.achados.filter(
      (achado: { tipo: string }) => achado.tipo === 'adaptacao-nao-reaplica',
    )
    expect(naoReaplicam).toEqual([])
    expect(resultado.impede).toBe(false)
  })

  it('A4 é lida com a indentação que o código de impact.ts tem', () => {
    const a4 = declarada('A4')
    expect(a4.original.startsWith('    // The note is authoritative')).toBe(true)
    expect(a4.adaptado.startsWith('    // A4 (BUG-20260909-FJBD)')).toBe(true)
  })

  it('A5 é lida com a indentação que o código de impact.spec.ts tem', () => {
    const a5 = declarada('A5')
    expect(a5.original.startsWith("  it('keeps the note authoritative but flags")).toBe(true)
    expect(a5.adaptado.startsWith("  it('keeps the note authoritative and accepts")).toBe(true)
  })
})
