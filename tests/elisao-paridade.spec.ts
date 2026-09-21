/**
 * A paridade da elisão: a do pacote e a do script respondem igual (T006).
 *
 * A feature 013 precisou da elisão dentro da extensão, e a feature 012 a havia
 * escrito em `scripts/`. Nenhuma das duas pode importar a outra: o script é
 * carregado por `node` sem construir, e o módulo é compilado no pacote. A
 * duplicação é, portanto, de fronteira, e é declarada no cabeçalho de
 * `src/domain/elisao.ts`, no molde do que `src/domain/limits.ts` já diz sobre
 * `scripts/limites.js`.
 *
 * Esta suíte é o que torna a duplicação segura. Ela não confere a transcrição
 * contra si mesma, o que seria circular: carrega as DUAS implementações e exige
 * que concordem, valor a valor, sobre uma matriz que inclui todas as formas que
 * a elisão distingue e sobre os três checkpoints reais medidos em 2026-09-20.
 * O precedente é `hook-parity.spec.ts`, que confronta a transcrição com a origem
 * em vez de acreditar nela.
 *
 * Divergência aqui é defeito de código, e não de teste: corrige-se a
 * transcrição, jamais se afrouxa a comparação.
 */

import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  LIMITE_DE_TEXTO,
  MARCA,
  elidirCheckpoint,
  elidirValor,
} from '../src/domain/elisao.ts'
import {
  LIMITE_DE_TEXTO as LIMITE_DO_SCRIPT,
  MARCA as MARCA_DO_SCRIPT,
  elidirCheckpoint as elidirCheckpointDoScript,
  elidirValor as elidirValorDoScript,
} from '../scripts/equivalencias/elidir.js'

/** Os três casos medidos, como a fixtura os grava. */
const CASOS = JSON.parse(
  readFileSync('tests/fixtures/descoberta/casos-do-prompt.json', 'utf8'),
) as { checkpoints: Record<string, Record<string, unknown>> }

/**
 * A matriz de valores, uma entrada por forma que a elisão distingue, mais as
 * fronteiras exatas do limite de texto.
 */
const MATRIZ: unknown[] = [
  'concluido',
  '2026-05-03T12:10:19Z',
  '',
  'x'.repeat(LIMITE_DE_TEXTO),
  'x'.repeat(LIMITE_DE_TEXTO + 1),
  '/Users/alguem/dev/projeto/arquivo.md',
  '~/dev/projeto',
  'C:\\Users\\alguem\\projeto',
  'C:/Users/alguem/projeto',
  'relativo/sem/barra/inicial.md',
  [],
  ['um'],
  ['um', 'dois', 'tres'],
  {},
  { dentro: 1 },
  0,
  3,
  -1,
  1.5,
  true,
  false,
  null,
]

describe('as duas elisões concordam (T006)', () => {
  it('sobre cada valor da matriz, um a um', () => {
    for (const valor of MATRIZ) {
      expect(
        elidirValor(valor),
        `divergiram sobre ${JSON.stringify(valor)}`,
      ).toEqual(elidirValorDoScript(valor))
    }
  })

  it('sobre os três checkpoints reais que sobraram depois da promoção', () => {
    for (const [agente, entry] of Object.entries(CASOS.checkpoints)) {
      expect(elidirCheckpoint(entry), `divergiram sobre ${agente}`).toEqual(
        elidirCheckpointDoScript(entry),
      )
    }
  })

  it('sobre o limite de texto e sobre os marcadores de forma', () => {
    expect(LIMITE_DE_TEXTO).toBe(LIMITE_DO_SCRIPT)
    expect(MARCA.caminho).toBe(MARCA_DO_SCRIPT.caminho)
    expect(MARCA.objeto).toBe(MARCA_DO_SCRIPT.objeto)
    expect(MARCA.lista(3)).toBe(MARCA_DO_SCRIPT.lista(3))
    expect(MARCA.texto(41)).toBe(MARCA_DO_SCRIPT.texto(41))
  })
})

/**
 * O que a elisão promete, conferido no lado do pacote.
 *
 * A paridade acima garante que os dois lados são o mesmo; estes casos garantem
 * que esse mesmo é o certo. Sem eles, duas implementações erradas de forma
 * idêntica passariam.
 */
describe('o que a elisão preserva e o que substitui', () => {
  it('preserva todas as chaves, inclusive as canônicas do esquema', () => {
    const scout = CASOS.checkpoints.scout!
    expect(Object.keys(elidirCheckpoint(scout))).toEqual(Object.keys(scout))
  })

  it('preserva o escalar curto, que é o que declara estado', () => {
    expect(elidirValor('2026-05-03T12:10:19Z')).toBe('2026-05-03T12:10:19Z')
    expect(elidirValor(3)).toBe(3)
    expect(elidirValor(true)).toBe(true)
  })

  it('substitui a lista pela contagem, sem os itens', () => {
    const elidido = elidirCheckpoint(CASOS.checkpoints.scout!)
    expect(elidido.files).toBe('<lista de 3>')
    expect(JSON.stringify(elidido)).not.toContain('inventory.md')
  })

  it('substitui o caminho de sistema, e não o caminho relativo', () => {
    expect(elidirValor('/Users/alguem/x.md')).toBe(MARCA.caminho)
    expect(elidirValor('~/dev/x')).toBe(MARCA.caminho)
    expect(elidirValor('PS/inventory.md')).toBe('PS/inventory.md')
  })

  it('substitui o texto acima do limite, dizendo o tamanho e não o conteúdo', () => {
    const longo = 'segredo '.repeat(20)
    const saida = elidirValor(longo)
    expect(saida).toBe(MARCA.texto(longo.length))
    expect(String(saida)).not.toContain('segredo')
  })

  it('não devolve lista nem objeto: a forma que viaja é sempre rasa', () => {
    for (const entry of Object.values(CASOS.checkpoints)) {
      for (const valor of Object.values(elidirCheckpoint(entry))) {
        expect(Array.isArray(valor)).toBe(false)
        expect(typeof valor === 'object' && valor !== null).toBe(false)
      }
    }
  })

  it('não altera o que recebe', () => {
    const entry = { files: ['a', 'b'], status: 'concluido' }
    elidirCheckpoint(entry)
    expect(entry.files).toEqual(['a', 'b'])
  })
})
