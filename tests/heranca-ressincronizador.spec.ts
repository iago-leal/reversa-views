/**
 * Suíte do ressincronizador (T013).
 *
 * Duas fases, e a separação entre elas é o desenho: `planejar` monta tudo em
 * memória e nunca toca disco, `aplicar` escreve um plano já aprovado. É assim
 * que RN-09 se cumpre, com o repositório jamais ficando com metade de uma
 * revisão aplicada.
 */

import { readFileSync } from 'node:fs'
import { afterEach, describe, expect, it } from 'vitest'
import { stringify } from 'yaml'
import { aplicar, planejar } from '../scripts/heranca/ressincronizar.js'
import { resumoDe as resumo, conteudoHerdado } from '../scripts/heranca/carimbo.js'
import {
  adaptacaoDeImportacao,
  adaptacoesFixture,
  arquivoCarimbado,
  arvoreTemporaria,
  entradaDeArquivo,
  manifestoFixture,
} from './helpers/heranca-fixtures.ts'
import type { Arvore } from './helpers/heranca-fixtures.ts'

const CAMINHO = 'src/heranca/reversa-probe/src/snapshot.ts'
const NA_ORIGEM = 'packages/reversa-probe/src/snapshot.ts'
const ORIGINAL = "import { readReversa } from '@scrum-harness/reversa-domain'\n"
const ADAPTADO = "import { readReversa } from '../../reversa-domain/src/index.ts'\n"
const CORPO_AQUI = `${ADAPTADO}export const snapshot = 1\n`
const CORPO_NOVO_NA_ORIGEM = `${ORIGINAL}export const snapshot = 2\n`

const REVISAO_NOVA = 'aaaa111bbbb222cccc333dddd444eeee555ffff6'

let arvore: Arvore | null = null
afterEach(() => {
  arvore?.limpar()
  arvore = null
})

function entrada(resumoDoConteudo = resumo(CORPO_AQUI)) {
  return entradaDeArquivo({
    caminho: CAMINHO,
    caminhoNaOrigem: NA_ORIGEM,
    resumo: resumoDoConteudo,
    adaptacoes: ['A1'],
  })
}

function contexto(opcoes: { corpoAqui?: string; corpoNaOrigem?: string } = {}) {
  const corpoAqui = opcoes.corpoAqui ?? CORPO_AQUI
  return {
    manifesto: manifestoFixture({ arquivos: [entrada()] }),
    adaptacoes: adaptacoesFixture([
      adaptacaoDeImportacao({ arquivo: CAMINHO, original: ORIGINAL, adaptado: ADAPTADO }),
    ]),
    local: {
      arquivos: {
        [CAMINHO]: arquivoCarimbado({ caminho: NA_ORIGEM, adaptacoes: 'A1' }, corpoAqui),
      },
      extras: [],
    },
    origem: {
      nome: 'scrum-harness',
      estado: 'disponivel',
      caminho: '/tmp/origem',
      revisaoCorrente: REVISAO_NOVA,
      dataDaRevisao: '2026-10-01',
      arquivos: { [NA_ORIGEM]: opcoes.corpoNaOrigem ?? CORPO_NOVO_NA_ORIGEM },
      extras: [],
    },
    hoje: '2026-10-02',
  }
}

describe('planejamento bem-sucedido', () => {
  it('monta um passo por arquivo que a origem mudou', () => {
    const plano = planejar(contexto())
    expect(plano.ok).toBe(true)
    expect(plano.passos).toHaveLength(1)
    expect(plano.passos[0].caminho).toBe(CAMINHO)
  })

  it('reaplica a adaptação declarada sobre o conteúdo novo', () => {
    const plano = planejar(contexto())
    expect(plano.passos[0].conteudo).toContain(ADAPTADO)
    expect(plano.passos[0].conteudo).not.toContain('@scrum-harness/reversa-domain')
    expect(plano.passos[0].conteudo).toContain('export const snapshot = 2')
  })

  it('reescreve o carimbo com a revisão e a data novas, preservando as adaptações', () => {
    const plano = planejar(contexto())
    const carimbado = plano.passos[0].conteudo
    expect(carimbado).toContain(REVISAO_NOVA)
    expect(carimbado).toContain('2026-10-02')
    expect(carimbado).toContain('A1')
  })

  it('o resumo do passo cobre o conteúdo herdado, e não o carimbo', () => {
    const plano = planejar(contexto())
    const conteudo = conteudoHerdado(plano.passos[0].conteudo, true)
    expect(plano.passos[0].resumo).toBe(resumo(conteudo))
  })

  it('arquivo que a origem não mudou fica de fora do plano', () => {
    const plano = planejar(contexto({ corpoNaOrigem: `${ORIGINAL}export const snapshot = 1\n` }))
    expect(plano.ok).toBe(true)
    expect(plano.passos).toEqual([])
  })
})

