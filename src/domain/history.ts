/**
 * What each feature folder of the project means (RF-09, RN-06, D-16, D-18,
 * D-19).
 *
 * It judges what `probe/features.ts` read, and reads no disk of its own: the
 * same cut the inherited layer already makes between looking and deciding.
 *
 * Two axes, and not one. The SITUATION comes from the artifacts of the folder;
 * the MARK comes from the pointer REVERSA keeps. Neither is called stage, and
 * that is deliberate: a paused feature can be in any situation, merging the two
 * would force a choice of which truth to tell, and a third name for the stage
 * would create a second authority over something the inherited contract
 * already owns.
 *
 * The order is by folder NAME, descending. The prefix is sequential or a date
 * depending on `setup.json`, and either way it orders chronologically, whereas
 * the date of an addendum is missing in a feature without one and may come
 * malformed in the ones that have it.
 * @module domain/history
 */

import { ProgressContract, scanActions, splitSections } from '../heranca/reversa-domain/src/index.ts'
import type { FeatureFolderRead } from '../probe/features.ts'
import { readConferences } from './conferences.ts'
import { readDeliveryLinks } from './delivery-link.ts'
import type { DeliveryLinks } from './delivery-link.ts'
import { ONBOARDING_FILE } from './limits.ts'
import type {
  DeliveryAnomaly,
  DeliveryLinkState,
  FeatureMark,
  FeatureSituation,
  HistoryEntry,
  ProjectHistory,
} from './types.ts'

/**
 * The line `/reversa` appends to an addendum once a re-extraction supersedes
 * it.
 *
 * It is the same rule the inherited forward contract applies to the active
 * feature, restated here because that one is private to its module and this
 * one has to apply it to every folder. RN-06 makes the consequence normative:
 * a superseded addendum counts as an absent one.
 */
const SUPERSEDED = /^\s*Superado pela re-extração de\s/im

/** A folder named the way the framework names them: a prefix, then a short name. */
const FRAMEWORK_NAME = /^(\d+)-(.+)$/

/** The file whose tally decides the situation. */
const ACTIONS_FILE = 'actions.md'

/** How the detail of a file present and not read begins, the same words for every file. */
const UNREAD = 'presente e não lido, acima do teto de bytes da sonda ou ilegível:'

/**
 * The three files of the folder whose loss the history declares itself, in the
 * order the probe reads them, each with what goes unjudged without it (bug
 * nº 11, EC-06). The two files of the delivery declare theirs in `deliveryOf`.
 */
const FOLDER_FILES: ReadonlyArray<readonly [file: string, unjudged: string]> = [
  [ACTIONS_FILE, 'a situação e a contagem de ações da pasta não foram julgadas'],
  ['requirements.md', 'o resumo executivo do requirements.md não foi lido'],
  ['progress.jsonl', 'o último evento da trilha não foi lido'],
]

/** The heading under which both an addendum and a `requirements.md` put their summary. */
const SUMMARY_HEADING = /\bresumo\b/

/** What the history needs to know, all of it already read by someone else. */
export interface HistoryInput {
  /** The folders, as the local probe read them. */
  pastas: FeatureFolderRead[]
  /** Whether the ceiling cut the walk short. */
  truncado: boolean
  /** How many folders exist. */
  total: number
  /** The active feature, as the pointer declares it. */
  activeFeatureDir: string | null
  /** The queue of paused features, by folder. */
  pausedFeatureDirs: string[]
  /** The addenda file names, as the inherited probe listed them. */
  addendaFiles: string[]
  /** The body of each addendum, by file name. */
  addendaBodies: Record<string, string>
  /** The output folder, for the path of an addendum the panel may open. */
  outputFolder: string
  /**
   * The link of every folder, as the reading layer extracted it ONCE for the
   * history and the panorama alike (feature 010, D-05). Absent, it is
   * extracted here from the same folders, which is what a caller without the
   * reading layer gets.
   */
  vinculos?: DeliveryLinks
}

/**
 * Judge every folder of the project into the history the panel draws.
 * @param input - what the probes read, plus the pointer REVERSA keeps.
 * @returns the entries, newest first, and the account of the reading.
 */
export function readHistory(input: HistoryInput): ProjectHistory {
  const active = normalize(input.activeFeatureDir)
  const paused = new Set(input.pausedFeatureDirs.map(normalize).filter((path) => path !== ''))

  const vinculos = input.vinculos ?? readDeliveryLinks(input.pastas)

  const judged = input.pastas
    .map((folder) => {
      const { entry, anomalias } = deliveryOf(folder, vinculos)
      return {
        entry: { ...entryOf(folder, input, active, paused), ...entry },
        anomalias: [...lossesOf(folder), ...anomalias],
      }
    })
    .sort((a, b) => (a.entry.pasta < b.entry.pasta ? 1 : a.entry.pasta > b.entry.pasta ? -1 : 0))

  return {
    entradas: judged.map(({ entry }) => entry),
    truncado: input.truncado,
    total: input.total,
    // The losses of each folder and of the delivery axis, in the order of the
    // entries (D-12).
    anomalias: judged.flatMap(({ anomalias }) => anomalias),
  }
}

