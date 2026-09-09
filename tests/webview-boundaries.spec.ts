/**
 * Suíte das fronteiras da webview (T020), lendo os próprios fontes de
 * `src/webview/`.
 *
 * Quatro decisões desta feature só se verificam olhando o código: D-01 mantém
 * o desenho separado da decisão, D-06 concentra o canal num arquivo só, D-11
 * proíbe estilo em linha porque a política do documento o recusaria, e D-02
 * confina os nomes dos conjuntos de cor num arquivo. Divergência aqui é
 * defeito de desenho, e não de teste: corrige-se o código, jamais se afrouxa a
 * suíte.
 */

import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { OFFERED_THEMES, SECTION_NAMES } from '../src/webview/domain/types.ts'

const WEBVIEW_DIR = 'src/webview'

/** Every source of the webview, path and text, at any depth. */
function fontes(dir = WEBVIEW_DIR): { caminho: string; texto: string }[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entrada) => {
    const caminho = join(dir, entrada.name)
    if (entrada.isDirectory()) return fontes(caminho)
    if (!/\.tsx?$/.test(entrada.name)) return []
    return [{ caminho, texto: readFileSync(caminho, 'utf8') }]
  })
}

/** Os fontes de uma subpasta da webview. */
function fontesDe(sub: string): { caminho: string; texto: string }[] {
  return fontes(join(WEBVIEW_DIR, sub))
}

/** Uma importação de valor; `import type` não conta, por não sobreviver à emissão. */
function importaValorDe(texto: string, origem: RegExp): boolean {
  const padrão = new RegExp(`^\\s*import\\s+(?!type\\b)[^;\\n]*from\\s+'[^']*${origem.source}`, 'm')
  return padrão.test(texto)
}

function ocorrências(texto: string, padrão: RegExp): number {
  return (texto.match(padrão) ?? []).length
}

