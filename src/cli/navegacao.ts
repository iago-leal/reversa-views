/**
 * A máquina de navegação: tecla mais estado, estado novo mais efeito (D-06).
 *
 * Molde do `router.ts` do host, que já é a fronteira de confiança lá: ela
 * recebe a tecla JÁ RECONHECIDA, devolve um estado novo e um efeito NOMEADO, e
 * não executa coisa alguma. Efeito nomeado é testável; chamada direta não é.
 *
 * O conjunto inicial de seções fechadas não é decidido aqui: ele chega de
 * `effectiveCollapsed`, a mesma função que decide o que nasce fechado no
 * painel, para que a primeira impressão no terminal coincida com a primeira
 * impressão no editor.
 *
 * Nada aqui é mutado. O estado recebido atravessa intocado, e o que sai é
 * outro: é o que permite comparar antes e depois numa suíte sem terminal.
 * @module cli/navegacao
 */

import { SECAO_DE_VERSOES } from './tipos.ts'
import type { EstadoDeNavegacao, SecaoDoTerminal, TeclaNomeada, Transicao } from './tipos.ts'
import { COLLAPSIBLE_SECTIONS } from '../webview/domain/types.ts'

/**
 * O que a ação global de fechar alcança: os cartões do painel, pela lista que
 * o painel usa, mais a seção que é só do terminal (feature 016, RF-18).
 *
 * A faixa de bloqueio continua de fora, porque continua fora da lista.
 */
const RECOLHIVEIS: readonly SecaoDoTerminal[] = [...COLLAPSIBLE_SECTIONS, SECAO_DE_VERSOES]

/** O que a máquina precisa saber do quadro para se mover dentro dele. */
export interface ContextoDeNavegacao {
  /** As seções, na ordem que o painel fixa, com a do terminal ao fim. */
  secoes: readonly SecaoDoTerminal[]
  /** Quantos itens navegáveis cada seção tem, fechada ou aberta. */
  itens: ReadonlyMap<SecaoDoTerminal, number>
  /** A altura do quadro inteiro. */
  alturaTotal: number
  /** A altura da janela que o mostra. */
  alturaVisivel: number
  /**
   * Em que linha do quadro inteiro cada posição navegável mora: a do título
   * e a principal de cada item, por seção desenhada (feature 017, D-07).
   *
   * Seção fechada tem `itens: []`, porque os itens dela não estão na tela.
   * Opcional: ausente o mapa, a página anda por posições, e nenhuma chamada
   * de antes muda.
   */
  linhas?: ReadonlyMap<SecaoDoTerminal, { titulo: number; itens: readonly number[] }>
}

/** Uma posição navegável: o título de uma seção, ou um item dentro dela. */
interface Posicao {
  secao: SecaoDoTerminal
  item: number | null
}

/**
 * O estado em que a interface nasce.
 * @param fechadas - o que `effectiveCollapsed` decidiu para esta leitura.
 * @param contexto - as seções do quadro.
 * @returns o estado inicial, na primeira seção e no topo.
 */
export function estadoInicial(
  fechadas: readonly SecaoDoTerminal[],
  contexto: ContextoDeNavegacao,
): EstadoDeNavegacao {
  return {
    secaoSelecionada: contexto.secoes[0],
    itemSelecionado: null,
    secoesFechadas: new Set(fechadas),
    ajudaVisivel: false,
    primeiraLinhaVisivel: 0,
  }
}

/**
 * Toda posição por que a seleção passa, na ordem em que o quadro as desenha.
 *
 * O título de uma seção é sempre uma posição, aberta ou fechada: é o que
 * permite fechar e reabrir uma seção sem perder o lugar. Os itens só entram
 * quando a seção está aberta, porque fechada eles não estão na tela, e uma
 * seleção invisível é um cursor perdido.
 * @param estado - de onde saem as seções fechadas.
 * @param contexto - as seções e as contagens.
 * @returns as posições, em ordem.
 */
function posicoes(estado: EstadoDeNavegacao, contexto: ContextoDeNavegacao): Posicao[] {
  const lista: Posicao[] = []
  for (const secao of contexto.secoes) {
    lista.push({ secao, item: null })
    if (estado.secoesFechadas.has(secao)) continue
    const quantos = contexto.itens.get(secao) ?? 0
    for (let indice = 0; indice < quantos; indice += 1) lista.push({ secao, item: indice })
  }
  return lista
}

/**
 * Onde a seleção corrente está dentro da lista de posições.
 * @param estado - a seleção corrente.
 * @param lista - as posições.
 * @returns o índice, ou zero quando a seleção não existe mais.
 */
function onde(estado: EstadoDeNavegacao, lista: readonly Posicao[]): number {
  const indice = lista.findIndex(
    (posicao) =>
      posicao.secao === estado.secaoSelecionada && posicao.item === estado.itemSelecionado,
  )
  return indice < 0 ? 0 : indice
}

