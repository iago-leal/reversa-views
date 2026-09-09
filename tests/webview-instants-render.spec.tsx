/**
 * No instant in universal time reaches the eye (RF-15, RF-16, D-20).
 *
 * The other suites verify the conversion where it happens, one function at a
 * time. This one verifies the CONSEQUENCE, and it is the only form the
 * criterion of done accepts: the panel is drawn whole, the markup is stripped
 * down to what a person would read, and the text is swept for the universal
 * form. A single `2026-09-09T15:00:00Z` anywhere in it fails the suite.
 *
 * The stripping is what makes the sweep honest. RF-16 REQUIRES the raw instant
 * to survive in `data-instant`, so a sweep over the markup would fail on the
 * very attribute the panel is obliged to keep. What is swept is therefore the
 * text between the tags, which is what the attribute is not.
 *
 * The sweep is proved to work before it is trusted: a planted instant has to
 * be caught, or a green suite here would mean nothing.
 * @module tests/webview-instants-render
 */

import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { ActiveDecomposition, ProjectHistory } from '../src/domain/types.ts'
import { EMPTY_DECOMPOSITION, EMPTY_HISTORY } from '../src/domain/types.ts'
import type { SetProcessData } from '../src/host/protocol.ts'
import { withAll } from '../src/webview/domain/preferences.ts'
import { summaryText } from '../src/webview/domain/summary.ts'
import { App } from '../src/webview/ui/App.tsx'
import {
  decompositionFixture,
  historyFixture,
  payloadFixture,
  probeFixture,
  processFixture,
  requirementsMd,
} from './helpers/reversa-fixtures.ts'

/**
 * The shapes of universal time, each named by what a reader would see.
 *
 * A bare `2026-09-09` is deliberately NOT one of them: REVERSA names feature
 * folders by date when `setup.json` asks it to, and those names are drawn as
 * they are. What is forbidden is the INSTANT: a date joined to a time, a time
 * closed by the zero-offset marker, or the offset spelled out.
 */
const UNIVERSAL: readonly { readonly name: string; readonly pattern: RegExp }[] = [
  { name: 'data e hora coladas pelo T', pattern: /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/g },
  { name: 'hora fechada pelo Z', pattern: /\d{1,2}:\d{2}(?::\d{2})?(?:\.\d+)?Z/g },
  { name: 'deslocamento escrito', pattern: /\d{1,2}:\d{2}\s*(?:[+-]\d{2}:?\d{2}|UTC|GMT)/g },
]

/** The Brasília form, which is the only one a person may read (D-20). */
const READABLE = /\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}(?: \(Brasília\))?/g

/**
 * What a person would read, with every tag and therefore every attribute gone.
 * @param markup - the document as it was rendered.
 * @returns the text between the tags, entities resolved.
 */
