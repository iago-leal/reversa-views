/**
 * A forma escrita do julgamento.
 *
 * O relatório é a única interface do ritual, e quem o lê pode estar voltando ao
 * projeto depois de meses. Por isso ele se organiza por origem (RF-08), nomeia
 * arquivo e defeito em cada linha, e separa o que impede de prosseguir do que
 * apenas avisa que a origem andou.
 * @module scripts/heranca/relatorio
 */

/** Como cada estado de bloco se anuncia. */
const ESTADOS = {
  alinhado: 'alinhado',
  divergente: 'divergente',
  indisponivel: 'indisponível',
  'nao-verificado': 'não verificado',
}

/**
 * A ação seguinte de cada achado.
 *
 * Relatório que nomeia o defeito e cala sobre a saída obriga quem lê a
 * reconstruir o raciocínio de quem escreveu a ferramenta. Cada tipo de achado
 * termina, portanto, dizendo o que fazer com ele.
 */
const ACAO_SEGUINTE = {
  'editado-localmente':
    'declare a adaptação em src/heranca/adaptacoes.yml ou descarte a edição',
  'sem-carimbo': 'reponha o carimbo de sete linhas ou tire o arquivo do manifesto',
  'carimbo-inconsistente': 'acerte o carimbo ou o manifesto, e diga qual dos dois estava certo',
  'nao-manifestado': 'declare o arquivo com npm run sync:heranca ou apague-o da pasta da herança',
  'ausente-do-disco': 'restaure o arquivo pela origem ou remova a entrada do manifesto',
  'adaptacao-nao-casa': 'atualize o trecho original da adaptação, ou remova-a se a origem já o fez',
  'adaptacao-nao-reaplica':
    'declare o trecho exatamente como está no código, com |2 no bloco se a primeira linha começa por espaço',
  'origem-avancou': 'rode npm run sync:heranca quando quiser trazer a revisão nova',
  'novo-na-origem': 'copiar é decisão sua: a ferramenta não traz arquivo por conta própria',
  'origem-indisponivel': 'declare o caminho da origem em heranca.origens.yml',
  'paridade-externa': 'ao mexer num lado, confira o outro na mesma passada',
}

/** Como cada modo se anuncia no cabeçalho. */
const MODOS = {
  local: 'local (só o que está versionado aqui)',
  completo: 'completo (com as origens ao alcance)',
}

/**
 * Uma linha de achado, com a marca da severidade à esquerda.
 * @param {object} achado - o achado a escrever.
 * @returns {string} a linha.
 */
function linhaDeAchado(achado) {
  const marca = achado.severidade === 'impede' ? 'impede ' : 'informa'
  const onde = achado.caminho ? ` ${achado.caminho}` : ''
  const acao = ACAO_SEGUINTE[achado.tipo]
  const seguinte = acao === undefined ? '' : `\n              → ${acao}`
  return `    [${marca}] ${achado.tipo}${onde}\n              ${achado.detalhe}${seguinte}`
}

/**
 * Escreve o relatório inteiro.
 * @param {{modo: string, blocos: object[], achados: object[], veredito: string,
 *   impede: boolean}} resultado - o julgamento.
 * @returns {string} o texto pronto para a saída padrão.
 */
function formatar(resultado) {
  const linhas = ['Herança vendorizada', `  modo: ${MODOS[resultado.modo] ?? resultado.modo}`]
  if (resultado.modo === 'local') {
    linhas.push('  as origens não foram consultadas: rode npm run check:heranca para confrontá-las')
  }
  linhas.push('')

  for (const bloco of resultado.blocos) {
    const tipo = bloco.tipo === 'padrao' ? 'padrão' : 'código'
    linhas.push(`  ${bloco.origem} (${tipo}): ${ESTADOS[bloco.estado] ?? bloco.estado}`)
    if (bloco.nota) linhas.push(`    ${bloco.nota}`)
    if (bloco.achados.length === 0) {
      linhas.push('    nada a relatar')
    } else {
      for (const achado of bloco.achados) linhas.push(linhaDeAchado(achado))
    }
    linhas.push('')
  }

  const impedem = resultado.achados.filter((achado) => achado.severidade === 'impede').length
  const informam = resultado.achados.length - impedem
  linhas.push(
    `  veredito: ${resultado.veredito} (${impedem} impedem, ${informam} apenas informam)`,
  )
  if (resultado.impede) {
    linhas.push('  declare a adaptação, descarte a edição ou corrija o manifesto antes de seguir.')
  }
  return `${linhas.join('\n')}\n`
}

/**
 * O código com que o processo termina.
 * @param {{impede: boolean}} resultado - o julgamento.
 * @returns {number} zero quando nada impede, um quando algo impede.
 */
function codigoDeSaida(resultado) {
  return resultado.impede ? 1 : 0
}

module.exports = { codigoDeSaida, formatar }
