/**
 * The five entry screens, one per named situation (RF-01, RF-15).
 *
 * None of them produces a blank area: that is the acceptance criterion of
 * RF-01, and it is the reason the screen with nothing to say still says
 * something. Two of them are deliberately asymmetric: the one without a
 * folder offers NO action, because there is nothing the panel can do about
 * it, and the one that is rereading draws nothing at all when there is
 * content to preserve (RN-08).
 * @module webview/ui/EntryScreens
 */

import type { ReactNode } from 'react'
import type { EffectiveEntry } from '../domain/types.ts'

/** The command that installs REVERSA, shown as a block to copy. */
const INSTALL_COMMAND = 'npx reversa init'

/** What one screen draws. */
export interface EntryScreenProps {
  entry: EffectiveEntry
  onReload: () => void
}

/**
 * The button that asks for another reading.
 * @param props - the label and the port.
 * @returns the button element.
 */
function Retry(props: { label: string; onReload: () => void }): ReactNode {
  return (
    <p>
      <button type="button" className="button" data-action="reload" onClick={props.onReload}>
        {props.label}
      </button>
    </p>
  )
}

/**
 * The screen for the situation the panel is in, or nothing when the panel has
 * content to keep on screen.
 * @param props - the entry state and the reload port.
 * @returns the screen element, or null.
 */
export function EntryScreen(props: EntryScreenProps): ReactNode {
  const { entry, onReload } = props

  // With content on screen, no screen replaces it: a reread is additive, and
  // the states that carry a process are drawn by the sections themselves.
  if (entry.loaded !== null) return null

  if (entry.kind === 'no-folder') {
    return (
      <section data-part="entry" data-entry="no-folder">
        <h1>Nenhuma pasta aberta</h1>
        <p>
          O painel lê o Reversa de dentro de uma pasta do espaço de trabalho, e não há nenhuma
          aberta. Abra a pasta do projeto para que o painel possa procurar a instalação.
        </p>
      </section>
    )
  }

  if (entry.kind === 'no-reversa') {
    return (
      <section data-part="entry" data-entry="no-reversa">
        <h1>Reversa não instalado aqui</h1>
        <p>
          O Reversa é um framework de engenharia reversa que documenta um sistema existente e
          conduz a evolução dele a partir dessa documentação. Ele guarda o estado do processo em
          arquivos dentro do projeto, e é isso que este painel lê.
        </p>
        <p>Para instalar na raiz observada, rode:</p>
        <pre>{INSTALL_COMMAND}</pre>
        <Retry label="Verificar de novo" onReload={onReload} />
      </section>
    )
  }

  if (entry.kind === 'error') {
    return (
      <section data-part="entry" data-entry="error">
        <h1>Não foi possível ler o processo</h1>
        <p>A leitura falhou e o painel não tem o que mostrar. A mensagem recebida foi:</p>
        <pre>{entry.message ?? 'sem mensagem'}</pre>
        <Retry label="Tentar de novo" onReload={onReload} />
      </section>
    )
  }

  return (
    <section data-part="entry" data-entry="loading">
      <h1>Lendo o processo</h1>
      <p>O painel está lendo os arquivos do Reversa na raiz observada. Isso costuma ser rápido.</p>
    </section>
  )
}
