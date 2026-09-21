/**
 * A rodada inteira das fases, do aprendizado à promoção (feature 015, RF-12 a
 * RF-17), com o motor substituído por duplo e o mapa promovido sobre CÓPIA.
 *
 * As suítes dos auxiliares conferem cada peça; esta confere o que só existe na
 * rodada: que nada é escrito quando o motor cai depois de os checkpoints terem
 * passado, que aprender não toca o mapa, que a promoção escreve só o mapa, e
 * que os dois terminam com a contagem da raiz.
 * @module tests/equivalencias-rodada-fases
 */

import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { principal as aprender } from '../scripts/aprender-equivalencias.js'
import { gerarModulo, lerMapaDeModulo } from '../scripts/equivalencias/gerar-mapa.js'
import { principal as promover } from '../scripts/promover-equivalencias.js'
import { amostra, estado } from './helpers/fases-leitura.ts'

let raiz: string
let pasta: string
let saida: string
let destino: string

const SEM_MAPA = { pares: [], naoAgentes: [] }
const MODULO_DE_VERDADE = 'src/domain/equivalencias.ts'

/** Um projeto da raiz. */
function projeto(nome: string, stateJson: string): void {
  mkdirSync(join(raiz, nome, '.reversa'), { recursive: true })
  writeFileSync(join(raiz, nome, '.reversa', 'state.json'), stateJson)
}

/** Um motor que julga etapa todo nome, menos os recusados, e junta os pares dados. */
function motor(opcoes: { recusados?: string[]; mesmas?: string[]; cairNa?: number } = {}) {
  let perguntas = 0
  return {
    natureza: vi.fn(async (nome: string) => {
      perguntas += 1
      if (perguntas === opcoes.cairNa) throw new Error('connect ECONNREFUSED 127.0.0.1:11434')
      return { nome, leitura: opcoes.recusados?.includes(nome) ? 'nao-e-fase' : 'etapa', razao: 'fase canônica' }
    }),
    comparar: vi.fn(async (a: string, b: string) => ({
      a,
      b,
      leitura: opcoes.mesmas?.includes(`${a}|${b}`) ? 'mesma' : 'diferentes',
      razao: 'só muda a preposição',
    })),
  }
}

/** Marca a caixa do item cujo título traz o nome. */
function marcar(...nomes: string[]): void {
  const texto = nomes.reduce(
    (t, nome) => t.replace(`- [ ] \`${nome}\` →`, `- [x] \`${nome}\` →`),
    readFileSync(saida, 'utf8'),
  )
  writeFileSync(saida, texto)
}

beforeEach(() => {
  raiz = mkdtempSync(join(tmpdir(), 'rodada-raiz-'))
  pasta = mkdtempSync(join(tmpdir(), 'rodada-saida-'))
  saida = join(pasta, 'equivalencias.md')
  destino = join(pasta, 'equivalencias.ts')
  projeto('alfa', estado('geracao', ['regressao', 'escavacao-c2']))
  projeto('beta', estado('geracao', ['verificacao-regressao', 'iago']))
  projeto('gama', estado('geracao', ['verificacao-de-regressao', 'escavacão'], ['um valor em prosa que não é fase']))
})

afterEach(() => {
  rmSync(raiz, { recursive: true, force: true })
  rmSync(pasta, { recursive: true, force: true })
})

