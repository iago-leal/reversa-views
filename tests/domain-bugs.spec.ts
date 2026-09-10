/**
 * A sonda do registro e o julgamento do que ela leu (D-01, D-11, D-12, D-13,
 * D-14, D-15, RN-02, RN-04, RN-05, RN-09, RF-15, RF-16).
 *
 * O par repete o corte que a casa já faz entre olhar e decidir: `probe/bugs.ts`
 * varre e não julga, `domain/bugs.ts` julga e não lê disco. A suíte exercita os
 * dois juntos sobre árvore de verdade, numa pasta temporária, porque metade do
 * que se verifica aqui é justamente o encontro com o disco: onde a varredura
 * desce, onde ela não desce, o teto, e a pasta que não existe.
 *
 * A árvore é sintética de propósito. O registro real deste projeto tem um
 * contexto e três bugs, todos resolvidos e todos com trava, o que não alcança
 * nem dois contextos, nem teto estourado, nem inconsistência. Material real é o
 * que a suíte do interpretador exercita; material sintético é o que alcança os
 * estados que nenhum projeto saudável produz.
 * @module tests/domain-bugs
 */

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { readBugs } from '../src/domain/bugs.ts'
import { BUG_CAP, BUGS_FOLDER } from '../src/domain/limits.ts'
import { readBugFolders } from '../src/probe/bugs.ts'

const criadas: string[] = []

afterEach(() => {
  while (criadas.length > 0) rmSync(criadas.pop() as string, { recursive: true, force: true })
})

/** O que um bug sintético declara; tudo tem padrão utilizável. */
interface BugSintetico {
  id?: string | null
  apelido?: number
  titulo?: string
  status?: string
  phase?: string
  severity?: string
  priority?: string
  created?: string
  updated?: string
  visibility?: string
  blocking?: string
  /** Presença da trava; a data vai na linha `Data:`. */
  trava?: boolean
  /** A data escrita na trava; nula grava a trava sem linha de data. */
  dataDaTrava?: string | null
  /** Substitui o `bug.md` inteiro, para os casos de arquivo estragado. */
  bruto?: string
}

/** O front matter de um bug sintético, na forma que o registrador escreve. */
function bugMd(bug: BugSintetico): string {
  if (bug.bruto !== undefined) return bug.bruto
  const linhas = ['---', 'schema_version: 1']
  if (bug.id !== null) linhas.push(`id: ${bug.id ?? 'BUG-20260910-XXXX'}`)
  linhas.push(
    `display_number: ${bug.apelido ?? 1}`,
    `title: ${bug.titulo ?? 'Um defeito sintético'}`,
    `status: ${bug.status ?? 'open'}`,
    `phase: ${bug.phase ?? 'triaging'}`,
    `severity: ${bug.severity ?? 'low'}`,
    `priority: ${bug.priority ?? 'P3'}`,
    `created: ${bug.created ?? '2026-09-01'}`,
    `updated: ${bug.updated ?? '2026-09-01'}`,
    `visibility: ${bug.visibility ?? 'normal'}`,
    `blocking: ${bug.blocking ?? '[]'}`,
    '---',
    '',
    '# Um defeito sintético',
    '',
  )
  return linhas.join('\n')
}

/** A trava, na forma que o `/reversa-debugger-fix` grava. */
function travaMd(data: string | null): string {
  const linhas = ['# Bug encerrado', '']
  if (data !== null) linhas.push(`Data: ${data}`)
  linhas.push('resolution_kind: fixed', '')
  return linhas.join('\n')
}

/**
 * Uma raiz temporária com os contextos e bugs pedidos.
 * @param contextos - por nome de contexto, os bugs por nome de pasta.
 * @param extras - arquivos avulsos, relativos à raiz, para as pastas que a
 *   varredura precisa ignorar.
 * @returns a raiz absoluta.
 */
