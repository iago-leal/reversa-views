/**
 * O julgamento de um nome de fase, do lado dos scripts (feature 015, D-19).
 *
 * É GÊMEO de `src/domain/fases.ts`, e a duplicação é deliberada: os scripts de
 * manutenção são CommonJS e não importam a fonte em TypeScript, e fazer o
 * aprendizado depender de `out-cli/` obrigaria a construir a ferramenta de
 * terminal para aprender. É o mesmo corte de `elidir.js`, preso à fonte pelo
 * mesmo remédio: `tests/fases-paridade.spec.ts` percorre a MESMA tabela de
 * casos dos dois lados, e uma regra mudada num só deles faz a suíte falhar.
 *
 * Cinco degraus, nesta ordem: canônica, encerramento, ciclo, etapa aprovada e
 * desconhecida. Os três primeiros são forma; o quarto consulta o mapa; o quinto
 * é o que o aprendizado leva a uma pessoa.
 * @module scripts/equivalencias/fases
 */

/** As cinco fases que o REVERSA documenta, na ordem canônica. */
const FASES_CANONICAS = ['reconhecimento', 'escavacao', 'interpretacao', 'geracao', 'revisao']

/** A raiz que todo valor de encerramento carrega, nas cinco grafias medidas. */
const RAIZ_DE_ENCERRAMENTO = 'conclu'

/** O resto de um nome depois da base conhecida, quando é sufixo numérico. */
const SUFIXO_NUMERICO = /^[-_]\S*?(\d+)$/

/** Se o valor declara o fim da extração, pela forma, como na 011. */
function declaraEncerramento(bruto) {
  return bruto
    .split(/[-_]/)
    .map((parte) => parte.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase())
    .some((parte) => parte.startsWith(RAIZ_DE_ENCERRAMENTO))
}

/** O inteiro de um sufixo numérico, ou null quando o resto não tem a forma. */
function inteiroDoSufixo(resto) {
  const casou = SUFIXO_NUMERICO.exec(resto)
  return casou === null ? null : Number(casou[1])
}

/**
 * A etapa aprovada a que um nome pertence, se alguma. Sem distinção de caixa e
 * de bordas, COM diacríticos; a igualdade inteira antes do prefixo, e entre os
 * prefixos vence a base mais longa.
 */
function casarEtapa(bruto, mapa) {
  const comparavel = bruto.trim().toLowerCase()
  const bases = (mapa.etapas ?? [])
    .map((etapa) => etapa.nome.trim().toLowerCase())
    .filter((nome) => nome !== '')
    .sort((a, b) => b.length - a.length)

  if (bases.includes(comparavel)) return { base: comparavel, sufixo: null }
  for (const base of bases) {
    if (!comparavel.startsWith(base)) continue
    const sufixo = inteiroDoSufixo(comparavel.slice(base.length))
    if (sufixo !== null) return { base, sufixo }
  }
  return null
}

/**
 * Julga um nome de fase.
 * @param {string} bruto - o nome como o arquivo o carrega.
 * @param {{etapas?: {nome: string}[]}} mapa - o que uma pessoa aprovou.
 * @returns {object} o julgamento, sempre com o nome bruto ao lado.
 */
function classificarNome(bruto, mapa) {
  const canonica = FASES_CANONICAS.find((fase) => fase === bruto)
  if (canonica !== undefined) return { tipo: 'canonica', bruto, canonica }

  if (declaraEncerramento(bruto)) return { tipo: 'encerramento', bruto }

  for (const fase of FASES_CANONICAS) {
    if (!bruto.startsWith(fase)) continue
    const ciclo = inteiroDoSufixo(bruto.slice(fase.length))
    if (ciclo !== null) return { tipo: 'ciclo', bruto, canonica: fase, ciclo }
  }

  const etapa = casarEtapa(bruto, mapa)
  if (etapa !== null) return { tipo: 'etapa', bruto, ...etapa }

  return { tipo: 'desconhecida', bruto }
}

module.exports = { classificarNome, declaraEncerramento, FASES_CANONICAS, SUFIXO_NUMERICO }
