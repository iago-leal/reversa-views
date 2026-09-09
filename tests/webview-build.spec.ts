/**
 * Suíte da construção (T049), contra os arquivos de configuração e a saída
 * que a construção deixou (RF-23, D-04, D-15).
 *
 * Ela **não** roda o empacotador: um teste que constrói o bundle mede a
 * máquina, não o código, e demora o suficiente para deixar de ser rodado.
 * O que ela lê é a declaração da construção e o que a última construção
 * produziu, e é `npm run build` quem a alimenta.
 */

import { existsSync, readFileSync, statSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const SCRIPT = readFileSync('scripts/build-webview.js', 'utf8')
const CONFIG = JSON.parse(readFileSync('tsconfig.webview.json', 'utf8')) as {
  compilerOptions: { types?: string[]; noEmit?: boolean; jsx?: string }
  include?: string[]
}
const MANIFESTO = JSON.parse(readFileSync('package.json', 'utf8')) as {
  scripts: Record<string, string>
}

describe('um comando produz as duas unidades', () => {
  it('a construção encadeia a compilação do host e o empacotamento da webview', () => {
    expect(MANIFESTO.scripts.build).toContain('compile')
    expect(MANIFESTO.scripts.build).toContain('build:webview')
  })

  it('a saída traz o host e os dois arquivos da webview', () => {
    for (const caminho of [
      'out/extension.js',
      'out/res/webview/main.js',
      'out/res/webview/main.css',
    ]) {
      expect(existsSync(caminho), `${caminho} não foi produzido`).toBe(true)
      expect(statSync(caminho).size, `${caminho} saiu vazio`).toBeGreaterThan(0)
    }
  })
})

describe('fronteira de compilação da webview (RF-23)', () => {
  it('declara lista de tipos ambientais vazia, que é a prova estática', () => {
    expect(CONFIG.compilerOptions.types).toEqual([])
  })

  it('não emite: quem emite é o empacotador', () => {
    expect(CONFIG.compilerOptions.noEmit).toBe(true)
  })

  it('inclui os fontes da webview, e não os do host', () => {
    expect(CONFIG.include).toContain('src/webview/**/*')
    expect(CONFIG.include?.some((padrão) => padrão.startsWith('src/host'))).toBe(false)
  })
})

describe('declaração do empacotamento', () => {
  it('mira o Chromium que o editor mínimo declarado embarca', () => {
    expect(SCRIPT).toContain("'chrome108'")
  })

  it('emite no formato de execução imediata, que é o que a política aceita', () => {
    expect(SCRIPT).toMatch(/format:\s*'iife'/)
  })

  it('declara uma entrada, e uma só', () => {
    const entradas = SCRIPT.match(/entryPoints:\s*\[([^\]]*)\]/)
    expect(entradas).not.toBeNull()
    // O caminho é montado por segmentos, então o que se conta é o arquivo, e
    // não a vírgula: uma segunda entrada traria um segundo nome de arquivo.
    expect(entradas?.[1].match(/'[^']*\.[jt]sx?'/g)).toHaveLength(1)
  })

  it('emite com nomes estáveis, para que o corpo do painel possa apontá-los', () => {
    expect(SCRIPT).toMatch(/entryNames:\s*'\[name\]'/)
  })
})

describe('o podador na construção (D-15)', () => {
  it('está declarado como extensão da construção', () => {
    expect(SCRIPT).toMatch(/plugins:\s*\[trimColourSets\(/)
  })

  it('recebe as opções sem si mesmo dentro, porque ele constrói por conta própria', () => {
    expect(SCRIPT).toMatch(/trimColourSets\(options\)/)
    expect(SCRIPT).toMatch(/const options = \{[\s\S]*?\n\}/)
    const declaração = SCRIPT.match(/const options = \{[\s\S]*?\n\}/)?.[0] ?? ''
    expect(declaração).not.toContain('plugins')
  })
})
