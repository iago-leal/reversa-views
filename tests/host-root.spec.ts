/**
 * Suíte da escolha de raiz (T008), contra `src/host/root.ts`.
 *
 * RN-05 resolve a ambiguidade de várias raízes pela ordem do editor, e D-06
 * proíbe descobrir se há instalação por existência de arquivo: quem responde
 * isso é a própria camada de leitura. A função de leitura entra por
 * parâmetro, como dublê contador, e é ela que prova que nenhuma raiz é lida
 * duas vezes.
 */

import { describe, expect, it, vi } from 'vitest'
import { EMPTY_SNAPSHOT, readReversa } from '../src/heranca/reversa-domain/src/index.ts'
import { chooseRoot } from '../src/host/root.ts'
import type { ReadingResult } from '../src/host/reading.ts'

function leitura(installed: boolean, root: string): ReadingResult {
  const stateJson = installed ? '{"project":"x"}' : null
  return {
    kind: 'loaded',
    entry: installed ? 'installed' : 'no-reversa',
    process: readReversa({ ...EMPTY_SNAPSHOT, stateJson }),
    probe: { workspace: root, featureDir: null, sessionDir: null, refusals: [], truncated: [] },
    readAt: '2026-09-09T12:00:00.000Z',
  }
}

describe('sem raiz alguma', () => {
  it('devolve no-folder e não chama a leitura nenhuma vez (EC-01)', () => {
    const ler = vi.fn(() => leitura(true, '/w'))
    const escolha = chooseRoot([], ler)

    expect(escolha.kind).toBe('no-folder')
    expect(ler).not.toHaveBeenCalled()
  })
})

describe('uma raiz', () => {
  it('devolve-a como observada, com lista de ignoradas vazia', () => {
    const ler = vi.fn((root: string) => leitura(true, root))
    const escolha = chooseRoot(['/w'], ler)

    expect(escolha.kind).toBe('chosen')
    if (escolha.kind !== 'chosen') return
    expect(escolha.root).toBe('/w')
    expect(escolha.ignoredRoots).toEqual([])
    expect(ler).toHaveBeenCalledTimes(1)
  })
})

describe('duas raízes, instalação só na segunda', () => {
  it('observa a segunda, ignora a primeira e lê duas vezes (RF-04)', () => {
    const ler = vi.fn((root: string) => leitura(root === '/b', root))
    const escolha = chooseRoot(['/a', '/b'], ler)

    expect(escolha.kind).toBe('chosen')
    if (escolha.kind !== 'chosen') return
    expect(escolha.root).toBe('/b')
    expect(escolha.ignoredRoots).toEqual(['/a'])
    expect(ler).toHaveBeenCalledTimes(2)
    expect(ler.mock.calls.map((call) => call[0])).toEqual(['/a', '/b'])
  })

  it('devolve o resultado já lido da raiz observada, sem segunda passagem', () => {
    const ler = vi.fn((root: string) => leitura(root === '/b', root))
    const escolha = chooseRoot(['/a', '/b'], ler)

    if (escolha.kind !== 'chosen') throw new Error('esperava raiz escolhida')
    expect(escolha.reading.kind).toBe('loaded')
    if (escolha.reading.kind !== 'loaded') return
    expect(escolha.reading.entry).toBe('installed')
    expect(escolha.reading.probe.workspace).toBe('/b')
  })
})

describe('duas raízes, nenhuma instalada', () => {
  it('observa a primeira, ignora a segunda e reaproveita o resultado lido', () => {
    const ler = vi.fn((root: string) => leitura(false, root))
    const escolha = chooseRoot(['/a', '/b'], ler)

    expect(escolha.kind).toBe('chosen')
    if (escolha.kind !== 'chosen') return
    expect(escolha.root).toBe('/a')
    expect(escolha.ignoredRoots).toEqual(['/b'])
    expect(ler).toHaveBeenCalledTimes(2)
    expect(escolha.reading.kind).toBe('loaded')
    if (escolha.reading.kind !== 'loaded') return
    expect(escolha.reading.probe.workspace).toBe('/a')
  })
})

describe('leitura que falha', () => {
  it('uma raiz cuja leitura deu erro não conta como instalada', () => {
    const ler = vi.fn((root: string): ReadingResult =>
      root === '/a' ? { kind: 'error', message: 'quebrou' } : leitura(true, root),
    )
    const escolha = chooseRoot(['/a', '/b'], ler)

    if (escolha.kind !== 'chosen') throw new Error('esperava raiz escolhida')
    expect(escolha.root).toBe('/b')
    expect(escolha.ignoredRoots).toEqual(['/a'])
  })
})
