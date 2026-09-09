/**
 * O leitor mínimo do pacote (RF-21, D-13).
 *
 * O que interessa conferir num pacote gerado são nomes e tamanhos, e ambos
 * moram no índice do arquivo compactado, não no conteúdo. Percorrer o índice
 * cabe em poucas dezenas de linhas, e evita duas coisas: uma dependência a
 * mais e a exigência de um binário do sistema fora do arquivo de trava.
 *
 * Ele não descompacta nada, e é por isso que serve: conferir o pacote de fato
 * é mais forte do que conferir o que a ferramenta diz que faria.
 * @module scripts/vsix
 */

const { readFileSync } = require('node:fs')

/** A assinatura que marca o fim do índice. */
const FIM_DO_INDICE = 0x06054b50

/** A assinatura de cada entrada do índice. */
const ENTRADA_DO_INDICE = 0x02014b50

/** O tamanho fixo de uma entrada do índice, antes do nome. */
const TAMANHO_DA_ENTRADA = 46

/**
 * As entradas do pacote, na ordem do índice.
 * @param {Buffer} pacote - o arquivo inteiro, em memória.
 * @returns {{caminho: string, tamanhoComprimido: number,
 *   tamanhoOriginal: number}[]} uma entrada por arquivo empacotado.
 * @throws {Error} quando o arquivo não tem índice, isto é, não é um pacote.
 */
function lerEntradas(pacote) {
  const fim = acharFimDoIndice(pacote)
  if (fim === -1) {
    throw new Error('índice não encontrado: o arquivo não é um pacote do formato esperado')
  }

  const quantas = pacote.readUInt16LE(fim + 10)
  let posicao = pacote.readUInt32LE(fim + 16)
  const entradas = []

  for (let conta = 0; conta < quantas; conta += 1) {
    if (pacote.readUInt32LE(posicao) !== ENTRADA_DO_INDICE) {
      throw new Error(`índice quebrado na entrada ${conta}: assinatura inesperada`)
    }
    const tamanhoComprimido = pacote.readUInt32LE(posicao + 20)
    const tamanhoOriginal = pacote.readUInt32LE(posicao + 24)
    const doNome = pacote.readUInt16LE(posicao + 28)
    const doExtra = pacote.readUInt16LE(posicao + 30)
    const doComentario = pacote.readUInt16LE(posicao + 32)
    const inicioDoNome = posicao + TAMANHO_DA_ENTRADA

    entradas.push({
      caminho: pacote.toString('utf8', inicioDoNome, inicioDoNome + doNome),
      tamanhoComprimido,
      tamanhoOriginal,
    })
    posicao = inicioDoNome + doNome + doExtra + doComentario
  }

  return entradas
}

/**
 * As entradas de um pacote em disco.
 * @param {string} caminho - o arquivo do pacote.
 * @returns {ReturnType<typeof lerEntradas>} o que {@link lerEntradas} devolve.
 */
function lerPacote(caminho) {
  return lerEntradas(readFileSync(caminho))
}

/**
 * Onde o índice termina. Procura-se de trás para frente porque o formato
 * permite um comentário depois dessa marca, de tamanho que só ela declara.
 */
function acharFimDoIndice(pacote) {
  const minimo = Math.max(0, pacote.length - 22 - 0xffff)
  for (let posicao = pacote.length - 22; posicao >= minimo; posicao -= 1) {
    if (pacote.readUInt32LE(posicao) === FIM_DO_INDICE) return posicao
  }
  return -1
}

module.exports = { lerEntradas, lerPacote }
