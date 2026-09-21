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
 *
 * Feature 007 adds the provenance of this build and the outcome of the origin
 * query. Both follow the rules already in force: the sentence of the outcome is
 * decided in `domain/labels.ts` and only placed here, and the commit is
 * shortened by the same function that already shortens the inherited revision,
 * with the whole value kept in an attribute (RF-17, D-18). The outcome is a
 * LINE, never a dialog and never a notification: RN-09 forbids the panel from
 * interrupting whoever is reading.
 * @module webview/ui/Header
 */

import { useState } from 'react'
import type { ReactNode } from 'react'
import type { UpdateStatus } from '../../host/protocol.ts'
import { brasiliaInstant } from '../domain/instants.ts'
import { revisionLabel, updateLabel } from '../domain/labels.ts'
import type { EffectiveEntry, ReadingIntegrity } from '../domain/types.ts'

/** What the header draws. */
export interface HeaderProps {
  entry: EffectiveEntry
  integrity: ReadingIntegrity
  /** What the origin said about this build; null draws no line at all (RF-10). */
  update: UpdateStatus | null
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
  /**
   * Why the correction prompt is unavailable, in words; null means it is
   * available (feature 013, RF-19).
   *
   * The reason is TEXT and not only a grey button, and this is the whole of the
   * requirement: a disabled button says nothing at all to a reader who does not
   * see colour, and says nothing about WHY to one who does. The three reasons
   * the availability distinguishes -- nothing read, no axis in the payload, no
   * case in the reading -- are three different facts, and one of them must not
   * be allowed to read as "this project is fine".
   */
  promptReason?: string | null
  /** Open the correction prompt as an unsaved document (feature 013, RF-22). */
  onPromptDraft?: () => void
  /** Put the same prompt on the clipboard (feature 013, RF-22). */
  onCopyPrompt?: () => void
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
  /**
   * The whole value behind a shortened one, when the item shortens (D-18).
   *
   * Shortening at the source would destroy what RF-17 asks to be consultable,
   * so the abbreviation is what the reader sees and the attribute is what a
   * comparison against a commit list actually needs.
   */
  full?: string
}): ReactNode {
  return (
    <span className="header__item">
      {props.label}:{' '}
      <span
        data-item={props.name}
        data-instant={props.instant === undefined || props.instant === '' ? undefined : props.instant}
        data-full={props.full === undefined || props.full === '' ? undefined : props.full}
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
  const { entry, integrity, update, onReload } = props
  const payload = entry.loaded
  const discovery = payload?.process.discovery ?? null

  // The confirmation of the copy is state of the moment, and it lives here
  // rather than upstream for the same reason the anomaly cut does: it is a
  // gesture, not a preference, and it says nothing to the host: RF-17 asks the
  // panel to confirm the copy without opening a document, and a dialog would
  // be the interruption the panel does not do.
  // WHAT was copied, and not merely that something was. With two copy actions
  // in the same header, a single boolean would say "resumo copiado" after a
  // click on the prompt, which is a false statement about the clipboard of the
  // person reading.
  const [copied, setCopied] = useState<'resumo' | 'prompt' | null>(null)

  // RF-15: o momento da leitura sai daqui já no fuso de Brasília, e o valor
  // absoluto fica no atributo consultável, como RF-16 exige.
  const readAt = brasiliaInstant(payload?.readAt ?? null)

  // RF-10: the sentence is decided in the domain, and this component places
  // it. A header that chose its own words for an outcome would be a second
  // authority over the same fact. Undefined is read as null on purpose: a
  // caller assembled before this feature hands over no outcome, and RN-05 says
  // that draws no line rather than breaking the render.
  // A raiz carimbada viaja junto com o desfecho porque o comando a copiar
  // depende dela: a faixa precisa dizer de onde o ritual se chama, e não só
  // qual ele é (BUG-20260911-FI3O). Ausente, o rótulo recua sozinho.
  const outcome =
    update === null || update === undefined
      ? null
      : updateLabel(update, payload?.builtFromRoot ?? null)

  const nothingRead = payload === null

  // Feature 013: the reason decides the two actions of the prompt, and the port
  // being absent disables them too. A button that looks available and does
  // nothing is worse than one that says why it cannot.
  const promptReason = props.promptReason ?? null
  const noPrompt = promptReason !== null
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
      <Item
        name="extension-version"
        label="Extensão"
        value={payload?.extensionVersion ?? null}
      />
      <Item
        name="built-from"
        label="Construída de"
        value={revisionLabel(payload?.builtFromCommit)}
        full={payload?.builtFromCommit}
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
      {outcome === null ? null : (
        <p data-item="update" data-update={update?.estado} className="header__update">
          {outcome.text}
          {outcome.command === null ? null : (
            <>
              {' '}
              <code className="header__command">{outcome.command}</code>
            </>
          )}
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
            setCopied('resumo')
            props.onCopy()
          }}
        />
        <Action
          name="prompt"
          label="Prompt de correção em documento"
          disabled={noPrompt || props.onPromptDraft === undefined}
          onClick={() => props.onPromptDraft?.()}
        />
        <Action
          name="copy-prompt"
          label="Copiar o prompt de correção"
          disabled={noPrompt || props.onCopyPrompt === undefined}
          onClick={() => {
            setCopied('prompt')
            props.onCopyPrompt?.()
          }}
        />
      </p>
      {promptReason === null ? null : (
        <p data-part="prompt-reason" className="header__reason muted">
          {promptReason}
        </p>
      )}
      {copied === null ? null : (
        <p data-part="copy-confirmation" className="header__confirmation">
          {copied === 'resumo'
            ? 'Resumo copiado para a área de transferência.'
            : 'Prompt de correção copiado para a área de transferência.'}
        </p>
      ) }
      <div data-slot="dispatch" className="header__dispatch"></div>
    </header>
  )
}
