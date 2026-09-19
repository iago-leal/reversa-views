/**
 * The assembly of the panel, and nothing else (RF-14, RF-16, RN-01, D-17).
 *
 * No decision is born here. Every one of them arrives from `domain/`: the
 * order of the sections, whether the reading degraded, what starts collapsed,
 * which reasons block the process. What this component does is call those
 * functions and hand the results out -- which is the verifiable form of RN-01.
 *
 * The section names are NOT written here as text: they are destructured out of
 * the order function, so that the one place naming the eleven stays `types.ts`.
 * That is what the boundary suite of T020 measures.
 *
 * The warning of RF-16 is drawn BESIDE the content, never in its place (D-17):
 * a file that vanished is not a reason to hide a reading that succeeded.
 * @module webview/ui/App
 */

import { useState } from 'react'
import type { ReactNode } from 'react'
import type { UpdateStatus } from '../../host/protocol.ts'
import type {
  DisplayPreferences,
  EffectiveEntry,
  EditorTheme,
  Notice,
  ReadingIntegrity,
  SectionName,
} from '../domain/types.ts'
import { blockingReasons } from '../domain/blocking.ts'
import { readingIntegrity } from '../domain/integrity.ts'
import { collapsibleSections, effectiveCollapsed, sectionOrder } from '../domain/sections.ts'
import { themeAttributes } from '../theme/primer-themes.ts'
import { AnomaliesSection } from './AnomaliesSection.tsx'
import { BlockingBanner } from './BlockingBanner.tsx'
import { BugsSection } from './BugsSection.tsx'
import { CollapsibleSection } from './CollapsibleSection.tsx'
import { DecompositionSection } from './DecompositionSection.tsx'
import { DiscoverySection } from './DiscoverySection.tsx'
import { EntryScreen } from './EntryScreens.tsx'
import { ErrorBoundary } from './ErrorBoundary.tsx'
import { ForwardSection } from './ForwardSection.tsx'
import { Header } from './Header.tsx'
import { HistorySection } from './HistorySection.tsx'
import { OriginSection } from './OriginSection.tsx'
import { PanoramaSection } from './PanoramaSection.tsx'
import { PolicySection } from './PolicySection.tsx'
import { ProbeSection } from './ProbeSection.tsx'

/** The integrity of a panel that has read nothing yet. */
const NOTHING_READ: ReadingIntegrity = {
  degraded: false,
  anomalies: 0,
  refusals: 0,
  truncated: 0,
}

/** What the panel needs to draw itself. */
export interface AppProps {
  entry: EffectiveEntry
  /**
   * What the origin said about this build, or null while nothing was said.
   *
   * It travels beside the entry state rather than inside the payload because
   * the query is asynchronous and answers about the build, not about the
   * reading (feature 007, D-02).
   */
  update: UpdateStatus | null
  notice: Notice
  preferences: DisplayPreferences
  theme: EditorTheme
  onReload: () => void
  onOpenFile: (path: string) => void
  onLog: (message: string) => void
  /** Called when a section is collapsed or expanded; the preference is owned upstream. */
  onToggleSection?: (section: SectionName, collapsed: boolean) => void
  /** The two global actions of RF-02 and RF-03; the preference is owned upstream. */
  onExpandAll?: () => void
  onCollapseAll?: () => void
  /** The two ways out of RF-12 and RF-17; the text is composed upstream. */
  onSummary?: () => void
  onCopySummary?: () => void
}

/**
 * The whole panel.
 * @param props - the entry state, the warning, the preference, the theme and the ports.
 * @returns the root element, carrying the theme attributes.
 */
