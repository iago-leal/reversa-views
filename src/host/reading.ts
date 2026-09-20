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
import { readBugs } from '../domain/bugs.ts'
import { readDecomposition } from '../domain/decomposition.ts'
import { readDeliveryLinks } from '../domain/delivery-link.ts'
import type { DeliveryLinks } from '../domain/delivery-link.ts'
import { readDiscoveryState } from '../domain/discovery-state.ts'
import { MAPA_DE_EQUIVALENCIAS } from '../domain/equivalencias.ts'
import { readGreenfield } from '../domain/greenfield.ts'
import { readHistory } from '../domain/history.ts'
import type {
  ActiveDecomposition,
  BugRegistry,
  DiscoveryStateAxis,
  GreenfieldAxis,
  MapaDeEquivalencias,
  ProjectHistory,
} from '../domain/types.ts'
import { readBugFolders } from '../probe/bugs.ts'
import type { BugsRead } from '../probe/bugs.ts'
import { readFeatureFolders } from '../probe/features.ts'
import type { FeatureFolderRead, FeatureFoldersRead } from '../probe/features.ts'
import { readGreenfieldArtifacts } from '../probe/greenfield.ts'
import type { GreenfieldRead } from '../probe/greenfield.ts'
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
  /** The local probe of feature 008, which walks the bug registry. */
  readBugsFolders?: (root: string) => BugsRead
  /** The local probe of feature 009, which looks at the artifacts of the output folder. */
  readGreenfieldFolder?: (root: string, outputFolder: string) => GreenfieldRead
  /** The judgement of feature 010, which extracts the link each folder declares. */
  readLinks?: (pastas: FeatureFolderRead[]) => DeliveryLinks
  /** The judgement of feature 011, over the raw state file and the inherited anomalies. */
  readDiscovery?: typeof readDiscoveryState
  /** The approved map of feature 012; the real one when the caller says nothing. */
  equivalencias?: MapaDeEquivalencias
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
      /** The bug registry of the project (feature 008). */
      bugs: BugRegistry
      /** The greenfield axis of the project (feature 009). */
      greenfield: GreenfieldAxis
      /** The discovery state of the project (feature 011). */
      discoveryState: DiscoveryStateAxis
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
  const readBugsFolders =
    deps.readBugsFolders ?? ((where: string) => readBugFolders({ root: where }))
  const readGreenfieldFolder =
    deps.readGreenfieldFolder ??
    ((where: string, outputFolder: string) => readGreenfieldArtifacts({ root: where, outputFolder }))
  const readLinks = deps.readLinks ?? readDeliveryLinks
  const readDiscovery = deps.readDiscovery ?? readDiscoveryState
  const clock = deps.clock ?? (() => new Date())

  try {
    const { snapshot, report } = readSnapshot(root)
    const process = readProcess(snapshot)

    // The local branch runs beside the inherited one and knows as little as it
    // does: where the folders are comes from the process itself, so no layout
    // of REVERSA is written here (RF-14). It sits INSIDE the same try, because
    // a walk of the disk that throws must still become the named error state.
    const folders = readFolders(root, process.discovery.forwardFolder)
    // The link each folder declares is extracted ONCE, and the same result
    // serves the history (its state) and the panorama (its cells): two
    // extractions would be two authorities over one fact (feature 010, D-05).
    // Which file holds it is the probe's business, and nothing of the layout
    // is written here. Same try, same reason as every other branch.
    const vinculos = readLinks(folders.pastas)
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
      vinculos,
    })

    // The registry branch runs beside the other two and knows as little as they
    // do: where the registry lives is a literal of the local code, and nothing
    // of REVERSA's layout is written here. It sits INSIDE the same try, and for
    // the same reason: a walk of the disk that throws must become the named
    // error state and never an exception in the editor.
    const bugs = readBugs(readBugsFolders(root))

    // The greenfield axis runs after the history because it CROSSES it: which
    // spec has a folder is decided over the judged entries, and judging them
    // twice would be two authorities over one fact (feature 009). Where the
    // output folder is comes from the process, the raw pointer comes from the
    // snapshot, and no layout of REVERSA is written here. Same try, same
    // reason as the other branches.
    const greenfield = readGreenfield({
      lido: readGreenfieldFolder(root, process.discovery.outputFolder),
      stateJson: snapshot.stateJson,
      history,
      outputFolder: process.discovery.outputFolder,
      vinculos,
    })

    // The discovery-state axis of feature 011 runs last among the local
    // branches, and is the only one that reads what the INHERITED branch
    // produced: the anomalies it absorbs are the ones `derivePhases` recorded,
    // and matching them needs both the raw phase and the anomaly. Nothing is
    // removed from `process` here -- what comes back is the IDENTITY of what
    // the panel then declines to draw, because deciding what the screen shows
    // belongs to the panel (NG-03). Same try, same reason as every other
    // branch.
    // Feature 012 hands the same branch a third input: the map a person
    // approved. It is a compiled-in constant, never read from disk at run
    // time, which is what keeps NG-04 intact and the reading under the 200 ms
    // of RNF-01. Empty map, and this is exactly the reading of feature 011.
    const discoveryState = readDiscovery({
      stateJson: snapshot.stateJson,
      anomalias: process.anomalies,
      equivalencias: deps.equivalencias ?? MAPA_DE_EQUIVALENCIAS,
    })

    // The trail of the reading includes what the map decided, so that a
    // conclusion shown on screen can be traced without opening the map: the
    // probe report already records what was read, refused and truncated, and
    // this is the same kind of record for what was recognised (RF-07 of the
    // reading spec).
    const reconhecidos = discoveryState.checkpoints.filter((c) => c.reconhecidoPor !== null).length
    if (reconhecidos > 0 || discoveryState.registrosNaoAgentes.length > 0) {
      deps.log.write(
        logLine(
          ORIGIN,
          'equivalências aplicadas',
          `${root}: ${reconhecidos} checkpoint(s) reconhecido(s) por par aprovado, ` +
            `${discoveryState.registrosNaoAgentes.length} entrada(s) fora da contagem`,
        ),
      )
    }

    return {
      kind: 'loaded',
      entry: process.installed ? 'installed' : 'no-reversa',
      process,
      probe: report,
      readAt: clock().toISOString(),
      decomposition: readDecomposition(snapshot.actionsMd, process.forward.actions.total),
      history,
      bugs,
      greenfield,
      discoveryState,
    }
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : String(cause)
    const stack = cause instanceof Error && cause.stack !== undefined ? cause.stack : message
    deps.log.write(logLine(ORIGIN, 'leitura lançou', `${root}: ${stack}`))
    return { kind: 'error', message }
  }
}
