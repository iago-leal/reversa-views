/**
 * O julgamento da herança: função pura sobre o estado já lido.
 *
 * Nada aqui abre arquivo. A camada de leitura entrega o manifesto, as
 * adaptações, o que está no disco e o que se conseguiu ver das origens; este
 * módulo apenas confronta e classifica. É o que permite testar a sexta situação
 * difícil sem precisar de um clone da origem à mão.
 *
 * Dois modos convivem (D-08). O local roda sempre, porque só olha o que está
 * versionado aqui, e por isso pode entrar no build (RF-19). O completo
 * acrescenta o confronto com as origens, e depende de máquina configurada.
 * @module scripts/heranca/verificar
 */

const { aplicar } = require('./adaptacoes')
const { conteudoHerdado, lerCarimbo, resumoDe, temCarimbo } = require('./carimbo')

/** Achados que reprovam a árvore: alguém precisa decidir algo antes de seguir. */
const IMPEDEM = new Set([
  'editado-localmente',
  'sem-carimbo',
  'carimbo-inconsistente',
  'nao-manifestado',
  'ausente-do-disco',
  'adaptacao-nao-casa',
])

/**
 * Monta um achado já classificado pela severidade que o tipo carrega.
 * @param {string} tipo - o nome do achado.
 * @param {{caminho?: string|null, origem?: string|null, detalhe: string}} campos - o resto.
 * @returns {object} o achado.
 */
function achar(tipo, campos) {
  return {
    tipo,
    caminho: campos.caminho ?? null,
    origem: campos.origem ?? null,
    detalhe: campos.detalhe,
    severidade: IMPEDEM.has(tipo) ? 'impede' : 'informa',
  }
}

/**
 * As adaptações de um arquivo, na ordem em que foram declaradas.
 * @param {{adaptacoes: object[]}} adaptacoes - o arquivo de adaptações inteiro.
 * @param {string[]} ids - os identificadores que a entrada cita.
 * @returns {object[]} os itens correspondentes.
 */
function adaptacoesDe(adaptacoes, ids) {
  const citadas = new Set(ids ?? [])
  return (adaptacoes?.adaptacoes ?? []).filter((item) => citadas.has(item.id))
}

/**
 * As seis conferências que não dependem de origem alguma.
 * @param {object} entrada - a entrada do manifesto.
 * @param {object} origem - a origem a que ela pertence.
 * @param {string|null|undefined} conteudo - o que está no disco.
 * @returns {object[]} os achados daquele arquivo.
 */
function julgarLocalmente(entrada, origem, conteudo) {
  const caminho = entrada.caminho
  const nome = entrada.origem

  if (conteudo === null || conteudo === undefined) {
    return [
      achar('ausente-do-disco', {
        caminho,
        origem: nome,
        detalhe: 'o manifesto declara este arquivo, e ele não está no disco',
      }),
    ]
  }

  const carimbado = entrada.carimbado !== false
  if (carimbado && !temCarimbo(conteudo)) {
    return [
      achar('sem-carimbo', {
        caminho,
        origem: nome,
        detalhe: 'arquivo herdado sem o carimbo de sete linhas',
      }),
    ]
  }

  if (carimbado) {
    const carimbo = lerCarimbo(conteudo)
    const divergencias = []
    if (carimbo.caminho !== entrada.caminhoNaOrigem) {
      divergencias.push(
        `o carimbo diz vir de ${carimbo.caminho}, e o manifesto diz ${entrada.caminhoNaOrigem}`,
      )
    }
    if (carimbo.origem !== nome) {
      divergencias.push(`o carimbo diz origem ${carimbo.origem}, e o manifesto diz ${nome}`)
    }
    if (origem?.tipo === 'codigo' && carimbo.revisao !== origem.revisao) {
      divergencias.push(
        `o carimbo diz revisão ${carimbo.revisao}, e o manifesto diz ${origem.revisao}`,
      )
    }
    const declaradas = (entrada.adaptacoes ?? []).join(', ')
    const carimbadas = carimbo.adaptacoes.join(', ')
    if (declaradas !== carimbadas) {
      divergencias.push(
        `o carimbo declara as adaptações [${carimbadas}], e o manifesto declara [${declaradas}]`,
      )
    }
    if (divergencias.length > 0) {
      return [
        achar('carimbo-inconsistente', {
          caminho,
          origem: nome,
          detalhe: divergencias.join('; '),
        }),
      ]
    }
  }

  const achados = []
  const herdado = conteudoHerdado(conteudo, carimbado)
  if (resumoDe(herdado) !== entrada.resumo) {
    achados.push(
      achar('editado-localmente', {
        caminho,
        origem: nome,
        detalhe:
          'o conteúdo difere do resumo do manifesto: declare a adaptação ou descarte a edição',
      }),
    )
  }
  if (entrada.paridadeExterna) {
    achados.push(
      achar('paridade-externa', {
        caminho,
        origem: nome,
        detalhe: `este arquivo é o espelho de ${entrada.paridadeExterna}, e os dois andam juntos`,
      }),
    )
  }
  return achados
}

/**
 * O confronto de uma origem de código com a árvore local.
 * @param {object} origem - a origem, como o manifesto a declara.
 * @param {object} resolvida - o que se leu dela nesta máquina.
 * @param {object[]} entradas - as entradas daquela origem.
 * @param {object} adaptacoes - o arquivo de adaptações.
 * @param {Set<string>} jaImpedidos - caminhos já reprovados pelo julgamento local.
 * @returns {object[]} os achados da origem.
 */
