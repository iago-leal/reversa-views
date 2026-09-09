/**
 * Onde as origens moram nesta máquina.
 *
 * O manifesto guarda a identidade da origem: endereço, revisão, versão. Onde
 * ela está clonada é assunto de máquina, e por isso vive num arquivo ignorado
 * pelo git (RN-11). A ausência desse arquivo é situação normal, não defeito: o
 * verificador simplesmente cai para o modo local.
 * @module scripts/heranca/origens
 */

const { existsSync, readFileSync } = require('node:fs')
const { join } = require('node:path')
const { parse } = require('yaml')

/** O arquivo de máquina, fora do versionamento. */
const CAMINHO_DA_CONFIGURACAO = 'heranca.origens.yml'
/** O exemplo versionado, que se copia para criar o de cima. */
const CAMINHO_DO_EXEMPLO = 'heranca.origens.exemplo.yml'

/**
 * Lê a configuração local, sem nunca lançar.
 * @param {string} raiz - a raiz do repositório.
 * @returns {{existe: boolean, caminhos: Record<string, string>, erro?: string, motivo?: string}}
 *   o que se conseguiu ler.
 */
function lerConfiguracao(raiz) {
  const arquivo = join(raiz, CAMINHO_DA_CONFIGURACAO)
  if (!existsSync(arquivo)) {
    return {
      existe: false,
      caminhos: {},
      motivo: `${CAMINHO_DA_CONFIGURACAO} não existe: copie ${CAMINHO_DO_EXEMPLO} e aponte cada origem para a pasta onde ela está clonada nesta máquina`,
    }
  }
  try {
    const dado = parse(readFileSync(arquivo, 'utf8'))
    const caminhos = dado?.origens
    if (caminhos === null || typeof caminhos !== 'object' || Array.isArray(caminhos)) {
      return {
        existe: true,
        caminhos: {},
        erro: `${CAMINHO_DA_CONFIGURACAO} não traz o mapa origens: <nome>: <caminho>`,
      }
    }
    return { existe: true, caminhos }
  } catch (causa) {
    return { existe: true, caminhos: {}, erro: `${CAMINHO_DA_CONFIGURACAO} é ilegível: ${causa.message}` }
  }
}

/**
 * Diz se uma origem está ao alcance e, se estiver, o que ela traz hoje.
 * @param {Record<string, unknown>} origem - a origem, como o manifesto a declara.
 * @param {{existe: boolean, caminhos: Record<string, string>, motivo?: string, erro?: string}} config
 *   - a configuração local já lida.
 * @param {{existePasta: Function, revisaoDoGit: Function, versaoDoPacote: Function}} ferramentas
 *   - o acesso ao disco, injetado para que o julgamento continue testável.
 * @returns {{estado: string, caminho?: string, motivo?: string, revisaoCorrente?: string|null,
 *   versaoCorrente?: string|null}} a resolução.
 */
function resolver(origem, config, ferramentas) {
  const chave = origem.chaveDoCaminhoLocal
  const indisponivel = (motivo) => ({ estado: 'indisponivel', motivo })

  if (!config.existe) {
    return indisponivel(
      config.motivo ?? `${CAMINHO_DA_CONFIGURACAO} não existe: sem ele, ${origem.nome} fica fora de alcance`,
    )
  }
  if (config.erro) return indisponivel(`${config.erro}; ${origem.nome} fica fora de alcance`)

  const caminho = config.caminhos[chave]
  if (typeof caminho !== 'string' || caminho === '') {
    return indisponivel(
      `${CAMINHO_DA_CONFIGURACAO} não declara a chave ${chave}, exigida pela origem ${origem.nome}`,
    )
  }
  if (!ferramentas.existePasta(caminho)) {
    return indisponivel(
      `a chave ${chave} de ${CAMINHO_DA_CONFIGURACAO} aponta ${caminho}, que não existe nesta máquina`,
    )
  }

  if (origem.tipo === 'padrao') {
    return { estado: 'disponivel', caminho, versaoCorrente: ferramentas.versaoDoPacote(caminho) }
  }
  return { estado: 'disponivel', caminho, revisaoCorrente: ferramentas.revisaoDoGit(caminho) }
}

module.exports = { CAMINHO_DA_CONFIGURACAO, CAMINHO_DO_EXEMPLO, lerConfiguracao, resolver }
