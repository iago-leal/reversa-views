/**
 * A leitura dos argumentos e a escolha do modo (feature 014, D-12, RF-25).
 *
 * O contrato inteiro está em
 * `_reversa_forward/014-cli-do-processo/interfaces/contrato-de-linha-de-comando.md`,
 * e este módulo é a forma executável dele. Função pura: o disco e o terminal
 * chegam como um mundo declarado, e não medidos aqui, que é o que permite
 * exercitar cada degrau da escolha do modo sem redirecionar coisa alguma.
 *
 * Nada aqui lê, escreve ou abre conexão. O que sai é uma configuração, um
 * pedido de ajuda ou uma recusa nomeada, e é quem chamou que age.
 * @module cli/argumentos
 */

import { isAbsolute, resolve } from 'node:path'
import { apresentacaoDoAmbiente, eFundo, FUNDOS } from './ambiente.ts'
import type { Apresentacao, Fundo } from './tipos.ts'

/**
 * Os três códigos de saída do contrato.
 *
 * `ok` cobre a leitura que ocorreu, inclusive degradada e inclusive quando o
 * Reversa não está instalado na raiz: um script que varre projetos precisa
 * distinguir "não instalado" de falha, e a distinção vive aqui.
 */
export const CODIGOS = { ok: 0, falha: 1, uso: 2 } as const

/** Os três modos, na ordem em que o contrato os decide. */
export type Modo = 'vivo' | 'passada' | 'dados'

/** O que a ferramenta precisa saber antes de ler o disco. */
export interface Configuracao {
  /** A raiz a observar, absoluta. */
  raiz: string
  modo: Modo
  /** Se a origem é consultada; a bandeira e a variável desligam igual. */
  conferir: boolean
  /** Se o desenho pode usar cor; some fora do terminal e por declaração. */
  cor: boolean
  /**
   * O degrau de cor, o fundo e o jogo de glifos, pelo que o ambiente declara
   * (feature 016). Invariante: `cor === (apresentacao.grau !== 'nenhuma')`.
   */
  apresentacao: Apresentacao
}

/** O que se sabe do mundo, apartado da decisão para que ela seja testável. */
export interface MundoDosArgumentos {
  diretorioCorrente: string
  eDiretorio(caminho: string): boolean
  saidaEhTerminal: boolean
  ambiente: Record<string, string | undefined>
}

/** Ou há configuração, ou há ajuda a imprimir, ou há recusa a nomear. */
export type LeituraDeArgumentos =
  | {
      kind: 'config'
      config: Configuracao
      /**
       * O que dizer no canal de erro antes de começar, ou nulo (feature 016,
       * RF-21). A leitura continua pura: devolve o aviso em vez de escrevê-lo.
       */
      aviso: string | null
    }
  | { kind: 'ajuda'; codigo: number }
  | {
      kind: 'uso-incorreto'
      /** Por que foi recusado: as duas recusas têm telas diferentes (RF-04). */
      motivo: 'argumento' | 'raiz-inexistente'
      /** O caminho recusado, quando o motivo é a raiz. */
      caminho: string | null
      mensagem: string
      codigo: number
    }

/** As bandeiras sem valor que o contrato reconhece. */
const BANDEIRAS = [
  '--passada',
  '--vivo',
  '--dados',
  '--sem-conferir',
  '--sem-cor',
  '--ajuda',
] as const

/** Uma bandeira sem valor. */
type Bandeira = (typeof BANDEIRAS)[number]

/**
 * Se a variável está DECLARADA, com qualquer valor.
 *
 * Declarada e vazia conta, e isso é convenção e não descuido: `NO_COLOR=` é a
 * forma que a convenção de `NO_COLOR` fixa, e a variável desta ferramenta
 * segue a mesma para não ter duas regras.
 * @param ambiente - o ambiente do processo.
 * @param nome - o nome da variável.
 * @returns verdadeiro quando ela existe.
 */
function declarada(ambiente: Record<string, string | undefined>, nome: string): boolean {
  return ambiente[nome] !== undefined
}

