/**
 * Suíte do servidor do preview (T012), contra `scripts/preview/servidor.js`.
 *
 * O contrato inteiro está em `interfaces/canal-do-preview.md`, e é ele que
 * esta suíte exerce: cinco rotas, as recusas de cada uma, e o comportamento do
 * canal diante de envelope torto, que precisa ser o mesmo do roteador do host,
 * uma linha no registro e nenhum erro de servidor.
 *
 * O servidor sobe de verdade, na porta que o sistema der. O que entra por
 * dublê é o que ele serve: página, arquivos e leitura chegam de fora, para que
 * o que se meça aqui seja o roteamento, e não a montagem da tela.
 */

import type { Server } from 'node:http'
import { afterEach, describe, expect, it } from 'vitest'
import { criarServidor } from '../scripts/preview/servidor.js'

let servidor: Server | null = null
const registro: string[] = []

afterEach(async () => {
  if (servidor !== null) await new Promise((pronto) => servidor?.close(pronto))
  servidor = null
  registro.length = 0
})

/** Sobe o servidor numa porta livre e devolve o endereço dele. */
async function subir(ajustes: Record<string, unknown> = {}): Promise<string> {
  servidor = criarServidor({
    pagina: () => '<!DOCTYPE html><html><body>painel</body></html>',
    arquivo: (nome: string) => (nome === 'main.js' ? Buffer.from('bundle') : Buffer.from('folha')),
    leitura: async () => ({ mensagens: [{ command: 'setEntry', data: { kind: 'loading' } }] }),
    registrar: (linha: string) => void registro.push(linha),
    ...ajustes,
  })
  await new Promise<void>((pronto) => servidor?.listen(0, '127.0.0.1', pronto))
  const endereco = servidor.address()
  if (endereco === null || typeof endereco === 'string') throw new Error('sem endereço')
  return `http://127.0.0.1:${endereco.port}`
}

describe('a página e os dois arquivos do pacote', () => {
  it('serve o documento montado por quem o host usa', async () => {
    const base = await subir()
    const resposta = await fetch(`${base}/`)
    expect(resposta.status).toBe(200)
    expect(resposta.headers.get('content-type')).toContain('text/html')
    expect(await resposta.text()).toContain('painel')
  })

  it('serve o script e a folha da pasta de saída', async () => {
    const base = await subir()
    const script = await fetch(`${base}/main.js`)
    const folha = await fetch(`${base}/main.css`)
    expect(script.headers.get('content-type')).toContain('javascript')
    expect(folha.headers.get('content-type')).toContain('text/css')
    expect(await script.text()).toBe('bundle')
  })

  it('manda rodar a construção quando o pacote sumiu com o preview aberto', async () => {
    const base = await subir({ arquivo: () => null })
    const resposta = await fetch(`${base}/main.js`)
    expect(resposta.status).toBe(500)
    expect(await resposta.text()).toMatch(/npm run build/)
  })
})

describe('a leitura', () => {
  it('devolve as mensagens que o host enviaria, em ordem', async () => {
    const base = await subir()
    const resposta = await fetch(`${base}/processo`)
    expect(resposta.status).toBe(200)
    expect(await resposta.json()).toEqual({
      mensagens: [{ command: 'setEntry', data: { kind: 'loading' } }],
    })
  })

  it('declara que não deve ser guardada, porque leitura guardada é mentirosa', async () => {
    const base = await subir()
    const resposta = await fetch(`${base}/processo`)
    expect(resposta.headers.get('cache-control')).toContain('no-store')
  })

  it('falha de leitura vira envelope de erro, jamais 500', async () => {
    const base = await subir({
      leitura: async () => {
        throw new Error('disco sumiu')
      },
    })
    const resposta = await fetch(`${base}/processo`)
    expect(resposta.status).toBe(200)
    const corpo = (await resposta.json()) as { mensagens: Array<{ command: string; data: unknown }> }
    expect(corpo.mensagens.at(-1)?.command).toBe('setEntry')
    expect(corpo.mensagens.at(-1)?.data).toMatchObject({ kind: 'error', message: 'disco sumiu' })
  })
})

describe('o retorno do painel', () => {
  async function mandar(base: string, corpo: unknown): Promise<Response> {
    return fetch(`${base}/canal`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(corpo),
    })
  }

  it('a abertura de arquivo vira linha no terminal, e nenhum editor abre', async () => {
    const base = await subir()
    const resposta = await mandar(base, { command: 'openFile', data: { path: 'a/b.md' } })
    expect(resposta.status).toBe(204)
    expect(registro.join('\n')).toContain('a/b.md')
  })

  it('a linha de registro do painel chega com o prefixo preservado', async () => {
    const base = await subir()
    await mandar(base, { command: 'log', data: { message: 'painel pronto' } })
    expect(registro.join('\n')).toContain('painel pronto')
    expect(registro.join('\n')).toContain('webview')
  })

  it('o comando reservado diz que é reservado, como o host diz', async () => {
    const base = await subir()
    await mandar(base, { command: 'dispatch', data: { agent: 'reversa-plan' } })
    expect(registro.join('\n')).toMatch(/reservado/)
  })

  it('envelope torto vira linha no terminal e 204, nunca erro de servidor', async () => {
    const base = await subir()
    for (const torto of [{ semComando: true }, { command: 'inexistente' }, 'nem objeto']) {
      const resposta = await mandar(base, torto)
      expect(resposta.status).toBe(204)
    }
    expect(registro).toHaveLength(3)
  })

  it('recusa corpo grande, porque o canal só leva caminho e linha de registro', async () => {
    const base = await subir()
    const resposta = await fetch(`${base}/canal`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ command: 'log', data: { message: 'x'.repeat(200_000) } }),
    })
    expect(resposta.status).toBe(413)
  })
})

describe('as recusas do roteador', () => {
  it('caminho desconhecido responde 404 nomeando os cinco válidos', async () => {
    const base = await subir()
    const resposta = await fetch(`${base}/qualquer`)
    expect(resposta.status).toBe(404)
    const texto = await resposta.text()
    for (const caminho of ['/', '/main.js', '/main.css', '/processo', '/canal']) {
      expect(texto).toContain(caminho)
    }
  })

  it('método não previsto responde 405 nomeando o aceito', async () => {
    const base = await subir()
    const resposta = await fetch(`${base}/processo`, { method: 'POST' })
    expect(resposta.status).toBe(405)
    expect(await resposta.text()).toContain('GET')
  })

  it('origem declarada de fora do preview é recusada (RN-03)', async () => {
    const base = await subir()
    const resposta = await fetch(`${base}/processo`, { headers: { origin: 'https://exemplo.com' } })
    expect(resposta.status).toBe(403)
  })

  it('a própria origem passa, que é a única divergência de política declarada', async () => {
    const base = await subir()
    const resposta = await fetch(`${base}/processo`, { headers: { origin: base } })
    expect(resposta.status).toBe(200)
  })
})