function julgarOrigemDeCodigo(origem, resolvida, entradas, adaptacoes, jaImpedidos) {
  const achados = []
  const daOrigem = resolvida.arquivos ?? {}

  for (const entrada of entradas) {
    if (jaImpedidos.has(entrada.caminho)) continue
    const naOrigem = daOrigem[entrada.caminhoNaOrigem]
    if (naOrigem === undefined) {
      achados.push(
        achar('origem-avancou', {
          caminho: entrada.caminho,
          origem: origem.nome,
          detalhe: `${entrada.caminhoNaOrigem} não está mais na origem`,
        }),
      )
      continue
    }
    const aplicada = aplicar(naOrigem, adaptacoesDe(adaptacoes, entrada.adaptacoes))
    if (!aplicada.ok) {
      achados.push(
        achar('adaptacao-nao-casa', {
          caminho: entrada.caminho,
          origem: origem.nome,
          detalhe: `a adaptação ${aplicada.id} está ${aplicada.motivo} no conteúdo atual da origem (${aplicada.ocorrencias} ocorrências)`,
        }),
      )
      continue
    }
    if (resumoDe(aplicada.conteudo) !== entrada.resumo) {
      achados.push(
        achar('origem-avancou', {
          caminho: entrada.caminho,
          origem: origem.nome,
          detalhe: 'a origem mudou este arquivo desde a cópia',
        }),
      )
    }
  }

  for (const novo of resolvida.extras ?? []) {
    achados.push(
      achar('novo-na-origem', {
        caminho: novo,
        origem: origem.nome,
        detalhe: 'existe na origem e não foi herdado: copiar é decisão sua',
      }),
    )
  }

  const corrente = resolvida.revisaoCorrente
  if (corrente && origem.revisao && corrente !== origem.revisao) {
    achados.push(
      achar('origem-avancou', {
        origem: origem.nome,
        detalhe: `a origem está em ${corrente}, e a cópia veio de ${origem.revisao}`,
      }),
    )
  }
  return achados
}

/**
 * Julga a árvore herdada inteira.
 * @param {{manifesto: object, adaptacoes: object, local: {arquivos: object, extras: string[]},
 *   origens: object|null}} estado - tudo o que a leitura conseguiu apurar.
 * @returns {{modo: string, blocos: object[], achados: object[], veredito: string,
 *   impede: boolean}} o julgamento.
 */
function julgar(estado) {
  const { manifesto, adaptacoes, local, origens } = estado
  const modo = origens ? 'completo' : 'local'
  const porOrigem = new Map(manifesto.origens.map((origem) => [origem.nome, []]))
  const achados = []
  const impedidos = new Set()

  const registrar = (nome, lista) => {
    for (const achado of lista) {
      achados.push(achado)
      if (achado.severidade === 'impede' && achado.caminho) impedidos.add(achado.caminho)
      const balde = porOrigem.get(nome)
      if (balde) balde.push(achado)
    }
  }

  for (const entrada of manifesto.arquivos) {
    const origem = manifesto.origens.find((item) => item.nome === entrada.origem)
    registrar(entrada.origem, julgarLocalmente(entrada, origem, local.arquivos[entrada.caminho]))
  }

  const daCasa = manifesto.origens.find((origem) => origem.tipo === 'codigo')
  for (const intruso of local.extras ?? []) {
    registrar(
      daCasa?.nome,
      [
        achar('nao-manifestado', {
          caminho: intruso,
          origem: null,
          detalhe: 'está sob a pasta da herança e não consta do manifesto',
        }),
      ],
    )
  }

  for (const origem of manifesto.origens) {
    if (!origens) continue
    const resolvida = origens[origem.nome]
    if (!resolvida || resolvida.estado !== 'disponivel') {
      const onde = resolvida?.caminho ? ` (${resolvida.caminho})` : ''
      registrar(origem.nome, [
        achar('origem-indisponivel', {
          origem: origem.nome,
          detalhe: `${origem.nome} não está ao alcance: ${resolvida?.motivo ?? 'não resolvida'}${onde}`,
        }),
      ])
      continue
    }
    if (origem.tipo === 'padrao') {
      const corrente = resolvida.versaoCorrente
      if (corrente && origem.versaoObservada && corrente !== origem.versaoObservada) {
        registrar(origem.nome, [
          achar('origem-avancou', {
            origem: origem.nome,
            detalhe: `o kit está em ${corrente}, e a observação registrada é da ${origem.versaoObservada}`,
          }),
        ])
      }
      continue
    }
    const entradas = manifesto.arquivos.filter((entrada) => entrada.origem === origem.nome)
    registrar(
      origem.nome,
      julgarOrigemDeCodigo(origem, resolvida, entradas, adaptacoes, impedidos),
    )
  }

  const blocos = manifesto.origens.map((origem) => {
    const seus = porOrigem.get(origem.nome) ?? []
    const resolvida = origens ? origens[origem.nome] : null
    let estadoDoBloco = 'alinhado'
    if (!origens) estadoDoBloco = 'nao-verificado'
    else if (!resolvida || resolvida.estado !== 'disponivel') estadoDoBloco = 'indisponivel'
    else if (seus.length > 0) estadoDoBloco = 'divergente'
    return { origem: origem.nome, tipo: origem.tipo, estado: estadoDoBloco, achados: seus }
  })

  const impede = achados.some((achado) => achado.severidade === 'impede')
  let veredito = 'alinhado'
  if (impede) veredito = 'impedido'
  else if (achados.length > 0) veredito = 'divergente'

  return { modo, blocos, achados, veredito, impede }
}

module.exports = { IMPEDEM, julgar }
