/**
 * O construtor único de trecho e de linha (feature 016, D-01, D-20).
 *
 * Todo texto que entra num trecho passa por `neutralizar`, e passa AQUI, num
 * ponto só: os módulos que leem texto do disco são cinco, e neutralizar em
 * cada um seria esperar que o sexto se lembrasse. O que sai daqui não contém
 * ponto de código de controle, venha de onde vier.
 *
 * Mora fora do compositor porque a ajuda e a moldura também constroem linha, e
 * o compositor importa as duas: o construtor dentro dele fecharia um ciclo.
 * @module cli/quadro/trechos
 */

import type { JogoDeGlifos, LinhaDoQuadro, Papel, Trecho } from '../tipos.ts'
import { neutralizar } from './higiene.ts'

/**
 * Um trecho, já sem nada que o terminal interpretaria.
 * @param texto - o pedaço de linha.
 * @param papel - o que o pedaço é.
 * @param jogo - o jogo de glifos, que decide como o controle se mostra.
 * @returns o trecho.
 */
export function trecho(texto: string, papel: Papel = 'normal', jogo: JogoDeGlifos = 'unicode'): Trecho {
  return { texto: neutralizar(texto, jogo), papel }
}

/**
 * Uma linha, a partir dos trechos dela.
 *
 * O `texto` é a concatenação dos trechos, e essa invariante é o que mantém o
 * quadro conferível por comparação de texto. Trecho vazio não entra.
 * @param trechos - os pedaços, em ordem.
 * @param extras - o artefato que a confirmação abriria, e se é a linha sob o cursor.
 * @returns a linha.
 */
export function linha(
  trechos: readonly Trecho[],
  extras: { artefato?: string | null; selecionada?: boolean } = {},
): LinhaDoQuadro {
  const cheios = trechos.filter((pedaco) => pedaco.texto !== '')
  return {
    texto: cheios.map((pedaco) => pedaco.texto).join(''),
    trechos: cheios,
    selecionada: extras.selecionada === true,
    artefato: extras.artefato ?? null,
  }
}

/** Uma linha em branco, que é parte do desenho e não ausência dele. */
export function linhaVazia(): LinhaDoQuadro {
  return linha([])
}

/**
 * Quantas colunas os trechos ocupam, contando pontos de código.
 * @param trechos - os pedaços.
 * @returns a largura em colunas.
 */
export function larguraDosTrechos(trechos: readonly Trecho[]): number {
  return trechos.reduce((soma, pedaco) => soma + [...pedaco.texto].length, 0)
}

/**
 * Cortar trechos a uma largura, sem reticência e sem quebra.
 *
 * É o corte de quem já recebeu conteúdo recortado e só se defende do que
 * sobrou: a moldura, que não pode ter a borda direita empurrada.
 * @param trechos - os pedaços.
 * @param largura - quantas colunas há.
 * @returns os pedaços, somando no máximo a largura.
 */
export function cortarTrechos(trechos: readonly Trecho[], largura: number): Trecho[] {
  const saida: Trecho[] = []
  let resta = Math.max(0, largura)
  for (const pedaco of trechos) {
    if (resta === 0) break
    const pontos = [...pedaco.texto]
    saida.push({ texto: pontos.slice(0, resta).join(''), papel: pedaco.papel })
    resta -= Math.min(resta, pontos.length)
  }
  return saida
}
