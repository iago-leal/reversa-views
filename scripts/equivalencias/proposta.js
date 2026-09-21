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
 * A linha que guarda a raiz varrida (feature 015). É comentário, e não prosa:
 * quem lê a proposta não precisa dela, e a promoção a usa para contar as
 * anomalias da MESMA raiz que o aprendizado varreu, sem pedir o argumento de novo.
 */
const MARCA_DA_RAIZ = /^<!-- raiz: (.+) -->$/m

/** A cerca da seção de fases (feature 015), que só `lerEtapasMarcadas` lê. */
const CERCA_ETAPA = 'etapa'

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
 * Os grupos de nomes que o motor apontou como a mesma etapa: o FECHO dos pares
 * `mesma`. Se `a` é a mesma que `b` e `b` a mesma que `c`, os três ficam juntos,
 * ainda que ninguém tenha comparado `a` com `c`.
 *
 * O grupo é apresentação, e nada além disso (RN-02): serve para que grafias
 * vizinhas sejam decididas juntas. Cada nome continua com a sua caixa, e o mapa
 * não guarda relação alguma entre eles.
 * @param {string[]} nomes - os nomes a agrupar.
 * @param {{a: string, b: string}[]} mesmas - os pares que o motor julgou `mesma`.
 * @returns {string[][]} os grupos, cada um ordenado, na ordem do primeiro nome.
 */
function agruparPorFecho(nomes, mesmas) {
  const lider = new Map(nomes.map((nome) => [nome, nome]))
  const achar = (nome) => {
    let atual = nome
    while (lider.get(atual) !== atual) atual = lider.get(atual)
    return atual
  }
  for (const { a, b } of mesmas) {
    // Par com nome que não está entre os candidatos liga o candidato a uma
    // etapa JÁ aprovada, e não forma grupo: não há segunda caixa a marcar.
    if (!lider.has(a) || !lider.has(b)) continue
    const [menor, maior] = [achar(a), achar(b)].sort((x, y) => x.localeCompare(y))
    lider.set(maior, menor)
  }

  const grupos = new Map()
  for (const nome of [...nomes].sort((x, y) => x.localeCompare(y))) {
    const chave = achar(nome)
    grupos.set(chave, [...(grupos.get(chave) ?? []), nome])
  }
  return [...grupos.values()]
}

/**
 * Um item da seção de fases, com a caixa sempre desmarcada.
 *
 * Ao lado do nome vai a EVIDÊNCIA MEDIDA, e não a razão do motor (D-17): a
 * prova de viabilidade mediu razão falsa em sete dos oito positivos da pergunta
 * de natureza, com o veredito certo, e texto falso ao lado de uma caixa de
 * aprovação é pior que texto nenhum.
 */
function itemDeEtapa(candidato) {
  const julgamento = candidato.classificado
    ? 'etapa'
    : 'nada: não classificado nesta rodada, e a decisão é sua sem a sugestão'
  return [
    `- [ ] \`${candidato.nome}\` → aprovar como **etapa fora do cânone**`,
    `      _o motor julgou:_ ${julgamento}`,
    `      _visto em:_ ${candidato.evidencia.join(', ') || 'nenhum projeto'}`,
    `      _gravado como:_ ${candidato.nomes.join(', ')} (primeiro em \`${candidato.lista}\`)`,
    `      _ao lado de:_ ${candidato.vizinhos.filter((v) => !candidato.nomes.includes(v)).join(', ') || 'nada'}`,
    '      ```' + CERCA_ETAPA,
    `      ${JSON.stringify({ nome: candidato.nome })}`,
    '      ```',
    '',
  ].join('\n')
}

/**
 * A seção de fases da proposta (feature 015, RF-14, RF-21).
 * @param {{candidatos: object[], mesmas: object[], grafia: object[], recusados: object[]}} fases -
 *   os candidatos com caixa, os pares que o motor julgou `mesma`, os erros de
 *   grafia e o que o motor recusou.
 * @returns {string[]} as linhas da seção; vazia quando não há o que dizer.
 */
