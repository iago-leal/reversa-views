/**
 * O julgamento do estágio greenfield e do metadado (RN-01, RN-02, RN-03,
 * RF-02 a RF-06, D-02 a D-05, D-12).
 *
 * O domínio não lê disco: recebe o que a sonda leu, em memória, e é isso que
 * permite alcançar aqui os estados que nenhum projeto saudável produz, o buraco
 * na sequência, o metadado adiantado, o `state.json` sem o campo.
 *
 * O caso que mais importa é o do metadado UM PASSO ATRÁS. No modo guiado o
 * `/reversa-new` só grava o checkpoint depois do CONTINUAR do usuário, de modo
 * que, entre a escrita do artefato e o CONTINUAR, o disco está à frente do
 * metadado. Isso é estado normal, e uma comparação por igualdade acusaria
 * anomalia em todo projeto saudável entre dois checkpoints (D-04).
 * @module tests/domain-greenfield
 */

import { describe, expect, it } from 'vitest'
import { readGreenfield } from '../src/domain/greenfield.ts'
import type { GreenfieldRead } from '../src/probe/greenfield.ts'
import { EMPTY_HISTORY } from '../src/domain/types.ts'

const SAIDA = '_reversa_sdd'

/** O que a sonda devolveria, com só o que cada caso quer dizer. */
function lido(partes: Partial<GreenfieldRead> = {}): GreenfieldRead {
  return {
    pasta: true,
    brief: false,
    briefMd: null,
    ideacao: false,
    personas: false,
    prd: false,
    prdMd: null,
    arquitetura: false,
    dominio: false,
    specs: [],
    totalDeSpecs: 0,
    truncados: [],
    ...partes,
  }
}

/** Os quatro artefatos e uma spec, que é o estado deste projeto. */
const COMPLETO: Partial<GreenfieldRead> = {
  brief: true,
  ideacao: true,
  personas: true,
  prd: true,
  specs: ['leitura-do-processo.md'],
  totalDeSpecs: 1,
}

/** Um `state.json` com o campo do pipeline, ou sem ele. */
function estado(progresso: unknown, extra: Record<string, unknown> = {}): string {
  const base: Record<string, unknown> = { version: '1.3.3', project: 'p', ...extra }
  if (progresso !== undefined) base.newproject_progress = progresso
  return JSON.stringify(base)
}

function julgar(partes: Partial<GreenfieldRead>, stateJson: string | null = estado(undefined)) {
  return readGreenfield({ lido: lido(partes), stateJson, history: EMPTY_HISTORY, outputFolder: SAIDA })
}

describe('o estágio físico, pelo maior contíguo presente (RF-03, D-02)', () => {
  it('nada presente é `ausente`', () => {
    expect(julgar({}).estagio).toBe('ausente')
  })

  it('só o brief é `aberto`', () => {
    expect(julgar({ brief: true }).estagio).toBe('aberto')
  })

  it('brief e ideação é `ideado`', () => {
    expect(julgar({ brief: true, ideacao: true }).estagio).toBe('ideado')
  })

  it('até as personas é `pesquisado`', () => {
    expect(julgar({ brief: true, ideacao: true, personas: true }).estagio).toBe('pesquisado')
  })

  it('até o PRD, com `sdd/` vazia, é `redigido`, seja qual for o metadado', () => {
    const eixo = julgar(
      { brief: true, ideacao: true, personas: true, prd: true },
      estado({ stage: 'done' }),
    )
    expect(eixo.estagio).toBe('redigido')
  })

  it('com ao menos uma spec é `especificado`', () => {
    expect(julgar(COMPLETO).estagio).toBe('especificado')
  })

  it('um buraco na sequência não avança o estágio e abre a anomalia que o nomeia', () => {
    const eixo = julgar({ brief: true, ideacao: true, prd: true })
    expect(eixo.estagio).toBe('ideado')
    const buraco = eixo.anomalias.find((a) => a.code === 'sequencia-greenfield-com-buraco')
    expect(buraco?.file).toBe(`${SAIDA}/personas.md`)
    expect(buraco?.detail).toContain('prd.md')
  })

  it('a presença de cada artefato viaja por nome, para o cartão desenhar as etapas', () => {
    const eixo = julgar({ brief: true, ideacao: true, prd: true })
    expect(eixo.artefatos).toEqual({ brief: true, ideacao: true, personas: false, prd: true, specs: 0 })
    expect(eixo.caminhos).toEqual({
      brief: `${SAIDA}/newproject-brief.md`,
      ideacao: `${SAIDA}/ideation.md`,
      personas: null,
      prd: `${SAIDA}/prd.md`,
    })
  })
})

