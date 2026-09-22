/**
 * Suíte do julgamento local (T010).
 *
 * São as seis conferências que não dependem de origem alguma, e por isso as
 * únicas que podem entrar no build (RF-19). O julgamento é função pura sobre o
 * manifesto e o estado já lido: quem toca disco é a camada de leitura.
 */

import { describe, expect, it } from 'vitest'
import { julgar } from '../scripts/heranca/verificar.js'
import { resumoDe as resumo } from '../scripts/heranca/carimbo.js'
import {
  adaptacoesFixture,
  arquivoCarimbado,
  entradaDeArquivo,
  manifestoFixture,
} from './helpers/heranca-fixtures.ts'

const CAMINHO = 'src/heranca/reversa-domain/src/state.ts'
const NA_ORIGEM = 'packages/reversa-domain/src/state.ts'
const CORPO = 'export const state = 1\n'
const ARQUIVO = arquivoCarimbado({ caminho: NA_ORIGEM }, CORPO)

function cenario(
  opcoes: {
    arquivos?: Record<string, string | null>
    extras?: string[]
    entradas?: Array<Record<string, unknown>>
  } = {},
) {
  const entradas = opcoes.entradas ?? [
    entradaDeArquivo({ caminho: CAMINHO, caminhoNaOrigem: NA_ORIGEM, resumo: resumo(CORPO) }),
  ]
  return julgar({
    manifesto: manifestoFixture({ arquivos: entradas }),
    adaptacoes: adaptacoesFixture(),
    local: {
      arquivos: opcoes.arquivos ?? { [CAMINHO]: ARQUIVO },
      extras: opcoes.extras ?? [],
    },
    origens: null,
  })
}

/** Os tipos de achado de um julgamento, em ordem de aparição. */
function tipos(resultado: ReturnType<typeof julgar>): string[] {
  return resultado.achados.map((achado) => achado.tipo)
}

describe('árvore alinhada', () => {
  it('não produz achado algum e o veredito é alinhado', () => {
    const resultado = cenario()
    expect(resultado.achados).toEqual([])
    expect(resultado.veredito).toBe('alinhado')
    expect(resultado.impede).toBe(false)
  })

  it('o modo é local quando nenhuma origem foi lida', () => {
    expect(cenario().modo).toBe('local')
  })
})

describe('edição local não declarada', () => {
  it('é apontada nomeando o arquivo e a origem a que ele pertence', () => {
    const resultado = cenario({
      arquivos: { [CAMINHO]: arquivoCarimbado({ caminho: NA_ORIGEM }, `${CORPO}// mexida\n`) },
    })
    expect(tipos(resultado)).toEqual(['editado-localmente'])
    expect(resultado.achados[0].caminho).toBe(CAMINHO)
    expect(resultado.achados[0].origem).toBe('scrum-harness')
    expect(resultado.impede).toBe(true)
  })

  it('trocar apenas o carimbo não conta como edição (RN-03)', () => {
    const resultado = cenario({
      arquivos: {
        [CAMINHO]: arquivoCarimbado({ caminho: NA_ORIGEM, copiadoEm: '2027-03-03' }, CORPO),
      },
    })
    expect(tipos(resultado)).not.toContain('editado-localmente')
  })
})

describe('carimbo', () => {
  it('arquivo herdado sem carimbo é apontado', () => {
    const resultado = cenario({ arquivos: { [CAMINHO]: CORPO } })
    expect(tipos(resultado)).toContain('sem-carimbo')
  })

  it('arquivo isento de carimbo não é cobrado por isso', () => {
    const caminho = 'src/heranca/reversa-domain/tests/fixtures/state.real.json'
    const resultado = cenario({
      entradas: [
        entradaDeArquivo({
          caminho,
          caminhoNaOrigem: 'packages/reversa-domain/tests/fixtures/state.real.json',
          resumo: resumo('{}\n'),
          carimbado: false,
        }),
      ],
      arquivos: { [caminho]: '{}\n' },
    })
    expect(resultado.achados).toEqual([])
  })

  it('carimbo que diz uma revisão e manifesto que diz outra é inconsistência (RN-04)', () => {
    const resultado = cenario({
      arquivos: {
        [CAMINHO]: arquivoCarimbado({ caminho: NA_ORIGEM, revisao: 'outra-revisao' }, CORPO),
      },
    })
    expect(tipos(resultado)).toContain('carimbo-inconsistente')
  })

  it('carimbo que aponta caminho de origem diferente do manifesto também é inconsistência', () => {
    const resultado = cenario({
      arquivos: { [CAMINHO]: arquivoCarimbado({ caminho: 'packages/outro.ts' }, CORPO) },
    })
    expect(tipos(resultado)).toContain('carimbo-inconsistente')
  })
})

describe('presença', () => {
  it('arquivo do manifesto ausente do disco é apontado', () => {
    const resultado = cenario({ arquivos: { [CAMINHO]: null } })
    expect(tipos(resultado)).toEqual(['ausente-do-disco'])
    expect(resultado.impede).toBe(true)
  })

  it('arquivo na pasta de herança fora do manifesto é apontado (RN-02)', () => {
    const resultado = cenario({ extras: ['src/heranca/reversa-domain/src/intruso.ts'] })
    expect(tipos(resultado)).toEqual(['nao-manifestado'])
    expect(resultado.achados[0].caminho).toBe('src/heranca/reversa-domain/src/intruso.ts')
  })
})

