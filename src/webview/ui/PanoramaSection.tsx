/**
 * The panorama of the product: what the specs planned, crossed with what the
 * forward cycle delivered (RF-11, RF-12, RF-13, RF-15, RN-05, RN-07, RN-08,
 * D-15, D-16).
 *
 * The card draws what `panoramaView()` decides and decides nothing of its
 * own: the order, the grouping and the checked count all arrive ready. What
 * is left to the component is the three empty states of RN-08, and they are
 * three SENTENCES rather than one empty block: the field the host did not
 * send, the project that was not born by `/reversa-new`, and the `sdd/`
 * folder still waiting for the decomposition.
 *
 * The spec and the addendum are clickable, by the same message the rest of
 * the panel uses. The folder is not: it is a directory, and the editor opens
 * documents.
 *
 * The scope of the PRD lives INSIDE this card, and starts folded (D-16): it is
 * what was promised, in the words of the PRD, and it is read against the
 * components above it. Whether it is revealed is state of the panel and not
 * a stored preference, as for the bug groups of feature 008.
 * @module webview/ui/PanoramaSection
 */

import type { ReactNode } from 'react'
import type { GreenfieldAxis, PlannedComponent, UnplannedFeature } from '../../domain/types.ts'
import { componentSituationLabel, markLabel, situationLabel } from '../domain/labels.ts'
import { pipelineStarted } from '../domain/origin-view.ts'
import { panoramaView } from '../domain/panorama-view.ts'
import { CollapsibleSection } from './CollapsibleSection.tsx'
import { OpenFile } from './OpenFile.tsx'
import { ProgressBar } from './ProgressBar.tsx'

/** What the section draws. */
export interface PanoramaSectionProps {
  /** Absent when the host is older than the field (contract, section 6). */
  greenfield: GreenfieldAxis | undefined
  collapsed: boolean
  onToggle: () => void
  onOpenFile: (path: string) => void
  /** Whether the scope of the PRD is unfolded; owned upstream. */
  scopeRevealed: boolean
  onRevealScope: () => void
}

type Open = (path: string) => void

/** The situation and the mark of a row, as two words; the mark only when there is one. */
function Words(props: { part: string; situation: string; marca: string }): ReactNode {
  const mark = markLabel(props.marca)
  return (
    <>
      {' '}
      <span data-part={`${props.part}-situation`} className="status">
        {props.situation}
      </span>
      {mark.text === '' ? null : (
        <>
          {' '}
          <span data-part={`${props.part}-mark`} className="status">
            {mark.text}
          </span>
        </>
      )}
    </>
  )
}

/** A heading inside the card. */
function Title(props: { children: ReactNode }): ReactNode {
  return <h3 className="panorama-group__name">{props.children}</h3>
}

/** One planned component. */
function Component(props: { c: PlannedComponent; open: Open }): ReactNode {
  const { c, open } = props
  return (
    <li data-component={c.nome} data-situation={c.situacao} data-mark={c.marca}>
      <span data-part="component-name">
        <OpenFile path={c.spec} onOpenFile={open}>
          {c.nome}
        </OpenFile>
      </span>
      <Words
        part="component"
        situation={componentSituationLabel(c.situacao).text}
        marca={c.marca}
      />
      <div data-part="component-actions" className="muted">
        {c.acoes === null
          ? 'sem pasta no ciclo forward'
          : `${c.acoes.fechadas} de ${c.acoes.total} ações fechadas`}
      </div>
      {c.pastas.length === 0 ? null : (
        <div data-part="component-folders" className="muted">
          {c.pastas.join(', ')}
        </div>
      )}
      <div data-part="component-addendum" className={c.adendo === null ? 'muted' : undefined}>
        {c.adendo === null ? 'sem adendo vigente' : <OpenFile path={c.adendo} onOpenFile={open} />}
      </div>
    </li>
  )
}

/** One folder of the forward cycle that no spec names. */
function Unplanned(props: { f: UnplannedFeature }): ReactNode {
  const { f } = props
  return (
    <li data-unplanned={f.pasta} data-mark={f.marca}>
      <span data-part="unplanned-name">
        {f.id === null ? f.pasta : `${f.id}-${f.nomeCurto ?? ''}`}
      </span>
      <Words part="unplanned" situation={situationLabel(f.situacao).text} marca={f.marca} />
    </li>
  )
}

