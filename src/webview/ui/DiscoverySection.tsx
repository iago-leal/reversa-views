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
import type { GreenfieldAxis } from '../../domain/types.ts'
import { brasiliaInstant } from '../domain/instants.ts'
import { checkpointMark, phaseMark } from '../domain/labels.ts'
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
        {discovery.checkpoints.map((checkpoint) => {
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
        })}
      </ul>
    </CollapsibleSection>
  )
}
