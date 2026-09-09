#!/usr/bin/env node
/**
 * A conferência da herança, em linha de comando.
 *
 * Dois modos sobre o mesmo julgamento (D-08). O local só olha o que está
 * versionado aqui e por isso pode entrar no build sem exigir máquina
 * configurada (RF-19); o completo acrescenta o confronto com as origens e é o
 * que se roda no ritual.
 *
 * Três códigos de saída, porque as três situações pedem reações diferentes:
 * zero quando nada impede, um quando a conferência reprovou, dois quando o
 * manifesto está inválido e nem chegou a haver conferência.
 * @module scripts/verificar-heranca
 */

const { ErroDeHeranca } = require('./heranca/manifesto')
const { lerArvoreLocal, lerDeclaracoes, lerOrigens } = require('./heranca/leitura')
const { codigoDeSaida, formatar } = require('./heranca/relatorio')
const { julgar } = require('./heranca/verificar')

/** O que o processo devolve quando o manifesto não é sequer legível. */
const SAIDA_DE_MANIFESTO_INVALIDO = 2

/**
 * Roda a conferência e devolve o código de saída.
 * @param {string[]} argumentos - os argumentos da linha de comando.
 * @param {string} raiz - a raiz do repositório.
 * @returns {number} o código de saída.
 */
function principal(argumentos, raiz) {
  const local = argumentos.includes('--local')
  let declaracoes
  try {
    declaracoes = lerDeclaracoes(raiz)
  } catch (erro) {
    if (!(erro instanceof ErroDeHeranca)) throw erro
    const linha = erro.linha === null ? '' : `:${erro.linha}`
    process.stderr.write(`manifesto inválido em ${erro.arquivo ?? '?'}${linha}\n  ${erro.message}\n`)
    return SAIDA_DE_MANIFESTO_INVALIDO
  }

  const { manifesto, adaptacoes } = declaracoes
  const resultado = julgar({
    manifesto,
    adaptacoes,
    local: lerArvoreLocal(raiz, manifesto),
    origens: local ? null : lerOrigens(raiz, manifesto),
  })
  process.stdout.write(formatar(resultado))
  return codigoDeSaida(resultado)
}

if (require.main === module) process.exit(principal(process.argv.slice(2), process.cwd()))

module.exports = { SAIDA_DE_MANIFESTO_INVALIDO, principal }