describe('recusas', () => {
  it('edição local não declarada para tudo antes de qualquer escrita (RN-08)', () => {
    const plano = planejar(contexto({ corpoAqui: `${ADAPTADO}mexida à mão\n` }))
    expect(plano.ok).toBe(false)
    expect(plano.motivo).toBe('edicao-local')
    expect(plano.passos).toBeUndefined()
  })

  it('a recusa por edição local diz as duas saídas possíveis', () => {
    const plano = planejar(contexto({ corpoAqui: `${ADAPTADO}mexida à mão\n` }))
    expect(plano.saidas).toEqual(
      expect.arrayContaining([expect.stringContaining('declarar'), expect.stringContaining('descartar')]),
    )
  })

  it('adaptação que não casa interrompe a execução inteira (RN-09)', () => {
    const plano = planejar(contexto({ corpoNaOrigem: 'import { readReversa } from "outro"\n' }))
    expect(plano.ok).toBe(false)
    expect(plano.motivo).toBe('adaptacao-nao-casa')
    expect(plano.detalhes[0]).toContain('A1')
  })

  it('a recusa por adaptação mostra o trecho esperado e o encontrado', () => {
    const plano = planejar(contexto({ corpoNaOrigem: 'import { readReversa } from "outro"\n' }))
    expect(plano.esperado).toContain('@scrum-harness/reversa-domain')
    expect(plano.encontrado).toContain('outro')
  })

  it('origem indisponível recusa, dizendo qual caminho configurar', () => {
    const base = contexto()
    const plano = planejar({
      ...base,
      origem: { nome: 'scrum-harness', estado: 'indisponivel', caminho: null, motivo: 'ausente' },
    })
    expect(plano.ok).toBe(false)
    expect(plano.motivo).toBe('origem-indisponivel')
  })

  it('arquivo preso por paridade externa não é ressincronizado sem decisão humana', () => {
    const caminho = 'src/heranca/reversa-domain/tests/fixtures/check-legacy-policy.mjs'
    const naOrigem = 'packages/reversa-domain/tests/fixtures/check-legacy-policy.mjs'
    const plano = planejar({
      manifesto: manifestoFixture({
        arquivos: [
          entradaDeArquivo({
            caminho,
            caminhoNaOrigem: naOrigem,
            resumo: resumo('// gancho\n'),
            carimbado: false,
            adaptacoes: [],
            paridadeExterna: '.reversa/hooks/check-legacy-policy.mjs',
          }),
        ],
      }),
      adaptacoes: adaptacoesFixture(),
      local: { arquivos: { [caminho]: '// gancho\n' }, extras: [] },
      origem: {
        nome: 'scrum-harness',
        estado: 'disponivel',
        caminho: '/tmp/origem',
        revisaoCorrente: REVISAO_NOVA,
        dataDaRevisao: '2026-10-01',
        arquivos: { [naOrigem]: '// gancho novo\n' },
        extras: [],
      },
      hoje: '2026-10-02',
    })
    expect(plano.ok).toBe(false)
    expect(plano.motivo).toBe('paridade-externa')
  })
})

describe('aplicação do plano', () => {
  function montarArvore(): Arvore {
    const manifesto = manifestoFixture({ arquivos: [entrada()] })
    return arvoreTemporaria({
      [CAMINHO]: arquivoCarimbado({ caminho: NA_ORIGEM, adaptacoes: 'A1' }, CORPO_AQUI),
      'src/heranca/manifesto.yml': `# cabeçalho preservado\n${stringify(manifesto)}`,
    })
  }

  it('escreve o arquivo com o conteúdo do plano', () => {
    arvore = montarArvore()
    const plano = planejar(contexto())
    const resultado = aplicar({ raiz: arvore.raiz, plano })
    expect(resultado.escritos).toContain(CAMINHO)
    expect(readFileSync(arvore.caminho(CAMINHO), 'utf8')).toContain('export const snapshot = 2')
  })

  it('atualiza o resumo e a revisão no manifesto, preservando o cabeçalho comentado', () => {
    arvore = montarArvore()
    aplicar({ raiz: arvore.raiz, plano: planejar(contexto()) })
    const texto = readFileSync(arvore.caminho('src/heranca/manifesto.yml'), 'utf8')
    expect(texto).toContain('# cabeçalho preservado')
    expect(texto).toContain(REVISAO_NOVA)
  })

  it('não escreve fora da pasta de herança e do manifesto (RN-07)', () => {
    arvore = montarArvore()
    const resultado = aplicar({ raiz: arvore.raiz, plano: planejar(contexto()) })
    for (const escrito of resultado.escritos) {
      expect(escrito.startsWith('src/heranca/')).toBe(true)
    }
  })

  it('recusa aplicar um plano que não foi aprovado', () => {
    arvore = montarArvore()
    const plano = planejar(contexto({ corpoAqui: `${ADAPTADO}mexida à mão\n` }))
    expect(() => aplicar({ raiz: arvore!.raiz, plano })).toThrow()
    expect(readFileSync(arvore.caminho(CAMINHO), 'utf8')).toContain('export const snapshot = 1')
  })
})
