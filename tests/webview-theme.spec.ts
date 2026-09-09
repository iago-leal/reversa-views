/**
 * The half of the theme that a server rendering cannot reach: the mapping onto
 * the root attributes, the reading of the class the editor writes, and the
 * sweep of the single stylesheet (RF-11, EC-04, EC-06, D-02, D-23).
 *
 * The other half is visual, belongs to feature 005, and is declared as such in
 * T055. What is verifiable here is that every colour set the panel can ask for
 * is one of the four that were imported, that an unknown class degrades into
 * light instead of throwing, and that the stylesheet names tokens rather than
 * colours -- which is also what keeps the trim of T057 able to find its seed.
 * @module tests/webview-theme
 */

import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { OFFERED_THEMES } from '../src/webview/domain/types.ts'
import { themeAttributes } from '../src/webview/theme/primer-themes.ts'
import { readEditorTheme, watchEditorTheme } from '../src/webview/theme/contrast.ts'

/** The four combinations of mode and high contrast, which are all there are. */
const COMBINAÇÕES = [
  { mode: 'light', highContrast: false },
  { mode: 'dark', highContrast: false },
  { mode: 'light', highContrast: true },
  { mode: 'dark', highContrast: true },
] as const

describe('mapeamento do tema nos atributos do elemento raiz', () => {
  it('devolve o modo em vigor em cada uma das quatro combinações', () => {
    for (const combinação of COMBINAÇÕES) {
      expect(themeAttributes(combinação)['data-color-mode']).toBe(combinação.mode)
    }
  })

  it('preenche sempre os dois nomes de conjunto, claro e escuro', () => {
    for (const combinação of COMBINAÇÕES) {
      const atributos = themeAttributes(combinação)
      expect(atributos['data-light-theme']).toBeTruthy()
      expect(atributos['data-dark-theme']).toBeTruthy()
    }
  })

  it('nunca devolve nome fora dos quatro conjuntos importados', () => {
    for (const combinação of COMBINAÇÕES) {
      const atributos = themeAttributes(combinação)
      expect(OFFERED_THEMES).toContain(atributos['data-light-theme'])
      expect(OFFERED_THEMES).toContain(atributos['data-dark-theme'])
    }
  })

  it('escolhe os conjuntos comuns fora do alto contraste', () => {
    expect(themeAttributes({ mode: 'light', highContrast: false })).toEqual({
      'data-color-mode': 'light',
      'data-light-theme': 'light',
      'data-dark-theme': 'dark',
    })
  })

  it('escolhe os dois conjuntos de alto contraste quando o editor o pede', () => {
    expect(themeAttributes({ mode: 'dark', highContrast: true })).toEqual({
      'data-color-mode': 'dark',
      'data-light-theme': 'light_high_contrast',
      'data-dark-theme': 'dark_high_contrast',
    })
  })

  it('mantém o par de alto contraste coerente: nunca mistura um comum com um de contraste', () => {
    for (const combinação of COMBINAÇÕES) {
      const atributos = themeAttributes(combinação)
      const claroÉContraste = atributos['data-light-theme'].endsWith('_high_contrast')
      const escuroÉContraste = atributos['data-dark-theme'].endsWith('_high_contrast')
      expect(claroÉContraste).toBe(combinação.highContrast)
      expect(escuroÉContraste).toBe(combinação.highContrast)
    }
  })
})

describe('leitura da classe que o editor escreve no corpo do documento', () => {
  it('reconhece o tema claro', () => {
    expect(readEditorTheme('vscode-light')).toEqual({ mode: 'light', highContrast: false })
  })

  it('reconhece o tema escuro', () => {
    expect(readEditorTheme('vscode-dark')).toEqual({ mode: 'dark', highContrast: false })
  })

  it('reconhece o alto contraste escuro, que o editor nomeia sem dizer escuro', () => {
    expect(readEditorTheme('vscode-high-contrast')).toEqual({ mode: 'dark', highContrast: true })
  })

  it('reconhece o alto contraste claro, que chega junto do escuro na mesma lista', () => {
    expect(readEditorTheme('vscode-high-contrast vscode-high-contrast-light')).toEqual({
      mode: 'light',
      highContrast: true,
    })
  })

  it('não confunde o claro de alto contraste com o escuro por prefixo de nome', () => {
    expect(readEditorTheme('vscode-high-contrast-light')).toEqual({
      mode: 'light',
      highContrast: true,
    })
  })

  it('ignora as demais classes que o editor deixa no corpo', () => {
    expect(readEditorTheme('vs-seti vscode-dark reversa-panel')).toEqual({
      mode: 'dark',
      highContrast: false,
    })
  })

  it('devolve o modo claro diante de classe desconhecida, e não lança', () => {
    for (const classe of ['', '   ', 'tema-que-não-existe', 'vscode-']) {
      expect(() => readEditorTheme(classe)).not.toThrow()
      expect(readEditorTheme(classe)).toEqual({ mode: 'light', highContrast: false })
    }
  })
})

