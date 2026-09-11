/**
 * Desempenho da leitura no workspace de referência.
 *
 * A leitura é síncrona e sem cache, e o painel a fará a cada mudança em
 * disco. O teto de 200 ms para ler e julgar um workspace de referência é o
 * que separa um painel que acompanha o editor de um que o trava.
 *
 * O workspace de referência é sintético e fechado: uma feature ativa com os
 * cinco arquivos que a sonda lê, cada um perto de 64 KB e abaixo do teto de
 * 256 KB, mais cinquenta adendos do mesmo tamanho, que é o teto de adendos
 * que a sonda lê numa passada. Material sintético torna o limite verificável
 * em qualquer máquina, sem depender de um repositório real com ciclo forward
 * executado.
 *
 * Uma leitura de aquecimento é descartada antes da medição, para que o custo
 * de primeira leitura do cache de disco do sistema não entre na conta. Se
 * este teste falhar, repita uma vez com a máquina ociosa; oscilação
 * persistente é o sinal previsto para reabrir a discussão de leitura parcial.
 *
 * A feature 008 acrescentou o registro de bugs à referência, no teto: cinquenta
 * bugs, que é o máximo que uma passada lê, repartidos em dois contextos e com
 * metade deles travados. São duas medidas distintas, e de propósito. A LEITURA
 * do registro é disco, e cabe no mesmo teto de 200 ms da leitura do processo.
 * A PINTURA do bloco é a tela, e tem teto próprio de 100 ms, declarado na spec
 * do painel; ela é medida sobre o registro inteiro, com o corte dos encerrados
 * fazendo o que faz na tela de verdade.
 *
 * Na entrega da feature 008 a leitura do registro levou 24 ms contra o teto de
 * 200, e a pintura do bloco 3 ms contra o teto de 100. As duas medidas ficam
 * registradas aqui para que uma queda futura de folga seja visível como queda, e
 * não apenas como teste que passou raspando.
 */

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { readBugs } from '../src/domain/bugs.ts'
import { readGreenfield } from '../src/domain/greenfield.ts'
import { readHistory } from '../src/domain/history.ts'
import { BUG_CAP, SPEC_CAP } from '../src/domain/limits.ts'
import { readReversa } from '../src/heranca/reversa-domain/src/index.ts'
import { readReversaSnapshot } from '../src/heranca/reversa-probe/src/index.ts'
import { readBugFolders } from '../src/probe/bugs.ts'
import { readFeatureFolders } from '../src/probe/features.ts'
import { readGreenfieldArtifacts } from '../src/probe/greenfield.ts'
import { BugsSection } from '../src/webview/ui/BugsSection.tsx'
import { OriginSection } from '../src/webview/ui/OriginSection.tsx'
import { PanoramaSection } from '../src/webview/ui/PanoramaSection.tsx'

/** Teto de tempo para ler o disco e julgar o retrato, em milissegundos. */
const TETO_MS = 200

/** Tamanho alvo de cada arquivo do workspace de referência, em bytes. */
const TAMANHO_ALVO = 64 * 1024

/** Teto de tempo para pintar o bloco depois que o processo chega, em milissegundos. */
const TETO_DA_PINTURA_MS = 100

/** Quantos adendos a sonda lê numa passada; o workspace traz exatamente esse número. */
const ADENDOS = 50

/** Os contextos entre os quais os bugs da referência se repartem. */
const CONTEXTOS = ['painel-do-processo', 'ciclo-forward']

const FEATURE_DIR = '_reversa_forward/001-referencia'

let root: string

function escrever(rel: string, texto: string): void {
  const abs = join(root, rel)
  mkdirSync(join(abs, '..'), { recursive: true })
  writeFileSync(abs, texto)
}

/** Repete as linhas do corpo até o texto passar do tamanho alvo. */
function encher(cabecalho: string, linha: (i: number) => string): string {
  const partes = [cabecalho]
  let bytes = Buffer.byteLength(cabecalho)
  for (let i = 0; bytes < TAMANHO_ALVO; i++) {
    const proxima = linha(i)
    partes.push(proxima)
    bytes += Buffer.byteLength(proxima)
  }
  return partes.join('')
}

