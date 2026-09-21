/**
 * O prompt de correção, composto na tela e entregue pronto (T010 a T014).
 *
 * Ele é o terceiro texto derivado da leitura, ao lado do resumo da feature 006,
 * e nasce pela mesma razão que aquele: os rótulos legíveis vivem deste lado e o
 * host não pode conter caminho do Reversa nem nome de estágio. O que atravessa
 * a ponte é texto pronto.
 *
 * Duas coisas esta suíte cobra com mais insistência do que o costume, e as duas
 * são sobre ausência. A primeira é que o botão não acenda onde não há nada a
 * pedir, e que a razão de estar apagado seja legível. A segunda é que o texto
 * não afirme o que o painel não leu, e não carregue o conteúdo que a elisão
 * existe para deixar em casa. Ausência é mais difícil de provar do que presença,
 * e é aqui que o risco desta feature se concentra.
 * @module tests/webview-prompt
 */

import { describe, expect, it } from 'vitest'
import {
  promptAvailability,
  promptCases,
  promptText,
} from '../src/webview/domain/prompt.ts'
import type { PromptCase } from '../src/webview/domain/prompt.ts'
import {
  checkpointStateFixture,
  discoveryStateFixture,
  formlessCheckpointFixture,
  nonAgentEntryFixture,
  payloadFixture,
  processFixture,
  recognisedCheckpointFixture,
  undeclaredCheckpointFixture,
} from './helpers/reversa-fixtures.ts'

/** A forma medida do `scout`, que é o caso mais simples dos três. */
const FORMA_DO_SCOUT = {
  timestamp: '2026-05-03T12:10:19Z',
  files: '<lista de 3>',
}

/** A forma medida do `redator_progress`, com os contadores que decidem o caso. */
const FORMA_DO_REDATOR = {
  items_total: 6,
  items_done: 3,
  items_pending: '<lista de 3>',
  items_completed: '<lista de 16>',
  last_completed_at: '2026-04-28T20:10:00Z',
}

/** Uma carga com os checkpoints que o caso quiser, e a raiz nomeada. */
function carga(checkpoints: ReturnType<typeof checkpointStateFixture>[], extras = {}) {
  return payloadFixture({
    root: '/Users/alguem/dev/ps-iagerasmlk',
    discoveryState: discoveryStateFixture({ checkpoints }),
    ...extras,
  })
}

/** O texto da carga, pelo caminho que a tela usa. */
function texto(payload: ReturnType<typeof payloadFixture>): string {
  return promptText(promptCases(payload))
}

describe('a disponibilidade da ação (T010)', () => {
  it('há prompt quando existe checkpoint sem conclusão declarada', () => {
    const { elegiveis, razao } = promptAvailability(
      carga([undeclaredCheckpointFixture('scout', FORMA_DO_SCOUT)]),
    )

    expect(elegiveis).toHaveLength(1)
    expect(elegiveis[0]?.agente).toBe('scout')
    expect(razao).toBeNull()
  })

  it('não há prompt na leitura sã, e a razão diz que não há caso', () => {
    const { elegiveis, razao } = promptAvailability(
      carga([checkpointStateFixture({ agent: 'scout' })]),
    )

    expect(elegiveis).toEqual([])
    expect(razao).toMatch(/sem conclusão não declarada|nenhum checkpoint/i)
  })

  it('não há prompt sem o eixo, e a razão diz que a leitura não aconteceu', () => {
    const { elegiveis, razao } = promptAvailability(payloadFixture())

    expect(elegiveis).toEqual([])
    expect(razao).toMatch(/não aconteceu|não foi lid/i)
  })

  it('a razão da leitura ausente NÃO diz que o projeto está sem defeito', () => {
    const { razao } = promptAvailability(payloadFixture())

    expect(razao).not.toMatch(/sem defeito|está são|nada a corrigir/i)
  })

  it('as três razões são distintas entre si', () => {
    const razoes = [
      promptAvailability(null).razao,
      promptAvailability(payloadFixture()).razao,
      promptAvailability(carga([checkpointStateFixture({ agent: 'scout' })])).razao,
    ]

    expect(new Set(razoes).size).toBe(3)
  })

  it('não há prompt sem leitura alguma', () => {
    const { elegiveis, razao } = promptAvailability(null)

    expect(elegiveis).toEqual([])
    expect(razao).not.toBeNull()
  })

  it('o checkpoint reconhecido por par aprovado não é elegível (RF-15)', () => {
    const { elegiveis, razao } = promptAvailability(
      carga([recognisedCheckpointFixture('scout', 'status', 'concluido')]),
    )

    expect(elegiveis).toEqual([])
    expect(razao).not.toBeNull()
  })

  it('a chave aprovada como registro não é elegível (RF-16)', () => {
    const payload = payloadFixture({
      discoveryState: discoveryStateFixture({
        checkpoints: [],
        registrosNaoAgentes: [nonAgentEntryFixture('plano_aprovado', ['decisoes'])],
      }),
    })

    expect(promptAvailability(payload).elegiveis).toEqual([])
  })

  it('separa o elegível do não elegível na mesma leitura', () => {
    const { elegiveis } = promptAvailability(
      carga([
        recognisedCheckpointFixture('writer', 'status', 'concluido'),
        undeclaredCheckpointFixture('scout', FORMA_DO_SCOUT),
        checkpointStateFixture({ agent: 'architect' }),
      ]),
    )

    expect(elegiveis.map((c) => c.agente)).toEqual(['scout'])
  })
})

