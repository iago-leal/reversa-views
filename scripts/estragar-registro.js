#!/usr/bin/env node
/**
 * Uma cópia estragada de um workspace, para alcançar os estados do registro de
 * bugs que nenhum projeto saudável produz (RF-13, RF-15, RN-02, RN-04, D-11).
 *
 * O bloco de bugs tem quatro estados que a suíte confere e o olho nunca vê num
 * projeto em ordem: registro ausente, bug restrito, registro inconsistente e
 * leitura parada no teto. Alcançá-los exigiria ou adoecer o registro de
 * verdade, que é fonte de trabalho em curso, ou versionar um registro doente
 * aqui dentro. Este auxiliar faz o terceiro caminho, o mesmo que
 * `estragar-workspace.js` abriu: copia o workspace para pasta temporária do
 * sistema, adoece a cópia e imprime o caminho dela.
 *
 * Quem escreve é ele, e não o preview: o preview não escreve nada, em lugar
 * nenhum (RN-02 da feature 005). E o que ele escreve fica fora do repositório e
 * fora do workspace de origem, que não é tocado.
 *
 * Os bugs plantados moram num contexto próprio, `preview-estragado`, e o
 * registro de verdade da cópia fica como está. Assim o painel mostra o estado
 * doente AO LADO do saudável, que é o que se quer conferir: um bloco em que só
 * houvesse doença não diria se o desenho ainda distingue as duas coisas.
 *
 * Uso:
 *     node ./scripts/estragar-registro.js --caso=restrito
 *     node ./scripts/preview.js --workspace=$(node ./scripts/estragar-registro.js --caso=teto)
 * @module scripts/estragar-registro
 */

const { cpSync, existsSync, mkdirSync, mkdtempSync, rmSync, statSync, writeFileSync } = require('node:fs')
const { tmpdir } = require('node:os')
const path = require('node:path')

/** O que nunca vale a pena copiar: peso sem efeito sobre a leitura. */
const DISPENSADOS = new Set(['node_modules', '.git', 'out', 'coverage'])

/** A pasta do registro, escrita aqui pelo mesmo motivo que os casos abaixo. */
const REGISTRO = '_reversa_bugs'

/** O contexto que este auxiliar planta, e o único que ele escreve. */
const CONTEXTO = 'preview-estragado'

/**
 * Quantos bugs o caso do teto planta.
 *
 * O teto da leitura é `BUG_CAP`, em `src/domain/limits.ts`, e o que este número
 * precisa é apenas ser maior que ele: a diferença entre o que existe e o que
 * foi lido é justamente o que a tela declara. Está escrito aqui em vez de
 * importado porque o auxiliar roda antes de qualquer construção existir, e a
 * suíte confere que os dois números continuam na ordem certa.
 */
const ACIMA_DO_TETO = 60

/** Os quatro estados que este auxiliar sabe produzir. */
const CASOS = ['ausente', 'restrito', 'inconsistente', 'teto']

/**
 * O `bug.md` de um bug plantado, no formato que o registrador escreve.
 * @param {{id: string, numero: number, titulo: string, estado: string,
 *   fase: string, severidade: string, prioridade: string, visibilidade?: string,
 *   data: string}} bug - o que distingue este bug dos demais.
 * @returns {string} o arquivo inteiro.
 */
function bugMd(bug) {
  return [
    '---',
    'schema_version: 1',
    `id: ${bug.id}`,
    `display_number: ${bug.numero}`,
    `title: ${bug.titulo}`,
    `status: ${bug.estado}`,
    `phase: ${bug.fase}`,
    `severity: ${bug.severidade}`,
    `priority: ${bug.prioridade}`,
    `created: ${bug.data}`,
    `updated: ${bug.data}`,
    '',
    'area: preview',
    'module: registro-estragado',
    '',
    `visibility: ${bug.visibilidade ?? 'normal'}`,
    'security_suspected: false',
    '',
    'blocking: []',
    '---',
    '',
    `# ${bug.titulo}`,
    '',
    'Bug plantado pelo auxiliar do preview, numa cópia temporária do workspace.',
    'Ele não existe no projeto e não deve ser tratado por ninguém.',
    '',
  ].join('\n')
}

/** A trava que encerra um bug, com a data que o painel lê dela. */
function travaMd(data) {
  return ['# Bug encerrado', '', `Data: ${data}`, 'resolution_kind: fixed', ''].join('\n')
}

