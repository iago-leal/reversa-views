/**
 * Suíte do quadro puro (T011 e T044, feature 014, D-05).
 *
 * O quadro é função pura de carga, estado de navegação e dimensões, e devolve
 * linhas com ênfase ABSTRATA. É o que permite conferir a tela inteira sem
 * abrir um terminal, que é a dívida de teste que toda interface viva traz.
 *
 * O que esta suíte prende: as onze seções na ordem fixa, o bloqueio antes de
 * tudo, o recorte à largura sem cortar palavra, a rolagem, a ausência de
 * qualquer sequência de escape, as quatro situações de entrada com título e
 * corpo próprios, e a linha que declara de onde veio a leitura corrente.
 */

import { describe, expect, it } from 'vitest'
import { estadoInicial } from '../src/cli/navegacao.ts'
import type { ContextoDeNavegacao } from '../src/cli/navegacao.ts'
import type { EntradaDoQuadro } from '../src/cli/quadro/index.ts'
import {
  artefatoSelecionado,
  comporQuadro,
  contextoDeNavegacao,
  CURSOR,
  linhasDoQuadro,
} from '../src/cli/quadro/index.ts'
import { situacaoDaEntrada, telaDeEntrada } from '../src/cli/quadro/entrada.ts'
import { linhasDaProcedencia } from '../src/cli/quadro/procedencia.ts'
import { TITULOS } from '../src/cli/quadro/secoes.ts'
import type { EstadoDeNavegacao, Observacao } from '../src/cli/tipos.ts'
import { ENFASES } from '../src/cli/tipos.ts'
import { sectionOrder } from '../src/webview/domain/sections.ts'
import type { EffectiveEntry } from '../src/webview/domain/types.ts'
import { actionsMd, payloadFixture, processFixture } from './helpers/reversa-fixtures.ts'

/** A observação que instalou e nada ainda mudou. */
const OBSERVANDO: Observacao = { ativa: true, razaoDaDegradacao: null, ultimaMudanca: null }

/** Uma entrada de leitura íntegra, com a carga que o painel também recebe. */
function entrada(partes: Partial<EffectiveEntry> = {}): EffectiveEntry {
  return {
    kind: 'installed',
    rereading: false,
    loaded: payloadFixture(),
    message: null,
    root: '/w/reversa-views',
    update: null,
    ...partes,
  }
}

/** O que o quadro precisa para se desenhar, com o resto no padrão. */
function pedido(partes: Partial<EntradaDoQuadro> = {}): EntradaDoQuadro {
  const alvo = partes.entrada ?? entrada()
  const estado = partes.estado ?? estadoInicial([], contextoVazio())
  return {
    entrada: alvo,
    estado,
    largura: 80,
    altura: 400,
    observacao: OBSERVANDO,
    procedencia: 'primeira',
    conferenciaLigada: true,
    ...partes,
  }
}

/** Um contexto suficiente para o estado inicial nascer na primeira seção. */
function contextoVazio(): ContextoDeNavegacao {
  return {
    secoes: sectionOrder(),
    itens: new Map(sectionOrder().map((nome) => [nome, 0] as const)),
    alturaTotal: 0,
    alturaVisivel: 0,
  }
}

/** Uma linha sem a marca do cursor, que ocupa o mesmo lugar do recuo. */
function semCursor(texto: string): string {
  return (texto.startsWith(CURSOR) ? texto.slice(CURSOR.length) : texto).trimStart()
}

/** O texto de todas as linhas, e não só o da janela visível. */
function textos(partes: Partial<EntradaDoQuadro> = {}): string[] {
  return linhasDoQuadro(pedido(partes)).map((linha) => linha.texto)
}

describe('as onze seções, na ordem que o painel fixa (RN-04)', () => {
  it('desenha um título por seção, na ordem de `sectionOrder`', () => {
    const linhas = textos()
    const posicoes = sectionOrder().map((nome) =>
      linhas.findIndex((texto) => semCursor(texto).startsWith(TITULOS[nome])),
    )
    expect(posicoes.every((posicao) => posicao >= 0)).toBe(true)
    expect([...posicoes].sort((a, b) => a - b)).toEqual(posicoes)
  })

  it('a ordem não varia com o processo lido', () => {
    const outro = entrada({
      loaded: payloadFixture({ process: processFixture({ actionsMd: actionsMd(5, 0) }) }),
    })
    // Os NOMES das seções, e não as linhas: a contagem ao lado do título é
    // conteúdo, e muda com a leitura de propósito. O que não pode mudar é a
    // sequência em que elas aparecem.
    const ordem = (alvo: EffectiveEntry) =>
      textos({ entrada: alvo }).flatMap((texto) =>
        sectionOrder().filter((nome) => semCursor(texto).startsWith(TITULOS[nome])),
      )
    expect(ordem(outro)).toEqual(sectionOrder())
    expect(ordem(entrada())).toEqual(sectionOrder())
  })

  it('nomeia as onze, e nenhuma a mais', () => {
    expect(Object.keys(TITULOS).sort()).toEqual([...sectionOrder()].sort())
  })
})

