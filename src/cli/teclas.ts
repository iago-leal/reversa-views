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
 *
 * As sequências de controle têm duas formas, e o til as separa (feature 017,
 * D-06). As setas e o salto para trás terminam em letra, e a letra diz a
 * tecla. As teclas de página terminam em til, `Esc [ 5 ~` e `Esc [ 6 ~`, e o
 * mesmo formato serve a `Home`, `Insert`, `Delete` e `End` em muitos
 * emuladores: nelas, quem diz a tecla é o NÚMERO entre o colchete e o til, e
 * mapear pelo último byte trataria todas como uma só. O reconhecedor lê o
 * número e só conhece dois deles; qualquer outro não é tecla.
 * @module cli/teclas
 */

import type { TeclaNomeada } from './tipos.ts'

/** O byte de escape, que abre toda sequência de terminal. */
const ESC = 0x1b

/** O colchete que segue o escape em toda sequência de controle. */
const COLCHETE = 0x5b

/** O til que fecha as sequências numeradas, como as das teclas de página. */
const TIL = 0x7e

/** O último byte de cada sequência de controle terminada em letra. */
const SEQUENCIAS: Record<number, TeclaNomeada> = {
  0x41: 'acima',
  0x42: 'abaixo',
  0x43: 'abrir-secao',
  0x44: 'fechar-secao',
  0x5a: 'secao-anterior',
}

/** O número de cada sequência terminada em til que é tecla; os outros não são. */
const NUMERADAS: Record<number, TeclaNomeada> = {
  5: 'pagina-acima',
  6: 'pagina-abaixo',
}

/** Os bytes de controle que não são letra nem sequência. */
const CONTROLES: Record<number, TeclaNomeada> = {
  0x03: 'sair',
  0x04: 'meia-pagina-abaixo',
  0x09: 'proxima-secao',
  0x0a: 'confirmar',
  0x0d: 'confirmar',
  0x15: 'meia-pagina-acima',
  0x1a: 'suspender',
}

/**
 * O número de uma sequência terminada em til, lido dos dígitos entre o
 * colchete e o til.
 * @param digitos - os bytes entre `Esc [` e `~`.
 * @returns o número, ou nulo quando não há dígitos ou há outra coisa.
 */
function numeroDaSequencia(digitos: Uint8Array): number | null {
  if (digitos.length === 0) return null
  let numero = 0
  for (const byte of digitos) {
    if (byte < 0x30 || byte > 0x39) return null
    numero = numero * 10 + (byte - 0x30)
  }
  return numero
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
      const ultimo = bloco[bloco.length - 1]
      if (ultimo === TIL) {
        const numero = numeroDaSequencia(bloco.subarray(2, bloco.length - 1))
        return numero === null ? null : (NUMERADAS[numero] ?? null)
      }
      return SEQUENCIAS[ultimo] ?? null
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
