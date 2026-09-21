/**
 * A composição do quadro inteiro (D-05, RF-06, RF-19 da 014; feature 016).
 *
 * Função pura de carga, estado de navegação e dimensões, devolvendo linhas
 * feitas de TRECHOS, cada um com um papel nomeado: é o que permite conferir a
 * tela inteira por suíte, sem terminal, que é a dívida de teste que toda
 * interface viva traz. Nenhuma sequência de escape nasce aqui, e nenhuma cor:
 * o desenho diz o que cada trecho é, e a tradução do papel em tom pertence ao
 * módulo de terminal, onde some quando a saída não é terminal.
 *
 * O visual é pele, e não julgamento. Nenhuma frase, rótulo, ordem de seção,
 * contagem ou caminho muda por força dele; muda como cada um é desenhado.
 * Glifo, moldura e papel são forma do terminal, e o resto continua vindo de
 * `webview/domain/` por importação.
 *
 * Há UMA disposição, para os três destinos: a interface viva, a passada
 * diante de terminal e a passada redirecionada. O que a interface viva tem a
 * mais é o que pertence a quem está diante da tela: o cursor, o glifo que diz
 * se a seção está aberta, as molduras e a linha de estado. Num texto que vai
 * para arquivo não há gesto que abra ou feche seção, e marcar o estado de um
 * gesto que não existe descreveria o que não houve.
 *
 * Cinco funções sobre a mesma entrada, e não uma que devolve tudo: o laço
 * precisa do quadro, a máquina de navegação precisa do contexto, a rolagem
 * precisa do índice e do bloco da seleção, e o editor precisa do artefato
 * dela. Juntá-las num objeto só obrigaria cada chamador a receber o que não
 * usa.
 * @module cli/quadro/index
 */

import type { EffectiveEntry } from '../../webview/domain/types.ts'
import { sectionOrder } from '../../webview/domain/sections.ts'
import { SECAO_DE_VERSOES } from '../tipos.ts'
import type {
  EstadoDeNavegacao,
  JogoDeGlifos,
  LinhaDoQuadro,
  MarcaDeEstado,
  Observacao,
  Papel,
  Procedencia,
  Quadro,
  SecaoDesenhada,
  SecaoDoTerminal,
  Trecho,
} from '../tipos.ts'
import type { ContextoDeNavegacao } from '../navegacao.ts'
import { painelDeAjuda } from './ajuda.ts'
import { nucleoDoCabecalho, NOME_DA_FERRAMENTA } from './cabecalho.ts'
import { situacaoDaEntrada, telaDeEntrada } from './entrada.ts'
import { colunas, GLIFOS } from './glifos.ts'
import type { Glifos } from './glifos.ts'
import { neutralizar } from './higiene.ts'
import { linhaDeEstado } from './linha-de-estado.ts'
import { janela, recortar } from './medidas.ts'
import { emoldurar, larguraInterna } from './moldura.ts'
import { linhasDaProcedencia } from './procedencia.ts'
import { secaoDeVersoes } from './secao-de-versoes.ts'
import { secoesDoQuadro } from './secoes.ts'
import { linha, linhaVazia, trecho } from './trechos.ts'

/** O que o compositor sabe da apresentação: a forma, e nunca a cor. */
export interface ApresentacaoDoQuadro {
  /**
   * Se este é o quadro da interface viva, que tem moldura e linha de estado.
   *
   * A regra "moldura e linha de estado pertencem à interface viva" é este
   * campo, e não um segundo compositor (D-10). A moldura ainda pede largura.
   */
  molduras: boolean
  glifos: JogoDeGlifos
}

/** Tudo de que o desenho precisa, e nada além disso. */
export interface EntradaDoQuadro {
  entrada: EffectiveEntry
  estado: EstadoDeNavegacao
  largura: number
  altura: number
  observacao: Observacao
  procedencia: Procedencia
  /** Se a consulta à origem foi feita nesta execução (RF-23). */
  conferenciaLigada: boolean
  /**
   * Se há cursor a desenhar; verdadeiro quando nada é dito.
   *
   * O modo de uma passada é o MESMO quadro sem cursor: não há ninguém para
   * mover a seleção, e uma linha marcada como escolhida num texto que vai para
   * arquivo descreveria um gesto que não houve.
   */
  cursor?: boolean
  /** Sem molduras e com glifos Unicode quando nada é dito. */
  apresentacao?: ApresentacaoDoQuadro
}

