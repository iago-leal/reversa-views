/**
 * O comando que monta o prompt de vários projetos numa passada (T016).
 *
 * Ele existe porque o painel observa uma raiz por leitura, e os três casos que
 * sobraram depois da primeira promoção moram em três projetos distintos. Enxergar
 * além da raiz observada é a OQ-01 da spec da ponte, feature própria e ainda não
 * decidida; enquanto ela não vem, um comando de manutenção resolve o caso real
 * sem antecipar decisão alguma sobre a tela.
 *
 * Ele mora fora do `npm run build` e fora do pacote, no regime dos auxiliares
 * `estragar:*` e dos dois comandos da feature 012. Três promessas negativas
 * importam mais aqui do que qualquer saída: ele não fala com motor, não escreve
 * em `state.json` de ninguém, e não classifica coisa alguma. As duas primeiras
 * esta suíte verifica executando; a terceira se verifica lendo os `require` do
 * topo do arquivo, e há caso para isso também.
 * @module tests/prompt-harness
 */

import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { casosDaVarredura, escreverPrompt, principal } from '../scripts/prompt-harness.js'

/** A fixtura dos três casos, que é a medição de 2026-09-20. */
const CASOS = JSON.parse(
  readFileSync('tests/fixtures/descoberta/casos-do-prompt.json', 'utf8'),
) as { checkpoints: Record<string, Record<string, unknown>> }

/** As raízes temporárias criadas por um caso, para limpeza no fim. */
const criadas: string[] = []

afterEach(() => {
  while (criadas.length > 0) {
    const pasta = criadas.pop()
    if (pasta !== undefined && existsSync(pasta)) rmSync(pasta, { recursive: true, force: true })
  }
})

/**
 * Uma raiz com um projeto por entrada, cada um com o seu `state.json`.
 * @param projetos - o nome do projeto e o conteúdo do arquivo.
 * @returns o caminho da raiz criada.
 */
function raizCom(projetos: Record<string, unknown>): string {
  const raiz = mkdtempSync(join(tmpdir(), 'prompt-harness-'))
  criadas.push(raiz)
  for (const [nome, doc] of Object.entries(projetos)) {
    const pasta = join(raiz, nome, '.reversa')
    mkdirSync(pasta, { recursive: true })
    writeFileSync(join(pasta, 'state.json'), JSON.stringify(doc, null, 2), 'utf8')
  }
  return raiz
}

/** Um `state.json` com um checkpoint só, tirado da fixtura dos casos. */
function projetoCom(agente: string, phase: string | null = 'geracao'): unknown {
  return {
    version: '1.3.3',
    project: `projeto-de-${agente}`,
    ...(phase === null ? {} : { phase }),
    completed: [],
    checkpoints: { [agente]: CASOS.checkpoints[agente] },
  }
}

describe('a varredura vira casos (T016)', () => {
  it('acha um caso por projeto com checkpoint sem conclusão declarada', () => {
    const raiz = raizCom({
      'TECH+': projetoCom('redator_progress'),
      'ps-iagerasmlk': projetoCom('scout', null),
      transc_audio_mlx: projetoCom('archaeologist', 'concluido'),
    })

    const casos = casosDaVarredura(raiz)

    expect(casos).toHaveLength(3)
    expect(casos.map((c) => c.agente).sort()).toEqual([
      'archaeologist',
      'redator_progress',
      'scout',
    ])
  })

  it('nomeia o projeto e a raiz de cada caso', () => {
    const raiz = raizCom({ 'ps-iagerasmlk': projetoCom('scout', null) })
    const caso = casosDaVarredura(raiz)[0]

    expect(caso?.projeto).toBe('projeto-de-scout')
    expect(caso?.raiz).toBe(join(raiz, 'ps-iagerasmlk'))
  })

  it('carrega a forma elidida, e não o conteúdo', () => {
    const raiz = raizCom({ 'ps-iagerasmlk': projetoCom('scout', null) })
    const caso = casosDaVarredura(raiz)[0]

    expect(caso?.formaElidida?.timestamp).toBe('2026-05-03T12:10:19Z')
    expect(caso?.formaElidida?.files).toBe('<lista de 3>')
    expect(JSON.stringify(caso)).not.toContain('inventory.md')
  })

  it('não vira caso o checkpoint resolvido pelo campo canônico', () => {
    const raiz = raizCom({
      sadio: {
        version: '1.3.3',
        project: 'sadio',
        checkpoints: { scout: { completed_at: '2026-09-09T10:00:00Z', files: ['x.md'] } },
      },
    })

    expect(casosDaVarredura(raiz)).toEqual([])
  })

  it('não vira caso o trabalho parcial declarado pelo campo do esquema', () => {
    const raiz = raizCom({
      andando: {
        version: '1.3.3',
        project: 'andando',
        checkpoints: { scout: { modules_analyzed: ['a'], modules_pending: ['b'] } },
      },
    })

    expect(casosDaVarredura(raiz)).toEqual([])
  })

  it('não vira caso o par que uma pessoa já aprovou', () => {
    const raiz = raizCom({
      decidido: {
        version: '1.3.3',
        project: 'decidido',
        checkpoints: { writer: { status: 'concluido', at: '2026-09-12T08:57:19' } },
      },
    })

    expect(casosDaVarredura(raiz)).toEqual([])
  })

  it('não vira caso a chave aprovada como registro que não é agente', () => {
    const raiz = raizCom({
      registro: {
        version: '1.3.3',
        project: 'registro',
        checkpoints: { plano_aprovado: { decisoes: ['a', 'b'] } },
      },
    })

    expect(casosDaVarredura(raiz)).toEqual([])
  })

  it('raiz inexistente devolve nada, sem lançar', () => {
    expect(casosDaVarredura(join(tmpdir(), 'nao-existe-'.repeat(3)))).toEqual([])
  })

  it('a ordem é estável entre duas varreduras do mesmo disco', () => {
    const raiz = raizCom({
      'TECH+': projetoCom('redator_progress'),
      'ps-iagerasmlk': projetoCom('scout', null),
      transc_audio_mlx: projetoCom('archaeologist', 'concluido'),
    })

    expect(casosDaVarredura(raiz)).toEqual(casosDaVarredura(raiz))
  })
})

