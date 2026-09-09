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

/**
 * A guarda que a feature 006 acrescenta (D-13).
 *
 * Até aqui a suíte cobria a escrita por sistema de arquivos síncrono, e só
 * ela. Ficavam de fora a via de escrita do PRÓPRIO EDITOR — `workspace.fs`,
 * `applyEdit`, `WorkspaceEdit` — e a de sistema de arquivos assíncrona, que
 * ninguém usava e nada impedia. A entrega que acrescenta a capacidade de abrir
 * documento e de copiar texto é o momento certo de fechar as duas: o
 * invariante do produto é a extensão nunca escrever arquivo, e capacidade nova
 * sem guarda nova é o caminho por onde um invariante se perde.
 */
describe('a via de escrita do editor e a assíncrona (D-13, RNF de segurança)', () => {
  /** Cada nome, com o que ele abriria se aparecesse. */
  const VIAS: Array<[RegExp, string]> = [
    [/\bworkspace\s*\.\s*fs\b/, 'o sistema de arquivos do editor'],
    [/\bapplyEdit\b/, 'a aplicação de edição no espaço de trabalho'],
    [/\bWorkspaceEdit\b/, 'a construção de uma edição no espaço de trabalho'],
    [/\bTextEdit\b/, 'a construção de uma edição de texto'],
    [/from\s+['"]node:fs\/promises['"]/, 'o sistema de arquivos assíncrono'],
    [/\bfs\s*\.\s*promises\b/, 'o sistema de arquivos assíncrono'],
    [/\bdocument\s*\.\s*save\s*\(/, 'o salvamento de um documento'],
  ]

  it('nenhuma delas aparece em módulo algum do host', () => {
    for (const fonte of [...fontesDoHost(), { nome: 'extension.ts', caminho: 'src/extension.ts', texto: readFileSync('src/extension.ts', 'utf8') }]) {
      for (const [via, oQueAbre] of VIAS) {
        expect(via.test(fonte.texto), `${fonte.nome} alcança ${oQueAbre}`).toBe(false)
      }
    }
  })

  it('a guarda reconhece cada via quando ela de fato aparece', () => {
    // Sem este caso, uma expressão regular que não casa com nada passaria por
    // guarda para sempre. O que se verifica aqui é a guarda, e não o código.
    const amostras = [
      'await vscode.workspace.fs.writeFile(uri, bytes)',
      'await vscode.workspace.applyEdit(edit)',
      'const edit = new vscode.WorkspaceEdit()',
      'edit.insert(uri, posicao, texto) // TextEdit',
      "import { writeFile } from 'node:fs/promises'",
      'await fs.promises.writeFile(caminho, texto)',
      'await document.save()',
    ]
    expect(amostras).toHaveLength(VIAS.length)
    for (let i = 0; i < VIAS.length; i += 1) {
      expect(VIAS[i][0].test(amostras[i]), `a via ${i + 1} não reconhece a própria amostra`).toBe(
        true,
      )
    }
  })

  it('as duas capacidades novas entram por porta declarada, e nenhuma delas escreve', () => {
    const portas = readFileSync('src/host/ports.ts', 'utf8')
    expect(portas).toContain('DraftPort')
    expect(portas).toContain('ClipboardPort')
    // A porta que abre arquivo continua expondo apenas abrir (D-12).
    const editor = portas.slice(portas.indexOf('interface EditorPort'))
    const corpo = editor.slice(0, editor.indexOf('}'))
    expect(corpo).toContain('open(')
    expect(corpo).not.toMatch(/write|save|delete/)
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
