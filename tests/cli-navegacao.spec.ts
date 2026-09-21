/**
 * Suíte da máquina de navegação (T009, feature 014, D-06).
 *
 * Uma asserção por linha da tabela de `interfaces/teclado.md`, de modo que
 * trocar uma tecla faça esta suíte falhar nomeando a tecla trocada. A máquina
 * recebe a tecla JÁ RECONHECIDA e devolve estado novo mais efeito nomeado: ela
 * não executa coisa alguma, e é isso que a torna conferível sem terminal.
 */

import { describe, expect, it } from 'vitest'
import type { ContextoDeNavegacao } from '../src/cli/navegacao.ts'
import { estadoInicial, navegar } from '../src/cli/navegacao.ts'
import type { EstadoDeNavegacao, TeclaNomeada } from '../src/cli/tipos.ts'
import { sectionOrder } from '../src/webview/domain/sections.ts'
import type { SectionName } from '../src/webview/domain/types.ts'
import { COLLAPSIBLE_SECTIONS } from '../src/webview/domain/types.ts'

/** Um contexto em que toda seção tem dois itens navegáveis. */
function contexto(partes: Partial<ContextoDeNavegacao> = {}): ContextoDeNavegacao {
  return {
    secoes: sectionOrder(),
    itens: new Map(sectionOrder().map((nome) => [nome, 2] as const)),
    alturaTotal: 200,
    alturaVisivel: 20,
    ...partes,
  }
}

/** O estado inicial sobre esse contexto, sem seção alguma fechada. */
function inicial(fechadas: readonly SectionName[] = []): EstadoDeNavegacao {
  return estadoInicial(fechadas, contexto())
}

/** O estado depois de uma tecla, descartando o efeito. */
function apos(estado: EstadoDeNavegacao, ...teclas: TeclaNomeada[]): EstadoDeNavegacao {
  return teclas.reduce((atual, tecla) => navegar(atual, tecla, contexto()).estado, estado)
}

describe('o estado inicial', () => {
  it('nasce na primeira seção da ordem que o painel fixa', () => {
    expect(inicial().secaoSelecionada).toBe(sectionOrder()[0])
    expect(inicial().itemSelecionado).toBeNull()
  })

  it('nasce com o conjunto de seções fechadas que a tela decidiu', () => {
    const estado = inicial(['history', 'bugs'])
    expect([...estado.secoesFechadas].sort()).toEqual(['bugs', 'history'])
  })

  it('nasce sem ajuda visível e no topo', () => {
    expect(inicial().ajudaVisivel).toBe(false)
    expect(inicial().primeiraLinhaVisivel).toBe(0)
  })
})

describe('mover a seleção entre as linhas navegáveis', () => {
  it('`abaixo` desce do título da seção para o primeiro item', () => {
    const estado = apos(inicial(), 'abaixo')
    expect(estado.secaoSelecionada).toBe(sectionOrder()[0])
    expect(estado.itemSelecionado).toBe(0)
  })

  it('`abaixo` atravessa a fronteira da seção quando os itens acabam', () => {
    const estado = apos(inicial(), 'abaixo', 'abaixo', 'abaixo')
    expect(estado.secaoSelecionada).toBe(sectionOrder()[1])
    expect(estado.itemSelecionado).toBeNull()
  })

  it('`acima` desfaz exatamente o que `abaixo` fez', () => {
    const descido = apos(inicial(), 'abaixo', 'abaixo', 'abaixo')
    const voltado = apos(descido, 'acima', 'acima', 'acima')
    expect(voltado.secaoSelecionada).toBe(inicial().secaoSelecionada)
    expect(voltado.itemSelecionado).toBeNull()
  })

  it('`acima` no topo fica no topo, sem dar a volta', () => {
    expect(apos(inicial(), 'acima').itemSelecionado).toBeNull()
    expect(apos(inicial(), 'acima').secaoSelecionada).toBe(sectionOrder()[0])
  })

  it('seção fechada não oferece item algum à travessia', () => {
    const estado = apos(inicial(sectionOrder()), 'abaixo')
    expect(estado.secaoSelecionada).toBe(sectionOrder()[1])
    expect(estado.itemSelecionado).toBeNull()
  })
})

describe('fechar e abrir a seção sob a seleção', () => {
  it('`fechar-secao` fecha a seção selecionada', () => {
    expect(apos(inicial(), 'fechar-secao').secoesFechadas.has(sectionOrder()[0])).toBe(true)
  })

  it('fechar com um item selecionado devolve a seleção ao título', () => {
    const estado = apos(inicial(), 'abaixo', 'fechar-secao')
    expect(estado.itemSelecionado).toBeNull()
  })

  it('`abrir-secao` reabre a mesma seção', () => {
    const estado = apos(inicial(), 'fechar-secao', 'abrir-secao')
    expect(estado.secoesFechadas.has(sectionOrder()[0])).toBe(false)
  })
})

