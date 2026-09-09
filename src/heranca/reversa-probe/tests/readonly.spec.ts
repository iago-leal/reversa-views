/* HERDADO: não editar sem declarar a adaptação em src/heranca/PROCEDENCIA.md
 * origem:      scrum-harness (https://github.com/iago-leal/scrum-harness)
 * caminho:     packages/reversa-probe/tests/readonly.spec.ts
 * revisão:     420305daa6cdd10858b720a34cb8db67d8e5c5e9 (2026-09-08)
 * copiado em:  2026-09-09
 * adaptações:  nenhuma
 */
/**
 * R8 — read-only by construction, checked against the source.
 *
 * This probe is the only layer of the REVERSA panel that touches the disk,
 * so it is the only place where a write could ever appear. REVERSA's whole
 * safety story rests on the legacy being edited solely under a policy the
 * user controls, and `.reversa/reversa-config.json` is explicitly the user's
 * act alone — a panel that observes that guarantee must be structurally
 * unable to break it.
 */

import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import * as probe from '../src/index.ts'

const SRC = fileURLToPath(new URL('../src', import.meta.url))

function sources(): { name: string; text: string }[] {
  return readdirSync(SRC)
    .filter(name => name.endsWith('.ts'))
    .map(name => ({ name, text: readFileSync(`${SRC}/${name}`, 'utf8') }))
}

describe('the probe only ever reads (R8)', () => {
  it('has sources to check', () => {
    expect(sources().length).toBeGreaterThan(0)
  })

  it('imports node:fs in files.ts and nowhere else', () => {
    for (const { name, text } of sources()) {
      const imports = /from\s+['"]node:fs['"]/.test(text)
      if (name === 'files.ts') expect(imports, 'files.ts is the disk layer').toBe(true)
      else expect(imports, `${name} must not import node:fs`).toBe(false)
    }
  })

  it('uses no writing or executing API anywhere', () => {
    const forbidden = [
      'writeFileSync', 'appendFileSync', 'mkdirSync', 'rmSync', 'unlinkSync',
      'renameSync', 'copyFileSync', 'chmodSync', 'createWriteStream',
      'child_process', 'execSync', 'spawnSync',
    ]
    for (const { name, text } of sources()) {
      for (const api of forbidden) {
        expect(text.includes(api), `${name} must not use ${api}`).toBe(false)
      }
    }
  })

  it('exports nothing whose name suggests a write', () => {
    const forbidden = /^(write|save|update|delete|remove|create|set|persist|install|run|exec)/i
    for (const name of Object.keys(probe)) {
      expect(name, `${name} looks like a mutator`).not.toMatch(forbidden)
    }
  })

  it('never names the REVERSA config as a write target', () => {
    // The probe reads reversa-config.json; it must never be handed to a writer.
    for (const { name, text } of sources()) {
      expect(text, `${name}`).not.toMatch(/write[^\n]*reversa-config/i)
    }
  })
})
