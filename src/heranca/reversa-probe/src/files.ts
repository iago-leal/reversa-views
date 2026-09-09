/* HERDADO: não editar sem declarar a adaptação em src/heranca/PROCEDENCIA.md
 * origem:      scrum-harness (https://github.com/iago-leal/scrum-harness)
 * caminho:     packages/reversa-probe/src/files.ts
 * revisão:     420305daa6cdd10858b720a34cb8db67d8e5c5e9 (2026-09-08)
 * copiado em:  2026-09-09
 * adaptações:  nenhuma
 */
/**
 * The only layer of the REVERSA panel that touches the disk (comp-74 R2,
 * R4-R7). Three functions, all read-only, all failing into absence.
 *
 * `listNames` is deliberately NOT the house's `listWorkspaceFiles`: that one
 * skips dot-prefixed names — and REVERSA keeps everything in `.reversa/` and
 * a hidden `.state.json` — returns path-prefixed entries and descends into
 * subfolders, while the Model compares BARE BASENAMES in a `Set`. Reusing it
 * would make every feature report stage `requirements` forever, silently.
 *
 * The `null` vs `[]` distinction is load-bearing and not a style choice:
 * `null` means the directory is absent (the Model reads that as "no active
 * feature"), `[]` means it exists and is empty ("feature-dir vazia").
 * @module @scrum-harness/reversa-probe/files
 */

import { readdirSync, readFileSync, statSync } from 'node:fs'
import { isAbsolute, resolve, sep } from 'node:path'

/** Bytes above which a file is not read, matching the house's `SPEC_FILE_CAP`. */
export const REVERSA_FILE_CAP = 256 * 1024

/**
 * Read a text file, treating every failure as absence (R5, R7).
 * @param abs - absolute path.
 * @param cap - byte ceiling; a bigger file is refused rather than read.
 * @returns the text, or null when it is missing, unreadable or too big.
 */
export function readText(abs: string, cap: number = REVERSA_FILE_CAP): string | null {
  try {
    const stat = statSync(abs)
    if (!stat.isFile()) return null
    if (stat.size > cap) return null
    return readFileSync(abs, 'utf8')
  } catch {
    return null
  }
}

/**
 * List the entries of a directory as bare basenames, without descending (R2).
 * @param abs - absolute path.
 * @returns the names, or null when the directory does not exist or is not one.
 */
export function listNames(abs: string): string[] | null {
  try {
    const stat = statSync(abs)
    if (!stat.isDirectory()) return null
  } catch {
    return null
  }
  try {
    return readdirSync(abs).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))
  } catch {
    return null
  }
}

/**
 * Resolve a REVERSA-declared relative path inside the workspace (R6).
 *
 * The containment check is LEXICAL, with no `realpath` on either side: on
 * macOS the `/var` → `/private/var` symlink would otherwise put a temporary
 * workspace "outside" itself. The accepted, declared consequence is that a
 * symlink inside the root can still point out of it — tolerable for a reader
 * that never writes.
 * @param root - the absolute workspace root.
 * @param candidate - the path REVERSA wrote (expected relative to the root).
 * @returns the absolute path, or null when it escapes the root.
 */
export function resolveInside(root: string, candidate: string): string | null {
  if (typeof candidate !== 'string' || candidate.trim() === '') return null
  if (isAbsolute(candidate) || /^[A-Za-z]:/.test(candidate)) return null
  const base = resolve(root)
  const abs = resolve(base, candidate)
  if (abs !== base && !abs.startsWith(base + sep)) return null
  return abs
}
