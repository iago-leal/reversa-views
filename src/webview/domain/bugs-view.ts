/**
 * The cut of the bug registry for the screen: order, slice and highlight, in one
 * pass (RN-07, RN-10, RF-06, RF-07, RF-08, D-06, D-07).
 *
 * ONE FUNCTION DECIDES ALL THREE, and that is the remedy of D-14 of feature 007
 * applied before the defect is born. That feature found the decomposition card
 * SELECTING by recency and RETURNING in the order of the file: the two orders
 * were computed in the same place, disagreed anyway, and the card showed the
 * right actions in the wrong order. Here the cut is a PREFIX of the ordered
 * list, never a second selection over it.
 *
 * THE ORDER HAS TWO LEVELS. Between groups, the context that moved most
 * recently comes first, and a group with no movement at all goes last. Within a
 * group, the bugs that are not closed lead, from the most recently touched to
 * the oldest; the closed ones follow in the same order of recency; and a record
 * with no date goes to the END OF THE HALF it belongs to, keeping among its
 * peers the order it was read in.
 *
 * TIES MATTER MORE THAN THEY LOOK. The dates of the registry have the
 * granularity of a DAY, so two bugs touched on the same day is the common case
 * rather than the exceptional one. The sort of the language has been required to
 * be stable since 2019, and the comparator returns zero on equal dates ON
 * PURPOSE: that is what makes the order of reading survive. Without it the list
 * would reshuffle between two identical readings, and an intermittent defect is
 * the worst kind.
 *
 * REVEALING the rest of a group is state of the component, per group, and not a
 * stored preference (D-07): the same decision feature 003 took for the list of
 * anomalies. What one expands to look at now is not a choice that should outlive
 * the panel.
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
 * @module webview/domain/bugs-view
 */

import type { BugCounts, BugEntry, BugRegistry } from '../../domain/types.ts'

/** How many closed bugs the default cut keeps, per group (RF-08). */
export const BUGS_CLOSED_CUT = 5

/** One line of the block, ready to draw. */
export interface BugRow {
  bug: BugEntry
  /** True on the single bug to treat next in the WHOLE block (RN-10). */
  proximo: boolean
}

/** One group of the block, already ordered and already cut. */
export interface BugGroupView {
  contexto: string
  /** Path of the context, relative to the observed root. */
  pasta: string
  /** The tally of THIS context, carried through untouched (RN-09, D-15). */
  contagem: BugCounts
  /** The most recent movement of the group, which is what ordered it. */
  ultimoMovimento: string | null
  linhas: BugRow[]
  /** How many bugs the group holds, whatever the cut shows. */
  total: number
  /** How many the cut left out; zero once the group is revealed. */
  ocultas: number
}

/** The block as the card draws it, already in the order it draws it. */
export interface BugsView {
  grupos: BugGroupView[]
  /** The next bug to treat, by identifier or by folder; null when none awaits. */
  proximo: string | null
}

/**
 * Order, cut and highlight the registry in one pass.
 * @param registry - the registry as the host sent it.
 * @param revealed - the contexts whose rest the reader asked to see.
 * @returns the groups to draw, in order, and the single next bug.
 */
export function bugsView(registry: BugRegistry, revealed: ReadonlySet<string>): BugsView {
  // The first not-closed bug in the order of the BLOCK, which is what carries
  // the mark. RN-10 writes it as "the first not closed of the first group", and
  // the two readings agree whenever the first group has one. They part when it
  // does not: the order between groups is by most recent movement, which a
  // CLOSED bug also produces, so a group can lead with nothing awaiting anyone.
  // Reading the rule literally would then leave the block with no mark while a
  // bug waits, which is the opposite of what RF-06 asks. So the mark is the
  // first not-closed bug the reader meets going down the block.
  const ordenados = ordered(registry)
  const proximo = ordenados.flatMap((grupo) => grupo.bugs).find((bug) => !bug.travado) ?? null

  const grupos = ordenados.map((grupo) => {
    const abertos = grupo.bugs.filter((bug) => !bug.travado)
    const fechados = grupo.bugs.filter((bug) => bug.travado)
    const mostrados = revealed.has(grupo.contexto)
      ? [...abertos, ...fechados]
      : [...abertos, ...fechados.slice(0, BUGS_CLOSED_CUT)]

    return {
      contexto: grupo.contexto,
      pasta: grupo.pasta,
      contagem: grupo.contagem,
      ultimoMovimento: grupo.ultimoMovimento,
      linhas: mostrados.map((bug) => ({ bug, proximo: bug === proximo })),
      total: grupo.bugs.length,
      ocultas: grupo.bugs.length - mostrados.length,
    }
  })

  return { grupos, proximo: proximo === null ? null : nameOf(proximo) }
}

/** One group with its bugs already in the order of RN-07. */
interface Ordered {
  contexto: string
  pasta: string
  contagem: BugCounts
  ultimoMovimento: string | null
  bugs: BugEntry[]
}

/**
 * The groups ordered by movement, each with its bugs ordered by RN-07.
 *
 * Nothing the caller handed over is mutated: both sorts run over copies, so a
 * second reading of the same payload sees the list it sent.
 * @param registry - the registry as the host sent it.
 * @returns the groups, in the order the block draws them.
 */
function ordered(registry: BugRegistry): Ordered[] {
  const grupos = registry.contextos.map((contexto) => ({
    contexto: contexto.contexto,
    pasta: contexto.pasta,
    contagem: contexto.contagem,
    ultimoMovimento: contexto.ultimoMovimento,
    bugs: [...byRecency(contexto.bugs.filter((bug) => !bug.travado)),
      ...byRecency(contexto.bugs.filter((bug) => bug.travado))],
  }))

  // The undated groups are split off rather than sorted with a stand-in date:
  // any value invented for them would be a second, silent order.
  const comData = grupos.filter((grupo) => grupo.ultimoMovimento !== null)
  const semData = grupos.filter((grupo) => grupo.ultimoMovimento === null)

  const ordenados = [...comData].sort((a, b) => {
    const esquerda = a.ultimoMovimento as string
    const direita = b.ultimoMovimento as string
    if (esquerda === direita) return 0
    return esquerda < direita ? 1 : -1
  })

  return [...ordenados, ...semData]
}

/**
 * One half of a group, most recently touched first, the undated ones last.
 *
 * The split into two lists is what puts the undated at the end without inventing
 * a date for them, and the sort runs only over the ones that have something to
 * compare. Its comparator returns zero on equal dates ON PURPOSE: the stability
 * of the sort is what then preserves the order of reading, and any artificial
 * tiebreak here would be a second, silent order.
 * @param bugs - the bugs of one half, in the order they were read.
 * @returns the same bugs, ordered.
 */
function byRecency(bugs: readonly BugEntry[]): BugEntry[] {
  const comData = bugs.filter((bug) => bug.alterado !== null)
  const semData = bugs.filter((bug) => bug.alterado === null)

  const ordenados = [...comData].sort((a, b) => {
    const esquerda = a.alterado as string
    const direita = b.alterado as string
    if (esquerda === direita) return 0
    return esquerda < direita ? 1 : -1
  })

  return [...ordenados, ...semData]
}

/**
 * How to name one bug when there is a bug to name.
 *
 * The identifier when it has one, and the folder when it does not: a bug whose
 * front matter lost its `id` is still a row on the screen, and still the one to
 * treat next if it is the first not closed. Naming it by the folder is what the
 * card already does with its line.
 * @param bug - the bug to name.
 * @returns the identifier, or the folder.
 */
function nameOf(bug: BugEntry): string {
  return bug.id ?? bug.pasta
}