describe('separação entre a webview e o host (D-06)', () => {
  it('não importa valor algum de `src/host/`', () => {
    const infratores = fontes()
      .filter((f) => importaValorDe(f.texto, /host\//))
      .map((f) => f.caminho)
    expect(infratores).toEqual([])
  })

  it('importa do protocolo apenas o tipo, que é o que a fronteira permite', () => {
    const doProtocolo = fontes().filter((f) => /host\/protocol/.test(f.texto))
    expect(doProtocolo.length).toBeGreaterThan(0)
    for (const fonte of doProtocolo) {
      expect(fonte.texto, `${fonte.caminho} importa valor do protocolo`).toMatch(
        /import type[^;]*host\/protocol/,
      )
    }
  })

  it('reconhece a diferença entre importar tipo e importar valor', () => {
    expect(importaValorDe("import type { X } from '../../host/protocol.ts'\n", /host\//)).toBe(false)
    expect(importaValorDe("import { X } from '../../host/protocol.ts'\n", /host\//)).toBe(true)
  })

  it('não importa módulo de plataforma em lugar algum', () => {
    const infratores = fontes()
      .filter((f) => /from\s+'node:/.test(f.texto) || /require\(\s*'node:/.test(f.texto))
      .map((f) => f.caminho)
    expect(infratores).toEqual([])
  })
})

describe('ponto único de travessia', () => {
  const TOMADA = /acquireVsCodeApi/
  const OUVINTE = /addEventListener\(\s*'message'/
  /** A CHAMADA, e não a menção: o nome também aparece no tipo e no comentário. */
  const CHAMADA_DE_TOMADA = /acquireVsCodeApi\s*\(/g
  const REGISTRO_DE_OUVINTE = /addEventListener\(\s*'message'/g

  it('toma a interface do host num arquivo só, e uma vez', () => {
    const comTomada = fontes().filter((f) => TOMADA.test(f.texto))
    expect(comTomada.map((f) => f.caminho)).toEqual(['src/webview/bridge/messaging.ts'])
    expect(ocorrências(comTomada[0].texto, CHAMADA_DE_TOMADA)).toBe(1)
  })

  it('registra o ouvinte de mensagem num arquivo só, e uma vez', () => {
    const comOuvinte = fontes().filter((f) => OUVINTE.test(f.texto))
    expect(comOuvinte.map((f) => f.caminho)).toEqual(['src/webview/bridge/messaging.ts'])
    expect(ocorrências(comOuvinte[0].texto, REGISTRO_DE_OUVINTE)).toBe(1)
  })
})

describe('política do documento (D-11)', () => {
  it('nenhum componente escreve estilo em linha, que a política recusaria', () => {
    const infratores = fontesDe('ui')
      .filter((f) => /style=\{\{/.test(f.texto) || /style="/.test(f.texto))
      .map((f) => f.caminho)
    expect(infratores).toEqual([])
  })

  it('nenhum componente injeta marcação crua', () => {
    const infratores = fontesDe('ui')
      .filter((f) => /dangerouslySetInnerHTML/.test(f.texto))
      .map((f) => f.caminho)
    expect(infratores).toEqual([])
  })
})

describe('desenho separado da decisão (D-01)', () => {
  const FASES = ['reconhecimento', 'escavacao', 'interpretacao', 'geracao', 'revisao']
  const ESTÁGIOS = [
    'sem-feature-ativa',
    'requirements',
    'coding-em-progresso',
    'done-sem-adendo',
    'done-com-adendo',
  ]

  /** Quantos membros de um vocabulário o texto nomeia literalmente. */
  function nomeados(texto: string, vocabulário: readonly string[]): string[] {
    return vocabulário.filter((termo) => texto.includes(`'${termo}'`) || texto.includes(`"${termo}"`))
  }

  it('nenhum componente carrega a lista das fases', () => {
    for (const fonte of fontesDe('ui')) {
      expect(nomeados(fonte.texto, FASES).length, `${fonte.caminho} decide fase`).toBeLessThan(2)
    }
  })

  it('nenhum componente carrega a lista dos estágios', () => {
    for (const fonte of fontesDe('ui')) {
      expect(nomeados(fonte.texto, ESTÁGIOS).length, `${fonte.caminho} decide estágio`).toBeLessThan(
        2,
      )
    }
  })

  it('nenhum componente carrega a lista das seções', () => {
    for (const fonte of fontesDe('ui')) {
      expect(
        nomeados(fonte.texto, SECTION_NAMES).length,
        `${fonte.caminho} decide a ordem das seções`,
      ).toBeLessThan(2)
    }
  })
})

describe('nomes dos conjuntos de cor (D-02)', () => {
  /**
   * Só os dois nomes de alto contraste servem de sonda.
   *
   * `light` e `dark` são também os dois valores de modo, e um componente que
   * escreve `mode: 'light'` não está escolhendo conjunto de cor. Os dois de
   * alto contraste não têm essa ambiguidade: quem os nomeia está decidindo
   * qual folha vai valer.
   */
  const INEQUÍVOCOS = OFFERED_THEMES.filter((nome) => nome.endsWith('_high_contrast'))

  it('aparecem em `theme/primer-themes.ts` e em nenhum outro arquivo', () => {
    const comNome = fontes()
      .filter((f) => INEQUÍVOCOS.some((nome) => f.texto.includes(`'${nome}'`)))
      .map((f) => f.caminho)
      .filter((caminho) => caminho !== 'src/webview/domain/types.ts')
    expect(comNome).toEqual(['src/webview/theme/primer-themes.ts'])
  })

  it('os atributos que escolhem conjunto saem de um arquivo só', () => {
    const comAtributo = fontes()
      .filter((f) => /data-light-theme|data-dark-theme/.test(f.texto))
      .map((f) => f.caminho)
      .filter((caminho) => caminho !== 'src/webview/domain/types.ts')
    expect(comAtributo).toEqual(['src/webview/theme/primer-themes.ts'])
  })

  it('o pacote de tokens é importado num arquivo só', () => {
    const comPacote = fontes()
      .filter((f) => /^\s*import\s+(?:[^;\n]*from\s+)?'@primer\/primitives/m.test(f.texto))
      .map((f) => f.caminho)
    expect(comPacote).toEqual(['src/webview/theme/primer-themes.ts'])
  })
})
