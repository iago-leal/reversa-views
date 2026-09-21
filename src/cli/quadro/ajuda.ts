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
 * @module cli/quadro/ajuda
 */

import type { LinhaDoQuadro } from '../tipos.ts'
import { recortar } from './medidas.ts'

/** Uma linha da tabela: o gesto e o que ele faz. */
export interface LinhaDeAjuda {
  tecla: string
  efeito: string
}

/** A tabela confirmada pelo usuário em 2026-09-20, na ordem em que foi confirmada. */
export const TABELA_DE_AJUDA: readonly LinhaDeAjuda[] = [
  { tecla: '↑ ↓  k j', efeito: 'Move a seleção entre as linhas navegáveis' },
  { tecla: '← →  h l', efeito: 'Fecha e abre a seção sob a seleção' },
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
]

/**
 * O painel de ajuda, já recortado à largura.
 * @param largura - quantas colunas a janela tem.
 * @returns as linhas do painel.
 */
export function painelDeAjuda(largura: number): LinhaDoQuadro[] {
  const coluna = Math.max(...TABELA_DE_AJUDA.map((linha) => [...linha.tecla].length))

  const linhas: LinhaDoQuadro[] = [
    { texto: 'Teclas', enfase: 'titulo', artefato: null },
    { texto: '', enfase: 'normal', artefato: null },
  ]

  for (const { tecla, efeito } of TABELA_DE_AJUDA) {
    const recuo = ' '.repeat(coluna + 3)
    for (const pedaco of recortar(`${tecla.padEnd(coluna)}   ${efeito}`, largura, recuo)) {
      linhas.push({ texto: pedaco, enfase: 'normal', artefato: null })
    }
  }

  linhas.push({ texto: '', enfase: 'normal', artefato: null })
  for (const promessa of PROMESSAS) {
    for (const pedaco of recortar(promessa, largura)) {
      linhas.push({ texto: pedaco, enfase: 'atenuada', artefato: null })
    }
  }
  for (const pedaco of recortar('? esconde esta ajuda e devolve o quadro.', largura)) {
    linhas.push({ texto: pedaco, enfase: 'atenuada', artefato: null })
  }

  return linhas
}
