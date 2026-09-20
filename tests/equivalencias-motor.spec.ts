/**
 * O cliente do motor local, com o transporte substituído (T014, RF-10, RF-14).
 *
 * Nenhum caso aqui liga para lugar algum: o transporte é injetado, e é por
 * isso que a suíte inteira passa com o motor desligado, que é um dos itens do
 * critério de pronto. O que se confere é o contrato de
 * `interfaces/motor-local.md`, incluindo os quatro desfechos de erro.
 * @module tests/equivalencias-motor
 */

import { describe, expect, it, vi } from 'vitest'
import { MODELO_PADRAO, criarClassificador } from '../scripts/equivalencias/motor.js'

/** Um transporte que devolve o que o caso mandar. */
function transporteFixo(conteudo: unknown) {
  return vi.fn(async () => ({ message: { content: typeof conteudo === 'string' ? conteudo : JSON.stringify(conteudo) } }))
}

const CHECKPOINT = { status: 'concluido', at: '2026-09-12T09:02:59' }

describe('o cliente do motor', () => {
  it('devolve a classificação quando o motor responde o que promete', async () => {
    const transporte = transporteFixo({ campo: 'status', valor: 'concluido', leitura: 'concluido', razao: 'campo de status' })
    const classificar = criarClassificador({ transporte })

    expect(await classificar(CHECKPOINT)).toEqual({
      campo: 'status',
      valor: 'concluido',
      leitura: 'concluido',
      razao: 'campo de status',
    })
  })

  it('pede temperatura zero e semente fixa, para que a mesma entrada dê a mesma sugestão', async () => {
    const transporte = transporteFixo({ campo: 'status', valor: 'concluido', leitura: 'concluido', razao: 'x' })
    await criarClassificador({ transporte })(CHECKPOINT)

    const pedido = transporte.mock.calls[0][0] as { options: { temperature: number; seed: number }; format: string }
    expect(pedido.options.temperature).toBe(0)
    expect(typeof pedido.options.seed).toBe('number')
    expect(pedido.format).toBe('json')
  })

  it('usa o modelo declarado, e o padrão quando nenhum foi dito', async () => {
    const transporte = transporteFixo({ campo: null, valor: null, leitura: 'nao-e-sinal', razao: 'x' })
    await criarClassificador({ transporte })(CHECKPOINT)
    await criarClassificador({ transporte, modelo: 'outro:9b' })(CHECKPOINT)

    expect((transporte.mock.calls[0][0] as { model: string }).model).toBe(MODELO_PADRAO)
    expect((transporte.mock.calls[1][0] as { model: string }).model).toBe('outro:9b')
  })

  it('devolve nulo quando a resposta não é JSON válido, em vez de estourar a rodada', async () => {
    const classificar = criarClassificador({ transporte: transporteFixo('não sou json') })

    expect(await classificar(CHECKPOINT)).toBeNull()
  })

  it('nomeia o campo em foco na pergunta, e manda o checkpoint só como contexto', async () => {
    const transporte = transporteFixo({ campo: 'at', valor: 'x', leitura: 'nao-e-sinal', razao: 'instante' })
    await criarClassificador({ transporte })(CHECKPOINT, 'at')

    const pedido = transporte.mock.calls[0][0] as { messages: { content: string }[] }
    const enviado = JSON.parse(pedido.messages[1].content)
    expect(enviado.campo_em_foco).toBe('at')
    expect(enviado.checkpoint).toEqual(CHECKPOINT)
  })

  it('DESCARTA a resposta que fala de outro campo que não o em foco', async () => {
    // O defeito que este caso fixa custou três dos sete vocabulários medidos na
    // primeira rodada real: perguntado sobre `at`, o modelo respondia sobre
    // `status`, que é o campo mais evidente do checkpoint. A resposta é sobre
    // outra coisa, e aproveitá-la escreveria no mapa um par que ninguém julgou.
    const transporte = transporteFixo({ campo: 'status', valor: 'concluido', leitura: 'concluido', razao: 'x' })
    const classificar = criarClassificador({ transporte })

    expect(await classificar(CHECKPOINT, 'at')).toBeNull()
    expect(await classificar(CHECKPOINT, 'status')).not.toBeNull()
  })

  it('DESCARTA a resposta que nomeia campo ausente do checkpoint enviado', async () => {
    const transporte = transporteFixo({ campo: 'inventado', valor: 'x', leitura: 'concluido', razao: 'x' })
    const classificar = criarClassificador({ transporte })

    expect(await classificar(CHECKPOINT)).toBeNull()
  })

  it('devolve nulo quando a leitura vem fora do vocabulário de quatro valores', async () => {
    const transporte = transporteFixo({ campo: 'status', valor: 'concluido', leitura: 'talvez', razao: 'x' })

    expect(await criarClassificador({ transporte })(CHECKPOINT)).toBeNull()
  })

  it('devolve nulo quando o tempo-limite estoura, e não tenta de novo por conta própria', async () => {
    const transporte = vi.fn(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50))
      return { message: { content: '{}' } }
    })
    const classificar = criarClassificador({ transporte, tempoLimite: 10 })

    expect(await classificar(CHECKPOINT)).toBeNull()
    expect(transporte).toHaveBeenCalledTimes(1)
  })

  it('propaga a falha de transporte como causa nomeada, e não como nulo', async () => {
    const transporte = vi.fn(async () => {
      throw new Error('connect ECONNREFUSED 127.0.0.1:11434')
    })
    const classificar = criarClassificador({ transporte })

    await expect(classificar(CHECKPOINT)).rejects.toThrow(/ECONNREFUSED/)
  })
})
