/**
 * Os limites do projeto, num lugar só (RF-15, RN-01, RN-06, D-10).
 *
 * Quatro números que antes viviam espalhados: o teto do pacote da tela estava
 * na prosa de 'theme-tokens.js', o alvo do navegador era literal em
 * 'build-webview.js' e a suíte conferia o literal, e a versão mínima do editor
 * só existia no manifesto. Espalhados, eles concordam hoje e divergem depois,
 * e a divergência do par alvo/versão mínima só aparece na máquina de quem
 * instalou.
 *
 * O par é o ponto delicado: a versão mínima do editor determina qual Electron
 * ele embarca, e o Electron determina qual Chromium. O editor 1.78 embarca o
 * Electron 22, que traz o Chromium 108. Sintaxe emitida acima disso compila
 * aqui e quebra lá. Mexer num dos dois sem mexer no outro é o que a suíte de
 * 'tests/limites.spec.ts' impede.
 *
 * Uso:
 *     const { TETO_DO_PACOTE_DA_TELA } = require('./limites')
 * @module scripts/limites
 */

/** Teto do pacote da tela: folha e script somados, porque viajam juntos. */
const TETO_DO_PACOTE_DA_TELA = 409600

/** Teto do pacote da extensão inteira, medido sobre o arquivo gerado. */
const TETO_DO_PACOTE_DA_EXTENSAO = 2097152

/** Versão mínima do editor, sem a faixa que o manifesto escreve à volta. */
const VERSAO_MINIMA_DO_EDITOR = '1.78'

/** A faixa tal como o manifesto a declara, derivada da versão mínima. */
const FAIXA_DO_EDITOR_NO_MANIFESTO = `^${VERSAO_MINIMA_DO_EDITOR}.0`

/** O Chromium que o Electron daquela versão do editor embarca. */
const ALVO_DO_NAVEGADOR = 'chrome108'

/**
 * Tamanho em bytes e em quibibytes, para a mensagem que põe medida ao lado do
 * teto. Vive aqui porque a guarda do build e o empacotamento imprimem a mesma
 * linha, e duas formatações que concordam hoje divergem depois.
 * @param {number} bytes - o tamanho medido.
 * @returns {string} algo como '312.4 KiB (319898 B)'.
 */
function formatarTamanho(bytes) {
  return `${(bytes / 1024).toFixed(1)} KiB (${bytes} B)`
}

module.exports = {
  ALVO_DO_NAVEGADOR,
  FAIXA_DO_EDITOR_NO_MANIFESTO,
  TETO_DO_PACOTE_DA_EXTENSAO,
  TETO_DO_PACOTE_DA_TELA,
  VERSAO_MINIMA_DO_EDITOR,
  formatarTamanho,
}
