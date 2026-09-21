/**
 * O cliente do motor de inferência local (T026, RF-10, RF-14).
 *
 * É o ÚNICO arquivo deste repositório que fala com um serviço, e ele não é
 * embarcado no pacote: mora em `scripts/`, que o `.vscodeignore` exclui. A
 * extensão continua sem conhecer rede alguma, e a frase da seção 12 da spec da
 * leitura continua verdadeira ao pé da letra.
 *
 * O transporte é injetável, e é por isso que a suíte inteira passa com o motor
 * desligado. Substituí-lo não é conveniência de teste: é o que permite afirmar,
 * sem rodar nada, o que acontece em cada um dos quatro desfechos de erro que
 * `interfaces/motor-local.md` declara.
 *
 * Nada aqui aprova coisa alguma. Toda resposta é SUGESTÃO, e a distância entre
 * sugerir e decidir é a feature inteira.
 * @module scripts/equivalencias/motor
 */

/** O endereço do motor, no próprio computador e em lugar nenhum além dele. */
const ENDERECO = 'http://localhost:11434/api/chat'

/** O modelo que acertou os treze casos da prova de viabilidade de 2026-09-20. */
const MODELO_PADRAO = 'qwen2.5:7b'

/** Sessenta segundos contra os três de uma classificação: folga de vinte vezes, e finita. */
const TEMPO_LIMITE_PADRAO = 60_000

/** A semente fixa, para que a mesma entrada dê a mesma sugestão em toda rodada. */
const SEMENTE = 7

/** O vocabulário de quatro valores, que a prova mostrou ser o que evita o erro do binário. */
const LEITURAS = new Set(['concluido', 'falhou', 'em-andamento', 'nao-e-sinal'])

const SISTEMA = `Você classifica checkpoints de um arquivo .reversa/state.json.

O esquema canônico declara conclusão APENAS com o campo "completed_at" (um instante ISO).
Trabalho parcial em curso é declarado com "modules_pending" não vazio.

Alguns arquivos foram escritos fora do esquema e declaram a conclusão com outro nome.
Sua tarefa: dizer se o CAMPO EM FOCO, e nenhum outro, fala do ESTADO do agente.

A mensagem traz {"campo_em_foco": "<nome>", "checkpoint": {...}}. Responda SEMPRE sobre o campo
em foco: os demais campos estão ali só como contexto. Se o campo em foco não fala de estado,
responda com o próprio nome dele e leitura "nao-e-sinal".

Responda SOMENTE com JSON:
{"campo": "<nome>"|null, "valor": <valor exato>|null, "leitura": "concluido"|"falhou"|"em-andamento"|"nao-e-sinal", "razao": "<max 12 palavras>"}

Regras:
- Um instante sozinho (ex.: "at", "date") NÃO declara conclusão: registra quando algo aconteceu.
- Um campo de situação com valor que signifique concluído (ex.: status: "concluido") declara.
- Um campo booleano de conclusão verdadeiro (ex.: done: true) declara.
- Um campo que nomeia o instante da conclusão (ex.: "concluido_em") declara.
- Um status de falha ou erro é "falhou", nunca "concluido".
- modules_pending vazio NÃO declara conclusão: é ausência de pendência, não afirmação de fim.
- Campos de conteúdo (achados, outputs, files, notas) NUNCA declaram estado.
- O campo respondido é SEMPRE o campo em foco, nunca outro.
- Na dúvida, leitura="nao-e-sinal".`

/** As duas respostas da pergunta de natureza (feature 015). */
const LEITURAS_DE_NATUREZA = new Set(['etapa', 'nao-e-fase'])

/** As duas respostas da pergunta de comparação (feature 015). */
const LEITURAS_DE_COMPARACAO = new Set(['mesma', 'diferentes'])

/**
 * O enunciado da natureza, o da rodada 3A da prova de viabilidade, sem
 * alteração. O que o faz funcionar é a classe negativa FECHADA e a frase "na
 * dúvida, etapa": sem ela o motor errou quatro dos oito nomes reais.
 */
const SISTEMA_DA_NATUREZA = `Você examina um valor encontrado numa lista de fases de um arquivo .reversa/state.json.
As fases canônicas são: reconhecimento, escavacao, interpretacao, geracao, revisao. Projetos também
gravam ali etapas de trabalho fora do cânone, com nomes livres em português (um substantivo de ação
ou de entrega, às vezes composto com hífen).
A mensagem traz {"nome_em_foco": "<valor>", "vizinhos": [...]}.
Responda "nao-e-fase" SOMENTE se o valor for claramente de outra natureza: data, número de versão,
booleano, nome de arquivo, nome de ferramenta ou de produto, nome de pessoa.
Em todos os outros casos, responda "etapa". Na dúvida, "etapa".
Responda SOMENTE com JSON: {"nome": "<nome em foco>", "leitura": "etapa"|"nao-e-fase", "razao": "<max 12 palavras>"}`

