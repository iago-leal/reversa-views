/**
 * The error boundary, one per section (RN-07, D-08).
 *
 * A class component because that is the only form the interface library
 * offers for catching a render failure. A section that breaks says so IN ITS
 * OWN PLACE and writes one technical line to the channel: no dialog, no
 * notification, no change of focus. The panel is a side pane, and a pane that
 * steals focus to report its own defect costs the reader more than the defect.
 * @module webview/ui/ErrorBoundary
 */

import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { panelLine } from '../bridge/log.ts'
import type { SectionName } from '../domain/types.ts'

/** What the boundary wraps, and where it reports. */
export interface ErrorBoundaryProps {
  /** The section this boundary belongs to; it names the failure. */
  section: SectionName
  /** Where the technical line goes: the output channel, through the bridge. */
  onLog: (message: string) => void
  children: ReactNode
}

/** Whether this boundary has caught something. */
export interface ErrorBoundaryState {
  failed: boolean
}

/** The boundary of one section. */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = { failed: false }

  /**
   * Turn a throw into the failed state.
   * @returns the state that draws the failure instead of the children.
   */
  static getDerivedStateFromError(): ErrorBoundaryState {
    return { failed: true }
  }

  /**
   * Write the technical line, once per failure.
   * @param error - what was thrown.
   * @param info - the component stack the library assembled.
   */
  override componentDidCatch(error: Error, info: ErrorInfo): void {
    const stack = (info.componentStack ?? '').replace(/\s+/g, ' ').trim()
    this.props.onLog(
      panelLine('ui', 'seção falhou ao desenhar', `${this.props.section}: ${error.message} ${stack}`),
    )
  }

  /**
   * Draw the children, or the failure in their place.
   * @returns the markup of this boundary.
   */
  override render(): ReactNode {
    const { section, children } = this.props

    if (!this.state.failed) {
      return <div data-boundary={section}>{children}</div>
    }

    return (
      <div data-boundary={section} data-part="section-failure" className="section__failure">
        Esta seção falhou ao desenhar. O restante do painel continua válido, e a linha técnica foi
        escrita no canal de saída do Reversa Views.
      </div>
    )
  }
}
