/**
 * The elision of a checkpoint: its form, never its content (feature 013).
 *
 * This module is a TRANSCRIPTION of `scripts/equivalencias/elidir.js`, written
 * by feature 012, and the duplication is declared rather than hidden. The
 * precedent, and the reason, are the ones `src/domain/limits.ts` already
 * documents about `scripts/limites.js`: that one is loaded by tooling in
 * CommonJS without a build, this one is compiled into the extension, and
 * neither can import the other without dragging a whole world along. A command
 * of maintenance that required a working build to run would be useless exactly
 * when it is most needed.
 *
 * What makes the duplication safe is not care: it is `tests/elisao-paridade.spec.ts`,
 * which loads BOTH implementations and asserts they answer identically over a
 * matrix of values and over the three checkpoints measured on 2026-09-20. If
 * one of them ever changes alone, the suite says so on the day it happens.
 *
 * Why the panel needs it at all: the text of the correction prompt has to name
 * the field that caused the deviation, and the field sits beside findings that
 * describe a client's system, scratchpad paths carrying a session id, and
 * listings of a project's files. The classifier of feature 012 did not need to
 * see any of that, and neither does a harness asked to fix a name.
 *
 * The function is pure and mutates nothing it receives: the disk is not its
 * business.
 * @module domain/elisao
 */

/** Above this, a text is content rather than a declaration of state. */
export const LIMITE_DE_TEXTO = 40

/** What replaces each elided shape, saying the SHAPE and never the content. */
export const MARCA = {
  lista: (quantos: number): string => `<lista de ${quantos}>`,
  texto: (tamanho: number): string => `<texto de ${tamanho} caracteres>`,
  caminho: '<caminho>',
  objeto: '<objeto>',
} as const

/** What a value may look like once it is allowed to leave the machine. */
export type ValorElidido = string | number | boolean | null

/** One elided checkpoint: every key of the original, and none of its content. */
export type CheckpointElidido = Record<string, ValorElidido>

/**
 * Whether a text looks like a filesystem path.
 * @param valor - the text as the disk carries it.
 * @returns true when it starts like an absolute, home or drive path.
 */
function pareceCaminho(valor: string): boolean {
  return valor.startsWith('/') || valor.startsWith('~/') || /^[A-Za-z]:[\\/]/.test(valor)
}

/**
 * One value, in the form in which it may leave the machine.
 * @param valor - the value as the disk carries it.
 * @returns the preserved value, or the marker of its shape.
 */
export function elidirValor(valor: unknown): ValorElidido {
  if (Array.isArray(valor)) return MARCA.lista(valor.length)
  if (valor !== null && typeof valor === 'object') return MARCA.objeto
  // Number, boolean and null travel whole, and the cast is where the
  // transcription stays FAITHFUL instead of improving on the original: the
  // source returns the value untouched here, and anything a parsed JSON cannot
  // hold -- a function, a symbol -- never reaches this branch. Treating those
  // as shapes would be a difference the parity suite would rightly report.
  if (typeof valor !== 'string') return valor as ValorElidido
  if (pareceCaminho(valor)) return MARCA.caminho
  if (valor.length > LIMITE_DE_TEXTO) return MARCA.texto(valor.length)
  return valor
}

/**
 * The checkpoint in the form in which it may be shown to someone who will fix
 * it.
 *
 * Every key of the original is preserved, the canonical ones included: a reader
 * asked why the panel does not accept `timestamp` as a conclusion needs to see
 * `timestamp` beside the absence of `completed_at`.
 * @param entry - the checkpoint as the disk carries it.
 * @returns the elided form, with all the keys and none of the content.
 */
export function elidirCheckpoint(entry: Record<string, unknown>): CheckpointElidido {
  const saida: CheckpointElidido = {}
  for (const [chave, valor] of Object.entries(entry)) saida[chave] = elidirValor(valor)
  return saida
}