describe('saltar de seção em seção', () => {
  it('`proxima-secao` vai para o título da seguinte', () => {
    const estado = apos(inicial(), 'proxima-secao')
    expect(estado.secaoSelecionada).toBe(sectionOrder()[1])
    expect(estado.itemSelecionado).toBeNull()
  })

  it('`secao-anterior` volta para o título da anterior', () => {
    const estado = apos(inicial(), 'proxima-secao', 'proxima-secao', 'secao-anterior')
    expect(estado.secaoSelecionada).toBe(sectionOrder()[1])
  })

  it('o salto dá a volta nas duas pontas', () => {
    const ultima = sectionOrder()[sectionOrder().length - 1]
    expect(apos(inicial(), 'secao-anterior').secaoSelecionada).toBe(ultima)
    const noFim = apos(inicial(), 'secao-anterior')
    expect(apos(noFim, 'proxima-secao').secaoSelecionada).toBe(sectionOrder()[0])
  })
})

describe('as duas ações globais', () => {
  it('`abrir-tudo` não deixa seção fechada alguma', () => {
    expect(apos(inicial(sectionOrder()), 'abrir-tudo').secoesFechadas.size).toBe(0)
  })

  it('`fechar-tudo` fecha os cartões, e a faixa de bloqueio não é cartão', () => {
    const estado = apos(inicial(), 'fechar-tudo')
    expect([...estado.secoesFechadas].sort()).toEqual([...COLLAPSIBLE_SECTIONS].sort())
    expect(estado.secoesFechadas.has('blocking')).toBe(false)
  })
})

describe('a ajuda', () => {
  it('`ajuda` mostra e esconde pelo mesmo gesto', () => {
    expect(apos(inicial(), 'ajuda').ajudaVisivel).toBe(true)
    expect(apos(inicial(), 'ajuda', 'ajuda').ajudaVisivel).toBe(false)
  })
})

describe('o topo e o fim', () => {
  it('`topo` leva a seleção e o deslocamento ao começo', () => {
    const longe = apos(inicial(), 'proxima-secao', 'proxima-secao', 'abaixo')
    const estado = apos(longe, 'topo')
    expect(estado.secaoSelecionada).toBe(sectionOrder()[0])
    expect(estado.itemSelecionado).toBeNull()
    expect(estado.primeiraLinhaVisivel).toBe(0)
  })

  it('`fim` leva ao último item navegável e ao fim do deslocamento', () => {
    const estado = apos(inicial(), 'fim')
    expect(estado.secaoSelecionada).toBe(sectionOrder()[sectionOrder().length - 1])
    expect(estado.itemSelecionado).toBe(1)
    expect(estado.primeiraLinhaVisivel).toBe(200 - 20)
  })

  it('quadro que cabe na janela não desloca coisa alguma', () => {
    const pequeno = contexto({ alturaTotal: 10, alturaVisivel: 40 })
    expect(navegar(inicial(), 'fim', pequeno).estado.primeiraLinhaVisivel).toBe(0)
  })
})

describe('os efeitos nomeados, que a máquina não executa', () => {
  const PARES: Array<[TeclaNomeada, string]> = [
    ['reler', 'reler'],
    ['confirmar', 'abrir-artefato'],
    ['suspender', 'suspender'],
    ['sair', 'sair'],
  ]

  for (const [tecla, efeito] of PARES) {
    it(`\`${tecla}\` emite \`${efeito}\``, () => {
      expect(navegar(inicial(), tecla, contexto()).efeito).toBe(efeito)
    })
  }

  it('toda tecla de movimento emite `nenhum`', () => {
    for (const tecla of [
      'acima',
      'abaixo',
      'fechar-secao',
      'abrir-secao',
      'proxima-secao',
      'secao-anterior',
      'abrir-tudo',
      'fechar-tudo',
      'ajuda',
      'topo',
      'fim',
    ] as TeclaNomeada[]) {
      expect(navegar(inicial(), tecla, contexto()).efeito, tecla).toBe('nenhum')
    }
  })
})

describe('a máquina não guarda nada', () => {
  it('o estado recebido não é alterado', () => {
    const antes = inicial()
    navegar(antes, 'fechar-tudo', contexto())
    expect(antes.secoesFechadas.size).toBe(0)
  })
})
