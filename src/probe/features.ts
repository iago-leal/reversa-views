/**
 * The local probe over every feature folder of the project (RF-09, D-06).
 *
 * The inherited probe reads the ACTIVE feature, and only it: the path it
 * follows comes from the pointer REVERSA keeps, and there is exactly one such
 * pointer. Walking the other folders is new work, and this module is where it
 * lives.
 *
 * It touches no vendored file and imports no platform module. It reads through
 * the three functions the inherited probe already exports -- `listNames`,
 * `readText` and `resolveInside` -- so `node:fs` stays in the one file that
 * already had it. That matters more than it looks: altering the inherited
 * package would mean a new stamp, a declared adaptation and a conflict at the
 * next resynchronisation, and reusing what it exports costs none of that.
 *
 * Nothing here judges. It reads folders and files and hands the text over;
 * what a folder MEANS is `domain/history.ts`, which is the same cut the house
 * already makes between a probe that looks and a domain that decides.
 * @module probe/features
 */

import { listNames, readText, resolveInside } from '../heranca/reversa-probe/src/index.ts'
import { FEATURE_FOLDER_CAP } from '../domain/limits.ts'

/** The three files of a feature folder this reading cares about. */
const FILES = ['actions.md', 'requirements.md', 'progress.jsonl'] as const

/** What the probe needs to know before it can look. */
export interface FeatureFoldersInput {
  /** The absolute root being observed. */
  root: string
  /** The forward folder as `state.json` declares it, relative to the root. */
  forwardFolder: string
}

/** One feature folder, as it was read from disk. */
export interface FeatureFolderRead {
  /** Path relative to the observed root, which is what `openFile` takes. */
  pasta: string
  /** The bare folder name, which is what orders the history. */
  nome: string
  actionsMd: string | null
  requirementsMd: string | null
  progressJsonl: string | null
}

/** Every folder read, and the probe's own account of the reading. */
export interface FeatureFoldersRead {
  pastas: FeatureFolderRead[]
  /** True above the ceiling, so that the panel can declare the reading partial. */
  truncado: boolean
  /** How many folders exist, even when the ceiling stopped the walk short. */
  total: number
}

/** Nothing read, which is what an absent or refused forward folder produces. */
const NOTHING: FeatureFoldersRead = { pastas: [], truncado: false, total: 0 }

/**
 * Read every feature folder of the project, in name order and up to the
 * ceiling.
 *
 * The ceiling follows the precedent of the fifty addenda the inherited probe
 * applies, and it is deliberately walked in NAME ORDER, which is the order the
 * requirement names. In a project past the ceiling the walk therefore stops at
 * the oldest fifty; today six folders exist, so the guard is far from binding.
 *
 * Every failure becomes absence, never an exception: a folder that vanished
 * between the listing and the reading, a file above the byte cap and a path
 * that escapes the root all come back as a folder with nothing in it, or as no
 * folder at all.
 * @param input - the observed root and the declared forward folder.
 * @returns the folders read, plus whether the ceiling cut the walk short.
 */
export function readFeatureFolders(input: FeatureFoldersInput): FeatureFoldersRead {
  const base = resolveInside(input.root, input.forwardFolder)
  if (base === null) return { ...NOTHING }

  const names = listNames(base)
  if (names === null) return { ...NOTHING }

  const folders: FeatureFolderRead[] = []
  let total = 0

  for (const name of names) {
    const relative = `${input.forwardFolder}/${name}`
    const abs = resolveInside(input.root, relative)
    // A name that is not a directory is not a feature: `listNames` answers
    // null for anything that is not one, which is the directory test this
    // module has without reaching for a platform module of its own.
    if (abs === null || listNames(abs) === null) continue

    total += 1
    if (folders.length >= FEATURE_FOLDER_CAP) continue

    folders.push({
      pasta: relative,
      nome: name,
      actionsMd: fileOf(input.root, relative, FILES[0]),
      requirementsMd: fileOf(input.root, relative, FILES[1]),
      progressJsonl: fileOf(input.root, relative, FILES[2]),
    })
  }

  return { pastas: folders, truncado: total > folders.length, total }
}

/**
 * One file of one feature folder, or its absence.
 * @param root - the observed root.
 * @param relative - the folder, relative to the root.
 * @param name - the file inside it.
 * @returns the text, or null when it is missing, unreadable or too big.
 */
function fileOf(root: string, relative: string, name: string): string | null {
  const abs = resolveInside(root, `${relative}/${name}`)
  return abs === null ? null : readText(abs)
}
