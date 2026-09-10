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
import { BUG_CAP } from '../src/domain/limits.ts'
import { readReversa } from '../src/heranca/reversa-domain/src/index.ts'
import { readReversaSnapshot } from '../src/heranca/reversa-probe/src/index.ts'
import { readBugFolders } from '../src/probe/bugs.ts'
import { BugsSection } from '../src/webview/ui/BugsSection.tsx'

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

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'reversa-desempenho-'))
  instalarWorkspaceDeReferencia()
  instalarRegistroDeBugs()
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
