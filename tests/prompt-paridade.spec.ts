/**
 * A paridade do texto do prompt: painel e comando escrevem o mesmo (T017).
 *
 * A duplicação é de fronteira e não de descuido. O painel compõe em TypeScript
 * compilado no pacote; o comando de manutenção é CommonJS carregado por `node`
 * sem construir. Nenhum dos dois pode importar o outro: a webview não lê disco e
 * não importa de `scripts/`, e um comando de diagnóstico que exigisse build
 * funcional seria inútil justamente quando mais se precisa dele.
 *
 * O que torna a duplicação aceitável é esta suíte. Ela compara o TEXTO INTEIRO,
 * e não um resumo dele: comparar tamanho, ou as primeiras linhas, deixaria passar
 * exatamente a divergência que interessa, que é uma frase trocada num lado só. O
 * contrato do formato está em `interfaces/texto-do-prompt.md` da feature 013, e
 * os precedentes são `tests/limites.spec.ts` e `hook-parity.spec.ts`.
 *
 * Divergência aqui é defeito de código: corrige-se o lado que saiu da linha,
 * jamais se afrouxa a comparação.
 * @module tests/prompt-paridade
 */

import { describe, expect, it } from 'vitest'
import { escreverPrompt } from '../scripts/prompt-harness.js'
import { promptText } from '../src/webview/domain/prompt.ts'
import type { PromptCase } from '../src/webview/domain/prompt.ts'

/**
 * Os casos da comparação: os três medidos em 2026-09-20, mais os dois que o
 * contrato manda incluir, o caso sem forma elidida e o caso sem projeto
 * declarado.
 */
const CASOS: PromptCase[] = [
  {
    projeto: 'TECH+',
    raiz: '/Users/alguem/dev/TECH+',
    agente: 'redator_progress',
    fase: 'geracao',
    camposComLista: ['items_completed', 'items_pending'],
    formaElidida: {
      items_total: 6,
      items_done: 3,
      items_pending: '<lista de 3>',
      items_completed: '<lista de 16>',
      last_completed_at: '2026-04-28T20:10:00Z',
    },
  },
  {
    projeto: 'ps-iagerasmlk',
    raiz: '/Users/alguem/dev/ps-iagerasmlk',
    agente: 'scout',
    fase: null,
    camposComLista: [],
    formaElidida: { timestamp: '2026-05-03T12:10:19Z', files: '<lista de 3>' },
  },
  {
    projeto: 'transc_audio_mlx',
    raiz: '/Users/alguem/dev/transc_audio_mlx',
    agente: 'archaeologist',
    fase: 'concluido',
    camposComLista: [],
    formaElidida: { modules_analyzed: '<lista de 1>', modules_pending: '<lista de 0>' },
  },
  {
    projeto: 'host-antigo',
    raiz: '/Users/alguem/dev/host-antigo',
    agente: 'writer',
    fase: 'revisao',
    camposComLista: ['achados'],
    formaElidida: null,
  },
  {
    projeto: null,
    raiz: '/Users/alguem/dev/sem-nome',
    agente: 'architect',
    fase: null,
    camposComLista: [],
    formaElidida: { done: false },
  },
]

describe('o texto é um só, escrito de dois lados (T017)', () => {
  it('concordam sobre os cinco casos de uma vez', () => {
    expect(promptText(CASOS)).toBe(escreverPrompt(CASOS))
  })

  it('concordam sobre cada caso isolado', () => {
    for (const caso of CASOS) {
      expect(promptText([caso]), `divergiram sobre ${caso.agente}`).toBe(escreverPrompt([caso]))
    }
  })

  it('concordam sobre o caso único, que é o que o painel produz hoje', () => {
    // Nenhuma raiz medida acumula mais de um caso, de modo que este é o texto
    // que o painel de fato entrega em todos os três projetos reais.
    const scout = CASOS[1]!

    expect(promptText([scout])).toBe(escreverPrompt([scout]))
  })

  it('concordam na lista vazia, que nenhum dos dois deve deixar acontecer', () => {
    expect(promptText([])).toBe(escreverPrompt([]))
  })

  it('os dois são determinísticos, e não só iguais entre si', () => {
    expect(promptText(CASOS)).toBe(promptText(CASOS))
    expect(escreverPrompt(CASOS)).toBe(escreverPrompt(CASOS))
  })

  it('a divergência seria apanhada: trocar um caso muda os dois textos igualmente', () => {
    const outro: PromptCase[] = [{ ...CASOS[1]!, agente: 'detective' }]

    expect(promptText(outro)).not.toBe(promptText([CASOS[1]!]))
    expect(promptText(outro)).toBe(escreverPrompt(outro))
  })
})
