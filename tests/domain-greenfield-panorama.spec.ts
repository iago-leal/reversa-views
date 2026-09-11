/**
 * O panorama cruzado: specs contra histórico (RN-04 a RN-07, RN-10, RF-07,
 * D-06 a D-09).
 *
 * O cruzamento não relê pasta alguma: recebe o histórico que `domain/history.ts`
 * já produziu e casa cada spec com ele por igualdade exata do nome, após
 * minúsculas e remoção de diacríticos. O que não casa de um lado é planejado,
 * do outro é fora do plano, e a suíte fixa que nenhum dos dois é omitido.
 *
 * A situação é PROJEÇÃO da situação do histórico, e não segundo julgamento:
 * a tabela de quatro linhas do `data-delta.md` é o que se confere aqui.
 * @module tests/domain-greenfield-panorama
 */

import { describe, expect, it } from 'vitest'
import { readGreenfield } from '../src/domain/greenfield.ts'
import { SPEC_CAP } from '../src/domain/limits.ts'
import type { GreenfieldRead } from '../src/probe/greenfield.ts'
import type { HistoryEntry, ProjectHistory } from '../src/domain/types.ts'

const SAIDA = '_reversa_sdd'

function lido(specs: string[], partes: Partial<GreenfieldRead> = {}): GreenfieldRead {
  return {
    pasta: true,
    brief: true,
    briefMd: null,
    ideacao: true,
    personas: true,
    prd: true,
    prdMd: null,
    arquitetura: false,
    dominio: false,
    specs,
    totalDeSpecs: specs.length,
    truncados: [],
    ...partes,
  }
}

function entrada(partes: Partial<HistoryEntry> & { pasta: string }): HistoryEntry {
  const nomeado = /\/(\d+)-(.+)$/.exec(partes.pasta)
  return {
    id: nomeado?.[1] ?? null,
    nomeCurto: nomeado?.[2] ?? null,
    situacao: 'convergida',
    marca: 'nenhuma',
    acoes: { total: 10, fechadas: 10, abertas: 0, emendas: 0 },
    adendo: nomeado === null ? null : `${SAIDA}/addenda/${nomeado[1]}-${nomeado[2]}.md`,
    resumo: null,
    ultimoEvento: null,
    ...partes,
  }
}

function historico(entradas: HistoryEntry[], extra: Partial<ProjectHistory> = {}): ProjectHistory {
  return { entradas, truncado: false, total: entradas.length, ...extra }
}

function panorama(specs: string[], entradas: HistoryEntry[], partes: Partial<GreenfieldRead> = {}) {
  return readGreenfield({
    lido: lido(specs, partes),
    stateJson: null,
    history: historico(entradas),
    outputFolder: SAIDA,
  }).panorama
}

describe('o casamento por nome exato (RN-05, D-07)', () => {
  it('casa a spec com a pasta de mesmo nome curto, e guarda a pasta e o adendo', () => {
    const p = panorama(['ponte-e-host.md'], [entrada({ pasta: '_reversa_forward/002-ponte-e-host' })])
    expect(p.componentes).toHaveLength(1)
    expect(p.componentes[0]).toMatchObject({
      nome: 'ponte-e-host',
      spec: `${SAIDA}/sdd/ponte-e-host.md`,
      situacao: 'convergida',
      pastas: ['_reversa_forward/002-ponte-e-host'],
      adendo: `${SAIDA}/addenda/002-ponte-e-host.md`,
      acoes: { total: 10, fechadas: 10, abertas: 0, emendas: 0 },
    })
  })

  it('normaliza minúsculas e diacríticos dos dois lados, e preserva o hífen', () => {
    const p = panorama(['Heranca-e-Sincronia.md'], [entrada({ pasta: '_reversa_forward/004-herança-e-sincronia' })])
    expect(p.componentes[0]?.pastas).toEqual(['_reversa_forward/004-herança-e-sincronia'])
    expect(p.foraDoPlano).toEqual([])
  })

  it('não tolera prefixo nem sufixo: `painel-do-processo-v2` não é `painel-do-processo`', () => {
    const p = panorama(['painel-do-processo.md'], [entrada({ pasta: '_reversa_forward/010-painel-do-processo-v2' })])
    expect(p.componentes[0]?.situacao).toBe('planejada')
    expect(p.componentes[0]?.pastas).toEqual([])
    expect(p.foraDoPlano.map((f) => f.nomeCurto)).toEqual(['painel-do-processo-v2'])
  })

  it('uma pasta sem nome curto nunca casa e vai para fora do plano pelo caminho', () => {
    const p = panorama(['x.md'], [entrada({ pasta: '_reversa_forward/solta', nomeCurto: null, id: null })])
    expect(p.foraDoPlano).toHaveLength(1)
    expect(p.foraDoPlano[0]?.pasta).toBe('_reversa_forward/solta')
  })

  it('lista a spec pelo nome do arquivo sem a extensão, ignorando o que não é `.md`', () => {
    const p = panorama(['a.md'], [])
    expect(p.componentes.map((c) => c.nome)).toEqual(['a'])
  })
})

