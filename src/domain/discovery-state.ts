/**
 * The discovery state as feature 011 reads it: how far the extraction got, and
 * how far each agent got with its checkpoint.
 *
 * A pure function over the raw `state.json` the probe already brought and the
 * anomalies the inherited layer already recorded. It writes nothing, reads no
 * disk and imports no platform module: the probe looks, this module decides,
 * which is the cut the house already makes.
 *
 * It does NOT replace the inherited reading of `state.ts`. That one stays
 * exactly as it is, faithful to `state-schema.md`, and keeps recording
 * `fase-desconhecida` over a closing phase. What this module adds is the
 * recognition the panel needs in order to decide what deserves the reader's
 * attention -- which NG-03 reserves to the panel, and which is why nothing in
 * `src/heranca/` was touched.
 *
 * Two asymmetric facts, measured across the sixty-four projects with a
 * `state.json` under `~/dev` on 2026-09-20, decide the two rules here.
 *
 * The closing phase is SYSTEMATIC: seventeen projects, five spellings, across
 * REVERSA 1.2.x and 1.3.3, for a value the schema does not document. So the
 * reader learns it, by FORM rather than by a literal list that would be out of
 * date the moment a sixth spelling appears.
 *
 * The checkpoint without `completed_at` is a DEVIATION: the documented field
 * is in 203 of 229 records. So the reader does not learn the alternatives --
 * `at`, `status`, `concluido_em`, `data`, `date`, `timestamp`, `done`, seven
 * names with no normative source. It names the state honestly and records the
 * anomaly RF-07 already asks for.
 * @module domain/discovery-state
 */

import { asRecord, asString, asStringList, parseJsonSafe } from '../heranca/reversa-domain/src/index.ts'
import { elidirCheckpoint } from './elisao.ts'
import { classificarNome, FASES_CANONICAS } from './fases.ts'
import type { NomeDeFase } from './fases.ts'
import type {
  AbsorbedAnomaly,
  CheckpointState,
  CicloCorrente,
  DiscoveryStateAnomaly,
  DiscoveryStateAxis,
  EquivalenciaDeCampo,
  EtapaReconhecida,
  ExtractionState,
  MapaDeEquivalencias,
  NonAgentEntry,
} from './types.ts'
import { EMPTY_DISCOVERY_STATE, EMPTY_MAPA_DE_EQUIVALENCIAS } from './types.ts'

/** The file every anomaly of this axis names, and the one the absorption matches. */
const FILE = '.reversa/state.json'

/** The inherited code this axis absorbs over a recognised name. */
const ABSORVIVEL = 'fase-desconhecida'

/** The inherited code this axis absorbs over an extraction that closed without saying so (feature 015). */
const JA_CONCLUIDA = 'fase-atual-ja-concluida'

/** What the judgement needs; both come from what was already read. */
export interface DiscoveryStateInput {
  /** The raw `state.json`, as the inherited snapshot carries it; null when absent. */
  stateJson: string | null
  /** The anomalies the inherited layer recorded, for the absorption. */
  anomalias: readonly { file: string; code: string; detail?: string }[]
  /**
   * What a person has approved (feature 012); absent means nothing was.
   *
   * Optional on purpose. Omitting the field is the path by which every suite
   * of feature 011 keeps passing without a line rewritten, and it is also the
   * correct behaviour for any caller that does not yet know the map.
   */
  equivalencias?: MapaDeEquivalencias
}

/**
 * The three lists of phase names, each name already judged (feature 015).
 *
 * Judged ONCE, here, and handed to everything that follows: the situation,
 * the cycle, the stages and the new anomaly all read the same judgement, which
 * is the whole reason `classificarNome` exists.
 */
interface NomesJulgados {
  phase: NomeDeFase | null
  completed: NomeDeFase[]
  pending: NomeDeFase[]
}

/**
 * Judge `phase`, `completed` and `pending`, and nothing else of the file.
 *
 * No other top-level key is read. `cycle`, `cycle_N` and the nine spellings of
 * a re-extraction stay out: adopting one would be choosing the spelling of one
 * project against nine.
 * @param record - the parsed `state.json`.
 * @param mapa - what a person approved.
 * @returns the judged names, in the order the file carries them.
 */
