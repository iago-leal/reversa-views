/**
 * Suíte do corpo do painel (T021), do lado do host.
 *
 * O corpo real é curto de propósito: um ponto de montagem, uma folha e um
 * script. Quem desenha é o bundle, e por isso tudo o que se pode afirmar aqui
 * é sobre as etiquetas e o nonce. Os dois endereços entram por parâmetro já
 * reescritos pelo editor, que é a metade verificável de D-13: caminho de disco
 * seria recusado pela política que `document.ts` declara.
 */

import { describe, expect, it } from 'vitest'
import { buildDocument } from '../src/host/document.ts'
import { panelBody } from '../src/host/panel.ts'

const NONCE = 'a1b2c3d4e5f60718293a4b5c6d7e8f90'
const SCRIPT = 'https://file+.vscode-resource.vscode-cdn.net/out/res/webview/main.js'
const FOLHA = 'https://file+.vscode-resource.vscode-cdn.net/out/res/webview/main.css'

/** O corpo, com os três parâmetros que ele recebe prontos. */
function corpo(overrides: Partial<Parameters<typeof panelBody>[0]> = {}): string {
  return panelBody({ nonce: NONCE, scriptUri: SCRIPT, styleUri: FOLHA, ...overrides })
}

describe('etiquetas do corpo', () => {
  it('traz uma etiqueta de script e uma de folha, e nenhuma outra', () => {
    const markup = corpo()
    expect((markup.match(/<script\b/g) ?? []).length).toBe(1)
    expect((markup.match(/<link\b/g) ?? []).length).toBe(1)
    expect(markup).toMatch(/<link[^>]*rel="stylesheet"/)
  })

  it('aponta o endereço que o editor resolveu, e não caminho de disco', () => {
    const markup = corpo()
    expect(markup).toContain(SCRIPT)
    expect(markup).toContain(FOLHA)
    // Endereço resolvido tem esquema; caminho de disco começa por barra ou
    // por ponto, e é o que a política do documento recusaria.
    for (const atributo of [...markup.matchAll(/(?:src|href)="([^"]+)"/g)]) {
      expect(atributo[1]).toMatch(/^[a-z][a-z0-9+.-]*:\/\//)
    }
    expect(markup).not.toContain('file://')
  })

  it('carrega o nonce da sessão na etiqueta de script', () => {
    expect(corpo()).toMatch(new RegExp(`<script[^>]*nonce="${NONCE}"`))
  })

  it('mantém o nonce quando ele muda, porque ele é da sessão e não do módulo', () => {
    expect(corpo({ nonce: 'ffff' })).toMatch(/<script[^>]*nonce="ffff"/)
  })
})

describe('o que o corpo deliberadamente não traz', () => {
  it('não contém script em linha: o único script tem endereço', () => {
    const markup = corpo()
    expect(markup).toMatch(/<script[^>]*src="/)
    expect(markup).not.toMatch(/<script[^>]*>[^<]+<\/script>/)
  })

  it('não contém estilo em linha, nem etiqueta de estilo', () => {
    const markup = corpo()
    expect(markup).not.toContain('<style')
    expect(markup).not.toMatch(/\sstyle="/)
  })

  it('não desenha conteúdo: quem desenha é o bundle', () => {
    const texto = corpo()
      .replace(/<script[\s\S]*?<\/script>/g, '')
      .replace(/<[^>]+>/g, '')
      .trim()
    expect(texto).toBe('')
  })
})

describe('ponto de montagem', () => {
  it('existe e é único', () => {
    const markup = corpo()
    const pontos = markup.match(/id="root"/g) ?? []
    expect(pontos.length).toBe(1)
  })

  it('está vazio, para que a montagem o preencha', () => {
    expect(corpo()).toMatch(/<div id="root"><\/div>/)
  })
})

describe('o corpo dentro do documento', () => {
  it('atravessa `buildDocument` sem que a política precise mudar', () => {
    const documento = buildDocument({
      nonce: NONCE,
      cspSource: 'https://file+.vscode-resource.vscode-cdn.net',
      body: corpo(),
    })
    expect(documento).toContain(`script-src 'nonce-${NONCE}'`)
    expect(documento).toContain(`style-src https://file+.vscode-resource.vscode-cdn.net`)
    expect(documento).toContain(SCRIPT)
  })
})