function instalarWorkspaceDeReferencia(): void {
  escrever('.reversa/state.json', JSON.stringify({
    version: '1.3.3',
    project: 'referencia',
    output_folder: '_reversa_sdd',
    forward_folder: '_reversa_forward',
    phase: 'geracao',
    completed: ['reconhecimento', 'escavacao', 'interpretacao'],
    pending: ['geracao', 'revisao'],
  }))
  escrever('.reversa/reversa-config.json', JSON.stringify({
    version: 1,
    allowLegacyEdits: true,
    allowedPaths: ['src/**'],
  }))
  escrever('.reversa/active-requirements.json', JSON.stringify({
    'schema-version': 1,
    'feature-dir': FEATURE_DIR,
    'feature-id': '001',
    'short-name': 'referencia',
    'current-stage': 'coding',
    'stages-completed': ['requirements', 'plan', 'to-do'],
    'paused-features': [],
  }))

  escrever(`${FEATURE_DIR}/actions.md`, encher(
    '# Actions: referência\n\n## Fase 1, Preparação\n\n| ID | Descrição | Status |\n|----|-----------|--------|\n',
    (i) => `| T${String(i).padStart(3, '0')} | Ação sintética número ${i} do workspace de referência | \`[${i % 3 === 0 ? ' ' : 'X'}]\` |\n`,
  ))

  escrever(`${FEATURE_DIR}/requirements.md`, encher(
    '# Requirements: referência\n\n',
    (i) => `## RF-${String(i).padStart(2, '0')}\n\nRequisito sintético número ${i}, com corpo longo o bastante para o arquivo chegar ao tamanho alvo.\n\n`,
  ))

  escrever(`${FEATURE_DIR}/progress.jsonl`, encher(
    '',
    (i) => `${JSON.stringify({ ts: '2026-09-09T12:00:00Z', action: `T${String(i).padStart(3, '0')}`, status: 'done', files: [`src/modulo-${i}.ts`] })}\n`,
  ))

  escrever(`${FEATURE_DIR}/legacy-impact.md`, encher(
    '# Legacy impact: referência\n\n| Arquivo afetado | Componente | Tipo | Severidade | Justificativa |\n|---|---|---|---|---|\n',
    (i) => `| src/modulo-${i}.ts | Componente ${i} | regra-alterada | MEDIUM | Justificativa sintética número ${i} |\n`,
  ))

  escrever(`${FEATURE_DIR}/regression-watch.md`, encher(
    '# Regression watch: referência\n\n| ID | Origem (arquivo, seção) | Regra esperada após mudança | Tipo de verificação | Sinal de violação |\n|---|---|---|---|---|\n',
    (i) => `| W${String(i).padStart(3, '0')} | domain.md, seção ${i} | Regra sintética número ${i} continua valendo | presença | A regra sumiu da extração |\n`,
  ))

  for (let i = 0; i < ADENDOS; i++) {
    escrever(`_reversa_sdd/addenda/${String(i).padStart(3, '0')}-adendo.md`, encher(
      `# Adendo ${i}\n\n`,
      (j) => `Parágrafo ${j} do adendo ${i}, com texto suficiente para o arquivo chegar ao tamanho alvo do workspace de referência.\n\n`,
    ))
  }
}

/**
 * O registro de bugs da referência, exatamente no teto da leitura.
 *
 * Cada `bug.md` tem o mesmo tamanho alvo dos demais arquivos do workspace, e
 * não o tamanho de um bug real: o que se quer medir é o pior caso que a leitura
 * aceita sem recusar o arquivo, e não o caso comum. Metade dos bugs vem travada,
 * para que o corte dos encerrados tenha o que cortar na medida da pintura.
 */
function instalarRegistroDeBugs(): void {
  for (let i = 0; i < BUG_CAP; i++) {
    const contexto = CONTEXTOS[i % CONTEXTOS.length]
    const id = `BUG-2026090${i % 10}-R${String(i).padStart(3, '0')}`
    const dia = String((i % 28) + 1).padStart(2, '0')
    const travado = i % 2 === 0
    const pasta = `_reversa_bugs/${contexto}/bugs/${id}-referencia`

    escrever(`${pasta}/bug.md`, encher(
      [
        '---',
        'schema_version: 1',
        `id: ${id}`,
        `display_number: ${i + 1}`,
        `title: Bug sintético número ${i} do workspace de referência`,
        `status: ${travado ? 'resolved' : 'open'}`,
        `phase: ${travado ? 'delivering' : 'triaging'}`,
        'severity: medium',
        'priority: P2',
        `created: 2026-09-${dia}`,
        `updated: 2026-09-${dia}`,
        '',
        'visibility: normal',
        'blocking: []',
        '---',
        '',
      ].join('\n'),
      (j) => `Parágrafo ${j} do bug ${i}, com texto suficiente para o arquivo chegar ao tamanho alvo.\n\n`,
    ))

    if (travado) {
      escrever(`${pasta}/DONE.md`, `# Bug encerrado\n\nData: 2026-09-${dia}\nresolution_kind: fixed\n`)
    }
  }
}

