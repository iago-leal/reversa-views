/* HERDADO: não editar sem declarar a adaptação em src/heranca/PROCEDENCIA.md
 * origem:      scrum-harness (https://github.com/iago-leal/scrum-harness)
 * caminho:     packages/reversa-domain/src/impact.ts
 * revisão:     420305daa6cdd10858b720a34cb8db67d8e5c5e9 (2026-09-08)
 * copiado em:  2026-09-09
 * adaptações:  nenhuma
 */
/**
 * What REVERSA actually touched in the legacy code (comp-73 R1, R3, R4, R7),
 * read from the `legacy-impact.md` that `/reversa-coding` leaves behind.
 *
 * This is the axis the panel exists for. The framework's promise is that
 * the legacy is only edited under a policy the user controls; this file is
 * the receipt of what that permission was spent on, and today it sits
 * unread inside a feature folder.
 *
 * The scenario rule is deliberately dumb, and that is the point. An earlier
 * draft inferred greenfield from three symptoms — empty watch, filled
 * `Observações`, everything `componente-novo` — until review showed that
 * REVERSA MANDATES 🟡/🔴 rules go to `Observações`, so a legitimate legacy
 * feature that only adds components satisfies all three by rule. The header
 * note is written on every greenfield run, so its absence is the evidence
 * and no inference is needed.
 * @module @scrum-harness/reversa-domain/impact
 */

import { AnomalyLog } from './anomaly.ts'
import type { Anomaly } from './anomaly.ts'
import { findTable, normalizeCell } from './table.ts'

/** The impact taxonomy `/reversa-coding` uses, reused verbatim by `/reversa-sync`. */
export const IMPACT_TYPES = [
  'regra-alterada',
  'regra-removida',
  'regra-nova',
  'componente-novo',
  'componente-extinto',
  'delta-de-dados',
  'delta-de-contrato-externo',
] as const

/** Severities aligned with `/reversa-audit`, most serious first. */
export const SEVERITIES = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const

/** The columns of the impact table (`reversa-coding/SKILL.md:115`). */
const IMPACT_HEADER = ['Arquivo afetado', 'Componente', 'Tipo', 'Severidade', 'Justificativa'] as const

/** The sentence REVERSA writes in the header of every greenfield run. */
const GREENFIELD_NOTE = normalizeCell('Feature greenfield, sem legado pré-existente')

/** Whether the delivery had a legacy to impact at all. */
export type Scenario = 'legado' | 'greenfield'

/** One affected file, as the artifact records it. */
export interface ImpactedFile {
  arquivo: string
  componente: string
  tipo: string
  severidade: string
  justificativa: string
}

/** One tally line: canonical members always present, unknowns appended. */
export interface Tally {
  key: string
  count: number
  canonical: boolean
}

/** The impact axis of one feature. */
export interface ImpactState {
  files: ImpactedFile[]
  cenario: Scenario
  bySeverity: Tally[]
  byType: Tally[]
  anomalies: Anomaly[]
}

const FILE = 'legacy-impact.md'

/** Reader for `legacy-impact.md`. */
export const ImpactContract = {
  /**
   * Read the impact table and classify the delivery's scenario.
   * @param md - the artifact text, or null when it does not exist.
   */
  read(md: string | null): ImpactState {
    const log = new AnomalyLog()
    const cenario = readScenario(md)

    if (md === null) {
      return { files: [], cenario, bySeverity: tally([], SEVERITIES), byType: tally([], IMPACT_TYPES), anomalies: log.list() }
    }

    const rows = findTable(md, IMPACT_HEADER)
    if (rows.length === 0 && !hasHeader(md)) log.add(FILE, 'tabela-nao-reconhecida')

    const files: ImpactedFile[] = []
    for (const row of rows) {
      if (row.length < IMPACT_HEADER.length) {
        log.add(FILE, 'linha-de-impacto-incompleta', row.join(' | '))
        continue
      }
      const [arquivo = '', componente = '', tipo = '', severidade = '', justificativa = ''] = row
      if (!(IMPACT_TYPES as readonly string[]).includes(tipo)) log.add(FILE, 'tipo-de-impacto-desconhecido', tipo)
      if (!(SEVERITIES as readonly string[]).includes(severidade)) log.add(FILE, 'severidade-desconhecida', severidade)
      files.push({ arquivo, componente, tipo, severidade, justificativa })
    }

    // The note is authoritative, but a shape that contradicts it is worth saying.
    if (cenario === 'greenfield' && files.some(file => file.tipo !== 'componente-novo')) {
      log.add(FILE, 'cenario-ambiguo', 'nota de greenfield com impacto que não é componente-novo')
    }

    return {
      files,
      cenario,
      bySeverity: tally(files.map(f => f.severidade), SEVERITIES),
      byType: tally(files.map(f => f.tipo), IMPACT_TYPES),
      anomalies: log.list(),
    }
  },
}

/** True when the impact table's header is present at all. */
function hasHeader(md: string): boolean {
  const want = IMPACT_HEADER.map(normalizeCell).join('|')
  return md.split('\n').some(line => {
    const trimmed = line.trim()
    if (!trimmed.startsWith('|')) return false
    const cells = trimmed.replace(/^\|/, '').replace(/\|$/, '').split('|').map(cell => normalizeCell(cell))
    return cells.join('|') === want
  })
}

/** The header note decides; its absence means there was a legacy. */
function readScenario(md: string | null): Scenario {
  if (md === null) return 'legado'
  return normalizeCell(md).includes(GREENFIELD_NOTE) ? 'greenfield' : 'legado'
}

/** Count values, keeping canonical members (even at zero) ahead of unknowns. */
function tally(values: readonly string[], canonical: readonly string[]): Tally[] {
  const counts = new Map<string, number>()
  for (const key of canonical) counts.set(key, 0)
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1)

  const canonicalSet = new Set<string>(canonical)
  const out: Tally[] = canonical.map(key => ({ key, count: counts.get(key) ?? 0, canonical: true }))
  for (const [key, count] of counts) {
    if (!canonicalSet.has(key)) out.push({ key, count, canonical: false })
  }
  return out
}
