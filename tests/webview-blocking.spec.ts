/**
 * The banner of human blocking: which signals of the process become a reason,
 * and what each reason carries (RF-03, RF-03a).
 * @module tests/webview-blocking
 */

import { describe, expect, it } from 'vitest'
import { blockingReasons } from '../src/webview/domain/blocking.ts'
import type { BugEntry, BugRegistry } from '../src/domain/types.ts'
import { EMPTY_BUG_COUNTS } from '../src/domain/types.ts'
import { readFileSync } from 'node:fs'
import {
  actionsMd,
  bugsFixture,
  conferenceFixture,
  linkedEntryFixture,
  linkedGreenfieldFixture,
  linkedHistoryFixture,
  processFixture,
  requirementsMd,
  UNSPECIFIED,
} from './helpers/reversa-fixtures.ts'

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

/**
 * As três condições do registro de bugs (RF-10, D-08).
 *
 * A faixa passa a receber o registro AO LADO do processo, e não dentro dele: o
 * registro não vive no que o leitor herdado devolve, e enfiá-lo lá criaria uma
 * segunda autoridade sobre o processo.
 *
 * A fusão numa linha só é a regra que mais custa acertar. Um bug que reúna duas
 * condições ocupa UMA linha, com as duas razões nomeadas, porque a faixa
 * responde "o que aguarda você" e não "quantas regras cada bug infringe": três
 * linhas sobre o mesmo bug fariam o leitor conferir três vezes o mesmo arquivo.
 */

/**
 * Um bug do registro, com só o que cada caso precisa dizer.
 *
 * O valor bruto acompanha o reconhecido, salvo quando o caso pede um bruto
 * próprio. Sem isso, um caso que só declara `fase` deixaria o par em desacordo,
 * e a faixa seria exercitada contra um bug que a leitura de verdade não produz.
 */
function bugDeRegistro(partes: Partial<BugEntry> & { id: string }): BugEntry {
  const bug: BugEntry = {
    pasta: `_reversa_bugs/ctx/bugs/${partes.id}`,
    arquivo: `_reversa_bugs/ctx/bugs/${partes.id}/bug.md`,
    apelido: null,
    titulo: `Defeito ${partes.id}`,
    estado: 'open',
    estadoBruto: 'open',
    fase: 'triaging',
    faseBruta: 'triaging',
    severidade: 'low',
    severidadeBruta: 'low',
    prioridade: 'P3',
    prioridadeBruta: 'P3',
    registrado: '2026-09-01',
    alterado: '2026-09-01',
    travado: false,
    encerrado: null,
    bloqueado: false,
    inconsistencia: null,
    ...partes,
  }
  return {
    ...bug,
    estadoBruto: 'estadoBruto' in partes ? bug.estadoBruto : bug.estado,
    faseBruta: 'faseBruta' in partes ? bug.faseBruta : bug.fase,
    severidadeBruta: 'severidadeBruta' in partes ? bug.severidadeBruta : bug.severidade,
  }
}

/** Um registro de um contexto só, com os bugs dados. */
function registroCom(bugs: BugEntry[]): BugRegistry {
  return {
    presente: true,
    contextos: [
      {
        contexto: 'ctx',
        pasta: '_reversa_bugs/ctx',
        bugs,
        contagem: { ...EMPTY_BUG_COUNTS, total: bugs.length },
        ultimoMovimento: '2026-09-01',
      },
    ],
    contagem: { ...EMPTY_BUG_COUNTS, total: bugs.length },
    lidos: bugs.length,
    truncado: false,
    anomalias: [],
  }
}

/** As razões que vieram do registro, separadas das do processo. */
function razoesDeBug(bugs: BugEntry[]) {
  return blockingReasons(processFixture(), registroCom(bugs)).filter((razao) =>
    (razao.artifact ?? '').startsWith('_reversa_bugs/'),
  )
}