describe('a projeção da situação (RN-06, D-08)', () => {
  const casos: Array<[HistoryEntry['situacao'], string]> = [
    ['convergida', 'convergida'],
    ['entregue-sem-adendo', 'entregue'],
    ['em-aberto', 'em-andamento'],
    ['sem-acoes', 'em-andamento'],
  ]
  for (const [doHistorico, doComponente] of casos) {
    it(`pasta em ${doHistorico} faz componente ${doComponente}`, () => {
      const p = panorama(['a.md'], [entrada({ pasta: '_reversa_forward/001-a', situacao: doHistorico })])
      expect(p.componentes[0]?.situacao).toBe(doComponente)
    })
  }

  it('sem pasta é `planejada`, com ações declaradas ausentes por nome', () => {
    const p = panorama(['a.md'], [])
    expect(p.componentes[0]).toMatchObject({ situacao: 'planejada', pastas: [], adendo: null, acoes: null, marca: 'nenhuma' })
  })

  it('a marca viaja ao lado, sem se misturar com a situação', () => {
    const p = panorama(['a.md'], [entrada({ pasta: '_reversa_forward/001-a', situacao: 'em-aberto', marca: 'ativa' })])
    expect(p.componentes[0]?.situacao).toBe('em-andamento')
    expect(p.componentes[0]?.marca).toBe('ativa')
  })

  it('uma spec com mais de uma pasta lista todas e é representada pela mais avançada', () => {
    const p = panorama(['a.md'], [
      entrada({ pasta: '_reversa_forward/007-a', situacao: 'em-aberto', marca: 'pausada', adendo: null }),
      entrada({ pasta: '_reversa_forward/001-a', situacao: 'convergida' }),
    ])
    expect(p.componentes[0]?.pastas).toEqual(['_reversa_forward/007-a', '_reversa_forward/001-a'])
    expect(p.componentes[0]?.situacao).toBe('convergida')
    expect(p.componentes[0]?.adendo).toBe(`${SAIDA}/addenda/001-a.md`)
    expect(p.componentes[0]?.marca).toBe('pausada')
  })
})

describe('a contagem e o teto (RN-07, RN-10)', () => {
  it('conta os convergidos entre as specs lidas, e nunca as pastas fora do plano', () => {
    const p = panorama(['a.md', 'b.md'], [
      entrada({ pasta: '_reversa_forward/001-a' }),
      entrada({ pasta: '_reversa_forward/002-b', situacao: 'em-aberto' }),
      entrada({ pasta: '_reversa_forward/003-c' }),
    ])
    expect(p.convergidos).toBe(1)
    expect(p.totalDeSpecs).toBe(2)
    expect(p.foraDoPlano.map((f) => f.nomeCurto)).toEqual(['c'])
  })

  it('declara o truncamento quando a sonda parou no teto, e o total de disco sobrevive', () => {
    const specs = Array.from({ length: SPEC_CAP }, (_, i) => `s${String(i).padStart(3, '0')}.md`)
    const p = panorama(specs, [], { totalDeSpecs: SPEC_CAP + 7 })
    expect(p.componentes).toHaveLength(SPEC_CAP)
    expect(p.totalDeSpecs).toBe(SPEC_CAP + 7)
    expect(p.truncado).toBe(true)
  })

  it('specs que colidem após normalização: só a primeira entra, e a anomalia nomeia a outra', () => {
    const eixo = readGreenfield({
      lido: lido(['Painel.md', 'painel.md']),
      stateJson: null,
      history: historico([]),
      outputFolder: SAIDA,
    })
    expect(eixo.panorama.componentes.map((c) => c.nome)).toEqual(['Painel'])
    const anomalia = eixo.anomalias.find((a) => a.code === 'spec-duplicada')
    expect(anomalia?.file).toBe(`${SAIDA}/sdd/painel.md`)
  })
})

