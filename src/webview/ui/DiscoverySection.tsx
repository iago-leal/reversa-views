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
import { brasiliaInstant } from '../domain/instants.ts'
import { checkpointMark, phaseMark } from '../domain/labels.ts'
import { CollapsibleSection } from './CollapsibleSection.tsx'

/** What the section draws. */
export interface DiscoverySectionProps {
  process: ReversaProcess
  collapsed: boolean
  onToggle: () => void
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