describe('as três condições de bug na faixa (RF-10)', () => {
  it('a fase de espera por decisão humana produz linha', () => {
    const razoes = razoesDeBug([bugDeRegistro({ id: 'BUG-ESPERA', fase: 'awaiting-human' })])

    expect(razoes).toHaveLength(1)
    expect(razoes[0].text).toContain('BUG-ESPERA')
    expect(razoes[0].artifact).toBe('_reversa_bugs/ctx/bugs/BUG-ESPERA/bug.md')
  })

  it('o bloqueio declarado produz linha', () => {
    const razoes = razoesDeBug([bugDeRegistro({ id: 'BUG-TRAVADO', bloqueado: true })])

    expect(razoes).toHaveLength(1)
    expect(razoes[0].text).toContain('BUG-TRAVADO')
  })

  it('a severidade alta enquanto o bug não estiver encerrado produz linha', () => {
    const razoes = razoesDeBug([bugDeRegistro({ id: 'BUG-GRAVE', severidade: 'high' })])

    expect(razoes).toHaveLength(1)
    expect(razoes[0].text).toContain('BUG-GRAVE')
  })

  /**
   * A leitura de "severidade alta" que este caso fixa. A escala tem quatro
   * degraus, e `critical` é mais grave que `high`: uma faixa que subisse o
   * segundo e calasse o primeiro nomearia o defeito menor e esconderia o maior,
   * que é o contrário do que a faixa existe para fazer.
   */
  it('a severidade crítica sobe pela mesma condição da alta', () => {
    const razoes = razoesDeBug([bugDeRegistro({ id: 'BUG-CRITICO', severidade: 'critical' })])
    expect(razoes).toHaveLength(1)
  })

  it('severidade alta em bug encerrado não produz linha', () => {
    const razoes = razoesDeBug([
      bugDeRegistro({
        id: 'BUG-FECHADO',
        severidade: 'high',
        estado: 'resolved',
        travado: true,
        encerrado: '2026-09-10',
      }),
    ])
    expect(razoes).toEqual([])
  })

  it('sem nenhuma das três, a faixa não ganha linha de bug', () => {
    const razoes = razoesDeBug([
      bugDeRegistro({ id: 'BUG-COMUM' }),
      bugDeRegistro({ id: 'BUG-MEDIO', severidade: 'medium' }),
    ])
    expect(razoes).toEqual([])
  })
})

describe('um bug que reúne condições ocupa uma linha só (RF-10)', () => {
  it('duas condições, uma linha, as duas razões nomeadas', () => {
    const razoes = razoesDeBug([
      bugDeRegistro({ id: 'BUG-DUPLO', fase: 'awaiting-human', bloqueado: true }),
    ])

    expect(razoes).toHaveLength(1)
    expect(razoes[0].text.toLowerCase()).toContain('decisão')
    expect(razoes[0].text.toLowerCase()).toContain('bloque')
  })

  it('as três condições no mesmo bug continuam sendo uma linha só', () => {
    const razoes = razoesDeBug([
      bugDeRegistro({
        id: 'BUG-TRIPLO',
        fase: 'awaiting-human',
        bloqueado: true,
        severidade: 'high',
      }),
    ])

    expect(razoes).toHaveLength(1)
    expect(razoes[0].text).toContain('BUG-TRIPLO')
  })

  it('bugs distintos ocupam linhas distintas', () => {
    const razoes = razoesDeBug([
      bugDeRegistro({ id: 'BUG-UM', fase: 'awaiting-human' }),
      bugDeRegistro({ id: 'BUG-DOIS', bloqueado: true }),
    ])

    expect(razoes).toHaveLength(2)
    expect(razoes.map((razao) => razao.artifact)).toEqual([
      '_reversa_bugs/ctx/bugs/BUG-UM/bug.md',
      '_reversa_bugs/ctx/bugs/BUG-DOIS/bug.md',
    ])
  })

  it('toda razão de bug traz arquivo e comando, como as do processo', () => {
    for (const razao of razoesDeBug([
      bugDeRegistro({ id: 'BUG-X', fase: 'awaiting-human', bloqueado: true }),
    ])) {
      expect(razao.text.length).toBeGreaterThan(0)
      expect(razao.artifact).not.toBeNull()
      expect(razao.command?.startsWith('/reversa')).toBe(true)
    }
  })
})

