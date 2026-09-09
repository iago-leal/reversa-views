/**
 * Reading the action table of the active feature (RF-06, RF-14, RN-04, RN-05,
 * D-08, D-09).
 *
 * `actions.md` is written by an agent from a template, and not emitted by
 * code. An added accent, a different case, a stray column: all of them are
 * plausible divergences, and a reader that matched the header literally would
 * come back empty on the first one. So the header is matched NORMALIZED, the
 * cells are read BY POSITION, and where nothing matches there is a fall back
 * to a line scan over the same end-of-row marker `scanActions` already uses.
 * A list left empty by a header nobody looked at would be a panel that lies.
 *
 * The inherited count remains the AUTHORITY on how many actions exist: it
 * scans the whole file without depending on a header, and it is what the
 * framework itself uses to decide the stage. This module never replaces it.
 * Where the two numbers disagree, the disagreement is declared, because two
 * counts that differ in silence produce a panel that contradicts itself.
 *
 * It judges, and does not read disk: the text arrives from a probe, which is
 * the same cut the inherited layer already makes.
 * @module domain/decomposition
 */

import { findTable, normalizeCell, splitSections } from '../heranca/reversa-domain/src/index.ts'
import type { ActiveDecomposition, PlanAction } from './types.ts'
import { EMPTY_DECOMPOSITION } from './types.ts'

/** The seven columns the REVERSA template writes, in order. */
const HEADER = [
  'ID',
  'Descrição',
  'Dependências',
  'Paralelismo',
  'Arquivo alvo',
  'Confidência',
  'Status',
] as const

/** Where each cell of a matched row sits. */
const COLUMN = { id: 0, descricao: 1, arquivoAlvo: 4, status: 6 } as const

/** A row of the table ends with the canonical marker, closed or open. */
const CLOSED_ROW = /\|\s*`?\[X\]`?\s*\|\s*$/
const OPEN_ROW = /\|\s*`?\[ \]`?\s*\|\s*$/

/** The same two markers, as a whole cell rather than as an end of line. */
const CLOSED_CELL = /^`?\[X\]`?$/
const OPEN_CELL = /^`?\[ \]`?$/

/** The heading `/reversa-add` appends its amendments under. */
const AMENDMENTS = /\bemendas\b/

/** One stretch of the file: a level-2 heading, or the text before the first one. */
interface Block {
  /** The heading as it is written, which is what the panel draws. */
  fase: string | null
  /** The heading normalized, which is the key `splitSections` returns. */
  key: string
  emenda: boolean
}

/**
 * Read the decomposition of one `actions.md`.
 * @param md - the file content, or null when there is none to read.
 * @param contadas - the inherited count, which stays the authority (D-08).
 * @returns the actions one by one, and the divergence when there is one.
 */
export function readDecomposition(md: string | null, contadas: number): ActiveDecomposition {
  if (md === null) return { ...EMPTY_DECOMPOSITION }

  const sections = splitSections(md)
  const acoes: PlanAction[] = []
  let scanned = false

  const seen = new Set<string>()
  for (const block of blocksOf(md)) {
    if (seen.has(block.key)) continue
    seen.add(block.key)

    const text = sections[block.key]
    if (text === undefined) continue

    const rows = findTable(text, HEADER)
    if (rows.length > 0) {
      for (const row of rows) {
        const action = fromCells(row, block)
        if (action !== null) acoes.push(action)
      }
      continue
    }

    // The header did not match: the rows are still there, and a line scan
    // finds them by the marker that ends every action row (D-09).
    const found = fromLines(text, block)
    if (found.length > 0) scanned = true
    acoes.push(...found)
  }

  return {
    lida: true,
    origem: scanned ? 'varredura' : 'tabela',
    acoes,
    divergencia: contadas === acoes.length ? null : { contadas, listadas: acoes.length },
  }
}

/**
 * The stretches of the file, in order: the preamble first, then one per
 * level-2 heading.
 *
 * The headings are collected here in their WRITTEN form, because
 * `splitSections` keys them normalized and the panel draws the phase as the
 * file spells it. The normalized form is kept beside it, as the key.
 * @param md - the file content.
 * @returns the blocks, in the order they appear.
 */
function blocksOf(md: string): Block[] {
  const blocks: Block[] = [{ fase: null, key: '', emenda: false }]

  for (const line of md.split('\n')) {
    const trimmed = line.trim()
    if (trimmed.startsWith('###')) continue
    const heading = /^##\s+(.+?)\s*$/.exec(trimmed)
    if (heading === null) continue

    const raw = heading[1] ?? ''
    const key = normalizeCell(raw)
    blocks.push({ fase: raw, key, emenda: AMENDMENTS.test(key) })
  }
  return blocks
}

/**
 * One action out of the cells of a matched row.
 * @param row - the cells, in the order of the canonical header.
 * @param block - the stretch the row sat in.
 * @returns the action, or null when the row names none.
 */
function fromCells(row: readonly string[], block: Block): PlanAction | null {
  const id = bare(row[COLUMN.id] ?? '')
  if (id === '') return null

  const status = (row[COLUMN.status] ?? '').trim()
  const closed = CLOSED_CELL.test(status)
  if (!closed && !OPEN_CELL.test(status)) return null

  return {
    id,
    descricao: (row[COLUMN.descricao] ?? '').trim(),
    fase: block.fase,
    emenda: block.emenda,
    fechada: closed,
    arquivoAlvo: absent(bare(row[COLUMN.arquivoAlvo] ?? '')),
  }
}

/**
 * The actions of a stretch whose header did not match, found line by line.
 * @param text - the stretch of the file.
 * @param block - the stretch it came from.
 * @returns the actions, in the order of the file.
 */
function fromLines(text: string, block: Block): PlanAction[] {
  const found: PlanAction[] = []

  for (const raw of text.split('\n')) {
    const line = raw.trimEnd()
    const closed = CLOSED_ROW.test(line)
    if (!closed && !OPEN_ROW.test(line)) continue

    const cells = line
      .trim()
      .replace(/^\|/, '')
      .replace(/\|$/, '')
      .split('|')
      .map((cell) => cell.trim())

    const id = bare(cells[0] ?? '')
    if (id === '') continue

    found.push({
      id,
      descricao: (cells[1] ?? '').trim(),
      fase: block.fase,
      emenda: block.emenda,
      fechada: closed,
      arquivoAlvo: null,
    })
  }
  return found
}

/** A cell without the backticks the template writes around code. */
function bare(cell: string): string {
  return cell.trim().replace(/^`+/, '').replace(/`+$/, '').trim()
}

/** The dash REVERSA writes for "none", read as the absence it means. */
function absent(value: string): string | null {
  return value === '' || value === '-' ? null : value
}
