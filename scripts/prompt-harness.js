#!/usr/bin/env node
/**
 * O prompt de correção de várias raízes numa passada (T028, feature 013).
 *
 * Ele existe porque o painel observa UMA raiz por leitura, e os três casos que
 * sobraram depois da primeira promoção do mapa moram em três projetos distintos.
 * Enxergar além da raiz observada é a OQ-01 da spec da ponte, feature própria e
 * ainda não decidida; enquanto ela não vem, um comando de manutenção resolve o
 * caso real sem antecipar decisão alguma sobre a tela.
 *
 * Fora do `npm run build` e fora do pacote, no mesmo regime dos auxiliares
 * `estragar:*` e dos dois comandos da feature 012. Três promessas negativas
 * valem mais aqui do que qualquer saída: ele não fala com motor algum, não
 * escreve no `state.json` de ninguém, e não classifica coisa alguma. Tudo o que
 * decide, decide pelas duas regras do esquema e pelo mapa que uma pessoa já
 * aprovou.
 *
 * O TEXTO é transcrição de `src/webview/domain/prompt.ts`, e a transcrição é
 * deliberada: a webview não lê disco nem importa de `scripts/`, e um comando de
 * diagnóstico que exigisse build funcional seria inútil justamente no dia em que
 * mais se precisa dele. O que torna a duplicação aceitável é
 * `tests/prompt-paridade.spec.ts`, que compara o texto inteiro dos dois lados.
 * Divergiu, corrige-se o lado que saiu da linha; a comparação não se afrouxa.
 *
 * Uso:
 *     node ./scripts/prompt-harness.js
 *     node ./scripts/prompt-harness.js --raiz=~/dev --saida=propostas/prompt-harness.md
 * @module scripts/prompt-harness
 */

const { existsSync, mkdirSync, readFileSync, writeFileSync } = require('node:fs')
const path = require('node:path')

const { elidirCheckpoint } = require('./equivalencias/elidir')
const { lerEstados, resolverRaiz } = require('./equivalencias/estados')
const { DESTINO, lerMapaDeModulo } = require('./equivalencias/gerar-mapa')

const raizDoRepo = path.resolve(__dirname, '..')

/** Onde o texto é escrito, quando nada mais é pedido. */
const SAIDA = 'propostas/prompt-harness.md'

/** Os campos que o esquema do Reversa nomeia, e que a leitura já conhece. */
const CONHECIDAS = new Set(['completed_at', 'files', 'modules_analyzed', 'modules_pending'])

/** Como o painel lê todo caso; ver o comentário do par em `prompt.ts`. */
const COMO_O_PAINEL_LE = 'conclusão não declarada no campo canônico'

/** Um argumento nomeado, ou o padrão. */
function argumento(argumentos, nome, padrao) {
  const achado = argumentos.find((a) => a.startsWith(`--${nome}=`))
  return achado === undefined ? padrao : achado.slice(nome.length + 3)
}

/** Uma linha no terminal, que é o registro desta ferramenta. */
function registrar(linha) {
  process.stdout.write(`${linha}\n`)
}

/** O valor por que o mapa casa: texto aparado e em caixa baixa, número ou booleano. */
function valorComparavel(valor) {
  if (typeof valor === 'string') return valor.trim().toLowerCase()
  if (typeof valor === 'boolean' || typeof valor === 'number') return String(valor)
  return null
}

/** O par aprovado que este checkpoint carrega, por campo E valor, nunca pelo campo só. */
function casarPar(entry, mapa) {
  for (const [campo, bruto] of Object.entries(entry)) {
    const comparavel = valorComparavel(bruto)
    if (comparavel === null) continue
    if (mapa.pares.some((p) => p.campo === campo && p.valor === comparavel)) return true
  }
  return false
}

/** Uma lista de textos, ou vazia. */
function listaDeTextos(valor) {
  return Array.isArray(valor) && valor.every((item) => typeof item === 'string') ? valor : []
}

/** Os campos preservados cujo valor é lista de textos, e só quando `files` falta. */
function camposComLista(entry) {
  if (listaDeTextos(entry.files).length > 0) return []
  return Object.entries(entry)
    .filter(([chave]) => !CONHECIDAS.has(chave))
    .filter(([, valor]) => listaDeTextos(valor).length > 0)
    .map(([chave]) => chave)
    .sort()
}

