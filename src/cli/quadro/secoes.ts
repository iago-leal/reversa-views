/**
 * As onze seções, na ordem que o painel fixa (RF-06, RN-04, RF-02).
 *
 * A ordem não é escolhida aqui: ela vem de `sectionOrder()`, a mesma função
 * que o painel usa, e não varia com o processo lido. Duas superfícies que
 * ordenam diferente obrigam a aprender duas vezes o mesmo produto.
 *
 * Nenhuma REGRA de apresentação nasce neste módulo, e essa é a fronteira que a
 * suíte prende: rótulo, recorte e ordem saem de `webview/domain/`, por
 * importação e não por cópia. O que sobra aqui é a forma do terminal, que a
 * tela resolve com marcação e este lado resolve com texto.
 *
 * Os TÍTULOS são a única transcrição, e ela é deliberada: eles vivem hoje como
 * literal dentro de cada componente, e trazê-los para cá seria tocar onze
 * arquivos da tela para não mudar comportamento algum. O que torna a
 * transcrição aceitável é `tests/cli-paridade.spec.ts`, que compara os dois
 * lados sobre a mesma carga. Divergiu, corrige-se o lado que saiu da linha; a
 * comparação não se afrouxa.
 * @module cli/quadro/secoes
 */

import type { SetProcessData } from '../../host/protocol.ts'
import { brasiliaInstant } from '../../webview/domain/instants.ts'
import { bugsView } from '../../webview/domain/bugs-view.ts'
import { decompositionView } from '../../webview/domain/decomposition-view.ts'
import {
  bugPhaseLabel,
  bugSeverityLabel,
  bugStateLabel,
  checkpointMark,
  checkpointStateMark,
  componentSituationLabel,
  currentStageSentence,
  cyclePhaseMarks,
  cycleSentence,
  extractionLabel,
  greenfieldStageLabel,
  markLabel,
  nonAgentEntries,
  originStepLabel,
  phaseMark,
  provenanceText,
  scenarioLabel,
  situationLabel,
  stageLabel,
  stagesLine,
  stepStatusLabel,
  undeclaredClosureSentence,
} from '../../webview/domain/labels.ts'
import { originSteps, pipelineStarted } from '../../webview/domain/origin-view.ts'
import { panoramaView } from '../../webview/domain/panorama-view.ts'
import { sectionOrder } from '../../webview/domain/sections.ts'
import type { SectionName } from '../../webview/domain/types.ts'
import type { ItemDaSecao, SecaoDesenhada } from '../tipos.ts'
import { faixaDeBloqueio, TITULO_DO_BLOQUEIO } from './bloqueio.ts'
import { secaoDeAnomalias, secaoDaSonda, secaoDePolitica } from './diagnostico.ts'

/** O título de cada seção, na letra em que o painel o desenha. */
export const TITULOS: Record<SectionName, string> = {
  blocking: TITULO_DO_BLOQUEIO,
  forward: 'Ciclo forward',
  decomposition: 'Decomposição da feature ativa',
  panorama: 'Panorama do produto',
  history: 'Histórico das entregas',
  bugs: 'Registro de bugs',
  discovery: 'Descoberta',
  origem: 'Origem do projeto',
  policy: 'Política de escrita',
  anomalies: 'Anomalias',
  probe: 'Relatório da sonda',
}

/** O que um item do ciclo forward diz quando não há nada para ele. */
const AUSENTE = 'nenhum'

/** Um par rótulo e valor, nunca em branco. */
function par(rotulo: string, valor: string | number | null): ItemDaSecao {
  const texto = valor === null || valor === '' ? AUSENTE : String(valor)
  return { texto: `${rotulo}: ${texto}`, artefato: null }
}

/**
 * Todas as seções, na ordem que o painel fixa.
 * @param carga - a leitura que o host entregou.
 * @returns as onze, em ordem.
 */
export function secoesDoQuadro(carga: SetProcessData): SecaoDesenhada[] {
  const porNome: Record<SectionName, () => SecaoDesenhada> = {
    blocking: () => faixaDeBloqueio(carga),
    forward: () => secaoDoForward(carga),
    decomposition: () => secaoDaDecomposicao(carga),
    panorama: () => secaoDoPanorama(carga),
    history: () => secaoDoHistorico(carga),
    bugs: () => secaoDosBugs(carga),
    discovery: () => secaoDaDescoberta(carga),
    origem: () => secaoDaOrigem(carga),
    policy: () => secaoDePolitica(carga),
    anomalies: () => secaoDeAnomalias(carga),
    probe: () => secaoDaSonda(carga),
  }
  return sectionOrder().map((nome) => porNome[nome]())
}

