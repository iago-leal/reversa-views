/**
 * O terminal: modo bruto, tela alternativa, cursor, dimensões e restauração
 * (RN-08, RF-14, RF-15, RF-19, D-07).
 *
 * É um dos três módulos que tocam o mundo, e o ÚNICO em que existe sequência
 * de escape. A fronteira é verificável por busca nos fontes, e é assim de
 * propósito: o desenho produz trechos com PAPEL, que é nome e não cor, e a
 * tradução do papel em sequência acontece aqui, sumindo quando a saída não é
 * terminal ou quando a cor está desligada.
 *
 * Desde a feature 016 a tradução tem três entradas: o papel, o degrau de cor
 * que o ambiente declarou e o fundo. Os tons não moram aqui: moram em
 * `paleta.ts`, porque o que muda por gosto não deve morar junto do que muda
 * por protocolo. Aqui fica só o protocolo.
 *
 * A restauração é idempotente, e isso não é zelo: ela é chamada da saída
 * normal, da falha não prevista, do sinal de interrupção e dos dois lados da
 * suspensão, e algumas dessas chegam juntas. Terminal devolvido duas vezes é
 * inofensivo; devolvido nenhuma é dano ao ambiente do usuário.
 * @module cli/terminal
 */

import { COM_PESO, DEZESSEIS, TONS } from './paleta.ts'
import type { Apresentacao, LinhaDoQuadro, Papel, Quadro, Trecho } from './tipos.ts'

/** As sequências, todas as que este projeto usa, num lugar só. */
const CSI = '\u001b['
const TELA_ALTERNATIVA = `${CSI}?1049h`
const TELA_NORMAL = `${CSI}?1049l`
const ESCONDER_CURSOR = `${CSI}?25l`
const MOSTRAR_CURSOR = `${CSI}?25h`
const LIMPAR = `${CSI}2J${CSI}H`
const NORMAL = `${CSI}0m`

/** Os parâmetros de representação gráfica que o protocolo nomeia. */
const PESO = '1'
const INTENSIDADE_REDUZIDA = '2'
const PRIMEIRO_PLANO_EM_24_BITS = '38;2'
const PRIMEIRO_PLANO_EM_256 = '38;5'

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
 * Os parâmetros de um papel, no degrau e no fundo desta execução.
 *
 * `normal` e `titulo` não levam cor: usam a de primeiro plano do próprio
 * terminal, de modo que a ferramenta nunca escreve branco sobre um fundo que
 * não conhece. No degrau de 16 o fundo não entra, porque quem decide o tom é a
 * paleta do terminal, e atenuado e borda saem por intensidade reduzida.
 * @param papel - o papel abstrato do trecho.
 * @param apresentacao - o degrau de cor e o fundo.
 * @returns os parâmetros, separados por ponto e vírgula; vazio quando não há o que vestir.
 */
function parametros(papel: Papel, apresentacao: Apresentacao): string {
  const partes: string[] = COM_PESO.includes(papel) ? [PESO] : []
  if (papel !== 'normal' && papel !== 'titulo') {
    if (apresentacao.grau === '16') {
      const codigo = DEZESSEIS[papel]
      partes.push(codigo === null ? INTENSIDADE_REDUZIDA : String(codigo))
    } else {
      const tom = TONS[apresentacao.tema][papel]
      partes.push(
        apresentacao.grau === '24bits'
          ? `${PRIMEIRO_PLANO_EM_24_BITS};${tom.vinteEQuatroBits.join(';')}`
          : `${PRIMEIRO_PLANO_EM_256};${tom.duzentasECinquentaESeis}`,
      )
    }
  }
  return partes.join(';')
}

/**
 * Vestir uma linha: cada trecho na sequência do papel dele (feature 016, D-21).
 *
 * Trechos vizinhos de mesmo papel são fundidos, que é o que limita os bytes
 * escritos a cada redesenho integral, e a cor é fechada ao fim de CADA linha,
 * que é o que impede um tom de vazar para a linha seguinte. Com o degrau
 * "nenhuma" sai o texto cru, sem sequência alguma, e é assim que `NO_COLOR` e
 * `--sem-cor` preservam molduras e glifos: eles estão no texto, e não na cor.
 *
 * É o par do papel abstrato: quem quiser conferir que o desenho não decide cor
 * confere que esta função é a única que a decide.
 * @param linha - a linha, com os trechos dela.
 * @param apresentacao - o degrau de cor e o fundo.
 * @returns o texto vestido.
 */
export function vestirLinha(linha: LinhaDoQuadro, apresentacao: Apresentacao): string {
  if (apresentacao.grau === 'nenhuma') return linha.texto

  const fundidos: Trecho[] = []
  for (const pedaco of linha.trechos) {
    const anterior = fundidos.at(-1)
    if (anterior !== undefined && anterior.papel === pedaco.papel) anterior.texto += pedaco.texto
    else fundidos.push({ ...pedaco })
  }

  let vestida = ''
  let aberta = false
  for (const pedaco of fundidos) {
    const codigo = parametros(pedaco.papel, apresentacao)
    if (aberta) vestida += NORMAL
    if (codigo !== '') vestida += `${CSI}${codigo}m`
    aberta = codigo !== ''
    vestida += pedaco.texto
  }
  return aberta ? vestida + NORMAL : vestida
}

/**
 * Montar o terminal sobre os fluxos do processo.
 * @param opcoes - os fluxos, e o degrau de cor e o fundo desta execução.
 * @returns o terminal.
 */
export function criarTerminal(opcoes: {
  fluxos: FluxosDoTerminal
  apresentacao: Apresentacao
}): Terminal {
  const { entrada, saida } = opcoes.fluxos
  const { apresentacao } = opcoes
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
        .map((linha) => vestirLinha(linha, apresentacao))
        .join('\r\n')

      // A linha de estado não rola: é escrita por posicionamento absoluto na
      // última linha da janela, e fica embaixo também quando o quadro é mais
      // curto que ela (feature 016, D-17).
      const estado = quadro.linhaDeEstado
      const altura = saida.rows ?? PADRAO.altura
      const fixa =
        estado === null ? '' : `${CSI}${altura};1H${vestirLinha(estado, apresentacao)}`

      saida.write(LIMPAR + corpo + fixa)
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
