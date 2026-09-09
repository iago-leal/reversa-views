/**
 * The header: where the panel says what it read, when, and from where
 * (RF-02, RF-15, RN-06).
 *
 * Every text arrives ready from `domain/`. The header formats no stage and no
 * phase of its own, and decides no colour: what it does is place six items,
 * the declaration of how the reading came through, and the named, empty place
 * the dispatch of RF-15 will one day occupy.
 *
 * The declaration of integrity is the one item that can be absent, and its
 * absence is the point: with no reading behind it, `degraded` is false for
 * want of anything counted, and a header that drew it anyway would announce a
 * whole reading over the screen that says the reading failed.
 * @module webview/ui/Header
 */

import { useState } from 'react'
import type { ReactNode } from 'react'
import { brasiliaInstant } from '../domain/instants.ts'
import { revisionLabel } from '../domain/labels.ts'
import type { EffectiveEntry, ReadingIntegrity } from '../domain/types.ts'

/** What the header draws. */
export interface HeaderProps {
  entry: EffectiveEntry
  integrity: ReadingIntegrity
  onReload: () => void
  /** How many cards are collapsed right now, and how many there are (RF-04). */
  collapsedCount: number
  collapsibleCount: number
  onExpandAll: () => void
  onCollapseAll: () => void
  /** Open the summary as an unsaved document (RF-12). */
  onSummary: () => void
  /** Put the same summary on the clipboard (RF-17). */
  onCopy: () => void
}

/** One action of the header, disabled when it would have no effect (RF-04). */
function Action(props: {
  name: string
  label: string
  disabled: boolean
  onClick: () => void
}): ReactNode {
  return (
    <button
      type="button"
      className="button"
      data-action={props.name}
      data-disabled={String(props.disabled)}
      disabled={props.disabled}
      onClick={props.onClick}
    >
      {props.label}
    </button>
  )
}

/** What an item says when the reading has no value for it. */
const ABSENT = 'não declarado'

/**
 * One item of the header, never left blank.
 * @param props - the name of the item and its value.
 * @returns the item element.
 */
function Item(props: {
  name: string
  label: string
  value: string | null
  /** The absolute instant behind the text, when the item shows one (RF-16). */
  instant?: string
}): ReactNode {
  return (
    <span className="header__item">
      {props.label}:{' '}
      <span
        data-item={props.name}
        data-instant={props.instant === undefined || props.instant === '' ? undefined : props.instant}
      >
        {props.value === null || props.value === '' ? ABSENT : props.value}
      </span>
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

  // The confirmation of the copy is state of the moment, and it lives here
  // rather than upstream for the same reason the anomaly cut does: it is a
  // gesture, not a preference, and it says nothing to the host: RF-17 asks the
  // panel to confirm the copy without opening a document, and a dialog would
  // be the interruption the panel does not do.
  const [copied, setCopied] = useState(false)

  // RF-15: o momento da leitura sai daqui já no fuso de Brasília, e o valor
  // absoluto fica no atributo consultável, como RF-16 exige.
  const readAt = brasiliaInstant(payload?.readAt ?? null)

  const nothingRead = payload === null
  const allExpanded = props.collapsedCount === 0
  const allCollapsed = props.collapsedCount >= props.collapsibleCount

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
      <Item
        name="read-at"
        label="Lido em"
        value={payload === null ? null : readAt.text}
        instant={readAt.raw}
      />
      {payload === null ? null : (
        <p
          data-item="integrity"
          data-degraded={String(integrity.degraded)}
          className="header__integrity"
        >
          {integrity.degraded
            ? `Leitura degradada: ${integrity.anomalies} anomalias, ${integrity.refusals} recusas, ${integrity.truncated} truncamentos.`
            : 'Leitura íntegra.'}
        </p>
      )}
      <p className="header__actions">
        <button type="button" className="button" data-action="reload" onClick={onReload}>
          {entry.rereading ? 'Relendo…' : 'Reler o processo'}
        </button>
        <Action
          name="expand-all"
          label="Expandir tudo"
          disabled={allExpanded}
          onClick={props.onExpandAll}
        />
        <Action
          name="collapse-all"
          label="Recolher tudo"
          disabled={allCollapsed}
          onClick={props.onCollapseAll}
        />
        <Action
          name="summary"
          label="Resumir em documento"
          disabled={nothingRead}
          onClick={props.onSummary}
        />
        <Action
          name="copy-summary"
          label="Copiar o resumo"
          disabled={nothingRead}
          onClick={() => {
            setCopied(true)
            props.onCopy()
          }}
        />
      </p>
      {copied ? (
        <p data-part="copy-confirmation" className="header__confirmation">
          Resumo copiado para a área de transferência.
        </p>
      ) : null}
      <div data-slot="dispatch" className="header__dispatch"></div>
    </header>
  )
}
