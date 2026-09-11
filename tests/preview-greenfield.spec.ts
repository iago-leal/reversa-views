/**
 * O auxiliar que adoece o eixo greenfield para o preview (T042, RF-15, RN-02,
 * RN-08, D-11).
 *
 * O que se confere aqui não é a tela: é que cada um dos seis casos produz DE
 * FATO o estado que promete quando a leitura de verdade passa por cima da
 * cópia. Um auxiliar que plantasse o estado errado adoeceria o eixo pelo
 * motivo errado, e quem conferisse a tela estaria conferindo outra coisa.
 *
 * A cópia sai numa pasta temporária do sistema, a partir de um workspace mínimo
 * que este arquivo monta, e é apagada ao fim. Nada do repositório é tocado.
 * @module tests/preview-greenfield
 */

import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import { readGreenfield } from '../src/domain/greenfield.ts'
import { SPEC_CAP } from '../src/domain/limits.ts'
import { EMPTY_HISTORY } from '../src/domain/types.ts'
import type { GreenfieldAxis } from '../src/domain/types.ts'
import { blockingReasons } from '../src/webview/domain/blocking.ts'
import { readGreenfieldArtifacts } from '../src/probe/greenfield.ts'
import { ACIMA_DO_TETO, CASOS, principal } from '../scripts/estragar-greenfield.js'
import { processFixture } from './helpers/reversa-fixtures.ts'

const SAIDA = '_reversa_sdd'

/** As cópias feitas nesta suíte, para apagá-las ao fim. */
const feitas: string[] = []

/** Um workspace mínimo que nasceu por /reversa-new e chegou às specs. */
function origem(): string {
  const raiz = mkdtempSync(path.join(tmpdir(), 'reversa-views-origem-'))
  feitas.push(raiz)
  const escrever = (rel: string, texto: string) => {
    mkdirSync(path.join(raiz, path.dirname(rel)), { recursive: true })
    writeFileSync(path.join(raiz, rel), texto)
  }
  escrever(
    '.reversa/state.json',
    JSON.stringify({
      version: '1.3.3',
      project: 'origem',
      newproject_progress: {
        mode: 'guiado',
        stage: 'done',
        started_at: '2026-01-01T10:00:00Z',
        last_checkpoint_at: '2026-01-01T11:00:00Z',
        completed_stages: ['ideator', 'researcher', 'drafter', 'spec-sdd'],
        brief: 'um projeto mínimo.',
      },
    }),
  )
  escrever(`${SAIDA}/newproject-brief.md`, '# Brief\n\n## Ideia original\nUm projeto mínimo.\n')
  escrever(`${SAIDA}/ideation.md`, '# Ideação\n')
  escrever(`${SAIDA}/personas.md`, '# Personas\n')
  escrever(`${SAIDA}/prd.md`, '# PRD\n\n## 4. Escopo (in)\n\n- 🟡 Painel: o cartão.\n')
  escrever(`${SAIDA}/sdd/painel.md`, '# Spec\n')
  return raiz
}

/** Roda o auxiliar sobre um workspace mínimo e julga o eixo da cópia. */
function estragado(caso: string): GreenfieldAxis {
  const raiz = origem()
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
  const estado = path.join(copia, '.reversa', 'state.json')
  return readGreenfield({
    lido: readGreenfieldArtifacts({ root: copia, outputFolder: SAIDA }),
    stateJson: existsSync(estado) ? readFileSync(estado, 'utf8') : null,
    history: EMPTY_HISTORY,
    outputFolder: SAIDA,
  })
}

afterAll(() => {
  for (const pasta of feitas) rmSync(pasta, { recursive: true, force: true })
})

describe('o auxiliar, antes de tocar em disco', () => {
  it('sabe produzir os seis estados que este projeto, saudável, não produz', () => {
    expect(CASOS).toEqual(['sem-ancora', 'parcial', 'divergente', 'sdd-vazio', 'sem-escopo', 'teto'])
  })

  it('planta, no caso do teto, mais specs do que o teto da leitura', () => {
    expect(ACIMA_DO_TETO).toBeGreaterThan(SPEC_CAP)
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

  it('o workspace de origem, intacto, é o projeto saudável que os casos adoecem', () => {
    const raiz = origem()
    const eixo = readGreenfield({
      lido: readGreenfieldArtifacts({ root: raiz, outputFolder: SAIDA }),
      stateJson: readFileSync(path.join(raiz, '.reversa', 'state.json'), 'utf8'),
      history: EMPTY_HISTORY,
      outputFolder: SAIDA,
    })
    expect(eixo.cenario).toBe('greenfield')
    expect(eixo.estagio).toBe('especificado')
    expect(eixo.anomalias).toEqual([])
  })
})

describe('cada caso produz o estado que promete', () => {
  it('sem-ancora: nada do /reversa-new sobra, sem anomalia e sem razão na faixa', () => {
    const eixo = estragado('sem-ancora')
    expect(eixo.cenario).toBe('sem-ancora')
    expect(eixo.estagio).toBe('ausente')
    expect(eixo.metadado).toBeNull()
    expect(eixo.anomalias).toEqual([])
    expect(blockingReasons(processFixture(), undefined, eixo)).toEqual([])
  })

  it('parcial: a pipeline para nas personas e a faixa pede o redator', () => {
    const eixo = estragado('parcial')
    expect(eixo.estagio).toBe('pesquisado')
    expect(eixo.anomalias).toEqual([])
    const razoes = blockingReasons(processFixture(), undefined, eixo)
    expect(razoes.map((r) => r.command)).toEqual(['/reversa-drafter'])
  })

  it('divergente: o disco está inteiro e o metadado diz outra coisa', () => {
    const eixo = estragado('divergente')
    expect(eixo.estagio).toBe('especificado')
    expect(eixo.anomalias.map((a) => a.code)).toEqual(['estagio-greenfield-divergente'])
  })

  it('sdd-vazio: PRD sem decomposição, e a faixa pede o /reversa-spec-sdd', () => {
    const eixo = estragado('sdd-vazio')
    expect(eixo.estagio).toBe('redigido')
    expect(eixo.panorama.totalDeSpecs).toBe(0)
    expect(eixo.anomalias).toEqual([])
    expect(blockingReasons(processFixture(), undefined, eixo)[0]?.command).toBe('/reversa-spec-sdd')
  })

  it('sem-escopo: o PRD existe e a seção não, e a anomalia nomeia o arquivo', () => {
    const eixo = estragado('sem-escopo')
    expect(eixo.panorama.escopoEncontrado).toBe(false)
    expect(eixo.anomalias).toEqual([
      expect.objectContaining({ code: 'escopo-do-prd-nao-encontrado', file: `${SAIDA}/prd.md` }),
    ])
  })

  it('teto: existem mais specs do que se leu, e a leitura diz que parou', () => {
    const eixo = estragado('teto')
    expect(eixo.panorama.truncado).toBe(true)
    expect(eixo.panorama.totalDeSpecs).toBe(ACIMA_DO_TETO + 1)
    expect(eixo.panorama.componentes).toHaveLength(SPEC_CAP)
  })
})
