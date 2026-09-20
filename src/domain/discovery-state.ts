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
import type {
  AbsorbedAnomaly,
  CheckpointState,
  DiscoveryStateAnomaly,
  DiscoveryStateAxis,
  EquivalenciaDeCampo,
  ExtractionState,
  MapaDeEquivalencias,
  NonAgentEntry,
} from './types.ts'
import { EMPTY_DISCOVERY_STATE, EMPTY_MAPA_DE_EQUIVALENCIAS } from './types.ts'

/** The file every anomaly of this axis names, and the one the absorption matches. */
const FILE = '.reversa/state.json'

/** The five phases REVERSA documents, which are tested BEFORE the closing family. */
const CANONICAS = new Set(['reconhecimento', 'escavacao', 'interpretacao', 'geracao', 'revisao'])

/** The inherited code this axis is able to absorb, and the only one. */
const ABSORVIVEL = 'fase-desconhecida'

/**
 * The root a closing value carries, in all five spellings measured:
 * `concluido`, `concluida`, `concluido-c3`, `concluido-escopado` and
 * `revisao_concluida`. No canonical phase contains it, so precedence and root
 * never collide.
 */
const RAIZ_DE_ENCERRAMENTO = 'conclu'

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
 * Whether a phase value declares the end of the extraction.
 *
 * By form: the value is split on `-` and `_`, each segment is lowercased and
 * stripped of diacritics, and one segment starting with the root is enough.
 * Nothing on disk is rewritten by this -- the raw value travels beside the
 * recognised one, which is what NG-05 asks.
 * @param bruto - the value as the file carries it.
 * @returns true when it names a closure.
 */
function declaraEncerramento(bruto: string): boolean {
  return bruto
    .split(/[-_]/)
    .map((parte) => parte.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase())
    .some((parte) => parte.startsWith(RAIZ_DE_ENCERRAMENTO))
}

/**
 * How far the extraction got (RF-01, RF-02).
 *
 * The precedence is the point, and it runs in this order: the canonical five
 * first, so a typo over `geracao` stays an unknown phase and keeps its
 * anomaly; then the closing family; then everything else, which is an
 * extraction under way under a name the reader does not know.
 * @param record - the parsed `state.json`.
 * @returns the situation, with the raw value beside it.
 */
function lerExtracao(record: Record<string, unknown>): ExtractionState {
  const bruto = asString(record.phase)
  const concluidas = asStringList(record.completed)

  if (bruto === null) {
    return { situacao: concluidas.length === 0 ? 'nao-iniciada' : 'em-curso', bruto: null }
  }
  if (CANONICAS.has(bruto)) return { situacao: 'em-curso', bruto }
  if (declaraEncerramento(bruto)) return { situacao: 'encerrada', bruto }
  return { situacao: 'em-curso', bruto }
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
  if (instante !== null) {
    return { ...comum, situacao: 'concluido', instante, reconhecidoPor: null }
  }
  if (pendentes.length > 0) {
    return { ...comum, situacao: 'em-andamento', instante: null, reconhecidoPor: null }
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
    }
  }

  return { ...comum, situacao: 'conclusao-nao-declarada', instante: null, reconhecidoPor: null }
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
 * does not draw (D-02).
 *
 * The identity is the WHOLE triple, never the code alone. Absorbing by code
 * would wipe out every `fase-desconhecida`, including the one over a typo,
 * which is exactly what EC-02 exists to catch -- and a `state.json` carrying a
 * closing phase AND a stray name in `completed` produces both at once.
 *
 * Nothing is removed from the inherited list here. This is the identity of
 * what the composition on the webview side discounts, and the reading keeps
 * reporting the disk whole.
 * @param anomalias - what the inherited layer recorded.
 * @param extracao - the situation this axis recognised.
 * @returns the absorbed ones, empty when the extraction did not close.
 */
function absorver(
  anomalias: readonly { file: string; code: string; detail?: string }[],
  extracao: ExtractionState,
): AbsorbedAnomaly[] {
  if (extracao.situacao !== 'encerrada' || extracao.bruto === null) return []

  return anomalias
    .filter(
      (anomalia) =>
        anomalia.file === FILE &&
        anomalia.code === ABSORVIVEL &&
        anomalia.detail === extracao.bruto,
    )
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
  const extracao = lerExtracao(record)

  return {
    extracao,
    checkpoints,
    // The anomaly survives only where the map recognised nothing. Once a
    // person has decided, repeating the warning has no addressee left; the
    // decision stays auditable through the provenance on the row and through
    // the map's own history (RN-05).
    anomalias: anomaliasDosCheckpoints(checkpoints),
    absorvidas: absorver(input.anomalias, extracao),
    registrosNaoAgentes: registros,
  }
}
