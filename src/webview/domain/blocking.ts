/**
 * The four signals that mean the process is waiting on a human, and the
 * reasons they become (RF-03, RF-03a, RN-01).
 *
 * A pure function over the process. The ORDER of the list is declared here,
 * in a single place, rather than emerging from the order of the fields of the
 * process: the banner reads top to bottom, and what comes first is a decision,
 * not an accident of the reader.
 *
 * No reason executes anything. The command is text to copy, and the reserved
 * dispatch of RF-15 is the place where that would one day change.
 * @module webview/domain/blocking
 */

import type { ReversaProcess } from '../../heranca/reversa-domain/src/index.ts'
import type { BugEntry, BugRegistry, GreenfieldAxis } from '../../domain/types.ts'
import { greenfieldStageLabel } from './labels.ts'
import { lastArtifact, nextAgent, pipelineStarted } from './origin-view.ts'
import type { BlockingReason } from './types.ts'

/** The stage that means the delivery closed and the addendum never came. */
const DELIVERED_WITHOUT_ADDENDUM = 'done-sem-adendo'

/** The status the migration pipeline writes while it waits for a person. */
const AWAITING_APPROVAL = 'awaiting_user_approval'

/**
 * A path inside the active feature, or null when there is no active feature.
 * @param process - the process being read.
 * @param file - the file name inside the feature directory.
 * @returns the path relative to the observed root, or null.
 */
function featureArtifact(process: ReversaProcess, file: string): string | null {
  const dir = process.forward.featureDir
  return dir === null ? null : `${dir}/${file}`
}

/**
 * The delivery that closed without converging into the extraction (RF-03).
 * @param process - the process being read.
 * @returns one reason, or none.
 */
function deliveredWithoutAddendum(process: ReversaProcess): BlockingReason[] {
  if (process.forward.stage !== DELIVERED_WITHOUT_ADDENDUM) return []

  return [
    {
      text: 'A entrega fechou todas as ações e ainda não gerou adendo na extração.',
      artifact: featureArtifact(process, 'actions.md'),
      command: '/reversa-sync',
    },
  ]
}

/**
 * The migration waiting for approval, which is one reason, and each pending
 * decision, which is one reason of its own (RF-03a).
 *
 * They are separate on purpose: the wait says the pipeline stopped, and each
 * decision says what has to be decided. Aggregating them would hide the
 * second behind the first.
 * @param process - the process being read.
 * @returns zero or more reasons.
 */
function migrationReasons(process: ReversaProcess): BlockingReason[] {
  const { migration, migrationStatePath } = process
  if (!migration.present) return []

  const reasons: BlockingReason[] = []

  if (migration.currentAgent.status === AWAITING_APPROVAL) {
    reasons.push({
      text: 'A migração parou e aguarda a sua aprovação para seguir.',
      artifact: migrationStatePath,
      command: '/reversa-migrate',
    })
  }

  for (const decision of migration.pendingDecisions) {
    reasons.push({
      text: `A migração aguarda a decisão: ${decision}.`,
      artifact: migrationStatePath,
      command: '/reversa-migrate',
    })
  }

  return reasons
}

/**
 * The doubts the active feature still carries (RF-03).
 * @param process - the process being read.
 * @returns one reason, or none.
 */
function openDoubts(process: ReversaProcess): BlockingReason[] {
  const { doubts } = process.forward
  if (doubts === 0) return []

  const plural = doubts === 1 ? 'dúvida' : 'dúvidas'
  return [
    {
      text: `A feature ativa tem ${doubts} ${plural} sem resposta no requirements.`,
      artifact: featureArtifact(process, 'requirements.md'),
      command: '/reversa-clarify',
    },
  ]
}

/**
 * The phase of a bug that says, in the registry's own words, that it is waiting
 * on a person (RF-10).
 */
const AWAITING_HUMAN = 'awaiting-human'

/**
 * The severities that count as high (RF-10).
 *
 * The requirement writes "a severidade alta", and the scale has four steps with
 * `critical` above `high`. A band that raised the second and kept quiet about
 * the first would name the smaller defect and hide the bigger one, which is the
 * opposite of what the band exists to do. So the reading is: at or above high.
 */
const HIGH_SEVERITIES: ReadonlySet<string> = new Set(['critical', 'high'])

/** The command that acts on one bug of the registry; text to copy, never run. */
const BUG_COMMAND = '/reversa-debugger-fix'

/**
 * The three conditions that raise one bug to the band, in the declared order.
 *
 * The order is written HERE, in one place, and not left to the order of the
 * fields of the bug: the band reads top to bottom, and what comes first is a
 * decision.
 *
 * Only the third is gated on the bug not being closed, and the asymmetry is the
 * requirement's rather than an oversight: a lock over a bug that still declares
 * a wait or a blocking condition is a registry that contradicts itself, and
 * saying so is worth a line.
 * @param bug - the bug being read.
 * @returns the reasons it carries, as sentences; empty when it carries none.
 */
