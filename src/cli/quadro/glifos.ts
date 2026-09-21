/**
 * Os glifos do terminal, em dois jogos de mesma forma (feature 016, RF-14,
 * RN-03, D-12).
 *
 * Todo glifo que a ferramenta desenha por conta própria sai daqui, e é isso
 * que torna o degrau de sete bits uma troca de tabela, e não uma segunda
 * tela. As distinções que a cor faz são feitas também por eles: seção aberta
 * e fechada, item selecionado, e os três estados de uma ação continuam
 * diferentes entre si nos dois jogos.
 *
 * A PROSA não passa por aqui. Com a localidade sem Unicode, o português
 * acentuado continua saindo como está: transliterá-lo mudaria frase, e a
 * RN-01 da feature diz que o visual é pele, e não julgamento.
 *
 * O de atenção é `!` nos dois jogos de propósito: os sinais de advertência do
 * Unicode têm largura ambígua, ocupam duas colunas em parte dos terminais, e
 * desalinhariam a borda direita da moldura.
 * @module cli/quadro/glifos
 */

import type { JogoDeGlifos } from '../tipos.ts'

/** Um jogo de glifos; as chaves são as mesmas nos dois. */
export interface Glifos {
  secaoAberta: string
  secaoFechada: string
  selecao: string
  acaoFechada: string
  acaoProxima: string
  acaoAberta: string
  continuacao: string
  atencao: string
  separador: string
  observacaoAtiva: string
  observacaoPorIntervalo: string
  haAcima: string
  haAbaixo: string
  cantoSuperiorEsquerdo: string
  cantoSuperiorDireito: string
  cantoInferiorEsquerdo: string
  cantoInferiorDireito: string
  horizontal: string
  vertical: string
  reticencias: string
  /** O traço de um intervalo de números, como em "linhas 1–24". */
  intervalo: string
}

/** Os dois jogos. */
export const GLIFOS: Record<JogoDeGlifos, Glifos> = {
  unicode: {
    secaoAberta: '▾',
    secaoFechada: '▸',
    selecao: '❯',
    acaoFechada: '✓',
    acaoProxima: '→',
    acaoAberta: '·',
    continuacao: '⎿',
    atencao: '!',
    separador: '·',
    observacaoAtiva: '●',
    observacaoPorIntervalo: '○',
    haAcima: '↑',
    haAbaixo: '↓',
    cantoSuperiorEsquerdo: '╭',
    cantoSuperiorDireito: '╮',
    cantoInferiorEsquerdo: '╰',
    cantoInferiorDireito: '╯',
    horizontal: '─',
    vertical: '│',
    reticencias: '…',
    intervalo: '–',
  },
  'sete-bits': {
    secaoAberta: '[-]',
    secaoFechada: '[+]',
    selecao: '>',
    acaoFechada: 'x',
    acaoProxima: '*',
    acaoAberta: '-',
    continuacao: '`',
    atencao: '!',
    separador: '-',
    observacaoAtiva: '(*)',
    observacaoPorIntervalo: '( )',
    haAcima: '^',
    haAbaixo: 'v',
    cantoSuperiorEsquerdo: '+',
    cantoSuperiorDireito: '+',
    cantoInferiorEsquerdo: '+',
    cantoInferiorDireito: '+',
    horizontal: '-',
    vertical: '|',
    reticencias: '...',
    intervalo: '-',
  },
}

/**
 * Quantas colunas um texto ocupa, contando pontos de código como o recorte.
 * @param texto - o glifo ou o trecho.
 * @returns a largura em colunas.
 */
export function colunas(texto: string): number {
  return [...texto].length
}

/**
 * Juntar campos pelo separador do jogo, que é o ` · ` de sempre no Unicode.
 * @param partes - os campos; nulos e vazios ficam de fora.
 * @param glifos - o jogo em uso.
 * @returns os campos numa linha.
 */
export function juntar(
  partes: readonly (string | null | undefined)[],
  glifos: Glifos,
): string {
  return partes
    .filter((parte): parte is string => parte !== null && parte !== undefined && parte !== '')
    .join(` ${glifos.separador} `)
}
