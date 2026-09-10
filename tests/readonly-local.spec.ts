/**
 * Somente leitura por construção, no código local que a feature 006 acrescenta
 * (RNF de segurança, D-06).
 *
 * A suíte herdada `src/heranca/reversa-probe/tests/readonly.spec.ts` varre o
 * pacote herdado, e só ele. Sem esta, a garantia de somente leitura teria um
 * vão exatamente do tamanho do código novo — a sonda local de `src/probe/` e o
 * julgamento de `src/domain/`.
 *
 * O critério aqui é mais estrito que o herdado, e de propósito: o pacote
 * herdado tem um arquivo que toca disco, `files.ts`, ao passo que o código
 * local não tem nenhum. Ele lê reutilizando as três funções que a sonda
 * herdada exporta, e é isso que mantém `node:fs` num arquivo só no repositório
 * inteiro, sem alterar nada do que é vendorizado.
 *
 * Divergência aqui é defeito de desenho, e não de teste: corrige-se o código,
 * jamais se afrouxa a suíte.
 * @module tests/readonly-local
 */

import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import * as probe from '../src/probe/features.ts'
import * as decomposition from '../src/domain/decomposition.ts'
import * as history from '../src/domain/history.ts'

/** As duas pastas do código local que esta feature acrescenta. */
const PASTAS = ['src/probe', 'src/domain']

/** Todo fonte local, caminho e texto, em qualquer profundidade. */
function fontes(dir: string): { caminho: string; texto: string }[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entrada) => {
    const caminho = join(dir, entrada.name)
    if (entrada.isDirectory()) return fontes(caminho)
    if (!entrada.name.endsWith('.ts')) return []
    return [{ caminho, texto: readFileSync(caminho, 'utf8') }]
  })
}

/** Os fontes das duas pastas, juntos. */
function locais(): { caminho: string; texto: string }[] {
  return PASTAS.flatMap((pasta) => fontes(pasta))
}

describe('a suíte tem o que varrer', () => {
  it('encontra fontes nas duas pastas locais', () => {
    expect(locais().length).toBeGreaterThan(0)
    for (const pasta of PASTAS) {
      expect(fontes(pasta).length, `${pasta} sem fonte algum`).toBeGreaterThan(0)
    }
  })
})

describe('módulo de plataforma só onde a leitura acontece (D-06)', () => {
  it('nenhum módulo local importa `node:` coisa alguma', () => {
    const infratores = locais()
      .filter((f) => /from\s+['"]node:/.test(f.texto) || /require\(\s*['"]node:/.test(f.texto))
      .map((f) => f.caminho)
    expect(infratores).toEqual([])
  })

  it('a sonda local lê pelas funções que a sonda herdada exporta', () => {
    const texto = readFileSync('src/probe/features.ts', 'utf8')
    expect(texto).toMatch(/from\s+'\.\.\/heranca\/reversa-probe\/src\/index\.ts'/)
    for (const funcao of ['listNames', 'readText', 'resolveInside']) {
      expect(texto, `a sonda local não usa ${funcao}`).toContain(funcao)
    }
  })

  it('nenhum módulo local toca arquivo vendorizado a não ser importando dele', () => {
    for (const fonte of locais()) {
      const linhas = fonte.texto.split('\n').filter((linha) => linha.includes('heranca'))
      for (const linha of linhas) {
        expect(linha.trim(), `${fonte.caminho}: ${linha.trim()}`).toMatch(/^(import|\*|\/\/)/)
      }
    }
  })
})

describe('nenhuma via de escrita, de execução ou de rede', () => {
  it('não usa interface alguma que escreva, remova ou execute', () => {
    const proibidas = [
      'writeFileSync',
      'appendFileSync',
      'mkdirSync',
      'rmSync',
      'unlinkSync',
      'renameSync',
      'copyFileSync',
      'chmodSync',
      'createWriteStream',
      'child_process',
      'execSync',
      'spawnSync',
      'fs/promises',
    ]
    for (const fonte of locais()) {
      for (const proibida of proibidas) {
        expect(fonte.texto.includes(proibida), `${fonte.caminho} usa ${proibida}`).toBe(false)
      }
    }
  })

  it('não exporta nome que sugira escrita', () => {
    const proibido = /^(write|save|update|delete|remove|create|set|persist|install|run|exec)/i
    for (const modulo of [probe, decomposition, history]) {
      for (const nome of Object.keys(modulo)) {
        expect(nome, `${nome} parece mutador`).not.toMatch(proibido)
      }
    }
  })

  it('jamais nomeia a configuração do Reversa como alvo de escrita', () => {
    for (const fonte of locais()) {
      expect(fonte.texto, fonte.caminho).not.toMatch(/write[^\n]*reversa-config/i)
    }
  })

  /**
   * A guarda que a feature 007 acrescenta (RN-02).
   *
   * A extensão passa a falar com a rede, e é a primeira vez. A capacidade vive
   * num módulo só do host, `src/host/net.ts`, e o que esta suíte guarda é o
   * outro lado disso: a camada de leitura NÃO a ganha. Capacidade nova sem
   * guarda nova é o caminho por onde um invariante se perde, e o invariante
   * aqui é que quem lê o disco não fala com serviço algum.
   */
  it('nenhum módulo local alcança rede, em via alguma', () => {
    const VIAS: Array<[RegExp, string]> = [
      [/['"]node:https?['"]/, 'o módulo nativo de requisição'],
      [/['"]node:net['"]/, 'o módulo de sockets'],
      [/['"]node:tls['"]/, 'o módulo de transporte seguro'],
      [/['"]node:dgram['"]/, 'o módulo de datagramas'],
      [/\bfetch\s*\(/, 'o cliente global de requisição'],
      [/\bXMLHttpRequest\b/, 'o cliente de requisição do navegador'],
      [/\bWebSocket\b/, 'o canal permanente'],
      [/https?:\/\/(?!localhost)[a-z]/, 'um endereço de rede literal'],
    ]
    for (const fonte of locais()) {
      for (const [via, oQueAbre] of VIAS) {
        expect(via.test(fonte.texto), `${fonte.caminho} alcança ${oQueAbre}`).toBe(false)
      }
    }
  })

  it('a guarda de rede reconhece cada via quando ela de fato aparece', () => {
    // Sem este caso, uma expressão que não casa com nada passaria por guarda
    // para sempre. O que se verifica aqui é a guarda, e não o código.
    const amostras: Array<[RegExp, string]> = [
      [/['"]node:https?['"]/, "import { request } from 'node:https'"],
      [/['"]node:net['"]/, "import { Socket } from 'node:net'"],
      [/['"]node:tls['"]/, "import { connect } from 'node:tls'"],
      [/['"]node:dgram['"]/, "import { createSocket } from 'node:dgram'"],
      [/\bfetch\s*\(/, 'const resposta = await fetch(endereco)'],
      [/\bXMLHttpRequest\b/, 'const pedido = new XMLHttpRequest()'],
      [/\bWebSocket\b/, 'const canal = new WebSocket(endereco)'],
      [/https?:\/\/(?!localhost)[a-z]/, 'const base = "https://api.github.com"'],
    ]
    for (const [via, amostra] of amostras) {
      expect(via.test(amostra), `a guarda não reconhece: ${amostra}`).toBe(true)
    }
  })
})