function bugConditions(bug: BugEntry): string[] {
  const razoes: string[] = []

  // The conditions read the RECOGNISED value, never the raw one. A phase or a
  // severity the panel does not know is drawn on the line marked unrecognised,
  // and stays off the band: raising a value whose meaning this version cannot
  // establish would be the panel guessing what the registrar meant.
  if (bug.fase === AWAITING_HUMAN) razoes.push('aguarda decisão humana')
  if (bug.bloqueado) razoes.push('está bloqueado por condição declarada')
  if (!bug.travado && HIGH_SEVERITIES.has(bug.severidade ?? '')) {
    razoes.push('tem severidade alta e não foi encerrado')
  }
  return razoes
}

/**
 * The bugs of the registry that wait on a person (RF-10, D-08).
 *
 * ONE LINE PER BUG, whatever the number of conditions it gathers. The band
 * answers "what is waiting on you", not "how many rules each bug breaks": three
 * lines about the same bug would send the reader to the same file three times,
 * and the reasons are named in the one line so that nothing is lost by joining
 * them.
 * @param registry - the registry, or its absence.
 * @returns zero or more reasons.
 */
function bugReasons(registry: BugRegistry | undefined): BlockingReason[] {
  if (registry === undefined || !registry.presente) return []

  const reasons: BlockingReason[] = []
  for (const contexto of registry.contextos) {
    for (const bug of contexto.bugs) {
      const razoes = bugConditions(bug)
      if (razoes.length === 0) continue

      const nome = bug.id ?? bug.pasta
      reasons.push({
        text: `O bug ${nome} ${razoes.join(' e ')}.`,
        artifact: bug.arquivo,
        command: bug.id === null ? BUG_COMMAND : `${BUG_COMMAND} ${bug.id}`,
      })
    }
  }
  return reasons
}

/**
 * The `/reversa-new` pipeline that started and did not finish (RN-11, RF-16,
 * D-17 of feature 009).
 *
 * It is a reason WHETHER OR NOT there is an active feature, because in guided
 * mode each agent waits for the user's CONTINUAR: an incomplete pipeline is a
 * decision pending on a person. It is NOT a reason when the project has the
 * anchor of the extraction, because the coding skill runs on that anchor and
 * the specs would be a complement; nor when nothing of `/reversa-new` exists,
 * because a project that never ran it is not waiting on it.
 *
 * The command names the agent that comes next, and never `/reversa-new`
 * itself: resuming the pipeline is running the agent that is missing, which
 * for a PRD without specs is `/reversa-spec-sdd` (RF-16).
 * @param axis - the greenfield axis, or its absence.
 * @returns one reason, or none.
 */
function greenfieldReason(axis: GreenfieldAxis | undefined): BlockingReason[] {
  if (axis === undefined) return []
  if (axis.cenario === 'legado' || axis.cenario === 'misto') return []
  if (!pipelineStarted(axis)) return []

  const agent = nextAgent(axis.estagio)
  if (agent === null) return []

  const stage = greenfieldStageLabel(axis.estagio)
  return [
    {
      text: `O /reversa-new parou em "${stage.text}" e aguarda o agente ${agent}.`,
      artifact: lastArtifact(axis),
      command: `/reversa-${agent}`,
    },
  ]
}

/**
 * Every reason the process is waiting on a human, in the declared order.
 *
 * The registry arrives as a SECOND ARGUMENT, beside the process and not inside
 * it (D-08): it does not live in what the inherited reader produces, and
 * putting it there would create a second authority over that shape. It is
 * optional because a host older than feature 008 does not send it, and a panel
 * that treated its absence as an empty registry would be affirming that no bug
 * waits when it simply did not look.
 *
 * The greenfield axis arrives as a THIRD, by the same reasoning and with the
 * same optionality (feature 009): absent is "not read", and not "nothing
 * waits". Its reason comes LAST, after everything that was already here.
 * @param process - the process the panel received.
 * @param registry - the bug registry, or its absence.
 * @param greenfield - the greenfield axis, or its absence.
 * @returns the reasons; an empty list means no banner, not an empty banner.
 */
export function blockingReasons(
  process: ReversaProcess,
  registry?: BugRegistry,
  greenfield?: GreenfieldAxis,
): BlockingReason[] {
  return [
    ...deliveredWithoutAddendum(process),
    ...migrationReasons(process),
    ...openDoubts(process),
    ...bugReasons(registry),
    ...greenfieldReason(greenfield),
  ]
}