/**
 * Planta um bug no contexto do auxiliar.
 * @param {string} destino - a raiz da cópia.
 * @param {object} bug - o que `bugMd` precisa, mais a trava quando houver.
 * @param {string|null} trava - a data da trava, ou nulo para não travar.
 */
function plantar(destino, bug, trava) {
  const pasta = path.join(destino, REGISTRO, CONTEXTO, 'bugs', `${bug.id}-${bug.pasta}`)
  mkdirSync(pasta, { recursive: true })
  writeFileSync(path.join(pasta, 'bug.md'), bugMd(bug))
  if (trava !== null) writeFileSync(path.join(pasta, 'DONE.md'), travaMd(trava))
}

/**
 * Adoece a cópia conforme o caso pedido.
 * @param {string} caso - um dos quatro nomes.
 * @param {string} destino - a raiz da cópia.
 * @returns {string} o que foi feito, para o relato no terminal.
 */
function adoecer(caso, destino) {
  if (caso === 'ausente') {
    rmSync(path.join(destino, REGISTRO), { recursive: true, force: true })
    return `${REGISTRO} removido da cópia: o painel deve declarar a ausência do registro, e não uma perda`
  }

  if (caso === 'restrito') {
    plantar(
      destino,
      {
        id: 'BUG-20260101-AAAA',
        pasta: 'aberto-visivel',
        numero: 1,
        titulo: 'Bug visível, para que o grupo tenha o que mostrar',
        estado: 'open',
        fase: 'triaging',
        severidade: 'medium',
        prioridade: 'P2',
        data: '2026-01-01',
      },
      null,
    )
    plantar(
      destino,
      {
        id: 'BUG-20260102-BBBB',
        pasta: 'restrito',
        numero: 2,
        titulo: 'Bug restrito, cujo título não pode chegar à tela',
        estado: 'active',
        fase: 'diagnosing',
        severidade: 'high',
        prioridade: 'P1',
        visibilidade: 'restricted',
        data: '2026-01-02',
      },
      null,
    )
    return 'um bug restrito plantado: só a contagem dos omitidos deve atravessar o canal (D-11)'
  }

  if (caso === 'inconsistente') {
    plantar(
      destino,
      {
        id: 'BUG-20260103-CCCC',
        pasta: 'resolvido-sem-trava',
        numero: 1,
        titulo: 'Bug resolvido que ninguém travou',
        estado: 'resolved',
        fase: 'delivering',
        severidade: 'low',
        prioridade: 'P3',
        data: '2026-01-03',
      },
      null,
    )
    plantar(
      destino,
      {
        id: 'BUG-20260104-DDDD',
        pasta: 'trava-sem-resolvido',
        numero: 2,
        titulo: 'Bug travado que ninguém resolveu',
        estado: 'active',
        fase: 'patching',
        severidade: 'critical',
        prioridade: 'P0',
        data: '2026-01-04',
      },
      '2026-01-05',
    )
    return 'as duas assimetrias da trava plantadas: o painel deve declarar cada uma sem escolher entre as leituras (RN-04)'
  }

  // O teto. Metade travada, para que o corte dos encerrados também apareça.
  for (let indice = 0; indice < ACIMA_DO_TETO; indice += 1) {
    const dia = String((indice % 28) + 1).padStart(2, '0')
    const travado = indice % 2 === 0
    plantar(
      destino,
      {
        id: `BUG-2026020${indice % 10}-T${String(indice).padStart(3, '0')}`,
        pasta: `teto-${String(indice).padStart(3, '0')}`,
        numero: indice + 1,
        titulo: `Bug ${indice + 1} de ${ACIMA_DO_TETO}, plantado para passar do teto`,
        estado: travado ? 'resolved' : 'open',
        fase: travado ? 'delivering' : 'triaging',
        severidade: 'low',
        prioridade: 'P3',
        data: `2026-02-${dia}`,
      },
      travado ? `2026-02-${dia}` : null,
    )
  }
  return `${ACIMA_DO_TETO} bugs plantados: a leitura deve parar no teto e a tela deve dizer quantos existem e quantos leu (RF-15)`
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

  const destino = mkdtempSync(path.join(tmpdir(), 'reversa-views-registro-'))
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

module.exports = { ACIMA_DO_TETO, CASOS, CONTEXTO, principal }
