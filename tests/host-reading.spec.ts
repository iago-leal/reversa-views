/**
 * Suíte da leitura (T009), contra `src/host/reading.ts`.
 *
 * A leitura é o ponto em que o host consome a camada da feature 001 e nada
 * mais: RF-14 proíbe replicar regra de derivação aqui, RF-15 exige o estado
 * de entrada nomeado e RF-16 exige que exceção alguma escape. As duas
 * funções herdadas e a porta de log entram por parâmetro, como dublês.
 */

import { describe, expect, it, vi } from 'vitest'
import { EMPTY_SNAPSHOT, readReversa } from '../src/heranca/reversa-domain/src/index.ts'
import type { ReversaSnapshot } from '../src/heranca/reversa-domain/src/index.ts'
import type { ProbeResult } from '../src/heranca/reversa-probe/src/snapshot.ts'
import { readWorkspace } from '../src/host/reading.ts'
import type { LogPort } from '../src/host/ports.ts'

function logSpy(): { port: LogPort; lines: string[] } {
  const lines: string[] = []
  return { port: { write: (line) => void lines.push(line) }, lines }
}

function probeResult(stateJson: string | null): ProbeResult {
  const snapshot: ReversaSnapshot = { ...EMPTY_SNAPSHOT, stateJson }
  return {
    snapshot,
    report: {
      workspace: '/w',
      featureDir: '_reversa_forward/002-ponte-e-host',
      sessionDir: null,
      refusals: [],
      truncated: [],
    },
  }
}

const INSTALLED = '{"version":"1.3.3","project":"reversa-views"}'

describe('processo instalado', () => {
  it('monta a carga com processo, relatório e momento da leitura', () => {
    const log = logSpy()
    const result = readWorkspace('/w', {
      readSnapshot: () => probeResult(INSTALLED),
      readProcess: readReversa,
      log: log.port,
    })

    expect(result.kind).toBe('loaded')
    if (result.kind !== 'loaded') return
    expect(result.entry).toBe('installed')
    expect(result.process.installed).toBe(true)
    expect(result.probe.workspace).toBe('/w')
    expect(result.readAt).toEqual(expect.any(String))
  })

  it('o relatório expõe workspace, featureDir, refusals e truncated (RF-13)', () => {
    const log = logSpy()
    const result = readWorkspace('/w', {
      readSnapshot: () => probeResult(INSTALLED),
      readProcess: readReversa,
      log: log.port,
    })

    if (result.kind !== 'loaded') throw new Error('esperava leitura bem-sucedida')
    expect(Object.keys(result.probe)).toEqual(
      expect.arrayContaining(['workspace', 'featureDir', 'refusals', 'truncated']),
    )
  })

  it('chama primeiro a sonda e depois o julgamento, sobre o retrato devolvido', () => {
    const log = logSpy()
    const result = probeResult(INSTALLED)
    const readSnapshot = vi.fn(() => result)
    const readProcess = vi.fn(readReversa)

    readWorkspace('/w', { readSnapshot, readProcess, log: log.port })

    expect(readSnapshot).toHaveBeenCalledTimes(1)
    expect(readSnapshot).toHaveBeenCalledWith('/w')
    expect(readProcess).toHaveBeenCalledTimes(1)
    expect(readProcess).toHaveBeenCalledWith(result.snapshot)
  })
})

describe('processo não instalado', () => {
  it('nomeia o estado como no-reversa e envia o processo assim mesmo', () => {
    const log = logSpy()
    const result = readWorkspace('/w', {
      readSnapshot: () => probeResult(null),
      readProcess: readReversa,
      log: log.port,
    })

    if (result.kind !== 'loaded') throw new Error('esperava leitura bem-sucedida')
    expect(result.entry).toBe('no-reversa')
    expect(result.process.installed).toBe(false)
    expect(result.process.discovery.phases).toHaveLength(5)
  })
})

describe('leitura que lança', () => {
  it('captura, registra a pilha e devolve o estado de erro (RF-16)', () => {
    const log = logSpy()
    const boom = new Error('disco recusou')
    const result = readWorkspace('/w', {
      readSnapshot: () => {
        throw boom
      },
      readProcess: readReversa,
      log: log.port,
    })

    expect(result.kind).toBe('error')
    if (result.kind !== 'error') return
    expect(result.message).toContain('disco recusou')
    expect(log.lines).toHaveLength(1)
    expect(log.lines[0]).toContain('disco recusou')
    expect(log.lines[0]).toContain('reading ·')
    expect(log.lines[0]).toContain('at ')
  })

  it('nada escapa quando o julgamento lança', () => {
    const log = logSpy()
    expect(() =>
      readWorkspace('/w', {
        readSnapshot: () => probeResult(INSTALLED),
        readProcess: () => {
          throw new Error('julgamento quebrou')
        },
        log: log.port,
      }),
    ).not.toThrow()
  })
})

describe('momento da leitura', () => {
  it('é texto ordenável, e duas leituras em ordem crescente comparam bem', () => {
    const log = logSpy()
    const relogio = [new Date('2026-09-09T10:00:00Z'), new Date('2026-09-09T11:00:00Z')]
    let i = 0
    const ler = (): ReturnType<typeof readWorkspace> =>
      readWorkspace('/w', {
        readSnapshot: () => probeResult(INSTALLED),
        readProcess: readReversa,
        log: log.port,
        clock: () => relogio[i++]!,
      })

    const primeiro = ler()
    const segundo = ler()
    if (primeiro.kind !== 'loaded' || segundo.kind !== 'loaded') throw new Error('leitura falhou')
    expect(primeiro.readAt < segundo.readAt).toBe(true)
    expect(primeiro.readAt).toBe('2026-09-09T10:00:00.000Z')
  })
})