/** O enunciado da comparação, o da rodada 3B da prova, sem alteração. */
const SISTEMA_DA_COMPARACAO = `Você compara dois nomes de etapa de trabalho gravados por projetos diferentes, em português.
A mensagem traz {"a": "<nome>", "b": "<nome>"}.
Responda "mesma" SOMENTE se os dois nomes designam o mesmo trabalho com grafias diferentes (um
abrevia o outro, ou só muda uma preposição). Trabalhos diferentes são "diferentes", mesmo que as
palavras se pareçam.
Responda SOMENTE com JSON: {"a": "<a>", "b": "<b>", "leitura": "mesma"|"diferentes", "razao": "<max 12 palavras>"}`

/** O transporte de verdade, que é o único lugar com `fetch` no repositório. */
async function transporteReal(pedido, sinal) {
  const resposta = await fetch(ENDERECO, {
    method: 'POST',
    body: JSON.stringify(pedido),
    signal: sinal,
  })
  if (!resposta.ok) throw new Error(`o motor respondeu ${resposta.status}`)
  return resposta.json()
}

/**
 * Se a classificação é utilizável, dado o que foi perguntado.
 *
 * A checagem do campo não é zelo excessivo: um modelo que inventa campo está
 * respondendo sobre outra coisa, e aproveitar isso seria construir o mapa
 * sobre alucinação. Descartar é a resposta certa, e corrigir seria pior.
 *
 * Havendo campo em foco, a exigência aperta: a resposta precisa ser sobre ELE.
 * Sem esse aperto, a primeira rodada real perdeu três dos sete vocabulários
 * medidos, porque o modelo respondia sempre pelo campo mais evidente do
 * checkpoint e a resposta era descartada por falar de outro campo.
 * @param {unknown} bruto - o que veio no corpo da resposta.
 * @param {Record<string, unknown>} checkpoint - o que foi perguntado.
 * @param {string|null} campoEmFoco - o campo sobre o qual se perguntou, se houve um.
 * @returns {object|null} a classificação, ou nulo.
 */
function validar(bruto, checkpoint, campoEmFoco = null) {
  if (bruto === null || typeof bruto !== 'object') return null
  const { campo, valor, leitura, razao } = bruto
  if (typeof leitura !== 'string' || !LEITURAS.has(leitura)) return null
  if (campo === null || campo === undefined) return null
  if (typeof campo !== 'string' || !(campo in checkpoint)) return null
  if (campoEmFoco !== null && campo !== campoEmFoco) return null
  return { campo, valor: valor ?? null, leitura, razao: typeof razao === 'string' ? razao : '' }
}

/**
 * Monta a pergunta ao motor: o pedido e o tempo-limite, que são os mesmos para
 * os três classificadores (feature 015, D-15). Fatorados aqui para que a frase
 * do cabeçalho continue verdadeira ao pé da letra: um arquivo só fala com o
 * serviço, e dentro dele um lugar só monta o pedido.
 *
 * O tempo-limite corre aqui e não no transporte, para que o duplo da suíte o
 * exercite igual. Estourado, a pergunta vira não classificada e a rodada
 * segue: retentativa automática esconderia quantas vezes o motor falhou, e
 * numa ferramenta conduzida por uma pessoa repetir a rodada é mais barato e
 * muito mais legível.
 * @param {{transporte?: Function, modelo?: string, tempoLimite?: number}} opcoes -
 *   o transporte (a suíte passa um duplo), o modelo e o tempo-limite.
 * @returns {(sistema: string, conteudo: string) => Promise<unknown>} a pergunta,
 *   que devolve o JSON da resposta, ou null no estouro de tempo e no corpo
 *   inválido, e PROPAGA a falha de transporte.
 */
function criarPergunta(opcoes = {}) {
  const transporte = opcoes.transporte ?? transporteReal
  const modelo = opcoes.modelo ?? MODELO_PADRAO
  const tempoLimite = opcoes.tempoLimite ?? TEMPO_LIMITE_PADRAO

  return async function perguntar(sistema, conteudo) {
    const pedido = {
      model: modelo,
      format: 'json',
      stream: false,
      options: { temperature: 0, seed: SEMENTE },
      messages: [
        { role: 'system', content: sistema },
        { role: 'user', content: conteudo },
      ],
    }

    const relogio = new AbortController()
    const alarme = setTimeout(() => relogio.abort(), tempoLimite)
    let corpo
    try {
      corpo = await Promise.race([
        transporte(pedido, relogio.signal),
        new Promise((_, rejeitar) => setTimeout(() => rejeitar(new TempoEsgotado()), tempoLimite)),
      ])
    } catch (erro) {
      if (erro instanceof TempoEsgotado) return null
      throw erro
    } finally {
      clearTimeout(alarme)
    }

    try {
      return JSON.parse(corpo?.message?.content ?? '')
    } catch {
      return null
    }
  }
}

