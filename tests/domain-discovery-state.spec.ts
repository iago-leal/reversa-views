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
import type { LeituraDeEquivalencia, MapaDeEquivalencias } from '../src/domain/types.ts'

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

/**
 * Feature 012: the approved map, consulted after the two rules of the schema.
 *
 * Every case below builds its own map. There is deliberately no shared one:
 * a map defined at the top of the file would let a case pass because of what
 * another case approved, and the whole point of this feature is that nothing
 * is recognised unless someone approved exactly it.
 */
describe('o mapa de equivalências aprovadas', () => {
  /** The map with one pair, which is what most cases here need. */
  function mapaCom(campo: string, valor: string, leitura: LeituraDeEquivalencia = 'concluido') {
    return { pares: [{ campo, valor, leitura, aprovadoEm: '2026-09-20', evidencia: ['med-reversa'] }], naoAgentes: [] }
  }

  /** One checkpoint of a fixture, by name, after the axis judged it. */
  function checkpoint(nome: string, agent: string, equivalencias?: MapaDeEquivalencias) {
    const eixo = readDiscoveryState({ stateJson: fixture(nome), anomalias: [], equivalencias })
    return eixo.checkpoints.find((c) => c.agent === agent)
  }

  describe('a precedência, que é o ponto', () => {
    it('deixa `completed_at` vencer o par aprovado, e mantém o instante do campo canônico', () => {
      const detective = checkpoint('parcial-com-status', 'detective', mapaCom('status', 'failed', 'falhou'))

      expect(detective?.situacao).toBe('concluido')
      expect(detective?.instante).toBe('2026-09-03T11:00:00Z')
      expect(detective?.reconhecidoPor).toBeNull()
    })

    it('deixa `modules_pending` povoado vencer o par aprovado, sem sequer consultá-lo', () => {
      const arqueologo = checkpoint('parcial-com-status', 'archaeologist', mapaCom('status', 'concluido'))

      expect(arqueologo?.situacao).toBe('em-andamento')
      expect(arqueologo?.reconhecidoPor).toBeNull()
    })
  })

  describe('as três leituras que reconhecem', () => {
    it('reconhece a conclusão declarada fora do esquema, nomeando campo e valor', () => {
      const scout = checkpoint('vocabularios-de-conclusao', 'scout', mapaCom('status', 'concluido'))

      expect(scout?.situacao).toBe('concluido')
      expect(scout?.reconhecidoPor).toEqual({ campo: 'status', valor: 'concluido' })
    })

    it('reconhece a falha como falha, que é o único estado que jamais nasce do esquema', () => {
      const arqueologo = checkpoint('checkpoint-que-falhou', 'archaeologist', mapaCom('status', 'failed', 'falhou'))

      expect(arqueologo?.situacao).toBe('falhou')
      expect(arqueologo?.reconhecidoPor).toEqual({ campo: 'status', valor: 'failed' })
    })

    it('reconhece o trabalho em curso declarado noutro nome', () => {
      const arqueologo = checkpoint('checkpoint-que-falhou', 'archaeologist', mapaCom('status', 'failed', 'em-andamento'))

      expect(arqueologo?.situacao).toBe('em-andamento')
    })

    it('NUNCA empresta o instante do campo ao lado, mesmo com `at` válido no checkpoint', () => {
      const scout = checkpoint('vocabularios-de-conclusao', 'scout', mapaCom('status', 'concluido'))

      expect(scout?.instante).toBeNull()
    })

    it('reconhece cada um dos sete vocabulários medidos, quando o par correspondente é aprovado', () => {
      // O par do `arbiter` é o que separa as duas colunas: ele casa em caixa
      // baixa, como o mapa o guarda, e é mostrado como o arquivo o escreve.
      const pares: [string, string, string, string][] = [
        ['scout', 'status', 'concluido', 'concluido'],
        ['archaeologist', 'concluido_em', '2026-09-17', '2026-09-17'],
        ['detective', 'done', 'true', 'true'],
        ['architect', 'status', 'completed', 'completed'],
        ['writer', 'status', 'completo', 'completo'],
        ['reviewer', 'status', 'success', 'success'],
        ['arbiter', 'timestamp', '2026-05-03t12:10:19z', '2026-05-03T12:10:19Z'],
      ]
      for (const [agent, campo, noMapa, bruto] of pares) {
        const lido = checkpoint('vocabularios-de-conclusao', agent, mapaCom(campo, noMapa))
        expect(lido?.situacao, `${agent}: ${campo}`).toBe('concluido')
        expect(lido?.reconhecidoPor, `${agent}: ${campo}`).toEqual({ campo, valor: bruto })
      }
    })

    it('casa o par por campo E valor, nunca pelo campo sozinho', () => {
      const arqueologo = checkpoint('checkpoint-que-falhou', 'archaeologist', mapaCom('status', 'concluido'))

      expect(arqueologo?.situacao).toBe('conclusao-nao-declarada')
      expect(arqueologo?.reconhecidoPor).toBeNull()
    })
  })

  describe('o que o mapa não alcança', () => {
    it('mantém a anomalia da 011 inteira para o par que ninguém aprovou', () => {
      const eixo = readDiscoveryState({ stateJson: fixture('vocabularios-de-conclusao'), anomalias: [] })

      expect(eixo.anomalias).toHaveLength(7)
      expect(eixo.checkpoints.every((c) => c.situacao === 'conclusao-nao-declarada')).toBe(true)
    })

    it('cala a anomalia apenas do checkpoint reconhecido, e deixa as outras em pé', () => {
      const eixo = readDiscoveryState({
        stateJson: fixture('vocabularios-de-conclusao'),
        anomalias: [],
        equivalencias: mapaCom('status', 'concluido'),
      })

      // Dois dos sete carregam `status: "concluido"`, o `scout` e o
      // `archaeologist`, e um par aprovado vale em todo lugar onde aparece
      // (RN-11). Os outros cinco seguem cobrados.
      expect(eixo.anomalias).toHaveLength(5)
      expect(eixo.anomalias.some((a) => a.detail?.startsWith('scout'))).toBe(false)
      expect(eixo.anomalias.some((a) => a.detail?.startsWith('detective'))).toBe(true)
    })

    it('trata mapa vazio exatamente como a feature 011', () => {
      const com = readDiscoveryState({ stateJson: fixture('med-reversa'), anomalias: [], equivalencias: { pares: [], naoAgentes: [] } })
      const sem = readDiscoveryState({ stateJson: fixture('med-reversa'), anomalias: [] })

      expect(com).toEqual(sem)
    })
  })

  describe('as entradas que não nomeiam agente', () => {
    /** The map that approves one key, and nothing else. */
    function mapaComChave(chave: string) {
      return { pares: [], naoAgentes: [{ chave, aprovadoEm: '2026-09-20', evidencia: ['med-reversa'] }] }
    }

    it('tira a chave aprovada da lista de checkpoints e a põe na lista própria', () => {
      const eixo = readDiscoveryState({
        stateJson: fixture('entradas-nao-agentes'),
        anomalias: [],
        equivalencias: mapaComChave('plano_aprovado'),
      })

      expect(eixo.checkpoints.map((c) => c.agent)).not.toContain('plano_aprovado')
      expect(eixo.registrosNaoAgentes.map((r) => r.chave)).toEqual(['plano_aprovado'])
    })

    it('não cobra conclusão de quem não é agente', () => {
      const eixo = readDiscoveryState({
        stateJson: fixture('entradas-nao-agentes'),
        anomalias: [],
        equivalencias: mapaComChave('plano_aprovado'),
      })

      expect(eixo.anomalias.some((a) => a.detail?.startsWith('plano_aprovado'))).toBe(false)
    })

    it('preserva na entrada os mesmos campos de lista que um checkpoint traria', () => {
      const eixo = readDiscoveryState({
        stateJson: fixture('entradas-nao-agentes'),
        anomalias: [],
        equivalencias: mapaComChave('decisoes_autor'),
      })

      expect(eixo.registrosNaoAgentes[0]?.camposComLista).toEqual(['lacunas'])
    })

    it('deixa a chave NÃO aprovada exatamente como a feature 011 a deixava', () => {
      const eixo = readDiscoveryState({ stateJson: fixture('entradas-nao-agentes'), anomalias: [] })

      expect(eixo.registrosNaoAgentes).toEqual([])
      expect(eixo.checkpoints.map((c) => c.agent)).toContain('plano_aprovado')
      expect(eixo.anomalias.some((a) => a.detail?.startsWith('plano_aprovado'))).toBe(true)
    })
  })

  describe('as invariantes que amarram situação, instante e procedência', () => {
    it('deixa a procedência nula sempre que a situação veio do esquema', () => {
      const eixo = readDiscoveryState({ stateJson: fixture('checkpoint-parcial'), anomalias: [] })

      for (const checkpoint of eixo.checkpoints) {
        expect(checkpoint.reconhecidoPor, checkpoint.agent).toBeNull()
      }
    })

    it('nunca traz instante e procedência ao mesmo tempo, em fixtura alguma', () => {
      const nomes = ['med-reversa', 'vocabularios-de-conclusao', 'parcial-com-status', 'entradas-nao-agentes']
      const equivalencias = {
        pares: [
          { campo: 'status', valor: 'concluido', leitura: 'concluido' as const, aprovadoEm: '2026-09-20', evidencia: [] },
          { campo: 'done', valor: 'true', leitura: 'concluido' as const, aprovadoEm: '2026-09-20', evidencia: [] },
        ],
        naoAgentes: [],
      }
      for (const nome of nomes) {
        const eixo = readDiscoveryState({ stateJson: fixture(nome), anomalias: [], equivalencias })
        for (const checkpoint of eixo.checkpoints) {
          const ambos = checkpoint.instante !== null && checkpoint.reconhecidoPor !== null
          expect(ambos, `${nome}/${checkpoint.agent}`).toBe(false)
        }
      }
    })

    it('nunca deixa uma chave nas duas listas ao mesmo tempo', () => {
      const eixo = readDiscoveryState({
        stateJson: fixture('entradas-nao-agentes'),
        anomalias: [],
        equivalencias: {
          pares: [{ campo: 'at', valor: '2026-09-12T08:57:19', leitura: 'concluido', aprovadoEm: '2026-09-20', evidencia: [] }],
          naoAgentes: [{ chave: 'plano_aprovado', aprovadoEm: '2026-09-20', evidencia: [] }],
        },
      })

      const agentes = new Set(eixo.checkpoints.map((c) => c.agent))
      for (const registro of eixo.registrosNaoAgentes) {
        expect(agentes.has(registro.chave), registro.chave).toBe(false)
      }
    })

    it('trata a conclusão não declarada como incompatível com procedência', () => {
      const eixo = readDiscoveryState({ stateJson: fixture('vocabularios-de-conclusao'), anomalias: [] })

      for (const checkpoint of eixo.checkpoints) {
        if (checkpoint.situacao !== 'conclusao-nao-declarada') continue
        expect(checkpoint.reconhecidoPor, checkpoint.agent).toBeNull()
      }
    })
  })

/**
 * A forma elidida do checkpoint desviante (feature 013, T007, T008, T009).
 *
 * Ela existe porque o painel não tinha o que dizer sobre o campo que causou o
 * desvio: dos três casos que sobraram depois da primeira promoção do mapa, dois
 * chegavam à tela sem campo algum nomeado, e o terceiro sem os contadores que
 * sustentam o argumento. Estes casos guardam as três coisas que a decisão
 * implica: que a forma nasce onde se prometeu, que ela não nasce onde não se
 * prometeu, e que o seu conteúdo é forma e nunca conteúdo.
 */
describe('a forma elidida do checkpoint (feature 013)', () => {
  /** O eixo lido sobre a fixtura dos três casos, sem mapa aprovado algum. */
  function casos(mapa?: MapaDeEquivalencias) {
    return readDiscoveryState({
      stateJson: fixture('casos-do-prompt'),
      anomalias: [],
      ...(mapa === undefined ? {} : { equivalencias: mapa }),
    })
  }

  /** Um checkpoint pelo nome do agente, que os casos nomeiam. */
  function checkpoint(nome: string) {
    const achado = casos().checkpoints.find((c) => c.agent === nome)
    if (achado === undefined) throw new Error(`a fixtura não traz ${nome}`)
    return achado
  }

  describe('as chaves e os valores (T007)', () => {
    it('preserva as chaves do disco, inclusive as que o esquema conhece', () => {
      const disco = JSON.parse(fixture('casos-do-prompt')) as {
        checkpoints: Record<string, Record<string, unknown>>
      }

      for (const [agente, entry] of Object.entries(disco.checkpoints)) {
        expect(Object.keys(checkpoint(agente).formaElidida ?? {}), agente).toEqual(
          Object.keys(entry),
        )
      }
    })

    it('nenhum valor é lista ou objeto: a forma que viaja é rasa', () => {
      for (const c of casos().checkpoints) {
        for (const [chave, valor] of Object.entries(c.formaElidida ?? {})) {
          expect(Array.isArray(valor), `${c.agent}.${chave}`).toBe(false)
          expect(typeof valor === 'object' && valor !== null, `${c.agent}.${chave}`).toBe(false)
        }
      }
    })

    it('traz o campo que resolve o caso do scout, que nenhum outro campo transporta', () => {
      const scout = checkpoint('scout')

      expect(scout.formaElidida?.timestamp).toBe('2026-05-03T12:10:19Z')
      // A prova de que o campo era necessário: sem ele, este checkpoint chega
      // à tela sem nada, porque `files` presente cala `camposComLista`.
      expect(scout.camposComLista).toEqual([])
    })

    it('traz os contadores do redator_progress, que sustentam a pergunta que antecede a correção', () => {
      const forma = checkpoint('redator_progress').formaElidida

      expect(forma?.items_done).toBe(3)
      expect(forma?.items_total).toBe(6)
      expect(forma?.last_completed_at).toBe('2026-04-28T20:10:00Z')
    })

    it('reduz as listas à contagem, sem os itens', () => {
      const forma = checkpoint('redator_progress').formaElidida

      expect(forma?.items_pending).toBe('<lista de 3>')
      expect(forma?.items_completed).toBe('<lista de 16>')
      expect(JSON.stringify(forma)).not.toContain('SPEC-GOV-02')
    })

    it('distingue modules_pending vazio de ausente, que é o caso do archaeologist', () => {
      const forma = checkpoint('archaeologist').formaElidida

      expect(forma).toHaveProperty('modules_pending')
      expect(forma?.modules_pending).toBe('<lista de 0>')
    })
  })

  describe('a invariante central: a forma nasce só onde há prompt a compor (T008)', () => {
    it('preenche a forma em todo checkpoint em conclusão não declarada', () => {
      const eixo = casos()

      expect(eixo.checkpoints).toHaveLength(3)
      for (const c of eixo.checkpoints) {
        expect(c.situacao, c.agent).toBe('conclusao-nao-declarada')
        expect(c.formaElidida, c.agent).not.toBeNull()
      }
    })

    it('deixa a forma nula no checkpoint concluído pelo campo canônico', () => {
      const eixo = readDiscoveryState({ stateJson: fixture('checkpoint-parcial'), anomalias: [] })
      const concluido = eixo.checkpoints.find((c) => c.situacao === 'concluido')

      expect(concluido).toBeDefined()
      expect(concluido?.formaElidida).toBeNull()
    })

    it('deixa a forma nula no checkpoint em andamento', () => {
      const eixo = readDiscoveryState({ stateJson: fixture('checkpoint-parcial'), anomalias: [] })
      const andando = eixo.checkpoints.find((c) => c.situacao === 'em-andamento')

      expect(andando).toBeDefined()
      expect(andando?.formaElidida).toBeNull()
    })

    it('deixa a forma nula no checkpoint reconhecido por par aprovado', () => {
      const eixo = casos({
        pares: [
          { campo: 'timestamp', valor: '2026-05-03t12:10:19z', leitura: 'concluido', aprovadoEm: '2026-09-20', evidencia: [] },
        ],
        naoAgentes: [],
      })
      const reconhecido = eixo.checkpoints.find((c) => c.agent === 'scout')

      expect(reconhecido?.situacao).toBe('concluido')
      expect(reconhecido?.formaElidida).toBeNull()
    })

    it('deixa a forma nula no checkpoint que o par aprovado lê como falha', () => {
      const eixo = readDiscoveryState({
        stateJson: fixture('checkpoint-que-falhou'),
        anomalias: [],
        equivalencias: {
          pares: [
            { campo: 'status', valor: 'failed', leitura: 'falhou', aprovadoEm: '2026-09-20', evidencia: [] },
          ],
          naoAgentes: [],
        },
      })
      const falhou = eixo.checkpoints.find((c) => c.situacao === 'falhou')

      expect(falhou).toBeDefined()
      expect(falhou?.formaElidida).toBeNull()
    })

    it('não dá forma a quem não é agente: a chave aprovada sai sem ela', () => {
      const eixo = casos({
        pares: [],
        naoAgentes: [{ chave: 'redator_progress', aprovadoEm: '2026-09-20', evidencia: [] }],
      })

      expect(eixo.registrosNaoAgentes.map((r) => r.chave)).toEqual(['redator_progress'])
      expect(eixo.registrosNaoAgentes[0]).not.toHaveProperty('formaElidida')
    })
  })

  describe('as duas invariantes derivadas (T009)', () => {
    it('forma preenchida implica procedência nula', () => {
      for (const c of casos().checkpoints) {
        if (c.formaElidida === null || c.formaElidida === undefined) continue
        expect(c.reconhecidoPor, c.agent).toBeNull()
      }
    })

    it('forma preenchida implica instante nulo', () => {
      for (const c of casos().checkpoints) {
        if (c.formaElidida === null || c.formaElidida === undefined) continue
        expect(c.instante, c.agent).toBeNull()
      }
    })

    it('vale sobre os sete vocabulários, e não só sobre os três casos', () => {
      const eixo = readDiscoveryState({ stateJson: fixture('vocabularios-de-conclusao'), anomalias: [] })

      expect(eixo.checkpoints.length).toBeGreaterThan(3)
      for (const c of eixo.checkpoints) {
        const temForma = c.formaElidida !== null && c.formaElidida !== undefined
        expect(temForma, c.agent).toBe(c.situacao === 'conclusao-nao-declarada')
      }
    })
  })
})
})
