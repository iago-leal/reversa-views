/**
 * Suíte do protocolo (T007), contra `src/host/protocol.ts`.
 *
 * O arquivo de protocolo não tem lógica, e por isso o que se verifica aqui é
 * a forma do contrato: os cinco estados de entrada de RF-15, os cinco comandos
 * da webview com o reservado de RF-12, os quatro comandos do host e os seis
 * campos da carga de dados de RF-13, RF-03 e RF-04.
 */

import { describe, expect, it } from 'vitest'
import { readReversa, EMPTY_SNAPSHOT } from '../src/heranca/reversa-domain/src/index.ts'
import type { ProbeReport } from '../src/heranca/reversa-probe/src/snapshot.ts'
import {
  ENTRY_KINDS,
  HOST_COMMANDS,
  RESERVED_COMMAND,
  UPDATE_CAUSES,
  UPDATE_STATES,
  WEBVIEW_COMMANDS,
} from '../src/host/protocol.ts'
import type {
  CopyTextData,
  DispatchData,
  EntryKind,
  HostMessage,
  LogData,
  OpenDraftData,
  OpenFileData,
  SetEntryData,
  SetNoticeData,
  SetProcessData,
  UpdateState,
  UpdateStatus,
  WebviewMessage,
} from '../src/host/protocol.ts'
import { readFileSync } from 'node:fs'
import { EMPTY_DECOMPOSITION, EMPTY_GREENFIELD, EMPTY_HISTORY } from '../src/domain/types.ts'
import type { HistoryEntry, PlannedComponent, ProductPanorama, ProjectHistory } from '../src/domain/types.ts'

const probe: ProbeReport = {
  workspace: '/w',
  featureDir: null,
  sessionDir: null,
  refusals: [],
  truncated: [],
}

/**
 * Os dois ramos que a feature 006 acrescentou e o eixo da 009, na forma vazia.
 *
 * O registro de bugs da 008 e a procedência da 007 ficam de fora de propósito:
 * os casos abaixo constroem a carga SEM eles, o que o tipo aceita como sempre
 * aceitou, e é isso que a regra de acréscimo promete.
 */
const ramos = { decomposition: EMPTY_DECOMPOSITION, history: EMPTY_HISTORY, greenfield: EMPTY_GREENFIELD }

import {
  closedDiscoveryFixture,
  discoveryStateFixture,
  preTwelveDiscoveryFixture,
  recognisedCheckpointFixture,
  payloadFixture,
  processFixture,
} from './helpers/reversa-fixtures.ts'

describe('estados de entrada', () => {
  it('nomeia os cinco de RF-15, na ordem do delta de dados', () => {
    expect(ENTRY_KINDS).toEqual(['no-folder', 'loading', 'no-reversa', 'installed', 'error'])
  })

  it('cada um é construível como valor do tipo união', () => {
    const kinds: EntryKind[] = ['no-folder', 'loading', 'no-reversa', 'installed', 'error']
    expect(new Set(kinds).size).toBe(5)
    for (const kind of kinds) expect(ENTRY_KINDS).toContain(kind)
  })

  it('os três estados sem processo cabem na carga de estado', () => {
    const bare: SetEntryData[] = [
      { kind: 'no-folder' },
      { kind: 'loading' },
      { kind: 'error', message: 'falhou' },
    ]
    expect(bare.map((data) => data.kind)).toEqual(['no-folder', 'loading', 'error'])
  })
})

describe('comandos da webview', () => {
  it('traz os sete nomes, incluindo o reservado', () => {
    expect(WEBVIEW_COMMANDS).toEqual([
      'onLoaded',
      'reload',
      'openFile',
      'log',
      'dispatch',
      'openDraft',
      'copyText',
    ])
  })

  it('os cinco de antes seguem na mesma ordem: o contrato cresce por acréscimo', () => {
    expect(WEBVIEW_COMMANDS.slice(0, 5)).toEqual([
      'onLoaded',
      'reload',
      'openFile',
      'log',
      'dispatch',
    ])
  })

  it('declara `dispatch` como reservado (RF-12)', () => {
    expect(RESERVED_COMMAND).toBe('dispatch')
    expect(WEBVIEW_COMMANDS).toContain(RESERVED_COMMAND)
  })

  it('cada comando é construível com a carga que o contrato lhe dá', () => {
    const openFile: OpenFileData = { path: 'requirements.md' }
    const log: LogData = { message: 'linha' }
    const dispatch: DispatchData = { agent: 'reversa-coding' }
    const draft: OpenDraftData = { text: 'resumo', title: 'Reversa' }
    const copy: CopyTextData = { text: 'resumo' }
    const messages: WebviewMessage[] = [
      { command: 'onLoaded' },
      { command: 'reload' },
      { command: 'openFile', data: openFile },
      { command: 'log', data: log },
      { command: 'dispatch', data: dispatch },
      { command: 'openDraft', data: draft },
      { command: 'copyText', data: copy },
    ]
    expect(messages.map((message) => message.command)).toEqual([...WEBVIEW_COMMANDS])
  })

  it('o título do rascunho é opcional, e a carga sem ele continua válida', () => {
    const semTitulo: OpenDraftData = { text: 'resumo' }
    expect(Object.keys(semTitulo)).toEqual(['text'])
  })
})

