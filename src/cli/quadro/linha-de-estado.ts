/**
 * A linha de estado, fixa na última linha da janela (feature 016, RF-08,
 * RF-10, D-17, D-18).
 *
 * Ela não rola com o conteúdo, e é por isso que não é linha do quadro: mora
 * num campo próprio dele, que a borda escreve por posicionamento. Diz três
 * coisas, e quando a largura falta elas cedem nesta ordem: a procedência da
 * leitura é recortada com reticências, depois as teclas somem, e a posição
 * NUNCA some, porque é ela que declara que há conteúdo acima ou abaixo.
 *
 * A procedência aqui é a primeira frase de `linhasDaProcedencia`, a mesma de
 * sempre, que deixou o cabeçalho. Por extenso, com a razão da degradação
 * quando há uma, ela continua na seção "Versões e construção": na passada não
 * existe linha de estado, e sem isso a frase sumiria do texto redirecionado.
 *
 * As teclas são escritas só com caracteres de sete bits, de propósito: a
 * linha vale igual nos dois jogos de glifos, e a tabela inteira está na ajuda.
 * @module cli/quadro/linha-de-estado
 */

import type { JogoDeGlifos, LinhaDoQuadro, Observacao, Trecho } from '../tipos.ts'
import { GLIFOS } from './glifos.ts'
import { truncar } from './medidas.ts'
import { larguraDosTrechos, linha, trecho } from './trechos.ts'

/** O que separa um campo do outro. */
const ENTRE_CAMPOS = '  '

/** Abaixo disso a procedência não diz nada, e é melhor que ceda o lugar. */
const MINIMO_DA_PROCEDENCIA = 12

/** As teclas principais; a tabela inteira mora na ajuda. */
const TECLAS_PRINCIPAIS = ['j k mover', 'Enter abrir', '? ajuda', 'q sair']

/** O que a linha de estado precisa saber. */
export interface PedidoDaLinhaDeEstado {
  largura: number
  jogo: JogoDeGlifos
  observacao: Observacao
  /** A primeira frase de `linhasDaProcedencia`, ou vazio quando não há. */
  procedencia: string
  /** O índice da primeira linha visível do quadro. */
  primeira: number
  /** Quantas linhas do quadro a janela mostra. */
  visiveis: number
  /** Quantas linhas o quadro inteiro tem. */
  total: number
}

/**
 * Onde a janela está dentro do quadro, e se há o que ver fora dela.
 * @param pedido - o deslocamento, a janela e o total.
 * @returns o texto da posição, com os glifos de acima e de abaixo.
 */
function posicao(pedido: PedidoDaLinhaDeEstado): string {
  const g = GLIFOS[pedido.jogo]
  const de = pedido.total === 0 ? 0 : pedido.primeira + 1
  const ate = Math.min(pedido.total, pedido.primeira + pedido.visiveis)
  const acima = pedido.primeira > 0 ? ` ${g.haAcima}` : ''
  const abaixo = pedido.primeira + pedido.visiveis < pedido.total ? ` ${g.haAbaixo}` : ''
  return `linhas ${de}${g.intervalo}${ate} de ${pedido.total}${acima}${abaixo}`
}

/**
 * Compor a linha de estado.
 * @param pedido - a largura, o jogo de glifos, a observação, a procedência e a posição.
 * @returns a linha, nunca maior que a largura.
 */
export function linhaDeEstado(pedido: PedidoDaLinhaDeEstado): LinhaDoQuadro {
  const { largura, jogo, observacao } = pedido
  const g = GLIFOS[jogo]

  const onde = truncar(posicao(pedido), largura, g.reticencias)
  const degradada = !observacao.ativa && observacao.razaoDaDegradacao !== null
  const vigia = observacao.ativa
    ? trecho(g.observacaoAtiva, 'acento', jogo)
    : trecho(
        degradada ? `${g.observacaoPorIntervalo} por intervalo` : g.observacaoPorIntervalo,
        degradada ? 'atencao' : 'atenuado',
        jogo,
      )
  const teclas = TECLAS_PRINCIPAIS.join(` ${g.separador} `)

  // O que cabe à esquerda da posição, já descontado o que a separa dela.
  const livre = largura - [...onde].length - ENTRE_CAMPOS.length
  const esquerda: Trecho[] = []

  const comVigia = larguraDosTrechos([vigia])
  if (livre >= comVigia) {
    esquerda.push(vigia)

    const paraTeclas = ENTRE_CAMPOS.length + [...teclas].length
    const comTeclas = livre - comVigia - paraTeclas - 1 >= MINIMO_DA_PROCEDENCIA
    const paraProcedencia = livre - comVigia - 1 - (comTeclas ? paraTeclas : 0)

    if (pedido.procedencia !== '' && paraProcedencia >= MINIMO_DA_PROCEDENCIA) {
      esquerda.push(
        trecho(` ${truncar(pedido.procedencia, paraProcedencia, g.reticencias)}`, 'atenuado', jogo),
      )
    }
    if (comTeclas) esquerda.push(trecho(ENTRE_CAMPOS + teclas, 'atenuado', jogo))
  }

  const usado = larguraDosTrechos(esquerda)
  const meio = Math.max(0, largura - usado - [...onde].length)
  return linha([...esquerda, trecho(' '.repeat(meio)), trecho(onde, 'normal', jogo)])
}
