/**
 * O auxiliar que adoece o eixo da descoberta para o preview (T031, RF-01,
 * RF-05, RF-07, RF-11, RN-02).
 *
 * O que se confere aqui não é a tela: é que cada um dos quatro casos produz DE
 * FATO o estado que promete quando a leitura de verdade passa por cima da
 * cópia. Um auxiliar que plantasse o estado errado adoeceria o eixo pelo
 * motivo errado, e quem conferisse a tela estaria conferindo outra coisa.
 *
 * O julgamento vem do `readWorkspace` inteiro, e não do domínio sozinho, por
 * uma razão: o caso que mais importa é o da absorção, e a absorção casa uma
 * anomalia que só a camada herdada produz. Julgar o eixo isolado provaria o
 * que a suíte do domínio já prova, e não provaria o encontro.
 *
 * A cópia sai numa pasta temporária do sistema, a partir de um workspace
 * mínimo que este arquivo monta, e é apagada ao fim. Nada do repositório é
 * tocado.
 * @module tests/preview-descoberta
 */

import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import { composeAnomalies } from '../src/webview/domain/anomalies-view.ts'
import { readWorkspace } from '../src/host/reading.ts'
import type { ReadingResult } from '../src/host/reading.ts'
import { CANONICAS, CASOS, ESTADO, principal } from '../scripts/estragar-descoberta.js'
import { payloadFixture } from './helpers/reversa-fixtures.ts'

/** As cópias e as origens feitas nesta suíte, para apagá-las ao fim. */
const feitas: string[] = []

/** Um workspace mínimo, saudável, com o Reversa instalado e a extração em curso. */
function origem(): string {
  const raiz = mkdtempSync(path.join(tmpdir(), 'reversa-views-origem-descoberta-'))
  feitas.push(raiz)
  mkdirSync(path.join(raiz, '.reversa'), { recursive: true })
  // O contrato de política entra porque a sua ausência é anomalia, e um
  // controle que já nasce com anomalia não serve de controle.
  writeFileSync(
    path.join(raiz, '.reversa', 'reversa-config.json'),
    `${JSON.stringify({ version: 1, allowLegacyEdits: false, allowedPaths: [] }, null, 2)}\n`,
  )
  writeFileSync(
    path.join(raiz, ESTADO),
    `${JSON.stringify(
      {
        version: '1.3.3',
        project: 'origem',
        output_folder: '_reversa_sdd',
        phase: 'revisao',
        completed: CANONICAS.slice(0, 4),
        pending: ['revisao'],
        checkpoints: {
          scout: { completed_at: '2026-09-01T10:00:00Z', files: ['_reversa_sdd/inventory.md'] },
        },
      },
      null,
      2,
    )}\n`,
  )
  return raiz
}

/** Roda o auxiliar sobre um workspace, devolvendo o caminho da cópia. */
function estragar(caso: string, raiz: string): string {
  const saidas: string[] = []
  const escrever = process.stdout.write.bind(process.stdout)
  const silenciar = process.stderr.write.bind(process.stderr)
  process.stdout.write = ((texto: string) => {
    saidas.push(texto)
    return true
  }) as typeof process.stdout.write
  process.stderr.write = (() => true) as typeof process.stderr.write

  let codigo: number
  try {
    codigo = principal([`--workspace=${raiz}`, `--caso=${caso}`], raiz)
  } finally {
    process.stdout.write = escrever
    process.stderr.write = silenciar
  }

  expect(codigo).toBe(0)
  const copia = saidas.join('').trim()
  feitas.push(copia)
  return copia
}

/** A leitura do host sobre um workspace, que é a que o painel recebe. */
function ler(raiz: string): Extract<ReadingResult, { kind: 'loaded' }> {
  const resultado = readWorkspace(raiz, { log: { write: () => undefined } })
  if (resultado.kind !== 'loaded') throw new Error(`a leitura falhou: ${resultado.message}`)
  return resultado
}

/** Roda o auxiliar e devolve a leitura da cópia. */
function estragado(caso: string): Extract<ReadingResult, { kind: 'loaded' }> {
  return ler(estragar(caso, origem()))
}