/** Abaixo disso as molduras somem, e só elas (RF-13). */
export const LARGURA_MINIMA_DA_MOLDURA = 60

/** A apresentação de quem não declarou nenhuma. */
const SEM_MOLDURAS: ApresentacaoDoQuadro = { molduras: false, glifos: 'unicode' }

/** O recuo do corpo e dos itens sob o título, e o da continuação de cada um. */
const RECUO = '  '

/**
 * A marca da linha selecionada no jogo de sete bits, que ocupa a coluna do
 * cursor.
 *
 * Ela existe porque o item sob o cursor tem de ser distinguível SEM depender
 * de cor. A coluna do cursor é reservada em toda linha navegável da interface
 * viva, e é isso que impede a linha de dançar para a direita ao ser escolhida.
 */
export const CURSOR = `${GLIFOS['sete-bits'].selecao} `

/** O papel do glifo de estado de um item, que acompanha o que o glifo diz (RF-05). */
const PAPEL_DA_MARCA: Record<MarcaDeEstado, Papel> = {
  fechada: 'concluido',
  proxima: 'atencao',
  aberta: 'atenuado',
}

/** Onde a seleção caiu: a linha, e quantas linhas o item dela ocupa. */
interface Selecao {
  indice: number
  bloco: number
}

/** O que a montagem devolve: as linhas, e onde está a seleção. */
interface Montagem {
  linhas: LinhaDoQuadro[]
  selecao: Selecao | null
}

/**
 * As seções por que o terminal navega: as onze do painel, mais a dele.
 * @returns a ordem navegável, que é `sectionOrder()` com a seção de versões ao fim.
 */
export function secoesDoTerminal(): readonly SecaoDoTerminal[] {
  return [...sectionOrder(), SECAO_DE_VERSOES]
}

/**
 * Quantas linhas do quadro a janela mostra.
 *
 * A conta sai daqui e de nenhum outro lugar: a linha de estado toma a última
 * linha da janela, e o compositor, o contexto de navegação e o laço precisam
 * concordar sobre isso, porque o deslocamento máximo depende dela.
 * @param pedido - a entrada, o estado e as dimensões.
 * @returns a altura útil.
 */
export function alturaUtil(pedido: EntradaDoQuadro): number {
  return apresentacaoDe(pedido).molduras ? Math.max(1, pedido.altura - 1) : pedido.altura
}

/**
 * Todas as linhas do quadro, antes de qualquer janela.
 * @param pedido - a entrada, o estado e as dimensões.
 * @returns o quadro inteiro, em ordem.
 */
export function linhasDoQuadro(pedido: EntradaDoQuadro): LinhaDoQuadro[] {
  return montar(pedido).linhas
}

/**
 * O quadro que a janela mostra, com a altura do quadro inteiro ao lado.
 * @param pedido - a entrada, o estado e as dimensões.
 * @returns as linhas visíveis, a altura total e a linha de estado.
 */
export function comporQuadro(pedido: EntradaDoQuadro): Quadro {
  const todas = linhasDoQuadro(pedido)
  const visiveis = alturaUtil(pedido)
  const fundo = Math.max(0, todas.length - visiveis)
  const primeira = Math.min(Math.max(0, pedido.estado.primeiraLinhaVisivel), fundo)
  const apresentacao = apresentacaoDe(pedido)

  return {
    linhas: janela(todas, primeira, visiveis),
    alturaTotal: todas.length,
    linhaDeEstado: apresentacao.molduras
      ? linhaDeEstado({
          largura: pedido.largura,
          jogo: apresentacao.glifos,
          observacao: pedido.observacao,
          procedencia: origemDaLeitura(pedido)[0] ?? '',
          primeira,
          visiveis,
          total: todas.length,
        })
      : null,
  }
}

/**
 * O contexto que a máquina de navegação precisa para se mover no quadro.
 * @param pedido - a entrada, o estado e as dimensões.
 * @returns as seções, as contagens de itens e as duas alturas.
 */