function julgarNomes(record: Record<string, unknown>, mapa: MapaDeEquivalencias): NomesJulgados {
  const bruto = asString(record.phase)
  return {
    phase: bruto === null ? null : classificarNome(bruto, mapa),
    completed: asStringList(record.completed).map((nome) => classificarNome(nome, mapa)),
    pending: asStringList(record.pending).map((nome) => classificarNome(nome, mapa)),
  }
}

/** Whether a judged name is one the reader recognises as a phase or a stage. */
function reconhecido(nome: NomeDeFase): boolean {
  return nome.tipo === 'canonica' || nome.tipo === 'ciclo' || nome.tipo === 'etapa'
}

/**
 * The current cycle, which is the largest integer among the cycle phases
 * (RN-08). The suffix of a stage never counts: in `re-extracao-005` the number
 * follows the delivered feature.
 * @param nomes - the judged names.
 * @returns the number, or null when no cycle phase was recognised.
 */
function numeroDoCiclo(nomes: NomesJulgados): number | null {
  const todos = [...(nomes.phase === null ? [] : [nomes.phase]), ...nomes.completed, ...nomes.pending]
  const ciclos = todos.flatMap((nome) => (nome.tipo === 'ciclo' ? [nome.ciclo] : []))
  return ciclos.length === 0 ? null : Math.max(...ciclos)
}

/**
 * Whether the five phases of the current cycle are all in `completed`: the
 * canonical five when there is no cycle, the five with the suffix of the
 * current cycle when there is one.
 * @param nomes - the judged names.
 * @returns true when none of the five is missing.
 */
function cincoFasesConcluidas(nomes: NomesJulgados): boolean {
  const numero = numeroDoCiclo(nomes)
  return FASES_CANONICAS.every((fase) =>
    nomes.completed.some((nome) =>
      numero === null
        ? nome.tipo === 'canonica' && nome.canonica === fase
        : nome.tipo === 'ciclo' && nome.canonica === fase && nome.ciclo === numero,
    ),
  )
}

/**
 * How far the extraction got (feature 011, RF-01 and RF-02; feature 015, RF-20).
 *
 * The precedence is the point. The canonical five come first, so a typo over
 * `geracao` stays an unknown phase and keeps its anomaly; then the closing
 * family, exactly as feature 011 wrote it; then everything else, which is an
 * extraction under way.
 *
 * Feature 015 adds ONE reading on top, and only where the file did not declare
 * a closure: `pending` empty, `phase` recognised and already in `completed`,
 * and the five phases of the current cycle finished. Eleven of the sixty-four
 * projects measured on 2026-09-21 have exactly this form. All three conditions
 * are necessary -- `phase` in `completed` alone would reach an extraction under
 * way with a repeated phase, which is what `capacities` is.
 * @param nomes - the judged names.
 * @returns the situation, with the raw value beside it.
 */
function lerExtracao(nomes: NomesJulgados): ExtractionState {
  const phase = nomes.phase
  if (phase === null) {
    return { situacao: nomes.completed.length === 0 ? 'nao-iniciada' : 'em-curso', bruto: null }
  }
  const bruto = phase.bruto
  if (phase.tipo === 'encerramento') return { situacao: 'encerrada', bruto }

  const parouSemDeclarar =
    nomes.pending.length === 0 &&
    reconhecido(phase) &&
    nomes.completed.some((nome) => nome.bruto === bruto) &&
    cincoFasesConcluidas(nomes)

  return { situacao: parouSemDeclarar ? 'encerrada-sem-declaracao' : 'em-curso', bruto }
}

