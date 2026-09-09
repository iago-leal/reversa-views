/**
 * Suíte do roteador (T010), contra `src/host/router.ts`.
 *
 * O roteador é a fronteira de confiança do host: tudo o que a webview pede
 * passa por aqui, e RF-06 exige que o que ele não reconhece vire linha de log
 * sem efeito colateral algum. RF-12 acrescenta o caso do comando reservado,
 * que precisa ser recusado nomeando-se como reservado, e não com erro.
 */

import { describe, expect, it, vi } from 'vitest'
import { routeMessage } from '../src/host/router.ts'
import type { LogPort } from '../src/host/ports.ts'

function bancada() {
  const lines: string[] = []
  const log: LogPort = { write: (line) => void lines.push(line) }
  const read = vi.fn()
  const openFile = vi.fn()
  return { lines, deps: { read, openFile, log }, read, openFile }
}

describe('comandos reconhecidos', () => {
  it('onLoaded dispara leitura', () => {
    const b = bancada()
    routeMessage({ command: 'onLoaded' }, b.deps)
    expect(b.read).toHaveBeenCalledTimes(1)
  })

  it('reload dispara leitura (RF-07)', () => {
    const b = bancada()
    routeMessage({ command: 'reload' }, b.deps)
    expect(b.read).toHaveBeenCalledTimes(1)
  })

  it('openFile chama a abertura com o caminho recebido', () => {
    const b = bancada()
    routeMessage({ command: 'openFile', data: { path: 'requirements.md' } }, b.deps)
    expect(b.openFile).toHaveBeenCalledTimes(1)
    expect(b.openFile).toHaveBeenCalledWith('requirements.md')
    expect(b.read).not.toHaveBeenCalled()
  })

  it('log escreve a linha no canal com prefixo de origem (RF-11)', () => {
    const b = bancada()
    routeMessage({ command: 'log', data: { message: 'painel desenhou' } }, b.deps)
    expect(b.lines).toHaveLength(1)
    expect(b.lines[0]).toContain('painel desenhou')
    expect(b.lines[0]).toContain('webview')
  })
})

describe('comando reservado', () => {
  it('produz exatamente uma linha nomeando-o reservado, e nada mais', () => {
    const b = bancada()
    routeMessage({ command: 'dispatch', data: { agent: 'reversa-coding' } }, b.deps)

    expect(b.lines).toHaveLength(1)
    expect(b.lines[0]).toContain('reservado')
    expect(b.lines[0]).toContain('dispatch')
    expect(b.read).not.toHaveBeenCalled()
    expect(b.openFile).not.toHaveBeenCalled()
  })

  it('não lança para quem o chamou', () => {
    const b = bancada()
    expect(() => routeMessage({ command: 'dispatch', data: { agent: 'x' } }, b.deps)).not.toThrow()
  })
})

describe('envelopes recusados', () => {
  it('sem nome de comando', () => {
    const b = bancada()
    routeMessage({ data: { path: 'x' } }, b.deps)

    expect(b.lines).toHaveLength(1)
    expect(b.lines[0]).toContain('envelope')
    expect(b.read).not.toHaveBeenCalled()
    expect(b.openFile).not.toHaveBeenCalled()
  })

  it('com nome desconhecido, nomeando o que recebeu (RF-06)', () => {
    const b = bancada()
    routeMessage({ command: 'formatarDisco' }, b.deps)

    expect(b.lines).toHaveLength(1)
    expect(b.lines[0]).toContain('formatarDisco')
    expect(b.lines[0]).toContain('desconhecido')
    expect(b.read).not.toHaveBeenCalled()
    expect(b.openFile).not.toHaveBeenCalled()
  })

  it('com carga faltando o campo obrigatório, nomeando o campo', () => {
    const b = bancada()
    routeMessage({ command: 'openFile', data: {} }, b.deps)

    expect(b.lines).toHaveLength(1)
    expect(b.lines[0]).toContain('openFile')
    expect(b.lines[0]).toContain('path')
    expect(b.openFile).not.toHaveBeenCalled()
  })

  it('com carga de tipo errado no campo obrigatório', () => {
    const b = bancada()
    routeMessage({ command: 'log', data: { message: 42 } }, b.deps)

    expect(b.lines).toHaveLength(1)
    expect(b.lines[0]).toContain('message')
  })

  it('que não é sequer um objeto', () => {
    const b = bancada()
    routeMessage('reload', b.deps)
    routeMessage(null, b.deps)

    expect(b.lines).toHaveLength(2)
    expect(b.read).not.toHaveBeenCalled()
  })

  it('nenhum caminho de recusa lança para quem chamou', () => {
    const b = bancada()
    expect(() => routeMessage(undefined, b.deps)).not.toThrow()
    expect(() => routeMessage({ command: 'openFile' }, b.deps)).not.toThrow()
  })
})
