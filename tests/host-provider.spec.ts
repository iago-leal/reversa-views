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
import { INHERITED_MODEL_REVISION } from '../src/host/inheritance.ts'
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
  /** O editor reescreve o caminho de disco no endereço que ele serve (D-13). */
  const asWebviewUri = vi.fn((uri: { fsPath: string }) => ({
    toString: () => `vscode-webview://abc${uri.fsPath}`,
  }))
  const webview = {
    options: {},
    html: '',
    cspSource: 'vscode-webview://abc',
    postMessage,
    onDidReceiveMessage,
    setState,
    asWebviewUri,
  }

  let visivel = true
  const ouvintes: Array<(visivel: boolean) => void> = []
  const view = { webview, visible: true }

  const readRoot = vi.fn(options.readRoot ?? leitura)
  const raizes = options.roots ?? ['/w']
  const localResourceRoots = [{ fsPath: '/ext/out' }, { fsPath: '/ext/out/res/webview' }]
  const assets = {
    script: { fsPath: '/ext/out/res/webview/main.js' },
    style: { fsPath: '/ext/out/res/webview/main.css' },
  }

  const provider = new ProcessViewProvider({
    workspace: { roots: () => raizes },
    editor: { open: vi.fn(async () => {}) },
    draft: { open: vi.fn(async () => {}) },
    clipboard: { copy: vi.fn(async () => {}) },
    log: { write: (line) => void lines.push(line) },
    readRoot,
    localResourceRoots: localResourceRoots as never,
    assets: assets as never,
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
    asWebviewUri,
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

  it('serve o painel real: etiqueta de script e etiqueta de folha', () => {
    const b = bancada()
    b.resolver()

    expect(b.webview.html).toMatch(/<script[^>]*nonce="[a-f0-9]{32}"[^>]*src="/)
    expect(b.webview.html).toMatch(/<link[^>]*rel="stylesheet"[^>]*href="/)
    expect(b.webview.html).toContain('<div id="root"></div>')
  })

  it('resolve os dois endereços pela interface do webview, e não monta caminho de disco', () => {
    const b = bancada()
    b.resolver()

    expect(b.asWebviewUri).toHaveBeenCalledTimes(2)
    expect(b.webview.html).toContain('vscode-webview://abc/ext/out/res/webview/main.js')
    expect(b.webview.html).toContain('vscode-webview://abc/ext/out/res/webview/main.css')
    expect(b.webview.html).not.toMatch(/(?:src|href)="\/ext/)
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

  it('a carga declara a revisão do modelo de que a leitura veio (RF-14)', async () => {
    const b = bancada()
    b.resolver()
    b.enviarDaWebview({ command: 'onLoaded' })
    await esperar()

    const enviadas = b.enviadas() as Array<{ command: string; data: Record<string, unknown> }>
    expect(enviadas[1]!.data.inheritedRevision).toBe(INHERITED_MODEL_REVISION)
    expect(enviadas[1]!.data.inheritedRevision).toMatch(/^[0-9a-f]{40}$/)
  })

  it('estado sem processo não carrega revisão alguma: o campo é do processo', async () => {
    const b = bancada({ roots: [] })
    b.resolver()
    b.enviarDaWebview({ command: 'onLoaded' })
    await esperar()

    const enviadas = b.enviadas() as Array<{ command: string; data: Record<string, unknown> }>
    for (const enviada of enviadas) expect(enviada.data.inheritedRevision).toBeUndefined()
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
