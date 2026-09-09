/* HERDADO: não editar sem declarar a adaptação em src/heranca/PROCEDENCIA.md
 * origem:      scrum-harness (https://github.com/iago-leal/scrum-harness)
 * caminho:     packages/reversa-domain/src/watch.ts
 * revisão:     420305daa6cdd10858b720a34cb8db67d8e5c5e9 (2026-09-08)
 * copiado em:  2026-09-09
 * adaptações:  nenhuma
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
import { findTable, normalizeCell, splitSections } from './table.ts'

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

    const sections = splitSections(md)
    const items = rowsOf(sections[''] ?? null, log)
    const observacoes = rowsOf(sections[normalizeCell('Observações')] ?? null, log)
    const arquivadas = rowsOf(sections[normalizeCell('Arquivadas')] ?? null, log)
    const historico = (sections[normalizeCell('Histórico de re-extrações')] ?? '').trim()

    return { items, observacoes, arquivadas, historico, anomalies: log.list() }
  },
}

/** Read one section's watch table, flagging unknown verification types. */
function rowsOf(section: string | null, log: AnomalyLog): WatchItem[] {
  const rows = findTable(section, WATCH_HEADER)
  const out: WatchItem[] = []
  for (const row of rows) {
    if (row.length < WATCH_HEADER.length) continue
    const [id = '', origem = '', regra = '', tipo = '', sinal = ''] = row
    if (!(VERIFICATION_TYPES as readonly string[]).includes(tipo)) {
      log.add(FILE, 'tipo-de-verificacao-desconhecido', tipo)
    }
    out.push({ id, origem, regra, tipo, sinal })
  }
  return out
}
