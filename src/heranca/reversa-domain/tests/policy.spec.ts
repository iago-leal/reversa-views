/* HERDADO: não editar sem declarar a adaptação em src/heranca/PROCEDENCIA.md
 * origem:      scrum-harness (https://github.com/iago-leal/scrum-harness)
 * caminho:     packages/reversa-domain/tests/policy.spec.ts
 * revisão:     420305daa6cdd10858b720a34cb8db67d8e5c5e9 (2026-09-08)
 * copiado em:  2026-09-09
 * adaptações:  nenhuma
 */
/**
 * R4, R5, R6 — the legacy-write policy of REVERSA, as the hook decides it.
 *
 * The ordering asserted here is normative: it mirrors `main()` of
 * `templates/hooks/check-legacy-policy.mjs` read top to bottom. Two cases
 * are the reason this contract exists at all, both caught in review:
 * `.reversa/reversa-config.json` is DENIED even though it sits inside a
 * REVERSA folder (the config check precedes the folder check), and a
 * non-empty `allowedPaths` whose patterns are all invalid DENIES by safe
 * failure instead of freeing everything.
 */

import { describe, expect, it } from 'vitest'
import { PolicyContract, writableFolders } from '../src/policy.ts'
import type { PolicyConfig } from '../src/policy.ts'

const FOLDERS = writableFolders({ outputFolder: '_reversa_sdd', forwardFolder: '_reversa_forward' })

function policy(config: string | null): PolicyContract {
  return PolicyContract.read(config, FOLDERS)
}

const OPEN = JSON.stringify({ version: 1, allowLegacyEdits: true, allowedPaths: [] })
const SCOPED = JSON.stringify({ version: 1, allowLegacyEdits: true, allowedPaths: ['src/**'] })
const CLOSED = JSON.stringify({ version: 1, allowLegacyEdits: false, allowedPaths: [] })

describe('PolicyContract.read (R4)', () => {
  it('reads the real installed default as closed', () => {
    const p = policy(JSON.stringify({ version: 1, allowLegacyEdits: false, allowedPaths: [] }))
    expect(p.allowLegacyEdits).toBe(false)
    expect(p.version).toBe(1)
    expect(p.allowedPaths).toEqual([])
  })

  it('fails safe with a named cause when the config is absent', () => {
    const p = policy(null)
    expect(p.allowLegacyEdits).toBe(false)
    expect(p.cause).toBe('config-ausente')
  })

  it('fails safe with a named cause when the JSON is invalid', () => {
    const p = policy('{ not json')
    expect(p.allowLegacyEdits).toBe(false)
    expect(p.cause).toBe('json-invalido')
  })

  it('fails safe with a named cause when allowLegacyEdits has the wrong type', () => {
    for (const bad of ['"true"', '1', 'null', '{}']) {
      const p = policy(`{ "version": 1, "allowLegacyEdits": ${bad} }`)
      expect(p.allowLegacyEdits, `allowLegacyEdits: ${bad}`).toBe(false)
      expect(p.cause).toBe('tipo-invalido')
    }
  })

  it('never turns an absent or broken config into permission', () => {
    expect(policy(null).allowLegacyEdits).toBe(false)
    expect(policy('').allowLegacyEdits).toBe(false)
    expect(policy('[]').allowLegacyEdits).toBe(false)
  })

  it('tolerates a BOM (R13)', () => {
    const p = policy('\uFEFF' + OPEN)
    expect(p.allowLegacyEdits).toBe(true)
    expect(p.cause).toBeNull()
  })

  it('drops non-string entries from allowedPaths', () => {
    const p = policy(JSON.stringify({ version: 1, allowLegacyEdits: true, allowedPaths: ['src/**', 42, '', null] }))
    expect(p.allowedPaths).toEqual(['src/**'])
  })
})

