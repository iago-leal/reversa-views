/**
 * Os rótulos do eixo greenfield (RF-20).
 *
 * Cinco vocabulários, todos totais: valor fora do vocabulário volta cru e
 * marcado como não reconhecido, e nenhum lança, porque RN-05 do painel proíbe
 * tanto lançar quanto fingir que leu.
 * @module tests/webview-labels-greenfield
 */

import { describe, expect, it } from 'vitest'
import {
  componentSituationLabel,
  greenfieldModeLabel,
  greenfieldStageLabel,
  originStepLabel,
  scenarioLabel,
  stepStatusLabel,
} from '../src/webview/domain/labels.ts'
import { COMPONENT_SITUATIONS, GREENFIELD_STAGES, PROJECT_SCENARIOS } from '../src/domain/types.ts'
import type { Label } from '../src/webview/domain/types.ts'

/** O que todo rótulo deste módulo tem de cumprir. */
function total(rotular: (valor: string) => Label, conhecidos: readonly string[]): void {
  const rotulos = conhecidos.map((valor) => rotular(valor))
  expect(rotulos.every((rotulo) => rotulo.known)).toBe(true)
  expect(new Set(rotulos.map((rotulo) => rotulo.text)).size).toBe(conhecidos.length)
  expect(rotulos.every((rotulo) => rotulo.text !== '')).toBe(true)

  const desconhecido = rotular('valor-que-nao-existe')
  expect(desconhecido.known).toBe(false)
  expect(desconhecido.text).toBe('valor-que-nao-existe')
  expect(desconhecido.raw).toBe('valor-que-nao-existe')
  expect(() => rotular('')).not.toThrow()
}

describe('os cinco vocabulários do eixo', () => {
  it('estágio físico: seis textos distintos, e o cru para o resto', () => {
    total(greenfieldStageLabel, GREENFIELD_STAGES)
  })

  it('cenário: quatro textos distintos', () => {
    total(scenarioLabel, PROJECT_SCENARIOS)
  })

  it('modo do pipeline: guiado e expresso, e o cru para `xyz`', () => {
    total(greenfieldModeLabel, ['guiado', 'expresso'])
    expect(greenfieldModeLabel('xyz')).toEqual({ text: 'xyz', known: false, raw: 'xyz' })
  })

  it('situação do componente: quatro textos distintos, e `foo` cru e marcado', () => {
    total(componentSituationLabel, COMPONENT_SITUATIONS)
    expect(componentSituationLabel('foo').known).toBe(false)
  })

  it('estado da etapa: concluído, corrente e pendente, como palavras', () => {
    total(stepStatusLabel, ['done', 'current', 'pending'])
    expect(stepStatusLabel('done').text).toBe('concluído')
    expect(stepStatusLabel('current').text).toBe('corrente')
    expect(stepStatusLabel('pending').text).toBe('pendente')
  })

  it('as quatro etapas da origem têm nome legível', () => {
    total(originStepLabel, ['ideacao', 'pesquisa', 'redacao', 'especificacao'])
  })
})

describe('o que os textos dizem', () => {
  it('a situação do componente não se confunde com a da pasta: "em andamento" e não "em aberto"', () => {
    expect(componentSituationLabel('em-andamento').text).toBe('em andamento')
    expect(componentSituationLabel('entregue').text.toLowerCase()).toContain('entregue')
  })

  it('o cenário sem âncora diz isso por nome', () => {
    expect(scenarioLabel('sem-ancora').text.toLowerCase()).toContain('âncora')
  })
})
