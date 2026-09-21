/**
 * O ponto de entrada: escolhe o modo e devolve o código de saída (RF-17,
 * RF-20, RF-25, D-12).
 *
 * Ele separa os dois canais, e essa separação é contrato: o quadro, o texto e
 * o JSON saem pelo canal padrão; a recusa, a falha de leitura e o aviso de uso
 * incorreto saem pelo de erro. Redirecionar um não contamina o outro, e é o
 * que faz `--dados > arquivo.json` produzir JSON válido mesmo quando algo foi
 * dito ao usuário.
 *
 * Reversa não instalado NÃO é erro, e o código zero que ele recebe é a razão
 * de o contrato existir: um script que varre projetos precisa distinguir "não
 * instalado" de "não consegui ler".
 * @module cli/index
 */

import { existsSync, statSync } from 'node:fs'
import {
  BUILT_FROM_COMMIT,
  BUILT_FROM_ROOT,
  EXTENSION_VERSION,
} from '../host/build.ts'
import { readWorkspace } from '../host/reading.ts'
import type { BuildStamp } from '../host/session.ts'
import { apresentacaoDoAmbiente } from './ambiente.ts'
import { CODIGOS, lerArgumentos } from './argumentos.ts'
import type { Configuracao } from './argumentos.ts'
import { conferir } from './conferencia.ts'
import { documentoDeDados, textoDeDados } from './dados.ts'
import { rodarLaco } from './laco.ts'
import { codigoDaLeitura, textoDaPassada } from './passada.ts'
import { telaDeEntrada } from './quadro/entrada.ts'
import { linha, trecho } from './quadro/trechos.ts'
import { lerSessao } from './sessao.ts'
import type { DependenciasDaSessao } from './sessao.ts'
import { criarTerminal, vestirLinha } from './terminal.ts'
import { textoDaRecusa, textoDeUso } from './uso.ts'

/** O carimbo desta construção, o mesmo que o host de verdade passa (RF-22). */
const CARIMBO: BuildStamp = {
  version: EXTENSION_VERSION,
  commit: BUILT_FROM_COMMIT,
  root: BUILT_FROM_ROOT,
}

/** Uma linha no canal padrão. */
function dizer(texto: string): void {
  process.stdout.write(`${texto}\n`)
}

/** Uma linha no canal de erro, que é onde vai tudo o que não é leitura. */
function reclamar(texto: string): void {
  process.stderr.write(`${texto}\n`)
}

/** A sessão real: a leitura do host, com o registro no canal de erro. */
function sessaoReal(): DependenciasDaSessao {
  return {
    ler: (raiz) => readWorkspace(raiz, { log: { write: reclamar } }),
    carimbo: CARIMBO,
  }
}

/**
 * Rodar a ferramenta.
 * @param argumentos - o que veio depois do nome do script.
 * @returns o código de saída, entre os três do contrato.
 */
export async function principal(argumentos: readonly string[]): Promise<number> {
  const leitura = lerArgumentos(argumentos, {
    diretorioCorrente: process.cwd(),
    eDiretorio: (caminho) => existsSync(caminho) && statSync(caminho).isDirectory(),
    saidaEhTerminal: process.stdout.isTTY === true,
    ambiente: process.env,
  })

  if (leitura.kind === 'ajuda') {
    for (const linha of textoDeUso()) dizer(linha)
    return leitura.codigo
  }

  if (leitura.kind === 'uso-incorreto') {
    // A raiz inexistente tem tela própria, com título e corpo, como as outras
    // três situações de entrada (RF-04). Ela vai para o canal de erro, e nada
    // de leitura é impresso.
    if (leitura.motivo === 'raiz-inexistente') {
      //
      // Ela termina ANTES de existir quadro, e por isso não tem moldura: a
      // moldura é da interface viva. O que ela ganha é o título no papel de
      // falha, quando o canal de erro é um terminal com cor; fora disso sai o
      // texto de sempre, sem sequência alguma (feature 016, RF-09, D-22).
      const tela = telaDeEntrada('raiz-inexistente', { caminho: leitura.caminho })
      const { apresentacao } = apresentacaoDoAmbiente({
        ambiente: process.env,
        saidaEhTerminal: process.stderr.isTTY === true,
        semCor: argumentos.includes('--sem-cor'),
        tema: null,
      })
      reclamar(vestirLinha(linha([trecho(tela.titulo, 'falha', apresentacao.glifos)]), apresentacao))
      for (const texto of tela.corpo) reclamar(texto)
    } else {
      for (const linha of textoDaRecusa(leitura.mensagem)) reclamar(linha)
    }
    return leitura.codigo
  }

  const { config } = leitura
  // O aviso de tema sai uma vez, no canal de erro, antes de qualquer tela: a
  // variável inválida não impede a ferramenta de abrir (feature 016, RF-21).
  if (leitura.aviso !== null) reclamar(leitura.aviso)
  return config.modo === 'vivo' ? vivo(config) : umaPassada(config)
}

/**
 * Os dois modos sem pessoa diante da tela.
 * @param config - a raiz, o modo e os dois desligamentos.
 * @returns o código de saída.
 */
async function umaPassada(config: Configuracao): Promise<number> {
  const { entrada } = lerSessao(config.raiz, sessaoReal())
  // Desligada, não se pergunta e o desfecho é a ausência dele: o cabeçalho diz
  // nas palavras do terminal o que o desfecho `desligada` do protocolo diz nas
  // do editor, e aqui não há chave de configuração a que se referir.
  const desfecho = config.conferir ? await conferir({ ligada: true }) : null
  const comDesfecho = { ...entrada, update: desfecho }

  if (config.modo === 'dados') {
    process.stdout.write(
      textoDeDados(documentoDeDados(config.raiz, comDesfecho, desfecho)),
    )
    return codigoDaLeitura(entrada, CODIGOS)
  }

  process.stdout.write(
    textoDaPassada({
      entrada: comDesfecho,
      largura: process.stdout.columns,
      conferenciaLigada: config.conferir,
      apresentacao: config.apresentacao,
    }),
  )
  return codigoDaLeitura(entrada, CODIGOS)
}

/**
 * A interface viva.
 * @param config - a raiz, o modo e os dois desligamentos.
 * @returns o código de saída.
 */
async function vivo(config: Configuracao): Promise<number> {
  const terminal = criarTerminal({
    fluxos: { entrada: process.stdin, saida: process.stdout },
    apresentacao: config.apresentacao,
  })

  return rodarLaco({
    raiz: config.raiz,
    terminal,
    sessao: sessaoReal(),
    conferenciaLigada: config.conferir,
    conferir: () => (config.conferir ? conferir({ ligada: true }) : Promise.resolve(null)),
    mundoDoEditor: { ambiente: process.env },
    glifos: config.apresentacao.glifos,
  })
}
