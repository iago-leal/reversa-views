/**
 * The history of the project, one entry per feature folder (RF-09, RN-06,
 * D-16, D-18, D-19).
 *
 * Dois eixos, e não um só: a situação sai dos artefatos da pasta, a marca sai
 * do ponteiro que o Reversa mantém, e nenhum dos dois se chama estágio. Uma
 * feature pausada pode estar em qualquer situação, e fundir os eixos obrigaria
 * a escolher qual verdade contar.
 *
 * A ordenação é pelo NOME da pasta, decrescente, e não pela data do adendo: o
 * prefixo é sequencial ou de data conforme o `setup.json`, e nos dois casos
 * ordena cronologicamente, ao passo que a data do adendo falta em feature sem
 * adendo e pode vir malformada.
 * @module tests/domain-history
 */

import { describe, expect, it } from 'vitest'
import { readHistory } from '../src/domain/history.ts'
import type { FeatureFolderRead } from '../src/probe/features.ts'

const SAIDA = '_reversa_sdd'
const FORWARD = '_reversa_forward'

/** Uma tabela de ações com as contagens pedidas, no formato do template. */
function acoesMd(fechadas: number, abertas: number, emendasAbertas = 0): string {
  const linhas = ['| ID | Descrição | Status |', '|----|-----------|--------|']
  for (let i = 1; i <= fechadas; i += 1) linhas.push(`| T${i} | feito | \`[X]\` |`)
  for (let i = 1; i <= abertas; i += 1) linhas.push(`| A${i} | aberto | \`[ ]\` |`)
  const corpo = `# Actions\n\n## Fase 1, Preparação\n\n${linhas.join('\n')}\n`
  if (emendasAbertas === 0) return corpo
  const emendas = Array.from({ length: emendasAbertas }, (_, i) => `| E${i + 1} | emenda | \`[ ]\` |`)
  return `${corpo}\n## Emendas\n\n| ID | Descrição | Status |\n|--|--|--|\n${emendas.join('\n')}\n`
}

/** Uma pasta lida pela sonda local, com o que cada caso quiser dentro. */
function pasta(nome: string, arquivos: Partial<FeatureFolderRead> = {}): FeatureFolderRead {
  return {
    pasta: `${FORWARD}/${nome}`,
    nome,
    actionsMd: null,
    requirementsMd: null,
    progressJsonl: null,
    ...arquivos,
  }
}

/** A leitura completa, com os padrões que quase todo caso quer. */
function historico(
  pastas: FeatureFolderRead[],
  extras: {
    activeFeatureDir?: string | null
    pausedFeatureDirs?: string[]
    addendaFiles?: string[]
    addendaBodies?: Record<string, string>
    truncado?: boolean
    total?: number
  } = {},
) {
  return readHistory({
    pastas,
    truncado: extras.truncado ?? false,
    total: extras.total ?? pastas.length,
    activeFeatureDir: extras.activeFeatureDir ?? null,
    pausedFeatureDirs: extras.pausedFeatureDirs ?? [],
    addendaFiles: extras.addendaFiles ?? [],
    addendaBodies: extras.addendaBodies ?? {},
    outputFolder: SAIDA,
  })
}

describe('as quatro situações (RN-06)', () => {
  it('convergida: todas fechadas e adendo vigente', () => {
    const lido = historico([pasta('001-leitura', { actionsMd: acoesMd(21, 0) })], {
      addendaFiles: ['001-leitura-do-processo.md'],
      addendaBodies: { '001-leitura-do-processo.md': '## Vigência\n\nVigente desde 2026-09-09.\n' },
    })

    expect(lido.entradas[0]?.situacao).toBe('convergida')
    expect(lido.entradas[0]?.adendo).toBe(`${SAIDA}/addenda/001-leitura-do-processo.md`)
  })

  it('entregue-sem-adendo: todas fechadas, sem adendo algum', () => {
    const lido = historico([pasta('002-ponte', { actionsMd: acoesMd(32, 0) })])

    expect(lido.entradas[0]?.situacao).toBe('entregue-sem-adendo')
    expect(lido.entradas[0]?.adendo).toBeNull()
  })

  it('em-aberto: ao menos uma ação aberta', () => {
    const lido = historico([pasta('003-painel', { actionsMd: acoesMd(20, 4) })])
    expect(lido.entradas[0]?.situacao).toBe('em-aberto')
  })

  it('em-aberto também quando o que está aberto é emenda (RN-05)', () => {
    const lido = historico([pasta('004-heranca', { actionsMd: acoesMd(44, 0, 1) })], {
      addendaFiles: ['004-heranca.md'],
      addendaBodies: { '004-heranca.md': 'vigente' },
    })

    expect(lido.entradas[0]?.situacao).toBe('em-aberto')
    expect(lido.entradas[0]?.acoes.emendas).toBe(1)
  })

  it('sem-acoes: pasta sem `actions.md`', () => {
    const lido = historico([pasta('006-cartoes')])
    expect(lido.entradas[0]?.situacao).toBe('sem-acoes')
    expect(lido.entradas[0]?.acoes.total).toBe(0)
  })

  it('sem-acoes: arquivo presente, mas sem linha de ação alguma', () => {
    const lido = historico([pasta('006-cartoes', { actionsMd: '# Actions\n\nsó prosa\n' })])
    expect(lido.entradas[0]?.situacao).toBe('sem-acoes')
  })
})

