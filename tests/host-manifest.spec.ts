/**
 * Suíte do manifesto (T015, ampliada em T029), lendo o `package.json`.
 *
 * RF-18 fixa o mínimo de extensão que a feature 003 acrescentou. A feature 005
 * inverteu o bloco final desta suíte: empacotador, comando de empacotamento e
 * lista de conteúdo do pacote, que antes eram o que NÃO podia entrar, passaram
 * a ser o que TEM de estar.
 *
 * A lista de comandos é fixada por inteiro, de propósito: mexer nela é declarar
 * a mudança em vez de sofrê-la. Foi assim que ela passou de seis para dez na
 * feature 004, e de dez para catorze aqui.
 */

import { existsSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  ALVO_DO_NAVEGADOR,
  FAIXA_DO_EDITOR_NO_MANIFESTO,
  VERSAO_MINIMA_DO_EDITOR,
} from '../scripts/limites.js'

const manifesto = JSON.parse(readFileSync('package.json', 'utf8')) as {
  publisher?: string
  private?: boolean
  license?: string
  repository?: unknown
  icon?: string
  engines?: Record<string, string>
  main?: string
  activationEvents?: string[]
  contributes?: {
    viewsContainers?: { activitybar?: Array<{ id: string; title: string; icon: string }> }
    views?: Record<string, Array<{ id: string; name: string; type?: string }>>
    commands?: Array<{ command: string; title: string; category?: string }>
  }
  scripts?: Record<string, string>
  devDependencies?: Record<string, string>
  dependencies?: Record<string, string>
}

describe('versão mínima do editor', () => {
  it('é a do módulo de limites e coincide com a da tipagem instalada (D-12)', () => {
    expect(manifesto.engines?.vscode).toBe(FAIXA_DO_EDITOR_NO_MANIFESTO)
    expect(manifesto.devDependencies?.['@types/vscode']).toBe(`${VERSAO_MINIMA_DO_EDITOR}.0`)
  })
})

describe('ponto de entrada', () => {
  it('aponta para a saída compilada', () => {
    expect(manifesto.main).toBe('./out/extension.js')
  })
})

describe('ativação', () => {
  it('tem um único evento, o da visão, e nenhum coringa (RF-02)', () => {
    expect(manifesto.activationEvents).toEqual(['onView:reversaViews.process'])
    expect(manifesto.activationEvents).not.toContain('*')
    expect(manifesto.activationEvents).not.toContain('onStartupFinished')
  })
})

describe('contêiner de visão (RF-01)', () => {
  const conteiner = manifesto.contributes?.viewsContainers?.activitybar?.[0]

  it('existe na barra de atividades, com identificador e título próprios', () => {
    expect(manifesto.contributes?.viewsContainers?.activitybar).toHaveLength(1)
    expect(conteiner?.id).toBe('reversa-views')
    expect(conteiner?.title).toBe('Reversa')
  })

  it('aponta um ícone que existe de fato no repositório', () => {
    expect(conteiner?.icon).toBe('media/reversa.svg')
    expect(existsSync(conteiner!.icon)).toBe(true)
  })
})

describe('visão', () => {
  it('é de tipo webview e vive no contêiner declarado', () => {
    const visoes = manifesto.contributes?.views?.['reversa-views']
    expect(visoes).toHaveLength(1)
    expect(visoes?.[0]?.id).toBe('reversaViews.process')
    expect(visoes?.[0]?.type).toBe('webview')
    expect(visoes?.[0]?.name).toBe('Processo')
  })
})

describe('comandos da paleta (RF-07, D-11)', () => {
  const comandos = manifesto.contributes?.commands ?? []

  it('são os dois declarados, e apenas eles', () => {
    expect(comandos.map((comando) => comando.command)).toEqual([
      'reversaViews.abrir',
      'reversaViews.reload',
    ])
  })

  it('compartilham a categoria que os agrupa na paleta', () => {
    expect(comandos.map((comando) => comando.category)).toEqual(['Reversa', 'Reversa'])
  })
})