describe('as cinco partes do texto, na ordem do contrato (T011)', () => {
  const payload = carga([undeclaredCheckpointFixture('scout', FORMA_DO_SCOUT)])

  it('diz onde colar, nomeando a raiz observada sem abreviá-la', () => {
    expect(texto(payload)).toContain('/Users/alguem/dev/ps-iagerasmlk')
  })

  it('declara a norma: completed_at com files é o par que declara conclusão', () => {
    const t = texto(payload)

    expect(t).toContain('completed_at')
    expect(t).toContain('files')
  })

  it('traz um bloco por caso, com o agente nomeado', () => {
    expect(texto(payload)).toContain('scout')
  })

  it('traz os quatro pedidos numerados', () => {
    const t = texto(payload)

    for (const n of ['1.', '2.', '3.', '4.']) expect(t).toContain(n)
  })

  it('traz as quatro proibições', () => {
    const t = texto(payload).toLowerCase()

    expect(t).toContain('não renomeie')
    expect(t).toContain('não normalize')
    expect(t).toContain('não reescreva')
    expect(t).toContain('outros agentes')
  })

  it('as cinco partes aparecem nesta ordem: onde colar, norma, casos, pedidos, proibições', () => {
    const t = texto(payload)
    const posicoes = [
      t.indexOf('/Users/alguem/dev/ps-iagerasmlk'),
      t.indexOf('completed_at'),
      t.indexOf('scout'),
      t.toLowerCase().indexOf('nesta ordem'),
      t.toLowerCase().indexOf('não renomeie'),
    ]

    expect(posicoes.every((p) => p >= 0)).toBe(true)
    expect([...posicoes].sort((a, b) => a - b)).toEqual(posicoes)
  })

  it('o quarto pedido proíbe aplicar a correção sem revisão', () => {
    expect(texto(payload).toLowerCase()).toContain('sem eu ver')
  })

  it('dois casos produzem dois blocos, na ordem em que o eixo os entregou', () => {
    const t = texto(
      carga([
        undeclaredCheckpointFixture('redator_progress', FORMA_DO_REDATOR),
        undeclaredCheckpointFixture('scout', FORMA_DO_SCOUT),
      ]),
    )

    expect(t.indexOf('redator_progress')).toBeLessThan(t.indexOf('scout'))
  })

  it('nomeia o campo que resolve o caso, com o valor do disco', () => {
    expect(texto(payload)).toContain('2026-05-03T12:10:19Z')
  })

  it('nomeia os contadores que sustentam a pergunta anterior à correção', () => {
    const t = texto(carga([undeclaredCheckpointFixture('redator_progress', FORMA_DO_REDATOR)]))

    expect(t).toContain('items_done')
    expect(t).toContain('items_total')
  })

  it('nomeia os campos com lista sem chamá-los de saídas', () => {
    const t = texto(
      carga([
        checkpointStateFixture({
          agent: 'archaeologist',
          situacao: 'conclusao-nao-declarada',
          instante: null,
          camposComLista: ['achados', 'lacunas'],
          formaElidida: { modules_analyzed: '<lista de 1>', modules_pending: '<lista de 0>' },
        }),
      ]),
    )

    expect(t).toContain('achados')
    expect(t.toLowerCase()).not.toContain('saídas produzidas por achados')
  })
})