function raizCom(
  contextos: Record<string, Record<string, BugSintetico>>,
  extras: Record<string, string> = {},
): string {
  const raiz = mkdtempSync(join(tmpdir(), 'reversa-bugs-'))
  criadas.push(raiz)

  for (const [contexto, bugs] of Object.entries(contextos)) {
    const pastaDoContexto = join(raiz, BUGS_FOLDER, contexto)
    mkdirSync(pastaDoContexto, { recursive: true })
    for (const [nome, bug] of Object.entries(bugs)) {
      const pasta = join(pastaDoContexto, 'bugs', nome)
      mkdirSync(pasta, { recursive: true })
      writeFileSync(join(pasta, 'bug.md'), bugMd(bug), 'utf8')
      if (bug.trava === true) {
        writeFileSync(
          join(pasta, 'DONE.md'),
          travaMd(bug.dataDaTrava === undefined ? '2026-09-10' : bug.dataDaTrava),
          'utf8',
        )
      }
    }
  }

  for (const [relativo, conteudo] of Object.entries(extras)) {
    const destino = join(raiz, relativo)
    mkdirSync(join(destino, '..'), { recursive: true })
    writeFileSync(destino, conteudo, 'utf8')
  }
  return raiz
}

/** Uma raiz sem a pasta do registro. */
function raizVazia(): string {
  const raiz = mkdtempSync(join(tmpdir(), 'reversa-bugs-'))
  criadas.push(raiz)
  return raiz
}

/** Sonda e julgamento numa chamada, que é como o host os encadeia. */
function registroDe(raiz: string) {
  return readBugs(readBugFolders({ root: raiz }))
}

describe('contexto único (RN-09)', () => {
  it('agrupa os bugs sob o nome do contexto, com o caminho relativo à raiz', () => {
    const raiz = raizCom({ 'painel-do-processo': { 'BUG-1': {}, 'BUG-2': {} } })
    const registro = registroDe(raiz)

    expect(registro.presente).toBe(true)
    expect(registro.contextos).toHaveLength(1)
    expect(registro.contextos[0].contexto).toBe('painel-do-processo')
    expect(registro.contextos[0].pasta).toBe(`${BUGS_FOLDER}/painel-do-processo`)
    expect(registro.contextos[0].bugs).toHaveLength(2)
  })

  it('nomeia o arquivo de cada bug pelo caminho que a mensagem de abrir recebe (RF-09)', () => {
    const raiz = raizCom({ contexto: { 'BUG-20260910-AAAA': {} } })
    const bug = registroDe(raiz).contextos[0].bugs[0]

    expect(bug.pasta).toBe(`${BUGS_FOLDER}/contexto/bugs/BUG-20260910-AAAA`)
    expect(bug.arquivo).toBe(`${BUGS_FOLDER}/contexto/bugs/BUG-20260910-AAAA/bug.md`)
  })

  it('lê os campos do front matter e a trava de cada bug', () => {
    const raiz = raizCom({
      contexto: {
        'BUG-1': {
          id: 'BUG-20260901-AAAA',
          apelido: 7,
          titulo: 'Desconto aplicado duas vezes',
          status: 'resolved',
          phase: 'delivering',
          severity: 'high',
          priority: 'P1',
          created: '2026-09-01',
          updated: '2026-09-05',
          trava: true,
          dataDaTrava: '2026-09-06',
        },
      },
    })
    const bug = registroDe(raiz).contextos[0].bugs[0]

    expect(bug.id).toBe('BUG-20260901-AAAA')
    expect(bug.apelido).toBe(7)
    expect(bug.titulo).toBe('Desconto aplicado duas vezes')
    expect(bug.estado).toBe('resolved')
    expect(bug.fase).toBe('delivering')
    expect(bug.severidade).toBe('high')
    expect(bug.prioridade).toBe('P1')
    expect(bug.registrado).toBe('2026-09-01')
    expect(bug.alterado).toBe('2026-09-05')
    expect(bug.travado).toBe(true)
    expect(bug.encerrado).toBe('2026-09-06')
    expect(bug.bloqueado).toBe(false)
    expect(bug.inconsistencia).toBeNull()
  })

  it('conta o contexto por estado, e o projeto à parte (RN-09)', () => {
    const raiz = raizCom({
      contexto: {
        'BUG-1': { status: 'open' },
        'BUG-2': { status: 'active' },
        'BUG-3': { status: 'resolved', trava: true },
      },
    })
    const registro = registroDe(raiz)

    expect(registro.contextos[0].contagem).toEqual({
      total: 3,
      abertos: 1,
      ativos: 1,
      resolvidos: 1,
      restritos: 0,
    })
    expect(registro.contagem).toEqual({
      total: 3,
      abertos: 1,
      ativos: 1,
      resolvidos: 1,
      restritos: 0,
    })
  })
})

