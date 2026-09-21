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
import { SECAO_DE_VERSOES } from '../src/cli/tipos.ts'
import type { EstadoDeNavegacao, TeclaNomeada } from '../src/cli/tipos.ts'
import { ajustarDeslocamento } from '../src/cli/quadro/medidas.ts'
import { secoesDoTerminal } from '../src/cli/quadro/index.ts'
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
    // Disposição (feature 016, RF-18): a ação global alcança também a seção
    // que é só do terminal. Os cartões continuam saindo da lista do painel, e
    // a faixa de bloqueio continua de fora, que é a regra que o caso prende.
    const estado = apos(inicial(), 'fechar-tudo')
    expect([...estado.secoesFechadas].sort()).toEqual([...COLLAPSIBLE_SECTIONS, SECAO_DE_VERSOES].sort())
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

describe('a décima segunda seção, que é só do terminal (feature 016, RF-18, D-15)', () => {
  /** O contexto como o compositor o entrega: as onze, e a de versões ao fim. */
  function comVersoes(partes: Partial<ContextoDeNavegacao> = {}): ContextoDeNavegacao {
    return {
      secoes: secoesDoTerminal(),
      itens: new Map(secoesDoTerminal().map((nome) => [nome, 2] as const)),
      alturaTotal: 100,
      alturaVisivel: 23,
      ...partes,
    }
  }

  it('a ordem navegável é a do painel, intocada, com a seção de versões depois', () => {
    expect(secoesDoTerminal().slice(0, -1)).toEqual([...sectionOrder()])
    expect(secoesDoTerminal().at(-1)).toBe(SECAO_DE_VERSOES)
    expect(secoesDoTerminal()).toHaveLength(12)
  })

  it('o salto de seção passa pelas doze e volta à primeira', () => {
    let estado = estadoInicial([], comVersoes())
    const visitadas = [estado.secaoSelecionada]
    for (let passo = 0; passo < 12; passo += 1) {
      estado = navegar(estado, 'proxima-secao', comVersoes()).estado
      visitadas.push(estado.secaoSelecionada)
    }
    expect(visitadas.slice(0, 12)).toEqual([...secoesDoTerminal()])
    expect(visitadas[12]).toBe(secoesDoTerminal()[0])
  })

  it('o salto para trás, da primeira, cai na de versões', () => {
    const estado = navegar(estadoInicial([], comVersoes()), 'secao-anterior', comVersoes()).estado
    expect(estado.secaoSelecionada).toBe(SECAO_DE_VERSOES)
  })

  it('ela se fecha e se abre pelas teclas de sempre, e `abrir-tudo` a alcança', () => {
    const nela = { ...estadoInicial([], comVersoes()), secaoSelecionada: SECAO_DE_VERSOES }
    const fechada = navegar(nela, 'fechar-secao', comVersoes()).estado
    expect(fechada.secoesFechadas.has(SECAO_DE_VERSOES)).toBe(true)
    expect(navegar(fechada, 'abrir-secao', comVersoes()).estado.secoesFechadas.has(SECAO_DE_VERSOES)).toBe(false)
    expect(navegar(fechada, 'abrir-tudo', comVersoes()).estado.secoesFechadas.size).toBe(0)
  })

  it('`fim` leva ao último item dela', () => {
    const estado = navegar(estadoInicial([], comVersoes()), 'fim', comVersoes()).estado
    expect(estado.secaoSelecionada).toBe(SECAO_DE_VERSOES)
    expect(estado.itemSelecionado).toBe(1)
  })
})

describe('a janela uma linha menor, por causa da linha de estado (feature 016, D-17, D-24)', () => {
  it('`fim` desloca até o fundo da janela ÚTIL, e o fim do quadro fica alcançável', () => {
    const cheia = contexto({ alturaTotal: 100, alturaVisivel: 24 })
    const util = contexto({ alturaTotal: 100, alturaVisivel: 23 })
    expect(navegar(inicial(), 'fim', cheia).estado.primeiraLinhaVisivel).toBe(76)
    expect(navegar(inicial(), 'fim', util).estado.primeiraLinhaVisivel).toBe(77)
  })
})

describe('o ajuste de deslocamento por bloco (feature 016, D-19)', () => {
  it('sem bloco declarado, nenhuma chamada de antes muda de resultado', () => {
    for (const [indice, primeira] of [[0, 0], [9, 0], [10, 0], [50, 45], [99, 0]] as const) {
      expect(ajustarDeslocamento(indice, primeira, 10, 100)).toBe(
        ajustarDeslocamento(indice, primeira, 10, 100, 1),
      )
    }
    expect(ajustarDeslocamento(10, 0, 10, 100)).toBe(1)
  })

  it('o último item visível rola o bastante para mostrar também o dado secundário dele', () => {
    expect(ajustarDeslocamento(9, 0, 10, 100, 2)).toBe(1)
    expect(ajustarDeslocamento(9, 0, 10, 100, 3)).toBe(2)
  })

  it('bloco que já cabe na janela não desloca nada', () => {
    expect(ajustarDeslocamento(4, 0, 10, 100, 3)).toBe(0)
  })

  it('bloco maior que a janela cede à linha principal, que nunca sai da tela', () => {
    const novo = ajustarDeslocamento(20, 0, 5, 100, 9)
    expect(novo).toBeLessThanOrEqual(20)
    expect(novo + 5).toBeGreaterThan(20)
  })

  it('o fundo do quadro continua sendo o limite', () => {
    expect(ajustarDeslocamento(99, 0, 10, 100, 4)).toBe(90)
  })
})
