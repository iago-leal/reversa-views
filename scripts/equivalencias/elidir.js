/**
 * A elisão da carga enviada ao motor local (T025, RF-11, RN-09).
 *
 * Ela existe para que a promessa de privacidade caiba numa leitura de vinte
 * linhas. O classificador precisa ver o NOME do campo e o valor que declara
 * estado; não precisa ver, e não vê, o conteúdo do trabalho.
 *
 * O que os checkpoints reais carregam, e que não sai daqui: caminho de
 * scratchpad com identificador de sessão, achados que descrevem o sistema do
 * cliente, notas sobre omissão deliberada e listas de arquivos do projeto.
 * Nada disso classifica coisa alguma, e o motor é local mas não é motivo para
 * mandar mais do que o necessário.
 *
 * A função é pura e não altera o que recebe: o disco não é dela.
 * @module scripts/equivalencias/elidir
 */

/** Acima disto, um texto é conteúdo e não declaração de estado. */
const LIMITE_DE_TEXTO = 40

/** O que substitui cada forma elidida, dizendo a FORMA e nunca o conteúdo. */
const MARCA = {
  lista: (quantos) => `<lista de ${quantos}>`,
  texto: (tamanho) => `<texto de ${tamanho} caracteres>`,
  caminho: '<caminho>',
  objeto: '<objeto>',
}

/** Se o texto parece caminho de sistema de arquivos. */
function pareceCaminho(valor) {
  return valor.startsWith('/') || valor.startsWith('~/') || /^[A-Za-z]:[\\/]/.test(valor)
}

/**
 * Um valor, na forma em que pode sair da máquina.
 * @param {unknown} valor - o valor como o disco o traz.
 * @returns {unknown} o valor preservado, ou o marcador da sua forma.
 */
function elidirValor(valor) {
  if (Array.isArray(valor)) return MARCA.lista(valor.length)
  if (valor !== null && typeof valor === 'object') return MARCA.objeto
  if (typeof valor !== 'string') return valor
  if (pareceCaminho(valor)) return MARCA.caminho
  if (valor.length > LIMITE_DE_TEXTO) return MARCA.texto(valor.length)
  return valor
}

/**
 * O checkpoint na forma em que pode ser perguntado ao motor.
 * @param {Record<string, unknown>} entry - o checkpoint como o disco o traz.
 * @returns {Record<string, unknown>} a carga, com as chaves todas e o conteúdo nenhum.
 */
function elidirCheckpoint(entry) {
  const saida = {}
  for (const [chave, valor] of Object.entries(entry)) saida[chave] = elidirValor(valor)
  return saida
}

module.exports = { LIMITE_DE_TEXTO, MARCA, elidirCheckpoint, elidirValor }
