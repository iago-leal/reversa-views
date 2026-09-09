/**
 * The cut of the decomposition for the screen (RF-07, RF-08, RF-11, RN-10,
 * D-13, D-17).
 *
 * A feature of sixty-one actions does not fit a sidebar, and a list that has
 * to be scrolled to find where the work stopped answers no question. So the
 * default cut is every OPEN action plus the five most recently closed, with
 * the total always in sight and a control that reveals the rest.
 *
 * Recency comes from the trail: the last event of that action. An action with
 * no event is placed by its position in the file, behind the ones that have
 * one, and its line declares that the moment was not recorded rather than
 * showing a blank (RN-10). Which is a declared choice and not a claim about
 * the framework: REVERSA appends to the trail and never rewrites it, but it
 * does not promise an event for every action.
 *
 * Revealing the rest is state of the component, and not a stored preference:
 * the same decision feature 003 took for the list of anomalies (D-17).
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

/** The decomposition as the card draws it. */
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
 * Cut the decomposition down to what the card shows.
 * @param decomposition - the actions, in the order of the file.
 * @param trail - the execution trail of the active feature.
 * @param revealAll - true once the reader asked for the rest.
 * @returns the lines to draw, and the counts that go beside them.
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

  const keep = revealAll ? null : recent(rows)
  const kept =
    keep === null ? rows : rows.filter((row, index) => !row.acao.fechada || keep.has(index))

  return {
    linhas: kept,
    total: rows.length,
    ocultas: rows.length - kept.length,
    proxima: next === null ? null : next.id,
  }
}

/**
 * The indexes of the five most recently closed actions.
 *
 * Recency is the instant of the last event; where there is none, the position
 * in the file, which is why the ones without an event sort behind the ones
 * with. The set is what the default cut keeps beside every open action.
 * @param rows - every line, in the order of the file.
 * @returns the indexes to keep.
 */
function recent(rows: readonly DecompositionRow[]): ReadonlySet<number> {
  const closed = rows
    .map((row, index) => ({ row, index }))
    .filter((entry) => entry.row.acao.fechada)

  closed.sort((a, b) => {
    const left = a.row.ultimoEvento
    const right = b.row.ultimoEvento
    if (left !== null && right !== null) return left < right ? 1 : left > right ? -1 : b.index - a.index
    if (left !== null) return -1
    if (right !== null) return 1
    return b.index - a.index
  })

  return new Set(closed.slice(0, CLOSED_CUT).map((entry) => entry.index))
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
