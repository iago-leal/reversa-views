/**
 * The Discovery card over the fields of feature 015: the cycle, the approved
 * stages, the stage under way and the closure nobody declared. Everything is
 * TEXT, because a state that reads only as a colour does not read at all for
 * part of the audience.
 * @module tests/webview-discovery-section-fases
 */

import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { DiscoveryStateAxis } from '../src/domain/types.ts'
import type { ReversaProcess } from '../src/heranca/reversa-domain/src/index.ts'
import { DiscoverySection } from '../src/webview/ui/DiscoverySection.tsx'
import { lerParaDesenhar } from './helpers/fases-carga.ts'
import { amostra, estado, mapaComEtapas } from './helpers/fases-leitura.ts'

const QUATRO_ETAPAS = mapaComEtapas('reconciliacao', 'verificacao-regressao', 'saneamento', 'auditoria-cruzada')
const CINCO = ['reconhecimento', 'escavacao', 'interpretacao', 'geracao', 'revisao']

function cartao(process: ReversaProcess, discoveryState?: DiscoveryStateAxis): string {
  return renderToStaticMarkup(
    <DiscoverySection process={process} discoveryState={discoveryState} collapsed={false} onToggle={() => {}} />,
  )
}

function texto(marcacao: string): string {
  return marcacao.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ')
}

/** O `data-status` de cada uma das cinco fases, na ordem desenhada. */
function situacoes(marcacao: string): string[] {
  return [...marcacao.matchAll(/<li data-phase="[^"]+" data-status="([^"]+)"/g)].map((m) => m[1] ?? '')
}

describe('havendo ciclo', () => {
  const { process, eixo } = lerParaDesenhar(amostra('ciclo-tres-com-etapas'), QUATRO_ETAPAS)
  const marcacao = cartao(process, eixo)

  it('uma frase em texto nomeia o ciclo corrente', () => {
    expect(marcacao).toContain('data-part="discovery-cycle"')
    expect(texto(marcacao)).toContain('Ciclo 3 de extração')
  })

  it('as cinco fases mostram a situação DO CICLO, e não a das canônicas já concluídas', () => {
    expect(situacoes(cartao(process))).toEqual(['done', 'done', 'done', 'done', 'done'])
    expect(situacoes(marcacao)).toEqual(['done', 'pending', 'pending', 'pending', 'pending'])
  })

  it('continuam sendo cinco, com o nome bruto ao lado de cada uma', () => {
    expect(situacoes(marcacao)).toHaveLength(5)
    expect(marcacao).toContain('<span data-part="phase-raw" class="muted">reconhecimento-c3</span>')
  })

  it('os ciclos anteriores não aparecem', () => {
    expect(texto(marcacao)).not.toContain('-c2')
  })

  it('a fase que não está em lista alguma sai pendente e sem nome bruto', () => {
    const leitura = lerParaDesenhar(estado('escavacao-c3', [...CINCO, 'reconhecimento-c3']))
    const desenhado = cartao(leitura.process, leitura.eixo)

    expect(situacoes(desenhado)).toEqual(['done', 'current', 'pending', 'pending', 'pending'])
    expect(desenhado.match(/data-part="phase-raw"/g)).toHaveLength(2)
  })
})

describe('as etapas aprovadas', () => {
  it('uma linha de texto sob as cinco fases as lista, com nome bruto, situação e menção ao mapa', () => {
    const { process, eixo } = lerParaDesenhar(amostra('ciclo-tres-com-etapas'), QUATRO_ETAPAS)
    const marcacao = cartao(process, eixo)
    const linha = texto(marcacao)

    expect(marcacao.indexOf('data-part="discovery-stages"')).toBeGreaterThan(marcacao.lastIndexOf('data-phase='))
    expect(linha).toContain('reconhecidas pelo mapa de equivalências')
    for (const nome of ['reconciliacao', 'verificacao-regressao', 'saneamento', 'auditoria-cruzada']) {
      expect(linha).toContain(`${nome} (concluída)`)
    }
    expect(linha).toContain('verificacao-regressao-c3 (pendente)')
  })

  it('a etapa em curso ganha frase própria, e nenhuma das cinco fases sai como atual', () => {
    const { process, eixo } = lerParaDesenhar(amostra('etapa-em-curso'), mapaComEtapas('re-extracao'))
    const marcacao = cartao(process, eixo)

    expect(marcacao).toContain('data-part="discovery-stage-current"')
    expect(texto(marcacao)).toContain('Etapa em curso: re-extracao-005, reconhecida pelo mapa de equivalências')
    expect(situacoes(marcacao)).not.toContain('current')
    expect(marcacao).not.toContain('data-part="discovery-cycle"')
  })

  it('sem etapa aprovada, nem linha nem frase', () => {
    const { process, eixo } = lerParaDesenhar(amostra('etapa-em-curso'))
    const marcacao = cartao(process, eixo)

    expect(marcacao).not.toContain('discovery-stages')
    expect(marcacao).not.toContain('discovery-stage-current')
  })
})

describe('o encerramento sem declaração', () => {
  it('tem frase própria, que nomeia o phase e NÃO diz que o processo declarou o fim', () => {
    const { process, eixo } = lerParaDesenhar(amostra('encerrada-sem-declaracao'))
    const marcacao = cartao(process, eixo)

    expect(marcacao).toContain('data-part="discovery-closed-undeclared"')
    expect(marcacao).not.toContain('data-part="discovery-closed"')
    expect(texto(marcacao)).toContain('Extração encerrada sem declaração')
    expect(texto(marcacao)).toContain('parou na fase revisao sem declarar o fim')
    expect(texto(marcacao)).not.toContain('declarou o fim na fase')
  })

  it('o encerramento declarado continua com a frase da 011, e só ela', () => {
    const { process, eixo } = lerParaDesenhar(amostra('med-reversa'))
    const marcacao = cartao(process, eixo)

    expect(marcacao).toContain('data-part="discovery-closed"')
    expect(marcacao).not.toContain('discovery-closed-undeclared')
  })
})

describe('o projeto sem ciclo e sem etapa aprovada', () => {
  it('desenha o cartão que desenhava: nenhuma das partes novas aparece', () => {
    const { process, eixo } = lerParaDesenhar(estado('geracao', ['reconhecimento', 'escavacao', 'interpretacao'], ['revisao']))
    const marcacao = cartao(process, eixo)

    for (const parte of ['discovery-cycle', 'phase-raw', 'discovery-stages', 'discovery-stage-current', 'discovery-closed-undeclared']) {
      expect(marcacao, parte).not.toContain(parte)
    }
    expect(situacoes(marcacao)).toEqual(['done', 'done', 'done', 'current', 'pending'])
  })

  it('sem o eixo, que é o host anterior à 011, idem', () => {
    const { process } = lerParaDesenhar(amostra('ciclo-tres-com-etapas'), QUATRO_ETAPAS)

    expect(cartao(process)).not.toContain('discovery-cycle')
  })
})
