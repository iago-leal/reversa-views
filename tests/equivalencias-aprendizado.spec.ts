/**
 * As duas passagens do aprendizado, com o motor substituído (RF-09, RF-12).
 *
 * Nenhum caso aqui liga para lugar algum: o classificador é injetado, como o
 * transporte na suíte do motor. O que se confere é a ordem das perguntas, que
 * é onde mora a diferença entre uma proposta que se lê e uma que se descarta.
 *
 * A primeira rodada real desta ferramenta, em 2026-09-20, mediu as duas falhas
 * que estes casos fixam. Perguntando sempre sem foco, três dos sete
 * vocabulários medidos nos 64 projetos ficaram de fora, porque o motor responde
 * pelo campo mais evidente do checkpoint. Perguntando sempre com foco, vieram
 * trinta e nove pares, dos quais trinta e dois eram ruído: `verde: "569"` e
 * `adrs: "8"` classificados como conclusão. A ordem resolve as duas.
 * @module tests/equivalencias-aprendizado
 */

import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { principal } from '../scripts/aprender-equivalencias.js'

let raiz: string
let saida: string

/** Um projeto com o `state.json` que o caso quiser. */
function projeto(nome: string, checkpoints: Record<string, unknown>): void {
  mkdirSync(join(raiz, nome, '.reversa'), { recursive: true })
  writeFileSync(join(raiz, nome, '.reversa', 'state.json'), JSON.stringify({ checkpoints }))
}

/** O mapa vazio, que é o estado de quem ainda não aprovou nada. */
const SEM_MAPA = { pares: [], naoAgentes: [] }

beforeEach(() => {
  raiz = mkdtempSync(join(tmpdir(), 'aprendizado-'))
  saida = join(mkdtempSync(join(tmpdir(), 'proposta-')), 'equivalencias.md')
})

afterEach(() => {
  rmSync(raiz, { recursive: true, force: true })
})

describe('as duas passagens do aprendizado', () => {
  it('propõe o campo que a passagem sem foco apontou, e ignora os demais do mesmo checkpoint', async () => {
    projeto('alfa', { scout: { status: 'concluido', verde: 569, adrs: 8, at: '2026-09-12T09:02:59' } })
    // Sem foco o duplo aponta `status`; com foco ele diria sim a qualquer campo,
    // que é exatamente o viés medido na rodada real.
    const classificar = vi.fn(async (_checkpoint: unknown, campoEmFoco: string | null) =>
      campoEmFoco === null
        ? { campo: 'status', valor: 'concluido', leitura: 'concluido', razao: 'campo de status' }
        : { campo: campoEmFoco, valor: 'x', leitura: 'concluido', razao: 'sim, senhor' },
    )

    expect(await principal([`--raiz=${raiz}`, `--saida=${saida}`], { classificar, mapa: SEM_MAPA })).toBe(0)

    const texto = readFileSync(saida, 'utf8')
    expect(texto).toContain('`status: "concluido"` → **concluído**')
    // Eles aparecem, sim, mas entre os não classificados, que é lista sem caixa:
    // o que a proposta não faz é oferecê-los para aprovação.
    expect(texto).not.toContain('- [ ] `verde:')
    expect(texto).not.toContain('- [ ] `adrs:')
    expect(texto).not.toContain('- [ ] `at:')
    expect(texto).toContain('o motor não apontou este campo como campo de estado')
  })

  it('pergunta COM foco o segundo valor de um campo que já foi eleito de estado', async () => {
    projeto('alfa', { scout: { status: 'concluido' } })
    projeto('beta', { scout: { status: 'failed' } })
    const classificar = vi.fn(async (checkpoint: Record<string, unknown>, campoEmFoco: string | null) => {
      if (campoEmFoco === null) {
        // Sem foco, o motor só reconhece o valor que lhe é familiar: é o erro
        // que o vocabulário binário já tinha mostrado, e o foco é o que o corrige.
        return checkpoint.status === 'concluido'
          ? { campo: 'status', valor: 'concluido', leitura: 'concluido', razao: 'status concluído' }
          : null
      }
      return { campo: 'status', valor: 'failed', leitura: 'falhou', razao: 'status de falha' }
    })

    expect(await principal([`--raiz=${raiz}`, `--saida=${saida}`], { classificar, mapa: SEM_MAPA })).toBe(0)

    const texto = readFileSync(saida, 'utf8')
    expect(texto).toContain('`status: "concluido"` → **concluído**')
    expect(texto).toContain('`status: "failed"` → **falhou**')
  })

  it('não pergunta duas vezes pelo mesmo checkpoint na passagem sem foco', async () => {
    projeto('alfa', { scout: { status: 'concluido', ciclo: 3, adrs: 8 } })
    const classificar = vi.fn(async () => null)

    await principal([`--raiz=${raiz}`, `--saida=${saida}`], { classificar, mapa: SEM_MAPA })

    // Três pares, um checkpoint: uma pergunta. Cada repetição custaria três
    // segundos de motor pela mesma resposta.
    expect(classificar).toHaveBeenCalledTimes(1)
  })

  it('encerra sem escrever proposta quando o motor não responde', async () => {
    projeto('alfa', { scout: { status: 'concluido' } })
    const classificar = vi.fn(async () => {
      throw new Error('ECONNREFUSED')
    })

    expect(await principal([`--raiz=${raiz}`, `--saida=${saida}`], { classificar, mapa: SEM_MAPA })).toBe(1)
    expect(() => readFileSync(saida, 'utf8')).toThrow()
  })
})