/**
 * O eixo greenfield da referência, no teto (feature 009): os quatro artefatos
 * do `/reversa-new`, o brief e o PRD perto do tamanho alvo, e `SPEC_CAP` specs,
 * que é o máximo que uma passada lista. O PRD carrega uma seção de escopo com
 * cinquenta itens, que é o teto de itens, e a pasta de saída já tem os
 * cinquenta adendos da referência ao lado, de modo que a listagem única da
 * pasta é medida sobre uma pasta cheia.
 */
function instalarEixoGreenfield(): void {
  escrever('_reversa_sdd/newproject-brief.md', encher(
    '# Brief inicial\n\n## Ideia original\nUm painel do pipeline, sintético, para medir a leitura.\n\n## Reconhecimento prévio\n',
    (i) => `Parágrafo ${i} do brief de referência, com texto suficiente para chegar ao tamanho alvo.\n\n`,
  ))
  escrever('_reversa_sdd/ideation.md', encher('# Ideação\n\n', (i) => `Ideia ${i}.\n\n`))
  escrever('_reversa_sdd/personas.md', encher('# Personas\n\n', (i) => `Persona ${i}.\n\n`))
  const itens = Array.from({ length: 50 }, (_, i) => `- 🟡 Item ${i}: detalhe do item ${i} da referência.`).join('\n')
  escrever('_reversa_sdd/prd.md', encher(
    `# PRD\n\n## 4. Escopo (in)\n\n**Um grupo:**\n\n${itens}\n\n## 5. Não-objetivos (out)\n\n`,
    (i) => `Parágrafo ${i} do PRD de referência, fora do escopo e sem efeito sobre a leitura.\n\n`,
  ))
  for (let i = 0; i < SPEC_CAP; i++) {
    escrever(`_reversa_sdd/sdd/componente-${String(i).padStart(3, '0')}.md`, `# Spec ${i}\n`)
  }
}

/** A leitura inteira do eixo, do disco ao julgamento, como o host a faz. */
function lerEixo() {
  const { snapshot } = readReversaSnapshot(root)
  const processo = readReversa(snapshot)
  const pastas = readFeatureFolders({ root, forwardFolder: processo.discovery.forwardFolder })
  const history = readHistory({
    pastas: pastas.pastas,
    truncado: pastas.truncado,
    total: pastas.total,
    activeFeatureDir: processo.forward.featureDir,
    pausedFeatureDirs: [],
    addendaFiles: snapshot.addendaFiles,
    addendaBodies: snapshot.addendaBodies,
    outputFolder: processo.discovery.outputFolder,
  })
  return readGreenfield({
    lido: readGreenfieldArtifacts({ root, outputFolder: processo.discovery.outputFolder }),
    stateJson: snapshot.stateJson,
    history,
    outputFolder: processo.discovery.outputFolder,
  })
}

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'reversa-desempenho-'))
  instalarWorkspaceDeReferencia()
  instalarRegistroDeBugs()
  instalarEixoGreenfield()
})

afterEach(() => {
  rmSync(root, { recursive: true, force: true })
})

describe('desempenho no workspace de referência', () => {
  it(`lê o disco e julga o retrato em menos de ${TETO_MS} ms`, () => {
    // Aquecimento descartado: tira o custo de primeira leitura do cache de disco da conta.
    readReversa(readReversaSnapshot(root).snapshot)

    const inicio = performance.now()
    const { snapshot } = readReversaSnapshot(root)
    const processo = readReversa(snapshot)
    const decorrido = performance.now() - inicio

    // Sanidade: medir uma leitura que não leu nada não prova coisa alguma.
    expect(processo.installed).toBe(true)
    expect(snapshot.addendaFiles).toHaveLength(ADENDOS)

    expect(
      decorrido,
      `leitura mais julgamento levou ${decorrido.toFixed(1)} ms, acima do teto de ${TETO_MS} ms`,
    ).toBeLessThan(TETO_MS)
  })
})

