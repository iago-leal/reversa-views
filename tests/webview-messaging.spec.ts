/**
 * The single door between the panel and the editor: what goes out, what comes
 * in, and what happens to a command nobody declared (RF-10, RF-12, RF-16,
 * RF-19, D-06, D-17, D-18).
 *
 * The host interface arrives as a double, so nothing here touches an editor.
 * The exhaustiveness of the incoming treatment is a compile-time property,
 * checked by `check:webview`; what this suite states is its runtime half --
 * that each of the three declared commands reaches a handler, and that the
 * remaining case writes one line and changes no screen.
 * @module tests/webview-messaging
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { HOST_COMMANDS } from '../src/host/protocol.ts'
import { payloadFixture } from './helpers/reversa-fixtures.ts'

/** The host interface, as a double that records what the panel sent. */
function hostDublê() {
  const enviadas: { command: string; data?: unknown }[] = []
  let guardado: unknown = undefined
  return {
    api: {
      postMessage: (m: unknown) => enviadas.push(m as { command: string }),
      getState: () => guardado,
      setState: (s: unknown) => {
        guardado = s
      },
    },
    enviadas: () => enviadas,
  }
}

/** The panel side, as counters: what the bridge decided to hand over. */
function destinoDublê() {
  const chamadas: { alvo: string; data: unknown }[] = []
  return {
    sink: {
      setProcess: (data: unknown) => chamadas.push({ alvo: 'setProcess', data }),
      setEntry: (data: unknown) => chamadas.push({ alvo: 'setEntry', data }),
      setNotice: (data: unknown) => chamadas.push({ alvo: 'setNotice', data }),
      setUpdate: (data: unknown) => chamadas.push({ alvo: 'setUpdate', data }),
    },
    chamadas: () => chamadas,
  }
}

/** A bridge over both doubles, freshly imported so module state does not leak. */
async function ponte() {
  const host = hostDublê()
  const destino = destinoDublê()
  const { createBridge } = await import('../src/webview/bridge/messaging.ts')
  return { host, destino, bridge: createBridge({ sink: destino.sink, api: host.api }) }
}

beforeEach(() => {
  vi.resetModules()
  Reflect.deleteProperty(globalThis, 'acquireVsCodeApi')
})

describe('tomada da interface do host', () => {
  it('toma a interface exatamente uma vez, e a segunda montagem reaproveita a mesma', async () => {
    const host = hostDublê()
    const tomar = vi.fn(() => host.api)
    Object.defineProperty(globalThis, 'acquireVsCodeApi', { value: tomar, configurable: true })

    const { hostApi } = await import('../src/webview/bridge/messaging.ts')
    const primeira = hostApi()
    const segunda = hostApi()

    expect(tomar).toHaveBeenCalledTimes(1)
    expect(segunda).toBe(primeira)
  })
})

describe('mensagens que chegam', () => {
  it('leva cada comando do protocolo ao tratador correspondente', async () => {
    const { destino, bridge } = await ponte()
    const carga = payloadFixture()

    bridge.receive({ command: 'setProcess', data: carga })
    bridge.receive({ command: 'setEntry', data: { kind: 'loading' } })
    bridge.receive({ command: 'setNotice', data: { level: 'warning', message: 'sumiu' } })
    bridge.receive({ command: 'setUpdate', data: { estado: 'atrasada', commits: 4 } })

    expect(destino.chamadas().map((c) => c.alvo)).toEqual([...HOST_COMMANDS])
    expect(destino.chamadas()[0].data).toBe(carga)
  })

  it('o desfecho da consulta atravessa sem transformação (feature 007)', async () => {
    const { destino, bridge } = await ponte()
    const desfecho = { estado: 'impossivel', causa: 'limite-de-taxa' }

    bridge.receive({ command: 'setUpdate', data: desfecho })

    expect(destino.chamadas()).toEqual([{ alvo: 'setUpdate', data: desfecho }])
  })

  it('não deixa comando declarado cair no caso restante', async () => {
    for (const command of HOST_COMMANDS) {
      const { host, bridge } = await ponte()
      bridge.receive({ command, data: { kind: 'loading', level: 'warning', message: 'x' } })
      expect(host.enviadas().filter((m) => m.command === 'log')).toEqual([])
    }
  })

  it('produz uma linha de log nomeando o comando que não entende, e nada mais', async () => {
    const { host, destino, bridge } = await ponte()

    bridge.receive({ command: 'setUniverse', data: { tudo: true } })

    const linhas = host.enviadas().filter((m) => m.command === 'log')
    expect(linhas.length).toBe(1)
    expect(JSON.stringify(linhas[0].data)).toContain('setUniverse')
    expect(destino.chamadas()).toEqual([])
  })

  it('não muda tela alguma diante de envelope malformado', async () => {
    const { destino, bridge } = await ponte()

    for (const lixo of [null, undefined, 'texto', 42, {}, { data: {} }]) {
      expect(() => bridge.receive(lixo)).not.toThrow()
    }
    expect(destino.chamadas()).toEqual([])
  })

  it('põe o aviso em estado próprio, sem tocar no conteúdo da tela', async () => {
    const { destino, bridge } = await ponte()

    bridge.receive({ command: 'setProcess', data: payloadFixture() })
    bridge.receive({ command: 'setNotice', data: { level: 'warning', message: 'arquivo sumiu' } })

    const alvos = destino.chamadas().map((c) => c.alvo)
    expect(alvos).toEqual(['setProcess', 'setNotice'])
    expect(alvos.filter((a) => a === 'setProcess').length).toBe(1)
    expect(destino.chamadas()[1].data).toEqual({ level: 'warning', message: 'arquivo sumiu' })
  })
})

