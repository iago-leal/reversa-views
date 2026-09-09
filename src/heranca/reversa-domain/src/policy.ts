/* HERDADO: não editar sem declarar a adaptação em src/heranca/PROCEDENCIA.md
 * origem:      scrum-harness (https://github.com/iago-leal/scrum-harness)
 * caminho:     packages/reversa-domain/src/policy.ts
 * revisão:     420305daa6cdd10858b720a34cb8db67d8e5c5e9 (2026-09-08)
 * copiado em:  2026-09-09
 * adaptações:  nenhuma
 */
/**
 * The legacy-write policy of REVERSA as domain data (comp-72 R4, R5, R6).
 *
 * REVERSA promises the legacy project is never touched, with one exception
 * the user alone controls: `.reversa/reversa-config.json`. That file is
 * invisible in the terminal today, so a human cannot see how far the agents
 * may reach into their own code — which is the gap this contract closes.
 *
 * {@link PolicyContract.verdict} reproduces the decision of the official
 * `PreToolUse` hook BRANCH BY BRANCH AND IN ITS ORDER, because the order is
 * itself a rule: the config file is refused *before* the writable-folder
 * check, so the one path living inside `.reversa/` that is nonetheless
 * forbidden stays forbidden. Failure is always safe — an absent, invalid or
 * mistyped config denies, never frees.
 * @module @scrum-harness/reversa-domain/policy
 */

import type { AnomalyCode } from './anomaly.ts'
import { globToRegex, isValidPattern } from './glob.ts'
import { asRecord, asStringList, parseJsonSafe } from './json.ts'

/** The path REVERSA refuses to let an agent write, whatever else is true. */
export const CONFIG_PATH = '.reversa/reversa-config.json'

/** The folders REVERSA may always write to, before the user's policy is consulted. */
export interface FolderSources {
  outputFolder: string
  forwardFolder: string
}

/** The three outcomes of a write question. `fora-de-jurisdicao` is not permission. */
export type Outcome = 'permitido' | 'proibido' | 'fora-de-jurisdicao'

/** Why the verdict came out the way it did — one reason per branch of the hook. */
export type VerdictReason =
  | 'fora-da-raiz'
  | 'config-e-ato-do-usuario'
  | 'pasta-do-reversa'
  | 'politica-desligada'
  | 'liberacao-irrestrita'
  | 'todos-os-padroes-invalidos'
  | 'casa-padrao'
  | 'fora-dos-padroes'

/** A decision about one path. */
export interface Verdict {
  outcome: Outcome
  reason: VerdictReason
}

/** The user-owned configuration, as read (never as written). */
export interface PolicyConfig {
  version: number | null
  allowLegacyEdits: boolean
  allowedPaths: string[]
  cause: AnomalyCode | null
}

/**
 * The six folders REVERSA always owns, in the hook's order and WITHOUT the
 * trailing slash: `policy.js` renders them with one for display, but the
 * hook compares them bare, and the comparison is what decides.
 * @param sources - the folder names resolved from `state.json`.
 * @returns the writable folders, bare.
 */
export function writableFolders(sources: Partial<FolderSources>): string[] {
  const output = typeof sources.outputFolder === 'string' && sources.outputFolder.length > 0 ? sources.outputFolder : '_reversa_sdd'
  const forward = typeof sources.forwardFolder === 'string' && sources.forwardFolder.length > 0 ? sources.forwardFolder : '_reversa_forward'
  return ['.reversa', output, '_reversa_docs', forward, '_reversa_bugs', '_reversa_refactor']
}

/** Normalize a queried path the way the hook normalizes `rel`. */
function normalize(path: string): string {
  return path.trim().replaceAll('\\', '/').replace(/\/{2,}/g, '/').replace(/\/$/, '')
}

/** A path that leaves the project root is outside the policy's jurisdiction. */
function escapesRoot(path: string): boolean {
  if (path.startsWith('/') || /^[A-Za-z]:/.test(path)) return true
  return path.split('/').includes('..')
}

/** The legacy-write policy, read from `.reversa/reversa-config.json`. */
export class PolicyContract {
  private constructor(
    readonly version: number | null,
    readonly allowLegacyEdits: boolean,
    readonly allowedPaths: string[],
    readonly cause: AnomalyCode | null,
    private readonly folders: readonly string[],
  ) {}

  /**
   * Read the policy, failing safe on every unreadable shape.
   * @param json - the content of `.reversa/reversa-config.json`, or null when absent.
   * @param folders - the writable folders from {@link writableFolders}.
   */
  static read(json: string | null, folders: readonly string[]): PolicyContract {
    const { value, cause } = parseJsonSafe(json)
    if (cause !== null) return new PolicyContract(null, false, [], cause, folders)

    const record = asRecord(value)
    if (record === null) return new PolicyContract(null, false, [], 'tipo-invalido', folders)

    const version = typeof record.version === 'number' ? record.version : null
    const allowed = asStringList(record.allowedPaths)

    // The hook accepts nothing but a literal `true`; anything else is false.
    if (record.allowLegacyEdits !== true) {
      const mistyped = record.allowLegacyEdits !== false && record.allowLegacyEdits !== undefined
      return new PolicyContract(version, false, allowed, mistyped ? 'tipo-invalido' : null, folders)
    }
    return new PolicyContract(version, true, allowed, null, folders)
  }

  /** True when the raw list held entries but none of them survived validation. */
  private allPatternsInvalid(): boolean {
    return this.allowedPaths.length > 0 && this.allowedPaths.filter(isValidPattern).length === 0
  }

  /**
   * Decide whether REVERSA would let an agent write to a path, and why.
   * The branch order mirrors the hook's `main()` and is normative.
   * @param path - a path relative to the project root.
   */
  verdict(path: string): Verdict {
    const rel = normalize(path)

    // 1. Outside the root: the hook exits silently — not a permission.
    if (rel === '' || escapesRoot(rel)) return { outcome: 'fora-de-jurisdicao', reason: 'fora-da-raiz' }

    // 2. The config file itself, checked BEFORE the folders that contain it.
    if (rel === CONFIG_PATH) return { outcome: 'proibido', reason: 'config-e-ato-do-usuario' }

    // 3. REVERSA's own folders are always writable.
    for (const folder of this.folders) {
      if (rel === folder || rel.startsWith(`${folder}/`)) return { outcome: 'permitido', reason: 'pasta-do-reversa' }
    }

    // 4. Policy off (or unreadable): safe failure.
    if (!this.allowLegacyEdits) return { outcome: 'proibido', reason: 'politica-desligada' }

    // 5. Policy on with no list: the whole project is freed.
    if (this.allowedPaths.length === 0) return { outcome: 'permitido', reason: 'liberacao-irrestrita' }

    // 6. A list that exists but is entirely unusable: safe failure, not freedom.
    if (this.allPatternsInvalid()) return { outcome: 'proibido', reason: 'todos-os-padroes-invalidos' }

    // 7. Any surviving pattern that matches frees the path.
    for (const pattern of this.allowedPaths) {
      if (isValidPattern(pattern) && globToRegex(pattern).test(rel)) {
        return { outcome: 'permitido', reason: 'casa-padrao' }
      }
    }

    // 8. Otherwise refused.
    return { outcome: 'proibido', reason: 'fora-dos-padroes' }
  }
}
