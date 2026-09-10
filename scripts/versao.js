/**
 * A versão da extensão, derivada e nunca escrita à mão (D-09, D-10, RF-18,
 * RF-21, RN-06).
 *
 * O número sai de dois fatos que o fluxo de trabalho já produz, sem pedir ato
 * novo a ninguém: o maior número de feature com adendo escrito em
 * `_reversa_sdd/addenda/`, que dá o segundo campo, e a quantidade de commits
 * desde o commit que ACRESCENTOU aquele adendo, que dá o terceiro. O primeiro
 * campo fica em zero até decisão explícita do mantenedor, e essa decisão não
 * precisa ser tomada hoje.
 *
 * Duas armadilhas moldaram a regra. A primeira é a monotonicidade: contar
 * QUANTOS adendos existem faria o número recuar ao apagar um, e por isso a
 * conta usa o MAIOR número e não a quantidade. A segunda é a data de
 * referência: um adendo pode ser emendado meses depois de criado, como o da
 * feature 005 foi, e por isso o commit de referência é o que acrescentou o
 * arquivo, jamais o que o tocou por último.
 *
 * Faltando clone, adendo ou histórico, a derivação NÃO inventa número: devolve
 * `0.0.0` com a causa nomeada, e quem a chamou imprime a causa. Número
 * plausível obtido por palpite é pior que número obviamente vazio, porque o
 * primeiro não se distingue de um número certo.
 * @module scripts/versao
 */

const { existsSync, readdirSync } = require('node:fs')
const { join } = require('node:path')

const { commitQueAcrescentou, contarCommits, revisaoCorrente } = require('./git')

/** Onde os adendos do Reversa moram, relativo à raiz do repositório. */
const PASTA_DOS_ADENDOS = '_reversa_sdd/addenda'

/** O que a derivação devolve quando não tem em que se apoiar (D-10). */
const VERSAO_DE_RECUO = '0.0.0'

/** O primeiro campo, que só muda por decisão humana e não por conta destas regras. */
const CAMPO_MAIOR = 0

/** Um adendo de feature: três dígitos, um hífen, e o nome curto. */
const NOME_DE_ADENDO = /^(\d{3})-.+\.md$/

/**
 * O maior número de feature entre nomes de arquivo de adendo.
 *
 * Função pura sobre a lista de nomes, e é por isso que a monotonicidade se
 * testa sem clone e sem disco.
 * @param {readonly string[]} nomes - os nomes dos arquivos, sem caminho.
 * @returns {{numero: number, arquivo: string}|null} o maior, ou nulo se não houver.
 */
function maiorAdendo(nomes) {
  let maior = null
  for (const nome of nomes) {
    const casou = NOME_DE_ADENDO.exec(nome)
    if (casou === null) continue
    const numero = Number(casou[1])
    if (maior === null || numero > maior.numero) maior = { numero, arquivo: nome }
  }
  return maior
}

/** O acesso ao mundo de que a derivação depende, substituível em teste. */
const FERRAMENTAS = {
  listarAdendos: (raiz) => {
    const pasta = join(raiz, PASTA_DOS_ADENDOS)
    return existsSync(pasta) ? readdirSync(pasta) : null
  },
  revisao: (raiz) => revisaoCorrente(raiz),
  commitDeAcrescimo: (raiz, arquivo) =>
    commitQueAcrescentou(`${PASTA_DOS_ADENDOS}/${arquivo}`, raiz),
  contar: (raiz, de, ate) => contarCommits(de, ate, raiz),
}

/**
 * Deriva a versão da extensão.
 *
 * O resultado carrega SEMPRE uma versão desenhável, e a causa do recuo quando
 * houve recuo. Quem chama decide o que fazer com a causa: o empacotamento a
 * imprime (RF-21), e o carimbo da construção a repassa.
 * @param {string} raiz - a raiz do repositório.
 * @param {typeof FERRAMENTAS} [ferramentas] - o acesso ao mundo.
 * @returns {{versao: string, recuo: {causa: string, explicacao: string}|null,
 *   feature: number|null, adendo: string|null, commit: string|null, patch: number|null}}
 *   a versão e o que se sabe sobre como ela saiu.
 */
function derivarVersao(raiz, ferramentas = FERRAMENTAS) {
  const vazio = { versao: VERSAO_DE_RECUO, feature: null, adendo: null, commit: null, patch: null }

  const nomes = ferramentas.listarAdendos(raiz)
  if (nomes === null) {
    return {
      ...vazio,
      recuo: {
        causa: 'sem-pasta-de-adendos',
        explicacao: `não existe a pasta ${PASTA_DOS_ADENDOS}: o Reversa ainda não convergiu feature alguma neste clone`,
      },
    }
  }

  const maior = maiorAdendo(nomes)
  if (maior === null) {
    return {
      ...vazio,
      recuo: {
        causa: 'sem-adendo',
        explicacao: `${PASTA_DOS_ADENDOS} não tem arquivo no formato NNN-nome.md, e é dele que sai o segundo número`,
      },
    }
  }

  const cabeca = ferramentas.revisao(raiz)
  if (cabeca === null) {
    return {
      ...vazio,
      feature: maior.numero,
      adendo: maior.arquivo,
      recuo: {
        causa: 'sem-clone',
        explicacao: 'o git não respondeu qual é a revisão corrente: isto não é um clone, ou o git não está instalado',
      },
    }
  }

  const commit = ferramentas.commitDeAcrescimo(raiz, maior.arquivo)
  if (commit === null) {
    return {
      ...vazio,
      feature: maior.numero,
      adendo: maior.arquivo,
      recuo: {
        causa: 'sem-historico',
        explicacao: `o histórico não registra o commit que acrescentou ${maior.arquivo}: o adendo existe no disco mas não foi versionado`,
      },
    }
  }

  const patch = ferramentas.contar(raiz, commit, cabeca)
  if (patch === null) {
    return {
      ...vazio,
      feature: maior.numero,
      adendo: maior.arquivo,
      commit,
      recuo: {
        causa: 'sem-historico',
        explicacao: `o git não contou os commits entre ${commit} e a cabeça`,
      },
    }
  }

  return {
    versao: `${CAMPO_MAIOR}.${maior.numero}.${patch}`,
    recuo: null,
    feature: maior.numero,
    adendo: maior.arquivo,
    commit,
    patch,
  }
}

if (require.main === module) {
  const resultado = derivarVersao(process.cwd())
  process.stdout.write(`${resultado.versao}\n`)
  if (resultado.recuo !== null) {
    process.stderr.write(`versão recuada para ${VERSAO_DE_RECUO}: ${resultado.recuo.explicacao}\n`)
  }
}

module.exports = {
  CAMPO_MAIOR,
  FERRAMENTAS,
  NOME_DE_ADENDO,
  PASTA_DOS_ADENDOS,
  VERSAO_DE_RECUO,
  derivarVersao,
  maiorAdendo,
}
