/* HERDADO: não editar sem declarar a adaptação em src/heranca/PROCEDENCIA.md
 * origem:      scrum-harness (https://github.com/iago-leal/scrum-harness)
 * caminho:     packages/reversa-domain/tests/impact.spec.ts
 * revisão:     420305daa6cdd10858b720a34cb8db67d8e5c5e9 (2026-09-08)
 * copiado em:  2026-09-09
 * adaptações:  nenhuma
 */
/**
 * R1, R3, R4, R7 — what the agents actually touched in the legacy code.
 *
 * This is the axis the panel exists for: "did REVERSA change my legacy, and
 * where?". The load-bearing test is the greenfield discrimination. An
 * earlier draft inferred greenfield from three symptoms (empty watch,
 * filled Observações, all `componente-novo`) — but REVERSA *mandates* that
 * 🟡/🔴 rules go to Observações, so a legitimate LEGACY feature that only
 * adds components satisfies all three by rule, not by accident. The header
 * note is written on every greenfield run, so its absence is the evidence.
 */

import { describe, expect, it } from 'vitest'
import { ImpactContract, IMPACT_TYPES, SEVERITIES } from '../src/impact.ts'

const HEADER = '| Arquivo afetado | Componente | Tipo | Severidade | Justificativa |\n|---|---|---|---|---|\n'

const LEGACY = `# Impacto no legado — feature 001

${HEADER}| src/orders/order.js | Pedidos | regra-alterada | HIGH | desconto por tier mudou |
| src/billing/invoice.js | Faturas | regra-nova | MEDIUM | nova validação |
| src/api/routes.js | API | componente-novo | LOW | rota nova |
`

const GREENFIELD_NOTE = 'Feature greenfield, sem legado pré-existente. Âncora: prd.md + specs SDD.'

describe('ImpactContract — reading the table (R1)', () => {
  it('reads every affected file with its five fields', () => {
    const impact = ImpactContract.read(LEGACY)
    expect(impact.files).toHaveLength(3)
    expect(impact.files[0]).toMatchObject({
      arquivo: 'src/orders/order.js',
      componente: 'Pedidos',
      tipo: 'regra-alterada',
      severidade: 'HIGH',
      justificativa: 'desconto por tier mudou',
    })
  })

  it('flags an incomplete row and leaves it out', () => {
    const md = `${HEADER}| src/a.js | X | regra-nova |\n`
    const impact = ImpactContract.read(md)
    expect(impact.files).toHaveLength(0)
    expect(impact.anomalies.some(a => a.code === 'linha-de-impacto-incompleta')).toBe(true)
  })

  it('reports an unrecognizable table instead of guessing', () => {
    const impact = ImpactContract.read('| Foo | Bar |\n|---|---|\n| a | b |\n')
    expect(impact.files).toEqual([])
    expect(impact.anomalies.some(a => a.code === 'tabela-nao-reconhecida')).toBe(true)
  })

  it('handles an absent file', () => {
    const impact = ImpactContract.read(null)
    expect(impact.files).toEqual([])
    expect(impact.cenario).toBe('legado')
  })
})

describe('ImpactContract — closed taxonomy, unknown preserved (R3)', () => {
  it('accepts the seven canonical types', () => {
    expect(IMPACT_TYPES).toEqual([
      'regra-alterada',
      'regra-removida',
      'regra-nova',
      'componente-novo',
      'componente-extinto',
      'delta-de-dados',
      'delta-de-contrato-externo',
    ])
  })

  it('accepts the four severities, most serious first', () => {
    expect(SEVERITIES).toEqual(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'])
  })

  it('preserves an unknown type and flags it', () => {
    const md = `${HEADER}| src/a.js | X | categoria-nova-do-reversa | HIGH | y |\n`
    const impact = ImpactContract.read(md)
    expect(impact.files[0]?.tipo).toBe('categoria-nova-do-reversa')
    expect(impact.anomalies.some(a => a.code === 'tipo-de-impacto-desconhecido')).toBe(true)
  })

  it('preserves an unknown severity and flags it', () => {
    const md = `${HEADER}| src/a.js | X | regra-nova | BLOCKER | y |\n`
    const impact = ImpactContract.read(md)
    expect(impact.files[0]?.severidade).toBe('BLOCKER')
    expect(impact.anomalies.some(a => a.code === 'severidade-desconhecida')).toBe(true)
  })
})

describe('ImpactContract — deterministic counts (R4)', () => {
  it('always lists the canonical members, zeros included, in canonical order', () => {
    const impact = ImpactContract.read(LEGACY)
    expect(impact.bySeverity.map(entry => entry.key)).toEqual(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'])
    expect(impact.bySeverity.find(e => e.key === 'CRITICAL')?.count).toBe(0)
    expect(impact.bySeverity.find(e => e.key === 'HIGH')?.count).toBe(1)
    expect(impact.byType.map(entry => entry.key).slice(0, 7)).toEqual([...IMPACT_TYPES])
  })

  it('puts unknown values after the canonical ones', () => {
    const md = `${HEADER}| src/a.js | X | zzz-desconhecido | BLOCKER | y |\n`
    const impact = ImpactContract.read(md)
    expect(impact.byType.at(-1)?.key).toBe('zzz-desconhecido')
    expect(impact.bySeverity.at(-1)?.key).toBe('BLOCKER')
  })
})

describe('ImpactContract — greenfield vs legado (R7)', () => {
  it('reads greenfield from the header note REVERSA always writes', () => {
    const md = `# Impacto\n\n${GREENFIELD_NOTE}\n\n${HEADER}| src/a.js | Comp | componente-novo | LOW | novo |\n`
    expect(ImpactContract.read(md).cenario).toBe('greenfield')
  })

  it('treats the absence of the note as legado', () => {
    expect(ImpactContract.read(LEGACY).cenario).toBe('legado')
  })

  it('does NOT call a legacy feature greenfield just because it only adds components', () => {
    // REVERSA sends 🟡/🔴 rules to Observações by rule, so a legacy feature
    // can legitimately show an empty watch and all-`componente-novo` impact.
    // Only the header note decides.
    const md = `# Impacto no legado\n\n${HEADER}| src/a.js | Comp | componente-novo | LOW | novo |\n| src/b.js | Comp2 | componente-novo | LOW | novo |\n`
    const impact = ImpactContract.read(md)
    expect(impact.cenario).toBe('legado')
    expect(impact.anomalies.some(a => a.code === 'cenario-ambiguo')).toBe(false)
  })

  it('keeps the note authoritative but flags a contradictory shape', () => {
    const md = `# Impacto\n\n${GREENFIELD_NOTE}\n\n${HEADER}| src/a.js | Comp | regra-alterada | HIGH | mexeu em regra existente |\n`
    const impact = ImpactContract.read(md)
    expect(impact.cenario).toBe('greenfield')
    expect(impact.anomalies.some(a => a.code === 'cenario-ambiguo')).toBe(true)
  })

  it('recognizes the note regardless of surrounding punctuation', () => {
    const md = `> ${GREENFIELD_NOTE}\n\n${HEADER}| a.js | C | componente-novo | LOW | x |\n`
    expect(ImpactContract.read(md).cenario).toBe('greenfield')
  })
})
