/**
 * Suíte do ritual escrito (T016).
 *
 * Ritual que não está escrito não acontece depois de meses de pausa, e o lugar
 * por onde se retoma um repositório é o README. Esta suíte é o que impede que a
 * seção suma numa reescrita futura.
 */

import { existsSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const README = existsSync('README.md') ? readFileSync('README.md', 'utf8') : ''

describe('o README existe e fala da herança', () => {
  it('existe', () => {
    expect(README.length).toBeGreaterThan(0)
  })

  it('tem a seção do ritual', () => {
    expect(README.toLowerCase()).toContain('ritual')
  })
})

describe('os três sinais de disparo (RF-16)', () => {
  it('nomeia a anomalia de campo desconhecido no painel', () => {
    expect(README.toLowerCase()).toContain('campo desconhecido')
  })

  it('nomeia a versão nova do Reversa instalada', () => {
    expect(README).toMatch(/vers[ãa]o nova do Reversa/i)
  })

  it('nomeia a release nova da origem do kit', () => {
    expect(README.toLowerCase()).toContain('kit')
  })
})

describe('os dois comandos', () => {
  it('nomeia o comando do verificador', () => {
    expect(README).toContain('check:heranca')
  })

  it('nomeia o comando do ressincronizador', () => {
    expect(README).toContain('sync:heranca')
  })

  it('diz o que fazer quando o ressincronizador para', () => {
    expect(README).toMatch(/declarar a adapta[çc][ãa]o|descartar a edi[çc][ãa]o/i)
  })
})

describe('o limite conhecido (RF-18)', () => {
  it('declara que resumo igual não garante comportamento igual', () => {
    expect(README).toMatch(/resumo/i)
    expect(README).toMatch(/comportamento/i)
  })

  it('cita a dependência transitiva como o caso que o resumo não pega', () => {
    expect(README).toMatch(/depend[êe]ncia transitiva/i)
  })

  it('aponta as suítes herdadas como a rede que resta', () => {
    expect(README).toMatch(/su[íi]tes herdadas/i)
  })
})