/**
 * The five phases as the current cycle has them (RF-09).
 *
 * The precedence is the one of `derivePhases`: done if the name with the
 * suffix of the cycle is in `completed`, else current if it is the `phase`,
 * else pending -- INCLUDING when the name appears in no list at all, which is
 * what the inherited layer does with a canonical phase missing from both.
 * With two spellings of the same cycle for one phase (`geracao-c2` and
 * `geracao-2`), the first in `completed` wins, then the `phase`, then the
 * first in `pending`. Earlier cycles do not appear.
 * @param nomes - the judged names.
 * @returns the cycle, or undefined when no cycle phase was recognised.
 */
function lerCiclo(nomes: NomesJulgados): CicloCorrente | undefined {
  const numero = numeroDoCiclo(nomes)
  if (numero === null) return undefined

  return {
    numero,
    fases: FASES_CANONICAS.map((canonica) => {
      const doCiclo = (nome: NomeDeFase | null): nome is NomeDeFase =>
        nome !== null && nome.tipo === 'ciclo' && nome.canonica === canonica && nome.ciclo === numero

      const concluida = nomes.completed.find(doCiclo)
      if (concluida !== undefined) return { canonica, status: 'done' as const, bruto: concluida.bruto }
      if (doCiclo(nomes.phase)) return { canonica, status: 'current' as const, bruto: nomes.phase.bruto }
      const pendente = nomes.pending.find(doCiclo)
      return { canonica, status: 'pending' as const, bruto: pendente?.bruto ?? null }
    }),
  }
}

/**
 * The approved stages present in the file (RF-22), in the order the file
 * carries them: `completed`, then the `phase` if not yet listed, then
 * `pending`, with no duplicate by raw name.
 *
 * A stage that is the `phase` AND sits in `completed` reads as finished, and
 * that is exactly the case the closure without declaration looks for.
 * @param nomes - the judged names.
 * @returns the stages, or undefined when none is present.
 */
function lerEtapas(nomes: NomesJulgados): EtapaReconhecida[] | undefined {
  const etapas: EtapaReconhecida[] = []
  const acrescentar = (nome: NomeDeFase | null, situacao: EtapaReconhecida['situacao']): void => {
    if (nome === null || nome.tipo !== 'etapa') return
    if (etapas.some((etapa) => etapa.bruto === nome.bruto)) return
    etapas.push({ bruto: nome.bruto, base: nome.base, sufixo: nome.sufixo, situacao })
  }

  for (const nome of nomes.completed) acrescentar(nome, 'concluida')
  acrescentar(nomes.phase, 'em-curso')
  for (const nome of nomes.pending) acrescentar(nome, 'pendente')

  return etapas.length === 0 ? undefined : etapas
}

/**
 * The anomaly of a closure declared over pending work (RF-07, RN-06).
 *
 * ONE per project and not one per pending name, because the defect is one: the
 * declaration contradicts the list. Before this feature the defect of `afla`
 * showed only by accident, as five `fase-desconhecida` over `pending`; with
 * the cycle phases recognised it would leave the screen without anyone having
 * fixed it. An unrecognised name in `pending` stays out of the detail: it
 * already has its own `fase-desconhecida`.
 * @param extracao - the situation this axis recognised.
 * @param nomes - the judged names.
 * @returns the anomaly, or nothing.
 */
function anomaliaDoEncerramento(extracao: ExtractionState, nomes: NomesJulgados): DiscoveryStateAnomaly[] {
  if (extracao.situacao !== 'encerrada' || extracao.bruto === null) return []

  const pendentes = nomes.pending.filter(reconhecido).map((nome) => nome.bruto)
  if (pendentes.length === 0) return []

  return [
    {
      file: FILE,
      code: 'encerramento-com-pendencia',
      detail: `${extracao.bruto}: pending ainda lista ${pendentes.join(', ')}`,
    },
  ]
}

/** The keys the inherited layer already knows; anything else is preserved elsewhere. */
const CONHECIDAS = new Set(['completed_at', 'files', 'modules_analyzed', 'modules_pending'])

