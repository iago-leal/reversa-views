/**
 * Suíte do carimbo e do resumo (T008).
 *
 * RN-03 fixa o recorte do resumo, e RN-04 manda conferir o carimbo contra a
 * entrada do manifesto em vez de resolver o empate por precedência silenciosa.
 * As duas regras só existem de verdade se o recorte estiver certo: sem ele,
 * toda ressincronização faria todo arquivo parecer editado.
 */

import { describe, expect, it } from 'vitest'
import { createHash } from 'node:crypto'
import {
  LINHAS_DO_CARIMBO,
  MARCA_DE_HERDADO,
  conteudoHerdado,
  escreverCarimbo,
  lerCarimbo,
  resumoDe,
  temCarimbo,
} from '../scripts/heranca/carimbo.js'
import { arquivoCarimbado, carimbo } from './helpers/heranca-fixtures.ts'

const CORPO = "export const x = 1\n"

describe('reconhecimento do carimbo', () => {
  it('a marca da primeira linha é o que decide, e não a extensão', () => {
    expect(temCarimbo(arquivoCarimbado({ caminho: 'packages/a.ts' }, CORPO))).toBe(true)
    expect(temCarimbo(CORPO)).toBe(false)
  })

  it('a marca é a que `PROCEDENCIA.md` fixa', () => {
    expect(MARCA_DE_HERDADO).toBe('/* HERDADO')
    expect(LINHAS_DO_CARIMBO).toBe(7)
  })

  it('arquivo que apenas menciona a marca mais abaixo não conta como carimbado', () => {
    expect(temCarimbo(`${CORPO}/* HERDADO em comentário\n`)).toBe(false)
  })
})

describe('leitura dos campos', () => {
  const texto = arquivoCarimbado(
    { caminho: 'packages/reversa-probe/src/snapshot.ts', adaptacoes: 'A1' },
    CORPO,
  )

  it('extrai origem, caminho, revisão, data e cópia', () => {
    const campos = lerCarimbo(texto)
    expect(campos?.origem).toBe('scrum-harness')
    expect(campos?.caminho).toBe('packages/reversa-probe/src/snapshot.ts')
    expect(campos?.revisao).toBe('420305daa6cdd10858b720a34cb8db67d8e5c5e9')
    expect(campos?.dataDaRevisao).toBe('2026-09-08')
    expect(campos?.copiadoEm).toBe('2026-09-09')
  })

  it('traduz `nenhuma` em lista vazia, e uma lista em identificadores', () => {
    expect(lerCarimbo(arquivoCarimbado({ caminho: 'a.ts' }, CORPO))?.adaptacoes).toEqual([])
    expect(lerCarimbo(texto)?.adaptacoes).toEqual(['A1'])
    const duas = arquivoCarimbado({ caminho: 'a.ts', adaptacoes: 'A1, A3' }, CORPO)
    expect(lerCarimbo(duas)?.adaptacoes).toEqual(['A1', 'A3'])
  })

  it('devolve nulo quando não há carimbo', () => {
    expect(lerCarimbo(CORPO)).toBeNull()
  })
})

describe('recorte do conteúdo herdado (RN-03)', () => {
  it('no arquivo carimbado, o conteúdo começa na linha 8', () => {
    expect(conteudoHerdado(arquivoCarimbado({ caminho: 'a.ts' }, CORPO), true)).toBe(CORPO)
  })

  it('no arquivo isento, o conteúdo é o arquivo inteiro', () => {
    expect(conteudoHerdado(CORPO, false)).toBe(CORPO)
  })

  it('trocar o carimbo não muda o resumo, e trocar o corpo muda', () => {
    const antes = arquivoCarimbado({ caminho: 'a.ts', copiadoEm: '2026-09-09' }, CORPO)
    const depois = arquivoCarimbado({ caminho: 'a.ts', copiadoEm: '2027-01-01' }, CORPO)
    expect(resumoDe(conteudoHerdado(depois, true))).toBe(resumoDe(conteudoHerdado(antes, true)))
    const mexido = arquivoCarimbado({ caminho: 'a.ts' }, `${CORPO}// mexida\n`)
    expect(resumoDe(conteudoHerdado(mexido, true))).not.toBe(resumoDe(conteudoHerdado(antes, true)))
  })
})

describe('forma do resumo', () => {
  it('é o SHA-256 hexadecimal, prefixado pela função que o produziu', () => {
    const esperado = createHash('sha256').update(CORPO, 'utf8').digest('hex')
    expect(resumoDe(CORPO)).toBe(`sha256:${esperado}`)
  })
})

describe('escrita do carimbo', () => {
  it('produz exatamente as sete linhas do contrato, e o leitor as reconhece', () => {
    const escrito = escreverCarimbo({
      origem: 'scrum-harness',
      endereco: 'https://github.com/iago-leal/scrum-harness',
      caminho: 'packages/a.ts',
      revisao: 'abc1234',
      dataDaRevisao: '2026-09-08',
      copiadoEm: '2026-09-09',
      adaptacoes: [],
    })
    expect(escrito.split('\n')).toHaveLength(LINHAS_DO_CARIMBO + 1)
    expect(lerCarimbo(escrito + CORPO)?.caminho).toBe('packages/a.ts')
  })

  it('escreve `nenhuma` quando não há adaptação, como o fixture declara', () => {
    const escrito = escreverCarimbo({
      caminho: 'packages/a.ts',
      revisao: '420305daa6cdd10858b720a34cb8db67d8e5c5e9',
      dataDaRevisao: '2026-09-08',
      copiadoEm: '2026-09-09',
      adaptacoes: [],
    })
    expect(escrito).toBe(carimbo({ caminho: 'packages/a.ts' }))
  })
})
