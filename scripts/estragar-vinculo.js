#!/usr/bin/env node
/**
 * Uma cópia estragada de um workspace, para alcançar os estados do vínculo
 * entre spec e entrega e das conferências que este projeto, saudável, nunca
 * produz (RF-14, D-18 da feature 010).
 *
 * Aqui toda spec tem pasta homônima, nenhuma entrega declara componente sem
 * spec e nenhum onboarding de 001 a 009 tem registro de conferências. O da
 * 010 tem, e é ela a pasta que os casos adoecem desde que convergiu: os dois
 * casos de conferências TROCAM a seção existente pela plantada, porque o
 * leitor fica com a primeira que encontra. Os cinco casos abaixo alcançam o
 * resto sem adoecer o projeto de verdade: copiam o workspace para pasta
 * temporária do sistema, adoecem a cópia e imprimem o caminho dela, no molde
 * de `estragar-greenfield.js` e `estragar-registro.js`.
 *
 * Quem escreve é ele, e não o preview: o preview não escreve nada, em lugar
 * nenhum. E o que ele escreve fica fora do repositório e fora do workspace de
 * origem, que não é tocado.
 *
 * Uso:
 *     node ./scripts/estragar-vinculo.js --caso=declarada
 *     node ./scripts/preview.js --workspace=$(node ./scripts/estragar-vinculo.js --caso=conferencias)
 * @module scripts/estragar-vinculo
 */

const {
  cpSync,
  existsSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  renameSync,
  statSync,
  writeFileSync,
} = require('node:fs')
const { tmpdir } = require('node:os')
const path = require('node:path')

/** O que nunca vale a pena copiar: peso sem efeito sobre a leitura. */
const DISPENSADOS = new Set(['node_modules', '.git', 'out', 'coverage'])

/**
 * As pastas e os artefatos, escritos aqui pelo mesmo motivo do auxiliar do
 * eixo greenfield: o auxiliar roda antes de qualquer construção existir, e os
 * nomes vivem em `src/domain/limits.ts` do lado da extensão.
 */
const SAIDA = '_reversa_sdd'
const FORWARD = '_reversa_forward'
const IMPACTO = 'legacy-impact.md'
const ONBOARDING = 'onboarding.md'

/** O prefixo que renomeia as specs no caso `declarada`, para nenhuma ter pasta homônima. */
const PREFIXO = 'componente-'

/** O componente sem spec que o caso `sem-spec` planta. */
const SEM_SPEC = 'vigia-de-regressao'

/**
 * Quantos bytes o caso `impacto-grande` escreve: acima dos 256 KiB de
 * `REVERSA_FILE_CAP`, o teto da sonda herdada. A suíte confere a ordem.
 */
const ACIMA_DO_TETO = 300 * 1024

/** Os cinco estados que este auxiliar sabe produzir. */
const CASOS = ['declarada', 'sem-spec', 'conferencias', 'conferencias-sem-tabela', 'impacto-grande']

/** As pastas de feature da cópia, em ordem de nome. */
function pastas(destino) {
  const base = path.join(destino, FORWARD)
  if (!existsSync(base)) return []
  return readdirSync(base)
    .filter((nome) => statSync(path.join(base, nome)).isDirectory())
    .sort()
}

/**
 * A pasta que o caso adoece: a mais recente com adendo em vigor, que é a
 * convergida mais nova, ou a mais recente de todas quando nenhuma tem.
 */
function alvo(destino) {
  const nomes = pastas(destino)
  const adendos = existsSync(path.join(destino, SAIDA, 'addenda'))
    ? readdirSync(path.join(destino, SAIDA, 'addenda'))
    : []
  const convergidas = nomes.filter((nome) => {
    const id = /^(\d+)-/.exec(nome)?.[1]
    return id !== undefined && adendos.some((arquivo) => arquivo.startsWith(`${id}-`))
  })
  const escolhida = convergidas.at(-1) ?? nomes.at(-1)
  if (escolhida === undefined) throw new Error(`nenhuma pasta de feature em ${FORWARD}`)
  return escolhida
}

/** Acrescenta texto ao fim de um arquivo da cópia, criando-o se faltar. */
function acrescentar(arquivo, texto) {
  const antes = existsSync(arquivo) ? readFileSync(arquivo, 'utf8') : ''
  writeFileSync(arquivo, `${antes}${antes.endsWith('\n') || antes === '' ? '' : '\n'}${texto}`)
}

