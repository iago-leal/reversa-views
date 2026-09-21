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
import { readPreferences, withAll, withCollapsed } from './domain/preferences.ts'
import { promptAvailability, promptText } from './domain/prompt.ts'
import { summaryText } from './domain/summary.ts'
import { App } from './ui/App.tsx'
import { createBridge, hostApi, listenToHost } from './bridge/messaging.ts'
import { panelLine } from './bridge/log.ts'
import { readEditorTheme, watchEditorTheme } from './theme/contrast.ts'

/** The mount point the host body offers. */
const MOUNT_ID = 'root'

/** How the panel asks the editor to call the unsaved document (RF-12). */
const SUMMARY_TITLE = 'Resumo do processo'

/** The title of the document the correction prompt opens in (feature 013). */
const PROMPT_TITLE = 'Prompt de correção do checkpoint'

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
        // Feature 007: the outcome of the origin query goes into the SAME state
        // as everything else on screen, and nowhere else. It is not written to
        // the panel state the editor keeps between sessions, and not stored as
        // a preference: it describes this build against the origin AT THIS
        // INSTANT, and a value kept across sessions would be the panel
        // asserting on a later day what it learned on an earlier one. It does
        // not clear the warning either, because a file that vanished has
        // nothing to do with what the origin answered.
        setUpdate(data) {
          setEntryState((previous) => nextEntry(previous, { command: 'setUpdate', data }))
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

  /**
   * The two global actions of RF-02 and RF-03.
   *
   * What is stored is ALWAYS a declared preference, expanding everything
   * included: it is exactly the state the old shape could not represent, and
   * writing it undeclared is what used to undo the gesture on the next draw.
   */
  const toggleAll = useCallback(
    (collapsed: boolean) => {
      const next = withAll(collapsed)
      bridge.writeState(next)
      setPreferences(next)
    },
    [bridge],
  )

  /**
   * The summary, composed here and sent ready (RF-12, RF-17).
   *
   * The text is a pure function of the payload, so the document and the
   * clipboard receive the same thing; the host learns nothing of what it says.
   */
  const summarise = useCallback(
    (how: 'draft' | 'copy') => {
      const payload = entry.loaded
      if (payload === null) {
        bridge.log(panelLine('main', 'resumo recusado', 'não há leitura para resumir'))
        return
      }
      const text = summaryText(payload)
      if (how === 'draft') bridge.openDraft(text, SUMMARY_TITLE)
      else bridge.copyText(text)
    },
    [bridge, entry],
  )

  /**
   * The correction prompt, by the exact mould of `summarise` (feature 013).
   *
   * The availability is apportioned ONCE, here, and the same apportionment
   * feeds the button and the text: a screen that decided it twice would
   * eventually offer a live button beside a refusal, and the refusal would be
   * the honest one.
   */
  const disponibilidade = promptAvailability(entry.loaded)

  const solicitar = useCallback(
    (how: 'draft' | 'copy') => {
      const { elegiveis, razao } = promptAvailability(entry.loaded)
      if (elegiveis.length === 0) {
        bridge.log(panelLine('main', 'prompt recusado', razao ?? 'não há caso a pedir'))
        return
      }
      const text = promptText(elegiveis)
      // The count, and never the text: the trail says what was asked for
      // without repeating what was said, which is the same cut the elision
      // makes one layer below (RNF-05).
      bridge.log(
        panelLine('main', 'prompt composto', `${elegiveis.length} caso(s), por ${how === 'draft' ? 'documento' : 'cópia'}`),
      )
      if (how === 'draft') bridge.openDraft(text, PROMPT_TITLE)
      else bridge.copyText(text)
    },
    [bridge, entry],
  )

  return (
    <App
      entry={entry}
      update={entry.update}
      notice={notice}
      preferences={preferences}
      theme={theme}
      onReload={() => bridge.reload()}
      onOpenFile={(path) => bridge.openFile(path)}
      onLog={(message) => bridge.log(message)}
      onToggleSection={toggleSection}
      onExpandAll={() => toggleAll(false)}
      onCollapseAll={() => toggleAll(true)}
      onSummary={() => summarise('draft')}
      onCopySummary={() => summarise('copy')}
      promptReason={disponibilidade.razao}
      onPrompt={() => solicitar('draft')}
      onCopyPrompt={() => solicitar('copy')}
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
