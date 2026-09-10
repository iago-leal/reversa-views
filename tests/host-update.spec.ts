/**
 * Suíte do intérprete da consulta à origem (T012), contra `src/host/update.ts`.
 *
 * O intérprete é função pura: recebe o que a porta de rede entregou, um código
 * de resposta e um corpo, e devolve um dos sete desfechos do contrato. Ele não
 * abre conexão, não conhece o editor e não guarda estado, e é por isso que esta
 * suíte o exercita sobre respostas GRAVADAS em `tests/fixtures/consulta-a-origem/`.
 *
 * Nenhum teste daqui abre conexão, pela mesma razão que nenhum teste abre
 * navegador: suíte que depende de rede falha por motivo alheio ao código e
 * ensina a ignorar vermelho.
 *
 * As fixtures declaram o desfecho que esperam. Isso é deliberado: o par
 * resposta/desfecho é o contrato, e mantê-lo no mesmo arquivo é o que permite
 * acrescentar um caso sem tocar em código de teste. O que esta suíte
 * acrescenta são as garantias que a tabela não expressa — que nada lança, que
 * a tabela está inteira, e que a distância nunca aparece onde não há distância.
 * @module tests/host-update
 */

import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { UPDATE_CAUSES, UPDATE_STATES } from '../src/host/protocol.ts'
import type { UpdateStatus } from '../src/host/protocol.ts'
import type { OriginReply } from '../src/host/ports.ts'
import { interpretReply, queryPlan } from '../src/host/update.ts'

/** Onde as respostas gravadas moram. */
const FIXTURES = 'tests/fixtures/consulta-a-origem'

/** Uma resposta gravada, como o arquivo a escreve. */
interface Fixture {
  nome: string
  descricao: string
  procedencia: string
  codigo: number
  corpo: unknown
  desfechoEsperado: UpdateStatus
}

/** Todas as respostas gravadas, lidas uma vez. */
function fixtures(): Fixture[] {
  return readdirSync(FIXTURES)
    .filter((nome) => nome.endsWith('.json'))
    .sort()
    .map((nome) => ({
      nome,
      ...(JSON.parse(readFileSync(join(FIXTURES, nome), 'utf8')) as Omit<Fixture, 'nome'>),
    }))
}

/** A resposta gravada, na forma em que a porta de rede a entrega. */
function comoResposta(fixture: Fixture): OriginReply {
  return { kind: 'response', status: fixture.codigo, body: fixture.corpo }
}

describe('a suíte tem o que exercitar', () => {
  it('encontra respostas gravadas, e cada uma declara o desfecho que espera', () => {
    const gravadas = fixtures()
    expect(gravadas.length).toBeGreaterThan(5)
    for (const fixture of gravadas) {
      expect(UPDATE_STATES, fixture.nome).toContain(fixture.desfechoEsperado.estado)
      expect(fixture.procedencia, `${fixture.nome} sem procedência`).not.toBe('')
    }
  })

  it('cobre cada desfecho que uma resposta pode produzir', () => {
    // `desligada` e `consultando` NÃO saem de resposta alguma: a primeira é
    // decisão de configuração, a segunda é o estado de espera. As cinco
    // restantes têm de ter fixture, senão a tabela do contrato tem linha que
    // nada exercita.
    const alcançáveis = UPDATE_STATES.filter(
      (estado) => estado !== 'desligada' && estado !== 'consultando',
    )
    const cobertos = new Set(fixtures().map((fixture) => fixture.desfechoEsperado.estado))
    for (const estado of alcançáveis) {
      expect([...cobertos], `nenhuma fixture produz ${estado}`).toContain(estado)
    }
  })

  it('cobre cada causa de consulta impossível que uma resposta pode produzir', () => {
    // `sem-rede` e `tempo-esgotado` são falhas de transporte: não há resposta,
    // e por isso não há fixture de corpo. As outras duas vêm de resposta.
    const cobertas = new Set(
      fixtures()
        .map((fixture) => fixture.desfechoEsperado)
        .filter((desfecho) => desfecho.estado === 'impossivel')
        .map((desfecho) => (desfecho as { causa: string }).causa),
    )
    expect([...cobertas].sort()).toEqual(['limite-de-taxa', 'resposta-inesperada'])
  })
})

describe('a tradução de cada resposta gravada (RF-10, RF-15, RF-16)', () => {
  for (const fixture of fixtures()) {
    it(`${fixture.nome} produz ${JSON.stringify(fixture.desfechoEsperado)}`, () => {
      expect(interpretReply(comoResposta(fixture))).toEqual(fixture.desfechoEsperado)
    })
  }
})

describe('as duas falhas de transporte, que não têm corpo', () => {
  it('a ausência de rede vira consulta impossível com essa causa', () => {
    expect(interpretReply({ kind: 'failure', cause: 'sem-rede' })).toEqual({
      estado: 'impossivel',
      causa: 'sem-rede',
    })
  })

  it('o tempo esgotado vira consulta impossível com essa causa', () => {
    expect(interpretReply({ kind: 'failure', cause: 'tempo-esgotado' })).toEqual({
      estado: 'impossivel',
      causa: 'tempo-esgotado',
    })
  })

  it('toda causa declarada atravessa a falha sem tradução', () => {
    for (const causa of UPDATE_CAUSES) {
      expect(interpretReply({ kind: 'failure', cause: causa })).toEqual({
        estado: 'impossivel',
        causa,
      })
    }
  })
})