describe('o aprendizado propõe etapas sem tocar o mapa', () => {
  it('escreve a seção de fases com os três nomes, a evidência de cada um e o grupo', async () => {
    const antes = readFileSync(MODULO_DE_VERDADE, 'utf8')
    const classificarFases = motor({ recusados: ['iago'], mesmas: ['verificacao-de-regressao|verificacao-regressao'] })
    const codigo = await aprender([`--raiz=${raiz}`, `--saida=${saida}`], { classificarFases, mapa: SEM_MAPA, contar: null })
    const texto = readFileSync(saida, 'utf8')

    expect(codigo).toBe(0)
    for (const nome of ['regressao', 'verificacao-regressao', 'verificacao-de-regressao']) {
      expect(texto).toContain(`- [ ] \`${nome}\` →`)
    }
    expect(texto).toContain('_visto em:_ alfa')
    expect(texto).toContain('### Mesma etapa, segundo o motor: verificacao-de-regressao, verificacao-regressao')
    expect(texto).toContain('só muda a preposição')
    // A razão da natureza é lida e não é mostrada (D-17).
    expect(texto).not.toContain('_o motor disse:_ fase canônica')
    expect(readFileSync(MODULO_DE_VERDADE, 'utf8')).toBe(antes)
  })

  it('não manda ao motor a fase de ciclo, o erro de grafia nem a prosa', async () => {
    const classificarFases = motor()
    await aprender([`--raiz=${raiz}`, `--saida=${saida}`], { classificarFases, mapa: SEM_MAPA, contar: null })
    const perguntados = classificarFases.natureza.mock.calls.map(([nome]) => nome)
    const enviado = JSON.stringify(classificarFases.natureza.mock.calls)

    expect(perguntados).toEqual(['iago', 'regressao', 'verificacao-de-regressao', 'verificacao-regressao'])
    expect(enviado).not.toContain('prosa')
    expect(readFileSync(saida, 'utf8')).toContain('`escavacão`, ao lado de `escavacao`')
  })

  it('tira da seção o nome que o motor recusou, e o lista sem caixa', async () => {
    const classificarFases = motor({ recusados: ['iago'] })
    await aprender([`--raiz=${raiz}`, `--saida=${saida}`], { classificarFases, mapa: SEM_MAPA, contar: null })
    const texto = readFileSync(saida, 'utf8')

    expect(texto).not.toContain('- [ ] `iago`')
    expect(texto).toContain('### O que o motor recusou como fase')
  })

  it('só compara os pares com palavra em comum, entre os julgados etapa', async () => {
    const classificarFases = motor({ recusados: ['iago'] })
    await aprender([`--raiz=${raiz}`, `--saida=${saida}`], { classificarFases, mapa: SEM_MAPA, contar: null })

    expect(classificarFases.comparar.mock.calls).toHaveLength(3)
  })

  it('com o motor caindo na segunda pergunta, não escreve nada e nomeia a causa', async () => {
    const dito: string[] = []
    const espia = vi.spyOn(process.stdout, 'write').mockImplementation((linha) => (dito.push(String(linha)), true))
    // Um checkpoint a classificar, para que a passagem dos checkpoints TENHA terminado bem.
    mkdirSync(join(raiz, 'delta', '.reversa'), { recursive: true })
    writeFileSync(
      join(raiz, 'delta', '.reversa', 'state.json'),
      JSON.stringify({ phase: 'geracao', completed: [], pending: [], checkpoints: { scout: { status: 'ok' } } }),
    )
    const classificar = vi.fn(async () => ({ campo: 'status', valor: 'ok', leitura: 'concluido', razao: 'x' }))
    const codigo = await aprender([`--raiz=${raiz}`, `--saida=${saida}`], {
      classificar,
      classificarFases: motor({ cairNa: 2 }),
      mapa: SEM_MAPA,
      contar: null,
    })
    espia.mockRestore()

    expect(codigo).toBe(1)
    expect(classificar).toHaveBeenCalled()
    expect(existsSync(saida)).toBe(false)
    expect(dito.join('')).toContain('ECONNREFUSED')
    expect(dito.join('')).toContain('nada foi escrito')
  })

  it('a mesma raiz e o mesmo mapa dão a mesma proposta', async () => {
    const deps = () => ({ classificarFases: motor({ recusados: ['iago'] }), mapa: SEM_MAPA, contar: null })
    await aprender([`--raiz=${raiz}`, `--saida=${saida}`], deps())
    const primeira = readFileSync(saida, 'utf8')
    await aprender([`--raiz=${raiz}`, `--saida=${saida}`], deps())

    expect(readFileSync(saida, 'utf8')).toBe(primeira)
  })
})

