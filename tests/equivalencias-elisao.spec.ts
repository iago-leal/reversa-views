/**
 * A elisão da carga enviada ao motor local (T013, RF-11, RN-09).
 *
 * É a suíte de uma promessa de privacidade, e promessa de privacidade sem
 * teste é intenção. Os casos abaixo usam os checkpoints REAIS medidos em
 * 2026-09-20, com os campos que de fato carregam conteúdo: caminho de
 * scratchpad, achados sobre sistema de terceiro e nota sobre omissão
 * deliberada. Nada disso é necessário para classificar um par, e nada disso
 * sai da função.
 * @module tests/equivalencias-elisao
 */

import { describe, expect, it } from 'vitest'
import { MARCA, elidirCheckpoint } from '../scripts/equivalencias/elidir.js'

/** O checkpoint do `scout` do `med-reversa`, como o disco o traz. */
const SCOUT_REAL = {
  at: '2026-09-12T09:02:59',
  status: 'concluido',
  outputs: ['_reversa_sdd/inventory.md', '_reversa_sdd/dependencies.md'],
  scratchpad: '/private/tmp/claude-501/-Users-iagoleal-dev-med-reversa/82b0abc3/scratchpad',
  achados: ['6 abas (3 ocultas), 2607 formulas, 2543 linhas de VBA em 11 modulos'],
  omissao_deliberada:
    'Aritmetica do codigo de ativacao e senha de protecao das abas nao transcritas para evitar keygen de produto de terceiro.',
}

describe('a elisão do checkpoint', () => {
  it('preserva as chaves, que são metade do que o classificador precisa ver', () => {
    const elidido = elidirCheckpoint(SCOUT_REAL)

    expect(Object.keys(elidido).sort()).toEqual(Object.keys(SCOUT_REAL).sort())
  })

  it('preserva o par que declara estado, intacto', () => {
    const elidido = elidirCheckpoint(SCOUT_REAL)

    expect(elidido.status).toBe('concluido')
    expect(elidido.at).toBe('2026-09-12T09:02:59')
  })

  it('substitui lista por marcador de forma, dizendo o tamanho e nunca o conteúdo', () => {
    const elidido = elidirCheckpoint(SCOUT_REAL)

    expect(elidido.outputs).toBe(MARCA.lista(2))
    expect(JSON.stringify(elidido)).not.toContain('inventory.md')
  })

  it('substitui caminho de sistema, que não classifica coisa alguma', () => {
    const elidido = elidirCheckpoint(SCOUT_REAL)

    expect(elidido.scratchpad).toBe(MARCA.caminho)
    expect(JSON.stringify(elidido)).not.toContain('claude-501')
  })

  it('substitui texto longo pelo seu tamanho', () => {
    const elidido = elidirCheckpoint(SCOUT_REAL)

    expect(elidido.omissao_deliberada).toBe(MARCA.texto(SCOUT_REAL.omissao_deliberada.length))
    expect(JSON.stringify(elidido)).not.toContain('keygen')
  })

  it('não deixa passar nenhum dos achados, que falam do sistema do cliente', () => {
    const elidido = elidirCheckpoint(SCOUT_REAL)

    expect(JSON.stringify(elidido)).not.toContain('VBA')
    expect(JSON.stringify(elidido)).not.toContain('abas')
  })

  it('preserva booleano e número, que são curtos e podem declarar estado', () => {
    const elidido = elidirCheckpoint({ done: true, items_total: 33, status: 'ok' })

    expect(elidido).toEqual({ done: true, items_total: 33, status: 'ok' })
  })

  it('elide objeto aninhado inteiro, sem descer nele', () => {
    const elidido = elidirCheckpoint({ reclassificacoes: { amarelo_para_verde: 10 }, status: 'concluido' })

    expect(elidido.reclassificacoes).toBe(MARCA.objeto)
    expect(elidido.status).toBe('concluido')
  })

  it('não altera o checkpoint recebido, porque o disco não é da função', () => {
    const copia = JSON.parse(JSON.stringify(SCOUT_REAL))
    elidirCheckpoint(SCOUT_REAL)

    expect(SCOUT_REAL).toEqual(copia)
  })
})
