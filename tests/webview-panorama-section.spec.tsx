/**
 * A marcação do cartão do panorama, sobre o documento renderizado (RF-11,
 * RF-13, RF-15, RN-07, RN-08, D-15, D-16).
 *
 * `react-dom/server` faz as vezes de captura de tela, como nas suítes das
 * features 006 e 008: todo fato afirmado aqui é fato sobre a marcação, um
 * atributo, um texto, uma ordem.
 *
 * Os três vazios de RN-08 são o caso que mais importa: campo ausente, projeto
 * que não nasceu por `/reversa-new` e `sdd/` vazia são três frases distintas, e
 * nenhuma delas é bloco vazio.
 * @module tests/webview-panorama-section
 */

import type { ReactElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import type { GreenfieldAxis } from '../src/domain/types.ts'
import type { EffectiveEntry } from '../src/webview/domain/types.ts'
import { EMPTY_PREFERENCES } from '../src/webview/domain/types.ts'
import { sectionOrder } from '../src/webview/domain/sections.ts'
import { App } from '../src/webview/ui/App.tsx'
import { PanoramaSection } from '../src/webview/ui/PanoramaSection.tsx'
import {
  anchorlessGreenfieldFixture,
  componentFixture,
  greenfieldFixture,
  legacyGreenfieldFixture,
  linkedComponentFixture,
  linkedGreenfieldFixture,
  linkedHistoryFixture,
  panoramaFixture,
  UNSPECIFIED,
  payloadFixture,
  processFixture,
  requirementsMd,
  undecomposedGreenfieldFixture,
} from './helpers/reversa-fixtures.ts'

function render(elemento: ReactElement): string {
  return renderToStaticMarkup(elemento)
}

/** O cartão sozinho, aberto, com o escopo revelado ou não. */
function cartao(greenfield: GreenfieldAxis | undefined, escopoAberto = false): string {
  return render(
    <PanoramaSection
      greenfield={greenfield}
      collapsed={false}
      onToggle={() => {}}
      onOpenFile={() => {}}
      scopeRevealed={escopoAberto}
      onRevealScope={() => {}}
    />,
  )
}

function texto(marcacao: string): string {
  return marcacao.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ')
}

/** Um painel inteiro, com uma dúvida para a faixa existir e a ordem ser verificável. */
function painel(greenfield: GreenfieldAxis): string {
  const entry: EffectiveEntry = {
    kind: 'installed',
    rereading: false,
    loaded: payloadFixture({ greenfield, process: processFixture({ requirementsMd: requirementsMd(1) }) }),
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

describe('posição e recolhimento (RF-13, RF-14)', () => {
  it('aparece entre a decomposição e o histórico', () => {
    const marcacao = painel(greenfieldFixture())
    const posicao = (nome: string) => marcacao.indexOf(`data-section="${nome}"`)
    expect(posicao('panorama')).toBeGreaterThan(posicao('decomposition'))
    expect(posicao('history')).toBeGreaterThan(posicao('panorama'))
  })

  it('a ordem do documento corresponde à ordem declarada, com os onze nomes', () => {
    const marcacao = painel(greenfieldFixture())
    const posicoes = sectionOrder().map((nome) => marcacao.indexOf(`data-section="${nome}"`))
    expect(posicoes.every((posicao) => posicao > -1)).toBe(true)
    expect([...posicoes].sort((a, b) => a - b)).toEqual(posicoes)
  })

  it('nasce aberto, enquanto ninguém declarou preferência', () => {
    const marcacao = painel(greenfieldFixture())
    const bloco = marcacao.slice(marcacao.indexOf('data-section="panorama"'))
    expect(bloco.slice(0, 120)).toContain('data-collapsed="false"')
  })
})

describe('a contagem e a barra (RN-07)', () => {
  it('escreve "5 de 5 componentes planejados convergidos" neste projeto', () => {
    const conteudo = texto(cartao(greenfieldFixture()))
    expect(conteudo).toContain('5 de 5 componentes planejados convergidos')
  })

  it('escreve o zero por nome', () => {
    const eixo = greenfieldFixture({
      panorama: panoramaFixture([componentFixture({ nome: 'a', situacao: 'planejada', pastas: [], adendo: null, acoes: null })]),
    })
    expect(texto(cartao(eixo))).toContain('0 de 1 componentes planejados convergidos')
  })

  it('desenha a barra com o total de specs como denominador', () => {
    const marcacao = cartao(greenfieldFixture())
    expect(marcacao).toContain('data-part="progress"')
    expect(marcacao).toContain('aria-valuemax="5"')
    expect(marcacao).toContain('aria-valuenow="5"')
  })

  it('declara a divergência entre a contagem e a lista, sem escolher', () => {
    const eixo = greenfieldFixture({ panorama: panoramaFixture(undefined, { convergidos: 3 }) })
    const marcacao = cartao(eixo)
    expect(marcacao).toContain('data-part="panorama-divergence"')
    expect(texto(marcacao)).toContain('3')
  })

  it('declara a leitura parada no teto, com os dois números', () => {
    const eixo = greenfieldFixture({ panorama: panoramaFixture(undefined, { totalDeSpecs: 60, truncado: true }) })
    const conteudo = texto(cartao(eixo))
    expect(cartao(eixo)).toContain('data-part="panorama-truncated"')
    expect(conteudo).toContain('60')
    expect(conteudo).toContain('5')
  })
})

describe('a linha de cada componente (RF-11)', () => {
  it('traz nome, situação e marca como texto, e os atributos consultáveis', () => {
    const eixo = greenfieldFixture({
      panorama: panoramaFixture([
        componentFixture({ nome: 'painel', situacao: 'em-andamento', marca: 'ativa', adendo: null }),
      ]),
    })
    const marcacao = cartao(eixo)
    expect(marcacao).toContain('data-component="painel"')
    expect(marcacao).toContain('data-situation="em-andamento"')
    expect(marcacao).toContain('data-mark="ativa"')
    expect(texto(marcacao)).toContain('em andamento')
    expect(texto(marcacao)).toContain('feature ativa')
  })

  it('a spec e o adendo são clicáveis, pela mensagem que o resto do painel usa', () => {
    const marcacao = cartao(greenfieldFixture())
    expect(marcacao).toContain('data-action="open-file" data-path="_reversa_sdd/sdd/ponte-e-host.md"')
    expect(marcacao).toContain('data-action="open-file" data-path="_reversa_sdd/addenda/002-ponte-e-host.md"')
  })

  it('a pasta não é clicável: é diretório, e o editor abre documentos', () => {
    const marcacao = cartao(greenfieldFixture())
    expect(marcacao).not.toContain('data-path="_reversa_forward/002-ponte-e-host"')
    expect(marcacao).toContain('_reversa_forward/002-ponte-e-host')
  })

  it('um componente planejado declara por nome que não tem pasta nem ações', () => {
    const eixo = greenfieldFixture({
      panorama: panoramaFixture([componentFixture({ nome: 'a', situacao: 'planejada', pastas: [], adendo: null, acoes: null })]),
    })
    const conteudo = texto(cartao(eixo))
    expect(conteudo).toContain('planejada')
    expect(conteudo.toLowerCase()).toContain('sem pasta')
    expect(conteudo.toLowerCase()).toContain('sem adendo')
  })

  it('agrupa por situação na ordem da função pura, com o rótulo do grupo', () => {
    const eixo = greenfieldFixture({
      panorama: panoramaFixture([
        componentFixture({ nome: 'a', situacao: 'convergida' }),
        componentFixture({ nome: 'b', situacao: 'planejada', pastas: [], adendo: null, acoes: null }),
      ]),
    })
    const marcacao = cartao(eixo)
    expect(marcacao.indexOf('data-component-group="planejada"')).toBeLessThan(
      marcacao.indexOf('data-component-group="convergida"'),
    )
  })
})

describe('fora do plano (RN-05)', () => {
  it('lista cada pasta sem spec, com situação e marca, e a contagem à parte', () => {
    const marcacao = cartao(greenfieldFixture())
    expect(marcacao).toContain('data-part="unplanned"')
    expect(marcacao).toContain('data-unplanned="_reversa_forward/009-greenfield-e-features-do-prd"')
    expect(texto(marcacao)).toContain('4 features fora do plano')
    expect(texto(marcacao)).toContain('feature ativa')
  })

  it('declara por nome quando não há pasta fora do plano', () => {
    const eixo = greenfieldFixture({ panorama: panoramaFixture(undefined, { foraDoPlano: [] }) })
    expect(cartao(eixo)).toContain('data-part="unplanned-none"')
  })
})

describe('o escopo declarado no PRD (RF-11, D-16)', () => {
  it('nasce recolhido dentro do cartão, com o controle próprio e a contagem', () => {
    const marcacao = cartao(greenfieldFixture())
    expect(marcacao).toContain('data-part="scope" data-revealed="false"')
    expect(marcacao).toContain('data-action="reveal-scope"')
    expect(marcacao).not.toContain('data-scope-item')
    expect(texto(marcacao)).toContain('4 itens')
  })

  it('revelado, agrupa pelos rótulos do PRD e desenha nome, detalhe e selo, sem situação', () => {
    const marcacao = cartao(greenfieldFixture(), true)
    expect(marcacao).toContain('data-revealed="true"')
    expect(marcacao).toContain('data-scope-group')
    expect(texto(marcacao)).toContain('Núcleo, o que responde')
    expect(marcacao).toContain('data-part="scope-name"')
    expect(marcacao).toContain('data-part="scope-detail"')
    expect(marcacao).toContain('data-part="scope-seal"')
    const escopo = marcacao.slice(marcacao.indexOf('data-part="scope"'))
    expect(escopo).not.toContain('data-situation')
  })

  it('o `prd.md` é clicável no bloco do escopo', () => {
    const marcacao = cartao(greenfieldFixture(), true)
    const escopo = marcacao.slice(marcacao.indexOf('data-part="scope"'))
    expect(escopo).toContain('data-action="open-file" data-path="_reversa_sdd/prd.md"')
  })

  it('PRD sem seção reconhecível diz isso por nome', () => {
    const eixo = greenfieldFixture({ panorama: panoramaFixture(undefined, { escopo: [], escopoEncontrado: false }) })
    expect(cartao(eixo, true)).toContain('data-part="scope-missing"')
  })
})

describe('os três vazios (RN-08, RF-15)', () => {
  it('campo ausente: não lido por esta leitura', () => {
    const marcacao = cartao(undefined)
    expect(marcacao).toContain('data-part="panorama-unread"')
    expect(texto(marcacao)).toContain('não foi lido por esta leitura')
    expect(marcacao).not.toContain('data-part="panorama-counts"')
  })

  it('projeto legado: não nasceu por /reversa-new', () => {
    const marcacao = cartao(legacyGreenfieldFixture())
    expect(marcacao).toContain('data-part="panorama-absent"')
    expect(texto(marcacao)).toContain('/reversa-new')
    expect(marcacao).not.toContain('data-part="panorama-counts"')
  })

  it('projeto sem âncora alguma também não nasceu por /reversa-new', () => {
    expect(cartao(anchorlessGreenfieldFixture())).toContain('data-part="panorama-absent"')
  })

  it('`sdd/` vazia: decomposição ainda não feita, e o resto do cartão segue', () => {
    const marcacao = cartao(undecomposedGreenfieldFixture(), true)
    expect(marcacao).toContain('data-part="panorama-undecomposed"')
    expect(texto(marcacao).toLowerCase()).toContain('decomposição')
    expect(marcacao).toContain('data-part="unplanned"')
    expect(marcacao).toContain('data-part="scope"')
  })

  it('nenhum dos três desenha bloco vazio', () => {
    for (const eixo of [undefined, legacyGreenfieldFixture(), undecomposedGreenfieldFixture()]) {
      expect(cartao(eixo)).not.toMatch(/<ul[^>]*>\s*<\/ul>/)
    }
  })
})

/* ------------------------------------------------------------ feature 010 */

describe('a origem de cada ligação (feature 010, RF-13, D-15)', () => {
  it('cada pasta ligada traz a origem em texto', () => {
    const marcacao = cartao(linkedGreenfieldFixture())
    const leitura = marcacao.slice(marcacao.indexOf('data-component="leitura-do-processo"'))
    expect(leitura).toContain('data-link="_reversa_forward/001-leitura-do-processo"')
    expect(leitura).toContain('data-origin="nome"')
    expect(texto(leitura)).toContain('pelo nome')
  })

  it('a ligação declarada abre o `legacy-impact.md` da pasta pela mensagem de abertura', () => {
    const ajustes = linkedComponentFixture(
      { nome: 'ajustes', pastas: ['_reversa_forward/002-infra-remota-auth-assistente'] },
      'declarada',
    )
    const eixo = linkedGreenfieldFixture([], { componentes: [ajustes], totalDeSpecs: 1, convergidos: 1 })
    const abrir = vi.fn()
    const marcacao = render(
      <PanoramaSection
        greenfield={eixo}
        collapsed={false}
        onToggle={() => {}}
        onOpenFile={abrir}
        scopeRevealed={false}
        onRevealScope={() => {}}
      />,
    )
    const ligacao = marcacao.slice(marcacao.indexOf('data-link="_reversa_forward/002-infra-remota-auth-assistente"'))
    expect(ligacao).toContain('data-origin="declarada"')
    expect(ligacao).toContain(
      'data-action="open-file" data-path="_reversa_forward/002-infra-remota-auth-assistente/legacy-impact.md"',
    )
    expect(texto(ligacao)).toContain('declarada')
  })

  it('a origem é texto, e não só cor: a palavra está na marcação', () => {
    const marcacao = cartao(linkedGreenfieldFixture())
    expect(marcacao).toMatch(/data-part="link-origin"[^>]*>[^<]*pelo nome/)
  })
})

describe('o bloco "Entregues sem spec" (feature 010, RF-04, D-16)', () => {
  it('fica entre os grupos de componentes e "Fora do plano", ordenado por nome', () => {
    const marcacao = cartao(linkedGreenfieldFixture([...UNSPECIFIED]))
    const bloco = marcacao.indexOf('data-part="unspecified"')
    expect(bloco).toBeGreaterThan(marcacao.lastIndexOf('data-component-group='))
    expect(bloco).toBeLessThan(marcacao.indexOf('data-part="unplanned"'))
    const nomes = [...marcacao.matchAll(/data-unspecified="([^"]+)"/g)].map((m) => m[1])
    expect(nomes).toEqual(['acesso-e-identidade', 'assistente', 'operacao-de-producao'])
  })

  it('cada componente sem spec traz a pasta que o declara, clicável para o `legacy-impact.md`, e a situação', () => {
    const marcacao = cartao(linkedGreenfieldFixture([...UNSPECIFIED]))
    const assistente = marcacao.slice(marcacao.indexOf('data-unspecified="assistente"'))
    expect(assistente).toContain(
      'data-path="_reversa_forward/002-infra-remota-auth-assistente/legacy-impact.md"',
    )
    expect(texto(assistente)).toContain('002-infra-remota-auth-assistente')
    expect(assistente).toContain('data-situation="convergida"')
    expect(texto(assistente)).toContain('sem spec')
  })

  it('a frase de contagem é própria, separada da dos planejados', () => {
    const marcacao = cartao(linkedGreenfieldFixture([...UNSPECIFIED]))
    expect(marcacao).toMatch(/data-part="unspecified-counts"[^>]*>3 componentes entregues sem spec/)
    expect(texto(marcacao)).toContain('5 de 5 componentes planejados convergidos')
  })

  it('no singular, um componente', () => {
    const marcacao = cartao(linkedGreenfieldFixture([UNSPECIFIED[1]!]))
    expect(marcacao).toMatch(/data-part="unspecified-counts"[^>]*>1 componente entregue sem spec/)
  })

  it('sem componente sem spec, o bloco é uma frase', () => {
    const marcacao = cartao(linkedGreenfieldFixture([]))
    expect(marcacao).toContain('data-part="unspecified-none"')
    expect(texto(marcacao)).toContain('Nenhum componente entregue sem spec')
    expect(marcacao).not.toContain('data-unspecified=')
  })

  it('o vínculo parcial é dito por frase', () => {
    const marcacao = cartao(linkedGreenfieldFixture([], { vinculoParcial: true }))
    expect(marcacao).toContain('data-part="link-partial"')
    expect(texto(marcacao)).toContain('Vínculo declarado parcial')
  })

  it('host anterior: "vínculo declarado não lido", sem bloco vazio e sem origem', () => {
    const marcacao = cartao(greenfieldFixture())
    expect(marcacao).toContain('data-part="link-unread"')
    expect(texto(marcacao).toLowerCase()).toContain('vínculo declarado não lido')
    expect(marcacao).not.toContain('data-part="unspecified"')
    expect(marcacao).not.toContain('data-part="unspecified-none"')
    expect(marcacao).not.toContain('data-origin=')
    // As pastas continuam ditas, como na 009.
    expect(marcacao).toContain('data-part="component-folders"')
  })
})

describe('as anomalias do histórico na seção de anomalias (feature 010, RF-11)', () => {
  it('entram na lista depois das do eixo greenfield', () => {
    const entry: EffectiveEntry = {
      kind: 'installed',
      rereading: false,
      loaded: payloadFixture({
        greenfield: greenfieldFixture({
          anomalias: [{ file: '_reversa_sdd/prd.md', code: 'escopo-do-prd-nao-encontrado' }],
        }),
        history: linkedHistoryFixture([
          {
            file: '_reversa_forward/002-x/onboarding.md',
            code: 'tabela-nao-reconhecida',
            detail: '9. Registro de conferências: Marco | Item | Resultado',
          },
        ]),
      }),
      message: null,
      root: '/w/reversa-views',
      update: null,
    }
    const marcacao = render(
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
    const secao = marcacao.slice(marcacao.indexOf('data-section="anomalies"'))
    expect(secao).toContain('tabela-nao-reconhecida')
    expect(secao).toContain('Marco | Item | Resultado')
    expect(secao.indexOf('escopo-do-prd-nao-encontrado')).toBeLessThan(secao.indexOf('tabela-nao-reconhecida'))
  })
})
