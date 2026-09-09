#!/usr/bin/env node
/**
 * O empacotamento em VSIX (RF-01, RF-03, RF-05, RN-09, D-14).
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
 * Uso:
 *     npm run build && npm run empacotar
 * @module scripts/empacotar
 */

const { execFileSync } = require('node:child_process')
const { existsSync, rmSync, statSync } = require('node:fs')
const path = require('node:path')

const { TETO_DO_PACOTE_DA_EXTENSAO, formatarTamanho } = require('./limites')
const { lerPacote } = require('./vsix')

/** O que se diz a quem ainda não instalou a ferramenta. */
const COMO_INSTALAR =
  'o empacotador não está instalado.\n' +
  'Rode `npm install` para trazer @vscode/vsce, que é dependência de desenvolvimento.'

/**
 * Empacota e relata.
 * @param {string} raiz - a raiz do repositório.
 * @returns {number} o código de saída.
 */
function principal(raiz) {
  const manifesto = require(path.join(raiz, 'package.json'))
  const destino = path.join(raiz, `${manifesto.name}-${manifesto.version}.vsix`)

  let empacotador
  try {
    empacotador = require.resolve('@vscode/vsce/package.json', { paths: [raiz] })
  } catch {
    process.stderr.write(`${COMO_INSTALAR}\n`)
    return 1
  }

  if (!existsSync(path.join(raiz, 'out', 'extension.js'))) {
    process.stderr.write('a pasta de saída está vazia: rode `npm run build` antes de empacotar.\n')
    return 1
  }

  const binario = path.join(path.dirname(empacotador), 'vsce')
  try {
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
  } catch (erro) {
    // Pacote pela metade é pior que pacote nenhum: quem o encontrasse depois
    // não teria como saber que ele não terminou de ser escrito.
    if (existsSync(destino)) rmSync(destino)
    process.stderr.write(`o empacotador falhou: ${erro.message}\n`)
    return 1
  }

  return relatar(destino)
}

/** O conteúdo do pacote e o tamanho ao lado do teto (RF-03). */
function relatar(destino) {
  const entradas = lerPacote(destino)
  process.stdout.write(`\nConteúdo de ${path.basename(destino)}, ${entradas.length} arquivos:\n`)
  for (const entrada of entradas.sort((a, b) => a.caminho.localeCompare(b.caminho))) {
    process.stdout.write(`  ${entrada.caminho}  (${entrada.tamanhoOriginal} B)\n`)
  }

  const tamanho = statSync(destino).size
  const medida = `${formatarTamanho(tamanho)}, teto ${formatarTamanho(TETO_DO_PACOTE_DA_EXTENSAO)}`
  if (tamanho > TETO_DO_PACOTE_DA_EXTENSAO) {
    process.stderr.write(`\nO pacote estourou o teto: ${medida}\n`)
    return 1
  }
  process.stdout.write(`\nPacote da extensão: ${medida}\n`)
  process.stdout.write('Instale com: code --install-extension ' + path.basename(destino) + '\n')
  return 0
}

if (require.main === module) process.exit(principal(path.resolve(__dirname, '..')))

module.exports = { COMO_INSTALAR, principal }