/**
 * Os casos de um `state.json`, pelas mesmas regras do domínio e na mesma ordem.
 *
 * A precedência é a do `checkpoint-guide.md`: `completed_at` declara conclusão,
 * `modules_pending` declara trabalho em curso, e só quem não declarou nenhum dos
 * dois chega ao mapa. Passou pelo mapa sem casar, é caso.
 * @param {{projeto: string, pasta: string, stateJson: string}} estado - um projeto varrido.
 * @param {object} mapa - o que uma pessoa aprovou.
 * @returns {object[]} os casos deste projeto.
 */
function casosDoEstado(estado, mapa) {
  let doc = null
  try {
    doc = JSON.parse(estado.stateJson)
  } catch {
    // Arquivo ilegível é um projeto a menos, nunca uma rodada a menos.
    return []
  }
  if (doc === null || typeof doc !== 'object') return []

  const checkpoints = doc.checkpoints
  if (checkpoints === null || typeof checkpoints !== 'object') return []

  const casos = []
  for (const [agente, entry] of Object.entries(checkpoints)) {
    if (entry === null || typeof entry !== 'object' || Array.isArray(entry)) continue
    if (mapa.naoAgentes.some((registro) => registro.chave === agente)) continue
    if (typeof entry.completed_at === 'string' && entry.completed_at !== '') continue
    if (listaDeTextos(entry.modules_pending).length > 0) continue
    if (casarPar(entry, mapa)) continue

    casos.push({
      projeto: typeof doc.project === 'string' ? doc.project : null,
      raiz: estado.pasta,
      agente,
      fase: typeof doc.phase === 'string' ? doc.phase : null,
      camposComLista: camposComLista(entry),
      formaElidida: elidirCheckpoint(entry),
    })
  }
  return casos
}

/**
 * Os casos de uma raiz inteira, projeto a projeto.
 * @param {string} raiz - a pasta a varrer; o til é resolvido.
 * @param {object} [mapa] - o mapa aprovado; o do repositório por omissão.
 * @returns {object[]} os casos, na ordem estável da varredura.
 */
function casosDaVarredura(raiz, mapa = mapaDoRepo()) {
  return lerEstados(resolverRaiz(raiz)).flatMap((estado) => casosDoEstado(estado, mapa))
}

/** O mapa aprovado como o repositório o traz; vazio quando o módulo não está lá. */
function mapaDoRepo() {
  const arquivo = path.join(raizDoRepo, DESTINO)
  if (!existsSync(arquivo)) return { pares: [], naoAgentes: [] }
  return lerMapaDeModulo(readFileSync(arquivo, 'utf8'))
}

/** O bloco de um caso. */
function bloco(caso) {
  const linhas = []
  const onde = caso.projeto === null ? '' : `, no projeto \`${caso.projeto}\``
  const fase = caso.fase === null ? '' : `, na fase \`${caso.fase}\``
  linhas.push(`### Checkpoint \`${caso.agente}\`${onde}${fase}`)
  linhas.push('')
  linhas.push(`Como o painel lê: ${COMO_O_PAINEL_LE}.`)

  if (caso.camposComLista.length > 0) {
    linhas.push('')
    linhas.push(
      `Campos preservados cujo valor é lista de textos: ${caso.camposComLista
        .map((campo) => `\`${campo}\``)
        .join(', ')}. O painel nomeia esses campos e não abre o conteúdo deles.`,
    )
  }

  if (caso.formaElidida !== null) {
    linhas.push('')
    linhas.push(
      'A forma do checkpoint, com lista, texto longo, caminho e objeto trocados por marcador de forma:',
    )
    linhas.push('')
    linhas.push('```json')
    linhas.push(JSON.stringify(caso.formaElidida, null, 2))
    linhas.push('```')
  }

  return linhas.join('\n')
}

/**
 * O prompt, nas cinco partes do contrato e nessa ordem.
 *
 * Transcrição de `promptText`. Alterar uma linha aqui sem alterar a de lá faz a
 * suíte de paridade falhar nomeando a divergência, que é exactamente o serviço
 * que ela presta.
 * @param {object[]} casos - os casos, como a varredura os apurou.
 * @returns {string} o texto; vazio quando não há caso.
 */
