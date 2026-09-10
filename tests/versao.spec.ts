/**
 * Suíte da derivação da versão (T013), contra `scripts/versao.js`.
 *
 * A regra tem duas armadilhas, e são elas que esta suíte guarda. A primeira é a
 * monotonicidade: o segundo número sai do MAIOR número de feature com adendo, e
 * não da quantidade de adendos, porque apagar um adendo intermediário faria a
 * versão recuar (D-09, RF-19). A segunda é a data de referência do terceiro
 * número: o commit que ACRESCENTOU o adendo, e nunca o que o tocou por último,
 * porque adendo emendado meses depois não é adendo novo.
 *
 * Nada aqui toca disco nem chama git. A derivação recebe o acesso ao mundo como
 * parâmetro, e é isso que permite exercitar a ausência de clone sem desmontar
 * um, e a ausência de adendo sem apagar nenhum.
 * @module tests/versao
 */

import { describe, expect, it } from 'vitest'
import {
  PASTA_DOS_ADENDOS,
  VERSAO_DE_RECUO,
  derivarVersao,
  maiorAdendo,
} from '../scripts/versao.js'

/** Os seis adendos que o repositório tem hoje. */
const SEIS = [
  '001-leitura-do-processo.md',
  '002-ponte-e-host.md',
  '003-painel-do-processo.md',
  '004-heranca-e-sincronia.md',
  '005-empacotamento-e-verificacao.md',
  '006-cartoes-e-cronologia.md',
]

/** Um mundo de mentira, com o que cada caso precisa dizer. */
function mundo(
  opcoes: {
    adendos?: string[] | null
    cabeca?: string | null
    commitDoAdendo?: string | null
    distancia?: number | null
  } = {},
) {
  const {
    adendos = SEIS,
    cabeca = 'ffffffffffffffffffffffffffffffffffffffff',
    commitDoAdendo = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    distancia = 1,
  } = opcoes
  return {
    listarAdendos: () => adendos,
    revisao: () => cabeca,
    commitDeAcrescimo: () => commitDoAdendo,
    contar: () => distancia,
  }
}

describe('o maior número de feature, sobre nomes de arquivo', () => {
  it('é o maior, e vem com o arquivo de onde saiu', () => {
    expect(maiorAdendo(SEIS)).toEqual({ numero: 6, arquivo: '006-cartoes-e-cronologia.md' })
  })

  it('não é a quantidade: seis arquivos e seis é coincidência desta rodada', () => {
    const comBuraco = ['001-a.md', '004-d.md']
    expect(maiorAdendo(comBuraco)).toEqual({ numero: 4, arquivo: '004-d.md' })
  })

  it('ignora o que não segue o formato de três dígitos e nome', () => {
    const misturados = ['LEIA-ME.md', 'rascunho.txt', '00-curto.md', '0007-longo.md', '003-c.md']
    expect(maiorAdendo(misturados)).toEqual({ numero: 3, arquivo: '003-c.md' })
  })

  it('não encontra nada numa pasta sem adendo algum', () => {
    expect(maiorAdendo([])).toBeNull()
    expect(maiorAdendo(['LEIA-ME.md'])).toBeNull()
  })

  it('a ordem em que os nomes chegam não muda a resposta', () => {
    expect(maiorAdendo([...SEIS].reverse())).toEqual(maiorAdendo(SEIS))
  })
})

describe('a derivação completa (RF-18)', () => {
  it('com seis adendos e um commit posterior, produz 0.6.1', () => {
    const resultado = derivarVersao('/clone', mundo())
    expect(resultado.versao).toBe('0.6.1')
    expect(resultado.recuo).toBeNull()
  })

  it('o primeiro campo fica em zero, que é a decisão que ninguém precisa tomar hoje', () => {
    expect(derivarVersao('/clone', mundo({ distancia: 40 })).versao).toBe('0.6.40')
  })

  it('o terceiro campo é a distância até a cabeça, e zero é valor legítimo', () => {
    expect(derivarVersao('/clone', mundo({ distancia: 0 })).versao).toBe('0.6.0')
  })

  it('declara de que adendo e de que commit o número saiu', () => {
    const resultado = derivarVersao('/clone', mundo())
    expect(resultado.adendo).toBe('006-cartoes-e-cronologia.md')
    expect(resultado.feature).toBe(6)
    expect(resultado.patch).toBe(1)
    expect(resultado.commit).toBe('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')
  })

  it('sai na forma de três inteiros que o manifesto do editor exige', () => {
    expect(derivarVersao('/clone', mundo()).versao).toMatch(/^\d+\.\d+\.\d+$/)
  })
})

