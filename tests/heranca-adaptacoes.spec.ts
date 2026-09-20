/**
 * Suíte da reaplicação das adaptações (T009).
 *
 * A busca é exata de propósito. Num regime com dezenas de correções isso seria
 * proibitivo; com três, todas de importação, a rigidez é a propriedade
 * desejada, porque é ela que produz a parada de RN-09 quando a origem mexe no
 * trecho.
 *
 * A segunda metade, da feature 011, confere outra coisa: que a subseção de
 * pendências de origem da `PROCEDENCIA.md` não seja lida como adaptação. Ela
 * mora dentro da seção 5, entre dezesseis que são, e a única coisa que a separa
 * delas é a prosa. Por isso o dado e a prosa são conferidos juntos aqui: se um
 * dia a pendência ganhar trecho original e trecho adaptado, ela terá virado
 * adaptação, e o total declarado terá de mudar com ela (T034).
 */

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { aplicar } from '../scripts/heranca/adaptacoes.js'
import { lerAdaptacoes } from '../scripts/heranca/manifesto.js'
import { adaptacaoDeImportacao } from './helpers/heranca-fixtures.ts'

const ORIGINAL = "import { readReversa } from '@scrum-harness/reversa-domain'\n"
const ADAPTADO = "import { readReversa } from '../../reversa-domain/src/index.ts'\n"
const CONTEUDO = `// topo\n${ORIGINAL}// resto\n`

describe('aplicação bem-sucedida', () => {
  it('substitui o trecho original pelo adaptado', () => {
    const resultado = aplicar(CONTEUDO, [adaptacaoDeImportacao()])
    expect(resultado.ok).toBe(true)
    expect(resultado.conteudo).toBe(`// topo\n${ADAPTADO}// resto\n`)
  })

  it('trecho adaptado vazio é remoção declarada', () => {
    const resultado = aplicar(CONTEUDO, [adaptacaoDeImportacao({ adaptado: '' })])
    expect(resultado.conteudo).toBe('// topo\n// resto\n')
  })

  it('aplica na ordem de declaração quando há mais de uma no mesmo arquivo', () => {
    const conteudo = 'um\ndois\n'
    const resultado = aplicar(conteudo, [
      adaptacaoDeImportacao({ id: 'A1', original: 'um\n', adaptado: 'UM\n' }),
      adaptacaoDeImportacao({ id: 'A2', original: 'dois\n', adaptado: 'DOIS\n' }),
    ])
    expect(resultado.conteudo).toBe('UM\nDOIS\n')
  })

  it('tolera a ausência da quebra final no trecho declarado', () => {
    const resultado = aplicar(CONTEUDO, [
      adaptacaoDeImportacao({ original: ORIGINAL.trimEnd(), adaptado: ADAPTADO.trimEnd() }),
    ])
    expect(resultado.ok).toBe(true)
    expect(resultado.conteudo).toContain('../../reversa-domain/src/index.ts')
  })
})

describe('recusas', () => {
  it('trecho ausente interrompe, nomeando a adaptação', () => {
    const resultado = aplicar('nada aqui\n', [adaptacaoDeImportacao()])
    expect(resultado.ok).toBe(false)
    expect(resultado.id).toBe('A1')
    expect(resultado.motivo).toBe('ausente')
  })

  it('trecho que aparece duas vezes interrompe, porque a escolha não é da ferramenta', () => {
    const resultado = aplicar(`${ORIGINAL}${ORIGINAL}`, [adaptacaoDeImportacao()])
    expect(resultado.ok).toBe(false)
    expect(resultado.motivo).toBe('ambiguo')
    expect(resultado.ocorrencias).toBe(2)
  })

  it('a recusa não devolve conteúdo parcial', () => {
    const resultado = aplicar('nada aqui\n', [
      adaptacaoDeImportacao({ id: 'A1', original: 'nada aqui\n', adaptado: 'trocado\n' }),
      adaptacaoDeImportacao({ id: 'A2', original: 'não existe\n', adaptado: 'x\n' }),
    ])
    expect(resultado.ok).toBe(false)
    expect(resultado.conteudo).toBeUndefined()
  })
})

/** A raiz do repositório, de onde saem os dois arquivos conferidos abaixo. */
const RAIZ = join(__dirname, '..')

/** O que o dado declara, que é a fonte do ressincronizador. */
const DECLARADAS = lerAdaptacoes(
  readFileSync(join(RAIZ, 'src/heranca/adaptacoes.yml'), 'utf8'),
  'src/heranca/adaptacoes.yml',
).adaptacoes as { id: string; arquivo: string }[]

/** A prosa, que é onde a feature 011 escreveu a pendência de origem. */
const PROCEDENCIA = readFileSync(join(RAIZ, 'src/heranca/PROCEDENCIA.md'), 'utf8')

/**
 * Uma seção da prosa, do seu título até o próximo título de nível igual ou
 * superior, que é onde ela de fato acaba: a subseção de pendências é a última
 * da seção 5, e parar só no próximo `###` a faria engolir o documento inteiro.
 */
function secao(titulo: string, nivel: string): string {
  const inicio = PROCEDENCIA.indexOf(`${nivel} ${titulo}`)
  expect(inicio, titulo).toBeGreaterThan(-1)
  const resto = PROCEDENCIA.slice(inicio + 1)
  const fim = resto.search(new RegExp(`\\n#{1,${nivel.length}} `))
  return fim === -1 ? resto : resto.slice(0, fim)
}

describe('a pendência de origem, que não é adaptação (T034)', () => {
  it('o total declarado continua dezesseis, no dado e na prosa', () => {
    expect(DECLARADAS).toHaveLength(16)
    expect(DECLARADAS.map((item) => item.id)).toEqual(
      Array.from({ length: 16 }, (_, indice) => `A${indice + 1}`),
    )
    expect(secao('5. Adaptações', '##')).toContain('Dezesseis.')
  })

  it('a seção de pendências existe e vive dentro das adaptações', () => {
    expect(secao('5. Adaptações', '##')).toContain('### Pendências de origem')
  })

  it('a seção de pendências não declara adaptação alguma', () => {
    const pendencias = secao('Pendências de origem', '###')

    // Nem por identificador: citar A1 ali dentro seria dar a entender que a
    // pendência tem trecho a reaplicar, e ela não tem.
    for (const item of DECLARADAS) {
      expect(pendencias, item.id).not.toMatch(new RegExp(`\\b${item.id}\\b`))
    }
    // Nem por forma: os títulos de adaptação começam pelo identificador, e este
    // não começa.
    expect(pendencias.split('\n')[0]).not.toMatch(/^### A\d+/)
    expect(pendencias).toContain('pendência, e não adaptação')
  })

  it('o que a pendência promete é o mesmo caminho que a seção declara: origem e ressincronização', () => {
    const pendencias = secao('Pendências de origem', '###')

    expect(pendencias).toContain('scrum-harness')
    expect(pendencias).toContain('ressincronizar')
    expect(pendencias).toContain('adaptacoes.yml')
  })
})
