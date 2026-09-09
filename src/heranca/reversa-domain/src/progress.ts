/* HERDADO: não editar sem declarar a adaptação em src/heranca/PROCEDENCIA.md
 * origem:      scrum-harness (https://github.com/iago-leal/scrum-harness)
 * caminho:     packages/reversa-domain/src/progress.ts
 * revisão:     420305daa6cdd10858b720a34cb8db67d8e5c5e9 (2026-09-08)
 * copiado em:  2026-09-09
 * adaptações:  nenhuma
 */
/**
 * The execution trail of `/reversa-coding` (comp-72 R11), read from the
 * append-only `progress.jsonl` of a feature.
 *
 * REVERSA never rewrites a line here, "mesmo se descobrir que ficaram
 * erradas": a mistake is corrected by appending a line with
 * `status: corrected`. That is the whole of the specification — the source
 * gives one prose sentence and no example anywhere in the repository — so
 * the targeting rule below is a DECLARED defensive choice, not a claim
 * about the framework: the target is the line's own `action`. A line that
 * also carries a key which might name a different target is preserved and
 * flagged rather than silently reinterpreted.
 * @module @scrum-harness/reversa-domain/progress
 */

import { AnomalyLog } from './anomaly.ts'
import type { Anomaly } from './anomaly.ts'
import { asRecord, asString, asStringList, stripBom } from './json.ts'

/** Keys that would suggest a target other than `action`, if REVERSA ever emitted one. */
const AMBIGUOUS_TARGET_KEYS = ['target', 'ref', 'action_id', 'target_action']
/** The keys of the documented minimal shape. */
const KNOWN_EVENT_KEYS = new Set(['ts', 'action', 'status', 'files'])

/** One appended event. */
export interface ProgressEvent {
  ts: string | null
  action: string
  status: string
  files: string[]
  extra: Record<string, unknown>
}

/** The reduction of every event of one action. */
export interface ActionProgress {
  action: string
  status: string
  files: string[]
  events: ProgressEvent[]
}

/** The trail as the panel shows it. */
export interface ProgressTrail {
  events: ProgressEvent[]
  byAction: ActionProgress[]
  anomalies: Anomaly[]
}

const FILE = 'progress.jsonl'

/** Reader for `progress.jsonl`. */
export const ProgressContract = {
  /**
   * Read the trail, ignoring corrupted lines instead of failing (R11).
   * @param jsonl - the file content, or null when it does not exist.
   */
  read(jsonl: string | null): ProgressTrail {
    const log = new AnomalyLog()
    if (jsonl === null) return { events: [], byAction: [], anomalies: log.list() }

    const events: ProgressEvent[] = []
    for (const raw of stripBom(jsonl).split('\n')) {
      const line = raw.trim()
      if (line === '') continue

      let parsed: unknown
      try {
        parsed = JSON.parse(line)
      } catch {
        log.add(FILE, 'linha-corrompida', line.slice(0, 80))
        continue
      }

      const record = asRecord(parsed)
      const action = record === null ? null : asString(record.action)
      const status = record === null ? null : asString(record.status)
      if (record === null || action === null || status === null) {
        log.add(FILE, 'linha-corrompida', line.slice(0, 80))
        continue
      }

      if (status === 'corrected' && AMBIGUOUS_TARGET_KEYS.some(key => key in record)) {
        log.add(FILE, 'corrected-alvo-ambiguo', action)
      }

      const extra: Record<string, unknown> = {}
      for (const [key, value] of Object.entries(record)) {
        if (!KNOWN_EVENT_KEYS.has(key)) extra[key] = value
      }

      events.push({ ts: asString(record.ts), action, status, files: asStringList(record.files), extra })
    }

    return { events, byAction: reduceByAction(events), anomalies: log.list() }
  },
}

/** Reduce the events per action, in first-seen order; the last line wins. */
function reduceByAction(events: readonly ProgressEvent[]): ActionProgress[] {
  const order: string[] = []
  const grouped = new Map<string, ProgressEvent[]>()

  for (const event of events) {
    const bucket = grouped.get(event.action)
    if (bucket === undefined) {
      order.push(event.action)
      grouped.set(event.action, [event])
    } else {
      bucket.push(event)
    }
  }

  return order.map(action => {
    const list = grouped.get(action) ?? []
    const last = list[list.length - 1]
    return { action, status: last?.status ?? '', files: last?.files ?? [], events: list }
  })
}