function escreverFases(fases) {
  const { candidatos = [], mesmas = [], grafia = [], recusados = [] } = fases ?? {}
  if (candidatos.length + grafia.length + recusados.length === 0) return []

  const linhas = ['## Fases: etapas fora do cânone', '']
  if (candidatos.length > 0) {
    linhas.push(
      'Nomes gravados em `phase`, `completed` ou `pending` que não são fase canônica, de encerramento',
      'nem de ciclo. Marque o que for etapa de trabalho de verdade. Cada nome marcado vira registro',
      'INDEPENDENTE no mapa: o agrupamento abaixo só põe lado a lado as grafias que o motor julgou',
      'serem o mesmo trabalho, para você decidi-las juntas. Aprovada a base, as variantes com sufixo',
      'numérico (`-c3`, `-005`) passam a ser reconhecidas sem aprovação própria.',
      '',
    )
    const porNome = new Map(candidatos.map((c) => [c.nome, c]))
    const grupos = agruparPorFecho([...porNome.keys()], mesmas)
    for (const grupo of grupos.filter((g) => g.length > 1)) {
      linhas.push(`### Mesma etapa, segundo o motor: ${grupo.join(', ')}`, '')
      for (const { a, b, razao } of mesmas.filter((m) => grupo.includes(m.a) && grupo.includes(m.b))) {
        linhas.push(`_o motor disse, sobre \`${a}\` e \`${b}\`:_ ${razao || 'nada'}`)
      }
      linhas.push('')
      for (const nome of grupo) linhas.push(itemDeEtapa(porNome.get(nome)))
    }
    const sozinhos = grupos.filter((g) => g.length === 1).map((g) => g[0])
    if (sozinhos.length > 0) {
      linhas.push('### Sem agrupamento', '')
      for (const nome of sozinhos) linhas.push(itemDeEtapa(porNome.get(nome)))
    }
    // O candidato que o motor ligou a uma etapa JÁ aprovada: a razão vai junto,
    // porque é comparação, e a comparação é a razão que a prova achou legível.
    const comAprovada = mesmas.filter((m) => porNome.has(m.a) !== porNome.has(m.b))
    if (comAprovada.length > 0) {
      linhas.push('### Parecidas com etapa já aprovada', '')
      for (const { a, b, razao } of comAprovada) {
        linhas.push(`- \`${a}\` e \`${b}\` — _o motor disse:_ ${razao || 'nada'}`)
      }
      linhas.push('')
    }
  }

  if (grafia.length > 0) {
    linhas.push(
      '### Erros de grafia sobre fase canônica',
      '',
      'Sem caixa, porque não há o que aprovar: o nome está a até dois caracteres de uma fase canônica.',
      'O painel continua mostrando a anomalia, e o remédio é corrigir o `state.json` na fonte.',
      '',
    )
    for (const erro of grafia) {
      linhas.push(`- \`${erro.nome}\`, ao lado de \`${erro.canonica}\` — visto em: ${erro.evidencia.join(', ')}`)
    }
    linhas.push('')
  }

  if (recusados.length > 0) {
    linhas.push(
      '### O que o motor recusou como fase',
      '',
      'Sem caixa: o motor julgou que o valor é de outra natureza (data, versão, arquivo, ferramenta, pessoa).',
      '',
    )
    for (const recusado of recusados) {
      linhas.push(`- \`${recusado.nome}\` — visto em: ${recusado.evidencia.join(', ')}`)
    }
    linhas.push('')
  }

  return linhas
}

/**
 * A proposta inteira, pronta para ser lida por gente.
 * @param {{pares: object[], chaves: object[], naoClassificados: object[], fases?: object}} entrada -
 *   o que a rodada apurou; `fases` é a seção da feature 015, e a sua ausência
 *   deixa a proposta como a 012 a escrevia.
 *   `raiz`, quando vem, fica anotada ao fim, em comentário.
 * @returns {string} o Markdown.
 */
function escreverProposta({ pares, chaves, naoClassificados, fases, raiz }) {
  const secaoDeFases = escreverFases(fases)
  const linhas = [
    '# Proposta de equivalências',
    '',
    'Cada item abaixo é uma **sugestão** do motor local, e nenhuma vale coisa alguma até você marcá-la.',
    'Marque a caixa do que aprovar, deixe desmarcado o que não convencer, e rode a promoção.',
    'Anote ao lado do item o que quiser: a promoção lê apenas as caixas e os blocos.',
    '',
  ]

  if (pares.length === 0 && chaves.length === 0 && secaoDeFases.length === 0) {
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

  linhas.push(...secaoDeFases)

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

  if (typeof raiz === 'string' && raiz !== '') linhas.push(`<!-- raiz: ${raiz} -->`, '')

  return linhas.join('\n')
}

/**
 * A raiz que o aprendizado varreu, relida da proposta.
 * @param {string} texto - a proposta.
 * @returns {string|null} a raiz anotada, ou null em proposta anterior à feature 015.
 */
function lerRaiz(texto) {
  const casou = MARCA_DA_RAIZ.exec(texto)
  return casou === null ? null : casou[1].trim()
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

/**
 * As etapas marcadas na seção de fases, e nada além delas (feature 015, RF-15).
 *
 * É função à parte de `lerMarcados` de propósito: o que ela devolve tem outra
 * forma, e quem promove checkpoints não precisa saber que fases existem. A
 * leitura é a mesma leitura burra: caixa marcada e, logo abaixo, o primeiro
 * bloco cercado. Não há noção de grupo aqui: marcar duas grafias do mesmo grupo
 * dá dois nomes, e a terceira, desmarcada, não vem.
 * @param {string} texto - a proposta como o usuário a devolveu.
 * @returns {{nome: string}[]} os nomes aprovados, na ordem do arquivo, sem repetição.
 */
function lerEtapasMarcadas(texto) {
  const etapas = []
  const linhas = texto.split('\n')

  for (let i = 0; i < linhas.length; i += 1) {
    if (!/^\s*- \[[xX]\]/.test(linhas[i])) continue

    for (let j = i + 1; j < linhas.length && j < i + 8; j += 1) {
      const abertura = linhas[j].trim()
      if (/^- \[[ xX]\]/.test(abertura)) break
      if (!abertura.startsWith('```')) continue
      if (abertura.slice(3).trim() !== CERCA_ETAPA) break
      try {
        const objeto = JSON.parse(linhas[j + 1]?.trim() ?? '')
        const nome = typeof objeto.nome === 'string' ? objeto.nome : ''
        if (nome !== '' && !etapas.some((e) => e.nome === nome)) etapas.push({ nome })
      } catch {
        // Bloco ilegível é item perdido, nunca rodada perdida.
      }
      break
    }
  }
  return etapas
}

module.exports = {
  agruparPorFecho,
  CERCA_CHAVE,
  CERCA_ETAPA,
  CERCA_PAR,
  LEITURA_LEGIVEL,
  escreverProposta,
  lerEtapasMarcadas,
  lerMarcados,
  lerRaiz,
}
