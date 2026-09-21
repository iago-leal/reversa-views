/**
 * A conferência de atualização, pela porta e pelo módulo que já existem
 * (RF-23, RF-24, RN-10, D-13).
 *
 * Nenhuma conexão nova nasce nesta feature. O plano de consulta é o
 * `queryPlan` do host, a interpretação da resposta é o `interpretReply` do
 * host, e a porta é a `originPort` de `host/net.ts`, que continua sendo o
 * único módulo do projeto que importa um cliente de requisição. O que este
 * arquivo acrescenta é o lugar do desligamento no terminal: no editor é uma
 * chave de configuração, e aqui são a bandeira e a variável de ambiente,
 * porque não há painel de configuração num terminal.
 *
 * NADA do que foi lido no disco acompanha a consulta. O endereço é constante
 * de compilação, e não vem de argumento, de ambiente nem de arquivo do
 * workspace.
 * @module cli/conferencia
 */

import {
  BUILT_FROM_COMMIT,
  DEFAULT_BRANCH,
  EXTENSION_VERSION,
  ORIGIN_REPOSITORY,
} from '../host/build.ts'
import { originPort } from '../host/net.ts'
import type { OriginPort } from '../host/ports.ts'
import type { UpdateStatus } from '../host/protocol.ts'
import { interpretReply, queryPlan } from '../host/update.ts'

/** O que a conferência precisa saber, e o que a suíte substitui. */
export interface PedidoDeConferencia {
  /** Falso pela bandeira ou pela variável; o desfecho é `desligada`. */
  ligada: boolean
  /** A porta a usar; a real quando nada é dito. */
  porta?: OriginPort
  /** O commit desta construção; o carimbo quando nada é dito. */
  commit?: string
  /** O repositório de origem; o carimbo quando nada é dito. */
  repositorio?: string | null
}

/**
 * Perguntar à origem se esta construção ficou atrás.
 *
 * Ela não lança, em ramo algum: a leitura do disco já terminou quando isto
 * roda, e uma exceção aqui derrubaria uma leitura que deu certo. Toda falha
 * vira desfecho nomeado, que é o que a tela tem a dizer.
 * @param pedido - se a consulta está ligada, e as costuras da suíte.
 * @returns um dos sete desfechos nomeados.
 */
export async function conferir(pedido: PedidoDeConferencia): Promise<UpdateStatus> {
  const repositorio = pedido.repositorio === undefined ? ORIGIN_REPOSITORY : pedido.repositorio
  const plano = queryPlan({
    enabled: pedido.ligada,
    origin: repositorio,
    commit: pedido.commit ?? BUILT_FROM_COMMIT,
    branch: DEFAULT_BRANCH,
  })

  if (plano.kind === 'skip') return plano.status

  const porta =
    pedido.porta ??
    originPort(repositorio as string, { version: EXTENSION_VERSION })

  const resposta = await porta
    .compare(plano.base, plano.head)
    .catch(() => ({ kind: 'failure', cause: 'resposta-inesperada' }) as const)

  return interpretReply(resposta)
}
