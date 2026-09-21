/**
 * O laço vivo, que liga todos os outros (RF-09 a RF-16, RN-08, D-16).
 *
 * É o único módulo da ferramenta que mantém estado e o único que trata sinal.
 * Tudo o que ele faz de fato está em outro lugar: a leitura na sessão, a
 * decisão na navegação, o desenho no quadro, e as três capacidades de borda
 * nos três módulos que as confinam. O que sobra aqui é a ordem em que essas
 * coisas acontecem.
 *
 * A restauração do terminal está presa a QUATRO caminhos, e nenhum deles é
 * opcional: a saída normal, a falha não prevista, o sinal de interrupção e a
 * suspensão. Interface viva que deixa terminal quebrado é pior que nenhuma, e
 * o conserto do usuário seria `reset`.
 *
 * A suspensão por `Ctrl+Z` usa a MESMA dança da abertura do editor (D-16):
 * restaura ao suspender, redesenha por inteiro ao voltar. Suspender não é
 * sair, mas deixa o terminal em modo bruto do mesmo jeito, e a RN-08 não
 * distingue os dois casos.
 * @module cli/laco
 */

import type { UpdateStatus } from '../host/protocol.ts'
import { readingIntegrity } from '../webview/domain/integrity.ts'
import { effectiveCollapsed } from '../webview/domain/sections.ts'
import { EMPTY_PREFERENCES } from '../webview/domain/types.ts'
import type { EffectiveEntry, SectionName } from '../webview/domain/types.ts'
import { abrirNoEditor, fraseDaAbertura } from './editor.ts'
import type { MundoDoEditor } from './editor.ts'
import { estadoInicial, navegar } from './navegacao.ts'
import { observar, pastasQueImportam } from './observacao.ts'
import type { MundoDaObservacao, Vigia } from './observacao.ts'
import {
  alturaUtil,
  artefatoSelecionado,
  blocoDaSelecao,
  comporQuadro,
  contextoDeNavegacao,
  indiceDaSelecao,
  secoesDoTerminal,
} from './quadro/index.ts'
import type { EntradaDoQuadro } from './quadro/index.ts'
import { ajustarDeslocamento } from './quadro/medidas.ts'
import { linha, trecho } from './quadro/trechos.ts'
import { lerSessao } from './sessao.ts'
import type { DependenciasDaSessao } from './sessao.ts'
import { reconhecerTecla } from './teclas.ts'
import type { Terminal } from './terminal.ts'
import type {
  EstadoDeNavegacao,
  JogoDeGlifos,
  Observacao,
  Procedencia,
  SecaoDoTerminal,
} from './tipos.ts'

/** A fatia do processo de que o laço precisa, para que ela seja substituível. */
export interface ProcessoDoLaco {
  on(sinal: string, ouvinte: () => void): unknown
  off(sinal: string, ouvinte: () => void): unknown
  kill(pid: number, sinal: string): unknown
  readonly pid: number
}

/** Tudo de que o laço precisa, e nada que ele possa descobrir sozinho. */
export interface PedidoDoLaco {
  raiz: string
  terminal: Terminal
  sessao: DependenciasDaSessao
  conferenciaLigada: boolean
  /**
   * A consulta à origem, que responde depois do primeiro desenho.
   *
   * Nulo é resposta legítima e significa que NÃO se perguntou: o cabeçalho
   * então diz, nas palavras do terminal, que a conferência está desligada
   * nesta execução. O desfecho `desligada` do protocolo fala da chave de
   * configuração do editor, que aqui não existe.
   */
  conferir: () => Promise<UpdateStatus | null>
  mundoDoEditor: MundoDoEditor
  /** O jogo de glifos que o ambiente comporta; Unicode quando nada é dito. */
  glifos?: JogoDeGlifos
  mundoDaObservacao?: MundoDaObservacao
  processo?: ProcessoDoLaco
}

/** A observação de antes de qualquer assinatura. */
const SEM_OBSERVACAO: Observacao = { ativa: false, razaoDaDegradacao: null, ultimaMudanca: null }

