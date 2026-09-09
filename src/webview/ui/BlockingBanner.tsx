/**
 * The banner of human blocking, drawn above everything else (RF-03, RF-03a).
 *
 * Each reason becomes three things: the sentence that names it, the artifact
 * as a target that asks the host to open it, and the command as a block to
 * copy. The panel does NOT run the command: what would run it is the reserved
 * dispatch of RF-15, and it has no handler in this version.
 *
 * An empty list draws no banner, and not an empty banner either.
 * @module webview/ui/BlockingBanner
 */

import type { ReactNode } from 'react'
import type { BlockingReason } from '../domain/types.ts'

/** What the banner draws. */
export interface BlockingBannerProps {
  reasons: BlockingReason[]
  onOpenFile: (path: string) => void
}

/**
 * The banner, or nothing.
 * @param props - the reasons and the port that asks for a file.
 * @returns the banner element, or null when there is no reason.
 */
export function BlockingBanner(props: BlockingBannerProps): ReactNode {
  const { reasons, onOpenFile } = props
  if (reasons.length === 0) return null

  return (
    <section data-section="blocking" className="blocking">
      <ul className="blocking__list">
        {reasons.map((reason, index) => (
          <li data-reason={index} key={`${reason.text}-${index}`}>
            <span data-part="reason-text">{reason.text}</span>
            {reason.artifact === null ? null : (
              <>
                {' '}
                <button
                  type="button"
                  className="link"
                  data-action="open-file"
                  data-path={reason.artifact}
                  onClick={() => onOpenFile(reason.artifact as string)}
                >
                  {reason.artifact}
                </button>
              </>
            )}
            {reason.command === null ? null : (
              <pre data-part="reason-command">{reason.command}</pre>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
