/**
 * The instant, in Brasília time (RF-15, RF-16, RN-09, D-15).
 *
 * Um lugar só converte, e é este que o prende. A conversão é pelo NOME do
 * fuso, e não subtraindo três horas na mão: o deslocamento é constante desde
 * 2019, mas a lei pode voltar a mudar, e um painel que soma o número mente na
 * primeira mudança sem que ninguém perceba.
 *
 * O formato vem montado das partes do formatador, e não da cadeia que a
 * localidade devolve, porque `pt-BR` insere vírgula entre data e hora e a
 * posição dessa vírgula é decisão da localidade, não deste projeto.
 * @module tests/webview-instants
 */

import { describe, expect, it } from 'vitest'
import { brasiliaInstant, INSTANT_ABSENT } from '../src/webview/domain/instants.ts'

describe('formato com o fuso declarado (RF-15)', () => {
  it('converte o instante do critério de aceite, ao pé da letra', () => {
    expect(brasiliaInstant('2026-09-09T20:43:22Z').text).toBe('09/09/2026 17:43 (Brasília)')
  })

  it('não deixa vírgula alguma entre a data e a hora', () => {
    expect(brasiliaInstant('2026-09-09T20:43:22Z').text).not.toContain(',')
  })

  it('escreve dia, mês e hora com dois algarismos, sempre', () => {
    expect(brasiliaInstant('2026-01-05T12:04:00Z').text).toBe('05/01/2026 09:04 (Brasília)')
  })

  it('mantém o deslocamento de três horas em janeiro, sem horário de verão', () => {
    expect(brasiliaInstant('2026-01-15T12:00:00Z').text).toBe('15/01/2026 09:00 (Brasília)')
    expect(brasiliaInstant('2026-07-15T12:00:00Z').text).toBe('15/07/2026 09:00 (Brasília)')
  })
})

describe('as bordas do relógio', () => {
  it('escreve a meia-noite como 00:00, e não como 24:00', () => {
    expect(brasiliaInstant('2026-09-10T03:00:00Z').text).toBe('10/09/2026 00:00 (Brasília)')
  })

  it('vira o dia para trás quando o deslocamento o exige', () => {
    expect(brasiliaInstant('2026-09-10T02:00:00Z').text).toBe('09/09/2026 23:00 (Brasília)')
  })

  it('vira o ano para trás na virada, pelo mesmo motivo', () => {
    expect(brasiliaInstant('2027-01-01T01:30:00Z').text).toBe('31/12/2026 22:30 (Brasília)')
  })
})

describe('o instante absoluto continua disponível (RF-16)', () => {
  it('preserva o valor como chegou, ao lado do texto convertido', () => {
    const lido = brasiliaInstant('2026-09-09T20:43:22Z')
    expect(lido.raw).toBe('2026-09-09T20:43:22Z')
    expect(lido.known).toBe(true)
  })

  it('não reescreve o valor original em forma alguma', () => {
    expect(brasiliaInstant('2026-09-09T20:43:22.123Z').raw).toBe('2026-09-09T20:43:22.123Z')
  })
})

describe('instante ausente ou ilegível (RF-13)', () => {
  it('declara a ausência por nome, em vez de campo vazio', () => {
    for (const entrada of [null, undefined, '', '   ']) {
      const lido = brasiliaInstant(entrada)
      expect(lido.text).toBe(INSTANT_ABSENT)
      expect(lido.known).toBe(false)
      expect(lido.raw).toBe('')
    }
  })

  it('declara a ausência também para texto que não é instante, guardando o texto', () => {
    const lido = brasiliaInstant('ontem de tarde')
    expect(lido.text).toBe(INSTANT_ABSENT)
    expect(lido.known).toBe(false)
    expect(lido.raw).toBe('ontem de tarde')
  })

  it('trata valor que nem texto é como ausência', () => {
    for (const entrada of [42, {}, [], true] as unknown[]) {
      expect(brasiliaInstant(entrada as string).known).toBe(false)
    }
  })

  it('não lança para entrada alguma', () => {
    const entradas: unknown[] = [null, undefined, '', 'x', 42, {}, [], NaN, '0000-00-00']
    for (const entrada of entradas) {
      expect(() => brasiliaInstant(entrada as string)).not.toThrow()
    }
  })
})

describe('a forma da função', () => {
  it('é pura: duas chamadas sobre o mesmo instante dão o mesmo texto', () => {
    expect(brasiliaInstant('2026-09-09T20:43:22Z')).toEqual(brasiliaInstant('2026-09-09T20:43:22Z'))
  })

  it('não depende do fuso da máquina, que o painel deliberadamente ignora', () => {
    // O fuso do processo de teste é o da máquina de quem roda a suíte. Se a
    // conversão o usasse, este caso falharia fora de Brasília.
    expect(brasiliaInstant('2026-09-09T20:43:22Z').text).toContain('17:43')
  })
})
