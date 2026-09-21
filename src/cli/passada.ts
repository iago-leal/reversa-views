/**
 * O modo de uma passada: o mesmo quadro, impresso uma vez (RF-17 a RF-20).
 *
 * O MESMO quadro, e é isso que o módulo tem de mais importante: ele não
 * desenha nada de novo, não escolhe outra ordem e não escreve outro rótulo.
 * O que muda é o que não há: sem tela alternativa, sem cursor, sem cor quando
 * o destino não a aceita, e sem espera por tecla.
 *
 * Toda seção sai ABERTA. O que nasce fechado no painel nasce fechado porque
 * ali há um gesto que o abre; num texto que vai para arquivo ou para um cano,
 * esconder conteúdo atrás de um gesto que não existe seria perder o conteúdo.
 *
 * O caminho de cada artefato apontado sai relativo à raiz, como a leitura o
 * entregou, já no formato que se cola num editor (RF-18).
 * @module cli/passada
 */

import type { UpdateStatus } from '../host/protocol.ts'
import type { EffectiveEntry } from '../webview/domain/types.ts'
import { sectionOrder } from '../webview/domain/sections.ts'
import { linhasDoQuadro } from './quadro/index.ts'
import type { Observacao, Procedencia } from './tipos.ts'

/** A largura usada quando o destino não declara a sua. */
export const LARGURA_PADRAO = 80

/** A observação de quem não observa nada: o modo de uma passada não vigia. */
const SEM_OBSERVACAO: Observacao = { ativa: false, razaoDaDegradacao: null, ultimaMudanca: null }

/** O que a passada precisa saber. */
export interface PedidoDaPassada {
  entrada: EffectiveEntry
  /** Quantas colunas o destino tem; a padrão quando ele não declara. */
  largura?: number
  conferenciaLigada: boolean
  /** Por que esta leitura existe; numa passada é sempre a primeira. */
  procedencia?: Procedencia
}

/**
 * O texto inteiro de uma passada.
 * @param pedido - a entrada, a largura e o estado da conferência.
 * @returns o texto, com uma quebra de linha ao final.
 */
export function textoDaPassada(pedido: PedidoDaPassada): string {
  const largura = pedido.largura ?? LARGURA_PADRAO

  const linhas = linhasDoQuadro({
    entrada: pedido.entrada,
    estado: {
      // Nenhuma seção fechada, e nenhuma seleção: ver acima.
      secaoSelecionada: sectionOrder()[0],
      itemSelecionado: null,
      secoesFechadas: new Set(),
      ajudaVisivel: false,
      primeiraLinhaVisivel: 0,
    },
    largura,
    // Altura irrelevante: quem imprime uma vez não tem janela a respeitar.
    altura: Number.MAX_SAFE_INTEGER,
    observacao: SEM_OBSERVACAO,
    procedencia: pedido.procedencia ?? 'primeira',
    conferenciaLigada: pedido.conferenciaLigada,
    cursor: false,
  })

  return `${linhas.map((linha) => linha.texto).join('\n')}\n`
}

/**
 * O código de saída que uma leitura pede (RF-20).
 *
 * Reversa não instalado NÃO é erro: é resposta legítima, com tela própria, e
 * um script que varre projetos precisa distinguir isso de falha.
 * @param entrada - o estado de entrada corrente.
 * @param codigos - os três códigos do contrato.
 * @returns zero quando a leitura ocorreu, e o de falha quando não.
 */
export function codigoDaLeitura(
  entrada: EffectiveEntry,
  codigos: { ok: number; falha: number },
): number {
  return entrada.kind === 'error' ? codigos.falha : codigos.ok
}

/** O desfecho da conferência, quando há um a declarar na passada. */
export type DesfechoDaPassada = UpdateStatus | null