describe('registro ausente e registro não lido', () => {
  it('sem o registro, a faixa continua sendo só a do processo', () => {
    const comProcesso = blockingReasons(processFixture({ requirementsMd: requirementsMd(1) }))
    const comRegistroAusente = blockingReasons(
      processFixture({ requirementsMd: requirementsMd(1) }),
      undefined,
    )

    expect(comRegistroAusente).toEqual(comProcesso)
  })

  it('registro presente e vazio não produz linha de bug alguma', () => {
    expect(razoesDeBug([])).toEqual([])
  })

  it('as razões do registro vêm depois das do processo, na ordem declarada', () => {
    const razoes = blockingReasons(
      processFixture({ requirementsMd: requirementsMd(1) }),
      registroCom([bugDeRegistro({ id: 'BUG-ESPERA', fase: 'awaiting-human' })]),
    )

    expect(razoes).toHaveLength(2)
    expect(razoes[0].command).toBe('/reversa-clarify')
    expect(razoes[1].artifact).toContain('_reversa_bugs/')
  })

  it('bug de contexto diferente também sobe, e nomeia o próprio arquivo', () => {
    const registro = registroCom([bugDeRegistro({ id: 'BUG-A', fase: 'awaiting-human' })])
    registro.contextos.push({
      contexto: 'outro',
      pasta: '_reversa_bugs/outro',
      bugs: [
        {
          ...bugDeRegistro({ id: 'BUG-B', bloqueado: true }),
          pasta: '_reversa_bugs/outro/bugs/BUG-B',
          arquivo: '_reversa_bugs/outro/bugs/BUG-B/bug.md',
        },
      ],
      contagem: { ...EMPTY_BUG_COUNTS, total: 1 },
      ultimoMovimento: '2026-09-01',
    })
    const razoes = blockingReasons(processFixture(), registro)

    expect(razoes).toHaveLength(2)
    expect(razoes[1].artifact).toBe('_reversa_bugs/outro/bugs/BUG-B/bug.md')
  })
})

/**
 * A conferência pendente não é razão de bloqueio (feature 010, RN-07, D-14,
 * RF-08). A faixa continua reservada ao que o processo prescreve, e o registro
 * de conferências é prática do agente: ele fica como contagem no histórico e
 * no panorama, e a função das razões nem o recebe.
 */
describe('as conferências pendentes (feature 010, D-14, RF-08)', () => {
  /** A 002 do `financas-ali`: convergida, com dezoito conferências pendentes. */
  const convergidaPendente = linkedEntryFixture(
    {
      pasta: '_reversa_forward/002-infra-remota-auth-assistente',
      id: '002',
      nomeCurto: 'infra-remota-auth-assistente',
      situacao: 'convergida',
      marca: 'nenhuma',
      acoes: { total: 40, fechadas: 40, abertas: 0, emendas: 0 },
      adendo: '_reversa_sdd/addenda/002-infra-remota-auth-assistente.md',
      resumo: null,
      ultimoEvento: null,
    },
    undefined,
    conferenceFixture('lido', '_reversa_forward/002-infra-remota-auth-assistente'),
  )

  it('pasta convergida com conferências pendentes não produz razão', () => {
    const historico = linkedHistoryFixture([], [convergidaPendente])
    expect(historico.entradas[0]?.conferencias?.registradas).toBe(2)
    expect(historico.entradas[0]?.conferencias?.total).toBe(20)

    const razoes = blockingReasons(processFixture(), bugsFixture(), linkedGreenfieldFixture([...UNSPECIFIED]))
    expect(razoes).toEqual([])
  })

  it('as razões existentes não mudam de ordem com o eixo da 010 presente', () => {
    const processo = processFixture({ actionsMd: actionsMd(5, 0), addendaFiles: [], requirementsMd: requirementsMd(1) })
    const antes = blockingReasons(processo, bugsFixture())
    const depois = blockingReasons(processo, bugsFixture(), linkedGreenfieldFixture([...UNSPECIFIED]))
    expect(depois).toEqual(antes)
    expect(depois.length).toBeGreaterThan(0)
  })

  it('a função das razões não recebe o histórico, e o painel não o passa', () => {
    expect(blockingReasons.length).toBe(3)
    const app = readFileSync('src/webview/ui/App.tsx', 'utf8')
    expect(app).toMatch(/blockingReasons\(payload\.process, payload\.bugs, payload\.greenfield\)/)
    const faixa = readFileSync('src/webview/domain/blocking.ts', 'utf8')
    expect(faixa).not.toMatch(/conferencias|registradas/)
  })
})
