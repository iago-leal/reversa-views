/* HERDADO: não editar sem declarar a adaptação em src/heranca/PROCEDENCIA.md
 * origem:      scrum-harness (https://github.com/iago-leal/scrum-harness)
 * caminho:     packages/reversa-domain/src/watch.ts
 * revisão:     420305daa6cdd10858b720a34cb8db67d8e5c5e9 (2026-09-08)
 * copiado em:  2026-09-09
 * adaptações:  A12, A13, A14, A15, A16
 */
/**
 * The regression watch a delivery leaves behind (comp-73 R5, R6), read from
 * the `regression-watch.md` of a forward feature.
 *
 * The section split carries the meaning. REVERSA is explicit that rules
 * which were originally 🟡 or 🔴 go to `Observações` "sem peso de
 * regressão" — counting those as watch items would inflate the risk the
 * panel reports. `Arquivadas` and the re-extraction history are likewise
 * kept out of the live watch: they are memory, not obligation.
 * @module @scrum-harness/reversa-domain/watch
 */

import { AnomalyLog } from './anomaly.ts'
import type { Anomaly } from './anomaly.ts'
import { canonicalOf, cellsOf, findTable, matchesHeader, splitSections } from './table.ts'

/** How a watch item is meant to be checked (`reversa-coding/SKILL.md:130-133`). */
export const VERIFICATION_TYPES = ['ausência', 'redação', 'presença', 'confidência'] as const

/** The columns of the watch table (`reversa-coding/SKILL.md:137`). */
const WATCH_HEADER = [
  'ID',
  'Origem (arquivo, seção)',
  'Regra esperada após mudança',
  'Tipo de verificação',
  'Sinal de violação',
] as const

/** One rule to keep an eye on across re-extractions. */
export interface WatchItem {
  id: string
  origem: string
  regra: string
  tipo: string
  sinal: string
}

/** The watch axis of one feature. */
export interface WatchState {
  items: WatchItem[]
  observacoes: WatchItem[]
  arquivadas: WatchItem[]
  historico: string
  anomalies: Anomaly[]
}

const FILE = 'regression-watch.md'

/** Reader for `regression-watch.md`. */
export const WatchContract = {
  /**
   * Read the live watch and the three sections that are not it.
   * @param md - the artifact text, or null when it does not exist.
   */
  read(md: string | null): WatchState {
    const log = new AnomalyLog()
    if (md === null) {
      return { items: [], observacoes: [], arquivadas: [], historico: '', anomalies: log.list() }
    }

    // A15 (BUG-20260914-5UH7): a section is known by how its heading BEGINS,
    // and every section that is none of the three memory ones is live watch,
    // the preamble included. REVERSA prescribes "header, table, history,
    // archived" and never forbids a heading over the table, which is where
    // agents put it. What cannot be read is said, not dropped: a table in
    // Observações or Arquivadas that is not a watch table, and a file with
    // no watch table at all. Other tables around the live watch (a metadata
    // grid under the title, say) are not the reader's business.
    const sections = splitSections(md)
    const byKind: Record<SectionKind, string[]> = { live: [], observacoes: [], arquivadas: [], historico: [] }
    let recognized = false
    let foreign = false
    for (const [heading, text] of Object.entries(sections)) {
      const kind = kindOf(heading)
      byKind[kind].push(text)
      if (kind === 'historico') continue
      const headers = tableHeaders(text)
      if (headers.some(cells => matchesHeader(cells, WATCH_HEADER))) {
        recognized = true
      } else if (kind !== 'live' && headers.length > 0) {
        foreign = true
        log.add(FILE, 'tabela-nao-reconhecida', `${heading}: ${headers[0]?.join(' | ')}`)
      }
    }
    if (!recognized && !foreign) log.add(FILE, 'tabela-nao-reconhecida', 'nenhuma tabela de vigia')

    const items = byKind.live.flatMap(text => rowsOf(text, log))
    const observacoes = byKind.observacoes.flatMap(text => rowsOf(text, log))
    const arquivadas = byKind.arquivadas.flatMap(text => rowsOf(text, log))
    const historico = byKind.historico.join('').trim()

    return { items, observacoes, arquivadas, historico, anomalies: log.list() }
  },
}

/** Where a section's rows belong. */
type SectionKind = 'live' | 'observacoes' | 'arquivadas' | 'historico'

/** A normalized heading, classified by how it begins. */
function kindOf(heading: string): SectionKind {
  if (heading.startsWith('observacoes')) return 'observacoes'
  if (heading.startsWith('arquivadas')) return 'arquivadas'
  if (heading.startsWith('historico')) return 'historico'
  return 'live'
}

/** The header rows of a section's tables: a row followed by a separator. */
function tableHeaders(text: string): string[][] {
  const lines = text.split('\n')
  const out: string[][] = []
  for (let index = 0; index + 1 < lines.length; index += 1) {
    const cells = cellsOf(lines[index] ?? '')
    const next = cellsOf(lines[index + 1] ?? '')
    if (cells.length > 0 && next.length > 0 && next.every(cell => /^:?-+:?$/.test(cell))) out.push(cells)
  }
  return out
}

/** Read one section's watch table, flagging unknown verification types. */
function rowsOf(section: string | null, log: AnomalyLog): WatchItem[] {
  const rows = findTable(section, WATCH_HEADER)
  const out: WatchItem[] = []
  for (const row of rows) {
    if (row.length < WATCH_HEADER.length) continue
    // A16 (BUG-20260914-5UH7): a row of dashes only is how an agent writes
    // "no item yet" in the table REVERSA mandates; it is not an item.
    if (row.every(cell => /^[—–-]$/.test(cell))) continue
    const [id = '', origem = '', regra = '', tipoCell = '', sinal = ''] = row
    // A13 (BUG-20260914-DTLI): the verification type is read through notation.
    const tipo = canonicalOf(tipoCell, VERIFICATION_TYPES)
    if (tipo === null) log.add(FILE, 'tipo-de-verificacao-desconhecido', tipoCell)
    out.push({ id, origem, regra, tipo: tipo ?? tipoCell, sinal })
  }
  return out
}
