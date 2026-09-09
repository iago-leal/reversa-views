/**
 * Suíte do documento (T012), contra `src/host/document.ts`.
 *
 * RF-09 e RNF-03 pedem uma política mais restrita que a da origem do kit: a
 * cláusula de avaliação dinâmica não existe, origem coringa não existe, e
 * script só entra por nonce da sessão. A origem do webview e o nonce entram
 * por parâmetro, e o gerador de nonce é função própria.
 */

import { describe, expect, it } from 'vitest'
import { buildDocument, createNonce } from '../src/host/document.ts'

const CSP_SOURCE = 'vscode-webview://0a1b2c3d'

function politica(html: string): string {
  const match = html.match(/http-equiv="Content-Security-Policy"\s+content="([^"]+)"/)
  if (match === null) throw new Error('documento sem política de segurança declarada')
  return match[1]!
}

describe('política de segurança', () => {
  const html = buildDocument({ nonce: 'abc123', cspSource: CSP_SOURCE, body: '<p>corpo</p>' })

  it('não admite avaliação dinâmica de código', () => {
    expect(politica(html)).not.toContain('unsafe-eval')
  })

  it('não admite script embutido sem nonce', () => {
    const scriptSrc = politica(html)
      .split(';')
      .map((clause) => clause.trim())
      .find((clause) => clause.startsWith('script-src'))
    expect(scriptSrc).toBeDefined()
    expect(scriptSrc).not.toContain('unsafe-inline')
    expect(scriptSrc).toContain("'nonce-abc123'")
  })

  it('não declara origem coringa em cláusula alguma', () => {
    expect(politica(html)).not.toContain('*')
  })

  it('declara origem padrão nenhuma e conexão nenhuma', () => {
    expect(politica(html)).toContain("default-src 'none'")
    expect(politica(html)).toContain("connect-src 'none'")
  })

  it('restringe imagem, estilo e fonte à origem do próprio webview', () => {
    for (const clausula of ['img-src', 'style-src', 'font-src']) {
      const linha = politica(html)
        .split(';')
        .map((clause) => clause.trim())
        .find((clause) => clause.startsWith(clausula))
      expect(linha).toContain(CSP_SOURCE)
    }
  })
})

describe('nonce', () => {
  it('toda etiqueta de script do documento carrega o nonce da sessão', () => {
    const html = buildDocument({
      nonce: 'deadbeef',
      cspSource: CSP_SOURCE,
      body: '<script nonce="deadbeef">console.log(1)</script>',
    })
    const scripts = html.match(/<script\b[^>]*>/g) ?? []
    expect(scripts.length).toBeGreaterThan(0)
    for (const tag of scripts) expect(tag).toContain('nonce="deadbeef"')
  })

  it('dois documentos gerados em sequência têm nonces diferentes', () => {
    const primeiro = createNonce()
    const segundo = createNonce()
    expect(primeiro).not.toBe(segundo)

    const a = buildDocument({ nonce: primeiro, cspSource: CSP_SOURCE, body: '' })
    const b = buildDocument({ nonce: segundo, cspSource: CSP_SOURCE, body: '' })
    expect(a).not.toBe(b)
  })

  it('tem ao menos 128 bits de entropia em forma hexadecimal', () => {
    const nonce = createNonce()
    expect(nonce).toMatch(/^[0-9a-f]+$/)
    expect(nonce.length).toBeGreaterThanOrEqual(32)
  })
})

describe('corpo do documento', () => {
  it('declara idioma, conjunto de caracteres e área de visão, e nada mais', () => {
    const html = buildDocument({ nonce: 'n', cspSource: CSP_SOURCE, body: '<p>oi</p>' })
    expect(html).toContain('<html lang="pt-BR">')
    expect(html).toContain('<meta charset="utf-8"')
    expect(html).toContain('name="viewport"')
    expect(html).toContain('<p>oi</p>')
  })

  it('não carrega recurso externo algum', () => {
    const html = buildDocument({ nonce: 'n', cspSource: CSP_SOURCE, body: '' })
    expect(html).not.toContain('http://')
    expect(html).not.toContain('https://')
  })
})
