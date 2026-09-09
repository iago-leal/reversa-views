/**
 * A ressincronização, em duas fases separadas de propósito.
 *
 * `planejar` monta tudo em memória e não abre um arquivo sequer para escrita;
 * `aplicar` grava um plano já aprovado. A separação é o que garante RN-09: ou
 * a revisão nova entra inteira, ou não entra nada, e o repositório nunca fica
 * com metade dela aplicada.
 *
 * Três situações param o planejamento antes de qualquer escrita: edição local
 * não declarada, adaptação que deixou de casar e arquivo preso a paridade
 * externa. Nenhuma delas é resolvível por script, porque todas exigem que
 * alguém decida o que vale mais, a cópia ou a origem.
 * @module scripts/heranca/ressincronizar
 */

const { mkdirSync, readFileSync, writeFileSync } = require('node:fs')
const { dirname, join } = require('node:path')
const { parse } = require('yaml')

const { aplicar: aplicarAdaptacoes } = require('./adaptacoes')
const { conteudoHerdado, escreverCarimbo, resumoDe } = require('./carimbo')
const { cabecalhoDe, escreverManifesto } = require('./manifesto')

/** O caminho do manifesto dentro do repositório. */
const CAMINHO_DO_MANIFESTO = 'src/heranca/manifesto.yml'

/** As duas únicas saídas de uma edição local não declarada (RN-08). */
const SAIDAS_DA_EDICAO = [
  'declarar a adaptação em src/heranca/adaptacoes.yml, com o trecho original e o adaptado',
  'descartar a edição, restaurando o arquivo pela cópia da origem',
]

/**
 * Monta a recusa, sempre sem passos: plano recusado não se aplica pela metade.
 * @param {string} motivo - o nome da recusa.
 * @param {object} extras - o que a recusa precisa dizer.
 * @returns {object} o plano recusado.
 */
function recusar(motivo, extras) {
  return { ok: false, motivo, ...extras }
}

/**
 * Planeja a ressincronização de uma origem, sem tocar o disco.
 * @param {{manifesto: object, adaptacoes: object, local: object, origem: object,
 *   hoje: string}} contexto - o estado já lido.
 * @returns {object} o plano aprovado, com passos, ou a recusa.
 */
