/**
 * A marcação do cartão da origem, sobre o documento renderizado (RF-10,
 * RF-13, RF-14, RF-15, RF-24, RN-08, RN-13, D-20).
 *
 * As quatro etapas são desenhadas SEMPRE, na ordem canônica, mesmo em projeto
 * sem artefato greenfield: RF-10 pede que o cartão mostre onde a pipeline
 * estaria, e não só onde está. O estado de cada etapa é palavra, nunca só cor.
 *
 * O lugar do brainstorm é reservado e vazio, com atributo próprio, para que a
 * inclusão futura seja acréscimo e não deslocamento (RN-13).
 * @module tests/webview-origin-section
 */

import type { ReactElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { GreenfieldAxis } from '../src/domain/types.ts'
import type { EffectiveEntry } from '../src/webview/domain/types.ts'
import { EMPTY_PREFERENCES } from '../src/webview/domain/types.ts'
import { App } from '../src/webview/ui/App.tsx'
import { OriginSection } from '../src/webview/ui/OriginSection.tsx'
import {
  anchorlessGreenfieldFixture,
  greenfieldFixture,
  legacyGreenfieldFixture,
  partialGreenfieldFixture,
  payloadFixture,
  processFixture,
  requirementsMd,
} from './helpers/reversa-fixtures.ts'

function render(elemento: ReactElement): string {
  return renderToStaticMarkup(elemento)
}

function cartao(greenfield: GreenfieldAxis | undefined): string {
  return render(
    <OriginSection greenfield={greenfield} collapsed={false} onToggle={() => {}} onOpenFile={() => {}} />,
  )
}

function texto(marcacao: string): string {
  return marcacao.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ')
}

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

/** As etapas desenhadas, na ordem do documento, com o estado de cada uma. */
function etapas(marcacao: string): Array<[string, string]> {
  return [...marcacao.matchAll(/data-step="([a-z]+)" data-status="([a-z]+)"/g)].map((m) => [m[1] ?? '', m[2] ?? ''])
}

describe('posição e recolhimento (RF-13, RF-14)', () => {
  it('aparece entre a descoberta e a política', () => {
    const marcacao = painel(greenfieldFixture())
    const posicao = (nome: string) => marcacao.indexOf(`data-section="${nome}"`)
    expect(posicao('origem')).toBeGreaterThan(posicao('discovery'))
    expect(posicao('policy')).toBeGreaterThan(posicao('origem'))
  })

  it('nasce recolhido, com o estágio escrito no título', () => {
    const marcacao = painel(greenfieldFixture())
    const bloco = marcacao.slice(marcacao.indexOf('data-section="origem"'))
    expect(bloco.slice(0, 120)).toContain('data-collapsed="true"')
    const titulo = bloco.slice(0, bloco.indexOf('data-part="body"'))
    expect(texto(titulo)).toContain('Origem do projeto')
    expect(texto(titulo).toLowerCase()).toContain('specs escritas')
  })
})

describe('o que o cartão diz deste projeto (RF-05, RF-06, RF-10)', () => {
  const marcacao = cartao(greenfieldFixture())

  it('cenário e modo, com rótulo legível e atributo consultável', () => {
    expect(marcacao).toContain('data-part="origin-scenario" data-scenario="greenfield"')
    expect(marcacao).toContain('data-part="origin-mode" data-known="true"')
    expect(texto(marcacao)).toContain('Guiado')
  })

  it('a linha de resumo do brief, com o brief clicável', () => {
    expect(texto(marcacao)).toContain('Criar uma extensão para o VSCode')
    expect(marcacao).toContain('data-action="open-file" data-path="_reversa_sdd/newproject-brief.md"')
  })

  it('o último checkpoint em horário de Brasília, com o instante cru no atributo', () => {
    expect(marcacao).toContain('data-part="origin-checkpoint" data-instant="2026-09-09T11:03:11Z"')
    expect(texto(marcacao)).toContain('(Brasília)')
    expect(texto(marcacao)).not.toContain('2026-09-09T11:03:11Z')
  })

  it('as quatro etapas, todas concluídas, na ordem canônica, com o artefato clicável', () => {
    expect(etapas(marcacao)).toEqual([
      ['ideacao', 'done'],
      ['pesquisa', 'done'],
      ['redacao', 'done'],
      ['especificacao', 'done'],
    ])
    expect(marcacao).toContain('data-action="open-file" data-path="_reversa_sdd/ideation.md"')
    expect(marcacao).toContain('data-action="open-file" data-path="_reversa_sdd/personas.md"')
    expect(marcacao).toContain('data-action="open-file" data-path="_reversa_sdd/prd.md"')
    expect(texto(marcacao).match(/concluído/g)?.length).toBeGreaterThanOrEqual(4)
  })

  it('os estágios concluídos do metadado, crus', () => {
    expect(marcacao).toContain('data-part="origin-completed"')
    expect(texto(marcacao)).toContain('spec-sdd')
  })
})

describe('pipeline parada e modo desconhecido', () => {
  it('a etapa corrente é a primeira não concluída, e as seguintes ficam pendentes', () => {
    const marcacao = cartao(partialGreenfieldFixture())
    expect(etapas(marcacao)).toEqual([
      ['ideacao', 'done'],
      ['pesquisa', 'done'],
      ['redacao', 'current'],
      ['especificacao', 'pending'],
    ])
    expect(texto(marcacao)).toContain('corrente')
    expect(texto(marcacao)).toContain('pendente')
  })

  it('modo fora do vocabulário sai cru e marcado como não reconhecido', () => {
    const eixo = greenfieldFixture({
      metadado: { ...(greenfieldFixture().metadado as NonNullable<GreenfieldAxis['metadado']>), modo: 'xyz' },
    })
    const marcacao = cartao(eixo)
    expect(marcacao).toContain('data-part="origin-mode" data-known="false"')
    expect(texto(marcacao)).toContain('xyz')
    expect(texto(marcacao)).toContain('não reconhecido')
  })

  it('sem metadado, os campos dele são declarados ausentes por nome', () => {
    const eixo = greenfieldFixture({ metadado: null })
    const conteudo = texto(cartao(eixo))
    expect(conteudo.toLowerCase()).toContain('modo não registrado')
    expect(conteudo.toLowerCase()).toContain('momento não registrado')
  })
})

describe('o lugar reservado do brainstorm (RF-24, RN-13)', () => {
  it('existe, é nomeado, vem depois das etapas e está vazio', () => {
    const marcacao = cartao(greenfieldFixture())
    const lugar = /<[a-z]+ data-part="origin-brainstorm" data-reserved="brainstorm"[^>]*><\/[a-z]+>/.exec(marcacao)
    expect(lugar).not.toBeNull()
    expect(marcacao.indexOf('data-part="origin-brainstorm"')).toBeGreaterThan(
      marcacao.lastIndexOf('data-step="especificacao"'),
    )
  })

  it('existe também no projeto que não nasceu por /reversa-new', () => {
    expect(cartao(legacyGreenfieldFixture())).toContain('data-reserved="brainstorm"')
  })
})

describe('os vazios (RN-08, RF-15)', () => {
  it('campo ausente: não lido por esta leitura, sem etapas inventadas', () => {
    const marcacao = cartao(undefined)
    expect(marcacao).toContain('data-part="origin-unread"')
    expect(texto(marcacao)).toContain('não foi lido por esta leitura')
    expect(etapas(marcacao)).toEqual([])
  })

  it('projeto legado: a frase que declara a origem, e as quatro etapas pendentes', () => {
    const marcacao = cartao(legacyGreenfieldFixture())
    expect(marcacao).toContain('data-part="origin-absent"')
    expect(texto(marcacao)).toContain('/reversa-new')
    expect(marcacao).toContain('data-part="origin-scenario" data-scenario="legado"')
    expect(etapas(marcacao).map(([, estado]) => estado)).toEqual(['pending', 'pending', 'pending', 'pending'])
  })

  it('projeto sem âncora: a mesma frase, com o cenário sem âncora', () => {
    const marcacao = cartao(anchorlessGreenfieldFixture())
    expect(marcacao).toContain('data-part="origin-absent"')
    expect(marcacao).toContain('data-scenario="sem-ancora"')
  })

  it('o título do cartão não inventa estágio quando o projeto não nasceu por /reversa-new', () => {
    const marcacao = painel(legacyGreenfieldFixture())
    const bloco = marcacao.slice(marcacao.indexOf('data-section="origem"'))
    const titulo = texto(bloco.slice(0, bloco.indexOf('data-part="body"')))
    expect(titulo).toContain('Origem do projeto')
    expect(titulo.toLowerCase()).not.toContain('nenhum artefato')
  })
})