describe('o bloqueio humano vem antes de tudo (RF-05)', () => {
  const bloqueado = entrada({
    loaded: payloadFixture({
      process: processFixture({ actionsMd: actionsMd(5, 0), addendaFiles: [] }),
    }),
  })

  it('a faixa aparece antes do histórico', () => {
    const linhas = textos({ entrada: bloqueado })
    const faixa = linhas.findIndex((texto) => texto.includes(TITULOS.blocking))
    const historico = linhas.findIndex((texto) => texto.includes(TITULOS.history))
    expect(faixa).toBeGreaterThanOrEqual(0)
    expect(faixa).toBeLessThan(historico)
  })

  it('nomeia a razão e o comando sugerido', () => {
    const linhas = textos({ entrada: bloqueado })
    expect(linhas.some((texto) => texto.includes('/reversa-sync'))).toBe(true)
  })

  it('a faixa carrega o artefato que a confirmação abriria', () => {
    const linhas = linhasDoQuadro(pedido({ entrada: bloqueado }))
    expect(linhas.some((linha) => linha.artefato !== null)).toBe(true)
  })
})

describe('o recorte à largura, sem cortar palavra (RF-19)', () => {
  for (const largura of [40, 60, 80, 120]) {
    it(`nenhuma linha passa de ${largura} colunas`, () => {
      for (const texto of textos({ largura })) {
        expect([...texto].length, texto).toBeLessThanOrEqual(largura)
      }
    })
  }

  it('não parte palavra ao meio quando a palavra cabe na largura', () => {
    // Trinta é o limite seguro: a quarenta colunas, descontado o recuo dos
    // itens e o da continuação, sobram trinta e seis. Palavra maior que a
    // linha inteira é outro caso, e esse a função parte de propósito.
    const inteiras = new Set(
      textos({ largura: 200 })
        .join(' ')
        .split(/\s+/)
        .filter((palavra) => palavra.length > 0 && palavra.length <= 30),
    )
    const estreitas = new Set(textos({ largura: 40 }).join(' ').split(/\s+/))
    const partidas = [...inteiras].filter((palavra) => !estreitas.has(palavra))
    expect(partidas, `palavras partidas a 40 colunas: ${partidas.join(', ')}`).toEqual([])
  })
})

describe('a rolagem', () => {
  it('a altura total é a do quadro inteiro, e não a da janela', () => {
    const quadro = comporQuadro(pedido({ altura: 10 }))
    expect(quadro.alturaTotal).toBe(linhasDoQuadro(pedido({ altura: 10 })).length)
    expect(quadro.alturaTotal).toBeGreaterThan(10)
  })

  it('a janela entrega no máximo a altura pedida', () => {
    expect(comporQuadro(pedido({ altura: 10 })).linhas).toHaveLength(10)
  })

  it('o deslocamento escolhe qual pedaço do quadro aparece', () => {
    const todas = linhasDoQuadro(pedido({ altura: 10 }))
    const estado: EstadoDeNavegacao = {
      ...estadoInicial([], contextoVazio()),
      primeiraLinhaVisivel: 5,
    }
    const quadro = comporQuadro(pedido({ altura: 10, estado }))
    expect(quadro.linhas[0].texto).toBe(todas[5].texto)
  })

  it('quadro menor que a janela não é preenchido com linha inventada', () => {
    const quadro = comporQuadro(pedido({ altura: 5000 }))
    expect(quadro.linhas).toHaveLength(quadro.alturaTotal)
  })
})

describe('a ênfase é abstrata (D-05)', () => {
  it('nenhuma linha carrega sequência de escape', () => {
    for (const texto of textos()) {
      expect(texto.includes('\u001b'), texto).toBe(false)
    }
  })

  it('toda ênfase usada é uma das cinco nomeadas', () => {
    for (const linha of linhasDoQuadro(pedido())) {
      expect(ENFASES).toContain(linha.enfase)
    }
  })

  it('exatamente uma linha é a selecionada, e é dela que sai o artefato', () => {
    const contexto = contextoDeNavegacao(pedido())
    const estado = estadoInicial([], contexto)
    const linhas = linhasDoQuadro(pedido({ estado }))
    expect(linhas.filter((linha) => linha.enfase === 'selecionada')).toHaveLength(1)
    const selecionada = linhas.find((linha) => linha.enfase === 'selecionada')
    expect(artefatoSelecionado(pedido({ estado }))).toBe(selecionada?.artefato ?? null)
  })
})

describe('o cabeçalho (RN-06, RF-22)', () => {
  it('declara a raiz observada e o instante da leitura', () => {
    const linhas = textos()
    expect(linhas.some((texto) => texto.includes('/w/reversa-views'))).toBe(true)
    expect(linhas.some((texto) => texto.startsWith('Lido em'))).toBe(true)
  })

  it('declara o carimbo da construção e a revisão do modelo herdado', () => {
    const linhas = textos().join('\n')
    expect(linhas).toContain('0.6.1')
    expect(linhas).toContain('Modelo herdado')
  })

  it('declara o desfecho da conferência quando há um', () => {
    const comDesfecho = entrada({ update: { estado: 'atrasada', commits: 4 } })
    expect(textos({ entrada: comDesfecho }).join('\n')).toContain('4')
  })

  it('declara que a conferência está desligada em vez de silenciar (RF-23)', () => {
    const linhas = textos({ conferenciaLigada: false }).join('\n')
    expect(linhas.toLowerCase()).toContain('conferência')
  })
})

