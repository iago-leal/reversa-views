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

const { existsSync, readFileSync, writeFileSync } = require('node:fs')
const path = require('node:path')

const { coletar } = require('./equivalencias/coletar')
const { coletarFases, paresElegiveis } = require('./equivalencias/coletar-fases')
const { elidirCheckpoint } = require('./equivalencias/elidir')
const { lerEstados, resolverRaiz } = require('./equivalencias/estados')
const { lerMapaDeModulo, DESTINO } = require('./equivalencias/gerar-mapa')
const { MODELO_PADRAO, criarClassificador, criarClassificadorDeFases } = require('./equivalencias/motor')
const { escreverProposta } = require('./equivalencias/proposta')
const { COMANDO_DE_CONSTRUCAO, tabelaDaRaiz } = require('./contar-anomalias')

const raizDoRepo = path.resolve(__dirname, '..')

/** Onde a proposta é escrita, e onde a promoção vai procurá-la. */
const PROPOSTA = 'propostas/equivalencias.md'

/** Um argumento nomeado, ou o padrão. */
function argumento(argumentos, nome, padrao) {
  const achado = argumentos.find((a) => a.startsWith(`--${nome}=`))
  return achado === undefined ? padrao : achado.slice(nome.length + 3)
}

/**
 * A raiz como a proposta a anota: com o til no lugar da pasta pessoal, para que
 * o arquivo não carregue o nome de usuário de quem aprendeu.
 * @param {string} raiz - a raiz resolvida.
 * @returns {string} a raiz abreviada.
 */
function abreviarRaiz(raiz) {
  const pessoal = require('node:os').homedir()
  return raiz === pessoal || raiz.startsWith(`${pessoal}${path.sep}`) ? `~${raiz.slice(pessoal.length)}` : raiz
}

/** Uma linha no terminal, que é o registro desta ferramenta. */
function registrar(linha) {
  process.stdout.write(`${linha}\n`)
}

/**
 * A contagem da raiz ao fim de uma rodada (feature 015, RF-16, D-21).
 *
 * Mora aqui, e a promoção a importa, porque as duas dizem a mesma coisa do
 * mesmo jeito. Sem `out-cli/` a contagem não roda, e isso NÃO muda o código de
 * saída: a rodada já fez o que tinha a fazer, e a falta da ferramenta de
 * terminal não é motivo para chamar de falha uma proposta ou uma promoção já
 * escritas.
 * @param {string} raiz - a raiz a contar.
 * @param {object} mapa - o mapa a aplicar na contagem.
 * @param {(raiz: string, mapa: object) => string[]|null} contar - quem conta.
 * @param {(linha: string) => void} dizer - onde as linhas saem.
 */
function imprimirContagem(raiz, mapa, contar, dizer) {
  const tabela = contar(raiz, mapa)
  if (tabela === null) {
    dizer(`\na contagem da raiz não rodou: a unidade de terminal não existe em out-cli/.`)
    dizer(`construa-a com \`${COMANDO_DE_CONSTRUCAO}\` e conte com \`npm run contar:anomalias -- ${raiz}\`.`)
    return
  }
  dizer('')
  for (const linha of tabela) dizer(linha)
}

/** A contagem de verdade, que a suíte substitui. */
function contarDeVerdade(raiz, mapa) {
  return tabelaDaRaiz(raiz, { mapa })
}

/**
 * A passagem das fases (feature 015, RF-12, RF-13, RF-17).
 *
 * Vem DEPOIS da dos checkpoints e antes de qualquer escrita, e é essa ordem que
 * sustenta a promessa de que proposta pela metade não existe: conexão recusada
 * aqui encerra a rodada sem escrever nada, ainda que os checkpoints já tenham
 * sido todos classificados.
 *
 * Os filtros da forma, da decisão já tomada e da grafia moram na coleta; aqui
 * só chega ao motor o que é dele. Primeiro a natureza, uma vez por candidato;
 * depois a comparação, só entre os que saíram `etapa` e só nos pares com palavra
 * em comum.
 * @param {{estados: object[], mapa: object, motor: {natureza: Function, comparar: Function}}} entrada -
 *   os estados lidos, o mapa vigente e as duas perguntas.
 * @returns {Promise<{ok: true, fases: object}|{ok: false, erro: Error}>} a seção
 *   de fases, ou a falha de transporte que encerra a rodada.
 */
