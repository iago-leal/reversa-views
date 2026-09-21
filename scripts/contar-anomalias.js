#!/usr/bin/env node
/**
 * A contagem das anomalias de uma raiz (feature 015, RF-16, D-20).
 *
 * Casca fina, no molde de `scripts/painel.js`: a lógica vive em
 * `src/cli/contagem.ts` e a saída compilada em `out-cli/`, FORA de `out/`, para
 * que nada disto viaje no pacote instalável. A razão de a contagem morar na
 * unidade de terminal é a promessa que ela faz: contar o que o painel EXIBE. Só
 * há um jeito de cumpri-la, que é passar pela mesma leitura e pela mesma
 * composição, e as duas estão em TypeScript.
 *
 * Só leitura. Não escreve arquivo, não fala com o motor e não abre rede.
 *
 * Uso:
 *     npm run contar:anomalias -- ~/dev
 *     npm run contar:anomalias -- ~/dev --json
 * @module scripts/contar-anomalias
 */

const { existsSync } = require('node:fs')
const path = require('node:path')

const raizDoRepo = path.resolve(__dirname, '..')
const PONTO_DE_ENTRADA = path.join(raizDoRepo, 'out-cli', 'cli', 'contagem.js')

/** O comando que produz a unidade, o mesmo que o painel nomeia. */
const COMANDO_DE_CONSTRUCAO = 'npm run compile:cli'

/** Se a unidade de terminal foi construída. */
function construida(pontoDeEntrada = PONTO_DE_ENTRADA) {
  return existsSync(pontoDeEntrada)
}

/**
 * A tabela da contagem, para quem a chama de dentro de outro script.
 *
 * O aprendizado a chama com o mapa vigente; a promoção, com o mapa QUE ACABOU
 * DE FUNDIR, de modo que o número impresso já reflete a aprovação sem que nada
 * precise ser recompilado. Sem `out-cli/`, devolve null: a falta da ferramenta
 * de terminal não derruba uma promoção já escrita (D-21).
 * @param {string} raiz - a pasta que contém os projetos.
 * @param {{mapa?: object, pontoDeEntrada?: string}} opcoes - o mapa a aplicar.
 * @returns {string[]|null} as linhas da tabela, ou null quando não há unidade.
 */
function tabelaDaRaiz(raiz, opcoes = {}) {
  const pontoDeEntrada = opcoes.pontoDeEntrada ?? PONTO_DE_ENTRADA
  if (!construida(pontoDeEntrada)) return null
  const { contarAnomalias, tabelaDaContagem } = require(pontoDeEntrada)
  return tabelaDaContagem(contarAnomalias(raiz, opcoes.mapa === undefined ? {} : { mapa: opcoes.mapa }))
}

/**
 * Roda o comando, ou recusa quando a saída compilada não existe.
 * @param {string[]} argumentos - o que veio depois do nome do script.
 * @returns {number} o código de saída.
 */
function principal(argumentos) {
  if (!construida()) {
    process.stderr.write(
      'a saída compilada da ferramenta não existe em out-cli/.\n' +
        `Construa-a com \`${COMANDO_DE_CONSTRUCAO}\` e rode de novo.\n`,
    )
    return 2
  }

  const { executarContagem } = require(PONTO_DE_ENTRADA)
  // O progresso sai AO VIVO, e pela saída de erro: sessenta e quatro leituras
  // levam alguns segundos, e a saída padrão é só do documento.
  const { codigo, saida, erro } = executarContagem(argumentos, {
    progresso: (projeto) => process.stderr.write(`lendo ${projeto}\n`),
  })
  for (const linha of erro) process.stderr.write(`${linha}\n`)
  for (const linha of saida) process.stdout.write(`${linha}\n`)
  return codigo
}

if (require.main === module) process.exit(principal(process.argv.slice(2)))

module.exports = { COMANDO_DE_CONSTRUCAO, PONTO_DE_ENTRADA, construida, principal, tabelaDaRaiz }