describe('o que o texto nunca contém (T012)', () => {
  it('não traz o conteúdo de campo elidido, apenas a forma', () => {
    const t = texto(carga([undeclaredCheckpointFixture('scout', FORMA_DO_SCOUT)]))

    expect(t).toContain('<lista de 3>')
    expect(t).not.toContain('inventory.md')
  })

  it('não afirma quantos projetos declaram conclusão fora do esquema', () => {
    const t = texto(carga([undeclaredCheckpointFixture('scout', FORMA_DO_SCOUT)]))

    // Medição de conjunto que o painel não observa: ele lê uma raiz.
    expect(t).not.toMatch(/\b64\b|\b229\b|sete vocabulários|nove projetos/i)
  })

  it('não afirma que o guia de checkpoint existe naquela raiz', () => {
    const t = texto(carga([undeclaredCheckpointFixture('scout', FORMA_DO_SCOUT)]))

    expect(t).not.toMatch(/o arquivo .* existe|está em .*checkpoint-guide\.md`? deste projeto/i)
  })

  it('não menciona o checkpoint reconhecido por par aprovado', () => {
    const t = texto(
      carga([
        recognisedCheckpointFixture('writer', 'status', 'concluido'),
        undeclaredCheckpointFixture('scout', FORMA_DO_SCOUT),
      ]),
    )

    expect(t).not.toContain('writer')
  })

  it('não menciona a chave aprovada como registro que não é agente', () => {
    const t = texto(
      payloadFixture({
        root: '/w/x',
        discoveryState: discoveryStateFixture({
          checkpoints: [undeclaredCheckpointFixture('scout', FORMA_DO_SCOUT)],
          registrosNaoAgentes: [nonAgentEntryFixture('plano_aprovado')],
        }),
      }),
    )

    expect(t).not.toContain('plano_aprovado')
  })

  it('não apresenta o instante de um campo qualquer como prova de conclusão', () => {
    const t = texto(carga([undeclaredCheckpointFixture('scout', FORMA_DO_SCOUT)])).toLowerCase()

    expect(t).not.toMatch(/timestamp.{0,40}(declara|prova) (a )?conclus/i)
  })
})

describe('o determinismo (T013)', () => {
  const payload = carga([
    undeclaredCheckpointFixture('redator_progress', FORMA_DO_REDATOR),
    undeclaredCheckpointFixture('scout', FORMA_DO_SCOUT),
  ])

  it('duas montagens sobre a mesma carga dão o mesmo texto, byte a byte', () => {
    expect(texto(payload)).toBe(texto(payload))
  })

  it('a cópia e o documento recebem o mesmo texto, porque há uma função só', () => {
    const casos = promptCases(payload)

    expect(promptText(casos)).toBe(promptText(promptCases(payload)))
  })

  it('não consulta o relógio: o texto não contém o instante de agora', () => {
    const agora = new Date().toISOString().slice(0, 10)
    const t = texto(payload)

    // A data de hoje só poderia entrar por consulta ao relógio; as datas dos
    // casos são de 2026-04 e 2026-05, e vêm do disco.
    expect(t.includes(agora)).toBe(false)
  })
})

describe('o host anterior ao campo da forma (T014)', () => {
  const payload = carga([formlessCheckpointFixture('scout')])

  it('compõe o bloco sem a forma, em vez de quebrar', () => {
    expect(() => texto(payload)).not.toThrow()
    expect(texto(payload)).toContain('scout')
  })

  it('não inventa campo algum quando a forma não veio', () => {
    expect(texto(payload)).not.toContain('timestamp')
  })

  it('o checkpoint continua elegível: a forma que falta é leitura, não saúde', () => {
    expect(promptAvailability(payload).elegiveis).toHaveLength(1)
  })

  it('o caso carrega a forma como nula quando o host não a mandou', () => {
    const casos: PromptCase[] = promptCases(payload)

    expect(casos[0]?.formaElidida).toBeNull()
  })
})

describe('o caso sem projeto declarado', () => {
  it('não escreve a palavra undefined quando o state.json não nomeia o projeto', () => {
    const processo = processFixture()
    const semNome = {
      ...processo,
      discovery: { ...processo.discovery, project: null },
    } as typeof processo
    const t = texto(carga([undeclaredCheckpointFixture('scout', FORMA_DO_SCOUT)], { process: semNome }))

    expect(t).not.toContain('undefined')
    expect(t).not.toContain('null')
  })
})
