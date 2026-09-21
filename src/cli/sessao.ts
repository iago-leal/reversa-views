/**
 * A sessão: a mesma sequência de mensagens que a tela recebe (D-01, D-02).
 *
 * Nenhuma regra de leitura nasce aqui, e nenhuma regra de entrada tampouco. O
 * módulo pede ao host a sequência por `sessionMessages` e a dobra sobre
 * `nextEntry`, que é a máquina de estados que o painel já usa. Disso decorre a
 * propriedade que mais importa nesta feature: leitura degradada, raiz ausente,
 * feature recém-criada e releitura comportam-se no terminal exatamente como no
 * editor, porque são o mesmo código decidindo.
 *
 * O estado anterior chega como PARÂMETRO, pela mesma razão que chega no painel:
 * é o que permite à releitura preservar o que estava na tela sem que nada aqui
 * se lembre de coisa alguma.
 * @module cli/sessao
 */

import type { BuildStamp } from '../host/session.ts'
import { sessionMessages } from '../host/session.ts'
import type { HostMessage } from '../host/protocol.ts'
import type { ReadingResult } from '../host/reading.ts'
import { INITIAL_ENTRY, nextEntry } from '../webview/domain/entry.ts'
import type { EffectiveEntry } from '../webview/domain/types.ts'

/** O que a sessão precisa de fora: quem lê uma raiz, e o carimbo desta construção. */
export interface DependenciasDaSessao {
  /** Lê uma raiz; chamado no máximo uma vez por leitura. */
  ler: (raiz: string) => ReadingResult
  /** O que esta construção sabe de si, como o host o entrega. */
  carimbo: BuildStamp
}

/** O que uma leitura produziu: a sequência crua e a entrada que ela deixa. */
export interface Sessao {
  /** As mensagens, na ordem do host, para quem quiser a carga bruta. */
  mensagens: HostMessage[]
  /** A entrada corrente, produzida por `nextEntry` sobre a sequência. */
  entrada: EffectiveEntry
}

/**
 * Ler a raiz uma vez e dobrar a sequência sobre a máquina de entrada.
 * @param raiz - a raiz observada, absoluta.
 * @param deps - o leitor e o carimbo.
 * @param anterior - o que estava na tela; o estado inicial na primeira leitura.
 * @returns as mensagens e a entrada corrente.
 */
export function lerSessao(
  raiz: string,
  deps: DependenciasDaSessao,
  anterior: EffectiveEntry = INITIAL_ENTRY,
): Sessao {
  const { messages } = sessionMessages([raiz], deps.ler, deps.carimbo)
  const entrada = messages.reduce(nextEntry, anterior)
  return { mensagens: messages, entrada }
}
