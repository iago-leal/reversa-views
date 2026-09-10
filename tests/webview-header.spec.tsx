/**
 * Suíte do cabeçalho diante dos sete desfechos da consulta (T019).
 *
 * Duas coisas se verificam aqui, e a segunda é a que importa mais.
 *
 * A primeira é RF-10: cada desfecho produz um texto DISTINTO, com atributo
 * consultável que o nomeia, e nenhum deles produz linha vazia. Item em branco
 * ao lado de rótulo é o painel dizendo duas coisas ao mesmo tempo, "não há
 * nada" e "não li isto", e o cabeçalho existe para não fazer isso.
 *
 * A segunda é RF-14, e é uma distinção que se perde com facilidade: conferência
 * DESLIGADA não é o mesmo que estar EM DIA. Quem desligou a chave não recebeu
 * garantia alguma sobre a versão instalada, e um cabeçalho que dissesse "em
 * dia" com a consulta desligada estaria afirmando o que não sabe.
 *
 * A procedência de RF-17 entra junto: versão e commit de construção aparecem ao
 * lado dos itens que já existem, o commit em forma curta e com o valor integral
 * num atributo, porque encurtar na origem destruiria o valor consultável.
 * @module tests/webview-header
 */

import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { UPDATE_CAUSES, UPDATE_STATES } from '../src/host/protocol.ts'
import type { UpdateCause, UpdateStatus } from '../src/host/protocol.ts'
import { readingIntegrity } from '../src/webview/domain/integrity.ts'
import { updateLabel } from '../src/webview/domain/labels.ts'
import { COLLAPSIBLE_SECTIONS } from '../src/webview/domain/types.ts'
import type { EffectiveEntry } from '../src/webview/domain/types.ts'
import { Header } from '../src/webview/ui/Header.tsx'
import { payloadFixture } from './helpers/reversa-fixtures.ts'

/** Um desfecho de cada variante, com os campos que ela carrega. */
const DESFECHOS: Record<string, UpdateStatus> = {
  desligada: { estado: 'desligada' },
  consultando: { estado: 'consultando' },
  'em-dia': { estado: 'em-dia' },
  atrasada: { estado: 'atrasada', commits: 4 },
  divergente: { estado: 'divergente', commits: 3 },
  'commit-desconhecido': { estado: 'commit-desconhecido' },
  impossivel: { estado: 'impossivel', causa: 'sem-rede' },
}

/** O estado da tela com uma leitura por trás. */
function entrada(payload = payloadFixture()): EffectiveEntry {
  return {
    kind: 'installed',
    rereading: false,
    loaded: payload,
    message: null,
    root: payload.root,
    update: null,
  }
}

/** O cabeçalho desenhado, sobre um desfecho e uma leitura. */
function cabeçalho(update: UpdateStatus, payload = payloadFixture()): string {
  return renderToStaticMarkup(
    <Header
      entry={entrada(payload)}
      integrity={readingIntegrity(payload)}
      update={update}
      onReload={() => {}}
      collapsedCount={4}
      collapsibleCount={COLLAPSIBLE_SECTIONS.length}
      onExpandAll={() => {}}
      onCollapseAll={() => {}}
      onSummary={() => {}}
      onCopy={() => {}}
    />,
  )
}

/** O trecho da linha do desfecho, com o texto que ela desenha. */
function linhaDoDesfecho(markup: string): { atributo: string | null; texto: string } | null {
  const casou = /<p([^>]*data-item="update"[^>]*)>(.*?)<\/p>/s.exec(markup)
  if (casou === null) return null
  const estado = /data-update="([^"]*)"/.exec(casou[1])
  const texto = casou[2].replace(/<[^>]*>/g, '').trim()
  return { atributo: estado === null ? null : estado[1], texto }
}

