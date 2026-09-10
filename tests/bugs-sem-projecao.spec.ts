/**
 * A leitura do registro não consome projeção (RF-11, D-12).
 *
 * `generated/` é regenerável e só existe depois que alguém manda regerá-la. Um
 * painel que a lesse mostraria o passado sem dizer que é passado, e a defasagem
 * apareceria como se fosse o estado atual do registro. A regra é fácil de
 * escrever e fácil de quebrar sem querer, porque a projeção é justamente a
 * forma mais cômoda de ler o registro: `catalog.jsonl` já traz tudo em linhas
 * de JSON.
 *
 * Por isso a suíte não se contenta em comparar duas leituras. Ela ESPIONA as
 * três funções pelas quais a sonda alcança o disco, e recusa qualquer caminho
 * que desça em `generated/`, `intake/` ou `inspections/`. Comparar leituras
 * prova que o resultado não mudou; espionar prova que o arquivo não foi aberto,
 * e é a segunda afirmação que RF-11 faz.
 * @module tests/bugs-sem-projecao
 */

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/** Todo caminho que a sonda pediu ao disco, em qualquer das três funções. */
const tocados: string[] = []

vi.mock('../src/heranca/reversa-probe/src/index.ts', async (importOriginal) => {
  const real = await importOriginal<typeof import('../src/heranca/reversa-probe/src/index.ts')>()
  return {
    ...real,
    listNames: (abs: string) => {
      tocados.push(abs)
      return real.listNames(abs)
    },
    readText: (abs: string, cap?: number) => {
      tocados.push(abs)
      return real.readText(abs, cap)
    },
    resolveInside: (root: string, candidate: string) => {
      tocados.push(candidate)
      return real.resolveInside(root, candidate)
    },
  }
})

const { readBugs } = await import('../src/domain/bugs.ts')
const { BUGS_FOLDER } = await import('../src/domain/limits.ts')
const { readBugFolders } = await import('../src/probe/bugs.ts')

/** As três pastas do registro em que a varredura não pode sequer descer. */
const PROIBIDAS = ['generated', 'intake', 'inspections']

const criadas: string[] = []
let raiz: string

/** O front matter de um bug sintético, curto porque o conteúdo não importa aqui. */
function bugMd(id: string, updated: string): string {
  return [
    '---',
    'schema_version: 1',
    `id: ${id}`,
    'display_number: 1',
    `title: Defeito ${id}`,
    'status: resolved',
    'phase: delivering',
    'severity: low',
    'priority: P2',
    'created: 2026-09-01',
    `updated: ${updated}`,
    'visibility: normal',
    'blocking: []',
    '---',
    '',
  ].join('\n')
}

/** Um registro com projeção cheia, do jeito que o registrador o deixa. */
function instalarRegistro(comProjecao: boolean): void {
  const contexto = join(raiz, BUGS_FOLDER, 'painel-do-processo')
  for (const [nome, updated] of [
    ['BUG-20260909-AAAA', '2026-09-09'],
    ['BUG-20260910-BBBB', '2026-09-10'],
  ] as const) {
    const pasta = join(contexto, 'bugs', nome)
    mkdirSync(pasta, { recursive: true })
    writeFileSync(join(pasta, 'bug.md'), bugMd(nome, updated), 'utf8')
    writeFileSync(join(pasta, 'DONE.md'), `# Bug encerrado\n\nData: ${updated}\n`, 'utf8')
    // Pastas que o contrato lista como não lidas, dentro da pasta do bug.
    mkdirSync(join(pasta, 'evidence'), { recursive: true })
    writeFileSync(join(pasta, 'evidence', 'reproducao.txt'), 'ruído\n', 'utf8')
  }

  if (!comProjecao) return
  for (const proibida of PROIBIDAS) {
    const pasta = join(contexto, proibida)
    mkdirSync(pasta, { recursive: true })
    writeFileSync(
      join(pasta, 'catalog.jsonl'),
      `${JSON.stringify({ id: 'BUG-DA-PROJECAO', title: 'defasado' })}\n`,
      'utf8',
    )
    writeFileSync(join(pasta, 'graph.html'), '<html>projeção</html>\n', 'utf8')
  }
}

beforeEach(() => {
  tocados.length = 0
  raiz = mkdtempSync(join(tmpdir(), 'reversa-projecao-'))
  criadas.push(raiz)
})

afterEach(() => {
  while (criadas.length > 0) rmSync(criadas.pop() as string, { recursive: true, force: true })
})

describe('nenhum caminho da projeção é aberto (RF-11)', () => {
  it('a sonda não pede ao disco caminho algum sob generated, intake ou inspections', () => {
    instalarRegistro(true)
    readBugFolders({ root: raiz })

    expect(tocados.length, 'a espia não registrou leitura alguma').toBeGreaterThan(0)
    for (const caminho of tocados) {
      for (const proibida of PROIBIDAS) {
        expect(
          caminho.includes(`/${proibida}/`) || caminho.endsWith(`/${proibida}`),
          `a sonda tocou ${caminho}`,
        ).toBe(false)
      }
    }
  })

  it('não abre arquivo algum da pasta do bug além do bug.md e da trava (D-12)', () => {
    instalarRegistro(true)
    readBugFolders({ root: raiz })

    const abertos = tocados.filter((caminho) => /\.(md|jsonl|html|txt)$/.test(caminho))
    for (const caminho of abertos) {
      expect(/\/(bug\.md|DONE\.md)$/.test(caminho), `abriu ${caminho}`).toBe(true)
    }
  })

  it('a espia reconhece um caminho proibido quando ele de fato aparece', () => {
    // Sem este caso, uma comparação que não casa com nada passaria por guarda
    // para sempre. O que se verifica aqui é a guarda, e não a sonda.
    const amostra = join(raiz, BUGS_FOLDER, 'contexto', 'generated', 'catalog.jsonl')
    expect(amostra.includes('/generated/')).toBe(true)
  })
})

describe('a projeção não altera o que a leitura devolve (RF-11)', () => {
  it('com projeção e sem projeção, o registro é o mesmo', () => {
    instalarRegistro(true)
    const comProjecao = readBugs(readBugFolders({ root: raiz }))

    rmSync(join(raiz, BUGS_FOLDER, 'painel-do-processo', 'generated'), {
      recursive: true,
      force: true,
    })
    const semProjecao = readBugs(readBugFolders({ root: raiz }))

    expect(JSON.stringify(semProjecao)).toBe(JSON.stringify(comProjecao))
  })

  it('projeção defasada não injeta bug algum na leitura', () => {
    instalarRegistro(true)
    const registro = readBugs(readBugFolders({ root: raiz }))
    const ids = registro.contextos.flatMap((contexto) => contexto.bugs.map((bug) => bug.id))

    expect(ids).toEqual(['BUG-20260909-AAAA', 'BUG-20260910-BBBB'])
    expect(JSON.stringify(registro)).not.toContain('BUG-DA-PROJECAO')
  })

  it('registro sem projeção alguma lê normalmente, sem anomalia por essa falta', () => {
    instalarRegistro(false)
    const registro = readBugs(readBugFolders({ root: raiz }))

    expect(registro.presente).toBe(true)
    expect(registro.contagem.total).toBe(2)
    expect(registro.anomalias).toEqual([])
  })
})
