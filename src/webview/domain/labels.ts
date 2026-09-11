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
import type { UpdateStatus } from '../../host/protocol.ts'
import type { FeatureMark, FeatureSituation } from '../../domain/types.ts'
import type { Label, StatusMark, UpdateLabel } from './types.ts'

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

/**
 * The command of the ritual, spelled once (RF-22), and it is the SECOND act.
 *
 * `npm run atualizar` only checks and never brings a commit (RF-04); the
 * argument is what applies. The header offered the bare check for the whole of
 * feature 007 (BUG-20260910-WIBK): whoever copied it got a diagnosis, and the
 * notice came back on the next reload. The suite now reads this value against
 * the line the script itself prints as "Para aplicar", so the two places that
 * spell the act cannot drift apart again without a red test.
 */
const UPDATE_COMMAND = 'npm run atualizar -- --aplicar'

/** Why a query could not be made, in the reader's words rather than the wire's. */
const CAUSE_LABELS: Record<string, string> = {
  'sem-rede': 'não houve resposta da rede',
  'limite-de-taxa': 'a origem recusou por limite de requisições',
  'resposta-inesperada': 'a origem respondeu algo que não se entende',
  'tempo-esgotado': 'a origem demorou mais do que o prazo',
}

/**
 * A count with its noun in the right number.
 * @param count - how many commits.
 * @returns `1 commit` or `4 commits`.
 */
function commits(count: number): string {
  return count === 1 ? '1 commit' : `${count} commits`
}

/**
 * The outcome of the origin query, as a sentence and a command (RF-10, RF-14).
 *
 * Seven outcomes, seven sentences, and the two that matter most are the two a
 * careless translation would merge. DESLIGADA is not EM DIA: whoever turned the
 * key off received no assurance about the installed build, and a header saying
 * "em dia" there would be affirming what nobody checked. COMMIT DESCONHECIDO is
 * not ATRASADA either: a build made from a commit the origin never saw is not
 * behind anything, it is off the shared history.
 *
 * The function is TOTAL, as every other one in this module: an outcome or a
 * cause outside the vocabulary comes back as a sentence saying so, because RN-05
 * forbids the panel from throwing and forbids it from drawing an empty line.
 * @param status - the outcome as it arrived from the host.
 * @returns the sentence to draw and the command to copy, if any.
 */
export function updateLabel(status: UpdateStatus): UpdateLabel {
  switch (status.estado) {
    case 'desligada':
      return {
        text: 'A conferência com a origem está desligada na configuração do editor.',
        command: null,
      }
    case 'consultando':
      return { text: 'Consultando a origem sobre esta construção.', command: null }
    case 'em-dia':
      return { text: 'Esta construção está em dia com a origem.', command: null }
    case 'atrasada':
      return {
        text: `A origem está ${commits(status.commits)} à frente desta construção.`,
        command: UPDATE_COMMAND,
      }
    case 'divergente':
      return {
        // Two facts in one sentence, because they are two: there is news to
        // bring, and there is work here that the origin does not have. The
        // command is the same as for ATRASADA, as the spec asks: the updater
        // names the refusal of RF-05 itself, with the count and the way out,
        // at the moment of applying, and the reader has to know before running
        // anything that there is local work at stake.
        text: `A origem está ${commits(status.commits)} à frente, e este clone tem commit próprio que ela não tem.`,
        command: UPDATE_COMMAND,
      }
    case 'commit-desconhecido':
      return {
        text: 'A origem não conhece o commit desta construção: ela foi feita fora do que está publicado.',
        command: null,
      }
    case 'impossivel': {
      const causa = CAUSE_LABELS[status.causa] ?? 'a causa não foi nomeada'
      return { text: `Não deu para conferir com a origem: ${causa}.`, command: null }
    }
    default:
      // RN-05: an outcome this version does not know is a line saying exactly
      // that, and never a blank space beside a label.
      return { text: 'Desfecho da conferência não reconhecido por esta versão.', command: null }
  }
}

/* ------------------------------------------- the vocabularies of the registry */

/**
 * The four vocabularies of the bug registry, plus the two inconsistencies of
 * RN-04 (RF-12).
 *
 * The AUTHORITY over the first four is the schema of `/reversa-debugger`, and
 * what stands here is the copy the panel needs in order to know what a
 * recognised label is. The consequence is declared and deliberate: if the
 * schema grows, the panel draws the new value RAW and marks it unrecognised,
 * which is degradation rather than failure, and reconciling the two lists is
 * one line. A panel that refused the value would show less than the file holds.
 */

/** The three states of the life cycle; blocking is a condition, never a fourth. */
const BUG_STATE_LABELS: Record<string, string> = {
  open: 'aberto',
  active: 'em tratamento',
  resolved: 'resolvido',
}

/** The ten phases that detail an active bug, in the words of the reader. */
const BUG_PHASE_LABELS: Record<string, string> = {
  triaging: 'em triagem',
  mitigating: 'em mitigação',
  reproducing: 'em reprodução',
  diagnosing: 'em diagnóstico',
  planning: 'em planejamento',
  testing: 'em teste',
  patching: 'em correção',
  delivering: 'em entrega',
  observing: 'em observação',
  'awaiting-human': 'aguardando decisão humana',
}

/** How big the damage is, which is not how urgent the fix is. */
const BUG_SEVERITY_LABELS: Record<string, string> = {
  critical: 'severidade crítica',
  high: 'severidade alta',
  medium: 'severidade média',
  low: 'severidade baixa',
}

