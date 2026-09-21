/**
 * O bloco de diagnóstico: política, anomalias e sonda (RF-07, RF-08).
 *
 * As três seções que o painel abre por último e que nascem fechadas, com uma
 * diferença que não é escolha desta feature: a contagem da leitura degradada é
 * SEMPRE visível, porque ela mora no cabeçalho, que nada recolhe. Aqui ficam a
 * lista das anomalias, com arquivo, código e detalhe, e o relatório da sonda,
 * com as recusas e os truncamentos.
 *
 * A lista de anomalias sai inteira de `composeAnomalies`, que é a mesma função
 * que o painel usa e a mesma que o cabeçalho conta. Duas somas do mesmo fato
 * concordariam por coincidência até a primeira delas mudar.
 * @module cli/quadro/diagnostico
 */

import { composeAnomalies } from '../../webview/domain/anomalies-view.ts'
import type { SetProcessData } from '../../host/protocol.ts'
import type { ItemDaSecao, SecaoDesenhada } from '../tipos.ts'

/**
 * A política de escrita em vigor, e as pastas em que o Reversa pode escrever.
 *
 * Com a política desligada, a seção DIZ que está desligada: uma lista de
 * pastas sozinha leria como permissão, e a diferença entre "pode escrever
 * aqui" e "só pode escrever aqui" é o contrato inteiro.
 * @param carga - a leitura que o host entregou.
 * @returns a seção da política.
 */
export function secaoDePolitica(carga: SetProcessData): SecaoDesenhada {
  const { policy, writableFolders } = carga.process
  const permitidos = policy.allowedPaths

  const veredito = policy.allowLegacyEdits
    ? permitidos.length === 0
      ? 'A edição do legado está liberada sem restrição de caminho.'
      : `A edição do legado está liberada nos caminhos declarados: ${permitidos.join(', ')}.`
    : 'A edição do legado está desligada. O Reversa escreve apenas nas pastas próprias.'

  return {
    nome: 'policy',
    titulo: 'Política de escrita',
    contagem: writableFolders.length,
    corpo: [veredito],
    itens: writableFolders.map((pasta) => ({ texto: pasta, artefato: null })),
    recolhivel: true,
  }
}

/**
 * Toda anomalia que a leitura encontrou, com arquivo, código e detalhe.
 *
 * Sem corte: o corte de dez do painel existe porque lá a lista empurra o resto
 * da tela para baixo e reabri-la é um clique. No terminal a rolagem já resolve
 * isso, e esconder linha atrás de um gesto que o teclado teria de inventar
 * custaria mais do que mostra.
 * @param carga - a leitura que o host entregou.
 * @returns a seção das anomalias.
 */
export function secaoDeAnomalias(carga: SetProcessData): SecaoDesenhada {
  const anomalias = composeAnomalies(carga)

  const itens: ItemDaSecao[] = anomalias.map((anomalia) => ({
    texto: [anomalia.file, anomalia.code, anomalia.detail]
      .filter((parte) => parte !== undefined && parte !== null && parte !== '')
      .join(' · '),
    artefato: null,
    alerta: true,
  }))

  return {
    nome: 'anomalies',
    titulo: 'Anomalias',
    contagem: anomalias.length,
    corpo: anomalias.length === 0 ? ['A leitura não encontrou anomalia alguma.'] : [],
    itens,
    recolhivel: true,
  }
}

/**
 * O que a sonda de fato fez: a raiz lida, a pasta da feature, o que recusou e
 * o que truncou.
 * @param carga - a leitura que o host entregou.
 * @returns a seção da sonda.
 */
export function secaoDaSonda(carga: SetProcessData): SecaoDesenhada {
  const { probe } = carga

  const itens: ItemDaSecao[] = [
    ...probe.refusals.map((recusa) => ({
      texto: `${recusa.path} recusado: ${recusa.reason}`,
      artefato: null,
      alerta: true,
    })),
    ...probe.truncated.map((caminho) => ({
      texto: `${caminho} truncado na leitura`,
      artefato: null,
      alerta: true,
    })),
  ]

  return {
    nome: 'probe',
    titulo: 'Relatório da sonda',
    contagem: probe.refusals.length + probe.truncated.length,
    corpo: [
      `Raiz lida: ${probe.workspace}`,
      `Pasta da feature: ${probe.featureDir ?? 'nenhuma'}`,
      ...(itens.length === 0 ? ['Nada foi recusado nem truncado.'] : []),
    ],
    itens,
    recolhivel: true,
  }
}
