/**
 * Every anomaly the reading met, with the cut RF-21 fixes (RF-08, RF-21,
 * RN-05, D-19).
 *
 * Ten are shown, the total is stated, and the rest are one click away. The cut
 * is a named constant of this module, and expanding it is LOCAL state: it is
 * not a preference, is not stored, and does not talk to the host (D-19). A
 * panel that remembered an expansion of a list that no longer exists would be
 * remembering the wrong thing.
 *
 * An anomaly code outside the vocabulary is drawn raw, and does not break the
 * list: RN-05 again.
 * @module webview/ui/AnomaliesSection
 */

import { useState } from 'react'
import type { ReactNode } from 'react'
import type { Anomaly } from '../../heranca/reversa-domain/src/index.ts'
import { CollapsibleSection } from './CollapsibleSection.tsx'

/** How many anomalies the section shows before asking (RF-21). */
const CUT = 10

/** What the section draws. */
export interface AnomaliesSectionProps {
  anomalies: Anomaly[]
  collapsed: boolean
  onToggle: () => void
}

/**
 * The anomalies section.
 * @param props - the anomalies, the collapse state and the toggle port.
 * @returns the section element.
 */
export function AnomaliesSection(props: AnomaliesSectionProps): ReactNode {
  const { anomalies } = props
  const [expanded, setExpanded] = useState(false)
  const shown = expanded ? anomalies : anomalies.slice(0, CUT)

  return (
    <CollapsibleSection
      name="anomalies"
      title="Anomalias"
      count={anomalies.length}
      collapsed={props.collapsed}
      onToggle={props.onToggle}
    >
      {anomalies.length === 0 ? (
        <p data-part="anomaly-none" className="empty">
          A leitura não encontrou anomalia alguma.
        </p>
      ) : (
        <>
          <ul className="rows">
            {shown.map((anomaly, index) => (
              <li data-anomaly={index} key={`${anomaly.file}-${anomaly.code}-${index}`}>
                <span data-part="anomaly-file">{anomaly.file}</span>{' '}
                <code data-part="anomaly-code">{anomaly.code}</code>
                {anomaly.detail === undefined ? null : (
                  <span data-part="anomaly-detail"> {anomaly.detail}</span>
                )}
              </li>
            ))}
          </ul>
          <p>
            <span data-part="anomaly-total">{anomalies.length}</span> anomalias no total.
            {anomalies.length > CUT && !expanded ? (
              <>
                {' '}
                <button
                  type="button"
                  className="link"
                  data-action="expand-anomalies"
                  onClick={() => setExpanded(true)}
                >
                  Ver as demais
                </button>
              </>
            ) : null}
          </p>
        </>
      )}
    </CollapsibleSection>
  )
}
