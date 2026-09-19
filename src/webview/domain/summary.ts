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

import type {
  GreenfieldAxis,
  HistoryEntry,
  PlannedComponent,
  UnspecifiedComponent,
} from '../../domain/types.ts'
import type { SetProcessData } from '../../host/protocol.ts'
import { brasiliaInstant } from './instants.ts'
import {
  componentSituationLabel,
  conferenceStateLabel,
  greenfieldStageLabel,
  markLabel,
  situationLabel,
  stageLabel,
} from './labels.ts'
import { pipelineStarted } from './origin-view.ts'
import { panoramaView } from './panorama-view.ts'

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

  // The block of feature 009 comes AFTER everything that was here: the text a
  // reader compared yesterday keeps its lines in their places (RF-19).
  lines.push('## Panorama do produto')
  lines.push('')
  lines.push(...panoramaLines(payload.greenfield))
  lines.push('')

  return lines.join('\n')
}

/**
 * What the product is made of, as the panorama card draws it (RF-19).
 *
 * The same pure function orders the components here and on the card, so the
 * two never disagree. Absent axis, legacy project and empty specs folder are
 * three sentences, as on the card, and none of them is a dangling label.
 * @param axis - the greenfield axis, or its absence.
 * @returns the lines, never empty.
 */
function panoramaLines(axis: GreenfieldAxis | undefined): string[] {
  if (axis === undefined) return ['O eixo greenfield não foi lido por esta leitura.']
  if (!pipelineStarted(axis)) return ['Este projeto não nasceu por /reversa-new.']

  const { panorama: p } = axis
  const vista = panoramaView(p)
  const lines = [
    `Nascido por /reversa-new; pipeline em "${greenfieldStageLabel(axis.estagio).text}".`,
  ]
  if (vista.total === 0) lines.push('A decomposição em specs ainda não foi feita.')
  else {
    lines.push(`${vista.convergidos} de ${vista.total} componentes planejados convergidos.`)
    for (const g of vista.grupos) for (const c of g.componentes) lines.push(componentLine(c))
  }
  // Feature 010: the components delivered without a spec, AFTER the planned
  // ones and in the order the same pure function decided (D-17).
  lines.push('')
  if (vista.semSpec === null) lines.push('Vínculo declarado não lido por esta leitura.')
  else {
    if (vista.vinculoParcial) lines.push('Vínculo declarado parcial: algum legacy-impact.md não foi lido.')
    const n = vista.semSpec.length
    if (n === 0) lines.push('Nenhum componente entregue sem spec.')
    else {
      lines.push(`${n} ${n === 1 ? 'componente entregue' : 'componentes entregues'} sem spec.`)
      for (const c of vista.semSpec) lines.push(unspecifiedLine(c))
    }
  }
  lines.push('', `Fora do plano: ${p.foraDoPlano.length} pastas sem spec.`)
  for (const f of p.foraDoPlano) {
    lines.push(`- ${f.id ?? ''}-${f.nomeCurto ?? f.pasta} — ${situationLabel(f.situacao).text}`)
  }
  lines.push('')
  if (!p.escopoEncontrado) lines.push('Escopo declarado no PRD: seção não encontrada.')
  else {
    lines.push(`Escopo declarado no PRD: ${p.escopo.length} itens.`)
    for (const item of p.escopo) lines.push(`- ${item.nome}`)
  }
  return lines
}

/** One planned component, in one line. */
function componentLine(c: PlannedComponent): string {
  const parts = [c.nome, componentSituationLabel(c.situacao).text, markLabel(c.marca).text]
  if (c.acoes !== null) parts.push(`${c.acoes.fechadas} de ${c.acoes.total} ações`)
  return `- ${parts.filter(Boolean).join(' — ')}`
}

/** One component delivered without a spec, in one line, with the folders that declare it. */
function unspecifiedLine(c: UnspecifiedComponent): string {
  const parts = [c.nome, componentSituationLabel(c.situacao).text, markLabel(c.marca).text]
  parts.push(`declarado por ${c.pastas.map(folderName).join(', ')}`)
  return `- ${parts.filter(Boolean).join(' — ')}`
}

/** The bare name of a folder, which is what the reader recognises. */
function folderName(pasta: string): string {
  return pasta.split('/').pop() ?? pasta
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
  lines.push('', ...conferenceLines(history.entradas))
  return lines
}

/**
 * The conferences of each delivery, as a block of its own AFTER the lines that
 * were here, so that none of them moves or changes (feature 010, RF-12, D-17).
 * @param entradas - the entries, in history order.
 * @returns the lines, never empty and never a dangling label.
 */
function conferenceLines(entradas: HistoryEntry[]): string[] {
  if (entradas.every((entry) => entry.conferencias === undefined)) {
    return ['Conferências não lidas por esta leitura.']
  }

  const lines = ['Conferências por entrega, do registro do onboarding.']
  for (const entry of entradas) {
    const name = entry.id === null ? (entry.nomeCurto ?? entry.pasta) : `${entry.id}-${entry.nomeCurto}`
    const c = entry.conferencias
    const text =
      c === undefined
        ? 'conferências não lidas'
        : c.estado === 'lido' || c.estado === 'truncado'
          ? `${c.registradas} de ${c.total} conferências registradas`
          : conferenceStateLabel(c.estado).text
    lines.push(`- ${name} — ${text}`)
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