describe('o cenário, pela regra da âncora (RN-03, D-05)', () => {
  it('as duas âncoras da extração fazem `legado`', () => {
    expect(julgar({ arquitetura: true, dominio: true }).cenario).toBe('legado')
  })

  it('PRD e spec fazem `greenfield`', () => {
    expect(julgar(COMPLETO).cenario).toBe('greenfield')
  })

  it('as duas âncoras juntas fazem `misto`', () => {
    expect(julgar({ ...COMPLETO, arquitetura: true, dominio: true }).cenario).toBe('misto')
  })

  it('nenhuma das duas faz `sem-ancora`, inclusive com PRD e sem spec', () => {
    expect(julgar({}).cenario).toBe('sem-ancora')
    expect(julgar({ brief: true, prd: true }).cenario).toBe('sem-ancora')
    expect(julgar({ arquitetura: true }).cenario).toBe('sem-ancora')
  })
})

describe('o metadado, lido com tolerância (RF-02, RF-05, D-03)', () => {
  it('campo ausente é metadado nulo, e não anomalia: é o que um projeto legado tem', () => {
    const eixo = julgar(COMPLETO, estado(undefined))
    expect(eixo.metadado).toBeNull()
    expect(eixo.anomalias).toEqual([])
  })

  it('`state.json` ausente também é metadado nulo, sem anomalia própria', () => {
    expect(julgar(COMPLETO, null).metadado).toBeNull()
  })

  it('`state.json` ilegível é metadado nulo, sem anomalia própria: quem o acusa é o leitor herdado', () => {
    const eixo = julgar(COMPLETO, '{isso não é json')
    expect(eixo.metadado).toBeNull()
    expect(eixo.anomalias.map((a) => a.code)).not.toContain('metadado-greenfield-malformado')
  })

  it('campo presente e que não é objeto abre a anomalia de metadado malformado', () => {
    const eixo = julgar(COMPLETO, estado('done'))
    expect(eixo.metadado).toBeNull()
    expect(eixo.anomalias.map((a) => a.code)).toContain('metadado-greenfield-malformado')
  })

  it('lê os seis campos crus, inclusive tokens que este painel não conhece', () => {
    const eixo = julgar(
      COMPLETO,
      estado({
        mode: 'xyz',
        stage: 'done',
        started_at: '2026-09-09T10:31:12Z',
        last_checkpoint_at: '2026-09-09T11:03:11Z',
        completed_stages: ['ideator', 'researcher', 'drafter', 'spec-sdd'],
        brief: 'criar uma extensão.',
      }),
    )
    expect(eixo.metadado).toEqual({
      modo: 'xyz',
      estagio: 'done',
      iniciadoEm: '2026-09-09T10:31:12Z',
      ultimoCheckpointEm: '2026-09-09T11:03:11Z',
      concluidos: ['ideator', 'researcher', 'drafter', 'spec-sdd'],
      brief: 'criar uma extensão.',
    })
  })

  it('campo com tipo errado vira nulo ou lista vazia, sem falhar', () => {
    const eixo = julgar(COMPLETO, estado({ mode: 3, stage: null, completed_stages: 'x', brief: [] }))
    expect(eixo.metadado).toEqual({
      modo: null,
      estagio: null,
      iniciadoEm: null,
      ultimoCheckpointEm: null,
      concluidos: [],
      brief: null,
    })
  })
})