/**
 * O modo, pelos três degraus do contrato.
 *
 * `--dados` vence tudo e implica uma passada. Depois dele, a bandeira presente
 * decide, e a ÚLTIMA vence quando as duas aparecem: é o que um terminal faz
 * com opções que se contradizem, e inventar aqui um quarto código de saída
 * para o caso seria dar a um erro de digitação o peso de um erro de uso.
 * Sem bandeira alguma, a interface viva só nasce se a saída for um terminal.
 * @param presentes - as bandeiras lidas, na ordem em que apareceram.
 * @param saidaEhTerminal - o que a saída padrão diz de si.
 * @returns o modo escolhido.
 */
function escolherModo(presentes: readonly Bandeira[], saidaEhTerminal: boolean): Modo {
  if (presentes.includes('--dados')) return 'dados'
  const ultima = [...presentes].reverse().find((b) => b === '--passada' || b === '--vivo')
  if (ultima === '--passada') return 'passada'
  if (ultima === '--vivo') return 'vivo'
  return saidaEhTerminal ? 'vivo' : 'passada'
}

/**
 * Ler o que veio na linha de comando.
 * @param argumentos - o que veio depois do nome do script.
 * @param mundo - o diretório corrente, o disco, o terminal e o ambiente.
 * @returns a configuração, o pedido de ajuda ou a recusa nomeada.
 */
export function lerArgumentos(
  argumentos: readonly string[],
  mundo: MundoDosArgumentos,
): LeituraDeArgumentos {
  const presentes: Bandeira[] = []
  let pedido: string | null = null
  let tema: Fundo | null = null

  for (const argumento of argumentos) {
    if (argumento.startsWith('--tema=')) {
      // Valor que a ferramenta não conhece é uso incorreto, nomeando o valor,
      // e nada é lido pela metade. A VARIÁVEL com o mesmo defeito só avisa:
      // recusá-la impediria a ferramenta de abrir por um arquivo de inicialização.
      const valor = argumento.slice('--tema='.length)
      if (!eFundo(valor)) {
        return recusa(
          valor === ''
            ? 'a bandeira --tema= chegou sem valor.'
            : `tema não reconhecido: ${valor}. Os valores são ${FUNDOS.join(' e ')}.`,
        )
      }
      tema = valor
      continue
    }
    if (argumento.startsWith('--workspace=')) {
      pedido = argumento.slice('--workspace='.length)
      if (pedido === '') {
        return recusa('a bandeira --workspace= chegou sem caminho.')
      }
      continue
    }
    const bandeira = BANDEIRAS.find((nome) => nome === argumento)
    if (bandeira === undefined) {
      return recusa(`argumento não reconhecido: ${argumento}`)
    }
    presentes.push(bandeira)
  }

  if (presentes.includes('--ajuda')) return { kind: 'ajuda', codigo: CODIGOS.ok }

  const raiz =
    pedido === null
      ? mundo.diretorioCorrente
      : isAbsolute(pedido)
        ? resolve(pedido)
        : resolve(mundo.diretorioCorrente, pedido)

  if (!mundo.eDiretorio(raiz)) {
    return recusa(`a raiz observada não existe: ${raiz}`, 'raiz-inexistente', raiz)
  }

  const modo = escolherModo(presentes, mundo.saidaEhTerminal)
  const { apresentacao, aviso } = apresentacaoDoAmbiente({
    ambiente: mundo.ambiente,
    saidaEhTerminal: mundo.saidaEhTerminal,
    semCor: presentes.includes('--sem-cor'),
    tema,
  })

  return {
    kind: 'config',
    config: {
      raiz,
      modo,
      conferir:
        !presentes.includes('--sem-conferir') &&
        !declarada(mundo.ambiente, 'REVERSA_VIEWS_SEM_CONFERIR'),
      cor: apresentacao.grau !== 'nenhuma',
      apresentacao,
    },
    aviso,
  }
}

/**
 * Uma recusa, sempre com o código de uso incorreto.
 * @param mensagem - o que dizer, nomeando o que foi recusado.
 * @param motivo - qual das duas recusas é; argumento quando nada é dito.
 * @param caminho - o caminho recusado, quando há um.
 * @returns a recusa.
 */
function recusa(
  mensagem: string,
  motivo: 'argumento' | 'raiz-inexistente' = 'argumento',
  caminho: string | null = null,
): LeituraDeArgumentos {
  return { kind: 'uso-incorreto', motivo, caminho, mensagem, codigo: CODIGOS.uso }
}
