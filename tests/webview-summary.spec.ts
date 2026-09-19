/**
 * The text of the summary, composed on the screen and travelling ready (RF-12,
 * RF-17, D-11).
 *
 * Ele é montado por função pura na webview, e não no host, por duas razões que
 * a suíte de fronteiras já prende: o host não pode conter caminho de arquivo do
 * Reversa nem nome de estágio, e os rótulos legíveis vivem do lado da tela.
 * O que atravessa a ponte é texto pronto.
 *
 * O determinismo é requisito, e não conveniência: duas montagens sobre o mesmo
 * processo têm de dar o mesmo texto, senão copiar e abrir o documento
 * mostrariam coisas diferentes na mesma sessão.
 * @module tests/webview-summary
 */

import { describe, expect, it } from 'vitest'
import { summaryText } from '../src/webview/domain/summary.ts'
import type { HistoryEntry } from '../src/domain/types.ts'
import {
  actionsMd,
  componentFixture,
  conferenceFixture,
  linkedEntryFixture,
  linkedGreenfieldFixture,
  linkedHistoryFixture,
  UNSPECIFIED,
  emptyProcessFixture,
  greenfieldFixture,
  historyFixture,
  legacyGreenfieldFixture,
  panoramaFixture,
  payloadFixture,
  processFixture,
} from './helpers/reversa-fixtures.ts'

/** Uma entrada de histórico, com o mínimo que cada caso quer dizer. */
function entrada(partes: Partial<HistoryEntry> = {}): HistoryEntry {
  return {
    pasta: '_reversa_forward/001-leitura-do-processo',
    id: '001',
    nomeCurto: 'leitura-do-processo',
    situacao: 'convergida',
    marca: 'nenhuma',
    acoes: { total: 21, fechadas: 21, abertas: 0, emendas: 0 },
    adendo: '_reversa_sdd/addenda/001-leitura-do-processo.md',
    resumo: 'A feature entrega a camada de leitura.',
    ultimoEvento: '2026-09-09T10:00:00Z',
    ...partes,
  }
}

const COM_HISTORICO = payloadFixture({
  history: historyFixture([
    entrada(),
    entrada({
      pasta: '_reversa_forward/002-ponte-e-host',
      id: '002',
      nomeCurto: 'ponte-e-host',
      situacao: 'em-aberto',
      marca: 'pausada',
      acoes: { total: 32, fechadas: 30, abertas: 2, emendas: 0 },
      adendo: null,
      resumo: null,
    }),
  ]),
})

describe('o que o resumo reúne (RF-12)', () => {
  it('nomeia o projeto e o momento da leitura, em horário de Brasília', () => {
    const texto = summaryText(COM_HISTORICO)

    expect(texto).toContain('reversa-views')
    expect(texto).toContain('(Brasília)')
    expect(texto).not.toContain('2026-09-09T15:00:00Z')
  })

  it('diz o estágio da feature ativa pelo rótulo legível, e não pelo valor cru', () => {
    const texto = summaryText(COM_HISTORICO)
    expect(texto).toContain('Execução em progresso')
    expect(texto).not.toContain('coding-em-progresso')
  })

  it('diz quantas ações fecharam sobre o total da feature ativa', () => {
    const texto = summaryText(
      payloadFixture({ process: processFixture({ actionsMd: actionsMd(20, 14) }) }),
    )
    expect(texto).toContain('20')
    expect(texto).toContain('34')
  })

  it('lista cada feature do histórico com identificador e situação', () => {
    const texto = summaryText(COM_HISTORICO)

    expect(texto).toContain('001-leitura-do-processo')
    expect(texto).toContain('002-ponte-e-host')
    expect(texto).toContain('convergida')
  })

  it('leva o resumo de uma linha quando há, e o nome curto quando não há', () => {
    const texto = summaryText(COM_HISTORICO)
    expect(texto).toContain('A feature entrega a camada de leitura.')
    expect(texto).toContain('ponte-e-host')
  })

  it('declara a feature pausada como tal, sem omiti-la', () => {
    expect(summaryText(COM_HISTORICO).toLowerCase()).toContain('pausada')
  })
})

