/**
 * The discovery-state axis of feature 011: the situation of the extraction,
 * the three states of a checkpoint, and the inherited anomalies this axis
 * absorbs.
 *
 * The fixtures under `tests/fixtures/descoberta/` are written here rather than
 * copied from anyone's project, and they carry the shapes MEASURED across the
 * sixty-four projects with a `state.json` under `~/dev` on 2026-09-20. The
 * numbers in the prose below come from that measurement, and a future reading
 * that contradicts them is reason to reopen the decision, not to bend the
 * suite.
 * @module tests/domain-discovery-state
 */

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { readDiscoveryState } from '../src/domain/discovery-state.ts'

const FIXTURES = join(__dirname, 'fixtures', 'descoberta')

/** One fixture file, as text, which is how the reader takes it. */
function fixture(nome: string): string {
  return readFileSync(join(FIXTURES, `${nome}.json`), 'utf8')
}

/** The catalogue of phase values measured in the field. */
const FASES = JSON.parse(fixture('fases-observadas')) as {
  encerramento: string[]
  canonicas: string[]
  estranhas: string[]
}

/** A `state.json` with just the phase, which is all some cases are about. */
function comFase(phase: string | null, completed: string[] = []): string {
  return JSON.stringify({ version: '1.3.3', phase, completed, pending: [], checkpoints: {} })
}

describe('a situação da extração', () => {
  it('reconhece as cinco grafias de encerramento medidas em campo', () => {
    expect(FASES.encerramento).toHaveLength(5)
    for (const grafia of FASES.encerramento) {
      const eixo = readDiscoveryState({ stateJson: comFase(grafia), anomalias: [] })
      expect(eixo.extracao.situacao, grafia).toBe('encerrada')
    }
  })

  it('guarda o valor bruto ao lado do reconhecido, sem normalizar o disco', () => {
    const eixo = readDiscoveryState({ stateJson: comFase('revisao_concluida'), anomalias: [] })

    expect(eixo.extracao).toEqual({ situacao: 'encerrada', bruto: 'revisao_concluida' })
  })

  it('testa as cinco fases canônicas ANTES da família, e nunca as confunde com encerramento', () => {
    for (const canonica of FASES.canonicas) {
      const eixo = readDiscoveryState({ stateJson: comFase(canonica), anomalias: [] })
      expect(eixo.extracao.situacao, canonica).toBe('em-curso')
    }
  })

  it('deixa em curso o nome que não é canônico nem declara encerramento', () => {
    for (const estranha of FASES.estranhas) {
      const eixo = readDiscoveryState({ stateJson: comFase(estranha), anomalias: [] })
      expect(eixo.extracao.situacao, estranha).toBe('em-curso')
    }
  })

  it('não confunde erro de digitação sobre fase canônica com encerramento', () => {
    const eixo = readDiscoveryState({ stateJson: comFase('geracaoo'), anomalias: [] })

    expect(eixo.extracao.situacao).toBe('em-curso')
    expect(eixo.extracao.bruto).toBe('geracaoo')
  })

  it('sai não iniciada quando a fase falta e nada foi concluído', () => {
    const eixo = readDiscoveryState({ stateJson: comFase(null), anomalias: [] })

    expect(eixo.extracao).toEqual({ situacao: 'nao-iniciada', bruto: null })
  })

  it('sai em curso quando a fase falta mas alguma já foi concluída', () => {
    const eixo = readDiscoveryState({
      stateJson: comFase(null, ['reconhecimento']),
      anomalias: [],
    })

    expect(eixo.extracao.situacao).toBe('em-curso')
  })

  it('lê o encerramento do med-reversa, que é o caso que motivou a feature', () => {
    const eixo = readDiscoveryState({ stateJson: fixture('med-reversa'), anomalias: [] })

    expect(eixo.extracao).toEqual({ situacao: 'encerrada', bruto: 'concluido' })
  })

  it('sai vazio, e sem exceção, quando o state.json falta ou não é legível', () => {
    expect(readDiscoveryState({ stateJson: null, anomalias: [] }).extracao.situacao).toBe(
      'nao-iniciada',
    )
    expect(readDiscoveryState({ stateJson: '{ nao é json', anomalias: [] }).checkpoints).toEqual([])
    expect(readDiscoveryState({ stateJson: '[]', anomalias: [] }).anomalias).toEqual([])
  })
})

