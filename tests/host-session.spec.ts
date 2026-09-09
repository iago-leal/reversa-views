/**
 * Suíte da sequência de mensagens (T006), contra `src/host/session.ts`.
 *
 * A regra de qual mensagem sai em que ordem morava dentro do provedor, onde
 * só era exercível com a interface do editor por perto. Ela é agora função
 * pura, e é esta suíte que a prende: escrita ANTES da extração, para que a
 * extração seja confirmada por ela, e não conferida depois no olho.
 *
 * O preview da feature 005 lê a mesma função, de modo que o que aqui se fixa
 * vale para os dois hosts, o de verdade e o fingido (D-04, RF-17).
 */

import { describe, expect, it } from 'vitest'
import { EMPTY_SNAPSHOT, readReversa } from '../src/heranca/reversa-domain/src/index.ts'
import { INHERITED_MODEL_REVISION } from '../src/host/inheritance.ts'
import type { SetEntryData, SetProcessData } from '../src/host/protocol.ts'
import type { ReadingResult } from '../src/host/reading.ts'
import { sessionMessages } from '../src/host/session.ts'

/** Uma leitura instalada, montada pelo mesmo leitor que o host usa. */
function instalada(root: string): ReadingResult {
  return {
    kind: 'loaded',
    entry: 'installed',
    process: readReversa({ ...EMPTY_SNAPSHOT, stateJson: '{"project":"x"}' }),
    probe: { workspace: root, featureDir: null, sessionDir: null, refusals: [], truncated: [] },
    readAt: '2026-09-09T12:00:00.000Z',
  }
}

/** Uma leitura de raiz sem Reversa instalado. */
function semReversa(root: string): ReadingResult {
  return { ...instalada(root), entry: 'no-reversa' }
}

describe('a ordem que o painel depende', () => {
  it('abre sempre pelo carregando, antes de qualquer disco', () => {
    const { messages } = sessionMessages(['/w'], instalada)
    expect(messages[0]).toEqual({ command: 'setEntry', data: { kind: 'loading' } })
  })

  it('entrega duas mensagens: o carregando e o resultado', () => {
    const { messages } = sessionMessages(['/w'], instalada)
    expect(messages).toHaveLength(2)
  })
})

describe('sem pasta aberta', () => {
  it('diz sem diretório e não observa raiz alguma', () => {
    const { messages, observedRoot } = sessionMessages([], instalada)
    expect(messages[1]).toEqual({ command: 'setEntry', data: { kind: 'no-folder' } })
    expect(observedRoot).toBeNull()
  })

  it('não chama o leitor, porque não há o que ler', () => {
    let chamadas = 0
    sessionMessages([], (root) => {
      chamadas += 1
      return instalada(root)
    })
    expect(chamadas).toBe(0)
  })
})

describe('leitura que falhou', () => {
  const falha = (): ReadingResult => ({ kind: 'error', message: 'estado ilegível' })

  it('vira envelope de erro com a mensagem, a raiz e as ignoradas', () => {
    const { messages, observedRoot } = sessionMessages(['/w', '/outra'], falha)
    expect(messages[1]?.command).toBe('setEntry')
    const dados = messages[1]?.data as SetEntryData
    expect(dados).toEqual({
      kind: 'error',
      message: 'estado ilegível',
      root: '/w',
      ignoredRoots: ['/outra'],
    })
    expect(observedRoot).toBe('/w')
  })
})

describe('leitura que deu certo', () => {
  it('manda o processo com a revisão herdada e a raiz observada', () => {
    const { messages, observedRoot } = sessionMessages(['/w'], instalada)
    expect(messages[1]?.command).toBe('setProcess')
    const dados = messages[1]?.data as SetProcessData
    expect(dados.entry).toBe('installed')
    expect(dados.root).toBe('/w')
    expect(dados.ignoredRoots).toEqual([])
    expect(dados.readAt).toBe('2026-09-09T12:00:00.000Z')
    expect(dados.inheritedRevision).toBe(INHERITED_MODEL_REVISION)
    expect(observedRoot).toBe('/w')
  })

  it('escolhe a primeira raiz instalada e declara as demais como ignoradas', () => {
    const leitor = (root: string): ReadingResult =>
      root === '/b' ? instalada(root) : semReversa(root)
    const { messages, observedRoot } = sessionMessages(['/a', '/b', '/c'], leitor)
    const dados = messages[1]?.data as SetProcessData
    expect(observedRoot).toBe('/b')
    expect(dados.root).toBe('/b')
    expect(dados.ignoredRoots).toEqual(['/a', '/c'])
  })

  it('sem nenhuma instalada, fica com a primeira raiz e o estado sem Reversa', () => {
    const { messages, observedRoot } = sessionMessages(['/a', '/b'], semReversa)
    const dados = messages[1]?.data as SetProcessData
    expect(observedRoot).toBe('/a')
    expect(dados.entry).toBe('no-reversa')
    expect(dados.ignoredRoots).toEqual(['/b'])
  })
})

describe('a fronteira da função', () => {
  it('não toca o editor: só recebe raízes e um leitor, e devolve dados', () => {
    const fonte = sessionMessages.toString()
    expect(fonte).not.toContain('vscode')
    expect(fonte).not.toContain('webview')
  })
})
