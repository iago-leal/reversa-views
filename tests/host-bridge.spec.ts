/**
 * Suíte da ponte (T013), contra `src/host/bridge.ts`.
 *
 * A ponte é o único módulo que toca a interface de mensagens (RF-17), e é
 * dela que dependem as três regras de ordem: nada sai antes do pronto
 * (RN-03), nada sai para visão oculta, e o pedido feito com a visão oculta
 * vira pendência em vez de se perder (D-10).
 */

import { describe, expect, it, vi } from 'vitest'
import { Bridge } from '../src/host/bridge.ts'
import type { MessagingPort, VisibilityPort } from '../src/host/ports.ts'
import type { HostMessage } from '../src/host/protocol.ts'

const CARGA: HostMessage = { command: 'setEntry', data: { kind: 'loading' } }

function bancada(options: { visible?: boolean; confirma?: boolean } = {}) {
  const lines: string[] = []
  const postMessage = vi.fn(async () => options.confirma ?? true)
  const dispose = vi.fn()
  const onDidReceiveMessage = vi.fn(() => ({ dispose }))
  const messaging = { postMessage, onDidReceiveMessage } as unknown as MessagingPort

  let visible = options.visible ?? true
  const ouvintes: Array<(visivel: boolean) => void> = []
  const visibility: VisibilityPort = {
    isVisible: () => visible,
    onVisibilityChange: (ouvinte) => {
      ouvintes.push(ouvinte)
      return () => void ouvintes.splice(ouvintes.indexOf(ouvinte), 1)
    },
  }

  const requestReload = vi.fn()
  const bridge = new Bridge({
    messaging,
    visibility,
    log: { write: (line) => void lines.push(line) },
    requestReload,
  })

  const mudarVisibilidade = (para: boolean): void => {
    visible = para
    for (const ouvinte of [...ouvintes]) ouvinte(para)
  }

  return { bridge, lines, postMessage, onDidReceiveMessage, dispose, requestReload, mudarVisibilidade }
}

describe('ordem obrigatória', () => {
  it('nada é enviado antes da chegada do pronto (RN-03)', async () => {
    const b = bancada()
    await b.bridge.send(CARGA)

    expect(b.postMessage).not.toHaveBeenCalled()
    expect(b.lines).toHaveLength(1)
    expect(b.lines[0]).toContain('retido')
  })

  it('depois do pronto, o envio ocorre uma vez por carga', async () => {
    const b = bancada()
    b.bridge.ready()
    await b.bridge.send(CARGA)
    await b.bridge.send(CARGA)

    expect(b.postMessage).toHaveBeenCalledTimes(2)
    expect(b.postMessage).toHaveBeenCalledWith(CARGA)
  })

  it('um segundo pronto continua permitindo envio (EC-07)', async () => {
    const b = bancada()
    b.bridge.ready()
    await b.bridge.send(CARGA)
    b.bridge.ready()
    await b.bridge.send(CARGA)

    expect(b.postMessage).toHaveBeenCalledTimes(2)
  })
})

describe('visão oculta', () => {
  it('não envia, marca pendência e registra o motivo', async () => {
    const b = bancada({ visible: false })
    b.bridge.ready()
    await b.bridge.send(CARGA)

    expect(b.postMessage).not.toHaveBeenCalled()
    expect(b.lines).toHaveLength(1)
    expect(b.lines[0]).toContain('oculta')
  })

  it('ao voltar a visibilidade com pendência, pede releitura', async () => {
    const b = bancada({ visible: false })
    b.bridge.ready()
    await b.bridge.send(CARGA)
    b.mudarVisibilidade(true)

    expect(b.requestReload).toHaveBeenCalledTimes(1)
  })

  it('ao voltar a visibilidade sem pendência, não pede nada (RF-10)', async () => {
    const b = bancada({ visible: true })
    b.bridge.ready()
    await b.bridge.send(CARGA)
    b.mudarVisibilidade(false)
    b.mudarVisibilidade(true)

    expect(b.requestReload).not.toHaveBeenCalled()
  })

  it('a pendência é consumida, e não repetida a cada retorno', async () => {
    const b = bancada({ visible: false })
    b.bridge.ready()
    await b.bridge.send(CARGA)
    b.mudarVisibilidade(true)
    b.mudarVisibilidade(false)
    b.mudarVisibilidade(true)

    expect(b.requestReload).toHaveBeenCalledTimes(1)
  })
})

describe('entrega não confirmada', () => {
  it('gera uma linha de log e nenhuma repetição', async () => {
    const b = bancada({ confirma: false })
    b.bridge.ready()
    await b.bridge.send(CARGA)

    expect(b.postMessage).toHaveBeenCalledTimes(1)
    expect(b.lines).toHaveLength(1)
    expect(b.lines[0]).toContain('não confirmou')
  })
})

