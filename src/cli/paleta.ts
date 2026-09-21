/**
 * A paleta do terminal, em dado puro (feature 016, RN-04, RF-01, D-03 a D-06).
 *
 * É o único lugar do produto em que existe valor de cor, e a fronteira é
 * verificável por busca nos fontes: trocar um tom é editar uma linha daqui. O
 * G-04 do painel, que proíbe paleta própria, continua valendo no editor, onde
 * há tema a seguir; no terminal não há, e a paleta é decisão do produto.
 *
 * Nenhuma sequência de escape e nenhuma função de decisão: papel, fundo e
 * degrau entram em `terminal.ts`, que é quem sabe o protocolo. O que muda por
 * gosto mora aqui, e o que muda por protocolo mora lá.
 *
 * O `acento` é o mesmo tom nos dois fundos e só veste MARCA: glifo de seleção,
 * glifo de seção e moldura do cabeçalho. Ele mede 3,15 sobre branco, acima do
 * piso de elemento não textual e abaixo do de texto, e é por isso que o texto
 * em foco veste o `destaque`, que no fundo claro é a mesma matiz escurecida.
 *
 * A coluna de 256 do fundo claro foi escolhida à mão: o índice mais próximo
 * por distância erra a matiz, e o do concluído claro cairia num cinza. No
 * degrau de 16 o fundo declarado não importa, porque quem decide o tom é a
 * paleta do próprio terminal; atenuado e borda saem por intensidade reduzida,
 * porque o preto claro coincide com o fundo em esquemas difundidos e sumiria.
 * @module cli/paleta
 */

import type { Fundo, Papel } from './tipos.ts'

/** Os papéis que têm tom; `normal` e `titulo` usam a cor do próprio terminal. */
export type PapelComTom = Exclude<Papel, 'normal' | 'titulo'>

/** Um tom, nos dois degraus em que o fundo importa. */
export interface Tom {
  /** Vermelho, verde e azul, de 0 a 255. */
  vinteEQuatroBits: readonly [number, number, number]
  /** O índice na tabela de 256 cores. */
  duzentasECinquentaESeis: number
}

/** Os tons de cada papel, por fundo. */
export const TONS: Record<Fundo, Record<PapelComTom, Tom>> = {
  escuro: {
    acento: { vinteEQuatroBits: [215, 119, 87], duzentasECinquentaESeis: 173 },
    destaque: { vinteEQuatroBits: [215, 119, 87], duzentasECinquentaESeis: 173 },
    atenuado: { vinteEQuatroBits: [153, 153, 153], duzentasECinquentaESeis: 246 },
    borda: { vinteEQuatroBits: [80, 80, 80], duzentasECinquentaESeis: 239 },
    concluido: { vinteEQuatroBits: [78, 186, 101], duzentasECinquentaESeis: 71 },
    atencao: { vinteEQuatroBits: [255, 193, 7], duzentasECinquentaESeis: 214 },
    falha: { vinteEQuatroBits: [255, 107, 128], duzentasECinquentaESeis: 204 },
  },
  claro: {
    // O tom é o do fundo escuro; o índice, não. O 173, que o aproxima melhor,
    // mede 2,79 sobre branco, abaixo do piso de marca, e o 167 é o mais
    // próximo da matiz que passa, com 3,69. De um degrau para o outro some
    // fidelidade de tom, e a unidade do acento é a do tom de 24 bits.
    acento: { vinteEQuatroBits: [215, 119, 87], duzentasECinquentaESeis: 167 },
    destaque: { vinteEQuatroBits: [174, 96, 70], duzentasECinquentaESeis: 131 },
    atenuado: { vinteEQuatroBits: [102, 102, 102], duzentasECinquentaESeis: 241 },
    borda: { vinteEQuatroBits: [175, 175, 175], duzentasECinquentaESeis: 145 },
    concluido: { vinteEQuatroBits: [44, 122, 57], duzentasECinquentaESeis: 28 },
    atencao: { vinteEQuatroBits: [150, 108, 30], duzentasECinquentaESeis: 94 },
    falha: { vinteEQuatroBits: [171, 43, 63], duzentasECinquentaESeis: 124 },
  },
}

/**
 * O degrau de 16 cores: o parâmetro de cor de cada papel, ou nulo quando o
 * papel sai por intensidade reduzida, sem cor alguma.
 */
export const DEZESSEIS: Record<PapelComTom, number | null> = {
  acento: 33,
  destaque: 33,
  atenuado: null,
  borda: null,
  concluido: 32,
  atencao: 93,
  falha: 31,
}

/** Os papéis que levam peso além da cor: os que vestem título. */
export const COM_PESO: readonly Papel[] = ['titulo', 'destaque']
