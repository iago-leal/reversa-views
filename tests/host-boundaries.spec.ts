/**
 * Suíte das fronteiras (T016), lendo os próprios fontes de `src/`.
 *
 * Três requisitos desta feature só se verificam olhando o código: D-01
 * concentra a dependência do editor em dois arquivos, RF-17 exige um único
 * ponto de travessia, e RF-14 proíbe o host de saber onde o Reversa guarda
 * arquivo ou como calcula estágio. Divergência aqui é defeito de desenho, e
 * não de teste: corrige-se o código, jamais se afrouxa a suíte.
 */

import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const HOST_DIR = 'src/host'

function fontesDoHost(): Array<{ nome: string; caminho: string; texto: string }> {
  return readdirSync(HOST_DIR)
    .filter((nome) => nome.endsWith('.ts'))
    .map((nome) => {
      const caminho = join(HOST_DIR, nome)
      return { nome, caminho, texto: readFileSync(caminho, 'utf8') }
    })
}

function todosOsFontes(): string[] {
  return [...fontesDoHost().map((fonte) => fonte.caminho), 'src/extension.ts']
}

/** Uma importação de valor; `import type` não conta, por não sobreviver à compilação. */
function importaValorDoEditor(texto: string): boolean {
  return /^\s*import\s+(?!type\b)[^;\n]*from\s+'vscode'/m.test(texto)
}

function ocorrencias(texto: string, padrao: RegExp): number {
  return (texto.match(padrao) ?? []).length
}

describe('dependência do editor (D-01)', () => {
  it('a importação de valor aparece em exatamente dois arquivos', () => {
    const comValor = todosOsFontes().filter((caminho) =>
      importaValorDoEditor(readFileSync(caminho, 'utf8')),
    )
    expect(comValor.sort()).toEqual(['src/extension.ts', 'src/host/adapters.ts'])
  })

  it('importação de tipo não conta, e é o que os demais módulos usam', () => {
    expect(importaValorDoEditor("import type * as vscode from 'vscode'\n")).toBe(false)
    expect(importaValorDoEditor("import * as vscode from 'vscode'\n")).toBe(true)
  })
})

describe('ponto único de travessia (RF-17)', () => {
  const CHAMADA_DE_ENVIO = /\.\s*postMessage\s*\(/g
  const REGISTRO_DE_OUVINTE = /\.\s*onDidReceiveMessage\s*\(/g

  /**
   * Sem exceção alguma: `provisional.ts` foi removido pela feature 003, e a
   * contagem passa a valer para todos os módulos do host. O outro lado do
   * canal, que aquela exceção cobria, agora vive na webview e é a suíte de
   * `webview-boundaries.spec.ts` que o verifica.
   */
  const doHost = () => fontesDoHost()

  it('a chamada de envio aparece uma vez, em bridge.ts', () => {
    const porArquivo = doHost().map(
      (fonte) => [fonte.nome, ocorrencias(fonte.texto, CHAMADA_DE_ENVIO)] as const,
    )
    expect(porArquivo.filter(([, quantas]) => quantas > 0)).toEqual([['bridge.ts', 1]])
  })

  it('o registro de ouvinte aparece uma vez, em bridge.ts', () => {
    const porArquivo = doHost().map(
      (fonte) => [fonte.nome, ocorrencias(fonte.texto, REGISTRO_DE_OUVINTE)] as const,
    )
    expect(porArquivo.filter(([, quantas]) => quantas > 0)).toEqual([['bridge.ts', 1]])
  })

  it('nenhum módulo do host toma a interface da webview', () => {
    for (const fonte of doHost()) {
      expect(fonte.texto, fonte.nome).not.toMatch(/acquireVsCodeApi/)
    }
  })

  it('nem a ativação chama a interface de mensagens', () => {
    const texto = readFileSync('src/extension.ts', 'utf8')
    expect(ocorrencias(texto, CHAMADA_DE_ENVIO)).toBe(0)
    expect(ocorrencias(texto, REGISTRO_DE_OUVINTE)).toBe(0)
  })
})

describe('disco (RN-01)', () => {
  it('nenhum módulo do host fora dos adaptadores importa node:fs', () => {
    const comFs = fontesDoHost()
      .filter((fonte) => fonte.nome !== 'adapters.ts')
      .filter((fonte) => /from\s+'node:fs'/.test(fonte.texto))
      .map((fonte) => fonte.nome)
    expect(comFs).toEqual([])
  })

  it('nenhum módulo do host escreve arquivo, em forma alguma', () => {
    for (const fonte of fontesDoHost()) {
      expect(fonte.texto).not.toMatch(/writeFileSync|createWriteStream|\bmkdirSync\b|\brmSync\b/)
    }
  })
})

describe('nada de layout do Reversa no host (RF-14)', () => {
  /** Sem exceção: o corpo provisório que a carregava saiu com a feature 003. */
  const decisores = () => fontesDoHost()

  it('nenhum caminho literal de arquivo do Reversa', () => {
    for (const fonte of decisores()) {
      expect(fonte.texto, fonte.nome).not.toMatch(
        /\.reversa\/|_reversa_sdd|_reversa_forward|state\.json|actions\.md|active-requirements/,
      )
    }
  })

  it('nenhum cálculo de estágio nem de fase', () => {
    for (const fonte of decisores()) {
      expect(fonte.texto, fonte.nome).not.toMatch(
        /'requirements'|'clarify'|'to-do'|'reconhecimento'|'escavacao'|'geracao'/,
      )
    }
  })

  it('a leitura entra pela camada herdada, e por ela só', () => {
    const leitura = readFileSync('src/host/reading.ts', 'utf8')
    expect(leitura).toContain('readReversaSnapshot')
    expect(leitura).toContain('reversa-domain')
    expect(leitura).not.toMatch(/from\s+'node:fs'/)
  })
})
