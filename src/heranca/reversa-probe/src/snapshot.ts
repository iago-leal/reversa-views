/* HERDADO: não editar sem declarar a adaptação em src/heranca/PROCEDENCIA.md
 * origem:      scrum-harness (https://github.com/iago-leal/scrum-harness)
 * caminho:     packages/reversa-probe/src/snapshot.ts
 * revisão:     420305daa6cdd10858b720a34cb8db67d8e5c5e9 (2026-09-08)
 * copiado em:  2026-09-09
 * adaptações:  A1
 */
/**
 * Assembling the snapshot the Model judges (comp-74 R1, R3, R4, R7, R10).
 *
 * REVERSA's layout has a genuine circularity: `readReversa` needs the
 * feature-dir listing, but the path to list lives inside
 * `active-requirements.json`, which only `readReversa` interprets. The probe
 * breaks it by parsing JUST the two pointer keys itself — `feature-dir` and
 * `session-dir`, both kebab-case — and leaving every judgement to the Model.
 * That is a deliberate, minimal parse, not a second implementation of the
 * contract.
 *
 * The folders are never hard-coded: `StateContract` resolves
 * `output_folder`/`forward_folder` (snake_case on the wire) and supplies the
 * framework defaults, so a workspace with a custom output folder is followed
 * automatically.
 * @module @scrum-harness/reversa-probe/snapshot
 */

import { join } from 'node:path'
import { EMPTY_SNAPSHOT, StateContract, asRecord, asString, parseJsonSafe } from '../../reversa-domain/src/index.ts'
import type { ReversaSnapshot } from '../../reversa-domain/src/index.ts'
import { listNames, readText, REVERSA_FILE_CAP, resolveInside } from './files.ts'

/** The most addenda read in one pass, in name order. */
export const REVERSA_ADDENDA_CAP = 50

/** A path REVERSA declared that the probe refused to read, and why. */
export interface Refusal {
  path: string
  reason: 'fora-da-raiz'
}

/** What the probe actually did, beside what the Model concluded (R10). */
export interface ProbeReport {
  workspace: string
  /** The feature-dir actually read; null when absent or refused. */
  featureDir: string | null
  /** The ideation session-dir actually read; null when absent or refused. */
  sessionDir: string | null
  refusals: Refusal[]
  /** Paths not fully read because a cap was hit. */
  truncated: string[]
}

/** The snapshot plus the probe's own account of the reading. */
export interface ProbeResult {
  snapshot: ReversaSnapshot
  report: ProbeReport
}

/**
 * Read a REVERSA installation from disk (R1, R3).
 * @param root - the absolute workspace root.
 * @returns the snapshot for the Model and the report for the View.
 */
export function readReversaSnapshot(root: string): ProbeResult {
  const refusals: Refusal[] = []
  const truncated: string[] = []

  // Pass 1 — the four files whose path is fixed.
  const stateJson = readText(join(root, '.reversa/state.json'))
  const configJson = readText(join(root, '.reversa/reversa-config.json'))
  const activeRequirementsJson = readText(join(root, '.reversa/active-requirements.json'))
  const activeIdeationJson = readText(join(root, '.reversa/active-ideation.json'))

  // Pass 2 — the folders, resolved by the Model (defaults included).
  const discovery = StateContract.read(stateJson)
  const output = discovery.outputFolder

  // Pass 3 — everything that hangs off a pointer REVERSA wrote.
  const featureDir = pointer(activeRequirementsJson, 'feature-dir')
  const sessionDir = pointer(activeIdeationJson, 'session-dir')

  const featureAbs = resolvePointer(root, featureDir, refusals)
  const sessionAbs = resolvePointer(root, sessionDir, refusals)

  const featureDirFiles = featureAbs === null ? null : listNames(featureAbs)
  const ideationDirFiles = sessionAbs === null ? null : listNames(sessionAbs)

  const body = (name: string): string | null =>
    featureAbs === null ? null : readText(join(featureAbs, name))

  const addendaAbs = join(root, output, 'addenda')
  const { files: addendaFiles, bodies: addendaBodies } = readAddenda(addendaAbs, truncated)

  const snapshot: ReversaSnapshot = {
    ...EMPTY_SNAPSHOT,
    stateJson,
    configJson,
    activeRequirementsJson,
    activeIdeationJson,
    featureDirFiles,
    ideationDirFiles,
    actionsMd: body('actions.md'),
    requirementsMd: body('requirements.md'),
    progressJsonl: body('progress.jsonl'),
    legacyImpactMd: body('legacy-impact.md'),
    regressionWatchMd: body('regression-watch.md'),
    migrationStateJson: readText(join(root, output, 'migration', '.state.json')),
    addendaFiles,
    addendaBodies,
  }

  return {
    snapshot,
    report: {
      workspace: root,
      featureDir: featureDirFiles === null ? null : featureDir,
      sessionDir: ideationDirFiles === null ? null : sessionDir,
      refusals,
      truncated,
    },
  }
}

/**
 * Pull one path key out of a REVERSA pointer file. The keys are kebab-case;
 * reading them as camelCase yields null on every real file.
 */
function pointer(json: string | null, key: string): string | null {
  const record = asRecord(parseJsonSafe(json).value)
  return record === null ? null : asString(record[key])
}

/** Resolve a declared pointer, recording a refusal when it escapes the root. */
function resolvePointer(root: string, declared: string | null, refusals: Refusal[]): string | null {
  if (declared === null) return null
  const abs = resolveInside(root, declared)
  if (abs === null) {
    refusals.push({ path: declared, reason: 'fora-da-raiz' })
    return null
  }
  return abs
}

/** Read the addenda folder up to the caps, reporting what was left out (R7). */
function readAddenda(abs: string, truncated: string[]): { files: string[]; bodies: Record<string, string> } {
  const names = listNames(abs)
  if (names === null) return { files: [], bodies: {} }

  const files = names.slice(0, REVERSA_ADDENDA_CAP)
  if (names.length > files.length) {
    truncated.push(`${abs} (${names.length} arquivos, teto ${REVERSA_ADDENDA_CAP})`)
  }

  const bodies: Record<string, string> = {}
  for (const name of files) {
    const text = readText(join(abs, name), REVERSA_FILE_CAP)
    if (text === null) truncated.push(join(abs, name))
    else bodies[name] = text
  }
  return { files, bodies }
}
