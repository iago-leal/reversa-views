/**
 * De onde veio a leitura que está na tela, e quando (RN-09).
 *
 * A observação do disco não muda a tela sem dizer, e dizer exige distinguir a
 * releitura que o usuário pediu da que veio sozinha: sem isso, o leitor
 * encontra um número diferente do que tinha visto e não sabe se o processo
 * mudou ou se ele leu errado.
 *
 * A degradação da observação é um caso particular da mesma regra. Uma
 * interface que promete observar e caiu para releitura por intervalo deve
 * declarar o que está fazendo, com a razão: falhar em silêncio é a pior das
 * saídas (D-11).
 * @module cli/quadro/procedencia
 */

import { brasiliaInstant } from '../../webview/domain/instants.ts'
import type { Observacao, Procedencia } from '../tipos.ts'

/** Como cada procedência se diz, na primeira pessoa da tela. */
const ORIGENS: Record<Procedencia, string> = {
  primeira: 'esta é a primeira leitura desta sessão',
  tecla: 'releitura pedida por tecla',
  observacao: 'releitura vinda da observação do disco, sem que ninguém pedisse',
}

/**
 * As linhas da procedência.
 * @param procedencia - o que causou a leitura que está na tela.
 * @param lidoEm - o instante da leitura, absoluto.
 * @param observacao - o estado da observação do disco.
 * @returns uma linha, mais a da degradação quando ela existe.
 */
export function linhasDaProcedencia(
  procedencia: Procedencia,
  lidoEm: string | null,
  observacao: Observacao,
): string[] {
  const quando = brasiliaInstant(lidoEm)
  const linhas = [`Leitura de ${quando.text}: ${ORIGENS[procedencia]}.`]

  if (observacao.ultimaMudanca !== null && procedencia === 'observacao') {
    linhas.push(
      `A última mudança no disco chegou em ${brasiliaInstant(observacao.ultimaMudanca).text}.`,
    )
  }

  if (!observacao.ativa && observacao.razaoDaDegradacao !== null) {
    linhas.push(
      `A observação do disco caiu para releitura por intervalo: ${observacao.razaoDaDegradacao}.`,
    )
  }

  return linhas
}
