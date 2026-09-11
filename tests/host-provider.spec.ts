/**
 * Suíte do provedor (T014), contra `src/host/provider.ts`.
 *
 * O provedor é quem ordena a sequência que RN-03 exige, pronto e só então
 * dados, e quem garante que os dois caminhos de releitura de RF-07 passem
 * pelo mesmo código. Toda a interface do editor entra por dublê: nada aqui
 * abre o editor de verdade.
 */

import { describe, expect, it, vi } from 'vitest'
import type { OriginReply } from '../src/host/ports.ts'
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

function bancada(
  options: {
    roots?: string[]
    readRoot?: (root: string) => ReadingResult
    /** A procedência desta construção; ausente, o painel a declara ausente. */
    build?: { version: string; commit: string }
    /** A consulta da feature 007; ausente, nenhuma consulta acontece. */
    update?: {
      ligada?: boolean
      repositorio?: string | null
      responder?: () => Promise<OriginReply>
    }
  } = {},
) {
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

  const compare = vi.fn(
    options.update?.responder ??
      (async () =>
        ({ kind: 'response', status: 200, body: { status: 'identical' } }) as OriginReply),
  )

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
    build: options.build,
    update:
      options.update === undefined
        ? undefined
        : {
            config: { checkForUpdates: () => options.update?.ligada ?? true },
            origin: { compare },
            repository:
              options.update.repositorio === undefined
                ? 'iago-leal/reversa-views'
                : options.update.repositorio,
            branch: 'master',
          },
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
    compare,
  }
}

