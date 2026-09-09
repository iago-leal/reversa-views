/**
 * Suíte da leitura do manifesto e das adaptações (T007).
 *
 * RF-12 e RN-13 exigem que manifesto inválido interrompa nomeando o defeito, e
 * que nenhuma linha de relatório saia junto. O que esta suíte prende é a
 * primeira metade disso: cada forma de invalidez tem mensagem própria, e a
 * mensagem diz onde olhar.
 */

import { describe, expect, it } from 'vitest'
import {
  ErroDeHeranca,
  lerAdaptacoes,
  lerManifesto,
  validarConjunto,
} from '../scripts/heranca/manifesto.js'
import {
  adaptacaoDeImportacao,
  adaptacoesFixture,
  entradaDeArquivo,
  manifestoFixture,
  origemDeCodigo,
  origemDePadrao,
  resumoDe,
} from './helpers/heranca-fixtures.ts'
import { stringify } from 'yaml'

const RESUMO = resumoDe('conteúdo')

function comArquivos(arquivos: Array<Record<string, unknown>>): string {
  return stringify(manifestoFixture({ arquivos }))
}

describe('manifesto válido', () => {
  it('devolve versão, origens e arquivos', () => {
    const texto = comArquivos([
      entradaDeArquivo({
        caminho: 'src/heranca/reversa-domain/src/state.ts',
        caminhoNaOrigem: 'packages/reversa-domain/src/state.ts',
        resumo: RESUMO,
      }),
    ])
    const manifesto = lerManifesto(texto, 'src/heranca/manifesto.yml')
    expect(manifesto.versao).toBe(1)
    expect(manifesto.origens.map((origem) => origem.nome)).toEqual([
      'scrum-harness',
      'vscode-kanban',
    ])
    expect(manifesto.arquivos).toHaveLength(1)
  })

  it('aceita manifesto ainda sem arquivo algum, que é o estado do primeiro dia', () => {
    expect(lerManifesto(stringify(manifestoFixture()), 'm.yml').arquivos).toEqual([])
  })
})

describe('manifesto inválido', () => {
  /** O que toda recusa precisa dizer: onde está o arquivo e onde está o defeito. */
  function recusa(texto: string): ErroDeHeranca {
    try {
      lerManifesto(texto, 'src/heranca/manifesto.yml')
    } catch (erro) {
      return erro as ErroDeHeranca
    }
    throw new Error('o manifesto foi aceito e não deveria')
  }

  it('YAML malformado é recusado com a linha do defeito', () => {
    const erro = recusa('versao: 1\norigens: [não fecha\n')
    expect(erro).toBeInstanceOf(ErroDeHeranca)
    expect(erro.arquivo).toBe('src/heranca/manifesto.yml')
    expect(erro.linha).toBeGreaterThan(0)
  })

  it('origem citada por arquivo e ausente da lista de origens', () => {
    const texto = comArquivos([
      entradaDeArquivo({
        caminho: 'src/heranca/a.ts',
        caminhoNaOrigem: 'packages/a.ts',
        resumo: RESUMO,
        origem: 'origem-que-nao-existe',
      }),
    ])
    expect(recusa(texto).message).toContain('origem-que-nao-existe')
  })

  it('caminho repetido em duas entradas', () => {
    const entrada = entradaDeArquivo({
      caminho: 'src/heranca/a.ts',
      caminhoNaOrigem: 'packages/a.ts',
      resumo: RESUMO,
    })
    expect(recusa(comArquivos([entrada, { ...entrada }])).message).toContain('src/heranca/a.ts')
  })

  it('origem de padrão com arquivos, que contradiz RN-10', () => {
    const texto = stringify(
      manifestoFixture({
        origens: [origemDeCodigo(), origemDePadrao({ arquivos: ['algum.ts'] })],
      }),
    )
    expect(recusa(texto).message).toContain('vscode-kanban')
  })

  it('resumo fora do formato declarado', () => {
    const texto = comArquivos([
      entradaDeArquivo({
        caminho: 'src/heranca/a.ts',
        caminhoNaOrigem: 'packages/a.ts',
        resumo: 'md5:abc',
      }),
    ])
    expect(recusa(texto).message).toContain('resumo')
  })

  it('campo obrigatório ausente na entrada de arquivo', () => {
    const texto = stringify(
      manifestoFixture({ arquivos: [{ caminho: 'src/heranca/a.ts', origem: 'scrum-harness' }] }),
    )
    expect(recusa(texto).message).toMatch(/resumo|caminhoNaOrigem/)
  })
})

describe('adaptações', () => {
  it('lê os identificadores e os dois trechos', () => {
    const lidas = lerAdaptacoes(
      stringify(adaptacoesFixture([adaptacaoDeImportacao()])),
      'src/heranca/adaptacoes.yml',
    )
    expect(lidas.adaptacoes[0].id).toBe('A1')
    expect(lidas.adaptacoes[0].original).toContain('@scrum-harness/reversa-domain')
  })

  it('aceita trecho adaptado vazio, que é remoção declarada', () => {
    const lidas = lerAdaptacoes(
      stringify(adaptacoesFixture([adaptacaoDeImportacao({ id: 'A3', adaptado: '' })])),
      'a.yml',
    )
    expect(lidas.adaptacoes[0].adaptado).toBe('')
  })

  it('recusa adaptação sem trecho original', () => {
    const texto = stringify(adaptacoesFixture([{ id: 'A9', arquivo: 'x.ts', motivo: 'nenhum' }]))
    expect(() => lerAdaptacoes(texto, 'a.yml')).toThrow(/A9/)
  })

  it('recusa identificador repetido', () => {
    const texto = stringify(
      adaptacoesFixture([adaptacaoDeImportacao(), adaptacaoDeImportacao()]),
    )
    expect(() => lerAdaptacoes(texto, 'a.yml')).toThrow(/A1/)
  })
})

describe('coerência entre os dois arquivos', () => {
  it('arquivo que cita adaptação inexistente é manifesto inválido', () => {
    const texto = comArquivos([
      entradaDeArquivo({
        caminho: 'src/heranca/a.ts',
        caminhoNaOrigem: 'packages/a.ts',
        resumo: RESUMO,
        adaptacoes: ['A7'],
      }),
    ])
    const manifesto = lerManifesto(texto, 'm.yml')
    const adaptacoes = lerAdaptacoes(stringify(adaptacoesFixture([adaptacaoDeImportacao()])), 'a.yml')
    expect(() => validarConjunto(manifesto, adaptacoes)).toThrow(/A7/)
  })
})