/** O deslocamento máximo de um quadro maior que a janela; zero quando ele cabe. */
function fundo(contexto: ContextoDeNavegacao): number {
  return Math.max(0, contexto.alturaTotal - contexto.alturaVisivel)
}

/** Um estado novo, com a seleção posta numa posição da lista. */
function em(estado: EstadoDeNavegacao, posicao: Posicao): EstadoDeNavegacao {
  return { ...estado, secaoSelecionada: posicao.secao, itemSelecionado: posicao.item }
}

/** Um efeito sem mudança de estado, que é o caso das quatro teclas de ação. */
function apenas(estado: EstadoDeNavegacao, efeito: Transicao['efeito']): Transicao {
  return { estado, efeito }
}

/**
 * Mover a seleção de uma posição, sem dar a volta.
 *
 * Sem volta é deliberado, e a razão é a mesma do paginador: quem segura a
 * seta para baixo espera parar no fim, e não reaparecer no topo tendo perdido
 * de vista onde estava. O salto de seção, esse sim, dá a volta.
 * @param estado - a seleção corrente.
 * @param contexto - as seções e as contagens.
 * @param passo - menos um para cima, mais um para baixo.
 * @returns o estado com a seleção movida.
 */
function mover(
  estado: EstadoDeNavegacao,
  contexto: ContextoDeNavegacao,
  passo: -1 | 1,
): EstadoDeNavegacao {
  const lista = posicoes(estado, contexto)
  if (lista.length === 0) return estado
  const alvo = Math.min(lista.length - 1, Math.max(0, onde(estado, lista) + passo))
  return em(estado, lista[alvo])
}

/**
 * A linha do quadro em que uma posição mora, pelo mapa do contexto.
 * @param posicao - o título ou o item.
 * @param linhas - o mapa que o compositor entregou.
 * @returns a linha, ou nulo quando o mapa não a conhece.
 */
function linhaDe(
  posicao: Posicao,
  linhas: NonNullable<ContextoDeNavegacao['linhas']>,
): number | null {
  const daSecao = linhas.get(posicao.secao)
  if (daSecao === undefined) return null
  return posicao.item === null ? daSecao.titulo : (daSecao.itens[posicao.item] ?? null)
}

/**
 * Decidir aonde uma página leva a seleção (feature 017, D-07).
 *
 * A página é medida em LINHAS e a seleção anda em POSIÇÕES, e um item pode
 * ocupar mais de uma linha. Com o mapa de linhas, o alvo é a primeira posição
 * cuja linha alcança a corrente mais o salto, para baixo, e a última cuja
 * linha não passa da corrente menos o salto, para cima; sem alvo, a ponta.
 * Sem o mapa, a página é o salto em posições, preso às pontas: é o
 * comportamento definido para toda chamada que não o entrega.
 * @param lista - as posições, em ordem.
 * @param indice - onde a seleção está na lista.
 * @param salto - quantas linhas andar; negativo para cima.
 * @param linhas - o mapa de linhas por posição, quando o contexto o tem.
 * @returns o índice da posição alvo na lista.
 */
function alvoDaPagina(
  lista: readonly Posicao[],
  indice: number,
  salto: number,
  linhas: ContextoDeNavegacao['linhas'],
): number {
  const ultimo = lista.length - 1
  const corrente = linhas === undefined ? null : linhaDe(lista[indice], linhas)
  if (linhas === undefined || corrente === null) {
    return Math.min(ultimo, Math.max(0, indice + salto))
  }

  const limite = corrente + salto
  if (salto > 0) {
    const alvo = lista.findIndex((posicao) => {
      const linha = linhaDe(posicao, linhas)
      return linha !== null && linha >= limite
    })
    return alvo < 0 ? ultimo : alvo
  }
  for (let candidato = ultimo; candidato >= 0; candidato -= 1) {
    const linha = linhaDe(lista[candidato], linhas)
    if (linha !== null && linha <= limite) return candidato
  }
  return 0
}

/**
 * Mover a seleção e a janela de uma página, ou de meia (feature 017, D-08).
 *
 * A janela anda junto, presa ao topo e ao fundo, na mesma transição: é o que
 * faz a tela andar uma página em vez de a seleção descer até a borda e a
 * janela ir atrás uma linha. O ajuste de deslocamento do laço vem depois e
 * não move nada quando a seleção já está visível (RN-03).
 * @param estado - a seleção corrente.
 * @param contexto - as posições, as alturas e o mapa de linhas, quando há.
 * @param salto - quantas linhas andar; negativo para cima.
 * @returns o estado com a seleção e a janela movidas; o mesmo, sem posição.
 */
