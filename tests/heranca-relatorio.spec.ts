/**
 * Suíte do relatório (T012).
 *
 * O relatório é a única interface do ritual, e o Retomador o lê de cima para
 * baixo sem conhecimento prévio. Por isso ele nomeia a origem, o estado, o
 * arquivo e o que fazer, e separa o que impede de prosseguir do que apenas
 * informa.
 */

import { describe, expect, it } from 'vitest'
import { codigoDeSaida, formatar } from '../scripts/heranca/relatorio.js'

const ALINHADO = {
  modo: 'completo',
  veredito: 'alinhado',
  impede: false,
  achados: [],
  blocos: [
    { origem: 'scrum-harness', tipo: 'codigo', estado: 'alinhado', achados: [] },
    { origem: 'vscode-kanban', tipo: 'padrao', estado: 'alinhado', achados: [], nota: 'origem de padrão' },
  ],
}

const COM_DEFEITO = {
  modo: 'local',
  veredito: 'divergente',
  impede: true,
  achados: [
    {
      tipo: 'editado-localmente',
      origem: 'scrum-harness',
      caminho: 'src/heranca/reversa-domain/src/state.ts',
      detalhe: 'o resumo do conteúdo não confere com o manifesto',
      severidade: 'impede',
    },
  ],
  blocos: [
    {
      origem: 'scrum-harness',
      tipo: 'codigo',
      estado: 'divergente',
      achados: [
        {
          tipo: 'editado-localmente',
          origem: 'scrum-harness',
          caminho: 'src/heranca/reversa-domain/src/state.ts',
          detalhe: 'o resumo do conteúdo não confere com o manifesto',
          severidade: 'impede',
        },
      ],
    },
    { origem: 'vscode-kanban', tipo: 'padrao', estado: 'alinhado', achados: [] },
  ],
}

describe('organização por origem (RF-08)', () => {
  it('tem um bloco nomeado por origem', () => {
    const texto = formatar(ALINHADO)
    expect(texto).toContain('scrum-harness')
    expect(texto).toContain('vscode-kanban')
  })

  it('a defasagem de uma origem não aparece dentro do bloco da outra', () => {
    const texto = formatar(COM_DEFEITO)
    const doModelo = texto.indexOf('scrum-harness')
    const doKit = texto.indexOf('vscode-kanban')
    expect(texto.slice(doModelo, doKit)).toContain('state.ts')
    expect(texto.slice(doKit)).not.toContain('state.ts')
  })

  it('termina com veredito geral', () => {
    expect(formatar(ALINHADO).trimEnd().toLowerCase()).toContain('alinhado')
  })
})

describe('conteúdo de cada achado', () => {
  it('nomeia arquivo, estado e origem', () => {
    const texto = formatar(COM_DEFEITO)
    expect(texto).toContain('src/heranca/reversa-domain/src/state.ts')
    expect(texto).toContain('editado')
  })

  it('distingue o que impede do que apenas informa', () => {
    const informativo = {
      ...COM_DEFEITO,
      impede: false,
      achados: [
        {
          tipo: 'origem-avancou',
          origem: 'scrum-harness',
          caminho: 'src/heranca/a.ts',
          detalhe: 'a origem tem conteúdo diferente',
          severidade: 'informa',
        },
      ],
      blocos: [
        {
          origem: 'scrum-harness',
          tipo: 'codigo',
          estado: 'divergente',
          achados: [
            {
              tipo: 'origem-avancou',
              origem: 'scrum-harness',
              caminho: 'src/heranca/a.ts',
              detalhe: 'a origem tem conteúdo diferente',
              severidade: 'informa',
            },
          ],
        },
      ],
    }
    expect(formatar(informativo)).not.toBe(formatar(COM_DEFEITO))
    expect(formatar(informativo)).toMatch(/informa|sinal/i)
  })
})

describe('código de saída', () => {
  it('é zero quando nada impede, ainda que a origem tenha avançado', () => {
    expect(codigoDeSaida(ALINHADO)).toBe(0)
    expect(codigoDeSaida({ ...ALINHADO, veredito: 'divergente' })).toBe(0)
  })

  it('é diferente de zero quando há achado que impede', () => {
    expect(codigoDeSaida(COM_DEFEITO)).toBe(1)
  })
})