describe('a tradução de cada desfecho, que é decisão e não desenho', () => {
  it('os sete produzem texto, e nenhum produz texto vazio', () => {
    for (const estado of UPDATE_STATES) {
      const rótulo = updateLabel(DESFECHOS[estado])
      expect(rótulo.text.trim(), `${estado} não tem texto`).not.toBe('')
      expect(rótulo.text.length, `${estado} tem texto curto demais para informar`).toBeGreaterThan(5)
    }
  })

  it('os sete textos são distintos entre si (RF-10)', () => {
    const textos = UPDATE_STATES.map((estado) => updateLabel(DESFECHOS[estado]).text)
    expect(new Set(textos).size).toBe(UPDATE_STATES.length)
  })

  it('desligada NÃO diz nem sugere que está em dia (RF-14)', () => {
    const desligada = updateLabel(DESFECHOS.desligada).text
    const emDia = updateLabel(DESFECHOS['em-dia']).text

    expect(desligada).not.toBe(emDia)
    expect(desligada.toLowerCase()).toContain('desligada')
    expect(desligada.toLowerCase()).not.toContain('em dia')
    expect(desligada.toLowerCase()).not.toContain('atualizada')
  })

  it('atrasada diz quantos commits, e nomeia o comando que os aplica', () => {
    const rótulo = updateLabel(DESFECHOS.atrasada)
    expect(rótulo.text).toContain('4')
    expect(rótulo.command).toBe('npm run atualizar')
  })

  it('a contagem de um commit não sai no plural', () => {
    const um = updateLabel({ estado: 'atrasada', commits: 1 }).text
    expect(um).toContain('1 commit ')
    expect(um).not.toContain('commits')
  })

  it('divergente diz que há novidade E que o clone tem commits próprios', () => {
    const texto = updateLabel(DESFECHOS.divergente).text.toLowerCase()
    expect(texto).toContain('3')
    expect(texto).toMatch(/próprio|local/)
  })

  it('divergente e atrasada são dois fatos, e não o mesmo texto com número', () => {
    // O par existe separado de propósito: aplicar a atualização sobre commits
    // locais é o que o atualizador recusa em RF-05.
    expect(updateLabel({ estado: 'divergente', commits: 4 }).text).not.toBe(
      updateLabel({ estado: 'atrasada', commits: 4 }).text,
    )
  })

  it('commit desconhecido diz que a origem não conhece esta construção', () => {
    const texto = updateLabel(DESFECHOS['commit-desconhecido']).text.toLowerCase()
    expect(texto).toMatch(/não conhece|desconhec/)
  })

  it('consulta impossível nomeia a causa, e as quatro causas dão quatro textos', () => {
    const textos = UPDATE_CAUSES.map(
      (causa: UpdateCause) => updateLabel({ estado: 'impossivel', causa }).text,
    )
    expect(new Set(textos).size).toBe(UPDATE_CAUSES.length)
    for (const texto of textos) expect(texto.trim()).not.toBe('')
  })

  it('limite de taxa se distingue de ausência de rede (RF-16)', () => {
    const limite = updateLabel({ estado: 'impossivel', causa: 'limite-de-taxa' }).text
    const semRede = updateLabel({ estado: 'impossivel', causa: 'sem-rede' }).text
    expect(limite).not.toBe(semRede)
    expect(limite.toLowerCase()).toMatch(/limite|cota/)
  })

  it('causa desconhecida não produz linha vazia nem lança (RN-05)', () => {
    const rótulo = updateLabel({ estado: 'impossivel', causa: 'inventada' } as UpdateStatus)
    expect(rótulo.text.trim()).not.toBe('')
  })

  it('estado desconhecido não produz linha vazia nem lança (RN-05)', () => {
    const rótulo = updateLabel({ estado: 'não-existe' } as unknown as UpdateStatus)
    expect(rótulo.text.trim()).not.toBe('')
  })

  it('só atrasada e divergente oferecem comando: os demais não têm o que aplicar', () => {
    for (const estado of UPDATE_STATES) {
      const comando = updateLabel(DESFECHOS[estado]).command
      const esperado = estado === 'atrasada' || estado === 'divergente'
      expect(comando !== null, `${estado} ofereceu comando: ${String(comando)}`).toBe(esperado)
    }
  })
})

