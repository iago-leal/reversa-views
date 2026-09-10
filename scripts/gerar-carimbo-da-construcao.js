#!/usr/bin/env node
/**
 * O gerador do carimbo da construção (D-07, D-19, RF-17, RN-05).
 *
 * Irmão de `gerar-revisao-heranca.js`, e de propósito: o regime já existe, é
 * entendido, e é o que permite ao painel declarar procedência sem abrir arquivo
 * em tempo de execução. Repetir o molde custa menos que inventar um segundo.
 *
 * Uma diferença separa os dois irmãos, e ela é D-19. A revisão do modelo é
 * VERSIONADA, porque muda só quando a herança é ressincronizada. O carimbo da
 * construção NÃO é, porque o commit muda a cada commit: versionado, ele
 * deixaria a árvore suja depois de toda construção, e a árvore suja é
 * justamente o que o atualizador da feature 007 recusa. Ele entra no
 * `.gitignore` e é gerado por toda construção.
 *
 * As quatro constantes são o que a consulta à origem precisa saber sem
 * perguntar a ninguém: quem somos, de que commit fomos feitos, onde mora a
 * origem e qual é o ramo a comparar. O endereço vem daqui e de nenhum outro
 * lugar: nem argumento, nem variável de ambiente, nem arquivo do workspace,
 * para que um workspace hostil não redirecione a requisição.
 * @module scripts/gerar-carimbo-da-construcao
 */

const { writeFileSync } = require('node:fs')
const { join } = require('node:path')

const { revisaoCorrente, tentar } = require('./git')
const { derivarVersao } = require('./versao')

/** Onde o carimbo mora, dentro do host. */
const DESTINO = 'src/host/build.ts'

/** O ramo a comparar quando o git não sabe dizer qual é o padrão da origem. */
const RAMO_DE_RECUO = 'master'

/**
 * O endereço de origem reduzido a dono e repositório.
 *
 * Só o serviço que a consulta sabe conversar produz valor: qualquer outro vira
 * nulo, e o nulo é o que desliga a consulta na raiz, antes de qualquer
 * requisição. Isso cobre as duas formas de endereço que o git usa, a de rede e
 * a de shell seguro.
 * @param {string|null} url - o endereço do remoto, como o git o escreve.
 * @returns {string|null} `dono/repositorio`, ou nulo se não for reconhecido.
 */
function normalizarOrigem(url) {
  if (url === null || url === '') return null
  const casou =
    /^https?:\/\/(?:[^@/]+@)?github\.com\/([^/]+)\/(.+?)(?:\.git)?\/?$/.exec(url) ??
    /^(?:ssh:\/\/)?git@github\.com[:/]([^/]+)\/(.+?)(?:\.git)?\/?$/.exec(url)
  return casou === null ? null : `${casou[1]}/${casou[2]}`
}

/**
 * O ramo padrão da origem, como o clone o conhece.
 *
 * O git guarda essa resposta numa referência simbólica que só existe se o
 * clone a tiver escrito. Sem ela, o ramo corrente é o palpite honesto, e o
 * recuo declarado é a última defesa.
 * @param {string} raiz - a raiz do repositório.
 * @returns {string} o nome do ramo.
 */
function ramoPadrao(raiz) {
  const simbolica = tentar(['symbolic-ref', '--short', 'refs/remotes/origin/HEAD'], {
    caminho: raiz,
  })
  if (simbolica !== null && simbolica !== '') {
    const barra = simbolica.indexOf('/')
    return barra === -1 ? simbolica : simbolica.slice(barra + 1)
  }
  const corrente = tentar(['rev-parse', '--abbrev-ref', 'HEAD'], { caminho: raiz })
  return corrente === null || corrente === '' || corrente === 'HEAD' ? RAMO_DE_RECUO : corrente
}

/**
 * O texto do módulo gerado.
 * @param {{versao: string, commit: string, origem: string|null, ramo: string}} carimbo - os valores.
 * @returns {string} o arquivo inteiro.
 */
function modulo(carimbo) {
  const origem = carimbo.origem === null ? 'null' : `'${carimbo.origem}'`
  return `/**
 * ARQUIVO GERADO: não editar à mão, e NÃO versionado (D-19).
 *
 * Gerado por \`scripts/gerar-carimbo-da-construcao.js\` em toda construção, a
 * partir do git e da derivação de \`scripts/versao.js\`. Ao contrário de
 * \`inheritance.ts\`, que é versionado porque muda raramente, este muda a cada
 * commit: versioná-lo deixaria a árvore suja depois de todo build, e árvore
 * suja é o que o atualizador recusa.
 *
 * As constantes entram no bundle como valor literal para que o painel declare
 * procedência sem abrir arquivo, e para que o endereço consultado não venha de
 * argumento, de ambiente nem de arquivo do workspace.
 * @module host/build
 */

/** A versão desta construção, derivada e nunca escrita à mão (RF-18). */
export const EXTENSION_VERSION = '${carimbo.versao}'

/** O commit de que esta construção foi feita, INTEIRO: a tela é que o encurta. */
export const BUILT_FROM_COMMIT = '${carimbo.commit}'

/** A origem como \`dono/repositorio\`, ou nulo quando não há remoto conhecido. */
export const ORIGIN_REPOSITORY: string | null = ${origem}

/** O ramo da origem contra o qual a construção se compara. */
export const DEFAULT_BRANCH = '${carimbo.ramo}'
`
}

/**
 * Lê o git e a derivação, e grava o carimbo.
 * @param {string} raiz - a raiz do repositório.
 * @returns {{versao: string, commit: string, origem: string|null, ramo: string,
 *   recuo: {causa: string, explicacao: string}|null}} o que foi gravado.
 */
function principal(raiz) {
  const derivada = derivarVersao(raiz)
  // Commit vazio é situação real: uma cópia sem git, ou um clone sem commit
  // algum. A cadeia vazia é o que a consulta reconhece como "não há de que
  // comparar", e é preferível a um valor plausível e falso.
  const commit = revisaoCorrente(raiz) ?? ''
  const origem = normalizarOrigem(tentar(['remote', 'get-url', 'origin'], { caminho: raiz }))
  const ramo = ramoPadrao(raiz)

  const carimbo = { versao: derivada.versao, commit, origem, ramo }
  writeFileSync(join(raiz, DESTINO), modulo(carimbo), 'utf8')
  return { ...carimbo, recuo: derivada.recuo }
}

if (require.main === module) {
  const carimbo = principal(process.cwd())
  const curto = carimbo.commit === '' ? 'sem commit' : carimbo.commit.slice(0, 7)
  process.stdout.write(
    `${DESTINO} gerado: versão ${carimbo.versao}, commit ${curto}, origem ${carimbo.origem ?? 'nenhuma'}, ramo ${carimbo.ramo}\n`,
  )
  if (carimbo.recuo !== null) {
    process.stderr.write(`versão recuada: ${carimbo.recuo.explicacao}\n`)
  }
}

module.exports = { DESTINO, RAMO_DE_RECUO, modulo, normalizarOrigem, principal, ramoPadrao }
