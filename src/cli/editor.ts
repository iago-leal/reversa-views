/**
 * A abertura do artefato no editor do ambiente (RN-03, D-08, D-09).
 *
 * É a única capacidade da ferramenta que CRIA UM PROCESSO, e por isso a mais
 * vigiada das três. Dentro do editor, abrir um arquivo é chamada da interface
 * do próprio editor; no terminal, é criação de processo, capacidade que a spec
 * da camada de leitura proíbe no NG-01 e no RNF-04. A proibição continua
 * valendo onde foi escrita, e a capacidade nova nasce fora dela, num módulo
 * que a camada de leitura não alcança e do qual não recebe nada.
 *
 * NUNCA passa pelo shell. Caminho de artefato do Reversa pode conter espaço, e
 * o shell interpretaria metacaractere de nome de arquivo. Sem shell, nada
 * disso existe.
 *
 * O caminho vem SEMPRE da leitura, e é resolvido sob a raiz observada: jamais
 * texto digitado pelo usuário, e jamais um ponteiro que escape da raiz.
 * @module cli/editor
 */

import { spawnSync } from 'node:child_process'
import { isAbsolute, relative, resolve } from 'node:path'

/** O que o ambiente declara, na ordem em que o contrato manda perguntar. */
export const VARIAVEIS = ['VISUAL', 'EDITOR'] as const

/** Quem abre: o executável e os argumentos fixos que precedem o caminho. */
export interface Convocacao {
  executavel: string
  argumentos: string[]
}

/** O que a tentativa de abrir produziu, sempre nomeado e nunca lançado. */
export type Abertura =
  | { kind: 'aberto' }
  | { kind: 'sem-editor' }
  | { kind: 'sem-artefato' }
  | { kind: 'fora-da-raiz'; caminho: string }
  | { kind: 'falhou'; executavel: string; motivo: string }

/**
 * Quem o ambiente declara como editor.
 *
 * O valor é dividido em palavras: a primeira é o executável, as demais são
 * argumentos fixos. É a convenção que os editores de terminal esperam, e é o
 * que faz `code -w` e `subl -w` funcionarem (D-09).
 * @param ambiente - o ambiente do processo.
 * @returns a convocação, ou nulo quando nenhuma das duas está declarada.
 */
export function convocacao(ambiente: Record<string, string | undefined>): Convocacao | null {
  for (const nome of VARIAVEIS) {
    const valor = (ambiente[nome] ?? '').trim()
    if (valor === '') continue
    const [executavel, ...argumentos] = valor.split(/\s+/)
    return { executavel, argumentos }
  }
  return null
}

/**
 * O caminho absoluto de um artefato, recusado quando escapa da raiz.
 *
 * A recusa existe mesmo o caminho vindo da leitura: confiar na procedência é
 * confiar; conferir é conferir, e a camada de leitura já recusa ponteiro que
 * escape da raiz pela mesma razão.
 * @param raiz - a raiz observada, absoluta.
 * @param artefato - o caminho como a leitura o entregou.
 * @returns o caminho absoluto, ou nulo quando ele escapa da raiz.
 */
export function resolverSobAraiz(raiz: string, artefato: string): string | null {
  const absoluto = isAbsolute(artefato) ? resolve(artefato) : resolve(raiz, artefato)
  const dentro = relative(resolve(raiz), absoluto)
  if (dentro.startsWith('..') || isAbsolute(dentro)) return null
  return absoluto
}

/** O que a abertura precisa do mundo, para que a decisão seja exercitável. */
export interface MundoDoEditor {
  ambiente: Record<string, string | undefined>
  /** Cria o processo e espera; nunca passa pelo shell. */
  criar?: typeof spawnSync
}

/**
 * Abrir um artefato no editor declarado, esperando que ele termine.
 *
 * A dança da suspensão NÃO acontece aqui: quem restaura o terminal antes e
 * redesenha depois é o laço, porque é ele que tem o terminal. Este módulo faz
 * uma coisa só, e é a que cria o processo.
 * @param raiz - a raiz observada.
 * @param artefato - o caminho que a leitura entregou; nulo quando não há.
 * @param mundo - o ambiente e a criação de processo.
 * @returns o desfecho nomeado; nada é lançado.
 */
export function abrirNoEditor(
  raiz: string,
  artefato: string | null,
  mundo: MundoDoEditor,
): Abertura {
  if (artefato === null || artefato === '') return { kind: 'sem-artefato' }

  const quem = convocacao(mundo.ambiente)
  if (quem === null) return { kind: 'sem-editor' }

  const caminho = resolverSobAraiz(raiz, artefato)
  if (caminho === null) return { kind: 'fora-da-raiz', caminho: artefato }

  const criar = mundo.criar ?? spawnSync
  const resultado = criar(quem.executavel, [...quem.argumentos, caminho], {
    // Os canais são HERDADOS: o editor precisa da tela inteira, e não de um
    // cano. `shell: false` é o padrão, e está escrito porque é contrato.
    stdio: 'inherit',
    shell: false,
  })

  if (resultado.error !== undefined && resultado.error !== null) {
    return { kind: 'falhou', executavel: quem.executavel, motivo: resultado.error.message }
  }

  // O código do editor NÃO vira código da ferramenta: quem saiu mal foi ele, e
  // a interface volta normalmente.
  return { kind: 'aberto' }
}

/**
 * O que dizer ao usuário sobre cada desfecho, em uma linha.
 * @param abertura - o desfecho nomeado.
 * @returns a frase, ou nulo quando não há o que dizer.
 */
export function fraseDaAbertura(abertura: Abertura): string | null {
  switch (abertura.kind) {
    case 'aberto':
      return null
    case 'sem-artefato':
      return 'A linha selecionada não aponta artefato algum.'
    case 'sem-editor':
      return `Nenhum editor declarado. Defina ${VARIAVEIS.join(' ou ')} no ambiente.`
    case 'fora-da-raiz':
      return `O caminho recusado escapa da raiz observada: ${abertura.caminho}.`
    case 'falhou':
      return `Não foi possível executar ${abertura.executavel}: ${abertura.motivo}`
  }
}
