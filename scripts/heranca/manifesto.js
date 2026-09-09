/**
 * Leitura e validação do manifesto e das adaptações.
 *
 * Manifesto inválido interrompe tudo, nomeando o defeito e a linha, e nenhuma
 * linha de relatório sai junto (RF-12, RN-13): relatório parcial que pareça
 * íntegro é pior que ausência de relatório.
 *
 * Nenhuma função aqui toca disco. Quem lê arquivo é a camada de leitura; o que
 * este módulo recebe é texto e o que devolve é dado validado.
 * @module scripts/heranca/manifesto
 */

const { parse, stringify } = require('yaml')

/** Falha que interrompe o ritual, com o arquivo e a linha do defeito. */
class ErroDeHeranca extends Error {
  /**
   * @param {string} mensagem - o que está errado, na língua do mantenedor.
   * @param {{arquivo?: string, linha?: number}} onde - onde olhar.
   */
  constructor(mensagem, onde = {}) {
    super(mensagem)
    this.name = 'ErroDeHeranca'
    this.arquivo = onde.arquivo ?? null
    this.linha = onde.linha ?? null
  }
}

const FORMA_DO_RESUMO = /^sha256:[0-9a-f]{64}$/

/**
 * Interpreta YAML, traduzindo o erro do interpretador em falha com linha.
 * @param {string} texto - o conteúdo do arquivo.
 * @param {string} arquivo - o caminho, só para a mensagem.
 * @returns {unknown} o valor interpretado.
 */
function interpretar(texto, arquivo) {
  try {
    return parse(texto)
  } catch (causa) {
    const linha = causa?.linePos?.[0]?.line ?? null
    throw new ErroDeHeranca(`YAML inválido em ${arquivo}: ${causa.message}`, { arquivo, linha })
  }
}

/**
 * Exige um campo, com mensagem que nomeia onde ele falta.
 * @param {Record<string, unknown>} objeto - a entrada conferida.
 * @param {string} nome - o campo exigido.
 * @param {string} contexto - como nomear a entrada na mensagem.
 * @param {string} arquivo - o caminho do arquivo.
 */
function exigir(objeto, nome, contexto, arquivo) {
  if (objeto[nome] === undefined || objeto[nome] === null) {
    throw new ErroDeHeranca(`${contexto} não declara ${nome}`, { arquivo })
  }
}

/**
 * Lê o manifesto e recusa toda forma de invalidez que ele possa ter.
 * @param {string} texto - o conteúdo de `manifesto.yml`.
 * @param {string} arquivo - o caminho, para as mensagens.
 * @returns {{versao: number, origens: object[], arquivos: object[]}} o manifesto validado.
 */
function lerManifesto(texto, arquivo) {
  const dado = interpretar(texto, arquivo)
  if (dado === null || typeof dado !== 'object') {
    throw new ErroDeHeranca(`${arquivo} não descreve um manifesto`, { arquivo })
  }
  if (dado.versao !== 1) {
    throw new ErroDeHeranca(`versão de manifesto não reconhecida: ${dado.versao}`, { arquivo })
  }
  const origens = Array.isArray(dado.origens) ? dado.origens : null
  if (origens === null) throw new ErroDeHeranca('o manifesto não lista origens', { arquivo })
  const arquivos = Array.isArray(dado.arquivos) ? dado.arquivos : null
  if (arquivos === null) throw new ErroDeHeranca('o manifesto não lista arquivos', { arquivo })

  const nomes = new Set()
  for (const origem of origens) {
    exigir(origem, 'nome', 'uma origem', arquivo)
    exigir(origem, 'tipo', `a origem ${origem.nome}`, arquivo)
    exigir(origem, 'chaveDoCaminhoLocal', `a origem ${origem.nome}`, arquivo)
    if (nomes.has(origem.nome)) {
      throw new ErroDeHeranca(`origem declarada duas vezes: ${origem.nome}`, { arquivo })
    }
    nomes.add(origem.nome)
    if (origem.tipo === 'codigo') exigir(origem, 'revisao', `a origem ${origem.nome}`, arquivo)
    if (origem.tipo === 'padrao' && Array.isArray(origem.arquivos) && origem.arquivos.length > 0) {
      throw new ErroDeHeranca(
        `a origem ${origem.nome} é de padrão e não pode listar arquivo algum`,
        { arquivo },
      )
    }
    if (origem.tipo !== 'codigo' && origem.tipo !== 'padrao') {
      throw new ErroDeHeranca(`tipo de origem desconhecido em ${origem.nome}: ${origem.tipo}`, {
        arquivo,
      })
    }
  }

  const caminhos = new Set()
  for (const entrada of arquivos) {
    exigir(entrada, 'caminho', 'uma entrada de arquivo', arquivo)
    const contexto = `a entrada ${entrada.caminho}`
    exigir(entrada, 'origem', contexto, arquivo)
    exigir(entrada, 'caminhoNaOrigem', contexto, arquivo)
    exigir(entrada, 'resumo', contexto, arquivo)
    if (!nomes.has(entrada.origem)) {
      throw new ErroDeHeranca(`${contexto} aponta origem inexistente: ${entrada.origem}`, {
        arquivo,
      })
    }
    if (caminhos.has(entrada.caminho)) {
      throw new ErroDeHeranca(`caminho repetido no manifesto: ${entrada.caminho}`, { arquivo })
    }
    caminhos.add(entrada.caminho)
    if (!FORMA_DO_RESUMO.test(String(entrada.resumo))) {
      throw new ErroDeHeranca(`${contexto} tem resumo fora do formato esperado`, { arquivo })
    }
  }

  return { versao: 1, origens, arquivos }
}

