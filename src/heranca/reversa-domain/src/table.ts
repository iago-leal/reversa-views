/* HERDADO: não editar sem declarar a adaptação em src/heranca/PROCEDENCIA.md
 * origem:      scrum-harness (https://github.com/iago-leal/scrum-harness)
 * caminho:     packages/reversa-domain/src/table.ts
 * revisão:     420305daa6cdd10858b720a34cb8db67d8e5c5e9 (2026-09-08)
 * copiado em:  2026-09-09
 * adaptações:  A6, A8
 */
/**
 * Reading the markdown tables REVERSA writes (comp-73 R2).
 *
 * `legacy-impact.md` and `regression-watch.md` are produced by an LLM from
 * a STRUCTURE INSTRUCTION in the skill ("2. Tabela `A | B | C`"), not
 * emitted as a fixed string. Matching a header literally would therefore
 * break on an added accent, a different case or a stray colon — so the
 * header is matched NORMALIZED and the cells are read BY POSITION.
 *
 * Both artifacts share this module on purpose: one rule, tested once. An
 * earlier draft let each contract quote its own header and the two drifted
 * apart, which is precisely the kind of divergence a reader of someone
 * else's format cannot afford.
 * @module @scrum-harness/reversa-domain/table
 */

/** Fold case, accents and punctuation so two spellings of a header compare equal. */
export function normalizeCell(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Split one markdown table row into its cells, dropping the outer pipes.
 *
 * A6 (BUG-20260912-PIPE): a pipe INSIDE a cell is written escaped, which is
 * how markdown says "a literal pipe here" and the only way a row carrying one
 * survives any renderer. Splitting on every pipe therefore invents columns,
 * pushes the real ones out of position and drops the row on the floor: the
 * status column of an action, the justification of an impact. So the split
 * honours the escape, and each cell comes back unescaped, as the text it
 * means rather than as the notation that carried it.
 *
 * It is exported because the decomposition of `actions.md` reads rows the
 * same way, and one rule read in two places is the divergence this module
 * was written to avoid.
 */
export function cellsOf(line: string): string[] {
  const trimmed = line.trim()
  if (!trimmed.startsWith('|')) return []
  const inner = trimmed.replace(/^\|/, '').replace(/(?<!\\)\|$/, '')
  return inner.split(/(?<!\\)\|/).map(cell => cell.trim().replace(/\\\|/g, '|'))
}

/** A separator row is only dashes, colons and spaces. */
function isSeparator(cells: readonly string[]): boolean {
  return cells.length > 0 && cells.every(cell => /^:?-{1,}:?$/.test(cell.trim()))
}

/*
 * A8 (BUG-20260914-DTLI): REVERSA writes its own vocabulary as markdown.
 * `/reversa-coding` spells the impact taxonomy between backticks, as its
 * SKILL.md does, and a severity sometimes comes in bold. A canonical value
 * wrapped in that notation is still the canonical value, and comparing the
 * raw cell turned every sound row into an anomaly. Only marks enclosing the
 * WHOLE value are removed, and nothing else is tolerated: no case folding,
 * no nearest match, because a value outside the vocabulary must stay
 * visible exactly as written.
 *
 * The header is read as narrowly. A column name followed by an annotation
 * in parentheses, or carrying one more definite article, names the same
 * column; the expected name itself is never shortened.
 */
const WRAPPERS = [/^`([^`]+)`$/, /^\*\*(.+)\*\*$/] as const
const ANNOTATION = /\s*\([^()]*\)\s*$/
const ARTICLES = new Set(['a', 'o', 'as', 'os'])

/** The text a cell carries once the marks enclosing all of it are removed. */
function unwrap(cell: string): string {
  let value = cell.trim()
  for (;;) {
    const inner = WRAPPERS.map(wrapper => wrapper.exec(value)?.[1]).find(match => match !== undefined)
    if (inner === undefined) return value
    value = inner.trim()
  }
}

/**
 * The vocabulary member a cell spells, through the notation enclosing it.
 * @returns the member, or null when the value is outside the vocabulary.
 */
export function canonicalOf<T extends string>(cell: string, vocabulary: readonly T[]): T | null {
  const value = unwrap(cell)
  return (vocabulary as readonly string[]).includes(value) ? (value as T) : null
}

/** A column name, normalized and without its definite articles. */
function columnKey(text: string): string {
  return normalizeCell(text)
    .split(' ')
    .filter(word => !ARTICLES.has(word))
    .join(' ')
}

/** Whether a row's cells are the header `header`, column by column. */
export function matchesHeader(cells: readonly string[], header: readonly string[]): boolean {
  if (cells.length !== header.length) return false
  return cells.every((cell, index) => {
    const want = columnKey(header[index] ?? '')
    return columnKey(cell) === want || columnKey(cell.replace(ANNOTATION, '')) === want
  })
}

/**
 * Find the table whose header matches `header` (normalized) and return its
 * data rows as raw cells.
 * @param md - the artifact text, or null when the file does not exist.
 * @param header - the expected column names, in order.
 * @returns the data rows; empty when the file or the table is absent.
 */
export function findTable(md: string | null, header: readonly string[]): string[][] {
  if (md === null) return []
  const lines = md.split('\n')

  for (let index = 0; index < lines.length; index += 1) {
    const cells = cellsOf(lines[index] ?? '')
    if (!matchesHeader(cells, header)) continue

    const rows: string[][] = []
    for (let cursor = index + 1; cursor < lines.length; cursor += 1) {
      const row = cellsOf(lines[cursor] ?? '')
      if (row.length === 0) break // the table ended
      if (isSeparator(row)) continue
      rows.push(row)
    }
    return rows
  }
  return []
}

/**
 * Split a markdown document by its level-2 headings. The text before the
 * first heading is the preamble, under the key `''` — which is where the
 * live table of `regression-watch.md` lives, as opposed to `Observações`.
 * @param md - the artifact text, or null.
 * @returns a map of normalized heading → section text.
 */
export function splitSections(md: string | null): Record<string, string> {
  const sections: Record<string, string> = { '': '' }
  if (md === null) return sections

  let current = ''
  for (const line of md.split('\n')) {
    const heading = /^##\s+(.+?)\s*$/.exec(line.trim())
    if (heading !== null && !line.trim().startsWith('###')) {
      current = normalizeCell(heading[1] ?? '')
      sections[current] ??= ''
      continue
    }
    sections[current] = `${sections[current] ?? ''}${line}\n`
  }
  return sections
}
