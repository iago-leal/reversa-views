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
