/**
 * The correction prompt, composed on the screen and delivered ready (RF-18 to
 * RF-22, D-05 to D-07).
 *
 * It is the third text derived from the reading, beside the summary of feature
 * 006, and it exists for the same reason that one does: the readable labels
 * live on this side, the boundary suite forbids the host from carrying a
 * REVERSA path or a stage name, and what crosses the bridge is finished text.
 *
 * What it asks for is a correction AT THE SOURCE, and this is the whole point
 * of the feature. The first promotion of the map (feature 012) translated the
 * checkpoints that declared their conclusion under another name and took
 * twenty-five anomalies down to three. The three that stayed are not to be
 * translated: the defect is in whatever instruction told the agent to write a
 * checkpoint without naming `completed_at`, and a map entry would hide it
 * instead of fixing it. So the panel writes the request and hands it to the
 * person, who takes it to the harness that maintains the observed project.
 *
 * Two things this module refuses to do, and both are held by the suite. It does
 * not carry the CONTENT of an elided field, only its shape, because the text
 * may end up in front of a remote model. And it does not assert what the panel
 * did not read: not the checkpoint guide existing in that root, not a count of
 * projects it never opened, and never an instant from some field promoted to
 * proof that work finished.
 * @module webview/domain/prompt
 */

import type { CheckpointState } from '../../domain/types.ts'
import type { SetProcessData } from '../../host/protocol.ts'

/**
 * One case the prompt asks about: a checkpoint that declared no conclusion.
 *
 * It carries the root and the project alongside the checkpoint on purpose, and
 * not because the panel reads more than one root. The maintenance command
 * (`scripts/prompt-harness.js`) sweeps every root under `~/dev` and composes the
 * SAME text from the same unit, so the unit has to be self-contained or the two
 * implementations would need two different composers, and the parity suite
 * would have nothing to compare.
 */
export interface PromptCase {
  /** The project as `state.json` declares it; null when it declares none. */
  projeto: string | null
  /** The absolute root where the `state.json` was read. */
  raiz: string
  /** The key of the checkpoint map. */
  agente: string
  /** `phase` as the file carries it, for the human reading; null when absent. */
  fase: string | null
  /** The preserved list-valued fields, named and nothing more. */
  camposComLista: string[]
  /**
   * The elided checkpoint, or null.
   *
   * Null covers two different facts, and the text treats them the same way
   * because it can do nothing else: a host older than feature 013 read no form
   * at all, and a situation that asks for none carries none. Either way the
   * fenced block simply does not appear, which is better than a block that
   * invents a field.
   */
  formaElidida: Record<string, string | number | boolean | null> | null
}

/** Whether the prompt has anything to ask about, and why not when it has not. */
export interface PromptAvailability {
  elegiveis: PromptCase[]
  /** The reason the prompt is unavailable, in words; null when it is available. */
  razao: string | null
}

/** The three reasons, which are three DIFFERENT facts and never one message. */
const RAZAO = {
  semLeitura: 'Nenhum projeto foi lido ainda: abra uma pasta com Reversa instalado.',
  semEixo:
    'A leitura do estado da descoberta não aconteceu nesta carga, e sem ela o painel não sabe se há caso: o host que respondeu é anterior a esse eixo.',
  semCaso:
    'Nenhum checkpoint desta leitura ficou com a conclusão não declarada, e um prompt sobre nada seria um prompt sobre nada.',
} as const

/**
 * Whether one checkpoint is a case (RF-15, RF-16).
 *
 * The situation is enough, and the provenance is checked anyway: a checkpoint
 * recognised by an approved pair leaves this situation the moment the pair is
 * promoted, so the second test can never fire. It is written because what is
 * decided by a person does not go back in the queue, and the code should say so
 * where a reader looks for it.
 *
 * The entries approved as records that are not agents need no test at all: the
 * axis keeps them in a list of their own, and this one never sees them.
 * @param checkpoint - one checkpoint as the axis judged it.
 * @returns true when the prompt should ask about it.
 */
function elegivel(checkpoint: CheckpointState): boolean {
  return checkpoint.situacao === 'conclusao-nao-declarada' && checkpoint.reconhecidoPor === null
}

/**
 * Whether there is a prompt to compose, and the reason when there is not
 * (RF-18, RF-19).
 *
 * One function, and not one for the button and another for the text: the lesson
 * of `anomalies-view.ts` is that a screen whose availability is decided twice
 * eventually disagrees with itself, and a disabled button beside a composed
 * text is worse than either.
 * @param payload - the reading, or null when nothing was read.
 * @returns the eligible cases, and the reason when there are none.
 */
export function promptAvailability(payload: SetProcessData | null): PromptAvailability {
  if (payload === null) return { elegiveis: [], razao: RAZAO.semLeitura }
  if (payload.discoveryState === undefined) return { elegiveis: [], razao: RAZAO.semEixo }

  const eixo = payload.discoveryState
  const elegiveis = eixo.checkpoints.filter(elegivel).map(
    (checkpoint): PromptCase => ({
      projeto: payload.process.discovery.project,
      raiz: payload.root,
      agente: checkpoint.agent,
      fase: eixo.extracao.bruto,
      camposComLista: checkpoint.camposComLista,
      formaElidida: checkpoint.formaElidida ?? null,
    }),
  )

  return { elegiveis, razao: elegiveis.length === 0 ? RAZAO.semCaso : null }
}

/**
 * The cases of one reading, in the order the axis delivered them.
 * @param payload - the reading, or null.
 * @returns the cases; empty when there is nothing to ask about.
 */
export function promptCases(payload: SetProcessData | null): PromptCase[] {
  return promptAvailability(payload).elegiveis
}

