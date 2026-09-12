/* HERDADO: não editar sem declarar a adaptação em src/heranca/PROCEDENCIA.md
 * origem:      scrum-harness (https://github.com/iago-leal/scrum-harness)
 * caminho:     packages/reversa-domain/src/index.ts
 * revisão:     420305daa6cdd10858b720a34cb8db67d8e5c5e9 (2026-09-08)
 * copiado em:  2026-09-09
 * adaptações:  A7
 */
/**
 * Read-only domain for the REVERSA framework (v0.29, comp-72).
 *
 * REVERSA (github.com/sandeco/reversa) turns a legacy system into
 * executable specifications by coordinating ~72 markdown agents through a
 * coding agent. It has no runtime of its own: the entire observable process
 * lives in files it leaves on disk, and its only interface today is
 * `reversa status` — 34 lines of `console.log`. This package is the Model
 * that lets a visual panel show that process honestly.
 *
 * Two things it deliberately does NOT do. It never writes: REVERSA's safety
 * story rests on writes being confined to its own folders, and
 * `.reversa/reversa-config.json` is the user's act alone, so the core does
 * not even import `node:fs` (R12) — a probe reads, this domain judges, as
 * `@scrum-harness/probe` and `@scrum-harness/domain` already do. And it
 * never idealises: where REVERSA behaves oddly, the reader reproduces the
 * behaviour, because a panel that predicts something other than what the
 * framework will do is worse than no panel.
 * @module @scrum-harness/reversa-domain
 */

import { ForwardContract } from './forward.ts'
import type { ForwardInput, ForwardState } from './forward.ts'
import { PolicyContract, writableFolders } from './policy.ts'
import { ProgressContract } from './progress.ts'
import type { ProgressTrail } from './progress.ts'
import { StateContract } from './state.ts'
import type { DiscoveryState } from './state.ts'
import { ImpactContract } from './impact.ts'
import type { ImpactState } from './impact.ts'
import { WatchContract } from './watch.ts'
import type { WatchState } from './watch.ts'
import { MigrationContract } from './migration.ts'
import type { MigrationState } from './migration.ts'
import { IdeationContract } from './ideation.ts'
import type { IdeationState } from './ideation.ts'
import { AnomalyLog } from './anomaly.ts'
import type { Anomaly } from './anomaly.ts'

export { AnomalyLog } from './anomaly.ts'
export type { Anomaly, AnomalyCode } from './anomaly.ts'
export { asFolder, asRecord, asString, asStringList, parseJsonSafe, stripBom } from './json.ts'
export type { JsonRead } from './json.ts'
export { globToRegex, isValidPattern } from './glob.ts'
export { CONFIG_PATH, PolicyContract, writableFolders } from './policy.ts'
export type { FolderSources, Outcome, PolicyConfig, Verdict, VerdictReason } from './policy.ts'
export { PHASES, StateContract } from './state.ts'
export type { Checkpoint, DiscoveryState, Phase, PhaseName, PhaseStatus } from './state.ts'
export { countDoubts, scanActions } from './actions.ts'
export type { ActionsScan } from './actions.ts'
export { ACTIVE_REQUIREMENTS_FILE, ForwardContract } from './forward.ts'
export type { ForwardInput, ForwardState, PausedFeature, Stage } from './forward.ts'
export { ProgressContract } from './progress.ts'
export type { ActionProgress, ProgressEvent, ProgressTrail } from './progress.ts'
export { cellsOf, findTable, normalizeCell, splitSections } from './table.ts'
export { IMPACT_TYPES, ImpactContract, SEVERITIES } from './impact.ts'
export type { ImpactState, ImpactedFile, Scenario, Tally } from './impact.ts'
export { VERIFICATION_TYPES, WatchContract } from './watch.ts'
export type { WatchItem, WatchState } from './watch.ts'
export { MIGRATION_AGENTS, MigrationContract } from './migration.ts'
export type { AgentStatus, CurrentAgent, MigrationState, QueuedAgent } from './migration.ts'
export { IdeationContract } from './ideation.ts'
export type { IdeationStage, IdeationState } from './ideation.ts'

