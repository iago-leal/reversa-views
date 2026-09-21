/**
 * The restricted reader of YAML front matter (D-02, D-03).
 *
 * WHY IT IS WRITTEN HERE rather than imported. The extension ships as `out/**`,
 * `media/**`, the manifest and the README, packaged with `--no-dependencies`:
 * there is no dependency tree inside it. Making `yaml` travel would mean a
 * production dependency, a re-inclusion in `.vscodeignore`, a new prefix in
 * `scripts/conteudo-esperado.js` and a review of the packaging, and would carry
 * 796 KB of distribution into a 2 MiB ceiling -- to read ten scalar fields. The
 * measurement is in `investigation.md`; the decision is D-02.
 *
 * WHAT IT READS, and it is deliberately little: a key and a scalar value AT THE
 * TOP LEVEL, and whether a list has items. That is the whole of what the card
 * draws, because RF-10 names the blocking CONDITION and not the text of it.
 *
 * WHAT IT DOES NOT READ, declaredly: nested blocks, lists of objects,
 * multi-line scalars and anchors. A consumed field written in one of those
 * comes back as NOT READ, which becomes a named anomaly one layer up -- never
 * an invented value. That asymmetry is the whole safety of a partial reader:
 * what it cannot read, it says it cannot read.
 *
 * THE TRAP THIS READER IS SHAPED AROUND. Two of the three real `bug.md` files
 * carry, indented under `change_set:`, the lines `- id: CHG-001`. A reader that
 * trimmed the line before cutting the key would read that as a top-level `id`
 * and replace the bug's identifier with the identifier of the last change of
 * the change set. The bug would not vanish: it would be drawn under a name that
 * is not its own, with no anomaly recorded. Hence the rule below, which is not
 * a style choice: a TOP-LEVEL KEY IS ONE THAT STARTS AT COLUMN ZERO. Nothing is
 * trimmed before the level is decided.
 * @module domain/front-matter
 */

/** The marker that opens and closes the block, alone on its line. */
const MARKER = '---'

/** A key at column zero: no leading space, no leading dash. */
const TOP_LEVEL = /^([A-Za-z_][A-Za-z0-9_-]*):(.*)$/

/** An item of a block list, which is what tells a list from a nested map. */
const LIST_ITEM = /^\s+-\s/

/** The scalars YAML writes for absence, which are absence and not text. */
const NULLS: ReadonlySet<string> = new Set(['null', '~', 'Null', 'NULL'])

/** The heads of a multi-line scalar, which this reader declaredly does not read. */
const MULTILINE = /^[|>][-+]?\d*$/

/** Why the block could not be read; null when it was. */
export type FrontMatterFailure = 'sem-bloco' | 'bloco-truncado'

/** What the restricted reader could make of one document. */
export interface FrontMatter {
  /** True when the block was found between the markers and read. */
  presente: boolean
  /** Why there is nothing to read; null when there is. */
  falha: FrontMatterFailure | null
  /** Top-level scalars, by key, with the quotes removed and nulls left out. */
  escalares: Record<string, string>
  /** Top-level lists, by key: true when the list has at least one item. */
  listas: Record<string, boolean>
  /** Top-level keys met and deliberately NOT read, which is different from absent. */
  naoLidos: string[]
}

/** Nothing read, in each of the two ways there are of reading nothing. */
function nada(falha: FrontMatterFailure): FrontMatter {
  return { presente: false, falha, escalares: {}, listas: {}, naoLidos: [] }
}

/**
 * Read the front matter block of one document.
 *
 * Total for every input: absence, empty text, a document with no block, a block
 * that never closes and a line with no separator all come back as a usable
 * answer rather than as an exception.
 * @param text - the whole `bug.md`, or the absence of it.
 * @returns what the restricted reader could make of the block.
 */
export function readFrontMatter(text: string | null | undefined): FrontMatter {
  if (typeof text !== 'string' || text.trim() === '') return nada('sem-bloco')

  const lines = text.split(/\r?\n/)
  if (lines[0]?.trimEnd() !== MARKER) return nada('sem-bloco')

  const close = lines.findIndex((line, index) => index > 0 && line.trimEnd() === MARKER)
  // A block that opens and never closes is UNREADABLE, and not half read.
  // Reading what came before the missing marker would be reading a truncated
  // file as if it were whole, which is the one thing a partial reader must not
  // do: the truncation is exactly what nobody would notice on screen.
  if (close === -1) return nada('bloco-truncado')

  return readBlock(lines.slice(1, close))
}