function paginar(
  estado: EstadoDeNavegacao,
  contexto: ContextoDeNavegacao,
  salto: number,
): EstadoDeNavegacao {
  const lista = posicoes(estado, contexto)
  if (lista.length === 0) return estado
  const alvo = alvoDaPagina(lista, onde(estado, lista), salto, contexto.linhas)
  const primeira = Math.min(fundo(contexto), Math.max(0, estado.primeiraLinhaVisivel + salto))
  return { ...em(estado, lista[alvo]), primeiraLinhaVisivel: primeira }
}

/** Metade da altura visível, e nunca menos que uma linha. */
function meiaJanela(contexto: ContextoDeNavegacao): number {
  return Math.max(1, Math.floor(contexto.alturaVisivel / 2))
}

/**
 * Saltar para o título de outra seção, dando a volta nas duas pontas.
 * @param estado - a seleção corrente.
 * @param contexto - as seções.
 * @param passo - menos um para trás, mais um para frente.
 * @returns o estado na seção vizinha.
 */
function saltar(
  estado: EstadoDeNavegacao,
  contexto: ContextoDeNavegacao,
  passo: -1 | 1,
): EstadoDeNavegacao {
  const total = contexto.secoes.length
  const atual = contexto.secoes.indexOf(estado.secaoSelecionada)
  const alvo = (((atual < 0 ? 0 : atual) + passo) % total + total) % total
  return em(estado, { secao: contexto.secoes[alvo], item: null })
}

/**
 * Decidir o que uma tecla faz.
 * @param estado - o estado corrente, que não é alterado.
 * @param tecla - a tecla já reconhecida.
 * @param contexto - as seções, as contagens e as alturas.
 * @returns o estado novo e o efeito nomeado.
 */
export function navegar(
  estado: EstadoDeNavegacao,
  tecla: TeclaNomeada,
  contexto: ContextoDeNavegacao,
): Transicao {
  switch (tecla) {
    case 'acima':
      return apenas(mover(estado, contexto, -1), 'nenhum')
    case 'abaixo':
      return apenas(mover(estado, contexto, 1), 'nenhum')
    case 'fechar-secao': {
      const fechadas = new Set(estado.secoesFechadas)
      fechadas.add(estado.secaoSelecionada)
      return apenas({ ...estado, secoesFechadas: fechadas, itemSelecionado: null }, 'nenhum')
    }
    case 'abrir-secao': {
      const fechadas = new Set(estado.secoesFechadas)
      fechadas.delete(estado.secaoSelecionada)
      return apenas({ ...estado, secoesFechadas: fechadas }, 'nenhum')
    }
    case 'proxima-secao':
      return apenas(saltar(estado, contexto, 1), 'nenhum')
    case 'secao-anterior':
      return apenas(saltar(estado, contexto, -1), 'nenhum')
    case 'abrir-tudo':
      return apenas({ ...estado, secoesFechadas: new Set() }, 'nenhum')
    case 'fechar-tudo':
      // A faixa de bloqueio não é cartão e não entra: a RN-03 do painel
      // proíbe ação global que esconda o que aguarda decisão do usuário, e a
      // lista que a exclui é a mesma que o painel usa.
      return apenas(
        {
          ...estado,
          secoesFechadas: new Set(RECOLHIVEIS),
          itemSelecionado: RECOLHIVEIS.includes(estado.secaoSelecionada)
            ? null
            : estado.itemSelecionado,
        },
        'nenhum',
      )
    case 'ajuda':
      return apenas({ ...estado, ajudaVisivel: !estado.ajudaVisivel }, 'nenhum')
    case 'topo': {
      const lista = posicoes(estado, contexto)
      const noTopo = lista.length === 0 ? estado : em(estado, lista[0])
      return apenas({ ...noTopo, primeiraLinhaVisivel: 0 }, 'nenhum')
    }
    case 'fim': {
      const lista = posicoes(estado, contexto)
      const noFim = lista.length === 0 ? estado : em(estado, lista[lista.length - 1])
      return apenas({ ...noFim, primeiraLinhaVisivel: fundo(contexto) }, 'nenhum')
    }
    case 'pagina-acima':
      return apenas(paginar(estado, contexto, -contexto.alturaVisivel), 'nenhum')
    case 'pagina-abaixo':
      return apenas(paginar(estado, contexto, contexto.alturaVisivel), 'nenhum')
    case 'meia-pagina-acima':
      return apenas(paginar(estado, contexto, -meiaJanela(contexto)), 'nenhum')
    case 'meia-pagina-abaixo':
      return apenas(paginar(estado, contexto, meiaJanela(contexto)), 'nenhum')
    case 'reler':
      return apenas(estado, 'reler')
    case 'confirmar':
      return apenas(estado, 'abrir-artefato')
    case 'suspender':
      return apenas(estado, 'suspender')
    case 'sair':
      return apenas(estado, 'sair')
  }
}
