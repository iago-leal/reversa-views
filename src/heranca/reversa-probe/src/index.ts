/* HERDADO: não editar sem declarar a adaptação em src/heranca/PROCEDENCIA.md
 * origem:      scrum-harness (https://github.com/iago-leal/scrum-harness)
 * caminho:     packages/reversa-probe/src/index.ts
 * revisão:     420305daa6cdd10858b720a34cb8db67d8e5c5e9 (2026-09-08)
 * copiado em:  2026-09-09
 * adaptações:  A3
 */
/**
 * Disk probe for the REVERSA panel (v0.29, comp-74).
 *
 * The Controller of the panel: it resolves the workspace, reads the files
 * REVERSA leaves behind, and hands a plain `ReversaSnapshot` to
 * `@scrum-harness/reversa-domain`, which owns every rule. The same cut the
 * house already makes between `@scrum-harness/domain` and
 * `@scrum-harness/probe` — the probe looks, the domain judges.
 *
 * Read-only by construction: `node:fs` appears in `files.ts` and nowhere
 * else, only `readFileSync`/`readdirSync`/`statSync` are used, and nothing
 * that writes, creates, removes or executes is exposed. That matters here
 * more than usual: REVERSA's safety story rests on the legacy being edited
 * solely under a policy the user controls, and `.reversa/reversa-config.json`
 * is explicitly the user's act alone. This package reads it and never touches
 * it.
 * @module @scrum-harness/reversa-probe
 */

export { listNames, readText, REVERSA_FILE_CAP, resolveInside } from './files.ts'
export { readReversaSnapshot, REVERSA_ADDENDA_CAP } from './snapshot.ts'
export type { ProbeReport, ProbeResult, Refusal } from './snapshot.ts'
