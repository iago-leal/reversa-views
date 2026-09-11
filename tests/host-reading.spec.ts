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

/**
 * O registro de bugs no payload da leitura (feature 008, D-01, RF-13).
 *
 * O ramo do registro corre AO LADO do herdado e sabe tão pouco quanto ele:
 * onde o registro fica é literal do código local, e a sonda entra por parâmetro
 * como as duas herdadas, para que a suíte a exercite sem tocar disco.
 *
 * O caso do projeto sem pasta de registro é o que separa duas afirmações que a
 * tela precisa distinguir: "não há registro" e "não li o registro". A camada de
 * leitura sempre devolve a primeira, com o campo presente e `presente: false`;
 * a segunda é o campo ausente, que só um host anterior a esta feature produz.
 */
describe('registro de bugs na leitura', () => {
  /** Uma leitura de bugs, com o mínimo que a camada precisa receber. */
  function bugsRead(overrides: Partial<Parameters<typeof readWorkspace>[1]> = {}) {
    const log = logSpy()
    return readWorkspace('/w', {
      readSnapshot: () => probeResult(INSTALLED),
      readProcess: readReversa,
      log: log.port,
      ...overrides,
    })
  }

  it('devolve o registro no resultado da leitura', () => {
    const resultado = bugsRead({
      readBugsFolders: () => ({
        presente: true,
        contextos: [{ contexto: 'ctx', pasta: '_reversa_bugs/ctx' }],
        pastas: [
          {
            contexto: 'ctx',
            pastaDoContexto: '_reversa_bugs/ctx',
            pasta: '_reversa_bugs/ctx/bugs/BUG-1',
            nome: 'BUG-1',
            temBugMd: true,
            bugMd: [
              '---',
              'id: BUG-20260910-AAAA',
              'status: open',
              'phase: triaging',
              'severity: low',
              'priority: P3',
              'created: 2026-09-10',
              'updated: 2026-09-10',
              'visibility: normal',
              'blocking: []',
              '---',
            ].join('\n'),
            temTrava: false,
            travaMd: null,
          },
        ],
        truncado: false,
        total: 1,
      }),
    })

    if (resultado.kind !== 'loaded') throw new Error('esperava leitura bem-sucedida')
    expect(resultado.bugs.presente).toBe(true)
    expect(resultado.bugs.contagem.total).toBe(1)
    expect(resultado.bugs.contextos[0].bugs[0].id).toBe('BUG-20260910-AAAA')
  })

  it('projeto sem pasta de registro devolve registro ausente, sem anomalia e sem exceção', () => {
    const resultado = bugsRead({
      readBugsFolders: () => ({ presente: false, contextos: [], pastas: [], truncado: false, total: 0 }),
    })

    if (resultado.kind !== 'loaded') throw new Error('esperava leitura bem-sucedida')
    expect(resultado.bugs.presente).toBe(false)
    expect(resultado.bugs.contextos).toEqual([])
    expect(resultado.bugs.anomalias).toEqual([])
  })

  it('a sonda do registro recebe a raiz observada, e nada mais', () => {
    const sonda = vi.fn(() => ({
      presente: false,
      contextos: [],
      pastas: [],
      truncado: false,
      total: 0,
    }))
    bugsRead({ readBugsFolders: sonda })

    expect(sonda).toHaveBeenCalledTimes(1)
    expect(sonda).toHaveBeenCalledWith('/w')
  })

  it('uma varredura do registro que lança vira o estado de erro, e não exceção no editor', () => {
    const log = logSpy()
    const resultado = readWorkspace('/w', {
      readSnapshot: () => probeResult(INSTALLED),
      readProcess: readReversa,
      log: log.port,
      readBugsFolders: () => {
        throw new Error('registro recusou')
      },
    })

    expect(resultado.kind).toBe('error')
    if (resultado.kind !== 'error') return
    expect(resultado.message).toContain('registro recusou')
    expect(log.lines[0]).toContain('reading ·')
  })

  it('o campo do registro viaja mesmo num workspace sem Reversa instalado', () => {
    const resultado = readWorkspace('/w', {
      readSnapshot: () => probeResult(null),
      readProcess: readReversa,
      log: logSpy().port,
      readBugsFolders: () => ({ presente: false, contextos: [], pastas: [], truncado: false, total: 0 }),
    })

    if (resultado.kind !== 'loaded') throw new Error('esperava leitura bem-sucedida')
    expect(resultado.entry).toBe('no-reversa')
    expect(resultado.bugs).toBeDefined()
  })
})

