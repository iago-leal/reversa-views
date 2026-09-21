/**
 * O terminal: modo bruto, tela alternativa, cursor, dimensões e restauração
 * (RN-08, RF-14, RF-15, RF-19, D-07).
 *
 * É um dos três módulos que tocam o mundo, e o ÚNICO em que existe sequência
 * de escape. A fronteira é verificável por busca nos fontes, e é assim de
 * propósito: o desenho produz ênfase abstrata, e a tradução em cor, negrito ou
 * inversão acontece aqui, sumindo quando a saída não é terminal ou quando a
 * cor está desligada.
 *
 * A restauração é idempotente, e isso não é zelo: ela é chamada da saída
 * normal, da falha não prevista, do sinal de interrupção e dos dois lados da
 * suspensão, e algumas dessas chegam juntas. Terminal devolvido duas vezes é
 * inofensivo; devolvido nenhuma é dano ao ambiente do usuário.
 * @module cli/terminal
 */

import type { Enfase, Quadro } from './tipos.ts'

/** As sequências, todas as que este projeto usa, num lugar só. */
const CSI = '\u001b['
const TELA_ALTERNATIVA = `${CSI}?1049h`
const TELA_NORMAL = `${CSI}?1049l`
const ESCONDER_CURSOR = `${CSI}?25l`
const MOSTRAR_CURSOR = `${CSI}?25h`
const LIMPAR = `${CSI}2J${CSI}H`
const NORMAL = `${CSI}0m`

/** Como cada ênfase se traduz, quando há cor a usar. */
const CORES: Record<Enfase, string> = {
  normal: '',
  titulo: `${CSI}1m`,
  selecionada: `${CSI}7m`,
  atenuada: `${CSI}2m`,
  alerta: `${CSI}33m`,
}

/** Quantas colunas e linhas usar quando o terminal não as declara. */
const PADRAO = { largura: 80, altura: 24 }

/** A fatia dos fluxos de que este módulo precisa, e nada além dela. */
export interface FluxosDoTerminal {
  entrada: NodeJS.ReadStream
  saida: NodeJS.WriteStream
}

/** O terminal, como o laço o vê. */
export interface Terminal {
  /** As dimensões correntes, relidas a cada chamada. */
  dimensoes(): { largura: number; altura: number }
  /** Modo bruto, tela alternativa e cursor escondido. */
  entrar(): void
  /** Devolve o terminal como foi encontrado; chamável quantas vezes for. */
  restaurar(): void
  /** Apaga e redesenha por inteiro, que é o único desenho que existe. */
  desenhar(quadro: Quadro): void
  /** Uma linha de texto cru, sem ênfase alguma. */
  escrever(texto: string): void
  /** Registra o ouvinte de blocos de bytes; devolve como desfazê-lo. */
  aoTeclar(ouvinte: (bloco: Uint8Array) => void): () => void
  /** Registra o ouvinte de redimensionamento; devolve como desfazê-lo. */
  aoRedimensionar(ouvinte: () => void): () => void
}

/**
 * A tradução de uma ênfase em sequência, ou em nada.
 *
 * Exportada porque é o par da ênfase abstrata: quem quiser conferir que o
 * desenho não decide cor confere que esta função é a única que a decide.
 * @param enfase - a ênfase abstrata da linha.
 * @param cor - se há cor a usar nesta execução.
 * @returns o par de sequências, vazio quando não há cor.
 */
export function vestir(enfase: Enfase, cor: boolean): { abre: string; fecha: string } {
  if (!cor || CORES[enfase] === '') return { abre: '', fecha: '' }
  return { abre: CORES[enfase], fecha: NORMAL }
}

/**
 * Montar o terminal sobre os fluxos do processo.
 * @param opcoes - os fluxos e se a cor está ligada.
 * @returns o terminal.
 */
export function criarTerminal(opcoes: { fluxos: FluxosDoTerminal; cor: boolean }): Terminal {
  const { entrada, saida } = opcoes.fluxos
  let dentro = false

  return {
    dimensoes() {
      return {
        largura: saida.columns ?? PADRAO.largura,
        altura: saida.rows ?? PADRAO.altura,
      }
    },

    entrar() {
      if (dentro) return
      dentro = true
      if (entrada.isTTY) entrada.setRawMode(true)
      entrada.ref()
      entrada.resume()
      saida.write(TELA_ALTERNATIVA + ESCONDER_CURSOR)
    },

    restaurar() {
      if (!dentro) return
      dentro = false
      saida.write(MOSTRAR_CURSOR + TELA_NORMAL)
      if (entrada.isTTY) entrada.setRawMode(false)
      entrada.pause()
      // Pausar não basta para o processo terminar: um `stdin` que já recebeu
      // dados continua contando como alça viva do laço de eventos, e a
      // ferramenta ficava de pé depois de `q`, com a tela já devolvida e nada
      // mais para fazer. Soltar a referência é o que deixa o processo morrer
      // por esgotamento, sem `process.exit` e sem matar o que ainda escreve.
      entrada.unref()
    },

    desenhar(quadro) {
      // Redesenho INTEGRAL, e não incremental: o editor do ambiente pode ter
      // escrito qualquer coisa na tela, e presumir o contrário produz resíduo.
      const corpo = quadro.linhas
        .map((linha) => {
          const { abre, fecha } = vestir(linha.enfase, opcoes.cor)
          return abre + linha.texto + fecha
        })
        .join('\r\n')
      saida.write(LIMPAR + corpo)
    },

    escrever(texto) {
      saida.write(`${texto}\n`)
    },

    aoTeclar(ouvinte) {
      const embrulho = (pedaco: Buffer | string): void => {
        ouvinte(typeof pedaco === 'string' ? new TextEncoder().encode(pedaco) : pedaco)
      }
      entrada.on('data', embrulho)
      return () => {
        entrada.off('data', embrulho)
      }
    },

    aoRedimensionar(ouvinte) {
      saida.on('resize', ouvinte)
      return () => {
        saida.off('resize', ouvinte)
      }
    },
  }
}
