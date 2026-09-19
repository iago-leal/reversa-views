/**
 * O vínculo que a entrega declara entre si e as specs (feature 010, RN-01,
 * RN-04, D-02 a D-05).
 *
 * As fixtures são sintéticas e escritas com as formas medidas em 2026-09-19
 * (D-19): o nome nu das pastas 006 a 009 deste repositório, a prosa com o
 * caminho das pastas 001 a 005, as crases com extensão e várias specs por
 * célula da 001 do `financas-ali`, e as seis tabelas de impacto da 002.
 * @module tests/domain-delivery-link
 */

import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  declaresSpec,
  impactTables,
  readDeliveryLinks,
  soleComponent,
} from '../src/domain/delivery-link.ts'
import type { FeatureFolderRead } from '../src/probe/features.ts'

/** O texto de uma fixture do vínculo. */
function fixture(nome: string): string {
  return readFileSync(`tests/fixtures/vinculo/${nome}.md`, 'utf8')
}

/** Uma pasta como a sonda a leria, com o que o caso quer dizer. */
function pasta(nome: string, partes: Partial<FeatureFolderRead> = {}): FeatureFolderRead {
  return {
    pasta: `_reversa_forward/${nome}`,
    nome,
    actionsMd: null,
    requirementsMd: null,
    progressJsonl: null,
    legacyImpactMd: null,
    onboardingMd: null,
    naoLidos: [],
    ...partes,
  }
}

describe('tabelas de impacto (D-02, RN-01)', () => {
  it('percorre todas as tabelas de impacto, e não só a primeira', () => {
    const lido = impactTables(fixture('impacto-seis-tabelas'))
    expect(lido.tabelas).toBe(6)
    expect(new Set(lido.linhas)).toEqual(
      new Set([
        'fundacao-persistencia',
        'acesso-e-identidade',
        '`acesso-e-identidade`',
        'telas-e-navegacao',
        '**ajustes**',
        'operacao-de-producao',
        'assistente',
      ]),
    )
  })

  it('exclui a tabela de mapeamento, que não tem a coluna `Arquivo afetado`', () => {
    const lido = impactTables(fixture('impacto-seis-tabelas'))
    // `metas` só aparece na tabela de mapeamento: citar não é entregar.
    expect(lido.linhas.some((linha) => linha.includes('metas'))).toBe(false)
  })

  it('acha as colunas em qualquer posição, com artigo e anotação final tolerados', () => {
    const md = [
      '| Justificativa | O componente (spec de origem) | Os arquivos | O arquivo afetado |',
      '|---|---|---|---|',
      '| porque sim | ajustes | x | `a.ts` |',
    ].join('\n')
    expect(impactTables(md)).toEqual({ linhas: ['ajustes'], tabelas: 1 })
  })

  it('lê a coluna `Componente (spec de origem)` da 001 do `financas-ali`', () => {
    const lido = impactTables(fixture('impacto-crases-varias'))
    expect(lido.tabelas).toBe(1)
    expect(lido.linhas).toContain('`fundacao-persistencia.md`, `acerto-mensal.md`')
  })

  it('arquivo sem tabela de impacto dá zero tabelas, e não erro', () => {
    expect(impactTables(fixture('impacto-sem-tabela'))).toEqual({ linhas: [], tabelas: 0 })
    expect(impactTables(null)).toEqual({ linhas: [], tabelas: 0 })
    expect(impactTables('')).toEqual({ linhas: [], tabelas: 0 })
  })

  it('pula a linha só de traços e a célula vazia da coluna', () => {
    const md = [
      '| Arquivo afetado | Componente | Tipo |',
      '|---|---|---|',
      '| — | — | — |',
      '| `a.ts` |  | x |',
      '| `b.ts` | ajustes | x |',
    ].join('\n')
    expect(impactTables(md)).toEqual({ linhas: ['ajustes'], tabelas: 1 })
  })
})

