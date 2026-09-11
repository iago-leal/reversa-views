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

/**
 * A capacidade de rede, confinada a um módulo (D-01, RN-01, feature 007).
 *
 * A extensão passa a falar com a rede pela primeira vez. A fronteira é a mesma
 * espécie da de `node:fs` acima: um módulo só a importa, e é por isso que ela
 * se verifica por busca de texto. Espalhá-la pelo provedor tornaria a
 * privacidade da consulta uma afirmação em prosa, e não um fato conferível.
 */
describe('rede (D-01, RN-01)', () => {
  /** Onde a capacidade vive, e o único lugar onde pode viver. */
  const MODULO_DE_REDE = 'net.ts'

  const VIAS_DE_REDE = [
    /['"]node:https?['"]/,
    /['"]node:net['"]/,
    /['"]node:tls['"]/,
    /\bfetch\s*\(/,
    /\bXMLHttpRequest\b/,
    /\bWebSocket\b/,
  ]

  it('só um módulo do host importa cliente de requisição, e é o declarado', () => {
    const comRede = fontesDoHost()
      .filter((fonte) => VIAS_DE_REDE.some((via) => via.test(fonte.texto)))
      .map((fonte) => fonte.nome)
    expect(comRede).toEqual([MODULO_DE_REDE])
  })

  it('nem a ativação alcança rede: ela monta a porta, não a usa', () => {
    const texto = readFileSync('src/extension.ts', 'utf8')
    for (const via of VIAS_DE_REDE) expect(via.test(texto)).toBe(false)
  })

  it('o endereço do serviço é literal em um módulo só, e não vem de fora', () => {
    // RNF de segurança: nem argumento, nem variável de ambiente, nem arquivo
    // do workspace. Um workspace hostil não redireciona a consulta.
    //
    // A busca é pelo NOME DO SERVIÇO, e não por um endereço com esquema: o
    // módulo monta a requisição por partes, e o esquema é campo à parte.
    const comServiço = fontesDoHost()
      .filter((fonte) => /['"][a-z0-9.-]*\bgithub\.com['"]/.test(fonte.texto))
      .map((fonte) => fonte.nome)
    expect(comServiço).toEqual([MODULO_DE_REDE])

    const rede = readFileSync(join(HOST_DIR, MODULO_DE_REDE), 'utf8')
    expect(rede).not.toMatch(/process\s*\.\s*env/)
    expect(rede).not.toMatch(/process\s*\.\s*argv/)
  })

  it('o módulo de rede não escreve arquivo nem executa processo', () => {
    // O que se proíbe é a IMPORTAÇÃO, e não a menção: o módulo explica em
    // prosa por que a fronteira de `node:fs` na camada de leitura é o
    // precedente desta, e nomear o precedente é o que torna a decisão legível.
    const rede = readFileSync(join(HOST_DIR, MODULO_DE_REDE), 'utf8')
    const importados = [...rede.matchAll(/^\s*import\s[^;\n]*from\s+'([^']+)'/gm)].map(
      (casou) => casou[1],
    )
    expect(importados).not.toContain('node:fs')
    expect(importados).not.toContain('node:child_process')
    for (const chamada of ['writeFileSync(', 'execFileSync(', 'spawn(']) {
      expect(rede.includes(chamada), `net.ts chama ${chamada}`).toBe(false)
    }
  })

  it('o intérprete do desfecho é puro: não alcança rede nem editor', () => {
    const interprete = readFileSync(join(HOST_DIR, 'update.ts'), 'utf8')
    for (const via of VIAS_DE_REDE) expect(via.test(interprete)).toBe(false)
    expect(interprete).not.toMatch(/from\s+'vscode'/)
  })

  it('a consulta entra por porta declarada, e a porta expõe só leitura', () => {
    const portas = readFileSync(join(HOST_DIR, 'ports.ts'), 'utf8')
    expect(portas).toContain('OriginPort')
    expect(portas).toContain('ConfigPort')

    const origem = portas.slice(portas.indexOf('interface OriginPort'))
    const corpo = origem.slice(0, origem.indexOf('}'))
    expect(corpo).toContain('compare(')
    expect(corpo).not.toMatch(/write|post|put|delete|patch/i)
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

  /**
   * Os artefatos do `/reversa-new` (feature 009, RN-09). Os nomes vivem em
   * `src/domain/limits.ts` e chegam ao host só como o tipo do eixo; um host que
   * os escrevesse saberia onde o Reversa guarda arquivo, que é o que RF-14
   * proíbe. A busca é por nome de arquivo e pela pasta de specs com barra, para
   * não acusar a palavra `sdd` dentro de `spec-sdd` na prosa de um comentário.
   */
  it('nenhum nome de artefato greenfield nem a pasta de specs', () => {
    for (const fonte of decisores()) {
      expect(fonte.texto, fonte.nome).not.toMatch(
        /newproject-brief|newproject_progress|ideation\.md|personas\.md|prd\.md|architecture\.md|domain\.md|\bsdd\//,
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

  /** Os agentes e os estágios físicos da pipeline greenfield ficam do lado de lá do canal. */
  it('nenhum nome de agente nem de estágio da pipeline greenfield', () => {
    for (const fonte of decisores()) {
      expect(fonte.texto, fonte.nome).not.toMatch(
        /'ideator'|'researcher'|'drafter'|'spec-sdd'|'aberto'|'ideado'|'pesquisado'|'redigido'|'especificado'/,
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