describe('adendo superado não conta como convergência (RN-06)', () => {
  it('cai para entregue-sem-adendo, e o adendo deixa de ser apontado', () => {
    const lido = historico([pasta('001-leitura', { actionsMd: acoesMd(21, 0) })], {
      addendaFiles: ['001-leitura.md'],
      addendaBodies: {
        '001-leitura.md': '## Vigência\n\nSuperado pela re-extração de 2026-10-01.\n',
      },
    })

    expect(lido.entradas[0]?.situacao).toBe('entregue-sem-adendo')
    expect(lido.entradas[0]?.adendo).toBeNull()
  })

  it('o adendo é casado pelo prefixo da pasta, como o contrato herdado faz', () => {
    const lido = historico([pasta('003-painel-do-processo', { actionsMd: acoesMd(61, 0) })], {
      addendaFiles: ['002-ponte.md', '003-painel-do-processo.md'],
      addendaBodies: { '002-ponte.md': 'x', '003-painel-do-processo.md': 'y' },
    })

    expect(lido.entradas[0]?.adendo).toBe(`${SAIDA}/addenda/003-painel-do-processo.md`)
  })

  it('pasta fora do padrão de nome não ganha adendo por engano', () => {
    const lido = historico([pasta('rascunho', { actionsMd: acoesMd(1, 0) })], {
      addendaFiles: ['001-leitura.md'],
      addendaBodies: { '001-leitura.md': 'x' },
    })

    expect(lido.entradas[0]?.id).toBeNull()
    expect(lido.entradas[0]?.adendo).toBeNull()
  })
})

describe('as três marcas (D-19)', () => {
  it('ativa: a pasta é a feature ativa declarada', () => {
    const lido = historico([pasta('006-cartoes')], {
      activeFeatureDir: `${FORWARD}/006-cartoes`,
    })
    expect(lido.entradas[0]?.marca).toBe('ativa')
  })

  it('pausada: a pasta consta da fila de pausadas', () => {
    const lido = historico([pasta('002-ponte', { actionsMd: acoesMd(30, 2) })], {
      pausedFeatureDirs: [`${FORWARD}/002-ponte`],
    })
    expect(lido.entradas[0]?.marca).toBe('pausada')
  })

  it('nenhuma: nem uma coisa nem outra', () => {
    const lido = historico([pasta('001-leitura')], { activeFeatureDir: `${FORWARD}/006-cartoes` })
    expect(lido.entradas[0]?.marca).toBe('nenhuma')
  })

  it('a marca não altera a situação, que é o outro eixo', () => {
    const lido = historico([pasta('002-ponte', { actionsMd: acoesMd(30, 2) })], {
      pausedFeatureDirs: [`${FORWARD}/002-ponte`],
    })
    expect(lido.entradas[0]?.marca).toBe('pausada')
    expect(lido.entradas[0]?.situacao).toBe('em-aberto')
  })

  it('a feature pausada aparece no histórico, jamais omitida (RN-06)', () => {
    const lido = historico([pasta('001-a'), pasta('002-b')], {
      pausedFeatureDirs: [`${FORWARD}/002-b`],
    })
    expect(lido.entradas).toHaveLength(2)
  })
})

describe('ordenação decrescente por nome de pasta (D-16)', () => {
  it('põe a mais recente em primeiro', () => {
    const lido = historico([pasta('001-a'), pasta('003-c'), pasta('002-b')])
    expect(lido.entradas.map((e) => e.nomeCurto)).toEqual(['c', 'b', 'a'])
  })

  it('separa identificador e nome curto quando a pasta segue o padrão', () => {
    const lido = historico([pasta('006-cartoes-e-cronologia')])
    expect(lido.entradas[0]?.id).toBe('006')
    expect(lido.entradas[0]?.nomeCurto).toBe('cartoes-e-cronologia')
  })

  it('não inventa identificador para pasta fora do padrão', () => {
    const lido = historico([pasta('rascunho-antigo')])
    expect(lido.entradas[0]?.id).toBeNull()
    expect(lido.entradas[0]?.nomeCurto).toBe('rascunho-antigo')
  })
})

