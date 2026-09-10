/**
 * What the bug registry MEANS (RN-02, RN-04, RN-05, RN-09, RF-12, RF-15, RF-16,
 * D-11, D-14, D-15).
 *
 * It judges what `probe/bugs.ts` read, and reads no disk of its own: the same
 * cut the house already makes between looking and deciding, and what lets every
 * rule below be exercised over a tree in memory.
 *
 * FOUR DECISIONS LIVE HERE, and each of them is a rule someone could get wrong
 * in a way nobody would see.
 *
 * The RESTRICTED bug is filtered BEFORE anything is assembled (D-11). The
 * privacy requirement asks that the content not cross the channel, not merely
 * that the screen decline to draw it: filtering on the far side would let the
 * title and the identifier travel to a place they are not allowed to be. What
 * travels is the count of the omitted, and nothing else of them.
 *
 * The two ASYMMETRIES of the lock are DECLARED and never resolved (RN-04). A
 * `resolved` without a lock and a lock over an unresolved bug are both
 * inconsistencies of the registry, and the panel says which one it found
 * without choosing between the two readings. The generator of the projections
 * stops with an error on exactly these two; the panel, which never writes,
 * declares them.
 *
 * The COUNT is of what is on DISK, and the list is measured against it (RN-05,
 * D-15). The tally counts every bug found, restricted ones included; the list
 * carries only what may be drawn. Where the two disagree, the disagreement is
 * stated rather than smoothed over, which is the same rule the decomposition
 * already applies between the inherited count and the rows it lists.
 *
 * Every LOSS becomes a named anomaly (RF-12). A bug that could not be read is
 * an anomaly and an absent row, never a row quietly missing from the list.
 * @module domain/bugs
 */

import { readFrontMatter } from './front-matter.ts'
import type { FrontMatter } from './front-matter.ts'
import type { BugFolderRead, BugsRead } from '../probe/bugs.ts'
import {
  BUG_PHASES,
  BUG_PRIORITIES,
  BUG_SEVERITIES,
  BUG_STATES,
  EMPTY_BUG_COUNTS,
} from './types.ts'
import type {
  BugAnomaly,
  BugAnomalyCode,
  BugContext,
  BugCounts,
  BugEntry,
  BugPhase,
  BugPriority,
  BugRegistry,
  BugSeverity,
  BugState,
} from './types.ts'

/** The visibility that keeps a bug out of every view (RN-02). */
const RESTRICTED = 'restricted'

/** The state that the lock is supposed to accompany (RN-04). */
const RESOLVED: BugState = 'resolved'

/** The form of a date in the registry: a day, and never an instant (RN-06). */
const DATE = /^\d{4}-(\d{2})-(\d{2})$/

/** The widest month and the widest day any calendar has. */
const LAST_MONTH = 12
const LAST_DAY = 31

/**
 * Whether a value is a date of the registry.
 *
 * The ranges are checked LEXICALLY, and no `Date` is built: RN-06 refuses the
 * conversion, and building one to validate would be the same trap by another
 * door. A thirteenth month is not a date and becomes an anomaly; the thirtieth
 * of February passes the check and is drawn as written, because telling that
 * one apart would take the very construction the rule forbids, and it would
 * normalise the day into one the file does not hold.
 * @param value - the value as it was read.
 * @returns true when the value has the form and the ranges of a date.
 */
function isDate(value: string): boolean {
  const found = DATE.exec(value)
  if (found === null) return false

  const month = Number(found[1])
  const day = Number(found[2])
  return month >= 1 && month <= LAST_MONTH && day >= 1 && day <= LAST_DAY
}

/** The line of `DONE.md` that carries the date of the closing (D-14). */
const LOCK_DATE = /^\s*Data:\s*(.+?)\s*$/m

/** The four closed vocabularies, as sets, for the recognition of a value. */
const STATES: ReadonlySet<string> = new Set(BUG_STATES)
const PHASES: ReadonlySet<string> = new Set(BUG_PHASES)
const SEVERITIES: ReadonlySet<string> = new Set(BUG_SEVERITIES)
const PRIORITIES: ReadonlySet<string> = new Set(BUG_PRIORITIES)