/** O título de uma seção de registro de conferências, em qualquer nível e numeração. */
const TITULO_DO_REGISTRO = /^(#{1,6})\s+(?:[\d.]+\s*)?registro de confer[eê]ncias\b/i

/**
 * Troca a seção de registro de conferências da cópia pela plantada, ou a
 * acrescenta quando não há nenhuma.
 *
 * Acrescentar só não basta: o leitor fica com a PRIMEIRA seção de registro, e
 * uma pasta que já tem a sua esconderia a plantada. A seção existente vai do
 * título até o próximo título de nível igual ou maior.
 */
function trocarRegistro(arquivo, texto) {
  const linhas = (existsSync(arquivo) ? readFileSync(arquivo, 'utf8') : '').split('\n')
  const inicio = linhas.findIndex((linha) => TITULO_DO_REGISTRO.test(linha))
  if (inicio === -1) {
    acrescentar(arquivo, texto)
    return
  }
  const nivel = (TITULO_DO_REGISTRO.exec(linhas[inicio]) ?? ['', '#'])[1].length
  const proximo = linhas.findIndex((linha, i) => {
    if (i <= inicio) return false
    const titulo = /^(#{1,6})\s/.exec(linha)
    return titulo !== null && titulo[1].length <= nivel
  })
  const restante = proximo === -1 ? [] : linhas.slice(proximo)
  writeFileSync(arquivo, [...linhas.slice(0, inicio), ...texto.replace(/^\n+/, '').split('\n'), ...restante].join('\n'))
}

/** Uma tabela de impacto com o esquema do `/reversa-coding`. */
function tabelaDeImpacto(componente) {
  return [
    '',
    '## Impacto plantado pelo auxiliar do preview',
    '',
    '| Arquivo afetado | Componente | Tipo | Severidade | Justificativa |',
    '|---|---|---|---|---|',
    `| \`src/plantado.ts\` | ${componente} | componente-novo | LOW | plantado por estragar-vinculo.js |`,
    '',
  ].join('\n')
}

/** Um registro de conferências de vinte linhas, duas registradas, uma delas "não executável". */
function registroDeVinte() {
  const linhas = ['| 2026-09-19 | M1 | seção 1 | confere | plantada |']
  for (let i = 2; i <= 19; i += 1) linhas.push(`| | M${Math.ceil(i / 4)} | passo ${i} | | |`)
  linhas.push('| 2026-09-19 | Segredos | conferência abaixo | não executável | ambiente ausente |')
  return [
    '',
    '## 90. Registro de conferências',
    '',
    '| Data | Marco | Item | Resultado | Observação |',
    '|------|-------|------|-----------|------------|',
    ...linhas,
    '',
  ].join('\n')
}

/**
 * Adoece a cópia conforme o caso pedido.
 * @param {string} caso - um dos cinco nomes.
 * @param {string} destino - a raiz da cópia.
 * @returns {string} o que foi feito, para o relato no terminal.
 */
function adoecer(caso, destino) {
  if (caso === 'declarada') {
    const sdd = path.join(destino, SAIDA, 'sdd')
    const specs = existsSync(sdd) ? readdirSync(sdd).filter((nome) => nome.endsWith('.md')) : []
    const nomes = specs.map((arquivo) => arquivo.replace(/\.md$/, ''))
    for (const nome of nomes) renameSync(path.join(sdd, `${nome}.md`), path.join(sdd, `${PREFIXO}${nome}.md`))
    // Cada `legacy-impact.md` passa a declarar o nome novo onde declarava o
    // antigo, pela mesma delimitação que o painel aplica (D-03).
    for (const pasta of pastas(destino)) {
      const arquivo = path.join(destino, FORWARD, pasta, IMPACTO)
      if (!existsSync(arquivo)) continue
      let texto = readFileSync(arquivo, 'utf8')
      for (const nome of nomes) {
        texto = texto.replace(new RegExp(`(^|[^a-z0-9-])(${nome})(?=\\.md|[^a-z0-9-]|$)`, 'gm'), `$1${PREFIXO}$2`)
      }
      writeFileSync(arquivo, texto)
    }
    return `${nomes.length} specs renomeadas com o prefixo "${PREFIXO}" e declaradas pelo nome novo nos legacy-impact.md: nenhuma tem pasta homônima, e cada uma deve aparecer ligada com a origem "declarada"`
  }

  const pasta = alvo(destino)
  const dentro = (arquivo) => path.join(destino, FORWARD, pasta, arquivo)

  if (caso === 'sem-spec') {
    acrescentar(dentro(IMPACTO), tabelaDeImpacto(SEM_SPEC))
    return `a ${pasta} declara "${SEM_SPEC}", que nenhuma spec nomeia: deve aparecer em "Entregues sem spec" com a ${pasta}`
  }

  if (caso === 'conferencias') {
    trocarRegistro(dentro(ONBOARDING), registroDeVinte())
    return `a ${pasta} ganha um registro de vinte conferências, duas registradas: deve mostrar "2 de 20 conferências registradas", continuar convergida e não trazer razão nova na faixa`
  }

  if (caso === 'conferencias-sem-tabela') {
    trocarRegistro(
      dentro(ONBOARDING),
      ['', '## 90. Registro de conferências', '', '| Marco | Item | Resultado |', '|---|---|---|', '| M1 | seção 1 | confere |', ''].join('\n'),
    )
    return `a ${pasta} ganha a seção de registro com uma tabela sem coluna Data: deve surgir a anomalia tabela-nao-reconhecida com a seção e o cabeçalho no detalhe`
  }

  // O impacto grande.
  const linha = '| `src/x.ts` | ruido | componente-novo | LOW | linha plantada para passar do teto |\n'
  const cabecalho = '# Legacy impact plantado acima do teto\n\n| Arquivo afetado | Componente | Tipo | Severidade | Justificativa |\n|---|---|---|---|---|\n'
  writeFileSync(dentro(IMPACTO), cabecalho + linha.repeat(Math.ceil(ACIMA_DO_TETO / linha.length)))
  return `o legacy-impact.md da ${pasta} passa de ${ACIMA_DO_TETO} bytes: o vínculo da pasta deve ser declarado parcial, com a anomalia artefato-da-entrega-nao-lido`
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

  const destino = mkdtempSync(path.join(tmpdir(), 'reversa-views-vinculo-'))
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

module.exports = { ACIMA_DO_TETO, CASOS, PREFIXO, SEM_SPEC, principal }
