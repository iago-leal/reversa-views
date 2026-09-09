/**
 * The forward cycle, in the eight items RF-06 fixes.
 *
 * Every item is drawn filled or declared absent BY NAME. A blank beside a
 * label is the panel saying two different things at once -- "there is nothing"
 * and "I did not read this" -- and RF-06 exists to forbid exactly that.
 *
 * The readable stage comes ready from `domain/labels.ts`; this component does
 * not know the vocabulary of stages.
 * @module webview/ui/ForwardSection
 */

import type { ReactNode } from 'react'
import type { ReversaProcess } from '../../heranca/reversa-domain/src/index.ts'
import { stageLabel } from '../domain/labels.ts'
import { CollapsibleSection } from './CollapsibleSection.tsx'

/** What the section draws. */
export interface ForwardSectionProps {
  process: ReversaProcess
  collapsed: boolean
  onToggle: () => void
}

/** What an item says when there is nothing to show for it. */
const ABSENT = 'nenhum'

/**
 * One labelled item, never blank.
 * @param props - the item name, its label and its value.
 * @returns the pair of elements.
 */
function Pair(props: { name: string; label: string; value: string | number | null }): ReactNode {
  const value = props.value === null || props.value === '' ? ABSENT : String(props.value)
  return (
    <>
      <dt>{props.label}</dt>
      <dd data-item={props.name}>{value}</dd>
    </>
  )
}

/**
 * The forward cycle section.
 * @param props - the process, the collapse state and the toggle port.
 * @returns the section element.
 */
export function ForwardSection(props: ForwardSectionProps): ReactNode {
  const { forward } = props.process
  const label = stageLabel(forward.stage)
  const paused = forward.pausedFeatures.map((feature) => feature.shortName ?? feature.featureId)

  return (
    <CollapsibleSection
      name="forward"
      title="Ciclo forward"
      collapsed={props.collapsed}
      onToggle={props.onToggle}
    >
      <dl className="pairs">
        <Pair
          name="stage"
          label="Estágio"
          value={label.known ? label.text : `${label.raw} (rótulo desconhecido)`}
        />
        <Pair name="feature" label="Feature ativa" value={forward.shortName ?? forward.featureDir} />
        <Pair name="closed-actions" label="Ações fechadas" value={forward.actions.fechadas} />
        <Pair name="open-actions" label="Ações abertas" value={forward.actions.abertas} />
        <Pair name="addenda" label="Emendas" value={forward.actions.emendas} />
        <Pair name="doubts" label="Dúvidas" value={forward.doubts} />
        <Pair name="paused" label="Features pausadas" value={paused.join(', ')} />
        <Pair name="addendum" label="Adendo" value={forward.addendum} />
      </dl>
    </CollapsibleSection>
  )
}
