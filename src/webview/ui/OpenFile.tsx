/**
 * The one button that asks the host to open a file, by the message the whole
 * panel uses (RF-10 of feature 006, RF-11 of feature 009).
 *
 * Shared by the cards of feature 009 so that the attribute pair the suites
 * read, `data-action` then `data-path`, is spelled in one place.
 * @module webview/ui/OpenFile
 */

import type { ReactNode } from 'react'

/** A path relative to the root, the port, and what to show instead of the path. */
export interface OpenFileProps {
  path: string
  onOpenFile: (path: string) => void
  children?: ReactNode
}

/**
 * The button.
 * @param props - the path, the port and the optional text.
 * @returns the button element.
 */
export function OpenFile(props: OpenFileProps): ReactNode {
  return (
    <button
      type="button"
      className="link"
      data-action="open-file"
      data-path={props.path}
      onClick={() => props.onOpenFile(props.path)}
    >
      {props.children ?? props.path}
    </button>
  )
}