describe('a promoção dispõe, sem conhecer o motor', () => {
  beforeEach(async () => {
    const classificarFases = motor({ recusados: ['iago'], mesmas: ['verificacao-de-regressao|verificacao-regressao'] })
    await aprender([`--raiz=${raiz}`, `--saida=${saida}`], { classificarFases, mapa: SEM_MAPA, contar: null })
  })

  it('marcadas duas do mesmo grupo, o mapa traz dois registros independentes, e a terceira fica de fora', () => {
    marcar('verificacao-regressao', 'verificacao-de-regressao')
    const codigo = promover([`--proposta=${saida}`, `--destino=${destino}`], { contar: null })
    const mapa = lerMapaDeModulo(readFileSync(destino, 'utf8'))

    expect(codigo).toBe(0)
    expect(mapa.etapas.map((e: { nome: string }) => e.nome)).toEqual(['verificacao-de-regressao', 'verificacao-regressao'])
    expect(mapa.etapas[0]).toMatchObject({ evidencia: ['gama'] })
    expect(mapa.etapas[1]).toMatchObject({ evidencia: ['beta'] })
    for (const etapa of mapa.etapas) expect(Object.keys(etapa).sort()).toEqual(['aprovadoEm', 'evidencia', 'nome'])
  })

  it('escreve só o destino: a proposta e o módulo de verdade ficam como estavam', () => {
    marcar('regressao')
    const proposta = readFileSync(saida, 'utf8')
    const deVerdade = readFileSync(MODULO_DE_VERDADE, 'utf8')
    promover([`--proposta=${saida}`, `--destino=${destino}`], { contar: null })

    expect(readFileSync(saida, 'utf8')).toBe(proposta)
    expect(readFileSync(MODULO_DE_VERDADE, 'utf8')).toBe(deVerdade)
  })

  it('promover um checkpoint sobre módulo com etapas deixa as etapas intactas', () => {
    writeFileSync(
      destino,
      gerarModulo({ pares: [], naoAgentes: [], etapas: [{ nome: 'saneamento', aprovadoEm: '2026-09-01', evidencia: ['afla'] }] }),
    )
    marcar('regressao')
    promover([`--proposta=${saida}`, `--destino=${destino}`], { contar: null })
    const nomes = lerMapaDeModulo(readFileSync(destino, 'utf8')).etapas.map((e: { nome: string }) => e.nome)

    expect(nomes).toEqual(['regressao', 'saneamento'])
  })

  it('nada marcado, nada escrito', () => {
    expect(promover([`--proposta=${saida}`, `--destino=${destino}`], { contar: null })).toBe(0)
    expect(existsSync(destino)).toBe(false)
  })

  it('não importa o motor, nem por quem ela importa', () => {
    const fonte = readFileSync('scripts/promover-equivalencias.js', 'utf8')

    expect(fonte).not.toMatch(/require\('\.\/equivalencias\/motor'\)/)
    expect(fonte).not.toContain('fetch(')
  })
})

describe('os dois terminam com a contagem da raiz', () => {
  it('o aprendizado conta com o mapa vigente, e a promoção com o que acabou de fundir', async () => {
    const contar = vi.fn(() => ['código  ocorrências', 'total  0'])
    await aprender([`--raiz=${raiz}`, `--saida=${saida}`], { classificarFases: motor(), mapa: SEM_MAPA, contar })
    marcar('regressao')
    promover([`--proposta=${saida}`, `--destino=${destino}`], { contar })

    expect(contar).toHaveBeenCalledTimes(2)
    const [raizDoAprendizado, mapaDoAprendizado] = contar.mock.calls[0] as unknown as [string, { etapas?: unknown[] }]
    const [raizDaPromocao, mapaDaPromocao] = contar.mock.calls[1] as unknown as [string, { etapas: { nome: string }[] }]
    expect(mapaDoAprendizado.etapas ?? []).toEqual([])
    expect(mapaDaPromocao.etapas.map((e) => e.nome)).toEqual(['regressao'])
    // A promoção conta a MESMA raiz, relida da proposta, sem argumento.
    expect(raizDaPromocao).toBe(raizDoAprendizado)
  })

  it('sem out-cli/, nomeia o comando de construção e termina com o código que teria', async () => {
    const dito: string[] = []
    const espia = vi.spyOn(process.stdout, 'write').mockImplementation((linha) => (dito.push(String(linha)), true))
    const codigo = await aprender([`--raiz=${raiz}`, `--saida=${saida}`], {
      classificarFases: motor(),
      mapa: SEM_MAPA,
      contar: () => null,
    })
    marcar('regressao')
    const daPromocao = promover([`--proposta=${saida}`, `--destino=${destino}`], { contar: () => null })
    espia.mockRestore()

    expect(codigo).toBe(0)
    expect(daPromocao).toBe(0)
    expect(dito.join('')).toContain('npm run compile:cli')
    expect(existsSync(destino)).toBe(true)
  })
})
