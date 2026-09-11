/**
 * The origin of the project: how it was born by `/reversa-new`, and where the
 * pipeline stands (RF-10, RF-13, RF-14, RF-15, RF-24, RN-08, RN-13, D-20).
 *
 * The four steps are drawn ALWAYS, in the canonical order, even for a project
 * that never ran the pipeline: the card shows where the pipeline would be, and
 * not only where it is. The state of each step is a WORD, never only a colour,
 * which is the half of the accessibility requirement the markup can carry.
 *
 * The stage goes in the title, so that nothing is lost by keeping the card
 * collapsed, which is how it starts (RF-14).
 *
 * The place of the brainstorm is reserved and empty, with an attribute of its
 * own, so that adding it later is an addition and not a displacement (RN-13).
 * @module webview/ui/OriginSection
 */

import type { ReactNode } from 'react'
import type { GreenfieldAxis } from '../../domain/types.ts'
import { brasiliaInstant } from '../domain/instants.ts'
import {
  greenfieldModeLabel,
  greenfieldStageLabel,
  originStepLabel,
  scenarioLabel,
  stepStatusLabel,
} from '../domain/labels.ts'
import { originSteps, pipelineStarted } from '../domain/origin-view.ts'
import { CollapsibleSection } from './CollapsibleSection.tsx'
import { OpenFile } from './OpenFile.tsx'

/** What the section draws. */
export interface OriginSectionProps {
  /** Absent when the host is older than the field (contract, section 6). */
  greenfield: GreenfieldAxis | undefined
  collapsed: boolean
  onToggle: () => void
  onOpenFile: (path: string) => void
}

/** What the metadata says about when, or that it does not say. */
function Moment(props: { part: string; instant: string | null }): ReactNode {
  const moment = brasiliaInstant(props.instant)
  return (
    <dd data-part={props.part} data-instant={props.instant ?? undefined}>
      {props.instant === null ? 'momento não registrado' : moment.text}
    </dd>
  )
}

/** The lines of the metadata and the summary, for a pipeline that started. */
function Started(props: { axis: GreenfieldAxis; open: (path: string) => void }): ReactNode {
  const { axis, open } = props
  const meta = axis.metadado
  const mode = meta?.modo == null ? null : greenfieldModeLabel(meta.modo)

  return (
    <dl className="pairs">
      <dt>Modo</dt>
      <dd data-part="origin-mode" data-known={String(mode?.known ?? false)}>
        {mode === null
          ? 'modo não registrado'
          : mode.known
            ? mode.text
            : `${mode.raw} (não reconhecido)`}
      </dd>
      <dt>Ideia</dt>
      <dd data-part="origin-brief">
        {axis.resumo ?? 'resumo não lido'}
        {axis.caminhos.brief === null ? null : (
          <>
            {' '}
            <OpenFile path={axis.caminhos.brief} onOpenFile={open}>
              brief
            </OpenFile>
          </>
        )}
      </dd>
      <dt>Início</dt>
      <Moment part="origin-started" instant={meta?.iniciadoEm ?? null} />
      <dt>Último checkpoint</dt>
      <Moment part="origin-checkpoint" instant={meta?.ultimoCheckpointEm ?? null} />
      <dt>Agentes concluídos</dt>
      <dd data-part="origin-completed">
        {meta === null || meta.concluidos.length === 0
          ? 'nenhum registrado'
          : meta.concluidos.join(', ')}
      </dd>
    </dl>
  )
}

/**
 * The origin section.
 * @param props - the axis, the collapse state, the toggle and the open port.
 * @returns the section element.
 */
export function OriginSection(props: OriginSectionProps): ReactNode {
  const { greenfield: axis, onOpenFile: open } = props
  const started = axis !== undefined && pipelineStarted(axis)
  const title = 'Origem do projeto'

  return (
    <CollapsibleSection
      name="origem"
      title={started ? `${title} · ${greenfieldStageLabel(axis.estagio).text}` : title}
      collapsed={props.collapsed}
      onToggle={props.onToggle}
    >
      {axis === undefined ? (
        <p data-part="origin-unread" className="empty">
          O registro da origem não foi lido por esta leitura.
        </p>
      ) : (
        <>
          <p data-part="origin-scenario" data-scenario={axis.cenario}>
            {scenarioLabel(axis.cenario).text}
          </p>
          {started ? (
            <Started axis={axis} open={open} />
          ) : (
            <p data-part="origin-absent" className="empty">
              Este projeto não nasceu por /reversa-new.
            </p>
          )}
          <ul className="rows">
            {originSteps(axis).map((step) => (
              <li data-step={step.etapa} data-status={step.status} key={step.etapa}>
                {originStepLabel(step.etapa).text}{' '}
                <span data-part="step-status" className="status" data-status={step.status}>
                  {stepStatusLabel(step.status).text}
                </span>
                {step.artefato === null ? null : (
                  <div data-part="step-artifact">
                    <OpenFile path={step.artefato} onOpenFile={open} />
                  </div>
                )}
              </li>
            ))}
          </ul>
          <div data-part="origin-brainstorm" data-reserved="brainstorm"></div>
        </>
      )}
    </CollapsibleSection>
  )
}
