/**
 * A saída legível por máquina (RF-21, contrato de linha de comando, seção 7).
 *
 * Um documento JSON, uma só vez, sem nenhuma linha de apresentação. O conteúdo
 * é a carga que a ponte envia à tela, acrescida do que a ferramenta sabe do
 * próprio contexto.
 *
 * Os nomes internos de `processo` e `sonda` são os do PROTOCOLO, e não se
 * traduzem: quem lê dados quer o mesmo vocabulário que a suíte do protocolo já
 * prende, e um nome traduzido aqui seria um segundo contrato a manter.
 *
 * Função pura, e não uma impressão: quem escreve no canal é o ponto de
 * entrada, e o que sai daqui é texto.
 * @module cli/dados
 */

import type { UpdateStatus } from '../host/protocol.ts'
import type { EffectiveEntry } from '../webview/domain/types.ts'

/** O documento, na forma que o contrato fixa. */
export interface DocumentoDeDados {
  raiz: string | null
  lidoEm: string | null
  /** O estado nomeado da entrada, tal como a máquina de estados o produziu. */
  entrada: string
  processo: unknown
  sonda: unknown
  conferencia: UpdateStatus | null
}

/**
 * Montar o documento de uma leitura.
 * @param raiz - a raiz observada.
 * @param entrada - o estado de entrada corrente.
 * @param conferencia - o desfecho da consulta, ou nulo quando não houve.
 * @returns o documento, pronto para serializar.
 */
export function documentoDeDados(
  raiz: string,
  entrada: EffectiveEntry,
  conferencia: UpdateStatus | null,
): DocumentoDeDados {
  const carga = entrada.loaded
  return {
    raiz,
    lidoEm: carga?.readAt ?? null,
    entrada: entrada.kind,
    processo: carga?.process ?? null,
    sonda: carga?.probe ?? null,
    conferencia,
  }
}

/**
 * O documento como texto, com uma quebra de linha ao final e nada mais.
 * @param documento - o que serializar.
 * @returns o JSON.
 */
export function textoDeDados(documento: DocumentoDeDados): string {
  return `${JSON.stringify(documento, null, 2)}\n`
}
