/**
 * A leitura que o preview responde (RF-09, RF-09a, RF-17, D-07, D-08).
 *
 * Nenhuma regra de leitura nasce aqui. O caminho normal chama `sessionMessages`
 * e `readWorkspace` da saída compilada, que são os mesmos que o host chama
 * dentro do editor, de modo que a ordem das mensagens é decidida num lugar só.
 * O que este módulo acrescenta é o desvio dos três estados forçados e a espera
 * do atraso declarado.
 *
 * Os estados forçados não tocam disco, e nenhum deles constrói um processo à
 * mão. O de sem Reversa usa o leitor herdado sobre o retrato vazio que ele
 * próprio oferece: é o mesmo código que roda num workspace sem instalação, com
 * a diferença de que o retrato chega vazio em vez de vir do disco.
 *
 * O atraso é observado aqui, do lado do servidor, e não no navegador. A regra
 * de qual mensagem sai em que ordem é do host, e é ela que o atraso exercita;
 * medido no cliente, o atraso mediria o cliente.
 *
 * O desfecho forçado da consulta (D-17, feature 007) é a exceção que confirma a
 * regra. O host de verdade envia o processo, depois "consultando", e a resposta
 * só chega quando a origem responde; entregues no mesmo ciclo, o estado em
 * curso jamais seria pintado, que é o defeito que o portão visual da feature
 * 005 já achou uma vez na releitura. Por isso a sequência sai em duas partes:
 * as mensagens de sempre, e um bloco "depois" com o atraso a observar antes de
 * entregar o desfecho. O servidor repassa o bloco sem lê-lo, e é o cliente que
 * espera.
 * @module scripts/preview/leitura
 */

const { EMPTY_SNAPSHOT, readReversa } = require('../../out/heranca/reversa-domain/src/index.js')
const { EMPTY_DECOMPOSITION, EMPTY_HISTORY } = require('../../out/domain/types.js')
const {
  BUILT_FROM_COMMIT,
  BUILT_FROM_ROOT,
  EXTENSION_VERSION,
} = require('../../out/host/build.js')
const { INHERITED_MODEL_REVISION } = require('../../out/host/inheritance.js')
const { readWorkspace } = require('../../out/host/reading.js')
const { sessionMessages } = require('../../out/host/session.js')

/** O carimbo desta construção, o mesmo que o host de verdade passa (RF-17). */
const CARIMBO = { version: EXTENSION_VERSION, commit: BUILT_FROM_COMMIT, root: BUILT_FROM_ROOT }

/**
 * Quanto o cliente espera entre o processo e o desfecho forçado, quando o
 * atraso declarado é zero: o suficiente para o estado "consultando" existir na
 * tela por um instante, e curto demais para atrapalhar quem confere.
 */
const ATRASO_MINIMO_DO_DESFECHO_MS = 800

/** O relatório de uma sonda que não foi a lugar algum. */
function sondaVazia(workspace) {
  return { workspace, featureDir: null, sessionDir: null, refusals: [], truncated: [] }
}

/** As mensagens de cada estado forçado, sem disco de permeio. */
function forcadas(estado, workspace) {
  switch (estado) {
    case 'sem-diretorio':
      return [{ command: 'setEntry', data: { kind: 'no-folder' } }]
    case 'erro':
      return [
        {
          command: 'setEntry',
          data: {
            kind: 'error',
            message: 'erro forçado pelo preview, para conferir a tela de falha',
            root: workspace,
            ignoredRoots: [],
          },
        },
      ]
    case 'sem-reversa':
      return [
        {
          command: 'setProcess',
          data: {
            process: readReversa(EMPTY_SNAPSHOT),
            probe: sondaVazia(workspace),
            readAt: new Date().toISOString(),
            entry: 'no-reversa',
            root: workspace,
            ignoredRoots: [],
            inheritedRevision: INHERITED_MODEL_REVISION,
            // Os dois ramos da feature 006, na forma vazia: o estado forçado
            // não toca disco, e a tela precisa distinguir leitura vazia de
            // leitura não realizada.
            decomposition: EMPTY_DECOMPOSITION,
            history: EMPTY_HISTORY,
            extensionVersion: CARIMBO.version,
            builtFromCommit: CARIMBO.commit,
          },
        },
      ]
    default:
      return null
  }
}

