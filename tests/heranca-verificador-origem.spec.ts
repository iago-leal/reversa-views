/**
 * Suíte do julgamento com origem (T011).
 *
 * A comparação aplica as adaptações declaradas ao conteúdo lido da origem
 * antes de confrontá-lo com a cópia (D-05). Sem isso, os três arquivos
 * adaptados apareceriam divergentes em toda execução, e relatório que sempre
 * acusa deixa de ser lido.
 */

import { describe, expect, it } from 'vitest'
import { julgar } from '../scripts/heranca/verificar.js'
import { resumoDe as resumo } from '../scripts/heranca/carimbo.js'
import {
  adaptacaoDeImportacao,
  adaptacoesFixture,
  arquivoCarimbado,
  entradaDeArquivo,
  manifestoFixture,
} from './helpers/heranca-fixtures.ts'

const CAMINHO = 'src/heranca/reversa-probe/src/snapshot.ts'
const NA_ORIGEM = 'packages/reversa-probe/src/snapshot.ts'
const ORIGINAL = "import { readReversa } from '@scrum-harness/reversa-domain'\n"
const ADAPTADO = "import { readReversa } from '../../reversa-domain/src/index.ts'\n"
const CORPO_NA_ORIGEM = `${ORIGINAL}export const snapshot = 1\n`
const CORPO_AQUI = `${ADAPTADO}export const snapshot = 1\n`

function cenario(opcoes: {
  origem?: Record<string, unknown> | null
  corpoAqui?: string
  comAdaptacao?: boolean
} = {}) {
  const comAdaptacao = opcoes.comAdaptacao ?? true
  const corpoAqui = opcoes.corpoAqui ?? CORPO_AQUI
  const entrada = entradaDeArquivo({
    caminho: CAMINHO,
    caminhoNaOrigem: NA_ORIGEM,
    resumo: resumo(CORPO_AQUI),
    adaptacoes: comAdaptacao ? ['A1'] : [],
  })
  const origemPadrao = {
    estado: 'disponivel',
    caminho: '/tmp/origem',
    revisaoCorrente: '420305daa6cdd10858b720a34cb8db67d8e5c5e9',
    arquivos: { [NA_ORIGEM]: CORPO_NA_ORIGEM },
    extras: [] as string[],
  }
  return julgar({
    manifesto: manifestoFixture({ arquivos: [entrada] }),
    adaptacoes: adaptacoesFixture(
      comAdaptacao
        ? [adaptacaoDeImportacao({ arquivo: CAMINHO, original: ORIGINAL, adaptado: ADAPTADO })]
        : [],
    ),
    local: {
      arquivos: {
        [CAMINHO]: arquivoCarimbado(
          { caminho: NA_ORIGEM, adaptacoes: comAdaptacao ? 'A1' : 'nenhuma' },
          corpoAqui,
        ),
      },
      extras: [],
    },
    origens: {
      'scrum-harness': opcoes.origem === undefined ? origemPadrao : opcoes.origem,
      'vscode-kanban': { estado: 'disponivel', caminho: '/tmp/kit', versaoCorrente: '1.35.2' },
    },
  })
}

function tipos(resultado: ReturnType<typeof julgar>): string[] {
  return resultado.achados.map((achado) => achado.tipo)
}

function bloco(resultado: ReturnType<typeof julgar>, nome: string) {
  return resultado.blocos.find((item) => item.origem === nome)
}

describe('origem alinhada', () => {
  it('a adaptação aplicada à origem reproduz a cópia, e nada é acusado', () => {
    const resultado = cenario()
    expect(resultado.achados).toEqual([])
    expect(bloco(resultado, 'scrum-harness')?.estado).toBe('alinhado')
    expect(resultado.modo).toBe('completo')
  })
})

