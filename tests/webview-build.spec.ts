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
import { TETO_DO_PACOTE_DA_TELA } from '../scripts/limites.js'

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
  it('mira o Chromium que o editor mínimo declarado embarca, lido do módulo', () => {
    expect(SCRIPT).toContain('ALVO_DO_NAVEGADOR')
    expect(SCRIPT).toContain("require('./limites')")
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

describe('a guarda de tamanho (RF-14, D-11)', () => {
  it('mora ao fim do empacotamento, que é quem sabe o que emitiu', () => {
    expect(SCRIPT).toContain('TETO_DO_PACOTE_DA_TELA')
    expect(SCRIPT).toMatch(/function conferirTamanho|conferirTamanho\(/)
  })

  it('soma os dois arquivos emitidos, porque folha e script viajam juntos', () => {
    expect(SCRIPT).toContain('main.js')
    expect(SCRIPT).toContain('main.css')
  })

  it('interrompe o processo em vez de apenas avisar', () => {
    expect(SCRIPT).toMatch(/process\.exit\(1\)/)
  })

  it('o que a última construção emitiu cabe no teto, com a medida registrada', () => {
    const emitidos = ['out/res/webview/main.js', 'out/res/webview/main.css']
    if (!emitidos.every((caminho) => existsSync(caminho))) return
    const soma = emitidos.reduce((total, caminho) => total + statSync(caminho).size, 0)
    // A medida sai no relato do próprio teste, e não só quando ele falha: o que
    // interessa a quem volta daqui a meses é a folga, e uma folga que só
    // aparece na falha só aparece tarde demais. Na entrega da feature 008 o
    // pacote somava 194018 B, pouco menos da metade do teto de 400 KiB;
    // a feature 006 media 176.4 KiB, de modo que o bloco de bugs custou cerca
    // de 13 KiB.
    const folga = TETO_DO_PACOTE_DA_TELA - soma
    expect(
      soma,
      `o pacote da tela soma ${soma} B contra o teto de ${TETO_DO_PACOTE_DA_TELA} B (folga de ${folga} B)`,
    ).toBeLessThanOrEqual(TETO_DO_PACOTE_DA_TELA)

    // A folga medida contra a metade do teto, e não contra ele mesmo. Cartão
    // novo que só coubesse raspando teria a saída fácil de subir um pouco o
    // teto, e ninguém veria; exigir metade dá à próxima feature o mesmo espaço
    // que esta encontrou, e o número continua morando num lugar só (RN-06).
    expect(soma * 2, 'o pacote da tela passou de metade do teto').toBeLessThanOrEqual(
      TETO_DO_PACOTE_DA_TELA,
    )
  })
})
