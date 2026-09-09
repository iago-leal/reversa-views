/* HERDADO: não editar sem declarar a adaptação em src/heranca/PROCEDENCIA.md
 * origem:      scrum-harness (https://github.com/iago-leal/scrum-harness)
 * caminho:     packages/reversa-domain/src/actions.ts
 * revisão:     420305daa6cdd10858b720a34cb8db67d8e5c5e9 (2026-09-08)
 * copiado em:  2026-09-09
 * adaptações:  nenhuma
 */
/**
 * Counting the actions of a forward feature (comp-72 R10), from the
 * `actions.md` that `/reversa-to-do` writes and `/reversa-coding` ticks off.
 *
 * The scan is WHOLE-FILE, with no section filter, because that is what
 * `/reversa-forward` does — and `reversa-add` states the consequence
 * outright: "jamais deixe `[ ]` para trás, o `/reversa-forward` volta a
 * classificar a feature como `coding-em-progresso`". An open amendment
 * therefore reopens the feature. The `## Emendas` split this module reports
 * is ADDITIVE: richer than REVERSA's own view, and never allowed to change
 * the verdict it would reach.
 * @module @scrum-harness/reversa-domain/actions
 */

import { AnomalyLog } from './anomaly.ts'
import type { Anomaly } from './anomaly.ts'

/** An action row ends the table line with the canonical marker. */
const CLOSED_ROW = /\|\s*`?\[X\]`?\s*\|\s*$/
const OPEN_ROW = /\|\s*`?\[ \]`?\s*\|\s*$/
/** REVERSA only ever writes an uppercase X; a lowercase one is worth naming. */
const LOWERCASE_ROW = /\|\s*`?\[x\]`?\s*\|\s*$/
/** The heading `/reversa-add` appends its amendments under. */
const AMENDMENTS_HEADING = /^##\s+Emendas\s*$/i

/** The action tally of one feature. */
export interface ActionsScan {
  total: number
  fechadas: number
  abertas: number
  emendas: number
  hasOpen: boolean
  anomalies: Anomaly[]
}

const FILE = 'actions.md'

/**
 * Count the action rows of `actions.md` (R10).
 * @param md - the file content, or null when it does not exist.
 * @returns the tally, with amendments reported apart but counted in.
 */
export function scanActions(md: string | null): ActionsScan {
  const log = new AnomalyLog()
  if (md === null) {
    return { total: 0, fechadas: 0, abertas: 0, emendas: 0, hasOpen: false, anomalies: log.list() }
  }

  let fechadas = 0
  let abertas = 0
  let emendas = 0
  let inAmendments = false

  for (const raw of md.split('\n')) {
    const line = raw.trimEnd()
    if (AMENDMENTS_HEADING.test(line.trim())) {
      inAmendments = true
      continue
    }
    // Any other level-2 heading closes the amendments section.
    if (inAmendments && /^##\s+/.test(line.trim())) inAmendments = false

    const closed = CLOSED_ROW.test(line)
    const open = OPEN_ROW.test(line)
    if (!closed && !open) {
      if (LOWERCASE_ROW.test(line)) log.add(FILE, 'checkbox-nao-canonico', line.trim())
      continue
    }
    if (closed) fechadas += 1
    else abertas += 1
    if (inAmendments) emendas += 1
  }

  const total = fechadas + abertas
  if (total === 0) log.add(FILE, 'actions-sem-acoes')

  return { total, fechadas, abertas, emendas, hasOpen: abertas > 0, anomalies: log.list() }
}

/**
 * Count the open questions left in a feature's `requirements.md` (R10):
 * they are what decides between `/reversa-clarify` and `/reversa-plan`.
 * @param md - the file content, or null when it does not exist.
 */
export function countDoubts(md: string | null): number {
  if (md === null) return 0
  return (md.match(/\[DÚVIDA\]/g) ?? []).length
}
