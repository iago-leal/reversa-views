/**
 * O carimbo de sete linhas e o resumo do conteúdo herdado.
 *
 * O contrato do carimbo está escrito em `src/heranca/PROCEDENCIA.md`, seção 3:
 * sete linhas antes de qualquer conteúdo, a primeira começando por
 * `/* HERDADO`. É essa marca, e não a extensão nem o caminho, que diz a um
 * leitor humano que o arquivo veio de fora.
 *
 * O resumo cobre o CONTEÚDO HERDADO, e não o arquivo (RN-03): da linha 8 em
 * diante nos carimbados, o arquivo inteiro nos isentos. Sem esse recorte,
 * atualizar um carimbo depois de ressincronizar seria indistinguível de editar
 * o código copiado, e toda ressincronização faria todo arquivo parecer mexido.
 * @module scripts/heranca/carimbo
 */

const { createHash } = require('node:crypto')

/** A marca fixa da primeira linha. */
const MARCA_DE_HERDADO = '/* HERDADO'

/** Quantas linhas o carimbo ocupa, sempre as primeiras do arquivo. */
const LINHAS_DO_CARIMBO = 7

/** O que o campo de adaptações diz quando não há nenhuma. */
const SEM_ADAPTACAO = 'nenhuma'

/**
 * Se o arquivo começa pela marca do carimbo.
 * @param {string} texto - o conteúdo do arquivo.
 * @returns {boolean} verdadeiro quando a PRIMEIRA linha traz a marca.
 */
function temCarimbo(texto) {
  return texto.startsWith(MARCA_DE_HERDADO)
}

/**
 * Um campo do carimbo, pelo rótulo que o precede.
 * @param {string[]} linhas - as sete linhas.
 * @param {string} rotulo - o rótulo sem os dois-pontos.
 * @returns {string|null} o valor, sem espaços nas pontas.
 */
function campo(linhas, rotulo) {
  const alvo = linhas.find((linha) => linha.includes(`${rotulo}:`))
  if (alvo === undefined) return null
  return alvo.slice(alvo.indexOf(`${rotulo}:`) + rotulo.length + 1).trim()
}

/**
 * Os campos do carimbo, ou nulo quando o arquivo não tem carimbo.
 * @param {string} texto - o conteúdo do arquivo.
 * @returns {{origem: string|null, endereco: string|null, caminho: string|null,
 *   revisao: string|null, dataDaRevisao: string|null, copiadoEm: string|null,
 *   adaptacoes: string[]}|null} os campos lidos.
 */
function lerCarimbo(texto) {
  if (!temCarimbo(texto)) return null
  const linhas = texto.split('\n').slice(0, LINHAS_DO_CARIMBO)
  const origemBruta = campo(linhas, 'origem') ?? ''
  const abre = origemBruta.indexOf('(')
  const adaptacoes = campo(linhas, 'adaptações') ?? SEM_ADAPTACAO
  const revisaoBruta = campo(linhas, 'revisão') ?? ''
  const comData = revisaoBruta.match(/^(\S+)\s*\(([^)]+)\)\s*$/)

  return {
    origem: abre === -1 ? origemBruta || null : origemBruta.slice(0, abre).trim(),
    endereco: abre === -1 ? null : origemBruta.slice(abre + 1, origemBruta.lastIndexOf(')')),
    caminho: campo(linhas, 'caminho'),
    revisao: comData === null ? revisaoBruta || null : comData[1],
    dataDaRevisao: comData === null ? null : comData[2],
    copiadoEm: campo(linhas, 'copiado em'),
    adaptacoes:
      adaptacoes === SEM_ADAPTACAO
        ? []
        : adaptacoes
            .split(',')
            .map((item) => item.trim())
            .filter((item) => item !== ''),
  }
}

/**
 * O conteúdo herdado, que é o que o resumo cobre (RN-03).
 * @param {string} texto - o conteúdo do arquivo no disco.
 * @param {boolean} carimbado - se o arquivo carrega as sete linhas.
 * @returns {string} o arquivo sem o carimbo, ou o arquivo inteiro.
 */
function conteudoHerdado(texto, carimbado) {
  if (!carimbado) return texto
  const linhas = texto.split('\n')
  return linhas.slice(LINHAS_DO_CARIMBO).join('\n')
}

/**
 * O resumo criptográfico, na forma que o manifesto guarda.
 * @param {string} conteudo - o conteúdo herdado.
 * @returns {string} `sha256:` seguido de 64 caracteres hexadecimais.
 */
function resumoDe(conteudo) {
  return `sha256:${createHash('sha256').update(conteudo, 'utf8').digest('hex')}`
}

/**
 * As sete linhas do carimbo, prontas para prefixar o conteúdo.
 * @param {{origem?: string, endereco?: string, caminho: string, revisao: string,
 *   dataDaRevisao: string, copiadoEm: string, adaptacoes?: string[]}} campos - o que declarar.
 * @returns {string} as sete linhas, com quebra final.
 */
function escreverCarimbo(campos) {
  const origem = campos.origem ?? 'scrum-harness'
  const endereco = campos.endereco ?? 'https://github.com/iago-leal/scrum-harness'
  const adaptacoes = campos.adaptacoes ?? []
  return [
    `${MARCA_DE_HERDADO}: não editar sem declarar a adaptação em src/heranca/PROCEDENCIA.md`,
    ` * origem:      ${origem} (${endereco})`,
    ` * caminho:     ${campos.caminho}`,
    ` * revisão:     ${campos.revisao} (${campos.dataDaRevisao})`,
    ` * copiado em:  ${campos.copiadoEm}`,
    ` * adaptações:  ${adaptacoes.length === 0 ? SEM_ADAPTACAO : adaptacoes.join(', ')}`,
    ' */',
    '',
  ].join('\n')
}

module.exports = {
  LINHAS_DO_CARIMBO,
  MARCA_DE_HERDADO,
  SEM_ADAPTACAO,
  conteudoHerdado,
  escreverCarimbo,
  lerCarimbo,
  resumoDe,
  temCarimbo,
}
