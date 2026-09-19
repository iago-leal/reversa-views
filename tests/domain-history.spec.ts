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

import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { readDeliveryLinks } from '../src/domain/delivery-link.ts'
import { readHistory } from '../src/domain/history.ts'
import { REVERSA_FILE_CAP } from '../src/heranca/reversa-probe/src/index.ts'
import { readFeatureFolders } from '../src/probe/features.ts'
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
    // A lista de anomalias do eixo da 010 vem sempre, vazia quando nada se
    // perdeu: um host novo nunca omite o campo (contrato, seção 3).
    expect(historico([])).toEqual({ entradas: [], truncado: false, total: 0, anomalias: [] })
  })
})

describe('o vínculo e as conferências de cada entrada (feature 010, RN-07, RF-06, RF-07)', () => {
  const fixture = (nome: string): string => readFileSync(`tests/fixtures/vinculo/${nome}.md`, 'utf8')
  const ADENDO = ['002-b-adendo.md']
  const CORPO = { '002-b-adendo.md': '## Resumo\n\nFeito.\n' }

  it('cada entrada traz o estado do vínculo e o registro de conferências', () => {
    const lido = historico([
      pasta('001-a'),
      pasta('002-b', {
        legacyImpactMd: fixture('impacto-seis-tabelas'),
        onboardingMd: fixture('onboarding-vinte-linhas'),
        naoLidos: [],
      }),
    ])
    const [b, a] = lido.entradas
    expect(b?.vinculo).toEqual({ estado: 'lido', arquivo: `${FORWARD}/002-b/legacy-impact.md`, tabelas: 6 })
    expect(b?.conferencias?.estado).toBe('lido')
    expect(b?.conferencias?.arquivo).toBe(`${FORWARD}/002-b/onboarding.md`)
    expect(b?.conferencias?.registradas).toBe(2)
    expect(b?.conferencias?.total).toBe(20)

    expect(a?.vinculo).toEqual({ estado: 'ausente', arquivo: null, tabelas: 0 })
    expect(a?.conferencias?.estado).toBe('sem-registro')
    expect(lido.anomalias).toEqual([])
  })

  it('usa o vínculo que a camada de leitura já extraiu, quando o recebe', () => {
    const pastas = [pasta('002-b', { legacyImpactMd: fixture('impacto-nome-nu'), naoLidos: [] })]
    const lido = readHistory({
      pastas,
      truncado: false,
      total: 1,
      activeFeatureDir: null,
      pausedFeatureDirs: [],
      addendaFiles: [],
      addendaBodies: {},
      outputFolder: SAIDA,
      vinculos: readDeliveryLinks(pastas),
    })
    expect(lido.entradas[0]?.vinculo?.tabelas).toBe(1)
  })

  it('reúne as anomalias do eixo em `anomalias`, na ordem das entradas', () => {
    const lido = historico([
      pasta('001-a', { onboardingMd: fixture('onboarding-sem-data'), naoLidos: [] }),
      pasta('002-b', { naoLidos: ['legacy-impact.md', 'onboarding.md'] }),
    ])
    expect(lido.anomalias?.map((anomalia) => [anomalia.file, anomalia.code])).toEqual([
      [`${FORWARD}/002-b/legacy-impact.md`, 'artefato-da-entrega-nao-lido'],
      [`${FORWARD}/002-b/onboarding.md`, 'artefato-da-entrega-nao-lido'],
      [`${FORWARD}/001-a/onboarding.md`, 'tabela-nao-reconhecida'],
    ])
    expect(lido.anomalias?.[0]?.detail).toContain('vínculo')
    expect(lido.entradas[0]?.vinculo?.estado).toBe('nao-lido')
    expect(lido.entradas[0]?.conferencias?.estado).toBe('nao-lido')
  })

  it('onboarding sem a seção e legacy-impact sem tabela não são anomalia', () => {
    const lido = historico([
      pasta('001-a', {
        onboardingMd: fixture('onboarding-sem-secao'),
        legacyImpactMd: fixture('impacto-sem-tabela'),
        naoLidos: [],
      }),
    ])
    expect(lido.anomalias).toEqual([])
    expect(lido.entradas[0]?.vinculo).toEqual({ estado: 'lido', arquivo: `${FORWARD}/001-a/legacy-impact.md`, tabelas: 0 })
  })

  it('pasta convergida com linhas pendentes continua `convergida` (RN-07)', () => {
    const lido = historico(
      [pasta('002-b', { actionsMd: acoesMd(3, 0), onboardingMd: fixture('onboarding-vinte-linhas'), naoLidos: [] })],
      { addendaFiles: ADENDO, addendaBodies: CORPO },
    )
    expect(lido.entradas[0]?.situacao).toBe('convergida')
    expect(lido.entradas[0]?.conferencias?.registradas).toBe(2)
    expect(lido.entradas[0]?.conferencias?.total).toBe(20)
  })

  /**
   * A feature nascida da extração greenfield não ganha regra própria (RN-08,
   * RF-09): sem adendo, a 001 é entrega à espera de convergência, como
   * qualquer outra, e nada no código distingue a primeira pasta.
   */
  it('a 001 greenfield sem adendo é `entregue-sem-adendo`, como qualquer outra', () => {
    const lido = historico([
      pasta('001-fechamento-mensal-mvp', {
        actionsMd: acoesMd(5, 0),
        legacyImpactMd: fixture('impacto-crases-varias'),
        onboardingMd: fixture('onboarding-sem-secao'),
        naoLidos: [],
      }),
    ])
    expect(lido.entradas[0]?.situacao).toBe('entregue-sem-adendo')
    expect(lido.entradas[0]?.conferencias?.estado).toBe('sem-registro')
  })

  it('tolera a pasta de uma sonda anterior, sem os campos novos', () => {
    const lido = historico([pasta('001-a')])
    expect(lido.entradas[0]?.vinculo?.estado).toBe('ausente')
    expect(lido.entradas[0]?.conferencias?.estado).toBe('sem-registro')
  })
})

