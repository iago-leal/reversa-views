/**
 * What the probe actually did: the root it read, the feature directory, the
 * paths it refused and the files it truncated (RF-09).
 *
 * It deliberately does NOT draw the migration state path nor the ideation
 * session directory: `data-delta.md` puts both outside this version, and a
 * panel that showed a path it does not read would be describing a reading
 * that did not happen.
 * @module webview/ui/ProbeSection
 */

import type { ReactNode } from 'react'
import type { ProbeReport } from '../../heranca/reversa-probe/src/snapshot.ts'
import { CollapsibleSection } from './CollapsibleSection.tsx'

/** What the section draws. */
export interface ProbeSectionProps {
  probe: ProbeReport
  collapsed: boolean
  onToggle: () => void
}

/**
 * The probe report section.
 * @param props - the report, the collapse state and the toggle port.
 * @returns the section element.
 */
export function ProbeSection(props: ProbeSectionProps): ReactNode {
  const { probe } = props

  return (
    <CollapsibleSection
      name="probe"
      title="Relatório da sonda"
      count={probe.refusals.length + probe.truncated.length}
      collapsed={props.collapsed}
      onToggle={props.onToggle}
    >
      <dl className="pairs">
        <dt>Raiz lida</dt>
        <dd data-item="probe-root">{probe.workspace}</dd>
        <dt>Pasta da feature</dt>
        <dd data-item="probe-feature-dir">{probe.featureDir ?? 'nenhuma'}</dd>
      </dl>
      <ul className="rows">
        {probe.refusals.map((refusal) => (
          <li data-refusal={refusal.path} key={refusal.path}>
            <code>{refusal.path}</code> recusado: {refusal.reason}
          </li>
        ))}
      </ul>
      <ul className="rows">
        {probe.truncated.map((path) => (
          <li data-truncated={path} key={path}>
            <code>{path}</code> truncado na leitura
          </li>
        ))}
      </ul>
    </CollapsibleSection>
  )
}
