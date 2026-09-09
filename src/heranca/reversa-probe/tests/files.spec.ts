/* HERDADO: não editar sem declarar a adaptação em src/heranca/PROCEDENCIA.md
 * origem:      scrum-harness (https://github.com/iago-leal/scrum-harness)
 * caminho:     packages/reversa-probe/tests/files.spec.ts
 * revisão:     420305daa6cdd10858b720a34cb8db67d8e5c5e9 (2026-09-08)
 * copiado em:  2026-09-09
 * adaptações:  nenhuma
 */
/**
 * R2, R4, R5, R6, R7 — the three functions that touch the disk.
 *
 * `listNames` deliberately does NOT behave like the house's
 * `listWorkspaceFiles`: that one skips dot-prefixed names (REVERSA keeps
 * everything in `.reversa/`), returns path-prefixed results and descends
 * into subfolders — while the Model compares BARE BASENAMES in a Set. Reusing
 * it would make every feature report stage `requirements` forever, silently.
 *
 * The null-vs-[] distinction is load-bearing: `null` means the directory does
 * not exist ("no active feature"), `[]` means it exists and is empty
 * ("feature-dir vazia"). The Model branches on exactly that difference.
 */

import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { listNames, readText, REVERSA_FILE_CAP, resolveInside } from '../src/files.ts'

let root: string

beforeAll(() => {
  root = mkdtempSync(join(tmpdir(), 'reversa-probe-'))
  mkdirSync(join(root, 'feature/sub'), { recursive: true })
  mkdirSync(join(root, 'vazia'), { recursive: true })
  writeFileSync(join(root, 'feature/requirements.md'), '# req\n')
  writeFileSync(join(root, 'feature/roadmap.md'), '# road\n')
  writeFileSync(join(root, 'feature/sub/escondido.md'), 'x\n')
  writeFileSync(join(root, '.oculto.json'), '{}\n')
  writeFileSync(join(root, 'grande.md'), 'x'.repeat(REVERSA_FILE_CAP + 10))
})

afterAll(() => { rmSync(root, { recursive: true, force: true }) })

describe('listNames (R2, R4)', () => {
  it('returns bare basenames, never path-prefixed', () => {
    const names = listNames(join(root, 'feature'))
    expect(names).toContain('requirements.md')
    expect(names).toContain('roadmap.md')
    expect(names?.some(name => name.includes('/'))).toBe(false)
  })

  it('does not descend into subfolders', () => {
    const names = listNames(join(root, 'feature'))
    expect(names).not.toContain('escondido.md')
    expect(names).toContain('sub')
  })

  it('lists dot-prefixed entries, which REVERSA depends on', () => {
    expect(listNames(root)).toContain('.oculto.json')
  })

  it('returns null for a directory that does not exist', () => {
    expect(listNames(join(root, 'nao-existe'))).toBeNull()
  })

  it('returns an empty array for a directory that exists and is empty', () => {
    expect(listNames(join(root, 'vazia'))).toEqual([])
  })

  it('returns null when the path is a file, not a directory', () => {
    expect(listNames(join(root, 'grande.md'))).toBeNull()
  })
})

describe('readText (R5, R7)', () => {
  it('reads a file that exists', () => {
    expect(readText(join(root, 'feature/requirements.md'))).toBe('# req\n')
  })

  it('returns null for a file that does not exist', () => {
    expect(readText(join(root, 'nao-existe.md'))).toBeNull()
  })

  it('returns null for a directory', () => {
    expect(readText(join(root, 'feature'))).toBeNull()
  })

  it('refuses a file above the byte cap instead of reading it', () => {
    expect(readText(join(root, 'grande.md'))).toBeNull()
  })

  it('reads a file just under the cap', () => {
    const small = join(root, 'pequeno.md')
    writeFileSync(small, 'y'.repeat(1024))
    expect(readText(small)?.length).toBe(1024)
  })

  it('never throws, whatever the path', () => {
    expect(() => readText('/nao/existe/em/lugar/nenhum')).not.toThrow()
    expect(() => readText('')).not.toThrow()
  })
})

describe('resolveInside (R6)', () => {
  it('resolves a relative path inside the root', () => {
    expect(resolveInside(root, 'feature')).toBe(join(root, 'feature'))
    expect(resolveInside(root, 'a/b/c.md')).toBe(join(root, 'a/b/c.md'))
  })

  it('refuses a path that climbs out with ..', () => {
    expect(resolveInside(root, '../fora')).toBeNull()
    expect(resolveInside(root, 'a/../../fora')).toBeNull()
  })

  it('refuses an absolute path', () => {
    expect(resolveInside(root, '/etc/passwd')).toBeNull()
    expect(resolveInside(root, 'C:/Windows')).toBeNull()
  })

  it('accepts a `..` that stays inside', () => {
    expect(resolveInside(root, 'a/../b')).toBe(join(root, 'b'))
  })

  it('refuses an empty candidate', () => {
    expect(resolveInside(root, '')).toBeNull()
  })

  it('is lexical: it does not resolve symlinks (declared limit, R6)', () => {
    // A symlink inside the root pointing outside passes the lexical check.
    // Accepted for a reader that never writes; asserted so the choice is
    // visible rather than discovered.
    const link = join(root, 'atalho')
    try {
      symlinkSync(tmpdir(), link)
    } catch {
      return // some platforms refuse symlinks; the rule still holds
    }
    expect(resolveInside(root, 'atalho')).toBe(join(root, 'atalho'))
  })
})
