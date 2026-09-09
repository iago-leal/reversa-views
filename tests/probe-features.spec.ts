/**
 * The local probe over the feature folders (RF-09, RNF de desempenho, D-06).
 *
 * Ela existe porque a sonda herdada lê a feature ATIVA, e só ela. Percorrer as
 * demais é trabalho novo, e ele foi escrito reutilizando as três funções de
 * leitura que a sonda herdada já exporta, de modo que `node:fs` continua num
 * arquivo só e nenhum arquivo vendorizado precisou mudar.
 *
 * A suíte trabalha sobre pastas de verdade, numa árvore temporária, porque o
 * que se verifica aqui é justamente o encontro com o disco: ordem de nome,
 * teto, ausência e contenção na raiz.
 * @module tests/probe-features
 */

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { FEATURE_FOLDER_CAP } from '../src/domain/limits.ts'
import { readFeatureFolders } from '../src/probe/features.ts'

const FORWARD = '_reversa_forward'
const criadas: string[] = []

afterEach(() => {
  while (criadas.length > 0) rmSync(criadas.pop() as string, { recursive: true, force: true })
})

/** Uma raiz temporária com as pastas de feature pedidas, cada uma com seus arquivos. */
function raizCom(pastas: Record<string, Record<string, string>>): string {
  const raiz = mkdtempSync(join(tmpdir(), 'reversa-features-'))
  criadas.push(raiz)
  mkdirSync(join(raiz, FORWARD), { recursive: true })
  for (const [nome, arquivos] of Object.entries(pastas)) {
    const pasta = join(raiz, FORWARD, nome)
    mkdirSync(pasta, { recursive: true })
    for (const [arquivo, conteúdo] of Object.entries(arquivos)) {
      writeFileSync(join(pasta, arquivo), conteúdo, 'utf8')
    }
  }
  return raiz
}

/** Uma raiz vazia, sem sequer a pasta do ciclo forward. */
function raizVazia(): string {
  const raiz = mkdtempSync(join(tmpdir(), 'reversa-features-'))
  criadas.push(raiz)
  return raiz
}

describe('percurso em ordem de nome (RF-09)', () => {
  it('devolve as pastas em ordem crescente de nome, seja qual for a de criação', () => {
    const raiz = raizCom({ '003-c': {}, '001-a': {}, '002-b': {} })
    const lido = readFeatureFolders({ root: raiz, forwardFolder: FORWARD })

    expect(lido.pastas.map((p) => p.nome)).toEqual(['001-a', '002-b', '003-c'])
  })

  it('nomeia cada pasta pelo caminho relativo à raiz observada, que é o que abre no editor', () => {
    const raiz = raizCom({ '001-a': {} })
    const lido = readFeatureFolders({ root: raiz, forwardFolder: FORWARD })

    expect(lido.pastas[0]?.pasta).toBe(`${FORWARD}/001-a`)
  })

  it('lê os três arquivos de cada pasta, e declara ausente o que não existe', () => {
    const raiz = raizCom({
      '001-a': { 'actions.md': '# ações', 'progress.jsonl': '{"action":"T001"}\n' },
      '002-b': {},
    })
    const lido = readFeatureFolders({ root: raiz, forwardFolder: FORWARD })

    expect(lido.pastas[0]?.actionsMd).toBe('# ações')
    expect(lido.pastas[0]?.progressJsonl).toBe('{"action":"T001"}\n')
    expect(lido.pastas[0]?.requirementsMd).toBeNull()
    expect(lido.pastas[1]?.actionsMd).toBeNull()
  })

  it('ignora o que não é pasta, sem contá-lo como feature', () => {
    const raiz = raizCom({ '001-a': {} })
    writeFileSync(join(raiz, FORWARD, 'LEIA-ME.md'), 'solto', 'utf8')
    const lido = readFeatureFolders({ root: raiz, forwardFolder: FORWARD })

    expect(lido.pastas.map((p) => p.nome)).toEqual(['001-a'])
    expect(lido.total).toBe(1)
  })
})

describe('teto de pastas por leitura (RNF de desempenho)', () => {
  it('o teto é o mesmo número que o módulo de limites declara', () => {
    expect(FEATURE_FOLDER_CAP).toBe(50)
  })

  it('percorre no máximo o teto, e relata o truncamento', () => {
    const pastas: Record<string, Record<string, string>> = {}
    for (let i = 1; i <= FEATURE_FOLDER_CAP + 3; i += 1) {
      pastas[`${String(i).padStart(3, '0')}-feature`] = {}
    }
    const raiz = raizCom(pastas)
    const lido = readFeatureFolders({ root: raiz, forwardFolder: FORWARD })

    expect(lido.pastas).toHaveLength(FEATURE_FOLDER_CAP)
    expect(lido.truncado).toBe(true)
    expect(lido.total).toBe(FEATURE_FOLDER_CAP + 3)
  })

  it('abaixo do teto não declara truncamento, e o total bate com o lido', () => {
    const raiz = raizCom({ '001-a': {}, '002-b': {} })
    const lido = readFeatureFolders({ root: raiz, forwardFolder: FORWARD })

    expect(lido.truncado).toBe(false)
    expect(lido.total).toBe(2)
    expect(lido.pastas).toHaveLength(2)
  })
})

describe('ausência e contenção', () => {
  it('pasta do ciclo forward ausente devolve leitura vazia, sem lançar', () => {
    const raiz = raizVazia()
    const lido = readFeatureFolders({ root: raiz, forwardFolder: FORWARD })

    expect(lido).toEqual({ pastas: [], truncado: false, total: 0 })
  })

  it('pasta do ciclo forward vazia devolve lista vazia, e não erro', () => {
    const raiz = raizCom({})
    expect(readFeatureFolders({ root: raiz, forwardFolder: FORWARD })).toEqual({
      pastas: [],
      truncado: false,
      total: 0,
    })
  })

  it('recusa o caminho que escapa da raiz observada', () => {
    const raiz = raizCom({ '001-a': {} })
    for (const escapada of ['../fora', '/etc', '..']) {
      expect(readFeatureFolders({ root: raiz, forwardFolder: escapada })).toEqual({
        pastas: [],
        truncado: false,
        total: 0,
      })
    }
  })

  it('não lança diante de pasta declarada em branco', () => {
    const raiz = raizCom({ '001-a': {} })
    expect(() => readFeatureFolders({ root: raiz, forwardFolder: '' })).not.toThrow()
  })
})