export function contextoDeNavegacao(pedido: EntradaDoQuadro): ContextoDeNavegacao {
  const itens = new Map<SecaoDoTerminal, number>(
    secoesDoTerminal().map((nome) => [nome, 0] as [SecaoDoTerminal, number]),
  )
  for (const secao of secoesDesenhadas(pedido)) itens.set(secao.nome, secao.itens.length)

  return {
    secoes: secoesDoTerminal(),
    itens,
    alturaTotal: linhasDoQuadro(pedido).length,
    alturaVisivel: alturaUtil(pedido),
  }
}

/**
 * Onde a linha selecionada está no quadro inteiro.
 * @param pedido - a entrada, o estado e as dimensões.
 * @returns o índice, ou nulo quando nada está selecionado.
 */
export function indiceDaSelecao(pedido: EntradaDoQuadro): number | null {
  return montar(pedido).selecao?.indice ?? null
}

/**
 * Quantas linhas o item selecionado ocupa: a principal, as de continuação e
 * as do dado secundário (D-19).
 *
 * A rolagem precisa disso porque o caminho, que diz o que a confirmação abre,
 * passou a morar numa linha abaixo da descrição.
 * @param pedido - a entrada, o estado e as dimensões.
 * @returns o tamanho do bloco; um quando nada está selecionado.
 */
export function blocoDaSelecao(pedido: EntradaDoQuadro): number {
  return montar(pedido).selecao?.bloco ?? 1
}

/**
 * O artefato que a confirmação abriria sobre a linha selecionada.
 * @param pedido - a entrada, o estado e as dimensões.
 * @returns o caminho relativo, ou nulo quando a linha não aponta nada.
 */
export function artefatoSelecionado(pedido: EntradaDoQuadro): string | null {
  return linhasDoQuadro(pedido).find((desenhada) => desenhada.selecionada)?.artefato ?? null
}

/** A apresentação do pedido, ou a de quem não declarou nenhuma. */
function apresentacaoDe(pedido: EntradaDoQuadro): ApresentacaoDoQuadro {
  return pedido.apresentacao ?? SEM_MOLDURAS
}

/** Se este pedido desenha moldura: interface viva, e janela que a comporte. */
function comMolduras(pedido: EntradaDoQuadro): boolean {
  return apresentacaoDe(pedido).molduras && pedido.largura >= LARGURA_MINIMA_DA_MOLDURA
}

/** As linhas de `linhasDaProcedencia` para esta leitura, inteiras. */
function origemDaLeitura(pedido: EntradaDoQuadro): string[] {
  return linhasDaProcedencia(
    pedido.procedencia,
    pedido.entrada.loaded?.readAt ?? null,
    pedido.observacao,
  )
}

/** As seções deste pedido: as onze quando há carga, e a de versões sempre. */
function secoesDesenhadas(pedido: EntradaDoQuadro): SecaoDesenhada[] {
  const carga = pedido.entrada.loaded
  const glifos = GLIFOS[apresentacaoDe(pedido).glifos]
  return [
    ...(carga === null ? [] : secoesDoQuadro(carga, glifos)),
    secaoDeVersoes(pedido.entrada, pedido.conferenciaLigada, origemDaLeitura(pedido)),
  ]
}

/**
 * Montar o quadro inteiro, anotando onde a seleção caiu.
 * @param pedido - a entrada, o estado e as dimensões.
 * @returns as linhas e a seleção.
 */
function montar(pedido: EntradaDoQuadro): Montagem {
  const apresentacao = apresentacaoDe(pedido)

  // A ajuda é desenhada SOBRE o quadro: o estado de navegação não é tocado, de
  // modo que escondê-la devolve exatamente o que estava embaixo.
  if (pedido.estado.ajudaVisivel) {
    return {
      linhas: painelDeAjuda(pedido.largura, {
        molduras: comMolduras(pedido),
        glifos: apresentacao.glifos,
      }),
      selecao: null,
    }
  }

  const linhas: LinhaDoQuadro[] = [...linhasDoNucleo(pedido), linhaVazia()]
  linhas.push(...linhasDaEntrada(pedido), linhaVazia())

  let selecao: Selecao | null = null
  for (const secao of secoesDesenhadas(pedido)) {
    const montada = linhasDaSecao(secao, pedido)
    if (montada.selecao !== null) {
      selecao = { ...montada.selecao, indice: montada.selecao.indice + linhas.length }
    }
    linhas.push(...montada.linhas, linhaVazia())
  }

  return { linhas, selecao }
}

