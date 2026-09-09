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
 * Every reason the process is waiting on a human, in the declared order.
 * @param process - the process the panel received.
 * @returns the reasons; an empty list means no banner, not an empty banner.
 */
export function blockingReasons(process: ReversaProcess): BlockingReason[] {
  return [
    ...deliveredWithoutAddendum(process),
    ...migrationReasons(process),
    ...openDoubts(process),
  ]
}
