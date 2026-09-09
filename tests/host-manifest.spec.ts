/**
 * Suíte do manifesto (T015), lendo o `package.json` do repositório.
 *
 * RF-18 fixa o mínimo de extensão que esta feature acrescenta, e o critério
 * de aceite dele é tanto o que entra quanto o que não entra: empacotador,
 * script de empacotamento e lista de exclusão de VSIX pertencem à feature 005.
 */

import { existsSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const manifesto = JSON.parse(readFileSync('package.json', 'utf8')) as {
  engines?: Record<string, string>
  main?: string
  activationEvents?: string[]
  contributes?: {
    viewsContainers?: { activitybar?: Array<{ id: string; title: string; icon: string }> }
    views?: Record<string, Array<{ id: string; name: string; type?: string }>>
    commands?: Array<{ command: string; title: string }>
  }
  scripts?: Record<string, string>
  devDependencies?: Record<string, string>
  dependencies?: Record<string, string>
}

describe('versão mínima do editor', () => {
  it('é 1.78 e coincide com a da tipagem instalada (D-12)', () => {
    expect(manifesto.engines?.vscode).toBe('^1.78.0')
    expect(manifesto.devDependencies?.['@types/vscode']).toBe('1.78.0')
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

describe('comando de releitura (RF-07, D-11)', () => {
  it('existe, com identificador e título próprios', () => {
    const comandos = manifesto.contributes?.commands ?? []
    expect(comandos.map((comando) => comando.command)).toContain('reversaViews.reload')
  })
})

describe('as duas unidades de compilação (RF-23, D-04)', () => {
  it('declara os dez scripts, e apenas eles', () => {
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

describe('o que pertence à feature 005 e não entra aqui', () => {
  it('nenhum script de empacotamento de extensão', () => {
    const scripts = Object.keys(manifesto.scripts ?? {})
    for (const nome of ['package', 'vscode:prepublish', 'vsix']) {
      expect(scripts).not.toContain(nome)
    }
  })

  it('nenhuma lista de exclusão de VSIX', () => {
    expect(existsSync('.vscodeignore')).toBe(false)
  })

  it('nenhuma ferramenta de empacotamento de extensão em dependências', () => {
    const deps = Object.keys(manifesto.devDependencies ?? {})
    for (const nome of ['webpack', 'rollup', 'vite', '@vscode/vsce', 'vsce']) {
      expect(deps).not.toContain(nome)
    }
  })
})