describe('comandos do host', () => {
  it('são quatro, e cada um tem carga tipada', () => {
    const notice: SetNoticeData = { level: 'warning', message: 'sumiu' }
    const messages: HostMessage[] = [
      {
        command: 'setProcess',
        data: {
          process: readReversa(EMPTY_SNAPSHOT),
          probe,
          readAt: '2026-09-09T12:00:00.000Z',
          entry: 'no-reversa',
          root: '/w',
          ignoredRoots: [],
          inheritedRevision: '420305daa6cdd10858b720a34cb8db67d8e5c5e9',
          ...ramos,
        },
      },
      { command: 'setEntry', data: { kind: 'loading' } },
      { command: 'setNotice', data: notice },
      { command: 'setUpdate', data: { estado: 'consultando' } },
    ]
    expect(HOST_COMMANDS).toEqual(['setProcess', 'setEntry', 'setNotice', 'setUpdate'])
    expect(messages.map((message) => message.command)).toEqual([...HOST_COMMANDS])
  })

  it('o acréscimo da feature 007 é o ÚLTIMO, e nada acima dele mudou de lugar', () => {
    // A disciplina de crescimento do contrato de 002 é o que esta linha
    // guarda: acrescentar é permitido, renomear e reordenar não são.
    expect(HOST_COMMANDS.slice(0, 3)).toEqual(['setProcess', 'setEntry', 'setNotice'])
    expect(HOST_COMMANDS[HOST_COMMANDS.length - 1]).toBe('setUpdate')
  })
})

describe('o desfecho da consulta à origem (feature 007)', () => {
  it('tem as sete variantes que o contrato nomeia, nessa ordem', () => {
    expect(UPDATE_STATES).toEqual([
      'desligada',
      'consultando',
      'em-dia',
      'atrasada',
      'divergente',
      'commit-desconhecido',
      'impossivel',
    ])
  })

  it('tem as quatro causas de consulta impossível', () => {
    expect(UPDATE_CAUSES).toEqual([
      'sem-rede',
      'limite-de-taxa',
      'resposta-inesperada',
      'tempo-esgotado',
    ])
  })

  it('é união discriminada: a distância só existe onde há distância', () => {
    const todos: UpdateStatus[] = [
      { estado: 'desligada' },
      { estado: 'consultando' },
      { estado: 'em-dia' },
      { estado: 'atrasada', commits: 4 },
      { estado: 'divergente', commits: 2 },
      { estado: 'commit-desconhecido' },
      { estado: 'impossivel', causa: 'tempo-esgotado' },
    ]
    expect(todos.map((desfecho) => desfecho.estado)).toEqual([...UPDATE_STATES])

    // O compilador é quem guarda a regra; a asserção só a torna visível.
    const atrasada = todos[3]
    expect(atrasada.estado === 'atrasada' ? atrasada.commits : null).toBe(4)
  })

  it('cada estado da união é um dos sete declarados', () => {
    const estado: UpdateState = 'em-dia'
    expect(UPDATE_STATES).toContain(estado)
  })
})

