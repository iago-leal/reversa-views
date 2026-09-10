#!/usr/bin/env node
/**
 * O preview: a tela do painel fora do editor (RF-06, RF-12, RF-13, D-01).
 *
 * Casca fina de linha de comando, com a lógica em `scripts/preview/`, do mesmo
 * modo que a herança faz: um servidor de arquivos estáticos com cinco rotas
 * não justifica dependência, e cada dependência é dívida futura num projeto de
 * atenção intermitente.
 *
 * Ele existe porque a tela é a única parte deste repositório que suíte verde
 * não confere: cor, contraste, quebra de linha e seção que não abre passam por
 * teste e aparecem no olho. O que ele serve é o pacote real, sob o documento
 * real, com a leitura real.
 *
 * Uso:
 *     node ./scripts/preview.js
 *     node ./scripts/preview.js --workspace=/outro --tema=claro --atraso=1200
 *     node ./scripts/preview.js --estado=sem-reversa
 * @module scripts/preview
 */

const { existsSync, readFileSync, statSync } = require('node:fs')
const path = require('node:path')

const { ErroDeConfiguracao, lerConfiguracao } = require('./preview/config')
const { criarServidor } = require('./preview/servidor')

const raiz = path.resolve(__dirname, '..')
const SAIDA_DA_TELA = path.join(raiz, 'out', 'res', 'webview')

/** O que se sabe do disco, apartado da decisão para que ela seja testável. */
const mundo = {
  raiz,
  eDiretorio: (caminho) => existsSync(caminho) && statSync(caminho).isDirectory(),
  temPacoteDaTela: () =>
    ['main.js', 'main.css'].every((nome) => existsSync(path.join(SAIDA_DA_TELA, nome))),
}

/** Uma linha no terminal do preview, que é o registro desta ferramenta. */
function registrar(linha) {
  process.stdout.write(`${linha}\n`)
}

/**
 * Roda o preview até alguém interrompê-lo.
 * @param {string[]} argumentos - o que veio depois do nome do script.
 * @returns {Promise<number>} o código de saída.
 */
async function principal(argumentos) {
  let config
  try {
    config = lerConfiguracao(argumentos, mundo)
  } catch (erro) {
    if (!(erro instanceof ErroDeConfiguracao)) throw erro
    process.stderr.write(`${erro.message}\n`)
    return 1
  }

  // Só depois da configuração conferida: assim a mensagem de quem esqueceu a
  // construção é a que fala de construção, e não a falta de um módulo.
  const { criarLeitura } = require('./preview/leitura')
  const { montarPagina } = require('./preview/pagina')

  const cliente = readFileSync(path.join(__dirname, 'preview', 'cliente.js'), 'utf8')
  const origem = `http://127.0.0.1:${config.porta}`

  const servidor = criarServidor({
    pagina: () => montarPagina({ config, origem, cliente }),
    arquivo: (nome) => {
      const caminho = path.join(SAIDA_DA_TELA, nome)
      return existsSync(caminho) ? readFileSync(caminho) : null
    },
    leitura: criarLeitura(config, registrar),
    registrar,
  })

  return new Promise((pronto) => {
    servidor.on('error', (erro) => {
      if (erro.code === 'EADDRINUSE') {
        process.stderr.write(
          `a porta ${config.porta} está ocupada.\n` +
            'Escolha outra com --porta=<número>, ou encerre o preview que já está servindo.\n',
        )
        pronto(1)
        return
      }
      process.stderr.write(`${erro.message}\n`)
      pronto(1)
    })

    servidor.listen(config.porta, '127.0.0.1', () => {
      registrar(`Preview servindo em ${origem}`)
      registrar(`  workspace: ${config.workspace}`)
      registrar(
        `  tema: ${config.tema}   estado: ${config.estado}   desfecho: ${config.atualizacao}   atraso: ${config.atraso} ms`,
      )
      registrar('  Ctrl+C encerra. Nada é escrito em disco.')
    })
  })
}

if (require.main === module) {
  principal(process.argv.slice(2)).then((codigo) => {
    if (codigo !== 0) process.exit(codigo)
  })
}

module.exports = { principal }
