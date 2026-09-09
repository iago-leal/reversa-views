/* HERDADO: não editar sem declarar a adaptação em src/heranca/PROCEDENCIA.md
 * origem:      scrum-harness (https://github.com/iago-leal/scrum-harness)
 * caminho:     packages/reversa-domain/tests/hook-parity.spec.ts
 * revisão:     420305daa6cdd10858b720a34cb8db67d8e5c5e9 (2026-09-08)
 * copiado em:  2026-09-09
 * adaptações:  nenhuma
 */
/**
 * Parity with the real REVERSA hook (comp-72 R6, R7).
 *
 * Every other test states what we believe the framework does. This one
 * checks it: it loads `globToRegex` and `isValidPattern` STRAIGHT OUT OF
 * the vendored copy of `check-legacy-policy.mjs` and asserts our
 * transcription answers identically over a matrix of patterns and paths.
 * If REVERSA ever changes its matcher, this fails and tells us the panel
 * has started lying — which is the only failure mode that really matters
 * for a tool whose whole job is predicting the hook.
 *
 * The vendored fixture is a byte-for-byte copy of the hook shipped by
 * REVERSA v1.3.3 (`templates/hooks/check-legacy-policy.mjs`), kept here so
 * the suite stays hermetic and needs no REVERSA install to run.
 */

import { readFileSync } from 'node:fs'
import { isAbsolute } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { globToRegex, isValidPattern } from '../src/glob.ts'

const HOOK = fileURLToPath(new URL('./fixtures/check-legacy-policy.mjs', import.meta.url))

/** Lift the two pure functions out of the hook without executing its main(). */
function loadHookFunctions(): { globToRegex: (p: string) => RegExp; isValidPattern: (p: string) => boolean } {
  const source = readFileSync(HOOK, 'utf8')
  const glob = source.match(/function globToRegex[\s\S]*?\n}/)
  const valid = source.match(/function isValidPattern[\s\S]*?\n}/)
  if (glob === null || valid === null) throw new Error('hook fixture no longer exposes the expected functions')
  // `isValidPattern` closes over node:path's isAbsolute in the hook module.
  const factory = new Function('isAbsolute', `${glob[0]}\n${valid[0]}\nreturn { globToRegex, isValidPattern }`)
  return factory(isAbsolute) as ReturnType<typeof loadHookFunctions>
}

const hook = loadHookFunctions()

const PATTERNS = [
  'src/**', 'src/*', 'src/*.js', 'src', 'src/', '**', '**/*.js', 'src/**/*.js',
  'SRC/**', 'src/?.js', 'a b', 'my dir/*', 'src/(x)+.js', 'src/a.js', '',
  '/etc/passwd', 'C:/Windows', '../outside', 'a/../../b', 'src/a..b.js',
]

const PATHS = [
  'src/orders/order.js', 'src/a.js', 'src', 'src/', 'lib/x.js', 'SRC/a.js',
  'a/b.js', 'x.js', 'my/any/dir/a.js', 'my dir/a.js', 'a/x/y/b', 'aXb',
  'src/(x)+.js', 'src/a.js', 'src/ab.js', '.reversa/state.json', 'src/a..b.js',
]

describe('parity with the shipped REVERSA hook', () => {
  it('the fixture is the hook we think it is', () => {
    const source = readFileSync(HOOK, 'utf8')
    expect(source).toContain('permissionDecision')
    expect(source).toContain('allowLegacyEdits')
    // The `**` sentinel is a NUL byte. Terminal dumps render it as a blank,
    // which is exactly how an earlier draft came to believe it was a space.
    expect(source).toContain('\u0000')
  })

  it('compiles every pattern to the same regular expression', () => {
    for (const pattern of PATTERNS) {
      expect(globToRegex(pattern).source, `pattern ${JSON.stringify(pattern)}`).toBe(hook.globToRegex(pattern).source)
    }
  })

  it('answers identically for every pattern × path pair', () => {
    for (const pattern of PATTERNS) {
      for (const path of PATHS) {
        expect(
          globToRegex(pattern).test(path),
          `pattern ${JSON.stringify(pattern)} vs path ${JSON.stringify(path)}`,
        ).toBe(hook.globToRegex(pattern).test(path))
      }
    }
  })

  it('validates patterns identically', () => {
    for (const pattern of PATTERNS) {
      expect(isValidPattern(pattern), `pattern ${JSON.stringify(pattern)}`).toBe(hook.isValidPattern(pattern))
    }
  })
})
