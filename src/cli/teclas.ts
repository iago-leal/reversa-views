/**
 * O reconhecimento de bloco de bytes em tecla nomeada (D-15).
 *
 * Função pura, e essa é a exigência do contrato do teclado: é o único lugar em
 * que a tabela confirmada vira bytes, e um relógio dentro dela tiraria a
 * pureza da única função que o contrato exige pura.
 *
 * O reconhecimento é POR BLOCO, e não por byte. As setas chegam ao terminal
 * como `Esc [ A`, de modo que um `Esc` sozinho só se distinguiria do começo de
 * uma seta pelo que viesse depois dele: um bloco que seja exatamente `Esc` é a
 * tecla de saída, e um bloco que comece por `Esc [` é seta. Não há
 * temporizador. O preço é o caso raro da sequência partida em dois blocos por
 * ligação lenta, registrado como risco no roadmap, com a espera curta de
 * cinquenta milissegundos como saída caso ele apareça.
 * @module cli/teclas
 */

import type { TeclaNomeada } from './tipos.ts'

/** O byte de escape, que abre toda sequência de terminal. */
const ESC = 0x1b

/** O colchete que segue o escape em toda sequência de controle. */
const COLCHETE = 0x5b

/** O último byte de cada sequência de controle reconhecida. */
const SEQUENCIAS: Record<number, TeclaNomeada> = {
  0x41: 'acima',
  0x42: 'abaixo',
  0x43: 'abrir-secao',
  0x44: 'fechar-secao',
  0x5a: 'secao-anterior',
}

/** Os bytes de controle que não são letra nem sequência. */
const CONTROLES: Record<number, TeclaNomeada> = {
  0x03: 'sair',
  0x09: 'proxima-secao',
  0x0a: 'confirmar',
  0x0d: 'confirmar',
  0x1a: 'suspender',
}

/** A tabela confirmada pelo usuário em 2026-09-20, na parte imprimível. */
const LETRAS: Record<string, TeclaNomeada> = {
  k: 'acima',
  j: 'abaixo',
  h: 'fechar-secao',
  l: 'abrir-secao',
  r: 'reler',
  a: 'abrir-tudo',
  z: 'fechar-tudo',
  '?': 'ajuda',
  g: 'topo',
  G: 'fim',
  q: 'sair',
}

/**
 * Reconhecer um bloco de bytes.
 * @param bloco - o que o terminal entregou de uma vez.
 * @returns a tecla nomeada, ou nulo quando o bloco não é nenhuma delas.
 */
export function reconhecerTecla(bloco: Uint8Array): TeclaNomeada | null {
  if (bloco.length === 0) return null

  // A aresta da D-15, e a ordem importa: o bloco de um byte só é conferido
  // ANTES de qualquer leitura de sequência, porque é o que o distingue.
  if (bloco.length === 1 && bloco[0] === ESC) return 'sair'

  if (bloco[0] === ESC) {
    if (bloco.length >= 3 && bloco[1] === COLCHETE) {
      return SEQUENCIAS[bloco[bloco.length - 1]] ?? null
    }
    return null
  }

  if (bloco.length === 1) {
    const controle = CONTROLES[bloco[0]]
    if (controle !== undefined) return controle
  }

  const texto = new TextDecoder().decode(bloco)
  return LETRAS[texto] ?? null
}
