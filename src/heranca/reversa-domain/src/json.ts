/* HERDADO: não editar sem declarar a adaptação em src/heranca/PROCEDENCIA.md
 * origem:      scrum-harness (https://github.com/iago-leal/scrum-harness)
 * caminho:     packages/reversa-domain/src/json.ts
 * revisão:     420305daa6cdd10858b720a34cb8db67d8e5c5e9 (2026-09-08)
 * copiado em:  2026-09-09
 * adaptações:  nenhuma
 */
/**
 * Safe JSON reading for the REVERSA state files (comp-72 R13). REVERSA
 * ships `lib/utils/json-safe.js` for one concrete reason — an editor may
 * leave a UTF-8 BOM and `JSON.parse` rejects it — so the reader mirrors
 * that behaviour for every JSON it consumes: `state.json`,
 * `reversa-config.json` and `active-requirements.json`. Nothing here
 * throws; an unreadable file becomes a value of `null` plus a named cause.
 * @module @scrum-harness/reversa-domain/json
 */

import type { AnomalyCode } from './anomaly.ts'

/** The outcome of reading one JSON file: the value, or the reason there is none. */
export interface JsonRead {
  value: unknown
  cause: AnomalyCode | null
}

/** Strip a leading BOM, as REVERSA's own `readJsonSafe` does. */
export function stripBom(text: string): string {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text
}

/**
 * Parse a REVERSA JSON file without ever throwing.
 * @param text - the file content, or null when the file does not exist.
 * @returns the parsed value, or null with the cause named.
 */
export function parseJsonSafe(text: string | null): JsonRead {
  if (text === null || text.trim() === '') return { value: null, cause: 'config-ausente' }
  try {
    return { value: JSON.parse(stripBom(text)), cause: null }
  } catch {
    return { value: null, cause: 'json-invalido' }
  }
}

/** Narrow an unknown value to a plain object (arrays and null excluded). */
export function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

/** Read a string field, or null when it is absent or not a string. */
export function asString(value: unknown): string | null {
  return typeof value === 'string' ? value : null
}

/**
 * Read a folder name the way the REVERSA hook does: the stored value counts
 * only when it is a non-empty string, otherwise the default applies.
 * @param value - the raw field from `state.json`.
 * @param fallback - the framework default.
 */
export function asFolder(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.length > 0 ? value : fallback
}

/** Read an array of strings, dropping every entry that is not a non-empty string. */
export function asStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((entry): entry is string => typeof entry === 'string' && entry.length > 0)
}
