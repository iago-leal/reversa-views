/**
 * The legacy edit policy in force, and the folders REVERSA may write to
 * (RF-07).
 *
 * With the policy off, the section SAYS it is off: a panel that showed only
 * the list of folders would read as a permission, and the difference between
 * "may write here" and "may write nowhere but here" is the whole point of the
 * contract.
 * @module webview/ui/PolicySection
 */

import type { ReactNode } from 'react'
import type { ReversaProcess } from '../../heranca/reversa-domain/src/index.ts'
import { CollapsibleSection } from './CollapsibleSection.tsx'

/** What the section draws. */
export interface PolicySectionProps {
  process: ReversaProcess
  collapsed: boolean
  onToggle: () => void
}

/**
 * The policy section.
 * @param props - the process, the collapse state and the toggle port.
 * @returns the section element.
 */
export function PolicySection(props: PolicySectionProps): ReactNode {
  const { policy, writableFolders } = props.process
  const allowed = policy.allowedPaths

  return (
    <CollapsibleSection
      name="policy"
      title="Política de escrita"
      count={writableFolders.length}
      collapsed={props.collapsed}
      onToggle={props.onToggle}
    >
      <p data-part="policy-verdict">
        {policy.allowLegacyEdits
          ? allowed.length === 0
            ? 'A edição do legado está liberada sem restrição de caminho.'
            : `A edição do legado está liberada nos caminhos declarados: ${allowed.join(', ')}.`
          : 'A edição do legado está desligada. O Reversa escreve apenas nas pastas próprias.'}
      </p>
      <ul className="rows">
        {writableFolders.map((folder) => (
          <li data-folder={folder} key={folder}>
            <code>{folder}</code>
          </li>
        ))}
      </ul>
    </CollapsibleSection>
  )
}
