/**
 * The judgement of the greenfield axis: stage, scenario, metadata, summary and
 * the crossing of the specs with the delivered features (RF-02 to RF-06,
 * RF-09, RN-01 to RN-07, RN-10, RN-14, D-02 to D-08, D-12).
 *
 * A pure function over what the probe saw, what the pointer of REVERSA holds
 * and what the history of feature 006 already judged. It writes nothing,
 * reads nothing and imports no platform module: the probe looks, this module
 * decides, which is the cut the house already makes.
 *
 * Two rules of RN-01 and RN-02 run through everything here. The DISK is the
 * authority over the stage: five artifacts in a fixed sequence, and the stage
 * is the longest contiguous run present from the first. The METADATA the
 * pipeline writes is read, shown and compared, and where it disagrees with the
 * disk the disagreement is declared as an anomaly rather than resolved by
 * trusting either side.
 * @module domain/greenfield
 */

import { asRecord, asString, asStringList, parseJsonSafe } from '../heranca/reversa-domain/src/index.ts'
import { splitSections } from '../heranca/reversa-domain/src/index.ts'
import type { GreenfieldRead } from '../probe/greenfield.ts'
import {
  IDEATION_FILE,
  NEWPROJECT_BRIEF_FILE,
  PERSONAS_FILE,
  PRD_FILE,
  SDD_FOLDER,
} from './limits.ts'
import { readPrdScope } from './prd-scope.ts'
import type {
  ComponentSituation,
  FeatureMark,
  FeatureSituation,
  GreenfieldAnomaly,
  GreenfieldArtifacts,
  GreenfieldAxis,
  GreenfieldMetadata,
  GreenfieldPaths,
  GreenfieldStage,
  HistoryEntry,
  PlannedComponent,
  ProductPanorama,
  ProjectHistory,
  ProjectScenario,
  UnplannedFeature,
} from './types.ts'
import { EMPTY_GREENFIELD, GREENFIELD_STAGES } from './types.ts'

/** What the judgement needs. */
export interface GreenfieldInput {
  /** What the probe saw in the output folder. */
  lido: GreenfieldRead
  /** The raw `state.json`, as the inherited snapshot carries it; null when absent. */
  stateJson: string | null
  /** The history of feature 006, already judged. */
  history: ProjectHistory
  /** The output folder as `state.json` declares it, relative to the root. */
  outputFolder: string
}

/** The file the pipeline metadata lives in, as the anomaly names it. */
const STATE_FILE = '.reversa/state.json'

/** The field of `state.json` the `/reversa-new` pipeline writes its progress to. */
const PROGRESS_FIELD = 'newproject_progress'

/** The heading of the brief whose first sentence is the summary line (D-12). */
const IDEA_HEADING = 'ideia original'

/**
 * The tokens the pipeline writes to `stage`, accepted at each physical stage
 * (RN-02, D-04).
 *
 * Each stage accepts the agent that PRODUCED its last artifact and the NEXT
 * one, because in guided mode the metadata moves one step behind or one step
 * ahead of the disk while the user is asked to continue. Anything else is a
 * disagreement worth a line. Past the specs any `forward-*` is accepted too,
 * since the forward cycle keeps writing the field after the pipeline is done.
 */
const ACCEPTED_TOKENS: Record<GreenfieldStage, readonly string[]> = {
  ausente: ['ideator'],
  aberto: ['ideator'],
  ideado: ['ideator', 'researcher'],
  pesquisado: ['researcher', 'drafter'],
  redigido: ['drafter', 'spec-sdd'],
  especificado: ['spec-sdd', 'done'],
}

/** How far each situation of the history got, for picking the most advanced folder. */
const ADVANCE: Record<FeatureSituation, number> = {
  convergida: 3,
  'entregue-sem-adendo': 2,
  'em-aberto': 1,
  'sem-acoes': 1,
}

/** The projection of RN-06: a situation of the history onto one of the component. */
const PROJECTION: Record<FeatureSituation, ComponentSituation> = {
  convergida: 'convergida',
  'entregue-sem-adendo': 'entregue',
  'em-aberto': 'em-andamento',
  'sem-acoes': 'em-andamento',
}

/**
 * Judge the greenfield axis of one reading.
 * @param input - what the probe saw, the raw state, the history and the output folder.
 * @returns the axis, complete, with every loss declared as an anomaly; never throws.
 */
