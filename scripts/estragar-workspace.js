#!/usr/bin/env node
/**
 * Uma cópia estragada de um workspace, para alcançar o estado degradado
 * (RF-09b, RN-02, D-17).
 *
 * O painel tem um estado que nenhum workspace saudável produz: Reversa
 * instalado, porém com arquivo ilegível, o que abre a seção de anomalias.
 * Alcançá-lo exigia ou estragar um repositório de verdade, ou versionar um
 * arquivo corrompido aqui dentro. Este auxiliar faz o terceiro caminho: copia
 * o workspace para pasta temporária do sistema, trunca lá, e imprime o
 * caminho da cópia.
 *
 * Quem escreve é ele, e não o preview: o preview não escreve nada, em lugar
 * nenhum. E o que ele escreve fica fora do repositório e fora do workspace de
 * origem, que não é tocado.
 *
 * Uso:
 *     node ./scripts/estragar-workspace.js
 *     node ./scripts/preview.js --workspace=$(node ./scripts/estragar-workspace.js)
 * @module scripts/estragar-workspace
 */

const { cpSync, existsSync, mkdtempSync, readFileSync, statSync, writeFileSync } = require('node:fs')
const { tmpdir } = require('node:os')
const path = require('node:path')

/** O que nunca vale a pena copiar: peso sem efeito sobre a leitura. */
const DISPENSADOS = new Set(['node_modules', '.git', 'out', 'coverage'])

/** O arquivo que se trunca, porque é o que a leitura do Reversa lê primeiro. */
const ALVO = path.join('.reversa', 'state.json')

/**
 * Copia e estraga.
 * @param {string[]} argumentos - aceita `--workspace=<caminho>`.
 * @param {string} raiz - o repositório de onde o comando roda.
 * @returns {number} o código de saída; o caminho da cópia sai na saída padrão.
 */
function principal(argumentos, raiz) {
  const pedido = argumentos.find((argumento) => argumento.startsWith('--workspace='))
  const origem = pedido === undefined ? raiz : pedido.slice('--workspace='.length)

  if (!existsSync(origem) || !statSync(origem).isDirectory()) {
    process.stderr.write(`o workspace ${origem} não existe como diretório.\n`)
    return 1
  }

  const alvoNaOrigem = path.join(origem, ALVO)
  if (!existsSync(alvoNaOrigem)) {
    process.stderr.write(
      `${origem} não tem ${ALVO}: só faz sentido estragar um workspace com Reversa instalado.\n`,
    )
    return 1
  }

  const destino = mkdtempSync(path.join(tmpdir(), 'reversa-views-estragado-'))
  cpSync(origem, destino, {
    recursive: true,
    filter: (caminho) => !DISPENSADOS.has(path.basename(caminho)),
  })

  // Truncar pela metade deixa JSON sintaticamente quebrado, que é justamente a
  // anomalia que a camada de leitura reporta em vez de lançar.
  const alvoNoDestino = path.join(destino, ALVO)
  const inteiro = readFileSync(alvoNoDestino, 'utf8')
  writeFileSync(alvoNoDestino, inteiro.slice(0, Math.floor(inteiro.length / 2)))

  process.stderr.write(`cópia estragada em ${destino}, com ${ALVO} truncado.\n`)
  process.stdout.write(`${destino}\n`)
  return 0
}

if (require.main === module) {
  process.exit(principal(process.argv.slice(2), path.resolve(__dirname, '..')))
}

module.exports = { ALVO, principal }
