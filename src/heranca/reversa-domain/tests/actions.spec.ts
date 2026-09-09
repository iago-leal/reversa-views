/* HERDADO: não editar sem declarar a adaptação em src/heranca/PROCEDENCIA.md
 * origem:      scrum-harness (https://github.com/iago-leal/scrum-harness)
 * caminho:     packages/reversa-domain/tests/actions.spec.ts
 * revisão:     420305daa6cdd10858b720a34cb8db67d8e5c5e9 (2026-09-08)
 * copiado em:  2026-09-09
 * adaptações:  nenhuma
 */
/**
 * R10 — counting the actions of a forward feature.
 *
 * The load-bearing test in this file is the `## Emendas` one. REVERSA's
 * `/reversa-forward` scans the WHOLE file with no section filter, and
 * `reversa-add` warns in as many words: "jamais deixe `[ ]` para trás, o
 * `/reversa-forward` volta a classificar a feature como
 * `coding-em-progresso`". An earlier draft of this spec claimed amendments
 * were excluded from the decision — it would have reported `done` where
 * REVERSA reports `coding-em-progresso`, which is exactly the divergence
 * this reader exists to prevent. Splitting amendments out is reporting
 * only; it never moves the verdict.
 */

import { describe, expect, it } from 'vitest'
import { countDoubts, scanActions } from '../src/actions.ts'

const HEADER = '| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |\n|---|---|---|---|---|---|---|\n'

const BODY_OPEN = HEADER
  + '| T001 | Criar rota | - | - | `src/a.js` | 🟢 | `[X]` |\n'
  + '| T002 | Ligar handler | - | - | `src/b.js` | 🟢 | `[ ]` |\n'

const BODY_CLOSED = HEADER
  + '| T001 | Criar rota | - | - | `src/a.js` | 🟢 | `[X]` |\n'
  + '| T002 | Ligar handler | - | - | `src/b.js` | 🟢 | `[X]` |\n'

describe('scanActions (R10)', () => {
  it('counts closed and open rows of the main body', () => {
    const scan = scanActions(BODY_OPEN)
    expect(scan.total).toBe(2)
    expect(scan.fechadas).toBe(1)
    expect(scan.abertas).toBe(1)
  })

  it('ignores headers, separators and free prose', () => {
    const md = '# Ações\n\nTexto solto com [ ] no meio.\n\n' + BODY_CLOSED + '\nOutro parágrafo.\n'
    const scan = scanActions(md)
    expect(scan.total).toBe(2)
    expect(scan.abertas).toBe(0)
  })

  it('counts an amendment row toward the verdict — the whole file is scanned', () => {
    const md = BODY_CLOSED
      + '\n## Emendas\n\n' + HEADER
      + '| E001 | Ajuste pedido | - | - | `src/c.js` | 🟢 | `[ ]` |\n'
    const scan = scanActions(md)
    expect(scan.abertas).toBe(1)
    expect(scan.hasOpen).toBe(true)
  })

  it('reports amendments separately without changing the verdict', () => {
    const md = BODY_CLOSED
      + '\n## Emendas\n\n' + HEADER
      + '| E001 | Ajuste pedido | - | - | `src/c.js` | 🟢 | `[X]` |\n'
    const scan = scanActions(md)
    expect(scan.emendas).toBe(1)
    expect(scan.total).toBe(3)
    expect(scan.fechadas).toBe(3)
    expect(scan.hasOpen).toBe(false)
  })

  it('does not count a lowercase [x], and says so', () => {
    const md = HEADER + '| T001 | Algo | - | - | `src/a.js` | 🟢 | `[x]` |\n'
    const scan = scanActions(md)
    expect(scan.total).toBe(0)
    expect(scan.anomalies.some(a => a.code === 'checkbox-nao-canonico')).toBe(true)
  })

  it('reports a file with no action rows', () => {
    const scan = scanActions('# Ações\n\nNada aqui ainda.\n')
    expect(scan.total).toBe(0)
    expect(scan.hasOpen).toBe(false)
    expect(scan.anomalies.some(a => a.code === 'actions-sem-acoes')).toBe(true)
  })

  it('accepts rows with or without a backtick around the marker', () => {
    const md = HEADER
      + '| T001 | A | - | - | `src/a.js` | 🟢 | `[X]` |\n'
      + '| T002 | B | - | - | `src/b.js` | 🟢 | [X] |\n'
    expect(scanActions(md).total).toBe(2)
  })

  it('tolerates trailing whitespace after the row', () => {
    const md = HEADER + '| T001 | A | - | - | `src/a.js` | 🟢 | `[ ]` |   \n'
    expect(scanActions(md).abertas).toBe(1)
  })

  it('handles a null file as no actions at all', () => {
    const scan = scanActions(null)
    expect(scan.total).toBe(0)
    expect(scan.hasOpen).toBe(false)
  })
})

describe('countDoubts (R10)', () => {
  it('counts the [DÚVIDA] markers of requirements.md', () => {
    const md = '# Req\n\nR1 — algo [DÚVIDA] a confirmar.\n\nR2 — outro [DÚVIDA].\n'
    expect(countDoubts(md)).toBe(2)
  })

  it('returns zero for a clean or absent file', () => {
    expect(countDoubts('# Req\n\nTudo claro.\n')).toBe(0)
    expect(countDoubts(null)).toBe(0)
  })
})
