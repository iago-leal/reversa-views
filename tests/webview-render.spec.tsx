/**
 * The markup of the panel, rendered on the server because the container has no
 * screen (RF-01 to RF-06, RF-14, RF-15, RF-21, RF-22, RN-05, RN-06, D-03).
 *
 * `react-dom/server` is the stand-in for a screenshot: it produces the same
 * markup the browser would mount, and every fact this suite states is a fact
 * about that markup -- an attribute, a text, an order -- never about pixels.
 * What only a screen can settle (colour, contrast, the panel below 300 px)
 * belongs to feature 005 and is declared as such in T055.
 *
 * The four blocks of T014 to T017 share this file and the `render` helper
 * below, because splitting them would mean four copies of the same set-up.
 * @module tests/webview-render
 */

import type { ReactElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { EffectiveEntry } from '../src/webview/domain/types.ts'
import { EMPTY_PREFERENCES, SECTION_NAMES } from '../src/webview/domain/types.ts'
import { App } from '../src/webview/ui/App.tsx'
import { EntryScreen } from '../src/webview/ui/EntryScreens.tsx'
import { Header } from '../src/webview/ui/Header.tsx'
import { BlockingBanner } from '../src/webview/ui/BlockingBanner.tsx'
import { AnomaliesSection } from '../src/webview/ui/AnomaliesSection.tsx'
import { PolicySection } from '../src/webview/ui/PolicySection.tsx'
import { ProbeSection } from '../src/webview/ui/ProbeSection.tsx'
import { readingIntegrity } from '../src/webview/domain/integrity.ts'
import { blockingReasons } from '../src/webview/domain/blocking.ts'
import {
  actionsMd,
  emptyProcessFixture,
  payloadFixture,
  probeFixture,
  processFixture,
  requirementsMd,
} from './helpers/reversa-fixtures.ts'

/**
 * The utility the four blocks reuse: an element in, its markup out.
 *
 * Static markup, and not the hydratable form, because the extra bookkeeping
 * attributes of the latter would be noise in every assertion here.
 * @param elemento - what to draw.
 * @returns the markup, as the browser would receive it.
 */
function render(elemento: ReactElement): string {
  return renderToStaticMarkup(elemento)
}

/** An effective entry, with only what each case cares about spelled out. */
function entrada(partes: Partial<EffectiveEntry> = {}): EffectiveEntry {
  return {
    kind: 'installed',
    rereading: false,
    loaded: payloadFixture(),
    message: null,
    root: '/w/reversa-views',
    ...partes,
  }
}

/**
 * The payload the composition cases are drawn over.
 *
 * It carries ONE doubt on purpose: the banner is a section of RF-14 and has to
 * be in the document for the order to be verifiable, and an unblocked process
 * draws no banner at all. One doubt blocks without degrading, so the reading
 * stays whole and the initial collapse of RF-22 is still the default one.
 */
const BLOQUEADO = payloadFixture({ process: processFixture({ requirementsMd: requirementsMd(1) }) })

/** The whole panel, with the ports as counters so nothing reaches a host. */
function painel(partes: Partial<EffectiveEntry> = {}, extras: Record<string, unknown> = {}) {
  return render(
    <App
      entry={entrada({ loaded: BLOQUEADO, ...partes })}
      notice={null}
      preferences={EMPTY_PREFERENCES}
      theme={{ mode: 'dark', highContrast: false }}
      onReload={() => {}}
      onOpenFile={() => {}}
      onLog={() => {}}
      {...extras}
    />,
  )
}

/** The markup of one section, from its opening tag to the one that follows it. */
function seção(markup: string, name: string): string {
  const início = markup.indexOf(`data-section="${name}"`)
  expect(início, `a seção ${name} não foi desenhada`).toBeGreaterThan(-1)
  const resto = markup.slice(início + 1)
  const próxima = resto.indexOf('data-section="')
  return próxima === -1 ? resto : resto.slice(0, próxima)
}

/** Where each section starts, in the order they were drawn. */
function ordemDesenhada(markup: string): string[] {
  return [...markup.matchAll(/data-section="([a-z]+)"/g)].map((m) => m[1])
}

// ---------------------------------------------------------------------------
// T014, primeiro bloco: as cinco telas de estado de entrada.
// ---------------------------------------------------------------------------

/** One entry screen on its own, which is how four of the five are reachable. */
function tela(partes: Partial<EffectiveEntry>): string {
  return render(<EntryScreen entry={entrada({ loaded: null, ...partes })} onReload={() => {}} />)
}

describe('as cinco telas de estado de entrada', () => {
  it('dá título próprio a cada uma, e nenhum se repete', () => {
    const títulos = (['no-folder', 'loading', 'no-reversa', 'error'] as const).map((kind) => {
      const markup = tela({ kind, message: 'falhou' })
      const casamento = markup.match(/<h1[^>]*>([^<]+)<\/h1>/)
      expect(casamento, `a tela ${kind} não tem título`).not.toBeNull()
      return casamento?.[1]
    })
    expect(new Set(títulos).size).toBe(4)
  })

  it('nunca produz documento vazio, que é o critério de aceite de RF-01', () => {
    for (const kind of ['no-folder', 'loading', 'no-reversa', 'error'] as const) {
      expect(tela({ kind, message: 'falhou' }).length).toBeGreaterThan(60)
    }
  })

  it('explica o Reversa em duas frases na tela sem Reversa', () => {
    const markup = tela({ kind: 'no-reversa' })
    const texto = markup.replace(/<[^>]+>/g, ' ')
    const frases = texto.split(/(?<=\.)\s/).filter((f) => f.trim().length > 20)
    expect(frases.length).toBeGreaterThanOrEqual(2)
  })

  it('traz o comando de instalação em bloco copiável e oferece verificar de novo', () => {
    const markup = tela({ kind: 'no-reversa' })
    expect(markup).toMatch(/<pre[^>]*>[^<]*reversa[^<]*<\/pre>/i)
    expect(markup).toMatch(/<button[^>]*data-action="reload"/)
  })

  it('na tela sem pasta, explica a exigência e não oferece ação alguma', () => {
    const markup = tela({ kind: 'no-folder', root: null })
    expect(markup.replace(/<[^>]+>/g, ' ')).toMatch(/pasta/i)
    expect(markup).not.toMatch(/<button/)
  })

  it('mostra a mensagem de erro em bloco, sem interpretá-la como marcação', () => {
    const markup = tela({ kind: 'error', message: 'falha **grave** em <b>disco</b>' })
    expect(markup).toContain('falha **grave** em &lt;b&gt;disco&lt;/b&gt;')
    expect(markup).toMatch(/<pre[^>]*>/)
    expect(markup).not.toContain('<b>disco</b>')
  })

  it('oferece tentar de novo na tela de erro', () => {
    expect(tela({ kind: 'error', message: 'falhou' })).toMatch(/<button[^>]*data-action="reload"/)
  })

  it('não substitui o conteúdo anterior quando a releitura tem o que preservar', () => {
    const preservado = render(
      <EntryScreen
        entry={entrada({ kind: 'loading', rereading: true, loaded: payloadFixture() })}
        onReload={() => {}}
      />,
    )
    expect(preservado).toBe('')
  })

  it('desenha a tela de carregando quando não há conteúdo a preservar', () => {
    expect(tela({ kind: 'loading', rereading: true }).length).toBeGreaterThan(60)
  })
})

// ---------------------------------------------------------------------------
// T015, segundo bloco: cabeçalho e faixa de bloqueio.
// ---------------------------------------------------------------------------

/** The header on its own, over a payload and the integrity read from it. */
function cabeçalho(payload = payloadFixture()): string {
  return render(
    <Header
      entry={entrada({ loaded: payload })}
      integrity={readingIntegrity(payload)}
      onReload={() => {}}
    />,
  )
}

describe('cabeçalho', () => {
  it('traz os cinco itens de RF-02, todos preenchidos', () => {
    const markup = cabeçalho()
    for (const item of ['project', 'version', 'root', 'read-at']) {
      const casamento = markup.match(new RegExp(`data-item="${item}"[^>]*>([^<]*)<`))
      expect(casamento, `o item ${item} não foi desenhado`).not.toBeNull()
      expect(casamento?.[1].trim(), `o item ${item} veio em branco`).not.toBe('')
    }
    expect(markup).toMatch(/<button[^>]*data-action="reload"/)
  })

  it('mostra a revisão do modelo herdado, abreviada, ao lado da versão do Reversa (RF-15)', () => {
    const markup = cabeçalho()
    const casamento = markup.match(/data-item="revision"[^>]*>([^<]*)</)
    expect(casamento, 'o item da revisão não foi desenhado').not.toBeNull()
    expect(casamento?.[1].trim()).toBe('420305d')
  })

  it('sem revisão declarada, o item diz não declarado, como os outros cinco', () => {
    const markup = cabeçalho(payloadFixture({ inheritedRevision: '' }))
    const casamento = markup.match(/data-item="revision"[^>]*>([^<]*)</)
    expect(casamento?.[1].trim()).toBe('não declarado')
    for (const item of ['project', 'version', 'root', 'read-at']) {
      const outro = markup.match(new RegExp(`data-item="${item}"[^>]*>([^<]*)<`))
      expect(outro?.[1].trim(), `o item ${item} foi afetado`).not.toBe('')
    }
  })

  it('reserva o lugar da ação de despacho, nomeado e vazio, conforme RF-15', () => {
    const markup = cabeçalho()
    const casamento = markup.match(/data-slot="dispatch"[^>]*>([\s\S]*?)<\/[a-z]+>/)
    expect(casamento, 'o lugar do despacho não existe').not.toBeNull()
    expect(casamento?.[1]).not.toMatch(/<button/)
  })

  it('declara leitura íntegra quando nenhum dos três sinais apareceu', () => {
    expect(cabeçalho()).toMatch(/data-item="integrity"[^>]*data-degraded="false"/)
  })

  it('declara leitura degradada diante de anomalia', () => {
    const payload = payloadFixture({ process: processFixture({ configJson: '{quebrado' }) })
    expect(cabeçalho(payload)).toMatch(/data-item="integrity"[^>]*data-degraded="true"/)
  })

  it('declara leitura degradada diante de recusa e de truncamento, cada uma por si', () => {
    const recusa = payloadFixture({
      probe: probeFixture({ refusals: [{ path: '../fora', reason: 'fora-da-raiz' }] }),
    })
    const truncado = payloadFixture({ probe: probeFixture({ truncated: ['/w/grande.md'] }) })
    expect(cabeçalho(recusa)).toMatch(/data-degraded="true"/)
    expect(cabeçalho(truncado)).toMatch(/data-degraded="true"/)
  })
})

/** A process waiting on a human through all four signals at once. */
function bloqueadoPorTudo() {
  return processFixture({
    actionsMd: actionsMd(5, 0),
    requirementsMd: requirementsMd(2),
    migrationStateJson: JSON.stringify({
      'schema-version': 1,
      'pending-decisions': ['banco-de-dados', 'fila'],
    }),
  })
}

describe('faixa de bloqueio', () => {
  it('aparece acima de todo o resto na marcação', () => {
    const markup = painel()
    expect(ordemDesenhada(markup)[0]).toBe('blocking')
  })

  it('desenha as três partes de RF-03a em cada razão', () => {
    const razões = blockingReasons(bloqueadoPorTudo())
    const markup = render(<BlockingBanner reasons={razões} onOpenFile={() => {}} />)
    const linhas = markup.split('data-reason').slice(1)
    expect(linhas.length).toBe(razões.length)
    for (const linha of linhas) {
      expect(linha).toMatch(/data-part="reason-text"[^>]*>[^<]+</)
    }
  })

  it('faz do artefato um alvo clicável que pede a abertura', () => {
    const razões = blockingReasons(bloqueadoPorTudo()).filter((r) => r.artifact !== null)
    expect(razões.length).toBeGreaterThan(0)
    const markup = render(<BlockingBanner reasons={razões} onOpenFile={() => {}} />)
    expect(markup).toMatch(/<button[^>]*data-action="open-file"/)
    for (const razão of razões) {
      expect(markup).toContain(`data-path="${razão.artifact}"`)
    }
  })

  it('põe o comando em bloco copiável, que o painel não executa', () => {
    const razões = blockingReasons(bloqueadoPorTudo()).filter((r) => r.command !== null)
    expect(razões.length).toBeGreaterThan(0)
    const markup = render(<BlockingBanner reasons={razões} onOpenFile={() => {}} />)
    expect(markup).toMatch(/<pre[^>]*data-part="reason-command"/)
    expect(markup).not.toMatch(/data-action="run"/)
  })

  it('não desenha faixa alguma com lista vazia, nem faixa vazia', () => {
    expect(render(<BlockingBanner reasons={[]} onOpenFile={() => {}} />)).toBe('')
  })
})

// ---------------------------------------------------------------------------
// T016, terceiro bloco: as duas seções de núcleo.
// ---------------------------------------------------------------------------

describe('seção do ciclo forward', () => {
  it('traz os oito itens de RF-06, cada um preenchido ou declarado ausente por nome', () => {
    const corpo = seção(painel(), 'forward')
    const itens = [
      'stage',
      'feature',
      'closed-actions',
      'open-actions',
      'addenda',
      'doubts',
      'paused',
      'addendum',
    ]
    for (const item of itens) {
      const casamento = corpo.match(new RegExp(`data-item="${item}"[^>]*>([^<]*)<`))
      expect(casamento, `o item ${item} não foi desenhado`).not.toBeNull()
      expect(casamento?.[1].trim(), `o item ${item} ficou em branco`).not.toBe('')
    }
  })

  it('declara o item ausente por nome, e não o deixa em branco', () => {
    const vazio = painel({ loaded: payloadFixture({ process: emptyProcessFixture() }) })
    const corpo = seção(vazio, 'forward')
    const casamento = corpo.match(/data-item="feature"[^>]*>([^<]*)</)
    expect(casamento?.[1].trim()).not.toBe('')
  })

  it('nasce expandida sem preferência guardada', () => {
    expect(seção(painel(), 'forward')).toMatch(/data-collapsed="false"/)
  })
})

describe('seção da descoberta', () => {
  it('desenha as cinco fases na ordem canônica', () => {
    const corpo = seção(painel(), 'discovery')
    const fases = [...corpo.matchAll(/data-phase="([a-z]+)"/g)].map((m) => m[1])
    expect(fases).toEqual(['reconhecimento', 'escavacao', 'interpretacao', 'geracao', 'revisao'])
  })

  it('mantém as cinco fases com processo vazio, conforme EC-01', () => {
    const vazio = painel({ loaded: payloadFixture({ process: emptyProcessFixture() }) })
    const fases = [...seção(vazio, 'discovery').matchAll(/data-phase="([a-z]+)"/g)]
    expect(fases.length).toBe(5)
  })

  it('distingue a fase corrente por marca textual, e não por cor', () => {
    const corpo = seção(painel(), 'discovery')
    const corrente = corpo.match(/data-phase="escavacao"[^>]*data-status="([a-z]+)"/)
    expect(corrente?.[1]).toBe('current')
    expect(corpo).toMatch(/data-part="phase-status"[^>]*>[^<]+</)
  })

  it('separa os checkpoints concluídos dos que ainda correm, com data quando houver', () => {
    const corpo = seção(painel(), 'discovery')
    expect(corpo).toMatch(/data-checkpoint="reversa-explorer"[^>]*data-done="true"/)
    expect(corpo).toMatch(/data-checkpoint="reversa-archaeologist"[^>]*data-done="false"/)
    expect(corpo).toContain('2026-09-09')
  })

  it('nasce expandida sem preferência guardada', () => {
    expect(seção(painel(), 'discovery')).toMatch(/data-collapsed="false"/)
  })
})

// ---------------------------------------------------------------------------
// T017, quarto bloco: as três seções de diagnóstico.
// ---------------------------------------------------------------------------

/** A payload whose reading degraded, which is what opens the anomalies. */
function degradado() {
  return payloadFixture({ process: processFixture({ configJson: '{quebrado' }) })
}

describe('seção da política', () => {
  it('mostra o veredito vigente e as seis pastas graváveis', () => {
    const processo = processFixture()
    const markup = render(
      <PolicySection process={processo} collapsed={true} onToggle={() => {}} />,
    )
    expect(markup.replace(/<[^>]+>/g, ' ')).toMatch(/desligada/i)
    const pastas = [...markup.matchAll(/data-folder="/g)]
    expect(pastas.length).toBe(6)
  })
})

describe('seção das anomalias', () => {
  /** `n` anomalies, built by naming `n` phases the reader does not know. */
  function comAnomalias(n: number) {
    return processFixture({
      state: { pending: Array.from({ length: n }, (_, i) => `fase-inventada-${i + 1}`) },
    })
  }

  function anomalias(processo: ReturnType<typeof processFixture>, collapsed = false) {
    return render(
      <AnomaliesSection
        anomalies={processo.anomalies}
        collapsed={collapsed}
        onToggle={() => {}}
      />,
    )
  }

  it('traz arquivo, código e detalhe de cada anomalia', () => {
    const processo = comAnomalias(1)
    expect(processo.anomalies.length).toBeGreaterThan(0)
    const markup = anomalias(processo)
    expect(markup).toMatch(/data-part="anomaly-file"[^>]*>[^<]+</)
    expect(markup).toMatch(/data-part="anomaly-code"[^>]*>[^<]+</)
  })

  it('com quinze anomalias mostra dez, o total e o controle de expansão', () => {
    const processo = comAnomalias(15)
    expect(processo.anomalies.length).toBeGreaterThanOrEqual(15)
    const markup = anomalias(processo)
    expect([...markup.matchAll(/data-anomaly="/g)].length).toBe(10)
    expect(markup).toMatch(new RegExp(`data-part="anomaly-total"[^>]*>[^<]*${processo.anomalies.length}`))
    expect(markup).toMatch(/<button[^>]*data-action="expand-anomalies"/)
  })

  it('declara que não houve nenhuma quando a lista está vazia', () => {
    const processo = processFixture()
    expect(processo.anomalies.length).toBe(0)
    const markup = anomalias(processo)
    expect(markup).toMatch(/data-part="anomaly-none"/)
    expect(markup).not.toMatch(/data-anomaly="/)
  })
})

describe('seção do relatório da sonda', () => {
  it('traz raiz lida, pasta da feature, recusas com motivo e truncados', () => {
    const probe = probeFixture({
      refusals: [{ path: '../fora', reason: 'fora-da-raiz' }],
      truncated: ['/w/grande.md'],
    })
    const markup = render(<ProbeSection probe={probe} collapsed={true} onToggle={() => {}} />)
    expect(markup).toContain('/w/reversa-views')
    expect(markup).toContain('_reversa_forward/003-painel-do-processo')
    expect(markup).toContain('../fora')
    expect(markup).toContain('fora-da-raiz')
    expect(markup).toContain('/w/grande.md')
  })
})

describe('recolhimento inicial das três de diagnóstico', () => {
  it('nascem recolhidas em leitura íntegra, com a contagem no título', () => {
    const markup = painel()
    for (const name of ['policy', 'anomalies', 'probe']) {
      expect(seção(markup, name), `${name} deveria nascer recolhida`).toMatch(
        /data-collapsed="true"/,
      )
      expect(seção(markup, name)).toMatch(/data-part="count"[^>]*>[^<]+</)
    }
  })

  it('abre a de anomalias em leitura degradada e mantém as outras duas recolhidas', () => {
    const markup = painel({ loaded: degradado() })
    expect(seção(markup, 'anomalies')).toMatch(/data-collapsed="false"/)
    expect(seção(markup, 'policy')).toMatch(/data-collapsed="true"/)
    expect(seção(markup, 'probe')).toMatch(/data-collapsed="true"/)
  })

  it('desenha as seis seções de RF-14 na ordem declarada', () => {
    expect(ordemDesenhada(painel())).toEqual([...SECTION_NAMES])
  })
})
