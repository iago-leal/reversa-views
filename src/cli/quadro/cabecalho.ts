/**
 * O cabeçalho: onde a ferramenta diz o que leu, quando e de onde (RN-06,
 * RF-22 da 014; RF-02 da 016).
 *
 * Desde a feature 016 ele é um NÚCLEO de quatro fatos, projeto, raiz
 * observada, instante da leitura e integridade, que vai dentro de uma moldura
 * e é a primeira coisa que o olho encontra. Os outros fatos que o cabeçalho
 * afirmava não sumiram: desceram para a seção "Versões e construção", ao fim
 * do quadro, com os mesmos rótulos e as mesmas funções de origem, e a
 * procedência da leitura foi para a linha de estado.
 *
 * Nenhum texto é decidido aqui. O instante sai de `brasiliaInstant` e a
 * integridade de `readingIntegrity`: um cabeçalho que escolhesse as próprias
 * palavras seria uma segunda autoridade sobre o mesmo fato.
 * @module cli/quadro/cabecalho
 */

import { brasiliaInstant } from '../../webview/domain/instants.ts'
import { readingIntegrity } from '../../webview/domain/integrity.ts'
import type { EffectiveEntry } from '../../webview/domain/types.ts'

/** Como a ferramenta se chama, que é o título da moldura do núcleo. */
export const NOME_DA_FERRAMENTA = 'Reversa'

/** O que um item diz quando a leitura não tem valor para ele. */
export const AUSENTE = 'não declarado'

/**
 * Um par rótulo e valor, nunca em branco.
 * @param rotulo - o nome do fato.
 * @param valor - o valor lido, quando há.
 * @returns a linha, com a declaração de ausência no lugar do que falta.
 */
export function par(rotulo: string, valor: string | null | undefined): string {
  return `${rotulo}: ${valor === null || valor === undefined || valor === '' ? AUSENTE : valor}`
}

/** O núcleo do cabeçalho. */
export interface NucleoDoCabecalho {
  /** Projeto, raiz observada e instante da leitura, nessa ordem. */
  fatos: string[]
  /** A declaração de integridade; nula quando não houve leitura a declarar. */
  integridade: string | null
  /** Se a leitura degradou, para que o compositor escolha o papel da linha. */
  degradada: boolean
}

/**
 * O núcleo do cabeçalho.
 * @param entrada - o estado de entrada corrente.
 * @returns os quatro fatos, em texto cru, sem largura aplicada.
 */
export function nucleoDoCabecalho(entrada: EffectiveEntry): NucleoDoCabecalho {
  const carga = entrada.loaded
  const lido = brasiliaInstant(carga?.readAt ?? null)

  const fatos = [
    par('Projeto', carga?.process.discovery.project ?? null),
    par('Raiz observada', entrada.root),
    par('Lido em', carga === null ? null : lido.text),
  ]

  if (carga === null) return { fatos, integridade: null, degradada: false }

  const integridade = readingIntegrity(carga)
  return {
    fatos,
    integridade: integridade.degraded
      ? `Leitura degradada: ${integridade.anomalies} anomalias, ${integridade.refusals} recusas, ${integridade.truncated} truncamentos.`
      : 'Leitura íntegra.',
    degradada: integridade.degraded,
  }
}
