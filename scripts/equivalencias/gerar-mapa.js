/**
 * O gerador do módulo do mapa (T030, RF-18, D-11).
 *
 * É a peça que escreve código a partir de dados de terceiros, e por isso o
 * escape vem antes de tudo. A lição está registrada no gerador do carimbo da
 * construção: valor interpolado em vez de escapado produz módulo que não
 * compila, e o defeito só aparece na construção seguinte. Aqui o risco é
 * maior, porque os valores vêm de `state.json` que este repositório não
 * escreveu e não controla.
 *
 * Ele NÃO conhece o motor, e é assim que a separação entre propor e dispor se
 * torna verificável por inspeção: nenhuma linha deste arquivo, nem de quem ele
 * importa, fala com serviço algum.
 * @module scripts/equivalencias/gerar-mapa
 */

const { runInNewContext } = require('node:vm')

const DESTINO = 'src/domain/equivalencias.ts'

/** O par aprovado duas vezes com leituras diferentes: decisão contra decisão. */
class ConflitoDeEquivalencia extends Error {
  constructor(campo, valor, antes, agora) {
    super(
      `o par ${campo}: ${JSON.stringify(valor)} já está no mapa como "${antes}" e a proposta o aprova como "${agora}". ` +
        'Nada foi escrito. Decida qual das duas vale e corrija a proposta, ou remova o registro antigo à mão.',
    )
    this.name = 'ConflitoDeEquivalencia'
    this.campo = campo
    this.valor = valor
  }
}

/**
 * Um valor como literal de cadeia, seguro para qualquer conteúdo.
 * @param {string} valor - o que veio do arquivo alheio.
 * @returns {string} o literal, entre aspas simples.
 */
function literal(valor) {
  const escapado = String(valor)
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t')
  return `'${escapado}'`
}

/**
 * A identidade de um par nas tabelas auxiliares: campo e valor, nunca o campo
 * sozinho. Quatro valores de `status` são quatro decisões diferentes.
 * @param {string} campo - o nome do campo.
 * @param {string} valor - o valor comparável.
 * @returns {string} a chave composta.
 */
function chaveDoPar(campo, valor) {
  return `${campo}\u0000${valor}`
}

/**
 * A identidade de uma etapa nas tabelas auxiliares. O prefixo a separa das
 * chaves de registro que não é agente, que são texto livre e poderiam coincidir
 * com o nome de uma etapa.
 * @param {string} nome - o nome comparável da etapa.
 * @returns {string} a chave composta.
 */
function chaveDaEtapa(nome) {
  return `etapa\u0000${nome}`
}

/**
 * O nome de uma etapa como o mapa o guarda: aparado e em minúsculas, com os
 * diacríticos preservados, pelo precedente do valor comparável da 012.
 * @param {string} nome - o nome como veio da proposta.
 * @returns {string} o nome comparável.
 */
function nomeComparavel(nome) {
  return String(nome).trim().toLowerCase()
}

/**
 * O mapa novo, com o que a proposta aprovou acrescentado ao que já havia.
 *
 * Crescimento por acréscimo: registro antigo não é reescrito, e mantém a data
 * em que ELE foi aprovado. O par divergente é recusado com o conflito nomeado,
 * porque sobrescrever calado apagaria uma decisão anterior sem que ninguém
 * visse (D-11).
 * @param {object} atual - o mapa como está no módulo.
 *
 * As etapas (feature 015) entram pelo mesmo regime e sem conflito possível: o
 * registro não carrega leitura, de modo que aprovar de novo só UNE a evidência.
 * E elas são CARREGADAS mesmo quando a proposta não aprova nenhuma, que é o
 * cuidado maior: sem isso, uma promoção de checkpoints apagaria as etapas.
 * @param {{pares: object[], chaves: object[], etapas?: object[]}} aprovado - o que foi marcado.
 * @param {string} hoje - a data da aprovação, `YYYY-MM-DD`.
 * @param {Record<string, string[]>} evidencias - onde cada item foi visto.
 * @returns {object} o mapa novo, ordenado de modo estável.
 * @throws {ConflitoDeEquivalencia} quando um par contradiz o que já foi decidido.
 */
function fundir(atual, aprovado, hoje, evidencias = {}) {
  const pares = [...atual.pares]
  for (const novo of aprovado.pares) {
    const antigo = pares.find((p) => p.campo === novo.campo && p.valor === novo.valor)
    if (antigo !== undefined) {
      if (antigo.leitura !== novo.leitura) {
        throw new ConflitoDeEquivalencia(novo.campo, novo.valor, antigo.leitura, novo.leitura)
      }
      continue
    }
    pares.push({
      campo: novo.campo,
      valor: novo.valor,
      leitura: novo.leitura,
      aprovadoEm: hoje,
      evidencia: evidencias[chaveDoPar(novo.campo, novo.valor)] ?? [],
    })
  }

  const naoAgentes = [...atual.naoAgentes]
  for (const nova of aprovado.chaves) {
    if (naoAgentes.some((r) => r.chave === nova.chave)) continue
    naoAgentes.push({ chave: nova.chave, aprovadoEm: hoje, evidencia: evidencias[nova.chave] ?? [] })
  }

  const etapas = (atual.etapas ?? []).map((e) => ({ ...e, evidencia: [...e.evidencia] }))
  for (const nova of aprovado.etapas ?? []) {
    const nome = nomeComparavel(nova.nome)
    if (nome === '') continue
    const vistas = evidencias[chaveDaEtapa(nome)] ?? []
    const antiga = etapas.find((e) => e.nome === nome)
    if (antiga !== undefined) {
      antiga.evidencia = [...new Set([...antiga.evidencia, ...vistas])].sort()
      continue
    }
    etapas.push({ nome, aprovadoEm: hoje, evidencia: [...new Set(vistas)].sort() })
  }

  // Ordem estável, para que o diff mostre a decisão e não a ordem em que ela
  // por acaso foi lida.
  pares.sort((a, b) => `${a.campo}\u0000${a.valor}`.localeCompare(`${b.campo}\u0000${b.valor}`))
  naoAgentes.sort((a, b) => a.chave.localeCompare(b.chave))
  etapas.sort((a, b) => a.nome.localeCompare(b.nome))
  return { pares, naoAgentes, etapas }
}

