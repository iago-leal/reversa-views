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
 *
 * MUDANÇA DE DISPOSIÇÃO (feature 016, T026). O visual do painel trocou a
 * ênfase por linha por trechos com papel, pôs um glifo antes do título de cada
 * seção, levou o dado secundário para linha própria e emoldurou o cabeçalho, o
 * bloqueio e a situação de entrada. Cada caso tocado por isso está marcado
 * como "disposição" no próprio caso. Nenhuma expectativa de FATO, de ORDEM ou
 * de AUSÊNCIA DE SEQUÊNCIA DE ESCAPE foi afrouxada: o que os casos afirmavam
 * sobre o que a tela diz, continuam afirmando.
 */

import { describe, expect, it } from 'vitest'
import { estadoInicial } from '../src/cli/navegacao.ts'
import type { ContextoDeNavegacao } from '../src/cli/navegacao.ts'
import type { EntradaDoQuadro } from '../src/cli/quadro/index.ts'
import {
  artefatoSelecionado,
  blocoDaSelecao,
  comporQuadro,
  contextoDeNavegacao,
  indiceDaSelecao,
  linhasDoQuadro,
} from '../src/cli/quadro/index.ts'
import { painelDeAjuda, TABELA_DE_AJUDA } from '../src/cli/quadro/ajuda.ts'
import { GLIFOS } from '../src/cli/quadro/glifos.ts'
import { situacaoDaEntrada, telaDeEntrada } from '../src/cli/quadro/entrada.ts'
import { linhasDaProcedencia } from '../src/cli/quadro/procedencia.ts'
import { TITULOS } from '../src/cli/quadro/secoes.ts'
import type { EstadoDeNavegacao, Observacao, TeclaNomeada } from '../src/cli/tipos.ts'
import { PAPEIS, TECLAS } from '../src/cli/tipos.ts'
import { sectionOrder } from '../src/webview/domain/sections.ts'
import type { EffectiveEntry } from '../src/webview/domain/types.ts'
import {
  actionsMd,
  decompositionFixture,
  payloadFixture,
  processFixture,
} from './helpers/reversa-fixtures.ts'

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

/**
 * Uma linha sem o que a interface viva põe antes do texto.
 *
 * Disposição (016): antes era só a marca do cursor; agora são a coluna do
 * cursor, o glifo de seleção e o glifo que diz se a seção está aberta.
 */
function semCursor(texto: string): string {
  const { selecao, secaoAberta, secaoFechada } = GLIFOS.unicode
  let resto = texto.trimStart()
  for (const glifo of [selecao, secaoAberta, secaoFechada]) {
    if (resto.startsWith(`${glifo} `)) resto = resto.slice(glifo.length + 1).trimStart()
  }
  return resto
}

