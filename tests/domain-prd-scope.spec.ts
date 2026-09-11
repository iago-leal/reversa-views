/**
 * O leitor restrito do escopo do PRD (RN-14, RF-23, D-10).
 *
 * Restrito de propósito: ele reconhece UMA seção e os itens de topo dela, e
 * nada mais do documento é interpretado. As fixtures são uma por linha da
 * mecânica descrita no `data-delta.md`, e a primeira delas é o `prd.md` real
 * deste projeto transcrito, porque o leitor foi desenhado sobre a forma que o
 * `/reversa-drafter` produziu aqui.
 *
 * PRD ausente NÃO é anomalia, e a suíte fixa isso: não ter PRD é o estado de um
 * projeto legado, e um leitor que reclamasse dele acusaria defeito onde há só
 * ausência. Seção ausente com PRD presente É anomalia, e quem a abre é o
 * julgamento do eixo; aqui, o leitor apenas declara que não a encontrou.
 * @module tests/domain-prd-scope
 */

import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { SCOPE_ITEM_CAP } from '../src/domain/limits.ts'
import { readPrdScope } from '../src/domain/prd-scope.ts'

/** Uma fixture de PRD, pelo nome. */
function prd(nome: string): string {
  return readFileSync(`tests/fixtures/prd/${nome}.md`, 'utf8')
}

describe('a escolha da seção (RN-14)', () => {
  it('encontra "Escopo (in)" no PRD real deste projeto, numerada como o gabarito numera', () => {
    const lido = readPrdScope(prd('prd-real'))
    expect(lido.encontrado).toBe(true)
    expect(lido.itens.length).toBeGreaterThan(0)
  })

  it('aceita o título "Escopo" sem parêntese algum', () => {
    const lido = readPrdScope(prd('titulo-simples'))
    expect(lido.encontrado).toBe(true)
    expect(lido.itens.map((item) => item.nome)).toEqual([
      'Identidade da instalação',
      'Descoberta',
    ])
  })

  it('não toma "Não-objetivos (out)" por escopo, mesmo que a prosa dela fale em escopo', () => {
    const lido = readPrdScope(prd('so-nao-objetivos'))
    expect(lido.encontrado).toBe(false)
    expect(lido.itens).toEqual([])
  })

  it('declara não encontrada a seção quando o PRD não a tem', () => {
    const lido = readPrdScope(prd('sem-escopo'))
    expect(lido.encontrado).toBe(false)
    expect(lido.itens).toEqual([])
  })

  it('PRD ausente devolve nada encontrado e nada lido, sem lançar', () => {
    expect(readPrdScope(null)).toEqual({ itens: [], encontrado: false, truncado: false })
    expect(readPrdScope('')).toEqual({ itens: [], encontrado: false, truncado: false })
  })

  it('não lê a seção "Fora do escopo", que vem depois e contém a palavra', () => {
    const lido = readPrdScope(prd('titulo-simples'))
    expect(lido.itens.some((item) => item.nome.includes('Escrita'))).toBe(false)
  })
})

describe('o PRD real deste projeto, item a item', () => {
  const lido = readPrdScope(prd('prd-real'))

  it('agrupa pelos três rótulos em negrito do PRD', () => {
    const grupos = [...new Set(lido.itens.map((item) => item.grupo))]
    expect(grupos).toEqual([
      'Núcleo, o que responde "onde estou e o que faço agora"',
      'Diagnóstico, o que impede o painel de mentir em silêncio',
      'Comportamento',
    ])
  })

  it('lê os onze itens, quatro do núcleo, três do diagnóstico e quatro do comportamento', () => {
    const porGrupo = (grupo: string) =>
      lido.itens.filter((item) => item.grupo?.startsWith(grupo)).length
    expect(lido.itens).toHaveLength(11)
    expect(porGrupo('Núcleo')).toBe(4)
    expect(porGrupo('Diagnóstico')).toBe(3)
    expect(porGrupo('Comportamento')).toBe(4)
  })

  it('nomeia pelo texto antes do dois-pontos e guarda o resto como detalhe', () => {
    const identidade = lido.itens[0]
    expect(identidade?.nome).toBe('Identidade da instalação')
    expect(identidade?.detalhe).toBe(
      'projeto, versão do framework, pastas de saída e forward resolvidas.',
    )
  })

  it('retira o selo do texto e o guarda à parte', () => {
    for (const item of lido.itens) {
      expect(item.selo).toBe('🟡')
      expect(item.nome).not.toContain('🟡')
      expect(item.detalhe ?? '').not.toContain('🟡')
    }
  })

  it('desfaz a quebra dura de linha de um item que continua na linha seguinte', () => {
    const descoberta = lido.itens.find((item) => item.nome === 'Descoberta')
    expect(descoberta?.detalhe).toBe(
      'as cinco fases canônicas com status derivado, e os checkpoints por agente, distinguindo o que terminou do que ainda corre.',
    )
  })

  it('o parágrafo de abertura da seção, que não é item, não vira item', () => {
    expect(lido.itens.some((item) => item.nome.startsWith('Uma extensão'))).toBe(false)
  })
})

describe('os desvios da mecânica, um por fixture', () => {
  it('retira o selo no início e no fim, e o negrito do nome', () => {
    const lido = readPrdScope(prd('selos-dos-dois-lados'))
    const [identidade, forward, bloqueio] = lido.itens
    expect(identidade?.nome).toBe('Identidade da instalação')
    expect(identidade?.selo).toBe('🟢')
    expect(identidade?.detalhe).toBe('projeto, versão e pastas.')
    expect(forward?.nome).toBe('Ciclo forward')
    expect(forward?.selo).toBe('🔴')
    expect(forward?.detalhe).toBe('o estágio físico da feature ativa')
    expect(bloqueio?.nome).toBe('Bloqueio humano')
    expect(bloqueio?.selo).toBe('🟡')
  })

  it('ignora os subitens recuados, que não são itens de topo', () => {
    const lido = readPrdScope(prd('selos-dos-dois-lados'))
    expect(lido.itens).toHaveLength(4)
    expect(lido.itens.some((item) => item.nome.includes('subitem'))).toBe(false)
  })

  it('sem dois-pontos, o nome é a primeira frase e o resto é o detalhe', () => {
    const lido = readPrdScope(prd('sem-dois-pontos'))
    expect(lido.itens[0]?.nome).toBe('Leitura automática na ativação, sem comando prévio.')
    expect(lido.itens[0]?.detalhe).toBe('Uma segunda frase explica o porquê.')
    expect(lido.itens[1]?.nome).toBe('Releitura sob demanda por ação explícita no painel')
    expect(lido.itens[1]?.detalhe).toBeNull()
  })

  it('aceita o asterisco como marcador de item', () => {
    const lido = readPrdScope(prd('sem-dois-pontos'))
    expect(lido.itens[2]?.nome).toBe('Navegação por asterisco')
  })

  it('um item sem selo fica com selo nulo, e não com texto vazio', () => {
    const lido = readPrdScope(prd('sem-dois-pontos'))
    expect(lido.itens[1]?.selo).toBeNull()
  })

  it('para no teto de itens e declara que parou', () => {
    const lido = readPrdScope(prd('acima-do-teto'))
    expect(lido.itens).toHaveLength(SCOPE_ITEM_CAP)
    expect(lido.truncado).toBe(true)
    expect(lido.itens[0]?.grupo).toBe('Um grupo só')
  })

  it('abaixo do teto não declara truncamento', () => {
    expect(readPrdScope(prd('prd-real')).truncado).toBe(false)
  })
})
