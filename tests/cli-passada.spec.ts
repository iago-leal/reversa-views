/**
 * Suíte do modo de uma passada (T037, feature 014, RF-17 a RF-21).
 *
 * É metade do uso previsto: o comportamento quando não há pessoa diante da
 * tela. O que ela prende são as três promessas que um script depende: saída
 * sem sequência de escape, JSON válido, e os três códigos de saída conforme o
 * contrato.
 *
 * DISPOSIÇÃO (feature 016, T040). O texto da passada deixou de guardar bytes e
 * passou a guardar GARANTIAS: a identidade de bytes fica só para a saída de
 * dados, cujos casos aqui não foram tocados. A disposição do texto mudou, com
 * o dado secundário em linha própria e a seção "Versões e construção" ao fim, e
 * nenhum caso de antes precisou de reescrita para isso, porque nenhum deles
 * prendia disposição: todos prendiam fato, ordem e ausência de sequência. O
 * que se acrescenta ao fim são as garantias da RN-06, uma por caso.
 */

import { describe, expect, it } from 'vitest'
import { CODIGOS } from '../src/cli/argumentos.ts'
import { documentoDeDados, textoDeDados } from '../src/cli/dados.ts'
import { codigoDaLeitura, LARGURA_PADRAO, textoDaPassada } from '../src/cli/passada.ts'
import { sectionOrder } from '../src/webview/domain/sections.ts'
import { TITULOS } from '../src/cli/quadro/secoes.ts'
import type { EffectiveEntry } from '../src/webview/domain/types.ts'
import { payloadFixture } from './helpers/reversa-fixtures.ts'

/** Uma entrada de leitura íntegra, com a carga que o painel também recebe. */
function entrada(partes: Partial<EffectiveEntry> = {}): EffectiveEntry {
  const carga = payloadFixture()
  return {
    kind: 'installed',
    rereading: false,
    loaded: carga,
    message: null,
    root: carga.root,
    update: null,
    ...partes,
  }
}

/** O texto de uma passada sobre uma entrada. */
function passada(alvo: EffectiveEntry = entrada(), largura?: number): string {
  return textoDaPassada({ entrada: alvo, largura, conferenciaLigada: true })
}

describe('a saída não toma a tela (RF-17, RF-19)', () => {
  it('não contém sequência de escape alguma', () => {
    expect(passada().includes('\u001b')).toBe(false)
  })

  it('termina com uma quebra de linha, e não com meia linha', () => {
    expect(passada().endsWith('\n')).toBe(true)
  })

  it('respeita a largura declarada, sem cortar palavra', () => {
    for (const largura of [40, 60, 100]) {
      for (const linha of passada(entrada(), largura).split('\n')) {
        expect([...linha].length, linha).toBeLessThanOrEqual(largura)
      }
    }
  })

  it('usa oitenta colunas quando o destino não declara a sua', () => {
    for (const linha of passada().split('\n')) {
      expect([...linha].length).toBeLessThanOrEqual(LARGURA_PADRAO)
    }
  })

  it('não marca linha alguma como selecionada: não há cursor numa passada', () => {
    for (const linha of passada().split('\n')) {
      expect(linha.startsWith('> ')).toBe(false)
    }
  })
})

describe('tudo o que o painel esconderia sai aberto (RF-17)', () => {
  it('as onze seções aparecem, inclusive as três que nascem fechadas', () => {
    const texto = passada()
    for (const nome of sectionOrder()) {
      expect(texto, `${nome} ficou de fora`).toContain(TITULOS[nome])
    }
  })

  it('nenhuma seção sai marcada como fechada', () => {
    expect(passada()).not.toContain('[+]')
  })
})

describe('o caminho de cada artefato apontado sai relativo (RF-18)', () => {
  it('a feature ativa aparece pelo caminho relativo à raiz', () => {
    const caminho = entrada().loaded?.process.forward.featureDir
    expect(caminho).not.toBeNull()
    expect(passada()).toContain(caminho as string)
  })

  it('nenhum caminho sai com prefixo absoluto da raiz observada', () => {
    const raiz = entrada().root as string
    const texto = passada()
    // A raiz aparece no cabeçalho e no relatório da sonda, que a DECLARAM; o
    // que não pode aparecer é ela colada a um caminho de artefato.
    expect(texto).not.toContain(`${raiz}/_reversa`)
  })
})

