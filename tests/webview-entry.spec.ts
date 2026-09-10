/**
 * The entry state of the panel: which of the five named situations is on
 * screen, and what survives a reread (RF-01, RN-08, EC-07).
 * @module tests/webview-entry
 */

import { describe, expect, it } from 'vitest'
import { INITIAL_ENTRY, nextEntry } from '../src/webview/domain/entry.ts'
import { payloadFixture } from './helpers/reversa-fixtures.ts'

describe('estado de entrada', () => {
  it('começa carregando, sem processo e sem releitura', () => {
    expect(INITIAL_ENTRY.kind).toBe('loading')
    expect(INITIAL_ENTRY.loaded).toBeNull()
    expect(INITIAL_ENTRY.rereading).toBe(false)
  })

  it('dá estado distinto a cada um dos cinco valores nomeados', () => {
    const kinds = new Set<string>()
    kinds.add(nextEntry(INITIAL_ENTRY, { command: 'setEntry', data: { kind: 'no-folder' } }).kind)
    kinds.add(nextEntry(INITIAL_ENTRY, { command: 'setEntry', data: { kind: 'loading' } }).kind)
    kinds.add(
      nextEntry(INITIAL_ENTRY, { command: 'setEntry', data: { kind: 'error', message: 'x' } }).kind,
    )
    kinds.add(nextEntry(INITIAL_ENTRY, { command: 'setProcess', data: payloadFixture() }).kind)
    kinds.add(
      nextEntry(INITIAL_ENTRY, {
        command: 'setProcess',
        data: payloadFixture({ entry: 'no-reversa' }),
      }).kind,
    )
    expect(kinds).toEqual(new Set(['no-folder', 'loading', 'error', 'installed', 'no-reversa']))
  })

  it('traz processo tanto em instalado quanto em sem Reversa', () => {
    const instalado = nextEntry(INITIAL_ENTRY, { command: 'setProcess', data: payloadFixture() })
    const sem = nextEntry(INITIAL_ENTRY, {
      command: 'setProcess',
      data: payloadFixture({ entry: 'no-reversa' }),
    })
    expect(instalado.loaded).not.toBeNull()
    expect(sem.loaded).not.toBeNull()
    expect(instalado.kind).not.toBe(sem.kind)
  })

  it('guarda a mensagem do estado de erro e a raiz quando há', () => {
    const erro = nextEntry(INITIAL_ENTRY, {
      command: 'setEntry',
      data: { kind: 'error', message: 'não deu para ler', root: '/w' },
    })
    expect(erro.message).toBe('não deu para ler')
    expect(erro.root).toBe('/w')
  })

  it('marca releitura em curso sem apagar o processo anterior', () => {
    const cheio = nextEntry(INITIAL_ENTRY, { command: 'setProcess', data: payloadFixture() })
    const relendo = nextEntry(cheio, { command: 'setEntry', data: { kind: 'loading' } })

    expect(relendo.rereading).toBe(true)
    expect(relendo.loaded).toBe(cheio.loaded)
    expect(relendo.kind).toBe('installed')
  })

  it('descarta o processo anterior quando o estado novo não tem processo', () => {
    const cheio = nextEntry(INITIAL_ENTRY, { command: 'setProcess', data: payloadFixture() })
    const semPasta = nextEntry(cheio, { command: 'setEntry', data: { kind: 'no-folder' } })

    expect(semPasta.loaded).toBeNull()
    expect(semPasta.rereading).toBe(false)
  })

  it('deixa a última de duas cargas em sequência prevalecer', () => {
    const primeira = payloadFixture({ readAt: '2026-09-09T15:00:00Z' })
    const segunda = payloadFixture({ readAt: '2026-09-09T15:00:03Z' })

    const depois = [primeira, segunda].reduce(
      (estado, data) => nextEntry(estado, { command: 'setProcess', data }),
      INITIAL_ENTRY,
    )

    expect(depois.loaded?.readAt).toBe('2026-09-09T15:00:03Z')
    expect(depois.rereading).toBe(false)
  })

  it('não muda de estado diante de comando que não conhece', () => {
    const cheio = nextEntry(INITIAL_ENTRY, { command: 'setProcess', data: payloadFixture() })
    const depois = nextEntry(cheio, { command: 'setUniverse' } as never)

    expect(depois).toBe(cheio)
  })

  it('não deixa o aviso do host mexer no estado de entrada', () => {
    const cheio = nextEntry(INITIAL_ENTRY, { command: 'setProcess', data: payloadFixture() })
    const depois = nextEntry(cheio, {
      command: 'setNotice',
      data: { level: 'warning', message: 'sumiu' },
    })

    expect(depois).toEqual(cheio)
  })
})

