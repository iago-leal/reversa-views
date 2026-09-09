/**
 * The cut of the decomposition for the screen (RF-07, RF-08, RF-11, RN-10,
 * D-13, D-17).
 *
 * O recorte padrão é todas as abertas mais as cinco fechadas mais recentes,
 * com a contagem total à vista e um controle que revela o resto. Recência sai
 * do último evento da ação na trilha; faltando evento, vale a ordem do arquivo,
 * e a linha declara que a data não foi registrada em vez de exibir campo vazio.
 *
 * Revelar o resto é estado do componente, e não preferência guardada: é gesto
 * de momento, como a lista de anomalias que a feature 003 já tratou assim.
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
 * oito fechadas. É o caso que separa recência por evento de recência por
 * posição no arquivo.
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

describe('o recorte padrão (RF-11)', () => {
  it('mostra todas as abertas mais as cinco fechadas mais recentes', () => {
    const vista = decompositionView(DEZ, TRILHA_DEZ, false)

    expect(vista.linhas.map((l) => l.acao.id)).toEqual([
      'T004',
      'T005',
      'T006',
      'T007',
      'T008',
      'T009',
      'T010',
    ])
  })

  it('o corte das fechadas é o número que o módulo declara', () => {
    expect(CLOSED_CUT).toBe(5)
  })

  it('desenha as linhas na ordem do arquivo, e não na ordem de recência', () => {
    const ids = decompositionView(DEZ, TRILHA_DEZ, false).linhas.map((l) => l.acao.id)
    expect([...ids].sort()).toEqual(ids)
  })

  it('informa a contagem total e quantas ficaram de fora', () => {
    const vista = decompositionView(DEZ, TRILHA_DEZ, false)
    expect(vista.total).toBe(10)
    expect(vista.ocultas).toBe(3)
  })

  it('com o caso do critério de aceite, sessenta e uma ações e quatro abertas, mostra nove', () => {
    const acoes = Array.from({ length: 61 }, (_, i) =>
      acao(`T${String(i + 1).padStart(3, '0')}`, i >= 4),
    )
    const vista = decompositionView(decomposicao(acoes), VAZIA, false)

    expect(vista.linhas).toHaveLength(9)
    expect(vista.total).toBe(61)
    expect(vista.ocultas).toBe(52)
  })

  it('com menos fechadas que o corte, mostra todas sem esconder nada', () => {
    const vista = decompositionView(
      decomposicao([acao('T001', true), acao('T002', false)]),
      VAZIA,
      false,
    )
    expect(vista.linhas).toHaveLength(2)
    expect(vista.ocultas).toBe(0)
  })
})

describe('recência (RN-10)', () => {
  it('prefere a fechada com evento mais recente na trilha', () => {
    const mostradas = decompositionView(DEZ, TRILHA_DEZ, false).linhas.map((l) => l.acao.id)
    expect(mostradas).toContain('T010')
    expect(mostradas).not.toContain('T003')
  })

  it('posiciona pela ordem do arquivo a fechada sem evento, atrás das que têm', () => {
    // T001 e T002 não têm evento; T003 tem, ainda que o mais antigo. Com seis
    // fechadas com evento, nenhuma das duas sem evento entra no corte.
    const mostradas = decompositionView(DEZ, TRILHA_DEZ, false).linhas.map((l) => l.acao.id)
    expect(mostradas).not.toContain('T001')
    expect(mostradas).not.toContain('T002')
  })

  it('sem trilha alguma, a ordem do arquivo decide, e vencem as últimas', () => {
    const vista = decompositionView(DEZ, VAZIA, false)
    expect(vista.linhas.map((l) => l.acao.id)).toEqual([
      'T004',
      'T005',
      'T006',
      'T007',
      'T008',
      'T009',
      'T010',
    ])
  })

  it('declara ausente o momento da ação sem evento, em vez de campo vazio', () => {
    const vista = decompositionView(DEZ, TRILHA_DEZ, true)
    const semEvento = vista.linhas.find((l) => l.acao.id === 'T001')
    const comEvento = vista.linhas.find((l) => l.acao.id === 'T003')

    expect(semEvento?.ultimoEvento).toBeNull()
    expect(comEvento?.ultimoEvento).toBe('2026-09-09T10:00:00Z')
  })

  it('traz os arquivos tocados de cada ação com evento (RF-08)', () => {
    const vista = decompositionView(DEZ, TRILHA_DEZ, true)
    expect(vista.linhas.find((l) => l.acao.id === 'T003')?.arquivos).toEqual(['src/c.ts'])
    expect(vista.linhas.find((l) => l.acao.id === 'T001')?.arquivos).toEqual([])
  })

  it('o momento viaja em forma absoluta, convertido só na tela', () => {
    const vista = decompositionView(DEZ, TRILHA_DEZ, true)
    const linha = vista.linhas.find((l) => l.acao.id === 'T010')
    expect(linha?.ultimoEvento).toBe('2026-09-09T15:00:00Z')
  })
})

describe('a próxima ação a executar (RF-07)', () => {
  it('é a primeira aberta na ordem do arquivo', () => {
    const vista = decompositionView(DEZ, TRILHA_DEZ, false)
    expect(vista.proxima).toBe('T004')
    expect(vista.linhas.filter((l) => l.proxima).map((l) => l.acao.id)).toEqual(['T004'])
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
  })
})

describe('revelar o resto (RF-11, D-17)', () => {
  it('mostra todas as ações, na ordem do arquivo', () => {
    const vista = decompositionView(DEZ, TRILHA_DEZ, true)
    expect(vista.linhas).toHaveLength(10)
    expect(vista.linhas.map((l) => l.acao.id)).toEqual(DEZ.acoes.map((a) => a.id))
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

  it('não altera a decomposição recebida', () => {
    const antes = DEZ.acoes.map((a) => a.id)
    decompositionView(DEZ, TRILHA_DEZ, false)
    expect(DEZ.acoes.map((a) => a.id)).toEqual(antes)
  })
})
