#!/usr/bin/env node
/**
 * O aprendizado: quem PROPÕE, e nunca dispõe (T031, RF-09, RF-12, RF-14).
 *
 * Ele varre os `state.json` de uma raiz, isola os pares que ninguém decidiu,
 * elide o conteúdo, pergunta ao motor local e escreve uma proposta em Markdown.
 * O mapa não é tocado em passo algum, e essa é a promessa que o roteiro de
 * conferência manda verificar com `git status` logo depois de rodar.
 *
 * Fora do `npm run build`, no mesmo regime dos auxiliares `estragar:*`: nada
 * aqui é embarcado no pacote, e a extensão continua sem conhecer serviço algum.
 *
 * Uso:
 *     node ./scripts/aprender-equivalencias.js
 *     node ./scripts/aprender-equivalencias.js --raiz=~/dev --modelo=qwen3:8b
 * @module scripts/aprender-equivalencias
 */

const { existsSync, readFileSync, readdirSync, statSync, writeFileSync } = require('node:fs')
const { homedir } = require('node:os')
const path = require('node:path')

const { coletar } = require('./equivalencias/coletar')
const { elidirCheckpoint } = require('./equivalencias/elidir')
const { lerMapaDeModulo, DESTINO } = require('./equivalencias/gerar-mapa')
const { MODELO_PADRAO, criarClassificador } = require('./equivalencias/motor')
const { escreverProposta } = require('./equivalencias/proposta')

const raizDoRepo = path.resolve(__dirname, '..')

/** Onde a proposta é escrita, e onde a promoção vai procurá-la. */
const PROPOSTA = 'propostas/equivalencias.md'

/** Um argumento nomeado, ou o padrão. */
function argumento(argumentos, nome, padrao) {
  const achado = argumentos.find((a) => a.startsWith(`--${nome}=`))
  return achado === undefined ? padrao : achado.slice(nome.length + 3)
}

/** O til do começo, resolvido, porque quem digita a raiz digita `~/dev`. */
function resolverRaiz(bruta) {
  const expandida = bruta.startsWith('~') ? path.join(homedir(), bruta.slice(1)) : bruta
  return path.resolve(expandida)
}

/**
 * Os `state.json` de uma raiz: o dela própria, se houver, e o de cada filha.
 * @param {string} raiz - a pasta a varrer.
 * @returns {{projeto: string, stateJson: string}[]} o que foi lido.
 */
function lerEstados(raiz) {
  const candidatos = [raiz]
  try {
    for (const nome of readdirSync(raiz)) {
      const filha = path.join(raiz, nome)
      try {
        if (statSync(filha).isDirectory()) candidatos.push(filha)
      } catch {
        // Pasta que não se deixa olhar não para a varredura.
      }
    }
  } catch {
    // Raiz ilegível: sobra ela própria, e o relato dirá que nada foi achado.
  }

  const estados = []
  for (const pasta of candidatos) {
    const arquivo = path.join(pasta, '.reversa', 'state.json')
    if (!existsSync(arquivo)) continue
    try {
      estados.push({ projeto: path.basename(pasta), stateJson: readFileSync(arquivo, 'utf8') })
    } catch {
      // Arquivo ilegível é um projeto a menos, nunca uma rodada a menos.
    }
  }
  return estados
}

/** Uma linha no terminal, que é o registro desta ferramenta. */
function registrar(linha) {
  process.stdout.write(`${linha}\n`)
}

/**
 * Roda o aprendizado.
 * @param {string[]} argumentos - o que veio depois do nome do script.
 * @param {object} deps - o classificador, que a suíte substitui.
 * @returns {Promise<number>} o código de saída.
 */
