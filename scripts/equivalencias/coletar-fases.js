/**
 * O coletor dos nomes de fase que ainda precisam de decisão (feature 015,
 * RF-12, D-04, D-14, D-16, D-18).
 *
 * Três filtros vêm antes de qualquer pergunta, nesta ordem, e cada um tira do
 * motor o que não é dele:
 *
 * 1. a forma de identificador (RN-07): texto sem espaço e com até quarenta
 *    caracteres. O que passa disso é prosa gravada no lugar de fase, defeito
 *    na fonte, e continua anomalia;
 * 2. o que a forma ou o mapa já decidem: fase canônica, de encerramento, de
 *    ciclo ou etapa aprovada. Perguntar de novo seria pagar duas vezes;
 * 3. o erro de grafia (RN-12), que vai a uma lista à parte, sem caixa.
 *
 * Só o que sobra é candidato. E o candidato é proposto pela BASE, sem o sufixo
 * numérico: `re-extracao-003`, `-004` e `-005` são um candidato só, com os três
 * nomes como evidência. Aprovada a base, a leitura reconhece as variantes. O
 * erro possível é propor `x-ciclo` para `x-ciclo-2`, e ele cai diante de uma
 * pessoa, que é para isso que a proposta existe.
 *
 * Nada aqui toca disco. Os estados chegam já lidos.
 * @module scripts/equivalencias/coletar-fases
 */

const { classificarNome } = require('./fases')
const { erroDeGrafia } = require('./grafia')

/** Acima disto um valor não é nome, é conteúdo (RN-07). */
const LIMITE_DE_NOME = 40

/**
 * O sufixo numérico na forma ESTREITA da coleta: separador, letras opcionais
 * coladas e inteiro ao fim. Mais estreita que a da leitura de propósito: aqui a
 * base ainda não é conhecida, e a forma larga comeria metade do nome.
 */
const SUFIXO_DA_COLETA = /[-_][a-z]*\d+$/

/** As palavras que não contam como palavra em comum entre dois nomes. */
const PREPOSICOES = new Set(['de', 'da', 'do', 'e', 'em'])

/** As três listas de nomes de fase, e nenhuma outra chave de topo. */
const LISTAS = ['phase', 'completed', 'pending']

/**
 * Se o valor tem forma de identificador (RN-07).
 * @param {unknown} valor - o que a lista carrega.
 * @returns {boolean} true para texto não vazio, sem espaço e com até 40 caracteres.
 */
function formaDeIdentificador(valor) {
  return typeof valor === 'string' && valor.length > 0 && valor.length <= LIMITE_DE_NOME && !/\s/.test(valor)
}

/**
 * A base candidata de um nome: o comparável, sem o sufixo numérico estreito.
 * @param {string} nome - o nome como o arquivo o carrega.
 * @returns {string} a base; o nome inteiro quando retirar o sufixo não deixaria nada.
 */
function baseCandidata(nome) {
  const comparavel = nome.trim().toLowerCase()
  const base = comparavel.replace(SUFIXO_DA_COLETA, '')
  return base === '' ? comparavel : base
}

/** Os nomes de uma das três listas, como lista, seja ela texto ou vetor. */
function nomesDaLista(estado, lista) {
  const bruto = estado?.[lista]
  if (typeof bruto === 'string') return [bruto]
  return Array.isArray(bruto) ? bruto.filter((item) => typeof item === 'string') : []
}

/**
 * O que ainda precisa de decisão entre os nomes de fase.
 *
 * Os projetos são percorridos em ordem alfabética, para que a mesma raiz
 * produza a mesma pergunta: os vizinhos de um candidato são os da primeira
 * lista em que ele foi visto, no primeiro projeto. E os vizinhos passam pelo
 * filtro da forma ANTES de sair (D-18): sem isso, a prosa de um `pending`
 * defeituoso viajaria como contexto de um nome legítimo.
 * @param {{estados: {projeto: string, stateJson: string}[], mapa: object}} entrada -
 *   os estados lidos e o mapa já aprovado.
 * @returns {{candidatos: object[], grafia: object[]}} o que é inédito, em ordem estável.
 */
function coletarFases({ estados, mapa }) {
  const candidatos = new Map()
  const grafia = new Map()
  const emOrdem = [...estados].sort((a, b) => a.projeto.localeCompare(b.projeto))

  for (const { projeto, stateJson } of emOrdem) {
    let estado
    try {
      estado = JSON.parse(stateJson)
    } catch {
      continue
    }
    if (estado === null || typeof estado !== 'object') continue

    for (const lista of LISTAS) {
      const nomes = nomesDaLista(estado, lista)
      for (const nome of nomes) {
        if (!formaDeIdentificador(nome)) continue
        if (classificarNome(nome, mapa).tipo !== 'desconhecida') continue

        const canonica = erroDeGrafia(nome)
        if (canonica !== null) {
          const erro = grafia.get(nome) ?? { nome, canonica, evidencia: new Set() }
          erro.evidencia.add(projeto)
          grafia.set(nome, erro)
          continue
        }

        const base = baseCandidata(nome)
        const atual = candidatos.get(base) ?? {
          nome: base,
          nomes: new Set(),
          evidencia: new Set(),
          lista,
          vizinhos: nomes.filter(formaDeIdentificador),
        }
        atual.nomes.add(nome)
        atual.evidencia.add(projeto)
        candidatos.set(base, atual)
      }
    }
  }

  const fechar = (item) => ({
    ...item,
    ...(item.nomes === undefined ? {} : { nomes: [...item.nomes].sort() }),
    evidencia: [...item.evidencia].sort(),
  })
  const porNome = (a, b) => a.nome.localeCompare(b.nome)
  return {
    candidatos: [...candidatos.values()].map(fechar).sort(porNome),
    grafia: [...grafia.values()].map(fechar).sort(porNome),
  }
}

/** As palavras de um nome: os segmentos entre `-` e `_`, sem as preposições. */
function palavras(nome) {
  return new Set(
    nome
      .toLowerCase()
      .split(/[-_]/)
      .filter((parte) => parte !== '' && !PREPOSICOES.has(parte)),
  )
}

/**
 * Os pares que vale comparar (D-16).
 *
 * O número de pares cresce com o quadrado dos nomes, e todo par sem palavra em
 * comum saiu `diferentes` na prova de viabilidade. Por isso só se compara quem
 * partilha ao menos uma palavra: os candidatos julgados etapa entre si, e cada
 * um deles contra as etapas já aprovadas. Duas etapas já aprovadas não se
 * comparam, porque não há decisão pendente entre elas.
 * @param {string[]} julgadas - os candidatos que o motor julgou etapa.
 * @param {string[]} aprovadas - as etapas que o mapa já traz.
 * @returns {{a: string, b: string}[]} os pares, ordenados e sem repetição.
 */
function paresElegiveis(julgadas, aprovadas) {
  const novas = [...new Set(julgadas)]
  const todas = [...new Set([...novas, ...aprovadas])]
  const pares = new Map()

  for (const nova of novas) {
    for (const outra of todas) {
      if (nova === outra) continue
      const [a, b] = [nova, outra].sort((x, y) => x.localeCompare(y))
      const emComum = [...palavras(a)].some((palavra) => palavras(b).has(palavra))
      if (emComum) pares.set(`${a}\u0000${b}`, { a, b })
    }
  }
  return [...pares.values()].sort((x, y) => `${x.a}\u0000${x.b}`.localeCompare(`${y.a}\u0000${y.b}`))
}

module.exports = {
  baseCandidata, coletarFases, formaDeIdentificador, LIMITE_DE_NOME, palavras, paresElegiveis }
