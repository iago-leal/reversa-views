/**
 * Os argumentos do preview, traduzidos e conferidos (RF-13, D-01).
 *
 * É a única parte do preview que decide alguma coisa antes de qualquer porta
 * abrir, e é onde moram as duas recusas que evitam meia hora de confusão
 * adiante: workspace que não existe e pacote da tela que ninguém construiu.
 *
 * Argumento desconhecido interrompe. Ignorar em silêncio é o modo mais rápido
 * de alguém conferir o tema errado achando que conferiu o certo.
 *
 * Função pura: o que ela sabe do mundo chega por parâmetro, e é por isso que a
 * suíte a exercita sem tocar disco.
 * @module scripts/preview/config
 */

/** A porta em que o preview escuta quando ninguém pede outra. */
const PORTA_PADRAO = 5757

/** Os quatro temas que o editor pinta, nos nomes que a linha de comando usa. */
const TEMAS = ['claro', 'escuro', 'claro-alto-contraste', 'escuro-alto-contraste']

/** Os estados de entrada que se pode forçar, mais o de não forçar nenhum. */
const ESTADOS = ['nenhum', 'sem-diretorio', 'sem-reversa', 'erro']

/** Erro de configuração: para o comando com causa e remédio, sem rastro. */
class ErroDeConfiguracao extends Error {
  /** @param {string} mensagem - o que houve e o que fazer a respeito. */
  constructor(mensagem) {
    super(mensagem)
    this.name = 'ErroDeConfiguracao'
  }
}

/**
 * Lê a configuração do preview a partir da linha de comando.
 * @param {readonly string[]} argumentos - o que veio depois do nome do script.
 * @param {{raiz: string, eDiretorio: (caminho: string) => boolean,
 *   temPacoteDaTela: () => boolean}} mundo - o que se sabe do disco.
 * @returns {{workspace: string, tema: string, estado: string, porta: number,
 *   atraso: number, semBuild: boolean}} a configuração já conferida.
 * @throws {ErroDeConfiguracao} diante de argumento torto ou mundo incompatível.
 */
function lerConfiguracao(argumentos, mundo) {
  const config = {
    workspace: mundo.raiz,
    tema: 'escuro',
    estado: 'nenhum',
    porta: PORTA_PADRAO,
    atraso: 0,
    semBuild: false,
  }

  for (const argumento of argumentos) {
    if (argumento === '--sem-build') {
      config.semBuild = true
      continue
    }

    const separador = argumento.indexOf('=')
    const nome = separador === -1 ? argumento : argumento.slice(0, separador)
    const valor = separador === -1 ? '' : argumento.slice(separador + 1)

    switch (nome) {
      case '--workspace':
        config.workspace = valor
        break
      case '--tema':
        config.tema = escolher(valor, TEMAS, 'tema')
        break
      case '--estado':
        config.estado = escolher(valor, ESTADOS, 'estado')
        break
      case '--porta':
        config.porta = inteiro(valor, 'porta', 1024, 65535)
        break
      case '--atraso':
        config.atraso = inteiro(valor, 'atraso', 0, 600000)
        break
      default:
        throw new ErroDeConfiguracao(
          `argumento desconhecido: ${nome}\n` +
            'Os aceitos são --workspace, --tema, --estado, --porta, --atraso e --sem-build.',
        )
    }
  }

  if (!mundo.eDiretorio(config.workspace)) {
    throw new ErroDeConfiguracao(
      `o workspace ${config.workspace} não existe como diretório.\n` +
        'Aponte outro com --workspace=<caminho>.',
    )
  }

  if (!config.semBuild && !mundo.temPacoteDaTela()) {
    throw new ErroDeConfiguracao(
      'o pacote da tela não foi construído: não há o que servir.\n' +
        'Rode `npm run build` antes, ou passe --sem-build para servir só a casca.',
    )
  }

  return config
}

/** Um valor de lista fechada, ou o erro que lista os que existem. */
function escolher(valor, opcoes, nome) {
  if (opcoes.includes(valor)) return valor
  throw new ErroDeConfiguracao(`${nome} inválido: "${valor}".\nOs que existem: ${opcoes.join(', ')}.`)
}

/** Um inteiro dentro da faixa, ou o erro que diz qual é a faixa. */
function inteiro(valor, nome, minimo, maximo) {
  const numero = Number(valor)
  if (!Number.isInteger(numero) || numero < minimo || numero > maximo) {
    throw new ErroDeConfiguracao(
      `${nome} inválido: "${valor}".\nEspera-se um inteiro entre ${minimo} e ${maximo}.`,
    )
  }
  return numero
}

module.exports = { ESTADOS, ErroDeConfiguracao, PORTA_PADRAO, TEMAS, lerConfiguracao }