/** How urgent the fix is, which is not how big the damage is. */
const BUG_PRIORITY_LABELS: Record<string, string> = {
  P0: 'prioridade imediata',
  P1: 'prioridade alta',
  P2: 'prioridade média',
  P3: 'prioridade baixa',
}

/**
 * The two asymmetries of the lock, as sentences that say WHICH one was found.
 *
 * Neither text resolves the disagreement, and that is the point of RN-04: the
 * panel states that the registry contradicts itself and leaves the reading to
 * the person who can open the folder.
 */
const BUG_INCONSISTENCY_LABELS: Record<string, string> = {
  'resolvido-sem-trava': 'declarado resolvido e sem a trava de encerramento',
  'trava-sem-resolvido': 'com a trava de encerramento e sem estar resolvido',
}

/**
 * The readable name of the state of one bug (RF-12).
 * @param estado - the value as it arrived from the registry.
 * @returns the label; never throws, for any input.
 */
export function bugStateLabel(estado: string): Label {
  return lookUp(estado, BUG_STATE_LABELS)
}

/**
 * The readable name of the phase of one bug (RF-12).
 * @param fase - the value as it arrived from the registry.
 * @returns the label; never throws, for any input.
 */
export function bugPhaseLabel(fase: string): Label {
  return lookUp(fase, BUG_PHASE_LABELS)
}

/**
 * The readable name of the severity of one bug (RF-12).
 * @param severidade - the value as it arrived from the registry.
 * @returns the label; never throws, for any input.
 */
export function bugSeverityLabel(severidade: string): Label {
  return lookUp(severidade, BUG_SEVERITY_LABELS)
}

/**
 * The readable name of the priority of one bug (RF-12).
 * @param prioridade - the value as it arrived from the registry.
 * @returns the label; never throws, for any input.
 */
export function bugPriorityLabel(prioridade: string): Label {
  return lookUp(prioridade, BUG_PRIORITY_LABELS)
}

/**
 * The sentence that names which inconsistency of RN-04 a bug carries.
 * @param inconsistencia - the inconsistency the reading declared.
 * @returns the label; never throws, for any input.
 */
export function inconsistencyLabel(inconsistencia: string): Label {
  return lookUp(inconsistencia, BUG_INCONSISTENCY_LABELS)
}

/* ---------------------------------------- the vocabularies of the greenfield axis */

/**
 * The six physical stages of the `/reversa-new` pipeline, as the reader names
 * them (RF-20). The word for each is the ARTIFACT that closed it, because the
 * disk is the authority over the stage and the artifact is what the reader can
 * open to check.
 */
const GREENFIELD_STAGE_LABELS: Record<string, string> = {
  ausente: 'sem artefato do pipeline',
  aberto: 'brief aberto',
  ideado: 'ideação feita',
  pesquisado: 'personas pesquisadas',
  redigido: 'PRD redigido',
  especificado: 'specs escritas',
}

/** The four scenarios of the anchor rule. */
const SCENARIO_LABELS: Record<string, string> = {
  legado: 'projeto legado',
  greenfield: 'projeto greenfield',
  misto: 'legado e greenfield',
  'sem-ancora': 'sem âncora de contexto',
}

/** The two modes the pipeline runs in. */
const GREENFIELD_MODE_LABELS: Record<string, string> = {
  guiado: 'Guiado',
  expresso: 'Expresso',
}

/**
 * The four situations of a planned component, as words.
 *
 * "em andamento" and not "em aberto" on purpose: the component is not a
 * folder, and a folder situation spelled the same way would read as the same
 * fact (D-08).
 */
const COMPONENT_SITUATION_LABELS: Record<string, string> = {
  planejada: 'planejada',
  'em-andamento': 'em andamento',
  entregue: 'entregue, sem adendo',
  convergida: 'convergida',
}

/** The three states of a step of the origin, as words rather than as colour. */
const STEP_STATUS_LABELS: Record<string, string> = {
  done: 'concluído',
  current: 'corrente',
  pending: 'pendente',
}

/** The four steps of the origin, by the artifact each one leaves. */
const ORIGIN_STEP_LABELS: Record<string, string> = {
  ideacao: 'Ideação',
  pesquisa: 'Pesquisa',
  redacao: 'Redação do PRD',
  especificacao: 'Especificação',
}

/** The readable name of the physical stage of the pipeline; never throws. */
export function greenfieldStageLabel(estagio: string): Label {
  return lookUp(estagio, GREENFIELD_STAGE_LABELS)
}

/** The readable name of the scenario; never throws. */
export function scenarioLabel(cenario: string): Label {
  return lookUp(cenario, SCENARIO_LABELS)
}

/** The readable name of the mode of the pipeline; never throws. */
export function greenfieldModeLabel(modo: string): Label {
  return lookUp(modo, GREENFIELD_MODE_LABELS)
}

/** The readable name of the situation of a planned component; never throws. */
export function componentSituationLabel(situacao: string): Label {
  return lookUp(situacao, COMPONENT_SITUATION_LABELS)
}

/** The state of a step of the origin, as a word; never throws. */
export function stepStatusLabel(status: string): Label {
  return lookUp(status, STEP_STATUS_LABELS)
}

/** The readable name of a step of the origin; never throws. */
export function originStepLabel(etapa: string): Label {
  return lookUp(etapa, ORIGIN_STEP_LABELS)
}