/** O ciclo forward, nos oito itens que o cartão desenha, nenhum em branco. */
function secaoDoForward(carga: SetProcessData): SecaoDesenhada {
  const { forward } = carga.process
  const rotulo = stageLabel(forward.stage)
  const pausadas = forward.pausedFeatures.map((f) => f.shortName ?? f.featureId)

  return {
    nome: 'forward',
    titulo: TITULOS.forward,
    contagem: null,
    corpo: [
      `${forward.actions.fechadas} de ${forward.actions.total} ações fechadas`,
    ],
    itens: [
      par('Estágio', rotulo.known ? rotulo.text : `${rotulo.raw} (rótulo desconhecido)`),
      {
        texto: `Feature ativa: ${forward.shortName ?? forward.featureDir ?? AUSENTE}`,
        artefato: forward.featureDir,
      },
      par('Ações fechadas', forward.actions.fechadas),
      par('Ações abertas', forward.actions.abertas),
      par('Emendas', forward.actions.emendas),
      par('Dúvidas', forward.doubts),
      par('Features pausadas', pausadas.join(', ')),
      { texto: `Adendo: ${forward.addendum ?? AUSENTE}`, artefato: forward.addendum },
    ],
    recolhivel: true,
  }
}

/** A decomposição da feature ativa, na ordem e no corte que o cartão decide. */
function secaoDaDecomposicao(carga: SetProcessData): SecaoDesenhada {
  const { decomposition } = carga
  if (!decomposition.lida) {
    return {
      nome: 'decomposition',
      titulo: TITULOS.decomposition,
      contagem: null,
      corpo: ['A decomposição da feature ativa não foi lida por esta leitura.'],
      itens: [],
      recolhivel: true,
    }
  }

  // Sem corte: no terminal a rolagem já resolve o que na tela custaria um
  // clique, e esconder linha atrás de um gesto que o teclado teria de
  // inventar custaria mais do que mostra.
  const vista = decompositionView(decomposition, carga.process.progress, true)

  return {
    nome: 'decomposition',
    titulo: TITULOS.decomposition,
    contagem: vista.total,
    corpo:
      vista.total === 0
        ? ['A feature ativa não tem ação alguma declarada.']
        : [`Próxima ação: ${vista.proxima ?? 'nenhuma aberta'}`],
    itens: vista.linhas.map((linha) => ({
      texto: [
        linha.proxima ? '→' : linha.acao.fechada ? '✓' : '·',
        linha.acao.id,
        linha.acao.descricao,
        linha.acao.arquivoAlvo,
        linha.ultimoEvento === null ? null : brasiliaInstant(linha.ultimoEvento).text,
      ]
        .filter((parte) => parte !== null && parte !== '')
        .join(' '),
      artefato: linha.acao.arquivoAlvo,
      alerta: linha.proxima,
    })),
    recolhivel: true,
  }
}

/** O panorama do produto, nos grupos e na ordem que a mesma função pura decide. */
function secaoDoPanorama(carga: SetProcessData): SecaoDesenhada {
  const eixo = carga.greenfield
  if (eixo === undefined) {
    return semLeitura('panorama', 'O eixo greenfield não foi lido por esta leitura.')
  }
  if (!pipelineStarted(eixo)) {
    return semLeitura('panorama', 'Este projeto não nasceu por /reversa-new.')
  }

  const vista = panoramaView(eixo.panorama)
  const itens: ItemDaSecao[] = []
  for (const grupo of vista.grupos) {
    for (const componente of grupo.componentes) {
      itens.push({
        texto: `${componente.nome} · ${componentSituationLabel(componente.situacao).text}${
          componente.marca === 'ativa' ? ' · ativa' : ''
        }`,
        artefato: componente.spec ?? null,
      })
    }
  }
  for (const fora of eixo.panorama.foraDoPlano) {
    itens.push({
      texto: `${fora.id ?? ''}-${fora.nomeCurto ?? fora.pasta} · ${situationLabel(fora.situacao).text} · fora do plano`,
      artefato: fora.pasta,
      alerta: true,
    })
  }

  return {
    nome: 'panorama',
    titulo: TITULOS.panorama,
    contagem: vista.total,
    corpo: [
      `${vista.convergidos} de ${vista.total} componentes planejados convergidos.`,
      ...(vista.truncado ? ['A lista de specs foi truncada na leitura.'] : []),
      ...(vista.semSpec === null
        ? ['Vínculo declarado não lido por esta leitura.']
        : vista.semSpec.length === 0
          ? []
          : [`${vista.semSpec.length} componentes entregues sem spec.`]),
    ],
    itens,
    recolhivel: true,
  }
}

