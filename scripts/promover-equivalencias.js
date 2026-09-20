#!/usr/bin/env node
/**
 * A promoção: quem DISPÕE, a partir do que uma pessoa marcou (T032, RF-18).
 *
 * Ela lê as caixas marcadas da proposta e regenera o módulo do mapa. Não
 * importa o cliente do motor, não fala com serviço algum e não classifica
 * coisa alguma: a separação entre propor e dispor é verificável abrindo este
 * arquivo e olhando os `require` do topo.
 *
 * O mapa é lido do FONTE e não da saída compilada, para que promover duas
 * vezes seguidas sem construir entre uma e outra não apague a primeira
 * aprovação.
 *
 * Uso:
 *     node ./scripts/promover-equivalencias.js
 *     node ./scripts/promover-equivalencias.js --proposta=outra.md
 * @module scripts/promover-equivalencias
 */

const { existsSync, readFileSync, writeFileSync } = require('node:fs')
const path = require('node:path')

const { DESTINO, ConflitoDeEquivalencia, chaveDoPar, fundir, gerarModulo, lerMapaDeModulo } = require('./equivalencias/gerar-mapa')
const { lerMarcados } = require('./equivalencias/proposta')
const { PROPOSTA } = require('./aprender-equivalencias')

const raizDoRepo = path.resolve(__dirname, '..')

/** Um argumento nomeado, ou o padrão. */
function argumento(argumentos, nome, padrao) {
  const achado = argumentos.find((a) => a.startsWith(`--${nome}=`))
  return achado === undefined ? padrao : achado.slice(nome.length + 3)
}

/** Uma linha no terminal. */
function registrar(linha) {
  process.stdout.write(`${linha}\n`)
}

/** O dia de hoje, que é a data que o registro carrega. */
function hoje() {
  return new Date().toISOString().slice(0, 10)
}

/**
 * A evidência de cada item, relida da própria proposta.
 *
 * Ela vem do texto e não de uma segunda varredura do disco: o que se registra
 * é onde o par foi visto QUANDO a proposta nasceu, e não onde ele estaria
 * agora.
 *
 * A chave é montada do bloco de dados do item, e não do título. Pelo título,
 * os quatro pares de `status` colidiam num único `status`, e os cinco pares
 * promovidos na primeira rodada real saíram com a evidência do último a ser
 * lido: `status: "completed"` apareceu como visto em `scrapping`, quando quem
 * o traz é o `comentarios-concursos`. Evidência errada é pior que evidência
 * ausente, porque ninguém desconfia dela.
 * @param {string} texto - a proposta.
 * @returns {Record<string, string[]>} os projetos por par ou chave.
 */
function evidencias(texto) {
  const porItem = {}
  const linhas = texto.split('\n')

  for (let i = 0; i < linhas.length; i += 1) {
    if (!/^\s*- \[[ xX]\]/.test(linhas[i])) continue

    let visto = null
    let identidade = null
    for (let j = i + 1; j < linhas.length && j < i + 8; j += 1) {
      const linha = linhas[j].trim()
      if (/^- \[[ xX]\]/.test(linha)) break
      if (linha.includes('_visto em:_')) {
        visto = linha.split('_visto em:_')[1].trim()
        continue
      }
      if (!linha.startsWith('```')) continue
      const cerca = linha.slice(3).trim()
      try {
        const objeto = JSON.parse(linhas[j + 1]?.trim() ?? '')
        if (cerca === 'equivalencia') identidade = chaveDoPar(objeto.campo, objeto.valor)
        if (cerca === 'nao-agente') identidade = objeto.chave
      } catch {
        // Bloco ilegível é item sem evidência, nunca rodada perdida.
      }
      break
    }

    if (identidade === null || visto === null) continue
    porItem[identidade] = visto === 'nenhum projeto' ? [] : visto.split(',').map((p) => p.trim())
  }

  return porItem
}

/**
 * Roda a promoção.
 * @param {string[]} argumentos - o que veio depois do nome do script.
 * @returns {number} o código de saída.
 */
function principal(argumentos = []) {
  const proposta = path.resolve(raizDoRepo, argumento(argumentos, 'proposta', PROPOSTA))
  const destino = path.join(raizDoRepo, DESTINO)

  if (!existsSync(proposta)) {
    registrar(`não achei a proposta em ${path.relative(raizDoRepo, proposta)}.`)
    registrar('rode `npm run aprender:equivalencias` antes, ou aponte outra com --proposta=.')
    return 1
  }

  const texto = readFileSync(proposta, 'utf8')
  const marcados = lerMarcados(texto)
  if (marcados.pares.length === 0 && marcados.chaves.length === 0) {
    registrar('nenhum item marcado na proposta; nada foi escrito.')
    registrar('marque as caixas do que aprovar e rode de novo.')
    return 0
  }

  const atual = lerMapaDeModulo(existsSync(destino) ? readFileSync(destino, 'utf8') : '')
  let mapa
  try {
    mapa = fundir(atual, marcados, hoje(), evidencias(texto))
  } catch (erro) {
    if (!(erro instanceof ConflitoDeEquivalencia)) throw erro
    registrar(`conflito: ${erro.message}`)
    return 1
  }

  writeFileSync(destino, gerarModulo(mapa), 'utf8')
  registrar(`promovidos: ${marcados.pares.length} pares e ${marcados.chaves.length} entradas`)
  registrar(`o mapa agora tem ${mapa.pares.length} pares e ${mapa.naoAgentes.length} entradas`)
  registrar(`escrito em ${DESTINO}. Confira com \`git diff ${DESTINO}\` e construa de novo.`)
  return 0
}

if (require.main === module) process.exit(principal(process.argv.slice(2)))

module.exports = { evidencias, principal }
