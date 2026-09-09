/**
 * The decomposition of the active feature: what it is made of, and how far it
 * got (RF-06, RF-07, RF-08, RF-11, RF-13, RF-14, RN-04, RN-05).
 *
 * It answers the question the panel could not answer before: not which stage
 * the feature is in, which the forward card already said, but how much of it
 * is done and what comes next.
 *
 * The cut arrives ready from `domain/decomposition-view.ts`, and so does the
 * converted instant. What is decided here is only the shape: one row per
 * action, the next one marked by an attribute AND by a word, and every empty
 * state named rather than left blank.
 *
 * The count beside the title is the INHERITED one, which stays the authority
 * over how many actions exist. Where it and the list disagree, the panel says
 * so instead of choosing (D-08).
 * @module webview/ui/DecompositionSection
 */

import { useState } from 'react'
import type { ReactNode } from 'react'
import type { ReversaProcess } from '../../heranca/reversa-domain/src/index.ts'
import type { ActiveDecomposition } from '../../domain/types.ts'
import { decompositionView } from '../domain/decomposition-view.ts'
import type { DecompositionRow } from '../domain/decomposition-view.ts'
import { brasiliaInstant } from '../domain/instants.ts'
import { CollapsibleSection } from './CollapsibleSection.tsx'

/** What the section draws. */
export interface DecompositionSectionProps {
  decomposition: ActiveDecomposition
  process: ReversaProcess
  collapsed: boolean
  onToggle: () => void
}

/** The decomposition of a host that did not send one (contract, section 6). */
const UNREAD: ActiveDecomposition = {
  lida: false,
  origem: 'ausente',
  acoes: [],
  divergencia: null,
}

/**
 * One action, in the four fields RF-06 fixes plus what the trail recorded.
 * @param props - the row as the cut produced it.
 * @returns the list item.
 */
function Row(props: { row: DecompositionRow }): ReactNode {
  const { acao, ultimoEvento, arquivos, proxima } = props.row
  const instant = brasiliaInstant(ultimoEvento)

  return (
    <li
      data-action={acao.id}
      data-closed={String(acao.fechada)}
      data-next={String(proxima)}
      className={proxima ? 'action action--next' : 'action'}
    >
      <span data-part="action-id">{acao.id}</span>{' '}
      <span data-part="action-status" className="status">
        {acao.fechada ? 'fechada' : 'aberta'}
      </span>
      {proxima ? (
        <>
          {' '}
          <span data-part="action-next" className="status">
            próxima a executar
          </span>
        </>
      ) : null}
      {acao.emenda ? (
        <>
          {' '}
          <span data-part="action-amendment" className="status">
            emenda
          </span>
        </>
      ) : null}
      <div data-part="action-description">{acao.descricao}</div>
      <div data-part="action-phase" className="muted">
        {acao.fase ?? 'fase não declarada'}
      </div>
      <div
        data-part="action-instant"
        data-instant={instant.raw === '' ? undefined : instant.raw}
        className="muted"
      >
        {instant.text}
      </div>
      {arquivos.length === 0 ? (
        <div data-part="action-files" className="muted">
          nenhum arquivo registrado
        </div>
      ) : (
        <ul data-part="action-files" className="rows">
          {arquivos.map((arquivo) => (
            <li key={arquivo}>
              <code>{arquivo}</code>
            </li>
          ))}
        </ul>
      )}
    </li>
  )
}

/**
 * The decomposition section.
 * @param props - the decomposition, the process, the collapse state and the toggle port.
 * @returns the section element.
 */
export function DecompositionSection(props: DecompositionSectionProps): ReactNode {
  // Revealing the rest is state of the moment, not a preference: it is not
  // stored and does not talk to the host (D-17).
  const [revealed, setRevealed] = useState(false)

  const decomposition = props.decomposition ?? UNREAD
  const { forward, progress } = props.process
  const view = decompositionView(decomposition, progress, revealed)

  return (
    <CollapsibleSection
      name="decomposition"
      title="Decomposição da feature ativa"
      count={forward.actions.total}
      collapsed={props.collapsed}
      onToggle={props.onToggle}
    >
      <p data-part="decomposition-counts">
        {forward.actions.fechadas} de {forward.actions.total} ações fechadas
        {forward.actions.emendas > 0 ? `, ${forward.actions.emendas} em emendas` : ''}.
      </p>

      {decomposition.origem === 'varredura' ? (
        <p data-part="decomposition-source" className="notice">
          A tabela de ações veio por leitura degradada: o cabeçalho não casou e a lista foi
          obtida linha a linha.
        </p>
      ) : null}

      {decomposition.divergencia === null ? null : (
        <p data-part="decomposition-divergence" className="notice">
          A contagem do arquivo diz {decomposition.divergencia.contadas} ações e a lista traz{' '}
          {decomposition.divergencia.listadas}. A contagem é a autoridade.
        </p>
      )}

      {!decomposition.lida ? (
        <p data-part="decomposition-unread" className="empty">
          {forward.featureDir === null
            ? 'Não há feature ativa registrada, e por isso não há decomposição a mostrar.'
            : 'A tabela de ações da feature ativa não foi lida. O relatório da sonda nomeia o arquivo.'}
        </p>
      ) : view.total === 0 ? (
        <p data-part="decomposition-none" className="empty">
          A feature ativa não tem ação alguma no arquivo de ações.
        </p>
      ) : (
        <>
          <ul className="rows">
            {view.linhas.map((linha) => (
              <Row row={linha} key={linha.acao.id} />
            ))}
          </ul>
          <p>
            <span data-part="decomposition-total">{view.total}</span> ações no total.
            {view.ocultas > 0 ? (
              <>
                {' '}
                <button
                  type="button"
                  className="link"
                  data-action="expand-decomposition"
                  onClick={() => setRevealed(true)}
                >
                  Ver as outras {view.ocultas}
                </button>
              </>
            ) : null}
          </p>
        </>
      )}
    </CollapsibleSection>
  )
}