/**
 * Monta o classificador de checkpoints, com o transporte que o chamador quiser.
 * @param {{transporte?: Function, modelo?: string, tempoLimite?: number}} opcoes -
 *   o transporte (a suíte passa um duplo), o modelo e o tempo-limite.
 * @returns {(checkpoint: Record<string, unknown>, campoEmFoco?: string) => Promise<object|null>}
 *   o classificador.
 */
function criarClassificador(opcoes = {}) {
  const perguntar = criarPergunta(opcoes)

  return async function classificar(checkpoint, campoEmFoco = null) {
    // O checkpoint inteiro segue junto como contexto, porque `status` ao lado
    // de `modules_pending` diz mais do que `status` sozinho. O que muda é a
    // pergunta: ela nomeia o campo sobre o qual se quer a resposta.
    const conteudo =
      campoEmFoco === null
        ? JSON.stringify(checkpoint)
        : JSON.stringify({ campo_em_foco: campoEmFoco, checkpoint })
    const bruto = await perguntar(SISTEMA, conteudo)
    return bruto === null ? null : validar(bruto, checkpoint, campoEmFoco)
  }
}

/**
 * Se a resposta da natureza é utilizável: sobre o nome perguntado, e com uma
 * das duas leituras. O que não passa é DESCARTADO, nunca corrigido.
 * @param {unknown} bruto - o que veio no corpo da resposta.
 * @param {string} nome - o nome perguntado.
 * @returns {{nome: string, leitura: string, razao: string}|null} a resposta, ou nulo.
 */
function validarNatureza(bruto, nome) {
  if (bruto === null || typeof bruto !== 'object') return null
  if (bruto.nome !== nome) return null
  if (typeof bruto.leitura !== 'string' || !LEITURAS_DE_NATUREZA.has(bruto.leitura)) return null
  return { nome, leitura: bruto.leitura, razao: typeof bruto.razao === 'string' ? bruto.razao : '' }
}

/**
 * Se a resposta da comparação é utilizável: repete o par, na ordem perguntada,
 * e traz uma das duas leituras.
 * @param {unknown} bruto - o que veio no corpo da resposta.
 * @param {string} a - o primeiro nome do par.
 * @param {string} b - o segundo.
 * @returns {{a: string, b: string, leitura: string, razao: string}|null} a resposta, ou nulo.
 */
function validarComparacao(bruto, a, b) {
  if (bruto === null || typeof bruto !== 'object') return null
  if (bruto.a !== a || bruto.b !== b) return null
  if (typeof bruto.leitura !== 'string' || !LEITURAS_DE_COMPARACAO.has(bruto.leitura)) return null
  return { a, b, leitura: bruto.leitura, razao: typeof bruto.razao === 'string' ? bruto.razao : '' }
}

/**
 * Monta as duas perguntas da passagem das fases (feature 015, RF-13).
 *
 * São duas perguntas de duas respostas, e não uma de três, porque a prova de
 * viabilidade reprovou a pergunta única com 6 de 14: o que o valor É e com quem
 * ele SE PARECE são julgamentos de natureza diferente, e o modelo de 7 B não os
 * separa dentro de uma resposta só.
 *
 * Do `state.json` alheio chegam aqui só o nome candidato, já sem o sufixo
 * numérico, e os vizinhos já filtrados pela forma de identificador. Nenhuma
 * chave de topo, nenhum checkpoint e nenhum caminho acompanham a pergunta.
 * @param {{transporte?: Function, modelo?: string, tempoLimite?: number}} opcoes -
 *   as mesmas do classificador de checkpoints.
 * @returns {{natureza: Function, comparar: Function}} as duas perguntas.
 */
function criarClassificadorDeFases(opcoes = {}) {
  const perguntar = criarPergunta(opcoes)

  return {
    async natureza(nome, vizinhos = []) {
      const bruto = await perguntar(SISTEMA_DA_NATUREZA, JSON.stringify({ nome_em_foco: nome, vizinhos }))
      return validarNatureza(bruto, nome)
    },
    async comparar(a, b) {
      const bruto = await perguntar(SISTEMA_DA_COMPARACAO, JSON.stringify({ a, b }))
      return validarComparacao(bruto, a, b)
    },
  }
}

/** O estouro do tempo-limite, que é desfecho previsto e não falha de transporte. */
class TempoEsgotado extends Error {
  constructor() {
    super('o motor não respondeu dentro do tempo-limite')
    this.name = 'TempoEsgotado'
  }
}

module.exports = {
  ENDERECO,
  LEITURAS,
  LEITURAS_DE_COMPARACAO,
  LEITURAS_DE_NATUREZA,
  MODELO_PADRAO,
  SISTEMA,
  SISTEMA_DA_COMPARACAO,
  SISTEMA_DA_NATUREZA,
  TEMPO_LIMITE_PADRAO,
  TempoEsgotado,
  criarClassificador,
  criarClassificadorDeFases,
  validar,
  validarComparacao,
  validarNatureza,
}