export function readGreenfield(input: GreenfieldInput): GreenfieldAxis {
  const { lido, outputFolder } = input
  const anomalias: GreenfieldAnomaly[] = []
  const metadado = readMetadata(input.stateJson, anomalias)

  if (!lido.pasta) return { ...EMPTY_GREENFIELD, metadado, resumo: summaryOf(null, metadado) }

  const path = (file: string): string => `${outputFolder}/${file}`
  const estagio = stageOf(lido, path, anomalias)
  const cenario = scenarioOf(lido)

  if (metadado?.estagio !== null && metadado?.estagio !== undefined) {
    const token = metadado.estagio
    const accepted = ACCEPTED_TOKENS[estagio].includes(token) ||
      (estagio === 'especificado' && token.startsWith('forward-'))
    if (!accepted) {
      anomalias.push({
        file: STATE_FILE,
        code: 'estagio-greenfield-divergente',
        detail: `o metadado diz \`${token}\` e o disco diz \`${estagio}\`; o disco manda`,
      })
    }
  }

  for (const file of lido.truncados) {
    anomalias.push({ file, code: 'artefato-greenfield-truncado', detail: 'corpo não lido' })
  }

  const artefatos: GreenfieldArtifacts = {
    brief: lido.brief,
    ideacao: lido.ideacao,
    personas: lido.personas,
    prd: lido.prd,
    specs: lido.totalDeSpecs,
  }
  const caminhos: GreenfieldPaths = {
    brief: lido.brief ? path(NEWPROJECT_BRIEF_FILE) : null,
    ideacao: lido.ideacao ? path(IDEATION_FILE) : null,
    personas: lido.personas ? path(PERSONAS_FILE) : null,
    prd: lido.prd ? path(PRD_FILE) : null,
  }

  return {
    cenario,
    estagio,
    artefatos,
    caminhos,
    metadado,
    resumo: summaryOf(lido.briefMd, metadado),
    panorama: panoramaOf(lido, input.history, path, anomalias),
    anomalias,
    truncados: [...lido.truncados],
  }
}

/* ------------------------------------------------------------- the stage */

/**
 * The physical stage: the longest contiguous run of artifacts from the first
 * (RF-03, D-02). A hole in the sequence does not advance the stage and is
 * declared, naming the first artifact missing and those present after it.
 */
function stageOf(
  lido: GreenfieldRead,
  path: (file: string) => string,
  anomalias: GreenfieldAnomaly[],
): GreenfieldStage {
  const sequence: Array<[string, boolean]> = [
    [NEWPROJECT_BRIEF_FILE, lido.brief],
    [IDEATION_FILE, lido.ideacao],
    [PERSONAS_FILE, lido.personas],
    [PRD_FILE, lido.prd],
    [`${SDD_FOLDER}/`, lido.totalDeSpecs > 0],
  ]

  let run = 0
  while (run < sequence.length && sequence[run]?.[1] === true) run += 1

  const later = sequence.slice(run + 1).filter(([, present]) => present).map(([file]) => file)
  if (run < sequence.length && later.length > 0) {
    anomalias.push({
      file: path(sequence[run]?.[0] ?? ''),
      code: 'sequencia-greenfield-com-buraco',
      detail: `ausente, mas ${later.map((file) => `\`${file}\``).join(' e ')} presente; o estágio não avança`,
    })
  }

  return GREENFIELD_STAGES[run] ?? 'ausente'
}

/** The scenario, by the anchor rule of the coding skill (RN-03, D-05). */
function scenarioOf(lido: GreenfieldRead): ProjectScenario {
  const legado = lido.arquitetura && lido.dominio
  const greenfield = lido.prd && lido.totalDeSpecs > 0
  if (legado && greenfield) return 'misto'
  if (legado) return 'legado'
  if (greenfield) return 'greenfield'
  return 'sem-ancora'
}

/* ---------------------------------------------------------- the metadata */

/**
 * The progress field of `state.json`, read with tolerance (RF-05, D-03).
 *
 * An absent field is NULL and no anomaly: it is what every project that did
 * not run `/reversa-new` has. An unreadable `state.json` is null too, and the
 * inherited reader is who names that loss. Only a field that is there and is
 * not an object is a malformation of this axis.
 */
function readMetadata(stateJson: string | null, anomalias: GreenfieldAnomaly[]): GreenfieldMetadata | null {
  const state = asRecord(parseJsonSafe(stateJson).value)
  if (state === null || !(PROGRESS_FIELD in state)) return null

  const progress = asRecord(state[PROGRESS_FIELD])
  if (progress === null) {
    anomalias.push({
      file: STATE_FILE,
      code: 'metadado-greenfield-malformado',
      detail: `o campo \`${PROGRESS_FIELD}\` existe e não é um objeto`,
    })
    return null
  }

  return {
    modo: asString(progress.mode),
    estagio: asString(progress.stage),
    iniciadoEm: asString(progress.started_at),
    ultimoCheckpointEm: asString(progress.last_checkpoint_at),
    concluidos: asStringList(progress.completed_stages),
    brief: asString(progress.brief),
  }
}

/* ----------------------------------------------------------- the summary */

/**
 * The summary line, in three steps (RF-06, D-12): the first sentence of the
 * "Ideia original" section of the brief, else the first sentence of the brief
 * field of the metadata, else nothing.
 */