describe('writableFolders (R5)', () => {
  it('derives the six folders from the state values, without a trailing slash', () => {
    expect(FOLDERS).toEqual([
      '.reversa',
      '_reversa_sdd',
      '_reversa_docs',
      '_reversa_forward',
      '_reversa_bugs',
      '_reversa_refactor',
    ])
  })

  it('honours custom output and forward folders', () => {
    const custom = writableFolders({ outputFolder: 'specs', forwardFolder: 'feat' })
    expect(custom).toContain('specs')
    expect(custom).toContain('feat')
    expect(custom).not.toContain('_reversa_sdd')
  })

  it('falls back to the defaults unless the value is a non-empty string', () => {
    for (const bad of [undefined, null, '', 42, {}]) {
      const folders = writableFolders({ outputFolder: bad as never, forwardFolder: bad as never })
      expect(folders, `value: ${JSON.stringify(bad)}`).toContain('_reversa_sdd')
      expect(folders).toContain('_reversa_forward')
    }
  })
})

describe('PolicyContract.verdict — the hook order is normative (R6)', () => {
  it('1. a path outside the root is out of jurisdiction, not permitted', () => {
    const v = policy(OPEN).verdict('../elsewhere/x.js')
    expect(v.outcome).toBe('fora-de-jurisdicao')
    const abs = policy(OPEN).verdict('/etc/passwd')
    expect(abs.outcome).toBe('fora-de-jurisdicao')
  })

  it('2. reversa-config.json is denied even though it lives under .reversa/', () => {
    // The config check runs BEFORE the writable-folder check in the hook.
    const v = policy(OPEN).verdict('.reversa/reversa-config.json')
    expect(v.outcome).toBe('proibido')
    expect(v.reason).toBe('config-e-ato-do-usuario')
  })

  it('3. REVERSA folders are always writable, even with the policy off', () => {
    for (const path of ['.reversa/state.json', '_reversa_sdd/inventory.md', '_reversa_forward/001-x/actions.md', '_reversa_docs/index.html', '_reversa_bugs/b.md', '_reversa_refactor/r.md']) {
      const v = policy(CLOSED).verdict(path)
      expect(v.outcome, path).toBe('permitido')
      expect(v.reason).toBe('pasta-do-reversa')
    }
  })

  it('3. a folder match is exact or a real prefix, never a name prefix', () => {
    expect(policy(CLOSED).verdict('_reversa_sdd').outcome).toBe('permitido')
    expect(policy(CLOSED).verdict('_reversa_sddx/a.md').outcome).toBe('proibido')
  })

  it('4. the policy being off denies a legacy path, naming the cause', () => {
    const v = policy(CLOSED).verdict('src/orders/order.js')
    expect(v.outcome).toBe('proibido')
    expect(v.reason).toBe('politica-desligada')
  })

  it('4. an absent config denies too (safe failure)', () => {
    expect(policy(null).verdict('src/a.js').outcome).toBe('proibido')
  })

  it('5. an empty allowedPaths with the policy on frees the whole project', () => {
    const v = policy(OPEN).verdict('src/orders/order.js')
    expect(v.outcome).toBe('permitido')
    expect(v.reason).toBe('liberacao-irrestrita')
  })

  it('6. a non-empty list whose patterns are ALL invalid denies by safe failure', () => {
    const cfg = JSON.stringify({ version: 1, allowLegacyEdits: true, allowedPaths: ['/etc/x', '../y'] })
    const v = policy(cfg).verdict('src/a.js')
    expect(v.outcome).toBe('proibido')
    expect(v.reason).toBe('todos-os-padroes-invalidos')
  })

  it('7. a matching pattern permits', () => {
    const v = policy(SCOPED).verdict('src/orders/order.js')
    expect(v.outcome).toBe('permitido')
    expect(v.reason).toBe('casa-padrao')
  })

  it('8. a path outside the patterns is denied', () => {
    const v = policy(SCOPED).verdict('lib/other.js')
    expect(v.outcome).toBe('proibido')
    expect(v.reason).toBe('fora-dos-padroes')
  })

  it('applies the quirk: a bare directory pattern frees nothing below it', () => {
    const cfg = JSON.stringify({ version: 1, allowLegacyEdits: true, allowedPaths: ['src'] })
    expect(policy(cfg).verdict('src/a.js').outcome).toBe('proibido')
  })

  it('ignores invalid patterns individually while a valid one remains', () => {
    const cfg = JSON.stringify({ version: 1, allowLegacyEdits: true, allowedPaths: ['../bad', 'src/**'] })
    expect(policy(cfg).verdict('src/a.js').outcome).toBe('permitido')
    expect(policy(cfg).verdict('lib/a.js').outcome).toBe('proibido')
  })
})