/** The scope of the PRD, folded or unfolded (D-16). */
function Scope(props: {
  axis: GreenfieldAxis
  revealed: boolean
  onReveal: () => void
  open: Open
}): ReactNode {
  const { axis, revealed, onReveal, open } = props
  const { escopo, escopoEncontrado } = axis.panorama
  const n = escopo.length

  return (
    <div data-part="scope" data-revealed={String(revealed)} className="panorama-group">
      <Title>
        Escopo declarado no PRD
        {escopoEncontrado ? `: ${n} ${n === 1 ? 'item' : 'itens'}` : ''}
        {axis.caminhos.prd === null ? null : (
          <>
            {' '}
            <span data-part="scope-prd">
              <OpenFile path={axis.caminhos.prd} onOpenFile={open} />
            </span>
          </>
        )}
      </Title>
      {!escopoEncontrado ? (
        <p data-part="scope-missing" className="notice">
          O PRD não tem seção de escopo reconhecível: nada foi lido dele.
        </p>
      ) : n === 0 ? (
        <p data-part="scope-none" className="muted">
          A seção de escopo do PRD não tem item algum.
        </p>
      ) : !revealed ? (
        <p>
          <button type="button" className="link" data-action="reveal-scope" onClick={onReveal}>
            Ver os {n} itens do escopo
          </button>
        </p>
      ) : (
        <ul className="rows">
          {escopo.map((item, i) => (
            <li data-scope-item={item.nome} data-scope-group={item.grupo ?? ''} key={i}>
              {item.grupo !== null && item.grupo !== escopo[i - 1]?.grupo ? (
                <div data-part="scope-group" className="panorama-group__label">
                  {item.grupo}
                </div>
              ) : null}
              {item.selo === null ? null : <span data-part="scope-seal">{item.selo} </span>}
              <span data-part="scope-name">{item.nome}</span>
              {item.detalhe === null ? null : (
                <div data-part="scope-detail" className="muted">
                  {item.detalhe}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/**
 * The panorama section.
 * @param props - the axis, the collapse state, the ports and the scope state.
 * @returns the section element.
 */
export function PanoramaSection(props: PanoramaSectionProps): ReactNode {
  const { greenfield: axis, onOpenFile: open } = props
  const vista = axis === undefined ? null : panoramaView(axis.panorama)
  const fora = axis?.panorama.foraDoPlano ?? []

  return (
    <CollapsibleSection
      name="panorama"
      title="Panorama do produto"
      count={vista?.total}
      collapsed={props.collapsed}
      onToggle={props.onToggle}
    >
      {axis === undefined || vista === null ? (
        <p data-part="panorama-unread" className="empty">
          O panorama do produto não foi lido por esta leitura do processo.
        </p>
      ) : !pipelineStarted(axis) ? (
        <p data-part="panorama-absent" className="empty">
          Este projeto não nasceu por /reversa-new: não há PRD nem specs para cruzar com o ciclo
          forward.
        </p>
      ) : (
        <>
          {vista.total === 0 ? (
            <p data-part="panorama-undecomposed" className="empty">
              A decomposição em specs ainda não foi feita: a pasta de specs está vazia.
            </p>
          ) : (
            <>
              <p data-part="panorama-counts">
                {vista.convergidos} de {vista.total} componentes planejados convergidos.
              </p>
              <ProgressBar
                feitos={vista.convergidos}
                total={vista.total}
                rotulo={`${vista.convergidos} de ${vista.total} componentes planejados convergidos`}
              />
              {vista.divergencia === null ? null : (
                <p data-part="panorama-divergence" className="notice">
                  Contagem da leitura: {vista.divergencia.contados} convergidos; na lista:{' '}
                  {vista.divergencia.listados}. Divergência declarada.
                </p>
              )}
              {vista.grupos.map((grupo) => (
                <div
                  data-component-group={grupo.situacao}
                  className="panorama-group"
                  key={grupo.situacao}
                >
                  <Title>{componentSituationLabel(grupo.situacao).text}</Title>
                  <ul className="rows">
                    {grupo.componentes.map((c) => (
                      <Component c={c} open={open} key={c.spec} />
                    ))}
                  </ul>
                </div>
              ))}
              {vista.truncado ? (
                <p data-part="panorama-truncated" className="notice">
                  Leitura parada no teto: {vista.total} specs no produto,{' '}
                  {axis.panorama.componentes.length} lidas.
                </p>
              ) : null}
            </>
          )}
          {fora.length === 0 ? (
            <p data-part="unplanned-none" className="muted">
              Toda pasta do ciclo forward tem spec correspondente.
            </p>
          ) : (
            <div data-part="unplanned" className="panorama-group">
              <Title>
                {fora.length} {fora.length === 1 ? 'feature' : 'features'} fora do plano
              </Title>
              <ul className="rows">
                {fora.map((f) => (
                  <Unplanned f={f} key={f.pasta} />
                ))}
              </ul>
            </div>
          )}
          <Scope
            axis={axis}
            revealed={props.scopeRevealed}
            onReveal={props.onRevealScope}
            open={open}
          />
        </>
      )}
    </CollapsibleSection>
  )
}
