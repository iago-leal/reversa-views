/**
 * Suíte do empacotamento com versão derivada (T042; RF-20, RF-21, D-08).
 *
 * Duas coisas se fixam. A primeira é que o manifesto VOLTA ao valor versionado
 * ao fim, inclusive quando o empacotador reprova no meio: é o bloco de saída
 * garantida de D-08, e é o que mantém a árvore limpa para o atualizador. A
 * segunda é que o pacote sai nomeado pela versão derivada, e não pela que está
 * escrita no manifesto, porque a escrita é o valor de espera.
 *
 * Nada aqui roda o empacotador de verdade nem toca disco: o mundo entra por
 * `FERRAMENTAS`, e o "disco" é um objeto.
 * @module tests/empacotamento-versao
 */

import { describe, expect, it } from 'vitest'
import { COMO_INSTALAR, comVersao, principal } from '../scripts/empacotar.js'
import { VERSAO_DE_RECUO } from '../scripts/versao.js'

/** O manifesto como está versionado, com o valor de espera. */
const MANIFESTO = '{\n  "name": "reversa-views",\n  "version": "0.0.1",\n  "private": true\n}\n'

/** Um mundo de mentira que grava o que o empacotamento fez com o manifesto. */
function mundo(opcoes: { falhaNoEmpacotador?: boolean; recuo?: boolean; tamanho?: number } = {}) {
  const escritas: string[] = []
  const saida: string[] = []
  const erro: string[] = []
  const destinos: string[] = []
  let manifesto = MANIFESTO
  const ferramentas = {
    lerManifesto: () => manifesto,
    escreverManifesto: (_raiz: string, texto: string) => {
      manifesto = texto
      escritas.push(texto)
    },
    derivar: () =>
      opcoes.recuo
        ? {
            versao: VERSAO_DE_RECUO,
            recuo: { causa: 'sem-clone', explicacao: 'o git não respondeu' },
          }
        : { versao: '0.6.1', recuo: null },
    localizarEmpacotador: () => '/repo/node_modules/@vscode/vsce/package.json',
    temSaida: () => true,
    empacotar: (_raiz: string, _binario: string, destino: string) => {
      destinos.push(destino)
      // No meio do caminho o manifesto tem de estar com a versão derivada:
      // é isso que o empacotador oficial lê.
      escritas.push(`durante: ${JSON.parse(manifesto).version}`)
      if (opcoes.falhaNoEmpacotador) throw new Error('vsce reprovou')
    },
    existe: () => false,
    apagar: () => {},
    tamanho: () => opcoes.tamanho ?? 1000,
    lerPacote: () => [{ caminho: 'extension/package.json', tamanhoOriginal: 10 }],
    escrever: (texto: string) => saida.push(texto),
    escreverErro: (texto: string) => erro.push(texto),
  }
  return {
    ferramentas,
    manifesto: () => manifesto,
    escritas,
    saida: () => saida.join(''),
    erro: () => erro.join(''),
    destinos,
  }
}

describe('a troca textual da versão', () => {
  it('troca só o valor de "version", preservando o resto byte a byte', () => {
    const trocado = comVersao(MANIFESTO, '0.6.1')
    expect(trocado).toBe(MANIFESTO.replace('"0.0.1"', '"0.6.1"'))
    expect(JSON.parse(trocado).version).toBe('0.6.1')
  })
})

describe('o manifesto volta ao valor versionado (D-08)', () => {
  it('ao fim de um empacotamento que deu certo', () => {
    const m = mundo()
    expect(principal('/repo', m.ferramentas)).toBe(0)
    expect(m.manifesto()).toBe(MANIFESTO)
  })

  it('mesmo quando o empacotador reprova no meio', () => {
    const m = mundo({ falhaNoEmpacotador: true })
    expect(principal('/repo', m.ferramentas)).toBe(1)
    expect(m.manifesto()).toBe(MANIFESTO)
    expect(m.erro()).toContain('o empacotador falhou')
  })

  it('a versão derivada estava escrita enquanto o empacotador rodava', () => {
    const m = mundo()
    principal('/repo', m.ferramentas)
    expect(m.escritas).toContain('durante: 0.6.1')
    expect(m.escritas.at(-1)).toBe(MANIFESTO)
  })
})

describe('o nome do pacote (RF-20)', () => {
  it('sai pela versão derivada, e não pela escrita no manifesto', () => {
    const m = mundo()
    principal('/repo', m.ferramentas)
    expect(m.destinos).toEqual(['/repo/reversa-views-0.6.1.vsix'])
    expect(m.saida()).toContain('reversa-views-0.6.1.vsix')
    expect(m.saida()).not.toContain('0.0.1.vsix')
  })

  it('o relato imprime a versão ao lado da medida', () => {
    const m = mundo()
    principal('/repo', m.ferramentas)
    expect(m.saida()).toMatch(/versão 0\.6\.1/)
  })
})

describe('o recuo é dito, e não escondido (RF-21)', () => {
  it('imprime a causa no erro e segue com o valor de recuo', () => {
    const m = mundo({ recuo: true })
    expect(principal('/repo', m.ferramentas)).toBe(0)
    expect(m.erro()).toContain('sem-clone')
    expect(m.erro()).toContain('o git não respondeu')
    expect(m.destinos).toEqual([`/repo/reversa-views-${VERSAO_DE_RECUO}.vsix`])
    expect(m.manifesto()).toBe(MANIFESTO)
  })
})

describe('as recusas de antes, intactas', () => {
  it('sem empacotador instalado, diz como instalar e não toca o manifesto', () => {
    const m = mundo()
    m.ferramentas.localizarEmpacotador = () => null
    expect(principal('/repo', m.ferramentas)).toBe(1)
    expect(m.erro()).toContain(COMO_INSTALAR)
    expect(m.escritas).toEqual([])
  })

  it('sem pasta de saída, pede a construção e não toca o manifesto', () => {
    const m = mundo()
    m.ferramentas.temSaida = () => false
    expect(principal('/repo', m.ferramentas)).toBe(1)
    expect(m.escritas).toEqual([])
  })

  it('pacote acima do teto reprova, com o manifesto já restaurado', () => {
    const m = mundo({ tamanho: 10 * 1024 * 1024 })
    expect(principal('/repo', m.ferramentas)).toBe(1)
    expect(m.erro()).toContain('estourou o teto')
    expect(m.manifesto()).toBe(MANIFESTO)
  })
})
