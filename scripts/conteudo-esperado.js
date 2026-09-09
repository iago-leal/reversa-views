/**
 * O que pode estar dentro do pacote, e nada mais (RF-21, RN-07).
 *
 * Lista literal, escrita uma vez e lida pela suíte que abre o pacote gerado.
 * Ela não descreve o que fica de fora, e sim o que pode estar dentro: caminho
 * que não case com nenhum prefixo nem com nenhum arquivo faz a suíte falhar,
 * nomeando-o.
 *
 * Os quatro arquivos avulsos são os dois do repositório mais os dois que o
 * empacotador escreve por conta própria: o manifesto do formato e a tabela de
 * tipos de conteúdo, ambos exigidos pelo editor ao instalar.
 *
 * É a contraparte executável de '.vscodeignore': aquele declara a intenção, e
 * esta confere o resultado.
 * @module scripts/conteudo-esperado
 */

/** Pastas cujo conteúdo inteiro é previsto, com barra ao final. */
const PREFIXOS_PREVISTOS = ['extension/out/', 'extension/media/']

/**
 * Arquivos avulsos previstos, em caminho exato dentro do pacote.
 *
 * O README entra em minúsculas porque é assim que o empacotador o grava: ele
 * normaliza o nome ao montar o pacote, e a lista descreve o pacote, não o
 * repositório.
 */
const ARQUIVOS_PREVISTOS = [
  'extension/package.json',
  'extension/readme.md',
  'extension.vsixmanifest',
  '[Content_Types].xml',
]

/**
 * Se um caminho do pacote estava previsto.
 * @param {string} caminho - o caminho tal como gravado no índice do pacote.
 * @returns {boolean} verdadeiro quando ele casa com prefixo ou arquivo.
 */
function estaPrevisto(caminho) {
  if (ARQUIVOS_PREVISTOS.includes(caminho)) return true
  return PREFIXOS_PREVISTOS.some((prefixo) => caminho.startsWith(prefixo))
}

/**
 * Os caminhos que entraram sem estar previstos.
 * @param {readonly string[]} caminhos - todos os caminhos do pacote.
 * @returns {string[]} os não previstos, na ordem em que apareceram.
 */
function naoPrevistos(caminhos) {
  return caminhos.filter((caminho) => !estaPrevisto(caminho))
}

module.exports = { ARQUIVOS_PREVISTOS, PREFIXOS_PREVISTOS, estaPrevisto, naoPrevistos }
