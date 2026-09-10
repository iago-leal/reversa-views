/**
 * Suíte do recorte da decomposição, reescrita pela feature 007 (T014).
 *
 * O que mudou é a ORDEM, e com ela o defeito que a motivou. Até aqui a função
 * selecionava por recência e devolvia na ordem do arquivo, de modo que a lista
 * mostrava as ações certas na ordem errada: quem abria o painel para saber onde
 * o trabalho parou lia primeiro o que foi feito primeiro. D-14 encerra a
 * divergência fazendo uma função só decidir as duas coisas, e o recorte passa a
 * ser prefixo da lista ordenada.
 *
 * A ordem nova, de RN-07, RF-23, RF-24 e RF-25, tem três degraus:
 *
 * 1. As ações ABERTAS encabeçam a lista, na ordem do plano, e a primeira delas
 *    continua sendo a próxima a executar.
 * 2. As FECHADAS vêm depois, do evento mais recente para o mais antigo.
 * 3. Fechada sem instante na trilha vai ao FIM do bloco das fechadas,
 *    preservando entre si a ordem do arquivo.
 *
 * O caso de instantes empatados merece a atenção que recebe aqui: as ações de
 * uma feature são fechadas em lote e carimbadas no mesmo minuto, como se vê na
 * trilha da feature 006, em que dezenas trazem o mesmo instante. Sem ordenação
 * estável a lista mudaria de ordem entre duas leituras idênticas, e defeito
 * intermitente é a pior espécie.
 * @module tests/webview-decomposition-view
 */

import { describe, expect, it } from 'vitest'
import { ProgressContract } from '../src/heranca/reversa-domain/src/index.ts'
import type { ActiveDecomposition, PlanAction } from '../src/domain/types.ts'
import { CLOSED_CUT, decompositionView } from '../src/webview/domain/decomposition-view.ts'

/** Uma ação do plano, com o mínimo que cada caso precisa dizer. */
function acao(id: string, fechada: boolean, extras: Partial<PlanAction> = {}): PlanAction {
  return {
    id,
    descricao: `descrição de ${id}`,
    fase: 'Fase 1, Preparação',
    emenda: false,
    fechada,
    arquivoAlvo: null,
    ...extras,
  }
}

/** Uma decomposição lida com sucesso, sobre as ações dadas. */
function decomposicao(acoes: PlanAction[]): ActiveDecomposition {
  return { lida: true, origem: 'tabela', acoes, divergencia: null }
}

/** Uma trilha, montada pelo mesmo leitor que o host usa. */
function trilha(eventos: Array<{ id: string; ts: string | null; files?: string[] }>) {
  const linhas = eventos.map((evento) =>
    JSON.stringify({
      ts: evento.ts,
      action: evento.id,
      status: 'done',
      files: evento.files ?? [],
    }),
  )
  return ProgressContract.read(`${linhas.join('\n')}\n`)
}

const VAZIA = ProgressContract.read(null)

/**
 * Dez ações, das quais duas abertas, e uma trilha que dá momento a seis das
 * oito fechadas. É o caso que separa recência por evento de posição no arquivo.
 */
const DEZ = decomposicao([
  acao('T001', true),
  acao('T002', true),
  acao('T003', true),
  acao('T004', false),
  acao('T005', true),
  acao('T006', true),
  acao('T007', true),
  acao('T008', true),
  acao('T009', false),
  acao('T010', true),
])

const TRILHA_DEZ = trilha([
  { id: 'T003', ts: '2026-09-09T10:00:00Z', files: ['src/c.ts'] },
  { id: 'T005', ts: '2026-09-09T11:00:00Z' },
  { id: 'T006', ts: '2026-09-09T12:00:00Z' },
  { id: 'T007', ts: '2026-09-09T13:00:00Z' },
  { id: 'T008', ts: '2026-09-09T14:00:00Z' },
  { id: 'T010', ts: '2026-09-09T15:00:00Z' },
])

/** Os identificadores desenhados, na ordem em que a vista os devolveu. */
function ids(decomposition: ActiveDecomposition, trail = TRILHA_DEZ, revelar = false): string[] {
  return decompositionView(decomposition, trail, revelar).linhas.map((linha) => linha.acao.id)
}