/** A source of classes the panel can watch without a document behind it. */
function fonte(inicial: string) {
  let classes = inicial
  const ouvintes = new Set<() => void>()
  return {
    porta: {
      classes: () => classes,
      subscribe(ouvinte: () => void) {
        ouvintes.add(ouvinte)
        return () => ouvintes.delete(ouvinte)
      },
    },
    escrever(novas: string) {
      classes = novas
      for (const ouvinte of [...ouvintes]) ouvinte()
    },
    ouvintes: () => ouvintes.size,
  }
}

describe('assinatura da troca de tema', () => {
  it('avisa com o tema novo quando o editor troca por baixo', () => {
    const origem = fonte('vscode-light')
    const vistos: unknown[] = []
    watchEditorTheme(origem.porta, (tema) => vistos.push(tema))

    origem.escrever('vscode-dark')

    expect(vistos).toEqual([{ mode: 'dark', highContrast: false }])
  })

  it('não avisa quando a classe muda sem que o tema mude', () => {
    const origem = fonte('vscode-dark')
    const vistos: unknown[] = []
    watchEditorTheme(origem.porta, (tema) => vistos.push(tema))

    origem.escrever('vscode-dark reversa-panel')

    expect(vistos).toEqual([])
  })

  it('devolve a função que desliga a assinatura', () => {
    const origem = fonte('vscode-light')
    const vistos: unknown[] = []
    const parar = watchEditorTheme(origem.porta, (tema) => vistos.push(tema))

    parar()
    origem.escrever('vscode-dark')

    expect(vistos).toEqual([])
    expect(origem.ouvintes()).toBe(0)
  })
})

/** The stylesheet, read as text: the sweep is over what was written, not over what rendered. */
const FOLHA = readFileSync('src/webview/theme/theme.css', 'utf8')

