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
 *
 * Um bloco pode trazer VÁRIAS teclas (BUG-20260922-HTND): o sistema junta à
 * vontade o que foi escrito em separado, e a rolagem do trackpad convertida em
 * setas chega quase sempre como rajada. O bloco é fatiado em unidades
 * completas antes do reconhecimento, e cada unidade vale uma tecla. O `Esc` ou
 * a sequência incompleta que sobra no fim de um bloco maior é descartado: pode
 * ser o começo de uma seta partida, e a D-15 só dá a saída ao bloco que é
 * exatamente `Esc`.
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

/** O primeiro e o último byte final de uma sequência de controle. */
const FINAL_MINIMO = 0x40
const FINAL_MAXIMO = 0x7e

/**
 * Quantos bytes tem o caractere UTF-8 que começa neste byte.
 * @param byte - o primeiro byte do caractere.
 * @returns o comprimento; um, para byte que não abre caractere válido.
 */
function comprimentoDoCaractere(byte: number): number {
  if (byte >= 0xf0 && byte <= 0xf7) return 4
  if (byte >= 0xe0) return byte <= 0xef ? 3 : 1
  if (byte >= 0xc0) return 2
  return 1
}

/**
 * Fatiar um bloco nas unidades que o terminal escreveu.
 *
 * Uma unidade é uma sequência de controle inteira, de `Esc [` até o byte
 * final; ou `Esc` seguido de um byte que não é o colchete, como o Alt com
 * tecla; ou um caractere. O bloco que é exatamente `Esc` é uma unidade (D-15);
 * o `Esc` ou a sequência sem byte final no fim de um bloco maior não é.
 * @param bloco - o que o terminal entregou de uma vez.
 * @returns as unidades, em ordem.
 */
function fatiar(bloco: Uint8Array): Uint8Array[] {
  if (bloco.length === 1 && bloco[0] === ESC) return [bloco]

  const unidades: Uint8Array[] = []
  let posicao = 0
  while (posicao < bloco.length) {
    const inicio = posicao
    if (bloco[posicao] === ESC) {
      if (posicao + 1 >= bloco.length) break
      if (bloco[posicao + 1] === COLCHETE) {
        let fim = posicao + 2
        while (fim < bloco.length && (bloco[fim] < FINAL_MINIMO || bloco[fim] > FINAL_MAXIMO)) {
          fim += 1
        }
        if (fim >= bloco.length) break
        posicao = fim + 1
      } else {
        posicao += 2
      }
    } else {
      posicao += comprimentoDoCaractere(bloco[posicao])
    }
    unidades.push(bloco.subarray(inicio, Math.min(posicao, bloco.length)))
  }
  return unidades
}

/**
 * Reconhecer um bloco que traz uma tecla só.
 * @param bloco - o que o terminal entregou de uma vez.
 * @returns a tecla nomeada, ou nulo quando o bloco não é nenhuma delas ou
 *   traz mais de uma unidade.
 */
export function reconhecerTecla(bloco: Uint8Array): TeclaNomeada | null {
  const unidades = fatiar(bloco)
  return unidades.length === 1 ? reconhecerUnidade(unidades[0]) : null
}

/**
 * Reconhecer todas as teclas de um bloco, na ordem em que chegaram.
 *
 * Unidade que não é tecla fica de fora, e não impede as vizinhas.
 * @param bloco - o que o terminal entregou de uma vez.
 * @returns as teclas nomeadas, possivelmente nenhuma.
 */
export function reconhecerTeclas(bloco: Uint8Array): TeclaNomeada[] {
  const teclas: TeclaNomeada[] = []
  for (const unidade of fatiar(bloco)) {
    const tecla = reconhecerUnidade(unidade)
    if (tecla !== null) teclas.push(tecla)
  }
  return teclas
}

/**
 * Reconhecer uma unidade já fatiada.
 * @param bloco - uma sequência, um `Esc` com um byte, ou um caractere.
 * @returns a tecla nomeada, ou nulo quando a unidade não é nenhuma delas.
 */
function reconhecerUnidade(bloco: Uint8Array): TeclaNomeada | null {
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