/**
 * The files of the folder the probe listed and could not read (bug nº 11,
 * EC-06).
 *
 * Present and not read is not absent: the text is null in both cases, and only
 * the listing the probe kept tells them apart. Each loss is said, naming the
 * file, by the code the delivery axis already uses for the same fact.
 * @param folder - the folder as the probe read it.
 * @returns one anomaly per file not read, in the order of `FOLDER_FILES`.
 */
function lossesOf(folder: FeatureFolderRead): DeliveryAnomaly[] {
  const naoLidos = folder.naoLidos ?? []
  return FOLDER_FILES.filter(([file]) => naoLidos.includes(file)).map(([file, unjudged]) => ({
    file: `${folder.pasta}/${file}`,
    code: 'artefato-da-entrega-nao-lido',
    detail: `${UNREAD} ${unjudged}`,
  }))
}

/**
 * The two fields feature 010 appends to an entry, and what was lost reading
 * them (D-05, D-12, RN-07).
 *
 * Neither touches the situation: the conference is an axis BESIDE it, and a
 * converged folder with pending rows stays converged. Of the link, only the
 * state and the path travel; the cells are input of the panorama.
 * @param folder - the folder as the probe read it.
 * @param vinculos - the links already extracted.
 * @returns the two fields, and the anomalies of the folder.
 */
function deliveryOf(
  folder: FeatureFolderRead,
  vinculos: DeliveryLinks,
): { entry: Pick<HistoryEntry, 'vinculo' | 'conferencias'>; anomalias: DeliveryAnomaly[] } {
  const anomalias: DeliveryAnomaly[] = []

  const link = vinculos.get(folder.pasta)
  const vinculo: DeliveryLinkState =
    link === undefined
      ? { estado: 'ausente', arquivo: null, tabelas: 0 }
      : { estado: link.estado, arquivo: link.arquivo, tabelas: link.tabelas }
  if (vinculo.estado === 'nao-lido' && vinculo.arquivo !== null) {
    anomalias.push({
      file: vinculo.arquivo,
      code: 'artefato-da-entrega-nao-lido',
      detail: `${UNREAD} o vínculo declarado é parcial`,
    })
  }

  const onboardingMd = folder.onboardingMd ?? null
  const present = onboardingMd !== null || (folder.naoLidos ?? []).includes(ONBOARDING_FILE)
  const conferencias = readConferences(onboardingMd, present ? `${folder.pasta}/${ONBOARDING_FILE}` : null)
  anomalias.push(...conferencias.anomalias)

  return { entry: { vinculo, conferencias: conferencias.registro }, anomalias }
}

/**
 * One folder, judged.
 * @param folder - the folder as it was read.
 * @param input - the rest of the reading, for the addenda and the pointer.
 * @param active - the active feature folder, already normalized.
 * @param paused - the paused feature folders, already normalized.
 * @returns the entry.
 */
function entryOf(
  folder: FeatureFolderRead,
  input: HistoryInput,
  active: string,
  paused: ReadonlySet<string>,
): HistoryEntry {
  const named = FRAMEWORK_NAME.exec(folder.nome)
  const id = named === null ? null : (named[1] ?? null)
  const nomeCurto = named === null ? folder.nome : (named[2] ?? folder.nome)

  const scan = scanActions(folder.actionsMd)
  const acoes = {
    total: scan.total,
    fechadas: scan.fechadas,
    abertas: scan.abertas,
    emendas: scan.emendas,
  }

  const addendum = addendumOf(id, input)
  const path = normalize(folder.pasta)

  return {
    pasta: folder.pasta,
    id,
    nomeCurto,
    situacao: situationOf(
      folder.actionsMd,
      (folder.naoLidos ?? []).includes(ACTIONS_FILE),
      scan,
      addendum !== null,
    ),
    marca: markOf(path, active, paused),
    acoes,
    adendo: addendum === null ? null : `${input.outputFolder}/addenda/${addendum.name}`,
    resumo: summaryOf(addendum === null ? null : addendum.body, folder.requirementsMd),
    ultimoEvento: lastEventOf(folder.progressJsonl),
  }
}

/**
 * Where the folder stands, by its own artifacts.
 * @param actionsMd - the file, or null when the folder has none or it was not read.
 * @param unread - whether the file is present and was not read.
 * @param scan - the inherited tally of that file.
 * @param hasAddendum - whether an addendum in force was found.
 * @returns one of the five situations.
 */
