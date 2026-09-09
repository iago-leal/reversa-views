/**
 * O inventário: a lista de arquivos do manifesto, construída a partir do disco.
 *
 * Escrever à mão trinta e sete resumos de sessenta e quatro caracteres seria
 * pedir erro. A lista nasce daqui, e o cabeçalho do manifesto avisa isso a quem
 * chegar depois. O que a ferramenta não inventa é procedência: a origem, o
 * caminho nela e as adaptações vêm do carimbo que o arquivo já carrega, e a
 * paridade externa vem do manifesto anterior ou da declaração abaixo.
 * @module scripts/heranca/inventario
 */

const { readFileSync } = require('node:fs')
const { join, posix } = require('node:path')

const { conteudoHerdado, lerCarimbo, resumoDe, temCarimbo } = require('./carimbo')
const { cabecalhoDe, escreverManifesto } = require('./manifesto')
const { NAO_HERDADOS, PASTA_DA_HERANCA, percorrer } = require('./leitura')

/**
 * Os arquivos herdados que também existem instalados em outro lugar do
 * repositório, e cuja igualdade byte a byte é conferida por suíte própria.
 * Ressincronizar um deles sozinho quebraria a paridade, e por isso o
 * ressincronizador recusa mexer neles sem decisão humana.
 */
const PARIDADES_EXTERNAS = {
  'src/heranca/reversa-domain/tests/fixtures/check-legacy-policy.mjs':
    '.reversa/hooks/check-legacy-policy.mjs',
}

/**
 * Monta a entrada de manifesto de um arquivo herdado.
 * @param {{caminho: string, conteudo: string, origens: object[], adaptacoes: object,
 *   anterior?: object}} dados - o arquivo e o contexto em que ele vive.
 * @returns {object} a entrada, pronta para o manifesto.
 */
function entradaDe(dados) {
  const { caminho, conteudo, origens, adaptacoes, anterior } = dados
  const carimbado = temCarimbo(conteudo)
  const carimbo = carimbado ? lerCarimbo(conteudo) : null
  const daCasa = origens.find((origem) => origem.tipo === 'codigo')
  const origem = origens.find((item) => item.nome === carimbo?.origem) ?? daCasa
  const relativo = caminho.slice(PASTA_DA_HERANCA.length + 1)
  const declaradas = (adaptacoes.adaptacoes ?? [])
    .filter((item) => item.arquivo === caminho)
    .map((item) => item.id)

  const entrada = {
    caminho,
    origem: origem.nome,
    caminhoNaOrigem: carimbo?.caminho ?? posix.join(origem.prefixoNaOrigem ?? '', relativo),
    carimbado,
    resumo: resumoDe(conteudoHerdado(conteudo, carimbado)),
    dataDaCopia: carimbo?.copiadoEm ?? origem.dataDaCopia ?? null,
    adaptacoes: carimbo?.adaptacoes ?? declaradas,
  }
  const paridade = anterior?.paridadeExterna ?? PARIDADES_EXTERNAS[caminho]
  if (paridade) entrada.paridadeExterna = paridade
  return entrada
}

/**
 * Percorre a pasta da herança e monta a lista inteira.
 * @param {{raiz: string, manifesto: object, adaptacoes: object}} contexto - o estado lido.
 * @returns {object[]} as entradas, em ordem de caminho.
 */
function inventariar(contexto) {
  const { raiz, manifesto, adaptacoes } = contexto
  const anteriores = new Map(manifesto.arquivos.map((entrada) => [entrada.caminho, entrada]))
  return percorrer(raiz, join(raiz, PASTA_DA_HERANCA))
    .filter((caminho) => !NAO_HERDADOS.has(caminho.slice(PASTA_DA_HERANCA.length + 1)))
    .map((caminho) =>
      entradaDe({
        caminho,
        conteudo: readFileSync(join(raiz, caminho), 'utf8'),
        origens: manifesto.origens,
        adaptacoes,
        anterior: anteriores.get(caminho),
      }),
    )
}

/**
 * Grava a lista no manifesto, preservando o cabeçalho comentado.
 * @param {{raiz: string, arquivos: object[]}} pedido - a raiz e a lista nova.
 * @returns {number} quantos arquivos ficaram declarados.
 */
function gravarInventario(pedido) {
  const destino = join(pedido.raiz, PASTA_DA_HERANCA, 'manifesto.yml')
  const texto = readFileSync(destino, 'utf8')
  const { parse } = require('yaml')
  const dado = parse(texto)
  dado.arquivos = pedido.arquivos
  require('node:fs').writeFileSync(destino, escreverManifesto(cabecalhoDe(texto), dado), 'utf8')
  return pedido.arquivos.length
}

module.exports = { PARIDADES_EXTERNAS, entradaDe, gravarInventario, inventariar }
