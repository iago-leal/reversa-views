#!/usr/bin/env node
/**
 * O empacotamento em VSIX (RF-01, RF-03, RF-05, RN-09, D-14; feature 007: RF-20, RF-21, D-08).
 *
 * Casca fina sobre o empacotador oficial, que é a ferramenta de quem define o
 * formato. Escrever o formato à mão economizaria a dependência de
 * desenvolvimento ao custo de manter um empacotador próprio, e um empacotador
 * próprio envelhece junto com o formato sem avisar.
 *
 * Ele empacota e nada mais: não publica, não fala com o Marketplace e não pede
 * conta em lugar nenhum. O conteúdo do pacote é decidido por `.vscodeignore`,
 * e o que este comando faz ao final é mostrar o que entrou e quanto pesou, ao
 * lado do teto, para que a primeira conferência seja a de quem está olhando.
 * A segunda é `tests/vsix-conteudo.spec.ts`, que abre o pacote de fato.
 *
 * A VERSÃO é derivada, e nunca lida do manifesto versionado (RF-20, RN-06). O
 * empacotador oficial só conhece a versão que está escrita em `package.json`,
 * então ela é escrita ali em torno da chamada, e restaurada em bloco de saída
 * garantida, aconteça o que acontecer no meio (D-08): manter o número escrito
 * deixaria a árvore suja em regime, e árvore suja é o que o atualizador recusa.
 * Quando a derivação recua, o empacotamento imprime a causa e segue com o valor
 * de recuo, em vez de inventar número (RF-21).
 *
 * Uso:
 *     npm run build && npm run empacotar
 * @module scripts/empacotar
 */

const { execFileSync } = require('node:child_process')
const { existsSync, readFileSync, rmSync, statSync, writeFileSync } = require('node:fs')
const path = require('node:path')

const { TETO_DO_PACOTE_DA_EXTENSAO, formatarTamanho } = require('./limites')
const { derivarVersao } = require('./versao')
const { lerPacote } = require('./vsix')

/** O que se diz a quem ainda não instalou a ferramenta. */
const COMO_INSTALAR =
  'o empacotador não está instalado.\n' +
  'Rode `npm install` para trazer @vscode/vsce, que é dependência de desenvolvimento.'

/** O acesso ao mundo, trocável na suíte: a suíte não roda o empacotador de verdade. */
const FERRAMENTAS = {
  /** O texto do manifesto, tal como está no disco. */
  lerManifesto: (raiz) => readFileSync(path.join(raiz, 'package.json'), 'utf8'),
  /** O manifesto de volta ao disco, byte a byte o que se passar. */
  escreverManifesto: (raiz, texto) => writeFileSync(path.join(raiz, 'package.json'), texto),
  /** A versão desta construção. */
  derivar: (raiz) => derivarVersao(raiz),
  /** Onde o empacotador está, ou nulo quando não foi instalado. */
  localizarEmpacotador: (raiz) => {
    try {
      return require.resolve('@vscode/vsce/package.json', { paths: [raiz] })
    } catch {
      return null
    }
  },
  /** Se a construção já rodou. */
  temSaida: (raiz) => existsSync(path.join(raiz, 'out', 'extension.js')),
  /** Chama o empacotador; lança se ele reprovar. */
  empacotar: (raiz, binario, destino) => {
    execFileSync(
      process.execPath,
      [
        binario,
        'package',
        // O projeto não tem dependência de produção, então resolver árvore de
        // dependências seria trabalho sobre o vazio.
        '--no-dependencies',
        // Repositório declarado é exigência de quem publica, e este não publica.
        '--allow-missing-repository',
        '--out',
        destino,
      ],
      { cwd: raiz, stdio: 'inherit' },
    )
  },
  existe: (caminho) => existsSync(caminho),
  apagar: (caminho) => rmSync(caminho),
  tamanho: (caminho) => statSync(caminho).size,
  lerPacote: (caminho) => lerPacote(caminho),
  escrever: (texto) => process.stdout.write(texto),
  escreverErro: (texto) => process.stderr.write(texto),
}

