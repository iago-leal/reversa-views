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
