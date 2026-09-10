/**
 * Which of the five named situations the panel is in, and what survives a
 * reread (RF-01, RN-01, RN-08, EC-07).
 *
 * A pure function over the previous state and the message that arrived: no
 * storage, no editor, no component. Keeping the previous state a PARAMETER is
 * what lets RN-08 hold without anything here remembering -- the reread keeps
 * the content on screen because the caller hands back what it already had.
 *
 * Feature 007 puts the outcome of the origin query under the same rule, and for
 * the same reason. The query is ASYNCHRONOUS: the host draws the process first
 * and answers about the build afterwards (RF-12), so between the two there is
 * an instant with a reading in hand and no answer yet. Clearing the outcome
 * there would blink the header line off and on at every reread, which reads as
 * a defect and is not one. The previous outcome therefore stays on screen until
 * the new answer arrives.
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
  update: null,
}

/**
 * The state a successful reading produces: the payload decides the kind.
 *
 * The outcome of the query CROSSES the new reading untouched, because it is not
 * part of it: it answers about the build, which the reading did not change, and
 * its own answer is on its way (RF-12). The host sends `consultando` right
 * after this payload, so what survives here lives for an instant; that instant
 * is exactly the flicker this avoids.
 * @param previous - what was on screen, for the outcome alone.
 * @param data - what the host read.
 * @returns the effective entry, with the reread mark cleared.
 */
function fromProcess(previous: EffectiveEntry, data: SetProcessData): EffectiveEntry {
  return {
    kind: data.entry,
    rereading: false,
    loaded: data,
    message: null,
    root: data.root,
    update: previous.update,
  }
}

/**
 * The state a bare command produces, which is where RN-08 lives.
 *
 * `loading` over content already on screen is a REREAD: the kind does not
 * change, the content stays, and only the mark is raised. Every other bare
 * command replaces what was there, because the panel can no longer stand
 * behind it.
 *
 * The outcome goes with the content in both branches, and in the replacing one
 * it goes to null on purpose. Without a reading the header has no build to name
 * -- version and commit travel in the payload -- and declaring that an unnamed
 * build is up to date would be the panel affirming what it can no longer point
 * at.
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
    update: null,
  }
}

/**
 * Derive the entry state from what was on screen and what arrived.
 * @param previous - the state being replaced.
 * @param message - one of the four host commands.
 * @returns the state to draw; the previous one when nothing here applies.
 */
export function nextEntry(previous: EffectiveEntry, message: HostMessage): EffectiveEntry {
  switch (message.command) {
    case 'setProcess':
      return fromProcess(previous, message.data)
    case 'setEntry':
      return fromEntry(previous, message.data)
    case 'setNotice':
      return previous
    case 'setUpdate':
      // The one command that touches nothing but the outcome: what is on
      // screen stays, down to the reread mark, because the answer of the origin
      // says nothing about the reading it accompanies.
      return { ...previous, update: message.data }
    default:
      return previous
  }
}
