/**
 * The header: where the panel says what it read, when, and from where
 * (RF-02, RF-15, RN-06).
 *
 * Every text arrives ready from `domain/`. The header formats no stage and no
 * phase of its own, and decides no colour: what it does is place six items,
 * the declaration of how the reading came through, and the named, empty place
 * the dispatch of RF-15 will one day occupy.
 * @module webview/ui/Header
 */

import type { ReactNode } from 'react'
import { revisionLabel } from '../domain/labels.ts'
import type { EffectiveEntry, ReadingIntegrity } from '../domain/types.ts'

/** What the header draws. */
export interface HeaderProps {
  entry: EffectiveEntry
  integrity: ReadingIntegrity
  onReload: () => void
}

/** What an item says when the reading has no value for it. */
const ABSENT = 'não declarado'

/**
 * One item of the header, never left blank.
 * @param props - the name of the item and its value.
 * @returns the item element.
 */
function Item(props: { name: string; label: string; value: string | null }): ReactNode {
  return (
    <span className="header__item">
      {props.label}:{' '}
      <span data-item={props.name}>{props.value === null || props.value === '' ? ABSENT : props.value}</span>
    </span>
  )
}

/**
 * The header of the panel.
 * @param props - the entry state, the integrity of the reading and the reload port.
 * @returns the header element.
 */
export function Header(props: HeaderProps): ReactNode {
  const { entry, integrity, onReload } = props
  const payload = entry.loaded
  const discovery = payload?.process.discovery ?? null

  return (
    <header className="header">
      <h1 className="header__title">Reversa</h1>
      <Item name="project" label="Projeto" value={discovery?.project ?? null} />
      <Item name="version" label="Reversa" value={discovery?.version ?? null} />
      <Item
        name="revision"
        label="Modelo herdado"
        value={revisionLabel(payload?.inheritedRevision)}
      />
      <Item name="root" label="Raiz observada" value={entry.root} />
      <Item name="read-at" label="Lido em" value={payload?.readAt ?? null} />
      <p
        data-item="integrity"
        data-degraded={String(integrity.degraded)}
        className="header__integrity"
      >
        {integrity.degraded
          ? `Leitura degradada: ${integrity.anomalies} anomalias, ${integrity.refusals} recusas, ${integrity.truncated} truncamentos.`
          : 'Leitura íntegra.'}
      </p>
      <p>
        <button type="button" className="button" data-action="reload" onClick={onReload}>
          {entry.rereading ? 'Relendo…' : 'Reler o processo'}
        </button>
      </p>
      <div data-slot="dispatch" className="header__dispatch"></div>
    </header>
  )
}
