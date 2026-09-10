/**
 * THE ONLY MODULE OF THIS EXTENSION THAT OPENS A CONNECTION (D-01, D-05,
 * RF-11, RF-13, RN-01, RN-09).
 *
 * Until feature 007 nothing here spoke to any service, and that was a declared
 * property of the product. The amendment of 2026-09-09 opens ONE exception, and
 * this file is it: a read-only, anonymous query to the origin of this very
 * repository. Telemetry stays forbidden without exception.
 *
 * Concentrating the capability in one file is what makes the frontier
 * VERIFIABLE — `tests/host-boundaries.spec.ts` asserts by plain text search
 * that no other module of the host imports a request client, the same way
 * `node:fs` is kept to one file in the reading layer. Spreading the call into
 * the provider would turn the privacy of the query into a claim in prose.
 *
 * Four properties are worth reading before changing anything here:
 *
 * 1. The native HTTPS module, and not the modern global client (D-05). The
 *    minimum editor version this extension declares embeds a Node from a line
 *    that does not ship the global one enabled. Using the native module makes
 *    the question irrelevant, and has the side benefit that the editor
 *    instruments it to honour the user's own proxy configuration.
 * 2. The address comes from a build-time constant and from nowhere else: not
 *    from an argument, not from an environment variable, not from a file of the
 *    workspace. A hostile workspace does not redirect this query.
 * 3. No redirect is followed, to any domain. The contract forbids following one
 *    to another domain; following none at all satisfies that with room to
 *    spare, and a moved repository becomes a named outcome instead of a silent
 *    hop to somewhere else.
 * 4. Nothing is written and nothing is executed. This module reads, and there
 *    is no route in it that does anything else.
 * @module host/net
 */

import { request } from 'node:https'
import type { OriginPort, OriginReply } from './ports.ts'

/** The host of the service, fixed here and nowhere else. */
const API_HOST = 'api.github.com'

/** How long to wait before giving up, in milliseconds (RF-11). */
export const TIMEOUT_MS = 5_000

/**
 * The most body this module will read before abandoning the answer.
 *
 * Measured, not guessed: the real comparison of four commits over sixty-five
 * files weighs about 450 KB, because the route returns the commits and the
 * patches beside the three fields that are actually read. Four mebibytes is an
 * order of magnitude of slack over that, and still a ceiling — the reading
 * layer abandons a file above its own ceiling for the same reason.
 */
export const MAX_BYTES = 4 * 1024 * 1024

/** A repository as `dono/repositorio`, and nothing that could escape the path. */
const REPOSITORY = /^[A-Za-z0-9._-]+\/[A-Za-z0-9._-]+$/

/** A commit: hexadecimal, from the short form to the whole thing. */
const COMMIT = /^[0-9a-fA-F]{7,64}$/

/** A branch name, allowing the slash that a namespaced branch carries. */
const REF = /^[A-Za-z0-9._\-/]{1,255}$/

/** What `originPort` needs to introduce itself. */
export interface OriginOptions {
  /** The version of this build; it is all the agent header carries. */
  version: string
  /** Overridable so the suite can exercise the port with no socket. */
  perform?: typeof request
  timeoutMs?: number
  maxBytes?: number
}

/**
 * The query to the origin, as the one port the host may hold.
 *
 * NOTHING BUT THIS TRAVELS: no credential, no body, no cookie, no machine
 * identifier, no workspace name, and no fact whatsoever about what was read
 * from disk. The agent header carries the version number the panel already
 * shows on screen, and it carries it because the service requires the header
 * to exist.
 * @param repository - `dono/repositorio`, from the build stamp.
 * @param options - the version to announce, and the seams the suite uses.
 * @returns the port.
 */
export function originPort(repository: string, options: OriginOptions): OriginPort {
  const perform = options.perform ?? request
  const timeoutMs = options.timeoutMs ?? TIMEOUT_MS
  const maxBytes = options.maxBytes ?? MAX_BYTES

  return {
    compare(base: string, head: string): Promise<OriginReply> {
      // The three come from the build stamp, and are checked anyway. A value
      // that cannot be part of a path is refused HERE, before a socket exists,
      // rather than trusted because of where it came from.
      if (!REPOSITORY.test(repository) || !COMMIT.test(base) || !REF.test(head)) {
        return Promise.resolve({ kind: 'failure', cause: 'resposta-inesperada' })
      }

      return new Promise<OriginReply>((resolve) => {
        // Every path below races to answer once. A timeout that fires while the
        // body is arriving, or an error after the end of the stream, would
        // otherwise settle a promise that is already settled.
        let settled = false
        const answer = (reply: OriginReply): void => {
          if (settled) return
          settled = true
          resolve(reply)
        }

        const call = perform(
          {
            protocol: 'https:',
            host: API_HOST,
            path: `/repos/${repository}/compare/${base}...${head}`,
            method: 'GET',
            headers: {
              // Fixes the shape of the answer, which otherwise depends on
              // negotiation with the service.
              Accept: 'application/vnd.github+json',
              // Required by the service. It carries the version and nothing
              // else, which is the number already visible in the header.
              'User-Agent': `reversa-views/${options.version}`,
            },
          },
          (response) => {
            const status = response.statusCode ?? 0

            // A redirect is NOT followed, to any domain (property 3 above).
            // Draining it keeps the socket from being held open by a body
            // nobody is going to read.
            if (status >= 300 && status < 400) {
              response.resume()
              answer({ kind: 'response', status, body: null })
              return
            }

            let size = 0
            const chunks: Buffer[] = []
            response.on('data', (chunk: Buffer) => {
              size += chunk.length
              if (size > maxBytes) {
                // Above the ceiling the answer is abandoned, not truncated: a
                // half-read JSON would parse as garbage or not at all, and
                // either way the honest outcome is that it was not understood.
                call.destroy()
                answer({ kind: 'failure', cause: 'resposta-inesperada' })
                return
              }
              chunks.push(chunk)
            })

            response.on('end', () => {
              if (settled) return
              const text = Buffer.concat(chunks).toString('utf8')
              let body: unknown = null
              try {
                body = text === '' ? null : JSON.parse(text)
              } catch {
                // A body that is not JSON is left as null. The interpreter
                // turns that into a named outcome, and the code of the
                // response is read before the body anyway.
                body = null
              }
              answer({ kind: 'response', status, body })
            })

            response.on('error', () => answer({ kind: 'failure', cause: 'sem-rede' }))
          },
        )

        // The native module imposes no timeout of its own: waiting forever is
        // what it does unless someone says otherwise. Five seconds, and the
        // request is destroyed explicitly rather than left to a socket that
        // nobody is listening to (RF-11).
        call.setTimeout(timeoutMs, () => {
          call.destroy()
          answer({ kind: 'failure', cause: 'tempo-esgotado' })
        })

        // Transport, DNS, TLS and a refused connection all land here. They are
        // one outcome on purpose: the panel says it could not reach the origin,
        // and the maintainer's next move is the same in all four cases.
        call.on('error', () => answer({ kind: 'failure', cause: 'sem-rede' }))

        // No body, in any route. This module reads.
        call.end()
      })
    },
  }
}
