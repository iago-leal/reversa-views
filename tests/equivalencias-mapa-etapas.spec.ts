/**
 * O mapa com etapas (feature 015, D-06): o gerador as lê, as escreve e as
 * carrega, e uma promoção de checkpoints não apaga o que já foi aprovado.
 *
 * É o risco maior da feature. `lerMapaDeModulo` devolvia só as duas listas da
 * 012, e a promoção funde sobre o que ele devolve: o que não volta da leitura
 * deixa de existir no módulo regenerado.
 * @module tests/equivalencias-mapa-etapas
 */

import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { chaveDaEtapa, fundir, gerarModulo, lerMapaDeModulo } from '../scripts/equivalencias/gerar-mapa.js'

const HOJE = '2026-09-21'
const VAZIO = { pares: [], naoAgentes: [] }
const NADA = { pares: [], chaves: [] }

/** Um mapa com uma etapa aprovada num dia anterior. */
function comEtapa(nome = 'saneamento', evidencia = ['afla']) {
  return { pares: [], naoAgentes: [], etapas: [{ nome, aprovadoEm: '2026-09-01', evidencia }] }
}

describe('a fusão das etapas', () => {
  it('acrescenta a etapa aprovada, com a data e a evidência', () => {
    const mapa = fundir(VAZIO, { ...NADA, etapas: [{ nome: 'saneamento' }] }, HOJE, {
      [chaveDaEtapa('saneamento')]: ['afla'],
    })

    expect(mapa.etapas).toEqual([{ nome: 'saneamento', aprovadoEm: HOJE, evidencia: ['afla'] }])
  })

  it('guarda o nome aparado e em minúsculas, com os diacríticos', () => {
    const mapa = fundir(VAZIO, { ...NADA, etapas: [{ nome: '  Documentação ' }] }, HOJE)

    expect(mapa.etapas.map((e: { nome: string }) => e.nome)).toEqual(['documentação'])
  })

  it('não duplica a etapa já aprovada: mantém a data antiga e une a evidência', () => {
    const mapa = fundir(comEtapa(), { ...NADA, etapas: [{ nome: 'saneamento' }] }, HOJE, {
      [chaveDaEtapa('saneamento')]: ['tcr-ana-luisa', 'afla'],
    })

    expect(mapa.etapas).toEqual([
      { nome: 'saneamento', aprovadoEm: '2026-09-01', evidencia: ['afla', 'tcr-ana-luisa'] },
    ])
  })

  it('ordena por nome, para que o diff mostre a decisão e não a ordem de leitura', () => {
    const mapa = fundir(VAZIO, { ...NADA, etapas: [{ nome: 'saneamento' }, { nome: 'auditoria-cruzada' }] }, HOJE)

    expect(mapa.etapas.map((e: { nome: string }) => e.nome)).toEqual(['auditoria-cruzada', 'saneamento'])
  })

  it('cada nome é registro independente: nenhum campo de grupo ou de sinônimo', () => {
    const mapa = fundir(VAZIO, { ...NADA, etapas: [{ nome: 'regressao' }, { nome: 'verificacao-regressao' }] }, HOJE)

    for (const etapa of mapa.etapas) expect(Object.keys(etapa).sort()).toEqual(['aprovadoEm', 'evidencia', 'nome'])
  })

  it('promover um par de checkpoint sobre mapa com etapa deixa a etapa intacta', () => {
    const aprovado = { pares: [{ campo: 'status', valor: 'ok', leitura: 'concluido' }], chaves: [] }
    const mapa = fundir(comEtapa(), aprovado, HOJE)

    expect(mapa.pares).toHaveLength(1)
    expect(mapa.etapas).toEqual(comEtapa().etapas)
  })

  it('aceita o mapa da 012, sem a lista, como mapa sem etapas', () => {
    expect(fundir(VAZIO, NADA, HOJE).etapas).toEqual([])
  })

  it('não altera o mapa que recebe', () => {
    const atual = comEtapa()
    fundir(atual, { ...NADA, etapas: [{ nome: 'saneamento' }] }, HOJE, { [chaveDaEtapa('saneamento')]: ['outro'] })

    expect(atual).toEqual(comEtapa())
  })
})

describe('o módulo gerado e a sua releitura', () => {
  it('escreve etapas sempre, depois de naoAgentes, mesmo vazia', () => {
    const modulo = gerarModulo(fundir(VAZIO, NADA, HOJE))

    expect(modulo).toContain('  etapas: [],\n}\n')
    expect(modulo.indexOf('etapas:')).toBeGreaterThan(modulo.indexOf('naoAgentes:'))
  })

  it('a releitura devolve as etapas que o módulo traz', () => {
    const mapa = fundir(comEtapa(), NADA, HOJE)

    expect(lerMapaDeModulo(gerarModulo(mapa))).toEqual(mapa)
  })

  it('gerar, reler e gerar de novo dá o mesmo texto', () => {
    const mapa = fundir(comEtapa("re-extracao'; process.exit(1) //", ['a\\b']), NADA, HOJE)
    const modulo = gerarModulo(mapa)

    expect(gerarModulo(lerMapaDeModulo(modulo))).toBe(modulo)
  })

  it('lê o módulo vigente, que ainda não tem a lista, como mapa sem etapas', () => {
    const vigente = lerMapaDeModulo(readFileSync('src/domain/equivalencias.ts', 'utf8'))

    expect(vigente.pares.length).toBeGreaterThan(0)
    expect(vigente.etapas ?? []).toEqual(expect.any(Array))
  })

  it('o ciclo inteiro: promover checkpoint sobre módulo com etapa, e a etapa continua no módulo', () => {
    const antes = gerarModulo(fundir(comEtapa(), NADA, HOJE))
    const aprovado = { pares: [{ campo: 'done', valor: 'sim', leitura: 'concluido' }], chaves: [] }
    const depois = gerarModulo(fundir(lerMapaDeModulo(antes), aprovado, HOJE))

    expect(lerMapaDeModulo(depois).etapas).toEqual(comEtapa().etapas)
  })
})
