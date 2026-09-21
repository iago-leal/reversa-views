/**
 * The judgement of one phase name (feature 015).
 *
 * Until this feature the precedence lived inside `lerExtracao` and looked at
 * `phase` alone. Three consumers need the same judgement now -- the situation
 * of the extraction, the discount of inherited anomalies and the current
 * cycle -- and ONE function is what keeps them from drifting apart.
 *
 * Five steps, in this order: canonical, closure, cycle, approved stage,
 * unknown. The first three are FORM and need nobody's decision; the fourth
 * asks the map, because a stage outside the canon is open vocabulary with no
 * normative source; the fifth is what stays an anomaly.
 *
 * The suffix is recognised FROM A KNOWN BASE, never by extracting a base from
 * a name the reader does not know. Generic extraction is ambiguous -- in
 * `re-extracao-003` both `re` and `re-extracao` are candidate bases -- and
 * starting from what is known, the ambiguity does not exist.
 *
 * Pure: no disk, no platform module, nothing rewritten. The raw name travels
 * beside the recognised one, which is what NG-05 asks.
 *
 * `scripts/equivalencias/fases.js` is a CommonJS twin of this module, held to
 * it by `tests/fases-paridade.spec.ts`.
 * @module domain/fases
 */

import type { FaseCanonica, MapaDeEquivalencias } from './types.ts'

/** The five phases REVERSA documents, in canonical order. */
export const FASES_CANONICAS: readonly FaseCanonica[] = [
  'reconhecimento',
  'escavacao',
  'interpretacao',
  'geracao',
  'revisao',
]

/**
 * The root a closing value carries, in all five spellings measured:
 * `concluido`, `concluida`, `concluido-c3`, `concluido-escopado` and
 * `revisao_concluida`. No canonical phase contains it, so precedence and root
 * never collide.
 */
const RAIZ_DE_ENCERRAMENTO = 'conclu'

/**
 * What is left of a name after a known base, when it is a numeric suffix: a
 * separator, optional text with no space, and an integer at the very end.
 * `-c2`, `-2`, `-ciclo-2` and `_c2` have the form; `-c`, `-2a` and `2` do not.
 */
const SUFIXO_NUMERICO = /^[-_]\S*?(\d+)$/

/** What a phase name reads as, with the raw name always beside it. */
export type NomeDeFase =
  | { tipo: 'canonica'; bruto: string; canonica: FaseCanonica }
  | { tipo: 'encerramento'; bruto: string }
  | { tipo: 'ciclo'; bruto: string; canonica: FaseCanonica; ciclo: number }
  | { tipo: 'etapa'; bruto: string; base: string; sufixo: number | null }
  | { tipo: 'desconhecida'; bruto: string }

/**
 * Whether a phase value declares the end of the extraction (feature 011).
 *
 * By form: the value is split on `-` and `_`, each segment is lowercased and
 * stripped of diacritics, and one segment starting with the root is enough.
 * @param bruto - the value as the file carries it.
 * @returns true when it names a closure.
 */
export function declaraEncerramento(bruto: string): boolean {
  return bruto
    .split(/[-_]/)
    .map((parte) => parte.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase())
    .some((parte) => parte.startsWith(RAIZ_DE_ENCERRAMENTO))
}

/**
 * The integer of a numeric suffix, or null when the remainder has no such form.
 * @param resto - what follows a known base.
 * @returns the integer, or null.
 */
function inteiroDoSufixo(resto: string): number | null {
  const casou = SUFIXO_NUMERICO.exec(resto)
  return casou === null ? null : Number(casou[1])
}

/**
 * The approved stage a name belongs to, if any (RN-02, RN-03).
 *
 * Compared without case and without edge spaces, and WITH diacritics: by the
 * precedent of `valorComparavel`, `concluido` and `concluído` are spellings a
 * person approves separately. Whole equality is tested before any prefix, and
 * among prefixes the LONGEST base wins -- with `verificacao` and
 * `verificacao-regressao` both approved, `verificacao-regressao-c3` also has
 * the form of a suffix over the short one.
 * @param bruto - the name as the file carries it.
 * @param mapa - what a person approved.
 * @returns the base and the suffix, or null.
 */
function casarEtapa(
  bruto: string,
  mapa: MapaDeEquivalencias,
): { base: string; sufixo: number | null } | null {
  const comparavel = bruto.trim().toLowerCase()
  const bases = (mapa.etapas ?? [])
    .map((etapa) => etapa.nome.trim().toLowerCase())
    .filter((nome) => nome !== '')
    .sort((a, b) => b.length - a.length)

  if (bases.includes(comparavel)) return { base: comparavel, sufixo: null }
  for (const base of bases) {
    if (!comparavel.startsWith(base)) continue
    const sufixo = inteiroDoSufixo(comparavel.slice(base.length))
    if (sufixo !== null) return { base, sufixo }
  }
  return null
}

/**
 * Judge one phase name.
 *
 * The canonical comparison is EXACT, and loosening it would make `Escavacao`
 * stop being the typo RN-04 orders the screen to show. The closure comes
 * before the cycle because `concluido-c3` has a numeric suffix and must read
 * as closure -- and also because `revisao_concluida` starts with a canonical
 * phase.
 * @param bruto - the name as the file carries it.
 * @param mapa - what a person approved.
 * @returns the judgement; never throws, for any text.
 */
export function classificarNome(bruto: string, mapa: MapaDeEquivalencias): NomeDeFase {
  const canonica = FASES_CANONICAS.find((fase) => fase === bruto)
  if (canonica !== undefined) return { tipo: 'canonica', bruto, canonica }

  if (declaraEncerramento(bruto)) return { tipo: 'encerramento', bruto }

  for (const fase of FASES_CANONICAS) {
    if (!bruto.startsWith(fase)) continue
    const ciclo = inteiroDoSufixo(bruto.slice(fase.length))
    if (ciclo !== null) return { tipo: 'ciclo', bruto, canonica: fase, ciclo }
  }

  const etapa = casarEtapa(bruto, mapa)
  if (etapa !== null) return { tipo: 'etapa', bruto, ...etapa }

  return { tipo: 'desconhecida', bruto }
}
