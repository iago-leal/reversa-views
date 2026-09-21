/**
 * Suíte do modo de uma passada (T037, feature 014, RF-17 a RF-21).
 *
 * É metade do uso previsto: o comportamento quando não há pessoa diante da
 * tela. O que ela prende são as três promessas que um script depende: saída
 * sem sequência de escape, JSON válido, e os três códigos de saída conforme o
 * contrato.
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