describe('origem que avançou', () => {
  it('é declarada, e os arquivos que diferem são nomeados', () => {
    const resultado = cenario({
      origem: {
        estado: 'disponivel',
        caminho: '/tmp/origem',
        revisaoCorrente: 'nova',
        arquivos: { [NA_ORIGEM]: `${ORIGINAL}export const snapshot = 2\n` },
        extras: [],
      },
    })
    expect(tipos(resultado)).toContain('origem-avancou')
    expect(resultado.achados[0].caminho).toBe(CAMINHO)
    expect(bloco(resultado, 'scrum-harness')?.estado).toBe('divergente')
  })

  it('avançar não impede: é sinal para ressincronizar, não falha', () => {
    const resultado = cenario({
      origem: {
        estado: 'disponivel',
        caminho: '/tmp/origem',
        revisaoCorrente: 'nova',
        arquivos: { [NA_ORIGEM]: `${ORIGINAL}export const snapshot = 2\n` },
        extras: [],
      },
    })
    expect(resultado.impede).toBe(false)
  })
})

describe('arquivo novo na origem', () => {
  it('é listado, e nada é copiado por decisão da ferramenta (RN-12)', () => {
    const resultado = cenario({
      origem: {
        estado: 'disponivel',
        caminho: '/tmp/origem',
        revisaoCorrente: '420305daa6cdd10858b720a34cb8db67d8e5c5e9',
        arquivos: { [NA_ORIGEM]: CORPO_NA_ORIGEM },
        extras: ['packages/reversa-probe/src/novo.ts'],
      },
    })
    expect(tipos(resultado)).toContain('novo-na-origem')
    expect(resultado.impede).toBe(false)
  })
})

describe('origem indisponível (RN-05)', () => {
  const indisponivel = {
    estado: 'indisponivel',
    caminho: '/pasta/que/nao/existe',
    motivo: 'a pasta declarada não existe',
  }

  it('vira bloco indisponível, sem virar erro', () => {
    const resultado = cenario({ origem: indisponivel })
    expect(bloco(resultado, 'scrum-harness')?.estado).toBe('indisponivel')
    expect(resultado.impede).toBe(false)
  })

  it('as conferências que não dependem da origem são concluídas assim mesmo', () => {
    const resultado = cenario({ origem: indisponivel, corpoAqui: `${ADAPTADO}mexida\n` })
    expect(tipos(resultado)).toContain('editado-localmente')
  })

  it('o achado ecoa o caminho declarado, para o usuário saber o que corrigir', () => {
    const resultado = cenario({ origem: indisponivel })
    const achado = resultado.achados.find((item) => item.tipo === 'origem-indisponivel')
    expect(achado?.detalhe).toContain('/pasta/que/nao/existe')
  })
})

describe('adaptação que deixou de casar', () => {
  it('é acusada antes de qualquer tentativa de ressincronizar', () => {
    const resultado = cenario({
      origem: {
        estado: 'disponivel',
        caminho: '/tmp/origem',
        revisaoCorrente: 'nova',
        arquivos: { [NA_ORIGEM]: 'import { readReversa } from "outra-coisa"\n' },
        extras: [],
      },
    })
    expect(tipos(resultado)).toContain('adaptacao-nao-casa')
    expect(resultado.impede).toBe(true)
  })
})

describe('bloco da origem de padrão', () => {
  it('não lista arquivo algum, por definição (RN-10)', () => {
    const kit = bloco(cenario(), 'vscode-kanban')
    expect(kit?.tipo).toBe('padrao')
    expect(kit?.achados).toEqual([])
  })

  it('acusa release nova da origem do kit, que é um dos três sinais do ritual', () => {
    const resultado = julgar({
      manifesto: manifestoFixture(),
      adaptacoes: adaptacoesFixture(),
      local: { arquivos: {}, extras: [] },
      origens: {
        'scrum-harness': { estado: 'indisponivel', caminho: null, motivo: 'não declarada' },
        'vscode-kanban': { estado: 'disponivel', caminho: '/tmp/kit', versaoCorrente: '1.36.0' },
      },
    })
    const kit = bloco(resultado, 'vscode-kanban')
    expect(kit?.achados.map((achado) => achado.tipo)).toContain('origem-avancou')
    expect(kit?.achados[0].detalhe).toContain('1.36.0')
  })
})