function summaryOf(briefMd: string | null, metadado: GreenfieldMetadata | null): string | null {
  const section = briefMd === null ? undefined : splitSections(briefMd)[IDEA_HEADING]
  const fromBrief = section === undefined ? null : firstSentence(firstParagraph(section))
  if (fromBrief !== null) return fromBrief
  return metadado?.brief === null || metadado?.brief === undefined ? null : firstSentence(metadado.brief)
}

/** The first paragraph of a section, its hard wrap undone. */
function firstParagraph(text: string): string {
  const lines: string[] = []
  for (const line of text.split('\n')) {
    const trimmed = line.trim()
    if (trimmed === '') {
      if (lines.length > 0) break
      continue
    }
    lines.push(trimmed)
  }
  return lines.join(' ')
}

/** The first sentence of a text, or the whole text when no sentence ends; null when empty. */
function firstSentence(text: string): string | null {
  const trimmed = text.trim()
  if (trimmed === '') return null
  const sentence = /^(.*?[.!?])(?:\s|$)/.exec(trimmed)
  return sentence === null ? trimmed : (sentence[1] ?? trimmed)
}

/* ---------------------------------------------------------- the panorama */

/** The name of a spec or a folder, comparable: lowercase, no diacritics, hyphen kept (D-07). */
function comparable(name: string): string {
  return name.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
}

/**
 * The crossing of the specs with the folders of the history (RF-09, RN-05,
 * RN-06, RN-07, RN-10, RN-14).
 */
function panoramaOf(
  lido: GreenfieldRead,
  history: ProjectHistory,
  path: (file: string) => string,
  anomalias: GreenfieldAnomaly[],
): ProductPanorama {
  const byName = new Map<string, HistoryEntry[]>()
  for (const entry of history.entradas) {
    if (entry.nomeCurto === null) continue
    const key = comparable(entry.nomeCurto)
    byName.set(key, [...(byName.get(key) ?? []), entry])
  }

  const seen = new Set<string>()
  const matched = new Set<HistoryEntry>()
  const componentes: PlannedComponent[] = []

  for (const file of lido.specs) {
    const nome = file.replace(/\.md$/i, '')
    const key = comparable(nome)
    if (seen.has(key)) {
      anomalias.push({
        file: path(`${SDD_FOLDER}/${file}`),
        code: 'spec-duplicada',
        detail: `colide com outra spec após normalização do nome; só a primeira entra`,
      })
      continue
    }
    seen.add(key)

    const folders = byName.get(key) ?? []
    for (const entry of folders) matched.add(entry)
    componentes.push(componentOf(nome, path(`${SDD_FOLDER}/${file}`), folders))
  }

  const foraDoPlano: UnplannedFeature[] = history.entradas
    .filter((entry) => !matched.has(entry))
    .map((entry) => ({
      pasta: entry.pasta,
      id: entry.id,
      nomeCurto: entry.nomeCurto,
      situacao: entry.situacao,
      marca: entry.marca,
    }))

  const scope = readPrdScope(lido.prdMd)
  if (lido.prdMd !== null && !scope.encontrado) {
    anomalias.push({
      file: path(PRD_FILE),
      code: 'escopo-do-prd-nao-encontrado',
      detail: 'nenhuma seção de nível dois com "Escopo" no título',
    })
  }
  if (scope.truncado) {
    anomalias.push({
      file: path(PRD_FILE),
      code: 'artefato-greenfield-truncado',
      detail: 'a lista de itens do escopo parou no teto',
    })
  }

  return {
    componentes,
    foraDoPlano,
    escopo: scope.itens,
    escopoEncontrado: scope.encontrado,
    totalDeSpecs: lido.totalDeSpecs,
    truncado: lido.totalDeSpecs > lido.specs.length,
    convergidos: componentes.filter((c) => c.situacao === 'convergida').length,
  }
}

/**
 * One component: the spec, and what the folders that match it say. Several
 * folders are all listed, and the most advanced one, first in history order
 * among equals, is what the situation, the addendum and the actions come from
 * (D-08).
 */
function componentOf(nome: string, spec: string, folders: HistoryEntry[]): PlannedComponent {
  if (folders.length === 0) {
    return { nome, spec, situacao: 'planejada', marca: 'nenhuma', pastas: [], adendo: null, acoes: null }
  }

  let best = folders[0] as HistoryEntry
  for (const entry of folders) if (ADVANCE[entry.situacao] > ADVANCE[best.situacao]) best = entry

  return {
    nome,
    spec,
    situacao: PROJECTION[best.situacao],
    marca: markOf(folders),
    pastas: folders.map((entry) => entry.pasta),
    adendo: best.adendo,
    acoes: { ...best.acoes },
  }
}

/** The mark of a component: active if any folder is, else paused if any is, else none. */
function markOf(folders: HistoryEntry[]): FeatureMark {
  if (folders.some((entry) => entry.marca === 'ativa')) return 'ativa'
  if (folders.some((entry) => entry.marca === 'pausada')) return 'pausada'
  return 'nenhuma'
}
