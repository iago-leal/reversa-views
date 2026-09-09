/* HERDADO: não editar sem declarar a adaptação em src/heranca/PROCEDENCIA.md
 * origem:      scrum-harness (https://github.com/iago-leal/scrum-harness)
 * caminho:     packages/reversa-domain/tests/glob.spec.ts
 * revisão:     420305daa6cdd10858b720a34cb8db67d8e5c5e9 (2026-09-08)
 * copiado em:  2026-09-09
 * adaptações:  nenhuma
 */
/**
 * R7 — the glob semantics of the REVERSA policy hook, transcribed.
 *
 * Every expectation here was first PROBED against the real
 * `templates/hooks/check-legacy-policy.mjs` of REVERSA v1.3.3 by executing
 * its `globToRegex` — these are observations of the framework, not wishes.
 * Two of them look like bugs and are deliberately preserved: a bare
 * directory pattern frees nothing, and a literal space behaves like `**`.
 * The panel's job is to predict the hook, so "fixing" either would be the
 * defect.
 */

import { describe, expect, it } from 'vitest'
import { globToRegex, isValidPattern } from '../src/glob.ts'

describe('globToRegex (R7)', () => {
  it('expands ** across separators', () => {
    expect(globToRegex('src/**').test('src/orders/order.js')).toBe(true)
    expect(globToRegex('src/**').test('src/a.js')).toBe(true)
    expect(globToRegex('**/*.js').test('src/orders/order.js')).toBe(true)
    expect(globToRegex('**').test('anything/at/all.js')).toBe(true)
  })

  it('anchors the whole path, so ** does not match the bare prefix', () => {
    expect(globToRegex('src/**').test('src')).toBe(false)
  })

  it('keeps * inside one segment', () => {
    expect(globToRegex('src/*').test('src/a.js')).toBe(true)
    expect(globToRegex('src/*').test('src/orders/order.js')).toBe(false)
    expect(globToRegex('src/*.js').test('src/a.js')).toBe(true)
  })

  it('matches ? as exactly one non-separator character', () => {
    expect(globToRegex('src/?.js').test('src/a.js')).toBe(true)
    expect(globToRegex('src/?.js').test('src/ab.js')).toBe(false)
    expect(globToRegex('src/?.js').test('src//.js')).toBe(false)
  })

  it('is case sensitive', () => {
    expect(globToRegex('SRC/**').test('src/a.js')).toBe(false)
    expect(globToRegex('src/**').test('SRC/a.js')).toBe(false)
  })

  it('frees nothing below a bare directory pattern — the hook has no implicit /** (preserved quirk)', () => {
    expect(globToRegex('src').test('src/a.js')).toBe(false)
    expect(globToRegex('src/').test('src/a.js')).toBe(false)
    expect(globToRegex('src').test('src')).toBe(true)
  })

  it('keeps a literal space literal — the ** sentinel is a NUL byte, not a space', () => {
    // Worth pinning: a terminal dump renders the hook's `\0` sentinel as a
    // blank, which invites the wrong conclusion that spaces widen into `**`.
    // They do not; `hook-parity.spec.ts` holds us to the shipped behaviour.
    expect(globToRegex('my dir/*').test('my dir/a.js')).toBe(true)
    expect(globToRegex('my dir/*').test('my/any/dir/a.js')).toBe(false)
    expect(globToRegex('a b').test('a b')).toBe(true)
    expect(globToRegex('a b').test('a/x/y/b')).toBe(false)
  })

  it('escapes regex metacharacters so they stay literal', () => {
    expect(globToRegex('src/a.js').test('src/a.js')).toBe(true)
    expect(globToRegex('src/a.js').test('src/aXjs')).toBe(false)
    expect(globToRegex('src/(x)+.js').test('src/(x)+.js')).toBe(true)
  })
})

describe('isValidPattern (R7)', () => {
  it('accepts a root-relative pattern', () => {
    expect(isValidPattern('src/**')).toBe(true)
    expect(isValidPattern('a/b/c.js')).toBe(true)
  })

  it('rejects patterns that escape the root', () => {
    expect(isValidPattern('/etc/passwd')).toBe(false)
    expect(isValidPattern('C:/Windows')).toBe(false)
    expect(isValidPattern('../outside')).toBe(false)
    expect(isValidPattern('a/../../b')).toBe(false)
  })

  it('rejects non-strings and the empty string', () => {
    expect(isValidPattern('')).toBe(false)
    expect(isValidPattern(42 as unknown as string)).toBe(false)
    expect(isValidPattern(null as unknown as string)).toBe(false)
  })

  it('allows a `..` substring that is not a whole segment', () => {
    expect(isValidPattern('src/a..b.js')).toBe(true)
  })
})
