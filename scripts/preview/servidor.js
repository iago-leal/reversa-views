/**
 * O servidor do preview: cinco rotas e nenhuma linha a mais (RF-07, RF-12,
 * RN-02, RN-03, D-01, D-06).
 *
 * O contrato inteiro está em `interfaces/canal-do-preview.md`. Ele cabe em
 * cinco rotas porque o canal do painel tem cinco comandos e dois deles, o
 * pronto e a releitura, não precisam de servidor: o host fingido responde aos
 * dois buscando a leitura.
 *
 * O servidor não escreve nada, em lugar nenhum: lê o workspace, serve o que o
 * empacotamento deixou e imprime linhas no terminal. Escuta apenas na
 * interface de retorno da máquina, e recusa requisição que declare outra
 * origem, porque é ferramenta local e não serviço.
 *
 * Diante de envelope torto ele se comporta como o roteador do host: uma linha
 * no registro e nenhum efeito, jamais um erro de servidor. O painel foi feito
 * para conversar com aquele roteador, e o preview existe para parecer com ele.
 * @module scripts/preview/servidor
 */

const { createServer } = require('node:http')

/** O corpo do canal leva caminho e linha de registro, e nada maior. */
const LIMITE_DO_CORPO = 8192

/** Os caminhos que existem, para a mensagem de 404 poder nomeá-los. */
const CAMINHOS = ['/', '/main.js', '/main.css', '/processo', '/canal']

/** O tipo de cada arquivo do pacote da tela. */
const TIPOS = {
  'main.js': 'application/javascript; charset=utf-8',
  'main.css': 'text/css; charset=utf-8',
}

/**
 * Cria o servidor, sem colocá-lo para escutar.
 * @param {{pagina: () => string, arquivo: (nome: string) => Buffer|null,
 *   leitura: () => Promise<object>, registrar: (linha: string) => void}} deps -
 *   tudo o que o servidor serve chega de fora, para que o que ele decida seja
 *   só o roteamento.
 * @returns {import('node:http').Server} o servidor pronto para escutar.
 */
function criarServidor(deps) {
  return createServer((requisicao, resposta) => {
    void atender(requisicao, resposta, deps).catch((erro) => {
      deps.registrar(`servidor · falha inesperada: ${erro.message}`)
      responder(resposta, 500, 'text/plain; charset=utf-8', 'falha inesperada no preview')
    })
  })
}

/** Uma requisição, do começo ao fim. */
async function atender(requisicao, resposta, deps) {
  const origem = requisicao.headers.origin
  if (origem !== undefined && origem !== `http://${requisicao.headers.host}`) {
    deps.registrar(`servidor · origem recusada: ${origem}`)
    return responder(resposta, 403, 'text/plain; charset=utf-8', 'o preview só atende a si mesmo')
  }

  const caminho = (requisicao.url ?? '/').split('?')[0]
  const metodo = requisicao.method ?? 'GET'

  if (!CAMINHOS.includes(caminho)) {
    return responder(
      resposta,
      404,
      'text/plain; charset=utf-8',
      `caminho desconhecido: ${caminho}\nos que existem: ${CAMINHOS.join(', ')}`,
    )
  }

  const esperado = caminho === '/canal' ? 'POST' : 'GET'
  if (metodo !== esperado) {
    return responder(
      resposta,
      405,
      'text/plain; charset=utf-8',
      `método não previsto em ${caminho}: aceita-se ${esperado}`,
    )
  }

  if (caminho === '/') {
    return responder(resposta, 200, 'text/html; charset=utf-8', deps.pagina())
  }

  if (caminho === '/main.js' || caminho === '/main.css') {
    const nome = caminho.slice(1)
    const conteudo = deps.arquivo(nome)
    if (conteudo === null) {
      return responder(
        resposta,
        500,
        'text/plain; charset=utf-8',
        `${nome} não está na pasta de saída. Rode \`npm run build\` e recarregue.`,
      )
    }
    return responder(resposta, 200, TIPOS[nome], conteudo)
  }

  if (caminho === '/processo') {
    let carga
    try {
      carga = await deps.leitura()
    } catch (erro) {
      // O painel tem tela para erro; o navegador não tem tela para 500.
      deps.registrar(`servidor · leitura lançou: ${erro.message}`)
      carga = { mensagens: [{ command: 'setEntry', data: { kind: 'error', message: erro.message } }] }
    }
    resposta.setHeader('cache-control', 'no-store')
    return responder(resposta, 200, 'application/json; charset=utf-8', JSON.stringify(carga))
  }

  return atenderCanal(requisicao, resposta, deps)
}

/** O retorno do painel: uma linha no terminal e 204, sempre. */
async function atenderCanal(requisicao, resposta, deps) {
  let corpo
  try {
    corpo = await lerCorpo(requisicao)
  } catch (erro) {
    // A conexão fecha junto: sem isso, o cliente segue enviando um corpo que
    // ninguém vai ler, e a resposta que já saiu se perderia no meio.
    resposta.setHeader('connection', 'close')
    return responder(resposta, 413, 'text/plain; charset=utf-8', erro.message)
  }

  registrarEnvelope(corpo, deps.registrar)
  resposta.writeHead(204)
  resposta.end()
}

/** Traduz um envelope do painel em linha de terminal, como o roteador faz. */
function registrarEnvelope(corpo, registrar) {
  let envelope
  try {
    envelope = JSON.parse(corpo)
  } catch {
    return registrar('canal · envelope recusado: não é JSON')
  }

  if (typeof envelope !== 'object' || envelope === null) {
    return registrar(`canal · envelope recusado: não é objeto: ${typeof envelope}`)
  }

  const { command, data } = envelope
  switch (command) {
    case 'openFile':
      return registrar(`canal · abertura pedida: ${texto(data, 'path')} (nenhum editor abre aqui)`)
    case 'log':
      return registrar(`webview · linha: ${texto(data, 'message')}`)
    case 'dispatch':
      return registrar('canal · comando recusado: "dispatch" é reservado e não tem tratador')
    case 'onLoaded':
    case 'reload':
      return registrar(`canal · ${command} não deveria chegar ao servidor: o host fingido o trata`)
    default:
      return registrar(`canal · comando desconhecido: ${JSON.stringify(command)}`)
  }
}

/** Um campo de texto da carga, ou a menção de que ele não veio. */
function texto(data, nome) {
  if (typeof data !== 'object' || data === null) return '(carga malformada)'
  const valor = data[nome]
  return typeof valor === 'string' ? valor : '(carga malformada)'
}

/** O corpo inteiro, ou a recusa quando ele passa do limite. */
function lerCorpo(requisicao) {
  return new Promise((pronto, falhar) => {
    const pedacos = []
    let total = 0
    requisicao.on('data', (pedaco) => {
      total += pedaco.length
      if (total > LIMITE_DO_CORPO) {
        requisicao.pause()
        falhar(new Error(`corpo acima de ${LIMITE_DO_CORPO} B: o canal leva caminho e linha`))
        return
      }
      pedacos.push(pedaco)
    })
    requisicao.on('end', () => pronto(Buffer.concat(pedacos).toString('utf8')))
    requisicao.on('error', falhar)
  })
}

/** Uma resposta, com tipo e corpo. */
function responder(resposta, codigo, tipo, corpo) {
  if (resposta.headersSent) return
  resposta.writeHead(codigo, { 'content-type': tipo })
  resposta.end(corpo)
}

module.exports = { CAMINHOS, LIMITE_DO_CORPO, criarServidor }