describe('a ordem nova: abertas à frente, fechadas por recência (RF-23, RF-24)', () => {
  it('as abertas encabeçam a lista, na ordem do plano', () => {
    expect(ids(DEZ).slice(0, 2)).toEqual(['T004', 'T009'])
  })

  it('nenhuma fechada aparece antes de alguma aberta', () => {
    const linhas = decompositionView(DEZ, TRILHA_DEZ, true).linhas
    const últimaAberta = linhas.reduce((posição, linha, índice) => (linha.acao.fechada ? posição : índice), -1)
    const primeiraFechada = linhas.findIndex((linha) => linha.acao.fechada)
    expect(últimaAberta).toBeLessThan(primeiraFechada)
  })

  it('as fechadas vêm do evento mais recente para o mais antigo', () => {
    const reveladas = decompositionView(DEZ, TRILHA_DEZ, true).linhas.filter((l) => l.acao.fechada)
    const comInstante = reveladas
      .map((linha) => linha.ultimoEvento)
      .filter((instante): instante is string => instante !== null)
    expect(comInstante).toEqual([...comInstante].sort().reverse())
    expect(comInstante[0]).toBe('2026-09-09T15:00:00Z')
  })

  it('a lista inteira, revelada, é exatamente a ordem que RN-07 descreve', () => {
    expect(ids(DEZ, TRILHA_DEZ, true)).toEqual([
      // abertas, na ordem do plano
      'T004',
      'T009',
      // fechadas com instante, da mais recente para a mais antiga
      'T010',
      'T008',
      'T007',
      'T006',
      'T005',
      'T003',
      // fechadas sem instante, ao fim, na ordem do arquivo
      'T001',
      'T002',
    ])
  })

  it('NÃO devolve mais na ordem do arquivo, que era o defeito relatado', () => {
    const desenhados = ids(DEZ, TRILHA_DEZ, true)
    expect(desenhados).not.toEqual([...desenhados].sort())
  })
})

describe('ação sem instante, ao fim do bloco (RF-25, RN-07)', () => {
  it('as duas sem instante aparecem depois de todas as que têm, e na ordem do arquivo', () => {
    const desenhados = ids(DEZ, TRILHA_DEZ, true)
    expect(desenhados.slice(-2)).toEqual(['T001', 'T002'])
    expect(desenhados.indexOf('T001')).toBeGreaterThan(desenhados.indexOf('T003'))
  })

  it('a linha continua declarando que o momento não foi registrado', () => {
    const vista = decompositionView(DEZ, TRILHA_DEZ, true)
    expect(vista.linhas.find((l) => l.acao.id === 'T001')?.ultimoEvento).toBeNull()
    expect(vista.linhas.find((l) => l.acao.id === 'T003')?.ultimoEvento).toBe('2026-09-09T10:00:00Z')
  })

  it('aberta sem instante não é empurrada para o fim: seu bloco é a ordem do plano', () => {
    // As abertas se ordenam pelo plano, e não por recência, porque a primeira
    // delas é a próxima a executar. Instante não as reordena.
    const comEventoNaAberta = trilha([
      { id: 'T009', ts: '2026-09-09T16:00:00Z' },
      { id: 'T010', ts: '2026-09-09T15:00:00Z' },
    ])
    expect(ids(DEZ, comEventoNaAberta, true).slice(0, 2)).toEqual(['T004', 'T009'])
  })

  it('sem trilha alguma, as fechadas ficam na ordem do arquivo, atrás das abertas', () => {
    expect(ids(DEZ, VAZIA, true)).toEqual([
      'T004',
      'T009',
      'T001',
      'T002',
      'T003',
      'T005',
      'T006',
      'T007',
      'T008',
      'T010',
    ])
  })
})

describe('instantes empatados, que só passam com ordenação estável (RN-07)', () => {
  /** Quatro fechadas carimbadas no mesmo minuto, como o fechamento em lote faz. */
  const LOTE = trilha([
    { id: 'T003', ts: '2026-09-09T12:00:00Z' },
    { id: 'T005', ts: '2026-09-09T12:00:00Z' },
    { id: 'T006', ts: '2026-09-09T12:00:00Z' },
    { id: 'T007', ts: '2026-09-09T12:00:00Z' },
    { id: 'T010', ts: '2026-09-09T15:00:00Z' },
  ])

  it('entre iguais, preserva a ordem do arquivo', () => {
    expect(ids(DEZ, LOTE, true)).toEqual([
      'T004',
      'T009',
      'T010',
      'T003',
      'T005',
      'T006',
      'T007',
      'T001',
      'T002',
      'T008',
    ])
  })

  it('duas leituras idênticas dão a mesma ordem, e não uma ordem intermitente', () => {
    const primeira = ids(DEZ, LOTE, true)
    for (let vez = 0; vez < 20; vez += 1) {
      expect(ids(DEZ, LOTE, true)).toEqual(primeira)
    }
  })

  it('com a trilha inteira empatada, a lista das fechadas é a ordem do arquivo', () => {
    const tudoIgual = trilha(
      DEZ.acoes.filter((a) => a.fechada).map((a) => ({ id: a.id, ts: '2026-09-09T12:00:00Z' })),
    )
    expect(ids(DEZ, tudoIgual, true)).toEqual([
      'T004',
      'T009',
      'T001',
      'T002',
      'T003',
      'T005',
      'T006',
      'T007',
      'T008',
      'T010',
    ])
  })
})

