/**
 * The banner of human blocking: which signals of the process become a reason,
 * and what each reason carries (RF-03, RF-03a).
 * @module tests/webview-blocking
 */

import { describe, expect, it } from 'vitest'
import { blockingReasons } from '../src/webview/domain/blocking.ts'
import { actionsMd, processFixture, requirementsMd } from './helpers/reversa-fixtures.ts'

/**
 * A migration state file with the given wait and pending decisions.
 *
 * The wait is written the way the inherited reader derives it: through the
 * status of the current agent, since `awaitingHuman` is not a field of the
 * file but a conclusion drawn from it.
 */
function migration(awaitingHuman: boolean, pendingDecisions: string[]): string {
  return JSON.stringify({
    schemaVersion: 1,
    currentAgent: awaitingHuman
      ? { agent: 'strategist', status: 'awaiting_user_approval' }
      : { agent: 'strategist', status: 'running' },
    pendingDecisions,
    completedAgents: ['curator'],
    pendingAgents: ['designer'],
  })
}

describe('razões de bloqueio humano', () => {
  it('não produz razão alguma quando nenhum dos quatro sinais está presente', () => {
    const razoes = blockingReasons(processFixture())
    expect(razoes).toEqual([])
  })

  it('produz uma razão para entrega concluída sem adendo', () => {
    const processo = processFixture({ actionsMd: actionsMd(5, 0), addendaFiles: [] })
    const razoes = blockingReasons(processo)

    expect(processo.forward.stage).toBe('done-sem-adendo')
    expect(razoes).toHaveLength(1)
    expect(razoes[0].artifact).toBe('_reversa_forward/003-painel-do-processo/actions.md')
    expect(razoes[0].command).toBe('/reversa-sync')
  })

  it('produz uma razão para a migração que aguarda decisão humana', () => {
    const razoes = blockingReasons(processFixture({ migrationStateJson: migration(true, []) }))
    expect(razoes).toHaveLength(1)
    expect(razoes[0].text.toLowerCase()).toContain('migração')
  })

  it('nomeia cada decisão pendente da migração em linha própria', () => {
    const processo = processFixture({
      migrationStateJson: migration(false, ['escolher paradigma', 'aprovar recorte']),
    })
    const razoes = blockingReasons(processo)

    expect(razoes).toHaveLength(2)
    expect(razoes[0].text).toContain('escolher paradigma')
    expect(razoes[1].text).toContain('aprovar recorte')
  })

  it('separa a espera da migração das decisões pendentes', () => {
    const processo = processFixture({ migrationStateJson: migration(true, ['uma decisão']) })
    const razoes = blockingReasons(processo)

    expect(razoes).toHaveLength(2)
    expect(new Set(razoes.map((r) => r.text)).size).toBe(2)
  })

  it('produz uma razão nomeando a contagem de dúvidas da feature ativa', () => {
    const razoes = blockingReasons(processFixture({ requirementsMd: requirementsMd(3) }))

    expect(razoes).toHaveLength(1)
    expect(razoes[0].text).toContain('3')
    expect(razoes[0].artifact).toBe('_reversa_forward/003-painel-do-processo/requirements.md')
  })

  it('devolve os quatro sinais juntos na ordem declarada', () => {
    const processo = processFixture({
      actionsMd: actionsMd(5, 0),
      requirementsMd: requirementsMd(2),
      migrationStateJson: migration(true, ['decidir isso']),
    })
    const razoes = blockingReasons(processo)

    expect(razoes).toHaveLength(4)
    expect(razoes[0].command).toBe('/reversa-sync')
    expect(razoes[3].command).toBe('/reversa-clarify')
  })

  it('preenche as três partes de toda razão que devolve', () => {
    const processo = processFixture({
      actionsMd: actionsMd(5, 0),
      requirementsMd: requirementsMd(1),
      migrationStateJson: migration(true, ['decidir isso']),
    })

    for (const razao of blockingReasons(processo)) {
      expect(razao.text.length).toBeGreaterThan(0)
      expect(razao.artifact).not.toBeNull()
      expect(razao.command).not.toBeNull()
      expect(razao.command?.startsWith('/reversa')).toBe(true)
    }
  })

  it('não produz razão quando não há feature ativa', () => {
    const processo = processFixture({ activeRequirements: null })
    expect(blockingReasons(processo)).toEqual([])
  })
})