describe('paridade externa', () => {
  it('o fixture preso ao gancho instalado é relatado como tal, sem impedir nada', () => {
    const caminho = 'src/heranca/reversa-domain/tests/fixtures/check-legacy-policy.mjs'
    const resultado = cenario({
      entradas: [
        entradaDeArquivo({
          caminho,
          caminhoNaOrigem: 'packages/reversa-domain/tests/fixtures/check-legacy-policy.mjs',
          resumo: resumo('// gancho\n'),
          carimbado: false,
          paridadeExterna: '.reversa/hooks/check-legacy-policy.mjs',
        }),
      ],
      arquivos: { [caminho]: '// gancho\n' },
    })
    expect(tipos(resultado)).toEqual(['paridade-externa'])
    expect(resultado.impede).toBe(false)
  })
})

describe('ida e volta das adaptações (BUG-20260919-BQBJ)', () => {
  /**
   * Um arquivo herdado com adaptações declaradas, julgado sem origem alguma.
   * O carimbo e o manifesto concordam entre si e com o resumo do corpo, para
   * que só a sétima conferência tenha o que dizer.
   */
  function comAdaptacoes(corpo: string, itens: Array<Record<string, unknown>>) {
    const ids = itens.map((item) => String(item.id))
    return julgar({
      manifesto: manifestoFixture({
        arquivos: [
          entradaDeArquivo({
            caminho: CAMINHO,
            caminhoNaOrigem: NA_ORIGEM,
            resumo: resumo(corpo),
            adaptacoes: ids,
          }),
        ],
      }),
      adaptacoes: adaptacoesFixture(itens.map((item) => ({ arquivo: CAMINHO, motivo: 'x', ...item }))),
      local: {
        arquivos: { [CAMINHO]: arquivoCarimbado({ caminho: NA_ORIGEM, adaptacoes: ids.join(', ') }, corpo) },
        extras: [],
      },
      origens: null,
    })
  }

  const INDENTADO = 'function f() {\n  if (x) {\n    novo()\n    outro()\n  }\n}\n'

  it('trecho declarado sem a indentação do arquivo é apontado, e impede, sem origem alguma', () => {
    const resultado = comAdaptacoes(INDENTADO, [
      { id: 'A1', original: 'velho()\n', adaptado: 'novo()\noutro()\n' },
    ])
    expect(tipos(resultado)).toEqual(['adaptacao-nao-reaplica'])
    expect(resultado.achados[0].caminho).toBe(CAMINHO)
    expect(resultado.achados[0].detalhe).toContain('A1')
    expect(resultado.impede).toBe(true)
  })

  it('o mesmo trecho, declarado com a indentação do arquivo, não é apontado', () => {
    const resultado = comAdaptacoes(INDENTADO, [
      { id: 'A1', original: '    velho()\n', adaptado: '    novo()\n    outro()\n' },
    ])
    expect(resultado.achados).toEqual([])
  })

  it('adaptações em sequência sobre a mesma linha, como A12 e A14, não são apontadas', () => {
    const resultado = comAdaptacoes("import { a, c } from './t.ts'\nexport const z = a\n", [
      { id: 'A1', original: "import { a } from './t.ts'\n", adaptado: "import { a, b } from './t.ts'\n" },
      { id: 'A2', original: "import { a, b } from './t.ts'\n", adaptado: "import { a, c } from './t.ts'\n" },
    ])
    expect(resultado.achados).toEqual([])
  })

  it('supressão pura não se simula, e não é apontada', () => {
    const resultado = comAdaptacoes('export const a = 1\n', [
      { id: 'A1', original: "export { b } from './b.ts'\n", adaptado: '' },
    ])
    expect(resultado.achados).toEqual([])
  })

  it('adaptação que ficaria ambígua na origem reconstruída é apontada', () => {
    const resultado = comAdaptacoes('x()\ny()\n', [{ id: 'A1', original: 'x()\n', adaptado: 'y()\n' }])
    expect(tipos(resultado)).toEqual(['adaptacao-nao-reaplica'])
    expect(resultado.achados[0].detalhe).toContain('ambiguo')
  })

  it('arquivo editado localmente recebe só editado-localmente, sem repetir o defeito', () => {
    const ids = ['A1']
    const resultado = julgar({
      manifesto: manifestoFixture({
        arquivos: [
          entradaDeArquivo({
            caminho: CAMINHO,
            caminhoNaOrigem: NA_ORIGEM,
            resumo: resumo(INDENTADO),
            adaptacoes: ids,
          }),
        ],
      }),
      adaptacoes: adaptacoesFixture([
        { id: 'A1', arquivo: CAMINHO, motivo: 'x', original: 'velho()\n', adaptado: 'novo()\noutro()\n' },
      ]),
      local: {
        arquivos: {
          [CAMINHO]: arquivoCarimbado({ caminho: NA_ORIGEM, adaptacoes: 'A1' }, `${INDENTADO}// mexida\n`),
        },
        extras: [],
      },
      origens: null,
    })
    expect(tipos(resultado)).toEqual(['editado-localmente'])
  })
})
