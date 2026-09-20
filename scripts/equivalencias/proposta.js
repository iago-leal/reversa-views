/**
 * A proposta, nos dois sentidos (T028, T029, RF-12, RF-19).
 *
 * Ela é o lugar onde o modelo para e a pessoa começa. O formato foi escolhido
 * para que APROVAR SEJA MARCAR: Markdown legível, uma caixa por item, e um
 * bloco de dados cercado sob cada uma para que a promoção seja determinística.
 * Texto livre seria legível e não parseável; dados puros seriam parseáveis e
 * ilegíveis.
 *
 * A caixa nasce DESMARCADA, e isso é o desenho inteiro. Um formato em que o
 * padrão fosse aprovar transformaria o rito em carimbo, que é o primeiro risco
 * nomeado no roadmap.
 *
 * A escrita e a leitura moram juntas de propósito: são o mesmo formato visto
 * de dois lados, e separá-las deixaria a escrita livre para mudar sem que a
 * leitura soubesse.
 * @module scripts/equivalencias/proposta
 */

/** Os rótulos das três leituras que reconhecem, mais a que não reconhece nada. */
const LEITURA_LEGIVEL = {
  concluido: 'concluído',
  falhou: 'falhou',
  'em-andamento': 'em andamento',
  'nao-e-sinal': 'não é sinal de estado',
}

/** As duas cercas que a promoção lê, e que o resto do arquivo pode ignorar. */
const CERCA_PAR = 'equivalencia'
const CERCA_CHAVE = 'nao-agente'

/**
 * Uma linha de item, com a caixa sempre desmarcada.
 *
 * O rótulo da segunda linha é parâmetro porque nem toda razão vem do motor: a
 * das entradas a decidir vem da varredura, e atribuí-la ao modelo seria pôr na
 * boca dele uma frase que ele não disse.
 */
function item(titulo, razao, evidencia, cerca, dados, rotulo = '_o motor disse:_') {
  return [
    `- [ ] ${titulo}`,
    `      ${rotulo} ${razao || 'nada'}`,
    `      _visto em:_ ${evidencia.join(', ') || 'nenhum projeto'}`,
    '      ```' + cerca,
    `      ${JSON.stringify(dados)}`,
    '      ```',
    '',
  ].join('\n')
}

/**
 * A proposta inteira, pronta para ser lida por gente.
 * @param {{pares: object[], chaves: object[], naoClassificados: object[]}} entrada - o que a rodada apurou.
 * @returns {string} o Markdown.
 */
function escreverProposta({ pares, chaves, naoClassificados }) {
  const linhas = [
    '# Proposta de equivalências',
    '',
    'Cada item abaixo é uma **sugestão** do motor local, e nenhuma vale coisa alguma até você marcá-la.',
    'Marque a caixa do que aprovar, deixe desmarcado o que não convencer, e rode a promoção.',
    'Anote ao lado do item o que quiser: a promoção lê apenas as caixas e os blocos.',
    '',
  ]

  if (pares.length === 0 && chaves.length === 0) {
    linhas.push('Não há nada a propor: todo par encontrado já foi decidido antes.', '')
  }

  if (pares.length > 0) {
    linhas.push('## Pares novos', '')
    for (const par of pares) {
      linhas.push(
        item(
          `\`${par.campo}: ${JSON.stringify(par.valor)}\` → **${LEITURA_LEGIVEL[par.leitura] ?? par.leitura}**`,
          par.razao,
          par.evidencia,
          CERCA_PAR,
          { campo: par.campo, valor: par.valor, leitura: par.leitura },
        ),
      )
    }
  }

  if (chaves.length > 0) {
    linhas.push(
      '## Entradas a decidir: agente ou registro',
      '',
      'Toda entrada sem conclusão declarada aparece aqui, INCLUSIVE as que são agentes de verdade.',
      'O motor não opina sobre isto: ele lê campos, e saber quem é agente é conhecimento seu.',
      'Marque apenas o que NÃO for agente; a entrada marcada sai da contagem de checkpoints e',
      'deixa de ser cobrada por conclusão. Um agente marcado aqui some da conferência, então',
      'deixe desmarcado tudo o que tiver a menor dúvida.',
      '',
    )
    for (const chave of chaves) {
      linhas.push(
        item(
          `\`${chave.chave}\` → aprovar como **registro que não é agente**`,
          chave.razao,
          chave.evidencia,
          CERCA_CHAVE,
          { chave: chave.chave },
          '_campos da entrada:_',
        ),
      )
    }
  }

  if (naoClassificados.length > 0) {
    linhas.push(
      '## Não classificados nesta rodada',
      '',
      'Sem caixa, porque não há o que aprovar: o motor não respondeu sobre eles. Rodar de novo basta.',
      '',
    )
    for (const item of naoClassificados) {
      const nome = item.chave ?? `${item.campo}: ${JSON.stringify(item.valor)}`
      linhas.push(`- \`${nome}\` — ${item.causa}`)
    }
    linhas.push('')
  }

  return linhas.join('\n')
}

/**
 * O que foi marcado, e nada além disso.
 *
 * A leitura é deliberadamente burra: procura linha de caixa marcada e, logo
 * abaixo dela, o primeiro bloco cercado. Prosa, anotação e item não marcado
 * passam batido, que é o que permite escrever ao lado sem quebrar nada.
 * @param {string} texto - a proposta como o usuário a devolveu.
 * @returns {{pares: object[], chaves: object[]}} o aprovado.
 */
function lerMarcados(texto) {
  const pares = []
  const chaves = []
  const linhas = texto.split('\n')

  for (let i = 0; i < linhas.length; i += 1) {
    if (!/^\s*- \[[xX]\]/.test(linhas[i])) continue

    for (let j = i + 1; j < linhas.length && j < i + 8; j += 1) {
      const abertura = linhas[j].trim()
      if (/^- \[[ xX]\]/.test(abertura)) break
      const cerca = abertura.startsWith('```') ? abertura.slice(3).trim() : null
      if (cerca === null) continue
      const dados = linhas[j + 1]?.trim()
      if (dados === undefined) break
      try {
        const objeto = JSON.parse(dados)
        if (cerca === CERCA_PAR) pares.push({ campo: objeto.campo, valor: objeto.valor, leitura: objeto.leitura })
        if (cerca === CERCA_CHAVE) chaves.push({ chave: objeto.chave })
      } catch {
        // Bloco ilegível é item perdido, nunca rodada perdida: o resto do
        // arquivo continua tendo decisões válidas dentro.
      }
      break
    }
  }

  return { pares, chaves }
}

module.exports = { CERCA_CHAVE, CERCA_PAR, LEITURA_LEGIVEL, escreverProposta, lerMarcados }
