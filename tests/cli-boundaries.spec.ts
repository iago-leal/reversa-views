/**
 * Suíte das fronteiras da ferramenta de terminal (T034, feature 014).
 *
 * Quatro promessas desta feature só se verificam olhando o código, e são as
 * quatro que ninguém vê funcionando: a RN-02 proíbe escrever em camada alguma,
 * a RN-03 confina a criação de processo num módulo só, a D-07 confina a
 * assinatura do disco em outro, e a D-05 mantém o desenho sem uma única
 * sequência de escape fora do módulo do terminal.
 *
 * Divergência aqui é defeito de desenho, e não de teste: corrige-se o código,
 * jamais se afrouxa a suíte.
 */

import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const CLI_DIR = 'src/cli'

/** Todo fonte da ferramenta, caminho e texto, em qualquer profundidade. */
function fontes(dir = CLI_DIR): Array<{ caminho: string; texto: string }> {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entrada) => {
    const caminho = join(dir, entrada.name)
    if (entrada.isDirectory()) return fontes(caminho)
    if (!entrada.name.endsWith('.ts')) return []
    return [{ caminho, texto: readFileSync(caminho, 'utf8') }]
  })
}

/**
 * O mesmo texto sem comentário algum.
 *
 * A fronteira é sobre o que o CÓDIGO alcança, e não sobre o que a prosa cita:
 * um comentário que aponta o contrato desta feature está documentando, e não
 * ensinando a ferramenta onde o Reversa guarda arquivo.
 */
function semComentarios(texto: string): string {
  return texto.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
}

/** Os que casam com um padrão, pelo caminho. */
function comPadrao(padrao: RegExp): string[] {
  return fontes()
    .filter((fonte) => padrao.test(fonte.texto))
    .map((fonte) => fonte.caminho)
    .sort()
}

describe('a ferramenta não escreve (RN-02)', () => {
  const ESCRITAS: Array<[RegExp, string]> = [
    [/\bwriteFileSync\b|\bwriteFile\b/, 'a escrita de arquivo'],
    [/\bappendFileSync\b|\bappendFile\b/, 'o acréscimo a arquivo'],
    [/\bmkdirSync\b|\bmkdir\b/, 'a criação de pasta'],
    [/\brmSync\b|\brmdirSync\b|\bunlinkSync\b|\bunlink\b/, 'a remoção'],
    [/\brenameSync\b|\brename\b/, 'a renomeação'],
    [/\bcreateWriteStream\b/, 'o fluxo de escrita'],
    [/\bcopyFileSync\b|\bcopyFile\b/, 'a cópia'],
    [/\btruncateSync\b|\bftruncate\b/, 'o truncamento'],
    [/\bchmodSync\b|\bchownSync\b/, 'a mudança de modo ou de dono'],
  ]

  it('nenhum módulo alcança uma função capaz de escrever', () => {
    for (const fonte of fontes()) {
      for (const [via, oQueFaz] of ESCRITAS) {
        expect(via.test(fonte.texto), `${fonte.caminho} alcança ${oQueFaz}`).toBe(false)
      }
    }
  })

  it('a guarda reconhece cada via quando ela de fato aparece', () => {
    const amostras = [
      'writeFileSync(caminho, texto)',
      "appendFile(caminho, '\\n')",
      'mkdirSync(pasta)',
      'unlinkSync(caminho)',
      'renameSync(a, b)',
      'createWriteStream(caminho)',
      'copyFileSync(a, b)',
      'truncateSync(caminho)',
      'chmodSync(caminho, 0o600)',
    ]
    for (const amostra of amostras) {
      expect(
        ESCRITAS.some(([via]) => via.test(amostra)),
        `a guarda não reconhece: ${amostra}`,
      ).toBe(true)
    }
  })
})

