/**
 * Suíte do protocolo (T007), contra `src/host/protocol.ts`.
 *
 * O arquivo de protocolo não tem lógica, e por isso o que se verifica aqui é
 * a forma do contrato: os cinco estados de entrada de RF-15, os cinco comandos
 * da webview com o reservado de RF-12, os três comandos do host e os seis
 * campos da carga de dados de RF-13, RF-03 e RF-04.
 */

import { describe, expect, it } from 'vitest'
import { readReversa, EMPTY_SNAPSHOT } from '../src/heranca/reversa-domain/src/index.ts'
import type { ProbeReport } from '../src/heranca/reversa-probe/src/snapshot.ts'
import {
  ENTRY_KINDS,
  HOST_COMMANDS,
  RESERVED_COMMAND,
  WEBVIEW_COMMANDS,
} from '../src/host/protocol.ts'
import type {
  DispatchData,
  EntryKind,
  HostMessage,
  LogData,
  OpenFileData,
  SetEntryData,
  SetNoticeData,
  SetProcessData,
  WebviewMessage,
} from '../src/host/protocol.ts'

const probe: ProbeReport = {
  workspace: '/w',
  featureDir: null,
  sessionDir: null,
  refusals: [],
  truncated: [],
}

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
  it('traz os cinco nomes, incluindo o reservado', () => {
    expect(WEBVIEW_COMMANDS).toEqual(['onLoaded', 'reload', 'openFile', 'log', 'dispatch'])
  })

  it('declara `dispatch` como reservado (RF-12)', () => {
    expect(RESERVED_COMMAND).toBe('dispatch')
    expect(WEBVIEW_COMMANDS).toContain(RESERVED_COMMAND)
  })

  it('cada comando é construível com a carga que o contrato lhe dá', () => {
    const openFile: OpenFileData = { path: 'requirements.md' }
    const log: LogData = { message: 'linha' }
    const dispatch: DispatchData = { agent: 'reversa-coding' }
    const messages: WebviewMessage[] = [
      { command: 'onLoaded' },
      { command: 'reload' },
      { command: 'openFile', data: openFile },
      { command: 'log', data: log },
      { command: 'dispatch', data: dispatch },
    ]
    expect(messages.map((message) => message.command)).toEqual([...WEBVIEW_COMMANDS])
  })
})

describe('comandos do host', () => {
  it('são três, e cada um tem carga tipada', () => {
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
        },
      },
      { command: 'setEntry', data: { kind: 'loading' } },
      { command: 'setNotice', data: notice },
    ]
    expect(HOST_COMMANDS).toEqual(['setProcess', 'setEntry', 'setNotice'])
    expect(messages.map((message) => message.command)).toEqual([...HOST_COMMANDS])
  })
})

describe('carga de dados', () => {
  it('traz os seis campos de RF-13, RF-03 e RF-04, e nenhum a mais', () => {
    const data: SetProcessData = {
      process: readReversa(EMPTY_SNAPSHOT),
      probe,
      readAt: '2026-09-09T12:00:00.000Z',
      entry: 'installed',
      root: '/w',
      ignoredRoots: ['/outra'],
    }
    expect(Object.keys(data).sort()).toEqual(
      ['entry', 'ignoredRoots', 'probe', 'process', 'readAt', 'root'],
    )
  })

  it('o relatório da sonda expõe os quatro campos que RF-13 exige', () => {
    expect(Object.keys(probe)).toEqual(
      expect.arrayContaining(['workspace', 'featureDir', 'refusals', 'truncated']),
    )
  })
})