/** The stylesheet without comments, so that an example in prose is not read as a rule. */
const SEM_COMENTÁRIO = FOLHA.replace(/\/\*[\s\S]*?\*\//g, '')

/** Every declaration of the stylesheet, as a property and the value written for it. */
function declarações(): { prop: string; valor: string; linha: number }[] {
  const saída: { prop: string; valor: string; linha: number }[] = []
  SEM_COMENTÁRIO.split('\n').forEach((linha, i) => {
    const casamento = linha.match(/^\s*([a-z-]+)\s*:\s*([^;{}]+);/)
    if (casamento) saída.push({ prop: casamento[1], valor: casamento[2].trim(), linha: i + 1 })
  })
  return saída
}

/** The properties whose value decides how wide a column is (EC-04). */
const MEDIDA_DE_COLUNA = ['width', 'max-width', 'min-width', 'flex-basis', 'grid-template-columns']

/** Absolute units, which do not follow the reader's font size and so force scrolling. */
const UNIDADE_ABSOLUTA = /\b\d*\.?\d+(px|pt|pc|cm|mm|in)\b/

describe('varredura da folha de estilo', () => {
  it('não escreve nenhuma cor literal: toda cor vem de token nomeado', () => {
    const literais = declarações().filter(
      (d) => /#[0-9a-fA-F]{3,8}\b/.test(d.valor) || /\b(rgba?|hsla?|color-mix)\s*\(/.test(d.valor),
    )
    expect(literais.map((d) => `${d.linha}: ${d.prop}: ${d.valor}`)).toEqual([])
  })

  it('não nomeia cor da linguagem, que é literal com outro nome', () => {
    const nomeadas = declarações().filter(
      (d) =>
        /\bcolor\b/.test(d.prop) &&
        /\b(white|black|red|green|blue|gray|grey|silver|yellow|orange|purple)\b/.test(d.valor),
    )
    expect(nomeadas.map((d) => `${d.linha}: ${d.prop}: ${d.valor}`)).toEqual([])
  })

  it('nomeia ao menos um token do sistema de design, que é o que semeia a poda de T057', () => {
    expect(SEM_COMENTÁRIO).toMatch(/var\(--(fgColor|bgColor|borderColor)-/)
  })

  it('não fixa largura mínima em pixel, que é o que forçaria rolagem horizontal', () => {
    const fixas = declarações().filter(
      (d) => d.prop === 'min-width' && UNIDADE_ABSOLUTA.test(d.valor),
    )
    expect(fixas.map((d) => `${d.linha}: ${d.prop}: ${d.valor}`)).toEqual([])
  })

  it('não mede coluna em unidade absoluta', () => {
    const absolutas = declarações().filter(
      (d) => MEDIDA_DE_COLUNA.includes(d.prop) && UNIDADE_ABSOLUTA.test(d.valor),
    )
    expect(absolutas.map((d) => `${d.linha}: ${d.prop}: ${d.valor}`)).toEqual([])
  })

  it('deixa a célula quebrar linha, que é o que evita a rolagem na coluna estreita', () => {
    expect(SEM_COMENTÁRIO).toMatch(/(overflow-wrap|word-break)\s*:/)
  })
})

/** O corpo de uma regra da folha, pelo seletor exato com que ela foi escrita. */
function regra(seletor: string): string {
  const abertura = SEM_COMENTÁRIO.indexOf(`\n${seletor} {`)
  expect(abertura, `a folha não tem a regra ${seletor}`).toBeGreaterThan(-1)
  const inicio = SEM_COMENTÁRIO.indexOf('{', abertura)
  return SEM_COMENTÁRIO.slice(inicio + 1, SEM_COMENTÁRIO.indexOf('}', inicio))
}

/**
 * Onde os conjuntos de cor chegam.
 *
 * Os quatro conjuntos são definidos em seletores de atributo, e quem escreve
 * esses atributos é o elemento raiz do painel, `.panel`. Um token nomeado
 * ACIMA dele não resolve, e cor que não resolve não fica ausente: fica
 * herdada. Foi assim que o painel apareceu com texto escuro sobre fundo
 * escuro no tema escuro do editor, e é isso que estas duas regras impedem de
 * voltar.
 */
describe('alcance dos conjuntos de cor (RF-11, D-02)', () => {
  const TOKEN = /var\(--(fgColor|bgColor|borderColor)-/

  it('o corpo não nomeia nenhum token, porque nenhum chega até ele', () => {
    expect(regra('body')).not.toMatch(TOKEN)
  })

  it('a raiz do painel fixa o fundo e o texto herdado, com token', () => {
    const painel = regra('.panel')
    expect(painel).toMatch(/background-color:\s*var\(--bgColor-default\)/)
    expect(painel).toMatch(/(^|\n)\s*color:\s*var\(--fgColor-default\)/)
  })
})


/**
 * O tamanho dos títulos, que a folha precisa fixar em toda parte.
 *
 * Um cabeçalho sem regra própria sai no tamanho que o navegador dá a `h1`,
 * duas vezes maior que tudo o mais que o painel desenha. O cabeçalho e as
 * seções sempre tiveram regra; as quatro telas de entrada não tinham, e a
 * conferência visual da 005 as encontrou gritando numa coluna estreita.
 */
describe('tamanho dos títulos (RF-01, D-02)', () => {
  it('a folha fixa o tamanho do título das telas de entrada', () => {
    expect(regra("[data-part='entry'] h1")).toMatch(/font-size:\s*1rem/)
  })

  it('nenhum título do painel fica no tamanho que o navegador escolheria', () => {
    for (const seletor of ['.header__title', '.section__title', "[data-part='entry'] h1"]) {
      expect(regra(seletor), `${seletor} não fixa o tamanho`).toMatch(/font-size:/)
    }
  })
})
