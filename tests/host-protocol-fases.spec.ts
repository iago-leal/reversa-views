/**
 * The channel from the host to the screen, over feature 015 (RF-11): the
 * payload grows only by addition, inside `discoveryState`, and a screen facing
 * a host that predates the feature draws what it drew in feature 014.
 * @module tests/host-protocol-fases
 */

import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { readWorkspace } from '../src/host/reading.ts'
import { composeAnomalies } from '../src/webview/domain/anomalies-view.ts'
import {
  currentStageSentence,
  cyclePhaseMarks,
  cycleSentence,
  extractionLabel,
  stagesLine,
  undeclaredClosureSentence,
} from '../src/webview/domain/labels.ts'
import { lerParaDesenhar } from './helpers/fases-carga.ts'
import { amostra, detalhes, mapaComEtapas } from './helpers/fases-leitura.ts'

const QUATRO_ETAPAS = mapaComEtapas('reconciliacao', 'verificacao-regressao', 'saneamento', 'auditoria-cruzada')

describe('a carga cresce só por acréscimo', () => {
  it('SetProcessData não ganha campo algum no topo', () => {
    const corpo = /export interface SetProcessData \{([\s\S]*?)\n\}/.exec(readFileSync('src/host/protocol.ts', 'utf8'))?.[1] ?? ''
    const declarados = [...corpo.matchAll(/^ {2}(\w+)\??:/gm)].map((m) => m[1])

    expect(declarados).toHaveLength(15)
    expect(declarados[declarados.length - 1]).toBe('discoveryState')
  })

  it('os campos novos atravessam a serialização do canal sem transformação', () => {
    const { carga, eixo } = lerParaDesenhar(amostra('ciclo-tres-com-etapas'), QUATRO_ETAPAS)
    const doOutroLado = JSON.parse(JSON.stringify(carga))

    expect(doOutroLado.discoveryState.ciclo).toEqual(eixo.ciclo)
    expect(doOutroLado.discoveryState.etapas).toEqual(eixo.etapas)
    // Dez fases de ciclo, cinco nomes de etapa e o phase de encerramento, que a 011 já descontava.
    expect(doOutroLado.discoveryState.absorvidas).toHaveLength(16)
  })

  it('a leitura de verdade do host entrega o eixo com o mapa recebido', () => {
    const leitura = readWorkspace('tests/fixtures/nao-existe', { log: { write: () => undefined }, equivalencias: QUATRO_ETAPAS })

    // Uma raiz sem Reversa não tem ciclo nem etapa, e os campos vêm AUSENTES.
    expect(leitura.kind).toBe('loaded')
    if (leitura.kind === 'loaded') {
      expect('ciclo' in leitura.discoveryState).toBe(false)
      expect('etapas' in leitura.discoveryState).toBe(false)
    }
  })
})

describe('tela nova diante de host anterior à feature', () => {
  const { carga, eixo } = lerParaDesenhar(amostra('ciclo-tres-com-etapas'), QUATRO_ETAPAS)
  // O que a 014 mandava: sem ciclo, sem etapas, sem a anomalia nova, e com o
  // desconto só sobre o phase de encerramento.
  const eixoDa014 = {
    extracao: eixo.extracao,
    checkpoints: eixo.checkpoints,
    anomalias: [],
    absorvidas: eixo.absorvidas.filter((a) => a.detail === eixo.extracao.bruto),
    registrosNaoAgentes: eixo.registrosNaoAgentes,
  }
  const anterior = { ...carga, discoveryState: eixoDa014 }

  it('as fase-desconhecida de fase de ciclo e de etapa voltam à tela', () => {
    expect(detalhes(composeAnomalies(carga), 'fase-desconhecida')).toEqual([])
    expect(detalhes(composeAnomalies(anterior), 'fase-desconhecida')).toHaveLength(15)
  })

  it('nenhuma frase nova é dita: todas saem nulas', () => {
    expect(cycleSentence(eixoDa014)).toBeNull()
    expect(cyclePhaseMarks(eixoDa014)).toBeNull()
    expect(stagesLine(eixoDa014)).toBeNull()
    expect(currentStageSentence(eixoDa014)).toBeNull()
    expect(undeclaredClosureSentence(eixoDa014)).toBeNull()
  })

  it('o eixo ausente por inteiro também não diz nada', () => {
    for (const frase of [cycleSentence, stagesLine, currentStageSentence, undeclaredClosureSentence]) {
      expect(frase(undefined)).toBeNull()
    }
  })

  it('a situação nova tem rótulo próprio, e a desconhecida não estoura', () => {
    expect(extractionLabel('encerrada-sem-declaracao')).toMatchObject({ known: true })
    expect(() => extractionLabel('situacao-de-um-host-futuro')).not.toThrow()
  })
})
