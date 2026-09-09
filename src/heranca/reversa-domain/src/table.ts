/* HERDADO: não editar sem declarar a adaptação em src/heranca/PROCEDENCIA.md
 * origem:      scrum-harness (https://github.com/iago-leal/scrum-harness)
 * caminho:     packages/reversa-domain/src/table.ts
 * revisão:     420305daa6cdd10858b720a34cb8db67d8e5c5e9 (2026-09-08)
 * copiado em:  2026-09-09
 * adaptações:  nenhuma
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

/** Split one markdown table row into its cells, dropping the outer pipes. */
function cellsOf(line: string): string[] {
  const trimmed = line.trim()
  if (!trimmed.startsWith('|')) return []
  const inner = trimmed.replace(/^\|/, '').replace(/\|$/, '')
  return inner.split('|').map(cell => cell.trim())
}

/** A separator row is only dashes, colons and spaces. */
function isSeparator(cells: readonly string[]): boolean {
  return cells.length > 0 && cells.every(cell => /^:?-{1,}:?$/.test(cell.trim()))
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
  const want = header.map(normalizeCell).join('|')
  const lines = md.split('\n')

  for (let index = 0; index < lines.length; index += 1) {
    const cells = cellsOf(lines[index] ?? '')
    if (cells.length !== header.length) continue
    if (cells.map(normalizeCell).join('|') !== want) continue

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