/** Everything a probe read from a REVERSA installation. */
export interface ReversaSnapshot {
  stateJson: string | null
  configJson: string | null
  activeRequirementsJson: string | null
  featureDirFiles: string[] | null
  actionsMd: string | null
  requirementsMd: string | null
  progressJsonl: string | null
  addendaFiles: string[]
  addendaBodies: Record<string, string>
  // The impact, migration and ideation axes (comp-73).
  legacyImpactMd: string | null
  regressionWatchMd: string | null
  migrationStateJson: string | null
  activeIdeationJson: string | null
  ideationDirFiles: string[] | null
}

/** The whole observable REVERSA process, ready for a View. */
export interface ReversaProcess {
  installed: boolean
  discovery: DiscoveryState
  policy: PolicyContract
  writableFolders: string[]
  forward: ForwardState
  progress: ProgressTrail
  impact: ImpactState
  watch: WatchState
  migration: MigrationState
  ideation: IdeationState
  /** Where the probe should look for the migration state, resolved from the state file. */
  migrationStatePath: string
  anomalies: Anomaly[]
}

/** An empty snapshot, for a workspace where REVERSA is not installed. */
export const EMPTY_SNAPSHOT: ReversaSnapshot = {
  stateJson: null,
  configJson: null,
  activeRequirementsJson: null,
  featureDirFiles: null,
  actionsMd: null,
  requirementsMd: null,
  progressJsonl: null,
  addendaFiles: [],
  addendaBodies: {},
  legacyImpactMd: null,
  regressionWatchMd: null,
  migrationStateJson: null,
  activeIdeationJson: null,
  ideationDirFiles: null,
}

/**
 * Compose the four contracts into the process a panel renders.
 * @param snapshot - the files a probe read; every field may be null.
 * @returns the typed process, plus every anomaly met on the way.
 */
export function readReversa(snapshot: ReversaSnapshot): ReversaProcess {
  const log = new AnomalyLog()

  const discovery = StateContract.read(snapshot.stateJson)
  log.addAll(discovery.anomalies)

  const folders = writableFolders({
    outputFolder: discovery.outputFolder,
    forwardFolder: discovery.forwardFolder,
  })
  const policy = PolicyContract.read(snapshot.configJson, folders)
  if (policy.cause !== null) log.add('.reversa/reversa-config.json', policy.cause)

  const forwardInput: ForwardInput = {
    activeRequirementsJson: snapshot.activeRequirementsJson,
    featureDirFiles: snapshot.featureDirFiles,
    actionsMd: snapshot.actionsMd,
    requirementsMd: snapshot.requirementsMd,
    addendaFiles: snapshot.addendaFiles,
    addendaBodies: snapshot.addendaBodies,
    outputFolder: discovery.outputFolder,
  }
  const forward = ForwardContract.read(forwardInput)
  log.addAll(forward.anomalies)

  const progress = ProgressContract.read(snapshot.progressJsonl)
  log.addAll(progress.anomalies)

  const impact = ImpactContract.read(snapshot.legacyImpactMd)
  log.addAll(impact.anomalies)

  const watch = WatchContract.read(snapshot.regressionWatchMd)
  log.addAll(watch.anomalies)

  const migration = MigrationContract.read(snapshot.migrationStateJson)
  log.addAll(migration.anomalies)

  const ideation = IdeationContract.read(snapshot.activeIdeationJson, snapshot.ideationDirFiles)
  log.addAll(ideation.anomalies)

  return {
    installed: snapshot.stateJson !== null,
    discovery,
    policy,
    writableFolders: folders,
    impact,
    watch,
    migration,
    ideation,
    // `reversa-migrate` hard-codes `_reversa_sdd/`, but `step-02-resume`
    // resolves the folder; the resolving form is the one that composes.
    migrationStatePath: `${discovery.outputFolder}/migration/.state.json`,
    forward,
    progress,
    anomalies: log.list(),
  }
}
