/**
 * The cut of the decomposition for the screen (RF-07, RF-08, RF-11, RN-10,
 * D-13, D-17), reordered by feature 007 (D-14, RN-07, RF-23 to RF-26).
 *
 * A feature of sixty-one actions does not fit a sidebar, and a list that has
 * to be scrolled to find where the work stopped answers no question. So the
 * default cut is every OPEN action plus the five most recently closed, with
 * the total always in sight and a control that reveals the rest.
 *
 * WHAT FEATURE 007 CHANGED, and why it was a defect rather than a preference:
 * this function used to SELECT by recency and RETURN in the order of the file.
 * The two orders were computed in the same place and disagreed anyway, so the
 * card showed the right actions in the wrong order — whoever opened the panel
 * to see where the work stopped read first what had been done first. D-14
 * ends that by making one function decide both, and the cut is now a PREFIX of
 * the ordered list rather than a second selection over it.
 *
 * The order has three steps. Open actions lead, in the order of the plan,
 * because the first of them is the one to do next and it must be the first
 * line. Closed ones follow, from the most recent event to the oldest. A closed
 * action with no event goes to the END of that block, keeping among its peers
 * the order of the file, and its line goes on declaring that the moment was not
 * recorded rather than showing a blank (RN-10).
 *
 * Ties matter more than they look. Actions of one feature are closed in a batch
 * and stamped in the same minute — dozens of them in the trail of feature 006
 * carry the identical instant. The sort of the language has been required to be
 * stable since 2019, so equal elements keep the order they came in, which here
 * is the order of the file; without that the list would reshuffle between two
 * identical readings, and an intermittent defect is the worst kind.
 *
 * Revealing the rest is state of the component, and not a stored preference:
 * the same decision feature 003 took for the list of anomalies (D-17).
 *
 * SHARED PRESENTATION, since feature 014. This module used to serve the panel
 * alone; it now serves TWO surfaces -- the webview and the terminal tool of
 * `src/cli/` -- and it did not move for that. Moving the folder would have
 * touched every component, every suite and every delivered addendum without
 * changing one line of behaviour (D-14), so the change of status is declared
 * here and pinned by a suite: `tests/cli-boundaries.spec.ts` forbids a new
 * presentation rule from being born in `src/cli/quadro/`, and
 * `tests/cli-paridade.spec.tsx` compares what the two surfaces affirm over the
 * same payload. Drawing is what differs between them; deciding is not.
 * @module webview/domain/decomposition-view
 */

import type { ProgressTrail } from '../../heranca/reversa-domain/src/index.ts'
import type { ActiveDecomposition, PlanAction } from '../../domain/types.ts'

/** How many closed actions the default cut keeps (RF-11). */
export const CLOSED_CUT = 5

/** One line of the decomposition, ready to draw. */
export interface DecompositionRow {
  acao: PlanAction
  /** The last instant the trail recorded for it, absolute; null when none. */
  ultimoEvento: string | null
  /** The files that last event touched (RF-08). */
  arquivos: string[]
  /** True on the first open action, which is the one to do next (RF-07). */
  proxima: boolean
}

/** The decomposition as the card draws it, already in the order it is drawn. */
export interface DecompositionView {
  linhas: DecompositionRow[]
  /** How many actions the list has, whatever the cut shows. */
  total: number
  /** How many the cut left out; zero once the rest is revealed. */
  ocultas: number
  /** The identifier of the next action, or null when none is open. */
  proxima: string | null
}

/** What the trail knows about one action. */
interface Trace {
  ts: string | null
  files: string[]
}

/**
 * Cut the decomposition down to what the card shows, in the order it shows it.
 * @param decomposition - the actions, in the order of the file.
 * @param trail - the execution trail of the active feature.
 * @param revealAll - true once the reader asked for the rest.
 * @returns the lines to draw, in order, and the counts that go beside them.
 */
export function decompositionView(
  decomposition: ActiveDecomposition,
  trail: ProgressTrail,
  revealAll: boolean,
): DecompositionView {
  const traces = tracesOf(trail)
  const acoes = decomposition.acoes

  const next = acoes.find((acao) => !acao.fechada) ?? null
  const rows: DecompositionRow[] = acoes.map((acao) => {
    const trace = traces.get(acao.id)
    return {
      acao,
      ultimoEvento: trace?.ts ?? null,
      arquivos: trace?.files ?? [],
      proxima: next !== null && acao === next,
    }
  })

  // The two blocks, each in its own order. `filter` preserves the order of the
  // file, which is what the second block falls back on and what the first one
  // is entirely made of.
  const abertas = rows.filter((row) => !row.acao.fechada)
  const fechadas = byRecency(rows.filter((row) => row.acao.fechada))

  const kept = revealAll ? [...abertas, ...fechadas] : [...abertas, ...fechadas.slice(0, CLOSED_CUT)]

  return {
    linhas: kept,
    total: rows.length,
    ocultas: rows.length - kept.length,
    proxima: next === null ? null : next.id,
  }
}

/**
 * The closed actions, most recent first, the undated ones last.
 *
 * The split into two lists is what puts the undated at the end without
 * inventing an instant for them, and the sort runs only over the ones that have
 * something to compare. Its comparator returns zero on equal instants ON
 * PURPOSE: the stability of the sort is what then preserves the order of the
 * file, and any artificial tiebreak here would be a second, silent order.
 * @param closed - the closed lines, in the order of the file.
 * @returns the same lines, ordered.
 */
function byRecency(closed: readonly DecompositionRow[]): DecompositionRow[] {
  const dated = closed.filter((row) => row.ultimoEvento !== null)
  const undated = closed.filter((row) => row.ultimoEvento === null)

  const ordered = [...dated].sort((a, b) => {
    const left = a.ultimoEvento as string
    const right = b.ultimoEvento as string
    if (left === right) return 0
    return left < right ? 1 : -1
  })

  return [...ordered, ...undated]
}

/**
 * What the trail recorded for each action, reduced once.
 * @param trail - the trail as the inherited reader produced it.
 * @returns the last instant and files of each action, by identifier.
 */
function tracesOf(trail: ProgressTrail): ReadonlyMap<string, Trace> {
  const traces = new Map<string, Trace>()

  for (const progress of trail.byAction) {
    let latest: string | null = null
    for (const event of progress.events) {
      if (event.ts === null) continue
      if (latest === null || event.ts > latest) latest = event.ts
    }
    traces.set(progress.action, { ts: latest, files: progress.files })
  }
  return traces
}