describe('a criação de processo mora num módulo só (RN-03, D-07)', () => {
  it('o módulo de criação de processo é importado apenas pelo editor', () => {
    expect(comPadrao(/['"]node:child_process['"]/)).toEqual(['src/cli/editor.ts'])
  })

  it('o nome de toda função que cria processo aparece apenas no editor', () => {
    expect(comPadrao(/\bspawnSync\b|\bspawn\b|\bexecSync\b|\bexecFile\w*\b|\bfork\b/)).toEqual([
      'src/cli/editor.ts',
    ])
  })

  it('o editor jamais passa pelo shell', () => {
    const editor = readFileSync('src/cli/editor.ts', 'utf8')
    expect(editor).toContain('shell: false')
    expect(editor).not.toMatch(/shell:\s*true/)
  })
})

describe('a assinatura do disco mora num módulo só (D-07)', () => {
  it('a assinatura de mudança é instalada apenas pela observação', () => {
    expect(comPadrao(/\bwatch\s*\(|\bwatchFile\b|\bFSWatcher\b/)).toEqual(['src/cli/observacao.ts'])
  })

  it('a camada de leitura continua sem observar nada', () => {
    const leitura = readFileSync('src/host/reading.ts', 'utf8')
    expect(leitura).not.toMatch(/\bwatch\s*\(|\bwatchFile\b/)
  })
})

describe('a única conexão continua sendo a que já existe (RN-10, RF-24)', () => {
  const VIAS: Array<[RegExp, string]> = [
    [/['"]node:https?['"]/, 'o módulo nativo de requisição'],
    [/\bfetch\s*\(/, 'o cliente global de requisição'],
    [/\bWebSocket\b/, 'o canal permanente'],
  ]

  it('nenhum módulo da ferramenta abre conexão por conta própria', () => {
    for (const fonte of fontes()) {
      for (const [via, oQueAbre] of VIAS) {
        expect(via.test(fonte.texto), `${fonte.caminho} alcança ${oQueAbre}`).toBe(false)
      }
    }
  })

  it('a conferência entra pela porta que já existe', () => {
    expect(comPadrao(/originPort/)).toEqual(['src/cli/conferencia.ts'])
  })

  it('nenhum módulo da ferramenta carrega endereço de rede', () => {
    expect(comPadrao(/https?:\/\/(?!localhost|127\.0\.0\.1)[a-z]/)).toEqual([])
  })
})

describe('o desenho não conhece sequência de escape (D-05)', () => {
  /** O caractere de escape num literal de texto, em qualquer das três grafias. */
  const ESCAPE = /\\u001b|\\x1b|\\e\[/i

  it('aparece em `terminal.ts` e em nenhum outro arquivo', () => {
    expect(comPadrao(ESCAPE)).toEqual(['src/cli/terminal.ts'])
  })

  it('a guarda reconhece as três grafias', () => {
    for (const amostra of ['"\\u001b[2J"', "'\\x1b[0m'", "'\\e[1m'"]) {
      expect(ESCAPE.test(amostra), `a guarda não reconhece: ${amostra}`).toBe(true)
    }
  })

  it('o reconhecimento de teclas conhece o byte, e não a sequência', () => {
    const teclas = readFileSync('src/cli/teclas.ts', 'utf8')
    expect(teclas).toContain('0x1b')
    expect(ESCAPE.test(teclas)).toBe(false)
  })
})

describe('a ferramenta não reimplementa regra do Reversa (RF-01, RN-01)', () => {
  it('nenhum módulo carrega caminho literal de arquivo do Reversa', () => {
    const infratores = fontes()
      .filter((fonte) => /_reversa_[a-z]+|\.reversa\b/.test(semComentarios(fonte.texto)))
      .map((fonte) => fonte.caminho)
    expect(infratores).toEqual([])
  })
})

/**
 * O estatuto novo de `src/webview/domain/` (T038, T039, D-14).
 *
 * A pasta deixou de ser exclusiva da tela e passou a ser apresentação
 * compartilhada, SEM mudar de lugar: mover tocaria todos os componentes, todas
 * as suítes e todos os adendos entregues sem mudar uma linha de comportamento.
 * O preço dessa economia é que a mudança de estatuto ficaria só na prosa, e é
 * este bloco que a prende: nenhuma regra nova de apresentação pode nascer em
 * `src/cli/quadro/`, e toda regra que lá aparecesse seria uma segunda
 * autoridade sobre um fato que a tela já decide.
 */
describe('nenhuma regra de apresentação nasce no quadro (T039, D-14)', () => {
  const FASES = ['reconhecimento', 'escavacao', 'interpretacao', 'geracao', 'revisao']
  const ESTAGIOS = [
    'sem-feature-ativa',
    'vazio',
    'requirements',
    'plan',
    'coding-em-progresso',
    'done-sem-adendo',
    'done-com-adendo',
  ]
  const SITUACOES = [
    'convergida',
    'entregue-sem-adendo',
    'em-aberto',
    'sem-acoes',
    'acoes-nao-lidas',
  ]

  /** Os fontes do desenho, que são os que esta regra vigia. */
  const doQuadro = (): Array<{ caminho: string; texto: string }> =>
    fontes('src/cli/quadro')

  /** Quantos membros de um vocabulário o texto nomeia literalmente. */
  function nomeados(texto: string, vocabulario: readonly string[]): string[] {
    const codigo = semComentarios(texto)
    return vocabulario.filter(
      (termo) => codigo.includes(`'${termo}'`) || codigo.includes(`"${termo}"`),
    )
  }

  it('nenhum módulo do quadro carrega a lista das fases', () => {
    for (const fonte of doQuadro()) {
      expect(nomeados(fonte.texto, FASES), `${fonte.caminho} decide fase`).toEqual([])
    }
  })

  it('nenhum módulo do quadro carrega a lista dos estágios', () => {
    for (const fonte of doQuadro()) {
      expect(nomeados(fonte.texto, ESTAGIOS), `${fonte.caminho} decide estágio`).toEqual([])
    }
  })

  it('nenhum módulo do quadro carrega a lista das situações', () => {
    for (const fonte of doQuadro()) {
      expect(nomeados(fonte.texto, SITUACOES), `${fonte.caminho} decide situação`).toEqual([])
    }
  })

  it('a guarda reconhece um rótulo literal quando ele de fato aparece', () => {
    expect(nomeados("const x = 'done-sem-adendo'", ESTAGIOS)).toEqual(['done-sem-adendo'])
    expect(nomeados("// fala de 'done-sem-adendo' em comentário", ESTAGIOS)).toEqual([])
  })

  it('cada módulo da apresentação compartilhada declara o estatuto novo', () => {
    const compartilhados = readdirSync('src/webview/domain').filter((nome) => nome.endsWith('.ts'))
    expect(compartilhados.length).toBeGreaterThan(0)
    for (const nome of compartilhados) {
      const texto = readFileSync(join('src/webview/domain', nome), 'utf8')
      expect(texto, `${nome} não declara o estatuto de apresentação compartilhada`).toContain(
        'SHARED PRESENTATION',
      )
    }
  })

  it('o quadro alcança a apresentação compartilhada por importação, e não por cópia', () => {
    const importam = doQuadro().filter((fonte) => /webview\/domain\//.test(fonte.texto))
    expect(importam.length).toBeGreaterThan(0)
  })
})
