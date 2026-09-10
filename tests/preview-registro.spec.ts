/**
 * O auxiliar que adoece o registro de bugs para o preview (T036, RF-13, RF-15,
 * RN-02, RN-04, D-11).
 *
 * O que se confere aqui não é a tela: é que cada um dos quatro casos produz DE
 * FATO o estado que promete quando a leitura de verdade passa por cima da
 * cópia. Um auxiliar que plantasse um bug mal formado adoeceria o registro pelo
 * motivo errado, e quem conferisse a tela estaria conferindo outra coisa.
 *
 * A cópia sai numa pasta temporária do sistema, a partir de um workspace mínimo
 * que este arquivo monta, e é apagada ao fim. Nada do repositório é tocado.
 * @module tests/preview-registro
 */

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import { readBugs } from '../src/domain/bugs.ts'
import { BUG_CAP } from '../src/domain/limits.ts'
import type { BugRegistry } from '../src/domain/types.ts'
import { readBugFolders } from '../src/probe/bugs.ts'
import { ACIMA_DO_TETO, CASOS, CONTEXTO, principal } from '../scripts/estragar-registro.js'

/** As cópias feitas nesta suíte, para apagá-las ao fim. */
const feitas: string[] = []

/** Um workspace mínimo com registro instalado e nenhum bug dentro dele. */
function origem(): string {
  const raiz = mkdtempSync(path.join(tmpdir(), 'reversa-views-origem-'))
  mkdirSync(path.join(raiz, '_reversa_bugs', 'painel-do-processo', 'bugs'), { recursive: true })
  writeFileSync(path.join(raiz, '_reversa_bugs', 'README.md'), 'registro de bugs\n')
  feitas.push(raiz)
  return raiz
}

/** Roda o auxiliar sobre um workspace mínimo e lê o registro da cópia. */
function estragado(caso: string): BugRegistry {
  const raiz = origem()
  const saidas: string[] = []
  const escrever = process.stdout.write.bind(process.stdout)
  const silenciar = process.stderr.write.bind(process.stderr)
  process.stdout.write = ((texto: string) => {
    saidas.push(texto)
    return true
  }) as typeof process.stdout.write
  process.stderr.write = (() => true) as typeof process.stderr.write

  let codigo: number
  try {
    codigo = principal([`--workspace=${raiz}`, `--caso=${caso}`], raiz)
  } finally {
    process.stdout.write = escrever
    process.stderr.write = silenciar
  }

  expect(codigo).toBe(0)
  const copia = saidas.join('').trim()
  feitas.push(copia)
  return readBugs(readBugFolders({ root: copia }))
}

afterAll(() => {
  for (const pasta of feitas) rmSync(pasta, { recursive: true, force: true })
})

describe('o auxiliar, antes de tocar em disco', () => {
  it('sabe produzir os quatro estados que nenhum projeto saudável produz', () => {
    expect(CASOS).toEqual(['ausente', 'restrito', 'inconsistente', 'teto'])
  })

  it('planta, no caso do teto, mais bugs do que o teto da leitura', () => {
    expect(ACIMA_DO_TETO).toBeGreaterThan(BUG_CAP)
  })

  it('recusa caso que não existe, sem copiar coisa alguma', () => {
    const erros: string[] = []
    const anterior = process.stderr.write.bind(process.stderr)
    process.stderr.write = ((texto: string) => {
      erros.push(texto)
      return true
    }) as typeof process.stderr.write
    try {
      expect(principal(['--caso=torto'], origem())).toBe(1)
    } finally {
      process.stderr.write = anterior
    }
    expect(erros.join('')).toContain('caso inválido')
  })
})

describe('cada caso produz o estado que promete', () => {
  it('ausente: a cópia perde a pasta do registro, e a leitura declara ausência', () => {
    const registro = estragado('ausente')
    expect(registro.presente).toBe(false)
    expect(registro.contagem.total).toBe(0)
    expect(registro.anomalias).toEqual([])
  })

  it('restrito: o bug omitido é contado e nada dele atravessa', () => {
    const registro = estragado('restrito')
    const grupo = registro.contextos.find((contexto) => contexto.contexto === CONTEXTO)
    expect(grupo?.contagem.restritos).toBe(1)
    expect(grupo?.contagem.total).toBe(2)
    expect(grupo?.bugs).toHaveLength(1)
    const inteiro = JSON.stringify(registro)
    expect(inteiro).not.toContain('BUG-20260102-BBBB')
    expect(inteiro).not.toContain('não pode chegar à tela')
  })

  it('inconsistente: as duas assimetrias da trava aparecem, uma de cada tipo', () => {
    const registro = estragado('inconsistente')
    const grupo = registro.contextos.find((contexto) => contexto.contexto === CONTEXTO)
    const achadas = (grupo?.bugs ?? []).map((bug) => bug.inconsistencia).sort()
    expect(achadas).toEqual(['resolvido-sem-trava', 'trava-sem-resolvido'])
  })

  it('teto: existe mais do que se leu, e a leitura diz que parou', () => {
    const registro = estragado('teto')
    expect(registro.truncado).toBe(true)
    expect(registro.contagem.total).toBe(ACIMA_DO_TETO)
    expect(registro.lidos).toBe(BUG_CAP)
  })
})
