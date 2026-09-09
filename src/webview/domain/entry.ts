/**
 * Which of the five named situations the panel is in, and what survives a
 * reread (RF-01, RN-01, RN-08, EC-07).
 *
 * A pure function over the previous state and the message that arrived: no
 * storage, no editor, no component. Keeping the previous state a PARAMETER is
 * what lets RN-08 hold without anything here remembering -- the reread keeps
 * the content on screen because the caller hands back what it already had.
 * @module webview/domain/entry
 */

import type { HostMessage, SetEntryData, SetProcessData } from '../../host/protocol.ts'
import type { EffectiveEntry } from './types.ts'

/** Before the host has said anything, the panel is loading and shows nothing. */
export const INITIAL_ENTRY: EffectiveEntry = {
  kind: 'loading',
  rereading: false,
  loaded: null,
  message: null,
  root: null,
}

/**
 * The state a successful reading produces: the payload decides the kind.
 * @param data - what the host read.
 * @returns the effective entry, with the reread mark cleared.
 */
function fromProcess(data: SetProcessData): EffectiveEntry {
  return {
    kind: data.entry,
    rereading: false,
    loaded: data,
    message: null,
    root: data.root,
  }
}

/**
 * The state a bare command produces, which is where RN-08 lives.
 *
 * `loading` over content already on screen is a REREAD: the kind does not
 * change, the content stays, and only the mark is raised. Every other bare
 * command replaces what was there, because the panel can no longer stand
 * behind it.
 * @param previous - what was on screen.
 * @param data - the bare command that arrived.
 * @returns the effective entry.
 */
function fromEntry(previous: EffectiveEntry, data: SetEntryData): EffectiveEntry {
  if (data.kind === 'loading' && previous.loaded !== null) {
    return { ...previous, rereading: true }
  }

  return {
    kind: data.kind,
    rereading: false,
    loaded: null,
    message: data.message ?? null,
    root: data.root ?? null,
  }
}

/**
 * Derive the entry state from what was on screen and what arrived.
 * @param previous - the state being replaced.
 * @param message - one of the three host commands.
 * @returns the state to draw; the previous one when nothing here applies.
 */
export function nextEntry(previous: EffectiveEntry, message: HostMessage): EffectiveEntry {
  switch (message.command) {
    case 'setProcess':
      return fromProcess(message.data)
    case 'setEntry':
      return fromEntry(previous, message.data)
    case 'setNotice':
      return previous
    default:
      return previous
  }
}
