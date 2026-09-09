/**
 * Suíte da configuração do preview (T011), contra `scripts/preview/config.js`.
 *
 * A tradução dos argumentos é a única parte do preview que decide alguma coisa
 * antes de qualquer porta abrir, e é onde moram as duas recusas que evitam
 * confusão adiante: workspace que não existe e pacote da tela que não foi
 * construído. Argumento desconhecido também interrompe, em vez de ser ignorado
 * em silêncio, porque ignorar em silêncio é o modo mais rápido de alguém
 * passar meia hora conferindo o tema errado.
 */

import { describe, expect, it } from 'vitest'
import { PORTA_PADRAO, lerConfiguracao } from '../scripts/preview/config.js'

/** Um mundo em que tudo existe, para que só os argumentos sejam a variável. */
const MUNDO = {
  raiz: '/repo',
  eDiretorio: () => true,
  temPacoteDaTela: () => true,
}

describe('os padrões', () => {
  it('sem argumento algum, olha o repositório de onde o comando roda', () => {
    expect(lerConfiguracao([], MUNDO).workspace).toBe('/repo')
  })

  it('nasce escuro, sem estado forçado, sem atraso e na porta declarada', () => {
    const config = lerConfiguracao([], MUNDO)
    expect(config.tema).toBe('escuro')
    expect(config.estado).toBe('nenhum')
    expect(config.atraso).toBe(0)
    expect(config.porta).toBe(PORTA_PADRAO)
    expect(config.semBuild).toBe(false)
  })

  it('a porta padrão é um número de porta de verdade', () => {
    expect(PORTA_PADRAO).toBeGreaterThan(1023)
    expect(PORTA_PADRAO).toBeLessThan(65536)
  })
})

describe('o que cada argumento faz', () => {
  it('aceita os quatro temas', () => {
    for (const tema of ['claro', 'escuro', 'claro-alto-contraste', 'escuro-alto-contraste']) {
      expect(lerConfiguracao([`--tema=${tema}`], MUNDO).tema).toBe(tema)
    }
  })

  it('aceita os três estados forçados, além do padrão', () => {
    for (const estado of ['sem-diretorio', 'sem-reversa', 'erro']) {
      expect(lerConfiguracao([`--estado=${estado}`], MUNDO).estado).toBe(estado)
    }
  })

  it('lê porta e atraso como número', () => {
    const config = lerConfiguracao(['--porta=8080', '--atraso=1500'], MUNDO)
    expect(config.porta).toBe(8080)
    expect(config.atraso).toBe(1500)
  })

  it('resolve o workspace a caminho absoluto', () => {
    expect(lerConfiguracao(['--workspace=/outro/lugar'], MUNDO).workspace).toBe('/outro/lugar')
  })

  it('dispensa o pacote da tela quando pedido', () => {
    expect(lerConfiguracao(['--sem-build'], MUNDO).semBuild).toBe(true)
  })
})

describe('as recusas, todas antes de abrir porta', () => {
  it('recusa workspace que não é diretório, nomeando o caminho', () => {
    expect(() =>
      lerConfiguracao(['--workspace=/nao/existe'], { ...MUNDO, eDiretorio: () => false }),
    ).toThrow(/\/nao\/existe/)
  })

  it('recusa iniciar sem o pacote da tela, mandando rodar a construção', () => {
    expect(() => lerConfiguracao([], { ...MUNDO, temPacoteDaTela: () => false })).toThrow(
      /npm run build/,
    )
  })

  it('mas segue em frente sem o pacote quando a dispensa foi declarada', () => {
    const config = lerConfiguracao(['--sem-build'], { ...MUNDO, temPacoteDaTela: () => false })
    expect(config.semBuild).toBe(true)
  })

  it('interrompe diante de argumento desconhecido, em vez de ignorá-lo', () => {
    expect(() => lerConfiguracao(['--tena=claro'], MUNDO)).toThrow(/--tena/)
  })

  it('interrompe diante de tema que não existe, listando os que existem', () => {
    expect(() => lerConfiguracao(['--tema=roxo'], MUNDO)).toThrow(/claro-alto-contraste/)
  })

  it('interrompe diante de estado que não existe', () => {
    expect(() => lerConfiguracao(['--estado=quase'], MUNDO)).toThrow(/sem-reversa/)
  })

  it('interrompe diante de porta que não é número', () => {
    expect(() => lerConfiguracao(['--porta=oito'], MUNDO)).toThrow(/porta/i)
  })

  it('interrompe diante de atraso negativo', () => {
    expect(() => lerConfiguracao(['--atraso=-1'], MUNDO)).toThrow(/atraso/i)
  })
})
