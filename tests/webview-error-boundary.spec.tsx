/**
 * The error boundary: a section that breaks says so in its own place, writes
 * one technical line to the channel, and leaves the rest of the panel drawn
 * (RN-07, D-08).
 *
 * The boundary is exercised through its own contract rather than by throwing
 * inside a render, because `react-dom/server` does not run error boundaries:
 * on the server a throw propagates instead of being caught. So the suite
 * drives the two halves the class actually owns -- the state a throw produces
 * and the line the catch writes -- and states the isolation as what it is in
 * the markup: one boundary per section, each with its own name.
 * @module tests/webview-error-boundary
 */

import type { ReactElement } from 'react'
import { readFileSync } from 'node:fs'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { EMPTY_PREFERENCES, SECTION_NAMES } from '../src/webview/domain/types.ts'
import { App } from '../src/webview/ui/App.tsx'
import { ErrorBoundary } from '../src/webview/ui/ErrorBoundary.tsx'
import { payloadFixture } from './helpers/reversa-fixtures.ts'

/** A log port that counts, which is the only port the boundary receives. */
function canal() {
  const linhas: string[] = []
  return { escrever: (linha: string) => linhas.push(linha), linhas: () => linhas }
}

/** A boundary already in the state a throw produces, plus its channel. */
function quebrado(section: (typeof SECTION_NAMES)[number], erro = new Error('quebrou')) {
  const log = canal()
  const limite = new ErrorBoundary({
    section,
    onLog: log.escrever,
    children: <p data-part="conteúdo">conteúdo</p>,
  })
  limite.state = ErrorBoundary.getDerivedStateFromError(erro)
  return { limite, log, erro }
}

describe('estado que uma falha produz', () => {
  it('transforma o lançamento em estado de falha', () => {
    expect(ErrorBoundary.getDerivedStateFromError(new Error('quebrou')).failed).toBe(true)
  })

  it('desenha o conteúdo enquanto nada falhou', () => {
    const limite = new ErrorBoundary({
      section: 'forward',
      onLog: () => {},
      children: <p data-part="conteúdo">conteúdo</p>,
    })
    const markup = renderToStaticMarkup(limite.render() as ReactElement)
    expect(markup).toContain('data-part="conteúdo"')
    expect(markup).toContain('data-boundary="forward"')
  })
})

describe('declaração da falha no lugar da seção', () => {
  it('substitui o conteúdo da seção defeituosa pela declaração, e nomeia a seção', () => {
    const { limite } = quebrado('anomalies')
    const markup = renderToStaticMarkup(limite.render() as ReactElement)
    expect(markup).toMatch(/data-part="section-failure"/)
    expect(markup).toContain('data-boundary="anomalies"')
    expect(markup).not.toContain('data-part="conteúdo"')
  })

  it('mantém a declaração legível, e não deixa a seção em branco', () => {
    const { limite } = quebrado('probe')
    const texto = renderToStaticMarkup(limite.render() as ReactElement).replace(/<[^>]+>/g, ' ')
    expect(texto.trim().length).toBeGreaterThan(20)
  })
})

describe('linha técnica pelo canal de log', () => {
  it('escreve exatamente uma linha por falha, nomeando a seção e o erro', () => {
    const { limite, log, erro } = quebrado('policy', new Error('detalhe técnico'))
    limite.componentDidCatch(erro, { componentStack: '\n  em PolicySection' })

    expect(log.linhas().length).toBe(1)
    expect(log.linhas()[0]).toContain('policy')
    expect(log.linhas()[0]).toContain('detalhe técnico')
  })

  it('escreve no mesmo formato de origem, ato e motivo que o host usa', () => {
    const { limite, log, erro } = quebrado('policy', new Error('detalhe técnico'))
    limite.componentDidCatch(erro, { componentStack: '\n  em PolicySection' })

    expect(log.linhas()[0]).toMatch(/^[a-z-]+ · [^:]+: .+$/)
  })

  it('não multiplica a linha a cada redesenho da seção quebrada', () => {
    const { limite, log, erro } = quebrado('policy')
    limite.componentDidCatch(erro, { componentStack: '' })
    limite.render()
    limite.render()
    limite.render()

    expect(log.linhas().length).toBe(1)
  })

  it('não abre diálogo, não notifica e não muda foco, conforme RN-07', () => {
    const fonte = readFileSync('src/webview/ui/ErrorBoundary.tsx', 'utf8')
    for (const proibido of ['alert(', 'confirm(', 'prompt(', '.focus(', 'showMessage']) {
      expect(fonte, `o limite não pode chamar ${proibido}`).not.toContain(proibido)
    }
  })
})

describe('isolamento por seção', () => {
  it('escreve em canais próprios, e um segundo erro não apaga o primeiro', () => {
    const primeiro = quebrado('anomalies')
    const segundo = quebrado('probe')
    primeiro.limite.componentDidCatch(primeiro.erro, { componentStack: '' })
    segundo.limite.componentDidCatch(segundo.erro, { componentStack: '' })

    expect(primeiro.log.linhas().length).toBe(1)
    expect(primeiro.log.linhas()[0]).toContain('anomalies')
    expect(segundo.log.linhas()[0]).toContain('probe')

    const desenhoDoPrimeiro = renderToStaticMarkup(primeiro.limite.render() as ReactElement)
    expect(desenhoDoPrimeiro).toContain('data-boundary="anomalies"')
  })

  it('o painel envolve cada uma das seis seções no seu próprio limite', () => {
    const markup = renderToStaticMarkup(
      <App
        entry={{
          kind: 'installed',
          rereading: false,
          loaded: payloadFixture(),
          message: null,
          root: '/w/reversa-views',
        }}
        notice={null}
        preferences={EMPTY_PREFERENCES}
        theme={{ mode: 'dark', highContrast: false }}
        onReload={() => {}}
        onOpenFile={() => {}}
        onLog={() => {}}
      />,
    )
    const limites = [...markup.matchAll(/data-boundary="([a-z]+)"/g)].map((m) => m[1])
    expect(limites).toEqual([...SECTION_NAMES])
  })

  it('deixa as outras cinco desenhadas quando uma delas está quebrada', () => {
    const { limite } = quebrado('anomalies')
    const quebradaMarkup = renderToStaticMarkup(limite.render() as ReactElement)
    const sãMarkup = renderToStaticMarkup(
      new ErrorBoundary({
        section: 'probe',
        onLog: () => {},
        children: <p data-part="conteúdo">conteúdo</p>,
      }).render() as ReactElement,
    )

    expect(quebradaMarkup).toContain('data-part="section-failure"')
    expect(sãMarkup).toContain('data-part="conteúdo"')
    expect(sãMarkup).not.toContain('data-part="section-failure"')
  })
})
