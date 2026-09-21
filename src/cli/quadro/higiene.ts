/**
 * A higiene do texto que vem do disco (feature 016, NFR de segurança, D-20).
 *
 * O que vem do projeto observado é DADO, e não comando de tela. Um nome de
 * arquivo ou uma descrição de ação pode trazer uma sequência de controle, e
 * com esta feature a saída passou a ter muitas sequências legítimas, no meio
 * das quais uma hostil passaria despercebida. Aqui ela vira texto visível,
 * num ponto só: o construtor de trecho do compositor.
 *
 * Roda ANTES do recorte, porque a substituição pode mudar a largura. E a
 * expressão usa intervalo de pontos de código, sem escrever o caractere de
 * controle em lugar algum: a guarda de fronteiras, que o confina ao módulo de
 * terminal, continua valendo aqui sem exceção.
 * @module cli/quadro/higiene
 */

import type { JogoDeGlifos } from '../tipos.ts'

/** C0, DEL e C1, por intervalo. */
const DE_CONTROLE = /[\u0000-\u001f\u007f-\u009f]/g

/** O espaço em branco de controle, que vira espaço e não figura. */
const EM_BRANCO = new Set([0x09, 0x0a, 0x0b, 0x0c, 0x0d])

/** Onde começam as figuras de controle do Unicode, uma por código de C0. */
const FIGURAS = 0x2400

/** A figura de DEL, que fica fora da sequência das demais. */
const FIGURA_DE_DEL = 0x2421

/**
 * Como um código de controle se mostra.
 * @param codigo - o ponto de código, de C0, DEL ou C1.
 * @param jogo - o jogo de glifos em uso.
 * @returns o texto visível que o substitui.
 */
function visivel(codigo: number, jogo: JogoDeGlifos): string {
  if (EM_BRANCO.has(codigo)) return ' '
  // C1 não tem figura nem notação de circunflexo: sai pelo código, nos dois.
  if (codigo >= 0x80) return `<${codigo.toString(16).toUpperCase()}>`
  if (jogo === 'sete-bits') return `^${codigo === 0x7f ? '?' : String.fromCharCode(codigo + 0x40)}`
  return String.fromCodePoint(codigo === 0x7f ? FIGURA_DE_DEL : FIGURAS + codigo)
}

/**
 * Tirar de um texto tudo o que o terminal interpretaria.
 * @param texto - o que veio do disco, ou de qualquer outro lugar.
 * @param jogo - o jogo de glifos em uso.
 * @returns o mesmo texto, sem ponto de código de controle.
 */
export function neutralizar(texto: string, jogo: JogoDeGlifos = 'unicode'): string {
  return texto.replace(DE_CONTROLE, (achado) => visivel(achado.codePointAt(0) ?? 0, jogo))
}
