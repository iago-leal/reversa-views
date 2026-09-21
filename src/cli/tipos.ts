/**
 * O vocabulário da ferramenta de terminal, num lugar só (feature 014, D-05,
 * D-06, `data-delta.md` seção 3).
 *
 * Três estruturas efêmeras e dois vocabulários fechados. Efêmeras é a palavra:
 * nada aqui é escrito em disco, nada sobrevive ao fim do processo, e isso é a
 * RN-05 declarada em tipo antes de ser declarada em prosa.
 *
 * Tipos e constantes apenas. Nenhuma função, nenhuma leitura, nenhum módulo de
 * plataforma: o que lê vive em `sessao.ts`, o que desenha em `quadro/`, e o que
 * toca o mundo nos três módulos de borda.
 * @module cli/tipos
 */

import type { SectionName } from '../webview/domain/types.ts'

/**
 * O estado de navegação, único estado que a máquina recebe e devolve.
 *
 * O item selecionado é ÍNDICE, e não referência ao objeto: uma releitura troca
 * a carga inteira, e guardar referência produziria seleção apontando para um
 * objeto que não existe mais.
 */
export interface EstadoDeNavegacao {
  /** Uma das onze, na ordem fixa do painel. */
  secaoSelecionada: SectionName
  /** Índice dentro da seção; nulo quando a seção não tem item navegável. */
  itemSelecionado: number | null
  /** Começa no padrão que `effectiveCollapsed` já decide para a tela. */
  secoesFechadas: ReadonlySet<SectionName>
  ajudaVisivel: boolean
  /** O deslocamento vertical, para janela menor que o quadro. */
  primeiraLinhaVisivel: number
}

/**
 * A ênfase de uma linha, ABSTRATA: nenhuma sequência de escape nasce no
 * desenho, e é isso que permite conferir o quadro inteiro por comparação de
 * texto (D-05).
 *
 * A tradução em cor, negrito ou inversão pertence ao módulo de terminal, e
 * some quando a saída não é terminal ou quando a cor está desligada.
 */
export const ENFASES = ['normal', 'titulo', 'selecionada', 'atenuada', 'alerta'] as const

/** Uma das cinco ênfases. */
export type Enfase = (typeof ENFASES)[number]

/** Uma linha desenhada, já recortada à largura da janela. */
export interface LinhaDoQuadro {
  texto: string
  enfase: Enfase
  /** O caminho relativo que a confirmação abriria sobre esta linha, ou nulo. */
  artefato: string | null
}

/** O produto da função pura de desenho, e o que a borda escreve no terminal. */
export interface Quadro {
  linhas: LinhaDoQuadro[]
  /** Para o deslocamento vertical saber o limite. */
  alturaTotal: number
}

/**
 * Um item navegável de uma seção: o texto que se lê e o que a confirmação
 * abriria sobre ele.
 *
 * O artefato é o que liga o desenho à ação sem que o desenho aja: a máquina de
 * navegação lê o caminho da linha selecionada e emite o efeito, e quem cria o
 * processo é o módulo do editor.
 */
export interface ItemDaSecao {
  texto: string
  /** Caminho relativo à raiz observada, ou nulo quando a linha não aponta nada. */
  artefato: string | null
  /** Marca a linha como digna de atenção, sem que isso vire cor aqui. */
  alerta?: boolean
}

/**
 * Uma seção do quadro, já resolvida em texto e ainda sem largura aplicada.
 *
 * O recorte vem depois, no compositor, porque a largura da janela muda e o que
 * cada seção diz não muda com ela.
 */
export interface SecaoDesenhada {
  nome: SectionName
  titulo: string
  /** O número que o painel desenha ao lado do título, quando há um. */
  contagem: number | null
  /** Linhas de prosa que antecedem os itens; nunca vazias quando não há item. */
  corpo: string[]
  itens: ItemDaSecao[]
  /** Falso na faixa de bloqueio, que ocupa nome de seção sem ser cartão. */
  recolhivel: boolean
}

/** O resultado da observação do disco, tal como a tela o declara (RN-09). */
export interface Observacao {
  /** Falso quando a assinatura não instalou. */
  ativa: boolean
  /** O que dizer na tela quando caiu para intervalo; nulo quando não caiu. */
  razaoDaDegradacao: string | null
  /** Quando a última releitura automática ocorreu; nulo antes da primeira. */
  ultimaMudanca: string | null
}

/**
 * As teclas nomeadas, que é a tabela de `interfaces/teclado.md` virada código.
 *
 * O reconhecimento dos bytes acontece antes, em `teclas.ts`, e é o único lugar
 * em que a tabela vira bytes. Trocar uma tecla é trocar uma entrada aqui e uma
 * lá, e a suíte que as cobre falha nomeando a tecla trocada.
 */
export const TECLAS = [
  'acima',
  'abaixo',
  'fechar-secao',
  'abrir-secao',
  'confirmar',
  'proxima-secao',
  'secao-anterior',
  'reler',
  'abrir-tudo',
  'fechar-tudo',
  'ajuda',
  'topo',
  'fim',
  'sair',
  'suspender',
] as const

/** Uma das quinze teclas nomeadas. */
export type TeclaNomeada = (typeof TECLAS)[number]

/**
 * Os efeitos nomeados que a máquina de navegação emite.
 *
 * Efeito NOMEADO, e não chamada direta: é o que torna a máquina testável sem
 * terminal, sem editor e sem disco, no molde do `router.ts` do host (D-06).
 */
export const EFEITOS = ['nenhum', 'reler', 'abrir-artefato', 'suspender', 'sair'] as const

/** Um dos cinco efeitos. */
export type EfeitoNomeado = (typeof EFEITOS)[number]

/** O que a máquina de navegação devolve: o estado novo e o efeito a executar. */
export interface Transicao {
  estado: EstadoDeNavegacao
  efeito: EfeitoNomeado
}

/**
 * De onde veio a leitura que está na tela (RN-09).
 *
 * A observação não muda a tela sem dizer, e dizer exige distinguir a releitura
 * que o usuário pediu da que veio sozinha.
 */
export const PROCEDENCIAS = ['primeira', 'tecla', 'observacao'] as const

/** Uma das três procedências. */
export type Procedencia = (typeof PROCEDENCIAS)[number]
