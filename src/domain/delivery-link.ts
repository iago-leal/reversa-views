/**
 * The link a delivery DECLARES between itself and the specs (feature 010,
 * RN-01, RN-04, D-02 to D-05).
 *
 * The only source the process prescribes is the `Componente` column of the
 * impact tables `/reversa-coding` writes in `legacy-impact.md`: the addendum
 * and the `requirements.md` cite specs a feature does not deliver, and the
 * measurement of 2026-09-19 showed it (every addendum of this repository cites
 * four or five of the five specs). So this module reads that column, and only
 * it, in EVERY impact table of the file -- the inherited `findTable` stops at
 * the first, and the 002 of `financas-ali` has six.
 *
 * Pure, like the rest of the domain: it judges what `probe/features.ts` read,
 * reads no disk and imports no platform module.
 * @module domain/delivery-link
 */

import { cellsOf, normalizeCell } from '../heranca/reversa-domain/src/index.ts'
import type { FeatureFolderRead } from '../probe/features.ts'
import { LEGACY_IMPACT_FILE } from './limits.ts'
import type { DeliveryLinkReading } from './types.ts'

/** The impact file of one folder, as the crossing needs it. */
export interface FolderLinks {
  /** The folder, relative to the root; also the key of the map. */
  pasta: string
  estado: DeliveryLinkReading
  /** The `legacy-impact.md`, relative to the root; null when absent. */
  arquivo: string | null
  /** How many impact tables were recognised. */
  tabelas: number
  /** The distinct cells of the `Componente` column, in reading order. */
  celulas: string[]
}

/** Every folder's link, by folder. It stays in the host and never travels whole (D-05). */
export type DeliveryLinks = Map<string, FolderLinks>

/** The two columns that make a table an impact table (RN-01). */
const FILE_COLUMN = 'arquivo afetado'
const COMPONENT_COLUMN = 'componente'

/*
 * The column key of RF-07.3, REDECLARED here, and that is a DUPLICATION in
 * relation to the inherited `table.ts` (D-02): there the key is private and
 * only the whole-header comparison `matchesHeader` is exported, while the rule
 * this module needs finds columns BY NAME in any position. Exporting the key
 * from a vendored file would cost a declared adaptation and a conflict at the
 * next resynchronisation. The tolerance is the same, and no wider: a trailing
 * annotation in parentheses and a definite article, nothing else.
 */
const ANNOTATION = /\s*\([^()]*\)\s*$/
const ARTICLES = new Set(['a', 'o', 'as', 'os'])

/**
 * The key of a column name: normalized, without its trailing annotation and
 * without definite articles.
 * @param cell - the header cell as written.
 * @returns the comparable key.
 */
export function columnKey(cell: string): string {
  return normalizeCell(cell.replace(ANNOTATION, ''))
    .split(' ')
    .filter((word) => !ARTICLES.has(word))
    .join(' ')
}

/** A separator row is only dashes and colons. */
function isSeparator(cells: readonly string[]): boolean {
  return cells.length > 0 && cells.every((cell) => /^:?-+:?$/.test(cell.trim()))
}

/** A cell that says nothing: empty, or a lone dash, which is how agents write "none" (EC-5UH7). */
export function isBlankCell(cell: string | undefined): boolean {
  const trimmed = (cell ?? '').trim()
  return trimmed === '' || /^[—–-]$/.test(trimmed)
}

/**
 * The cells of the `Componente` column of every impact table of the file
 * (D-02).
 *
 * An impact table is one whose header carries, in any position, the columns
 * `Arquivo afetado` and `Componente`. A mapping table without `Arquivo
 * afetado` is not one: citing a spec is not delivering it. A row of dashes
 * only is not a row, and an empty cell of the column declares nothing.
 * @param md - the text of the file, or null.
 * @returns every non-blank cell of the column, repeats kept, and the number of tables.
 */
export function impactTables(md: string | null): { linhas: string[]; tabelas: number } {
  if (md === null) return { linhas: [], tabelas: 0 }

  const lines = md.split('\n')
  const linhas: string[] = []
  let tabelas = 0

  for (let index = 0; index + 1 < lines.length; index += 1) {
    const header = cellsOf(lines[index] ?? '')
    if (header.length === 0 || !isSeparator(cellsOf(lines[index + 1] ?? ''))) continue

    const keys = header.map(columnKey)
    const column = keys.indexOf(COMPONENT_COLUMN)
    if (column === -1 || !keys.includes(FILE_COLUMN)) continue

    tabelas += 1
    let cursor = index + 2
    for (; cursor < lines.length; cursor += 1) {
      const row = cellsOf(lines[cursor] ?? '')
      if (row.length === 0) break
      if (row.every((cell) => isBlankCell(cell))) continue
      const cell = row[column]
      if (!isBlankCell(cell)) linhas.push((cell ?? '').trim())
    }
    index = cursor - 1
  }

  return { linhas, tabelas }
}

