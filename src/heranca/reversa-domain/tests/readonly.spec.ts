/* HERDADO: não editar sem declarar a adaptação em src/heranca/PROCEDENCIA.md
 * origem:      scrum-harness (https://github.com/iago-leal/scrum-harness)
 * caminho:     packages/reversa-domain/tests/readonly.spec.ts
 * revisão:     420305daa6cdd10858b720a34cb8db67d8e5c5e9 (2026-09-08)
 * copiado em:  2026-09-09
 * adaptações:  nenhuma
 */
/**
 * R12 — read-only by construction, checked against the source itself.
 *
 * REVERSA's whole safety story rests on writes being confined to its own
 * folders, and `.reversa/reversa-config.json` is explicitly the user's act
 * alone. A panel that observes that guarantee must not be able to violate
 * it, so this is asserted structurally rather than by convention: the core
 * cannot even reach the filesystem, because it never imports it.
 */

import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import * as reversa from '../src/index.ts'

const SRC = fileURLToPath(new URL('../src', import.meta.url))

function sources(): { name: string; text: string }[] {
  return readdirSync(SRC)
    .filter(name => name.endsWith('.ts'))
    .map(name => ({ name, text: readFileSync(`${SRC}/${name}`, 'utf8') }))
}

describe('the domain never touches the filesystem (R12)', () => {
  it('has sources to check', () => {
    expect(sources().length).toBeGreaterThan(0)
  })

  it('imports no filesystem module anywhere in src/', () => {
    for (const { name, text } of sources()) {
      expect(text, `${name} must not import node:fs`).not.toMatch(/from\s+['"]node:fs['"]/)
      expect(text, `${name} must not import fs`).not.toMatch(/from\s+['"]fs(\/promises)?['"]/)
      expect(text, `${name} must not require fs`).not.toMatch(/require\(\s*['"]n?o?d?e?:?fs/)
    }
  })

  it('imports no child_process or network module', () => {
    for (const { name, text } of sources()) {
      expect(text, `${name}`).not.toMatch(/from\s+['"]node:(child_process|http|https|net)['"]/)
    }
  })

  it('exports nothing whose name suggests a write', () => {
    const forbidden = /^(write|save|update|delete|remove|create|set|persist|install|run|exec)/i
    for (const name of Object.keys(reversa)) {
      expect(name, `${name} looks like a mutator`).not.toMatch(forbidden)
    }
  })

  it('exports only functions, classes and types', () => {
    for (const [name, value] of Object.entries(reversa)) {
      expect(['function', 'object', 'string'], `${name} is ${typeof value}`).toContain(typeof value)
    }
  })
})
