/**
 * A contagem das anomalias da raiz (feature 015, RF-16): o que o painel exibe,
 * por código e por projeto, sobre a raiz inteira e sem escrever nada.
 * @module tests/cli-contagem
 */

import { cpSync, mkdirSync, mkdtempSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  CODIGOS_AO_ALCANCE_DO_MAPA,
  contarAnomalias,
  executarContagem,
  subpastasDaRaiz,
  tabelaDaContagem,
} from '../src/cli/contagem.ts'
import { readWorkspace } from '../src/host/reading.ts'
import type { SetProcessData } from '../src/host/protocol.ts'
import { composeAnomalies } from '../src/webview/domain/anomalies-view.ts'
import { amostra, mapaComEtapas } from './helpers/fases-leitura.ts'

let raiz: string

/** Um projeto da raiz, com o `state.json` de uma amostra. */
function projeto(nome: string, stateJson: string): void {
  mkdirSync(join(raiz, nome, '.reversa'), { recursive: true })
  writeFileSync(join(raiz, nome, '.reversa', 'state.json'), stateJson)
}

/** Todo arquivo sob a raiz, com tamanho e instante, para provar que nada foi escrito. */
function retrato(pasta: string): string[] {
  return readdirSync(pasta, { recursive: true, withFileTypes: true })
    .filter((entrada) => entrada.isFile())
    .map((entrada) => {
      const caminho = join(entrada.parentPath, entrada.name)
      const dados = statSync(caminho)
      return `${caminho} ${dados.size} ${dados.mtimeMs}`
    })
    .sort()
}

beforeEach(() => {
  raiz = mkdtempSync(join(tmpdir(), 'contagem-'))
  projeto('ciclo-tres', amostra('ciclo-tres-com-etapas'))
  projeto('grafia', amostra('erros-de-grafia'))
  projeto('checkpoints', amostra('vocabularios-de-conclusao'))
  projeto('parou', amostra('encerrada-sem-declaracao'))
  mkdirSync(join(raiz, 'sem-reversa'))
  writeFileSync(join(raiz, 'arquivo-solto.txt'), 'não é projeto')
})

afterEach(() => {
  rmSync(raiz, { recursive: true, force: true })
})

describe('os projetos da raiz', () => {
  it('as candidatas são as subpastas diretas, em ordem, sem arquivo solto nem pasta oculta', () => {
    mkdirSync(join(raiz, '.oculta'))

    expect(subpastasDaRaiz(raiz)).toEqual(['checkpoints', 'ciclo-tres', 'grafia', 'parou', 'sem-reversa'])
  })

  it('projeto é a candidata que a leitura devolve como instalada: a pasta sem estado fica de fora', () => {
    const contagem = contarAnomalias(raiz)

    expect(contagem.projetos).toBe(4)
    expect(contagem.porProjeto['sem-reversa']).toBeUndefined()
  })
})

/** Os quatro projetos da raiz de amostra, que é o que a leitura devolve como instalado. */
const PROJETOS = ['checkpoints', 'ciclo-tres', 'grafia', 'parou']

