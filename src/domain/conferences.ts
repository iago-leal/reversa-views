/**
 * The conference register of a delivery: what a person checked of what the
 * agent delivered (feature 010, RN-05, RN-06, D-09 to D-11).
 *
 * The register section is NOT prescribed by the process. `/reversa-plan`
 * prescribes an executable walkthrough, and the register is a practice of the
 * agent, present in 1 of 307 onboardings of `~/dev` on 2026-09-19. That fixes
 * the tone of everything here: a missing section is a named state and never an
 * anomaly, and only a section that is there and cannot be read is a defect to
 * say.
 *
 * Nothing is classified. The result of a row is exposed as written: "não
 * executável" and "10 conferem; 10 divergente" are both registrations, and
 * reducing either to a verdict would be the panel judging the test.
 *
 * Pure, like the rest of the domain: no disk, no platform module.
 * @module domain/conferences
 */

import { cellsOf, normalizeCell } from '../heranca/reversa-domain/src/index.ts'
import { columnKey, isBlankCell } from './delivery-link.ts'
import { CONFERENCE_ROW_CAP } from './limits.ts'
import type { ConferenceLine, ConferenceRecord, DeliveryAnomaly } from './types.ts'

/** The register of one folder, and what could not be read of it. */
export interface ConferenceReading {
  registro: ConferenceRecord
  anomalias: DeliveryAnomaly[]
}

/** How the heading of the register section begins, once normalized and without its number (D-09). */
const SECTION_START = 'registro de conferencias'

/** The two columns that make a table the register, and the three read when present. */
const REQUIRED = ['data', 'resultado'] as const
const OPTIONAL = ['marco', 'item', 'observacao'] as const

/**
 * Read the conference register of one onboarding.
 *
 * Presence travels in `arquivo`: null is an absent onboarding; a path with a
 * null text is one the listing showed and the probe could not read, which is
 * a partial reading to declare.
 * @param md - the text of the onboarding, or null.
 * @param arquivo - its path relative to the root, or null when it is absent.
 * @returns the register in one of its six states, and the losses; never throws.
 */
export function readConferences(md: string | null, arquivo: string | null): ConferenceReading {
  const empty = (estado: ConferenceRecord['estado'], secao: string | null = null): ConferenceRecord => ({
    estado,
    arquivo,
    secao,
    linhas: [],
    registradas: 0,
    total: 0,
  })

  if (arquivo === null) return { registro: empty('sem-registro'), anomalias: [] }
  if (md === null) {
    return {
      registro: empty('nao-lido'),
      anomalias: [
        {
          file: arquivo,
          code: 'artefato-da-entrega-nao-lido',
          detail: 'presente e não lido, acima do teto de bytes da sonda ou ilegível: a conferência é parcial',
        },
      ],
    }
  }

  const section = registerSection(md)
  if (section === null) return { registro: empty('sem-registro'), anomalias: [] }

  const table = registerTable(section.lines)
  if (table.kind === 'unrecognised') {
    return {
      registro: empty('nao-reconhecido', section.heading),
      anomalias: [
        {
          file: arquivo,
          code: 'tabela-nao-reconhecida',
          detail:
            table.header === null
              ? `${section.heading}: nenhuma tabela na seção`
              : `${section.heading}: ${table.header.join(' | ')}`,
        },
      ],
    }
  }

  const rows = table.rows
  if (rows.length === 0) return { registro: empty('vazio', section.heading), anomalias: [] }

  const lines = rows.map((row) => lineOf(row, table.columns))
  const registradas = lines.filter((line) => line.registrada).length
  const cut = lines.length > CONFERENCE_ROW_CAP

  return {
    registro: {
      estado: cut ? 'truncado' : 'lido',
      arquivo,
      secao: section.heading,
      linhas: lines.slice(0, CONFERENCE_ROW_CAP),
      registradas,
      total: lines.length,
    },
    anomalias: cut
      ? [
          {
            file: arquivo,
            code: 'artefato-da-entrega-nao-lido',
            detail: `conferência parcial: ${CONFERENCE_ROW_CAP} de ${lines.length} linhas lidas, pelo teto de linhas`,
          },
        ]
      : [],
  }
}

/**
 * The first level-2 section whose heading, normalized and without its leading
 * number, BEGINS with the words of the register (D-09, the mould of RF-07.4).
 * @param md - the onboarding.
 * @returns the heading as written and the lines under it, or null.
 */
function registerSection(md: string): { heading: string; lines: string[] } | null {
  const lines = md.split('\n')
  let found: { heading: string; lines: string[] } | null = null

  for (const line of lines) {
    const heading = /^##\s+(.+?)\s*$/.exec(line.trim())
    const isLevelTwo = heading !== null && !line.trim().startsWith('###')
    if (isLevelTwo) {
      if (found !== null) break
      const title = heading[1] ?? ''
      const key = normalizeCell(title).replace(/^(?:\d+\s+)+/, '')
      if (key.startsWith(SECTION_START)) found = { heading: title, lines: [] }
      continue
    }
    if (found !== null) found.lines.push(line)
  }
  return found
}

/** Where the columns of the register sit, by name. */
type Columns = Record<(typeof REQUIRED)[number] | (typeof OPTIONAL)[number], number>

/** The register table of a section, or what was found instead. */
type TableRead =
  | { kind: 'register'; columns: Columns; rows: string[][] }
  | { kind: 'unrecognised'; header: string[] | null }

/**
 * The first table of the section with columns `Data` and `Resultado`, in any
 * position, by the tolerances of RF-07.3.
 * @param lines - the lines of the section.
 * @returns the table and its rows, or the first header found when none qualifies.
 */
function registerTable(lines: string[]): TableRead {
  let firstHeader: string[] | null = null

  for (let index = 0; index + 1 < lines.length; index += 1) {
    const header = cellsOf(lines[index] ?? '')
    const separator = cellsOf(lines[index + 1] ?? '')
    if (header.length === 0 || separator.length === 0 || !separator.every((c) => /^:?-+:?$/.test(c))) continue

    firstHeader ??= header
    const keys = header.map(columnKey)
    if (!REQUIRED.every((name) => keys.includes(name))) continue

    const columns = Object.fromEntries(
      [...REQUIRED, ...OPTIONAL].map((name) => [name, keys.indexOf(name)]),
    ) as Columns

    const rows: string[][] = []
    for (let cursor = index + 2; cursor < lines.length; cursor += 1) {
      const row = cellsOf(lines[cursor] ?? '')
      if (row.length === 0) break
      // A row of dashes only is how an agent writes "none yet" (EC-5UH7).
      if (row.every((cell) => /^[—–-]$/.test(cell.trim()))) continue
      rows.push(row)
    }
    return { kind: 'register', columns, rows }
  }

  return { kind: 'unrecognised', header: firstHeader }
}

/**
 * One row of the register, each cell as written.
 *
 * A row is REGISTERED when date and result both carry something other than a
 * lone dash (D-10); what the result says is not the panel's business.
 */
function lineOf(row: string[], columns: Columns): ConferenceLine {
  const cell = (index: number): string | null => {
    if (index === -1) return null
    const value = (row[index] ?? '').trim()
    return value === '' ? null : value
  }
  const data = cell(columns.data)
  const resultado = cell(columns.resultado)
  return {
    data,
    marco: cell(columns.marco),
    item: cell(columns.item),
    resultado,
    observacao: cell(columns.observacao),
    registrada: !isBlankCell(data ?? '') && !isBlankCell(resultado ?? ''),
  }
}
