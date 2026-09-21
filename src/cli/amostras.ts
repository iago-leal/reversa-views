/**
 * Os quadros de amostra do painel (feature 016, RF-17, D-23).
 *
 * Conferir a aparência exigiria alguém abrir um terminal por degrau de cor.
 * Aqui ela vira texto reproduzível: de um estado fixo sai um mapa de nome em
 * texto, e uma suíte compara o gerado com o gravado, de modo que uma mudança
 * de paleta aparece como diferença, e não como surpresa.
 *
 * Função pura, e é por isso que mora aqui: a ferramenta não escreve arquivo
 * algum, e esta função não escreve. Quem grava é a casca em `scripts/`, fora
 * desta unidade, como a promoção de equivalências já faz.
 *
 * Há uma amostra por degrau de cor e uma por situação de entrada QUE CHEGA À
 * INTERFACE VIVA, que são três. A raiz inexistente termina com o código de uso
 * incorreto antes de existir quadro, e por isso não tem amostra.
 *
 * Nenhuma sequência nasce aqui: quem veste é o módulo de terminal.
 * @module cli/amostras
 */

import type { SetProcessData } from '../host/protocol.ts'
import { effectiveCollapsed } from '../webview/domain/sections.ts'
import { readingIntegrity } from '../webview/domain/integrity.ts'
import { EMPTY_PREFERENCES } from '../webview/domain/types.ts'
import type { EffectiveEntry } from '../webview/domain/types.ts'
import { estadoInicial } from './navegacao.ts'
import { comporQuadro, contextoDeNavegacao, secoesDoTerminal } from './quadro/index.ts'
import type { EntradaDoQuadro } from './quadro/index.ts'
import { vestirLinha } from './terminal.ts'
import type { Apresentacao, EstadoDeNavegacao, Observacao } from './tipos.ts'

/** O estado fixo de que as amostras saem: uma leitura, com o instante congelado nela. */
export interface EstadoDasAmostras {
  carga: SetProcessData
}

/** A janela das amostras, que é a de um terminal comum. */
const JANELA = { largura: 100, altura: 40 }

/** A observação de um painel que está vigiando o disco, sem mudança ainda. */
const OBSERVANDO: Observacao = { ativa: true, razaoDaDegradacao: null, ultimaMudanca: null }

/** O que cada amostra varia sobre o padrão. */
interface Variante {
  nome: string
  apresentacao: Apresentacao
  largura?: number
  entrada?: (carga: SetProcessData) => EffectiveEntry
  ajuda?: boolean
}

const ESCURO_24: Apresentacao = { grau: '24bits', tema: 'escuro', glifos: 'unicode' }

/** As amostras, na ordem em que são geradas. */
const VARIANTES: readonly Variante[] = [
  { nome: 'grau-24bits-escuro', apresentacao: ESCURO_24 },
  { nome: 'grau-256-escuro', apresentacao: { ...ESCURO_24, grau: '256' } },
  { nome: 'grau-16-escuro', apresentacao: { ...ESCURO_24, grau: '16' } },
  { nome: 'grau-nenhuma', apresentacao: { ...ESCURO_24, grau: 'nenhuma' } },
  { nome: 'grau-24bits-claro', apresentacao: { ...ESCURO_24, tema: 'claro' } },
  { nome: 'entrada-integra', apresentacao: ESCURO_24 },
  {
    nome: 'entrada-sem-reversa',
    apresentacao: ESCURO_24,
    entrada: (carga) => ({ ...instalada(carga), kind: 'no-reversa', loaded: null }),
  },
  {
    nome: 'entrada-falha',
    apresentacao: ESCURO_24,
    entrada: (carga) => ({
      ...instalada(carga),
      kind: 'error',
      loaded: null,
      message: 'a leitura do estado do processo falhou: JSON inválido.',
    }),
  },
  { nome: 'ajuda', apresentacao: ESCURO_24, ajuda: true },
  { nome: 'janela-de-59-colunas', apresentacao: ESCURO_24, largura: 59 },
  { nome: 'sete-bits', apresentacao: { ...ESCURO_24, grau: 'nenhuma', glifos: 'sete-bits' } },
]

/** A entrada de uma leitura íntegra sobre a carga. */
function instalada(carga: SetProcessData): EffectiveEntry {
  return { kind: 'installed', rereading: false, loaded: carga, message: null, root: carga.root, update: null }
}

/** O estado de navegação em que o painel nasce sobre esta entrada, com a seleção num item. */
function navegacao(entrada: EffectiveEntry, pedido: Omit<EntradaDoQuadro, 'estado'>): EstadoDeNavegacao {
  const carga = entrada.loaded
  const fechadas = carga === null ? [] : effectiveCollapsed(EMPTY_PREFERENCES, readingIntegrity(carga))
  const vazio = { secoes: secoesDoTerminal(), itens: new Map(), alturaTotal: 0, alturaVisivel: 0 }
  const nascido = estadoInicial(fechadas, vazio)
  const contexto = contextoDeNavegacao({ ...pedido, estado: nascido })
  // A segunda seção navegável com item, no primeiro item dela: é onde a
  // amostra mostra o glifo de seleção e o dado secundário ao mesmo tempo.
  const comItem = contexto.secoes.filter(
    (nome) => !nascido.secoesFechadas.has(nome) && (contexto.itens.get(nome) ?? 0) > 0,
  )
  const alvo = comItem[1] ?? comItem[0]
  return alvo === undefined ? nascido : { ...nascido, secaoSelecionada: alvo, itemSelecionado: 0 }
}

/**
 * As amostras, de um estado fixo.
 * @param estado - a leitura de que todas saem.
 * @returns o nome de cada amostra e o texto dela, já vestido no degrau dela.
 */
export function amostrasDoPainel(estado: EstadoDasAmostras): Map<string, string> {
  const amostras = new Map<string, string>()

  for (const variante of VARIANTES) {
    const entrada = (variante.entrada ?? instalada)(estado.carga)
    const pedido: Omit<EntradaDoQuadro, 'estado'> = {
      entrada,
      largura: variante.largura ?? JANELA.largura,
      // Alta o bastante para o quadro inteiro: a amostra é para ser lida, e a
      // rolagem já tem suíte própria.
      altura: Number.MAX_SAFE_INTEGER,
      observacao: OBSERVANDO,
      procedencia: 'primeira',
      conferenciaLigada: false,
      apresentacao: { molduras: true, glifos: variante.apresentacao.glifos },
    }
    const estadoDaTela = { ...navegacao(entrada, pedido), ajudaVisivel: variante.ajuda === true }
    const quadro = comporQuadro({ ...pedido, estado: estadoDaTela, altura: JANELA.altura })
    const inteiro = comporQuadro({ ...pedido, estado: estadoDaTela })

    const linhas = inteiro.linhas.map((linha) => vestirLinha(linha, variante.apresentacao))
    if (quadro.linhaDeEstado !== null) {
      linhas.push(vestirLinha(quadro.linhaDeEstado, variante.apresentacao))
    }
    amostras.set(`${variante.nome}.txt`, `${linhas.join('\n')}\n`)
  }

  return amostras
}
