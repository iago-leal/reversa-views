/**
 * The reader of the action table of `actions.md` (RF-06, RF-14, RN-04, RN-05,
 * D-08, D-09).
 *
 * O arquivo é escrito por agente a partir de um template, e não emitido por
 * código. Acento, caixa e coluna a mais são divergências plausíveis, e por
 * isso o cabeçalho é casado pela forma normalizada, as células são lidas por
 * posição e há queda para varredura linha a linha quando nada casa. Uma lista
 * vazia por causa de um cabeçalho diferente seria painel que mente.
 *
 * A contagem herdada continua sendo a autoridade sobre quantas ações existem.
 * Quando ela e o comprimento da lista discordam, a divergência é declarada, e
 * não resolvida em silêncio a favor de uma das duas.
 * @module tests/domain-decomposition
 */

import { describe, expect, it } from 'vitest'
import { readDecomposition } from '../src/domain/decomposition.ts'

const CABECALHO =
  '| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |'
const SEPARADOR =
  '|----|-----------|--------------|-------------|--------------|-------------|--------|'

/** Uma linha da tabela canônica, com as sete células por posição. */
function linha(id: string, descricao: string, alvo: string, fechada: boolean): string {
  const marca = fechada ? '`[X]`' : '`[ ]`'
  return `| ${id} | ${descricao} | - | \`[//]\` | \`${alvo}\` | CONFIRMADO | ${marca} |`
}

/** Um `actions.md` de uma fase só, com as linhas dadas. */
function arquivo(linhas: string[], titulo = '## Fase 1, Preparação'): string {
  return ['# Actions: fixtura', '', titulo, '', CABECALHO, SEPARADOR, ...linhas, ''].join('\n')
}

const DUAS = arquivo([
  linha('T001', 'primeira ação', 'src/a.ts', true),
  linha('T002', 'segunda ação', 'src/b.ts', false),
])

describe('cabeçalho reconhecido pela forma normalizada (D-09)', () => {
  it('lê as células por posição e devolve a ação inteira', () => {
    const lido = readDecomposition(DUAS, 2)

    expect(lido.lida).toBe(true)
    expect(lido.origem).toBe('tabela')
    expect(lido.acoes).toHaveLength(2)
    expect(lido.acoes[0]).toEqual({
      id: 'T001',
      descricao: 'primeira ação',
      fase: 'Fase 1, Preparação',
      emenda: false,
      fechada: true,
      arquivoAlvo: 'src/a.ts',
    })
  })

  it('casa o cabeçalho sem acento, em caixa alta e com espaço a mais', () => {
    const divergente = DUAS.replace(
      CABECALHO,
      '|  ID  |  DESCRICAO  |  DEPENDENCIAS  |  PARALELISMO  |  ARQUIVO ALVO  |  CONFIDENCIA  |  STATUS  |',
    )
    const lido = readDecomposition(divergente, 2)

    expect(lido.origem).toBe('tabela')
    expect(lido.acoes.map((a) => a.id)).toEqual(['T001', 'T002'])
  })

  it('lê a situação do marcador da própria linha, nunca de campo declarado (RN-04)', () => {
    const lido = readDecomposition(DUAS, 2)
    expect(lido.acoes.map((a) => a.fechada)).toEqual([true, false])
  })

  it('herda a fase do título de segundo nível sob o qual a linha estava', () => {
    const duasFases = [
      '# Actions',
      '',
      '## Fase 1, Preparação',
      '',
      CABECALHO,
      SEPARADOR,
      linha('T001', 'uma', 'src/a.ts', true),
      '',
      '## Fase 3, Núcleo',
      '',
      CABECALHO,
      SEPARADOR,
      linha('T002', 'outra', 'src/b.ts', false),
      '',
    ].join('\n')
    const lido = readDecomposition(duasFases, 2)

    expect(lido.acoes.map((a) => a.fase)).toEqual(['Fase 1, Preparação', 'Fase 3, Núcleo'])
  })

  it('preserva a ordem do arquivo, que é a ordem do plano', () => {
    const lido = readDecomposition(DUAS, 2)
    expect(lido.acoes.map((a) => a.id)).toEqual(['T001', 'T002'])
  })

  it('declara ausente o arquivo alvo escrito como travessão', () => {
    const semAlvo = arquivo(['| T001 | uma | - | - | - | CONFIRMADO | `[X]` |'])
    expect(readDecomposition(semAlvo, 1).acoes[0]?.arquivoAlvo).toBeNull()
  })
})

