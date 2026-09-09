/**
 * Reaplicação das adaptações declaradas sobre o conteúdo vindo da origem.
 *
 * A busca é exata, e é rígida de propósito. O trecho precisa aparecer uma
 * única vez: zero ocorrências significa que a origem mudou o que a adaptação
 * tocava, duas significam que a ferramenta teria de escolher, e nenhuma das
 * duas é decisão de script (RN-09).
 *
 * A única tolerância é tipográfica: um trecho declarado sem a quebra de linha
 * final ainda casa, porque exigir cuidado com o último caractere de um bloco
 * YAML seria transformar formatação em defeito.
 * @module scripts/heranca/adaptacoes
 */

/**
 * Quantas vezes um trecho aparece.
 * @param {string} conteudo - onde procurar.
 * @param {string} trecho - o que procurar.
 * @returns {number} a contagem.
 */
function ocorrencias(conteudo, trecho) {
  if (trecho === '') return 0
  let total = 0
  let posicao = conteudo.indexOf(trecho)
  while (posicao !== -1) {
    total += 1
    posicao = conteudo.indexOf(trecho, posicao + trecho.length)
  }
  return total
}

/**
 * Escolhe entre o trecho como foi declarado e a variante sem quebra final.
 * @param {string} conteudo - onde procurar.
 * @param {{original: string, adaptado: string}} item - a adaptação.
 * @returns {{original: string, adaptado: string, quantas: number}} o par a usar.
 */
function variante(conteudo, item) {
  const comQuebra = { original: item.original, adaptado: item.adaptado }
  const quantasComQuebra = ocorrencias(conteudo, comQuebra.original)
  if (quantasComQuebra > 0) return { ...comQuebra, quantas: quantasComQuebra }
  const semQuebra = {
    original: item.original.replace(/\n$/, ''),
    adaptado: item.adaptado.replace(/\n$/, ''),
  }
  return { ...semQuebra, quantas: ocorrencias(conteudo, semQuebra.original) }
}

/**
 * Aplica, em ordem de declaração, as adaptações de um arquivo.
 * @param {string} conteudo - o conteúdo lido da origem.
 * @param {object[]} itens - as adaptações daquele arquivo.
 * @returns {{ok: true, conteudo: string}|{ok: false, id: string, motivo: string,
 *   ocorrencias: number, esperado: string, encontrado: string}} o resultado.
 */
function aplicar(conteudo, itens) {
  let atual = conteudo
  for (const item of itens) {
    const escolha = variante(atual, item)
    if (escolha.quantas === 0) {
      return {
        ok: false,
        id: item.id,
        motivo: 'ausente',
        ocorrencias: 0,
        esperado: item.original,
        encontrado: atual.split('\n').slice(0, 3).join('\n'),
      }
    }
    if (escolha.quantas > 1) {
      return {
        ok: false,
        id: item.id,
        motivo: 'ambiguo',
        ocorrencias: escolha.quantas,
        esperado: item.original,
        encontrado: escolha.original,
      }
    }
    atual = atual.replace(escolha.original, escolha.adaptado)
  }
  return { ok: true, conteudo: atual }
}

module.exports = { aplicar, ocorrencias }