/**
 * How the panel reads every case, in words.
 *
 * A constant, and not a field of the case, because a case IS this situation:
 * the eligibility admits no other, and carrying the sentence per case would
 * invite one of the two implementations to carry a different one. It repeats the
 * wording of `CHECKPOINT_SITUATION_LABELS` in `labels.ts` on purpose, and the
 * parity suite of `scripts/prompt-harness.js` is what holds the pair together.
 */
const COMO_O_PAINEL_LE = 'conclusão não declarada no campo canônico'

/** The block of one case (RF-21). */
function bloco(caso: PromptCase): string {
  const linhas: string[] = []
  const onde = caso.projeto === null ? '' : `, no projeto \`${caso.projeto}\``
  const fase = caso.fase === null ? '' : `, na fase \`${caso.fase}\``
  linhas.push(`### Checkpoint \`${caso.agente}\`${onde}${fase}`)
  linhas.push('')
  linhas.push(`Como o painel lê: ${COMO_O_PAINEL_LE}.`)

  // Named, and not called outputs. Thirteen names were measured for what a
  // checkpoint calls its outputs, and `achados`, `lacunas` and `adrs` have
  // exactly this shape without being files (D-08).
  if (caso.camposComLista.length > 0) {
    linhas.push('')
    linhas.push(
      `Campos preservados cujo valor é lista de textos: ${caso.camposComLista
        .map((campo) => `\`${campo}\``)
        .join(', ')}. O painel nomeia esses campos e não abre o conteúdo deles.`,
    )
  }

  if (caso.formaElidida !== null) {
    linhas.push('')
    linhas.push(
      'A forma do checkpoint, com lista, texto longo, caminho e objeto trocados por marcador de forma:',
    )
    linhas.push('')
    linhas.push('```json')
    linhas.push(JSON.stringify(caso.formaElidida, null, 2))
    linhas.push('```')
  }

  return linhas.join('\n')
}

/**
 * The prompt, in the five parts of `interfaces/texto-do-prompt.md` and in that
 * order (RF-20).
 *
 * The order is part of the contract because a reader who compared yesterday's
 * text has to find the lines in their places. It is a pure function of the
 * cases: nothing here reads the clock, the environment or anything else, which
 * is what lets the panel offer the copy and the document without the two
 * disagreeing inside one session.
 * @param casos - the cases, as `promptCases` composed them.
 * @returns the text; empty when there are no cases.
 */
export function promptText(casos: readonly PromptCase[]): string {
  if (casos.length === 0) return ''

  const raizes = [...new Set(casos.map((caso) => caso.raiz))]
  const onde =
    raizes.length === 1
      ? `Cole este texto numa sessão aberta na raiz que grava o \`state.json\`: \`${raizes[0]}\`.`
      : 'Cole este texto numa sessão aberta na raiz que grava o `state.json`. Cada bloco abaixo nomeia a sua raiz.'

  const partes: string[] = []

  partes.push('# Checkpoint concluído sem declarar conclusão: correção na fonte')
  partes.push('')
  partes.push(onde)
  partes.push('')
  partes.push(
    'O defeito é de gravação, e não de leitura: o painel está mostrando exatamente o que está escrito no arquivo.',
  )
  partes.push('')

  // Part two, the norm. No measurement number enters here (RN-03), and the
  // guide's usual home is stated as a habit of installations rather than as a
  // file that exists in that root (RN-17).
  partes.push('## A norma')
  partes.push('')
  partes.push(
    'No esquema do Reversa, um checkpoint declara conclusão por um par de campos, e só por ele: `completed_at`, com o instante em ISO 8601, e `files`, com as saídas que o agente produziu. Trabalho parcial tem campo próprio, `modules_pending`, e é assim que um agente diz que ainda não terminou.',
  )
  partes.push('')
  partes.push(
    'Quem manda isso é o guia de checkpoint do Reversa, que nas instalações costuma morar sob as referências da skill. Confirme onde ele está nesta raiz antes de editar qualquer coisa: o caminho varia de instalação para instalação, e eu não o li daqui.',
  )
  partes.push('')

  partes.push(casos.length === 1 ? '## O caso' : '## Os casos')
  partes.push('')
  partes.push(casos.map(bloco).join('\n\n'))
  partes.push('')

  partes.push('## O que eu peço, nesta ordem')
  partes.push('')
  partes.push(
    '1. Diga se este agente de fato concluiu a sua fase, olhando o que ele lista e o que existe em disco. Se não concluiu, o defeito é outro: pare aqui e diga qual.',
  )
  partes.push(
    '2. Se concluiu, grave `completed_at` com o instante real, e o que já estiver no próprio registro serve melhor que um instante inventado agora, mais `files` com as saídas, preservando os campos que já estão lá. Não apague nada: campo fora do esquema é informação de alguém.',
  )
  partes.push(
    '3. Diga por que o campo saiu com outro nome: qual `SKILL.md` ou qual instrução mandou gravar o checkpoint sem nomear `completed_at`. É a causa que interessa, porque é ela que repete o defeito no próximo projeto.',
  )
  partes.push(
    '4. Proponha a correção na fonte: o texto exato a acrescentar naquela instrução, nomeando `completed_at` e `files` como o guia manda. Não aplique sem eu ver.',
  )
  partes.push('')

  partes.push('## O que eu não peço')
  partes.push('')
  partes.push('- Não renomeie campo existente sem me dizer antes qual e por quê.')
  partes.push('- Não normalize valor algum que já esteja gravado.')
  partes.push('- Não reescreva o `state.json` inteiro.')
  partes.push('- Não mexa em checkpoints de outros agentes, nem nos de outros projetos.')
  partes.push('')

  return partes.join('\n')
}
