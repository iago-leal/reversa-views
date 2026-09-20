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
 * Monta o classificador, com o transporte que o chamador quiser.
 * @param {{transporte?: Function, modelo?: string, tempoLimite?: number}} opcoes -
 *   o transporte (a suíte passa um duplo), o modelo e o tempo-limite.
 * @returns {(checkpoint: Record<string, unknown>, campoEmFoco?: string) => Promise<object|null>}
 *   o classificador.
 */
function criarClassificador(opcoes = {}) {
  const transporte = opcoes.transporte ?? transporteReal
  const modelo = opcoes.modelo ?? MODELO_PADRAO
  const tempoLimite = opcoes.tempoLimite ?? TEMPO_LIMITE_PADRAO

  return async function classificar(checkpoint, campoEmFoco = null) {
    // O checkpoint inteiro segue junto como contexto, porque `status` ao lado
    // de `modules_pending` diz mais do que `status` sozinho. O que muda é a
    // pergunta: ela nomeia o campo sobre o qual se quer a resposta.
    const conteudo =
      campoEmFoco === null
        ? JSON.stringify(checkpoint)
        : JSON.stringify({ campo_em_foco: campoEmFoco, checkpoint })
    const pedido = {
      model: modelo,
      format: 'json',
      stream: false,
      options: { temperature: 0, seed: SEMENTE },
      messages: [
        { role: 'system', content: SISTEMA },
        { role: 'user', content: conteudo },
      ],
    }

    // O tempo-limite corre aqui e não no transporte, para que o duplo da suíte
    // o exercite igual. Estourado, o par entra na lista dos não classificados
    // e a rodada segue: retentativa automática esconderia quantas vezes o
    // motor falhou, e numa ferramenta conduzida por uma pessoa repetir a
    // rodada é mais barato e muito mais legível.
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

    let bruto
    try {
      bruto = JSON.parse(corpo?.message?.content ?? '')
    } catch {
      return null
    }
    return validar(bruto, checkpoint, campoEmFoco)
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
  MODELO_PADRAO,
  SISTEMA,
  TEMPO_LIMITE_PADRAO,
  TempoEsgotado,
  criarClassificador,
  validar,
}
