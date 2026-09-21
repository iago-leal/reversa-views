/**
 * O erro de grafia sobre fase canônica (feature 015, RN-12, D-14).
 *
 * Nome a até dois caracteres de distância de edição de uma fase canônica é erro
 * de grafia, e não candidato a etapa. Ele não vai ao motor e não ganha caixa de
 * aprovação: aprovar `escavacão` como etapa seria ensinar ao painel que o erro
 * é vocabulário, e a tela deixaria de mostrá-lo.
 *
 * A medida vale sobre o nome inteiro E sobre cada base possível. Sem a segunda,
 * `escavacão-c2` iria ao motor com caixa de aprovação: a distância dele até
 * `escavacao` é quatro, e é a base que está a um caractere.
 *
 * Nada aqui toca disco nem fala com serviço algum.
 * @module scripts/equivalencias/grafia
 */

const { FASES_CANONICAS } = require('./fases')

/** Acima disto um nome não é erro de grafia, é outro nome. */
const DISTANCIA_MAXIMA = 2

/** A forma do sufixo numérico, a mesma da leitura. */
const RESTO_COM_SUFIXO = /^[-_]\S*?\d+$/

/**
 * A distância de edição entre dois textos, em caracteres e não em unidades de
 * código: `ã` composto e `a` mais til combinante contam igual, porque os dois
 * lados são normalizados antes.
 * @param {string} a - um texto.
 * @param {string} b - o outro.
 * @returns {number} inserções, remoções e trocas necessárias.
 */
function distanciaDeEdicao(a, b) {
  const de = [...a.normalize('NFC')]
  const para = [...b.normalize('NFC')]
  let anterior = para.map((_, j) => j)
  anterior.push(para.length)

  for (let i = 1; i <= de.length; i += 1) {
    const linha = [i]
    for (let j = 1; j <= para.length; j += 1) {
      const troca = anterior[j - 1] + (de[i - 1] === para[j - 1] ? 0 : 1)
      linha.push(Math.min(troca, anterior[j] + 1, linha[j - 1] + 1))
    }
    anterior = linha
  }
  return anterior[para.length]
}

/**
 * As bases que um nome pode ter: ele inteiro, e o que sobra à esquerda de cada
 * separador quando o resto tem forma de sufixo numérico. É barato, e é o que
 * pega tanto `escavacão-c2` quanto `escavacão-ciclo-2`.
 * @param {string} nome - o nome como o arquivo o carrega.
 * @returns {string[]} as bases, da mais longa para a mais curta, sem repetição.
 */
function basesPossiveis(nome) {
  const bases = [nome]
  for (let i = 1; i < nome.length; i += 1) {
    if (nome[i] !== '-' && nome[i] !== '_') continue
    if (RESTO_COM_SUFIXO.test(nome.slice(i))) bases.push(nome.slice(0, i))
  }
  return [...new Set(bases)]
}

/**
 * A fase canônica de que um nome é erro de grafia, se for de alguma.
 *
 * Distância ZERO não é erro: é a própria fase, ou uma fase de ciclo, e quem
 * decide isso é a forma, antes deste filtro.
 * @param {string} nome - o nome como o arquivo o carrega.
 * @returns {string|null} a fase canônica vizinha, a mais próxima, ou null.
 */
function erroDeGrafia(nome) {
  let melhor = null
  for (const base of basesPossiveis(nome)) {
    for (const canonica of FASES_CANONICAS) {
      const distancia = distanciaDeEdicao(base, canonica)
      if (distancia === 0 || distancia > DISTANCIA_MAXIMA) continue
      if (melhor === null || distancia < melhor.distancia) melhor = { canonica, distancia }
    }
  }
  return melhor === null ? null : melhor.canonica
}

module.exports = { basesPossiveis, DISTANCIA_MAXIMA, distanciaDeEdicao, erroDeGrafia }