function situationOf(
  actionsMd: string | null,
  unread: boolean,
  scan: ReturnType<typeof scanActions>,
  hasAddendum: boolean,
): FeatureSituation {
  // Unread comes first (bug nº 11, EC-06): without the actions none of the
  // other four is verifiable, and a null text is not an absent file.
  if (unread) return 'acoes-nao-lidas'
  if (actionsMd === null || scan.total === 0) return 'sem-acoes'
  // An open amendment reopens the feature, with no treatment of its own
  // (RN-05): the inherited scan already counts it in.
  if (scan.abertas > 0) return 'em-aberto'
  return hasAddendum ? 'convergida' : 'entregue-sem-adendo'
}

/**
 * What the pointer says about the folder.
 * @param path - the folder, normalized.
 * @param active - the active feature folder, normalized.
 * @param paused - the paused feature folders, normalized.
 * @returns one of the three marks.
 */
function markOf(path: string, active: string, paused: ReadonlySet<string>): FeatureMark {
  if (path !== '' && path === active) return 'ativa'
  return paused.has(path) ? 'pausada' : 'nenhuma'
}

/**
 * The addendum in force of one feature, by the `<feature-id>-…` naming REVERSA
 * uses.
 *
 * A superseded one comes back as none at all, which is what RN-06 asks: the
 * extraction it bridged no longer describes the delivery.
 * @param id - the feature identifier, or null when the folder is unnamed.
 * @param input - the addenda the inherited probe read.
 * @returns the addendum, or null when there is none in force.
 */
function addendumOf(
  id: string | null,
  input: HistoryInput,
): { name: string; body: string } | null {
  if (id === null) return null

  const name = input.addendaFiles.find((file) => file.startsWith(id))
  if (name === undefined) return null

  const body = input.addendaBodies[name] ?? ''
  return SUPERSEDED.test(body) ? null : { name, body }
}

/**
 * The one-line summary, in the three steps of D-18.
 *
 * First the summary section of the addendum, then the executive summary of the
 * feature's own `requirements.md`, and then nothing: the panel shows the short
 * name rather than inventing a line, because a summary the panel wrote itself
 * would be the panel making up content.
 *
 * Both sources are read as a PARAGRAPH and cut at the first sentence, and the
 * paragraph is what makes the cut honest. REVERSA hard-wraps its prose at the
 * column, so the first physical line of a summary ends wherever the wrap fell:
 * reading it alone produced lines like "As features 001 a" on the screen. The
 * wrap is typography, not punctuation, and the sentence is what a person means
 * by one line.
 * @param addendum - the body of the addendum in force, or null.
 * @param requirements - the `requirements.md` of the folder, or null.
 * @returns the line, or null when neither source had one.
 */
function summaryOf(addendum: string | null, requirements: string | null): string | null {
  const first = summarySection(addendum)
  if (first !== null) return firstSentence(firstParagraph(first) ?? '')

  const second = summarySection(requirements)
  return second === null ? null : firstSentence(firstParagraph(second) ?? '')
}

/**
 * The text of the first section whose heading names a summary.
 * @param md - the document, or null.
 * @returns the section text, or null when there is no such heading.
 */
function summarySection(md: string | null): string | null {
  if (md === null) return null
  for (const [heading, text] of Object.entries(splitSections(md))) {
    if (heading !== '' && SUMMARY_HEADING.test(heading)) return text
  }
  return null
}

/**
 * The first stretch of prose, with the hard wrap undone: consecutive non-empty
 * lines joined by a space, up to the first blank one.
 * @param text - the section.
 * @returns the paragraph, or null when the section has no content.
 */
function firstParagraph(text: string): string | null {
  const lines: string[] = []

  for (const line of text.split('\n')) {
    const trimmed = line.trim()
    if (trimmed === '') {
      if (lines.length > 0) break
      continue
    }
    lines.push(trimmed)
  }
  return lines.length === 0 ? null : lines.join(' ')
}

/** The first sentence of a line, or the whole line when it ends without one. */
function firstSentence(line: string): string | null {
  if (line === '') return null
  const sentence = /^(.*?[.!?])(?:\s|$)/.exec(line)
  return sentence === null ? line : (sentence[1] ?? line)
}

/**
 * The most recent instant of the trail, in the absolute form it was written.
 * @param jsonl - the trail of the folder, or null when it has none.
 * @returns the instant, or null when no event recorded one.
 */
function lastEventOf(jsonl: string | null): string | null {
  if (jsonl === null) return null

  let latest: string | null = null
  for (const event of ProgressContract.read(jsonl).events) {
    if (event.ts === null) continue
    if (latest === null || event.ts > latest) latest = event.ts
  }
  return latest
}

/** A declared path, comparable: no leading `./`, no trailing separator. */
function normalize(path: string | null): string {
  if (typeof path !== 'string') return ''
  return path.trim().replace(/^\.\//, '').replace(/\/+$/, '')
}
