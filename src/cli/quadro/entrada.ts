/**
 * As quatro situações de entrada, cada uma com título e corpo (RF-04).
 *
 * Nenhuma delas produz tela vazia, e esse é o critério de aceitação do RF-04:
 * a situação que tem menos a dizer continua dizendo alguma coisa. Duas são
 * deliberadamente assimétricas, como no painel: a de raiz inexistente não
 * oferece ação, porque não há o que a ferramenta possa fazer a respeito, e a
 * de projeto sem Reversa explica como instalá-lo, por NÃO ser erro. É a razão
 * de o contrato de linha de comando dar-lhe código zero.
 *
 * A situação sai do estado de entrada que `nextEntry` produziu, e não de um
 * segundo julgamento: duas autoridades sobre o mesmo fato acabam discordando.
 * @module cli/quadro/entrada
 */

import type { EffectiveEntry } from '../../webview/domain/types.ts'

/** As quatro situações que o RF-04 nomeia. */
export type SituacaoDeEntrada = 'raiz-inexistente' | 'sem-reversa' | 'integra' | 'falha'

/** Uma tela de entrada: um título e um corpo, nenhum dos dois vazio. */
export interface TelaDeEntrada {
  titulo: string
  corpo: string[]
}

/** O comando que instala o Reversa, dito por extenso porque não é erro. */
const COMANDO_DE_INSTALACAO = 'npx reversa init'

/**
 * Em qual das quatro situações a leitura parou.
 *
 * `loading` cai em `integra` de propósito: a ferramenta lê de uma vez, de modo
 * que o estado de carregamento nunca chega à tela, e tratá-lo como falha seria
 * nomear um erro que não houve.
 * @param entrada - o estado de entrada corrente.
 * @returns a situação nomeada.
 */
export function situacaoDaEntrada(entrada: EffectiveEntry): SituacaoDeEntrada {
  if (entrada.kind === 'no-folder') return 'raiz-inexistente'
  if (entrada.kind === 'error') return 'falha'
  if (entrada.kind === 'no-reversa') return 'sem-reversa'
  return 'integra'
}

/**
 * O título e o corpo de uma situação.
 * @param situacao - qual das quatro.
 * @param dados - o caminho recusado e a mensagem recebida, quando há.
 * @returns a tela, nunca vazia.
 */
export function telaDeEntrada(
  situacao: SituacaoDeEntrada,
  dados: { caminho?: string | null; mensagem?: string | null } = {},
): TelaDeEntrada {
  switch (situacao) {
    case 'raiz-inexistente':
      return {
        titulo: 'Raiz inexistente',
        corpo: [
          `O caminho pedido não existe ou não é uma pasta: ${dados.caminho ?? 'caminho não declarado'}.`,
          'Aponte uma pasta existente com --workspace=<caminho>, ou rode a ferramenta de dentro do projeto.',
        ],
      }
    case 'sem-reversa':
      return {
        titulo: 'Reversa não instalado aqui',
        corpo: [
          'O Reversa é um framework de engenharia reversa que documenta um sistema existente e conduz a evolução dele a partir dessa documentação. Ele guarda o estado do processo em arquivos dentro do projeto, e é isso que esta ferramenta lê.',
          `Para instalar na raiz observada, rode: ${COMANDO_DE_INSTALACAO}`,
          'Isto não é erro: a leitura ocorreu e a ferramenta termina bem.',
        ],
      }
    case 'falha':
      return {
        titulo: 'Não foi possível ler o processo',
        corpo: [
          'A leitura falhou e não há o que mostrar. A mensagem recebida foi:',
          dados.mensagem ?? 'sem mensagem',
        ],
      }
    case 'integra':
      return {
        titulo: 'Processo lido',
        corpo: ['Reversa instalado na raiz observada; o que segue é o que a leitura encontrou.'],
      }
  }
}