describe('carga de dados', () => {
  it('traz os dez campos de RF-13, RF-03, RF-04, RF-14, da feature 006 e da 009, e nenhum a mais', () => {
    const data: SetProcessData = {
      process: readReversa(EMPTY_SNAPSHOT),
      probe,
      readAt: '2026-09-09T12:00:00.000Z',
      entry: 'installed',
      root: '/w',
      ignoredRoots: ['/outra'],
      inheritedRevision: '420305daa6cdd10858b720a34cb8db67d8e5c5e9',
      ...ramos,
    }
    expect(Object.keys(data).sort()).toEqual([
      'decomposition',
      'entry',
      'greenfield',
      'history',
      'ignoredRoots',
      'inheritedRevision',
      'probe',
      'process',
      'readAt',
      'root',
    ])
  })

  /**
   * O décimo campo é ACRÉSCIMO (feature 009, D-13). Ausente, ele é leitura não
   * realizada, e a tela o distingue por `=== undefined`, nunca por cenário: um
   * host anterior não o envia, e um painel que lesse a ausência como "projeto
   * legado" afirmaria o que ninguém leu.
   */
  it('o eixo greenfield é o décimo, entra por acréscimo, e ausente é leitura não realizada', () => {
    const data: SetProcessData = {
      process: readReversa(EMPTY_SNAPSHOT),
      probe,
      readAt: '2026-09-09T12:00:00.000Z',
      entry: 'installed',
      root: '/w',
      ignoredRoots: [],
      inheritedRevision: 'abc1234',
      ...ramos,
    }
    expect(data.greenfield.cenario).toBe('sem-ancora')
    expect(data.greenfield.estagio).toBe('ausente')

    const anterior = { ...data } as Partial<SetProcessData>
    delete anterior.greenfield
    expect(anterior.greenfield).toBeUndefined()
    expect(Object.keys(anterior)).toHaveLength(9)
  })

  it('os dois ramos novos são acréscimo, e os sete de antes seguem intactos', () => {
    // A regra do contrato é esta, e é o que autoriza a feature 006: acrescentar
    // é permitido, renomear e remover não são.
    const data: SetProcessData = {
      process: readReversa(EMPTY_SNAPSHOT),
      probe,
      readAt: '2026-09-09T12:00:00.000Z',
      entry: 'installed',
      root: '/w',
      ignoredRoots: [],
      inheritedRevision: 'abc1234',
      ...ramos,
    }
    for (const campo of ['process', 'probe', 'readAt', 'entry', 'root', 'ignoredRoots', 'inheritedRevision']) {
      expect(Object.keys(data)).toContain(campo)
    }
    expect(data.decomposition.lida).toBe(false)
    expect(data.history.entradas).toEqual([])
  })

  it('o campo da revisão herdada é acréscimo: a carga sem processo segue com quatro', () => {
    const bare: SetEntryData = { kind: 'error', message: 'disco recusou', root: '/w', ignoredRoots: [] }
    expect(Object.keys(bare).sort()).toEqual(['ignoredRoots', 'kind', 'message', 'root'])
  })

  it('o relatório da sonda expõe os quatro campos que RF-13 exige', () => {
    expect(Object.keys(probe)).toEqual(
      expect.arrayContaining(['workspace', 'featureDir', 'refusals', 'truncated']),
    )
  })
})

/**
 * Os campos da feature 010 entram DENTRO de estruturas existentes, e nunca no
 * topo da carga (D-13, RF-10). A ordem de declaração de uma interface não
 * existe em tempo de execução, e por isso o que se confere aqui é o fonte que
 * as declara: os campos novos são os últimos de cada estrutura, e opcionais.
 */
describe('os campos da feature 010 (D-13, RF-10)', () => {
  const tipos = readFileSync('src/domain/types.ts', 'utf8')

  /** Os campos de uma interface, na ordem do fonte, com a marca de opcional. */
  function campos(nome: string): Array<{ nome: string; opcional: boolean }> {
    const corpo = new RegExp(`export interface ${nome} \\{([\\s\\S]*?)\\n\\}`).exec(tipos)?.[1] ?? ''
    return [...corpo.matchAll(/^ {2}(\w+)(\??):/gm)].map((m) => ({ nome: m[1] ?? '', opcional: m[2] === '?' }))
  }

  const esperados: Array<[string, string[]]> = [
    ['HistoryEntry', ['vinculo', 'conferencias']],
    ['ProjectHistory', ['anomalias']],
    ['PlannedComponent', ['ligacoes']],
    ['ProductPanorama', ['semSpec', 'vinculoParcial']],
  ]

  for (const [estrutura, novos] of esperados) {
    it(`${estrutura} termina com ${novos.join(' e ')}, opcionais`, () => {
      const lista = campos(estrutura)
      expect(lista.length).toBeGreaterThan(novos.length)
      const fim = lista.slice(-novos.length)
      expect(fim.map((c) => c.nome)).toEqual(novos)
      expect(fim.every((c) => c.opcional)).toBe(true)
      // Os campos de antes continuam obrigatórios: nada foi afrouxado.
      expect(lista.slice(0, -novos.length).every((c) => !c.opcional)).toBe(true)
    })
  }

  /**
   * O topo não ganha campo POR ESTA FEATURE. A lista inclui, além dos dez que
   * o caso da carga conta, os quatro de procedência e do registro de bugs, que
   * o tipo declara e aquele caso deixa de fora de propósito, e o `discoveryState`
   * que a feature 011 acrescentou DEPOIS, no fim: a ordem é o que este caso
   * guarda, porque campo novo no meio quebraria o host anterior em silêncio.
   */
  it('o topo da carga não ganha campo algum', () => {
    const corpo = /export interface SetProcessData \{([\s\S]*?)\n\}/.exec(readFileSync('src/host/protocol.ts', 'utf8'))?.[1] ?? ''
    const declarados = [...corpo.matchAll(/^ {2}(\w+)\??:/gm)].map((m) => m[1])
    expect(declarados).toEqual([
      'process',
      'probe',
      'readAt',
      'entry',
      'root',
      'ignoredRoots',
      'inheritedRevision',
      'decomposition',
      'history',
      'extensionVersion',
      'builtFromCommit',
      'bugs',
      'greenfield',
      'builtFromRoot',
      'discoveryState',
    ])
  })

  it('a carga sem os campos novos é aceita como leitura não realizada', () => {
    const entrada: HistoryEntry = {
      pasta: '_reversa_forward/001-a',
      id: '001',
      nomeCurto: 'a',
      situacao: 'convergida',
      marca: 'nenhuma',
      acoes: { total: 1, fechadas: 1, abertas: 0, emendas: 0 },
      adendo: null,
      resumo: null,
      ultimoEvento: null,
    }
    const historico: ProjectHistory = { entradas: [entrada], truncado: false, total: 1 }
    const componente: PlannedComponent = {
      nome: 'a',
      spec: '_reversa_sdd/sdd/a.md',
      situacao: 'planejada',
      marca: 'nenhuma',
      pastas: [],
      adendo: null,
      acoes: null,
    }
    const panorama: ProductPanorama = { ...EMPTY_GREENFIELD.panorama, componentes: [componente] }
    expect(entrada.vinculo).toBeUndefined()
    expect(entrada.conferencias).toBeUndefined()
    expect(historico.anomalias).toBeUndefined()
    expect(componente.ligacoes).toBeUndefined()
    expect(panorama.semSpec).toBeUndefined()
    expect(panorama.vinculoParcial).toBeUndefined()
  })
})

