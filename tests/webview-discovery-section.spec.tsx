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
import type { GreenfieldAxis } from '../src/domain/types.ts'
import { DiscoverySection } from '../src/webview/ui/DiscoverySection.tsx'
import {
  emptyProcessFixture,
  greenfieldFixture,
  legacyGreenfieldFixture,
  processFixture,
} from './helpers/reversa-fixtures.ts'

function render(elemento: ReactElement): string {
  return renderToStaticMarkup(elemento)
}

function cartao(process: ReversaProcess, greenfield?: GreenfieldAxis): string {
  return render(
    <DiscoverySection process={process} greenfield={greenfield} collapsed={false} onToggle={() => {}} />,
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