describe('corpo torto vira desfecho nomeado, jamais exceção', () => {
  /** O que quer que chegue onde se esperava um objeto de comparação. */
  const TORTOS: unknown[] = [
    null,
    undefined,
    '',
    'não sou JSON',
    42,
    true,
    [],
    [{ status: 'ahead', ahead_by: 4 }],
    {},
    { status: null, ahead_by: null, behind_by: null },
    { status: 'ahead' },
    { status: 'ahead', ahead_by: -1 },
    { status: 'ahead', ahead_by: 1.5 },
    { status: 'ahead', ahead_by: Number.NaN },
    { status: 'diverged', ahead_by: {} },
    { status: 42, ahead_by: 1 },
  ]

  it('nenhum deles lança, e todos produzem resposta inesperada', () => {
    for (const corpo of TORTOS) {
      const rótulo = JSON.stringify(corpo) ?? String(corpo)
      let desfecho: UpdateStatus | null = null
      expect(() => {
        desfecho = interpretReply({ kind: 'response', status: 200, body: corpo })
      }, `lançou com ${rótulo}`).not.toThrow()
      expect(desfecho, rótulo).toEqual({ estado: 'impossivel', causa: 'resposta-inesperada' })
    }
  })

  it('o código decide antes do corpo, e é isso que salva do `status` do 404', () => {
    // O corpo do 404 real traz `status: "404"`. Lido antes do código, ele
    // chegaria ao tradutor de comparação como valor desconhecido; lido depois,
    // nunca é olhado. A ordem é a regra, e esta é a linha que a fixa.
    const corpoDo404 = { message: 'Not Found', status: '404' }
    expect(interpretReply({ kind: 'response', status: 404, body: corpoDo404 })).toEqual({
      estado: 'commit-desconhecido',
    })
  })

  it('um 404 de corpo vazio continua sendo commit desconhecido', () => {
    expect(interpretReply({ kind: 'response', status: 404, body: null })).toEqual({
      estado: 'commit-desconhecido',
    })
  })

  it('o 429 é limite de taxa, ao lado do 403', () => {
    for (const codigo of [403, 429]) {
      expect(interpretReply({ kind: 'response', status: codigo, body: {} })).toEqual({
        estado: 'impossivel',
        causa: 'limite-de-taxa',
      })
    }
  })
})

describe('a distância só viaja onde há distância', () => {
  it('nenhum desfecho sem distância carrega o campo', () => {
    for (const fixture of fixtures()) {
      const desfecho = interpretReply(comoResposta(fixture))
      if (desfecho.estado === 'atrasada' || desfecho.estado === 'divergente') continue
      expect(desfecho, fixture.nome).not.toHaveProperty('commits')
    }
  })

  it('a distância de `atrasada` é a medida a partir da base, e não a de trás', () => {
    const desfecho = interpretReply({
      kind: 'response',
      status: 200,
      body: { status: 'ahead', ahead_by: 7, behind_by: 99 },
    })
    expect(desfecho).toEqual({ estado: 'atrasada', commits: 7 })
  })

  it('zero commits à frente não é atraso, e não desenha "0 commits"', () => {
    // Só ocorreria com um serviço incoerente, dizendo `ahead` com distância
    // zero. Chamar isso de atraso faria o painel escrever "0 commits novos".
    const desfecho = interpretReply({
      kind: 'response',
      status: 200,
      body: { status: 'ahead', ahead_by: 0, behind_by: 0 },
    })
    expect(desfecho).toEqual({ estado: 'em-dia' })
  })
})

describe('é pura', () => {
  it('duas interpretações da mesma resposta dão o mesmo desfecho', () => {
    for (const fixture of fixtures()) {
      expect(interpretReply(comoResposta(fixture))).toEqual(interpretReply(comoResposta(fixture)))
    }
  })

  it('não altera o corpo recebido', () => {
    const corpo = { status: 'ahead', ahead_by: 4, behind_by: 0 }
    const antes = JSON.stringify(corpo)
    interpretReply({ kind: 'response', status: 200, body: corpo })
    expect(JSON.stringify(corpo)).toBe(antes)
  })
})

describe('se a consulta acontece, e o que a desliga na raiz (RF-14, RN-09)', () => {
  const CARIMBO = {
    origin: 'iago-leal/reversa-views',
    commit: 'a23711d481021a978720c0bc478b6dabed94fec3',
    branch: 'master',
  }

  it('com a chave ligada e origem conhecida, a consulta acontece', () => {
    expect(queryPlan({ enabled: true, ...CARIMBO })).toEqual({
      kind: 'ask',
      base: CARIMBO.commit,
      head: 'master',
    })
  })

  it('com a chave desligada, não acontece, e o desfecho declara isso', () => {
    expect(queryPlan({ enabled: false, ...CARIMBO })).toEqual({
      kind: 'skip',
      status: { estado: 'desligada' },
    })
  })

  it('sem origem conhecida, não acontece: um remoto de outro serviço não é consultável', () => {
    expect(queryPlan({ enabled: true, ...CARIMBO, origin: null })).toEqual({
      kind: 'skip',
      status: { estado: 'desligada' },
    })
  })

  it('sem commit de construção, não acontece: não há base a comparar', () => {
    expect(queryPlan({ enabled: true, ...CARIMBO, commit: '' })).toEqual({
      kind: 'skip',
      status: { estado: 'desligada' },
    })
  })

  it('desligar por chave e desligar por falta de origem são o mesmo desfecho', () => {
    // São duas causas e um só desfecho, de propósito: o leitor do painel não
    // tem o que fazer com a diferença, e o cabeçalho não é lugar de explicar
    // configuração de repositório.
    expect(queryPlan({ enabled: false, ...CARIMBO })).toEqual(
      queryPlan({ enabled: true, ...CARIMBO, origin: null }),
    )
  })
})