/** A carga de cada `setUpdate` enviado, na ordem em que saiu. */
function desfechos(enviadas: unknown[]): unknown[] {
  return enviadas
    .filter((carga) => (carga as { command?: string }).command === 'setUpdate')
    .map((carga) => (carga as { data: unknown }).data)
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

/**
 * A consulta à origem que a feature 007 acrescenta (T027, T041).
 *
 * Três propriedades resumem o desenho, e é sobre elas que estes casos incidem:
 * a consulta SEGUE a leitura em vez de atrasá-la, acontece no máximo uma vez
 * por leitura, e não se repete sozinha.
 */
describe('a consulta à origem', () => {
  const CARIMBO = {
    version: '0.6.1',
    commit: 'a23711d481021a978720c0bc478b6dabed94fec3',
    root: '/home/alguem/dev/reversa-views',
  }

  it('anuncia a espera depois do processo, e o desfecho quando a origem responde', async () => {
    const b = bancada({ build: CARIMBO, update: {} })
    b.resolver()
    b.enviarDaWebview({ command: 'onLoaded' })
    await esperar()

    const nomes = b.enviadas().map((carga) => (carga as { command: string }).command)
    expect(nomes).toEqual(['setEntry', 'setProcess', 'setUpdate', 'setUpdate'])
    expect(desfechos(b.enviadas())).toEqual([{ estado: 'consultando' }, { estado: 'em-dia' }])
  })

  it('não atrasa a leitura: o processo já viajou quando a origem é perguntada', async () => {
    // O que se verifica é a ORDEM, e não o instante: o envio é assíncrono, de
    // modo que o processo sai numa volta do laço de eventos e não antes dela.
    // O que RF-12 proíbe é a leitura ESPERAR pela consulta, e a prova disso é
    // que o processo já está na tela quando a pergunta parte.
    let jaEnviadoAoPerguntar: string[] = []
    const b = bancada({
      build: CARIMBO,
      update: {
        responder: async () => {
          jaEnviadoAoPerguntar = b
            .enviadas()
            .map((carga) => (carga as { command: string }).command)
          return { kind: 'response', status: 200, body: { status: 'identical' } }
        },
      },
    })
    b.resolver()
    b.enviarDaWebview({ command: 'onLoaded' })
    await esperar()

    expect(jaEnviadoAoPerguntar).toContain('setProcess')
    expect(jaEnviadoAoPerguntar).toContain('setUpdate')
  })

  it('traduz o atraso da origem no desfecho que o painel desenha', async () => {
    const b = bancada({
      build: CARIMBO,
      update: {
        responder: async () => ({
          kind: 'response',
          status: 200,
          body: { status: 'ahead', ahead_by: 4 },
        }),
      },
    })
    b.resolver()
    b.enviarDaWebview({ command: 'onLoaded' })
    await esperar()

    expect(desfechos(b.enviadas()).at(-1)).toEqual({ estado: 'atrasada', commits: 4 })
  })

  it('a base da comparação é o commit desta construção, e a cabeça é o ramo', async () => {
    const b = bancada({ build: CARIMBO, update: {} })
    b.resolver()
    b.enviarDaWebview({ command: 'onLoaded' })
    await esperar()

    expect(b.compare).toHaveBeenCalledWith(CARIMBO.commit, 'master')
  })

  it('acontece no máximo uma vez por leitura (RF-11)', async () => {
    const b = bancada({ build: CARIMBO, update: {} })
    b.resolver()
    b.enviarDaWebview({ command: 'onLoaded' })
    await esperar()
    expect(b.compare).toHaveBeenCalledTimes(1)

    await b.provider.reload()
    await esperar()
    expect(b.compare).toHaveBeenCalledTimes(2)
  })

  it('não se repete sozinha diante de falha (RN-09)', async () => {
    const b = bancada({
      build: CARIMBO,
      update: { responder: async () => ({ kind: 'failure', cause: 'sem-rede' }) },
    })
    b.resolver()
    b.enviarDaWebview({ command: 'onLoaded' })
    await esperar()

    expect(b.compare).toHaveBeenCalledTimes(1)
    expect(desfechos(b.enviadas()).at(-1)).toEqual({ estado: 'impossivel', causa: 'sem-rede' })
  })

  it('a procedência viaja na carga da leitura, ao lado da revisão herdada (RF-17)', async () => {
    const b = bancada({ build: CARIMBO, update: {} })
    b.resolver()
    b.enviarDaWebview({ command: 'onLoaded' })
    await esperar()

    const processo = b.enviadas().find(
      (carga) => (carga as { command: string }).command === 'setProcess',
    ) as { data: Record<string, unknown> }
    expect(processo.data.extensionVersion).toBe('0.6.1')
    expect(processo.data.builtFromCommit).toBe(CARIMBO.commit)
    // A raiz do clone que produziu esta construção viaja pela mesma via, e é
    // ela que permite à faixa anunciar um comando executável de onde o leitor
    // está (BUG-20260911-FI3O). Sem ela a tela recua para o comando do clone.
    expect(processo.data.builtFromRoot).toBe(CARIMBO.root)
    expect(processo.data.inheritedRevision).toBe(INHERITED_MODEL_REVISION)
  })
})

describe('quando a consulta NÃO acontece (RF-12, RF-14, RN-09)', () => {
  const CARIMBO = {
    version: '0.6.1',
    commit: 'a23711d481021a978720c0bc478b6dabed94fec3',
    root: '/home/alguem/dev/reversa-views',
  }

  it('sem pasta aberta, não há leitura a acompanhar e nada é perguntado', async () => {
    const b = bancada({ roots: [], build: CARIMBO, update: {} })
    b.resolver()
    b.enviarDaWebview({ command: 'onLoaded' })
    await esperar()

    expect(b.compare).not.toHaveBeenCalled()
    expect(desfechos(b.enviadas())).toEqual([])
  })

  it('com a leitura falhando, tampouco: o painel está dizendo que não leu', async () => {
    const b = bancada({
      build: CARIMBO,
      update: {},
      readRoot: () => ({ kind: 'error', message: 'não deu' }) as ReadingResult,
    })
    b.resolver()
    b.enviarDaWebview({ command: 'onLoaded' })
    await esperar()

    expect(b.compare).not.toHaveBeenCalled()
    expect(desfechos(b.enviadas())).toEqual([])
  })

  it('com a chave desligada, o painel declara que está desligada, e nada é perguntado', async () => {
    const b = bancada({ build: CARIMBO, update: { ligada: false } })
    b.resolver()
    b.enviarDaWebview({ command: 'onLoaded' })
    await esperar()

    expect(b.compare).not.toHaveBeenCalled()
    expect(desfechos(b.enviadas())).toEqual([{ estado: 'desligada' }])
  })

  it('sem origem conhecida, o mesmo: um remoto de outro serviço não é consultável', async () => {
    const b = bancada({ build: CARIMBO, update: { repositorio: null } })
    b.resolver()
    b.enviarDaWebview({ command: 'onLoaded' })
    await esperar()

    expect(b.compare).not.toHaveBeenCalled()
    expect(desfechos(b.enviadas())).toEqual([{ estado: 'desligada' }])
  })

  it('um provedor montado sem a capacidade não anuncia desfecho algum', async () => {
    // É o que um host anterior à feature 007 produz, e é o que o preview monta
    // quando não está exercitando a consulta.
    const b = bancada({ build: CARIMBO })
    b.resolver()
    b.enviarDaWebview({ command: 'onLoaded' })
    await esperar()

    expect(desfechos(b.enviadas())).toEqual([])
  })
})

describe('releitura durante consulta em voo', () => {
  const CARIMBO = {
    version: '0.6.1',
    commit: 'a23711d481021a978720c0bc478b6dabed94fec3',
    root: '/home/alguem/dev/reversa-views',
  }

  it('a resposta da leitura anterior não sobrescreve a da leitura corrente', async () => {
    // Sem a guarda de geração, a resposta velha chegaria depois e o cabeçalho
    // passaria a declarar o estado de uma leitura que ninguém está vendo.
    const pendentes: Array<(reply: OriginReply) => void> = []
    const b = bancada({
      build: CARIMBO,
      update: {
        responder: () => new Promise<OriginReply>((resolve) => pendentes.push(resolve)),
      },
    })
    b.resolver()
    b.enviarDaWebview({ command: 'onLoaded' })
    await esperar()

    // Segunda leitura, com a primeira consulta ainda pendurada.
    void b.provider.reload()
    await esperar()
    expect(pendentes).toHaveLength(2)

    // A resposta ANTIGA volta primeiro, e é descartada.
    pendentes[0]({ kind: 'response', status: 200, body: { status: 'ahead', ahead_by: 99 } })
    await esperar()
    expect(desfechos(b.enviadas())).not.toContainEqual({ estado: 'atrasada', commits: 99 })

    // A resposta da leitura corrente é a que chega ao painel.
    pendentes[1]({ kind: 'response', status: 200, body: { status: 'identical' } })
    await esperar()
    expect(desfechos(b.enviadas()).at(-1)).toEqual({ estado: 'em-dia' })
  })
})

describe('a falha da consulta no canal de saída (T041)', () => {
  const CARIMBO = {
    version: '0.6.1',
    commit: 'a23711d481021a978720c0bc478b6dabed94fec3',
    root: '/home/alguem/dev/reversa-views',
  }

  it('escreve uma linha, com origem, ato e razão', async () => {
    const b = bancada({
      build: CARIMBO,
      update: { responder: async () => ({ kind: 'failure', cause: 'tempo-esgotado' }) },
    })
    b.resolver()
    b.enviarDaWebview({ command: 'onLoaded' })
    await esperar()

    const daConsulta = b.lines.filter((linha) => linha.includes('consulta'))
    expect(daConsulta).toHaveLength(1)
    expect(daConsulta[0]).toContain('provider')
    expect(daConsulta[0]).toContain('tempo-esgotado')
    expect(daConsulta[0]).toContain('iago-leal/reversa-views')
  })

  it('cada causa é nomeada por seu próprio nome', async () => {
    for (const causa of ['sem-rede', 'limite-de-taxa', 'resposta-inesperada'] as const) {
      const b = bancada({
        build: CARIMBO,
        update: { responder: async () => ({ kind: 'failure', cause: causa }) },
      })
      b.resolver()
      b.enviarDaWebview({ command: 'onLoaded' })
      await esperar()
      expect(b.lines.filter((linha) => linha.includes(causa))).toHaveLength(1)
    }
  })

  it('consulta bem-sucedida não escreve linha alguma', async () => {
    const b = bancada({ build: CARIMBO, update: {} })
    b.resolver()
    b.enviarDaWebview({ command: 'onLoaded' })
    await esperar()

    expect(b.lines.filter((linha) => linha.includes('consulta'))).toEqual([])
  })
})
