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
 *
 * Desde a feature 017 o redesenho é integral POR POSICIONAMENTO, e não por
 * apagamento da tela: vai ao canto, apaga cada linha antes de escrevê-la,
 * apaga o que sobra abaixo do corpo e escreve a linha de estado, tudo entre a
 * abertura e o fechamento da atualização sincronizada e numa única escrita.
 * Apagar a tela inteira a cada quadro deixava um branco entre um e outro, e
 * era esse branco, em rajada, que o emulador empurrava para o histórico. A
 * rajada de redimensionamento é agrupada aqui, uma chamada por giro do laço
 * de eventos, sem relógio; e o que a ferramenta liga no terminal, inclusive a
 * sincronização, ela desliga na restauração, na ordem inversa.
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
const SINCRONIZAR = `${CSI}?2026h`
const DESSINCRONIZAR = `${CSI}?2026l`
const CANTO = `${CSI}H`
const APAGAR_LINHA = `${CSI}2K`
const APAGAR_ABAIXO = `${CSI}J`
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
  /**
   * Redesenha por inteiro, que é o único desenho que existe: por
   * posicionamento e apagamento por linha, sem apagar a tela, dentro de uma
   * atualização sincronizada e numa única escrita.
   */
  desenhar(quadro: Quadro): void
  /** Uma linha de texto cru, sem ênfase alguma. */
  escrever(texto: string): void
  /** Registra o ouvinte de blocos de bytes; devolve como desfazê-lo. */
  aoTeclar(ouvinte: (bloco: Uint8Array) => void): () => void
  /**
   * Registra o ouvinte de redimensionamento; devolve como desfazê-lo.
   *
   * A rajada é agrupada por giro do laço de eventos: dez eventos seguidos
   * produzem uma chamada, depois do giro, e o ouvinte relê as dimensões na
   * hora em que roda. Desfeita a assinatura, ele não é mais chamado.
   */
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
      // A sincronização é fechada primeiro, para o caso de a saída chegar no
      // meio de um desenho: um emulador com o modo aberto segura a tela até
      // o fechamento, e devolver o cursor antes disso o devolveria a uma tela
      // que ainda não se mostrou (feature 017, RN-02, D-03).
      saida.write(DESSINCRONIZAR + MOSTRAR_CURSOR + TELA_NORMAL)
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
      // Integral não é apagar a tela: apagar a tela inteira a cada quadro
      // deixa uma tela em branco entre um e outro, e é esse branco, em
      // rajada, que o emulador empurra para o histórico. O redesenho vai ao
      // canto e apaga cada linha ANTES de escrevê-la (feature 017, D-01).
      //
      // Antes, e não depois: uma linha de exatamente `largura` colunas deixa
      // o cursor em quebra pendente na última coluna, e apagar dali comeria o
      // último glifo escrito, que é o canto da moldura (D-02).
      const corpo = quadro.linhas
        .map((linha) => APAGAR_LINHA + vestirLinha(linha, apresentacao))
        .join('\r\n')

      // O que sobrou do quadro anterior abaixo de um corpo mais curto é
      // apagado a partir da linha SEGUINTE à última, pela mesma razão da
      // quebra pendente; corpo que enche a janela não tem abaixo.
      const altura = saida.rows ?? PADRAO.altura
      const abaixo =
        quadro.linhas.length < altura ? `${CSI}${quadro.linhas.length + 1};1H${APAGAR_ABAIXO}` : ''

      // A linha de estado não rola: é escrita por posicionamento absoluto na
      // última linha da janela, e fica embaixo também quando o quadro é mais
      // curto que ela (feature 016, D-17).
      const estado = quadro.linhaDeEstado
      const fixa =
        estado === null
          ? ''
          : `${CSI}${altura};1H${APAGAR_LINHA}${vestirLinha(estado, apresentacao)}`

      // Tudo entre a abertura e o fechamento da atualização sincronizada, e
      // numa única escrita: o emulador que conhece o modo troca o quadro de
      // uma vez, e o que não conhece ignora as duas sequências e recebe o
      // quadro inteiro num bloco só (D-03).
      saida.write(SINCRONIZAR + CANTO + corpo + abaixo + fixa + DESSINCRONIZAR)
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
      // A rajada de um arrasto de janela vira uma chamada por giro do laço de
      // eventos: o primeiro evento agenda o ouvinte, os seguintes no mesmo
      // giro só encontram a pendência marcada, e o ouvinte relê as dimensões
      // na hora em que roda. Sem relógio, e sem estado no laço (feature 017,
      // RF-09, D-04).
      let pendente = false
      const agrupar = (): void => {
        if (pendente) return
        pendente = true
        setImmediate(() => {
          if (!pendente) return
          pendente = false
          ouvinte()
        })
      }
      saida.on('resize', agrupar)
      return () => {
        // Cancelar limpa a pendência: o ouvinte não roda depois de desfeito.
        pendente = false
        saida.off('resize', agrupar)
      }
    },
  }
}
