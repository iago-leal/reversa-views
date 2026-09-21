/**
 * O que o ambiente declara, e o que isso decide (feature 016, RF-11, RF-12,
 * RF-14, RF-20, RN-08, D-07, D-08).
 *
 * Três decisões, todas puras: o degrau de cor, o jogo de glifos e o fundo.
 * Decide-se pelo que o ambiente DECLARA, e a dúvida cai para o degrau
 * inferior: de um degrau para o outro some fidelidade de tom, e nenhuma
 * informação, de modo que errar para baixo custa pouco e errar para cima
 * imprime sequência como texto justamente onde não há como consertá-la.
 *
 * Nenhuma função daqui recebe fluxo. Elas aceitam o mapa do ambiente e um
 * booleano, e por isso não têm por onde escrever: a ferramenta NÃO pergunta
 * ao terminal a cor do fundo, e essa promessa é conferível pela assinatura.
 * Tampouco leem ou escrevem arquivo: a preferência de fundo vale pela
 * execução em que foi declarada.
 * @module cli/ambiente
 */

import type { Apresentacao, Fundo, GrauDeCor, JogoDeGlifos } from './tipos.ts'

/** O ambiente do processo, como mapa. */
export type Ambiente = Record<string, string | undefined>

/** A variável de ambiente que declara o fundo. */
export const VARIAVEL_DE_TEMA = 'REVERSA_VIEWS_TEMA'

/** Os dois fundos que a ferramenta conhece. */
export const FUNDOS: readonly Fundo[] = ['escuro', 'claro']

/**
 * Se um texto nomeia um dos dois fundos.
 * @param valor - o que veio da bandeira ou da variável.
 * @returns verdadeiro quando é um fundo conhecido.
 */
export function eFundo(valor: string): valor is Fundo {
  return (FUNDOS as readonly string[]).includes(valor)
}

/**
 * O degrau de cor.
 * @param ambiente - o ambiente do processo.
 * @param saidaEhTerminal - o que o destino diz de si.
 * @param semCor - se a bandeira que desliga a cor veio.
 * @returns o degrau, o inferior na dúvida.
 */
export function grauDeCor(
  ambiente: Ambiente,
  saidaEhTerminal: boolean,
  semCor = false,
): GrauDeCor {
  // Declarada e vazia conta: é a forma que a convenção de `NO_COLOR` fixa.
  if (!saidaEhTerminal || semCor || ambiente.NO_COLOR !== undefined) return 'nenhuma'

  const termo = ambiente.TERM ?? ''
  if (termo === 'dumb') return 'nenhuma'

  const declarado = (ambiente.COLORTERM ?? '').toLowerCase()
  if (declarado === 'truecolor' || declarado === '24bit') return '24bits'
  if (termo.includes('256color')) return '256'
  return '16'
}

/**
 * O jogo de glifos, pela primeira variável de localidade declarada.
 *
 * Vazia conta como não declarada, que é como a localidade a trata. Nada
 * declarado dá sete bits: é a localidade `C`, e é o degrau inferior.
 * @param ambiente - o ambiente do processo.
 * @returns o jogo de glifos.
 */
export function jogoDeGlifos(ambiente: Ambiente): JogoDeGlifos {
  const localidade = [ambiente.LC_ALL, ambiente.LC_CTYPE, ambiente.LANG].find(
    (valor) => valor !== undefined && valor !== '',
  )
  return localidade !== undefined && /utf-?8/i.test(localidade) ? 'unicode' : 'sete-bits'
}

/**
 * O que `COLORFGBG` diz do fundo, pelo último campo.
 *
 * A regra dos números é a convenção mais antiga em uso para essa variável: de
 * 0 a 6 e 8 são fundos escuros, 7 e de 9 a 15 são claros. Qualquer outra
 * coisa é ilegível, e ilegível é ignorada.
 * @param valor - o valor da variável, quando declarada.
 * @returns o fundo, ou nulo quando ela não diz nada que se entenda.
 */
function fundoDeclaradoPeloTerminal(valor: string | undefined): Fundo | null {
  if (valor === undefined) return null
  const ultimo = valor.split(';').pop() ?? ''
  if (!/^\d+$/.test(ultimo)) return null
  const numero = Number(ultimo)
  if (numero > 15) return null
  return numero === 7 || numero >= 9 ? 'claro' : 'escuro'
}

/**
 * O fundo, pela precedência do RF-20: bandeira, variável, `COLORFGBG`, escuro.
 *
 * O valor não reconhecido da VARIÁVEL não recusa nada: devolve um aviso, que
 * quem chamou escreve no canal de erro, e a precedência segue. Recusar
 * impediria a ferramenta de abrir por causa de um arquivo de inicialização.
 * @param bandeira - o fundo que a bandeira declarou, já conferido, ou nulo.
 * @param ambiente - o ambiente do processo.
 * @returns o fundo e o aviso, nulo quando não há o que avisar.
 */
export function fundoDoAmbiente(
  bandeira: Fundo | null,
  ambiente: Ambiente,
): { tema: Fundo; aviso: string | null } {
  const daVariavel = ambiente[VARIAVEL_DE_TEMA]
  const aviso =
    daVariavel === undefined || eFundo(daVariavel)
      ? null
      : `${VARIAVEL_DE_TEMA} tem um valor que a ferramenta não conhece: "${daVariavel}". Os valores são escuro e claro; a variável foi ignorada.`

  if (bandeira !== null) return { tema: bandeira, aviso }
  if (daVariavel !== undefined && eFundo(daVariavel)) return { tema: daVariavel, aviso }
  return { tema: fundoDeclaradoPeloTerminal(ambiente.COLORFGBG) ?? 'escuro', aviso }
}

/**
 * As três decisões de uma vez.
 * @param pedido - o ambiente, o destino, e as duas bandeiras.
 * @returns a apresentação e o aviso de tema, quando há.
 */
export function apresentacaoDoAmbiente(pedido: {
  ambiente: Ambiente
  saidaEhTerminal: boolean
  semCor: boolean
  tema: Fundo | null
}): { apresentacao: Apresentacao; aviso: string | null } {
  const { tema, aviso } = fundoDoAmbiente(pedido.tema, pedido.ambiente)
  return {
    apresentacao: {
      grau: grauDeCor(pedido.ambiente, pedido.saidaEhTerminal, pedido.semCor),
      tema,
      glifos: jogoDeGlifos(pedido.ambiente),
    },
    aviso,
  }
}
