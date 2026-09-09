/**
 * Suíte do provedor (T014), contra `src/host/provider.ts`.
 *
 * O provedor é quem ordena a sequência que RN-03 exige, pronto e só então
 * dados, e quem garante que os dois caminhos de releitura de RF-07 passem
 * pelo mesmo código. Toda a interface do editor entra por dublê: nada aqui
 * abre o editor de verdade.
 */

import { describe, expect, it, vi } from 'vitest'
import { EMPTY_SNAPSHOT, readReversa } from '../src/heranca/reversa-domain/src/index.ts'
import { ProcessViewProvider } from '../src/host/provider.ts'
import type { ReadingResult } from '../src/host/reading.ts'

/** Deixa correr toda a cadeia de promessas que a chegada do pronto dispara. */
const esperar = (): Promise<void> => new Promise((resolve) => setImmediate(resolve))

function leitura(root: string): ReadingResult {
  return {
    kind: 'loaded',
    entry: 'installed',
    process: readReversa({ ...EMPTY_SNAPSHOT, stateJson: '{"project":"x"}' }),
    probe: { workspace: root, featureDir: null, sessionDir: null, refusals: [], truncated: [] },
    readAt: '2026-09-09T12:00:00.000Z',
  }
}

function bancada(options: { roots?: string[]; readRoot?: (root: string) => ReadingResult } = {}) {
  const lines: string[] = []
  const postMessage = vi.fn(async () => true)
  const setState = vi.fn()
  const onDidReceiveMessage = vi.fn(() => ({ dispose: vi.fn() }))
  const webview = {
    options: {},
    html: '',
    cspSource: 'vscode-webview://abc',
    postMessage,
    onDidReceiveMessage,
    setState,
  }

  let visivel = true
  const ouvintes: Array<(visivel: boolean) => void> = []
  const view = { webview, visible: true }

  const readRoot = vi.fn(options.readRoot ?? leitura)
  const raizes = options.roots ?? ['/w']
  const localResourceRoots = [{ fsPath: '/ext/out' }]

  const provider = new ProcessViewProvider({
    workspace: { roots: () => raizes },
    editor: { open: vi.fn(async () => {}) },
    log: { write: (line) => void lines.push(line) },
    readRoot,
    localResourceRoots: localResourceRoots as never,
    visibilityOf: () => ({
      isVisible: () => visivel,
      onVisibilityChange: (ouvinte) => {
        ouvintes.push(ouvinte)
        return () => void ouvintes.splice(ouvintes.indexOf(ouvinte), 1)
      },
    }),
  })

  const resolver = (): void => provider.resolveWebviewView(view as never)
  const enviarDaWebview = (message: unknown): void => {
    const ouvinte = onDidReceiveMessage.mock.calls[0]![0] as (received: unknown) => void
    ouvinte(message)
  }
  const mudarVisibilidade = (para: boolean): void => {
    visivel = para
    for (const ouvinte of [...ouvintes]) ouvinte(para)
  }
  const enviadas = (): unknown[] => postMessage.mock.calls.map((call) => call[0])

  return {
    provider,
    resolver,
    enviarDaWebview,
    mudarVisibilidade,
    enviadas,
    readRoot,
    webview,
    setState,
    onDidReceiveMessage,
    localResourceRoots,
    lines,
  }
}

describe('resolver a visão', () => {
  it('define o documento e habilita script com raiz de recurso restrita', () => {
    const b = bancada()
    b.resolver()

    expect(b.webview.html).toContain('Content-Security-Policy')
    expect(b.webview.options).toEqual({
      enableScripts: true,
      localResourceRoots: b.localResourceRoots,
    })
  })

  it('registra o ouvinte uma única vez', () => {
    const b = bancada()
    b.resolver()

    expect(b.onDidReceiveMessage).toHaveBeenCalledTimes(1)
  })

  it('não lê o disco antes do pronto (RN-03)', () => {
    const b = bancada()
    b.resolver()

    expect(b.readRoot).not.toHaveBeenCalled()
    expect(b.enviadas()).toEqual([])
  })
})

describe('chegada do pronto', () => {
  it('envia o estado de carregando e depois a carga de dados', async () => {
    const b = bancada()
    b.resolver()
    b.enviarDaWebview({ command: 'onLoaded' })
    await esperar()

    const enviadas = b.enviadas() as Array<{ command: string; data: Record<string, unknown> }>
    expect(enviadas.map((message) => message.command)).toEqual(['setEntry', 'setProcess'])
    expect(enviadas[0]!.data).toEqual({ kind: 'loading' })
    expect(enviadas[1]!.data).toMatchObject({
      entry: 'installed',
      root: '/w',
      ignoredRoots: [],
      readAt: '2026-09-09T12:00:00.000Z',
    })
  })

  it('sem pasta alguma, envia o estado de sem diretório e não lê', async () => {
    const b = bancada({ roots: [] })
    b.resolver()
    b.enviarDaWebview({ command: 'onLoaded' })
    await esperar()

    const enviadas = b.enviadas() as Array<{ command: string; data: Record<string, unknown> }>
    expect(enviadas.map((message) => message.data.kind)).toEqual(['loading', 'no-folder'])
    expect(b.readRoot).not.toHaveBeenCalled()
  })

  it('leitura que falhou vira estado de erro com a mensagem (RF-16)', async () => {
    const b = bancada({ readRoot: () => ({ kind: 'error', message: 'disco recusou' }) })
    b.resolver()
    b.enviarDaWebview({ command: 'onLoaded' })
    await esperar()

    const ultima = b.enviadas().at(-1) as { command: string; data: Record<string, unknown> }
    expect(ultima.command).toBe('setEntry')
    expect(ultima.data).toMatchObject({ kind: 'error', message: 'disco recusou', root: '/w' })
  })
})

describe('releitura pelos dois caminhos (RF-07)', () => {
  it('o botão e o comando de paleta produzem cargas da mesma forma', async () => {
    const b = bancada()
    b.resolver()
    b.enviarDaWebview({ command: 'onLoaded' })
    await esperar()
    const doBotao = b.enviadas().length

    b.enviarDaWebview({ command: 'reload' })
    await esperar()
    await b.provider.reload()
    await esperar()

    const enviadas = b.enviadas() as Array<{ command: string; data: Record<string, unknown> }>
    const porBotao = enviadas[doBotao + 1]!
    const porPaleta = enviadas.at(-1)!
    expect(porBotao.command).toBe('setProcess')
    expect(porPaleta.command).toBe('setProcess')
    expect(Object.keys(porBotao.data).sort()).toEqual(Object.keys(porPaleta.data).sort())
    expect(b.readRoot).toHaveBeenCalledTimes(3)
  })
})

describe('alternância de visão (RF-10)', () => {
  it('ocultar e reexibir não dispara leitura nova', async () => {
    const b = bancada()
    b.resolver()
    b.enviarDaWebview({ command: 'onLoaded' })
    await esperar()
    const leituras = b.readRoot.mock.calls.length

    b.mudarVisibilidade(false)
    b.mudarVisibilidade(true)
    await esperar()

    expect(b.readRoot).toHaveBeenCalledTimes(leituras)
  })
})

describe('estado da webview (RN-06)', () => {
  it('o provedor nunca escreve nele', async () => {
    const b = bancada()
    b.resolver()
    b.enviarDaWebview({ command: 'onLoaded' })
    await esperar()

    expect(b.setState).not.toHaveBeenCalled()
  })
})