/**
 * Rodar a interface viva até alguém sair dela.
 * @param pedido - a raiz, o terminal, a sessão e as três bordas.
 * @returns o código de saída, que é sempre zero quando a leitura ocorreu.
 */
export async function rodarLaco(pedido: PedidoDoLaco): Promise<number> {
  const { terminal } = pedido
  const processo = pedido.processo ?? (process as unknown as ProcessoDoLaco)

  let entrada: EffectiveEntry = lerSessao(pedido.raiz, pedido.sessao).entrada
  let procedencia: Procedencia = 'primeira'
  let observacao: Observacao = SEM_OBSERVACAO
  let recado: string | null = null
  // O estado nasce da mesma decisão que o painel toma, e não de um contexto
  // medido: medir exigiria compor o quadro, e compor o quadro exige o estado.
  // A seção que é só do terminal nasce ABERTA, por não constar do que o painel
  // decide fechar: ela está ao fim do quadro, onde não custa a primeira tela,
  // e o desfecho da conferência de atualização, que mora nela, não deve
  // depender de gesto para ser visto (feature 016, D-15).
  let estado: EstadoDeNavegacao = estadoInicial(colapsoInicial(entrada), {
    secoes: secoesDoTerminal(),
    itens: new Map<SecaoDoTerminal, number>(),
    alturaTotal: 0,
    alturaVisivel: 0,
  })

  /** O pedido de desenho corrente, montado a cada uso porque tudo muda. */
  function pedidoDoQuadro(): EntradaDoQuadro {
    const { largura, altura } = terminal.dimensoes()
    return {
      entrada,
      estado,
      largura,
      // Uma linha fica para o recado do editor, quando há um. A da linha de
      // estado não é descontada aqui: quem a desconta é `alturaUtil`, e é de
      // lá, e só de lá, que sai a altura útil (feature 016, D-17).
      altura: Math.max(1, altura - (recado === null ? 0 : 1)),
      observacao,
      procedencia,
      conferenciaLigada: pedido.conferenciaLigada,
      apresentacao: { molduras: true, glifos: pedido.glifos ?? 'unicode' },
    }
  }

  /** O que `effectiveCollapsed` decide para esta leitura, como no painel. */
  function colapsoInicial(alvo: EffectiveEntry): SectionName[] {
    const carga = alvo.loaded
    const integridade =
      carga === null
        ? { degraded: false, anomalies: 0, refusals: 0, truncated: 0 }
        : readingIntegrity(carga)
    return effectiveCollapsed(EMPTY_PREFERENCES, integridade)
  }

  /** Desenha por inteiro, depois de pôr a seleção dentro da janela. */
  function desenhar(): void {
    const antes = pedidoDoQuadro()
    estado = {
      ...estado,
      primeiraLinhaVisivel: ajustarDeslocamento(
        indiceDaSelecao(antes),
        estado.primeiraLinhaVisivel,
        alturaUtil(antes),
        contextoDeNavegacao(antes).alturaTotal,
        // O bloco é o item com o dado secundário dele: é o caminho que diz o
        // que a confirmação abre, e ele mora na linha de baixo (D-19).
        blocoDaSelecao(antes),
      ),
    }
    const quadro = comporQuadro(pedidoDoQuadro())
    // O recado fica em linha própria, ACIMA da linha de estado, como sempre
    // esteve acima do fim da janela: a dança do editor não muda.
    if (recado !== null) {
      quadro.linhas.push(linha([trecho(recado, 'atencao', pedido.glifos ?? 'unicode')]))
    }
    terminal.desenhar(quadro)
  }

  /** Relê o disco preservando o que a releitura não deveria trocar (RN-08). */
  function reler(origem: Procedencia): void {
    entrada = lerSessao(pedido.raiz, pedido.sessao, entrada).entrada
    procedencia = origem
    recado = null
    desenhar()
  }

  terminal.entrar()

  let vigia: Vigia | null = null
  let solto = false

  /**
   * Devolve o terminal e desfaz tudo o que foi instalado.
   *
   * Idempotente, e chamada de todos os caminhos de saída: a normal, a falha
   * não prevista e os dois sinais.
   */
  const soltar = (): void => {
    if (solto) return
    solto = true
    vigia?.parar()
    pararTeclado()
    pararTamanho()
    processo.off('SIGINT', aoInterromper)
    processo.off('SIGTSTP', aoSuspender)
    processo.off('SIGCONT', aoRetomar)
    processo.off('uncaughtException', soltar)
    processo.off('exit', soltar)
    terminal.restaurar()
  }

  let terminar: ((codigo: number) => void) | null = null
  const fim = new Promise<number>((resolver) => {
    terminar = resolver
  })

  /** A saída, por tecla ou por sinal, sempre restaurando antes. */
  const sair = (codigo: number): void => {
    soltar()
    terminar?.(codigo)
  }

  /**
   * A dança da suspensão, nos quatro passos que o contrato fixa.
   *
   * A ordem é contrato, porque é onde o terminal se quebra quando alguém erra:
   * sair da tela alternativa e desligar o modo bruto, fazer o que suspende,
   * voltar ao modo bruto e à tela alternativa, e redesenhar POR INTEIRO. O
   * passo final é integral e não incremental: o que ocupou a tela pode ter
   * escrito qualquer coisa, e presumir o contrário produz resíduo visual.
   * @param entre - o que fazer com o terminal já devolvido.
   */
  function dancar(entre: () => void): void {
    terminal.restaurar()
    entre()
    terminal.entrar()
    desenhar()
  }

  const aoInterromper = (): void => sair(0)

  const aoSuspender = (): void => {
    // Restaura, para de verdade, e a retomada é o SIGCONT abaixo.
    terminal.restaurar()
    processo.kill(processo.pid, 'SIGSTOP')
  }

  const aoRetomar = (): void => {
    terminal.entrar()
    desenhar()
  }

  /** Uma tecla: reconhecer, navegar, e executar o efeito nomeado. */
  const aoBloco = (bloco: Uint8Array): void => {
    const tecla = reconhecerTecla(bloco)
    if (tecla === null) return

    const transicao = navegar(estado, tecla, contextoDeNavegacao(pedidoDoQuadro()))
    estado = transicao.estado

    switch (transicao.efeito) {
      case 'sair':
        sair(0)
        return
      case 'reler':
        reler('tecla')
        return
      case 'suspender':
        aoSuspender()
        return
      case 'abrir-artefato': {
        const artefato = artefatoSelecionado(pedidoDoQuadro())
        let abertura: ReturnType<typeof abrirNoEditor> | null = null
        dancar(() => {
          abertura = abrirNoEditor(pedido.raiz, artefato, pedido.mundoDoEditor)
        })
        recado = abertura === null ? null : fraseDaAbertura(abertura)
        if (recado !== null) desenhar()
        return
      }
      case 'nenhum':
        desenhar()
        return
    }
  }

  const pararTeclado = terminal.aoTeclar(aoBloco)
  // Redimensionar preserva a seleção e o conjunto de seções fechadas: o estado
  // não é tocado, e só o desenho refaz as contas da largura e da altura.
  const pararTamanho = terminal.aoRedimensionar(desenhar)

  processo.on('SIGINT', aoInterromper)
  processo.on('SIGTSTP', aoSuspender)
  processo.on('SIGCONT', aoRetomar)
  processo.on('uncaughtException', soltar)
  processo.on('exit', soltar)

  vigia = observar(
    pastasQueImportam(pedido.raiz, entrada.loaded),
    () => {
      observacao = vigia?.estado() ?? SEM_OBSERVACAO
      reler('observacao')
    },
    pedido.mundoDaObservacao,
  )
  observacao = vigia.estado()

  desenhar()

  // A consulta responde DEPOIS do primeiro desenho, como no editor: a leitura
  // do disco já está na tela quando a origem responde, e o cabeçalho ganha uma
  // linha em vez de esperar por ela.
  void pedido
    .conferir()
    .then((desfecho) => {
      if (solto || desfecho === null) return
      entrada = { ...entrada, update: desfecho }
      desenhar()
    })
    .catch(() => undefined)

  return fim
}
