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
    ['acoes-nao-lidas', 'em-andamento'],
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

  it('uma pasta de ações não lidas nunca vence uma pasta lida (bug nº 11)', () => {
    const p = panorama(['a.md'], [
      entrada({ pasta: '_reversa_forward/007-a', situacao: 'acoes-nao-lidas', adendo: null }),
      entrada({ pasta: '_reversa_forward/001-a', situacao: 'sem-acoes' }),
    ])
    expect(p.componentes[0]?.situacao).toBe('em-andamento')
    expect(p.componentes[0]?.adendo).toBe(`${SAIDA}/addenda/001-a.md`)
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

/* ------------------------------------------------------------ feature 010 */

/** As células de componente de uma pasta, como `readDeliveryLinks()` as entregaria. */
function vinculos(
  porPasta: Record<string, string[] | 'nao-lido'>,
): Map<string, { pasta: string; estado: 'lido' | 'ausente' | 'nao-lido'; arquivo: string | null; tabelas: number; celulas: string[] }> {
  const mapa = new Map()
  for (const [pasta, celulas] of Object.entries(porPasta)) {
    mapa.set(pasta, {
      pasta,
      estado: celulas === 'nao-lido' ? 'nao-lido' : 'lido',
      arquivo: `${pasta}/legacy-impact.md`,
      tabelas: celulas === 'nao-lido' ? 0 : 1,
      celulas: celulas === 'nao-lido' ? [] : celulas,
    })
  }
  return mapa
}

function panoramaCom(
  specs: string[],
  entradas: HistoryEntry[],
  porPasta: Record<string, string[] | 'nao-lido'>,
) {
  return readGreenfield({
    lido: lido(specs),
    stateJson: null,
    history: historico(entradas),
    outputFolder: SAIDA,
    vinculos: vinculos(porPasta),
  }).panorama
}

/** As dez specs do `financas-ali`, medidas em 2026-09-19. */
const SPECS_FINANCAS = [
  'acerto-mensal.md',
  'ajustes.md',
  'boletos-faturas.md',
  'categorizacao-regras.md',
  'fundacao-persistencia.md',
  'ingestao-transacoes.md',
  'investimentos-patrimonio.md',
  'metas.md',
  'recorrentes-assinaturas.md',
  'telas-e-navegacao.md',
]

const P001 = '_reversa_forward/001-fechamento-mensal-mvp'
const P002 = '_reversa_forward/002-infra-remota-auth-assistente'

/** As duas entregas do `financas-ali`, com as células das formas medidas. */
function financas() {
  return panoramaCom(
    SPECS_FINANCAS,
    [
      entrada({ pasta: P002, situacao: 'convergida' }),
      entrada({ pasta: P001, situacao: 'entregue-sem-adendo', adendo: null }),
    ],
    {
      [P002]: [
        'fundacao-persistencia',
        'acesso-e-identidade',
        '`acesso-e-identidade`',
        'telas-e-navegacao',
        '**ajustes**',
        'operacao-de-producao',
        'assistente',
      ],
      [P001]: [
        '`fundacao-persistencia.md`',
        '`fundacao-persistencia.md`, `ajustes.md`, `ingestao-transacoes.md`, `acerto-mensal.md`',
        '`telas-e-navegacao.md`',
        '`docker-compose.yml`',
      ],
    },
  )
}

describe('o vínculo declarado (feature 010, RN-02, RN-03, D-06, D-07, RF-03)', () => {
  it('o nome tem precedência: a spec com pasta homônima ignora a declaração', () => {
    const p = panoramaCom(
      ['painel-do-processo.md'],
      [
        entrada({ pasta: '_reversa_forward/006-cartoes-e-cronologia' }),
        entrada({ pasta: '_reversa_forward/003-painel-do-processo' }),
      ],
      { '_reversa_forward/006-cartoes-e-cronologia': ['painel-do-processo'] },
    )
    expect(p.componentes[0]?.pastas).toEqual(['_reversa_forward/003-painel-do-processo'])
    expect(p.componentes[0]?.ligacoes).toEqual([
      {
        pasta: '_reversa_forward/003-painel-do-processo',
        origem: 'nome',
        impacto: null,
      },
    ])
    expect(p.foraDoPlano.map((f) => f.pasta)).toEqual(['_reversa_forward/006-cartoes-e-cronologia'])
  })

  it('a declaração liga a spec sem pasta homônima, com a origem e o `legacy-impact.md`', () => {
    const p = financas()
    const ajustes = p.componentes.find((c) => c.nome === 'ajustes')
    expect(ajustes?.pastas).toEqual([P002, P001])
    expect(ajustes?.ligacoes).toEqual([
      { pasta: P002, origem: 'declarada', impacto: `${P002}/legacy-impact.md` },
      { pasta: P001, origem: 'declarada', impacto: `${P001}/legacy-impact.md` },
    ])
    expect(ajustes?.situacao).toBe('convergida')
  })

  it('no `financas-ali`, cinco specs ligadas e cinco planejadas, entre elas as duas adiadas', () => {
    const p = financas()
    const ligadas = p.componentes.filter((c) => c.situacao !== 'planejada').map((c) => c.nome)
    const planejadas = p.componentes.filter((c) => c.situacao === 'planejada').map((c) => c.nome)
    expect(ligadas).toEqual([
      'acerto-mensal',
      'ajustes',
      'fundacao-persistencia',
      'ingestao-transacoes',
      'telas-e-navegacao',
    ])
    expect(planejadas).toEqual([
      'boletos-faturas',
      'categorizacao-regras',
      'investimentos-patrimonio',
      'metas',
      'recorrentes-assinaturas',
    ])
    expect(p.componentes.find((c) => c.nome === 'metas')?.ligacoes).toEqual([])
    expect(p.foraDoPlano).toEqual([])
  })

  it('a situação é a da pasta ligada mais avançada (RN-06 da 009)', () => {
    const p = financas()
    // `acerto-mensal` só a 001 declara, e ela está entregue sem adendo.
    expect(p.componentes.find((c) => c.nome === 'acerto-mensal')?.situacao).toBe('entregue')
    expect(p.componentes.find((c) => c.nome === 'fundacao-persistencia')?.situacao).toBe('convergida')
  })

  it('pasta sem spec homônima e sem legacy-impact.md fica fora do plano (RN-03)', () => {
    const p = panoramaCom(['a.md'], [entrada({ pasta: '_reversa_forward/002-b' })], {})
    expect(p.foraDoPlano.map((f) => f.pasta)).toEqual(['_reversa_forward/002-b'])
    expect(p.componentes[0]?.ligacoes).toEqual([])
  })

  it('a pasta que só declara specs com pasta homônima continua fora do plano (D-07)', () => {
    const p = panoramaCom(
      ['leitura-do-processo.md'],
      [
        entrada({ pasta: '_reversa_forward/009-greenfield-e-features-do-prd' }),
        entrada({ pasta: '_reversa_forward/001-leitura-do-processo' }),
      ],
      { '_reversa_forward/009-greenfield-e-features-do-prd': ['leitura-do-processo'] },
    )
    expect(p.foraDoPlano.map((f) => f.nomeCurto)).toEqual(['greenfield-e-features-do-prd'])
  })

  /**
   * Este repositório não muda (RF-03): as cinco specs têm pasta homônima, e
   * as pastas 006 a 009, que declaram specs pelo nome nu, seguem fora do plano.
   */
  it('este repositório fica idêntico ao da 009, com 006 a 009 fora do plano', () => {
    const cinco = ['leitura-do-processo', 'ponte-e-host', 'painel-do-processo', 'heranca-e-sincronia', 'empacotamento-e-verificacao']
    const entradas = [
      ...['009-greenfield-e-features-do-prd', '008-cronologia-do-ciclo-bugs', '007-atualizacao-e-progresso', '006-cartoes-e-cronologia'].map(
        (nome) => entrada({ pasta: `_reversa_forward/${nome}` }),
      ),
      ...cinco.map((nome, i) => entrada({ pasta: `_reversa_forward/00${i + 1}-${nome}` })),
    ]
    const porPasta: Record<string, string[]> = {}
    for (const e of entradas) porPasta[e.pasta] = ['painel-do-processo', 'leitura-do-processo', 'Tema (`#8`, RF-11)']
    const antes = panorama(cinco.map((nome) => `${nome}.md`), entradas)
    const depois = panoramaCom(cinco.map((nome) => `${nome}.md`), entradas, porPasta)

    const semLigacoes = (c: (typeof antes.componentes)[number]) => ({ ...c, ligacoes: undefined })
    expect(depois.componentes.map(semLigacoes)).toEqual(antes.componentes.map(semLigacoes))
    expect(depois.foraDoPlano).toEqual(antes.foraDoPlano)
    expect(depois.foraDoPlano.map((f) => f.id)).toEqual(['009', '008', '007', '006'])
    expect(depois.componentes.every((c) => c.ligacoes?.every((l) => l.origem === 'nome'))).toBe(true)
    expect(depois.semSpec).toEqual([])
    expect(depois.convergidos).toBe(antes.convergidos)
  })
})

describe('os componentes sem spec (feature 010, RN-04, D-08, RF-04, RF-05)', () => {
  it('o `financas-ali` tem três, cada um com a pasta que o declara e o `legacy-impact.md` dela', () => {
    const p = financas()
    expect(p.semSpec?.map((c) => c.nome)).toEqual(['acesso-e-identidade', 'operacao-de-producao', 'assistente'])
    expect(p.semSpec?.[0]).toEqual({
      nome: 'acesso-e-identidade',
      situacao: 'convergida',
      marca: 'nenhuma',
      pastas: [P002],
      impactos: [`${P002}/legacy-impact.md`],
    })
  })

  it('ficam fora do denominador e fora de `convergidos`', () => {
    const p = financas()
    expect(p.totalDeSpecs).toBe(10)
    expect(p.componentes).toHaveLength(10)
    expect(p.convergidos).toBe(p.componentes.filter((c) => c.situacao === 'convergida').length)
    expect(p.convergidos).toBe(3)
  })

  it('a situação é a da pasta mais avançada, pela mesma projeção e marca', () => {
    const p = panoramaCom(
      ['x.md'],
      [
        entrada({ pasta: '_reversa_forward/003-c', situacao: 'em-aberto', marca: 'ativa' }),
        entrada({ pasta: '_reversa_forward/002-b', situacao: 'entregue-sem-adendo' }),
      ],
      { '_reversa_forward/003-c': ['assistente'], '_reversa_forward/002-b': ['`assistente`'] },
    )
    expect(p.semSpec).toEqual([
      {
        nome: 'assistente',
        situacao: 'entregue',
        marca: 'ativa',
        pastas: ['_reversa_forward/003-c', '_reversa_forward/002-b'],
        impactos: ['_reversa_forward/003-c/legacy-impact.md', '_reversa_forward/002-b/legacy-impact.md'],
      },
    ])
  })

  it('nome de spec sozinho na célula é declaração, e não componente sem spec', () => {
    const p = panoramaCom(['ajustes.md'], [entrada({ pasta: '_reversa_forward/002-b' })], {
      '_reversa_forward/002-b': ['ajustes', 'Ajustes'],
    })
    expect(p.semSpec).toEqual([])
    expect(p.componentes[0]?.ligacoes?.[0]?.origem).toBe('declarada')
  })

  it('a pasta que só declara componente sem spec continua fora do plano (RN-03)', () => {
    const p = panoramaCom(['ajustes.md'], [entrada({ pasta: '_reversa_forward/002-b' })], {
      '_reversa_forward/002-b': ['assistente'],
    })
    expect(p.foraDoPlano.map((f) => f.pasta)).toEqual(['_reversa_forward/002-b'])
    expect(p.semSpec?.map((c) => c.nome)).toEqual(['assistente'])
  })
})

describe('o vínculo parcial (feature 010, RN-09)', () => {
  it('pasta com legacy-impact.md presente e não lido declara o vínculo parcial', () => {
    const p = panoramaCom(['a.md'], [entrada({ pasta: '_reversa_forward/002-b' })], {
      '_reversa_forward/002-b': 'nao-lido',
    })
    expect(p.vinculoParcial).toBe(true)
  })

  it('sem pasta não lida, o vínculo não é parcial, e os campos novos vêm sempre', () => {
    const p = panoramaCom(['a.md'], [], {})
    expect(p.vinculoParcial).toBe(false)
    expect(p.semSpec).toEqual([])
    expect(p.componentes[0]?.ligacoes).toEqual([])
  })
})
