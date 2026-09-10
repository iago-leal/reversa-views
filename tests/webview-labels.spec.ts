/**
 * Labels: turning domain values into text without ever letting an unknown one
 * break the render (RF-04, RF-06, RN-04, RN-05, EC-05).
 * @module tests/webview-labels
 */

import { describe, expect, it } from 'vitest'
import {
  bugPhaseLabel,
  bugPriorityLabel,
  bugSeverityLabel,
  bugStateLabel,
  checkpointMark,
  inconsistencyLabel,
  phaseMark,
  revisionLabel,
  stageLabel,
} from '../src/webview/domain/labels.ts'
import type { Label } from '../src/webview/domain/types.ts'
import { PHASES } from '../src/heranca/reversa-domain/src/index.ts'
import {
  BUG_PHASES,
  BUG_PRIORITIES,
  BUG_SEVERITIES,
  BUG_STATES,
} from '../src/domain/types.ts'
import { processFixture } from './helpers/reversa-fixtures.ts'

const STAGES = [
  'sem-feature-ativa',
  'vazio',
  'requirements',
  'plan',
  'coding-em-progresso',
  'done-sem-adendo',
  'done-com-adendo',
] as const

describe('rótulo de estágio', () => {
  it('dá texto legível e distinto às sete formas conhecidas', () => {
    const textos = STAGES.map((stage) => stageLabel(stage))

    expect(textos.every((label) => label.known)).toBe(true)
    expect(new Set(textos.map((label) => label.text)).size).toBe(STAGES.length)
    expect(textos.every((label) => label.text !== label.raw)).toBe(true)
  })

  it('devolve o valor bruto marcado como desconhecido diante de estágio fora do vocabulário', () => {
    const label = stageLabel('estagio-que-nao-existe')

    expect(label.known).toBe(false)
    expect(label.text).toBe('estagio-que-nao-existe')
    expect(label.raw).toBe('estagio-que-nao-existe')
  })

  it('não lança em nenhuma entrada, inclusive vazia', () => {
    expect(() => stageLabel('')).not.toThrow()
    expect(stageLabel('').known).toBe(false)
  })
})

describe('rótulo e status de fase', () => {
  it('dá rótulo legível às cinco fases da descoberta', () => {
    const marcas = PHASES.map((name) => phaseMark({ name, status: 'pending' }))

    expect(marcas.every((marca) => marca.label.known)).toBe(true)
    expect(new Set(marcas.map((marca) => marca.label.text)).size).toBe(PHASES.length)
  })

  it('distingue os três status por texto, e não por cor', () => {
    const status = (['done', 'current', 'pending'] as const).map(
      (s) => phaseMark({ name: 'escavacao', status: s }).status,
    )

    expect(new Set(status).size).toBe(3)
    expect(status.every((texto) => texto.length > 0)).toBe(true)
  })

  it('devolve o valor bruto marcado como desconhecido diante de fase fora do vocabulário', () => {
    const marca = phaseMark({ name: 'fase-nova' as never, status: 'pending' })

    expect(marca.label.known).toBe(false)
    expect(marca.label.text).toBe('fase-nova')
  })
})

describe('marca de checkpoint', () => {
  it('diz em andamento quando não há data de conclusão', () => {
    const processo = processFixture()
    const emCurso = processo.discovery.checkpoints.find((c) => c.completedAt === null)

    expect(emCurso).toBeDefined()
    expect(checkpointMark(emCurso!).status.toLowerCase()).toContain('andamento')
  })

  it('devolve o instante de quem concluiu à parte, e não dentro da frase', () => {
    // Desde a feature 006 o instante sai apartado: dentro da frase ele seria
    // tempo universal cru na tela, no único lugar que a conversão de RF-15 não
    // alcançaria.
    const processo = processFixture()
    const concluido = processo.discovery.checkpoints.find((c) => c.completedAt !== null)

    expect(concluido).toBeDefined()
    const marca = checkpointMark(concluido!)
    expect(marca.instant).toBe('2026-09-09T10:00:00Z')
    expect(marca.status).not.toContain('2026')
  })

  it('não declara instante algum para quem ainda corre', () => {
    const processo = processFixture()
    const emCurso = processo.discovery.checkpoints.find((c) => c.completedAt === null)

    expect(checkpointMark(emCurso!).instant).toBeNull()
  })

  it('usa o nome do agente como rótulo, sempre conhecido', () => {
    const marca = checkpointMark({
      agent: 'reversa-explorer',
      completedAt: null,
      inProgress: true,
      files: [],
      modulesAnalyzed: [],
      modulesPending: [],
      extra: {},
    })

    expect(marca.label.text).toBe('reversa-explorer')
  })
})