describe('dois contextos', () => {
  it('mantém cada bug no grupo a que pertence, e nenhum fora dele (RF-04)', () => {
    const raiz = raizCom({
      alfa: { 'BUG-A': { id: 'BUG-A' } },
      beta: { 'BUG-B': { id: 'BUG-B' }, 'BUG-C': { id: 'BUG-C' } },
    })
    const registro = registroDe(raiz)
    const porContexto = Object.fromEntries(
      registro.contextos.map((grupo) => [grupo.contexto, grupo.bugs.map((bug) => bug.id)]),
    )

    expect(porContexto).toEqual({ alfa: ['BUG-A'], beta: ['BUG-B', 'BUG-C'] })
  })

  it('a contagem do projeto soma os dois, e a de cada grupo conta só o seu', () => {
    const raiz = raizCom({
      alfa: { 'BUG-A': { status: 'open' } },
      beta: { 'BUG-B': { status: 'resolved', trava: true }, 'BUG-C': { status: 'active' } },
    })
    const registro = registroDe(raiz)
    const grupo = (nome: string) =>
      registro.contextos.find((contexto) => contexto.contexto === nome)

    expect(registro.contagem.total).toBe(3)
    expect(grupo('alfa')?.contagem.total).toBe(1)
    expect(grupo('beta')?.contagem.total).toBe(2)
    expect(grupo('beta')?.contagem.resolvidos).toBe(1)
  })

  it('declara o último movimento de cada grupo, que é a maior data de alteração dele', () => {
    const raiz = raizCom({
      alfa: { 'BUG-A': { updated: '2026-09-02' }, 'BUG-B': { updated: '2026-09-07' } },
      beta: { 'BUG-C': { updated: '2026-09-04' } },
    })
    const registro = registroDe(raiz)
    const grupo = (nome: string) =>
      registro.contextos.find((contexto) => contexto.contexto === nome)

    expect(grupo('alfa')?.ultimoMovimento).toBe('2026-09-07')
    expect(grupo('beta')?.ultimoMovimento).toBe('2026-09-04')
  })

  it('grupo sem data alguma declara movimento ausente, em vez de inventar um', () => {
    const raiz = raizCom({ alfa: { 'BUG-A': { updated: '' } } })
    expect(registroDe(raiz).contextos[0].ultimoMovimento).toBeNull()
  })
})

describe('contexto sem pasta de bugs', () => {
  it('devolve o contexto sem bug algum, e sem anomalia (contrato, seção 5)', () => {
    const raiz = raizCom({ alfa: { 'BUG-A': {} } })
    mkdirSync(join(raiz, BUGS_FOLDER, 'beta'), { recursive: true })
    const registro = registroDe(raiz)
    const beta = registro.contextos.find((contexto) => contexto.contexto === 'beta')

    expect(beta).toBeDefined()
    expect(beta?.bugs).toEqual([])
    expect(beta?.contagem.total).toBe(0)
    expect(registro.anomalias).toEqual([])
  })

  it('arquivo solto na raiz do registro não vira contexto', () => {
    const raiz = raizCom({ alfa: { 'BUG-A': {} } }, { [`${BUGS_FOLDER}/README.md`]: '# registro' })
    const registro = registroDe(raiz)

    expect(registro.contextos.map((contexto) => contexto.contexto)).toEqual(['alfa'])
  })
})