describe('a célula que declara a spec (D-03, RN-01)', () => {
  it('declara pelas três formas medidas', () => {
    expect(declaresSpec('painel-do-processo', 'painel-do-processo')).toBe(true)
    expect(declaresSpec('`fundacao-persistencia.md`', 'fundacao-persistencia')).toBe(true)
    expect(
      declaresSpec('Verificação local (`_reversa_sdd/sdd/leitura-do-processo.md#7`)', 'leitura-do-processo'),
    ).toBe(true)
  })

  it('declara com e sem `.md` e com e sem `sdd/`', () => {
    for (const celula of ['ajustes', 'ajustes.md', 'sdd/ajustes', 'sdd/ajustes.md', '`_reversa_sdd/sdd/ajustes.md`']) {
      expect(declaresSpec(celula, 'ajustes')).toBe(true)
    }
  })

  it('uma célula declara várias specs', () => {
    const celula = '`fundacao-persistencia.md`, `ajustes.md`, `ingestao-transacoes.md`, `acerto-mensal.md`'
    for (const spec of ['fundacao-persistencia', 'ajustes', 'ingestao-transacoes', 'acerto-mensal']) {
      expect(declaresSpec(celula, spec)).toBe(true)
    }
    expect(declaresSpec(celula, 'metas')).toBe(false)
  })

  it('`painel-do-processo-v2` não declara `painel-do-processo`, nem `x-ajustes` declara `ajustes`', () => {
    expect(declaresSpec('painel-do-processo-v2', 'painel-do-processo')).toBe(false)
    expect(declaresSpec('x-ajustes', 'ajustes')).toBe(false)
    expect(declaresSpec('ajustes2', 'ajustes')).toBe(false)
  })

  it('compara após minúsculas e sem diacríticos', () => {
    expect(declaresSpec('Ajustes', 'ajustes')).toBe(true)
    expect(declaresSpec('`fundação-persistência`', 'fundacao-persistencia')).toBe(true)
  })

  it('célula sem nome de spec não declara nada', () => {
    expect(declaresSpec('Tema (`#8`, RF-11)', 'leitura-do-processo')).toBe(false)
    expect(declaresSpec('(todos)', 'ajustes')).toBe(false)
    expect(declaresSpec('', 'ajustes')).toBe(false)
  })

  /**
   * Comportamento aceito e documentado (roadmap, seção 9): o caminho de uma
   * interface com o nome de uma spec a declara. Nas formas medidas ele não
   * aparece na coluna `Componente`.
   */
  it('o caminho de interface com o nome da spec também declara, por decisão registrada', () => {
    expect(declaresSpec('`interfaces/ajustes.md`', 'ajustes')).toBe(true)
  })
})

describe('o componente sem spec (D-04, RN-04)', () => {
  it('acha o nome kebab sozinho na célula, com ou sem crases e negrito', () => {
    expect(soleComponent('assistente')).toBe('assistente')
    expect(soleComponent('`acesso-e-identidade`')).toBe('acesso-e-identidade')
    expect(soleComponent('**operacao-de-producao**')).toBe('operacao-de-producao')
    expect(soleComponent('  telas-e-navegacao  ')).toBe('telas-e-navegacao')
    expect(soleComponent('fase2')).toBe('fase2')
  })

  it('prosa, maiúscula, parênteses e nome de arquivo não são componente', () => {
    for (const celula of [
      'Verificação local',
      'Verificação local (`_reversa_sdd/sdd/leitura-do-processo.md#7`)',
      'Tema',
      'Tema (`#8`, RF-11)',
      '(todos)',
      '`docker-compose.yml`',
      'docker-compose.yml',
      '`fundacao-persistencia.md`',
      '`fundacao-persistencia.md`, `ajustes.md`',
      'ajustes, metas',
      '-ajustes',
      'ajustes-',
      'a--b',
      '',
      '—',
    ]) {
      expect(soleComponent(celula), celula).toBeNull()
    }
  })
})