describe('os três códigos de saída (RF-20)', () => {
  it('a leitura que ocorreu termina com zero', () => {
    expect(codigoDaLeitura(entrada(), CODIGOS)).toBe(CODIGOS.ok)
  })

  it('Reversa não instalado também termina com zero, por não ser erro', () => {
    expect(codigoDaLeitura(entrada({ kind: 'no-reversa' }), CODIGOS)).toBe(CODIGOS.ok)
  })

  it('a leitura que falhou termina com um', () => {
    expect(codigoDaLeitura(entrada({ kind: 'error', loaded: null }), CODIGOS)).toBe(CODIGOS.falha)
  })

  it('o uso incorreto tem código próprio, e não se confunde com falha', () => {
    expect(CODIGOS.uso).not.toBe(CODIGOS.falha)
    expect(CODIGOS.uso).toBe(2)
  })
})

describe('a saída legível por máquina (RF-21)', () => {
  const documento = documentoDeDados('/w', entrada(), { estado: 'em-dia' })

  it('é um documento JSON válido', () => {
    expect(() => JSON.parse(textoDeDados(documento))).not.toThrow()
  })

  it('não carrega linha alguma de apresentação', () => {
    const texto = textoDeDados(documento)
    expect(texto.trimStart().startsWith('{')).toBe(true)
    for (const nome of sectionOrder()) expect(texto).not.toContain(TITULOS[nome])
  })

  it('carrega a raiz, o instante, a entrada nomeada, o processo, a sonda e a conferência', () => {
    const lido = JSON.parse(textoDeDados(documento))
    expect(Object.keys(lido).sort()).toEqual(
      ['conferencia', 'entrada', 'lidoEm', 'processo', 'raiz', 'sonda'].sort(),
    )
    expect(lido.raiz).toBe('/w')
    expect(lido.entrada).toBe('installed')
    expect(lido.conferencia).toEqual({ estado: 'em-dia' })
  })

  it('os nomes internos do processo e da sonda são os do protocolo, sem tradução', () => {
    const lido = JSON.parse(textoDeDados(documento))
    expect(lido.processo).toHaveProperty('forward')
    expect(lido.processo).toHaveProperty('discovery')
    expect(lido.sonda).toHaveProperty('workspace')
    expect(lido.sonda).toHaveProperty('refusals')
  })

  it('sem conferência, o campo é a ausência dela, e não um oitavo desfecho', () => {
    const semConsulta = documentoDeDados('/w', entrada(), null)
    expect(JSON.parse(textoDeDados(semConsulta)).conferencia).toBeNull()
  })

  it('a leitura que falhou tem processo e sonda nulos, e não inventados', () => {
    const lido = JSON.parse(
      textoDeDados(documentoDeDados('/w', entrada({ kind: 'error', loaded: null }), null)),
    )
    expect(lido.processo).toBeNull()
    expect(lido.sonda).toBeNull()
    expect(lido.entrada).toBe('error')
  })
})