/**
 * O núcleo do cabeçalho: o nome da ferramenta e os quatro fatos (RF-02).
 * @param pedido - a entrada, o estado e as dimensões.
 * @returns as linhas, em moldura quando a interface viva a comporta.
 */
function linhasDoNucleo(pedido: EntradaDoQuadro): LinhaDoQuadro[] {
  const jogo = apresentacaoDe(pedido).glifos
  const nucleo = nucleoDoCabecalho(pedido.entrada)
  const emCaixa = comMolduras(pedido)
  const largura = emCaixa ? larguraInterna(pedido.largura) : pedido.largura

  const fatos: LinhaDoQuadro[] = []
  for (const fato of nucleo.fatos) escrever(fatos, { texto: fato, papel: 'normal', largura, jogo })
  if (nucleo.integridade !== null) {
    escrever(fatos, {
      texto: nucleo.integridade,
      papel: nucleo.degradada ? 'atencao' : 'normal',
      largura,
      jogo,
    })
  }

  const nome = trecho(NOME_DA_FERRAMENTA, 'destaque', jogo)
  if (!emCaixa) return [linha([nome]), ...fatos]

  return emoldurar({
    titulo: [nome],
    conteudo: fatos,
    largura: pedido.largura,
    papel: 'acento',
    glifos: GLIFOS[jogo],
  })
}

/**
 * A situação de entrada, com título e corpo próprios (RF-04 da 014, RF-09).
 *
 * A que tem menos a dizer continua dizendo alguma coisa. A falha de leitura
 * usa o papel de falha, no título e na borda; as demais, a borda discreta.
 * @param pedido - a entrada, o estado e as dimensões.
 * @returns as linhas, em moldura quando a interface viva a comporta.
 */
function linhasDaEntrada(pedido: EntradaDoQuadro): LinhaDoQuadro[] {
  const jogo = apresentacaoDe(pedido).glifos
  const situacao = situacaoDaEntrada(pedido.entrada)
  const tela = telaDeEntrada(situacao, {
    caminho: pedido.entrada.root,
    mensagem: pedido.entrada.message,
  })
  const falhou = situacao === 'falha' || situacao === 'raiz-inexistente'
  const titulo = trecho(tela.titulo, falhou ? 'falha' : 'titulo', jogo)

  if (!comMolduras(pedido)) {
    const linhas: LinhaDoQuadro[] = [linha([titulo])]
    for (const texto of tela.corpo) {
      escrever(linhas, { texto, papel: 'normal', largura: pedido.largura, jogo, prefixo: [trecho(RECUO)] })
    }
    return linhas
  }

  const corpo: LinhaDoQuadro[] = []
  for (const texto of tela.corpo) {
    escrever(corpo, { texto, papel: 'normal', largura: larguraInterna(pedido.largura), jogo })
  }
  return emoldurar({
    titulo: [titulo],
    conteudo: corpo,
    largura: pedido.largura,
    papel: falhou ? 'falha' : 'borda',
    glifos: GLIFOS[jogo],
  })
}

/** O que `escrever` precisa saber de uma linha lógica. */
interface PedidoDeLinha {
  texto: string
  papel: Papel
  largura: number
  jogo: JogoDeGlifos
  /** O que vem antes do texto na primeira linha: cursor, glifo, recuo. */
  prefixo?: Trecho[]
  /** Quantas colunas a continuação recua além do prefixo. */
  recuoDaContinuacao?: number
  /** Um trecho que fecha o texto com outro papel, como a contagem do título. */
  sufixo?: Trecho
  artefato?: string | null
  selecionada?: boolean
}

/**
 * Recortar uma linha lógica à largura e empurrar cada pedaço como linha.
 *
 * O texto é neutralizado ANTES do recorte, porque a substituição de um
 * caractere de controle pode mudar a largura. Só o primeiro pedaço carrega o
 * prefixo, o artefato e a seleção: a seleção é UMA linha, e marcar a
 * continuação faria o cursor parecer dois.
 * @param destino - onde as linhas entram.
 * @param pedido - o texto, o papel, a largura e o que o cerca.
 * @returns quantas linhas foram empurradas.
 */