/**
 * The preserved fields whose value is a list of strings (RF-11, D-08).
 *
 * Only when `files` is absent: with the canonical list there, there is nothing
 * to signal. And they are NOT called outputs anywhere, here or on screen,
 * because `achados`, `lacunas` and `adrs` have exactly this shape and are not
 * files. Thirteen names were measured for what a checkpoint calls its outputs,
 * so a closed list would be out of date and a guess by shape would be wrong;
 * naming the field and saying nothing about its contents is what can be
 * defended.
 * @param entry - the checkpoint object.
 * @returns the field names, sorted, or empty.
 */
function camposComLista(entry: Record<string, unknown>): string[] {
  if (asStringList(entry.files).length > 0) return []

  return Object.entries(entry)
    .filter(([chave]) => !CONHECIDAS.has(chave))
    .filter(([, valor]) => Array.isArray(valor) && asStringList(valor).length > 0)
    .map(([chave]) => chave)
    .sort()
}

/**
 * How far one agent got (RF-05, RF-06, RF-07).
 *
 * The precedence comes from `checkpoint-guide.md` of REVERSA, which declares
 * both registers and nothing in between: `completed_at` when an agent
 * finishes, `modules_pending` while it works. A checkpoint carrying neither
 * declared its conclusion under a name the schema does not have, and saying
 * "still running" about it would be asserting something false with the same
 * confidence as something true.
 *
 * The instant is read ONLY from `completed_at`. Seven other names carry it in
 * the field, and borrowing from any of them would be the panel asserting a
 * conclusion through the field that does not declare it.
 * @param agent - the key of the checkpoint map.
 * @param entry - the checkpoint object.
 * @returns the judged checkpoint.
 */
function lerCheckpoint(
  agent: string,
  entry: Record<string, unknown>,
  mapa: MapaDeEquivalencias,
): CheckpointState {
  const instante = asString(entry.completed_at)
  const pendentes = asStringList(entry.modules_pending)
  const comum = { agent, camposComLista: camposComLista(entry) }

  // The two rules of the schema, in the order `checkpoint-guide.md` declares
  // them, and BEFORE the map is looked at (RN-02). A checkpoint that carries
  // `status: "concluido"` next to a populated `modules_pending` is work under
  // way, and reading it the other way round would declare finished an agent
  // that is halfway through.
  // The elided form travels ONLY with the fourth situation, and the nullity is
  // WRITTEN in each of the three branches that decide before it rather than
  // inherited from a shared object. Reading the code is part of the privacy
  // promise, and a reader who has to infer the nullity has not verified it
  // (feature 013, RN-14).
  if (instante !== null) {
    return {
      ...comum,
      situacao: 'concluido',
      instante,
      reconhecidoPor: null,
      formaElidida: null,
    }
  }
  if (pendentes.length > 0) {
    return {
      ...comum,
      situacao: 'em-andamento',
      instante: null,
      reconhecidoPor: null,
      formaElidida: null,
    }
  }

  // Only now: what a person approved. The instant stays null whatever the map
  // says, because an approved pair establishes THAT an agent finished and
  // never WHEN -- `at` sits right there, with a valid instant inside, and it
  // declares no end of work (RN-06).
  const par = casarPar(entry, mapa)
  if (par !== null) {
    return {
      ...comum,
      situacao: par.leitura,
      instante: null,
      reconhecidoPor: { campo: par.campo, valor: par.valor },
      formaElidida: null,
    }
  }

  // Only here, and this is the whole of feature 013. The panel had nothing to
  // say about the field that caused the deviation: of the three checkpoints
  // left after the first promotion, two reached the screen with no field named
  // at all, because `camposComLista` reports list-valued fields and only when
  // `files` is absent. The form is elided HERE, in the reading, so the webview
  // never sees the raw checkpoint and the promise is verifiable at the frontier
  // rather than in the components.
  return {
    ...comum,
    situacao: 'conclusao-nao-declarada',
    instante: null,
    reconhecidoPor: null,
    formaElidida: elidirCheckpoint(entry),
  }
}

/**
 * The value of a field as the map writes it, or null when it is not a scalar.
 *
 * `true` becomes `"true"`, because `done: true` and `done: "true"` declare the
 * same thing and telling them apart would multiply records without multiplying
 * meaning. Case and edge spaces are normalised; diacritics are NOT, because
 * `concluido` and `concluído` are two spellings a person approved separately.
 * @param valor - whatever the field holds.
 * @returns the comparable value, or null.
 */
