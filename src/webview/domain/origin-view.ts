/**
 * The four steps of the origin and the agent that comes next (RF-10, RF-16,
 * RN-11, D-17, D-20).
 *
 * Pure functions over the axis. The steps are ALWAYS four, in the canonical
 * order, whatever the project: the card shows where the pipeline would be, not
 * only where it is. The state of each is decided here, once, so that the card
 * and the blocking band read the same fact.
 *
 * SHARED PRESENTATION, since feature 014. This module used to serve the panel
 * alone; it now serves TWO surfaces -- the webview and the terminal tool of
 * `src/cli/` -- and it did not move for that. Moving the folder would have
 * touched every component, every suite and every delivered addendum without
 * changing one line of behaviour (D-14), so the change of status is declared
 * here and pinned by a suite: `tests/cli-boundaries.spec.ts` forbids a new
 * presentation rule from being born in `src/cli/quadro/`, and
 * `tests/cli-paridade.spec.tsx` compares what the two surfaces affirm over the
 * same payload. Drawing is what differs between them; deciding is not.
 * @module webview/domain/origin-view
 */

import type { GreenfieldAxis, GreenfieldStage } from '../../domain/types.ts'

/** The four steps, by the artifact each one leaves. */
export const ORIGIN_STEPS = ['ideacao', 'pesquisa', 'redacao', 'especificacao'] as const

/** One of the four. */
export type OriginStep = (typeof ORIGIN_STEPS)[number]

/** The three states a step can be in. */
export type StepStatus = 'done' | 'current' | 'pending'

/** One step of the origin, as the card draws it. */
export interface OriginStepView {
  etapa: OriginStep
  status: StepStatus
  /** The artifact the step left, relative to the root; null while it has not. */
  artefato: string | null
}

/**
 * The agent that has to run next at each physical stage, or null when the
 * pipeline is done (RN-11, D-17). The stage `redigido` maps to `spec-sdd`,
 * which is what RF-16 asks for a PRD without specs.
 */
const NEXT_AGENT: Record<GreenfieldStage, string | null> = {
  ausente: 'ideator',
  aberto: 'ideator',
  ideado: 'researcher',
  pesquisado: 'drafter',
  redigido: 'spec-sdd',
  especificado: null,
}

/**
 * Whether the pipeline has started at all: an artifact on disk, a metadata
 * field in the pointer, or a stage past absent.
 * @param axis - the axis as the reading produced it.
 * @returns true once anything of `/reversa-new` exists.
 */
export function pipelineStarted(axis: GreenfieldAxis): boolean {
  return axis.artefatos.brief || axis.metadado !== null || axis.estagio !== 'ausente'
}

/**
 * The agent that comes next, or null when nothing is missing.
 * @param estagio - the physical stage.
 * @returns the agent name, as `/reversa-<agent>` spells it.
 */
export function nextAgent(estagio: GreenfieldStage): string | null {
  return NEXT_AGENT[estagio] ?? null
}

/**
 * The last artifact the pipeline left, which is what the band opens.
 * @param axis - the axis.
 * @returns the path relative to the root, or null when nothing was left.
 */
export function lastArtifact(axis: GreenfieldAxis): string | null {
  const { caminhos } = axis
  return caminhos.prd ?? caminhos.personas ?? caminhos.ideacao ?? caminhos.brief ?? null
}

/**
 * The four steps with their state (RF-10).
 *
 * A step is DONE when its artifact is present. Among the rest, the first one
 * after the leading run of done steps is CURRENT when the pipeline has
 * started, and every later one is PENDING. A project that never ran
 * `/reversa-new` has four pending steps and no current one: there is nothing
 * in progress to point at.
 * @param axis - the axis.
 * @returns the four steps, in the canonical order.
 */
export function originSteps(axis: GreenfieldAxis): OriginStepView[] {
  const { artefatos: a, caminhos: c } = axis
  const steps: Array<[OriginStep, boolean, string | null]> = [
    ['ideacao', a.ideacao, c.ideacao],
    ['pesquisa', a.personas, c.personas],
    ['redacao', a.prd, c.prd],
    ['especificacao', a.specs > 0, null],
  ]
  let current = pipelineStarted(axis)
  return steps.map(([etapa, present, artefato]) => {
    let status: StepStatus = 'pending'
    if (present) status = 'done'
    else if (current) status = 'current'
    if (!present) current = false
    return { etapa, status, artefato }
  })
}