/**
 * O manifesto com a versão trocada, e nada mais trocado.
 *
 * Substituição textual, e não `JSON.stringify`, de propósito: reserializar
 * mudaria indentação, ordem ou quebra final, e o bloco de restauração devolve o
 * texto original de qualquer forma, mas um manifesto reescrito no meio do
 * caminho seria um diff a mais para quem interrompesse o comando.
 * @param {string} texto - o manifesto como está.
 * @param {string} versao - a versão a escrever.
 * @returns {string} o manifesto com a versão nova.
 */
function comVersao(texto, versao) {
  return texto.replace(/("version"\s*:\s*")[^"]*(")/, `$1${versao}$2`)
}

/**
 * Empacota e relata.
 * @param {string} raiz - a raiz do repositório.
 * @param {typeof FERRAMENTAS} [ferramentas] - o acesso ao mundo.
 * @returns {number} o código de saída.
 */
function principal(raiz, ferramentas = FERRAMENTAS) {
  const empacotador = ferramentas.localizarEmpacotador(raiz)
  if (empacotador === null) {
    ferramentas.escreverErro(`${COMO_INSTALAR}\n`)
    return 1
  }

  if (!ferramentas.temSaida(raiz)) {
    ferramentas.escreverErro('a pasta de saída está vazia: rode `npm run build` antes de empacotar.\n')
    return 1
  }

  const original = ferramentas.lerManifesto(raiz)
  const nome = JSON.parse(original).name
  const derivada = ferramentas.derivar(raiz)
  if (derivada.recuo !== null) {
    // RF-21: recuar é permitido, calar sobre o recuo não é.
    ferramentas.escreverErro(
      `versão recuada para ${derivada.versao} (${derivada.recuo.causa}): ${derivada.recuo.explicacao}\n`,
    )
  }
  const destino = path.join(raiz, `${nome}-${derivada.versao}.vsix`)
  const binario = path.join(path.dirname(empacotador), 'vsce')

  ferramentas.escreverManifesto(raiz, comVersao(original, derivada.versao))
  try {
    ferramentas.empacotar(raiz, binario, destino)
  } catch (erro) {
    // Pacote pela metade é pior que pacote nenhum: quem o encontrasse depois
    // não teria como saber que ele não terminou de ser escrito.
    if (ferramentas.existe(destino)) ferramentas.apagar(destino)
    ferramentas.escreverErro(`o empacotador falhou: ${erro.message}\n`)
    return 1
  } finally {
    // D-08: a árvore volta limpa, com o empacotador tendo terminado ou não.
    ferramentas.escreverManifesto(raiz, original)
  }

  return relatar(destino, derivada.versao, ferramentas)
}

/**
 * O conteúdo do pacote e o tamanho ao lado do teto (RF-03), e a versão que ele leva (RF-20).
 * @param {string} destino - o caminho do pacote gerado.
 * @param {string} versao - a versão derivada que foi escrita nele.
 * @param {typeof FERRAMENTAS} ferramentas - o acesso ao mundo.
 * @returns {number} o código de saída.
 */
function relatar(destino, versao, ferramentas) {
  const entradas = ferramentas.lerPacote(destino)
  ferramentas.escrever(`\nConteúdo de ${path.basename(destino)}, ${entradas.length} arquivos:\n`)
  for (const entrada of entradas.sort((a, b) => a.caminho.localeCompare(b.caminho))) {
    ferramentas.escrever(`  ${entrada.caminho}  (${entrada.tamanhoOriginal} B)\n`)
  }

  const tamanho = ferramentas.tamanho(destino)
  const medida = `${formatarTamanho(tamanho)}, teto ${formatarTamanho(TETO_DO_PACOTE_DA_EXTENSAO)}`
  if (tamanho > TETO_DO_PACOTE_DA_EXTENSAO) {
    ferramentas.escreverErro(`\nO pacote estourou o teto: ${medida}\n`)
    return 1
  }
  ferramentas.escrever(`\nPacote da extensão: ${medida}, versão ${versao}\n`)
  ferramentas.escrever('Instale com: code --install-extension ' + path.basename(destino) + '\n')
  return 0
}

if (require.main === module) process.exit(principal(path.resolve(__dirname, '..')))

module.exports = { COMO_INSTALAR, FERRAMENTAS, comVersao, principal }