function visible(markup: string): string {
  return markup
    .replace(/<[^>]*>/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
}

/**
 * Every universal instant a text carries.
 * @param text - what to sweep.
 * @returns one entry per hit, naming the shape and quoting it.
 */
function universalInstants(text: string): string[] {
  const found: string[] = []
  for (const { name, pattern } of UNIVERSAL) {
    for (const hit of text.matchAll(pattern)) found.push(`${name}: ${hit[0]}`)
  }
  return found
}

/** The whole panel, expanded, with the ports inert. */
function painel(loaded: SetProcessData | null): string {
  return renderToStaticMarkup(
    <App
      entry={{
        kind: 'installed',
        rereading: false,
        loaded,
        message: null,
        root: '/w/reversa-views',
      }}
      notice={null}
      // Expanded on purpose: a collapsed card still draws its body, and this
      // way the sweep covers the same document a person could open.
      preferences={withAll(false)}
      theme={{ mode: 'dark', highContrast: false }}
      onReload={() => {}}
      onOpenFile={() => {}}
      onLog={() => {}}
    />,
  )
}

/** A payload with a field the older host did not send (contract, section 6). */
function semCampo(field: 'decomposition' | 'history'): SetProcessData {
  const payload = payloadFixture()
  delete (payload as Record<string, unknown>)[field]
  return payload
}

/**
 * The states the panel can be drawn in, each one a document to sweep.
 *
 * The list is the point: an instant that only surfaces when the reading
 * degrades, or when a card is empty, is still an instant on the screen.
 */
const ESTADOS: readonly { readonly name: string; readonly payload: SetProcessData | null }[] = [
  { name: 'a leitura inteira', payload: payloadFixture() },
  {
    name: 'o processo bloqueado por requisitos',
    payload: payloadFixture({ process: processFixture({ requirementsMd: requirementsMd(1) }) }),
  },
  {
    name: 'a leitura degradada',
    payload: payloadFixture({
      probe: probeFixture({
        refusals: [{ path: '_reversa_sdd/x.md', reason: 'fora da raiz' }],
        truncated: ['_reversa_forward/003-painel-do-processo/actions.md'],
      }),
    }),
  },
  {
    name: 'os dois cartões vazios',
    payload: payloadFixture({
      decomposition: { ...EMPTY_DECOMPOSITION } as ActiveDecomposition,
      history: { ...EMPTY_HISTORY } as ProjectHistory,
    }),
  },
  {
    name: 'o histórico truncado pelo teto',
    payload: payloadFixture({ history: historyFixture(undefined, { truncado: true, total: 53 }) }),
  },
  { name: 'o host sem decomposição', payload: semCampo('decomposition') },
  { name: 'o host sem histórico', payload: semCampo('history') },
  {
    name: 'a decomposição por varredura',
    payload: payloadFixture({ decomposition: decompositionFixture(4, 4) }),
  },
  { name: 'nenhuma leitura ainda', payload: null },
]

describe('a varredura, antes de ser usada', () => {
  it('acha o instante universal que alguém plantou', () => {
    expect(universalInstants('lido em 2026-09-09T15:00:00Z')).not.toEqual([])
    expect(universalInstants('concluído às 14:06:13Z')).not.toEqual([])
    expect(universalInstants('às 14:06 UTC')).not.toEqual([])
    expect(universalInstants('às 14:06 -03:00')).not.toEqual([])
  })

  it('não confunde nome de pasta datada com instante', () => {
    expect(universalInstants('_reversa_forward/2026-09-09-painel')).toEqual([])
  })

  it('deixa passar a forma de Brasília, que é a permitida', () => {
    expect(universalInstants('09/09/2026 12:00 (Brasília)')).toEqual([])
  })

  it('tira do documento o atributo junto com a etiqueta', () => {
    expect(visible('<p data-instant="2026-09-09T15:00:00Z">09/09/2026 12:00</p>')).not.toContain('Z')
  })
})

describe('o documento renderizado, em todo estado', () => {
  for (const { name, payload } of ESTADOS) {
    it(`não mostra instante em tempo universal com ${name}`, () => {
      const achados = universalInstants(visible(painel(payload)))
      expect(achados, `instantes crus na tela: ${achados.join(' | ')}`).toEqual([])
    })
  }

  it('escreve todo instante visível na forma de Brasília', () => {
    const texto = visible(painel(payloadFixture()))
    const lidos = [...texto.matchAll(READABLE)]
    expect(lidos.length).toBeGreaterThan(0)
    for (const lido of lidos) {
      expect(lido[0], `instante sem a zona declarada: ${lido[0]}`).toContain('(Brasília)')
    }
  })

  it('guarda o instante cru no atributo, que é o que RF-16 pede', () => {
    const markup = painel(payloadFixture())
    expect(markup).toContain('data-instant="2026-09-09T15:00:00Z"')
    expect(universalInstants(visible(markup))).toEqual([])
  })

  it('não mostra a data sozinha no lugar do instante', () => {
    const texto = visible(painel(payloadFixture()))
    expect(texto).not.toMatch(/\d{4}-\d{2}-\d{2}\b(?!-)/)
  })
})

describe('o texto que sai do painel', () => {
  it('leva o instante convertido, e não o cru', () => {
    for (const { name, payload } of ESTADOS) {
      if (payload === null) continue
      const achados = universalInstants(summaryText(payload))
      expect(achados, `instantes crus no resumo de ${name}: ${achados.join(' | ')}`).toEqual([])
    }
  })
})
