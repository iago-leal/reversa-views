#!/usr/bin/env node
/**
 * O painel do processo no terminal (feature 014, D-04).
 *
 * Casca fina de linha de comando, com a lógica em `src/cli/` e a saída
 * compilada em `out-cli/`, do mesmo modo que `scripts/preview.js` mantém a
 * lógica em `scripts/preview/` e serve o pacote real da tela. A razão de a
 * saída ficar FORA de `out/` é o pacote instalável: o `.vscodeignore` readmite
 * `out/` inteiro, de modo que compilar a ferramenta junto com o host a levaria
 * para dentro da extensão que o usuário instala (D-03).
 *
 * Esta casca não decide nada. Ela confere que a unidade foi construída, nomeia
 * o comando que a constrói quando não foi, e entrega os argumentos crus ao
 * ponto de entrada. Toda a leitura, o desenho e a escolha do modo vivem do
 * outro lado, onde são conferíveis por suíte sem terminal.
 *
 * Uso:
 *     npm run painel
 *     npm run painel -- --workspace=/caminho/do/projeto
 *     node ./scripts/painel.js --passada
 *     node ./scripts/painel.js --dados > processo.json
 * @module scripts/painel
 */

const { existsSync } = require('node:fs')
const path = require('node:path')

const raiz = path.resolve(__dirname, '..')
const PONTO_DE_ENTRADA = path.join(raiz, 'out-cli', 'cli', 'index.js')

/** O comando que produz a unidade, nomeado na recusa e em nenhum outro lugar. */
const COMANDO_DE_CONSTRUCAO = 'npm run compile:cli'

/**
 * Roda a ferramenta, ou recusa quando a saída compilada não existe.
 * @param {string[]} argumentos - o que veio depois do nome do script.
 * @returns {Promise<number>} o código de saída.
 */
async function principal(argumentos) {
  if (!existsSync(PONTO_DE_ENTRADA)) {
    process.stderr.write(
      'a saída compilada da ferramenta não existe em out-cli/.\n' +
        `Construa-a com \`${COMANDO_DE_CONSTRUCAO}\` e rode de novo.\n`,
    )
    return 2
  }

  // Só depois da conferência: assim a mensagem de quem esqueceu a construção é
  // a que fala de construção, e não a falta de um módulo.
  const { principal: executar } = require(PONTO_DE_ENTRADA)
  return executar(argumentos)
}

if (require.main === module) {
  principal(process.argv.slice(2)).then((codigo) => {
    if (codigo !== 0) process.exit(codigo)
  })
}

module.exports = { COMANDO_DE_CONSTRUCAO, PONTO_DE_ENTRADA, principal }