/**
 * Lê o arquivo de adaptações declaradas.
 * @param {string} texto - o conteúdo de `adaptacoes.yml`.
 * @param {string} arquivo - o caminho, para as mensagens.
 * @returns {{versao: number, adaptacoes: object[]}} as adaptações validadas.
 */
function lerAdaptacoes(texto, arquivo) {
  const dado = interpretar(texto, arquivo)
  if (dado === null || typeof dado !== 'object') {
    throw new ErroDeHeranca(`${arquivo} não descreve adaptações`, { arquivo })
  }
  const adaptacoes = Array.isArray(dado.adaptacoes) ? dado.adaptacoes : null
  if (adaptacoes === null) throw new ErroDeHeranca('o arquivo não lista adaptações', { arquivo })

  const vistos = new Set()
  for (const item of adaptacoes) {
    exigir(item, 'id', 'uma adaptação', arquivo)
    const contexto = `a adaptação ${item.id}`
    exigir(item, 'arquivo', contexto, arquivo)
    if (typeof item.original !== 'string' || item.original === '') {
      throw new ErroDeHeranca(`${contexto} não declara o trecho original`, { arquivo })
    }
    if (typeof item.adaptado !== 'string') {
      throw new ErroDeHeranca(`${contexto} não declara o trecho adaptado`, { arquivo })
    }
    if (vistos.has(item.id)) {
      throw new ErroDeHeranca(`adaptação declarada duas vezes: ${item.id}`, { arquivo })
    }
    vistos.add(item.id)
  }

  return { versao: dado.versao ?? 1, adaptacoes }
}

/**
 * Confere o que só se vê olhando os dois arquivos juntos.
 * @param {{arquivos: object[]}} manifesto - o manifesto lido.
 * @param {{adaptacoes: object[]}} adaptacoes - as adaptações lidas.
 */
function validarConjunto(manifesto, adaptacoes) {
  const declaradas = new Set(adaptacoes.adaptacoes.map((item) => item.id))
  for (const entrada of manifesto.arquivos) {
    for (const id of entrada.adaptacoes ?? []) {
      if (!declaradas.has(id)) {
        throw new ErroDeHeranca(
          `${entrada.caminho} cita a adaptação ${id}, que não está declarada`,
          { arquivo: 'src/heranca/manifesto.yml' },
        )
      }
    }
  }
  const manifestados = new Set(manifesto.arquivos.map((entrada) => entrada.caminho))
  for (const item of adaptacoes.adaptacoes) {
    if (manifesto.arquivos.length > 0 && !manifestados.has(item.arquivo)) {
      throw new ErroDeHeranca(
        `a adaptação ${item.id} aponta ${item.arquivo}, que não consta do manifesto`,
        { arquivo: 'src/heranca/adaptacoes.yml' },
      )
    }
  }
}

/**
 * O bloco de comentários que abre o manifesto, e que nenhuma ferramenta apaga.
 *
 * O cabeçalho explica ao Retomador o que aquele arquivo é e quem o mantém. Ele
 * sobrevive a toda reescrita automática porque é justamente ele que impede a
 * próxima pessoa de editar à mão a lista que a ferramenta gera.
 * @param {string} texto - o conteúdo atual do arquivo.
 * @returns {string} o cabeçalho, com a quebra final, ou texto vazio.
 */
function cabecalhoDe(texto) {
  const guardadas = []
  for (const linha of texto.split('\n')) {
    if (linha.startsWith('#') || linha.trim() === '') guardadas.push(linha)
    else break
  }
  while (guardadas.length > 0 && guardadas[guardadas.length - 1].trim() === '') guardadas.pop()
  return guardadas.length === 0 ? '' : `${guardadas.join('\n')}\n`
}

/**
 * O texto de um manifesto, com o cabeçalho na frente.
 * @param {string} cabecalho - o bloco de comentários preservado.
 * @param {object} dado - o manifesto inteiro, já atualizado.
 * @returns {string} o arquivo pronto para gravar.
 */
function escreverManifesto(cabecalho, dado) {
  return cabecalho + stringify(dado, { lineWidth: 0 })
}

module.exports = { ErroDeHeranca, cabecalhoDe, escreverManifesto, lerAdaptacoes, lerManifesto, validarConjunto }
