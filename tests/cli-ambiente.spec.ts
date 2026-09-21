/**
 * Suíte do ambiente (T010 e T053, feature 016, RF-11, RF-12, RF-14, RF-20,
 * RF-21, D-07, D-08).
 *
 * As três decisões são puras, e é isso que deixa cada degrau ser exercitado
 * sem terminal: o ambiente entra como mapa, e sai o degrau, o jogo de glifos
 * e o fundo. A dúvida cai sempre para o degrau inferior.
 */

import { describe, expect, it } from 'vitest'
import {
  apresentacaoDoAmbiente,
  fundoDoAmbiente,
  grauDeCor,
  jogoDeGlifos,
  VARIAVEL_DE_TEMA,
} from '../src/cli/ambiente.ts'

describe('o degrau de cor, pelo que o ambiente declara (RF-11, RF-12)', () => {
  it('24 bits quando `COLORTERM` o declara, nas duas grafias', () => {
    expect(grauDeCor({ COLORTERM: 'truecolor', TERM: 'xterm' }, true)).toBe('24bits')
    expect(grauDeCor({ COLORTERM: '24bit', TERM: 'xterm' }, true)).toBe('24bits')
  })

  it('256 quando `TERM` o declara e nada se diz sobre 24 bits', () => {
    expect(grauDeCor({ TERM: 'xterm-256color' }, true)).toBe('256')
    expect(grauDeCor({ TERM: 'screen-256color', COLORTERM: 'sim' }, true)).toBe('256')
  })

  it('16 na dúvida, que é o degrau inferior entre os que têm cor', () => {
    expect(grauDeCor({ TERM: 'xterm' }, true)).toBe('16')
    expect(grauDeCor({}, true)).toBe('16')
  })

  it('nenhuma fora de terminal, com `NO_COLOR`, com a bandeira e com `TERM=dumb`', () => {
    expect(grauDeCor({ COLORTERM: 'truecolor' }, false)).toBe('nenhuma')
    expect(grauDeCor({ COLORTERM: 'truecolor', NO_COLOR: '' }, true)).toBe('nenhuma')
    expect(grauDeCor({ COLORTERM: 'truecolor' }, true, true)).toBe('nenhuma')
    expect(grauDeCor({ TERM: 'dumb', COLORTERM: 'truecolor' }, true)).toBe('nenhuma')
  })
})

describe('o jogo de glifos, pela localidade (RF-14)', () => {
  it('Unicode quando a primeira localidade declarada diz UTF-8, em qualquer caixa', () => {
    expect(jogoDeGlifos({ LANG: 'pt_BR.UTF-8' })).toBe('unicode')
    expect(jogoDeGlifos({ LC_CTYPE: 'en_US.utf8' })).toBe('unicode')
  })

  it('sete bits com a localidade `C`, e `LC_ALL` vence as outras', () => {
    expect(jogoDeGlifos({ LC_ALL: 'C', LANG: 'pt_BR.UTF-8' })).toBe('sete-bits')
    expect(jogoDeGlifos({ LANG: 'C' })).toBe('sete-bits')
  })

  it('sete bits sem localidade alguma, e vazia conta como não declarada', () => {
    expect(jogoDeGlifos({})).toBe('sete-bits')
    expect(jogoDeGlifos({ LC_ALL: '', LANG: 'pt_BR.UTF-8' })).toBe('unicode')
  })
})