/**
 * O desfecho forçado, na forma que o protocolo declara para cada estado.
 *
 * As contagens e a causa são inventadas, e escolhidas para que a tela mostre
 * plural, número e causa distinta de rede: é o que o portão visual precisa ver.
 * @param {string} estado - um dos sete nomes, ou "nenhum".
 * @returns {object|null} o desfecho, ou nulo quando nada foi forçado.
 */
function desfechoForcado(estado) {
  switch (estado) {
    case 'atrasada':
      return { estado, commits: 4 }
    case 'divergente':
      return { estado, commits: 3 }
    case 'impossivel':
      return { estado, causa: 'limite-de-taxa' }
    case 'nenhum':
      return null
    default:
      return { estado }
  }
}

/**
 * O bloco entregue depois do processo, quando há desfecho forçado.
 *
 * "Consultando" vai junto com o processo, como o host faz; o desfecho vai no
 * bloco que o cliente segura pelo atraso. Forçar "consultando" é o caso em que
 * o bloco fica vazio: o estado em curso é o próprio desfecho, e não há nada a
 * chegar depois dele.
 * @param {string} estado - o desfecho pedido na linha de comando.
 * @param {number} atraso - o atraso declarado, em milissegundos.
 * @returns {{agora: object[], depois: {atraso: number, mensagens: object[]}|null}}
 */
function sequenciaDoDesfecho(estado, atraso) {
  const desfecho = desfechoForcado(estado)
  if (desfecho === null) return { agora: [], depois: null }

  const consultando = { command: 'setUpdate', data: { estado: 'consultando' } }
  if (desfecho.estado === 'consultando' || desfecho.estado === 'desligada') {
    return { agora: [{ command: 'setUpdate', data: desfecho }], depois: null }
  }
  return {
    agora: [consultando],
    depois: {
      atraso: Math.max(atraso, ATRASO_MINIMO_DO_DESFECHO_MS),
      mensagens: [{ command: 'setUpdate', data: desfecho }],
    },
  }
}

/**
 * Monta a função que o servidor chama a cada pedido de leitura.
 * @param {{workspace: string, estado: string, atualizacao: string, atraso: number}} config -
 *   a configuração lida da linha de comando.
 * @param {(linha: string) => void} registrar - o terminal do preview.
 * @returns {() => Promise<{mensagens: object[], depois: object|null}>} a
 *   leitura, sempre nova.
 */
function criarLeitura(config, registrar) {
  return async function ler() {
    if (config.atraso > 0) await new Promise((pronto) => setTimeout(pronto, config.atraso))

    const forcado = forcadas(config.estado, config.workspace)
    const mensagens =
      forcado !== null
        ? forcado
        : // Cada pedido lê o workspace de novo: alterar um arquivo do Reversa e
          // acionar a releitura no painel tem de mostrar o estado novo, como no
          // editor. Leitura guardada é leitura mentirosa.
          sessionMessages(
            [config.workspace],
            (raiz) => readWorkspace(raiz, { log: { write: registrar } }),
            CARIMBO,
          ).messages

    // O desfecho só acompanha um processo, como no host: sem processo na
    // sequência não há construção a conferir, e forçar um desfecho sobre a tela
    // de erro seria mostrar um estado que o editor nunca produz.
    const temProcesso = mensagens.some((mensagem) => mensagem.command === 'setProcess')
    const { agora, depois } = temProcesso
      ? sequenciaDoDesfecho(config.atualizacao ?? 'nenhum', config.atraso)
      : { agora: [], depois: null }

    return { mensagens: [...mensagens, ...agora], depois }
  }
}

module.exports = { ATRASO_MINIMO_DO_DESFECHO_MS, criarLeitura, desfechoForcado, sequenciaDoDesfecho }
