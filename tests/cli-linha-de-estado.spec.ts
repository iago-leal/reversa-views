/**
 * Suíte da linha de estado (T013, feature 016, RF-08, RF-10, D-17, D-18,
 * D-24). Escrita antes do módulo e do campo do quadro que a carrega.
 *
 * É o item de maior risco de regressão na navegação: a janela perde uma linha,
 * e o deslocamento máximo depende dela. O que se prende aqui é que a linha de
 * estado não rola, não conta na altura, cede espaço na ordem combinada e nunca
 * deixa de dizer onde a janela está.
 */

import { describe, expect, it } from 'vitest'
import { estadoInicial } from '../src/cli/navegacao.ts'
import { alturaUtil, comporQuadro, contextoDeNavegacao, linhasDoQuadro } from '../src/cli/quadro/index.ts'
import type { EntradaDoQuadro } from '../src/cli/quadro/index.ts'
import { linhaDeEstado } from '../src/cli/quadro/linha-de-estado.ts'
import { truncar } from '../src/cli/quadro/medidas.ts'
import type { Observacao } from '../src/cli/tipos.ts'
import { sectionOrder } from '../src/webview/domain/sections.ts'
import { actionsMd, payloadFixture, processFixture } from './helpers/reversa-fixtures.ts'

const OBSERVANDO: Observacao = { ativa: true, razaoDaDegradacao: null, ultimaMudanca: null }
const DEGRADADA: Observacao = {
  ativa: false,
  razaoDaDegradacao: 'a assinatura do disco não instalou',
  ultimaMudanca: null,
}
const FRASE = 'Leitura de 21/09/2026, 19h27: esta é a primeira leitura desta sessão.'

/** Um pedido de linha de estado, com o que o caso não diz no padrão. */
function pedido(extra: Partial<Parameters<typeof linhaDeEstado>[0]> = {}) {
  return {
    largura: 120,
    jogo: 'unicode' as const,
    observacao: OBSERVANDO,
    procedencia: FRASE,
    primeira: 0,
    visiveis: 23,
    total: 300,
    ...extra,
  }
}

/** Um pedido de quadro da interface viva, sobre uma carga com decomposição longa. */
function doQuadro(extra: Partial<EntradaDoQuadro> = {}): EntradaDoQuadro {
  const carga = payloadFixture({
    process: processFixture({ actionsMd: actionsMd(40, 60), addendaFiles: [] }),
  })
  const contexto = {
    secoes: sectionOrder(),
    itens: new Map(sectionOrder().map((nome) => [nome, 0] as const)),
    alturaTotal: 0,
    alturaVisivel: 0,
  }
  return {
    entrada: { kind: 'installed', rereading: false, loaded: carga, message: null, root: carga.root, update: null },
    estado: estadoInicial([], contexto),
    largura: 100,
    altura: 24,
    observacao: OBSERVANDO,
    procedencia: 'primeira',
    conferenciaLigada: true,
    apresentacao: { molduras: true, glifos: 'unicode' },
    ...extra,
  }
}

describe('a linha de estado não é linha do quadro (D-17)', () => {
  it('com o quadro mais alto que a janela, ela não entra em `linhas` nem em `alturaTotal`', () => {
    const quadro = comporQuadro(doQuadro())
    const todas = linhasDoQuadro(doQuadro())

    expect(quadro.alturaTotal).toBe(todas.length)
    expect(quadro.alturaTotal).toBeGreaterThan(24)
    expect(quadro.linhaDeEstado).not.toBeNull()
    expect(todas.some((l) => l.texto === quadro.linhaDeEstado?.texto)).toBe(false)
  })

  it('a janela tem `altura - 1` linhas, e a altura útil sai de um lugar só', () => {
    const alvo = doQuadro()
    expect(alturaUtil(alvo)).toBe(23)
    expect(comporQuadro(alvo).linhas).toHaveLength(23)
    expect(contextoDeNavegacao(alvo).alturaVisivel).toBe(23)
  })

  it('fora da interface viva não há linha de estado, e a janela é a altura inteira', () => {
    const alvo = doQuadro({ apresentacao: { molduras: false, glifos: 'unicode' } })
    expect(comporQuadro(alvo).linhaDeEstado).toBeNull()
    expect(alturaUtil(alvo)).toBe(24)
  })

  it('no fim do quadro ela continua lá, e declara que há conteúdo acima', () => {
    const alvo = doQuadro()
    const total = linhasDoQuadro(alvo).length
    const noFim = { ...alvo, estado: { ...alvo.estado, primeiraLinhaVisivel: total - 23 } }
    const quadro = comporQuadro(noFim)

    expect(quadro.linhaDeEstado?.texto).toContain('↑')
    expect(quadro.linhaDeEstado?.texto).not.toContain('↓')
    expect(quadro.linhaDeEstado?.texto).toContain(`de ${total}`)
    expect(quadro.linhas.at(-1)?.texto).toBe(linhasDoQuadro(noFim).at(-1)?.texto)
  })

  it('a procedência está nela, e não no cabeçalho', () => {
    // Larga o bastante para a frase caber inteira: abaixo disso ela é a
    // primeira a ceder espaço, que é a ordem da D-18.
    const alvo = doQuadro({ largura: 180 })
    expect(comporQuadro(alvo).linhaDeEstado?.texto).toContain('primeira leitura desta sessão')
    const cabecalho = linhasDoQuadro(alvo).slice(0, 8).map((l) => l.texto).join('\n')
    expect(cabecalho).not.toContain('primeira leitura desta sessão')
  })
})

