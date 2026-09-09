/**
 * The single entry point of the bundle (RF-11, RF-12, RN-08, D-06).
 *
 * It imports the stylesheet, mounts the panel on the point the host body
 * offers, subscribes to the editor's theme, registers the single incoming
 * listener and says it is ready. No presentation logic lives here, and no call
 * to the host interface happens outside `bridge/messaging.ts`.
 *
 * The state of the panel is held here and handed down: what the entry state
 * becomes is decided by `domain/entry.ts`, and what the preference becomes by
 * `domain/preferences.ts`. This module only holds and distributes.
 * @module webview/main
 */

import { StrictMode, useCallback, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import './theme/theme.css'
import type { DisplayPreferences, EditorTheme, Notice, SectionName } from './domain/types.ts'
import { INITIAL_ENTRY, nextEntry } from './domain/entry.ts'
import { readPreferences, withCollapsed } from './domain/preferences.ts'
import { App } from './ui/App.tsx'
import { createBridge, hostApi, listenToHost } from './bridge/messaging.ts'
import { panelLine } from './bridge/log.ts'
import { readEditorTheme, watchEditorTheme } from './theme/contrast.ts'

/** The mount point the host body offers. */
const MOUNT_ID = 'root'

/** The class list of the body, and how to hear about it changing (EC-06). */
const bodyClasses = {
  classes: () => document.body.className,
  subscribe(listener: () => void): () => void {
    const observer = new MutationObserver(listener)
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  },
}

/**
 * The panel: the state it holds, and the ports it hands down.
 *
 * The bridge is built in a lazy initial state, so it is built once for the
 * life of the panel. Its sink closes over the state setters, which the
 * library guarantees are stable across renders.
 * @returns the panel.
 */
function Panel(): ReactNode {
  const [entry, setEntryState] = useState(INITIAL_ENTRY)
  const [notice, setNotice] = useState<Notice>(null)
  const [theme, setTheme] = useState<EditorTheme>(() => readEditorTheme(document.body.className))

  const [bridge] = useState(() =>
    createBridge({
      api: hostApi(),
      sink: {
        setProcess(data) {
          setNotice(null)
          setEntryState((previous) => nextEntry(previous, { command: 'setProcess', data }))
        },
        setEntry(data) {
          setNotice(null)
          setEntryState((previous) => nextEntry(previous, { command: 'setEntry', data }))
        },
        // D-17: the warning sits BESIDE the content, and replaces nothing.
        setNotice(data) {
          setNotice(data)
        },
      },
    }),
  )

  const [preferences, setPreferences] = useState<DisplayPreferences>(() =>
    readPreferences(bridge.readState()),
  )

  useEffect(() => {
    // EC-09 keeps the discard SILENT on screen: a preference written by an
    // older version is not the reader's problem. It is the maintainer's, and
    // that is what the channel is for.
    const stored = bridge.readState() as { collapsedSections?: unknown } | null
    const before = Array.isArray(stored?.collapsedSections) ? stored.collapsedSections.length : 0
    const dropped = before - preferences.collapsedSections.length
    if (dropped > 0) {
      bridge.log(
        panelLine('main', 'preferência descartada', `${dropped} nomes de seção não existem mais`),
      )
    }
  }, [bridge, preferences])

  useEffect(() => {
    const stop = listenToHost(bridge, window)
    bridge.ready()
    return stop
  }, [bridge])

  useEffect(() => watchEditorTheme(bodyClasses, setTheme), [])

  const toggleSection = useCallback(
    (section: SectionName, collapsed: boolean) => {
      setPreferences((current) => {
        const next = withCollapsed(current, section, collapsed)
        bridge.writeState(next)
        return next
      })
    },
    [bridge],
  )

  return (
    <App
      entry={entry}
      notice={notice}
      preferences={preferences}
      theme={theme}
      onReload={() => bridge.reload()}
      onOpenFile={(path) => bridge.openFile(path)}
      onLog={(message) => bridge.log(message)}
      onToggleSection={toggleSection}
    />
  )
}

const mount = document.getElementById(MOUNT_ID)
if (mount !== null) {
  createRoot(mount).render(
    <StrictMode>
      <Panel />
    </StrictMode>,
  )
}
