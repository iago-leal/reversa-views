#!/usr/bin/env node
/**
 * Uma cópia estragada de um workspace, para alcançar os estados do eixo
 * greenfield que este projeto, saudável, nunca produz (RF-15, RN-02, RN-08,
 * D-11 da feature 009).
 *
 * O painel tem seis estados do eixo que a suíte confere e o olho nunca vê num
 * projeto em ordem: projeto sem âncora alguma, pipeline parada no meio,
 * metadado que diverge do disco, PRD sem decomposição, PRD sem seção de
 * escopo e leitura de specs parada no teto. Alcançá-los exigiria adoecer os
 * artefatos de verdade do `/reversa-new`, que são a âncora deste projeto. Este
 * auxiliar faz o que `estragar-registro.js` já faz para os bugs: copia o
 * workspace para pasta temporária do sistema, adoece a cópia e imprime o
 * caminho dela.
 *
 * Quem escreve é ele, e não o preview: o preview não escreve nada, em lugar
 * nenhum. E o que ele escreve fica fora do repositório e fora do workspace de
 * origem, que não é tocado. A única escrita fora da pasta de saída é no
 * `state.json` da CÓPIA, porque três dos casos são sobre o metadado que o
 * pipeline deixa lá.
 *
 * Uso:
 *     node ./scripts/estragar-greenfield.js --caso=parcial
 *     node ./scripts/preview.js --workspace=$(node ./scripts/estragar-greenfield.js --caso=teto)
 * @module scripts/estragar-greenfield
 */

const {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} = require('node:fs')
const { tmpdir } = require('node:os')
const path = require('node:path')

/** O que nunca vale a pena copiar: peso sem efeito sobre a leitura. */
const DISPENSADOS = new Set(['node_modules', '.git', 'out', 'coverage'])

/** A pasta de saída, escrita aqui pelo mesmo motivo que os casos abaixo. */
const SAIDA = '_reversa_sdd'

/** O ponteiro em que o pipeline deixa o metadado, e o campo dele. */
const ESTADO = '.reversa/state.json'
const CAMPO = 'newproject_progress'

/** Os artefatos do pipeline, na ordem em que nascem. */
const ARTEFATOS = ['newproject-brief.md', 'ideation.md', 'personas.md', 'prd.md']

/**
 * Quantas specs o caso do teto planta.
 *
 * O teto da leitura é `SPEC_CAP`, em `src/domain/limits.ts`, e o que este
 * número precisa é apenas ser maior que ele. Está escrito aqui em vez de
 * importado porque o auxiliar roda antes de qualquer construção existir, e a
 * suíte confere que os dois números continuam na ordem certa.
 */
const ACIMA_DO_TETO = 60

/** Os seis estados que este auxiliar sabe produzir. */
const CASOS = ['sem-ancora', 'parcial', 'divergente', 'sdd-vazio', 'sem-escopo', 'teto']

/**
 * Reescreve o metadado do pipeline no `state.json` da cópia.
 * @param {string} destino - a raiz da cópia.
 * @param {(progresso: object|null) => object|undefined} mudar - recebe o campo
 *   atual (ou nulo) e devolve o novo; `undefined` remove o campo.
 */
function metadado(destino, mudar) {
  const arquivo = path.join(destino, ESTADO)
  const estado = existsSync(arquivo) ? JSON.parse(readFileSync(arquivo, 'utf8')) : {}
  const atual = typeof estado[CAMPO] === 'object' && estado[CAMPO] !== null ? estado[CAMPO] : null
  const novo = mudar(atual)
  if (novo === undefined) delete estado[CAMPO]
  else estado[CAMPO] = novo
  mkdirSync(path.dirname(arquivo), { recursive: true })
  writeFileSync(arquivo, `${JSON.stringify(estado, null, 2)}\n`)
}

/** O metadado de um pipeline parado num agente, com o que o painel lê dele. */
function parado(atual, estagio, concluidos) {
  return {
    ...(atual ?? {}),
    mode: 'guiado',
    stage: estagio,
    started_at: '2026-01-01T10:00:00Z',
    last_checkpoint_at: '2026-01-01T10:30:00Z',
    completed_stages: concluidos,
    brief: (atual && atual.brief) || 'projeto plantado pelo auxiliar do preview.',
  }
}

/** Apaga um caminho da cópia, exista ou não. */
function apagar(destino, rel) {
  rmSync(path.join(destino, rel), { recursive: true, force: true })
}

/**
 * Adoece a cópia conforme o caso pedido.
 * @param {string} caso - um dos seis nomes.
 * @param {string} destino - a raiz da cópia.
 * @returns {string} o que foi feito, para o relato no terminal.
 */
