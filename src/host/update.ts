/**
 * The interpreter of what the origin said (D-03, RF-10, RF-15, RF-16).
 *
 * A pure function, and that is the whole point of the module existing: it
 * receives a response code and a body, and returns one of the seven named
 * outcomes. It opens no connection, imports no editor and holds no state, so
 * the whole translation table of `interfaces/consulta-a-origem.md` is exercised
 * against recorded answers, with no network in the suite.
 *
 * THE ORDER OF THE TWO READINGS IS A RULE, not an implementation detail. The
 * code decides first, and only then is the body looked at. The reason was found
 * by making the real call: the body of a 404 carries a field named `status`
 * whose value is the string `"404"`, which is not one of the four values a
 * comparison uses. Read in the other order, the interpreter would hand that
 * string to the comparison table and answer "unexpected" where the truthful
 * answer is "the origin does not know this commit".
 *
 * Nothing here throws. A body that is not what was promised is an outcome with
 * a name, because the panel is already drawn when the query answers, and an
 * exception this late would take down a reading that succeeded.
 * @module host/update
 */

import type { OriginReply } from './ports.ts'
import type { UpdateStatus } from './protocol.ts'

/** The four values the comparison route uses for its own `status` field. */
const COMPARISON = ['identical', 'ahead', 'behind', 'diverged'] as const

/** What a body has to look like before any field of it is trusted. */
type Comparison = { status: string; ahead_by?: unknown; behind_by?: unknown }

/** The outcome for everything that was answered but not understood. */
const UNEXPECTED: UpdateStatus = { estado: 'impossivel', causa: 'resposta-inesperada' }

/**
 * Whether a value is a distance the panel can draw.
 *
 * A count has to be a whole number and cannot be negative. A string of digits
 * is NOT quietly converted: a service that changed the type of a field changed
 * the contract, and converting in silence would hide that until the day the
 * string stops being numeric.
 * @param value - whatever the body had in that field.
 * @returns true when it is a usable count.
 */
function isCount(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0
}

/**
 * Whether a body is shaped like a comparison at all.
 * @param body - the decoded body, whatever it turned out to be.
 * @returns true when it carries a `status` of one of the four known values.
 */
function isComparison(body: unknown): body is Comparison {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) return false
  const status = (body as { status?: unknown }).status
  return typeof status === 'string' && (COMPARISON as readonly string[]).includes(status)
}

/**
 * Translate a comparison into an outcome, by the table of the contract.
 *
 * `behind` means the HEAD of the origin is behind the build, which happens when
 * the package was made from local commits never pushed. There is nothing to
 * apply, so it counts as up to date.
 * @param body - a body already known to be a comparison.
 * @returns the outcome.
 */
function fromComparison(body: Comparison): UpdateStatus {
  if (body.status === 'identical' || body.status === 'behind') return { estado: 'em-dia' }

  // Both remaining values report the distance measured FROM THE BASE, which is
  // the commit this build was made from. Confirmed by real call on 2026-09-09.
  if (!isCount(body.ahead_by)) return UNEXPECTED

  // A distance of zero is not a delay, whatever the service called it: drawing
  // "0 commits novos" would be the one sentence the header must never write.
  if (body.ahead_by === 0) return { estado: 'em-dia' }

  return body.status === 'diverged'
    ? { estado: 'divergente', commits: body.ahead_by }
    : { estado: 'atrasada', commits: body.ahead_by }
}

/**
 * Turn what the origin answered into one of the seven outcomes.
 * @param reply - the response, or the transport failure, from the port.
 * @returns the outcome, always; this function does not throw.
 */
export function interpretReply(reply: OriginReply): UpdateStatus {
  if (reply.kind === 'failure') return { estado: 'impossivel', causa: reply.cause }

  // The code first. See the module note: the body of a 404 has a `status` too.
  if (reply.status === 404) return { estado: 'commit-desconhecido' }
  if (reply.status === 403 || reply.status === 429) {
    return { estado: 'impossivel', causa: 'limite-de-taxa' }
  }
  if (reply.status !== 200) return UNEXPECTED

  return isComparison(reply.body) ? fromComparison(reply.body) : UNEXPECTED
}

/** What the build knows about itself, as the query needs it. */
export interface QueryContext {
  /** Whether the setting is on, read at the moment of asking (RF-14). */
  enabled: boolean
  /** `dono/repositorio`, or null when there is no origin this can talk to. */
  origin: string | null
  /** The commit this build was made from; empty outside a clone. */
  commit: string
  /** The branch of the origin to compare against. */
  branch: string
}

/** Either there is a query to make, or there is an outcome to send instead. */
export type QueryDecision =
  | { kind: 'ask'; base: string; head: string }
  | { kind: 'skip'; status: UpdateStatus }

/**
 * Decide whether to ask the origin anything at all (RF-14, RN-09).
 *
 * Three things switch the query off, and all three produce the SAME outcome.
 * That is deliberate: the reader of the panel has nothing to do with the
 * difference between a setting turned off, a repository with no known origin
 * and a build with no commit behind it, and the header is not the place to
 * explain someone's git configuration.
 * @param context - what the build knows about itself.
 * @returns the query to make, or the outcome to send in its place.
 */
export function queryPlan(context: QueryContext): QueryDecision {
  const off: QueryDecision = { kind: 'skip', status: { estado: 'desligada' } }
  if (!context.enabled) return off
  if (context.origin === null || context.origin === '') return off
  if (context.commit === '') return off
  return { kind: 'ask', base: context.commit, head: context.branch }
}
