/**
 * A seção "Versões e construção", que é do terminal (feature 016, RF-18,
 * D-15, D-16).
 *
 * Ela guarda os fatos que deixaram o cabeçalho quando ele encolheu para o
 * núcleo: versão do Reversa, revisão do modelo herdado, versão da extensão,
 * carimbo da construção e o desfecho da conferência de atualização. Nenhum
 * fato que o cabeçalho afirmava deixou de ser afirmado; mudou de lugar.
 *
 * Fica declaradamente FORA da ordem fixa das onze seções, depois delas, como a
 * faixa de bloqueio fica antes: `SectionName` e `sectionOrder()` são da
 * apresentação compartilhada, a tela não tem esta seção, e pô-la ali tocaria o
 * painel por algo que o painel não desenha.
 *
 * Ao fim dela vão, inteiras, as linhas da origem da leitura. Na passada não
 * existe linha de estado, e sem isso a frase sumiria do texto redirecionado; é
 * também o que mantém a razão da degradação legível por extenso. A PALAVRA
 * que nomeia essa origem fica reservada a ela, e por isso não aparece no
 * título nem no identificador desta seção.
 *
 * Os rótulos e as funções de origem são os de sempre: `revisionLabel` e
 * `updateLabel`, as mesmas que o painel chama.
 * @module cli/quadro/secao-de-versoes
 */

import { revisionLabel, updateLabel } from '../../webview/domain/labels.ts'
import type { EffectiveEntry } from '../../webview/domain/types.ts'
import { SECAO_DE_VERSOES } from '../tipos.ts'
import type { SecaoDesenhada } from '../tipos.ts'
import { par } from './cabecalho.ts'

/** Como a seção se chama no quadro. */
export const TITULO_DAS_VERSOES = 'Versões e construção'

/**
 * A seção, na forma das outras.
 * @param entrada - o estado de entrada corrente.
 * @param conferenciaLigada - se a consulta à origem foi feita nesta execução.
 * @param origemDaLeitura - as linhas de `linhasDaProcedencia`, inteiras.
 * @returns a seção, recolhível, sem contagem e sem artefato algum.
 */
export function secaoDeVersoes(
  entrada: EffectiveEntry,
  conferenciaLigada: boolean,
  origemDaLeitura: readonly string[],
): SecaoDesenhada {
  const carga = entrada.loaded

  const fatos = [
    par('Reversa', carga?.process.discovery.version ?? null),
    par('Modelo herdado', revisionLabel(carga?.inheritedRevision)),
    par('Extensão', carga?.extensionVersion ?? null),
    par('Construída de', revisionLabel(carga?.builtFromCommit)),
  ]

  // O desfecho é uma LINHA, e a ausência dele não desenha linha alguma: o
  // painel segue a mesma regra, e declarar "em dia" sobre uma consulta que não
  // houve seria afirmar o que ninguém perguntou.
  if (entrada.update !== null) {
    const desfecho = updateLabel(entrada.update, carga?.builtFromRoot ?? null)
    fatos.push(desfecho.command === null ? desfecho.text : `${desfecho.text} ${desfecho.command}`)
  } else if (!conferenciaLigada) {
    fatos.push(
      'A conferência de atualização está desligada nesta execução: nenhuma conexão foi aberta.',
    )
  }

  return {
    nome: SECAO_DE_VERSOES,
    titulo: TITULO_DAS_VERSOES,
    contagem: null,
    corpo: [],
    itens: [...fatos, ...origemDaLeitura].map((texto) => ({ texto, artefato: null })),
    recolhivel: true,
  }
}