describe('o escopo do PRD, acoplado ao panorama (RN-14, RF-23)', () => {
  const prd = '# PRD\n\n## 4. Escopo (in)\n\n**Grupo:**\n\n- 🟡 Nome: detalhe.\n'

  it('carrega os itens lidos, e nenhum deles tem situação', () => {
    const p = panorama([], [], { prdMd: prd })
    expect(p.escopoEncontrado).toBe(true)
    expect(p.escopo).toEqual([{ grupo: 'Grupo', nome: 'Nome', detalhe: 'detalhe.', selo: '🟡' }])
    expect(Object.keys(p.escopo[0] ?? {})).not.toContain('situacao')
  })

  it('PRD presente sem seção de escopo abre a anomalia nomeada', () => {
    const eixo = readGreenfield({
      lido: lido([], { prdMd: '# PRD\n\n## Visão\n\nnada.\n' }),
      stateJson: null,
      history: historico([]),
      outputFolder: SAIDA,
    })
    expect(eixo.panorama.escopoEncontrado).toBe(false)
    const anomalia = eixo.anomalias.find((a) => a.code === 'escopo-do-prd-nao-encontrado')
    expect(anomalia?.file).toBe(`${SAIDA}/prd.md`)
  })

  it('PRD ausente não abre anomalia: não ter PRD não é defeito de leitura', () => {
    const eixo = readGreenfield({
      lido: lido([], { prd: false, prdMd: null }),
      stateJson: null,
      history: historico([]),
      outputFolder: SAIDA,
    })
    expect(eixo.anomalias.map((a) => a.code)).not.toContain('escopo-do-prd-nao-encontrado')
  })
})

describe('este projeto, como a suíte o conhece', () => {
  const SPECS = ['empacotamento-e-verificacao.md', 'heranca-e-sincronia.md', 'leitura-do-processo.md', 'painel-do-processo.md', 'ponte-e-host.md']
  const PASTAS = [
    entrada({ pasta: '_reversa_forward/009-greenfield-e-features-do-prd', situacao: 'em-aberto', marca: 'ativa', adendo: null }),
    entrada({ pasta: '_reversa_forward/008-cronologia-do-ciclo-bugs' }),
    entrada({ pasta: '_reversa_forward/007-atualizacao-e-progresso' }),
    entrada({ pasta: '_reversa_forward/006-cartoes-e-cronologia' }),
    entrada({ pasta: '_reversa_forward/005-empacotamento-e-verificacao' }),
    entrada({ pasta: '_reversa_forward/004-heranca-e-sincronia' }),
    entrada({ pasta: '_reversa_forward/003-painel-do-processo' }),
    entrada({ pasta: '_reversa_forward/002-ponte-e-host' }),
    entrada({ pasta: '_reversa_forward/001-leitura-do-processo' }),
  ]

  it('cinco planejados, todos convergidos, e quatro pastas fora do plano com a ativa entre elas', () => {
    const p = panorama(SPECS, PASTAS)
    expect(p.componentes).toHaveLength(5)
    expect(p.componentes.every((c) => c.situacao === 'convergida')).toBe(true)
    expect(p.convergidos).toBe(5)
    expect(p.foraDoPlano.map((f) => f.id)).toEqual(['009', '008', '007', '006'])
    expect(p.foraDoPlano[0]?.marca).toBe('ativa')
  })
})