/** A lista de evidência como literal, vazia inclusive. */
function literalDeLista(itens) {
  return itens.length === 0 ? '[]' : `[${itens.map(literal).join(', ')}]`
}

/**
 * O módulo inteiro, pronto para substituir o que está em disco.
 * @param {object} mapa - o mapa fundido.
 * @returns {string} o código TypeScript.
 */
function gerarModulo(mapa) {
  const pares = mapa.pares
    .map(
      (p) =>
        `    {\n` +
        `      campo: ${literal(p.campo)},\n` +
        `      valor: ${literal(p.valor)},\n` +
        `      leitura: ${literal(p.leitura)},\n` +
        `      aprovadoEm: ${literal(p.aprovadoEm)},\n` +
        `      evidencia: ${literalDeLista(p.evidencia)},\n` +
        `    },`,
    )
    .join('\n')
  const naoAgentes = mapa.naoAgentes
    .map(
      (r) =>
        `    {\n` +
        `      chave: ${literal(r.chave)},\n` +
        `      aprovadoEm: ${literal(r.aprovadoEm)},\n` +
        `      evidencia: ${literalDeLista(r.evidencia)},\n` +
        `    },`,
    )
    .join('\n')
  const etapas = (mapa.etapas ?? [])
    .map(
      (e) =>
        `    {\n` +
        `      nome: ${literal(e.nome)},\n` +
        `      aprovadoEm: ${literal(e.aprovadoEm)},\n` +
        `      evidencia: ${literalDeLista(e.evidencia)},\n` +
        `    },`,
    )
    .join('\n')
  // A lista vazia sai numa linha só, sem a linha em branco que o molde das
  // outras duas deixaria no meio do módulo.
  const blocoDeEtapas = etapas === '' ? '  etapas: [],' : `  etapas: [\n${etapas}\n  ],`

  return `/**
 * The approved map of out-of-schema equivalences (feature 012).
 *
 * GENERATED FILE. It is written by \`scripts/promover-equivalencias.js\`, from
 * the items a person ticked in a proposal, and it is not edited by hand: an
 * edit here would be an approval no one made and no history records.
 *
 * It is VERSIONED, unlike the build stamp and like the inherited revision. The
 * stamp changes at every commit; this map changes only when someone decides
 * something, which makes its git history the audit trail of the approvals
 * themselves -- who approved what, when, and against which evidence.
 *
 * It is a MODULE and not a \`.json\` because of how the package is assembled:
 * \`.vscodeignore\` lets back in only \`out/**\` and \`media/**\`, so a data file
 * under \`src/\` would never reach the \`.vsix\`.
 * @module domain/equivalencias
 */

import type { MapaDeEquivalencias } from './types.ts'

/** Everything a person has approved. */
export const MAPA_DE_EQUIVALENCIAS: MapaDeEquivalencias = {
  pares: [
${pares}
  ],
  naoAgentes: [
${naoAgentes}
  ],
${blocoDeEtapas}
}
`
}

/**
 * O mapa que está dentro do módulo em disco.
 *
 * Ele é lido do FONTE e não da saída compilada, de propósito: promover duas
 * vezes seguidas sem construir entre uma e outra leria, da saída, um estado
 * anterior, e a segunda aprovação apagaria a primeira sem aviso.
 *
 * A avaliação é de um literal que este mesmo módulo escreveu, num contexto sem
 * nada dentro. Não há require, não há processo e não há disco ao alcance do
 * que se avalia.
 * @param {string} texto - o conteúdo do módulo.
 * @returns {object} o mapa; vazio quando o módulo não tem o literal esperado.
 */
function lerMapaDeModulo(texto) {
  const corpo = texto.match(/MAPA_DE_EQUIVALENCIAS:\s*MapaDeEquivalencias\s*=\s*(\{[\s\S]*\})\s*$/m)
  // O mapa vazio segue com a forma da 012, sem `etapas`: o campo é opcional, e
  // ausente lê como nenhuma etapa aprovada.
  if (corpo === null) return { pares: [], naoAgentes: [] }
  try {
    const mapa = runInNewContext(`(${corpo[1]})`, Object.create(null), { timeout: 1000 })
    // As TRÊS listas. Devolver só as duas da 012 era o risco maior da feature
    // 015: a promoção funde sobre o que esta função devolve, e o que ela não
    // devolve deixa de existir no módulo regenerado.
    return { pares: mapa.pares ?? [], naoAgentes: mapa.naoAgentes ?? [], etapas: mapa.etapas ?? [] }
  } catch {
    return { pares: [], naoAgentes: [] }
  }
}

module.exports = {
  chaveDaEtapa, chaveDoPar, ConflitoDeEquivalencia, DESTINO, fundir, gerarModulo, lerMapaDeModulo, literal, nomeComparavel }
