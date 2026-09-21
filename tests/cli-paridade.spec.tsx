/**
 * Suíte de paridade (T035, feature 014, RF-02).
 *
 * Duas superfícies sobre a MESMA carga têm de afirmar os mesmos fatos, na
 * mesma ordem de seções e com os mesmos rótulos. É a suíte que impede a
 * segunda superfície de virar uma segunda verdade, que é o risco de maior
 * impacto do produto inteiro.
 *
 * O painel é desenhado no servidor, como a suíte de marcação da feature 003 já
 * o desenha: o que se compara é marcação contra texto, atributo contra linha,
 * ordem contra ordem. Nunca pixel.
 *
 * A faixa de bloqueio é a exceção declarada: o painel a distingue por posição
 * e por forma, e o terminal, que só tem texto, precisa de um título para ela.
 * Os dez CARTÕES, esses, têm o mesmo título dos dois lados.
 */

import { readFileSync } from 'node:fs'
import type { ReactElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { estadoInicial } from '../src/cli/navegacao.ts'
import { CURSOR, linhasDoQuadro } from '../src/cli/quadro/index.ts'
import { TITULOS } from '../src/cli/quadro/secoes.ts'
import type { Observacao } from '../src/cli/tipos.ts'
import type { SetProcessData } from '../src/host/protocol.ts'
import { composeAnomalies } from '../src/webview/domain/anomalies-view.ts'
import { blockingReasons } from '../src/webview/domain/blocking.ts'
import { readingIntegrity } from '../src/webview/domain/integrity.ts'
import { stageLabel } from '../src/webview/domain/labels.ts'
import { collapsibleSections, sectionOrder } from '../src/webview/domain/sections.ts'
import type { EffectiveEntry } from '../src/webview/domain/types.ts'
import { EMPTY_PREFERENCES } from '../src/webview/domain/types.ts'
import { App } from '../src/webview/ui/App.tsx'
import { actionsMd, payloadFixture, processFixture } from './helpers/reversa-fixtures.ts'

const OBSERVANDO: Observacao = { ativa: true, razaoDaDegradacao: null, ultimaMudanca: null }

/** A mesma carga para os dois lados, e é esse "mesma" que a suíte mede. */
const CARGA: SetProcessData = payloadFixture()

/** Uma carga com bloqueio humano, que é onde a faixa tem o que dizer. */
const BLOQUEADA: SetProcessData = payloadFixture({
  process: processFixture({ actionsMd: actionsMd(5, 0), addendaFiles: [] }),
})

/** A entrada de uma leitura íntegra sobre uma carga. */
function entrada(carga: SetProcessData): EffectiveEntry {
  return {
    kind: 'installed',
    rereading: false,
    loaded: carga,
    message: null,
    root: carga.root,
    update: null,
  }
}

/** O painel, como o navegador o receberia. */
function painel(carga: SetProcessData): string {
  const elemento: ReactElement = (
    <App
      entry={entrada(carga)}
      update={null}
      notice={null}
      preferences={EMPTY_PREFERENCES}
      theme={{ mode: 'light', highContrast: false }}
      onReload={() => undefined}
      onOpenFile={() => undefined}
      onLog={() => undefined}
    />
  )
  return renderToStaticMarkup(elemento)
}

/** O terminal, com toda seção aberta, que é o que a passada imprime. */
function terminal(carga: SetProcessData): string[] {
  const contexto = {
    secoes: sectionOrder(),
    itens: new Map(sectionOrder().map((nome) => [nome, 0] as const)),
    alturaTotal: 0,
    alturaVisivel: 0,
  }
  return linhasDoQuadro({
    entrada: entrada(carga),
    estado: estadoInicial([], contexto),
    largura: 200,
    altura: Number.MAX_SAFE_INTEGER,
    observacao: OBSERVANDO,
    procedencia: 'primeira',
    conferenciaLigada: true,
    cursor: false,
  }).map((linha) => linha.texto)
}

/** Uma linha sem a marca do cursor nem o recuo. */
function limpa(texto: string): string {
  return (texto.startsWith(CURSOR) ? texto.slice(CURSOR.length) : texto).trim()
}

describe('a ordem das seções é a mesma dos dois lados (RN-04)', () => {
  it('o painel desenha as onze na ordem canônica', () => {
    const marcacao = painel(BLOQUEADA)
    const ordem = [...marcacao.matchAll(/data-section="([a-z]+)"/g)].map((achado) => achado[1])
    expect(ordem).toEqual([...sectionOrder()])
  })

  it('o terminal desenha as onze na mesma ordem', () => {
    const ordem = terminal(BLOQUEADA).flatMap((texto) =>
      sectionOrder().filter((nome) => limpa(texto).startsWith(TITULOS[nome])),
    )
    expect(ordem).toEqual([...sectionOrder()])
  })
})

describe('os rótulos dos dez cartões são os mesmos (RF-02)', () => {
  for (const nome of collapsibleSections()) {
    it(`\`${nome}\` tem o mesmo título dos dois lados`, () => {
      expect(painel(CARGA)).toContain(TITULOS[nome])
      expect(terminal(CARGA).some((texto) => limpa(texto).startsWith(TITULOS[nome]))).toBe(true)
    })
  }

  it('a faixa de bloqueio é a exceção, e o terminal lhe dá um título próprio', () => {
    expect(painel(BLOQUEADA)).not.toContain(TITULOS.blocking)
    expect(terminal(BLOQUEADA).some((texto) => limpa(texto).startsWith(TITULOS.blocking))).toBe(true)
  })
})

describe('os mesmos fatos sobre a mesma carga (RF-02)', () => {
  /** O texto inteiro de cada lado, para a comparação de fatos. */
  const doPainel = painel(BLOQUEADA)
  const doTerminal = terminal(BLOQUEADA).join('\n')

  it('o estágio do ciclo forward é o mesmo, pelo mesmo rótulo', () => {
    const rotulo = stageLabel(BLOQUEADA.process.forward.stage).text
    expect(doPainel).toContain(rotulo)
    expect(doTerminal).toContain(rotulo)
  })

  it('as contagens de ações são as mesmas', () => {
    const { actions } = BLOQUEADA.process.forward
    for (const numero of [actions.fechadas, actions.abertas, actions.total]) {
      expect(doTerminal).toContain(String(numero))
      expect(doPainel).toContain(String(numero))
    }
  })

  it('a declaração de integridade é a mesma frase', () => {
    const integridade = readingIntegrity(BLOQUEADA)
    const frase = integridade.degraded
      ? `Leitura degradada: ${integridade.anomalies} anomalias, ${integridade.refusals} recusas, ${integridade.truncated} truncamentos.`
      : 'Leitura íntegra.'
    expect(doPainel).toContain(frase)
    expect(doTerminal).toContain(frase)
  })

  it('cada razão de bloqueio aparece nos dois, com o mesmo texto e o mesmo comando', () => {
    const razoes = blockingReasons(BLOQUEADA.process, BLOQUEADA.bugs, BLOQUEADA.greenfield)
    expect(razoes.length).toBeGreaterThan(0)
    for (const razao of razoes) {
      expect(doPainel).toContain(razao.text)
      expect(doTerminal).toContain(razao.text)
      if (razao.artifact !== null) {
        expect(doPainel).toContain(razao.artifact)
        expect(doTerminal).toContain(razao.artifact)
      }
      if (razao.command !== null) {
        expect(doPainel).toContain(razao.command)
        expect(doTerminal).toContain(razao.command)
      }
    }
  })

  it('cada anomalia aparece nos dois, com arquivo e código', () => {
    const anomalias = composeAnomalies(BLOQUEADA)
    for (const anomalia of anomalias.slice(0, 10)) {
      expect(doPainel).toContain(anomalia.file)
      expect(doTerminal).toContain(anomalia.file)
      expect(doPainel).toContain(anomalia.code)
      expect(doTerminal).toContain(anomalia.code)
    }
  })

  it('cada entrega do histórico aparece nos dois, pela mesma pasta', () => {
    for (const entrega of BLOQUEADA.history.entradas) {
      expect(doPainel).toContain(entrega.pasta)
      expect(doTerminal).toContain(entrega.pasta)
    }
  })

  it('o veredito da política de escrita é a mesma frase', () => {
    const { policy } = BLOQUEADA.process
    const frase = policy.allowLegacyEdits
      ? policy.allowedPaths.length === 0
        ? 'A edição do legado está liberada sem restrição de caminho.'
        : `A edição do legado está liberada nos caminhos declarados: ${policy.allowedPaths.join(', ')}.`
      : 'A edição do legado está desligada. O Reversa escreve apenas nas pastas próprias.'
    expect(doPainel).toContain(frase)
    expect(doTerminal).toContain(frase)
  })

  it('a raiz lida pela sonda é a mesma', () => {
    expect(doPainel).toContain(BLOQUEADA.probe.workspace)
    expect(doTerminal).toContain(BLOQUEADA.probe.workspace)
  })
})

describe('o que nasce fechado nasce fechado dos dois lados (RN-02 do painel)', () => {
  it('a ferramenta parte do conjunto que `effectiveCollapsed` decide, e não de um seu', () => {
    const laco = readFileSync('src/cli/laco.ts', 'utf8')
    expect(laco).toContain('effectiveCollapsed')
  })

  it('nenhum módulo da ferramenta carrega uma lista própria de seções', () => {
    const nomeados = (texto: string): string[] =>
      sectionOrder().filter((nome) => texto.includes(`'${nome}'`) || texto.includes(`"${nome}"`))
    for (const caminho of ['src/cli/laco.ts', 'src/cli/navegacao.ts', 'src/cli/passada.ts']) {
      expect(nomeados(readFileSync(caminho, 'utf8')).length, `${caminho} decide seções`).toBe(0)
    }
  })

  it('o mapa de títulos cobre as onze, e só elas', () => {
    expect(Object.keys(TITULOS).sort()).toEqual([...sectionOrder()].sort())
  })
})