/** O histórico das entregas, mais recente primeiro, como a leitura o ordenou. */
function secaoDoHistorico(carga: SetProcessData): SecaoDesenhada {
  const { history } = carga

  return {
    nome: 'history',
    titulo: TITULOS.history,
    contagem: history.total,
    corpo: [
      `${history.entradas.length} de ${history.total} pastas lidas.`,
      ...(history.truncado ? ['A leitura das pastas foi truncada no teto declarado.'] : []),
      ...(history.entradas.length === 0 ? ['Nenhuma entrega anterior foi encontrada.'] : []),
    ],
    itens: history.entradas.map((entrada) => ({
      texto: [
        `${entrada.id ?? ''}${entrada.id === null ? '' : '-'}${entrada.nomeCurto ?? entrada.pasta}`,
        situationLabel(entrada.situacao).text,
        markLabel(entrada.marca).text,
        `${entrada.acoes.fechadas}/${entrada.acoes.total} ações`,
        entrada.resumo,
      ]
        .filter((parte) => parte !== null && parte !== '')
        .join(' · '),
      artefato: entrada.pasta,
    })),
    recolhivel: true,
  }
}

/** O registro de bugs, agrupado por contexto e na ordem que o cartão usa. */
function secaoDosBugs(carga: SetProcessData): SecaoDesenhada {
  const registro = carga.bugs
  if (registro === undefined) {
    return semLeitura('bugs', 'O registro de bugs não foi lido por esta leitura.')
  }
  if (!registro.presente) {
    return semLeitura('bugs', 'Este projeto não tem registro de bugs.')
  }

  // Todos os contextos revelados: a rolagem do terminal substitui o corte.
  const vista = bugsView(registro, new Set(registro.contextos.map((c) => c.contexto)))
  const itens: ItemDaSecao[] = []
  for (const grupo of vista.grupos) {
    itens.push({ texto: `${grupo.contexto} (${grupo.total})`, artefato: grupo.pasta })
    for (const linha of grupo.linhas) {
      itens.push({
        texto: [
          linha.proximo ? '→' : '·',
          linha.bug.id ?? linha.bug.pasta,
          linha.bug.titulo,
          linha.bug.estado === null ? linha.bug.estadoBruto : bugStateLabel(linha.bug.estado).text,
          linha.bug.fase === null ? null : bugPhaseLabel(linha.bug.fase).text,
          linha.bug.severidade === null ? null : bugSeverityLabel(linha.bug.severidade).text,
        ]
          .filter((parte) => parte !== null && parte !== '')
          .join(' · '),
        artefato: linha.bug.arquivo,
        alerta: linha.proximo,
      })
    }
  }

  return {
    nome: 'bugs',
    titulo: TITULOS.bugs,
    contagem: registro.lidos,
    corpo: [
      `Próximo a tratar: ${vista.proximo ?? 'nenhum'}`,
      ...(registro.truncado ? ['A varredura do registro parou no teto declarado.'] : []),
    ],
    itens,
    recolhivel: true,
  }
}

