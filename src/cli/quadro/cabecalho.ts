/**
 * O cabeçalho: onde a ferramenta diz o que leu, quando e de onde (RN-06,
 * RF-22, RF-23).
 *
 * Os mesmos itens do cabeçalho do painel, na mesma ordem e com os mesmos
 * rótulos: projeto, versão do Reversa, revisão do modelo herdado, versão da
 * extensão, construção de origem, raiz observada, instante da leitura, o
 * desfecho da conferência e a declaração de integridade.
 *
 * Nenhum texto é decidido aqui. O instante sai de `brasiliaInstant`, a revisão
 * de `revisionLabel`, a frase do desfecho de `updateLabel` e a integridade de
 * `readingIntegrity`: um cabeçalho que escolhesse as próprias palavras seria
 * uma segunda autoridade sobre o mesmo fato.
 * @module cli/quadro/cabecalho
 */

import { brasiliaInstant } from '../../webview/domain/instants.ts'
import { revisionLabel, updateLabel } from '../../webview/domain/labels.ts'
import { readingIntegrity } from '../../webview/domain/integrity.ts'
import type { EffectiveEntry } from '../../webview/domain/types.ts'

/** O que um item diz quando a leitura não tem valor para ele. */
const AUSENTE = 'não declarado'

/** Um par rótulo e valor, nunca em branco. */
function par(rotulo: string, valor: string | null | undefined): string {
  return `${rotulo}: ${valor === null || valor === undefined || valor === '' ? AUSENTE : valor}`
}

/**
 * As linhas do cabeçalho.
 * @param entrada - o estado de entrada corrente.
 * @param conferenciaLigada - se a consulta à origem foi feita nesta execução.
 * @returns as linhas, em texto cru, sem largura aplicada.
 */
export function linhasDoCabecalho(
  entrada: EffectiveEntry,
  conferenciaLigada: boolean,
): string[] {
  const carga = entrada.loaded
  const descoberta = carga?.process.discovery ?? null
  const lido = brasiliaInstant(carga?.readAt ?? null)

  const linhas = [
    'Reversa',
    par('Projeto', descoberta?.project ?? null),
    par('Reversa', descoberta?.version ?? null),
    par('Modelo herdado', revisionLabel(carga?.inheritedRevision)),
    par('Extensão', carga?.extensionVersion ?? null),
    par('Construída de', revisionLabel(carga?.builtFromCommit)),
    par('Raiz observada', entrada.root),
    par('Lido em', carga === null ? null : lido.text),
  ]

  if (carga !== null) {
    const integridade = readingIntegrity(carga)
    linhas.push(
      integridade.degraded
        ? `Leitura degradada: ${integridade.anomalies} anomalias, ${integridade.refusals} recusas, ${integridade.truncated} truncamentos.`
        : 'Leitura íntegra.',
    )
  }

  // O desfecho é uma LINHA, e a ausência dele não desenha linha alguma: o
  // painel segue a mesma regra, e declarar "em dia" sobre uma consulta que não
  // houve seria afirmar o que ninguém perguntou.
  if (entrada.update !== null) {
    const desfecho = updateLabel(entrada.update, carga?.builtFromRoot ?? null)
    linhas.push(
      desfecho.command === null ? desfecho.text : `${desfecho.text} ${desfecho.command}`,
    )
  } else if (!conferenciaLigada) {
    linhas.push(
      'A conferência de atualização está desligada nesta execução: nenhuma conexão foi aberta.',
    )
  }

  return linhas
}