/** One bug judged, plus what its reading cost and what it is counted as. */
interface Judged {
  /** The entry to draw, or null when the bug may not be drawn at all. */
  entrada: BugEntry | null
  /** True when RN-02 kept the bug out of the list. */
  restrito: boolean
  /** True when the bug exists on disk, whatever came of reading it. */
  contado: boolean
  /** The state it counts as, when it declared a recognised one. */
  estado: BugState | null
  anomalias: BugAnomaly[]
}

/**
 * Judge what the probe read into the registry the panel draws.
 * @param lido - the contexts and bug folders, as the local probe read them.
 * @returns the registry, with its groups, its tallies and its anomalies.
 */
export function readBugs(lido: BugsRead): BugRegistry {
  if (!lido.presente) {
    return {
      presente: false,
      contextos: [],
      contagem: { ...EMPTY_BUG_COUNTS },
      lidos: 0,
      truncado: false,
      anomalias: [],
    }
  }

  const anomalias: BugAnomaly[] = []
  const porContexto = new Map<string, Judged[]>()
  for (const contexto of lido.contextos) porContexto.set(contexto.contexto, [])

  for (const pasta of lido.pastas) {
    const julgado = judge(pasta)
    anomalias.push(...julgado.anomalias)
    porContexto.get(pasta.contexto)?.push(julgado)
  }

  const contextos = lido.contextos.map((contexto) =>
    group(contexto.contexto, contexto.pasta, porContexto.get(contexto.contexto) ?? []),
  )

  const somado = contextos.reduce(
    (total, contexto) => sum(total, contexto.contagem),
    { ...EMPTY_BUG_COUNTS },
  )

  return {
    presente: true,
    contextos,
    // The tally of the PROJECT is counted apart from the tallies of the groups,
    // and never presented as the same thing (RN-09). The breakdown is summed
    // from the groups, because that is where the bugs that were read are; the
    // TOTAL comes from the walk, because RN-05 makes what exists on disk the
    // authority over how many there are. Under the ceiling the two differ, and
    // that difference is exactly what `lidos` and `truncado` declare -- a total
    // taken from the sum would present fifty as the number that exists.
    contagem: { ...somado, total: lido.total },
    lidos: lido.pastas.length,
    truncado: lido.truncado,
    anomalias,
  }
}

/**
 * One bug folder, judged into a row, a tally and its anomalies.
 * @param pasta - the folder as the probe read it.
 * @returns the entry when it may be drawn, plus what it costs and counts as.
 */