/** A apresentação da interface viva, que é onde há moldura. */
const VIVA = { molduras: true, glifos: 'unicode' } as const

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
    for (const apresentacao of [undefined, VIVA]) {
      for (const texto of textos({ apresentacao })) {
        expect(texto.includes('\u001b'), texto).toBe(false)
      }
    }
  })

  it('todo papel usado é um dos nove nomeados (disposição: eram cinco ênfases por linha)', () => {
    for (const linha of linhasDoQuadro(pedido({ apresentacao: VIVA }))) {
      for (const trecho of linha.trechos ?? []) expect(PAPEIS).toContain(trecho.papel)
    }
  })

  it('os trechos de cada linha somam o texto dela, que é o que as suítes comparam', () => {
    for (const apresentacao of [undefined, VIVA]) {
      for (const linha of linhasDoQuadro(pedido({ apresentacao, largura: 72 }))) {
        expect(linha.trechos.map((trecho) => trecho.texto).join('')).toBe(linha.texto)
      }
    }
  })

  it('exatamente uma linha é a selecionada, e é dela que sai o artefato (disposição: campo próprio)', () => {
    const contexto = contextoDeNavegacao(pedido())
    const estado = estadoInicial([], contexto)
    const linhas = linhasDoQuadro(pedido({ estado }))
    expect(linhas.filter((linha) => linha.selecionada)).toHaveLength(1)
    const selecionada = linhas.find((linha) => linha.selecionada)
    expect(artefatoSelecionado(pedido({ estado }))).toBe(selecionada?.artefato ?? null)
    expect(indiceDaSelecao(pedido({ estado }))).toBe(linhas.findIndex((linha) => linha.selecionada))
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

/** Uma decomposição com ações fechadas, uma próxima e ações abertas, na seção aberta. */
function naDecomposicao(item: number | null, partes: Partial<EntradaDoQuadro> = {}): EntradaDoQuadro {
  const estado: EstadoDeNavegacao = {
    ...estadoInicial([], contextoVazio()),
    secaoSelecionada: 'decomposition',
    itemSelecionado: item,
  }
  return pedido({ estado, apresentacao: VIVA, largura: 100, ...partes })
}

describe('o núcleo do cabeçalho em moldura (feature 016, RF-02, RF-18)', () => {
  it('a moldura abre o quadro, com o nome da ferramenta no destaque', () => {
    const linhas = linhasDoQuadro(pedido({ apresentacao: VIVA, largura: 100 }))
    expect(linhas[0].texto.startsWith('╭─ Reversa ─')).toBe(true)
    expect(linhas[0].trechos).toContainEqual({ texto: 'Reversa', papel: 'destaque' })
    expect(linhas[0].trechos[0].papel).toBe('acento')
  })

  it('os quatro fatos estão dentro dela, e a moldura acompanha a largura sem ultrapassá-la', () => {
    const linhas = textos({ apresentacao: VIVA, largura: 100 })
    const fim = linhas.findIndex((texto) => texto.startsWith('╰'))
    const dentro = linhas.slice(0, fim + 1)
    for (const fato of ['Projeto:', 'Raiz observada: /w/reversa-views', 'Lido em:', 'Leitura íntegra.']) {
      expect(dentro.some((texto) => texto.includes(fato)), fato).toBe(true)
    }
    for (const texto of dentro) expect([...texto].length).toBe(100)
  })

  it('a versão da extensão não está na moldura, e está na seção ao fim do quadro', () => {
    const linhas = textos({ apresentacao: VIVA, largura: 100 })
    const fim = linhas.findIndex((texto) => texto.startsWith('╰'))
    expect(linhas.slice(0, fim + 1).join('\n')).not.toContain('Extensão')

    const secao = linhas.findIndex((texto) => semCursor(texto).startsWith('Versões e construção'))
    const ultimaDasOnze = linhas.findIndex((texto) => semCursor(texto).startsWith(TITULOS.probe))
    expect(secao).toBeGreaterThan(ultimaDasOnze)
    const depois = linhas.slice(secao).join('\n')
    for (const rotulo of ['Reversa:', 'Modelo herdado:', 'Extensão: 0.6.1', 'Construída de:']) {
      expect(depois).toContain(rotulo)
    }
    expect(depois).toContain('primeira leitura desta sessão')
  })

  it('a linha de integridade usa o papel de atenção quando a leitura degradou', () => {
    const degradada = entrada({
      loaded: payloadFixture({
        probe: { ...payloadFixture().probe, truncated: ['_reversa_sdd/prd.md'] },
      }),
    })
    const linha = linhasDoQuadro(pedido({ entrada: degradada, apresentacao: VIVA, largura: 100 })).find(
      (desenhada) => desenhada.texto.includes('Leitura degradada'),
    )
    expect(linha?.trechos.some((trecho) => trecho.papel === 'atencao')).toBe(true)
  })
})

describe('o bloqueio humano em moldura própria (feature 016, RF-03)', () => {
  const bloqueado = entrada({
    loaded: payloadFixture({
      process: processFixture({ actionsMd: actionsMd(5, 0), addendaFiles: [] }),
    }),
  })

  it('a moldura é de atenção, com o glifo de atenção no título, antes de qualquer seção', () => {
    const linhas = linhasDoQuadro(pedido({ entrada: bloqueado, apresentacao: VIVA, largura: 100 }))
    const borda = linhas.findIndex((linha) => linha.texto.includes(`! ${TITULOS.blocking}`))
    const primeiraSecao = linhas.findIndex((linha) => semCursor(linha.texto).startsWith(TITULOS.forward))
    expect(borda).toBeGreaterThanOrEqual(0)
    expect(borda).toBeLessThan(primeiraSecao)
    expect(linhas[borda].texto.startsWith('╭─')).toBe(true)
    expect(linhas[borda].trechos[0].papel).toBe('atencao')
  })

  it('sem cor, as duas molduras se distinguem pelo título e pelo glifo de atenção', () => {
    const bordas = textos({ entrada: bloqueado, apresentacao: VIVA, largura: 100 }).filter((texto) =>
      texto.startsWith('╭─'),
    )
    expect(bordas.filter((texto) => texto.includes('!'))).toHaveLength(1)
    expect(new Set(bordas.map((texto) => texto.replace(/─+╮$/, ''))).size).toBe(bordas.length)
  })

  it('a razão e o comando são os de antes, e o artefato desce para linha própria', () => {
    const linhas = textos({ entrada: bloqueado, apresentacao: VIVA, largura: 100 })
    expect(linhas.some((texto) => texto.includes('/reversa-sync'))).toBe(true)
    expect(linhas.some((texto) => texto.includes('⎿'))).toBe(true)
  })

  it('sem bloqueio, a moldura não é desenhada e a frase permanece', () => {
    const linhas = textos({ apresentacao: VIVA, largura: 100 })
    expect(linhas.some((texto) => texto.includes(`! ${TITULOS.blocking}`))).toBe(false)
    expect(linhas.some((texto) => texto.includes('Nada aguarda decisão humana.'))).toBe(true)
  })
})

describe('os glifos de seção e de ação (feature 016, RF-04, RF-05, RF-07)', () => {
  it('o glifo do título muda ao fechar e volta ao reabrir', () => {
    const titulo = (alvo: EntradaDoQuadro): string =>
      linhasDoQuadro(alvo).find((linha) => semCursor(linha.texto).startsWith(TITULOS.decomposition))?.texto ?? ''

    const aberta = naDecomposicao(null)
    const fechada = { ...aberta, estado: { ...aberta.estado, secoesFechadas: new Set(['decomposition'] as const) } }
    expect(titulo(aberta)).toContain('▾')
    expect(titulo(fechada)).toContain('▸')
    expect(titulo({ ...fechada, estado: aberta.estado })).toContain('▾')
  })

  it('a contagem vai ao lado do título, no atenuado, e o título selecionado no destaque', () => {
    const linha = linhasDoQuadro(naDecomposicao(null)).find((desenhada) => desenhada.selecionada)
    expect(linha?.trechos).toContainEqual({ texto: TITULOS.decomposition, papel: 'destaque' })
    expect(linha?.trechos).toContainEqual({ texto: ' (5)', papel: 'atenuado' })
    expect(linha?.trechos[0]).toEqual({ texto: '❯ ', papel: 'acento' })
  })

  it('cada ação traz um de três glifos distintos, no papel do estado dela', () => {
    const marcas = linhasDoQuadro(naDecomposicao(null))
      .flatMap((linha) => linha.trechos ?? [])
      .filter((trecho) => ['✓ ', '→ ', '· '].includes(trecho.texto))
    expect(marcas.filter((m) => m.texto === '✓ ').every((m) => m.papel === 'concluido')).toBe(true)
    expect(marcas.filter((m) => m.texto === '→ ')).toEqual([{ texto: '→ ', papel: 'atencao' }])
    expect(marcas.filter((m) => m.texto === '· ').every((m) => m.papel === 'atenuado')).toBe(true)
    expect(new Set(marcas.map((m) => m.texto)).size).toBe(3)
  })

  it('só o item selecionado traz o glifo de seleção, também sem cor alguma', () => {
    const linhas = linhasDoQuadro(naDecomposicao(2))
    const comGlifo = linhas.filter((linha) => linha.texto.trimStart().startsWith('❯'))
    expect(comGlifo).toHaveLength(1)
    expect(comGlifo[0].selecionada).toBe(true)
    expect(comGlifo[0].texto).toMatch(/T00\d/)
  })
})

describe('o dado secundário em linha própria (feature 016, RF-06, D-19)', () => {
  it('a descrição termina antes do caminho, que vem abaixo, recuado, atrás do glifo de continuação', () => {
    const linhas = linhasDoQuadro(naDecomposicao(0))
    const indice = linhas.findIndex((linha) => linha.selecionada)
    // A vista põe a próxima ação em primeiro lugar, e aqui ela é a T004.
    expect(linhas[indice].texto).toContain('T004 aberto')
    expect(linhas[indice].texto).not.toContain('src/x4.ts')
    expect(linhas[indice + 1].texto).toMatch(/^\s+⎿ `?src\/x4\.ts/)
    expect(linhas[indice + 1].trechos.every((trecho) => trecho.papel === 'atenuado' || trecho.texto.trim() === '')).toBe(true)
  })

  it('o artefato fica na linha principal, que é a que a confirmação lê', () => {
    expect(artefatoSelecionado(naDecomposicao(0))).toContain('src/x4.ts')
  })

  it('o bloco da seleção conta a linha principal e as secundárias', () => {
    expect(blocoDaSelecao(naDecomposicao(0))).toBe(2)
    expect(blocoDaSelecao(naDecomposicao(null))).toBe(1)
  })

  it('a passada tem a mesma disposição: o caminho em linha própria, sem cursor e sem moldura', () => {
    const linhas = textos({ cursor: false })
    const acao = linhas.findIndex((texto) => texto.includes('T001 feito'))
    expect(linhas[acao]).not.toContain('src/x1.ts')
    expect(linhas[acao + 1]).toContain('⎿')
    expect(linhas.some((texto) => /[╭╮╰╯│]/.test(texto))).toBe(false)
  })
})

describe('a janela estreita e a cor desligada (feature 016, RF-12, RF-13)', () => {
  it('a 59 colunas nenhuma moldura é desenhada, nenhuma linha estoura, e os quatro fatos ficam', () => {
    const linhas = textos({ apresentacao: VIVA, largura: 59 })
    expect(linhas.some((texto) => /[╭╮╰╯│]/.test(texto))).toBe(false)
    for (const texto of linhas) expect([...texto].length, texto).toBeLessThanOrEqual(59)
    const tudo = linhas.join('\n')
    for (const fato of ['Projeto:', 'Raiz observada:', 'Lido em:', 'Leitura íntegra.']) {
      expect(tudo).toContain(fato)
    }
  })

  it('a 59 colunas os glifos e o conteúdo continuam lá', () => {
    const linhas = textos({ apresentacao: VIVA, largura: 59 })
    expect(linhas.some((texto) => texto.includes('▾'))).toBe(true)
    expect(linhas.some((texto) => texto.includes('✓'))).toBe(true)
  })

  it('a 60 colunas a moldura volta, e a 80 o alinhamento é íntegro', () => {
    expect(textos({ apresentacao: VIVA, largura: 60 })[0].startsWith('╭─')).toBe(true)
    const linhas = textos({ apresentacao: VIVA, largura: 80 })
    const fim = linhas.findIndex((texto) => texto.startsWith('╰'))
    for (const texto of linhas.slice(0, fim + 1)) expect([...texto].length).toBe(80)
  })

  it('a cor desligada não muda o quadro: o compositor nem sabe que ela existe', () => {
    // O degrau de cor não é entrada do compositor. Molduras e glifos estão no
    // texto, e é por isso que sobrevivem a `NO_COLOR` e a `--sem-cor`.
    const linhas = textos({ apresentacao: VIVA, largura: 100 })
    expect(linhas.some((texto) => texto.startsWith('╭─'))).toBe(true)
    expect(linhas.some((texto) => texto.includes('▾'))).toBe(true)
  })

  it('no jogo de sete bits, nenhum glifo e nenhuma moldura saem dos sete bits', () => {
    const linhas = linhasDoQuadro(naDecomposicao(1, { apresentacao: { molduras: true, glifos: 'sete-bits' } }))
    const tudo = linhas.map((linha) => linha.texto).join('\n')
    expect(tudo).not.toMatch(/[╭╮╰╯│─▾▸❯✓→⎿…●○↑↓]/)
    expect(tudo).toContain('[-] ')
    expect(linhas.find((linha) => linha.selecionada)?.texto.trimStart().startsWith('> ')).toBe(true)
    // A prosa acentuada sai como está: é o limite conhecido deste degrau.
    expect(tudo).toContain('Decomposição')
  })
})

describe('texto hostil vindo do disco, de ponta a ponta (feature 016, T051, NFR de segurança, D-20)', () => {
  const ESC = String.fromCharCode(0x1b)
  const HOSTIL = `limpa a tela ${ESC}[2J${ESC}[H e segue`
  const DE_CONTROLE = /[\u0000-\u001f\u007f-\u009f]/

  /** A carga de sempre, com a descrição de toda ação fechada trocada pela hostil. */
  function cargaHostil() {
    const texto = JSON.stringify(payloadFixture()).replaceAll('"feito"', JSON.stringify(HOSTIL))
    return JSON.parse(texto) as ReturnType<typeof payloadFixture>
  }

  it('a fixture é de fato hostil: a descrição chega ao compositor com o caractere de controle', () => {
    expect(JSON.stringify(cargaHostil())).toContain('\\u001b[2J')
  })

  for (const apresentacao of [undefined, VIVA, { molduras: true, glifos: 'sete-bits' } as const]) {
    it(`nenhuma linha traz ponto de código de controle, nem em \`texto\` nem em \`trechos\` (${apresentacao?.glifos ?? 'sem apresentação'})`, () => {
      const linhas = linhasDoQuadro(pedido({ entrada: entrada({ loaded: cargaHostil() }), apresentacao }))
      for (const linha of linhas) {
        expect(linha.texto).not.toMatch(DE_CONTROLE)
        for (const trecho of linha.trechos ?? []) expect(trecho.texto).not.toMatch(DE_CONTROLE)
      }
    })
  }

  it('a sequência aparece neutralizada, como texto visível', () => {
    const tudo = textos({ entrada: entrada({ loaded: cargaHostil() }) }).join('\n')
    expect(tudo).toContain('␛[2J␛[H')
    expect(tudo).toContain('limpa a tela')
  })
})

describe('o mapa de linhas do contexto de navegação (feature 017, T007, D-07)', () => {
  const bloqueado = entrada({
    loaded: payloadFixture({
      process: processFixture({ actionsMd: actionsMd(5, 0), addendaFiles: [] }),
    }),
  })

  /** O pedido da interface viva sobre a carga bloqueada, com a seleção dada. */
  function noBloqueio(item: number | null): EntradaDoQuadro {
    const estado: EstadoDeNavegacao = {
      ...estadoInicial([], contextoVazio()),
      secaoSelecionada: 'blocking',
      itemSelecionado: item,
    }
    return pedido({ entrada: bloqueado, estado, apresentacao: VIVA, largura: 100 })
  }

  it('toda seção desenhada tem entrada, com o título antes dos itens e as seções em ordem', () => {
    const contexto = contextoDeNavegacao(pedido({ apresentacao: VIVA, largura: 100 }))
    expect(contexto.linhas).toBeDefined()
    let anterior = -1
    for (const nome of contexto.secoes) {
      const daSecao = contexto.linhas?.get(nome)
      expect(daSecao, nome).toBeDefined()
      expect(daSecao?.titulo).toBeGreaterThan(anterior)
      expect(daSecao?.itens).toHaveLength(contexto.itens.get(nome) ?? -1)
      for (const linha of daSecao?.itens ?? []) {
        expect(linha).toBeGreaterThan(anterior)
        anterior = linha
      }
      anterior = Math.max(anterior, daSecao?.titulo ?? -1)
    }
    expect(anterior).toBeLessThan(contexto.alturaTotal)
  })

  it('a seção fechada tem itens vazios, e o título continua com linha', () => {
    const aberta = naDecomposicao(null)
    const fechada = { ...aberta, estado: { ...aberta.estado, secoesFechadas: new Set(['decomposition'] as const) } }
    expect(contextoDeNavegacao(fechada).linhas?.get('decomposition')?.itens).toEqual([])
    expect(contextoDeNavegacao(fechada).linhas?.get('decomposition')?.titulo).toBe(
      contextoDeNavegacao(aberta).linhas?.get('decomposition')?.titulo,
    )
    expect(contextoDeNavegacao(aberta).linhas?.get('decomposition')?.itens.length).toBeGreaterThan(0)
  })

  it('a linha da seleção no mapa é o índice da seleção: no título, no item, no item com dado secundário e na moldura do bloqueio', () => {
    for (const alvo of [
      pedido({ apresentacao: VIVA, largura: 100 }),
      naDecomposicao(null),
      naDecomposicao(0),
      naDecomposicao(2),
      noBloqueio(null),
      noBloqueio(0),
    ]) {
      const daSecao = contextoDeNavegacao(alvo).linhas?.get(alvo.estado.secaoSelecionada)
      const item = alvo.estado.itemSelecionado
      const linha = item === null ? daSecao?.titulo : daSecao?.itens[item]
      expect(indiceDaSelecao(alvo)).not.toBeNull()
      expect(linha, `${alvo.estado.secaoSelecionada}/${String(item)}`).toBe(indiceDaSelecao(alvo))
    }
  })

  it('com a ajuda visível não há posição, e o mapa é omitido', () => {
    const alvo = naDecomposicao(null)
    const comAjuda = { ...alvo, estado: { ...alvo.estado, ajudaVisivel: true } }
    expect(contextoDeNavegacao(comAjuda).linhas).toBeUndefined()
    expect(contextoDeNavegacao(alvo).linhas).toBeDefined()
  })

  it('a altura total e as contagens são as de antes', () => {
    const alvo = pedido({ apresentacao: VIVA, largura: 100 })
    const contexto = contextoDeNavegacao(alvo)
    expect(contexto.alturaTotal).toBe(linhasDoQuadro(alvo).length)
    expect(contexto.secoes).toHaveLength(12)
  })
})

describe('a tabela de ajuda transcreve o contrato do teclado (feature 017, T024, RF-06, D-09)', () => {
  it('lista a página e a meia página depois de `g / G`, com a promessa de cada uma', () => {
    const gestos = TABELA_DE_AJUDA.map((item) => item.tecla)
    const emG = gestos.indexOf('g / G')
    expect(emG).toBeGreaterThanOrEqual(0)
    expect(gestos.slice(emG, emG + 3)).toEqual(['g / G', 'PgUp / PgDn', 'Ctrl+U / Ctrl+D'])
    expect(TABELA_DE_AJUDA[emG + 1].efeito).toBe('Move a seleção uma janela acima e abaixo')
    expect(TABELA_DE_AJUDA[emG + 2].efeito).toBe('Move a seleção meia janela acima e abaixo')
    expect(TABELA_DE_AJUDA[emG + 1].emSeteBits).toBeUndefined()
    expect(TABELA_DE_AJUDA[emG + 2].emSeteBits).toBeUndefined()
  })

  it('nem a tabela nem o painel mencionam mouse', () => {
    const tudo = [
      ...TABELA_DE_AJUDA.flatMap((item) => [item.tecla, item.efeito, item.emSeteBits ?? '']),
      ...painelDeAjuda(100, VIVA).map((linha) => linha.texto),
      ...painelDeAjuda(100, { molduras: true, glifos: 'sete-bits' }).map((linha) => linha.texto),
    ]
      .join('\n')
      .toLowerCase()
    expect(tudo).not.toContain('mouse')
  })

  it('toda tecla nomeada em `TECLAS` tem linha na tabela', () => {
    /** Como cada tecla nomeada se escreve na coluna dos gestos. */
    const GESTOS: Record<TeclaNomeada, string> = {
      acima: '↑',
      abaixo: '↓',
      'fechar-secao': '←',
      'abrir-secao': '→',
      confirmar: 'Enter',
      'proxima-secao': 'Tab',
      'secao-anterior': 'Shift+Tab',
      reler: 'r',
      'abrir-tudo': 'a',
      'fechar-tudo': 'z',
      ajuda: '?',
      topo: 'g',
      fim: 'G',
      'pagina-acima': 'PgUp',
      'pagina-abaixo': 'PgDn',
      'meia-pagina-acima': 'Ctrl+U',
      'meia-pagina-abaixo': 'Ctrl+D',
      sair: 'q',
      suspender: 'Ctrl+Z',
    }
    const escritos = new Set(TABELA_DE_AJUDA.flatMap((item) => item.tecla.split(/\s+\/\s+|\s+/)))
    for (const tecla of TECLAS) {
      expect(GESTOS[tecla], `${tecla} sem gesto declarado nesta suíte`).toBeDefined()
      expect(escritos.has(GESTOS[tecla]), `${tecla} (${GESTOS[tecla]}) sem linha na tabela`).toBe(true)
    }
  })
})

describe('o desempenho da composição (feature 016, T052, NFR de desempenho, D-21)', () => {
  it('compor um quadro de mais de 500 linhas, já com a ênfase por trecho, leva menos de 50 ms', () => {
    const grande = entrada({
      loaded: payloadFixture({ decomposition: decompositionFixture(150, 150) }),
    })
    const alvo = pedido({ entrada: grande, apresentacao: VIVA, largura: 100, altura: 40 })
    expect(linhasDoQuadro(alvo).length).toBeGreaterThan(500)

    // A melhor de cinco, depois de aquecer: o que se mede é a composição, e
    // não a primeira compilação do caminho nem o vizinho que tomou o processador.
    comporQuadro(alvo)
    const tempos = Array.from({ length: 5 }, () => {
      const inicio = performance.now()
      comporQuadro(alvo)
      return performance.now() - inicio
    })
    expect(Math.min(...tempos)).toBeLessThan(50)
  })
})
