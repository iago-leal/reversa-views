/**
 * O gerador do módulo do mapa (T017, RF-18, D-11).
 *
 * É a ação que escreve código a partir de dados de terceiros, e por isso a
 * suíte começa pelo escape. A lição já está registrada no gerador do carimbo:
 * um valor com aspas, interpolado em vez de escapado, produz um módulo que não
 * compila, e o defeito só aparece na construção seguinte.
 * @module tests/equivalencias-mapa
 */

import { describe, expect, it } from 'vitest'
import { ConflitoDeEquivalencia, fundir, gerarModulo, lerMapaDeModulo } from '../scripts/equivalencias/gerar-mapa.js'

const HOJE = '2026-09-20'
const VAZIO = { pares: [], naoAgentes: [] }

/** The pair as the proposal hands it over, before the bookkeeping. */
function aprovado(campo: string, valor: string, leitura = 'concluido') {
  return { campo, valor, leitura }
}

describe('a fusão do que foi aprovado', () => {
  it('acrescenta o par aprovado, com a data de hoje', () => {
    const mapa = fundir(VAZIO, { pares: [aprovado('status', 'concluido')], chaves: [] }, HOJE, { status: ['med-reversa'] })

    expect(mapa.pares).toEqual([
      { campo: 'status', valor: 'concluido', leitura: 'concluido', aprovadoEm: HOJE, evidencia: ['med-reversa'] },
    ])
  })

  it('preserva o registro antigo intacto, com a data em que ELE foi aprovado', () => {
    const antes = { pares: [{ campo: 'done', valor: 'true', leitura: 'concluido', aprovadoEm: '2026-01-01', evidencia: ['capacities'] }], naoAgentes: [] }
    const depois = fundir(antes, { pares: [aprovado('status', 'concluido')], chaves: [] }, HOJE, {})

    expect(depois.pares[0]).toEqual(antes.pares[0])
  })

  it('RECUSA o par divergente do já mapeado, nomeando o conflito', () => {
    const antes = { pares: [{ campo: 'status', valor: 'concluido', leitura: 'concluido', aprovadoEm: '2026-01-01', evidencia: [] }], naoAgentes: [] }

    expect(() => fundir(antes, { pares: [aprovado('status', 'concluido', 'falhou')], chaves: [] }, HOJE, {})).toThrow(
      ConflitoDeEquivalencia,
    )
  })

  it('aceita em silêncio o par idêntico ao já mapeado, que não é conflito', () => {
    const antes = { pares: [{ campo: 'status', valor: 'concluido', leitura: 'concluido', aprovadoEm: '2026-01-01', evidencia: [] }], naoAgentes: [] }
    const depois = fundir(antes, { pares: [aprovado('status', 'concluido')], chaves: [] }, HOJE, {})

    expect(depois.pares).toHaveLength(1)
    expect(depois.pares[0].aprovadoEm).toBe('2026-01-01')
  })

  it('acrescenta a chave aprovada à lista das que não são agentes', () => {
    const mapa = fundir(VAZIO, { pares: [], chaves: [{ chave: 'plano_aprovado' }] }, HOJE, { plano_aprovado: ['med-reversa'] })

    expect(mapa.naoAgentes).toEqual([{ chave: 'plano_aprovado', aprovadoEm: HOJE, evidencia: ['med-reversa'] }])
  })

  it('ordena a saída de modo estável, para que o diff mostre a decisão e não a ordem', () => {
    const um = fundir(VAZIO, { pares: [aprovado('z', 'a'), aprovado('a', 'z')], chaves: [] }, HOJE, {})
    const outro = fundir(VAZIO, { pares: [aprovado('a', 'z'), aprovado('z', 'a')], chaves: [] }, HOJE, {})

    expect(gerarModulo(um)).toBe(gerarModulo(outro))
  })
})

describe('a geração do módulo', () => {
  it('escapa aspas em vez de interpolá-las, que é a lição do gerador do carimbo', () => {
    const mapa = fundir(VAZIO, { pares: [aprovado('status', 'diz "pronto"')], chaves: [] }, HOJE, {})
    const modulo = gerarModulo(mapa)

    expect(modulo).toContain('\\"pronto\\"')
    expect(() => JSON.parse(`"${modulo.match(/valor: '(.*)'/)?.[1] ?? ''}"`)).not.toThrow()
  })

  it('escapa barra invertida, que é o outro caractere que caminho e valor aceitam', () => {
    const mapa = fundir(VAZIO, { pares: [aprovado('path', 'C:\\temp')], chaves: [] }, HOJE, {})

    expect(gerarModulo(mapa)).toContain('C:\\\\temp')
  })

  it('escapa quebra de linha, que um valor de arquivo alheio pode conter', () => {
    const mapa = fundir(VAZIO, { pares: [aprovado('nota', 'uma\nduas')], chaves: [] }, HOJE, {})
    const modulo = gerarModulo(mapa)

    expect(modulo).toContain('\\n')
    expect(modulo.split('\n').some((l) => l.trim() === 'duas')).toBe(false)
  })

  it('declara no cabeçalho que é gerado e que não se edita à mão', () => {
    const modulo = gerarModulo(VAZIO)

    expect(modulo).toContain('GENERATED FILE')
    expect(modulo).toContain('promover-equivalencias')
  })

  it('gera módulo válido para o mapa vazio, que é o estado inicial', () => {
    const modulo = gerarModulo(VAZIO)

    expect(modulo).toContain('pares: [')
    expect(modulo).toContain('naoAgentes: [')
  })
})

describe('a releitura do módulo em disco', () => {
  it('devolve o mesmo mapa que gerou, inclusive com valor cheio de escapes', () => {
    const mapa = fundir(
      VAZIO,
      { pares: [aprovado('status', 'diz "pronto"\\e quebra\n'), aprovado('done', 'true')], chaves: [{ chave: 'plano_aprovado' }] },
      HOJE,
      { status: ['med-reversa'] },
    )

    expect(lerMapaDeModulo(gerarModulo(mapa))).toEqual(mapa)
  })

  it('devolve mapa vazio diante de módulo sem o literal esperado, em vez de estourar', () => {
    expect(lerMapaDeModulo('// um arquivo qualquer')).toEqual(VAZIO)
    expect(lerMapaDeModulo('')).toEqual(VAZIO)
  })

  it('lê do fonte o que uma promoção anterior escreveu, que é o que impede a segunda apagar a primeira', () => {
    const primeira = fundir(VAZIO, { pares: [aprovado('status', 'concluido')], chaves: [] }, HOJE, {})
    const relido = lerMapaDeModulo(gerarModulo(primeira))
    const segunda = fundir(relido, { pares: [aprovado('done', 'true')], chaves: [] }, HOJE, {})

    expect(segunda.pares.map((p) => p.campo).sort()).toEqual(['done', 'status'])
  })
})
