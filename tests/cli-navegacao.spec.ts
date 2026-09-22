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

describe('a página e a meia página, por posições (feature 017, RF-01, D-07, D-08, RN-03)', () => {
  // Sem o mapa `linhas` no contexto, a página anda `alturaVisivel` posições:
  // é a queda definida para toda chamada que constrói o contexto como esta
  // suíte sempre construiu.
  it('`pagina-abaixo` avança uma altura visível de posições e move a janela junto', () => {
    const estado = apos(inicial(), 'pagina-abaixo')
    // Vinte posições adiante do título da primeira seção, a três posições
    // por seção, é o segundo item da sétima.
    expect(estado.secaoSelecionada).toBe(sectionOrder()[6])
    expect(estado.itemSelecionado).toBe(1)
    expect(estado.primeiraLinhaVisivel).toBe(20)
  })

  it('`pagina-acima` desfaz o que `pagina-abaixo` fez, e para na primeira posição e no topo', () => {
    const voltado = apos(inicial(), 'pagina-abaixo', 'pagina-acima')
    expect(voltado.secaoSelecionada).toBe(sectionOrder()[0])
    expect(voltado.itemSelecionado).toBeNull()
    expect(voltado.primeiraLinhaVisivel).toBe(0)
    expect(apos(voltado, 'pagina-acima')).toEqual(voltado)
  })

  it('a seleção fica presa à última posição, e a janela segue andando até o fundo', () => {
    // Trinta e três posições e vinte por página: a segunda página já leva a
    // seleção ao fim; a janela anda uma altura por página, e só para no fundo.
    const noFim = apos(inicial(), 'pagina-abaixo', 'pagina-abaixo', 'pagina-abaixo')
    expect(noFim.secaoSelecionada).toBe(sectionOrder()[sectionOrder().length - 1])
    expect(noFim.itemSelecionado).toBe(1)
    expect(noFim.primeiraLinhaVisivel).toBe(60)
    const presa = apos(noFim, ...Array<TeclaNomeada>(9).fill('pagina-abaixo'))
    expect(presa.primeiraLinhaVisivel).toBe(200 - 20)
    expect(presa.secaoSelecionada).toBe(noFim.secaoSelecionada)
    expect(presa.itemSelecionado).toBe(noFim.itemSelecionado)
  })

  it('num quadro de três janelas, três `pagina-abaixo` chegam ao fim e o quarto não muda nada', () => {
    const tresJanelas = contexto({ alturaTotal: 33, alturaVisivel: 11 })
    let estado = inicial()
    for (let vez = 0; vez < 3; vez += 1) estado = navegar(estado, 'pagina-abaixo', tresJanelas).estado
    expect(estado.secaoSelecionada).toBe(sectionOrder()[sectionOrder().length - 1])
    expect(estado.itemSelecionado).toBe(1)
    expect(estado.primeiraLinhaVisivel).toBe(33 - 11)
    expect(navegar(estado, 'pagina-abaixo', tresJanelas).estado).toEqual(estado)
  })

  it('a meia página anda metade da altura visível, e duas equivalem a uma página quando a altura é par', () => {
    const meia = apos(inicial(), 'meia-pagina-abaixo')
    expect(meia.primeiraLinhaVisivel).toBe(10)
    expect(apos(meia, 'meia-pagina-abaixo')).toEqual(apos(inicial(), 'pagina-abaixo'))
    expect(apos(meia, 'meia-pagina-acima')).toEqual(inicial())
  })

  it('sem posição navegável, nada muda', () => {
    const vazio = contexto({ secoes: [], itens: new Map() })
    for (const tecla of ['pagina-abaixo', 'pagina-acima', 'meia-pagina-abaixo', 'meia-pagina-acima'] as const) {
      expect(navegar(inicial(), tecla, vazio).estado, tecla).toEqual(inicial())
    }
  })
})