export function App(props: AppProps): ReactNode {
  const { entry, update, notice, preferences, theme, onReload, onOpenFile, onLog } = props
  const payload = entry.loaded
  const integrity = payload === null ? NOTHING_READ : readingIntegrity(payload)
  const collapsed = new Set(effectiveCollapsed(preferences, integrity))
  const cards = collapsibleSections()
  const [
    blocking,
    forward,
    decomposition,
    panorama,
    history,
    bugs,
    discovery,
    origem,
    policy,
    anomalies,
    probe,
  ] = sectionOrder()

  /**
   * Which context groups of the registry had their rest revealed (D-07).
   *
   * It is state of the panel, per group, and NOT a stored preference: the same
   * decision feature 003 took for the list of anomalies. What one expands to
   * look at now is not a choice that should outlive the panel, and remembering
   * an expansion of a group that no longer exists would be remembering the
   * wrong thing.
   */
  const [revealedBugs, setRevealedBugs] = useState<ReadonlySet<string>>(() => new Set())

  /** Whether the scope of the PRD is unfolded inside the panorama; same nature, same reason (D-16). */
  const [scopeRevealed, setScopeRevealed] = useState(false)

  /**
   * Toggle one section, if anyone upstream is listening.
   * @param section - the section being toggled.
   * @returns the handler for that section.
   */
  const toggle = (section: SectionName) => () =>
    props.onToggleSection?.(section, !collapsed.has(section))

  return (
    <div className="panel" {...themeAttributes(theme)}>
      {entry.root === null ? null : (
        <Header
          entry={entry}
          integrity={integrity}
          update={update}
          onReload={onReload}
          collapsedCount={collapsed.size}
          collapsibleCount={cards.length}
          onExpandAll={() => props.onExpandAll?.()}
          onCollapseAll={() => props.onCollapseAll?.()}
          onSummary={() => props.onSummary?.()}
          onCopy={() => props.onCopySummary?.()}
        />
      )}

      {notice === null ? null : (
        <p data-part="notice" className="notice">
          {notice.message}
        </p>
      )}

      <EntryScreen entry={entry} onReload={onReload} />

      {payload === null ? null : (
        <>
          <ErrorBoundary section={blocking} onLog={onLog}>
            <BlockingBanner
              reasons={blockingReasons(payload.process, payload.bugs, payload.greenfield)}
              onOpenFile={onOpenFile}
            />
          </ErrorBoundary>

          <ErrorBoundary section={forward} onLog={onLog}>
            <ForwardSection
              process={payload.process}
              collapsed={collapsed.has(forward)}
              onToggle={toggle(forward)}
            />
          </ErrorBoundary>

          <ErrorBoundary section={decomposition} onLog={onLog}>
            <DecompositionSection
              decomposition={payload.decomposition}
              process={payload.process}
              collapsed={collapsed.has(decomposition)}
              onToggle={toggle(decomposition)}
            />
          </ErrorBoundary>

          <ErrorBoundary section={panorama} onLog={onLog}>
            <PanoramaSection
              greenfield={payload.greenfield}
              collapsed={collapsed.has(panorama)}
              onToggle={toggle(panorama)}
              onOpenFile={onOpenFile}
              scopeRevealed={scopeRevealed}
              onRevealScope={() => setScopeRevealed(true)}
            />
          </ErrorBoundary>

          <ErrorBoundary section={history} onLog={onLog}>
            <HistorySection
              history={payload.history}
              collapsed={collapsed.has(history)}
              onToggle={toggle(history)}
              onOpenFile={onOpenFile}
            />
          </ErrorBoundary>

          <ErrorBoundary section={bugs} onLog={onLog}>
            <BugsSection
              bugs={payload.bugs}
              collapsed={collapsed.has(bugs)}
              onToggle={toggle(bugs)}
              onOpenFile={onOpenFile}
              revealed={revealedBugs}
              onReveal={(contexto) =>
                setRevealedBugs((antes) => new Set([...antes, contexto]))
              }
            />
          </ErrorBoundary>

          <ErrorBoundary section={discovery} onLog={onLog}>
            <DiscoverySection
              process={payload.process}
              greenfield={payload.greenfield}
              collapsed={collapsed.has(discovery)}
              onToggle={toggle(discovery)}
            />
          </ErrorBoundary>

          <ErrorBoundary section={origem} onLog={onLog}>
            <OriginSection
              greenfield={payload.greenfield}
              collapsed={collapsed.has(origem)}
              onToggle={toggle(origem)}
              onOpenFile={onOpenFile}
            />
          </ErrorBoundary>

          <ErrorBoundary section={policy} onLog={onLog}>
            <PolicySection
              process={payload.process}
              collapsed={collapsed.has(policy)}
              onToggle={toggle(policy)}
            />
          </ErrorBoundary>

          <ErrorBoundary section={anomalies} onLog={onLog}>
            <AnomaliesSection
              anomalies={[
                ...payload.process.anomalies,
                ...(payload.bugs?.anomalias ?? []),
                ...(payload.greenfield?.anomalias ?? []),
                // Feature 010: the losses of the delivery axis, after the
                // greenfield ones, in the common shape.
                ...(payload.history?.anomalias ?? []),
              ]}
              collapsed={collapsed.has(anomalies)}
              onToggle={toggle(anomalies)}
            />
          </ErrorBoundary>

          <ErrorBoundary section={probe} onLog={onLog}>
            <ProbeSection
              probe={payload.probe}
              collapsed={collapsed.has(probe)}
              onToggle={toggle(probe)}
            />
          </ErrorBoundary>
        </>
      )}
    </div>
  )
}

export { CollapsibleSection }
