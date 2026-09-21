/**
 * A composição do quadro inteiro (D-05, RF-06, RF-19).
 *
 * Função pura de carga, estado de navegação e dimensões, devolvendo linhas com
 * ênfase abstrata: é o que permite conferir a tela inteira por suíte, sem
 * terminal, que é a dívida de teste que toda interface viva traz. Nenhuma
 * sequência de escape nasce aqui, e a tradução de ênfase em cor pertence ao
 * módulo de terminal, onde some quando a saída não é terminal.
 *
 * Quatro funções sobre a mesma entrada, e não uma que devolve tudo: o laço
 * precisa do quadro, a máquina de navegação precisa do contexto, a rolagem
 * precisa do índice da seleção e o editor precisa do artefato dela. Juntá-las
 * num objeto só obrigaria cada chamador a receber o que não usa.
 * @module cli/quadro/index
 */

import type { EffectiveEntry } from '../../webview/domain/types.ts'
import { sectionOrder } from '../../webview/domain/sections.ts'
import type { SectionName } from '../../webview/domain/types.ts'
import type {
  EstadoDeNavegacao,
  LinhaDoQuadro,
  Observacao,
  Procedencia,
  Quadro,
  SecaoDesenhada,
} from '../tipos.ts'
import type { ContextoDeNavegacao } from '../navegacao.ts'
import { painelDeAjuda } from './ajuda.ts'
import { linhasDoCabecalho } from './cabecalho.ts'
import { situacaoDaEntrada, telaDeEntrada } from './entrada.ts'
import { janela, recortar } from './medidas.ts'
import { linhasDaProcedencia } from './procedencia.ts'
import { secoesDoQuadro } from './secoes.ts'

/** Tudo de que o desenho precisa, e nada além disso. */
export interface EntradaDoQuadro {
  entrada: EffectiveEntry
  estado: EstadoDeNavegacao
  largura: number
  altura: number
  observacao: Observacao
  procedencia: Procedencia
  /** Se a consulta à origem foi feita nesta execução (RF-23). */
  conferenciaLigada: boolean
  /**
   * Se há cursor a desenhar; verdadeiro quando nada é dito.
   *
   * O modo de uma passada é o MESMO quadro sem cursor: não há ninguém para
   * mover a seleção, e uma linha marcada como escolhida num texto que vai para
   * arquivo descreveria um gesto que não houve.
   */
  cursor?: boolean
}

/** O recuo dos itens e do corpo das seções, e o da continuação de cada um. */
const RECUO = '  '

/**
 * A marca da linha selecionada, que ocupa o mesmo lugar do recuo.
 *
 * Ela existe porque o RF-09 exige que o item sob o cursor seja distinguível
 * SEM depender de cor, e porque a tradução de ênfase em cor pertence ao módulo
 * de terminal, onde some quando a saída não é terminal. Ocupar exatamente as
 * mesmas duas colunas do recuo é o que impede a linha selecionada de dançar
 * para a direita ao ser escolhida.
 */
export const CURSOR = '> '

/** A marca que declara uma seção fechada sem depender de cor. */
const FECHADA = ' [+]'

/**
 * Todas as linhas do quadro, antes de qualquer janela.
 * @param pedido - a entrada, o estado e as dimensões.
 * @returns o quadro inteiro, em ordem.
 */
export function linhasDoQuadro(pedido: EntradaDoQuadro): LinhaDoQuadro[] {
  // A ajuda é desenhada SOBRE o quadro: o estado de navegação não é tocado, de
  // modo que escondê-la devolve exatamente o que estava embaixo.
  if (pedido.estado.ajudaVisivel) return painelDeAjuda(pedido.largura)

  const { entrada, largura } = pedido
  const carga = entrada.loaded
  const linhas: LinhaDoQuadro[] = []

  const cabecalho = linhasDoCabecalho(entrada, pedido.conferenciaLigada)
  cabecalho.forEach((texto, indice) => {
    empurrar(linhas, texto, indice === 0 ? 'titulo' : 'normal', largura)
  })

  for (const texto of linhasDaProcedencia(
    pedido.procedencia,
    carga?.readAt ?? null,
    pedido.observacao,
  )) {
    empurrar(linhas, texto, 'atenuada', largura)
  }

  linhas.push(vazia())

  // As quatro situações de entrada, cada uma com título e corpo próprios: a
  // que tem menos a dizer continua dizendo alguma coisa (RF-04).
  const tela = telaDeEntrada(situacaoDaEntrada(entrada), {
    caminho: entrada.root,
    mensagem: entrada.message,
  })
  empurrar(linhas, tela.titulo, 'titulo', largura)
  for (const texto of tela.corpo) empurrar(linhas, texto, 'normal', largura, RECUO)
  linhas.push(vazia())

  if (carga === null) return linhas

  for (const secao of secoesDoQuadro(carga)) {
    linhas.push(...linhasDaSecao(secao, pedido))
    linhas.push(vazia())
  }

  return linhas
}

/**
 * O quadro que a janela mostra, com a altura do quadro inteiro ao lado.
 * @param pedido - a entrada, o estado e as dimensões.
 * @returns as linhas visíveis e a altura total.
 */