describe('os três estados do checkpoint', () => {
  it('sai concluído quando `completed_at` está lá, que é o que o guia do Reversa pede', () => {
    const eixo = readDiscoveryState({ stateJson: fixture('checkpoint-parcial'), anomalias: [] })
    const scout = eixo.checkpoints.find((c) => c.agent === 'scout')

    expect(scout?.situacao).toBe('concluido')
    expect(scout?.instante).toBe('2026-09-01T10:00:00Z')
  })

  it('sai em andamento sem `completed_at` e com `modules_pending`, que é a assinatura documentada', () => {
    const eixo = readDiscoveryState({ stateJson: fixture('checkpoint-parcial'), anomalias: [] })
    const arqueologo = eixo.checkpoints.find((c) => c.agent === 'archaeologist')

    expect(arqueologo?.situacao).toBe('em-andamento')
    expect(arqueologo?.instante).toBeNull()
  })

  it('não registra anomalia alguma pelo trabalho em curso', () => {
    const eixo = readDiscoveryState({ stateJson: fixture('checkpoint-parcial'), anomalias: [] })

    expect(eixo.anomalias).toEqual([])
  })

  it('sai em conclusão não declarada sem `completed_at` e sem `modules_pending`', () => {
    const eixo = readDiscoveryState({ stateJson: fixture('med-reversa'), anomalias: [] })

    expect(eixo.checkpoints).toHaveLength(7)
    for (const checkpoint of eixo.checkpoints) {
      expect(checkpoint.situacao, checkpoint.agent).toBe('conclusao-nao-declarada')
    }
  })

  it('não empresta instante de `at`, porque seria afirmar conclusão pelo campo que não a declara', () => {
    const eixo = readDiscoveryState({ stateJson: fixture('med-reversa'), anomalias: [] })

    for (const checkpoint of eixo.checkpoints) {
      expect(checkpoint.instante, checkpoint.agent).toBeNull()
    }
  })

  it('registra uma anomalia por checkpoint não declarado, nomeando o agente', () => {
    const eixo = readDiscoveryState({ stateJson: fixture('med-reversa'), anomalias: [] })

    expect(eixo.anomalias).toHaveLength(7)
    for (const anomalia of eixo.anomalias) {
      expect(anomalia.file).toBe('.reversa/state.json')
      expect(anomalia.code).toBe('checkpoint-sem-conclusao-declarada')
    }
    expect(eixo.anomalias.map((a) => a.detail).join(' ')).toContain('writer')
  })

  it('nomeia os campos de lista de textos quando `files` falta, sem chamá-los de saídas', () => {
    const eixo = readDiscoveryState({
      stateJson: fixture('checkpoint-campos-de-lista'),
      anomalias: [],
    })
    const writer = eixo.checkpoints.find((c) => c.agent === 'writer')

    expect(writer?.camposComLista).toEqual(['achados', 'arquivos_canonicos'])
  })

  it('não sinaliza nada quando `files` está presente, porque a lista canônica está lá', () => {
    const eixo = readDiscoveryState({
      stateJson: fixture('checkpoint-campos-de-lista'),
      anomalias: [],
    })
    const reviewer = eixo.checkpoints.find((c) => c.agent === 'reviewer')

    expect(reviewer?.camposComLista).toEqual([])
    expect(reviewer?.situacao).toBe('concluido')
  })

  it('ignora campo que não é lista de textos ao sinalizar', () => {
    const eixo = readDiscoveryState({
      stateJson: fixture('checkpoint-campos-de-lista'),
      anomalias: [],
    })
    const writer = eixo.checkpoints.find((c) => c.agent === 'writer')

    expect(writer?.camposComLista).not.toContain('cobertura_vba')
    expect(writer?.camposComLista).not.toContain('nota')
  })
})

describe('a absorção das anomalias herdadas', () => {
  /** What `derivePhases` of the inherited layer records for a phase it does not know. */
  function faseDesconhecida(detail: string): { file: string; code: string; detail: string } {
    return { file: '.reversa/state.json', code: 'fase-desconhecida', detail }
  }

  it('absorve a anomalia da fase que reconheceu como encerramento', () => {
    const eixo = readDiscoveryState({
      stateJson: comFase('concluido'),
      anomalias: [faseDesconhecida('concluido')],
    })

    expect(eixo.absorvidas).toEqual([faseDesconhecida('concluido')])
  })

  it('não absorve nada quando a fase não declara encerramento', () => {
    const eixo = readDiscoveryState({
      stateJson: comFase('documentacao'),
      anomalias: [faseDesconhecida('documentacao')],
    })

    expect(eixo.absorvidas).toEqual([])
  })

  it('casa a tripla inteira, e não o código sozinho', () => {
    const eixo = readDiscoveryState({
      stateJson: fixture('terminal-e-nome-estranho'),
      anomalias: [faseDesconhecida('concluido'), faseDesconhecida('documentacao')],
    })

    expect(eixo.absorvidas).toEqual([faseDesconhecida('concluido')])
  })

  it('deixa em pé a anomalia de outro código, ainda que o detalhe coincida', () => {
    const outra = { file: '.reversa/state.json', code: 'fase-atual-ja-concluida', detail: 'concluido' }
    const eixo = readDiscoveryState({
      stateJson: comFase('concluido'),
      anomalias: [outra],
    })

    expect(eixo.absorvidas).toEqual([])
  })

  it('deixa em pé a anomalia de outro arquivo, ainda que código e detalhe coincidam', () => {
    const outroArquivo = { file: '.reversa/outro.json', code: 'fase-desconhecida', detail: 'concluido' }
    const eixo = readDiscoveryState({
      stateJson: comFase('concluido'),
      anomalias: [outroArquivo],
    })

    expect(eixo.absorvidas).toEqual([])
  })

  it('não absorve coisa alguma quando a herança não registrou nada', () => {
    const eixo = readDiscoveryState({ stateJson: comFase('concluido'), anomalias: [] })

    expect(eixo.absorvidas).toEqual([])
  })
})
