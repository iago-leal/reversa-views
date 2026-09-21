/**
 * A moldura de cantos arredondados (feature 016, RF-02, RF-03, RF-09, D-11).
 *
 * Uma caixa só, para os três lugares que a usam: o núcleo do cabeçalho, a
 * faixa de bloqueio e as situações de entrada, que diferem no papel da borda e
 * em mais nada. O título vai NA borda superior: economiza uma linha por caixa,
 * e o olho encontra o nome da caixa no mesmo lugar em que encontra a caixa.
 *
 * Função pura, sem largura própria e sem cor: o conteúdo chega recortado à
 * largura interna, o papel da borda chega de quem chama, e o jogo de glifos
 * decide se o canto é arredondado ou é um sinal de mais.
 *
 * A caixa só existe na interface viva com 60 colunas ou mais. Quem decide
 * isso é o compositor; aqui, largura é o que se recebe.
 * @module cli/quadro/moldura
 */

import type { LinhaDoQuadro, Papel, Trecho } from '../tipos.ts'
import type { Glifos } from './glifos.ts'
import { cortarTrechos, larguraDosTrechos, linha } from './trechos.ts'

/** Os dois lados, com uma coluna de respiro cada. */
const LADOS = 4

/** O que sobra do título: o canto, o traço, os dois espaços, um traço e o canto. */
const EM_VOLTA_DO_TITULO = 6

/** O que a moldura precisa saber. */
export interface PedidoDeMoldura {
  /** O título, já em trechos, porque ele tem papel próprio. */
  titulo: Trecho[]
  /** As linhas de dentro, já recortadas à largura interna. */
  conteudo: LinhaDoQuadro[]
  /** A largura da caixa inteira, que é a da janela. */
  largura: number
  /** O papel da borda: acento, atenção, falha ou borda discreta. */
  papel: Papel
  glifos: Glifos
  /** Se o cursor está sobre o título, que é posição navegável. */
  selecionada?: boolean
}

/**
 * Quantas colunas o conteúdo de uma caixa pode ocupar.
 * @param largura - a largura da caixa inteira.
 * @returns a largura interna.
 */
export function larguraInterna(largura: number): number {
  return Math.max(0, largura - LADOS)
}

/**
 * Desenhar a caixa.
 * @param pedido - o título, o conteúdo, a largura, o papel da borda e os glifos.
 * @returns as linhas, todas com exatamente a largura pedida.
 */
export function emoldurar(pedido: PedidoDeMoldura): LinhaDoQuadro[] {
  const { glifos: g, largura, papel } = pedido
  const borda = (texto: string): Trecho => ({ texto, papel })

  const titulo = cortarTrechos(pedido.titulo, Math.max(0, largura - EM_VOLTA_DO_TITULO))
  const resto = Math.max(0, largura - 5 - larguraDosTrechos(titulo))
  const topo = linha(
    [
      borda(`${g.cantoSuperiorEsquerdo}${g.horizontal} `),
      ...titulo,
      borda(` ${g.horizontal.repeat(resto)}${g.cantoSuperiorDireito}`),
    ],
    { selecionada: pedido.selecionada === true },
  )

  const dentro = larguraInterna(largura)
  const meio = pedido.conteudo.map((desenhada) => {
    const trechos = cortarTrechos(desenhada.trechos, dentro)
    const sobra = dentro - larguraDosTrechos(trechos)
    return linha(
      [borda(`${g.vertical} `), ...trechos, borda(`${' '.repeat(sobra)} ${g.vertical}`)],
      { artefato: desenhada.artefato, selecionada: desenhada.selecionada },
    )
  })

  const base = linha([
    borda(`${g.cantoInferiorEsquerdo}${g.horizontal.repeat(Math.max(0, largura - 2))}${g.cantoInferiorDireito}`),
  ])

  return [topo, ...meio, base]
}