describe('o desfecho da consulta dentro do estado de entrada (feature 007)', () => {
  const EM_DIA = { estado: 'em-dia' } as const
  const ATRASADA = { estado: 'atrasada', commits: 4 } as const

  it('começa sem desfecho algum, que não é o mesmo que um desfecho de valor neutro', () => {
    expect(INITIAL_ENTRY.update).toBeNull()
  })

  it('o comando do desfecho guarda o que chegou e não mexe em mais nada', () => {
    const cheio = nextEntry(INITIAL_ENTRY, { command: 'setProcess', data: payloadFixture() })
    const depois = nextEntry(cheio, { command: 'setUpdate', data: ATRASADA })

    expect(depois.update).toEqual(ATRASADA)
    expect(depois.kind).toBe(cheio.kind)
    expect(depois.loaded).toBe(cheio.loaded)
    expect(depois.rereading).toBe(cheio.rereading)
    expect(depois.root).toBe(cheio.root)
  })

  it('a releitura preserva o desfecho anterior até a resposta nova chegar', () => {
    const cheio = nextEntry(INITIAL_ENTRY, { command: 'setProcess', data: payloadFixture() })
    const respondido = nextEntry(cheio, { command: 'setUpdate', data: EM_DIA })
    const relendo = nextEntry(respondido, { command: 'setEntry', data: { kind: 'loading' } })
    const relido = nextEntry(relendo, { command: 'setProcess', data: payloadFixture() })

    expect(relendo.update).toEqual(EM_DIA)
    expect(relido.update).toEqual(EM_DIA)
  })

  it('a resposta nova substitui a anterior quando enfim chega', () => {
    const cheio = nextEntry(INITIAL_ENTRY, { command: 'setProcess', data: payloadFixture() })
    const antes = nextEntry(cheio, { command: 'setUpdate', data: EM_DIA })
    const consultando = nextEntry(antes, { command: 'setUpdate', data: { estado: 'consultando' } })
    const depois = nextEntry(consultando, { command: 'setUpdate', data: ATRASADA })

    expect(depois.update).toEqual(ATRASADA)
  })

  it('estado sem leitura por trás apaga o desfecho, em vez de declará-lo sobre construção que não nomeia', () => {
    const cheio = nextEntry(INITIAL_ENTRY, { command: 'setProcess', data: payloadFixture() })
    const respondido = nextEntry(cheio, { command: 'setUpdate', data: EM_DIA })
    const semPasta = nextEntry(respondido, { command: 'setEntry', data: { kind: 'no-folder' } })

    expect(semPasta.update).toBeNull()
  })

  it('o aviso do host continua sem tocar no desfecho', () => {
    const cheio = nextEntry(INITIAL_ENTRY, { command: 'setProcess', data: payloadFixture() })
    const respondido = nextEntry(cheio, { command: 'setUpdate', data: ATRASADA })
    const depois = nextEntry(respondido, {
      command: 'setNotice',
      data: { level: 'warning', message: 'sumiu' },
    })

    expect(depois.update).toEqual(ATRASADA)
  })
})