function valorComparavel(valor: unknown): string | null {
  if (typeof valor === 'string') return valor.trim().toLowerCase()
  if (typeof valor === 'boolean' || typeof valor === 'number') return String(valor)
  return null
}

/**
 * The approved pair this checkpoint carries, if any (RN-01).
 *
 * The match is on field AND value, never on the field alone: `status` was
 * measured carrying `concluido`, `completed`, `completo` and `success`, and a
 * project that failed would carry `failed`. Matching by field would declare
 * finished an agent that aborted.
 *
 * Fields are visited in the order the file writes them, so a checkpoint with
 * two approved pairs is read by the first one -- deterministic, and the case
 * is rare enough that inventing a precedence would be inventing a rule.
 * @param entry - the checkpoint object.
 * @param mapa - what a person approved.
 * @returns the pair with its reading, or null.
 */
function casarPar(
  entry: Record<string, unknown>,
  mapa: MapaDeEquivalencias,
): { campo: string; valor: string; leitura: EquivalenciaDeCampo['leitura'] } | null {
  for (const [campo, bruto] of Object.entries(entry)) {
    const comparavel = valorComparavel(bruto)
    if (comparavel === null) continue
    const par = mapa.pares.find((p) => p.campo === campo && p.valor === comparavel)
    // The value that travels onward is the RAW one, not the comparable one.
    // Normalising is how two spellings meet in the map; showing the normalised
    // form on screen would be the panel rewriting what the file says, which is
    // exactly what NG-05 forbids. `timestamp` makes the difference visible:
    // it matches as `...t12:10:19z` and is shown as `...T12:10:19Z`.
    if (par !== undefined) return { campo, valor: String(bruto), leitura: par.leitura }
  }
  return null
}

/**
 * Every checkpoint of the map, in the order the file carries them.
 * @param value - the `checkpoints` field, whatever it holds.
 * @returns the judged checkpoints; empty when the field is not a map.
 */
function lerCheckpoints(
  value: unknown,
  mapa: MapaDeEquivalencias,
): { checkpoints: CheckpointState[]; registros: NonAgentEntry[] } {
  const record = asRecord(value)
  if (record === null) return { checkpoints: [], registros: [] }

  const checkpoints: CheckpointState[] = []
  const registros: NonAgentEntry[] = []
  for (const [agent, raw] of Object.entries(record)) {
    const entry = asRecord(raw)
    // A checkpoint that is not an object is the inherited layer's business: it
    // already records `tipo-invalido` for exactly this, and recording it again
    // here would be two anomalies for one defect.
    if (entry === null) continue

    // An approved key leaves this list entirely and enters the other one
    // (RF-17). A key belongs to one of the two, never to both: leaving it here
    // under a flag would oblige every consumer to filter, and one of them
    // would eventually forget.
    if (mapa.naoAgentes.some((registro) => registro.chave === agent)) {
      registros.push({ chave: agent, camposComLista: camposComLista(entry) })
      continue
    }
    checkpoints.push(lerCheckpoint(agent, entry, mapa))
  }
  return { checkpoints, registros }
}

/**
 * One anomaly per checkpoint whose conclusion was declared outside the
 * canonical field (RF-07, RN-04).
 * @param checkpoints - the judged checkpoints.
 * @returns the anomalies, in the order of the checkpoints.
 */
function anomaliasDosCheckpoints(checkpoints: readonly CheckpointState[]): DiscoveryStateAnomaly[] {
  return checkpoints
    .filter((checkpoint) => checkpoint.situacao === 'conclusao-nao-declarada')
    .map((checkpoint) => ({
      file: FILE,
      code: 'checkpoint-sem-conclusao-declarada' as const,
      detail: `${checkpoint.agent}: sem completed_at`,
    }))
}

