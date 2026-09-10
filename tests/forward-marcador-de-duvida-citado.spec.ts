/**
 * Regressão do BUG-20260910-74UL: o contador herdado de dúvidas (R10) lê toda ocorrência literal
 * de `[DÚVIDA]` no requirements da feature, inclusive uma citação do marcador entre crases num
 * histórico de alterações. Enquanto o leitor for literal, o artefato não pode citar o marcador:
 * esta suíte percorre os requirements reais do ciclo forward e acusa a citação, nomeando a linha.
 * Marcador fora de crases é dúvida de verdade e continua contado, como o primeiro caso mostra.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { countDoubts } from '../src/heranca/reversa-domain/src/actions.ts'

const FORWARD = path.resolve(__dirname, '..', '_reversa_forward')

/** As linhas em que o marcador aparece dentro de trecho de código em linha. */
function citacoesEntreCrases(md: string): string[] {
  return md
    .split('\n')
    .map((linha, i) => ({ n: i + 1, linha }))
    .filter(({ linha }) => /`[^`]*\[DÚVIDA\][^`]*`/.test(linha))
    .map(({ n, linha }) => `linha ${n}: ${linha.slice(0, 100)}`)
}

describe('o marcador de dúvida citado em texto (BUG-20260910-74UL)', () => {
  it('conta como dúvida quando está fora de crases, que é a regra herdada', () => {
    expect(countDoubts('R1 — algo [DÚVIDA] a confirmar.\n')).toBe(1)
  })

  const features = existsSync(FORWARD)
    ? readdirSync(FORWARD).filter((nome) => existsSync(path.join(FORWARD, nome, 'requirements.md')))
    : []

  it.each(features)('%s: o requirements não cita o marcador entre crases', (feature) => {
    const md = readFileSync(path.join(FORWARD, feature, 'requirements.md'), 'utf8')
    const citacoes = citacoesEntreCrases(md)
    expect(
      citacoes,
      `o contador de dúvidas leria como dúvida aberta o marcador citado em:\n${citacoes.join('\n')}`,
    ).toEqual([])
    expect(countDoubts(md)).toBe((md.match(/\[DÚVIDA\]/g) ?? []).length)
  })
})