describe('ouvinte único', () => {
  it('registra a escuta uma só vez e a descarta no fim', () => {
    const b = bancada()
    const handler = vi.fn()
    b.bridge.listen(handler)

    expect(b.onDidReceiveMessage).toHaveBeenCalledTimes(1)
    b.bridge.dispose()
    expect(b.dispose).toHaveBeenCalledTimes(1)
  })

  it('entrega ao tratador o que a webview enviou, sem interpretar', () => {
    const b = bancada()
    const handler = vi.fn()
    b.bridge.listen(handler)
    const entregue = b.onDidReceiveMessage.mock.calls[0]![0] as (received: unknown) => void
    entregue({ command: 'qualquer' })

    expect(handler).toHaveBeenCalledWith({ command: 'qualquer' })
  })
})

/**
 * O comando que a feature 007 acrescenta (T017).
 *
 * A ponte não sabe o que `setUpdate` significa, e é isso que se verifica: ela
 * o trata como trata os três que já existiam, com as mesmas três regras de
 * ordem. O contrato cresce por acréscimo, e um canal que precisasse de ramo
 * novo para cada mensagem nova não seria um canal.
 */
describe('o desfecho da consulta atravessa como qualquer outra carga', () => {
  const DESLIGADA: HostMessage = { command: 'setUpdate', data: { estado: 'desligada' } }
  const CONSULTANDO: HostMessage = { command: 'setUpdate', data: { estado: 'consultando' } }
  const ATRASADA: HostMessage = { command: 'setUpdate', data: { estado: 'atrasada', commits: 4 } }

  it('sai com o nome certo e o dado esperado', async () => {
    const b = bancada()
    b.bridge.ready()
    await b.bridge.send(ATRASADA)

    expect(b.postMessage).toHaveBeenCalledTimes(1)
    expect(b.postMessage).toHaveBeenCalledWith({
      command: 'setUpdate',
      data: { estado: 'atrasada', commits: 4 },
    })
  })

  it('atravessa sem transformação: a ponte não interpreta o desfecho', async () => {
    const b = bancada()
    b.bridge.ready()
    for (const carga of [DESLIGADA, CONSULTANDO, ATRASADA]) await b.bridge.send(carga)

    expect(b.postMessage.mock.calls.map(([carga]) => carga)).toEqual([
      DESLIGADA,
      CONSULTANDO,
      ATRASADA,
    ])
  })

  it('a sequência da leitura sai na ordem em que foi pedida', async () => {
    // É a ordem que o contrato do canal fixa: o processo primeiro, o estado de
    // espera logo depois, e o desfecho quando a origem responder.
    const b = bancada()
    b.bridge.ready()
    await b.bridge.send({ command: 'setEntry', data: { kind: 'loading' } })
    await b.bridge.send(CONSULTANDO)
    await b.bridge.send(ATRASADA)

    expect(b.postMessage.mock.calls.map(([carga]) => carga.command)).toEqual([
      'setEntry',
      'setUpdate',
      'setUpdate',
    ])
  })

  it('antes do pronto, é retido como qualquer outra carga (RN-03)', async () => {
    const b = bancada()
    await b.bridge.send(ATRASADA)

    expect(b.postMessage).not.toHaveBeenCalled()
    expect(b.lines[0]).toContain('setUpdate')
    expect(b.lines[0]).toContain('retido')
  })

  it('com a visão oculta, não sai, e a pendência é a mesma de sempre (D-10)', async () => {
    const b = bancada({ visible: false })
    b.bridge.ready()
    await b.bridge.send(ATRASADA)

    expect(b.postMessage).not.toHaveBeenCalled()
    expect(b.lines[0]).toContain('setUpdate')
    b.mudarVisibilidade(true)
    expect(b.requestReload).toHaveBeenCalledTimes(1)
  })

  it('entrega não confirmada gera uma linha, e nenhuma repetição', async () => {
    const b = bancada({ confirma: false })
    b.bridge.ready()
    await b.bridge.send(ATRASADA)

    expect(b.postMessage).toHaveBeenCalledTimes(1)
    expect(b.lines).toHaveLength(1)
    expect(b.lines[0]).toContain('setUpdate')
  })
})

describe('envelope desconhecido continua sendo descartado (RF-19)', () => {
  it('o tratador recebe o que chegou, e a ponte não derruba nada', () => {
    // A ponte entrega ao roteador SEM interpretar, e é o roteador que descarta.
    // O que se verifica aqui é que nada explode no caminho, inclusive com
    // envelope que não é envelope.
    const b = bancada()
    const recebidos: unknown[] = []
    b.bridge.listen((recebido) => void recebidos.push(recebido))

    const tortos: unknown[] = [
      { command: 'setUpdateXYZ', data: {} },
      { command: 'setUpdate' },
      { command: 42 },
      {},
      null,
      undefined,
      'setUpdate',
      [{ command: 'setUpdate' }],
    ]
    const ouvinte = b.onDidReceiveMessage.mock.calls[0][0] as (recebido: unknown) => void
    for (const torto of tortos) {
      expect(() => ouvinte(torto), `derrubou com ${JSON.stringify(torto) ?? String(torto)}`).not.toThrow()
    }
    expect(recebidos).toEqual(tortos)
  })
})
