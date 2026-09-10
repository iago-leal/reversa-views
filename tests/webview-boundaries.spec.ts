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

/**
 * A tela continua sem falar com serviço algum (RN-01, feature 007).
 *
 * A extensão passa a consultar a origem do repositório, e a consulta vive no
 * processo do HOST. Este bloco guarda o outro lado: o pacote da tela não ganha
 * a capacidade, e o desfecho chega a ele como mensagem, pelo canal que já
 * existe. A política de conteúdo do painel segue sem permissão de conexão de
 * saída, de modo que uma requisição daqui seria recusada pelo navegador
 * embarcado — mas contar com isso seria confiar a fronteira ao acaso da
 * configuração, e não ao desenho.
 */
describe('a tela não fala com serviço algum (RN-01)', () => {
  const VIAS: Array<[RegExp, string]> = [
    [/\bfetch\s*\(/, 'o cliente global de requisição'],
    [/\bXMLHttpRequest\b/, 'o cliente de requisição do navegador'],
    [/\bWebSocket\b/, 'o canal permanente'],
    [/\bEventSource\b/, 'o fluxo de eventos do servidor'],
    [/\bnavigator\s*\.\s*sendBeacon\b/, 'o envio em segundo plano'],
    [/['"]node:https?['"]/, 'o módulo nativo de requisição'],
  ]

  it('nenhum módulo da tela alcança rede, em via alguma', () => {
    for (const fonte of fontes()) {
      for (const [via, oQueAbre] of VIAS) {
        expect(via.test(fonte.texto), `${fonte.caminho} alcança ${oQueAbre}`).toBe(false)
      }
    }
  })

  it('nenhum módulo da tela carrega endereço de rede', () => {
    // O endereço consultado é constante da construção, no host. Um endereço
    // aqui seria endereço no bundle da tela, alcançável por quem inspeciona o
    // painel, e a razão de não haver nenhum é essa.
    const infratores = fontes()
      .filter((f) => /https?:\/\/(?!localhost|127\.0\.0\.1)[a-z]/.test(f.texto))
      .map((f) => f.caminho)
    expect(infratores).toEqual([])
  })

  it('a guarda reconhece cada via quando ela de fato aparece', () => {
    const amostras: Array<[RegExp, string]> = [
      [/\bfetch\s*\(/, 'const r = await fetch(url)'],
      [/\bXMLHttpRequest\b/, 'const p = new XMLHttpRequest()'],
      [/\bWebSocket\b/, 'const c = new WebSocket(url)'],
      [/\bEventSource\b/, 'const e = new EventSource(url)'],
      [/\bnavigator\s*\.\s*sendBeacon\b/, 'navigator.sendBeacon(url, dados)'],
      [/['"]node:https?['"]/, "import { request } from 'node:https'"],
    ]
    for (const [via, amostra] of amostras) {
      expect(via.test(amostra), `a guarda não reconhece: ${amostra}`).toBe(true)
    }
  })

  it('o desfecho da consulta chega como TIPO do protocolo, e não como valor', () => {
    // A mesma disciplina do resto da fronteira: a tela desenha o desfecho, e
    // nada do host sobrevive no bundle dela.
    const comDesfecho = fontes().filter((f) => /UpdateStatus/.test(f.texto))
    expect(comDesfecho.length).toBeGreaterThan(0)
    for (const fonte of comDesfecho) {
      expect(importaValorDe(fonte.texto, /host\//), `${fonte.caminho} importa valor do host`).toBe(
        false,
      )
    }
  })
})
