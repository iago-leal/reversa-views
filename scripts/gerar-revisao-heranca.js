#!/usr/bin/env node
/**
 * O gerador da constante de revisão do modelo.
 *
 * O painel mostra de que revisão do modelo veio a leitura, e não pode abrir
 * arquivo em tempo de execução para descobrir isso (D-06). A revisão entra no
 * bundle como constante, e esta é a ferramenta que a mantém em dia a partir do
 * manifesto, que é a fonte de verdade.
 *
 * O ressincronizador não escreve esta constante (D-14): ele mexe na herança, e
 * a geração é passo à parte, encadeado no build, para que o artefato gerado
 * nunca dependa de alguém ter lembrado de rodar o comando certo.
 * @module scripts/gerar-revisao-heranca
 */

const { readFileSync, writeFileSync } = require('node:fs')
const { join } = require('node:path')

const { lerManifesto } = require('./heranca/manifesto')

/** Onde a constante mora, dentro do host. */
const DESTINO = 'src/host/inheritance.ts'
/** De onde a revisão vem. */
const FONTE = 'src/heranca/manifesto.yml'

/**
 * O texto do módulo gerado.
 * @param {string} revisao - a revisão do modelo, como o manifesto a declara.
 * @returns {string} o arquivo inteiro.
 */
function modulo(revisao) {
  return `/**
 * ARQUIVO GERADO: não editar à mão.
 *
 * Gerado por \`scripts/gerar-revisao-heranca.js\` a partir de
 * \`src/heranca/manifesto.yml\`, que é a fonte de verdade da procedência.
 * Para mudar o valor abaixo, ressincronize a herança e rode
 * \`npm run gerar:revisao-heranca\`; editar aqui só faria a constante mentir
 * sobre o código que ela descreve.
 *
 * A revisão entra no bundle como constante justamente para que o painel não
 * precise abrir arquivo algum em tempo de execução.
 * @module host/inheritance
 */

/** The revision of the model this copy of the reading layer came from. */
export const INHERITED_MODEL_REVISION = '${revisao}'
`
}

/**
 * Lê o manifesto e grava a constante.
 * @param {string} raiz - a raiz do repositório.
 * @returns {string} a revisão gravada.
 */
function principal(raiz) {
  const manifesto = lerManifesto(readFileSync(join(raiz, FONTE), 'utf8'), FONTE)
  const modelo = manifesto.origens.find((origem) => origem.tipo === 'codigo')
  if (!modelo?.revisao) {
    throw new Error(`${FONTE} não declara a revisão da origem de código`)
  }
  writeFileSync(join(raiz, DESTINO), modulo(modelo.revisao), 'utf8')
  return modelo.revisao
}

if (require.main === module) {
  const revisao = principal(process.cwd())
  process.stdout.write(`${DESTINO} gerado com a revisão ${revisao}\n`)
}

module.exports = { DESTINO, FONTE, modulo, principal }