function judge(pasta: BugFolderRead): Judged {
  const arquivo = `${pasta.pasta}/bug.md`
  const anomalias: BugAnomaly[] = []
  const log = (code: BugAnomalyCode, detail?: string): void => {
    anomalias.push(detail === undefined ? { file: arquivo, code } : { file: arquivo, code, detail })
  }

  if (pasta.bugMd === null) {
    // The bug exists as a folder and its source of truth could not be opened:
    // missing, refused, or above the byte cap of the inherited reader. It is
    // counted as existing and drawn nowhere, which is the degradation the
    // contract already makes normative.
    log('bug-ilegivel', pasta.temBugMd ? 'o arquivo não pôde ser lido' : 'o arquivo não existe')
    return { entrada: null, restrito: false, contado: true, estado: null, anomalias }
  }

  const bloco = readFrontMatter(pasta.bugMd)
  if (!bloco.presente) {
    log(bloco.falha === 'bloco-truncado' ? 'front-matter-ilegivel' : 'bug-sem-front-matter')
    return { entrada: null, restrito: false, contado: true, estado: null, anomalias }
  }

  // RN-02 is applied HERE, before a single field is assembled: what is filtered
  // in the reading layer never reaches the payload, and therefore never crosses
  // the channel (D-11).
  if (bloco.escalares.visibility === RESTRICTED) {
    return { entrada: null, restrito: true, contado: true, estado: null, anomalias }
  }

  const id = bloco.escalares.id ?? null
  if (id === null) log('bug-sem-identificador')

  const estado = recognised(bloco, 'status', STATES, log, 'estado-de-bug-desconhecido')
  const fase = recognised(bloco, 'phase', PHASES, log, 'fase-de-bug-desconhecida')
  const severidade = recognised(bloco, 'severity', SEVERITIES, log, 'severidade-de-bug-desconhecida')
  // The priority has no anomaly of its own: the vocabulary of the registry has
  // no code for it, and inventing one here would be this module legislating
  // over a contract that belongs to `/reversa-debugger`. An unrecognised value
  // is still drawn raw and marked, which is what RF-12 asks of it.
  const prioridade = bloco.escalares.priority ?? null

  const encerrado = lockDate(pasta, log)
  const inconsistencia = mismatch(estado.valor as BugState | null, pasta.temTrava)
  if (inconsistencia !== null) log('bug-inconsistente', inconsistencia)

  const entrada: BugEntry = {
    pasta: pasta.pasta,
    arquivo,
    id,
    apelido: alias(bloco),
    titulo: bloco.escalares.title ?? null,
    estado: estado.valor as BugState | null,
    estadoBruto: estado.bruto,
    fase: fase.valor as BugPhase | null,
    faseBruta: fase.bruto,
    severidade: severidade.valor as BugSeverity | null,
    severidadeBruta: severidade.bruto,
    prioridade: PRIORITIES.has(prioridade ?? '') ? (prioridade as BugPriority) : null,
    prioridadeBruta: prioridade,
    registrado: date(bloco, 'created', log),
    alterado: date(bloco, 'updated', log),
    travado: pasta.temTrava,
    encerrado,
    bloqueado: bloco.listas.blocking === true,
    inconsistencia,
  }

  return {
    entrada,
    restrito: false,
    contado: true,
    estado: entrada.estado,
    anomalias,
  }
}

/**
 * A value looked up in a closed vocabulary, keeping the raw form whatever the
 * answer.
 *
 * The AUTHORITY over the vocabulary is the schema of `/reversa-debugger`, not
 * this module: a value outside the list is recorded as an anomaly and comes
 * back raw, so that the card draws what the file holds and marks it
 * unrecognised. Refusing the value would make the panel a second authority over
 * a contract it does not own.
 * @param bloco - the front matter as it was read.
 * @param campo - the key in the block.
 * @param vocabulario - the closed set of recognised values.
 * @param log - where to record an unrecognised value.
 * @param code - the anomaly to record.
 * @returns the recognised value, or null, plus the raw value.
 */
function recognised(
  bloco: FrontMatter,
  campo: string,
  vocabulario: ReadonlySet<string>,
  log: (code: BugAnomalyCode, detail?: string) => void,
  code: BugAnomalyCode,
): { valor: string | null; bruto: string | null } {
  const bruto = bloco.escalares[campo] ?? null
  if (bruto === null) return { valor: null, bruto: null }
  if (vocabulario.has(bruto)) return { valor: bruto, bruto }

  log(code, bruto)
  return { valor: null, bruto }
}

/**
 * A date of the registry, or its absence declared.
 *
 * A value that is not a date becomes an anomaly and an ABSENT date, rather than
 * text drawn where a date belongs: RN-06 fixes the form, and a line that showed
 * `ontem` under "registrado em" would be the panel repeating a malformed file
 * as if it had read it.
 * @param bloco - the front matter as it was read.
 * @param campo - `created` or `updated`.
 * @param log - where to record a malformed date.
 * @returns the date, or null.
 */
function date(
  bloco: FrontMatter,
  campo: string,
  log: (code: BugAnomalyCode, detail?: string) => void,
): string | null {
  const bruto = bloco.escalares[campo]
  if (bruto === undefined) return null
  if (isDate(bruto)) return bruto

  log('data-de-bug-invalida', `${campo}: ${bruto}`)
  return null
}

