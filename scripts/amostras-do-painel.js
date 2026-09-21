#!/usr/bin/env node
/**
 * Grava os quadros de amostra do painel de terminal (feature 016, RF-17, D-23).
 *
 * Casca fina, como `scripts/painel.js`: a função que produz as amostras é pura
 * e mora em `src/cli/amostras.ts`, e o que sobra aqui é o que aquela unidade
 * não pode fazer, que é escrever arquivo. A ferramenta de terminal não escreve
 * em modo algum, e a suíte de fronteiras confere isso por busca nos fontes
 * dela; por isso a escrita mora em `scripts/`, fora da unidade.
 *
 * As amostras saem de um estado fixo, `amostras/painel/estado.json`, e são
 * reproduzíveis: rodar duas vezes dá os mesmos arquivos. Uma mudança de paleta
 * aparece como diferença no `git diff`, e `tests/cli-amostras.spec.ts` reprova
 * enquanto o gravado não acompanhar o gerado.
 *
 * Para ver uma amostra, `cat amostras/painel/<nome>` num terminal do degrau
 * de cor correspondente.
 *
 * Uso:
 *     npm run amostras:painel
 * @module scripts/amostras-do-painel
 */

const { existsSync, readdirSync, readFileSync, rmSync, writeFileSync } = require('node:fs')
const path = require('node:path')

const raiz = path.resolve(__dirname, '..')
const MODULO_DAS_AMOSTRAS = path.join(raiz, 'out-cli', 'cli', 'amostras.js')
const PASTA = path.join(raiz, 'amostras', 'painel')
const ESTADO = path.join(PASTA, 'estado.json')

/** O comando que produz a unidade, nomeado na recusa e em nenhum outro lugar. */
const COMANDO_DE_CONSTRUCAO = 'npm run compile:cli'

/**
 * Gera e grava as amostras, ou recusa nomeando o que falta.
 * @returns {number} o código de saída.
 */
function principal() {
  if (!existsSync(MODULO_DAS_AMOSTRAS)) {
    process.stderr.write(
      'a saída compilada da ferramenta não existe em out-cli/.\n' +
        `Construa-a com \`${COMANDO_DE_CONSTRUCAO}\` e rode de novo.\n`,
    )
    return 2
  }
  if (!existsSync(ESTADO)) {
    process.stderr.write(`o estado fixo das amostras não existe: ${path.relative(raiz, ESTADO)}\n`)
    return 2
  }

  const { amostrasDoPainel } = require(MODULO_DAS_AMOSTRAS)
  const amostras = amostrasDoPainel(JSON.parse(readFileSync(ESTADO, 'utf8')))

  // Amostra que deixou de existir não fica para trás: o que está na pasta é o
  // que a função gera, e o estado fixo, que não é amostra.
  for (const nome of readdirSync(PASTA)) {
    if (nome.endsWith('.txt') && !amostras.has(nome)) rmSync(path.join(PASTA, nome))
  }
  for (const [nome, texto] of amostras) writeFileSync(path.join(PASTA, nome), texto)

  process.stdout.write(`${amostras.size} amostras gravadas em ${path.relative(raiz, PASTA)}/\n`)
  return 0
}

if (require.main === module) process.exit(principal())

module.exports = { COMANDO_DE_CONSTRUCAO, ESTADO, PASTA, principal }
