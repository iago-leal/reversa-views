/**
 * Suíte do roteador (T010), contra `src/host/router.ts`.
 *
 * O roteador é a fronteira de confiança do host: tudo o que a webview pede
 * passa por aqui, e RF-06 exige que o que ele não reconhece vire linha de log
 * sem efeito colateral algum. RF-12 acrescenta o caso do comando reservado,
 * que precisa ser recusado nomeando-se como reservado, e não com erro.
 */

import { describe, expect, it, vi } from 'vitest'
import { SUMMARY_TEXT_CAP } from '../src/domain/limits.ts'
import { routeMessage } from '../src/host/router.ts'
import type { LogPort } from '../src/host/ports.ts'

function bancada() {
  const lines: string[] = []
  const log: LogPort = { write: (line) => void lines.push(line) }
  const read = vi.fn()
  const openFile = vi.fn()
  const openDraft = vi.fn()
  const copyText = vi.fn()
  return {
    lines,
    deps: { read, openFile, openDraft, copyText, log },
    read,
    openFile,
    openDraft,
    copyText,
  }
}

/** Um texto de `n` bytes, para medir contra o teto sem depender de acentuação. */
function textoDe(bytes: number): string {
  return 'a'.repeat(bytes)
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

// ---------------------------------------------------------------------------
// T013: os dois comandos que a feature 006 acrescenta, e a validação deles.
// ---------------------------------------------------------------------------

describe('os dois comandos novos, aceitos', () => {
  it('openDraft entrega o texto e o título à porta do rascunho', () => {
    const b = bancada()
    routeMessage({ command: 'openDraft', data: { text: 'resumo', title: 'Reversa' } }, b.deps)

    expect(b.openDraft).toHaveBeenCalledTimes(1)
    expect(b.openDraft).toHaveBeenCalledWith('resumo', 'Reversa')
    expect(b.copyText).not.toHaveBeenCalled()
    expect(b.lines).toEqual([])
  })

  it('copyText entrega o texto à porta da área de transferência', () => {
    const b = bancada()
    routeMessage({ command: 'copyText', data: { text: 'resumo' } }, b.deps)

    expect(b.copyText).toHaveBeenCalledTimes(1)
    expect(b.copyText).toHaveBeenCalledWith('resumo')
    expect(b.openDraft).not.toHaveBeenCalled()
  })

  it('nenhum dos dois dispara leitura nem abertura de arquivo', () => {
    const b = bancada()
    routeMessage({ command: 'openDraft', data: { text: 'x' } }, b.deps)
    routeMessage({ command: 'copyText', data: { text: 'x' } }, b.deps)

    expect(b.read).not.toHaveBeenCalled()
    expect(b.openFile).not.toHaveBeenCalled()
  })

  it('título ausente ou não textual é aceito, e o host fica com o seu próprio', () => {
    const b = bancada()
    routeMessage({ command: 'openDraft', data: { text: 'resumo' } }, b.deps)
    routeMessage({ command: 'openDraft', data: { text: 'resumo', title: 42 } }, b.deps)

    expect(b.openDraft).toHaveBeenCalledTimes(2)
    expect(b.openDraft).toHaveBeenNthCalledWith(1, 'resumo', null)
    expect(b.openDraft).toHaveBeenNthCalledWith(2, 'resumo', null)
    expect(b.lines).toEqual([])
  })

  it('o texto no teto exato passa, porque o limite é inclusivo', () => {
    const b = bancada()
    routeMessage({ command: 'copyText', data: { text: textoDe(SUMMARY_TEXT_CAP) } }, b.deps)
    expect(b.copyText).toHaveBeenCalledTimes(1)
  })
})

describe('as quatro regras de validação da fronteira (contrato 3.1)', () => {
  it('texto ausente: recusa nomeando o comando e o campo', () => {
    for (const comando of ['openDraft', 'copyText'] as const) {
      const b = bancada()
      routeMessage({ command: comando, data: {} }, b.deps)

      expect(b.lines).toHaveLength(1)
      expect(b.lines[0]).toContain(comando)
      expect(b.lines[0]).toContain('text')
      expect(b.openDraft).not.toHaveBeenCalled()
      expect(b.copyText).not.toHaveBeenCalled()
    }
  })

  it('texto de tipo errado: mesma recusa', () => {
    const b = bancada()
    routeMessage({ command: 'copyText', data: { text: 42 } }, b.deps)

    expect(b.lines).toHaveLength(1)
    expect(b.lines[0]).toContain('text')
    expect(b.copyText).not.toHaveBeenCalled()
  })

  it('texto vazio: recusa, que é o caso do comando disparado antes do processo chegar', () => {
    for (const comando of ['openDraft', 'copyText'] as const) {
      const b = bancada()
      routeMessage({ command: comando, data: { text: '' } }, b.deps)

      expect(b.lines).toHaveLength(1)
      expect(b.lines[0]).toContain('vazio')
      expect(b.openDraft).not.toHaveBeenCalled()
      expect(b.copyText).not.toHaveBeenCalled()
    }
  })

  it('texto acima do teto: recusa informando o tamanho recebido e o teto', () => {
    const b = bancada()
    routeMessage({ command: 'openDraft', data: { text: textoDe(SUMMARY_TEXT_CAP + 1) } }, b.deps)

    expect(b.lines).toHaveLength(1)
    expect(b.lines[0]).toContain(String(SUMMARY_TEXT_CAP + 1))
    expect(b.lines[0]).toContain(String(SUMMARY_TEXT_CAP))
    expect(b.openDraft).not.toHaveBeenCalled()
  })

  it('o teto é medido em bytes, e não em caracteres', () => {
    const b = bancada()
    // Cada acentuada ocupa dois bytes: metade do teto mais uma estoura.
    const acentuado = 'á'.repeat(SUMMARY_TEXT_CAP / 2 + 1)
    routeMessage({ command: 'copyText', data: { text: acentuado } }, b.deps)

    expect(b.copyText).not.toHaveBeenCalled()
    expect(b.lines[0]).toContain(String(SUMMARY_TEXT_CAP))
  })

  it('nenhuma recusa lança para quem chamou', () => {
    const b = bancada()
    for (const carga of [undefined, {}, { text: null }, { text: '' }, 'texto']) {
      expect(() => routeMessage({ command: 'copyText', data: carga }, b.deps)).not.toThrow()
    }
    expect(b.copyText).not.toHaveBeenCalled()
  })
})