describe('a contagem', () => {
  it('soma por código o mesmo que as leituras individuais, inclusive na anomalia de linha longa', () => {
    const contagem = contarAnomalias(raiz)
    const esperado: Record<string, number> = {}
    for (const nome of PROJETOS) {
      const leitura = readWorkspace(join(raiz, nome), { log: { write: () => undefined } })
      if (leitura.kind !== 'loaded') throw new Error(`a leitura de ${nome} falhou`)
      for (const anomalia of composeAnomalies(leitura as unknown as SetProcessData)) {
        esperado[anomalia.code] = (esperado[anomalia.code] ?? 0) + 1
      }
    }

    expect(Object.fromEntries(contagem.codigos.map((c) => [c.codigo, c.ocorrencias]))).toEqual(esperado)
    expect(contagem.total).toBe(Object.values(esperado).reduce((a, b) => a + b, 0))
    // A anomalia nova tem o detalhe mais longo da feature, e conta como uma.
    expect(contagem.porProjeto['ciclo-tres']?.['encerramento-com-pendencia']).toBe(1)
  })

  it('conta o que o painel EXIBE: a fase de ciclo descontada não entra', () => {
    const contagem = contarAnomalias(raiz)

    // Cinco nomes de etapa sem aprovação; as dez fases de ciclo e o phase ficaram de fora.
    expect(contagem.porProjeto['ciclo-tres']?.['fase-desconhecida']).toBe(5)
    expect(contagem.porProjeto['parou']?.['fase-atual-ja-concluida']).toBeUndefined()
  })

  it('aplica o mapa recebido por parâmetro, sem recompilar nada', () => {
    const mapa = mapaComEtapas('reconciliacao', 'verificacao-regressao', 'saneamento', 'auditoria-cruzada')
    const contagem = contarAnomalias(raiz, { mapa })

    expect(contagem.porProjeto['ciclo-tres']?.['fase-desconhecida']).toBeUndefined()
    expect(contagem.porProjeto['grafia']?.['fase-desconhecida']).toBe(3)
  })

  it('traz ocorrências e projetos por código, ordenados por ocorrências e depois por código', () => {
    const { codigos } = contarAnomalias(raiz)
    const copia = [...codigos].sort((a, b) => b.ocorrencias - a.ocorrencias || a.codigo.localeCompare(b.codigo))

    expect(codigos).toEqual(copia)
    expect(codigos.find((c) => c.codigo === 'fase-desconhecida')).toMatchObject({ ocorrencias: 8, projetos: 2 })
  })

  it('marca os dois códigos ao alcance do mapa, e só eles', () => {
    expect(CODIGOS_AO_ALCANCE_DO_MAPA).toEqual(['checkpoint-sem-conclusao-declarada', 'fase-desconhecida'])
    for (const linha of contarAnomalias(raiz).codigos) {
      expect(linha.aoAlcanceDoMapa, linha.codigo).toBe(CODIGOS_AO_ALCANCE_DO_MAPA.includes(linha.codigo))
    }
  })

  it('conta à parte o projeto cuja leitura falhou, e segue', () => {
    const contagem = contarAnomalias(raiz, {
      ler: (pasta, mapa) =>
        pasta.endsWith('grafia')
          ? { kind: 'error', message: 'falhou de propósito' }
          : readWorkspace(pasta, { log: { write: () => undefined }, ...(mapa ? { equivalencias: mapa } : {}) }),
    })

    expect(contagem.semLeitura).toEqual(['grafia'])
    expect(contagem.projetos).toBe(4)
    expect(contagem.porProjeto['grafia']).toBeUndefined()
    expect(tabelaDaContagem(contagem).join('\n')).toContain('sem leitura, e fora da conta: grafia')
  })

  it('nomeia o projeto em leitura, para que a espera tenha progresso', () => {
    const vistos: string[] = []
    contarAnomalias(raiz, { progresso: (nome) => vistos.push(nome) })

    expect(vistos).toEqual([...PROJETOS, 'sem-reversa'])
  })

  it('não escreve coisa alguma sob a raiz', () => {
    const antes = retrato(raiz)
    contarAnomalias(raiz)
    executarContagem([raiz, '--json'])

    expect(retrato(raiz)).toEqual(antes)
  })
})

describe('a linha de comando', () => {
  it('imprime a tabela por padrão, com cabeçalho, coluna do mapa e total', () => {
    const { codigo, saida } = executarContagem([raiz])
    const texto = saida.join('\n')

    expect(codigo).toBe(0)
    expect(saida[0]).toContain('4 projetos lidos, 0 sem leitura')
    expect(texto).toMatch(/fase-desconhecida\s+8\s+2\s+alcança/)
    expect(texto).toMatch(/\ntotal\s+\d+$/)
  })

  it('com --json, manda à saída padrão só o documento, e o progresso à de erro', () => {
    const { codigo, saida, erro } = executarContagem([raiz, '--json'])
    const documento = JSON.parse(saida.join('\n'))

    expect(codigo).toBe(0)
    expect(Object.keys(documento)).toEqual(['raiz', 'projetos', 'semLeitura', 'total', 'codigos', 'porProjeto'])
    expect(documento.porProjeto['ciclo-tres']['fase-desconhecida']).toBe(5)
    expect(erro).toContain('lendo ciclo-tres')
  })

  it('sai com 0 mesmo havendo anomalias: o comando mede, não julga', () => {
    expect(executarContagem([raiz]).codigo).toBe(0)
  })

  it('sai com 2, nomeando o caminho, diante de raiz ausente, inexistente ou que não é pasta', () => {
    const arquivo = join(raiz, 'arquivo-solto.txt')

    expect(executarContagem([])).toMatchObject({ codigo: 2, saida: [] })
    expect(executarContagem([join(raiz, 'nao-existe')]).erro.join(' ')).toContain('nao-existe')
    expect(executarContagem([arquivo])).toMatchObject({ codigo: 2 })
  })

  it('a cópia de uma raiz conta o mesmo que a raiz', () => {
    const copia = mkdtempSync(join(tmpdir(), 'contagem-copia-'))
    cpSync(raiz, copia, { recursive: true })
    const original = contarAnomalias(raiz)

    expect({ ...contarAnomalias(copia), raiz: original.raiz }).toEqual(original)
    rmSync(copia, { recursive: true, force: true })
  })
})