/** A name compared the way D-03 compares it: lowercase, without diacritics. */
function folded(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

/** A regular expression special character, escaped. */
function escaped(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Whether a cell declares the spec `spec` (D-03, RN-01).
 *
 * After lowercase and without diacritics, the cell contains the name delimited
 * on the left by the start or a character outside `[a-z0-9-]`, and on the
 * right by `.md`, the end or such a character. That covers the three forms
 * measured -- the bare name, the name between backticks with its extension,
 * several specs in one cell, and prose with the path in parentheses -- and the
 * delimitation is what keeps `painel-do-processo-v2` from declaring
 * `painel-do-processo`.
 * @param cell - the cell as written.
 * @param spec - the spec name, without extension.
 * @returns true when the cell declares the spec.
 */
export function declaresSpec(cell: string, spec: string): boolean {
  return declarerOf(spec)(foldCell(cell))
}

/**
 * The same test as `declaresSpec`, with the expression built once per spec,
 * for the panorama that tries every spec against every cell of every folder.
 * @param spec - the spec name, without extension.
 * @returns a test over cells already folded by `foldCell`.
 */
export function declarerOf(spec: string): (foldedCell: string) => boolean {
  const name = folded(spec).trim()
  if (name === '') return () => false
  const pattern = new RegExp(`(?:^|[^a-z0-9-])${escaped(name)}(?:\\.md|[^a-z0-9-]|$)`)
  return (foldedCell) => pattern.test(foldedCell)
}

/** A cell as `declarerOf` compares it: lowercase and without diacritics. */
export function foldCell(cell: string): string {
  return folded(cell)
}

/** Marks that may enclose a whole cell, as `canonicalOf` of the inherited table allows. */
const WRAPPERS = [/^`([^`]+)`$/, /^\*\*(.+)\*\*$/] as const

/** A kebab name: lowercase ASCII letters and digits, in one word or more joined by hyphens. */
const KEBAB = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

/**
 * The component a cell names when it names nothing else (D-04, RN-04).
 *
 * The cell, without the backticks or the bold enclosing ALL of it, has to be
 * a kebab name and nothing more. One word is enough, which is what lets
 * `assistente` in; a capital, a space, a parenthesis or an extension keeps
 * out "Tema", "Verificação local", "(todos)" and `docker-compose.yml`.
 * @param cell - the cell as written.
 * @returns the name, or null when the cell is anything else.
 */
export function soleComponent(cell: string): string | null {
  let value = cell.trim()
  for (;;) {
    const inner = WRAPPERS.map((wrapper) => wrapper.exec(value)?.[1]).find((match) => match !== undefined)
    if (inner === undefined) break
    value = inner.trim()
  }
  return KEBAB.test(value) ? value : null
}

/**
 * The link of every folder, read once (D-05).
 *
 * `lido` when the text came; `nao-lido` when the listing showed the file and
 * its text did not come, which is a partial link to declare; `ausente`
 * otherwise, which is no loss at all. A folder read by a probe older than
 * feature 010 has none of the new fields, and is absent.
 * @param pastas - the folders as the local probe read them.
 * @returns the links, by folder.
 */
export function readDeliveryLinks(pastas: readonly FeatureFolderRead[]): DeliveryLinks {
  const links: DeliveryLinks = new Map()

  for (const folder of pastas) {
    const arquivo = `${folder.pasta}/${LEGACY_IMPACT_FILE}`
    const md = folder.legacyImpactMd ?? null

    if (md === null) {
      const naoLido = (folder.naoLidos ?? []).includes(LEGACY_IMPACT_FILE)
      links.set(folder.pasta, {
        pasta: folder.pasta,
        estado: naoLido ? 'nao-lido' : 'ausente',
        arquivo: naoLido ? arquivo : null,
        tabelas: 0,
        celulas: [],
      })
      continue
    }

    const { linhas, tabelas } = impactTables(md)
    links.set(folder.pasta, {
      pasta: folder.pasta,
      estado: 'lido',
      arquivo,
      tabelas,
      celulas: [...new Set(linhas)],
    })
  }

  return links
}