/**
 * The date written in the lock, which is the only source of it (D-14).
 *
 * The presence of the lock is the FACT of the closing, and the line is the date
 * of it: a lock with no line stays a closing, and gains an anomaly of its own.
 * The modification time of the file is refused by RN-06, and refused here in
 * silence, because it changes for reasons that have nothing to do with the bug.
 * @param pasta - the folder as the probe read it.
 * @param log - where to record a lock with no date.
 * @returns the date, or null when there is no lock or no line.
 */
function lockDate(
  pasta: BugFolderRead,
  log: (code: BugAnomalyCode, detail?: string) => void,
): string | null {
  if (!pasta.temTrava) return null

  const linha = pasta.travaMd === null ? null : LOCK_DATE.exec(pasta.travaMd)
  const bruto = linha === null ? null : (linha[1] ?? null)
  if (bruto === null) {
    log('trava-sem-data')
    return null
  }
  if (isDate(bruto)) return bruto

  log('data-de-bug-invalida', `trava: ${bruto}`)
  return null
}

/**
 * The human alias, when it is a number.
 * @param bloco - the front matter as it was read.
 * @returns the number, or null when absent or not a number.
 */
function alias(bloco: FrontMatter): number | null {
  const bruto = bloco.escalares.display_number
  if (bruto === undefined) return null

  const numero = Number(bruto)
  return Number.isInteger(numero) ? numero : null
}

/**
 * Which of the two asymmetries of RN-04 this bug carries, if either.
 * @param estado - the recognised state, or null.
 * @param travado - whether the lock is present.
 * @returns the inconsistency, or null when the two agree.
 */
function mismatch(
  estado: BugState | null,
  travado: boolean,
): 'resolvido-sem-trava' | 'trava-sem-resolvido' | null {
  if (estado === RESOLVED && !travado) return 'resolvido-sem-trava'
  if (estado !== null && estado !== RESOLVED && travado) return 'trava-sem-resolvido'
  return null
}

/**
 * One context, with the bugs it may draw and the tally of everything it has.
 *
 * The tally is OF THIS CONTEXT, and RN-09 forbids presenting it as the tally of
 * the project. The most recent movement is taken from the bugs that may be
 * drawn: a restricted bug must not order the groups either, because the
 * position of a group would then be evidence about a bug nobody may see.
 * @param contexto - the bare context name.
 * @param pasta - the context path, relative to the observed root.
 * @param julgados - every bug of the context, already judged.
 * @returns the group.
 */
function group(contexto: string, pasta: string, julgados: readonly Judged[]): BugContext {
  const bugs = julgados
    .map((julgado) => julgado.entrada)
    .filter((entrada): entrada is BugEntry => entrada !== null)

  const contagem: BugCounts = {
    total: julgados.filter((julgado) => julgado.contado).length,
    abertos: julgados.filter((julgado) => julgado.estado === 'open').length,
    ativos: julgados.filter((julgado) => julgado.estado === 'active').length,
    resolvidos: julgados.filter((julgado) => julgado.estado === RESOLVED).length,
    restritos: julgados.filter((julgado) => julgado.restrito).length,
  }

  const datas = bugs
    .map((bug) => bug.alterado)
    .filter((data): data is string => data !== null && data !== '')

  return {
    contexto,
    pasta,
    bugs,
    contagem,
    ultimoMovimento:
      datas.length === 0 ? null : datas.reduce((maior, data) => (data > maior ? data : maior)),
  }
}

/**
 * Two tallies added.
 * @param total - the accumulator.
 * @param parcela - one group's tally.
 * @returns the sum.
 */
function sum(total: BugCounts, parcela: BugCounts): BugCounts {
  return {
    total: total.total + parcela.total,
    abertos: total.abertos + parcela.abertos,
    ativos: total.ativos + parcela.ativos,
    resolvidos: total.resolvidos + parcela.resolvidos,
    restritos: total.restritos + parcela.restritos,
  }
}
