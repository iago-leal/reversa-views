/**
 * The approved map of out-of-schema equivalences (feature 012).
 *
 * GENERATED FILE. It is written by `scripts/promover-equivalencias.js`, from
 * the items a person ticked in a proposal, and it is not edited by hand: an
 * edit here would be an approval no one made and no history records.
 *
 * It is VERSIONED, unlike the build stamp and like the inherited revision. The
 * stamp changes at every commit; this map changes only when someone decides
 * something, which makes its git history the audit trail of the approvals
 * themselves -- who approved what, when, and against which evidence.
 *
 * It is a MODULE and not a `.json` because of how the package is assembled:
 * `.vscodeignore` lets back in only `out/**` and `media/**`, so a data file
 * under `src/` would never reach the `.vsix`.
 * @module domain/equivalencias
 */

import type { MapaDeEquivalencias } from './types.ts'

/** Everything a person has approved. */
export const MAPA_DE_EQUIVALENCIAS: MapaDeEquivalencias = {
  pares: [
    {
      campo: 'done',
      valor: 'true',
      leitura: 'concluido',
      aprovadoEm: '2026-09-20',
      evidencia: ['capacities'],
    },
    {
      campo: 'status',
      valor: 'completed',
      leitura: 'concluido',
      aprovadoEm: '2026-09-20',
      evidencia: ['comentarios-concursos'],
    },
    {
      campo: 'status',
      valor: 'completo',
      leitura: 'concluido',
      aprovadoEm: '2026-09-20',
      evidencia: ['medicina-leal-app'],
    },
    {
      campo: 'status',
      valor: 'concluido',
      leitura: 'concluido',
      aprovadoEm: '2026-09-20',
      evidencia: ['afla', 'med-reversa'],
    },
    {
      campo: 'status',
      valor: 'success',
      leitura: 'concluido',
      aprovadoEm: '2026-09-20',
      evidencia: ['scrapping'],
    },
  ],
  naoAgentes: [
    {
      chave: 'decisoes_autor',
      aprovadoEm: '2026-09-20',
      evidencia: ['afla'],
    },
    {
      chave: 'plano_aprovado',
      aprovadoEm: '2026-09-20',
      evidencia: ['med-reversa'],
    },
  ],
}