describe('o recorte padrão, que agora exibe na ordem em que seleciona (RF-26)', () => {
  it('mostra todas as abertas mais as cinco fechadas mais recentes, nessa ordem', () => {
    expect(ids(DEZ)).toEqual(['T004', 'T009', 'T010', 'T008', 'T007', 'T006', 'T005'])
  })

  it('o corte das fechadas é o número que o módulo declara', () => {
    expect(CLOSED_CUT).toBe(5)
  })

  it('informa a contagem total e quantas ficaram de fora', () => {
    const vista = decompositionView(DEZ, TRILHA_DEZ, false)
    expect(vista.total).toBe(10)
    expect(vista.ocultas).toBe(3)
  })

  it('a ordem das linhas comuns às duas listas é a mesma antes e depois de revelar', () => {
    // É a garantia de RF-26, e a que fecha o defeito: revelar o resto não
    // pode reordenar o que já estava na tela.
    const recortadas = ids(DEZ, TRILHA_DEZ, false)
    const reveladas = ids(DEZ, TRILHA_DEZ, true)
    expect(reveladas.filter((id) => recortadas.includes(id))).toEqual(recortadas)
  })

  it('o recorte é PREFIXO da lista revelada em cada bloco, e não uma segunda seleção', () => {
    const reveladas = ids(DEZ, TRILHA_DEZ, true)
    const recortadas = ids(DEZ, TRILHA_DEZ, false)
    const abertas = reveladas.filter((id) => !recortadas.includes(id))
    expect(abertas).toEqual(['T003', 'T001', 'T002'])
  })

  it('com o caso do critério de aceite, sessenta e uma ações e quatro abertas, mostra nove', () => {
    const acoes = Array.from({ length: 61 }, (_, i) =>
      acao(`T${String(i + 1).padStart(3, '0')}`, i >= 4),
    )
    const vista = decompositionView(decomposicao(acoes), VAZIA, false)

    expect(vista.linhas).toHaveLength(9)
    expect(vista.total).toBe(61)
    expect(vista.ocultas).toBe(52)
    // As quatro abertas encabeçam, como RF-24 exige.
    expect(vista.linhas.slice(0, 4).every((linha) => !linha.acao.fechada)).toBe(true)
  })

  it('com menos fechadas que o corte, mostra todas sem esconder nada', () => {
    const vista = decompositionView(
      decomposicao([acao('T001', true), acao('T002', false)]),
      VAZIA,
      false,
    )
    expect(vista.linhas.map((l) => l.acao.id)).toEqual(['T002', 'T001'])
    expect(vista.ocultas).toBe(0)
  })

  it('sem aberta alguma, o recorte é só o bloco das fechadas', () => {
    const todasFechadas = decomposicao(
      Array.from({ length: 8 }, (_, i) => acao(`T00${i + 1}`, true)),
    )
    const vista = decompositionView(todasFechadas, VAZIA, false)
    expect(vista.linhas).toHaveLength(CLOSED_CUT)
    expect(vista.ocultas).toBe(3)
  })
})

describe('recência, medida pelo último evento de cada ação', () => {
  it('prefere a fechada com evento mais recente na trilha', () => {
    const mostradas = ids(DEZ)
    expect(mostradas).toContain('T010')
    expect(mostradas).not.toContain('T003')
  })

  it('a fechada sem evento não entra no corte enquanto houver fechada com evento', () => {
    const mostradas = ids(DEZ)
    expect(mostradas).not.toContain('T001')
    expect(mostradas).not.toContain('T002')
  })

  it('o último evento é o mais recente da ação, e não o primeiro que a trilha traz', () => {
    const comRepeticao = trilha([
      { id: 'T010', ts: '2026-09-09T09:00:00Z' },
      { id: 'T010', ts: '2026-09-09T18:00:00Z' },
      { id: 'T008', ts: '2026-09-09T14:00:00Z' },
    ])
    const vista = decompositionView(DEZ, comRepeticao, true)
    expect(vista.linhas.find((l) => l.acao.id === 'T010')?.ultimoEvento).toBe(
      '2026-09-09T18:00:00Z',
    )
    expect(ids(DEZ, comRepeticao, true).indexOf('T010')).toBeLessThan(
      ids(DEZ, comRepeticao, true).indexOf('T008'),
    )
  })

  it('traz os arquivos tocados de cada ação com evento (RF-08)', () => {
    const vista = decompositionView(DEZ, TRILHA_DEZ, true)
    expect(vista.linhas.find((l) => l.acao.id === 'T003')?.arquivos).toEqual(['src/c.ts'])
    expect(vista.linhas.find((l) => l.acao.id === 'T001')?.arquivos).toEqual([])
  })

  it('o momento viaja em forma absoluta, convertido só na tela', () => {
    const vista = decompositionView(DEZ, TRILHA_DEZ, true)
    expect(vista.linhas.find((l) => l.acao.id === 'T010')?.ultimoEvento).toBe(
      '2026-09-09T15:00:00Z',
    )
  })
})