function planejar(contexto) {
  const { manifesto, adaptacoes, local, origem, hoje } = contexto

  if (!origem || origem.estado !== 'disponivel') {
    return recusar('origem-indisponivel', {
      detalhes: [
        `${origem?.nome ?? 'a origem'} não está ao alcance: ${origem?.motivo ?? 'não resolvida'}`,
      ],
      saidas: [
        'declare o caminho da origem em heranca.origens.yml, copiando heranca.origens.exemplo.yml',
      ],
    })
  }

  const declarada = manifesto.origens.find((item) => item.nome === origem.nome)
  const entradas = manifesto.arquivos.filter((entrada) => entrada.origem === origem.nome)

  const editados = []
  for (const entrada of entradas) {
    const conteudo = local.arquivos[entrada.caminho]
    if (conteudo === null || conteudo === undefined) continue
    const carimbado = entrada.carimbado !== false
    if (resumoDe(conteudoHerdado(conteudo, carimbado)) !== entrada.resumo) {
      editados.push(entrada.caminho)
    }
  }
  if (editados.length > 0) {
    return recusar('edicao-local', {
      detalhes: editados.map((caminho) => `${caminho} difere do resumo declarado no manifesto`),
      saidas: SAIDAS_DA_EDICAO,
    })
  }

  const adaptados = new Map()
  for (const entrada of entradas) {
    const naOrigem = origem.arquivos?.[entrada.caminhoNaOrigem]
    if (naOrigem === undefined) continue
    const citadas = new Set(entrada.adaptacoes ?? [])
    const itens = (adaptacoes?.adaptacoes ?? []).filter((item) => citadas.has(item.id))
    const resultado = aplicarAdaptacoes(naOrigem, itens)
    if (!resultado.ok) {
      return recusar('adaptacao-nao-casa', {
        detalhes: [
          `a adaptação ${resultado.id} está ${resultado.motivo} em ${entrada.caminhoNaOrigem}`,
        ],
        esperado: resultado.esperado,
        encontrado: resultado.encontrado,
        saidas: [
          'atualize o trecho original da adaptação em src/heranca/adaptacoes.yml',
          'ou remova a adaptação, se a origem já resolveu o que ela corrigia',
        ],
      })
    }
    adaptados.set(entrada.caminho, resultado.conteudo)
  }

  const presos = entradas.filter(
    (entrada) =>
      entrada.paridadeExterna &&
      adaptados.has(entrada.caminho) &&
      resumoDe(adaptados.get(entrada.caminho)) !== entrada.resumo,
  )
  if (presos.length > 0) {
    return recusar('paridade-externa', {
      detalhes: presos.map(
        (entrada) =>
          `${entrada.caminho} anda junto com ${entrada.paridadeExterna}, e a origem mudou os dois lados`,
      ),
      saidas: [
        'compare os dois arquivos à mão e decida qual versão vale, antes de ressincronizar',
      ],
    })
  }

  const passos = []
  for (const entrada of entradas) {
    if (!adaptados.has(entrada.caminho)) continue
    const herdado = adaptados.get(entrada.caminho)
    const resumo = resumoDe(herdado)
    if (resumo === entrada.resumo) continue
    const carimbado = entrada.carimbado !== false
    const carimbo = carimbado
      ? escreverCarimbo({
          origem: origem.nome,
          endereco: declarada?.endereco,
          caminho: entrada.caminhoNaOrigem,
          revisao: origem.revisaoCorrente,
          dataDaRevisao: origem.dataDaRevisao,
          copiadoEm: hoje,
          adaptacoes: entrada.adaptacoes ?? [],
        })
      : ''
    passos.push({ caminho: entrada.caminho, conteudo: carimbo + herdado, resumo })
  }

  return {
    ok: true,
    passos,
    origem: {
      nome: origem.nome,
      revisao: origem.revisaoCorrente,
      dataDaRevisao: origem.dataDaRevisao,
      dataDaCopia: hoje,
    },
  }
}

/**
 * Grava um plano aprovado, e só ele.
 * @param {{raiz: string, plano: object}} pedido - a raiz do repositório e o plano.
 * @returns {{escritos: string[]}} os caminhos escritos, relativos à raiz.
 */
function aplicar(pedido) {
  const { raiz, plano } = pedido
  if (!plano || plano.ok !== true) {
    throw new Error(
      `plano não aprovado (${plano?.motivo ?? 'sem motivo'}): nada foi escrito no disco`,
    )
  }

  const escritos = []
  for (const passo of plano.passos) {
    const destino = join(raiz, passo.caminho)
    mkdirSync(dirname(destino), { recursive: true })
    writeFileSync(destino, passo.conteudo, 'utf8')
    escritos.push(passo.caminho)
  }

  const caminhoDoManifesto = join(raiz, CAMINHO_DO_MANIFESTO)
  const texto = readFileSync(caminhoDoManifesto, 'utf8')
  const dado = parse(texto)
  const novos = new Map(plano.passos.map((passo) => [passo.caminho, passo.resumo]))
  for (const entrada of dado.arquivos ?? []) {
    if (novos.has(entrada.caminho)) entrada.resumo = novos.get(entrada.caminho)
  }
  for (const origem of dado.origens ?? []) {
    if (origem.nome !== plano.origem.nome) continue
    origem.revisao = plano.origem.revisao
    origem.dataDaRevisao = plano.origem.dataDaRevisao
    origem.dataDaCopia = plano.origem.dataDaCopia
  }
  writeFileSync(caminhoDoManifesto, escreverManifesto(cabecalhoDe(texto), dado), 'utf8')
  escritos.push(CAMINHO_DO_MANIFESTO)

  return { escritos }
}

module.exports = { CAMINHO_DO_MANIFESTO, aplicar, planejar }