describe('a posição declara acima, abaixo ou os dois (RF-08)', () => {
  it('no topo, só abaixo', () => {
    const texto = linhaDeEstado(pedido()).texto
    expect(texto).toContain('linhas 1–23 de 300 ↓')
    expect(texto).not.toContain('↑')
  })

  it('no meio, os dois', () => {
    expect(linhaDeEstado(pedido({ primeira: 100 })).texto).toContain('linhas 101–123 de 300 ↑ ↓')
  })

  it('no fim, só acima', () => {
    expect(linhaDeEstado(pedido({ primeira: 277 })).texto).toContain('linhas 278–300 de 300 ↑')
  })

  it('quadro que cabe na janela não declara nem um nem outro', () => {
    const texto = linhaDeEstado(pedido({ total: 10 })).texto
    expect(texto).toContain('linhas 1–10 de 10')
    expect(texto).not.toMatch(/[↑↓]/)
  })
})

describe('quando a largura falta, os campos cedem na ordem combinada (D-18)', () => {
  it('largura de sobra: procedência inteira, teclas e posição', () => {
    const texto = linhaDeEstado(pedido({ largura: 160 })).texto
    expect(texto).toContain(FRASE)
    expect(texto).toContain('? ajuda')
    expect(texto).toContain('linhas 1–23 de 300')
  })

  it('primeiro a procedência é truncada, com as teclas ainda lá', () => {
    const texto = linhaDeEstado(pedido({ largura: 100 })).texto
    expect(texto).not.toContain(FRASE)
    expect(texto).toContain('…')
    expect(texto).toContain('? ajuda')
    expect(texto).toContain('linhas 1–23 de 300')
  })

  it('depois as teclas somem, e a posição fica', () => {
    const texto = linhaDeEstado(pedido({ largura: 50 })).texto
    expect(texto).not.toContain('? ajuda')
    expect(texto).toContain('linhas 1–23 de 300')
  })

  it('a posição nunca some, nem numa janela mínima', () => {
    expect(linhaDeEstado(pedido({ largura: 24 })).texto).toContain('linhas 1–23 de 300')
  })

  it('em largura alguma a linha passa da largura', () => {
    for (let largura = 1; largura <= 200; largura += 1) {
      const texto = linhaDeEstado(pedido({ largura })).texto
      expect([...texto].length, `largura ${largura}`).toBeLessThanOrEqual(largura)
    }
  })

  it('a posição fica encostada à direita', () => {
    const texto = linhaDeEstado(pedido({ largura: 120 })).texto
    expect([...texto].length).toBe(120)
    expect(texto.endsWith('linhas 1–23 de 300 ↓')).toBe(true)
  })
})

describe('a observação do disco, por glifo próprio (RF-10)', () => {
  it('ativa, abre a linha com o glifo dela, no acento', () => {
    const desenhada = linhaDeEstado(pedido())
    expect(desenhada.trechos[0]).toEqual({ texto: '●', papel: 'acento' })
  })

  it('degradada para intervalo, diz isso no papel de atenção', () => {
    const desenhada = linhaDeEstado(pedido({ observacao: DEGRADADA }))
    expect(desenhada.trechos[0]).toEqual({ texto: '○ por intervalo', papel: 'atencao' })
  })

  it('no jogo de sete bits, a linha inteira cabe em sete bits', () => {
    const texto = linhaDeEstado(
      pedido({ jogo: 'sete-bits', procedencia: 'Leitura de 21/09/2026: releitura pedida por tecla.', primeira: 100 }),
    ).texto
    expect([...texto].every((ponto) => (ponto.codePointAt(0) ?? 0) < 0x80), texto).toBe(true)
    expect(texto).toContain('linhas 101-123 de 300 ^ v')
  })
})

describe('`truncar`, o recorte de uma linha só', () => {
  it('o que cabe sai como entrou', () => {
    expect(truncar('cabe', 10, '…')).toBe('cabe')
  })

  it('o que não cabe termina nas reticências, dentro da largura', () => {
    expect(truncar('não cabe aqui', 8, '…')).toBe('não cab…')
    expect(truncar('não cabe aqui', 8, '...')).toBe('não c...')
  })

  it('conta pontos de código, e não unidades de dezesseis bits', () => {
    expect(truncar('açãoaçãoação', 6, '…')).toBe('açãoa…')
  })

  it('não deixa espaço pendurado antes das reticências', () => {
    expect(truncar('um dois', 4, '…')).toBe('um…')
  })

  it('largura menor que as reticências devolve o que delas couber, e zero devolve nada', () => {
    expect(truncar('texto', 2, '...')).toBe('..')
    expect(truncar('texto', 0, '…')).toBe('')
  })
})
