/* HERDADO: não editar sem declarar a adaptação em src/heranca/PROCEDENCIA.md
 * origem:      scrum-harness (https://github.com/iago-leal/scrum-harness)
 * caminho:     packages/reversa-domain/tests/watch.spec.ts
 * revisão:     420305daa6cdd10858b720a34cb8db67d8e5c5e9 (2026-09-08)
 * copiado em:  2026-09-09
 * adaptações:  nenhuma
 */
/**
 * R5, R6 — the regression watch a delivery leaves behind.
 *
 * The section split carries real meaning: REVERSA is explicit that rules
 * which were originally 🟡/🔴 go to `Observações` "sem peso de regressão".
 * Counting those as watch items would inflate the risk a panel reports, so
 * the preamble table (the real watch) is kept apart from Observações,
 * Arquivadas and the re-extraction history.
 */

import { describe, expect, it } from 'vitest'
import { VERIFICATION_TYPES, WatchContract } from '../src/watch.ts'

const HEADER = '| ID | Origem (arquivo, seção) | Regra esperada após mudança | Tipo de verificação | Sinal de violação |\n|---|---|---|---|---|\n'

const WATCH = `# Regression watch — feature 001

${HEADER}| W001 | domain.md, Descontos | desconto gold só acima de 500 | presença | regra some |
| W002 | domain.md, Faturas | fatura exige pagamento | redação | texto muda |

## Histórico de re-extrações

Nenhuma ainda.

## Arquivadas

${HEADER}| W000 | domain.md, Antigo | regra antiga | ausência | n/a |

## Observações

${HEADER}| W900 | domain.md, Amarela | regra 🟡 sem peso | confidência | n/a |
`

describe('WatchContract (R5)', () => {
  it('reads the main watch from the preamble table', () => {
    const watch = WatchContract.read(WATCH)
    expect(watch.items).toHaveLength(2)
    expect(watch.items[0]).toMatchObject({
      id: 'W001',
      origem: 'domain.md, Descontos',
      regra: 'desconto gold só acima de 500',
      tipo: 'presença',
      sinal: 'regra some',
    })
  })

  it('never counts Observações as watch items', () => {
    const watch = WatchContract.read(WATCH)
    expect(watch.items.map(i => i.id)).not.toContain('W900')
    expect(watch.observacoes).toHaveLength(1)
    expect(watch.observacoes[0]?.id).toBe('W900')
  })

  it('keeps Arquivadas apart from the live watch', () => {
    const watch = WatchContract.read(WATCH)
    expect(watch.items.map(i => i.id)).not.toContain('W000')
    expect(watch.arquivadas).toHaveLength(1)
  })

  it('exposes the re-extraction history section', () => {
    expect(WatchContract.read(WATCH).historico).toContain('Nenhuma ainda')
  })

  it('reports a greenfield watch: main empty, observations filled', () => {
    const md = `# Watch\n\n## Observações\n\n${HEADER}| W900 | sdd/a.md | RF-01 implementado | presença | n/a |\n`
    const watch = WatchContract.read(md)
    expect(watch.items).toEqual([])
    expect(watch.observacoes).toHaveLength(1)
  })

  it('handles an absent file', () => {
    const watch = WatchContract.read(null)
    expect(watch.items).toEqual([])
    expect(watch.observacoes).toEqual([])
  })
})

describe('WatchContract — verification types (R6)', () => {
  it('accepts the four canonical types', () => {
    expect(VERIFICATION_TYPES).toEqual(['ausência', 'redação', 'presença', 'confidência'])
  })

  it('preserves an unknown verification type and flags it', () => {
    const md = `${HEADER}| W001 | a.md | regra | inventado | x |\n`
    const watch = WatchContract.read(md)
    expect(watch.items[0]?.tipo).toBe('inventado')
    expect(watch.anomalies.some(a => a.code === 'tipo-de-verificacao-desconhecido')).toBe(true)
  })

  it('does not flag the canonical types', () => {
    const md = `${HEADER}| W001 | a.md | r | ausência | x |\n| W002 | a.md | r | confidência | x |\n`
    const watch = WatchContract.read(md)
    expect(watch.anomalies.filter(a => a.code === 'tipo-de-verificacao-desconhecido')).toHaveLength(0)
  })
})
