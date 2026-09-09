/**
 * Suíte dos limites (T007), contra `scripts/limites.js` e quem o lê.
 *
 * Ela não confere números contra si mesmos, o que seria circular. Ela confere
 * duas coisas que o módulo sozinho não pode garantir: que o resto do
 * repositório concorda com ele, e que o par entre a versão mínima do editor e
 * o alvo do navegador é um par que existe no mundo (RF-15, RF-16, RN-01,
 * RN-06).
 *
 * A tabela de correspondência mora aqui de propósito. Fosse ela do módulo, o
 * módulo confirmaria a si próprio; sendo da suíte, ela é a segunda opinião que
 * faz a divergência aparecer.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  ALVO_DO_NAVEGADOR,
  FAIXA_DO_EDITOR_NO_MANIFESTO,
  TETO_DO_PACOTE_DA_EXTENSAO,
  TETO_DO_PACOTE_DA_TELA,
  VERSAO_MINIMA_DO_EDITOR,
  formatarTamanho,
} from '../scripts/limites.js'

const MANIFESTO = JSON.parse(readFileSync('package.json', 'utf8')) as {
  engines?: { vscode?: string }
  devDependencies?: Record<string, string>
}

const BUILD = readFileSync('scripts/build-webview.js', 'utf8')

/**
 * O Chromium que cada versão do editor embarca, pelo Electron que ela traz.
 * Conhecimento de fora do repositório, e é isso que dá valor à conferência.
 */
const CHROMIUM_POR_VERSAO_DO_EDITOR: Record<string, string> = {
  '1.78': 'chrome108',
  '1.86': 'chrome114',
  '1.94': 'chrome128',
}

describe('o par entre versão mínima e alvo do navegador (RN-01)', () => {
  it('é um par que existe: a versão declarada embarca aquele Chromium', () => {
    const esperado = CHROMIUM_POR_VERSAO_DO_EDITOR[VERSAO_MINIMA_DO_EDITOR]
    expect(
      esperado,
      `versão ${VERSAO_MINIMA_DO_EDITOR} do editor não está na tabela de correspondência`,
    ).toBeDefined()
    expect(
      ALVO_DO_NAVEGADOR,
      `o alvo ${ALVO_DO_NAVEGADOR} diverge do Chromium que o editor ${VERSAO_MINIMA_DO_EDITOR} embarca, ${esperado}`,
    ).toBe(esperado)
  })

  it('o manifesto declara a mesma versão mínima que o módulo', () => {
    expect(MANIFESTO.engines?.vscode).toBe(FAIXA_DO_EDITOR_NO_MANIFESTO)
  })

  it('a tipagem instalada acompanha a versão mínima', () => {
    expect(MANIFESTO.devDependencies?.['@types/vscode']).toBe(`${VERSAO_MINIMA_DO_EDITOR}.0`)
  })
})

describe('o empacotamento da webview lê o módulo (RF-15)', () => {
  it('requer os limites em vez de trazer número próprio', () => {
    expect(BUILD).toContain("require('./limites')")
  })

  it('não guarda mais o alvo como literal', () => {
    expect(BUILD).not.toContain(`'${ALVO_DO_NAVEGADOR}'`)
  })
})

describe('fonte única: nenhum dos valores aparece duas vezes (RN-06)', () => {
  /** Os arquivos do repositório que poderiam guardar um segundo número. */
  const alvos = [...arquivos('scripts'), ...arquivos('tests'), 'package.json'].filter(
    // O módulo é a fonte, e esta suíte precisa citar os valores para procurá-los.
    (caminho) => caminho !== 'scripts/limites.js' && caminho !== 'tests/limites.spec.ts',
  )

  for (const [nome, valor] of [
    ['teto do pacote da tela', String(TETO_DO_PACOTE_DA_TELA)],
    ['teto do pacote da extensão', String(TETO_DO_PACOTE_DA_EXTENSAO)],
    ['alvo do navegador', ALVO_DO_NAVEGADOR],
  ] as const) {
    it(`o ${nome} vive só no módulo`, () => {
      const repetido = alvos.filter((caminho) => readFileSync(caminho, 'utf8').includes(valor))
      expect(repetido, `${valor} repetido em ${repetido.join(', ')}`).toEqual([])
    })
  }
})

describe('a formatação que põe medida ao lado do teto', () => {
  it('mostra o arredondado e o exato, porque um convence e o outro compara', () => {
    expect(formatarTamanho(409600)).toBe('400.0 KiB (409600 B)')
  })
})

/** Os arquivos de uma pasta, recursivamente, em caminho com barras. */
function arquivos(pasta: string): string[] {
  const achados: string[] = []
  for (const item of readdirSync(pasta)) {
    const cheio = join(pasta, item)
    if (statSync(cheio).isDirectory()) achados.push(...arquivos(cheio))
    else achados.push(cheio.split('\\').join('/'))
  }
  return achados
}
