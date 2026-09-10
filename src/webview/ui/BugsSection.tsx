/**
 * The bug registry of the project, one line per bug, grouped by context (RF-01
 * to RF-09, RF-13, RF-15, RF-16, RN-09, RN-10).
 *
 * IT DECIDES NOTHING. Order, cut and highlight arrive ready from `bugsView()`,
 * the labels from `domain/labels.ts` and the dates from `domain/instants.ts`.
 * What this component owns is the shape of the markup, which is the verifiable
 * form of RF-14 and what lets the markup suite state facts about a document
 * rather than about pixels.
 *
 * THREE EMPTINESSES ARE NAMED APART, and telling them apart is a requirement
 * rather than a nicety (RF-13). The FIELD ABSENT from the payload means the
 * reading did not happen -- an older host that does not send it, which is a case
 * that really occurred in this project. `presente: false` means the project has
 * no registry folder, which is an absence and not a loss. And a context with no
 * bug in it is a third thing again. "There are no bugs" and "I did not read the
 * bugs" are different statements, and only one of them is a defect.
 *
 * THE ZEROS ARE WRITTEN BY NAME (RF-02). A block that omitted "0 abertos" would
 * leave the reader unable to tell no open bug from no count at all, which is the
 * same confusion the paragraph above exists to undo.
 *
 * THE IDENTIFIER IS THE ONLY THING THAT OPENS A FILE (RF-09), by the message the
 * rest of the panel already uses. Nothing here talks to the editor by any other
 * route, and nothing here runs a command: the band names the command of the
 * registrar, and whoever runs it is the maintainer.
 * @module webview/ui/BugsSection
 */

import type { ReactNode } from 'react'
import type { BugEntry, BugRegistry } from '../../domain/types.ts'
import { bugsView } from '../domain/bugs-view.ts'
import type { BugGroupView, BugRow } from '../domain/bugs-view.ts'
import { readableDate } from '../domain/instants.ts'
import {
  bugPhaseLabel,
  bugPriorityLabel,
  bugSeverityLabel,
  bugStateLabel,
  inconsistencyLabel,
} from '../domain/labels.ts'
import type { Label } from '../domain/types.ts'
import { CollapsibleSection } from './CollapsibleSection.tsx'
import { ProgressBar } from './ProgressBar.tsx'

/** What the section draws. */
export interface BugsSectionProps {
  /** Absent when the host is older than the field (contract, section 5). */
  bugs: BugRegistry | undefined
  collapsed: boolean
  onToggle: () => void
  onOpenFile: (path: string) => void
  /** The contexts whose rest the reader asked to see; state of the panel (D-07). */
  revealed: ReadonlySet<string>
  /** Called when the reader asks for the rest of one group. */
  onReveal: (contexto: string) => void
}

/** A count with its noun in the right number. */
function bugs(count: number): string {
  return count === 1 ? '1 bug' : `${count} bugs`
}

/**
 * The breakdown of one tally, with the zeros spelled out (RF-02).
 * @param props - the tally to say in words.
 * @returns the sentence.
 */
function Counts(props: { contagem: BugRegistry['contagem']; part: string }): ReactNode {
  const { contagem, part } = props
  return (
    <span data-part={part}>
      {bugs(contagem.total)}: {contagem.abertos} abertos, {contagem.ativos} ativos,{' '}
      {contagem.resolvidos} resolvidos.
    </span>
  )
}

/**
 * One value of a closed vocabulary, drawn raw and marked when unrecognised
 * (RF-12).
 * @param props - the part name, the raw value and how to read it.
 * @returns the element, or the declaration of absence.
 */
function Value(props: {
  part: string
  bruto: string | null
  rotular: (valor: string) => Label
  ausente: string
}): ReactNode {
  const { part, bruto, rotular, ausente } = props
  if (bruto === null) {
    return (
      <span data-part={part} className="muted">
        {ausente}
      </span>
    )
  }

  const rotulo = rotular(bruto)
  return (
    <span data-part={part} data-known={String(rotulo.known)} className="status">
      {rotulo.text}
      {rotulo.known ? null : ' (não reconhecido)'}
    </span>
  )
}

/**
 * One date of the registry, converted by nothing (RN-06, D-05).
 * @param props - the part name, the prefix and the date.
 * @returns the element, with the raw value in a consultable attribute.
 */
function DateLine(props: { part: string; rotulo: string; valor: string | null }): ReactNode {
  const lida = readableDate(props.valor)
  return (
    <span
      data-part={props.part}
      data-date={lida.raw === '' ? undefined : lida.raw}
      className="muted"
    >
      {props.rotulo} {lida.text}
    </span>
  )
}

/**
 * One bug of the registry.
 * @param props - the row and the port that asks for a file.
 * @returns the list item.
 */
