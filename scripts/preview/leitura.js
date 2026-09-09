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
 * @module scripts/preview/leitura
 */

const { EMPTY_SNAPSHOT, readReversa } = require('../../out/heranca/reversa-domain/src/index.js')
const { INHERITED_MODEL_REVISION } = require('../../out/host/inheritance.js')
const { readWorkspace } = require('../../out/host/reading.js')
const { sessionMessages } = require('../../out/host/session.js')

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
          },
        },
      ]
    default:
      return null
  }
}

/**
 * Monta a função que o servidor chama a cada pedido de leitura.
 * @param {{workspace: string, estado: string, atraso: number}} config - a
 *   configuração lida da linha de comando.
 * @param {(linha: string) => void} registrar - o terminal do preview.
 * @returns {() => Promise<{mensagens: object[]}>} a leitura, sempre nova.
 */
function criarLeitura(config, registrar) {
  return async function ler() {
    if (config.atraso > 0) await new Promise((pronto) => setTimeout(pronto, config.atraso))

    const forcado = forcadas(config.estado, config.workspace)
    if (forcado !== null) return { mensagens: forcado }

    // Cada pedido lê o workspace de novo: alterar um arquivo do Reversa e
    // acionar a releitura no painel tem de mostrar o estado novo, como no
    // editor. Leitura guardada é leitura mentirosa.
    const { messages } = sessionMessages([config.workspace], (raiz) =>
      readWorkspace(raiz, { log: { write: registrar } }),
    )
    return { mensagens: messages }
  }
}

module.exports = { criarLeitura }
