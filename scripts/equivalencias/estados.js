/**
 * A varredura dos `state.json` de uma raiz (T005 da feature 013).
 *
 * O corpo veio de `scripts/aprender-equivalencias.js`, da feature 012, e foi
 * movido para cá sem alteração de comportamento: o aprendizado continua sendo
 * um consumidor, e o prompt do harness passa a ser o segundo. Copiar a
 * varredura para o comando novo criaria a terceira implementação de uma coisa
 * que nenhuma suíte de paridade cobre, e o preço de descobrir a divergência
 * seria pago num projeto que ninguém está olhando.
 *
 * Um ACRÉSCIMO ao que a 012 devolvia, e vale declarar: cada estado passa a
 * carregar também a `pasta` de onde veio. O prompt precisa nomear a raiz em que
 * deve ser colado, e reconstruí-la juntando a raiz varrida com o nome do
 * projeto seria repetir, no consumidor, uma conta que a varredura já fez. O
 * consumidor anterior lê `projeto` e `stateJson`, e ignora o campo novo.
 *
 * Nada aqui julga: a varredura olha, e quem decide é quem chama.
 * @module scripts/equivalencias/estados
 */

const { existsSync, readFileSync, readdirSync, statSync } = require('node:fs')
const { homedir } = require('node:os')
const path = require('node:path')

/**
 * O til do começo, resolvido, porque quem digita a raiz digita `~/dev`.
 * @param {string} bruta - a raiz como veio do argumento.
 * @returns {string} o caminho absoluto.
 */
function resolverRaiz(bruta) {
  const expandida = bruta.startsWith('~') ? path.join(homedir(), bruta.slice(1)) : bruta
  return path.resolve(expandida)
}

/**
 * Os `state.json` de uma raiz: o dela própria, se houver, e o de cada filha.
 * @param {string} raiz - a pasta a varrer.
 * @returns {{projeto: string, pasta: string, stateJson: string}[]} o que foi lido.
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
      estados.push({
        projeto: path.basename(pasta),
        pasta,
        stateJson: readFileSync(arquivo, 'utf8'),
      })
    } catch {
      // Arquivo ilegível é um projeto a menos, nunca uma rodada a menos.
    }
  }
  return estados
}

module.exports = { lerEstados, resolverRaiz }
