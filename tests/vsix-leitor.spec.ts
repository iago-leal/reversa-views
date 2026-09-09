/**
 * Suíte do leitor do pacote (T009), contra `scripts/vsix.js`.
 *
 * O que interessa conferir num pacote gerado são nomes e tamanhos, e ambos
 * estão no índice do arquivo compactado. Ler o índice cabe em poucas dezenas
 * de linhas, e evita tanto uma dependência quanto a exigência de um binário do
 * sistema fora do arquivo de trava (D-13).
 *
 * O pacote de fixtura é montado aqui, pelo caminho contrário ao do leitor: a
 * suíte escreve o formato, o leitor o interpreta, e nenhum dos dois confirma a
 * si mesmo.
 */

import { deflateRawSync } from 'node:zlib'
import { describe, expect, it } from 'vitest'
import { lerEntradas } from '../scripts/vsix.js'

describe('leitura do índice', () => {
  it('devolve cada caminho tal como gravado, na ordem do índice', () => {
    const pacote = montar([
      { nome: 'extension.vsixmanifest', conteudo: '<PackageManifest />' },
      { nome: 'extension/package.json', conteudo: '{"name":"x"}' },
      { nome: 'extension/out/extension.js', conteudo: 'console.log(1)' },
    ])
    expect(lerEntradas(pacote).map((entrada) => entrada.caminho)).toEqual([
      'extension.vsixmanifest',
      'extension/package.json',
      'extension/out/extension.js',
    ])
  })

  it('devolve os dois tamanhos, o comprimido e o original', () => {
    const corpo = 'a'.repeat(4096)
    const [entrada] = lerEntradas(montar([{ nome: 'extension/out/main.js', conteudo: corpo }]))
    expect(entrada?.tamanhoOriginal).toBe(4096)
    expect(entrada?.tamanhoComprimido).toBeLessThan(4096)
    expect(entrada?.tamanhoComprimido).toBeGreaterThan(0)
  })

  it('lê pacote vazio como lista vazia, sem inventar entrada', () => {
    expect(lerEntradas(montar([]))).toEqual([])
  })

  it('não descompacta conteúdo algum: só o índice é percorrido', () => {
    const fonte = lerEntradas.toString()
    expect(fonte).not.toContain('inflate')
    expect(fonte).not.toContain('unzip')
  })
})

describe('recusa barulhenta diante de arquivo que não é pacote', () => {
  it('diz que não encontrou o índice, em vez de devolver lista vazia', () => {
    expect(() => lerEntradas(Buffer.from('isto não é um zip'))).toThrow(/índice/i)
  })
})

/** Monta um pacote mínimo, com o índice que o leitor vai percorrer. */
function montar(entradas: ReadonlyArray<{ nome: string; conteudo: string }>): Buffer {
  const locais: Buffer[] = []
  const centrais: Buffer[] = []
  let deslocamento = 0

  for (const { nome, conteudo } of entradas) {
    const cru = Buffer.from(conteudo, 'utf8')
    const comprimido = deflateRawSync(cru)
    const nomeEmBytes = Buffer.from(nome, 'utf8')
    const soma = crc32(cru)

    const local = Buffer.alloc(30)
    local.writeUInt32LE(0x04034b50, 0)
    local.writeUInt16LE(20, 4)
    local.writeUInt16LE(8, 8)
    local.writeUInt32LE(soma, 14)
    local.writeUInt32LE(comprimido.length, 18)
    local.writeUInt32LE(cru.length, 22)
    local.writeUInt16LE(nomeEmBytes.length, 26)
    locais.push(local, nomeEmBytes, comprimido)

    const central = Buffer.alloc(46)
    central.writeUInt32LE(0x02014b50, 0)
    central.writeUInt16LE(20, 4)
    central.writeUInt16LE(20, 6)
    central.writeUInt16LE(8, 10)
    central.writeUInt32LE(soma, 16)
    central.writeUInt32LE(comprimido.length, 20)
    central.writeUInt32LE(cru.length, 24)
    central.writeUInt16LE(nomeEmBytes.length, 28)
    central.writeUInt32LE(deslocamento, 42)
    centrais.push(central, nomeEmBytes)

    deslocamento += local.length + nomeEmBytes.length + comprimido.length
  }

  const corpo = Buffer.concat(locais)
  const indice = Buffer.concat(centrais)
  const fim = Buffer.alloc(22)
  fim.writeUInt32LE(0x06054b50, 0)
  fim.writeUInt16LE(entradas.length, 8)
  fim.writeUInt16LE(entradas.length, 10)
  fim.writeUInt32LE(indice.length, 12)
  fim.writeUInt32LE(corpo.length, 16)
  return Buffer.concat([corpo, indice, fim])
}

/** A soma de verificação do formato, escrita à mão para não trazer dependência. */
function crc32(dados: Buffer): number {
  let soma = 0xffffffff
  for (const byte of dados) {
    soma ^= byte
    for (let volta = 0; volta < 8; volta += 1) {
      soma = soma & 1 ? (soma >>> 1) ^ 0xedb88320 : soma >>> 1
    }
  }
  return (soma ^ 0xffffffff) >>> 0
}