describe('a página pelo mapa de linhas (feature 017, RF-02, D-07)', () => {
  /**
   * O mapa como o compositor o entrega: cada seção com o título numa linha,
   * dois itens e uma linha vazia depois; o primeiro item da primeira seção
   * ocupa duas linhas, como um item com dado secundário.
   * @param fechadas - as seções cujos itens não estão na tela.
   * @returns o mapa e a altura do quadro que ele descreve.
   */
  function mapa(fechadas: readonly SectionName[] = []): Pick<ContextoDeNavegacao, 'linhas' | 'alturaTotal'> {
    const linhas = new Map<SectionName, { titulo: number; itens: number[] }>()
    let linha = 0
    sectionOrder().forEach((nome, indice) => {
      const titulo = linha
      linha += 1
      const itens: number[] = []
      if (!fechadas.includes(nome)) {
        for (let item = 0; item < 2; item += 1) {
          itens.push(linha)
          linha += indice === 0 && item === 0 ? 2 : 1
        }
      }
      linhas.set(nome, { titulo, itens })
      linha += 1
    })
    return { linhas, alturaTotal: linha }
  }

  const porLinhas = contexto({ alturaVisivel: 8, ...mapa() })

  it('o alvo é a primeira posição cuja linha alcança uma janela abaixo, e não a posição a uma janela de distância', () => {
    // Do título da primeira seção, linha 0, a oitava linha é a vazia depois
    // da segunda seção: a primeira posição a partir dela é o título da
    // terceira, na linha 9. Por posições, seria o segundo item da terceira.
    const estado = navegar(inicial(), 'pagina-abaixo', porLinhas).estado
    expect(estado.secaoSelecionada).toBe(sectionOrder()[2])
    expect(estado.itemSelecionado).toBeNull()
    expect(estado.primeiraLinhaVisivel).toBe(8)
  })

  it('a página acima é simétrica: a última posição cuja linha está uma janela acima', () => {
    const noFim = navegar(inicial(), 'fim', porLinhas).estado
    const estado = navegar(noFim, 'pagina-acima', porLinhas).estado
    // O último item mora na linha 43; oito acima é a 35, que é o segundo
    // item da nona seção.
    expect(estado.secaoSelecionada).toBe(sectionOrder()[8])
    expect(estado.itemSelecionado).toBe(1)
    expect(estado.primeiraLinhaVisivel).toBe(porLinhas.alturaTotal - 8 - 8)
  })

  it('a meia página usa metade da altura, e duas equivalem a uma página quando a altura é par', () => {
    const meia = navegar(inicial(), 'meia-pagina-abaixo', porLinhas).estado
    expect(meia.secaoSelecionada).toBe(sectionOrder()[1])
    expect(meia.itemSelecionado).toBeNull()
    expect(meia.primeiraLinhaVisivel).toBe(4)
    expect(navegar(meia, 'meia-pagina-abaixo', porLinhas).estado).toEqual(
      navegar(inicial(), 'pagina-abaixo', porLinhas).estado,
    )
  })

  it('com as seções fechadas, a página anda pelos títulos', () => {
    const fechadas = contexto({ alturaVisivel: 8, ...mapa(sectionOrder()) })
    let estado = inicial(sectionOrder())
    const visitadas: Array<number | null> = []
    for (let vez = 0; vez < 3; vez += 1) {
      estado = navegar(estado, 'pagina-abaixo', fechadas).estado
      visitadas.push(estado.itemSelecionado)
      expect(estado.itemSelecionado).toBeNull()
    }
    expect(estado.secaoSelecionada).toBe(sectionOrder()[sectionOrder().length - 1])
    expect(visitadas).toEqual([null, null, null])
  })

  it('os títulos a uma janela de distância são o quarto e o oitavo, a duas linhas cada', () => {
    const fechadas = contexto({ alturaVisivel: 8, ...mapa(sectionOrder()) })
    const primeiro = navegar(inicial(sectionOrder()), 'pagina-abaixo', fechadas).estado
    expect(primeiro.secaoSelecionada).toBe(sectionOrder()[4])
    expect(navegar(primeiro, 'pagina-abaixo', fechadas).estado.secaoSelecionada).toBe(sectionOrder()[8])
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
      'pagina-acima',
      'pagina-abaixo',
      'meia-pagina-acima',
      'meia-pagina-abaixo',
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
