/**
 * The discovery pipeline: the five phases and the checkpoints of each agent.
 *
 * The five phases are drawn ALWAYS, in the canonical order, even over an empty
 * process: EC-01 asks that the panel show where the process would be, not
 * only where it is. The current one is told apart by a word, never by colour
 * alone, which is the half of the accessibility requirement the markup can
 * carry.
 * @module webview/ui/DiscoverySection
 */

import type { ReactNode } from 'react'
import type { ReversaProcess } from '../../heranca/reversa-domain/src/index.ts'
import type {
  CheckpointState,
  DiscoveryStateAxis,
  GreenfieldAxis,
  NonAgentEntry,
} from '../../domain/types.ts'
import { brasiliaInstant } from '../domain/instants.ts'
import {
  checkpointMark,
  checkpointStateMark,
  extractionLabel,
  nonAgentEntries,
  phaseMark,
  provenanceText,
} from '../domain/labels.ts'
import { CollapsibleSection } from './CollapsibleSection.tsx'

/** What the section draws. */
export interface DiscoverySectionProps {
  process: ReversaProcess
  /**
   * The greenfield axis, or its absence (feature 009, RF-21).
   *
   * Optional, because a host older than the field does not send it, and the
   * card then draws exactly what it drew before: the sentence below is an
   * ADDITION over a project that was born by `/reversa-new` and has not been
   * extracted yet, and nothing else changes.
   */
  greenfield?: GreenfieldAxis
  /**
   * The discovery-state axis, or its absence (feature 011).
   *
   * Optional for the same reason the greenfield axis is: a host older than the
   * field does not send it, and the card then draws exactly what it drew
   * before -- five phases, two checkpoint states, and no sentence about the
   * extraction having ended.
   */
  discoveryState?: DiscoveryStateAxis
  collapsed: boolean
  onToggle: () => void
}

/**
 * Whether the sentence of RF-21 applies: the project was born by
 * `/reversa-new` and no phase of the discovery has finished. Once one has, the
 * extraction has started and the sentence would be false.
 * @param props - the process and the axis.
 * @returns true when the five pending phases have an explanation.
 */
function bornGreenfield(props: DiscoverySectionProps): boolean {
  if (props.greenfield?.cenario !== 'greenfield') return false
  return props.process.discovery.phases.every((phase) => phase.status !== 'done')
}

/**
 * Whether the sentence of feature 011 applies: the extraction declared its
 * end. The five phases stay exactly where they are, and the sentence is an
 * ADDITION above them, by the same shape the greenfield sentence of feature
 * 009 already uses. There is no sixth phase, because there is no sixth phase.
 * @param props - the process and the axis.
 * @returns true when the extraction ended.
 */
function extracaoEncerrada(props: DiscoverySectionProps): boolean {
  return props.discoveryState?.extracao.situacao === 'encerrada'
}

/**
 * The discovery section.
 * @param props - the process, the collapse state and the toggle port.
 * @returns the section element.
 */