export function comporQuadro(pedido: EntradaDoQuadro): Quadro {
  const todas = linhasDoQuadro(pedido)
  return {
    linhas: janela(todas, pedido.estado.primeiraLinhaVisivel, pedido.altura),
    alturaTotal: todas.length,
  }
}

/**
 * O contexto que a máquina de navegação precisa para se mover no quadro.
 * @param pedido - a entrada, o estado e as dimensões.
 * @returns as seções, as contagens de itens e as duas alturas.
 */
export function contextoDeNavegacao(pedido: EntradaDoQuadro): ContextoDeNavegacao {
  const carga = pedido.entrada.loaded
  const itens = new Map<SectionName, number>(
    sectionOrder().map((nome) => [nome, 0] as [SectionName, number]),
  )
  if (carga !== null) {
    for (const secao of secoesDoQuadro(carga)) itens.set(secao.nome, secao.itens.length)
  }

  return {
    secoes: sectionOrder(),
    itens,
    alturaTotal: linhasDoQuadro(pedido).length,
    alturaVisivel: pedido.altura,
  }
}

/**
 * Onde a linha selecionada está no quadro inteiro.
 * @param pedido - a entrada, o estado e as dimensões.
 * @returns o índice, ou nulo quando nada está selecionado.
 */
export function indiceDaSelecao(pedido: EntradaDoQuadro): number | null {
  const indice = linhasDoQuadro(pedido).findIndex((linha) => linha.enfase === 'selecionada')
  return indice < 0 ? null : indice
}

/**
 * O artefato que a confirmação abriria sobre a linha selecionada.
 * @param pedido - a entrada, o estado e as dimensões.
 * @returns o caminho relativo, ou nulo quando a linha não aponta nada.
 */
export function artefatoSelecionado(pedido: EntradaDoQuadro): string | null {
  return linhasDoQuadro(pedido).find((linha) => linha.enfase === 'selecionada')?.artefato ?? null
}

/** Uma linha em branco, que é parte do desenho e não ausência dele. */
function vazia(): LinhaDoQuadro {
  return { texto: '', enfase: 'normal', artefato: null }
}

/**
 * Recorta um texto e empurra cada pedaço como linha.
 * @param destino - onde as linhas entram.
 * @param texto - o que desenhar.
 * @param enfase - a ênfase da PRIMEIRA linha; as demais são normais.
 * @param largura - quantas colunas há.
 * @param recuo - o que prefixar, e com que continuar.
 * @param artefato - o que a confirmação abriria, na primeira linha só.
 */
function empurrar(
  destino: LinhaDoQuadro[],
  texto: string,
  enfase: LinhaDoQuadro['enfase'],
  largura: number,
  recuo = '',
  artefato: string | null = null,
): void {
  const pedacos = recortar(recuo + texto, largura, recuo + RECUO)
  pedacos.forEach((pedaco, indice) => {
    destino.push({
      texto: pedaco,
      // Só o primeiro pedaço carrega a ênfase e o artefato: a seleção é UMA
      // linha, e marcar a continuação faria o cursor parecer dois.
      enfase: indice === 0 ? enfase : enfase === 'titulo' ? 'normal' : enfase === 'selecionada' ? 'normal' : enfase,
      artefato: indice === 0 ? artefato : null,
    })
  })
}

/**
 * Uma seção inteira: o título, o corpo quando aberta, e os itens.
 * @param secao - a seção já resolvida em texto.
 * @param pedido - a entrada, o estado e as dimensões.
 * @returns as linhas da seção.
 */
function linhasDaSecao(secao: SecaoDesenhada, pedido: EntradaDoQuadro): LinhaDoQuadro[] {
  const { estado, largura } = pedido
  const fechada = secao.recolhivel && estado.secoesFechadas.has(secao.nome)
  const selecionada = estado.secaoSelecionada === secao.nome
  const linhas: LinhaDoQuadro[] = []

  const comCursor = pedido.cursor !== false
  const titulo =
    secao.titulo +
    (secao.contagem === null ? '' : ` (${secao.contagem})`) +
    (fechada ? FECHADA : '')
  const tituloSelecionado = comCursor && selecionada && estado.itemSelecionado === null
  empurrar(
    linhas,
    titulo,
    tituloSelecionado ? 'selecionada' : 'titulo',
    largura,
    tituloSelecionado ? CURSOR : '',
  )

  if (fechada) return linhas

  for (const texto of secao.corpo) empurrar(linhas, texto, 'atenuada', largura, RECUO)

  secao.itens.forEach((item, indice) => {
    // O caminho do artefato entra no TEXTO quando ainda não estiver nele: o
    // RF-18 pede o caminho relativo de cada artefato apontado, e na interface
    // viva ele também diz o que a confirmação abriria (RF-11).
    const texto =
      item.artefato === null || item.texto.includes(item.artefato)
        ? item.texto
        : `${item.texto} · ${item.artefato}`
    const alvo = comCursor && selecionada && estado.itemSelecionado === indice
    empurrar(
      linhas,
      texto,
      alvo ? 'selecionada' : item.alerta === true ? 'alerta' : 'normal',
      largura,
      alvo ? CURSOR : RECUO,
      item.artefato,
    )
  })

  return linhas
}
