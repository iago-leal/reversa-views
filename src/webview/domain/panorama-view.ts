/**
 * The one function that decides the order, the grouping and the checked count
 * of the panorama (RF-12, RN-07, D-15).
 *
 * One function decides the three things, and it is the remedy of D-14 of
 * feature 007 applied before the defect is born: selecting in one place and
 * drawing in another is how the right list appears in the wrong order. The
 * component calls this and draws what it gets.
 *
 * The count is CHECKED, not chosen: the reading counts the converged specs,
 * the list drawn here has its own number of them, and when the two disagree
 * the disagreement is declared beside the count instead of one number
 * silently replacing the other.
 * @module webview/domain/panorama-view
 */

import type {
  ComponentSituation,
  PlannedComponent,
  ProductPanorama,
  UnspecifiedComponent,
} from '../../domain/types.ts'

/** One group of the card: a situation and the components in it, ordered. */
export interface PanoramaGroup {
  situacao: ComponentSituation
  componentes: PlannedComponent[]
}

/** What the card draws. */
export interface PanoramaView {
  /** The groups with at least one component, in the declared order. */
  grupos: PanoramaGroup[]
  /** The count the reading made, which is the authority. */
  convergidos: number
  /** How many specs exist on disk, which is the denominator even past the ceiling. */
  total: number
  truncado: boolean
  /** The two numbers, when the count and the list disagree; null when they agree. */
  divergencia: { contados: number; listados: number } | null
  /**
   * The components delivered without a spec, by name (feature 010, D-16).
   * NULL when the host did not send the field, which the card names by a
   * sentence; an empty list is a reading that found none.
   */
  semSpec: UnspecifiedComponent[] | null
  /** True when some `legacy-impact.md` was present and not read; false when the field is absent. */
  vinculoParcial: boolean
}

/**
 * The order of the groups: what is being worked on, then what is still to
 * do, then what was delivered, then what already converged (RF-12). The
 * reader looks for the next thing, and the next thing is at the top.
 */
const GROUP_ORDER: readonly ComponentSituation[] = [
  'em-andamento',
  'planejada',
  'entregue',
  'convergida',
]

/** Within a group: the active feature first, then by name. */
function compare(a: PlannedComponent, b: PlannedComponent): number {
  const activeA = a.marca === 'ativa' ? 0 : 1
  const activeB = b.marca === 'ativa' ? 0 : 1
  if (activeA !== activeB) return activeA - activeB
  return a.nome < b.nome ? -1 : a.nome > b.nome ? 1 : 0
}

/**
 * Decide what the panorama card draws.
 * @param panorama - the panorama as the reading produced it; not mutated.
 * @returns the groups, the counts and the checked disagreement.
 */
export function panoramaView(panorama: ProductPanorama): PanoramaView {
  // One pass, grouped by situation; the declared order first, and any
  // situation this version does not know after them, raw, so nothing is lost.
  const byStatus = new Map<string, PlannedComponent[]>()
  for (const c of panorama.componentes)
    byStatus.set(c.situacao, [...(byStatus.get(c.situacao) ?? []), c])
  const order = [
    ...GROUP_ORDER,
    ...[...byStatus.keys()].filter((s) => !(GROUP_ORDER as readonly string[]).includes(s)),
  ]
  const grupos: PanoramaGroup[] = []
  for (const situacao of order) {
    const componentes = byStatus.get(situacao)
    if (componentes !== undefined)
      grupos.push({
        situacao: situacao as ComponentSituation,
        componentes: componentes.sort(compare),
      })
  }

  // The components without a spec are ordered in the same pass, by name only:
  // they have no group, and the order is decided here and nowhere else (D-16).
  const semSpec =
    panorama.semSpec === undefined
      ? null
      : [...panorama.semSpec].sort((a, b) => (a.nome < b.nome ? -1 : a.nome > b.nome ? 1 : 0))

  const listados = byStatus.get('convergida')?.length ?? 0
  return {
    grupos,
    convergidos: panorama.convergidos,
    total: panorama.totalDeSpecs,
    truncado: panorama.truncado,
    divergencia:
      listados === panorama.convergidos ? null : { contados: panorama.convergidos, listados },
    semSpec,
    vinculoParcial: panorama.vinculoParcial === true,
  }
}