describe('as quatro situações de entrada (T042, T044, RF-04)', () => {
  const SITUACOES = ['raiz-inexistente', 'sem-reversa', 'integra', 'falha'] as const

  for (const situacao of SITUACOES) {
    it(`\`${situacao}\` tem título e corpo próprios, e nenhum deles é vazio`, () => {
      const tela = telaDeEntrada(situacao, { caminho: '/nao/existe', mensagem: 'ilegível' })
      expect(tela.titulo.trim().length).toBeGreaterThan(0)
      expect(tela.corpo.length).toBeGreaterThan(0)
      expect(tela.corpo.every((linha) => linha.trim().length > 0)).toBe(true)
    })
  }

  it('os quatro títulos são distintos entre si', () => {
    const titulos = SITUACOES.map((s) => telaDeEntrada(s, {}).titulo)
    expect(new Set(titulos).size).toBe(SITUACOES.length)
  })

  it('a de projeto sem Reversa explica como instalá-lo, por não ser erro', () => {
    const tela = telaDeEntrada('sem-reversa', {})
    expect(tela.corpo.join('\n')).toContain('npx reversa init')
  })

  it('a de raiz inexistente nomeia o caminho recusado', () => {
    expect(telaDeEntrada('raiz-inexistente', { caminho: '/nao/existe' }).corpo.join('\n')).toContain(
      '/nao/existe',
    )
  })

  it('a de falha repete a mensagem recebida', () => {
    expect(telaDeEntrada('falha', { mensagem: 'estado ilegível' }).corpo.join('\n')).toContain(
      'estado ilegível',
    )
  })

  it('a situação sai do estado de entrada, e não de um segundo julgamento', () => {
    expect(situacaoDaEntrada(entrada())).toBe('integra')
    expect(situacaoDaEntrada(entrada({ kind: 'no-reversa' }))).toBe('sem-reversa')
    expect(situacaoDaEntrada(entrada({ kind: 'error', loaded: null }))).toBe('falha')
    expect(situacaoDaEntrada(entrada({ kind: 'no-folder', loaded: null }))).toBe('raiz-inexistente')
  })

  it('nenhuma das quatro produz quadro vazio', () => {
    for (const alvo of [
      entrada(),
      entrada({ kind: 'no-reversa' }),
      entrada({ kind: 'error', loaded: null, message: 'ilegível' }),
      entrada({ kind: 'no-folder', loaded: null }),
    ]) {
      expect(textos({ entrada: alvo }).length).toBeGreaterThan(0)
    }
  })
})

describe('a linha da procedência (T043, T044, RN-09)', () => {
  it('declara que a leitura é a primeira', () => {
    expect(linhasDaProcedencia('primeira', '2026-09-20T12:00:00Z', OBSERVANDO).join('\n')).toContain(
      'primeira',
    )
  })

  it('declara a releitura pedida por tecla', () => {
    const linha = linhasDaProcedencia('tecla', '2026-09-20T12:00:00Z', OBSERVANDO).join('\n')
    expect(linha).toContain('tecla')
  })

  it('declara a mudança que veio sozinha, e quando', () => {
    const linha = linhasDaProcedencia(
      'observacao',
      '2026-09-20T12:00:00Z',
      { ...OBSERVANDO, ultimaMudanca: '2026-09-20T12:00:00Z' },
    ).join('\n')
    expect(linha).toContain('observação')
    expect(linha).toMatch(/\d{2}\/\d{2}\/\d{4}|\d{2}:\d{2}/)
  })

  it('declara a degradação da observação com a razão, em vez de silenciar (D-11)', () => {
    const degradada: Observacao = {
      ativa: false,
      razaoDaDegradacao: 'a assinatura do disco não instalou neste sistema',
      ultimaMudanca: null,
    }
    const linha = linhasDaProcedencia('primeira', '2026-09-20T12:00:00Z', degradada).join('\n')
    expect(linha).toContain('a assinatura do disco não instalou neste sistema')
    expect(linha).toContain('intervalo')
  })

  it('a linha aparece no quadro, e não só na função que a compõe', () => {
    const linhas = textos({ procedencia: 'observacao' })
    expect(linhas.some((texto) => texto.includes('observação'))).toBe(true)
  })
})

describe('o diagnóstico (RF-07, RF-08)', () => {
  it('a contagem da leitura degradada fica sempre visível', () => {
    const degradada = entrada({
      loaded: payloadFixture({
        probe: { ...payloadFixture().probe, truncated: ['_reversa_sdd/prd.md'] },
      }),
    })
    const linhas = textos({ entrada: degradada }).join('\n')
    expect(linhas).toContain('Leitura degradada')
  })

  it('a leitura íntegra também se declara, em vez de calar', () => {
    expect(textos().join('\n')).toContain('Leitura íntegra')
  })
})