describe('a divergência entre metadado e disco (RN-02, RF-04, D-04)', () => {
  const divergencia = (eixo: ReturnType<typeof readGreenfield>) =>
    eixo.anomalias.find((a) => a.code === 'estagio-greenfield-divergente')

  it('o metadado um passo atrás do disco é estado saudável: sem anomalia', () => {
    // ideation.md escrita e o CONTINUAR ainda não dado: o stage segue `ideator`.
    expect(divergencia(julgar({ brief: true, ideacao: true }, estado({ stage: 'ideator' })))).toBeUndefined()
    expect(divergencia(julgar({ brief: true, ideacao: true }, estado({ stage: 'researcher' })))).toBeUndefined()
  })

  it('cada estágio aceita quem o produziu e o próximo', () => {
    const casos: Array<[Partial<GreenfieldRead>, string[]]> = [
      [{}, ['ideator']],
      [{ brief: true }, ['ideator']],
      [{ brief: true, ideacao: true }, ['ideator', 'researcher']],
      [{ brief: true, ideacao: true, personas: true }, ['researcher', 'drafter']],
      [{ brief: true, ideacao: true, personas: true, prd: true }, ['drafter', 'spec-sdd']],
    ]
    for (const [disco, aceitos] of casos) {
      for (const token of aceitos) {
        expect(divergencia(julgar(disco, estado({ stage: token }))), `${token}`).toBeUndefined()
      }
    }
  })

  it('com specs presentes aceita `spec-sdd`, `done` e qualquer `forward-*`', () => {
    for (const token of ['spec-sdd', 'done', 'forward-requirements', 'forward-plan', 'forward-to-do', 'forward-coding']) {
      expect(divergencia(julgar(COMPLETO, estado({ stage: token }))), token).toBeUndefined()
    }
  })

  it('fora do conjunto, a anomalia nomeia os dois valores e o físico manda', () => {
    const eixo = julgar({ brief: true, ideacao: true }, estado({ stage: 'spec-sdd' }))
    expect(eixo.estagio).toBe('ideado')
    const anomalia = divergencia(eixo)
    expect(anomalia?.file).toBe('.reversa/state.json')
    expect(anomalia?.detail).toContain('spec-sdd')
    expect(anomalia?.detail).toContain('ideado')
  })

  it('metadado adiantado em relação ao disco também diverge', () => {
    expect(divergencia(julgar(COMPLETO, estado({ stage: 'ideator' })))).toBeDefined()
  })

  it('sem `stage` no metadado, não há o que comparar', () => {
    expect(divergencia(julgar(COMPLETO, estado({ mode: 'guiado' })))).toBeUndefined()
  })
})

describe('a linha de resumo, em três passos (RF-06, D-12)', () => {
  const brief = [
    '# Brief inicial, /reversa-new',
    '',
    '## Ideia original',
    'Criar uma extensão para o VSCode com o intuito de visualizarmos o pipeline.',
    'A ideia é que seja similar ao que há em outro lugar.',
    '',
    '## Reconhecimento prévio',
    'Outra coisa.',
  ].join('\n')

  it('vem da primeira frase da seção "Ideia original" do brief, com a quebra dura desfeita', () => {
    const eixo = julgar({ brief: true, briefMd: brief }, estado({ brief: 'do metadado.' }))
    expect(eixo.resumo).toBe('Criar uma extensão para o VSCode com o intuito de visualizarmos o pipeline.')
  })

  it('sem a seção no brief, vem do campo `brief` do metadado, na primeira frase', () => {
    const eixo = julgar(
      { brief: true, briefMd: '# Brief\n\nSem a seção esperada.\n' },
      estado({ brief: 'criar uma extensão. E mais coisa.' }),
    )
    expect(eixo.resumo).toBe('criar uma extensão.')
  })

  it('sem brief lido e sem metadado, é nulo: o painel não inventa linha', () => {
    expect(julgar({ brief: true, briefMd: null }, estado(undefined)).resumo).toBeNull()
    expect(julgar({}, null).resumo).toBeNull()
  })
})

describe('o que a sonda não conseguiu ler', () => {
  it('um artefato acima do teto vira anomalia nomeada e caminho truncado', () => {
    const eixo = julgar({ brief: true, briefMd: null, truncados: [`${SAIDA}/newproject-brief.md`] })
    expect(eixo.truncados).toEqual([`${SAIDA}/newproject-brief.md`])
    const anomalia = eixo.anomalias.find((a) => a.code === 'artefato-greenfield-truncado')
    expect(anomalia?.file).toBe(`${SAIDA}/newproject-brief.md`)
  })

  it('pasta de saída ausente é o eixo vazio, sem anomalia', () => {
    const eixo = julgar({ pasta: false })
    expect(eixo.cenario).toBe('sem-ancora')
    expect(eixo.estagio).toBe('ausente')
    expect(eixo.anomalias).toEqual([])
    expect(eixo.panorama.componentes).toEqual([])
  })
})