/** A lista que o painel desenha, que é a composição e não a soma crua. */
function naTela(lido: Extract<ReadingResult, { kind: 'loaded' }>) {
  return composeAnomalies(
    payloadFixture({ process: lido.process, discoveryState: lido.discoveryState }),
  )
}

afterAll(() => {
  for (const pasta of feitas) rmSync(pasta, { recursive: true, force: true })
})

describe('o auxiliar, antes de tocar em disco', () => {
  it('sabe produzir os cinco estados que um projeto saudável não produz', () => {
    // O quinto entrou com a feature 012, para a quarta situação do checkpoint.
    expect(CASOS).toEqual([
      'fase-estranha',
      'parcial',
      'terminal-e-estranha',
      'saidas-nao-canonicas',
      'falha',
    ])
  })

  it('recusa caso que não existe, sem copiar coisa alguma', () => {
    const erros: string[] = []
    const anterior = process.stderr.write.bind(process.stderr)
    process.stderr.write = ((texto: string) => {
      erros.push(texto)
      return true
    }) as typeof process.stderr.write
    try {
      expect(principal(['--caso=torto'], origem())).toBe(1)
    } finally {
      process.stderr.write = anterior
    }
    expect(erros.join('')).toContain('caso inválido')
  })

  it('recusa workspace sem o ponteiro da extração, nomeando o arquivo que falta', () => {
    const vazio = mkdtempSync(path.join(tmpdir(), 'reversa-views-sem-reversa-'))
    feitas.push(vazio)
    const erros: string[] = []
    const anterior = process.stderr.write.bind(process.stderr)
    process.stderr.write = ((texto: string) => {
      erros.push(texto)
      return true
    }) as typeof process.stderr.write
    try {
      expect(principal([`--workspace=${vazio}`, '--caso=parcial'], vazio)).toBe(1)
    } finally {
      process.stderr.write = anterior
    }
    expect(erros.join('')).toContain(ESTADO)
  })

  it('o workspace de origem, intacto, é o projeto saudável que os casos adoecem', () => {
    const lido = ler(origem())
    expect(lido.discoveryState.extracao).toEqual({ situacao: 'em-curso', bruto: 'revisao' })
    expect(lido.discoveryState.anomalias).toEqual([])
    expect(lido.discoveryState.absorvidas).toEqual([])
    expect(naTela(lido)).toEqual([])
  })
})

describe('a cópia sai fora do repositório, e a origem não é tocada', () => {
  it('escreve em pasta temporária do sistema, e não no workspace de origem', () => {
    const raiz = origem()
    const antes = readFileSync(path.join(raiz, ESTADO), 'utf8')
    const copia = estragar('terminal-e-estranha', raiz)

    expect(copia.startsWith(tmpdir())).toBe(true)
    expect(copia.startsWith(path.resolve(__dirname, '..'))).toBe(false)
    expect(readFileSync(path.join(raiz, ESTADO), 'utf8')).toBe(antes)
    expect(readFileSync(path.join(copia, ESTADO), 'utf8')).not.toBe(antes)
  })

  it('a cópia preserva a identidade do original e troca só o que o eixo lê', () => {
    const copia = estragar('parcial', origem())
    const estado = JSON.parse(readFileSync(path.join(copia, ESTADO), 'utf8'))

    expect(estado.version).toBe('1.3.3')
    expect(estado.project).toBe('origem')
    expect(estado.output_folder).toBe('_reversa_sdd')
    expect(estado.phase).toBe('escavacao')
  })
})