function adoecer(caso, destino) {
  const sdd = path.join(destino, SAIDA, 'sdd')

  if (caso === 'sem-ancora') {
    for (const artefato of [...ARTEFATOS, 'architecture.md', 'domain.md', 'sdd']) apagar(destino, `${SAIDA}/${artefato}`)
    metadado(destino, () => undefined)
    return 'os artefatos do /reversa-new, as âncoras da extração e o metadado removidos: o painel deve declarar que o projeto não nasceu por /reversa-new, sem razão na faixa'
  }

  if (caso === 'parcial') {
    apagar(destino, `${SAIDA}/prd.md`)
    apagar(destino, `${SAIDA}/sdd`)
    metadado(destino, (atual) => parado(atual, 'drafter', ['ideator', 'researcher']))
    return 'PRD e specs removidos, metadado no redator: a faixa deve pedir /reversa-drafter e a origem deve marcar a redação como corrente'
  }

  if (caso === 'divergente') {
    metadado(destino, (atual) => parado(atual, 'ideator', ['ideator']))
    return 'metadado devolvido ao ideador com o disco inteiro: o painel deve declarar a divergência e o disco manda (RN-02)'
  }

  if (caso === 'sdd-vazio') {
    apagar(destino, `${SAIDA}/sdd`)
    mkdirSync(sdd, { recursive: true })
    metadado(destino, (atual) => parado(atual, 'spec-sdd', ['ideator', 'researcher', 'drafter']))
    return 'pasta de specs esvaziada: o panorama deve dizer que a decomposição não foi feita, e a faixa deve pedir /reversa-spec-sdd'
  }

  if (caso === 'sem-escopo') {
    writeFileSync(
      path.join(destino, SAIDA, 'prd.md'),
      ['# PRD plantado pelo auxiliar do preview', '', '## Visão', '', 'Um PRD sem seção de escopo reconhecível.', ''].join('\n'),
    )
    return 'PRD reescrito sem seção de escopo: o panorama deve declarar a seção não encontrada, e a anomalia deve nomear o prd.md'
  }

  // O teto.
  mkdirSync(sdd, { recursive: true })
  const existentes = existsSync(sdd) ? readdirSync(sdd).length : 0
  for (let indice = 0; indice < ACIMA_DO_TETO; indice += 1) {
    writeFileSync(
      path.join(sdd, `zz-teto-${String(indice).padStart(3, '0')}.md`),
      `# Spec ${indice + 1} de ${ACIMA_DO_TETO}, plantada para passar do teto\n`,
    )
  }
  return `${ACIMA_DO_TETO} specs plantadas ao lado de ${existentes} existentes: a leitura deve parar no teto e a tela deve dizer quantas existem e quantas leu`
}

/**
 * Copia e adoece.
 * @param {string[]} argumentos - aceita `--workspace=<caminho>` e `--caso=<nome>`.
 * @param {string} raiz - o repositório de onde o comando roda.
 * @returns {number} o código de saída; o caminho da cópia sai na saída padrão.
 */
function principal(argumentos, raiz) {
  const pedido = argumentos.find((argumento) => argumento.startsWith('--workspace='))
  const origem = pedido === undefined ? raiz : pedido.slice('--workspace='.length)

  const pedidoDoCaso = argumentos.find((argumento) => argumento.startsWith('--caso='))
  const caso = pedidoDoCaso === undefined ? '' : pedidoDoCaso.slice('--caso='.length)
  if (!CASOS.includes(caso)) {
    process.stderr.write(
      `caso inválido: "${caso}".\nOs que existem: ${CASOS.join(', ')}.\n` +
        'Use --caso=<nome>, e --workspace=<caminho> para adoecer outro workspace.\n',
    )
    return 1
  }

  if (!existsSync(origem) || !statSync(origem).isDirectory()) {
    process.stderr.write(`o workspace ${origem} não existe como diretório.\n`)
    return 1
  }

  const destino = mkdtempSync(path.join(tmpdir(), 'reversa-views-greenfield-'))
  cpSync(origem, destino, {
    recursive: true,
    filter: (caminho) => !DISPENSADOS.has(path.basename(caminho)),
  })

  const feito = adoecer(caso, destino)
  process.stderr.write(`cópia em ${destino}: ${feito}.\n`)
  process.stdout.write(`${destino}\n`)
  return 0
}

if (require.main === module) {
  process.exit(principal(process.argv.slice(2), path.resolve(__dirname, '..')))
}

module.exports = { ACIMA_DO_TETO, CASOS, principal }
