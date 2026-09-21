/**
 * As medidas do quadro: recorte, altura e deslocamento (RF-14, RF-19).
 *
 * É do que todo o desenho depende, e é por isso que mora num módulo só. Três
 * funções puras, sem estado e sem terminal: a janela pode encolher a qualquer
 * instante, e o que se mede aqui tem de valer igual para uma largura de
 * quarenta e para uma de duzentas colunas.
 *
 * O recorte conta PONTOS DE CÓDIGO, e não unidades de dezesseis bits: um
 * caractere acentuado ocupa uma coluna e a contagem ingênua o faria ocupar
 * duas, estreitando a tela de quem escreve em português.
 * @module cli/quadro/medidas
 */

import type { LinhaDoQuadro } from '../tipos.ts'

/**
 * Recortar um texto à largura, sem cortar palavra que caiba.
 *
 * Palavra maior que a largura inteira é partida, porque a alternativa seria
 * uma linha mais larga que a janela, e o terminal a quebraria sozinho no pior
 * lugar possível. Texto vazio devolve uma linha vazia, e não lista vazia: uma
 * linha em branco é parte do desenho, e engoli-la juntaria blocos que o
 * quadro separa de propósito.
 * @param texto - o que desenhar.
 * @param largura - quantas colunas há.
 * @param continuacao - o que prefixar nas linhas seguintes à primeira.
 * @returns as linhas, nenhuma delas maior que a largura.
 */
export function recortar(texto: string, largura: number, continuacao = ''): string[] {
  if (largura <= 0) return ['']

  const recuo = [...continuacao].length < largura ? continuacao : ''
  const palavras = texto.split(/\s+/).filter((parte) => parte !== '')
  if (palavras.length === 0) return ['']

  const linhas: string[] = []
  let prefixo = ''
  let atual = ''

  /** Fecha a linha corrente; da segunda em diante, a seguinte nasce recuada. */
  const fechar = (): void => {
    linhas.push(prefixo + atual)
    prefixo = recuo
    atual = ''
  }

  for (const palavra of palavras) {
    let resto = [...palavra]
    const tamanho = resto.length
    while (resto.length > 0) {
      const separador = atual === '' ? 0 : 1
      const disponivel = largura - [...prefixo].length - [...atual].length - separador

      if (resto.length <= disponivel) {
        atual += (separador === 1 ? ' ' : '') + resto.join('')
        resto = []
        continue
      }

      // Palavra maior que a linha inteira: parte-se, porque a alternativa
      // seria entregar ao terminal uma linha mais larga que a janela.
      if (tamanho > largura - [...recuo].length) {
        if (disponivel <= 0) {
          fechar()
          continue
        }
        atual += (separador === 1 ? ' ' : '') + resto.slice(0, disponivel).join('')
        resto = resto.slice(disponivel)
        fechar()
        continue
      }

      // Cabe numa linha própria: quebra antes dela em vez de parti-la.
      fechar()
    }
  }

  fechar()
  return linhas
}

/**
 * Onde a janela começa para que a linha selecionada esteja dentro dela.
 *
 * Ela move o mínimo: uma seleção já visível não desloca nada, que é o que
 * mantém a leitura estável enquanto o cursor anda no meio da tela.
 * @param indice - a linha que precisa aparecer; nulo não move nada.
 * @param primeira - o deslocamento corrente.
 * @param alturaVisivel - quantas linhas a janela mostra.
 * @param alturaTotal - quantas linhas o quadro tem.
 * @returns o deslocamento novo.
 */
export function ajustarDeslocamento(
  indice: number | null,
  primeira: number,
  alturaVisivel: number,
  alturaTotal: number,
): number {
  const fundo = Math.max(0, alturaTotal - alturaVisivel)
  const atual = Math.min(Math.max(0, primeira), fundo)
  if (indice === null || alturaVisivel <= 0) return atual
  if (indice < atual) return indice
  if (indice >= atual + alturaVisivel) return Math.min(fundo, indice - alturaVisivel + 1)
  return atual
}

/**
 * O pedaço do quadro que a janela mostra.
 * @param linhas - o quadro inteiro.
 * @param primeira - o deslocamento.
 * @param alturaVisivel - quantas linhas cabem.
 * @returns a janela, nunca maior que a altura e nunca preenchida com linha inventada.
 */
export function janela(
  linhas: readonly LinhaDoQuadro[],
  primeira: number,
  alturaVisivel: number,
): LinhaDoQuadro[] {
  if (alturaVisivel <= 0) return []
  const fundo = Math.max(0, linhas.length - alturaVisivel)
  const inicio = Math.min(Math.max(0, primeira), fundo)
  return linhas.slice(inicio, inicio + alturaVisivel)
}
