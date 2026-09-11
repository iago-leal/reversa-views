/**
 * A razão de bloqueio da pipeline greenfield incompleta (RN-11, RF-16, D-17).
 *
 * O eixo chega como TERCEIRO argumento, ao lado do processo e do registro, e
 * pelo mesmo motivo que o registro chegou como segundo: não vive no que o
 * leitor herdado produz, e enfiá-lo lá criaria segunda autoridade.
 *
 * A razão aparece HAJA OU NÃO feature ativa, porque pipeline greenfield
 * incompleta é decisão pendente do usuário: em modo guiado cada agente aguarda
 * o CONTINUAR dele. Pipeline completa, projeto legado, projeto sem artefato do
 * `/reversa-new` e eixo ausente não produzem razão alguma.
 * @module tests/webview-blocking-greenfield
 */

import { describe, expect, it } from 'vitest'
import { blockingReasons } from '../src/webview/domain/blocking.ts'
import {
  anchorlessGreenfieldFixture,
  bugsFixture,
  greenfieldFixture,
  legacyGreenfieldFixture,
  partialGreenfieldFixture,
  processFixture,
  requirementsMd,
  undecomposedGreenfieldFixture,
} from './helpers/reversa-fixtures.ts'

const LIVRE = processFixture()

describe('quando a razão existe', () => {
  it('PRD sem spec produz uma linha que nomeia o estágio, o agente e o comando `/reversa-spec-sdd`', () => {
    const razoes = blockingReasons(LIVRE, bugsFixture(), undecomposedGreenfieldFixture())
    expect(razoes).toHaveLength(1)
    expect(razoes[0]?.text).toContain('spec-sdd')
    expect(razoes[0]?.text.toLowerCase()).toContain('prd')
    expect(razoes[0]?.command).toBe('/reversa-spec-sdd')
    expect(razoes[0]?.artifact).toBe('_reversa_sdd/prd.md')
  })

  it('personas sem PRD aponta o redator', () => {
    const razoes = blockingReasons(LIVRE, bugsFixture(), partialGreenfieldFixture())
    expect(razoes).toHaveLength(1)
    expect(razoes[0]?.text).toContain('drafter')
    expect(razoes[0]?.command).toBe('/reversa-drafter')
    expect(razoes[0]?.artifact).toBe('_reversa_sdd/personas.md')
  })

  it('só o brief aponta o ideador, e só o metadado aponta o ideador sem artefato', () => {
    const soBrief = greenfieldFixture({
      cenario: 'sem-ancora',
      estagio: 'aberto',
      artefatos: { brief: true, ideacao: false, personas: false, prd: false, specs: 0 },
      caminhos: { brief: '_reversa_sdd/newproject-brief.md', ideacao: null, personas: null, prd: null },
    })
    expect(blockingReasons(LIVRE, undefined, soBrief)[0]?.command).toBe('/reversa-ideator')
    expect(blockingReasons(LIVRE, undefined, soBrief)[0]?.artifact).toBe('_reversa_sdd/newproject-brief.md')

    const soMetadado = greenfieldFixture({
      cenario: 'sem-ancora',
      estagio: 'ausente',
      artefatos: { brief: false, ideacao: false, personas: false, prd: false, specs: 0 },
      caminhos: { brief: null, ideacao: null, personas: null, prd: null },
    })
    const razoes = blockingReasons(LIVRE, undefined, soMetadado)
    expect(razoes).toHaveLength(1)
    expect(razoes[0]?.command).toBe('/reversa-ideator')
    expect(razoes[0]?.artifact).toBeNull()
  })

  it('aparece com feature ativa em curso, ao lado das razões dela, e depois delas', () => {
    const comDuvida = processFixture({ requirementsMd: requirementsMd(2) })
    const razoes = blockingReasons(comDuvida, bugsFixture(), undecomposedGreenfieldFixture())
    expect(razoes).toHaveLength(2)
    expect(razoes[0]?.command).toBe('/reversa-clarify')
    expect(razoes[1]?.command).toBe('/reversa-spec-sdd')
  })

  it('a ordem das razões anteriores não muda', () => {
    const comDuvida = processFixture({ requirementsMd: requirementsMd(1) })
    const antes = blockingReasons(comDuvida, bugsFixture())
    const depois = blockingReasons(comDuvida, bugsFixture(), greenfieldFixture())
    expect(depois).toEqual(antes)
  })
})

describe('quando a razão não existe', () => {
  it('pipeline completa no disco não produz razão: este repositório', () => {
    expect(blockingReasons(LIVRE, bugsFixture(), greenfieldFixture())).toEqual([])
  })

  it('projeto legado não produz razão', () => {
    expect(blockingReasons(LIVRE, bugsFixture(), legacyGreenfieldFixture())).toEqual([])
  })

  it('projeto sem âncora e sem artefato do /reversa-new não produz razão', () => {
    expect(blockingReasons(LIVRE, bugsFixture(), anchorlessGreenfieldFixture())).toEqual([])
  })

  it('eixo ausente não produz razão: o painel não afirma o que não leu', () => {
    expect(blockingReasons(LIVRE, bugsFixture())).toEqual([])
    expect(blockingReasons(LIVRE, bugsFixture(), undefined)).toEqual([])
  })

  it('cenário misto com pipeline incompleta não produz razão: a âncora de legado basta', () => {
    const misto = greenfieldFixture({ ...partialGreenfieldFixture(), cenario: 'misto' })
    expect(blockingReasons(LIVRE, undefined, misto)).toEqual([])
  })
})