describe('o resumo, em três degraus (D-18)', () => {
  const ADENDO = [
    '# Adendo: painel',
    '',
    '## Vigência',
    '',
    'Vigente desde 2026-09-09.',
    '',
    '## Resumo da entrega',
    '',
    'A feature entrega a tela.',
    'Segunda linha, que não entra.',
    '',
  ].join('\n')

  const REQUISITOS = [
    '# Requirements: painel',
    '',
    '## 1. Resumo executivo',
    '',
    'O painel mostra o processo. E também outra coisa.',
    '',
  ].join('\n')

  it('primeiro degrau: a primeira frase da seção de resumo do adendo', () => {
    const lido = historico([pasta('003-painel', { actionsMd: acoesMd(1, 0), requirementsMd: REQUISITOS })], {
      addendaFiles: ['003-painel.md'],
      addendaBodies: { '003-painel.md': ADENDO },
    })

    expect(lido.entradas[0]?.resumo).toBe('A feature entrega a tela.')
  })

  it('desfaz a quebra dura antes de cortar a frase, nas duas fontes', () => {
    // REVERSA quebra a prosa na coluna, e a quebra não é pontuação: ler só a
    // primeira linha física devolvia frase pela metade na tela.
    const dobrado = [
      '## Resumo da entrega',
      '',
      'A feature fecha o regime pelo qual código de fora vive dentro',
      'deste repositório. As features 001 a 003 deixaram o registro.',
      '',
    ].join('\n')

    const lido = historico([pasta('004-heranca', { actionsMd: acoesMd(1, 0) })], {
      addendaFiles: ['004-heranca.md'],
      addendaBodies: { '004-heranca.md': dobrado },
    })

    expect(lido.entradas[0]?.resumo).toBe(
      'A feature fecha o regime pelo qual código de fora vive dentro deste repositório.',
    )
  })

  it('não atravessa a linha em branco que fecha o parágrafo', () => {
    const doisParagrafos = [
      '## 1. Resumo executivo',
      '',
      'O painel mostra o processo',
      '',
      'E este parágrafo é outro assunto.',
      '',
    ].join('\n')

    const lido = historico([pasta('003-painel', { requirementsMd: doisParagrafos })])
    expect(lido.entradas[0]?.resumo).toBe('O painel mostra o processo')
  })

  it('segundo degrau: a primeira frase do resumo executivo do `requirements.md`', () => {
    const lido = historico([pasta('003-painel', { requirementsMd: REQUISITOS })])
    expect(lido.entradas[0]?.resumo).toBe('O painel mostra o processo.')
  })

  it('terceiro degrau: nulo, e a tela mostra o nome curto', () => {
    const lido = historico([pasta('003-painel')])
    expect(lido.entradas[0]?.resumo).toBeNull()
  })

  it('adendo sem seção de resumo cai para o requisito, e não para o vazio', () => {
    const lido = historico([pasta('003-painel', { requirementsMd: REQUISITOS })], {
      addendaFiles: ['003-painel.md'],
      addendaBodies: { '003-painel.md': '# Adendo\n\n## Vigência\n\nVigente.\n' },
    })

    expect(lido.entradas[0]?.resumo).toBe('O painel mostra o processo.')
  })
})

describe('o instante do último evento da trilha', () => {
  const TRILHA = [
    '{"ts":"2026-09-09T10:00:00Z","action":"T001","status":"done","files":[]}',
    '{"ts":"2026-09-09T12:00:00Z","action":"T002","status":"done","files":[]}',
    '{"ts":"2026-09-09T11:00:00Z","action":"T003","status":"done","files":[]}',
    '',
  ].join('\n')

  it('é o maior instante presente, em forma absoluta', () => {
    const lido = historico([pasta('001-a', { progressJsonl: TRILHA })])
    expect(lido.entradas[0]?.ultimoEvento).toBe('2026-09-09T12:00:00Z')
  })

  it('é nulo quando não há trilha, e a tela declara a ausência', () => {
    expect(historico([pasta('001-a')]).entradas[0]?.ultimoEvento).toBeNull()
  })

  it('é nulo quando a trilha existe mas nenhum evento registrou momento', () => {
    const lido = historico([
      pasta('001-a', { progressJsonl: '{"action":"T001","status":"done"}\n' }),
    ])
    expect(lido.entradas[0]?.ultimoEvento).toBeNull()
  })

  it('não lança diante de trilha corrompida', () => {
    expect(() => historico([pasta('001-a', { progressJsonl: 'isso não é json\n' })])).not.toThrow()
  })
})

describe('truncamento e contagem', () => {
  it('repassa o truncamento e o total que a sonda relatou', () => {
    const lido = historico([pasta('001-a')], { truncado: true, total: 53 })
    expect(lido.truncado).toBe(true)
    expect(lido.total).toBe(53)
  })

  it('projeto sem pasta alguma devolve histórico vazio, sem lançar', () => {
    expect(historico([])).toEqual({ entradas: [], truncado: false, total: 0 })
  })
})