describe('teto de bugs por passagem (RF-15, D-13)', () => {
  it('lê até o teto e declara quantos existem ao lado de quantos leu', () => {
    const bugs: Record<string, BugSintetico> = {}
    for (let i = 0; i < BUG_CAP + 10; i += 1) {
      bugs[`BUG-${String(i).padStart(3, '0')}`] = { id: `BUG-${i}` }
    }
    const registro = registroDe(raizCom({ contexto: bugs }))

    expect(registro.truncado).toBe(true)
    expect(registro.lidos).toBe(BUG_CAP)
    expect(registro.contagem.total).toBe(BUG_CAP + 10)
    expect(registro.contextos[0].bugs).toHaveLength(BUG_CAP)
  })

  it('abaixo do teto não declara truncamento, e lidos coincide com o total', () => {
    const registro = registroDe(raizCom({ contexto: { 'BUG-1': {}, 'BUG-2': {} } }))

    expect(registro.truncado).toBe(false)
    expect(registro.lidos).toBe(2)
    expect(registro.contagem.total).toBe(2)
  })

  it('o teto atravessa contextos: ele é da passagem, e não de cada grupo', () => {
    const bugs = (prefixo: string, quantos: number): Record<string, BugSintetico> => {
      const saida: Record<string, BugSintetico> = {}
      for (let i = 0; i < quantos; i += 1) saida[`${prefixo}-${String(i).padStart(3, '0')}`] = {}
      return saida
    }
    const registro = registroDe(
      raizCom({ alfa: bugs('A', BUG_CAP - 5), beta: bugs('B', 20) }),
    )

    expect(registro.lidos).toBe(BUG_CAP)
    expect(registro.contagem.total).toBe(BUG_CAP + 15)
    expect(registro.truncado).toBe(true)
  })
})

describe('registro ausente (RF-13)', () => {
  it('projeto sem a pasta do registro devolve registro ausente, sem anomalia', () => {
    const registro = registroDe(raizVazia())

    expect(registro.presente).toBe(false)
    expect(registro.contextos).toEqual([])
    expect(registro.contagem.total).toBe(0)
    expect(registro.anomalias).toEqual([])
  })

  it('pasta do registro presente e vazia é registro presente e sem contexto', () => {
    const raiz = raizVazia()
    mkdirSync(join(raiz, BUGS_FOLDER), { recursive: true })
    const registro = registroDe(raiz)

    expect(registro.presente).toBe(true)
    expect(registro.contextos).toEqual([])
    expect(registro.anomalias).toEqual([])
  })
})

describe('bug restrito (RN-02, RF-16, D-11)', () => {
  it('não entra na lista, e campo algum dele atravessa', () => {
    const raiz = raizCom({
      contexto: {
        'BUG-1': { id: 'BUG-VISIVEL', titulo: 'Este pode aparecer' },
        'BUG-2': {
          id: 'BUG-SECRETO',
          titulo: 'Este título não pode aparecer em view alguma',
          visibility: 'restricted',
        },
      },
    })
    const registro = registroDe(raiz)
    const serializado = JSON.stringify(registro)

    expect(registro.contextos[0].bugs.map((bug) => bug.id)).toEqual(['BUG-VISIVEL'])
    expect(serializado).not.toContain('BUG-SECRETO')
    expect(serializado).not.toContain('Este título não pode aparecer')
  })

  it('continua contado no total, e a omissão é declarada por nome', () => {
    const raiz = raizCom({
      contexto: { 'BUG-1': {}, 'BUG-2': { visibility: 'restricted' } },
    })
    const registro = registroDe(raiz)

    expect(registro.contagem.total).toBe(2)
    expect(registro.contagem.restritos).toBe(1)
    expect(registro.contextos[0].contagem.restritos).toBe(1)
    expect(registro.contextos[0].contagem.total).toBe(2)
  })

  it('não movimenta o grupo: a data de um restrito não vira último movimento', () => {
    const raiz = raizCom({
      contexto: {
        'BUG-1': { updated: '2026-09-02' },
        'BUG-2': { updated: '2026-09-20', visibility: 'restricted' },
      },
    })
    expect(registroDe(raiz).contextos[0].ultimoMovimento).toBe('2026-09-02')
  })
})

