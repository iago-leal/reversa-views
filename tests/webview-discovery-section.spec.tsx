/**
 * A frase do cartão de descoberta em projeto greenfield sem extração (RF-21).
 *
 * As cinco fases seguem desenhadas como sempre, todas pendentes: o que muda é
 * UMA frase, que explica por que estão pendentes, e ela só aparece quando o
 * projeto nasceu por `/reversa-new` e nenhuma fase da descoberta terminou. Em
 * projeto legado, em projeto misto e com o eixo ausente o cartão é o de antes,
 * caractere por caractere.
 * @module tests/webview-discovery-section
 */

import type { ReactElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { ReversaProcess } from '../src/heranca/reversa-domain/src/index.ts'
import type { DiscoveryStateAxis, GreenfieldAxis } from '../src/domain/types.ts'
import { DiscoverySection } from '../src/webview/ui/DiscoverySection.tsx'
import {
  checkpointStateFixture,
  closedDiscoveryFixture,
  discoveryStateFixture,
  emptyProcessFixture,
  greenfieldFixture,
  legacyGreenfieldFixture,
  processFixture,
  undeclaredDiscoveryFixture,
} from './helpers/reversa-fixtures.ts'

function render(elemento: ReactElement): string {
  return renderToStaticMarkup(elemento)
}

function cartao(
  process: ReversaProcess,
  greenfield?: GreenfieldAxis,
  discoveryState?: DiscoveryStateAxis,
): string {
  return render(
    <DiscoverySection
      process={process}
      greenfield={greenfield}
      discoveryState={discoveryState}
      collapsed={false}
      onToggle={() => {}}
    />,
  )
}

function texto(marcacao: string): string {
  return marcacao.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ')
}

/** Um processo instalado em que nenhuma fase da descoberta terminou. */
const SEM_FASE = processFixture({
  state: { phase: null, completed: [], pending: ['reconhecimento', 'escavacao', 'interpretacao', 'geracao', 'revisao'], checkpoints: {} },
})

describe('a frase da descoberta pendente (RF-21)', () => {
  it('aparece em projeto greenfield sem fase concluída, nomeando o /reversa-new', () => {
    const marcacao = cartao(SEM_FASE, greenfieldFixture())
    expect(marcacao).toContain('data-part="discovery-greenfield"')
    expect(texto(marcacao)).toContain('/reversa-new')
    expect(texto(marcacao).toLowerCase()).toContain('extração')
  })

  it('as cinco fases seguem desenhadas, todas pendentes, ao lado da frase', () => {
    const marcacao = cartao(SEM_FASE, greenfieldFixture())
    expect([...marcacao.matchAll(/data-phase="/g)]).toHaveLength(5)
    expect(marcacao).not.toMatch(/data-status="(done|current)"/)
  })

  it('aparece também sobre o processo vazio, se o eixo diz greenfield', () => {
    expect(cartao(emptyProcessFixture(), greenfieldFixture())).toContain('data-part="discovery-greenfield"')
  })

  it('some assim que uma fase termina: a extração começou, e a frase mentiria', () => {
    expect(cartao(processFixture(), greenfieldFixture())).not.toContain('data-part="discovery-greenfield"')
  })

  it('não aparece em projeto legado nem em projeto misto', () => {
    expect(cartao(SEM_FASE, legacyGreenfieldFixture())).not.toContain('data-part="discovery-greenfield"')
    expect(cartao(SEM_FASE, greenfieldFixture({ cenario: 'misto' }))).not.toContain('data-part="discovery-greenfield"')
  })

  it('com o eixo ausente, o cartão é o de antes, caractere por caractere', () => {
    expect(cartao(SEM_FASE, undefined)).toBe(cartao(SEM_FASE))
    expect(cartao(SEM_FASE)).not.toContain('discovery-greenfield')
  })
})

/** Um processo cuja extração terminou, como dezessete dos sessenta e quatro medidos. */
const ENCERRADO = processFixture({
  state: {
    phase: 'concluido',
    completed: ['reconhecimento', 'escavacao', 'interpretacao', 'geracao', 'revisao'],
    pending: [],
  },
})

describe('a frase do encerramento (feature 011, RF-04)', () => {
  it('aparece quando a extração está encerrada, com o valor bruto ao lado', () => {
    const marcacao = cartao(ENCERRADO, undefined, closedDiscoveryFixture())

    expect(marcacao).toContain('data-part="discovery-closed"')
    expect(texto(marcacao)).toContain('concluido')
  })

  it('não aparece com a extração em curso', () => {
    expect(cartao(ENCERRADO, undefined, discoveryStateFixture())).not.toContain(
      'data-part="discovery-closed"',
    )
  })

  it('não aparece quando o eixo não vem, que é o host anterior', () => {
    expect(cartao(ENCERRADO)).not.toContain('data-part="discovery-closed"')
  })

  it('não inventa sexta fase: as cinco continuam desenhadas, e só elas', () => {
    const marcacao = cartao(ENCERRADO, undefined, closedDiscoveryFixture())
    const fases = marcacao.match(/data-phase="/g) ?? []

    expect(fases).toHaveLength(5)
  })

  it('não convive com a frase de projeto greenfield sem extração', () => {
    const marcacao = cartao(SEM_FASE, greenfieldFixture(), discoveryStateFixture())

    expect(marcacao).toContain('data-part="discovery-greenfield"')
    expect(marcacao).not.toContain('data-part="discovery-closed"')
  })
})

describe('o terceiro estado do checkpoint (feature 011, RF-05, RF-06)', () => {
  it('desenha os três estados em `data-situacao`', () => {
    const eixo = discoveryStateFixture({
      checkpoints: [
        checkpointStateFixture({ agent: 'scout' }),
        checkpointStateFixture({ agent: 'archaeologist', situacao: 'em-andamento', instante: null }),
        checkpointStateFixture({ agent: 'writer', situacao: 'conclusao-nao-declarada', instante: null }),
      ],
    })
    const marcacao = cartao(ENCERRADO, undefined, eixo)

    expect(marcacao).toContain('data-situacao="concluido"')
    expect(marcacao).toContain('data-situacao="em-andamento"')
    expect(marcacao).toContain('data-situacao="conclusao-nao-declarada"')
  })

  it('não mostra instante no checkpoint cuja conclusão não foi declarada', () => {
    const marcacao = cartao(ENCERRADO, undefined, undeclaredDiscoveryFixture(['writer']))

    expect(marcacao).not.toContain('data-part="checkpoint-instant"')
  })

  it('cai no desenho herdado quando o eixo não vem', () => {
    const marcacao = cartao(ENCERRADO)

    expect(marcacao).not.toContain('data-situacao=')
    expect(marcacao).toContain('data-checkpoint=')
  })

  it('nomeia os campos de lista sem chamá-los de saídas', () => {
    const eixo = discoveryStateFixture({
      checkpoints: [
        checkpointStateFixture({
          agent: 'writer',
          situacao: 'conclusao-nao-declarada',
          instante: null,
          camposComLista: ['arquivos_canonicos'],
        }),
      ],
    })
    const marcacao = cartao(ENCERRADO, undefined, eixo)

    expect(texto(marcacao)).toContain('arquivos_canonicos')
    expect(texto(marcacao).toLowerCase()).not.toContain('saídas em')
  })
})