describe('cada caso produz o estado que promete', () => {
  it('fase-estranha: extração em curso sob nome desconhecido, e a anomalia continua na tela', () => {
    const lido = estragado('fase-estranha')

    expect(lido.discoveryState.extracao).toEqual({ situacao: 'em-curso', bruto: 're-extracao-005' })
    expect(lido.discoveryState.absorvidas).toEqual([])
    expect(naTela(lido)).toEqual([
      expect.objectContaining({ code: 'fase-desconhecida', detail: 're-extracao-005' }),
    ])
  })

  it('parcial: o checkpoint sem completed_at e com pendentes é trabalho em curso, sem anomalia', () => {
    const lido = estragado('parcial')
    const situacoes = Object.fromEntries(
      lido.discoveryState.checkpoints.map((checkpoint) => [checkpoint.agent, checkpoint.situacao]),
    )

    expect(situacoes).toEqual({ scout: 'concluido', archaeologist: 'em-andamento' })
    expect(lido.discoveryState.anomalias).toEqual([])
    expect(naTela(lido)).toEqual([])
  })

  it('terminal-e-estranha: a absorção casa a tripla, e sobra a anomalia do nome estranho', () => {
    const lido = estragado('terminal-e-estranha')

    expect(lido.discoveryState.extracao).toEqual({ situacao: 'encerrada', bruto: 'concluido' })
    // A camada herdada reporta o disco inteiro: as duas anomalias de fase
    // continuam em `process`, e o desconto acontece só na composição.
    expect(lido.process.anomalies.filter((a) => a.code === 'fase-desconhecida')).toHaveLength(2)
    expect(lido.discoveryState.absorvidas).toEqual([
      { file: ESTADO, code: 'fase-desconhecida', detail: 'concluido' },
    ])
    expect(naTela(lido)).toEqual([
      expect.objectContaining({ code: 'fase-desconhecida', detail: 'documentacao' }),
    ])
  })

  it('saidas-nao-canonicas: os campos de lista são nomeados, e a lista de arquivos continua vazia', () => {
    const lido = estragado('saidas-nao-canonicas')
    const writer = lido.discoveryState.checkpoints.find((c) => c.agent === 'writer')
    const reviewer = lido.discoveryState.checkpoints.find((c) => c.agent === 'reviewer')

    expect(writer).toEqual({
      agent: 'writer',
      situacao: 'conclusao-nao-declarada',
      instante: null,
      camposComLista: ['achados', 'arquivos_canonicos'],
      // Nulo porque a situação não veio de par aprovado algum, e é assim que a
      // feature 012 deixa intacto o que a 011 lia (RF-15).
      reconhecidoPor: null,
    })
    expect(lido.process.discovery.checkpoints.find((c) => c.agent === 'writer')?.files).toEqual([])
    // O checkpoint com `files` não sinaliza campo algum, ainda que carregue um.
    expect(reviewer?.camposComLista).toEqual([])
    expect(naTela(lido)).toEqual([
      expect.objectContaining({
        code: 'checkpoint-sem-conclusao-declarada',
        detail: 'writer: sem completed_at',
      }),
    ])
  })
})

/**
 * O quinto caso, da feature 012: o checkpoint que terminou mal.
 *
 * Ele existe porque a quarta situação só seria conferível na tela se algum
 * projeto real tivesse falhado, e nenhum dos sessenta e quatro medidos falhou.
 * Fabricá-lo sobre cópia é o mesmo regime dos quatro casos anteriores, e a
 * origem continua intocada ao fim.
 */
describe('o caso da falha (feature 012)', () => {
  it('planta um checkpoint que declara fracasso fora do esquema', () => {
    const copia = estragar('falha', origem())
    const estado = JSON.parse(readFileSync(path.join(copia, ESTADO), 'utf8')) as {
      checkpoints: Record<string, Record<string, unknown>>
    }

    const falhos = Object.values(estado.checkpoints).filter((entrada) => entrada.status === 'failed')
    expect(falhos).toHaveLength(1)
    expect(falhos[0]).not.toHaveProperty('completed_at')
  })

  it('sem par aprovado, o checkpoint da falha sai em conclusão não declarada', () => {
    const leitura = ler(estragar('falha', origem()))

    expect(leitura.discoveryState.checkpoints.some((c) => c.situacao === 'falhou')).toBe(false)
    expect(leitura.discoveryState.anomalias.some((a) => a.detail?.includes('sem completed_at'))).toBe(true)
  })

  it('preserva o original, como os quatro casos anteriores', () => {
    const raiz = origem()
    const antes = readFileSync(path.join(raiz, ESTADO), 'utf8')
    estragar('falha', raiz)

    expect(readFileSync(path.join(raiz, ESTADO), 'utf8')).toBe(antes)
  })
})