describe('as duas assimetrias da trava (RN-04)', () => {
  it('resolvido sem trava é declarado, e não resolvido em silêncio', () => {
    const raiz = raizCom({ contexto: { 'BUG-1': { status: 'resolved', trava: false } } })
    const registro = registroDe(raiz)
    const bug = registro.contextos[0].bugs[0]

    expect(bug.estado).toBe('resolved')
    expect(bug.travado).toBe(false)
    expect(bug.inconsistencia).toBe('resolvido-sem-trava')
    expect(registro.anomalias.map((anomalia) => anomalia.code)).toContain('bug-inconsistente')
  })

  it('trava sem resolvido é declarada, e o painel não escolhe entre as duas leituras', () => {
    const raiz = raizCom({ contexto: { 'BUG-1': { status: 'open', trava: true } } })
    const bug = registroDe(raiz).contextos[0].bugs[0]

    expect(bug.estado).toBe('open')
    expect(bug.travado).toBe(true)
    expect(bug.encerrado).toBe('2026-09-10')
    expect(bug.inconsistencia).toBe('trava-sem-resolvido')
  })

  it('a anomalia nomeia qual das duas assimetrias é', () => {
    const raiz = raizCom({ contexto: { 'BUG-1': { status: 'resolved' } } })
    const anomalia = registroDe(raiz).anomalias.find((item) => item.code === 'bug-inconsistente')

    expect(anomalia?.detail).toContain('resolvido-sem-trava')
    expect(anomalia?.file).toContain('bug.md')
  })

  it('resolvido com trava não é inconsistência alguma', () => {
    const raiz = raizCom({ contexto: { 'BUG-1': { status: 'resolved', trava: true } } })
    const registro = registroDe(raiz)

    expect(registro.contextos[0].bugs[0].inconsistencia).toBeNull()
    expect(registro.anomalias).toEqual([])
  })
})

