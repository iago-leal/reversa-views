/**
 * A marcação do cartão de bugs, sobre o documento renderizado (RF-01, RF-02 a
 * RF-06, RF-13, RF-15, RF-16).
 *
 * `react-dom/server` faz as vezes de captura de tela: produz a mesma marcação
 * que o navegador montaria, e todo fato afirmado aqui é fato sobre essa
 * marcação — um atributo, um texto, uma ordem. O que só a tela decide, como cor
 * e contraste, é do portão visual e não daqui.
 *
 * O caso que mais importa é o dos zeros escritos por nome. RF-02 os exige, e a
 * razão é do leitor, não do formato: um bloco que omite "0 abertos" faz o
 * Retomador não saber se não há bug aberto ou se a contagem não foi feita, que é
 * a mesma confusão que a distinção entre ausente e vazio existe para desfazer.
 * @module tests/webview-bugs-section
 */

import type { ReactElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { EffectiveEntry } from '../src/webview/domain/types.ts'
import { EMPTY_PREFERENCES } from '../src/webview/domain/types.ts'
import { sectionOrder } from '../src/webview/domain/sections.ts'
import { App } from '../src/webview/ui/App.tsx'
import { BugsSection } from '../src/webview/ui/BugsSection.tsx'
import {
  absentBugsFixture,
  bugContextFixture,
  bugFixture,
  bugsFixture,
  payloadFixture,
  processFixture,
  requirementsMd,
} from './helpers/reversa-fixtures.ts'
import type { BugRegistry } from '../src/domain/types.ts'

/** Um elemento, e a marcação que o navegador receberia. */
function render(elemento: ReactElement): string {
  return renderToStaticMarkup(elemento)
}

/** O cartão sozinho, aberto, com as portas como contadores. */
function cartao(bugs: BugRegistry | undefined, abertos: string[] = []): string {
  return render(
    <BugsSection
      bugs={bugs}
      collapsed={false}
      onToggle={() => {}}
      onOpenFile={() => {}}
      revealed={new Set(abertos)}
      onReveal={() => {}}
    />,
  )
}

/** O texto do documento, sem as marcas, para conferir frase. */
function texto(marcacao: string): string {
  return marcacao.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ')
}

/**
 * Um painel inteiro, para os casos de posição e de ordem.
 *
 * O processo carrega UMA dúvida de propósito. A faixa de bloqueio é uma seção
 * de RF-14 e precisa estar no documento para que a ordem seja verificável, e um
 * processo desimpedido não desenha faixa alguma. Uma dúvida bloqueia sem
 * degradar, de modo que a leitura continua íntegra e o recolhimento inicial
 * continua sendo o padrão.
 */
function painel(bugs: BugRegistry): string {
  const entry: EffectiveEntry = {
    kind: 'installed',
    rereading: false,
    loaded: payloadFixture({
      bugs,
      process: processFixture({ requirementsMd: requirementsMd(1) }),
    }),
    message: null,
    root: '/w/reversa-views',
    update: null,
  }
  return render(
    <App
      entry={entry}
      update={null}
      notice={null}
      preferences={EMPTY_PREFERENCES}
      theme={{ mode: 'dark', highContrast: false }}
      onReload={() => {}}
      onOpenFile={() => {}}
      onLog={() => {}}
    />,
  )
}

describe('posição e recolhimento do bloco (RF-01)', () => {
  it('o bloco aparece no documento, com o nome de seção declarado', () => {
    expect(painel(bugsFixture())).toContain('data-section="bugs"')
  })

  it('aparece logo depois do histórico, e antes da descoberta', () => {
    const marcacao = painel(bugsFixture())
    const posicao = (nome: string) => marcacao.indexOf(`data-section="${nome}"`)

    expect(posicao('history')).toBeGreaterThan(-1)
    expect(posicao('bugs')).toBeGreaterThan(posicao('history'))
    expect(posicao('discovery')).toBeGreaterThan(posicao('bugs'))
  })

  it('a ordem do documento corresponde à ordem declarada em types.ts', () => {
    const marcacao = painel(bugsFixture())
    const posicoes = sectionOrder().map((nome) => marcacao.indexOf(`data-section="${nome}"`))

    expect(posicoes.every((posicao) => posicao > -1)).toBe(true)
    expect([...posicoes].sort((a, b) => a - b)).toEqual(posicoes)
  })

  it('nasce recolhido, como o histórico, enquanto ninguém declarou preferência', () => {
    const marcacao = painel(bugsFixture())
    const bloco = marcacao.slice(marcacao.indexOf('data-section="bugs"'))

    expect(bloco.slice(0, 120)).toContain('data-collapsed="true"')
  })
})

describe('a repartição do topo, com os zeros por nome (RF-02, RF-03)', () => {
  it('mostra total três e resolvidos três no registro de hoje', () => {
    const conteudo = texto(cartao(bugsFixture()))

    expect(conteudo).toContain('3 resolvidos')
    expect(conteudo).toMatch(/3 bugs/)
  })

  it('escreve os zeros por nome, em vez de omiti-los', () => {
    const conteudo = texto(cartao(bugsFixture()))

    expect(conteudo).toContain('0 abertos')
    expect(conteudo).toContain('0 ativos')
  })

  it('desenha a barra medida pela contagem do registro', () => {
    const marcacao = cartao(bugsFixture())

    expect(marcacao).toContain('data-part="progress"')
    expect(marcacao).toContain('aria-valuemax="3"')
    expect(marcacao).toContain('aria-valuenow="3"')
  })

  it('a barra mede o registro, e não a lista que o recorte deixou em vista', () => {
    const fechados = Array.from({ length: 10 }, (_, i) =>
      bugFixture({ id: `BUG-F${i}`, alterado: `2026-09-${String(i + 1).padStart(2, '0')}` }),
    )
    const marcacao = cartao(bugsFixture([bugContextFixture('ctx', fechados)]))

    expect(marcacao).toContain('aria-valuemax="10"')
    expect(marcacao).toContain('aria-valuenow="10"')
  })

  it('com total zero, elemento de barra algum é desenhado', () => {
    const marcacao = cartao(bugsFixture([bugContextFixture('vazio', [])]))
    expect(marcacao).not.toContain('data-part="progress"')
  })
})

describe('subtítulo e contagem de cada grupo (RN-09, RF-02)', () => {
  it('cada contexto ganha subtítulo com o próprio nome', () => {
    const marcacao = cartao(
      bugsFixture([
        bugContextFixture('alfa', [bugFixture({ id: 'BUG-A' })]),
        bugContextFixture('beta', [bugFixture({ id: 'BUG-B' })]),
      ]),
    )

    expect(marcacao).toContain('data-bug-context="alfa"')
    expect(marcacao).toContain('data-bug-context="beta"')
    expect(texto(marcacao)).toContain('alfa')
    expect(texto(marcacao)).toContain('beta')
  })

  it('a contagem do grupo é a dele, e não a do projeto', () => {
    const marcacao = cartao(
      bugsFixture([
        bugContextFixture('alfa', [bugFixture({ id: 'BUG-A', estado: 'open', travado: false })]),
        bugContextFixture('beta', [bugFixture({ id: 'BUG-B' }), bugFixture({ id: 'BUG-C' })]),
      ]),
    )
    const grupo = (nome: string) => {
      const inicio = marcacao.indexOf(`data-bug-context="${nome}"`)
      return texto(marcacao.slice(inicio, marcacao.indexOf('</li>', inicio)))
    }

    expect(grupo('alfa')).toContain('1 bug')
    expect(grupo('beta')).toContain('2 bugs')
  })

  it('nenhum bug aparece fora do grupo a que pertence', () => {
    const marcacao = cartao(
      bugsFixture([
        bugContextFixture('alfa', [bugFixture({ id: 'BUG-DO-ALFA' })]),
        bugContextFixture('beta', [bugFixture({ id: 'BUG-DO-BETA' })]),
      ]),
    )
    const inicioBeta = marcacao.indexOf('data-bug-context="beta"')

    expect(marcacao.indexOf('BUG-DO-ALFA')).toBeLessThan(inicioBeta)
    expect(marcacao.indexOf('BUG-DO-BETA')).toBeGreaterThan(inicioBeta)
  })
})

describe('a linha de um bug (RF-04, RF-05)', () => {
  it('traz os dez campos, cada um em sua parte', () => {
    const marcacao = cartao(
      bugsFixture([bugContextFixture('ctx', [bugFixture({ id: 'BUG-20260910-74UL' })])]),
    )
    const partes = [
      'bug-id',
      'bug-alias',
      'bug-title',
      'bug-state',
      'bug-phase',
      'bug-severity',
      'bug-priority',
      'bug-created',
      'bug-updated',
      'bug-closed',
    ]
    for (const parte of partes) {
      expect(marcacao, parte).toContain(`data-part="${parte}"`)
    }
  })

  it('um bug encerrado mostra as três datas', () => {
    const marcacao = cartao(
      bugsFixture([
        bugContextFixture('ctx', [
          bugFixture({ id: 'BUG-X', registrado: '2026-09-09', alterado: '2026-09-10', encerrado: '2026-09-10' }),
        ]),
      ]),
    )
    const conteudo = texto(marcacao)

    expect(conteudo).toContain('09/09/2026')
    expect(conteudo).toContain('10/09/2026')
    expect(marcacao).toContain('data-part="bug-closed"')
  })

  it('um bug sem trava mostra duas datas e declara que não foi encerrado', () => {
    const marcacao = cartao(
      bugsFixture([
        bugContextFixture('ctx', [
          bugFixture({ id: 'BUG-ABERTO', estado: 'open', travado: false, encerrado: null }),
        ]),
      ]),
    )

    expect(texto(marcacao).toLowerCase()).toContain('não encerrado')
  })

  it('campo ausente é declarado por nome, e não desenhado em branco', () => {
    const marcacao = cartao(
      bugsFixture([
        bugContextFixture('ctx', [
          bugFixture({
            id: null,
            apelido: null,
            titulo: null,
            estado: null,
            estadoBruto: null,
            fase: null,
            faseBruta: null,
            severidade: null,
            severidadeBruta: null,
            prioridade: null,
            prioridadeBruta: null,
            registrado: null,
            alterado: null,
            encerrado: null,
            travado: false,
          }),
        ]),
      ]),
    )
    const conteudo = texto(marcacao)

    expect(conteudo).toMatch(/não (registrad|declarad|lid)/i)
    expect(marcacao).not.toMatch(/data-part="bug-title"><\/span>/)
  })

  it('o identificador é o único elemento que pede a abertura do arquivo (RF-09)', () => {
    const marcacao = cartao(
      bugsFixture([bugContextFixture('ctx', [bugFixture({ id: 'BUG-CLICAVEL' })])]),
    )
    const aberturas = marcacao.match(/data-action="open-file"/g) ?? []

    expect(aberturas).toHaveLength(1)
    expect(marcacao).toContain(
      'data-path="_reversa_bugs/painel-do-processo/bugs/BUG-CLICAVEL/bug.md"',
    )
  })

  it('valor fora do vocabulário é desenhado cru e marcado como não reconhecido (RF-12)', () => {
    const marcacao = cartao(
      bugsFixture([
        bugContextFixture('ctx', [
          bugFixture({ id: 'BUG-ESTRANHO', estado: null, estadoBruto: 'quase-resolvido' }),
        ]),
      ]),
    )

    expect(texto(marcacao)).toContain('quase-resolvido')
    expect(marcacao).toContain('data-known="false"')
  })

  it('a inconsistência é declarada na linha, sem escolher entre as duas leituras', () => {
    const marcacao = cartao(
      bugsFixture([
        bugContextFixture('ctx', [
          bugFixture({ id: 'BUG-TORTO', travado: false, inconsistencia: 'resolvido-sem-trava' }),
        ]),
      ]),
    )

    expect(marcacao).toContain('data-part="bug-inconsistency"')
    expect(texto(marcacao).toLowerCase()).toContain('trava')
  })
})

describe('o próximo a tratar, único no bloco (RF-06, RN-10)', () => {
  it('exatamente uma linha carrega a marca, por atributo e por palavra', () => {
    const marcacao = cartao(
      bugsFixture([
        bugContextFixture('antigo', [
          bugFixture({ id: 'BUG-ANTIGO', estado: 'open', travado: false, alterado: '2026-09-02' }),
        ]),
        bugContextFixture('recente', [
          bugFixture({ id: 'BUG-RECENTE', estado: 'open', travado: false, alterado: '2026-09-09' }),
        ]),
      ]),
    )
    const marcas = marcacao.match(/data-next="true"/g) ?? []

    expect(marcas).toHaveLength(1)
    expect(marcacao).toContain('data-part="bug-next"')
    const inicio = marcacao.indexOf('data-next="true"')
    expect(marcacao.slice(inicio, inicio + 600)).toContain('BUG-RECENTE')
  })

  it('sem bug em aberto, a marca não aparece e o bloco diz que nada aguarda', () => {
    const marcacao = cartao(bugsFixture())

    expect(marcacao).not.toContain('data-next="true"')
    expect(texto(marcacao).toLowerCase()).toContain('nada aguarda tratamento')
  })
})

describe('os três estados vazios, nomeados um a um (RF-13, RF-16)', () => {
  it('registro ausente: o bloco explica que não há registro neste projeto', () => {
    const marcacao = cartao(absentBugsFixture())

    expect(marcacao).toContain('data-part="bugs-absent"')
    expect(texto(marcacao).toLowerCase()).toContain('não há registro de bugs')
  })

  it('contexto sem bug: o grupo continua na tela, dizendo que está vazio', () => {
    const marcacao = cartao(bugsFixture([bugContextFixture('vazio', [])]))

    expect(marcacao).toContain('data-bug-context="vazio"')
    expect(marcacao).toContain('data-part="bug-group-none"')
  })

  it('bug oculto por restrição: a omissão é declarada, e o conteúdo não aparece', () => {
    const contexto = bugContextFixture('ctx', [bugFixture({ id: 'BUG-VISIVEL' })])
    contexto.contagem = { ...contexto.contagem, total: 2, restritos: 1 }
    const marcacao = cartao(bugsFixture([contexto]))

    expect(marcacao).toContain('data-part="bugs-restricted"')
    expect(texto(marcacao).toLowerCase()).toContain('restrição de visibilidade')
  })

  it('campo ausente do payload: o bloco diz que a leitura não foi feita', () => {
    const marcacao = cartao(undefined)

    expect(marcacao).toContain('data-part="bugs-unread"')
    expect(texto(marcacao).toLowerCase()).not.toContain('não há registro de bugs')
  })
})

describe('leitura parcial acima do teto (RF-15)', () => {
  it('informa quantos existem e quantos foram lidos', () => {
    const marcacao = cartao(
      bugsFixture([bugContextFixture('ctx', [bugFixture({ id: 'BUG-A' })])], {
        contagem: { total: 60, abertos: 0, ativos: 0, resolvidos: 60, restritos: 0 },
        lidos: 50,
        truncado: true,
      }),
    )
    const conteudo = texto(marcacao)

    expect(marcacao).toContain('data-part="bugs-truncated"')
    expect(conteudo).toContain('60')
    expect(conteudo).toContain('50')
  })

  it('sem truncamento, aviso algum de leitura parcial é desenhado', () => {
    expect(cartao(bugsFixture())).not.toContain('data-part="bugs-truncated"')
  })
})

describe('o controle de revelar, um por grupo (RF-08, D-07)', () => {
  /** Um grupo com um aberto e a quantidade pedida de encerrados. */
  function grupoCom(contexto: string, fechados: number) {
    const bugs = [
      bugFixture({ id: `${contexto}-ABERTO`, estado: 'open', travado: false, encerrado: null, alterado: '2026-09-20' }),
    ]
    for (let i = 0; i < fechados; i += 1) {
      bugs.push(
        bugFixture({
          id: `${contexto}-F${String(i).padStart(2, '0')}`,
          alterado: `2026-09-${String(i + 1).padStart(2, '0')}`,
        }),
      )
    }
    return bugContextFixture(contexto, bugs)
  }

  it('cada grupo recortado ganha o próprio controle, nomeando o contexto', () => {
    const marcacao = cartao(bugsFixture([grupoCom('alfa', 10), grupoCom('beta', 10)]))
    const controles = marcacao.match(/data-action="reveal-bugs"/g) ?? []

    expect(controles).toHaveLength(2)
    expect(marcacao).toContain('data-context="alfa"')
    expect(marcacao).toContain('data-context="beta"')
  })

  it('o controle diz quantos ficaram ocultos naquele grupo', () => {
    const marcacao = cartao(bugsFixture([grupoCom('alfa', 10)]))
    expect(texto(marcacao)).toContain('5')
  })

  it('grupo revelado perde o controle e mostra o resto; o outro continua recortado', () => {
    const marcacao = cartao(bugsFixture([grupoCom('alfa', 10), grupoCom('beta', 10)]), ['alfa'])
    const controles = marcacao.match(/data-action="reveal-bugs"/g) ?? []

    // O que o recorte esconde são os mais ANTIGOS, e não os mais recentes: os
    // cinco em vista de cada grupo são F09 a F05, e F00 é o primeiro dos
    // ocultos. Conferir contra o mais recente não distinguiria recortado de
    // revelado.
    expect(controles).toHaveLength(1)
    expect(marcacao).toContain('alfa-F00')
    expect(marcacao).not.toContain('beta-F00')
  })

  it('grupo abaixo do recorte não ganha controle algum', () => {
    const marcacao = cartao(bugsFixture([grupoCom('alfa', 3)]))
    expect(marcacao).not.toContain('data-action="reveal-bugs"')
  })
})
