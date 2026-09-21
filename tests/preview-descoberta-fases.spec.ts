/**
 * Os três estados doentes da feature 015 (RF-18), conferidos contra a leitura
 * REAL do host sobre a cópia que o auxiliar produz, no molde de
 * `preview-descoberta.spec.ts`. O mapa é o vigente: o preview mostra o que o
 * painel mostraria hoje, e por isso a etapa do primeiro caso não está aprovada.
 * @module tests/preview-descoberta-fases
 */

import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import { readWorkspace } from '../src/host/reading.ts'
import type { ReadingResult } from '../src/host/reading.ts'
import { composeAnomalies } from '../src/webview/domain/anomalies-view.ts'
import { cycleSentence, undeclaredClosureSentence } from '../src/webview/domain/labels.ts'
import { CANONICAS, CASOS, CASOS_DAS_FASES, ESTADO, FORMAS, TODOS_OS_CASOS, principal } from '../scripts/estragar-descoberta.js'
import { payloadFixture } from './helpers/reversa-fixtures.ts'

type Lido = Extract<ReadingResult, { kind: 'loaded' }>

const feitas: string[] = []
const SEM_ETAPAS = { pares: [], naoAgentes: [] }

/** Um workspace mínimo e saudável, com a política declarada para não nascer com anomalia. */
function origem(): string {
  const raiz = mkdtempSync(path.join(tmpdir(), 'reversa-views-origem-fases-'))
  feitas.push(raiz)
  mkdirSync(path.join(raiz, '.reversa'), { recursive: true })
  writeFileSync(
    path.join(raiz, '.reversa', 'reversa-config.json'),
    `${JSON.stringify({ version: 1, allowLegacyEdits: false, allowedPaths: [] }, null, 2)}\n`,
  )
  writeFileSync(
    path.join(raiz, ESTADO),
    `${JSON.stringify({ version: '1.3.3', project: 'origem', output_folder: '_reversa_sdd', phase: 'revisao', completed: CANONICAS.slice(0, 4), pending: ['revisao'], checkpoints: {} }, null, 2)}\n`,
  )
  return raiz
}

/** Roda o auxiliar, calado, e devolve a leitura do host sobre a cópia e o original. */
function estragado(caso: string): { lido: Lido; original: string; raiz: string } {
  const raiz = origem()
  const original = readFileSync(path.join(raiz, ESTADO), 'utf8')
  const saidas: string[] = []
  const escrever = process.stdout.write.bind(process.stdout)
  const reclamar = process.stderr.write.bind(process.stderr)
  process.stdout.write = ((texto: string) => (saidas.push(texto), true)) as typeof process.stdout.write
  process.stderr.write = (() => true) as typeof process.stderr.write
  let codigo: number
  try {
    codigo = principal([`--workspace=${raiz}`, `--caso=${caso}`], raiz)
  } finally {
    process.stdout.write = escrever
    process.stderr.write = reclamar
  }
  expect(codigo).toBe(0)

  const copia = saidas.join('').trim()
  feitas.push(copia)
  const lido = readWorkspace(copia, { log: { write: () => undefined }, equivalencias: SEM_ETAPAS })
  if (lido.kind !== 'loaded') throw new Error(`a leitura falhou: ${lido.message}`)
  return { lido, original, raiz }
}

/** O que o painel desenha sobre o arquivo de estado. */
function naTela(lido: Lido): { code: string; detail?: string }[] {
  return composeAnomalies(payloadFixture({ process: lido.process, discoveryState: lido.discoveryState })).filter(
    (anomalia) => anomalia.file === ESTADO,
  )
}

afterAll(() => {
  for (const pasta of feitas) rmSync(pasta, { recursive: true, force: true })
})

describe('o inventário', () => {
  it('cresce por acréscimo: os cinco casos anteriores ficam onde estavam, e os três novos têm lista própria', () => {
    expect(CASOS).toHaveLength(5)
    expect(CASOS_DAS_FASES).toEqual(['ciclo-com-etapa', 'encerramento-com-pendencia', 'encerrada-sem-declaracao'])
    expect(TODOS_OS_CASOS).toEqual([...CASOS, ...CASOS_DAS_FASES])
    for (const caso of TODOS_OS_CASOS) expect(FORMAS[caso]?.relato, caso).toEqual(expect.any(String))
  })
})

describe('ciclo com etapa não aprovada', () => {
  const { lido } = estragado('ciclo-com-etapa')

  it('declara o segundo ciclo, com as cinco fases na situação dele', () => {
    expect(cycleSentence(lido.discoveryState)).toContain('Ciclo 2')
    expect(lido.discoveryState.ciclo?.fases.map((f) => f.status)).toEqual(['done', 'current', 'pending', 'pending', 'pending'])
  })

  it('deixa na tela exatamente uma anomalia de fase, a da etapa que espera aprovação', () => {
    expect(naTela(lido)).toEqual([{ file: ESTADO, code: 'fase-desconhecida', detail: 'reconciliacao' }])
    expect('etapas' in lido.discoveryState).toBe(false)
  })
})

describe('encerrada com pendência', () => {
  const { lido } = estragado('encerramento-com-pendencia')

  it('lê como encerrada, e nomeia o defeito numa anomalia só', () => {
    expect(lido.discoveryState.extracao).toEqual({ situacao: 'encerrada', bruto: 'concluido-c3' })
    expect(naTela(lido)).toEqual([
      {
        file: ESTADO,
        code: 'encerramento-com-pendencia',
        detail: 'concluido-c3: pending ainda lista escavacao-c3, interpretacao-c3, geracao-c3, revisao-c3',
      },
    ])
  })
})

describe('encerrada sem declaração', () => {
  const { lido, original, raiz } = estragado('encerrada-sem-declaracao')

  it('lê a situação nova, com a frase própria, e não deixa anomalia alguma na tela', () => {
    expect(lido.discoveryState.extracao.situacao).toBe('encerrada-sem-declaracao')
    expect(undeclaredClosureSentence(lido.discoveryState)).toContain('parou na fase revisao')
    expect(naTela(lido)).toEqual([])
  })

  it('adoece a CÓPIA: o workspace de origem fica como estava', () => {
    expect(readFileSync(path.join(raiz, ESTADO), 'utf8')).toBe(original)
  })
})