describe('o campo do estado da descoberta (feature 011, D-07)', () => {
  it('é opcional: a carga sem ele continua válida, e é o que um host anterior manda', () => {
    const carga = payloadFixture()

    expect(carga.discoveryState).toBeUndefined()
    expect(carga.process).toBeDefined()
  })

  it('entra ao FIM da carga, sem renomear nem reordenar nada acima dele', () => {
    const anterior = payloadFixture()
    const comEixo = payloadFixture({ discoveryState: discoveryStateFixture() })

    for (const chave of Object.keys(anterior)) {
      expect(comEixo, chave).toHaveProperty(chave)
    }
    expect(Object.keys(comEixo).filter((k) => !Object.keys(anterior).includes(k))).toEqual([
      'discoveryState',
    ])
  })

  it('o processo herdado continua atravessando inteiro, com as anomalias sem desconto', () => {
    const carga = payloadFixture({
      process: processFixture({ state: { phase: 'concluido' } }),
      discoveryState: closedDiscoveryFixture(),
    })

    expect(carga.process.anomalies).toHaveLength(1)
    expect(carga.discoveryState?.absorvidas).toHaveLength(1)
  })
})

/**
 * Os campos da feature 012, e o valor novo da união.
 *
 * Os dois campos crescem por acréscimo e são seguros. O valor novo de
 * `CheckpointSituation` é de outra natureza, e é o único risco real de
 * incompatibilidade da feature: no `.vsix` host e tela viajam juntos, mas o
 * preview serve a tela construída contra a leitura corrente.
 */
describe('os campos do reconhecimento por equivalência (feature 012)', () => {
  it('mantém `discoveryState` como o único campo acrescentado à carga: a 012 cresce por dentro dele', () => {
    const anterior = payloadFixture()
    const com = payloadFixture({ discoveryState: discoveryStateFixture() })

    expect(Object.keys(com).filter((k) => !Object.keys(anterior).includes(k))).toEqual(['discoveryState'])
  })

  it('trata a procedência ausente como nula, que é o que um host anterior manda', () => {
    const axis = preTwelveDiscoveryFixture()
    const carga = payloadFixture({ discoveryState: axis })

    expect(carga.discoveryState?.checkpoints[0]?.reconhecidoPor ?? null).toBeNull()
  })

  it('trata a lista de registros ausente como vazia', () => {
    const carga = payloadFixture({ discoveryState: preTwelveDiscoveryFixture() })

    expect(carga.discoveryState?.registrosNaoAgentes ?? []).toEqual([])
  })

  it('atravessa o checkpoint reconhecido com campo, valor e sem instante', () => {
    const carga = payloadFixture({
      discoveryState: discoveryStateFixture({ checkpoints: [recognisedCheckpointFixture('scout')] }),
    })
    const checkpoint = carga.discoveryState?.checkpoints[0]

    expect(checkpoint?.reconhecidoPor).toEqual({ campo: 'status', valor: 'concluido' })
    expect(checkpoint?.instante).toBeNull()
  })

  it('atravessa a quarta situação sem transformação', () => {
    const carga = payloadFixture({
      discoveryState: discoveryStateFixture({
        checkpoints: [recognisedCheckpointFixture('archaeologist', 'status', 'failed', 'falhou')],
      }),
    })

    expect(carga.discoveryState?.checkpoints[0]?.situacao).toBe('falhou')
  })
})
