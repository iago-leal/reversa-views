/* HERDADO: não editar sem declarar a adaptação em src/heranca/PROCEDENCIA.md
 * origem:      scrum-harness (https://github.com/iago-leal/scrum-harness)
 * caminho:     packages/reversa-domain/tests/table.spec.ts
 * revisão:     420305daa6cdd10858b720a34cb8db67d8e5c5e9 (2026-09-08)
 * copiado em:  2026-09-09
 * adaptações:  nenhuma
 */
/**
 * R2 — locating a REVERSA markdown table by its header.
 *
 * `legacy-impact.md` and `regression-watch.md` are written by an LLM from a
 * STRUCTURE INSTRUCTION in the skill ("Tabela `A | B | C`"), not emitted as
 * a fixed string. Matching the header literally would break on an added
 * accent, a different case or a stray comma — so the match is normalized
 * and the cells are read by position. An unrecognized header yields an
 * empty list and an anomaly, never garbage rows.
 */

import { describe, expect, it } from 'vitest'
import { findTable, splitSections } from '../src/table.ts'

const IMPACT_HEADER = ['Arquivo afetado', 'Componente', 'Tipo', 'Severidade', 'Justificativa']

const TABLE = [
  '| Arquivo afetado | Componente | Tipo | Severidade | Justificativa |',
  '|---|---|---|---|---|',
  '| src/a.js | Pedidos | regra-alterada | HIGH | desconto mudou |',
  '| src/b.js | Faturas | componente-novo | LOW | novo emissor |',
].join('\n')

describe('findTable (R2)', () => {
  it('finds the table and reads cells by position', () => {
    const rows = findTable(TABLE, IMPACT_HEADER)
    expect(rows).toHaveLength(2)
    expect(rows[0]).toEqual(['src/a.js', 'Pedidos', 'regra-alterada', 'HIGH', 'desconto mudou'])
    expect(rows[1]?.[2]).toBe('componente-novo')
  })

  it('matches a header that differs in case, accents and punctuation', () => {
    const md = [
      '| ARQUIVO AFETADO | Componente | Tipo | Severidade | Justificativa: |',
      '|---|---|---|---|---|',
      '| src/a.js | X | regra-nova | LOW | ok |',
    ].join('\n')
    expect(findTable(md, IMPACT_HEADER)).toHaveLength(1)
  })

  it('matches a header with collapsed or extra whitespace', () => {
    const md = [
      '|Arquivo   afetado|Componente|Tipo|Severidade|Justificativa|',
      '|---|---|---|---|---|',
      '| src/a.js | X | regra-nova | LOW | ok |',
    ].join('\n')
    expect(findTable(md, IMPACT_HEADER)).toHaveLength(1)
  })

  it('returns nothing when the header is not recognizable', () => {
    const md = [
      '| Coisa | Outra |',
      '|---|---|',
      '| a | b |',
    ].join('\n')
    expect(findTable(md, IMPACT_HEADER)).toEqual([])
  })

  it('stops at the end of the table and ignores prose after it', () => {
    const md = `${TABLE}\n\nTexto solto depois.\n\n| a | b |\n`
    expect(findTable(md, IMPACT_HEADER)).toHaveLength(2)
  })

  it('skips the separator row whatever its dashes look like', () => {
    const md = [
      '| Arquivo afetado | Componente | Tipo | Severidade | Justificativa |',
      '| :--- | :---: | ---: | --- | --- |',
      '| src/a.js | X | regra-nova | LOW | ok |',
    ].join('\n')
    expect(findTable(md, IMPACT_HEADER)).toHaveLength(1)
  })

  it('handles an absent file and a table with only a header', () => {
    expect(findTable(null, IMPACT_HEADER)).toEqual([])
    const onlyHeader = '| Arquivo afetado | Componente | Tipo | Severidade | Justificativa |\n|---|---|---|---|---|\n'
    expect(findTable(onlyHeader, IMPACT_HEADER)).toEqual([])
  })

  it('keeps a row with fewer cells so the caller can flag it', () => {
    const md = [
      '| Arquivo afetado | Componente | Tipo | Severidade | Justificativa |',
      '|---|---|---|---|---|',
      '| src/a.js | X | regra-nova |',
    ].join('\n')
    const rows = findTable(md, IMPACT_HEADER)
    expect(rows).toHaveLength(1)
    expect(rows[0]).toHaveLength(3)
  })
})

describe('splitSections (R5)', () => {
  const md = [
    '# Regression watch',
    '',
    '| ID | Origem | Regra | Tipo | Sinal |',
    '|---|---|---|---|---|',
    '| W001 | a.md | regra | presença | sumiu |',
    '',
    '## Histórico de re-extrações',
    '',
    'nada ainda',
    '',
    '## Arquivadas',
    '',
    '| W000 | velho | x | ausência | y |',
    '',
    '## Observações',
    '',
    '| W900 | obs | regra amarela | redação | z |',
  ].join('\n')

  it('splits the document by level-2 headings', () => {
    const sections = splitSections(md)
    // Normalization folds punctuation to spaces, so the hyphen of
    // "re-extrações" becomes a space in the key.
    expect(Object.keys(sections)).toContain('historico de re extracoes')
    expect(Object.keys(sections)).toContain('arquivadas')
    expect(Object.keys(sections)).toContain('observacoes')
  })

  it('keeps the text before the first heading as the preamble', () => {
    const sections = splitSections(md)
    expect(sections['']).toContain('W001')
    expect(sections['']).not.toContain('W900')
  })

  it('normalizes heading keys, so accents and case do not matter', () => {
    const sections = splitSections('## OBSERVAÇÕES\n\nx\n')
    expect(sections['observacoes']).toContain('x')
  })

  it('returns just the preamble for a document with no headings', () => {
    const sections = splitSections('sem headings\n')
    expect(sections['']).toContain('sem headings')
  })
})
