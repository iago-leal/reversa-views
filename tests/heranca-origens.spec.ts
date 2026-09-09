/**
 * Suíte da configuração local das origens (T014).
 *
 * RN-11 tira o caminho de máquina do código e do manifesto, e o preço disso é
 * que a origem pode não estar onde o arquivo diz. Cada forma de falta tem
 * mensagem própria, e toda mensagem nomeia o arquivo e a chave a corrigir.
 */

import { afterEach, describe, expect, it } from 'vitest'
import {
  CAMINHO_DA_CONFIGURACAO,
  CAMINHO_DO_EXEMPLO,
  lerConfiguracao,
  resolver,
} from '../scripts/heranca/origens.js'
import { arvoreTemporaria, origemDeCodigo, origemDePadrao } from './helpers/heranca-fixtures.ts'
import type { Arvore } from './helpers/heranca-fixtures.ts'

let arvore: Arvore | null = null
afterEach(() => {
  arvore?.limpar()
  arvore = null
})

describe('nomes fixos', () => {
  it('o arquivo real e o exemplo versionado ao lado', () => {
    expect(CAMINHO_DA_CONFIGURACAO).toBe('heranca.origens.yml')
    expect(CAMINHO_DO_EXEMPLO).toBe('heranca.origens.exemplo.yml')
  })
})

describe('leitura da configuração', () => {
  it('lê as duas chaves quando o arquivo existe', () => {
    arvore = arvoreTemporaria({
      [CAMINHO_DA_CONFIGURACAO]: 'origens:\n  scrum-harness: /a\n  vscode-kanban: /b\n',
    })
    const config = lerConfiguracao(arvore.raiz)
    expect(config.existe).toBe(true)
    expect(config.caminhos['scrum-harness']).toBe('/a')
  })

  it('arquivo ausente não é erro, e a mensagem aponta o exemplo', () => {
    arvore = arvoreTemporaria({})
    const config = lerConfiguracao(arvore.raiz)
    expect(config.existe).toBe(false)
    expect(config.motivo).toContain(CAMINHO_DO_EXEMPLO)
  })

  it('configuração malformada é relatada sem derrubar o verificador', () => {
    arvore = arvoreTemporaria({ [CAMINHO_DA_CONFIGURACAO]: 'origens: [não fecha\n' })
    const config = lerConfiguracao(arvore.raiz)
    expect(config.existe).toBe(true)
    expect(config.erro).toBeTruthy()
    expect(config.caminhos).toEqual({})
  })
})

describe('resolução de uma origem', () => {
  const ferramentas = {
    existePasta: (caminho: string) => caminho === '/existe',
    revisaoDoGit: () => 'revisao-corrente',
    versaoDoPacote: () => '1.36.0',
  }

  it('origem declarada e presente fica disponível, com a revisão corrente', () => {
    const resolvida = resolver(
      origemDeCodigo(),
      { existe: true, caminhos: { 'scrum-harness': '/existe' } },
      ferramentas,
    )
    expect(resolvida.estado).toBe('disponivel')
    expect(resolvida.revisaoCorrente).toBe('revisao-corrente')
  })

  it('chave ausente deixa a origem indisponível, nomeando arquivo e chave', () => {
    const resolvida = resolver(origemDeCodigo(), { existe: true, caminhos: {} }, ferramentas)
    expect(resolvida.estado).toBe('indisponivel')
    expect(resolvida.motivo).toContain('scrum-harness')
    expect(resolvida.motivo).toContain(CAMINHO_DA_CONFIGURACAO)
  })

  it('caminho declarado que não existe no disco é indisponível, ecoando o caminho (EC-01)', () => {
    const resolvida = resolver(
      origemDeCodigo(),
      { existe: true, caminhos: { 'scrum-harness': '/nao/existe' } },
      ferramentas,
    )
    expect(resolvida.estado).toBe('indisponivel')
    expect(resolvida.motivo).toContain('/nao/existe')
  })

  it('revisão que não pôde ser lida não derruba nada, e vira nula', () => {
    const resolvida = resolver(
      origemDeCodigo(),
      { existe: true, caminhos: { 'scrum-harness': '/existe' } },
      { ...ferramentas, revisaoDoGit: () => null },
    )
    expect(resolvida.estado).toBe('disponivel')
    expect(resolvida.revisaoCorrente).toBeNull()
  })

  it('a origem de padrão traz versão corrente em vez de revisão', () => {
    const resolvida = resolver(
      origemDePadrao(),
      { existe: true, caminhos: { 'vscode-kanban': '/existe' } },
      ferramentas,
    )
    expect(resolvida.versaoCorrente).toBe('1.36.0')
    expect(resolvida.revisaoCorrente).toBeUndefined()
  })

  it('configuração inteira ausente deixa toda origem indisponível, com a mesma orientação', () => {
    const resolvida = resolver(
      origemDeCodigo(),
      { existe: false, caminhos: {}, motivo: `crie ${CAMINHO_DA_CONFIGURACAO}` },
      ferramentas,
    )
    expect(resolvida.estado).toBe('indisponivel')
    expect(resolvida.motivo).toContain(CAMINHO_DA_CONFIGURACAO)
  })
})