describe('projeto sem feature alguma (RF-13)', () => {
  it('devolve texto que declara a ausência, em vez de texto vazio', () => {
    const texto = summaryText(
      payloadFixture({ process: emptyProcessFixture(), history: historyFixture([]) }),
    )

    expect(texto.length).toBeGreaterThan(40)
    expect(texto.toLowerCase()).toContain('nenhuma feature')
  })

  it('não deixa linha em branco no lugar de um dado ausente', () => {
    const texto = summaryText(
      payloadFixture({ process: emptyProcessFixture(), history: historyFixture([]) }),
    )
    expect(texto.split('\n').filter((linha) => linha.trim().endsWith(':'))).toEqual([])
  })

  it('não lança quando o histórico chega ausente, como faria um host anterior', () => {
    const semRamos = payloadFixture()
    delete (semRamos as { history?: unknown }).history
    expect(() => summaryText(semRamos)).not.toThrow()
  })
})

describe('determinismo (RF-17)', () => {
  it('duas montagens sobre o mesmo processo dão o mesmo texto', () => {
    expect(summaryText(COM_HISTORICO)).toBe(summaryText(COM_HISTORICO))
  })

  it('não consulta o relógio: o momento vem da carga, e não do agora', () => {
    const outro = payloadFixture({ ...COM_HISTORICO, readAt: '2020-01-01T00:00:00Z' })
    expect(summaryText(outro)).toContain('31/12/2019')
  })

  it('cabe folgadamente no teto que o roteador aplica', () => {
    const bytes = new TextEncoder().encode(summaryText(COM_HISTORICO)).length
    expect(bytes).toBeLessThan(65536)
  })
})

/**
 * O bloco do panorama do produto (feature 009, RF-19).
 *
 * Ele entra DEPOIS das entregas anteriores, por acréscimo: nada acima dele muda
 * de texto nem de ordem, e um host anterior, que não envia o eixo, produz um
 * resumo com o bloco presente e a frase de que o eixo não foi lido. O que ele
 * diz é o que o cartão desenha: origem, contagem, componentes na ordem da
 * função pura, fora do plano e o escopo declarado no PRD.
 */
describe('o panorama do produto no resumo (feature 009)', () => {
  it('entra como bloco próprio, depois das entregas anteriores', () => {
    const texto = summaryText(payloadFixture({ greenfield: greenfieldFixture() }))
    expect(texto).toContain('## Panorama do produto')
    expect(texto.indexOf('## Panorama do produto')).toBeGreaterThan(texto.indexOf('## Entregas anteriores'))
  })

  it('diz a origem e o estágio da pipeline pelo rótulo legível', () => {
    const texto = summaryText(payloadFixture({ greenfield: greenfieldFixture() }))
    expect(texto).toContain('/reversa-new')
    expect(texto.toLowerCase()).toContain('specs escritas')
    expect(texto).not.toContain('especificado')
  })

  it('diz quantos componentes planejados convergiram, sobre o total', () => {
    const texto = summaryText(payloadFixture({ greenfield: greenfieldFixture() }))
    expect(texto).toContain('5 de 5 componentes planejados convergidos')
  })

  it('lista cada componente com nome e situação, na ordem da função pura', () => {
    const eixo = greenfieldFixture({
      panorama: panoramaFixture([
        componentFixture({ nome: 'zeta', situacao: 'convergida' }),
        componentFixture({ nome: 'alfa', situacao: 'planejada', pastas: [], adendo: null, acoes: null }),
      ]),
    })
    const texto = summaryText(payloadFixture({ greenfield: eixo }))
    expect(texto.indexOf('alfa')).toBeLessThan(texto.indexOf('zeta'))
    expect(texto).toContain('planejada')
    expect(texto).toContain('convergida')
  })

  it('lista as pastas fora do plano e os itens do escopo do PRD', () => {
    const texto = summaryText(payloadFixture({ greenfield: greenfieldFixture() }))
    expect(texto).toContain('Fora do plano')
    expect(texto).toContain('009-greenfield-e-features-do-prd')
    expect(texto).toContain('Escopo declarado no PRD')
    expect(texto).toContain('Identidade da instalação')
  })

  it('declara que o eixo não foi lido quando o campo falta, e não lança', () => {
    const semEixo = payloadFixture()
    delete (semEixo as { greenfield?: unknown }).greenfield
    expect(() => summaryText(semEixo)).not.toThrow()
    const texto = summaryText(semEixo)
    expect(texto).toContain('## Panorama do produto')
    expect(texto.toLowerCase()).toContain('não foi lido')
  })

  it('declara o projeto que não nasceu por /reversa-new, e não deixa rótulo pendurado', () => {
    const texto = summaryText(payloadFixture({ greenfield: legacyGreenfieldFixture() }))
    expect(texto).toContain('/reversa-new')
    expect(texto.split('\n').filter((linha) => linha.trim().endsWith(':'))).toEqual([])
  })

  it('segue determinístico com o bloco novo', () => {
    const carga = payloadFixture({ greenfield: greenfieldFixture() })
    expect(summaryText(carga)).toBe(summaryText(carga))
  })
})