describe('mensagens que saem', () => {
  it('envia o pedido de pronto sem carga', async () => {
    const { host, bridge } = await ponte()
    bridge.ready()
    expect(host.enviadas()).toEqual([{ command: 'onLoaded' }])
  })

  it('envia o pedido de releitura sem carga', async () => {
    const { host, bridge } = await ponte()
    bridge.reload()
    expect(host.enviadas()).toEqual([{ command: 'reload' }])
  })

  it('pede a abertura com caminho relativo à raiz observada', async () => {
    const { host, bridge } = await ponte()
    bridge.openFile('_reversa_forward/003-painel-do-processo/requirements.md')
    expect(host.enviadas()).toEqual([
      {
        command: 'openFile',
        data: { path: '_reversa_forward/003-painel-do-processo/requirements.md' },
      },
    ])
  })

  it('recusa o caminho absoluto, registrando a recusa em vez de despachá-la', async () => {
    const { host, bridge } = await ponte()
    bridge.openFile('/w/reversa-views/README.md')

    expect(host.enviadas().filter((m) => m.command === 'openFile')).toEqual([])
    expect(host.enviadas().filter((m) => m.command === 'log').length).toBe(1)
  })

  it('escreve a linha pedida no canal do host', async () => {
    const { host, bridge } = await ponte()
    bridge.log('uma linha')
    expect(host.enviadas()).toEqual([{ command: 'log', data: { message: 'uma linha' } }])
  })
})

describe('par de funções de estado que a preferência consome', () => {
  it('lê o que foi escrito, e devolve indefinido antes da primeira escrita', async () => {
    const { bridge } = await ponte()
    expect(bridge.readState()).toBeUndefined()

    bridge.writeState({ collapsedSections: ['policy'] })
    expect(bridge.readState()).toEqual({ collapsedSections: ['policy'] })
  })

  it('não manda a preferência pelo canal de mensagens', async () => {
    const { host, bridge } = await ponte()
    bridge.writeState({ collapsedSections: ['probe'] })
    expect(host.enviadas()).toEqual([])
  })
})

describe('formato das linhas de log (RN-07)', () => {
  /** Origem, ato e motivo, o mesmo formato que a feature 002 fixou no host. */
  const FORMATO = /^[a-z-]+ · [^:]+: .+$/

  it('a linha do comando desconhecido tem as três partes e nomeia o comando', async () => {
    const { host, bridge } = await ponte()
    bridge.receive({ command: 'setUniverse' })

    const linha = (host.enviadas()[0].data as { message: string }).message
    expect(linha).toMatch(FORMATO)
    expect(linha).toContain('setUniverse')
  })

  it('a linha do envelope malformado tem as três partes e não fica genérica', async () => {
    const { host, bridge } = await ponte()
    bridge.receive(null)

    const linha = (host.enviadas()[0].data as { message: string }).message
    expect(linha).toMatch(FORMATO)
    expect(linha).toContain('comando')
  })

  it('a linha da abertura recusada tem as três partes e nomeia o caminho', async () => {
    const { host, bridge } = await ponte()
    bridge.openFile('/w/reversa-views/README.md')

    const linha = (host.enviadas()[0].data as { message: string }).message
    expect(linha).toMatch(FORMATO)
    expect(linha).toContain('/w/reversa-views/README.md')
  })

  it('nenhuma das linhas sai vazia', async () => {
    const { host, bridge } = await ponte()
    bridge.receive({ command: 'setUniverse' })
    bridge.receive(undefined)
    bridge.openFile('C:\\fora.md')

    for (const enviada of host.enviadas()) {
      expect((enviada.data as { message: string }).message.trim().length).toBeGreaterThan(20)
    }
  })
})
