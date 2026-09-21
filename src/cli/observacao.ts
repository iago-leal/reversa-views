/**
 * A observação do disco (RF-13, RN-09, D-07, D-10, D-11).
 *
 * É o terceiro dos módulos de borda, e o único que assina mudança no disco. A
 * camada de leitura continua sem observar nada, como o NG-04 da spec dela
 * determina: quem decide QUANDO ler é o host, e no terminal a ferramenta é o
 * host. A fronteira não foi quebrada; foi deslocada, e está declarada.
 *
 * Os eventos são AGRUPADOS numa janela de oitocentos milissegundos antes de
 * disparar uma releitura. O ciclo de codificação grava muitas vezes em
 * sequência, e sem agrupamento a tela redesenharia a cada byte. Entre a
 * notícia imediata e a tela estável, a segunda foi a escolha do usuário em
 * 2026-09-20.
 *
 * Quando a assinatura não instala, a observação DEGRADA para releitura por
 * intervalo e declara a razão. A assinatura de mudança no disco é irregular
 * entre sistemas, e falhar em silêncio seria a pior das saídas.
 *
 * Este módulo não lê arquivo algum: ele avisa que algo mudou, e quem relê é o
 * laço, pela mesma sessão de sempre.
 * @module cli/observacao
 */

import { watch } from 'node:fs'
import type { SetProcessData } from '../host/protocol.ts'
import type { Observacao } from './tipos.ts'

/** Quanto se espera depois da última escrita antes de reler (D-10). */
export const JANELA_MS = 800

/** De quanto em quanto se relê quando a assinatura não instalou (D-10). */
export const INTERVALO_MS = 2000

/** O que se diz na tela quando a assinatura não instalou em pasta alguma. */
export const RAZAO_SEM_ASSINATURA =
  'a assinatura de mudança no disco não instalou neste sistema'

/** Um temporizador, na forma mínima que este módulo usa. */
export type Temporizador = { readonly marca: unique symbol } | ReturnType<typeof setTimeout>

/** O que a observação precisa do mundo, apartado para que a decisão seja testável. */
export interface MundoDaObservacao {
  /** Assina uma pasta; devolve como desfazer, ou lança quando não instala. */
  assinar?: (caminho: string, aoEvento: () => void) => () => void
  agendar?: (ms: number, acao: () => void) => Temporizador
  cancelar?: (temporizador: Temporizador) => void
  repetir?: (ms: number, acao: () => void) => Temporizador
  pararRepeticao?: (temporizador: Temporizador) => void
  agora?: () => string
}

/** O vigia vivo: o que dizer na tela sobre ele, e como desligá-lo. */
export interface Vigia {
  estado(): Observacao
  parar(): void
}

/**
 * As pastas que importam, tiradas da própria leitura.
 *
 * Nenhum caminho do Reversa é escrito aqui: `writableFolders` é o que a camada
 * de leitura derivou do estado do projeto, e a raiz entra ao lado dele porque
 * o ponteiro da feature ativa vive nela. Uma lista literal seria a ferramenta
 * sabendo onde o Reversa guarda arquivo, que é o que a RN-01 proíbe.
 * @param raiz - a raiz observada.
 * @param carga - a leitura que o host entregou; nula quando não houve.
 * @returns os caminhos a assinar, sem repetição.
 */
export function pastasQueImportam(raiz: string, carga: SetProcessData | null): string[] {
  const pastas = carga === null ? [] : carga.process.writableFolders
  return [...new Set([raiz, ...pastas.map((pasta) => `${raiz}/${pasta}`)])]
}

/**
 * Observar as pastas, agrupando o que chegar junto.
 * @param pastas - o que assinar.
 * @param aoMudar - o que fazer quando a janela fechar.
 * @param mundo - a assinatura e os temporizadores, substituíveis na suíte.
 * @returns o vigia, com o estado a declarar na tela.
 */
export function observar(
  pastas: readonly string[],
  aoMudar: () => void,
  mundo: MundoDaObservacao = {},
): Vigia {
  const assinar = mundo.assinar ?? assinaturaReal
  const agendar = mundo.agendar ?? ((ms, acao) => setTimeout(acao, ms))
  const cancelar = mundo.cancelar ?? ((t) => clearTimeout(t as ReturnType<typeof setTimeout>))
  const repetir = mundo.repetir ?? ((ms, acao) => setInterval(acao, ms))
  const pararRepeticao =
    mundo.pararRepeticao ?? ((t) => clearInterval(t as ReturnType<typeof setInterval>))
  const agora = mundo.agora ?? (() => new Date().toISOString())

  const desfazer: Array<() => void> = []
  let pendente: Temporizador | null = null
  let repeticao: Temporizador | null = null
  let ultimaMudanca: string | null = null

  /** Fecha a janela: uma releitura, por mais escritas que tenham chegado. */
  const disparar = (): void => {
    pendente = null
    ultimaMudanca = agora()
    aoMudar()
  }

  /** Cada evento reabre a janela, e é por isso que a rajada vira uma só. */
  const aoEvento = (): void => {
    if (pendente !== null) cancelar(pendente)
    pendente = agendar(JANELA_MS, disparar)
  }

  let instaladas = 0
  const recusas: string[] = []
  for (const pasta of pastas) {
    try {
      desfazer.push(assinar(pasta, aoEvento))
      instaladas += 1
    } catch (erro) {
      recusas.push(erro instanceof Error ? erro.message : String(erro))
    }
  }

  const ativa = instaladas > 0
  const razaoDaDegradacao = ativa
    ? null
    : recusas.length === 0
      ? RAZAO_SEM_ASSINATURA
      : `${RAZAO_SEM_ASSINATURA} (${recusas[0]})`

  if (!ativa) {
    repeticao = repetir(INTERVALO_MS, disparar)
  }

  return {
    estado() {
      return { ativa, razaoDaDegradacao, ultimaMudanca }
    },
    parar() {
      if (pendente !== null) {
        cancelar(pendente)
        pendente = null
      }
      if (repeticao !== null) {
        pararRepeticao(repeticao)
        repeticao = null
      }
      for (const fim of desfazer.splice(0)) fim()
    },
  }
}

/**
 * A assinatura de verdade, que é a única linha deste projeto que a instala.
 * @param caminho - a pasta a assinar.
 * @param aoEvento - o que chamar a cada mudança.
 * @returns como desfazer a assinatura.
 */
function assinaturaReal(caminho: string, aoEvento: () => void): () => void {
  const vigia = watch(caminho, { recursive: true }, aoEvento)
  // Um erro depois de instalada não derruba a ferramenta: a pasta pode sumir
  // no meio da sessão, e isso é caso de degradar, não de cair.
  vigia.on('error', () => vigia.close())
  return () => vigia.close()
}