describe('o texto que o comando escreve', () => {
  it('traz um bloco por caso, nomeando projeto e agente', () => {
    const raiz = raizCom({
      'TECH+': projetoCom('redator_progress'),
      'ps-iagerasmlk': projetoCom('scout', null),
    })
    const texto = escreverPrompt(casosDaVarredura(raiz))

    expect(texto).toContain('redator_progress')
    expect(texto).toContain('scout')
    expect(texto).toContain('projeto-de-scout')
  })

  it('não traz o conteúdo das listas', () => {
    const raiz = raizCom({ 'ps-iagerasmlk': projetoCom('scout', null) })

    expect(escreverPrompt(casosDaVarredura(raiz))).not.toContain('inventory.md')
  })

  it('é determinístico sobre os mesmos casos', () => {
    const raiz = raizCom({ 'ps-iagerasmlk': projetoCom('scout', null) })
    const casos = casosDaVarredura(raiz)

    expect(escreverPrompt(casos)).toBe(escreverPrompt(casos))
  })
})

describe('as promessas negativas do comando', () => {
  it('não altera o state.json de projeto algum', () => {
    const raiz = raizCom({ 'ps-iagerasmlk': projetoCom('scout', null) })
    const arquivo = join(raiz, 'ps-iagerasmlk', '.reversa', 'state.json')
    const antes = readFileSync(arquivo, 'utf8')
    const saida = join(raiz, 'saida.md')

    principal([`--raiz=${raiz}`, `--saida=${saida}`])

    expect(readFileSync(arquivo, 'utf8')).toBe(antes)
  })

  it('escreve o texto no arquivo pedido, e só nele', () => {
    const raiz = raizCom({ 'ps-iagerasmlk': projetoCom('scout', null) })
    const saida = join(raiz, 'saida.md')

    const codigo = principal([`--raiz=${raiz}`, `--saida=${saida}`])

    expect(codigo).toBe(0)
    expect(readFileSync(saida, 'utf8')).toContain('scout')
  })

  it('sem caso algum, não deixa arquivo pela metade', () => {
    const raiz = raizCom({
      sadio: {
        version: '1.3.3',
        project: 'sadio',
        checkpoints: { scout: { completed_at: '2026-09-09T10:00:00Z' } },
      },
    })
    const saida = join(raiz, 'saida.md')

    const codigo = principal([`--raiz=${raiz}`, `--saida=${saida}`])

    expect(codigo).toBe(0)
    expect(existsSync(saida)).toBe(false)
  })

  it('não importa cliente de motor algum, o que se verifica lendo o arquivo', () => {
    const fonte = readFileSync('scripts/prompt-harness.js', 'utf8')
    const requires = [...fonte.matchAll(/require\('([^']+)'\)/g)].map((m) => m[1])

    expect(requires).not.toContain('./equivalencias/motor')
    expect(requires.some((r) => r?.includes('motor'))).toBe(false)
    expect(fonte).not.toContain('fetch(')
    expect(fonte).not.toContain('http')
  })

  it('não é invocado pelo build', () => {
    const manifesto = JSON.parse(readFileSync('package.json', 'utf8')) as {
      scripts: Record<string, string>
    }

    expect(manifesto.scripts['prompt:harness']).toBeDefined()
    expect(manifesto.scripts.build).not.toContain('prompt')
  })
})