describe('a próxima ação a executar (RF-07, RF-24)', () => {
  it('é a primeira aberta na ordem do arquivo, e agora é a primeira LINHA', () => {
    const vista = decompositionView(DEZ, TRILHA_DEZ, false)
    expect(vista.proxima).toBe('T004')
    expect(vista.linhas[0].acao.id).toBe('T004')
    expect(vista.linhas.filter((l) => l.proxima).map((l) => l.acao.id)).toEqual(['T004'])
  })

  it('a ordem nova não muda quem é a próxima, ainda que ela mude quem aparece antes', () => {
    // A próxima sai da ordem do PLANO, e não da trilha: uma aberta com evento
    // recente não passa à frente de outra aberta anterior no arquivo.
    const eventoNaSegundaAberta = trilha([{ id: 'T009', ts: '2026-09-09T23:00:00Z' }])
    expect(decompositionView(DEZ, eventoNaSegundaAberta, false).proxima).toBe('T004')
  })

  it('é nula quando não resta ação aberta', () => {
    const vista = decompositionView(decomposicao([acao('T001', true)]), VAZIA, false)
    expect(vista.proxima).toBeNull()
    expect(vista.linhas.every((l) => !l.proxima)).toBe(true)
  })

  it('é a emenda aberta quando o corpo está todo fechado (RN-05)', () => {
    const vista = decompositionView(
      decomposicao([acao('T001', true), acao('E001', false, { emenda: true })]),
      VAZIA,
      false,
    )
    expect(vista.proxima).toBe('E001')
    expect(vista.linhas[0].acao.id).toBe('E001')
  })
})

describe('revelar o resto (RF-11, RF-26, D-17)', () => {
  it('mostra todas as ações, sem esconder nenhuma', () => {
    const vista = decompositionView(DEZ, TRILHA_DEZ, true)
    expect(vista.linhas).toHaveLength(10)
    expect([...vista.linhas.map((l) => l.acao.id)].sort()).toEqual(
      [...DEZ.acoes.map((a) => a.id)].sort(),
    )
  })

  it('a contagem total não muda ao revelar', () => {
    expect(decompositionView(DEZ, TRILHA_DEZ, true).total).toBe(10)
    expect(decompositionView(DEZ, TRILHA_DEZ, true).ocultas).toBe(0)
  })
})

describe('ausência e borda', () => {
  it('decomposição não lida devolve vista vazia, sem lançar', () => {
    const vista = decompositionView(
      { lida: false, origem: 'ausente', acoes: [], divergencia: null },
      VAZIA,
      false,
    )
    expect(vista).toEqual({ linhas: [], total: 0, ocultas: 0, proxima: null })
  })

  it('é pura: duas montagens sobre a mesma entrada dão a mesma vista', () => {
    expect(decompositionView(DEZ, TRILHA_DEZ, false)).toEqual(
      decompositionView(DEZ, TRILHA_DEZ, false),
    )
  })

  it('não altera a decomposição recebida, nem a ordem das ações nela', () => {
    const antes = DEZ.acoes.map((a) => a.id)
    decompositionView(DEZ, TRILHA_DEZ, false)
    decompositionView(DEZ, TRILHA_DEZ, true)
    expect(DEZ.acoes.map((a) => a.id)).toEqual(antes)
  })

  it('trilha com evento de ação que não está no plano não derruba nem entra na lista', () => {
    const comIntrusa = trilha([
      { id: 'T999', ts: '2026-09-09T20:00:00Z' },
      { id: 'T010', ts: '2026-09-09T15:00:00Z' },
    ])
    const desenhados = ids(DEZ, comIntrusa, true)
    expect(desenhados).not.toContain('T999')
    expect(desenhados).toHaveLength(10)
  })
})
