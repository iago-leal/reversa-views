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
    configuration?: {
      title?: string
      properties?: Record<string, { type?: string; default?: unknown; description?: string }>
    }
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
  it('declara os dezoito scripts, e apenas eles', () => {
    expect(Object.keys(manifesto.scripts ?? {})).toEqual([
      'pretest',
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
      'gerar:carimbo',
      'preview',
      'empacotar',
      'atualizar',
      'observar:webview',
      'estragar:workspace',
      'estragar:registro',
    ])
  })

  it('o build confere a herança localmente e gera a constante antes de compilar (RF-19)', () => {
    const build = manifesto.scripts?.build ?? ''
    expect(build.indexOf('check:heranca:local')).toBeLessThan(build.indexOf('compile'))
    expect(build.indexOf('gerar:revisao-heranca')).toBeLessThan(build.indexOf('compile'))
    expect(build).not.toContain('check:heranca &&')
  })

  it('o build gera o carimbo da construção antes de compilar (D-07)', () => {
    const build = manifesto.scripts?.build ?? ''
    expect(build).toContain('gerar:carimbo')
    expect(build.indexOf('gerar:carimbo')).toBeLessThan(build.indexOf('compile'))
  })

  it('o carimbo da construção tem comando avulso, como a revisão do modelo tem', () => {
    expect(manifesto.scripts?.['gerar:carimbo']).toBe('node scripts/gerar-carimbo-da-construcao.js')
  })

  it('a suíte também gera o carimbo antes de rodar, porque ele não é versionado', () => {
    // Consequência de D-19: o arquivo não está no clone recém-feito, e a
    // ativação o importa. Sem esta linha, `npm test` num clone limpo falharia
    // por arquivo ausente, e a causa não pareceria a que é.
    expect(manifesto.scripts?.pretest).toBe('npm run gerar:carimbo')
  })

  it('o carimbo NÃO é versionado, e a revisão do modelo continua sendo (D-19)', () => {
    // A assimetria é a decisão: a revisão muda quando a herança é
    // ressincronizada, o commit muda a cada commit, e versionar o segundo
    // deixaria a árvore suja depois de todo build.
    //
    // A leitura descarta comentário e linha vazia de propósito: o arquivo
    // EXPLICA a assimetria em prosa, e nomear os dois arquivos ali é o que
    // torna a decisão legível para quem voltar em doze meses. O que vale como
    // padrão é a linha efetiva.
    const padrões = readFileSync('.gitignore', 'utf8')
      .split('\n')
      .map((linha) => linha.trim())
      .filter((linha) => linha !== '' && !linha.startsWith('#'))

    expect(padrões).toContain('src/host/build.ts')
    expect(padrões).not.toContain('src/host/inheritance.ts')
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
    expect(manifesto.scripts?.atualizar ?? '').not.toContain('publish')
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

describe('a chave de configuração da conferência (D-11, RF-14)', () => {
  const propriedades = manifesto.contributes?.configuration?.properties ?? {}
  const chave = propriedades['reversaViews.conferirAtualizacao']

  it('existe, e é a única que a extensão contribui', () => {
    expect(Object.keys(propriedades)).toEqual(['reversaViews.conferirAtualizacao'])
  })

  it('é booleana e verdadeira por padrão: a consulta foi pedida como comportamento', () => {
    expect(chave?.type).toBe('boolean')
    expect(chave?.default).toBe(true)
  })

  it('usa o mesmo prefixo dos comandos já declarados', () => {
    const prefixos = (manifesto.contributes?.commands ?? []).map((comando) =>
      comando.command.split('.')[0],
    )
    for (const prefixo of prefixos) expect(prefixo).toBe('reversaViews')
    expect(Object.keys(propriedades)[0].startsWith('reversaViews.')).toBe(true)
  })

  it('tem título de seção e descrição em português, e a descrição declara o que não viaja', () => {
    expect(manifesto.contributes?.configuration?.title).toBe('Reversa')
    const descricao = chave?.description ?? ''
    expect(descricao.length).toBeGreaterThan(40)
    for (const termo of ['anônima', 'credencial', 'workspace']) {
      expect(descricao, `a descrição não menciona ${termo}`).toContain(termo)
    }
  })
})