function escreverPrompt(casos) {
  if (casos.length === 0) return ''

  const raizes = [...new Set(casos.map((caso) => caso.raiz))]
  const onde =
    raizes.length === 1
      ? `Cole este texto numa sessão aberta na raiz que grava o \`state.json\`: \`${raizes[0]}\`.`
      : 'Cole este texto numa sessão aberta na raiz que grava o `state.json`. Cada bloco abaixo nomeia a sua raiz.'

  const partes = []

  partes.push('# Checkpoint concluído sem declarar conclusão: correção na fonte')
  partes.push('')
  partes.push(onde)
  partes.push('')
  partes.push(
    'O defeito é de gravação, e não de leitura: o painel está mostrando exatamente o que está escrito no arquivo.',
  )
  partes.push('')

  partes.push('## A norma')
  partes.push('')
  partes.push(
    'No esquema do Reversa, um checkpoint declara conclusão por um par de campos, e só por ele: `completed_at`, com o instante em ISO 8601, e `files`, com as saídas que o agente produziu. Trabalho parcial tem campo próprio, `modules_pending`, e é assim que um agente diz que ainda não terminou.',
  )
  partes.push('')
  partes.push(
    'Quem manda isso é o guia de checkpoint do Reversa, que nas instalações costuma morar sob as referências da skill. Confirme onde ele está nesta raiz antes de editar qualquer coisa: o caminho varia de instalação para instalação, e eu não o li daqui.',
  )
  partes.push('')

  partes.push(casos.length === 1 ? '## O caso' : '## Os casos')
  partes.push('')
  partes.push(casos.map(bloco).join('\n\n'))
  partes.push('')

  partes.push('## O que eu peço, nesta ordem')
  partes.push('')
  partes.push(
    '1. Diga se este agente de fato concluiu a sua fase, olhando o que ele lista e o que existe em disco. Se não concluiu, o defeito é outro: pare aqui e diga qual.',
  )
  partes.push(
    '2. Se concluiu, grave `completed_at` com o instante real, e o que já estiver no próprio registro serve melhor que um instante inventado agora, mais `files` com as saídas, preservando os campos que já estão lá. Não apague nada: campo fora do esquema é informação de alguém.',
  )
  partes.push(
    '3. Diga por que o campo saiu com outro nome: qual `SKILL.md` ou qual instrução mandou gravar o checkpoint sem nomear `completed_at`. É a causa que interessa, porque é ela que repete o defeito no próximo projeto.',
  )
  partes.push(
    '4. Proponha a correção na fonte: o texto exato a acrescentar naquela instrução, nomeando `completed_at` e `files` como o guia manda. Não aplique sem eu ver.',
  )
  partes.push('')

  partes.push('## O que eu não peço')
  partes.push('')
  partes.push('- Não renomeie campo existente sem me dizer antes qual e por quê.')
  partes.push('- Não normalize valor algum que já esteja gravado.')
  partes.push('- Não reescreva o `state.json` inteiro.')
  partes.push('- Não mexa em checkpoints de outros agentes, nem nos de outros projetos.')
  partes.push('')

  return partes.join('\n')
}

/**
 * Roda o comando.
 * @param {string[]} argumentos - o que veio depois do nome do script.
 * @returns {number} o código de saída.
 */
function principal(argumentos = []) {
  const bruta = argumento(argumentos, 'raiz', raizDoRepo)
  const raiz = resolverRaiz(bruta)
  const saida = path.resolve(raizDoRepo, argumento(argumentos, 'saida', SAIDA))

  if (!existsSync(raiz)) {
    // Causa nomeada e rodada encerrada, sem arquivo pela metade: metade de um
    // prompt parece um prompt inteiro.
    registrar(`erro: a raiz ${raiz} não existe. Nada foi escrito.`)
    return 1
  }

  const casos = casosDaVarredura(raiz)
  registrar(`raiz: ${raiz}`)
  registrar(`casos sem conclusão declarada: ${casos.length}`)

  if (casos.length === 0) {
    registrar('nada a pedir: todo checkpoint desta raiz declara o que o esquema manda, ou já foi decidido por gente.')
    return 0
  }

  const texto = escreverPrompt(casos)
  const pasta = path.dirname(saida)
  if (!existsSync(pasta)) mkdirSync(pasta, { recursive: true })
  writeFileSync(saida, texto, 'utf8')

  registrar(`prompt escrito em ${path.relative(raizDoRepo, saida)}`)
  for (const caso of casos) registrar(`  ${caso.projeto ?? caso.raiz}: ${caso.agente}`)
  registrar('nenhum state.json foi tocado. Confira com `git status` na raiz varrida.')
  return 0
}

if (require.main === module) {
  process.exit(principal(process.argv.slice(2)))
}

module.exports = { SAIDA, casosDaVarredura, escreverPrompt, principal }
