/**
 * A camada que abre arquivos, e a única que o faz.
 *
 * O julgamento é função pura, e é por isso que ele é testável sem clone de
 * origem à mão. Todo o contato com o disco mora aqui: a árvore herdada, o
 * manifesto, as adaptações e o que se consegue ver das origens configuradas.
 * @module scripts/heranca/leitura
 */

const { execFileSync } = require('node:child_process')
const { existsSync, readFileSync, readdirSync, statSync } = require('node:fs')
const { dirname, join, posix, relative, sep } = require('node:path')

const { lerAdaptacoes, lerManifesto, validarConjunto } = require('./manifesto')
const { lerConfiguracao, resolver } = require('./origens')

/** A pasta que guarda a herança inteira. */
const PASTA_DA_HERANCA = 'src/heranca'
/** Os arquivos daquela pasta que são do repositório, e não herdados. */
const NAO_HERDADOS = new Set(['PROCEDENCIA.md', 'adaptacoes.yml', 'manifesto.yml'])

/**
 * Os arquivos de uma pasta, recursivamente, em caminho relativo com barras.
 * @param {string} raiz - a pasta de onde os caminhos se medem.
 * @param {string} pasta - a pasta a percorrer.
 * @returns {string[]} os caminhos, ordenados.
 */
function percorrer(raiz, pasta) {
  if (!existsSync(pasta)) return []
  const achados = []
  for (const item of readdirSync(pasta, { withFileTypes: true })) {
    const cheio = join(pasta, item.name)
    if (item.isDirectory()) achados.push(...percorrer(raiz, cheio))
    else if (item.isFile()) achados.push(relative(raiz, cheio).split(sep).join(posix.sep))
  }
  return achados.sort()
}

/**
 * Lê manifesto e adaptações, já validados um contra o outro.
 * @param {string} raiz - a raiz do repositório.
 * @returns {{manifesto: object, adaptacoes: object}} os dois documentos.
 */
function lerDeclaracoes(raiz) {
  const doManifesto = `${PASTA_DA_HERANCA}/manifesto.yml`
  const dasAdaptacoes = `${PASTA_DA_HERANCA}/adaptacoes.yml`
  const manifesto = lerManifesto(readFileSync(join(raiz, doManifesto), 'utf8'), doManifesto)
  const adaptacoes = lerAdaptacoes(readFileSync(join(raiz, dasAdaptacoes), 'utf8'), dasAdaptacoes)
  validarConjunto(manifesto, adaptacoes)
  return { manifesto, adaptacoes }
}

/**
 * O estado da árvore herdada no disco.
 * @param {string} raiz - a raiz do repositório.
 * @param {object} manifesto - o manifesto já lido.
 * @returns {{arquivos: Record<string, string|null>, extras: string[]}} o que há.
 */
function lerArvoreLocal(raiz, manifesto) {
  const noDisco = percorrer(raiz, join(raiz, PASTA_DA_HERANCA)).filter(
    (caminho) => !NAO_HERDADOS.has(caminho.slice(PASTA_DA_HERANCA.length + 1)),
  )
  const manifestados = new Set(manifesto.arquivos.map((entrada) => entrada.caminho))

  const arquivos = {}
  for (const entrada of manifesto.arquivos) {
    const cheio = join(raiz, entrada.caminho)
    arquivos[entrada.caminho] = existsSync(cheio) ? readFileSync(cheio, 'utf8') : null
  }
  return { arquivos, extras: noDisco.filter((caminho) => !manifestados.has(caminho)) }
}

/** As ferramentas de disco que a resolução de origem usa. */
const FERRAMENTAS = {
  existePasta: (caminho) => existsSync(caminho) && statSync(caminho).isDirectory(),
  revisaoDoGit: (caminho) => {
    try {
      return execFileSync('git', ['-C', caminho, 'rev-parse', 'HEAD'], {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      }).trim()
    } catch {
      return null
    }
  },
  versaoDoPacote: (caminho) => {
    try {
      return JSON.parse(readFileSync(join(caminho, 'package.json'), 'utf8')).version ?? null
    } catch {
      return null
    }
  },
}

/**
 * O que se consegue ver de cada origem nesta máquina.
 * @param {string} raiz - a raiz do repositório.
 * @param {object} manifesto - o manifesto já lido.
 * @param {object} ferramentas - o acesso ao disco, substituível em teste.
 * @returns {Record<string, object>} a resolução por nome de origem.
 */
function lerOrigens(raiz, manifesto, ferramentas = FERRAMENTAS) {
  const config = lerConfiguracao(raiz)
  const origens = {}
  for (const origem of manifesto.origens) {
    const resolvida = resolver(origem, config, ferramentas)
    if (resolvida.estado !== 'disponivel' || origem.tipo !== 'codigo') {
      origens[origem.nome] = resolvida
      continue
    }
    const entradas = manifesto.arquivos.filter((entrada) => entrada.origem === origem.nome)
    const arquivos = {}
    for (const entrada of entradas) {
      const cheio = join(resolvida.caminho, entrada.caminhoNaOrigem)
      if (existsSync(cheio)) arquivos[entrada.caminhoNaOrigem] = readFileSync(cheio, 'utf8')
    }
    const pastas = new Set(entradas.map((entrada) => dirname(entrada.caminhoNaOrigem)))
    const conhecidos = new Set(entradas.map((entrada) => entrada.caminhoNaOrigem))
    const extras = []
    for (const pasta of pastas) {
      const cheia = join(resolvida.caminho, pasta)
      if (!existsSync(cheia)) continue
      for (const item of readdirSync(cheia, { withFileTypes: true })) {
        if (!item.isFile()) continue
        const relativo = `${pasta}/${item.name}`
        if (!conhecidos.has(relativo)) extras.push(relativo)
      }
    }
    origens[origem.nome] = { ...resolvida, arquivos, extras: extras.sort() }
  }
  return origens
}

module.exports = {
  FERRAMENTAS,
  NAO_HERDADOS,
  PASTA_DA_HERANCA,
  lerArvoreLocal,
  lerDeclaracoes,
  lerOrigens,
  percorrer,
}