describe('o vínculo por pasta (D-05)', () => {
  it('pasta com o arquivo lido: estado `lido`, caminho, tabelas e células distintas na ordem de leitura', () => {
    const vinculos = readDeliveryLinks([
      pasta('002-infra', { legacyImpactMd: fixture('impacto-seis-tabelas') }),
    ])
    const lido = vinculos.get('_reversa_forward/002-infra')
    expect(lido?.estado).toBe('lido')
    expect(lido?.arquivo).toBe('_reversa_forward/002-infra/legacy-impact.md')
    expect(lido?.tabelas).toBe(6)
    expect(lido?.celulas).toEqual([
      'fundacao-persistencia',
      'acesso-e-identidade',
      '`acesso-e-identidade`',
      'telas-e-navegacao',
      '**ajustes**',
      'operacao-de-producao',
      'assistente',
    ])
  })

  it('arquivo ausente é `ausente`, sem caminho; presente e não lido é `nao-lido`, com caminho', () => {
    const vinculos = readDeliveryLinks([
      pasta('001-a'),
      pasta('002-b', { naoLidos: ['legacy-impact.md'] }),
    ])
    expect(vinculos.get('_reversa_forward/001-a')).toEqual({
      pasta: '_reversa_forward/001-a',
      estado: 'ausente',
      arquivo: null,
      tabelas: 0,
      celulas: [],
    })
    expect(vinculos.get('_reversa_forward/002-b')).toEqual({
      pasta: '_reversa_forward/002-b',
      estado: 'nao-lido',
      arquivo: '_reversa_forward/002-b/legacy-impact.md',
      tabelas: 0,
      celulas: [],
    })
  })

  it('arquivo lido sem tabela de impacto é `lido` com zero tabelas, distinto de ausente', () => {
    const vinculos = readDeliveryLinks([pasta('003-c', { legacyImpactMd: fixture('impacto-sem-tabela') })])
    expect(vinculos.get('_reversa_forward/003-c')?.estado).toBe('lido')
    expect(vinculos.get('_reversa_forward/003-c')?.tabelas).toBe(0)
  })

  it('tolera a pasta de uma sonda anterior, sem os campos novos', () => {
    const antiga = { pasta: '_reversa_forward/001-a', nome: '001-a', actionsMd: null, requirementsMd: null, progressJsonl: null }
    expect(() => readDeliveryLinks([antiga as FeatureFolderRead])).not.toThrow()
    expect(readDeliveryLinks([antiga as FeatureFolderRead]).get('_reversa_forward/001-a')?.estado).toBe('ausente')
  })

  it('declara as specs e os componentes sem spec das formas medidas', () => {
    const specs = ['acerto-mensal', 'ajustes', 'fundacao-persistencia', 'ingestao-transacoes', 'telas-e-navegacao', 'metas']
    const celulas = (nome: string): string[] =>
      readDeliveryLinks([pasta('x', { legacyImpactMd: fixture(nome) })]).get('_reversa_forward/x')?.celulas ?? []
    const declaradas = (nome: string): string[] =>
      specs.filter((spec) => celulas(nome).some((celula) => declaresSpec(celula, spec)))
    const semSpec = (nome: string): string[] => [
      ...new Set(
        celulas(nome)
          .map(soleComponent)
          .filter((c): c is string => c !== null && !specs.includes(c)),
      ),
    ]

    expect(declaradas('impacto-crases-varias')).toEqual([
      'acerto-mensal',
      'ajustes',
      'fundacao-persistencia',
      'ingestao-transacoes',
      'telas-e-navegacao',
    ])
    expect(semSpec('impacto-crases-varias')).toEqual([])

    expect(declaradas('impacto-seis-tabelas')).toEqual(['ajustes', 'fundacao-persistencia', 'telas-e-navegacao'])
    expect(semSpec('impacto-seis-tabelas')).toEqual(['acesso-e-identidade', 'operacao-de-producao', 'assistente'])

    expect(semSpec('impacto-prosa')).toEqual([])
  })
})
