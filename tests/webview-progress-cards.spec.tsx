/**
 * The three cards with a bar, and the authority each bar answers to (RF-27,
 * RF-28, RF-29, RF-33, RN-08, RN-10).
 *
 * The bar itself is verified alone in `webview-progress-bar.spec.tsx`. What
 * this suite states is where each card takes its two numbers from: the
 * inherited count in the decomposition and the forward cycle, never the length
 * of the list in view; the declared total in the history, never the entries
 * the ceiling left. The three border cases of RF-33 close the suite.
 * @module tests/webview-progress-cards
 */

import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { readDecomposition } from '../src/domain/decomposition.ts'
import { DecompositionSection } from '../src/webview/ui/DecompositionSection.tsx'
import { ForwardSection } from '../src/webview/ui/ForwardSection.tsx'
import { HistorySection } from '../src/webview/ui/HistorySection.tsx'
import type { HistoryEntry } from '../src/domain/types.ts'
import {
  actionsMd,
  decompositionFixture,
  historyFixture,
  processFixture,
} from './helpers/reversa-fixtures.ts'

/** The bar of a card, or null when the card drew none. */
function barra(markup: string): { agora: number; maximo: number; texto: string } | null {
  const casou = /<svg([^>]*role="progressbar"[^>]*)>/.exec(markup)
  if (casou === null) return null
  const attrs = casou[1]
  const agora = /aria-valuenow="([^"]*)"/.exec(attrs)
  const maximo = /aria-valuemax="([^"]*)"/.exec(attrs)
  const texto = /aria-valuetext="([^"]*)"/.exec(attrs)
  return {
    agora: Number(agora?.[1]),
    maximo: Number(maximo?.[1]),
    texto: texto?.[1] ?? '',
  }
}

/** One entry of the history, converged or not. */
function entrada(id: string, situacao: HistoryEntry['situacao']): HistoryEntry {
  return {
    pasta: `_reversa_forward/${id}-x`,
    id,
    nomeCurto: 'x',
    situacao,
    marca: 'nenhuma',
    acoes: { total: 1, fechadas: situacao === 'convergida' ? 1 : 0, abertas: 0, emendas: 0 },
    adendo: null,
    resumo: null,
    ultimoEvento: null,
  }
}

describe('a decomposição (RF-27, RN-08)', () => {
  it('desenha a barra sobre a contagem herdada, e não sobre a lista em vista', () => {
    // Nine closed and three open: the default cut shows five closed, and a bar
    // over the list would draw five twelfths where the feature is at nine.
    const process = processFixture({ actionsMd: actionsMd(9, 3) })
    const markup = renderToStaticMarkup(
      <DecompositionSection
        decomposition={readDecomposition(actionsMd(9, 3), 12)}
        process={process}
        collapsed={false}
        onToggle={() => {}}
      />,
    )
    expect(barra(markup)).toEqual({ agora: 9, maximo: 12, texto: '9 de 12 ações fechadas' })
  })

  it('o texto equivalente repete a frase que o cartão já imprime (RN-10)', () => {
    const process = processFixture({ actionsMd: actionsMd(9, 3) })
    const markup = renderToStaticMarkup(
      <DecompositionSection
        decomposition={decompositionFixture(9, 3)}
        process={process}
        collapsed={false}
        onToggle={() => {}}
      />,
    )
    expect(markup).toContain('9 de 12 ações fechadas')
    expect(barra(markup)?.texto).toBe('9 de 12 ações fechadas')
  })

  it('divergência entre contagem e lista mantém o aviso, e a barra segue a contagem (RF-33)', () => {
    const process = processFixture({ actionsMd: actionsMd(9, 3) })
    // The file declares twelve; the list carries three. The count is the
    // authority, the notice stays, and the bar does not pick the list.
    const markup = renderToStaticMarkup(
      <DecompositionSection
        decomposition={readDecomposition(actionsMd(2, 1), 12)}
        process={process}
        collapsed={false}
        onToggle={() => {}}
      />,
    )
    expect(markup).toContain('data-part="decomposition-divergence"')
    expect(barra(markup)?.maximo).toBe(12)
    expect(barra(markup)?.agora).toBe(9)
  })

  it('sem feature ativa, o denominador é zero e não há barra (RF-33)', () => {
    const process = processFixture({ activeRequirements: null, actionsMd: null })
    const markup = renderToStaticMarkup(
      <DecompositionSection
        decomposition={readDecomposition(null, 0)}
        process={process}
        collapsed={false}
        onToggle={() => {}}
      />,
    )
    expect(process.forward.actions.total).toBe(0)
    expect(barra(markup)).toBeNull()
  })
})

