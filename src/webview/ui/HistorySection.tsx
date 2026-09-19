/**
 * The history of the project: one line per feature folder, newest first
 * (RF-09, RF-10, RF-13, RF-14, RN-06).
 *
 * It covers EVERY folder, converged or not. A feature without an addendum is
 * information to show, never a reason to leave it out, and a paused one is
 * named as such rather than hidden.
 *
 * Situation and mark are drawn as two things, because they are two: the first
 * comes from the artifacts of the folder, the second from the pointer REVERSA
 * keeps. Both arrive as text from `domain/labels.ts`, and neither is a colour.
 *
 * The addendum is the one clickable artifact of the line, and it asks the host
 * to open it by the same message the rest of the panel uses (RF-10). The
 * folder is not clickable: it is a directory, and the editor opens documents.
 *
 * The bar of feature 007 measures converged features over the DECLARED total,
 * and not over the entries the ceiling left in view (RF-29, RN-08): a truncated
 * reading counts what it read against how many folders exist, and the notice
 * of truncation says why the two differ. The sentence that counts them is
 * added beside the bar, because RN-10 forbids the bar from being the only
 * carrier of the number.
 *
 * Feature 010 puts the conferences BESIDE the situation, and beside is the
 * word (RN-07): "N de M conferências registradas" never changes the situation,
 * and is a count in text, clickable to the `onboarding.md`, never a bar. Every
 * other state of the register is named by a sentence, and an older host that
 * sent nothing is "conferências não lidas", never a blank.
 * @module webview/ui/HistorySection
 */

import type { ReactNode } from 'react'
import type { ConferenceRecord, DeliveryLinkState, HistoryEntry, ProjectHistory } from '../../domain/types.ts'
import { brasiliaInstant } from '../domain/instants.ts'
import { conferenceStateLabel, markLabel, situationLabel } from '../domain/labels.ts'
import { CollapsibleSection } from './CollapsibleSection.tsx'
import { OpenFile } from './OpenFile.tsx'
import { ProgressBar } from './ProgressBar.tsx'

/** What the section draws. */
export interface HistorySectionProps {
  /** Absent when the host is older than the field (contract, section 6). */
  history: ProjectHistory | undefined
  collapsed: boolean
  onToggle: () => void
  onOpenFile: (path: string) => void
}

/**
 * The conferences of one delivery, beside its situation (RF-07, RN-06).
 * @param props - the register, absent for an older host, and the open port.
 * @returns the inline element.
 */
function Conferences(props: { c: ConferenceRecord | undefined; onOpenFile: (path: string) => void }): ReactNode {
  const { c, onOpenFile } = props
  if (c === undefined) {
    return (
      <span data-part="feature-conferences" data-state="nao-lidas" className="muted">
        conferências não lidas
      </span>
    )
  }

  const counted = c.estado === 'lido' || c.estado === 'truncado'
  const label = conferenceStateLabel(c.estado)
  const text = counted
    ? `${c.registradas} de ${c.total} conferências registradas${c.estado === 'truncado' ? `, lista cortada no teto de ${c.linhas.length} linhas` : ''}`
    : label.known
      ? label.text
      : `${label.raw} (não reconhecido)`

  return (
    <span data-part="feature-conferences" data-state={c.estado} className="conferences">
      {counted && c.arquivo !== null ? <OpenFile path={c.arquivo} onOpenFile={onOpenFile}>{text}</OpenFile> : text}
    </span>
  )
}

/**
 * What the link of the delivery says when it says something worth a line: a
 * file without any impact table, or one present and not read. Absent, read
 * with tables, or an older host: nothing, because nothing is wrong.
 */
function LinkNote(props: { v: DeliveryLinkState | undefined }): ReactNode {
  const { v } = props
  if (v === undefined) return null
  if (v.estado === 'nao-lido') {
    return (
      <div data-part="feature-link" data-state="nao-lido" className="notice">
        vínculo declarado não lido: o legacy-impact.md está acima do teto de bytes
      </div>
    )
  }
  if (v.estado === 'lido' && v.tabelas === 0) {
    return (
      <div data-part="feature-link" data-state="sem-tabela" className="muted">
        nenhuma tabela de impacto reconhecida no legacy-impact.md
      </div>
    )
  }
  return null
}