/**
 * Read the lines of the block, deciding the level before anything else.
 * @param block - the lines between the two markers.
 * @returns the scalars, the lists and what was left unread.
 */
function readBlock(block: readonly string[]): FrontMatter {
  const escalares: Record<string, string> = {}
  const listas: Record<string, boolean> = {}
  const naoLidos: string[] = []

  for (let index = 0; index < block.length; index += 1) {
    const found = TOP_LEVEL.exec(block[index] as string)
    // Anything that is not a key at column zero belongs to a block this reader
    // does not read: an indented pair, a list item, a blank line, a comment, or
    // a line with no separator at all.
    if (found === null) continue

    const key = found[1] as string
    const value = dropComment((found[2] ?? '').trim())

    if (value === '') {
      // A top-level key with no value opens something. Which something is
      // decided by the FIRST meaningful line under it: an item makes it a list,
      // anything else makes it a nested block this reader declares unread.
      if (opensList(block, index)) listas[key] = true
      else naoLidos.push(key)
      continue
    }

    if (value.startsWith('[')) {
      listas[key] = value.replace(/\s/g, '') !== '[]'
      continue
    }

    if (MULTILINE.test(value)) {
      naoLidos.push(key)
      continue
    }

    const scalar = unquote(value)
    if (NULLS.has(scalar)) continue
    escalares[key] = scalar
  }

  return { presente: true, falha: null, escalares, listas, naoLidos }
}

/**
 * The value with its trailing YAML comment dropped, and nothing else touched.
 *
 * In YAML a `#` preceded by whitespace opens a comment that runs to the end of
 * the line, unless it sits inside quotes. Quotes only count where YAML counts
 * them: in a value that STARTS quoted, or in an inline list. An apostrophe in
 * the middle of a plain scalar is a letter, and treating it as an opening quote
 * would keep the comment of `title: it's here # note`.
 *
 * This is the whole of what the reader learns about comments. It stays a
 * restricted reader: no anchors, no tags, no multi-line flow.
 * @param value - the text after the first separator, already trimmed.
 * @returns the value without the comment; empty when the value was only one.
 */
function dropComment(value: string): string {
  if (value.startsWith('#')) return ''

  const quoted = value[0] === '"' || value[0] === "'" || value[0] === '['
  let open: string | null = null

  for (let index = 0; index < value.length; index += 1) {
    const char = value[index] as string
    if (open !== null) {
      if (open === '"' && char === '\\') index += 1
      else if (char === open) open = null
      continue
    }
    if (quoted && (char === '"' || char === "'")) open = char
    else if (char === '#' && /\s/.test(value[index - 1] ?? '')) {
      return value.slice(0, index).trimEnd()
    }
  }
  return value
}

/**
 * Whether the block a key opens is a LIST, by its first meaningful line.
 *
 * The lookahead stops at the next top-level key, so a nested block never
 * borrows the shape of what follows it.
 * @param block - the lines of the front matter.
 * @param index - the line of the key that opened the block.
 * @returns true when the first line under the key is a list item.
 */
function opensList(block: readonly string[], index: number): boolean {
  for (let next = index + 1; next < block.length; next += 1) {
    const line = block[next] as string
    if (line.trim() === '') continue
    if (TOP_LEVEL.test(line)) return false
    return LIST_ITEM.test(line)
  }
  return false
}

/**
 * A scalar with its surrounding quotes removed, and nothing else touched.
 *
 * The value keeps every colon it carries: the key is cut at the FIRST
 * separator, so a title like `Painel: a contagem diverge` comes back whole. A
 * cut at the last separator, or a second cut inside the value, would truncate a
 * legitimate title without anyone noticing.
 * @param value - the text after the first separator, already trimmed.
 * @returns the value, unquoted when it was quoted.
 */
function unquote(value: string): string {
  const first = value[0]
  if ((first === '"' || first === "'") && value.length >= 2 && value.endsWith(first)) {
    return value.slice(1, -1)
  }
  return value
}
