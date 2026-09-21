/**
 * Suíte da sessão (T010, feature 014, D-01, D-02).
 *
 * A ferramenta não é um leitor novo: é um terceiro consumidor da leitura, ao
 * lado do painel e do preview. Ela pede ao host a MESMA sequência de mensagens
 * que a tela recebe e a dobra sobre a MESMA máquina de estados de entrada. O
 * que esta suíte prende é justamente isso: a ordem é a do host, e a entrada
 * corrente é a que `nextEntry` produz, inclusive depois de uma releitura.
 */

import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { lerSessao } from '../src/cli/sessao.ts'
import type { ReadingResult } from '../src/host/reading.ts'
import { sessionMessages } from '../src/host/session.ts'
import { INITIAL_ENTRY } from '../src/webview/domain/entry.ts'
import { payloadFixture } from './helpers/reversa-fixtures.ts'

const CARIMBO = { version: '0.14.0', commit: 'a'.repeat(40), root: '/clone' }

/**
 * Uma leitura instalada, na forma que o host entrega à sessão.
 *
 * Ela sai da mesma fábrica que o painel usa nas suas suítes: o que a
 * ferramenta recebe é o que a tela recebe, e uma carga montada à mão aqui
 * seria uma segunda definição do mesmo modelo.
 */
function instalada(raiz: string): ReadingResult {
  const carga = payloadFixture({ root: raiz })
  return {
    kind: 'loaded',
    entry: carga.entry,
    process: carga.process,
    probe: { ...carga.probe, workspace: raiz },
    readAt: carga.readAt,
    decomposition: carga.decomposition,
    history: carga.history,
    bugs: carga.bugs,
    greenfield: carga.greenfield,
    discoveryState: carga.discoveryState ?? {
      extracao: { situacao: 'em-curso', bruto: 'geracao' },
      checkpoints: [],
      anomalias: [],
      absorvidas: [],
      registrosNaoAgentes: [],
    },
  }
}

/** Uma leitura que falhou, na forma nomeada que o host produz. */
const falha = (): ReadingResult => ({ kind: 'error', message: 'estado ilegível' })

describe('a sequência é a do host, e não uma daqui', () => {
  it('entrega exatamente as mensagens que `sessionMessages` produz', () => {
    const sessao = lerSessao('/w', { ler: instalada, carimbo: CARIMBO })
    expect(sessao.mensagens).toEqual(sessionMessages(['/w'], instalada, CARIMBO).messages)
  })

  it('abre pelo carregando, como a tela depende que abra', () => {
    const sessao = lerSessao('/w', { ler: instalada, carimbo: CARIMBO })
    expect(sessao.mensagens[0]).toEqual({ command: 'setEntry', data: { kind: 'loading' } })
  })

  it('observa a raiz pedida, e uma só', () => {
    const raizes: string[] = []
    lerSessao('/w', {
      ler: (raiz) => {
        raizes.push(raiz)
        return instalada(raiz)
      },
      carimbo: CARIMBO,
    })
    expect(raizes).toEqual(['/w'])
  })
})

describe('a entrada corrente é a que `nextEntry` produz', () => {
  it('uma leitura instalada chega como instalada, com a carga inteira', () => {
    const { entrada } = lerSessao('/w', { ler: instalada, carimbo: CARIMBO })
    expect(entrada.kind).toBe('installed')
    expect(entrada.loaded).not.toBeNull()
    expect(entrada.rereading).toBe(false)
    expect(entrada.root).toBe('/w')
  })

  it('o carimbo desta construção viaja na carga, como no editor', () => {
    const { entrada } = lerSessao('/w', { ler: instalada, carimbo: CARIMBO })
    expect(entrada.loaded?.extensionVersion).toBe(CARIMBO.version)
    expect(entrada.loaded?.builtFromCommit).toBe(CARIMBO.commit)
    expect(entrada.loaded?.builtFromRoot).toBe(CARIMBO.root)
  })

  it('uma leitura que falhou chega como falha nomeada, sem carga', () => {
    const { entrada } = lerSessao('/w', { ler: falha, carimbo: CARIMBO })
    expect(entrada.kind).toBe('error')
    expect(entrada.loaded).toBeNull()
    expect(entrada.message).toBe('estado ilegível')
  })
})

describe('a releitura, que é onde a máquina de estados importa', () => {
  it('parte do que estava na tela, e não do estado inicial', () => {
    const primeira = lerSessao('/w', { ler: instalada, carimbo: CARIMBO })
    const segunda = lerSessao('/w', { ler: instalada, carimbo: CARIMBO }, primeira.entrada)
    expect(segunda.entrada.kind).toBe('installed')
    expect(segunda.entrada.rereading).toBe(false)
  })

  it('o desfecho da consulta à origem atravessa a releitura intocado', () => {
    const primeira = lerSessao('/w', { ler: instalada, carimbo: CARIMBO })
    const comDesfecho = { ...primeira.entrada, update: { estado: 'em-dia' } as const }
    const segunda = lerSessao('/w', { ler: instalada, carimbo: CARIMBO }, comDesfecho)
    expect(segunda.entrada.update).toEqual({ estado: 'em-dia' })
  })

  it('sem entrada anterior, parte do estado inicial da tela', () => {
    const { entrada } = lerSessao('/w', { ler: falha, carimbo: CARIMBO })
    expect(INITIAL_ENTRY.kind).toBe('loading')
    expect(entrada.update).toBeNull()
  })
})

describe('a sessão não reimplementa regra alguma (RF-01)', () => {
  it('não conhece caminho de arquivo do Reversa', () => {
    const fonte = readFileSync('src/cli/sessao.ts', 'utf8')
    expect(fonte).not.toMatch(/\.reversa\b/)
    expect(fonte.match(/_reversa_[a-z]+\//)).toBeNull()
  })
})