describe('revisão do modelo herdado', () => {
  it('abrevia a revisão do git nos sete caracteres que um log mostra', () => {
    expect(revisionLabel('420305daa6cdd10858b720a34cb8db67d8e5c5e9')).toBe('420305d')
  })

  it('devolve inteiro o que já é menor que sete, sem completar com nada', () => {
    expect(revisionLabel('42030')).toBe('42030')
    expect(revisionLabel('420305d')).toBe('420305d')
  })

  it('devolve texto vazio quando não há revisão declarada', () => {
    expect(revisionLabel('')).toBe('')
    expect(revisionLabel(null)).toBe('')
    expect(revisionLabel(undefined)).toBe('')
  })
})

/**
 * Os quatro vocabulários do registro de bugs (RF-12).
 *
 * A autoridade sobre eles é o schema do `/reversa-debugger`, e não este painel.
 * O que estes casos guardam é a consequência disso: valor fora da lista volta
 * desenhado CRU e marcado como não reconhecido, porque o schema cresce entre
 * versões e um painel que recusasse o valor novo mostraria menos do que o
 * arquivo tem. Degradação declarada, e não falha.
 */

describe('rótulos do registro de bugs (RF-12)', () => {
  it('dá texto legível e distinto aos três estados', () => {
    const rotulos = BUG_STATES.map((estado) => bugStateLabel(estado))

    expect(rotulos.every((rotulo) => rotulo.known)).toBe(true)
    expect(new Set(rotulos.map((rotulo) => rotulo.text)).size).toBe(BUG_STATES.length)
  })

  it('dá texto legível e distinto às dez fases do schema', () => {
    const rotulos = BUG_PHASES.map((fase) => bugPhaseLabel(fase))

    expect(BUG_PHASES).toHaveLength(10)
    expect(rotulos.every((rotulo) => rotulo.known)).toBe(true)
    expect(new Set(rotulos.map((rotulo) => rotulo.text)).size).toBe(BUG_PHASES.length)
  })

  it('dá texto legível e distinto às quatro severidades e às quatro prioridades', () => {
    const severidades = BUG_SEVERITIES.map((valor) => bugSeverityLabel(valor))
    const prioridades = BUG_PRIORITIES.map((valor) => bugPriorityLabel(valor))

    expect(severidades.every((rotulo) => rotulo.known)).toBe(true)
    expect(prioridades.every((rotulo) => rotulo.known)).toBe(true)
    expect(new Set(severidades.map((r) => r.text)).size).toBe(4)
    expect(new Set(prioridades.map((r) => r.text)).size).toBe(4)
  })

  it('valor fora do vocabulário volta cru e marcado como não reconhecido', () => {
    const fora: Array<[(valor: string) => Label, string]> = [
      [bugStateLabel, 'quase-resolvido'],
      [bugPhaseLabel, 'quase-la'],
      [bugSeverityLabel, 'gravissimo'],
      [bugPriorityLabel, 'P9'],
    ]
    for (const [rotular, valor] of fora) {
      const rotulo = rotular(valor)
      expect(rotulo.known, valor).toBe(false)
      expect(rotulo.text, valor).toBe(valor)
      expect(rotulo.raw, valor).toBe(valor)
    }
  })

  it('não lança em entrada alguma, inclusive vazia', () => {
    for (const rotular of [bugStateLabel, bugPhaseLabel, bugSeverityLabel, bugPriorityLabel]) {
      expect(() => rotular('')).not.toThrow()
      expect(rotular('').known).toBe(false)
    }
  })

  it('a fase de espera por decisão humana tem texto que a nomeia como espera', () => {
    // É a fase que RF-10 sobe para a faixa, e o texto dela é o que o leitor lê
    // nas duas telas: a linha do bug e a linha da faixa.
    expect(bugPhaseLabel('awaiting-human').text.toLowerCase()).toContain('human')
  })

  it('as duas inconsistências de RN-04 têm texto que declara qual delas é', () => {
    const semTrava = inconsistencyLabel('resolvido-sem-trava')
    const semResolvido = inconsistencyLabel('trava-sem-resolvido')

    expect(semTrava.known).toBe(true)
    expect(semResolvido.known).toBe(true)
    expect(semTrava.text).not.toBe(semResolvido.text)
    expect(inconsistencyLabel('outra-coisa').known).toBe(false)
  })
})
