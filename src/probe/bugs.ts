/**
 * The local probe over the bug registry (RF-11, RF-15, D-01, D-12, D-13).
 *
 * It is the twin of `probe/features.ts`, and for the same reason: the inherited
 * probe reads what REVERSA's own pointer names, and the registry is not among
 * those things. Walking it is new work, and this is where it lives.
 *
 * It touches no vendored file and imports no platform module. It reads through
 * the three functions the inherited probe already exports -- `listNames`,
 * `readText` and `resolveInside` -- so `node:fs` stays in the one file of the
 * whole repository that has it. Altering the inherited package would mean a new
 * stamp, a declared adaptation and a conflict at the next resynchronisation;
 * reusing what it exports costs none of that.
 *
 * WHERE IT DESCENDS, and where it deliberately does not. It walks each context,
 * descends only into `bugs/`, and in each bug folder lists the names ONCE --
 * which answers in a single pass both where the `bug.md` is and whether there is
 * a lock. It never descends into `generated/`, `intake/` or `inspections/`:
 * RF-11 forbids consuming the projection, and the other two hold nothing the
 * card draws. A panel that read the projection would show the past without
 * saying it is the past.
 *
 * Nothing here judges. It reads folders and files and hands the text over; what
 * a bug MEANS is `domain/bugs.ts`, which is the same cut the house already makes
 * between a probe that looks and a domain that decides.
 * @module probe/bugs
 */

import { listNames, readText, resolveInside } from '../heranca/reversa-probe/src/index.ts'
import { BUG_CAP, BUGS_FOLDER } from '../domain/limits.ts'

/** The only folder of a context this reading descends into (D-12). */
const BUGS_SUBFOLDER = 'bugs'

/** The source of truth of one bug, and the lock that closes it. */
const BUG_FILE = 'bug.md'
const LOCK_FILE = 'DONE.md'

/** What the probe needs to know before it can look. */
export interface BugFoldersInput {
  /** The absolute root being observed. */
  root: string
}

/** One context of the registry, whether or not it holds any bug. */
export interface BugContextRead {
  /** The bare folder name, which is how the registry organises itself. */
  contexto: string
  /** Path relative to the observed root. */
  pasta: string
}

/** One bug folder, as it was read from disk. */
export interface BugFolderRead {
  contexto: string
  /** Path of the context, relative to the observed root. */
  pastaDoContexto: string
  /** Path of the bug folder, relative to the observed root. */
  pasta: string
  /** The bare folder name, which the registry names after the identifier. */
  nome: string
  /** True when the listing showed a `bug.md`, whether or not it could be read. */
  temBugMd: boolean
  /** The text, or null when it is missing, unreadable or above the byte cap. */
  bugMd: string | null
  /** True when the listing showed a lock, which is the FACT of the closing. */
  temTrava: boolean
  travaMd: string | null
}

/** Everything read, and the probe's own account of the reading. */
export interface BugsRead {
  /** False when there is no registry folder at all, which is not a failure. */
  presente: boolean
  /** Every context, in name order, including the ones with no bug in them. */
  contextos: BugContextRead[]
  /** Every bug folder read, in context order and then in name order. */
  pastas: BugFolderRead[]
  /** True above the ceiling, so that the panel can declare the reading partial. */
  truncado: boolean
  /** How many bug folders exist, even when the ceiling stopped the reading short. */
  total: number
}

/** No registry at all, which is a named state and not a loss (RF-13). */
const AUSENTE: BugsRead = {
  presente: false,
  contextos: [],
  pastas: [],
  truncado: false,
  total: 0,
}

/**
 * Read the bug registry of the project, up to the ceiling.
 *
 * The ceiling applies to the READING, not to the counting: every bug folder is
 * counted, and only the first fifty are opened. That is what lets the card say
 * how many exist beside how many were read, which RF-15 asks for and a ceiling
 * that simply stopped counting could not give.
 *
 * Every failure becomes absence, never an exception: a folder that vanished
 * between the listing and the reading, a file above the byte cap and a path
 * that escapes the root all come back as a bug with nothing in it, and the
 * judgment layer turns each of those into a named anomaly.
 * @param input - the observed root.
 * @returns the contexts, the bug folders, and the account of the reading.
 */
export function readBugFolders(input: BugFoldersInput): BugsRead {
  const base = resolveInside(input.root, BUGS_FOLDER)
  if (base === null) return { ...AUSENTE }

  const nomes = listNames(base)
  if (nomes === null) return { ...AUSENTE }

  const contextos: BugContextRead[] = []
  const pastas: BugFolderRead[] = []
  let total = 0

  for (const contexto of nomes) {
    const pastaDoContexto = `${BUGS_FOLDER}/${contexto}`
    const abs = resolveInside(input.root, pastaDoContexto)
    // A name that is not a directory is not a context: `listNames` answers null
    // for anything that is not one, which is the directory test this module has
    // without reaching for a platform module of its own.
    if (abs === null || listNames(abs) === null) continue

    contextos.push({ contexto, pasta: pastaDoContexto })

    // The one descent of the whole walk. A context with no `bugs/` folder is a
    // context with no bug, and not a loss to report.
    const dentro = resolveInside(input.root, `${pastaDoContexto}/${BUGS_SUBFOLDER}`)
    const bugs = dentro === null ? null : listNames(dentro)
    if (bugs === null) continue

    for (const nome of bugs) {
      const pasta = `${pastaDoContexto}/${BUGS_SUBFOLDER}/${nome}`
      const pastaAbs = resolveInside(input.root, pasta)
      const arquivos = pastaAbs === null ? null : listNames(pastaAbs)
      if (arquivos === null) continue

      total += 1
      if (pastas.length >= BUG_CAP) continue

      // One listing answers both questions, which is the whole of D-12: where
      // the source of truth is, and whether the lock is there.
      const temBugMd = arquivos.includes(BUG_FILE)
      const temTrava = arquivos.includes(LOCK_FILE)

      pastas.push({
        contexto,
        pastaDoContexto,
        pasta,
        nome,
        temBugMd,
        bugMd: temBugMd ? fileOf(input.root, pasta, BUG_FILE) : null,
        temTrava,
        travaMd: temTrava ? fileOf(input.root, pasta, LOCK_FILE) : null,
      })
    }
  }

  return { presente: true, contextos, pastas, truncado: total > pastas.length, total }
}

/**
 * One file of one bug folder, or its absence.
 * @param root - the observed root.
 * @param relative - the bug folder, relative to the root.
 * @param name - the file inside it.
 * @returns the text, or null when it is missing, unreadable or too big.
 */
function fileOf(root: string, relative: string, name: string): string | null {
  const abs = resolveInside(root, `${relative}/${name}`)
  return abs === null ? null : readText(abs)
}