describe('monotonicidade: a versão não recua (RF-19)', () => {
  it('apagado um adendo do MEIO, o número não muda', () => {
    const antes = derivarVersao('/clone', mundo()).versao
    const semOTres = SEIS.filter((nome) => !nome.startsWith('003'))
    const depois = derivarVersao('/clone', mundo({ adendos: semOTres })).versao
    expect(depois).toBe(antes)
  })

  it('apagados quatro dos seis, o número ainda não muda, porque o maior ficou', () => {
    const soDoisRestam = ['001-leitura-do-processo.md', '006-cartoes-e-cronologia.md']
    expect(derivarVersao('/clone', mundo({ adendos: soDoisRestam })).versao).toBe('0.6.1')
  })

  it('acrescentado um adendo novo, o número cresce', () => {
    const comSete = [...SEIS, '007-atualizacao-e-progresso.md']
    const resultado = derivarVersao('/clone', mundo({ adendos: comSete }))
    expect(resultado.versao).toBe('0.7.1')
    expect(resultado.adendo).toBe('007-atualizacao-e-progresso.md')
  })

  it('contar a QUANTIDADE, e não o maior, é o que teria feito recuar', () => {
    // A asserção mede a distância entre a regra escolhida e a descartada, para
    // que ninguém "simplifique" a primeira na segunda: cinco arquivos cujo
    // maior é seis produziriam 0.5.x sob a regra errada.
    const semOTres = SEIS.filter((nome) => !nome.startsWith('003'))
    expect(semOTres).toHaveLength(5)
    expect(derivarVersao('/clone', mundo({ adendos: semOTres })).feature).toBe(6)
  })

  it('duas derivações sobre o mesmo mundo dão o mesmo número', () => {
    expect(derivarVersao('/clone', mundo())).toEqual(derivarVersao('/clone', mundo()))
  })
})

describe('os quatro recuos, cada um com causa nomeada (D-10, RF-21)', () => {
  it('sem a pasta de adendos, recua e nomeia a pasta que falta', () => {
    const resultado = derivarVersao('/clone', mundo({ adendos: null }))
    expect(resultado.versao).toBe(VERSAO_DE_RECUO)
    expect(resultado.recuo?.causa).toBe('sem-pasta-de-adendos')
    expect(resultado.recuo?.explicacao).toContain(PASTA_DOS_ADENDOS)
  })

  it('com a pasta vazia, recua por falta de adendo', () => {
    const resultado = derivarVersao('/clone', mundo({ adendos: [] }))
    expect(resultado.versao).toBe(VERSAO_DE_RECUO)
    expect(resultado.recuo?.causa).toBe('sem-adendo')
  })

  it('fora de um clone git, recua por falta de clone', () => {
    const resultado = derivarVersao('/pasta', mundo({ cabeca: null }))
    expect(resultado.versao).toBe(VERSAO_DE_RECUO)
    expect(resultado.recuo?.causa).toBe('sem-clone')
    // O que já se sabia continua dito: a pasta tinha adendo, e isso ajuda quem
    // lê a mensagem a entender que o problema não é o Reversa.
    expect(resultado.feature).toBe(6)
  })

  it('com adendo não versionado, recua por falta de histórico e nomeia o arquivo', () => {
    const resultado = derivarVersao('/clone', mundo({ commitDoAdendo: null }))
    expect(resultado.versao).toBe(VERSAO_DE_RECUO)
    expect(resultado.recuo?.causa).toBe('sem-historico')
    expect(resultado.recuo?.explicacao).toContain('006-cartoes-e-cronologia.md')
  })

  it('com a contagem impossível, recua por falta de histórico', () => {
    const resultado = derivarVersao('/clone', mundo({ distancia: null }))
    expect(resultado.versao).toBe(VERSAO_DE_RECUO)
    expect(resultado.recuo?.causa).toBe('sem-historico')
  })

  it('todo recuo devolve número desenhável, e nunca nulo nem cadeia vazia', () => {
    const mundos = [
      mundo({ adendos: null }),
      mundo({ adendos: [] }),
      mundo({ cabeca: null }),
      mundo({ commitDoAdendo: null }),
      mundo({ distancia: null }),
    ]
    for (const ferramentas of mundos) {
      const resultado = derivarVersao('/x', ferramentas)
      expect(resultado.versao).toMatch(/^\d+\.\d+\.\d+$/)
      expect(resultado.recuo).not.toBeNull()
    }
  })

  it('todo recuo explica em prosa, e não só por código', () => {
    const resultado = derivarVersao('/x', mundo({ adendos: [] }))
    expect(resultado.recuo?.explicacao.length).toBeGreaterThan(30)
  })
})

describe('sobre o repositório real', () => {
  it('deriva um número, e o faz sem recuo, porque este clone tem adendos e histórico', () => {
    const resultado = derivarVersao(process.cwd())
    expect(resultado.recuo).toBeNull()
    expect(resultado.versao).toMatch(/^0\.\d+\.\d+$/)
    // Não se fixa o número: ele cresce a cada commit, e um teste que o fixasse
    // ficaria vermelho no commit seguinte. O que se fixa é a REGRA.
    expect(resultado.feature).toBeGreaterThanOrEqual(6)
  })
})