describe('a linha do desfecho no cabeçalho (RF-10)', () => {
  it('os sete desenham a linha, com o estado no atributo consultável', () => {
    for (const estado of UPDATE_STATES) {
      const linha = linhaDoDesfecho(cabeçalho(DESFECHOS[estado]))
      expect(linha, `${estado} não desenhou linha`).not.toBeNull()
      expect(linha?.atributo, `${estado} sem atributo`).toBe(estado)
      expect(linha?.texto, `${estado} desenhou linha vazia`).not.toBe('')
    }
  })

  it('nenhum dos sete desenha o mesmo texto que outro', () => {
    const textos = UPDATE_STATES.map((estado) => linhaDoDesfecho(cabeçalho(DESFECHOS[estado]))?.texto)
    expect(new Set(textos).size).toBe(UPDATE_STATES.length)
  })

  it('a linha desligada e a linha em dia são visivelmente diferentes na tela', () => {
    expect(linhaDoDesfecho(cabeçalho(DESFECHOS.desligada))?.texto).not.toBe(
      linhaDoDesfecho(cabeçalho(DESFECHOS['em-dia']))?.texto,
    )
  })

  it('o comando a copiar aparece quando há o que aplicar, e não aparece quando não há', () => {
    expect(cabeçalho(DESFECHOS.atrasada)).toContain('npm run atualizar')
    expect(cabeçalho(DESFECHOS['em-dia'])).not.toContain('npm run atualizar')
  })

  it('a linha do desfecho não interrompe: é texto do cabeçalho, e não diálogo', () => {
    // RN-09: o painel não interrompe o usuário. A novidade é uma linha, e não
    // uma notificação nem um botão que age.
    const markup = cabeçalho(DESFECHOS.atrasada)
    expect(markup).not.toMatch(/showInformationMessage|window\.alert|<dialog/)
  })
})

describe('a procedência desta construção (RF-17, D-18)', () => {
  const PAYLOAD = payloadFixture({
    extensionVersion: '0.6.1',
    builtFromCommit: 'a23711d481021a978720c0bc478b6dabed94fec3',
  })

  it('a versão instalada aparece como item próprio', () => {
    const markup = cabeçalho(DESFECHOS['em-dia'], PAYLOAD)
    expect(markup).toMatch(/data-item="extension-version"[^>]*>0\.6\.1</)
  })

  it('o commit aparece em forma curta, a mesma do modelo herdado', () => {
    const markup = cabeçalho(DESFECHOS['em-dia'], PAYLOAD)
    const casou = /data-item="built-from"[^>]*>([^<]*)</.exec(markup)
    expect(casou?.[1]).toBe('a23711d')
  })

  it('o valor integral do commit fica num atributo consultável', () => {
    const markup = cabeçalho(DESFECHOS['em-dia'], PAYLOAD)
    expect(markup).toContain('data-full="a23711d481021a978720c0bc478b6dabed94fec3"')
  })

  it('sem leitura por trás, os dois itens declaram ausência em vez de ficar em branco', () => {
    const semLeitura: EffectiveEntry = {
      kind: 'no-folder',
      rereading: false,
      loaded: null,
      message: null,
      root: null,
    }
    const markup = renderToStaticMarkup(
      <Header
        entry={semLeitura}
        integrity={{ degraded: false, anomalies: 0, refusals: 0, truncated: 0 }}
        update={DESFECHOS.desligada}
        onReload={() => {}}
        collapsedCount={0}
        collapsibleCount={COLLAPSIBLE_SECTIONS.length}
        onExpandAll={() => {}}
        onCollapseAll={() => {}}
        onSummary={() => {}}
        onCopy={() => {}}
      />,
    )
    expect(markup).toMatch(/data-item="extension-version"[^>]*>não declarado</)
    expect(markup).toMatch(/data-item="built-from"[^>]*>não declarado</)
  })

  it('os itens que já existiam continuam onde estavam', () => {
    const markup = cabeçalho(DESFECHOS['em-dia'], PAYLOAD)
    for (const item of ['project', 'version', 'revision', 'root', 'read-at']) {
      expect(markup, `sumiu o item ${item}`).toContain(`data-item="${item}"`)
    }
  })
})