/** A descoberta: as cinco fases canônicas e os checkpoints de cada agente. */
function secaoDaDescoberta(carga: SetProcessData): SecaoDesenhada {
  const { discovery } = carga.process
  const eixo = carga.discoveryState

  const corpo: string[] = []
  if (eixo !== undefined && eixo.extracao.situacao === 'encerrada') {
    corpo.push(
      `${extractionLabel(eixo.extracao.situacao).text}: o processo declarou o fim na fase ${eixo.extracao.bruto}. As cinco fases canônicas seguem abaixo, como sempre.`,
    )
  }
  if (carga.greenfield?.cenario === 'greenfield' && discovery.phases.every((f) => f.status !== 'done')) {
    corpo.push(
      'Projeto nascido por /reversa-new, ainda sem extração: as fases seguem pendentes até que /reversa rode sobre o código novo.',
    )
  }

  // Feature 015: as frases são as de `labels.ts`, as mesmas da tela, e nulas
  // diante de host anterior ou de projeto sem ciclo e sem etapa aprovada.
  const semDeclaracao = undeclaredClosureSentence(eixo)
  if (semDeclaracao !== null) corpo.push(semDeclaracao)
  const ciclo = cycleSentence(eixo)
  if (ciclo !== null) corpo.push(ciclo)

  const fasesDoCiclo = cyclePhaseMarks(eixo)
  const itens: ItemDaSecao[] =
    fasesDoCiclo === null
      ? discovery.phases.map((fase) => {
          const marca = phaseMark(fase)
          return { texto: `${marca.label.text} · ${marca.status}`, artefato: null }
        })
      : fasesDoCiclo.map((marca) => ({
          texto: [marca.label.text, marca.status, marca.raw].filter((parte) => parte !== null).join(' · '),
          artefato: null,
        }))

  // A linha das etapas vem SOB as cinco fases, como na tela, e por isso é item
  // e não corpo: o corpo é desenhado antes dos itens.
  for (const frase of [stagesLine(eixo), currentStageSentence(eixo)]) {
    if (frase !== null) itens.push({ texto: frase, artefato: null })
  }

  if (eixo === undefined) {
    for (const checkpoint of discovery.checkpoints) {
      const marca = checkpointMark(checkpoint)
      itens.push({
        texto: [marca.label.text, marca.status, marca.instant === null ? null : brasiliaInstant(marca.instant).text]
          .filter((parte) => parte !== null)
          .join(' · '),
        artefato: null,
      })
    }
  } else {
    for (const checkpoint of eixo.checkpoints) {
      const marca = checkpointStateMark(checkpoint)
      itens.push({
        texto: [
          marca.label.text,
          marca.status,
          marca.instant === null ? null : brasiliaInstant(marca.instant).text,
          provenanceText(checkpoint.reconhecidoPor),
          checkpoint.camposComLista.length === 0
            ? null
            : `campos com lista de textos: ${checkpoint.camposComLista.join(', ')}`,
        ]
          .filter((parte) => parte !== null && parte !== '')
          .join(' · '),
        artefato: null,
      })
    }
    for (const registro of nonAgentEntries(eixo)) {
      itens.push({
        texto: `${registro.chave} · registro aprovado como não sendo agente`,
        artefato: null,
      })
    }
  }

  return {
    nome: 'discovery',
    titulo: TITULOS.discovery,
    contagem: null,
    corpo,
    itens,
    recolhivel: true,
  }
}

/** A origem do projeto: as quatro etapas de `/reversa-new` e o que cada uma deixou. */
function secaoDaOrigem(carga: SetProcessData): SecaoDesenhada {
  const eixo = carga.greenfield
  if (eixo === undefined) {
    return semLeitura('origem', 'O registro da origem não foi lido por esta leitura.')
  }

  const comecou = pipelineStarted(eixo)
  const titulo = comecou
    ? `${TITULOS.origem} · ${greenfieldStageLabel(eixo.estagio).text}`
    : TITULOS.origem

  return {
    nome: 'origem',
    titulo,
    contagem: null,
    corpo: [scenarioLabel(eixo.cenario).text, ...(eixo.resumo === null ? [] : [eixo.resumo])],
    itens: comecou
      ? originSteps(eixo).map((etapa) => ({
          texto: `${originStepLabel(etapa.etapa).text} · ${stepStatusLabel(etapa.status).text}${
            etapa.artefato === null ? '' : ` · ${etapa.artefato}`
          }`,
          artefato: etapa.artefato,
        }))
      : [],
    recolhivel: true,
  }
}

/** Uma seção que só tem uma frase a dizer, e diz. */
function semLeitura(nome: SectionName, frase: string): SecaoDesenhada {
  return { nome, titulo: TITULOS[nome], contagem: null, corpo: [frase], itens: [], recolhivel: true }
}
