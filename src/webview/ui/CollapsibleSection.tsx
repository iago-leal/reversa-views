/**
 * The generic collapsible section (RF-12, RF-22, D-01).
 *
 * It does not decide whether it starts collapsed: that arrives ready from
 * `domain/sections.ts`. What it owns is the shape -- a title that is a button,
 * reachable by keyboard, with its state declared for a screen reader, and the
 * count beside it when there is one.
 *
 * The body is drawn even while collapsed, and hidden by the stylesheet. That
 * keeps the count and the content in the document for whoever reads it with
 * something other than eyes, and makes expanding cost no render.
 * @module webview/ui/CollapsibleSection
 */

import type { ReactNode } from 'react'
import type { SectionName } from '../domain/types.ts'

/** What a section needs to draw itself. */
export interface CollapsibleSectionProps {
  name: SectionName
  title: string
  /** Shown beside the title when informed; RF-22 asks it of the diagnostic three. */
  count?: number
  collapsed: boolean
  onToggle: () => void
  children: ReactNode
}

/**
 * One collapsible section.
 * @param props - name, title, optional count, collapse state and content.
 * @returns the section element.
 */
export function CollapsibleSection(props: CollapsibleSectionProps): ReactNode {
  const { name, title, count, collapsed, onToggle, children } = props

  return (
    <section data-section={name} data-collapsed={String(collapsed)} className="section">
      <h2 className="section__title">
        <button
          type="button"
          className="section__toggle"
          data-action="toggle"
          aria-expanded={!collapsed}
          onClick={onToggle}
        >
          <span>{title}</span>
          {count === undefined ? null : (
            <span data-part="count" className="section__count">
              {count}
            </span>
          )}
        </button>
      </h2>
      <div data-part="body" className="section__body">
        {children}
      </div>
    </section>
  )
}
