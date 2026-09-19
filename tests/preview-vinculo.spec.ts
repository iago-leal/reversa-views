/**
 * O auxiliar que adoece o vínculo e as conferências para o preview (feature
 * 010, RF-14, D-18).
 *
 * O que se confere aqui não é a tela: é que cada um dos cinco casos produz DE
 * FATO o estado que o `onboarding.md` da feature promete quando a leitura de
 * verdade, a mesma que o host chama, passa por cima da cópia. A origem é este
 * repositório, e a suíte prova que ele sai intocado e que a cópia fica fora
 * dele.
 * @module tests/preview-vinculo
 */

import { createHash } from 'node:crypto'
import { readFileSync, readdirSync, rmSync, statSync } from 'node:fs'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { REVERSA_FILE_CAP } from '../src/heranca/reversa-probe/src/index.ts'
import { readWorkspace } from '../src/host/reading.ts'
import type { ReadingResult } from '../src/host/reading.ts'
import { blockingReasons } from '../src/webview/domain/blocking.ts'
import { ACIMA_DO_TETO, CASOS, PREFIXO, SEM_SPEC, principal } from '../scripts/estragar-vinculo.js'

const RAIZ = path.resolve(__dirname, '..')

/** As cópias feitas nesta suíte, para apagá-las ao fim. */
const feitas: string[] = []

/** A impressão digital das duas pastas que o auxiliar adoece, na origem. */
function digital(): string {
  const hash = createHash('sha256')
  const percorrer = (dir: string): void => {
    for (const nome of readdirSync(dir).sort()) {
      const caminho = path.join(dir, nome)
      if (statSync(caminho).isDirectory()) percorrer(caminho)
      else hash.update(caminho).update(readFileSync(caminho))
    }
  }
  percorrer(path.join(RAIZ, '_reversa_forward'))
  percorrer(path.join(RAIZ, '_reversa_sdd'))
  return hash.digest('hex')
}

/** Roda o auxiliar em silêncio e devolve o código e o caminho impresso. */
function rodar(argumentos: string[]): { codigo: number; destino: string; erro: string } {
  const saidas: string[] = []
  const erros: string[] = []
  const escrever = process.stdout.write.bind(process.stdout)
  const errar = process.stderr.write.bind(process.stderr)
  process.stdout.write = ((texto: string) => (saidas.push(texto), true)) as typeof process.stdout.write
  process.stderr.write = ((texto: string) => (erros.push(texto), true)) as typeof process.stderr.write
  let codigo: number
  try {
    codigo = principal(argumentos, RAIZ)
  } finally {
    process.stdout.write = escrever
    process.stderr.write = errar
  }
  const destino = saidas.join('').trim()
  if (destino !== '') feitas.push(destino)
  return { codigo, destino, erro: erros.join('') }
}

/** A leitura de verdade sobre a cópia adoecida. */
function ler(caso: string): Extract<ReadingResult, { kind: 'loaded' }> {
  const { codigo, destino } = rodar([`--caso=${caso}`])
  expect(codigo).toBe(0)
  const resultado = readWorkspace(destino, { log: { write: () => {} } })
  if (resultado.kind !== 'loaded') throw new Error(`a leitura da cópia falhou: ${JSON.stringify(resultado)}`)
  return resultado
}

let antes = ''
beforeAll(() => {
  antes = digital()
})

afterAll(() => {
  for (const feita of feitas) rmSync(feita, { recursive: true, force: true })
})

describe('os cinco casos (RF-14)', () => {
  it('são os cinco do onboarding, e nenhum outro', () => {
    expect(CASOS).toEqual(['declarada', 'sem-spec', 'conferencias', 'conferencias-sem-tabela', 'impacto-grande'])
  })

  it('`declarada`: specs sem pasta homônima, todas ligadas por declaração', () => {
    const { greenfield } = ler('declarada')
    const { componentes } = greenfield.panorama
    expect(componentes.length).toBeGreaterThan(0)
    expect(componentes.every((c) => c.nome.startsWith(PREFIXO))).toBe(true)
    expect(componentes.every((c) => c.situacao !== 'planejada')).toBe(true)
    expect(componentes.flatMap((c) => c.ligacoes ?? []).every((l) => l.origem === 'declarada')).toBe(true)
    expect(componentes.flatMap((c) => c.ligacoes ?? []).every((l) => l.impacto?.endsWith('/legacy-impact.md'))).toBe(true)
  })

  it('`sem-spec`: uma linha em "Entregues sem spec" com a pasta que a declara', () => {
    const { greenfield } = ler('sem-spec')
    const semSpec = greenfield.panorama.semSpec ?? []
    expect(semSpec.map((c) => c.nome)).toEqual([SEM_SPEC])
    expect(semSpec[0]?.pastas).toHaveLength(1)
    expect(greenfield.panorama.totalDeSpecs).toBe(greenfield.panorama.componentes.length)
  })

  it('`conferencias`: "2 de 20" numa pasta convergida, que continua convergida, sem razão nova', () => {
    const { history, process, bugs, greenfield } = ler('conferencias')
    const comRegistro = history.entradas.filter((e) => e.conferencias?.estado === 'lido' && e.conferencias.total === 20)
    expect(comRegistro).toHaveLength(1)
    expect(comRegistro[0]?.situacao).toBe('convergida')
    expect(comRegistro[0]?.conferencias?.registradas).toBe(2)
    const saudavel = readWorkspace(RAIZ, { log: { write: () => {} } })
    if (saudavel.kind !== 'loaded') throw new Error('a leitura da origem falhou')
    expect(blockingReasons(process, bugs, greenfield)).toEqual(
      blockingReasons(saudavel.process, saudavel.bugs, saudavel.greenfield),
    )
  })

  it('`conferencias-sem-tabela`: anomalia com a seção e o cabeçalho no detalhe', () => {
    const { history } = ler('conferencias-sem-tabela')
    const anomalias = history.anomalias ?? []
    expect(anomalias).toHaveLength(1)
    expect(anomalias[0]?.code).toBe('tabela-nao-reconhecida')
    expect(anomalias[0]?.detail).toContain('Registro de conferências')
    expect(anomalias[0]?.detail).toContain('Marco | Item | Resultado')
  })

  it('`impacto-grande`: vínculo parcial, com a anomalia do arquivo não lido', () => {
    expect(ACIMA_DO_TETO).toBeGreaterThan(REVERSA_FILE_CAP)
    const { history, greenfield, probe } = ler('impacto-grande')
    expect(greenfield.panorama.vinculoParcial).toBe(true)
    expect(history.entradas.filter((e) => e.vinculo?.estado === 'nao-lido')).toHaveLength(1)
    expect(history.anomalias?.map((a) => a.code)).toEqual(['artefato-da-entrega-nao-lido'])
    // O relatório da sonda herdada não muda: o arquivo é da sonda local.
    expect(probe.truncated.some((t) => t.includes('legacy-impact'))).toBe(false)
  })

  it('recusa caso inválido listando os que existem', () => {
    const { codigo, destino, erro } = rodar(['--caso=inexistente'])
    expect(codigo).toBe(1)
    expect(destino).toBe('')
    for (const caso of CASOS) expect(erro).toContain(caso)
  })
})

describe('a origem e a cópia', () => {
  it('a cópia fica fora do repositório', () => {
    const { destino } = rodar(['--caso=sem-spec'])
    expect(path.relative(RAIZ, destino).startsWith('..')).toBe(true)
  })

  it('o workspace de origem fica intocado depois de todos os casos', () => {
    for (const caso of CASOS) rodar([`--caso=${caso}`])
    expect(digital()).toBe(antes)
  })
})
