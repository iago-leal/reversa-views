/**
 * A contagem das anomalias de uma raiz inteira (feature 015, RF-16, RN-10).
 *
 * Ela existe por causa de um número mal lido. O "25 para 3" de 2026-09-20 era
 * verdadeiro DENTRO do eixo do checkpoint e foi lido como retrato de `~/dev`,
 * enquanto um projeto sozinho trazia quinze anomalias de outro eixo. Daí a
 * regra: toda contagem que uma ferramenta de manutenção apresente é a da raiz
 * inteira, discriminada por código, e diz quais códigos o mapa alcança.
 *
 * O que se conta é o que o painel EXIBE, e só há um jeito de garantir isso:
 * passar pela mesma leitura e pela mesma composição. `readWorkspace` e
 * `composeAnomalies` são as duas funções da tela e do terminal, e nada aqui
 * relê coisa alguma por outro caminho. Anomalia descontada não conta; anomalia
 * do eixo conta.
 *
 * Só leitura: não escreve arquivo, não fala com o motor, não abre rede e não lê
 * nada fora da raiz dada. `git status` depois de rodar é o de antes.
 * @module cli/contagem
 */

import { existsSync, readdirSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
import type { MapaDeEquivalencias } from '../domain/types.ts'
import type { SetProcessData } from '../host/protocol.ts'
import { readWorkspace } from '../host/reading.ts'
import type { ReadingResult } from '../host/reading.ts'
import { composeAnomalies } from '../webview/domain/anomalies-view.ts'

/**
 * Os códigos ao alcance do mapa de equivalências (D-22).
 *
 * Constante, e não dedução: o mapa não sabe que códigos produz. É dado pequeno,
 * e só muda quando o mapa ganha eixo, que é mudança de código de todo modo.
 */
export const CODIGOS_AO_ALCANCE_DO_MAPA: readonly string[] = [
  'checkpoint-sem-conclusao-declarada',
  'fase-desconhecida',
]

/** Uma linha da tabela. */
export interface ContagemDeCodigo {
  codigo: string
  ocorrencias: number
  projetos: number
  aoAlcanceDoMapa: boolean
}

/** O documento da saída `--json`, na forma que `interfaces/contar-anomalias.md` fixa. */
export interface ContagemDaRaiz {
  raiz: string
  projetos: number
  semLeitura: string[]
  total: number
  codigos: ContagemDeCodigo[]
  /** Por projeto e por código, para que a suíte confira a soma sem interpretar texto. */
  porProjeto: Record<string, Record<string, number>>
}

/** O que a contagem aceita de fora; tudo tem padrão, e a suíte troca o que quiser. */
export interface OpcoesDaContagem {
  /** O mapa a aplicar; o vigente quando nada é dito. A promoção passa o que acabou de fundir. */
  mapa?: MapaDeEquivalencias
  /** Chamado antes de cada leitura, para que a espera tenha progresso. */
  progresso?: (projeto: string) => void
  /** A leitura de um projeto; a real quando nada é dito. */
  ler?: (raiz: string, mapa: MapaDeEquivalencias | undefined) => ReadingResult
}

/** O que `composeAnomalies` lê da carga, e nada mais. */
type CargaDasAnomalias = Pick<SetProcessData, 'process' | 'bugs' | 'greenfield' | 'history' | 'discoveryState'>

/**
 * As subpastas DIRETAS de uma raiz, que são as candidatas a projeto.
 *
 * Quem decide se uma delas É projeto não é esta função, e sim a leitura: a
 * ferramenta de terminal não carrega caminho de arquivo do Reversa, e saber
 * onde mora o arquivo de estado é regra da sonda. Projeto é a subpasta que a
 * leitura devolve como instalada, que é exatamente a que tem o arquivo de
 * estado. As pastas ocultas ficam de fora.
 * @param raiz - a raiz, já resolvida.
 * @returns os nomes das subpastas, em ordem alfabética.
 */
export function subpastasDaRaiz(raiz: string): string[] {
  return readdirSync(raiz, { withFileTypes: true })
    .filter((entrada) => entrada.isDirectory() && !entrada.name.startsWith('.'))
    .map((entrada) => entrada.name)
    .sort((a, b) => a.localeCompare(b))
}

/** A leitura de verdade, muda: o registro do host não tem leitor aqui. */
function lerDeVerdade(raiz: string, mapa: MapaDeEquivalencias | undefined): ReadingResult {
  return readWorkspace(raiz, { log: { write: () => undefined }, ...(mapa === undefined ? {} : { equivalencias: mapa }) })
}

/**
 * Contar o que o painel exibe em cada projeto de uma raiz.
 *
 * Projeto cuja leitura falhou é contado à parte e nomeado, e não some da conta:
 * uma contagem que cala sobre o que não leu é a mesma contagem parcial que esta
 * feature veio corrigir.
 * @param raiz - a pasta que contém os projetos.
 * @param opcoes - o mapa, o progresso e a leitura.
 * @returns o documento da contagem.
 */
export function contarAnomalias(raiz: string, opcoes: OpcoesDaContagem = {}): ContagemDaRaiz {
  const absoluta = resolve(raiz)
  const ler = opcoes.ler ?? lerDeVerdade
  const projetos: string[] = []
  const semLeitura: string[] = []
  const porProjeto: Record<string, Record<string, number>> = {}

  for (const projeto of subpastasDaRaiz(absoluta)) {
    opcoes.progresso?.(projeto)
    const leitura = ler(join(absoluta, projeto), opcoes.mapa)
    if (leitura.kind !== 'loaded') {
      // Sem leitura não há como saber se era projeto, e calar seria pior: a
      // pasta é nomeada, e quem lê decide.
      projetos.push(projeto)
      semLeitura.push(projeto)
      continue
    }
    // Instalada é a pasta que tem o arquivo de estado, e só ela é projeto.
    if (!leitura.process.installed) continue
    projetos.push(projeto)
    const carga: CargaDasAnomalias = leitura
    const doProjeto: Record<string, number> = {}
    for (const anomalia of composeAnomalies(carga as SetProcessData)) {
      doProjeto[anomalia.code] = (doProjeto[anomalia.code] ?? 0) + 1
    }
    if (Object.keys(doProjeto).length > 0) porProjeto[projeto] = doProjeto
  }

  const porCodigo = new Map<string, { ocorrencias: number; projetos: number }>()
  for (const doProjeto of Object.values(porProjeto)) {
    for (const [codigo, ocorrencias] of Object.entries(doProjeto)) {
      const atual = porCodigo.get(codigo) ?? { ocorrencias: 0, projetos: 0 }
      porCodigo.set(codigo, { ocorrencias: atual.ocorrencias + ocorrencias, projetos: atual.projetos + 1 })
    }
  }

  const codigos = [...porCodigo.entries()]
    .map(([codigo, soma]) => ({ codigo, ...soma, aoAlcanceDoMapa: CODIGOS_AO_ALCANCE_DO_MAPA.includes(codigo) }))
    .sort((a, b) => b.ocorrencias - a.ocorrencias || a.codigo.localeCompare(b.codigo))

  return {
    raiz: absoluta,
    projetos: projetos.length,
    semLeitura,
    total: codigos.reduce((soma, linha) => soma + linha.ocorrencias, 0),
    codigos,
    porProjeto,
  }
}

/**
 * A tabela em texto, ordenada por ocorrências e depois por código.
 * @param contagem - o documento.
 * @returns as linhas, sem quebra ao fim.
 */
export function tabelaDaContagem(contagem: ContagemDaRaiz): string[] {
  const lidos = contagem.projetos - contagem.semLeitura.length
  const largura = Math.max('código'.length, ...contagem.codigos.map((linha) => linha.codigo.length))
  const linha = (codigo: string, ocorrencias: string, projetos: string, mapa: string): string =>
    `${codigo.padEnd(largura)}  ${ocorrencias.padStart(11)}  ${projetos.padStart(8)}  ${mapa}`.trimEnd()

  const linhas = [
    `Anomalias exibidas em ${contagem.raiz}: ${lidos} projetos lidos, ${contagem.semLeitura.length} sem leitura`,
    '',
    linha('código', 'ocorrências', 'projetos', 'mapa'),
    ...contagem.codigos.map((c) =>
      linha(c.codigo, String(c.ocorrencias), String(c.projetos), c.aoAlcanceDoMapa ? 'alcança' : ''),
    ),
    linha('total', String(contagem.total), '', ''),
  ]
  if (contagem.semLeitura.length > 0) {
    linhas.push('', `sem leitura, e fora da conta: ${contagem.semLeitura.join(', ')}`)
  }
  return linhas
}

/** O que a linha de comando entrega à casca. */
export interface SaidaDaContagem {
  codigo: number
  saida: string[]
  erro: string[]
}

/**
 * O comando inteiro, sem tocar canal algum: devolve o que dizer e o código de
 * saída, e quem escreve é a casca. Ter anomalias NÃO é falha: o comando mede,
 * não julga.
 * @param argumentos - o que veio depois do nome do script.
 * @param opcoes - as mesmas da contagem.
 * @returns as linhas da saída padrão, as da saída de erro e o código.
 */
export function executarContagem(argumentos: readonly string[], opcoes: OpcoesDaContagem = {}): SaidaDaContagem {
  const emJson = argumentos.includes('--json')
  const raiz = argumentos.find((argumento) => !argumento.startsWith('--'))

  if (raiz === undefined) {
    return { codigo: 2, saida: [], erro: ['falta a raiz. Uso: npm run contar:anomalias -- <raiz> [--json]'] }
  }
  const absoluta = resolve(raiz.replace(/^~(?=$|\/)/, process.env.HOME ?? '~'))
  if (!existsSync(absoluta) || !statSync(absoluta).isDirectory()) {
    return { codigo: 2, saida: [], erro: [`a raiz ${absoluta} não existe ou não é uma pasta.`] }
  }

  // O progresso vai para a saída de ERRO: só o documento vai para a padrão, de
  // modo que `--json > arquivo` grava JSON e nada mais.
  const erro: string[] = []
  const contagem = contarAnomalias(absoluta, {
    ...opcoes,
    progresso: opcoes.progresso ?? ((projeto) => erro.push(`lendo ${projeto}`)),
  })
  return {
    codigo: 0,
    saida: emJson ? [JSON.stringify(contagem, null, 2)] : tabelaDaContagem(contagem),
    erro,
  }
}
