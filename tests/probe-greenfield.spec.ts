/**
 * A sonda do eixo greenfield, sobre árvore de verdade (RF-01, RF-22, D-01,
 * D-11).
 *
 * Ela existe porque a sonda herdada lê o que o ponteiro do Reversa nomeia, e os
 * artefatos do `/reversa-new` não estão entre essas coisas. Foi escrita
 * reutilizando as três funções que a sonda herdada exporta, de modo que
 * `node:fs` continua num arquivo só e nenhum arquivo vendorizado mudou.
 *
 * O que se verifica aqui é o encontro com o disco: presença, lista, teto,
 * corpo acima do teto e contenção na raiz. E, sobretudo, que SÓ DOIS corpos são
 * lidos: o brief e o PRD. A ideação, as personas e as specs são listadas e
 * nunca abertas, porque o teto de tempo não sobrevive a abrir cinco specs a
 * cada leitura (D-11).
 * @module tests/probe-greenfield
 */

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { SPEC_CAP } from '../src/domain/limits.ts'
import { REVERSA_FILE_CAP } from '../src/heranca/reversa-probe/src/index.ts'
import { readGreenfieldArtifacts } from '../src/probe/greenfield.ts'

const SAIDA = '_reversa_sdd'
const criadas: string[] = []

afterEach(() => {
  while (criadas.length > 0) rmSync(criadas.pop() as string, { recursive: true, force: true })
})

/** Uma raiz temporária com a pasta de saída e os arquivos pedidos dentro dela. */
function raizCom(arquivos: Record<string, string>, comPastaDeSaida = true): string {
  const raiz = mkdtempSync(join(tmpdir(), 'reversa-greenfield-'))
  criadas.push(raiz)
  if (comPastaDeSaida) mkdirSync(join(raiz, SAIDA), { recursive: true })
  for (const [nome, texto] of Object.entries(arquivos)) {
    const caminho = join(raiz, SAIDA, nome)
    mkdirSync(join(caminho, '..'), { recursive: true })
    writeFileSync(caminho, texto, 'utf8')
  }
  return raiz
}

const QUATRO = {
  'newproject-brief.md': '# Brief\n\n## Ideia original\nUma ideia.\n',
  'ideation.md': '# Ideação\n',
  'personas.md': '# Personas\n',
  'prd.md': '# PRD\n\n## 4. Escopo (in)\n\n- Um item.\n',
}

describe('presença e lista', () => {
  it('vê os quatro artefatos, e lê o corpo de dois deles', () => {
    const lido = readGreenfieldArtifacts({ root: raizCom(QUATRO), outputFolder: SAIDA })
    expect(lido).toMatchObject({ pasta: true, brief: true, ideacao: true, personas: true, prd: true })
    expect(lido.briefMd).toContain('Uma ideia')
    expect(lido.prdMd).toContain('Um item')
    expect(Object.keys(lido)).not.toContain('ideacaoMd')
    expect(Object.keys(lido)).not.toContain('personasMd')
  })

  it('nada presente é tudo falso, sem lançar', () => {
    const lido = readGreenfieldArtifacts({ root: raizCom({}), outputFolder: SAIDA })
    expect(lido).toMatchObject({ pasta: true, brief: false, ideacao: false, personas: false, prd: false, specs: [], totalDeSpecs: 0 })
    expect(lido.briefMd).toBeNull()
    expect(lido.prdMd).toBeNull()
  })

  it('pasta de saída ausente é declarada, e todo o resto é ausência', () => {
    const lido = readGreenfieldArtifacts({ root: raizCom({}, false), outputFolder: SAIDA })
    expect(lido.pasta).toBe(false)
    expect(lido.specs).toEqual([])
  })

  it('vê as duas âncoras da extração, sem ler o corpo delas', () => {
    const lido = readGreenfieldArtifacts({
      root: raizCom({ 'architecture.md': '# A', 'domain.md': '# D' }),
      outputFolder: SAIDA,
    })
    expect(lido.arquitetura).toBe(true)
    expect(lido.dominio).toBe(true)
    expect(Object.keys(lido)).not.toContain('arquiteturaMd')
  })

  it('respeita a pasta de saída que o processo declara, e não um nome fixo', () => {
    const raiz = mkdtempSync(join(tmpdir(), 'reversa-greenfield-'))
    criadas.push(raiz)
    mkdirSync(join(raiz, 'docs-reversa'), { recursive: true })
    writeFileSync(join(raiz, 'docs-reversa', 'prd.md'), '# PRD')
    const lido = readGreenfieldArtifacts({ root: raiz, outputFolder: 'docs-reversa' })
    expect(lido.prd).toBe(true)
  })
})

describe('a pasta de specs', () => {
  it('lista os nomes em ordem, só os `.md`, sem abrir nenhum', () => {
    const lido = readGreenfieldArtifacts({
      root: raizCom({ 'sdd/b.md': 'b', 'sdd/a.md': 'a', 'sdd/notas.txt': 'x', 'sdd/README': 'r' }),
      outputFolder: SAIDA,
    })
    expect(lido.specs).toEqual(['a.md', 'b.md'])
    expect(lido.totalDeSpecs).toBe(2)
  })

  it('`sdd/` ausente e `sdd/` vazia são lista vazia, sem anomalia da sonda', () => {
    expect(readGreenfieldArtifacts({ root: raizCom({}), outputFolder: SAIDA }).specs).toEqual([])
    const raiz = raizCom({})
    mkdirSync(join(raiz, SAIDA, 'sdd'))
    expect(readGreenfieldArtifacts({ root: raiz, outputFolder: SAIDA }).specs).toEqual([])
  })

  it('para no teto e conta o total que existe', () => {
    const arquivos: Record<string, string> = {}
    for (let i = 0; i < SPEC_CAP + 5; i += 1) arquivos[`sdd/s${String(i).padStart(3, '0')}.md`] = 's'
    const lido = readGreenfieldArtifacts({ root: raizCom(arquivos), outputFolder: SAIDA })
    expect(lido.specs).toHaveLength(SPEC_CAP)
    expect(lido.totalDeSpecs).toBe(SPEC_CAP + 5)
  })
})

describe('o teto de bytes e a raiz', () => {
  it('um corpo acima do teto não é lido pela metade: vem nulo e declarado em truncados', () => {
    const grande = 'x'.repeat(REVERSA_FILE_CAP + 1)
    const lido = readGreenfieldArtifacts({
      root: raizCom({ 'newproject-brief.md': grande, 'prd.md': 'ok' }),
      outputFolder: SAIDA,
    })
    expect(lido.brief).toBe(true)
    expect(lido.briefMd).toBeNull()
    expect(lido.truncados).toEqual([`${SAIDA}/newproject-brief.md`])
    expect(lido.prdMd).toBe('ok')
  })

  it('uma pasta de saída que escapa da raiz é recusada como ausente', () => {
    const lido = readGreenfieldArtifacts({ root: raizCom(QUATRO), outputFolder: '../fora' })
    expect(lido.pasta).toBe(false)
    expect(lido.brief).toBe(false)
  })
})
