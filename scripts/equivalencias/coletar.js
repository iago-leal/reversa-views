/**
 * O coletor dos pares que ainda precisam de decisão (T027, RF-09, RF-13).
 *
 * Ele decide o que vale perguntar, e a decisão tem preço: cada par inédito
 * custa cerca de três segundos de motor. Perguntar de novo o que já foi
 * decidido seria pagar duas vezes pela mesma resposta.
 *
 * Nada aqui toca disco. Os estados chegam já lidos, na forma em que a casca do
 * comando os entrega, e o que volta é só o que precisa de gente.
 *
 * As duas regras do esquema valem aqui como valem na leitura: checkpoint com
 * `completed_at` está resolvido, e checkpoint com `modules_pending` povoado é
 * trabalho parcial declarado. Nenhum dos dois vira pergunta.
 * @module scripts/equivalencias/coletar
 */

/** Os campos que o esquema já conhece, e que não são pergunta para ninguém. */
const CONHECIDAS = new Set(['completed_at', 'files', 'modules_analyzed', 'modules_pending'])

/** O valor comparável, na mesma regra da leitura: caixa e bordas, nunca acentuação. */
function valorComparavel(valor) {
  if (typeof valor === 'string') return valor.trim().toLowerCase()
  if (typeof valor === 'boolean' || typeof valor === 'number') return String(valor)
  return null
}

/** Se o checkpoint já está resolvido pelas duas regras do esquema. */
function resolvidoPeloEsquema(entry) {
  if (typeof entry.completed_at === 'string' && entry.completed_at.length > 0) return true
  return Array.isArray(entry.modules_pending) && entry.modules_pending.length > 0
}

/** Os pares campo mais valor que um checkpoint oferece à decisão. */
function paresDoCheckpoint(entry) {
  const pares = []
  for (const [campo, bruto] of Object.entries(entry)) {
    if (CONHECIDAS.has(campo)) continue
    const valor = valorComparavel(bruto)
    if (valor === null) continue
    pares.push({ campo, valor })
  }
  return pares
}

/**
 * O que ainda precisa de decisão, a partir dos estados lidos.
 *
 * A evidência é acumulada e ordenada: dois projetos com o mesmo par produzem
 * um item só, nomeando os dois. É o que permite julgar o alcance de uma
 * aprovação antes de dá-la.
 * @param {{estados: {projeto: string, stateJson: string}[], mapa: object}} entrada -
 *   os estados lidos e o mapa já aprovado.
 * @returns {{pares: object[], chaves: object[]}} o que é inédito, em ordem estável.
 */
function coletar({ estados, mapa }) {
  const pares = new Map()
  const chaves = new Map()
  const jaDecidido = new Set(mapa.pares.map((p) => `${p.campo}\u0000${p.valor}`))
  const chaveDecidida = new Set(mapa.naoAgentes.map((r) => r.chave))

  for (const { projeto, stateJson } of estados) {
    let estado
    try {
      estado = JSON.parse(stateJson)
    } catch {
      // Um projeto com `state.json` quebrado não para a rodada: ele é um dos
      // sessenta e quatro, e os outros sessenta e três têm o que dizer.
      continue
    }
    const checkpoints = estado?.checkpoints
    if (checkpoints === null || typeof checkpoints !== 'object') continue

    for (const [chave, bruto] of Object.entries(checkpoints)) {
      if (bruto === null || typeof bruto !== 'object' || Array.isArray(bruto)) continue
      if (resolvidoPeloEsquema(bruto)) continue

      const doCheckpoint = paresDoCheckpoint(bruto)
      if (doCheckpoint.length === 0) continue

      // Uma entrada sem par algum a oferecer não existe: toda entrada tem ao
      // menos um campo. O que a torna candidata a "não é agente" é a decisão
      // humana, e por isso ela entra nas DUAS listas da proposta, e quem
      // resolve é quem marca.
      if (!chaveDecidida.has(chave)) {
        const atual = chaves.get(chave) ?? { chave, evidencia: new Set(), exemplo: bruto }
        atual.evidencia.add(projeto)
        chaves.set(chave, atual)
      }

      for (const { campo, valor } of doCheckpoint) {
        const id = `${campo}\u0000${valor}`
        if (jaDecidido.has(id)) continue
        // O checkpoint em que o par apareceu primeiro viaja junto: é ele que
        // o aprendizado elide e pergunta ao motor. Guardá-lo aqui evita uma
        // segunda varredura do disco só para reencontrar o que já foi lido.
        const atual = pares.get(id) ?? { campo, valor, evidencia: new Set(), exemplo: bruto }
        atual.evidencia.add(projeto)
        pares.set(id, atual)
      }
    }
  }

  const ordenar = (lista, chaveDeOrdem) =>
    lista
      .map((item) => ({ ...item, evidencia: [...item.evidencia].sort() }))
      .sort((a, b) => chaveDeOrdem(a).localeCompare(chaveDeOrdem(b)))

  return {
    pares: ordenar([...pares.values()], (p) => `${p.campo}\u0000${p.valor}`),
    chaves: ordenar([...chaves.values()], (c) => c.chave),
  }
}

module.exports = { CONHECIDAS, coletar, paresDoCheckpoint, resolvidoPeloEsquema, valorComparavel }