describe('queda para varredura linha a linha (D-09)', () => {
  it('lê as ações quando o cabeçalho tem outro número de colunas', () => {
    const curta = [
      '# Actions',
      '',
      '## Fase 1, Preparação',
      '',
      '| ID | Descrição | Status |',
      '|----|-----------|--------|',
      '| T001 | uma | `[X]` |',
      '| T002 | outra | `[ ]` |',
      '',
    ].join('\n')
    const lido = readDecomposition(curta, 2)

    expect(lido.origem).toBe('varredura')
    expect(lido.acoes.map((a) => a.id)).toEqual(['T001', 'T002'])
    expect(lido.acoes.map((a) => a.fechada)).toEqual([true, false])
    expect(lido.acoes[0]?.descricao).toBe('uma')
  })

  it('a varredura ainda herda a fase, que não depende do cabeçalho', () => {
    const curta = [
      '# Actions',
      '',
      '## Fase 3, Núcleo',
      '',
      '| ID | Descrição | Status |',
      '|--|--|--|',
      '| T001 | uma | `[ ]` |',
      '',
    ].join('\n')
    expect(readDecomposition(curta, 1).acoes[0]?.fase).toBe('Fase 3, Núcleo')
  })

  it('a lista nunca fica vazia por causa de um cabeçalho diferente', () => {
    const curta = '# Actions\n\n## Fase 1\n\n| A | B |\n|--|--|\n| T001 | `[ ]` |\n'
    expect(readDecomposition(curta, 1).acoes.length).toBeGreaterThan(0)
  })
})

describe('a seção de emendas (RN-05)', () => {
  const COM_EMENDA = [
    DUAS,
    '## Emendas',
    '',
    CABECALHO,
    SEPARADOR,
    linha('E001', 'ajuste pedido depois', 'src/c.ts', false),
    '',
  ].join('\n')

  it('marca como emenda a linha que veio da seção de emendas', () => {
    const lido = readDecomposition(COM_EMENDA, 3)
    const emenda = lido.acoes.find((a) => a.id === 'E001')

    expect(emenda?.emenda).toBe(true)
    expect(lido.acoes.filter((a) => a.emenda)).toHaveLength(1)
  })

  it('a emenda aberta é ação aberta, sem tratamento à parte', () => {
    const lido = readDecomposition(COM_EMENDA, 3)
    expect(lido.acoes.filter((a) => !a.fechada).map((a) => a.id)).toEqual(['T002', 'E001'])
  })

  it('nenhuma linha do corpo é marcada como emenda', () => {
    expect(readDecomposition(DUAS, 2).acoes.every((a) => !a.emenda)).toBe(true)
  })
})

describe('divergência contra a contagem herdada (D-08, RF-14)', () => {
  it('não declara divergência quando os dois números batem', () => {
    expect(readDecomposition(DUAS, 2).divergencia).toBeNull()
  })

  it('declara os dois números quando discordam, sem escolher entre eles', () => {
    const lido = readDecomposition(DUAS, 5)
    expect(lido.divergencia).toEqual({ contadas: 5, listadas: 2 })
  })

  it('a lista jamais altera a contagem herdada, que segue autoridade', () => {
    const lido = readDecomposition(DUAS, 44)
    expect(lido.divergencia?.contadas).toBe(44)
    expect(lido.acoes).toHaveLength(2)
  })
})

describe('ausência e borda', () => {
  it('arquivo ausente é leitura não realizada, e não ausência de ações', () => {
    const lido = readDecomposition(null, 0)
    expect(lido).toEqual({ lida: false, origem: 'ausente', acoes: [], divergencia: null })
  })

  it('arquivo presente sem ação alguma é leitura realizada e lista vazia', () => {
    const lido = readDecomposition('# Actions\n\nsó prosa, nenhuma tabela\n', 0)
    expect(lido.lida).toBe(true)
    expect(lido.acoes).toEqual([])
  })

  it('não lança diante de arquivo estranho', () => {
    for (const md of ['', '|||||', '## \n\n| | |', ' ']) {
      expect(() => readDecomposition(md, 0)).not.toThrow()
    }
  })

  it('linha sem identificador não vira ação sem nome', () => {
    const semId = arquivo(['|  | sem id | - | - | - | CONFIRMADO | `[X]` |'])
    expect(readDecomposition(semId, 0).acoes).toEqual([])
  })
})