/**
 * Arquivo presente e não lido não é arquivo ausente (bug nº 11,
 * BUG-20260919-3P7S, EC-06). A sonda local já distingue os dois pela listagem;
 * o julgamento tem de dizer a perda, e a situação não pode afirmar "sem ações"
 * de um arquivo que ela não leu.
 */
describe('arquivo da pasta presente e não lido (bug nº 11, EC-06)', () => {
  it('reprodução: `actions.md` acima do teto sai `acoes-nao-lidas`, com a anomalia que nomeia o arquivo', () => {
    const raiz = mkdtempSync(join(tmpdir(), 'reversa-bug11-'))
    try {
      const dir = join(raiz, FORWARD, '001-grande')
      mkdirSync(dir, { recursive: true })
      const linha = `| T1 | ${'x'.repeat(200)} | \`[X]\` |\n`
      const linhas = linha.repeat(Math.ceil(REVERSA_FILE_CAP / linha.length) + 1)
      writeFileSync(join(dir, 'actions.md'), `# Actions\n\n| ID | Descrição | Status |\n|--|--|--|\n${linhas}`)

      const lido = historico(readFeatureFolders({ root: raiz, forwardFolder: FORWARD }).pastas)

      expect(lido.entradas[0]?.situacao).toBe('acoes-nao-lidas')
      expect(lido.anomalias).toEqual([
        expect.objectContaining({ file: `${FORWARD}/001-grande/actions.md`, code: 'artefato-da-entrega-nao-lido' }),
      ])
      expect(lido.anomalias?.[0]?.detail).toContain('ações')
    } finally {
      rmSync(raiz, { recursive: true, force: true })
    }
  })

  it('`acoes-nao-lidas` vale para qualquer `actions.md` que a sonda marcou como não lido', () => {
    const lido = historico([pasta('001-a', { naoLidos: ['actions.md'] })], {
      addendaFiles: ['001-a.md'],
      addendaBodies: { '001-a.md': 'vigente' },
    })
    expect(lido.entradas[0]?.situacao).toBe('acoes-nao-lidas')
  })

  it('`requirements.md` e `progress.jsonl` não lidos viram anomalia, sem mudar a situação de ações lidas', () => {
    const lido = historico([
      pasta('002-b', { actionsMd: acoesMd(3, 0), naoLidos: ['requirements.md', 'progress.jsonl'] }),
    ])
    expect(lido.entradas[0]?.situacao).toBe('entregue-sem-adendo')
    expect(lido.anomalias?.map((anomalia) => [anomalia.file, anomalia.code])).toEqual([
      [`${FORWARD}/002-b/requirements.md`, 'artefato-da-entrega-nao-lido'],
      [`${FORWARD}/002-b/progress.jsonl`, 'artefato-da-entrega-nao-lido'],
    ])
    expect(lido.anomalias?.[0]?.detail).toContain('resumo')
    expect(lido.anomalias?.[1]?.detail).toContain('último evento')
  })

  it('as perdas da pasta vêm na ordem dos arquivos, antes das do vínculo e das conferências', () => {
    const lido = historico([
      pasta('002-b', {
        naoLidos: ['onboarding.md', 'progress.jsonl', 'legacy-impact.md', 'requirements.md', 'actions.md'],
      }),
    ])
    expect(lido.anomalias?.map((anomalia) => anomalia.file)).toEqual([
      `${FORWARD}/002-b/actions.md`,
      `${FORWARD}/002-b/requirements.md`,
      `${FORWARD}/002-b/progress.jsonl`,
      `${FORWARD}/002-b/legacy-impact.md`,
      `${FORWARD}/002-b/onboarding.md`,
    ])
  })

  it('pasta sem `actions.md` e arquivo sem linha de ação seguem `sem-acoes`, sem anomalia', () => {
    const lido = historico([
      pasta('006-a', { naoLidos: [] }),
      pasta('007-b', { actionsMd: '# Actions\n\nsó prosa\n', naoLidos: [] }),
    ])
    expect(lido.entradas.map((entrada) => entrada.situacao)).toEqual(['sem-acoes', 'sem-acoes'])
    expect(lido.anomalias).toEqual([])
  })
})