/**
 * As linhas da feature 010 no resumo consultável (RF-12, D-17): os
 * componentes sem spec no bloco do panorama e a contagem de conferências no
 * bloco das entregas, compostos pela mesma função pura, sem tocar em linha
 * alguma que já existia.
 */
describe('o vínculo e as conferências no resumo (feature 010, RF-12, D-17)', () => {
  const PASTA = '_reversa_forward/002-ponte-e-host'
  const historico = linkedHistoryFixture([], [
    linkedEntryFixture(
      entrada({ pasta: PASTA, id: '002', nomeCurto: 'ponte-e-host' }),
      undefined,
      conferenceFixture('lido', PASTA),
    ),
    linkedEntryFixture(entrada()),
  ])
  const COMPLETO = payloadFixture({ history: historico, greenfield: linkedGreenfieldFixture([...UNSPECIFIED]) })

  /** O bloco de uma seção do resumo, até a próxima. */
  function bloco(texto: string, titulo: string): string {
    const inicio = texto.indexOf(`## ${titulo}`)
    const fim = texto.indexOf('\n## ', inicio + 1)
    return texto.slice(inicio, fim === -1 ? undefined : fim)
  }

  it('o bloco do panorama traz uma linha por componente sem spec, por nome, e a contagem', () => {
    const panorama = bloco(summaryText(COMPLETO), 'Panorama do produto')
    expect(panorama).toContain('3 componentes entregues sem spec.')
    const linhas = panorama.split('\n').filter((l) => /^- (acesso|assistente|operacao)/.test(l))
    expect(linhas.map((l) => l.split(' — ')[0])).toEqual([
      '- acesso-e-identidade',
      '- assistente',
      '- operacao-de-producao',
    ])
    expect(linhas[0]).toContain('002-infra-remota-auth-assistente')
  })

  it('o bloco das entregas traz a contagem de conferências por pasta', () => {
    const entregas = bloco(summaryText(COMPLETO), 'Entregas anteriores')
    expect(entregas).toContain('- 002-ponte-e-host — 2 de 20 conferências registradas')
    expect(entregas).toContain('- 001-leitura-do-processo — sem registro de conferências')
  })

  it('as linhas que já existiam ficam onde estavam, idênticas', () => {
    const antes = summaryText(payloadFixture({ history: historyFixture(historico.entradas.map(({ vinculo, conferencias, ...e }) => e)) }))
    const depois = summaryText(COMPLETO)
    const linhasAntes = bloco(antes, 'Entregas anteriores').split('\n').filter((l) => l.startsWith('- '))
    const linhasDepois = bloco(depois, 'Entregas anteriores').split('\n').filter((l) => l.startsWith('- '))
    expect(linhasDepois.slice(0, linhasAntes.length)).toEqual(linhasAntes)
  })

  it('documento e cópia: duas montagens dão o mesmo texto com as linhas novas', () => {
    expect(summaryText(COMPLETO)).toBe(summaryText(COMPLETO))
  })

  it('sem componente sem spec, uma frase, e não lista vazia', () => {
    const texto = summaryText(payloadFixture({ greenfield: linkedGreenfieldFixture([]) }))
    expect(bloco(texto, 'Panorama do produto')).toContain('Nenhum componente entregue sem spec.')
  })

  it('campos ausentes viram linha de leitura não realizada, e não silêncio', () => {
    const texto = summaryText(payloadFixture())
    expect(bloco(texto, 'Panorama do produto')).toContain('Vínculo declarado não lido por esta leitura.')
    expect(bloco(texto, 'Entregas anteriores')).toContain('Conferências não lidas por esta leitura.')
  })

  it('não deixa rótulo pendurado com as linhas novas', () => {
    const texto = summaryText(COMPLETO)
    expect(texto.split('\n').filter((linha) => linha.trim().endsWith(':'))).toEqual([])
  })
})