describe('as duas unidades de compilação (RF-23, D-04)', () => {
  it('declara os catorze scripts, e apenas eles', () => {
    expect(Object.keys(manifesto.scripts ?? {})).toEqual([
      'test',
      'typecheck',
      'compile',
      'build:webview',
      'build',
      'check:webview',
      'check:heranca',
      'check:heranca:local',
      'sync:heranca',
      'gerar:revisao-heranca',
      'preview',
      'empacotar',
      'observar:webview',
      'estragar:workspace',
    ])
  })

  it('o build confere a herança localmente e gera a constante antes de compilar (RF-19)', () => {
    const build = manifesto.scripts?.build ?? ''
    expect(build.indexOf('check:heranca:local')).toBeLessThan(build.indexOf('compile'))
    expect(build.indexOf('gerar:revisao-heranca')).toBeLessThan(build.indexOf('compile'))
    expect(build).not.toContain('check:heranca &&')
  })

  it('o interpretador de YAML entra com igualdade exata, e só como ferramenta', () => {
    expect(manifesto.devDependencies?.yaml).toMatch(/^\d+\.\d+\.\d+$/)
    expect(manifesto.dependencies?.yaml).toBeUndefined()
  })

  it('as dependências de interface e a dos tokens entram com igualdade exata', () => {
    const deps = manifesto.devDependencies ?? {}
    for (const nome of ['react', 'react-dom', '@types/react', '@types/react-dom', 'esbuild', '@primer/primitives']) {
      expect(deps[nome], `${nome} não está declarado`).toBeDefined()
      expect(deps[nome], `${nome} tem faixa de versão`).toMatch(/^\d+\.\d+\.\d+$/)
    }
  })

  it('não traz `@primer/react`, que é o recorte de D-02', () => {
    const todas = { ...(manifesto.dependencies ?? {}), ...(manifesto.devDependencies ?? {}) }
    expect(Object.keys(todas)).not.toContain('@primer/react')
  })
})

describe('o empacotamento, que a feature 005 trouxe', () => {
  it('o empacotador oficial entra com igualdade exata, e só como ferramenta', () => {
    expect(manifesto.devDependencies?.['@vscode/vsce']).toMatch(/^\d+\.\d+\.\d+$/)
    expect(manifesto.dependencies?.['@vscode/vsce']).toBeUndefined()
  })

  it('o conteúdo do pacote é declarado, e por reinclusão explícita (RN-07)', () => {
    expect(existsSync('.vscodeignore')).toBe(true)
    const lista = readFileSync('.vscodeignore', 'utf8')
      .split('\n')
      .map((linha) => linha.trim())
      .filter((linha) => linha.length > 0 && !linha.startsWith('#'))
    expect(lista[0], 'a primeira regra tem de excluir tudo').toBe('**')
    expect(lista.slice(1).every((linha) => linha.startsWith('!'))).toBe(true)
  })

  it('o manifesto nomeia um publicador local e segue privado (RF-04)', () => {
    expect(manifesto.publisher).toBe('iagoleal-local')
    expect(manifesto.private).toBe(true)
  })

  it('nada aqui depende de conta no Marketplace (RN-09)', () => {
    for (const campo of ['license', 'repository', 'icon']) {
      expect(manifesto[campo as keyof typeof manifesto]).toBeUndefined()
    }
    expect(manifesto.scripts?.empacotar ?? '').not.toContain('publish')
  })

  it('nenhum outro empacotador entrou junto', () => {
    const deps = Object.keys(manifesto.devDependencies ?? {})
    for (const nome of ['webpack', 'rollup', 'vite', 'vsce']) {
      expect(deps).not.toContain(nome)
    }
  })
})

describe('a coerência entre o alvo e a versão mínima (RF-16)', () => {
  it('o empacotamento da webview mira o Chromium do editor mínimo declarado', () => {
    const build = readFileSync('scripts/build-webview.js', 'utf8')
    expect(build).toContain('ALVO_DO_NAVEGADOR')
    expect(
      ALVO_DO_NAVEGADOR,
      `o alvo ${ALVO_DO_NAVEGADOR} e a versão mínima ${VERSAO_MINIMA_DO_EDITOR} vêm do mesmo módulo, e é lá que a divergência é conferida`,
    ).toMatch(/^chrome\d+$/)
  })
})
