/**
 * A única porta de entrada para o git, em toda a família de scripts (D-13).
 *
 * Antes desta feature havia uma chamada ao git, escondida em
 * `scripts/heranca/leitura.js`, que engolia todo erro e devolvia nulo. Isso
 * bastava para o único uso que existia. Passam a existir quatro, em três
 * scripts diferentes, e quatro chamadas com quatro tratamentos de erro
 * divergem na primeira vez que alguém corrige uma delas.
 *
 * A divisão aqui é entre duas formas de perguntar. `executar` fala alto:
 * falhou, lança `ErroDeGit` dizendo qual comando foi, se o git existe e o que
 * ele escreveu no erro. `tentar` cala: devolve nulo, e serve a quem já trata a
 * ausência como resposta legítima, que é o caso de uma origem que pode
 * simplesmente não ser um clone.
 *
 * Nada aqui escreve na árvore de trabalho. Os comandos que escrevem, se um dia
 * houver, são responsabilidade de quem os chama e não ganham auxiliar próprio
 * neste arquivo: o atualizador da feature 007 usa `executar` diretamente, e
 * fica visível na leitura dele o que ele manda o git fazer.
 * @module scripts/git
 */

const { execFileSync } = require('node:child_process')

/** O que se passa a `execFileSync` em toda chamada de leitura. */
const PADROES = { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }

/**
 * Falha de um comando do git, com causa distinguível.
 *
 * As causas pedem reações diferentes de quem chama, e é por isso que são
 * campo e não texto: git ausente é problema de máquina, e o remédio é instalar;
 * comando reprovado é problema de repositório, e o remédio está na saída de
 * erro que a instância carrega; tempo esgotado é problema de rede, e o remédio
 * é tentar de novo quando ela voltar. A terceira causa só acontece para quem
 * pediu um limite, o que hoje é apenas a busca de referências do atualizador
 * (RF-03).
 */
class ErroDeGit extends Error {
  /**
   * @param {string} mensagem - o que houve, em uma linha.
   * @param {{causa: 'ausente'|'falhou'|'tempo-esgotado', comando: string,
   *   saidaDeErro?: string}} detalhe - o resto.
   */
  constructor(mensagem, detalhe) {
    super(mensagem)
    this.name = 'ErroDeGit'
    this.causa = detalhe.causa
    this.comando = detalhe.comando
    this.saidaDeErro = detalhe.saidaDeErro ?? ''
  }
}

/**
 * Roda um comando do git e devolve a saída padrão, sem espaço nas pontas.
 * @param {readonly string[]} argumentos - o que vai depois de `git`.
 * @param {{caminho?: string, tempoLimite?: number}} [opcoes] - o repositório,
 *   com o corrente por padrão, e um limite em milissegundos para quem fala com
 *   a rede; sem limite, o comando espera o quanto o git esperar.
 * @returns {string} a saída padrão, aparada.
 * @throws {ErroDeGit} se o git não existir, o comando reprovar ou o limite vencer.
 */
function executar(argumentos, opcoes = {}) {
  const completos = opcoes.caminho ? ['-C', opcoes.caminho, ...argumentos] : [...argumentos]
  const comando = `git ${completos.join(' ')}`
  const configuracao =
    opcoes.tempoLimite === undefined ? PADROES : { ...PADROES, timeout: opcoes.tempoLimite }
  try {
    return execFileSync('git', completos, configuracao).trim()
  } catch (erro) {
    // ENOENT aqui é o git que não está na máquina, e não um caminho que não
    // existe: o caminho inexistente reprova o comando e escreve no erro.
    if (erro.code === 'ENOENT') {
      throw new ErroDeGit('o git não está instalado ou não está no caminho', {
        causa: 'ausente',
        comando,
      })
    }
    // O limite vencido chega de duas formas conforme a versão do Node: o
    // código do erro ou o sinal com que o processo foi encerrado.
    if (erro.code === 'ETIMEDOUT' || erro.signal === 'SIGTERM') {
      throw new ErroDeGit(`o comando não terminou em ${opcoes.tempoLimite} ms: ${comando}`, {
        causa: 'tempo-esgotado',
        comando,
      })
    }
    const saidaDeErro = String(erro.stderr ?? '').trim()
    throw new ErroDeGit(`o comando reprovou: ${comando}`, {
      causa: 'falhou',
      comando,
      saidaDeErro,
    })
  }
}

/**
 * O mesmo, para quem trata a falha como resposta e não como acidente.
 * @param {readonly string[]} argumentos - o que vai depois de `git`.
 * @param {{caminho?: string}} [opcoes] - o repositório; o padrão é o corrente.
 * @returns {string|null} a saída aparada, ou nulo diante de qualquer falha.
 */
function tentar(argumentos, opcoes = {}) {
  try {
    return executar(argumentos, opcoes)
  } catch (erro) {
    if (erro instanceof ErroDeGit) return null
    throw erro
  }
}

/**
 * A revisão em que o repositório está agora.
 * @param {string} [caminho] - o repositório; o padrão é o corrente.
 * @returns {string|null} o commit inteiro, ou nulo fora de um clone.
 */
function revisaoCorrente(caminho) {
  return tentar(['rev-parse', 'HEAD'], { caminho })
}

/**
 * O commit que ACRESCENTOU um arquivo ao repositório.
 *
 * O mais antigo, e não o mais recente, e essa é a diferença que sustenta a
 * monotonicidade da versão derivada (D-09): um arquivo apagado e recriado tem
 * dois commits de acréscimo, e escolher o recente faria o número recuar. O
 * histórico sai do mais novo para o mais velho, de modo que o que se quer é a
 * última linha.
 * @param {string} arquivo - o caminho, relativo à raiz do repositório.
 * @param {string} [caminho] - o repositório; o padrão é o corrente.
 * @returns {string|null} o commit inteiro, ou nulo se o arquivo nunca entrou.
 */
function commitQueAcrescentou(arquivo, caminho) {
  const saida = tentar(['log', '--diff-filter=A', '--format=%H', '--', arquivo], { caminho })
  if (saida === null || saida === '') return null
  const linhas = saida.split('\n').filter((linha) => linha !== '')
  return linhas.length === 0 ? null : linhas[linhas.length - 1]
}

/**
 * Quantos commits separam dois pontos do histórico.
 * @param {string} de - o ponto de partida, exclusivo.
 * @param {string} ate - o ponto de chegada, inclusivo.
 * @param {string} [caminho] - o repositório; o padrão é o corrente.
 * @returns {number|null} a contagem, ou nulo se algum dos dois não existir.
 */
function contarCommits(de, ate, caminho) {
  const saida = tentar(['rev-list', '--count', `${de}..${ate}`], { caminho })
  if (saida === null) return null
  const numero = Number(saida)
  return Number.isInteger(numero) && numero >= 0 ? numero : null
}

module.exports = {
  ErroDeGit,
  commitQueAcrescentou,
  contarCommits,
  executar,
  revisaoCorrente,
  tentar,
}