function escrever(destino: LinhaDoQuadro[], pedido: PedidoDeLinha): number {
  const prefixo = pedido.prefixo ?? []
  const antes = prefixo.reduce((soma, pedaco) => soma + colunas(pedaco.texto), 0)
  const sufixo = pedido.sufixo?.texto ?? ''
  const limpo = neutralizar(pedido.texto + sufixo, pedido.jogo)
  const pedacos = recortar(
    limpo,
    Math.max(1, pedido.largura - antes),
    ' '.repeat(pedido.recuoDaContinuacao ?? RECUO.length),
  )

  pedacos.forEach((pedaco, indice) => {
    const primeira = indice === 0
    const ultima = indice === pedacos.length - 1
    // O sufixo só ganha papel próprio quando coube inteiro na última linha;
    // partido pelo recorte, segue o papel do texto, que é o que não mente.
    const comSufixo = ultima && sufixo !== '' && pedaco.endsWith(sufixo)
    const corpo = comSufixo ? pedaco.slice(0, pedaco.length - sufixo.length) : pedaco
    destino.push(
      linha(
        [
          ...(primeira ? prefixo : [trecho(' '.repeat(antes))]),
          trecho(corpo, pedido.papel, pedido.jogo),
          ...(comSufixo && pedido.sufixo !== undefined
            ? [trecho(sufixo, pedido.sufixo.papel, pedido.jogo)]
            : []),
        ],
        {
          artefato: primeira ? (pedido.artefato ?? null) : null,
          selecionada: primeira && pedido.selecionada,
        },
      ),
    )
  })

  return pedacos.length
}

/**
 * O que vem antes do título de uma seção: a coluna do cursor e o glifo que diz
 * se ela está aberta (RF-04, RF-07).
 * @param g - o jogo de glifos.
 * @param comCursor - se este é um quadro diante de alguém.
 * @param selecionado - se o cursor está neste título.
 * @param fechada - se a seção está fechada.
 * @param recolhivel - se a seção se fecha; a faixa de bloqueio não.
 * @returns os trechos do prefixo, nenhum quando não há cursor.
 */
function antesDoTitulo(
  g: Glifos,
  comCursor: boolean,
  selecionado: boolean,
  fechada: boolean,
  recolhivel: boolean,
): Trecho[] {
  if (!comCursor) return []
  const cursor = selecionado ? trecho(`${g.selecao} `, 'acento') : trecho(RECUO)
  if (!recolhivel) return [cursor]
  return [cursor, trecho(`${fechada ? g.secaoFechada : g.secaoAberta} `, 'acento')]
}

/**
 * Uma seção inteira: o título, o corpo quando aberta, e os itens.
 * @param secao - a seção já resolvida em texto.
 * @param pedido - a entrada, o estado e as dimensões.
 * @returns as linhas da seção, e onde a seleção caiu dentro delas.
 */