export function DiscoverySection(props: DiscoverySectionProps): ReactNode {
  const { discovery } = props.process

  return (
    <CollapsibleSection
      name="discovery"
      title="Descoberta"
      collapsed={props.collapsed}
      onToggle={props.onToggle}
    >
      {props.discoveryState === undefined || !extracaoEncerrada(props) ? null : (
        <p data-part="discovery-closed" className="muted">
          {extractionLabel(props.discoveryState.extracao.situacao).text}: o processo declarou o fim
          na fase{' '}
          <span data-part="closed-raw">{props.discoveryState.extracao.bruto}</span>, valor que o
          esquema do Reversa não documenta e que o fluxo escreve ao fechar. As cinco fases
          canônicas seguem abaixo, como sempre.
        </p>
      )}
      {bornGreenfield(props) ? (
        <p data-part="discovery-greenfield" className="muted">
          Projeto nascido por /reversa-new, ainda sem extração: as fases seguem pendentes até que
          /reversa rode sobre o código novo.
        </p>
      ) : null}
      <ul className="rows">
        {discovery.phases.map((phase) => {
          const mark = phaseMark(phase)
          return (
            <li data-phase={phase.name} data-status={phase.status} key={phase.name}>
              {mark.label.text}{' '}
              <span data-part="phase-status" className="status" data-status={phase.status}>
                {mark.status}
              </span>
            </li>
          )
        })}
      </ul>
      <ul className="rows">
        {props.discoveryState === undefined
          ? discovery.checkpoints.map((checkpoint) => {
              const mark = checkpointMark(checkpoint)
              const instant = brasiliaInstant(mark.instant)
              return (
                <li
                  data-checkpoint={checkpoint.agent}
                  data-done={String(checkpoint.completedAt !== null)}
                  key={checkpoint.agent}
                >
                  {mark.label.text} <span className="status">{mark.status}</span>
                  {mark.instant === null ? null : (
                    <>
                      {' '}
                      <span data-part="checkpoint-instant" data-instant={instant.raw}>
                        {instant.text}
                      </span>
                    </>
                  )}
                </li>
              )
            })
          : props.discoveryState.checkpoints.map((checkpoint) => (
              <CheckpointRow checkpoint={checkpoint} key={checkpoint.agent} />
            ))}
      </ul>
      {props.discoveryState === undefined ? null : (
        <NonAgentRows registros={nonAgentEntries(props.discoveryState)} />
      )}
    </CollapsibleSection>
  )
}

/**
 * One checkpoint as feature 011 judges it, in three states.
 *
 * `data-situacao` replaces `data-done`, which could only ever say two things,
 * and the state travels as a WORD as well: a state that reads only as a colour
 * does not read at all for part of the audience (RNF-03).
 *
 * The fields of `camposComLista` are named and nothing more. They are not
 * called outputs, because `achados`, `lacunas` and `adrs` have the same shape
 * and are not files, and thirteen different names were measured for what a
 * checkpoint calls its outputs (D-08).
 * @param props - the judged checkpoint.
 * @returns the row.
 */
function CheckpointRow(props: { checkpoint: CheckpointState }): ReactNode {
  const mark = checkpointStateMark(props.checkpoint)
  const instant = brasiliaInstant(mark.instant)
  const provenance = provenanceText(props.checkpoint.reconhecidoPor)

  return (
    <li data-checkpoint={props.checkpoint.agent} data-situacao={props.checkpoint.situacao}>
      {mark.label.text} <span className="status">{mark.status}</span>
      {mark.instant === null ? null : (
        <>
          {' '}
          <span data-part="checkpoint-instant" data-instant={instant.raw}>
            {instant.text}
          </span>
        </>
      )}
      {provenance === null ? null : (
        <>
          {' '}
          <span data-part="checkpoint-procedencia" className="muted">
            {provenance}
          </span>
        </>
      )}
      {props.checkpoint.camposComLista.length === 0 ? null : (
        <>
          {' '}
          <span data-part="checkpoint-campos" className="muted">
            sem arquivos no campo canônico; campos com lista de textos:{' '}
            {props.checkpoint.camposComLista.join(', ')}
          </span>
        </>
      )}
    </li>
  )
}

/**
 * The entries that name no agent (feature 012, RF-17).
 *
 * They are drawn APART from the checkpoints and without a situation, because
 * nothing is asked of a conclusion from something that is not an agent. They
 * are drawn at all, rather than dropped, because a reader who saw
 * `plano_aprovado` in the file deserves to find it on the panel.
 * @param props - the entries the axis separated.
 * @returns the list, or nothing when there are none.
 */
function NonAgentRows(props: { registros: NonAgentEntry[] }): ReactNode {
  if (props.registros.length === 0) return null

  return (
    <ul className="rows" data-part="registros-nao-agentes">
      {props.registros.map((registro) => (
        <li data-registro={registro.chave} key={registro.chave}>
          {registro.chave}{' '}
          <span className="muted">registro aprovado como não sendo agente</span>
          {registro.camposComLista.length === 0 ? null : (
            <>
              {' '}
              <span data-part="registro-campos" className="muted">
                campos com lista de textos: {registro.camposComLista.join(', ')}
              </span>
            </>
          )}
        </li>
      ))}
    </ul>
  )
}
