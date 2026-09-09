#!/usr/bin/env node
/**
 * A ressincronização, em linha de comando.
 *
 * O plano sai impresso antes de qualquer escrita, e sem `--aplicar` nada é
 * gravado: quem ressincroniza precisa ver o que vai mudar antes de deixar
 * mudar. Recusa não é erro de programa, é resposta: ela nomeia o motivo e as
 * saídas possíveis, porque as três situações que param a ferramenta pedem
 * decisão humana, não nova tentativa.
 * @module scripts/ressincronizar-heranca
 */

const { ErroDeHeranca } = require('./heranca/manifesto')
const { inventariar, gravarInventario } = require('./heranca/inventario')
const { lerArvoreLocal, lerDeclaracoes, lerOrigens } = require('./heranca/leitura')
const { aplicar, planejar } = require('./heranca/ressincronizar')

/** O que o processo devolve quando o manifesto não é sequer legível. */
const SAIDA_DE_MANIFESTO_INVALIDO = 2
/** O que o processo devolve quando a ressincronização foi recusada. */
const SAIDA_DE_RECUSA = 1

/** O dia de hoje, no formato que o carimbo usa. */
function hojeEmIso() {
  return new Date().toISOString().slice(0, 10)
}

/**
 * Escreve a recusa de um jeito que diga o que fazer em seguida.
 * @param {object} plano - o plano recusado.
 * @param {Function} escrever - para onde a mensagem vai.
 */
function relatarRecusa(plano, escrever) {
  escrever(`ressincronização recusada: ${plano.motivo}\n`)
  for (const detalhe of plano.detalhes ?? []) escrever(`  ${detalhe}\n`)
  if (plano.esperado) {
    escrever(`  esperado na origem: ${plano.esperado.trim()}\n`)
    escrever(`  encontrado:         ${plano.encontrado?.trim() ?? ''}\n`)
  }
  for (const saida of plano.saidas ?? []) escrever(`  saída possível: ${saida}\n`)
}

/**
 * Planeja e, se pedido, aplica a ressincronização de cada origem de código.
 * @param {string[]} argumentos - os argumentos da linha de comando.
 * @param {string} raiz - a raiz do repositório.
 * @returns {number} o código de saída.
 */
function principal(argumentos, raiz) {
  const vaiAplicar = argumentos.includes('--aplicar')
  const saida = (texto) => process.stdout.write(texto)

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
  const local = lerArvoreLocal(raiz, manifesto)
  const origens = lerOrigens(raiz, manifesto)
  const hoje = hojeEmIso()
  let recusou = false
  let escreveu = false

  for (const declarada of manifesto.origens) {
    if (declarada.tipo !== 'codigo') continue
    const origem = { nome: declarada.nome, ...origens[declarada.nome] }
    const plano = planejar({ manifesto, adaptacoes, local, origem, hoje })
    saida(`\n${declarada.nome}\n`)
    if (!plano.ok) {
      relatarRecusa(plano, saida)
      recusou = true
      continue
    }
    if (plano.passos.length === 0) {
      saida('  nada a ressincronizar: a cópia já está na revisão corrente da origem\n')
      continue
    }
    for (const passo of plano.passos) saida(`  atualiza ${passo.caminho}\n`)
    if (!vaiAplicar) {
      saida('  plano apenas exibido: rode com --aplicar para escrever\n')
      continue
    }
    const { escritos } = aplicar({ raiz, plano })
    saida(`  escritos ${escritos.length} arquivos\n`)
    escreveu = true
  }

  if (escreveu) {
    const atual = lerDeclaracoes(raiz)
    const quantos = gravarInventario({
      raiz,
      arquivos: inventariar({ raiz, manifesto: atual.manifesto, adaptacoes: atual.adaptacoes }),
    })
    saida(`\ninventário refeito: ${quantos} arquivos declarados no manifesto\n`)
    saida('regenere a constante da revisão com npm run gerar:revisao-heranca\n')
  }

  return recusou ? SAIDA_DE_RECUSA : 0
}

if (require.main === module) process.exit(principal(process.argv.slice(2), process.cwd()))

module.exports = { SAIDA_DE_MANIFESTO_INVALIDO, SAIDA_DE_RECUSA, principal }