/**
 * One feature of the history.
 * @param props - the entry and the port that asks for a file.
 * @returns the list item.
 */
function Entry(props: { entry: HistoryEntry; onOpenFile: (path: string) => void }): ReactNode {
  const { entry, onOpenFile } = props
  const mark = markLabel(entry.marca)
  const instant = brasiliaInstant(entry.ultimoEvento)
  const name = entry.id === null ? entry.pasta : `${entry.id}-${entry.nomeCurto ?? ''}`

  return (
    <li data-feature={entry.pasta} data-situation={entry.situacao} data-mark={entry.marca}>
      <span data-part="feature-name">{name}</span>{' '}
      <span data-part="feature-situation" className="status">
        {situationLabel(entry.situacao).text}
      </span>
      {mark.text === '' ? null : (
        <>
          {' '}
          <span data-part="feature-mark" className="status">
            {mark.text}
          </span>
        </>
      )}{' '}
      <Conferences c={entry.conferencias} onOpenFile={onOpenFile} />
      <div data-part="feature-actions" className="muted">
        {entry.situacao === 'acoes-nao-lidas' ? (
          // The tally is zero because nothing was read, not because nothing
          // was done (bug nº 11): the line says which, instead of "0 de 0".
          'ações não lidas: actions.md acima do teto de bytes ou ilegível'
        ) : (
          <>
            {entry.acoes.fechadas} de {entry.acoes.total} ações fechadas
          </>
        )}
      </div>
      <LinkNote v={entry.vinculo} />
      <div data-part="feature-summary">{entry.resumo ?? 'sem resumo registrado'}</div>
      <div
        data-part="feature-instant"
        data-instant={instant.raw === '' ? undefined : instant.raw}
        className="muted"
      >
        {instant.text}
      </div>
      {entry.adendo === null ? (
        <div data-part="feature-addendum" className="muted">
          sem adendo vigente
        </div>
      ) : (
        <div data-part="feature-addendum">
          <button
            type="button"
            className="link"
            data-action="open-file"
            data-path={entry.adendo}
            onClick={() => onOpenFile(entry.adendo as string)}
          >
            {entry.adendo}
          </button>
        </div>
      )}
    </li>
  )
}

/**
 * How many of the entries read have converged.
 *
 * It counts what was READ, which under the ceiling is fewer than what exists;
 * the denominator is what exists. A bar that measured over the entries in view
 * would draw a truncated reading as fuller than the project is.
 * @param history - the history as the host sent it.
 * @returns the number of converged features among the entries.
 */
function converged(history: ProjectHistory): number {
  return history.entradas.filter((entry) => entry.situacao === 'convergida').length
}

/**
 * The history section.
 * @param props - the history, the collapse state, the toggle and the open port.
 * @returns the section element.
 */
export function HistorySection(props: HistorySectionProps): ReactNode {
  const { history, onOpenFile } = props
  const convergidas = history === undefined ? 0 : converged(history)

  return (
    <CollapsibleSection
      name="history"
      title="Histórico das entregas"
      count={history?.total ?? 0}
      collapsed={props.collapsed}
      onToggle={props.onToggle}
    >
      {history === undefined ? (
        <p data-part="history-unread" className="empty">
          A cronologia não foi lida por esta leitura do processo.
        </p>
      ) : history.entradas.length === 0 ? (
        <p data-part="history-none" className="empty">
          Não há pasta de feature alguma no ciclo forward deste projeto.
        </p>
      ) : (
        <>
          <p data-part="history-counts">
            {convergidas} de {history.total} features convergidas.
          </p>
          <ProgressBar
            feitos={convergidas}
            total={history.total}
            rotulo={`${convergidas} de ${history.total} features convergidas`}
          />
          <ul className="rows">
            {history.entradas.map((entry) => (
              <Entry entry={entry} onOpenFile={onOpenFile} key={entry.pasta} />
            ))}
          </ul>
          {history.truncado ? (
            <p data-part="history-truncated" className="notice">
              A leitura parou no teto de pastas: o projeto tem {history.total} pastas de feature, e
              nem todas foram percorridas.
            </p>
          ) : null}
        </>
      )}
    </CollapsibleSection>
  )
}