async function passagemDasFases({ estados, mapa, motor }) {
  const { candidatos, grafia } = coletarFases({ estados, mapa })
  const comCaixa = []
  const recusados = []
  const mesmas = []

  try {
    for (const candidato of candidatos) {
      const resposta = await motor.natureza(candidato.nome, candidato.vizinhos)
      if (resposta !== null && resposta.leitura === 'nao-e-fase') {
        recusados.push({ nome: candidato.nome, evidencia: candidato.evidencia })
        continue
      }
      // Nulo é toda resposta inutilizável, e o nome entra COM caixa, marcado
      // como não classificado: decidir sem a sugestão é pior que decidir com
      // ela, e melhor que o nome sumir da proposta.
      comCaixa.push({ ...candidato, classificado: resposta !== null })
    }

    const julgadas = comCaixa.filter((c) => c.classificado).map((c) => c.nome)
    const aprovadas = (mapa.etapas ?? []).map((etapa) => etapa.nome)
    for (const { a, b } of paresElegiveis(julgadas, aprovadas)) {
      const resposta = await motor.comparar(a, b)
      if (resposta !== null && resposta.leitura === 'mesma') mesmas.push({ a, b, razao: resposta.razao })
    }
  } catch (erro) {
    return { ok: false, erro }
  }

  return { ok: true, fases: { candidatos: comCaixa, mesmas, grafia, recusados } }
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
  // Quem injeta o classificador dos checkpoints e não o das fases roda SEM a
  // passagem das fases. É o que mantém as suítes da 012 sem linha reescrita e,
  // mais que isso, sem motor: o padrão aqui é o transporte de verdade, e uma
  // suíte que o herdasse por omissão ligaria para `localhost`.
  const motorDasFases =
    deps.classificarFases ?? (deps.classificar === undefined ? criarClassificadorDeFases({ modelo }) : null)
  // A mesma regra para a contagem: ela lê a unidade compilada, e a suíte que não
  // a pediu não deve depender de `out-cli/` existir.
  const contarPorOmissao = deps.classificar === undefined ? contarDeVerdade : null
  const contar = deps.contar === undefined ? contarPorOmissao : deps.contar

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

  let fases
  if (motorDasFases !== null) {
    const passagem = await passagemDasFases({ estados, mapa, motor: motorDasFases })
    if (!passagem.ok) {
      registrar(`\nerro: o motor local não respondeu na passagem das fases (${passagem.erro.message}).`)
      registrar('nada foi escrito, nem a parte dos checkpoints. Confira se ele está no ar e rode de novo.')
      return 1
    }
    fases = passagem.fases
    registrar(
      `fases: ${fases.candidatos.length} nomes a decidir, ${fases.grafia.length} erros de grafia, ` +
        `${fases.recusados.length} recusados pelo motor`,
    )
  }

  const texto = escreverProposta({ pares: propostos, chaves: chavesPropostas, naoClassificados, fases, raiz: abreviarRaiz(raiz) })
  const pasta = path.dirname(saida)
  if (!existsSync(pasta)) require('node:fs').mkdirSync(pasta, { recursive: true })
  writeFileSync(saida, texto, 'utf8')

  registrar(`\nproposta escrita em ${path.relative(raizDoRepo, saida)}`)
  registrar(`propostos: ${propostos.length} pares e ${chavesPropostas.length} entradas`)
  if (naoClassificados.length > 0) registrar(`não classificados: ${naoClassificados.length} (a proposta os nomeia)`)
  registrar('o mapa NÃO foi tocado. Marque o que aprovar e rode `npm run promover:equivalencias`.')
  // Com o mapa VIGENTE: aprender não aprova, e o número é o de antes da decisão.
  if (contar !== null) imprimirContagem(raiz, mapa, contar, registrar)
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

module.exports = {
  PROPOSTA,
  abreviarRaiz,
  contarDeVerdade,
  imprimirContagem,
  lerEstados,
  passagemDasFases,
  principal,
  resolverRaiz,
}
