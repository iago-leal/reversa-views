/**
 * The one place the host consumes the reading layer of feature 001 (RF-13,
 * RF-14, RF-15, RF-16).
 *
 * It calls the probe and then the domain, names the entry state from the
 * `installed` field, and stamps the moment of the reading. It deliberately
 * does NOT know where Reversa keeps a file, how a stage is derived or what a
 * phase is: replicating any of that here would be two rules where there is
 * one, and the inherited layer already owns it.
 *
 * Every exception dies here, with its stack in the log and the `error` state
 * as the result: a panel that shows a named failure beats a host that throws
 * into the editor.
 * @module host/reading
 */

import { readReversa } from '../heranca/reversa-domain/src/index.ts'
import type { ReversaProcess, ReversaSnapshot } from '../heranca/reversa-domain/src/index.ts'
import { readReversaSnapshot } from '../heranca/reversa-probe/src/index.ts'
import type { ProbeReport, ProbeResult } from '../heranca/reversa-probe/src/snapshot.ts'
import { readDecomposition } from '../domain/decomposition.ts'
import { readHistory } from '../domain/history.ts'
import type { ActiveDecomposition, ProjectHistory } from '../domain/types.ts'
import { readFeatureFolders } from '../probe/features.ts'
import type { FeatureFoldersRead } from '../probe/features.ts'
import { logLine } from './ports.ts'
import type { LogPort } from './ports.ts'
import type { LoadedEntryKind } from './protocol.ts'

const ORIGIN = 'reading'

/** What the reading needs from outside; the three readers default to the real ones. */
export interface ReadingDeps {
  log: LogPort
  /** The probe of feature 001; overridden by a double in the tests (RF-20). */
  readSnapshot?: (root: string) => ProbeResult
  /** The domain of feature 001; overridden by a double in the tests. */
  readProcess?: (snapshot: ReversaSnapshot) => ReversaProcess
  /** The local probe of feature 006, which walks the other feature folders. */
  readFolders?: (root: string, forwardFolder: string) => FeatureFoldersRead
  /** Where the moment of the reading comes from. */
  clock?: () => Date
}

/** A reading that worked, or the failure that was captured instead. */
export type ReadingResult =
  | {
      kind: 'loaded'
      entry: LoadedEntryKind
      process: ReversaProcess
      probe: ProbeReport
      readAt: string
      /** The actions of the active feature (feature 006). */
      decomposition: ActiveDecomposition
      /** Every feature folder of the project (feature 006). */
      history: ProjectHistory
    }
  | { kind: 'error'; message: string }

/**
 * Read one workspace root and shape it into the payload the panel draws.
 * @param root - the absolute root to observe.
 * @param deps - the log port, plus the readers and clock the tests replace.
 * @returns the loaded payload, or the named error; never throws.
 */
export function readWorkspace(root: string, deps: ReadingDeps): ReadingResult {
  const readSnapshot = deps.readSnapshot ?? readReversaSnapshot
  const readProcess = deps.readProcess ?? readReversa
  const readFolders =
    deps.readFolders ??
    ((where: string, forwardFolder: string) => readFeatureFolders({ root: where, forwardFolder }))
  const clock = deps.clock ?? (() => new Date())

  try {
    const { snapshot, report } = readSnapshot(root)
    const process = readProcess(snapshot)

    // The local branch runs beside the inherited one and knows as little as it
    // does: where the folders are comes from the process itself, so no layout
    // of REVERSA is written here (RF-14). It sits INSIDE the same try, because
    // a walk of the disk that throws must still become the named error state.
    const folders = readFolders(root, process.discovery.forwardFolder)
    const history = readHistory({
      pastas: folders.pastas,
      truncado: folders.truncado,
      total: folders.total,
      activeFeatureDir: process.forward.featureDir,
      pausedFeatureDirs: process.forward.pausedFeatures
        .map((feature) => feature.featureDir)
        .filter((path): path is string => path !== null),
      addendaFiles: snapshot.addendaFiles,
      addendaBodies: snapshot.addendaBodies,
      outputFolder: process.discovery.outputFolder,
    })

    return {
      kind: 'loaded',
      entry: process.installed ? 'installed' : 'no-reversa',
      process,
      probe: report,
      readAt: clock().toISOString(),
      decomposition: readDecomposition(snapshot.actionsMd, process.forward.actions.total),
      history,
    }
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : String(cause)
    const stack = cause instanceof Error && cause.stack !== undefined ? cause.stack : message
    deps.log.write(logLine(ORIGIN, 'leitura lançou', `${root}: ${stack}`))
    return { kind: 'error', message }
  }
}