async function principal(argumentos = [], deps = {}) {
  const raiz = resolverRaiz(argumento(argumentos, 'raiz', raizDoRepo))
  const modelo = argumento(argumentos, 'modelo', MODELO_PADRAO)
  const saida = path.resolve(raizDoRepo, argumento(argumentos, 'saida', PROPOSTA))
  const classificar = deps.classificar ?? criarClassificador({ modelo })

  const moduloAtual = existsSync(path.join(raizDoRepo, DESTINO))
    ? readFileSync(path.join(raizDoRepo, DESTINO), 'utf8')
    : ''
  // O mapa também é injetável, e não só o classificador: sem isso a suíte do
  // aprendizado mudaria de resultado a cada aprovação feita no mapa de verdade.
  const mapa = deps.mapa ?? lerMapaDeModulo(moduloAtual)

  const estados = lerEstados(raiz)
  registrar(`raiz: ${raiz}`)
  registrar(`projetos com state.json: ${estados.length}`)
  registrar(`já decididos: ${mapa.pares.length} pares, ${mapa.naoAgentes.length} entradas`)

  const { pares, chaves } = coletar({ estados, mapa })
  if (pares.length === 0 && chaves.length === 0) {
    registrar('nada inédito a propor; o mapa já decide tudo o que apareceu')
  }
  registrar(`a classificar: ${pares.length} pares e ${chaves.length} entradas, a ~3 s por pergunta`)

  // Duas passagens, e a ordem entre elas é a diferença entre uma proposta que
  // se lê e uma que se descarta.
  //
  // Na PRIMEIRA, cada checkpoint distinto é perguntado sem campo em foco: o
  // motor aponta qual dos campos fala de estado, e essa escolha é o filtro. Sem
  // ela, perguntar "este campo fala de estado?" sobre `verde: 569` colhe um sim
  // educado, e a rodada real devolveu trinta e nove pares dos quais trinta e
  // dois eram ruído.
  //
  // Na SEGUNDA, o foco é usado, mas só sobre campos que a primeira já elegeu
  // como campos de estado. É o que recupera o segundo valor de um mesmo campo,
  // como `status: "success"` ao lado de `status: "concluido"`, sem reabrir a
  // porta para os campos de conteúdo.
  const propostos = []
  const naoClassificados = []
  const camposDeEstado = new Set()
  const decidido = new Map()

  /** Uma classificação, ou o encerramento da rodada quando o motor não responde. */
  async function perguntar(exemplo, campoEmFoco) {
    try {
      return { ok: true, valor: await classificar(elidirCheckpoint(exemplo), campoEmFoco) }
    } catch (erro) {
      // Motor fora do ar é causa nomeada e rodada encerrada, sem proposta pela
      // metade: metade de uma proposta parece uma proposta inteira.
      registrar(`\nerro: o motor local não respondeu (${erro.message}).`)
      registrar('nada foi escrito. Confira se ele está no ar e rode de novo.')
      return { ok: false }
    }
  }

  // Um checkpoint por vez, e não um par por vez: os pares do mesmo checkpoint
  // compartilham o exemplo, e perguntar de novo pagaria três segundos pela
  // mesma resposta.
  const exemplos = new Map()
  for (const par of pares) {
    const atual = exemplos.get(par.exemplo) ?? []
    atual.push(par)
    exemplos.set(par.exemplo, atual)
  }

  for (const [exemplo, doExemplo] of exemplos) {
    const resposta = await perguntar(exemplo, null)
    if (!resposta.ok) return 1
    const classificacao = resposta.valor
    if (classificacao === null || classificacao.leitura === 'nao-e-sinal') continue

    camposDeEstado.add(classificacao.campo)
    const apontado = doExemplo.find((par) => par.campo === classificacao.campo)
    if (apontado !== undefined) {
      decidido.set(`${apontado.campo}\u0000${apontado.valor}`, {
        leitura: classificacao.leitura,
        razao: classificacao.razao,
      })
    }
  }

  for (const par of pares) {
    const id = `${par.campo}\u0000${par.valor}`
    if (decidido.has(id)) {
      propostos.push({ ...par, ...decidido.get(id) })
      continue
    }
    if (!camposDeEstado.has(par.campo)) {
      naoClassificados.push({
        campo: par.campo,
        valor: par.valor,
        causa: 'o motor não apontou este campo como campo de estado',
      })
      continue
    }

    const resposta = await perguntar(par.exemplo, par.campo)
    if (!resposta.ok) return 1
    const classificacao = resposta.valor
    if (classificacao === null) {
      // Nulo é toda resposta inutilizável: sobre outro campo, fora do
      // vocabulário, sem JSON ou fora do tempo. Nenhuma delas é sugestão, e
      // nenhuma vira item com caixa.
      naoClassificados.push({ campo: par.campo, valor: par.valor, causa: 'o motor não respondeu sobre este campo' })
      continue
    }
    if (classificacao.leitura === 'nao-e-sinal') {
      naoClassificados.push({ campo: par.campo, valor: par.valor, causa: 'o motor não vê sinal de estado neste valor' })
      continue
    }
    propostos.push({ ...par, leitura: classificacao.leitura, razao: classificacao.razao })
  }

  // A razão de uma entrada não vem do motor: vem do que ela traz escrito. Ver
  // os campos é o que permite dizer se aquilo é um agente que esqueceu de
  // declarar conclusão ou um registro de decisão morando no mapa de
  // checkpoints, e essa distinção não é do modelo, é de quem conhece o projeto.
  const chavesPropostas = chaves.map((chave) => ({
    ...chave,
    razao: Object.keys(chave.exemplo).join(', '),
  }))

  const texto = escreverProposta({ pares: propostos, chaves: chavesPropostas, naoClassificados })
  const pasta = path.dirname(saida)
  if (!existsSync(pasta)) require('node:fs').mkdirSync(pasta, { recursive: true })
  writeFileSync(saida, texto, 'utf8')

  registrar(`\nproposta escrita em ${path.relative(raizDoRepo, saida)}`)
  registrar(`propostos: ${propostos.length} pares e ${chavesPropostas.length} entradas`)
  if (naoClassificados.length > 0) registrar(`não classificados: ${naoClassificados.length} (a proposta os nomeia)`)
  registrar('o mapa NÃO foi tocado. Marque o que aprovar e rode `npm run promover:equivalencias`.')
  return 0
}

if (require.main === module) {
  principal(process.argv.slice(2))
    .then((codigo) => process.exit(codigo))
    .catch((erro) => {
      process.stderr.write(`${erro.stack}\n`)
      process.exit(1)
    })
}

module.exports = { PROPOSTA, lerEstados, principal, resolverRaiz }
