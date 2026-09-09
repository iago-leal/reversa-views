/* HERDADO: não editar sem declarar a adaptação em src/heranca/PROCEDENCIA.md
 * origem:      scrum-harness (https://github.com/iago-leal/scrum-harness)
 * caminho:     packages/reversa-domain/src/glob.ts
 * revisão:     420305daa6cdd10858b720a34cb8db67d8e5c5e9 (2026-09-08)
 * copiado em:  2026-09-09
 * adaptações:  nenhuma
 */
/**
 * The glob semantics of REVERSA's legacy-write policy (comp-72 R7).
 *
 * This is a DELIBERATE TRANSCRIPTION of `globToRegex` and `isValidPattern`
 * from `templates/hooks/check-legacy-policy.mjs` (v1.3.3), kept in its own
 * module so the fidelity is visible and defended by `hook-parity.spec.ts`,
 * which diffs us against the shipped hook itself.
 *
 * Two details are easy to get wrong and are load-bearing here:
 *
 *  1. A bare directory pattern frees nothing below it. `src` compiles to
 *     `/^src$/`, so `src/a.js` is refused; only `src/**` frees the tree.
 *     This one is real, and preserved on purpose.
 *  2. The `**` sentinel is a NUL byte (`\0`), NOT a space. A literal space
 *     in a pattern therefore stays a literal space. An earlier draft of
 *     this module assumed a space sentinel — reading a terminal dump that
 *     rendered NUL as blank — and wrongly concluded that spaces widened
 *     into `**`. The parity test is what caught it; keep the `\0`.
 *
 * "Fixing" this transcription would make the panel lie about the hook. If
 * REVERSA changes its matcher, this module changes with it — and the parity
 * test is the alarm that the framework moved.
 * @module @scrum-harness/reversa-domain/glob
 */

/**
 * Compile an `allowedPaths` pattern exactly as the REVERSA hook compiles it.
 * @param pattern - the glob, relative to the project root.
 * @returns the anchored, case-sensitive regular expression the hook would build.
 */
export function globToRegex(pattern: string): RegExp {
  const escaped = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*\*/g, '\0')
    .replace(/\*/g, '[^/]*')
    .replace(/\?/g, '[^/]')
    .replace(/\0/g, '.*')
  return new RegExp(`^${escaped}$`)
}

/**
 * Decide whether a pattern is usable, as the hook does: patterns that
 * escape the project root are ignored rather than honoured.
 * @param pattern - the raw entry from `allowedPaths`.
 * @returns true when the pattern is root-relative and non-empty.
 */
export function isValidPattern(pattern: string): boolean {
  if (typeof pattern !== 'string' || pattern.length === 0) return false
  if (pattern.startsWith('/') || /^[A-Za-z]:/.test(pattern)) return false
  if (pattern.split('/').includes('..')) return false
  return true
}