describe('as garantias do texto da passada (feature 016, T040, RN-06, RF-15, RF-19)', () => {
  const COM_COR = { grau: '24bits', tema: 'escuro', glifos: 'unicode' } as const
  const SEQUENCIA_DE_COR = /\u001b\[[\d;]*m/g

  /** O texto de uma passada diante de um terminal com cor. */
  function diante(alvo: EffectiveEntry = entrada(), largura?: number): string {
    return textoDaPassada({ entrada: alvo, largura, conferenciaLigada: true, apresentacao: COM_COR })
  }

  it('o texto redirecionado não contém sequência de escape nem caractere de moldura', () => {
    expect(passada()).not.toContain('\u001b')
    expect(passada()).not.toMatch(/[╭╮╰╯│]/)
  })

  it('nenhuma linha passa de oitenta colunas quando o destino não declara largura', () => {
    for (const linha of passada().split('\n')) expect([...linha].length, linha).toBeLessThanOrEqual(80)
  })

  it('os fatos do cabeçalho de antes continuam afirmados, todos', () => {
    const texto = passada()
    for (const rotulo of ['Projeto:', 'Reversa:', 'Modelo herdado:', 'Extensão:', 'Construída de:', 'Raiz observada:', 'Lido em:', 'Leitura íntegra.']) {
      expect(texto, rotulo).toContain(rotulo)
    }
  })

  it('as onze seções saem na ordem de sempre, com a seção "Versões e construção" ao fim', () => {
    const linhas = passada().split('\n')
    const posicoes = sectionOrder().map((nome) => linhas.findIndex((linha) => linha.startsWith(TITULOS[nome])))
    expect(posicoes.every((posicao) => posicao >= 0)).toBe(true)
    expect([...posicoes].sort((x, y) => x - y)).toEqual(posicoes)
    const versoes = linhas.findIndex((linha) => linha.startsWith('Versões e construção'))
    expect(versoes).toBeGreaterThan(Math.max(...posicoes))
  })

  it('a frase de procedência está no texto, porque na passada não há linha de estado', () => {
    const linhas = passada().split('\n')
    const versoes = linhas.findIndex((linha) => linha.startsWith('Versões e construção'))
    // A frase é mais larga que oitenta colunas e quebra sem cortar palavra: o
    // que se compara é o texto, e não a linha.
    expect(linhas.slice(versoes).join(' ').replace(/\s+/g, ' ')).toContain('esta é a primeira leitura desta sessão')
    expect(passada()).not.toMatch(/linhas \d+.\d+ de \d+/)
  })

  it('o caminho e o instante de cada ação vêm em linha própria, como na interface viva', () => {
    const linhas = passada().split('\n')
    const acao = linhas.findIndex((linha) => /T00\d (feito|aberto)/.test(linha))
    expect(linhas[acao]).not.toContain('src/x')
    expect(linhas[acao + 1]).toMatch(/^\s+⎿ .*src\/x\d\.ts/)
  })

  it('diante de terminal com cor, o texto sai vestido', () => {
    expect(diante()).toContain('\u001b[')
    expect(diante()).toContain('38;2;')
  })

  it('retiradas as sequências de cor, a saída diante do terminal é idêntica à redirecionada', () => {
    expect(diante().replace(SEQUENCIA_DE_COR, '')).toBe(passada())
    expect(diante(entrada(), 60).replace(SEQUENCIA_DE_COR, '')).toBe(passada(entrada(), 60))
  })

  it('com a cor desligada, é idêntica sem retirar nada', () => {
    const semCor = textoDaPassada({
      entrada: entrada(),
      conferenciaLigada: true,
      apresentacao: { ...COM_COR, grau: 'nenhuma' },
    })
    expect(semCor).toBe(passada())
  })

  it('diante de terminal não há moldura nem linha de estado', () => {
    expect(diante()).not.toMatch(/[╭╮╰╯│]/)
    expect(diante()).not.toMatch(/linhas \d+.\d+ de \d+/)
  })

  it('nenhuma cor vaza de uma linha para a seguinte', () => {
    for (const linha of diante().split('\n')) {
      const ultima = [...linha.matchAll(SEQUENCIA_DE_COR)].at(-1)?.[0]
      if (ultima !== undefined) expect(ultima, linha).toBe('\u001b[0m')
    }
  })

  it('com a localidade sem Unicode, os glifos caem para sete bits e a prosa fica como está', () => {
    const texto = textoDaPassada({
      entrada: entrada(),
      conferenciaLigada: true,
      apresentacao: { grau: 'nenhuma', tema: 'escuro', glifos: 'sete-bits' },
    })
    expect(texto).not.toMatch(/[✓→·⎿…]/)
    expect(texto).toContain('Decomposição')
  })
})
