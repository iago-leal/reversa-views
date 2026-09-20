/**
 * Suíte do conteúdo do pacote (T010), contra o pacote que existir na raiz.
 *
 * A listagem que o comando de empacotamento imprime é a primeira camada, e é
 * lida por quem está olhando. Esta é a segunda, e é a que impede que documento
 * interno saia dentro da extensão sem ninguém ter olhado: ela abre o pacote de
 * fato e recusa todo caminho fora da lista prevista (RF-21, RN-07).
 *
 * Ela não empacota. Empacotar a cada execução mediria a máquina e demoraria o
 * suficiente para a suíte deixar de ser rodada, do mesmo modo que a suíte de
 * construção lê a saída da última construção em vez de construir. Sem pacote
 * na raiz, ela avisa e se abstém.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { naoPrevistos } from '../scripts/conteudo-esperado.js'
import { TETO_DO_PACOTE_DA_EXTENSAO, formatarTamanho } from '../scripts/limites.js'
import { lerEntradas } from '../scripts/vsix.js'

/**
 * O pacote mais recente na raiz, ou nada quando ninguém empacotou ainda.
 *
 * A escolha é pela data de modificação, e não pelo nome: em ordem alfabética
 * `0.9.4` vem depois de `0.11.0`, e a suíte passou a conferir pacote antigo
 * assim que a segunda casa da versão chegou a dois dígitos. Erro silencioso,
 * porque o pacote velho passa em tudo que já passava quando foi construído.
 */
const PACOTE = readdirSync('.')
  .filter((nome) => nome.endsWith('.vsix'))
  .map((nome) => ({ nome, quando: statSync(nome).mtimeMs }))
  .sort((a, b) => a.quando - b.quando)
  .at(-1)?.nome

describe('o conteúdo do pacote gerado (RF-21)', () => {
  it.skipIf(PACOTE === undefined)('não leva caminho fora da lista prevista', () => {
    const entradas = lerEntradas(readFileSync(PACOTE as string))
    const intrusos = naoPrevistos(entradas.map((entrada) => entrada.caminho))
    expect(intrusos, `entraram sem estar previstos: ${intrusos.join(', ')}`).toEqual([])
  })

  it.skipIf(PACOTE === undefined)('leva o que a extensão precisa para rodar', () => {
    const caminhos = lerEntradas(readFileSync(PACOTE as string)).map((entrada) => entrada.caminho)
    for (const exigido of [
      'extension/package.json',
      'extension/out/extension.js',
      'extension/out/res/webview/main.js',
      'extension/out/res/webview/main.css',
      // BUG-20260909-VHII: um pacote sem a consulta à origem e sem o carimbo da
      // construção instala um painel que não sabe dizer que ficou atrás.
      'extension/out/host/update.js',
      'extension/out/host/net.js',
      'extension/out/host/build.js',
      // Feature 012: sem o mapa aprovado dentro do pacote, o painel instalado
      // leria todo projeto como se ninguém tivesse decidido coisa alguma, e as
      // aprovações valeriam só em quem tem o repositório. É a razão de ele ser
      // módulo e não arquivo de dados: o `.vscodeignore` só readmite `out/`.
      'extension/out/domain/equivalencias.js',
    ]) {
      expect(caminhos, `${exigido} ficou de fora do pacote`).toContain(exigido)
    }
  })

  it.skipIf(PACOTE === undefined)('cabe no teto do pacote da extensão', () => {
    const tamanho = statSync(PACOTE as string).size
    expect(
      tamanho,
      `o pacote mede ${formatarTamanho(tamanho)}, acima do teto de ${formatarTamanho(TETO_DO_PACOTE_DA_EXTENSAO)}`,
    ).toBeLessThanOrEqual(TETO_DO_PACOTE_DA_EXTENSAO)
  })

  it('avisa quando não há pacote para conferir', () => {
    if (PACOTE === undefined) {
      console.warn('nenhum .vsix na raiz: rode `npm run empacotar` para que esta suíte confira')
    }
    expect(true).toBe(true)
  })
})
