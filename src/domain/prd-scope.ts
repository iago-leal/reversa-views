/**
 * The scope section of the PRD, read into items (RF-23, RN-14, D-10).
 *
 * The PRD is prose written by an agent from a template, and the template is
 * what fixes the shape this reader expects: a level-two heading whose title
 * says "Escopo", bold labels that group the items, and a list whose every
 * top-level entry is one thing the product will do. Nothing else in the PRD
 * is read, and what is read is read with TOLERANCE: a seal on either side of
 * the item, a bold name, a hard-wrapped line, an asterisk for a dash. What the
 * reader cannot recognise it declares, and never invents.
 *
 * This is a reader of ONE section, not a PRD parser, and it is kept apart
 * from `greenfield.ts` for that reason: the judgement of the axis calls it,
 * and the suite of this file can drive it with fixtures alone.
 * @module domain/prd-scope
 */

import { splitSections } from '../heranca/reversa-domain/src/index.ts'
import { SCOPE_ITEM_CAP } from './limits.ts'
import type { ScopeItem } from './types.ts'

/** What the reading of the scope section produced. */
export interface PrdScope {
  itens: ScopeItem[]
  /** False when no section of the PRD could be taken for the scope. */
  encontrado: boolean
  /** True when the list stopped at the ceiling. */
  truncado: boolean
}

/** The empty reading, for an absent or unrecognised PRD. */
const NOTHING: PrdScope = { itens: [], encontrado: false, truncado: false }

/** The three seals of confidence the framework writes beside a claim. */
const SEAL = /[🟢🟡🔴]/u

/** A top-level list item: a dash or an asterisk at column zero. */
const ITEM = /^[-*]\s+(.*)$/

/** A group label: a bold run alone on its line, with or without a colon. */
const GROUP = /^\*\*(.+?)\*\*:?\s*$/

/**
 * Decide whether one normalised heading names the scope.
 *
 * The section wanted says "escopo"; the two that must not be taken for it are
 * the non-objectives, whose title the template writes as "Não-objetivos (out)",
 * and any "fora do escopo", which contains the word and means its opposite.
 * The first heading that passes wins, in document order.
 * @param key - the heading as `splitSections` normalises it.
 * @returns true for the scope section.
 */
function isScopeHeading(key: string): boolean {
  if (!key.includes('escopo')) return false
  if (key.includes('nao objetivos') || key.includes('fora do')) return false
  return !/\bout\b/.test(key)
}

/**
 * Read the scope section of a PRD into its items.
 * @param prd - the body of the PRD, or null when it was not read.
 * @returns the items, whether the section was found, and whether the list was cut.
 */
export function readPrdScope(prd: string | null): PrdScope {
  if (prd === null || prd.trim() === '') return { ...NOTHING }

  const sections = splitSections(prd)
  const key = Object.keys(sections).find((name) => name !== '' && isScopeHeading(name))
  if (key === undefined) return { ...NOTHING }

  return { ...readItems(sections[key] ?? ''), encontrado: true }
}

/**
 * Walk the lines of the section, gathering each top-level item with its
 * continuation lines and the group label that precedes it.
 *
 * An indented line that is itself a list entry is a sub-item and is dropped;
 * any other indented line continues the item above it, which is how the hard
 * wrap of the template is undone. A blank line or a line at column zero that
 * is not an item closes the item being gathered.
 * @param body - the text of the section.
 * @returns the items and whether the ceiling cut the list.
 */
function readItems(body: string): { itens: ScopeItem[]; truncado: boolean } {
  const itens: ScopeItem[] = []
  let truncado = false
  let grupo: string | null = null
  let gathering: string[] | null = null

  const close = (): void => {
    if (gathering === null) return
    if (itens.length >= SCOPE_ITEM_CAP) truncado = true
    else itens.push(itemOf(gathering.join(' '), grupo))
    gathering = null
  }

  for (const line of body.split('\n')) {
    const trimmed = line.trim()
    if (trimmed === '') {
      close()
      continue
    }

    const indented = /^\s/.test(line)
    if (indented) {
      if (gathering !== null && !/^[-*]\s/.test(trimmed)) gathering.push(trimmed)
      continue
    }

    close()
    const group = GROUP.exec(trimmed)
    if (group !== null) {
      grupo = (group[1] ?? '').replace(/:\s*$/, '').trim()
      continue
    }
    const item = ITEM.exec(trimmed)
    if (item !== null) gathering = [item[1] ?? '']
  }
  close()

  return { itens, truncado }
}

/**
 * One item out of its gathered text: the seal set apart, the bold dropped, the
 * name split from the detail.
 *
 * The name is what comes before the first colon. Without a colon it is the
 * first sentence, and the rest, when there is a rest, is the detail: that is
 * how the template writes an item that is a statement rather than a label.
 * @param raw - the text of the item, continuation lines already joined.
 * @param grupo - the label in force, or null before any label.
 * @returns the item.
 */
function itemOf(raw: string, grupo: string | null): ScopeItem {
  let text = raw.trim()
  // `- * Nome`: a second marker after the first is a marker, not a name.
  if (/^[-*]\s+/.test(text)) text = text.replace(/^[-*]\s+/, '')

  let selo: string | null = null
  const leading = /^([🟢🟡🔴])\s*/u.exec(text)
  if (leading !== null) {
    selo = leading[1] ?? null
    text = text.slice(leading[0].length)
  }
  const trailing = /\s*([🟢🟡🔴])$/u.exec(text)
  if (trailing !== null) {
    selo ??= trailing[1] ?? null
    text = text.slice(0, text.length - trailing[0].length)
  }
  text = text.replace(/\*\*/g, '').replace(SEAL, '').trim()

  const colon = text.indexOf(':')
  if (colon > 0) {
    const detalhe = text.slice(colon + 1).trim()
    return { grupo, nome: text.slice(0, colon).trim(), detalhe: detalhe === '' ? null : detalhe, selo }
  }

  const sentence = /^(.*?[.!?])\s+(\S.*)$/.exec(text)
  if (sentence !== null) {
    return { grupo, nome: (sentence[1] ?? '').trim(), detalhe: (sentence[2] ?? '').trim(), selo }
  }
  return { grupo, nome: text, detalhe: null, selo }
}