describe('o registro de bugs no workspace de referência', () => {
  it(`lê e julga o registro no teto em menos de ${TETO_MS} ms`, () => {
    readBugs(readBugFolders({ root }))

    const inicio = performance.now()
    const registro = readBugs(readBugFolders({ root }))
    const decorrido = performance.now() - inicio

    // Sanidade: medir uma leitura que não achou bug algum não prova nada.
    expect(registro.presente).toBe(true)
    expect(registro.contagem.total).toBe(BUG_CAP)
    expect(registro.truncado).toBe(false)
    expect(registro.anomalias).toEqual([])

    expect(
      decorrido,
      `leitura mais julgamento do registro levou ${decorrido.toFixed(1)} ms, acima do teto de ${TETO_MS} ms`,
    ).toBeLessThan(TETO_MS)
  })

  it(`pinta o bloco depois da chegada do processo em menos de ${TETO_DA_PINTURA_MS} ms`, () => {
    const registro = readBugs(readBugFolders({ root }))
    const bloco = () =>
      renderToStaticMarkup(
        createElement(BugsSection, {
          bugs: registro,
          collapsed: false,
          onToggle: () => {},
          onOpenFile: () => {},
          revealed: new Set<string>(),
          onReveal: () => {},
        }),
      )

    // Aquecimento descartado: a primeira pintura paga a compilação do módulo.
    bloco()

    const inicio = performance.now()
    const html = bloco()
    const decorrido = performance.now() - inicio

    // Sanidade: uma pintura que desenhou o vazio seria rápida por não ter feito
    // nada. O bloco tem de trazer os dois contextos e o bug a tratar em seguida.
    for (const contexto of CONTEXTOS) expect(html).toContain(contexto)
    expect(html).toContain('próximo a tratar')

    expect(
      decorrido,
      `a pintura do bloco levou ${decorrido.toFixed(1)} ms, acima do teto de ${TETO_DA_PINTURA_MS} ms`,
    ).toBeLessThan(TETO_DA_PINTURA_MS)
  })
})

/**
 * O eixo greenfield na referência (feature 009, RNF-01). Duas medidas, como
 * para o registro: a LEITURA, que é disco e cabe no teto de 200 ms junto com
 * a leitura do processo que ela precisa; e a PINTURA dos dois cartões, que é
 * tela e tem o teto de 100 ms.
 */
describe('o eixo greenfield no workspace de referência', () => {
  it(`lê a pasta de saída e julga o eixo no teto em menos de ${TETO_MS} ms`, () => {
    lerEixo()

    const inicio = performance.now()
    const eixo = lerEixo()
    const decorrido = performance.now() - inicio

    // Sanidade: medir um eixo vazio não prova nada.
    expect(eixo.cenario).toBe('greenfield')
    expect(eixo.estagio).toBe('especificado')
    expect(eixo.panorama.componentes).toHaveLength(SPEC_CAP)
    expect(eixo.panorama.escopo).toHaveLength(50)
    expect(eixo.anomalias).toEqual([])

    expect(
      decorrido,
      `leitura mais julgamento do eixo levou ${decorrido.toFixed(1)} ms, acima do teto de ${TETO_MS} ms`,
    ).toBeLessThan(TETO_MS)
  })

  it(`pinta os dois cartões depois da chegada do processo em menos de ${TETO_DA_PINTURA_MS} ms`, () => {
    const eixo = lerEixo()
    const cartoes = () =>
      renderToStaticMarkup(createElement(PanoramaSection, {
        greenfield: eixo,
        collapsed: false,
        onToggle: () => {},
        onOpenFile: () => {},
        scopeRevealed: true,
        onRevealScope: () => {},
      })) +
      renderToStaticMarkup(createElement(OriginSection, {
        greenfield: eixo,
        collapsed: false,
        onToggle: () => {},
        onOpenFile: () => {},
      }))

    cartoes()

    const inicio = performance.now()
    const html = cartoes()
    const decorrido = performance.now() - inicio

    // Sanidade: os cinquenta componentes, os cinquenta itens e as quatro etapas.
    expect(html.match(/data-component="/g)).toHaveLength(SPEC_CAP)
    expect(html.match(/data-scope-item="/g)).toHaveLength(50)
    expect(html.match(/data-step="/g)).toHaveLength(4)

    expect(
      decorrido,
      `a pintura dos dois cartões levou ${decorrido.toFixed(1)} ms, acima do teto de ${TETO_DA_PINTURA_MS} ms`,
    ).toBeLessThan(TETO_DA_PINTURA_MS)
  })
})