describe('cada perda vira anomalia nomeada (RF-12)', () => {
  it('arquivo sem front matter', () => {
    const raiz = raizCom({ contexto: { 'BUG-1': { bruto: '# só o corpo\n' } } })
    const registro = registroDe(raiz)

    expect(registro.anomalias.map((anomalia) => anomalia.code)).toContain('bug-sem-front-matter')
  })

  it('bloco truncado', () => {
    const raiz = raizCom({ contexto: { 'BUG-1': { bruto: '---\nid: BUG-1\nstatus: open\n' } } })
    const registro = registroDe(raiz)

    expect(registro.anomalias.map((anomalia) => anomalia.code)).toContain('front-matter-ilegivel')
  })

  it('bloco lido sem identificador, com a linha ainda desenhada pela pasta', () => {
    const raiz = raizCom({ contexto: { 'BUG-1': { id: null } } })
    const registro = registroDe(raiz)

    expect(registro.anomalias.map((anomalia) => anomalia.code)).toContain('bug-sem-identificador')
    expect(registro.contextos[0].bugs).toHaveLength(1)
    expect(registro.contextos[0].bugs[0].id).toBeNull()
    expect(registro.contextos[0].bugs[0].pasta).toContain('BUG-1')
  })

  it('estado, fase e severidade fora do vocabulário, com o valor bruto preservado', () => {
    const raiz = raizCom({
      contexto: {
        'BUG-1': { status: 'quase-resolvido', phase: 'quase-la', severity: 'gravissimo' },
      },
    })
    const registro = registroDe(raiz)
    const bug = registro.contextos[0].bugs[0]
    const codigos = registro.anomalias.map((anomalia) => anomalia.code)

    expect(codigos).toContain('estado-de-bug-desconhecido')
    expect(codigos).toContain('fase-de-bug-desconhecida')
    expect(codigos).toContain('severidade-de-bug-desconhecida')
    expect(bug.estado).toBeNull()
    expect(bug.estadoBruto).toBe('quase-resolvido')
    expect(bug.faseBruta).toBe('quase-la')
    expect(bug.severidadeBruta).toBe('gravissimo')
  })

  it('data fora da forma de data, com a linha declarando a data ausente', () => {
    const raiz = raizCom({ contexto: { 'BUG-1': { created: 'ontem', updated: '10/09/2026' } } })
    const registro = registroDe(raiz)
    const bug = registro.contextos[0].bugs[0]

    expect(registro.anomalias.map((anomalia) => anomalia.code)).toContain('data-de-bug-invalida')
    expect(bug.registrado).toBeNull()
    expect(bug.alterado).toBeNull()
  })

  it('trava sem linha de data: o encerramento continua sendo fato', () => {
    const raiz = raizCom({
      contexto: { 'BUG-1': { status: 'resolved', trava: true, dataDaTrava: null } },
    })
    const registro = registroDe(raiz)
    const bug = registro.contextos[0].bugs[0]

    expect(bug.travado).toBe(true)
    expect(bug.encerrado).toBeNull()
    expect(registro.anomalias.map((anomalia) => anomalia.code)).toContain('trava-sem-data')
  })

  it('bug.md ausente: anomalia, o bug fora da lista, e o resto desenhado', () => {
    const raiz = raizCom({ contexto: { 'BUG-1': {} } })
    mkdirSync(join(raiz, BUGS_FOLDER, 'contexto', 'bugs', 'BUG-2'), { recursive: true })
    const registro = registroDe(raiz)

    expect(registro.anomalias.map((anomalia) => anomalia.code)).toContain('bug-ilegivel')
    expect(registro.contextos[0].bugs).toHaveLength(1)
  })

  it('uma perda não derruba as outras leituras do mesmo contexto', () => {
    const raiz = raizCom({
      contexto: { 'BUG-1': { bruto: '# sem bloco\n' }, 'BUG-2': { id: 'BUG-INTEIRO' } },
    })
    const registro = registroDe(raiz)

    expect(registro.contextos[0].bugs.map((bug) => bug.id)).toContain('BUG-INTEIRO')
    expect(registro.anomalias.length).toBeGreaterThan(0)
  })

  it('toda anomalia traz arquivo e código, e o arquivo é caminho relativo à raiz', () => {
    const raiz = raizCom({ contexto: { 'BUG-1': { bruto: '---\nid: x\n' } } })
    for (const anomalia of registroDe(raiz).anomalias) {
      expect(anomalia.file.startsWith(BUGS_FOLDER)).toBe(true)
      expect(anomalia.code).toEqual(expect.any(String))
    }
  })
})

describe('bloqueio declarado (RF-10)', () => {
  it('lista vazia não bloqueia; lista com item bloqueia', () => {
    const raiz = raizCom({
      contexto: {
        'BUG-1': { id: 'BUG-LIVRE', blocking: '[]' },
        'BUG-2': { id: 'BUG-TRAVADO', blocking: '[{ kind: external, reason: espera }]' },
      },
    })
    const bugs = registroDe(raiz).contextos[0].bugs
    const por = (id: string) => bugs.find((bug) => bug.id === id)

    expect(por('BUG-LIVRE')?.bloqueado).toBe(false)
    expect(por('BUG-TRAVADO')?.bloqueado).toBe(true)
  })

  it('campo `blocking` ausente não bloqueia', () => {
    const raiz = raizCom({
      contexto: { 'BUG-1': { bruto: '---\nid: BUG-1\nstatus: open\n---\n' } },
    })
    expect(registroDe(raiz).contextos[0].bugs[0].bloqueado).toBe(false)
  })
})

describe('o julgamento não toca disco', () => {
  it('a mesma leitura julgada duas vezes devolve o mesmo registro', () => {
    const raiz = raizCom({ contexto: { 'BUG-1': {}, 'BUG-2': {} } })
    const lido = readBugFolders({ root: raiz })

    expect(JSON.stringify(readBugs(lido))).toBe(JSON.stringify(readBugs(lido)))
  })
})
