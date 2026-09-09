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
 */

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { readReversa } from '../src/heranca/reversa-domain/src/index.ts'
import { readReversaSnapshot } from '../src/heranca/reversa-probe/src/index.ts'

/** Teto de tempo para ler o disco e julgar o retrato, em milissegundos. */
const TETO_MS = 200

/** Tamanho alvo de cada arquivo do workspace de referência, em bytes. */
const TAMANHO_ALVO = 64 * 1024

/** Quantos adendos a sonda lê numa passada; o workspace traz exatamente esse número. */
const ADENDOS = 50

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

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'reversa-desempenho-'))
  instalarWorkspaceDeReferencia()
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