describe('o fundo, pela precedência do RF-20', () => {
  it('a bandeira vence a variável', () => {
    expect(fundoDoAmbiente('escuro', { [VARIAVEL_DE_TEMA]: 'claro' }).tema).toBe('escuro')
  })

  it('a variável vence `COLORFGBG`', () => {
    expect(fundoDoAmbiente(null, { [VARIAVEL_DE_TEMA]: 'claro', COLORFGBG: '15;0' }).tema).toBe('claro')
  })

  it('`COLORFGBG` decide pelo último campo, quando nada mais foi dito', () => {
    expect(fundoDoAmbiente(null, { COLORFGBG: '0;15' }).tema).toBe('claro')
    expect(fundoDoAmbiente(null, { COLORFGBG: '0;default;7' }).tema).toBe('claro')
    expect(fundoDoAmbiente(null, { COLORFGBG: '15;0' }).tema).toBe('escuro')
    expect(fundoDoAmbiente(null, { COLORFGBG: '7;8' }).tema).toBe('escuro')
  })

  it('`COLORFGBG` ilegível é ignorada, e vale o escuro', () => {
    expect(fundoDoAmbiente(null, { COLORFGBG: 'default;default' }).tema).toBe('escuro')
    expect(fundoDoAmbiente(null, { COLORFGBG: '0;99' }).tema).toBe('escuro')
    expect(fundoDoAmbiente(null, {}).tema).toBe('escuro')
  })

  it('a precedência é a mesma nos quatro degraus de cor', () => {
    const ambientes = [
      { COLORTERM: 'truecolor' },
      { TERM: 'xterm-256color' },
      { TERM: 'xterm' },
      { NO_COLOR: '1' },
    ]
    for (const ambiente of ambientes) {
      const lido = apresentacaoDoAmbiente({
        ambiente: { ...ambiente, [VARIAVEL_DE_TEMA]: 'claro' },
        saidaEhTerminal: true,
        semCor: false,
        tema: 'escuro',
      })
      expect(lido.apresentacao.tema).toBe('escuro')
    }
  })
})

describe('a variável de tema com valor não reconhecido (RF-21)', () => {
  it('é ignorada, avisa nomeando o valor, e a precedência segue', () => {
    const lido = fundoDoAmbiente(null, { [VARIAVEL_DE_TEMA]: 'roxo', COLORFGBG: '0;15' })
    expect(lido.tema).toBe('claro')
    expect(lido.aviso).toContain('roxo')
    expect(lido.aviso).toContain(VARIAVEL_DE_TEMA)
  })

  it('avisa mesmo quando a bandeira decide, porque a variável continua errada', () => {
    const lido = fundoDoAmbiente('claro', { [VARIAVEL_DE_TEMA]: 'roxo' })
    expect(lido.tema).toBe('claro')
    expect(lido.aviso).not.toBeNull()
  })

  it('valor reconhecido não avisa nada', () => {
    expect(fundoDoAmbiente(null, { [VARIAVEL_DE_TEMA]: 'claro' }).aviso).toBeNull()
    expect(fundoDoAmbiente(null, {}).aviso).toBeNull()
  })
})

describe('a decisão não tem por onde escrever (T053, RF-20, D-07)', () => {
  it('cada função aceita só o ambiente e valores simples, e nenhuma aceita fluxo', () => {
    // A aridade é a parte da assinatura que sobrevive à compilação: nenhuma
    // das funções tem parâmetro sobrando em que um fluxo pudesse chegar.
    expect(grauDeCor.length).toBeLessThanOrEqual(3)
    expect(jogoDeGlifos).toHaveLength(1)
    expect(fundoDoAmbiente).toHaveLength(2)
    expect(apresentacaoDoAmbiente).toHaveLength(1)
  })

  it('decide o fundo sobre um ambiente congelado, sem tocá-lo e sem falhar', () => {
    const ambiente = Object.freeze({ COLORFGBG: '0;15', TERM: 'xterm-256color', LANG: 'pt_BR.UTF-8' })
    const lido = apresentacaoDoAmbiente({ ambiente, saidaEhTerminal: true, semCor: false, tema: null })
    expect(lido.apresentacao).toEqual({ grau: '256', tema: 'claro', glifos: 'unicode' })
    expect(ambiente).toEqual({ COLORFGBG: '0;15', TERM: 'xterm-256color', LANG: 'pt_BR.UTF-8' })
  })

  it('o módulo não importa fluxo, processo nem módulo de plataforma', async () => {
    const { readFileSync } = await import('node:fs')
    const fonte = readFileSync('src/cli/ambiente.ts', 'utf8')
    expect(fonte).not.toMatch(/from 'node:/)
    expect(fonte).not.toMatch(/process\.(stdout|stderr|stdin)/)
    expect(fonte).not.toMatch(/\.write\(/)
  })
})