function linhasDaSecao(secao: SecaoDesenhada, pedido: EntradaDoQuadro): Montagem {
  const { estado } = pedido
  const jogo = apresentacaoDe(pedido).glifos
  const g = GLIFOS[jogo]
  const comCursor = pedido.cursor !== false
  const fechada = secao.recolhivel && estado.secoesFechadas.has(secao.nome)
  const daSecao = estado.secaoSelecionada === secao.nome
  const tituloSelecionado = comCursor && daSecao && estado.itemSelecionado === null

  // A faixa de bloqueio, quando tem o que dizer, vai em moldura própria, na
  // cor de atenção e com o glifo de atenção no título, que é o que a distingue
  // da moldura do cabeçalho também sem cor (RF-03). Sem bloqueio, a frase de
  // sempre e nenhuma moldura.
  const emCaixa = !secao.recolhivel && secao.itens.length > 0 && comMolduras(pedido)
  const largura = emCaixa ? larguraInterna(pedido.largura) : pedido.largura

  const contagem = secao.contagem === null ? '' : ` (${secao.contagem})`
  const papelDoTitulo: Papel = tituloSelecionado ? 'destaque' : emCaixa ? 'atencao' : 'titulo'
  const antes = antesDoTitulo(g, comCursor, tituloSelecionado, fechada, secao.recolhivel)
  const marcaDeFechada = !comCursor && fechada ? ` ${g.secaoFechada}` : ''

  let selecao: Selecao | null = null
  const corpo: LinhaDoQuadro[] = []

  if (!fechada) {
    const recuo = [trecho(comCursor ? RECUO + RECUO : RECUO)]
    for (const texto of secao.corpo) {
      escrever(corpo, { texto, papel: 'atenuado', largura, jogo, prefixo: recuo })
    }

    secao.itens.forEach((item, indice) => {
      const alvo = comCursor && daSecao && estado.itemSelecionado === indice
      const inicio = corpo.length
      const marca = item.marca ?? null
      const prefixo: Trecho[] = [
        ...(comCursor ? [alvo ? trecho(`${g.selecao} `, 'acento') : trecho(RECUO)] : []),
        trecho(RECUO),
        ...(marca === null ? [] : [trecho(`${glifoDaMarca(g, marca)} `, PAPEL_DA_MARCA[marca])]),
      ]
      escrever(corpo, {
        texto: item.texto,
        // A cor acompanha o glifo, e não o substitui: o item com marca fica
        // no papel normal, e o item de atenção sem marca leva o papel inteiro.
        papel: alvo ? 'titulo' : item.alerta === true && marca === null ? 'atencao' : 'normal',
        largura,
        jogo,
        prefixo,
        artefato: item.artefato,
        selecionada: alvo,
      })

      // O dado secundário em linha própria, recuado sob o texto do item e
      // atrás do glifo de continuação (RF-06). O caminho do artefato desce
      // também quando o módulo da seção não o declarou e o texto não o traz.
      const secundarios =
        item.secundarios ??
        (item.artefato === null || item.texto.includes(item.artefato) ? [] : [item.artefato])
      const sob = prefixo.reduce((soma, pedaco) => soma + colunas(pedaco.texto), 0)
      for (const texto of secundarios) {
        escrever(corpo, {
          texto,
          papel: 'atenuado',
          largura,
          jogo,
          prefixo: [trecho(' '.repeat(sob)), trecho(`${g.continuacao} `, 'atenuado')],
        })
      }

      if (alvo) selecao = { indice: inicio, bloco: corpo.length - inicio }
    })
  }

  if (emCaixa) {
    const linhas = emoldurar({
      titulo: [
        // Na borda, a coluna do cursor só existe quando o cursor está nela:
        // vazia, ela afastaria o título do canto sem dizer nada.
        ...(tituloSelecionado ? antes : []),
        trecho(`${g.atencao} `, 'atencao'),
        trecho(secao.titulo, papelDoTitulo, jogo),
        trecho(contagem, 'atenuado'),
      ],
      conteudo: corpo,
      largura: pedido.largura,
      papel: 'atencao',
      glifos: g,
      selecionada: tituloSelecionado,
    })
    // A borda superior é a linha do título: a seleção de um item anda uma
    // linha, e a do título é a própria borda.
    const naCaixa: Selecao | null = tituloSelecionado
      ? { indice: 0, bloco: 1 }
      : selecao === null
        ? null
        : { ...(selecao as Selecao), indice: (selecao as Selecao).indice + 1 }
    return { linhas, selecao: naCaixa }
  }

  const linhas: LinhaDoQuadro[] = []
  const doTitulo = escrever(linhas, {
    texto: secao.titulo,
    papel: papelDoTitulo,
    largura,
    jogo,
    prefixo: antes,
    sufixo: { texto: contagem + marcaDeFechada, papel: 'atenuado' },
    selecionada: tituloSelecionado,
  })
  linhas.push(...corpo)

  if (tituloSelecionado) return { linhas, selecao: { indice: 0, bloco: doTitulo } }
  if (selecao === null) return { linhas, selecao: null }
  return { linhas, selecao: { ...(selecao as Selecao), indice: (selecao as Selecao).indice + doTitulo } }
}

/** O glifo de um estado de ação, que continua sendo um de três (RF-05). */
function glifoDaMarca(g: Glifos, marca: MarcaDeEstado): string {
  return marca === 'fechada' ? g.acaoFechada : marca === 'proxima' ? g.acaoProxima : g.acaoAberta
}
