/**
 * O painel de ajuda, com a tabela de teclas (RF-12, RN-07).
 *
 * Ele existe para que nada da tabela precise ser decorado, e é desenhado SOBRE
 * o quadro: o mesmo gesto que o revela o esconde, e enquanto ele está visível
 * o que estava embaixo continua onde estava, porque o estado de navegação não
 * é tocado.
 *
 * A tabela aqui é a transcrição de `interfaces/teclado.md`, e o que a mantém
 * honesta é a suíte da navegação do outro lado: trocar uma tecla faz aquela
 * suíte falhar nomeando a tecla trocada, e esta lista é o que o usuário lê.
 *
 * Desde a feature 016 o painel vai em moldura, na interface viva que a
 * comporta, com a coluna das teclas no papel de destaque e as promessas no
 * atenuado (RF-09). Destaque, e não acento: o nome de uma tecla é texto de
 * leitura, e o acento só veste marca, porque não guarda contraste de texto
 * sobre fundo claro.
 * @module cli/quadro/ajuda
 */

import type { JogoDeGlifos, LinhaDoQuadro, Trecho } from '../tipos.ts'
import { GLIFOS } from './glifos.ts'
import { recortar } from './medidas.ts'
import { emoldurar, larguraInterna } from './moldura.ts'
import { linha, linhaVazia, trecho } from './trechos.ts'

/** Uma linha da tabela: o gesto e o que ele faz. */
export interface LinhaDeAjuda {
  tecla: string
  efeito: string
  /** Como o gesto se escreve sem Unicode, quando a escrita de sempre o usa. */
  emSeteBits?: string
}

/** O título do painel. */
export const TITULO_DA_AJUDA = 'Teclas'

/** A tabela confirmada pelo usuário em 2026-09-20, na ordem em que foi confirmada. */
export const TABELA_DE_AJUDA: readonly LinhaDeAjuda[] = [
  { tecla: '↑ ↓  k j', efeito: 'Move a seleção entre as linhas navegáveis', emSeteBits: 'setas  k j' },
  { tecla: '← →  h l', efeito: 'Fecha e abre a seção sob a seleção', emSeteBits: 'setas  h l' },
  { tecla: 'Enter', efeito: 'Abre no editor o artefato da linha selecionada' },
  { tecla: 'Tab / Shift+Tab', efeito: 'Salta para a próxima seção e para a anterior' },
  { tecla: 'r', efeito: 'Relê agora, sem esperar a observação' },
  { tecla: 'a', efeito: 'Abre todas as seções' },
  { tecla: 'z', efeito: 'Fecha todas as seções' },
  { tecla: '?', efeito: 'Mostra e esconde esta ajuda' },
  { tecla: 'g / G', efeito: 'Vai ao topo e ao fim do quadro' },
  { tecla: 'q / Esc', efeito: 'Sai, restaurando o terminal' },
  { tecla: 'Ctrl+C', efeito: 'Sai, restaurando o terminal' },
  { tecla: 'Ctrl+Z', efeito: 'Suspende para o shell e retoma inteiro ao fg' },
]

/** O que a ajuda diz do que nenhuma tecla faz, que é metade do contrato. */
const PROMESSAS = [
  'Nenhuma tecla escreve arquivo, edita o processo do Reversa ou dispara agente.',
  '? esconde esta ajuda e devolve o quadro.',
]

/**
 * O painel de ajuda, já recortado à largura.
 * @param largura - quantas colunas a janela tem.
 * @param apresentacao - se há moldura a desenhar, e o jogo de glifos.
 * @returns as linhas do painel.
 */
export function painelDeAjuda(
  largura: number,
  apresentacao: { molduras: boolean; glifos: JogoDeGlifos } = { molduras: false, glifos: 'unicode' },
): LinhaDoQuadro[] {
  const jogo = apresentacao.glifos
  const dentro = apresentacao.molduras ? larguraInterna(largura) : largura
  const gesto = (item: LinhaDeAjuda): string =>
    jogo === 'sete-bits' ? (item.emSeteBits ?? item.tecla) : item.tecla
  const coluna = Math.max(...TABELA_DE_AJUDA.map((item) => [...gesto(item)].length))
  const entre = '   '

  const corpo: LinhaDoQuadro[] = []
  for (const item of TABELA_DE_AJUDA) {
    const tecla = gesto(item).padEnd(coluna)
    const pedacos = recortar(item.efeito, Math.max(1, dentro - coluna - entre.length))
    pedacos.forEach((pedaco, indice) => {
      const antes: Trecho =
        indice === 0 ? trecho(tecla, 'destaque', jogo) : trecho(' '.repeat(coluna))
      corpo.push(linha([antes, trecho(entre), trecho(pedaco, 'normal', jogo)]))
    })
  }

  corpo.push(linhaVazia())
  for (const promessa of PROMESSAS) {
    for (const pedaco of recortar(promessa, dentro)) {
      corpo.push(linha([trecho(pedaco, 'atenuado', jogo)]))
    }
  }

  const titulo = trecho(TITULO_DA_AJUDA, 'titulo', jogo)
  if (!apresentacao.molduras) return [linha([titulo]), linhaVazia(), ...corpo]

  return emoldurar({
    titulo: [titulo],
    conteudo: corpo,
    largura,
    papel: 'acento',
    glifos: GLIFOS[jogo],
  })
}
