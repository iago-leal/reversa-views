/**
 * The local probe over the artifacts `/reversa-new` leaves in the output
 * folder (RF-01, RF-22, D-01, D-11).
 *
 * The inherited probe reads what the pointer of REVERSA names, and the brief,
 * the ideation, the personas, the PRD and the specs are not among those
 * things. Looking at them is new work, and this module is where it lives,
 * under the same discipline as the probe of feature 006: no vendored file is
 * touched, no platform module is imported, and the three functions the
 * inherited probe exports are the whole of what reaches the disk.
 *
 * Only TWO bodies are read, the brief and the PRD, because only two are
 * judged: the summary line comes from the brief, the scope items come from the
 * PRD. The ideation, the personas and the specs are LISTED and never opened;
 * the time ceiling of the panel does not survive opening five specs on every
 * reading, and nothing on the screen needs their text.
 *
 * Nothing here judges. What a present file MEANS, which stage the pipeline is
 * at, which scenario the project is in, is `domain/greenfield.ts`.
 * @module probe/greenfield
 */

import { listNames, readText, resolveInside } from '../heranca/reversa-probe/src/index.ts'
import {
  ARCHITECTURE_FILE,
  DOMAIN_FILE,
  IDEATION_FILE,
  NEWPROJECT_BRIEF_FILE,
  PERSONAS_FILE,
  PRD_FILE,
  SDD_FOLDER,
  SPEC_CAP,
} from '../domain/limits.ts'

/** What the probe needs to know before it can look. */
export interface GreenfieldInput {
  /** The absolute root being observed. */
  root: string
  /** The output folder as `state.json` declares it, relative to the root. */
  outputFolder: string
}

/** The artifacts of the output folder, as they were seen on disk. */
export interface GreenfieldRead {
  /** False when the output folder is missing, unreadable or escapes the root. */
  pasta: boolean
  brief: boolean
  /** The body of the brief; null when absent, unreadable or above the cap. */
  briefMd: string | null
  ideacao: boolean
  personas: boolean
  prd: boolean
  /** The body of the PRD; null when absent, unreadable or above the cap. */
  prdMd: string | null
  /** The two anchors of the extraction, seen and never opened. */
  arquitetura: boolean
  dominio: boolean
  /** The `.md` names inside `sdd/`, in name order, up to the ceiling. */
  specs: string[]
  /** How many `.md` exist inside `sdd/`, even past the ceiling. */
  totalDeSpecs: number
  /** The present files whose body could not be read, relative to the root. */
  truncados: string[]
}

/** Nothing seen, which is what an absent or refused output folder produces. */
const NOTHING: GreenfieldRead = {
  pasta: false,
  brief: false,
  briefMd: null,
  ideacao: false,
  personas: false,
  prd: false,
  prdMd: null,
  arquitetura: false,
  dominio: false,
  specs: [],
  totalDeSpecs: 0,
  truncados: [],
}

/**
 * Look at the output folder once and report what is there.
 *
 * Presence is decided by ONE listing of the folder, and the specs by one
 * listing of `sdd/`: two directory reads per reading, plus the two bodies.
 * Every failure becomes absence, never an exception: a folder that escapes
 * the root, a file that vanished between the listing and the reading and a
 * body above the byte cap all come back as "not there" or "not read", and
 * the second is declared in `truncados` so that the judgement can name it.
 * @param input - the observed root and the declared output folder.
 * @returns what was seen; never throws.
 */
export function readGreenfieldArtifacts(input: GreenfieldInput): GreenfieldRead {
  const base = resolveInside(input.root, input.outputFolder)
  if (base === null) return { ...NOTHING }

  const names = listNames(base)
  if (names === null) return { ...NOTHING }

  const present = new Set(names)
  const truncados: string[] = []

  /** The body of one present file, recording the ones that could not be read. */
  const bodyOf = (file: string): string | null => {
    if (!present.has(file)) return null
    const relative = `${input.outputFolder}/${file}`
    const abs = resolveInside(input.root, relative)
    const text = abs === null ? null : readText(abs)
    if (text === null) truncados.push(relative)
    return text
  }

  const briefMd = bodyOf(NEWPROJECT_BRIEF_FILE)
  const prdMd = bodyOf(PRD_FILE)
  const { specs, total } = specsOf(input, base)

  return {
    pasta: true,
    brief: present.has(NEWPROJECT_BRIEF_FILE),
    briefMd,
    ideacao: present.has(IDEATION_FILE),
    personas: present.has(PERSONAS_FILE),
    prd: present.has(PRD_FILE),
    prdMd,
    arquitetura: present.has(ARCHITECTURE_FILE),
    dominio: present.has(DOMAIN_FILE),
    specs,
    totalDeSpecs: total,
    truncados,
  }
}

/**
 * The `.md` names of the specs folder, in name order and up to the ceiling.
 *
 * `listNames` already sorts, and answers null for anything that is not a
 * directory, which is the whole of the directory test this module has. What
 * is not `.md` is not a spec and is not counted.
 * @param input - the observed root and the declared output folder.
 * @param base - the absolute output folder, already resolved inside the root.
 * @returns the names kept, and how many there were.
 */
function specsOf(input: GreenfieldInput, base: string): { specs: string[]; total: number } {
  const folder = resolveInside(input.root, `${input.outputFolder}/${SDD_FOLDER}`)
  if (folder === null || folder === base) return { specs: [], total: 0 }

  const names = listNames(folder)
  if (names === null) return { specs: [], total: 0 }

  const markdown = names.filter((name) => /\.md$/i.test(name))
  return { specs: markdown.slice(0, SPEC_CAP), total: markdown.length }
}