function Row(props: { linha: BugRow; onOpenFile: (path: string) => void }): ReactNode {
  const { linha, onOpenFile } = props
  const bug: BugEntry = linha.bug

  return (
    <li
      data-bug={bug.pasta}
      data-next={String(linha.proximo)}
      data-state={bug.estado ?? 'nao-declarado'}
      className={linha.proximo ? 'action bug--next' : 'action'}
    >
      {bug.id === null ? (
        <span data-part="bug-id" className="muted">
          identificador não declarado
        </span>
      ) : (
        <button
          type="button"
          className="link bug__id"
          data-part="bug-id"
          data-action="open-file"
          data-path={bug.arquivo}
          onClick={() => onOpenFile(bug.arquivo)}
        >
          {bug.id}
        </button>
      )}{' '}
      <span data-part="bug-alias" className="muted">
        {bug.apelido === null ? 'sem apelido' : `nº ${bug.apelido}`}
      </span>
      <div data-part="bug-title">{bug.titulo ?? 'título não lido'}</div>
      <div>
        <Value
          part="bug-state"
          bruto={bug.estadoBruto}
          rotular={bugStateLabel}
          ausente="estado não declarado"
        />{' '}
        <Value
          part="bug-phase"
          bruto={bug.faseBruta}
          rotular={bugPhaseLabel}
          ausente="fase não declarada"
        />{' '}
        <Value
          part="bug-severity"
          bruto={bug.severidadeBruta}
          rotular={bugSeverityLabel}
          ausente="severidade não declarada"
        />{' '}
        <Value
          part="bug-priority"
          bruto={bug.prioridadeBruta}
          rotular={bugPriorityLabel}
          ausente="prioridade não declarada"
        />
      </div>
      <div>
        <DateLine part="bug-created" rotulo="registrado em" valor={bug.registrado} />{' '}
        <DateLine part="bug-updated" rotulo="alterado em" valor={bug.alterado} />{' '}
        {bug.travado ? (
          <DateLine part="bug-closed" rotulo="encerrado em" valor={bug.encerrado} />
        ) : (
          <span data-part="bug-closed" className="muted">
            não encerrado
          </span>
        )}
      </div>
      {bug.bloqueado ? (
        <div data-part="bug-blocked" className="status">
          bloqueio declarado
        </div>
      ) : null}
      {bug.inconsistencia === null ? null : (
        <div data-part="bug-inconsistency" className="notice bug__inconsistency">
          Registro inconsistente: {inconsistencyLabel(bug.inconsistencia).text}.
        </div>
      )}
      {linha.proximo ? (
        <div data-part="bug-next" className="status">
          próximo a tratar
        </div>
      ) : null}
    </li>
  )
}

/**
 * One context of the registry, with its own subtitle, tally and reveal control.
 * @param props - the group and the two ports.
 * @returns the list item.
 */
function Group(props: {
  grupo: BugGroupView
  onOpenFile: (path: string) => void
  onReveal: (contexto: string) => void
}): ReactNode {
  const { grupo, onOpenFile, onReveal } = props

  return (
    <li data-bug-context={grupo.contexto} className="bug-group">
      <h3 data-part="bug-group-name" className="bug-group__name">
        {grupo.contexto}
      </h3>
      <Counts contagem={grupo.contagem} part="bug-group-counts" />
      {grupo.contagem.restritos === 0 ? null : (
        <p data-part="bug-group-restricted" className="muted">
          {bugs(grupo.contagem.restritos)} fora da lista por restrição de visibilidade.
        </p>
      )}
      {grupo.total === 0 ? (
        <p data-part="bug-group-none" className="empty">
          Este contexto não tem bug registrado.
        </p>
      ) : (
        <>
          <ul className="rows">
            {grupo.linhas.map((linha) => (
              <Row linha={linha} onOpenFile={onOpenFile} key={linha.bug.pasta} />
            ))}
          </ul>
          {grupo.ocultas === 0 ? null : (
            <p>
              <button
                type="button"
                className="link"
                data-action="reveal-bugs"
                data-context={grupo.contexto}
                onClick={() => onReveal(grupo.contexto)}
              >
                Ver os {grupo.ocultas} encerrados restantes deste contexto
              </button>
            </p>
          )}
        </>
      )}
    </li>
  )
}

/**
 * The bug registry section.
 * @param props - the registry, the collapse state and the ports.
 * @returns the section element.
 */
export function BugsSection(props: BugsSectionProps): ReactNode {
  const { bugs: registro, onOpenFile, onReveal } = props
  const vista = registro === undefined ? null : bugsView(registro, props.revealed)

  return (
    <CollapsibleSection
      name="bugs"
      title="Registro de bugs"
      count={registro?.contagem.total ?? 0}
      collapsed={props.collapsed}
      onToggle={props.onToggle}
    >
      {registro === undefined || vista === null ? (
        <p data-part="bugs-unread" className="empty">
          A cronologia dos bugs não foi lida por esta leitura do processo.
        </p>
      ) : !registro.presente ? (
        <p data-part="bugs-absent" className="empty">
          Não há registro de bugs neste projeto.
        </p>
      ) : (
        <>
          <p>
            <Counts contagem={registro.contagem} part="bugs-counts" />
          </p>
          <ProgressBar
            feitos={registro.contagem.resolvidos}
            total={registro.contagem.total}
            rotulo={`${registro.contagem.resolvidos} de ${registro.contagem.total} bugs resolvidos`}
          />
          {registro.contagem.restritos === 0 ? null : (
            <p data-part="bugs-restricted" className="muted">
              {bugs(registro.contagem.restritos)} fora da lista por restrição de visibilidade.
            </p>
          )}
          {vista.proximo === null ? (
            <p data-part="bugs-none-next" className="empty">
              Nada aguarda tratamento: nenhum bug em aberto no registro.
            </p>
          ) : null}
          {vista.grupos.length === 0 ? (
            <p data-part="bugs-none" className="empty">
              O registro existe e não tem contexto algum.
            </p>
          ) : (
            <ul className="rows">
              {vista.grupos.map((grupo) => (
                <Group
                  grupo={grupo}
                  onOpenFile={onOpenFile}
                  onReveal={onReveal}
                  key={grupo.contexto}
                />
              ))}
            </ul>
          )}
          {registro.truncado ? (
            <p data-part="bugs-truncated" className="notice">
              A leitura parou no teto de bugs: o registro tem {registro.contagem.total} bugs, e{' '}
              {registro.lidos} foram lidos nesta passagem.
            </p>
          ) : null}
        </>
      )}
    </CollapsibleSection>
  )
}
