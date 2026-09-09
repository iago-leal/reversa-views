/**
 * The consultable summary of the project, as text (RF-12, RF-17, D-11).
 *
 * It is composed HERE, on the screen, and travels ready to the host, which
 * only hands it to the editor. Two reasons, and both are held by a suite: the
 * boundary suite forbids the host from containing a REVERSA path or a stage
 * name, so composing it there would break the frontier; and the readable
 * labels already live on this side.
 *
 * It is a pure function of the payload. Determinism is a requirement and not a
 * convenience: the same summary is opened as a document and copied to the
 * clipboard, and a text that consulted the clock would make the two differ
 * within the same session.
 *
 * What it summarises is the DERIVABLE part of a handoff: what each feature
 * delivered and where the current one stopped. The judgement in prose that a
 * handwritten handoff carries stays human work, and this text does not try to
 * imitate it.
 * @module webview/domain/summary
 */

import type { HistoryEntry } from '../../domain/types.ts'
import type { SetProcessData } from '../../host/protocol.ts'
import { brasiliaInstant } from './instants.ts'
import { markLabel, situationLabel, stageLabel } from './labels.ts'

/** The title of the document, which is also the first line of the text. */
const TITLE = 'Reversa'

/**
 * Compose the summary of one reading.
 * @param payload - the reading the host sent.
 * @returns the whole text, ready to travel.
 */
export function summaryText(payload: SetProcessData): string {
  const { process } = payload
  const lines: string[] = []

  lines.push(`${TITLE} — ${process.discovery.project ?? 'projeto não declarado'}`)
  lines.push('')
  lines.push(`Lido em ${brasiliaInstant(payload.readAt).text}`)
  lines.push(`Raiz observada: ${payload.root}`)
  lines.push('')

  lines.push('## Feature ativa')
  lines.push('')
  lines.push(...activeLines(payload))
  lines.push('')

  lines.push('## Entregas anteriores')
  lines.push('')
  lines.push(...historyLines(payload))
  lines.push('')

  return lines.join('\n')
}

/**
 * What the active feature is and how far it got.
 * @param payload - the reading.
 * @returns the lines, never empty and never a dangling label.
 */
function activeLines(payload: SetProcessData): string[] {
  const { forward } = payload.process
  const name = forward.shortName ?? forward.featureDir
  if (name === null) return ['Nenhuma feature ativa registrada.']

  const stage = stageLabel(forward.stage)
  const { total, fechadas, abertas, emendas } = forward.actions
  const lines = [
    `${name} — ${stage.known ? stage.text : `${stage.raw} (rótulo desconhecido)`}`,
    `${fechadas} de ${total} ações fechadas, ${abertas} abertas, ${emendas} emendas`,
  ]

  const next = payload.decomposition?.acoes.find((acao) => !acao.fechada)
  lines.push(
    next === undefined
      ? 'Nenhuma ação aberta na decomposição lida.'
      : `Próxima ação: ${next.id} — ${next.descricao}`,
  )
  lines.push(`Dúvidas em aberto: ${forward.doubts}`)

  return lines
}

/**
 * One line per feature folder, newest first, as the history ordered them.
 * @param payload - the reading.
 * @returns the lines, or the declaration that there is no feature at all.
 */
function historyLines(payload: SetProcessData): string[] {
  const history = payload.history
  if (history === undefined || history.entradas.length === 0) {
    return ['Nenhuma feature entregue até aqui.']
  }

  const lines = history.entradas.map(entryLine)
  if (history.truncado) {
    lines.push(`Lista truncada: ${history.total} pastas de feature no projeto.`)
  }
  return lines
}

/**
 * One feature of the history, in one line.
 * @param entry - the feature as the domain judged it.
 * @returns the line.
 */
function entryLine(entry: HistoryEntry): string {
  const name = entry.id === null ? (entry.nomeCurto ?? entry.pasta) : `${entry.id}-${entry.nomeCurto}`
  const mark = markLabel(entry.marca)
  const parts = [
    name,
    situationLabel(entry.situacao).text,
    `${entry.acoes.fechadas} de ${entry.acoes.total} ações`,
  ]
  if (mark.text !== '') parts.splice(2, 0, mark.text)
  if (entry.resumo !== null) parts.push(entry.resumo)

  return `- ${parts.join(' — ')}`
}