describe('o ciclo forward (RF-28)', () => {
  it('a barra concorda com os pares de ações fechadas e abertas do cartão', () => {
    const process = processFixture({ actionsMd: actionsMd(4, 6) })
    const markup = renderToStaticMarkup(
      <ForwardSection process={process} collapsed={false} onToggle={() => {}} />,
    )
    expect(markup).toMatch(/data-item="closed-actions">4</)
    expect(markup).toMatch(/data-item="open-actions">6</)
    expect(barra(markup)).toEqual({ agora: 4, maximo: 10, texto: '4 de 10 ações fechadas' })
  })

  it('sem ação alguma, o cartão não desenha barra (RF-33)', () => {
    const process = processFixture({ activeRequirements: null, actionsMd: null })
    const markup = renderToStaticMarkup(
      <ForwardSection process={process} collapsed={false} onToggle={() => {}} />,
    )
    expect(barra(markup)).toBeNull()
  })
})

describe('o histórico (RF-29, RN-08)', () => {
  const SEIS = [
    entrada('001', 'convergida'),
    entrada('002', 'convergida'),
    entrada('003', 'convergida'),
    entrada('004', 'convergida'),
    entrada('005', 'convergida'),
    entrada('006', 'em-aberto'),
  ]

  it('com seis features das quais cinco convergidas, a barra está em cinco sextos', () => {
    const markup = renderToStaticMarkup(
      <HistorySection
        history={historyFixture(SEIS)}
        collapsed={false}
        onToggle={() => {}}
        onOpenFile={() => {}}
      />,
    )
    expect(barra(markup)).toEqual({ agora: 5, maximo: 6, texto: '5 de 6 features convergidas' })
  })

  it('o denominador é o total declarado, e não as entradas que o teto deixou à vista', () => {
    // Three read, nine exist: the bar measures three over nine, not three over
    // three, and the truncation notice is what explains the gap.
    const markup = renderToStaticMarkup(
      <HistorySection
        history={historyFixture(SEIS.slice(0, 3), { total: 9, truncado: true })}
        collapsed={false}
        onToggle={() => {}}
        onOpenFile={() => {}}
      />,
    )
    expect(barra(markup)).toEqual({ agora: 3, maximo: 9, texto: '3 de 9 features convergidas' })
    expect(markup).toContain('data-part="history-truncated"')
  })

  it('a frase que conta as features fica ao lado da barra (RN-10)', () => {
    const markup = renderToStaticMarkup(
      <HistorySection
        history={historyFixture(SEIS)}
        collapsed={false}
        onToggle={() => {}}
        onOpenFile={() => {}}
      />,
    )
    expect(markup).toMatch(/data-part="history-counts">5 de 6 features convergidas\./)
  })

  it('cronologia não lida não desenha barra (RF-33)', () => {
    const markup = renderToStaticMarkup(
      <HistorySection
        history={undefined}
        collapsed={false}
        onToggle={() => {}}
        onOpenFile={() => {}}
      />,
    )
    expect(barra(markup)).toBeNull()
    expect(markup).toContain('data-part="history-unread"')
  })

  it('sem pasta de feature alguma, o denominador é zero e não há barra (RF-33)', () => {
    const markup = renderToStaticMarkup(
      <HistorySection
        history={historyFixture([])}
        collapsed={false}
        onToggle={() => {}}
        onOpenFile={() => {}}
      />,
    )
    expect(barra(markup)).toBeNull()
  })
})