/**
 * The inherited anomalies this axis recognised, and which the panel therefore
 * does not draw (feature 011, D-02; feature 015, D-08).
 *
 * The identity is the WHOLE triple, never the code alone. Absorbing by code
 * would wipe out every `fase-desconhecida`, including the one over a typo,
 * which is exactly what EC-02 exists to catch -- and a `state.json` carrying a
 * closing phase AND a stray name in `completed` produces both at once.
 *
 * Three rules, and the first is feature 011's, untouched:
 *
 * 1. `fase-desconhecida` over the `phase`, when the extraction closed;
 * 2. `fase-desconhecida` over any name that reads as a cycle phase or as an
 *    approved stage, whichever of the three lists it came from;
 * 3. `fase-atual-ja-concluida` over the `phase`, when the extraction closed
 *    without declaring it.
 *
 * The same name in two lists yields two inherited anomalies with one triple,
 * and both are returned: the composition discounts them all.
 *
 * Nothing is removed from the inherited list here. This is the identity of
 * what the composition on the webview side discounts, and the reading keeps
 * reporting the disk whole.
 * @param anomalias - what the inherited layer recorded.
 * @param extracao - the situation this axis recognised.
 * @param mapa - what a person approved.
 * @returns the absorbed ones, in the order the inherited layer recorded them.
 */
function absorver(
  anomalias: readonly { file: string; code: string; detail?: string }[],
  extracao: ExtractionState,
  mapa: MapaDeEquivalencias,
): AbsorbedAnomaly[] {
  const sobreOPhase = (detail: string | undefined): boolean =>
    extracao.bruto !== null && detail === extracao.bruto

  return anomalias
    .filter((anomalia) => {
      if (anomalia.file !== FILE) return false
      if (anomalia.code === JA_CONCLUIDA) {
        return extracao.situacao === 'encerrada-sem-declaracao' && sobreOPhase(anomalia.detail)
      }
      if (anomalia.code !== ABSORVIVEL) return false
      if (extracao.situacao === 'encerrada' && sobreOPhase(anomalia.detail)) return true
      if (anomalia.detail === undefined) return false
      const tipo = classificarNome(anomalia.detail, mapa).tipo
      return tipo === 'ciclo' || tipo === 'etapa'
    })
    .map((anomalia) => ({ ...anomalia }))
}

/**
 * Read the discovery state of one workspace.
 * @param input - the raw state file and the inherited anomalies.
 * @returns the axis; never throws, for any input.
 */
export function readDiscoveryState(input: DiscoveryStateInput): DiscoveryStateAxis {
  // Absent, unparseable or not an object: the axis comes back empty, and no
  // anomaly is recorded. `json-invalido` is the inherited layer's, already
  // registered over the same file, and repeating it here would be two
  // anomalies for one defect. A COPY, never the shared constant, by the
  // precedent of `EMPTY_GREENFIELD`.
  const record = asRecord(parseJsonSafe(input.stateJson).value)
  if (record === null) return { ...EMPTY_DISCOVERY_STATE }

  const mapa = input.equivalencias ?? EMPTY_MAPA_DE_EQUIVALENCIAS
  const { checkpoints, registros } = lerCheckpoints(record.checkpoints, mapa)
  const nomes = julgarNomes(record, mapa)
  const extracao = lerExtracao(nomes)
  const ciclo = lerCiclo(nomes)
  const etapas = lerEtapas(nomes)

  return {
    extracao,
    checkpoints,
    // The anomaly survives only where the map recognised nothing. Once a
    // person has decided, repeating the warning has no addressee left; the
    // decision stays auditable through the provenance on the row and through
    // the map's own history (RN-05).
    anomalias: [...anomaliasDosCheckpoints(checkpoints), ...anomaliaDoEncerramento(extracao, nomes)],
    absorvidas: absorver(input.anomalias, extracao, mapa),
    registrosNaoAgentes: registros,
    // OPTIONAL fields, absent rather than empty, so the suites that build the
    // axis by hand keep compiling and an older screen sees nothing new.
    ...(ciclo === undefined ? {} : { ciclo }),
    ...(etapas === undefined ? {} : { etapas }),
  }
}
