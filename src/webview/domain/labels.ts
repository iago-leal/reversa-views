/**
 * Domain values turned into text, without an unknown one ever breaking the
 * render (RF-04, RF-06, RN-01, RN-04, RN-05, EC-05).
 *
 * Two vocabularies, seven stages and five phases, plus the status of a
 * checkpoint. Every function is total: a value outside the vocabulary comes
 * back as the raw value, marked unrecognised, because RN-05 forbids the panel
 * from either throwing or pretending it read something it did not.
 *
 * The status is TEXT. Colour is not decided here, and not decided by a
 * component either: a status that reads only as a colour does not read at all
 * for part of the audience.
 * @module webview/domain/labels
 */

import type { Checkpoint, Phase } from '../../heranca/reversa-domain/src/index.ts'
import type { FeatureMark, FeatureSituation } from '../../domain/types.ts'
import type { Label, StatusMark } from './types.ts'

/** The seven stages of the forward cycle, as the reader names them. */
const STAGE_LABELS: Record<string, string> = {
  'sem-feature-ativa': 'Sem feature ativa',
  vazio: 'Feature aberta, sem artefato',
  requirements: 'Requisitos escritos',
  plan: 'Plano técnico escrito',
  'coding-em-progresso': 'Execução em progresso',
  'done-sem-adendo': 'Entregue, sem adendo',
  'done-com-adendo': 'Entregue, com adendo',
}

/** The five phases of the discovery pipeline. */
const PHASE_LABELS: Record<string, string> = {
  reconhecimento: 'Reconhecimento',
  escavacao: 'Escavação',
  interpretacao: 'Interpretação',
  geracao: 'Geração',
  revisao: 'Revisão',
}

/**
 * The four situations of a feature in the history, as words.
 *
 * They are NOT stages, and they are not spelled like one on purpose (D-19):
 * the stage of the active feature goes on coming from the inherited contract,
 * and a second vocabulary that looked like it would become a second authority
 * over the same fact.
 */
const SITUATION_LABELS: Record<string, string> = {
  convergida: 'convergida',
  'entregue-sem-adendo': 'entregue, sem adendo',
  'em-aberto': 'em aberto',
  'sem-acoes': 'sem ações',
}

/** The three marks the pointer of REVERSA gives a feature folder. */
const MARK_LABELS: Record<string, string> = {
  ativa: 'feature ativa',
  pausada: 'pausada',
  nenhuma: '',
}

/** The three statuses a phase can be in, as words rather than as colour. */
const PHASE_STATUS: Record<string, string> = {
  done: 'concluída',
  current: 'corrente',
  pending: 'pendente',
}

/**
 * Look a value up, keeping the raw form whatever the answer.
 * @param raw - the value as it arrived.
 * @param vocabulary - the readable names, by value.
 * @returns the label, marked as recognised or not.
 */
function lookUp(raw: string, vocabulary: Record<string, string>): Label {
  const text = vocabulary[raw]
  return text === undefined ? { text: raw, known: false, raw } : { text, known: true, raw }
}

/**
 * The readable name of a stage of the forward cycle.
 * @param stage - the stage as the reader produced it.
 * @returns the label; never throws, for any input.
 */
export function stageLabel(stage: string): Label {
  return lookUp(stage, STAGE_LABELS)
}

/**
 * The readable name of a discovery phase, plus its status as a word.
 * @param phase - the phase as the reader produced it.
 * @returns the label and the status; never throws, for any input.
 */
export function phaseMark(phase: Phase): StatusMark {
  return {
    label: lookUp(phase.name, PHASE_LABELS),
    status: PHASE_STATUS[phase.status] ?? phase.status,
  }
}

/** A checkpoint turned readable, with the instant kept apart from the word. */
export interface CheckpointMark extends StatusMark {
  /** When it finished, absolute and unconverted; null while it still runs. */
  instant: string | null
}

/**
 * The agent of a checkpoint, plus when it finished or that it has not.
 *
 * The agent name is the label and is always recognised: it is not a closed
 * vocabulary, and REVERSA adds agents between versions.
 *
 * The instant is returned APART from the status since feature 006. It used to
 * be spliced into the sentence, which put a raw universal-time instant on the
 * screen in the one place the conversion of RF-15 could not reach it. The word
 * belongs to this vocabulary; converting the instant belongs to
 * `domain/instants.ts`; and putting the two side by side belongs to the
 * component.
 * @param checkpoint - one checkpoint of the discovery.
 * @returns the label, the status and the instant.
 */
export function checkpointMark(checkpoint: Checkpoint): CheckpointMark {
  const { agent, completedAt } = checkpoint
  return {
    label: { text: agent, known: true, raw: agent },
    status: completedAt === null ? 'em andamento' : 'concluído em',
    instant: completedAt,
  }
}

/**
 * The readable name of the situation of one feature in the history (RF-09).
 * @param situacao - the situation as the domain derived it.
 * @returns the label; never throws, for any input.
 */
export function situationLabel(situacao: FeatureSituation | string): Label {
  return lookUp(situacao, SITUATION_LABELS)
}

/**
 * The readable name of the mark of one feature, empty for the plain case.
 *
 * The empty text of `nenhuma` is the point: most features carry no mark, and a
 * line that said so of each of them would be noise where the reader is looking
 * for the two that do.
 * @param marca - the mark as the domain derived it.
 * @returns the label; never throws, for any input.
 */
export function markLabel(marca: FeatureMark | string): Label {
  return lookUp(marca, MARK_LABELS)
}

/** How many characters of a git revision the header shows. */
const REVISION_LENGTH = 7

/**
 * The revision of the inherited model, short enough to sit in the header
 * (RF-15).
 *
 * Seven characters is what a git log shows, and it is what someone comparing
 * the panel against a commit list actually reads. A value shorter than that
 * comes back whole rather than padded: inventing characters would make the
 * panel lie about a revision.
 * @param revision - the revision as the host declared it.
 * @returns the abbreviation, or empty text when there is no revision.
 */
export function revisionLabel(revision: string | null | undefined): string {
  if (typeof revision !== 'string' || revision === '') return ''
  return revision.length <= REVISION_LENGTH ? revision : revision.slice(0, REVISION_LENGTH)
}