/**
 * O eixo greenfield na leitura (feature 009, RF-01, RF-02, RF-22, D-13).
 *
 * A sonda do eixo entra por parâmetro, como as duas herdadas e as duas locais,
 * e corre DENTRO do mesmo `try`: uma varredura que lança vira o estado de erro
 * nomeado, e não exceção no editor. O julgamento recebe o histórico já
 * julgado, o `state.json` cru do retrato e a pasta de saída que o processo
 * herdado resolveu, para que nenhum caminho do Reversa seja escrito no host.
 */
describe('eixo greenfield na leitura', () => {
  /** O que a sonda do eixo devolveria para uma pasta de saída sem artefato do /reversa-new. */
  const NADA = {
    pasta: true,
    brief: false,
    briefMd: null,
    ideacao: false,
    personas: false,
    prd: false,
    prdMd: null,
    arquitetura: true,
    dominio: true,
    specs: [],
    totalDeSpecs: 0,
    truncados: [],
  }

  function greenfieldRead(overrides: Partial<Parameters<typeof readWorkspace>[1]> = {}) {
    return readWorkspace('/w', {
      readSnapshot: () => probeResult(INSTALLED),
      readProcess: readReversa,
      log: logSpy().port,
      readGreenfieldFolder: () => NADA,
      ...overrides,
    })
  }

  it('devolve o eixo no resultado da leitura, julgado a partir do que a sonda viu', () => {
    const resultado = greenfieldRead({
      readGreenfieldFolder: () => ({
        ...NADA,
        arquitetura: false,
        dominio: false,
        brief: true,
        briefMd: '# Brief\n\n## Ideia original\n\nUm painel. Mais nada.\n',
        ideacao: true,
        personas: true,
        prd: true,
        prdMd: '# PRD\n\n## 4. Escopo (in)\n\n- Painel: o cartão.\n',
        specs: ['painel.md'],
        totalDeSpecs: 1,
      }),
    })

    if (resultado.kind !== 'loaded') throw new Error('esperava leitura bem-sucedida')
    expect(resultado.greenfield.cenario).toBe('greenfield')
    expect(resultado.greenfield.estagio).toBe('especificado')
    expect(resultado.greenfield.resumo).toBe('Um painel.')
    expect(resultado.greenfield.panorama.componentes.map((c) => c.nome)).toEqual(['painel'])
    expect(resultado.greenfield.panorama.escopo.map((item) => item.nome)).toEqual(['Painel'])
  })

  it('projeto sem artefato do /reversa-new devolve cenário legado, sem anomalia e sem exceção', () => {
    const resultado = greenfieldRead()
    if (resultado.kind !== 'loaded') throw new Error('esperava leitura bem-sucedida')
    expect(resultado.greenfield.cenario).toBe('legado')
    expect(resultado.greenfield.estagio).toBe('ausente')
    expect(resultado.greenfield.anomalias).toEqual([])
  })

  it('a sonda do eixo recebe a raiz observada e a pasta de saída que o processo resolveu', () => {
    const sonda = vi.fn(() => NADA)
    greenfieldRead({ readGreenfieldFolder: sonda })
    expect(sonda).toHaveBeenCalledTimes(1)
    expect(sonda).toHaveBeenCalledWith('/w', '_reversa_sdd')
  })

  it('uma varredura do eixo que lança vira o estado de erro, e não exceção no editor', () => {
    const log = logSpy()
    const resultado = greenfieldRead({
      log: log.port,
      readGreenfieldFolder: () => {
        throw new Error('eixo recusou')
      },
    })
    expect(resultado.kind).toBe('error')
    if (resultado.kind !== 'error') return
    expect(resultado.message).toContain('eixo recusou')
    expect(log.lines[0]).toContain('reading ·')
  })

  it('o campo do eixo viaja mesmo num workspace sem Reversa instalado', () => {
    const resultado = greenfieldRead({ readSnapshot: () => probeResult(null) })
    if (resultado.kind !== 'loaded') throw new Error('esperava leitura bem-sucedida')
    expect(resultado.entry).toBe('no-reversa')
    expect(resultado.greenfield).toBeDefined()
    expect(resultado.greenfield.cenario).toBe('legado')
  })
})
