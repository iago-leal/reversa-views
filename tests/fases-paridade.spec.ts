/**
 * A paridade entre os dois classificadores de nome de fase (feature 015, D-19).
 *
 * `src/domain/fases.ts` é o que a leitura usa; `scripts/equivalencias/fases.js`
 * é o que o aprendizado usa, porque script de manutenção é CommonJS e não
 * importa a fonte em TypeScript. Nenhum dos dois pode importar o outro, e o que
 * os prende é esta suíte: a MESMA tabela de casos, dos dois lados, com o mesmo
 * resultado. É o molde de `elisao-paridade.spec.ts`.
 * @module tests/fases-paridade
 */

import { describe, expect, it } from 'vitest'
import { classificarNome as daLeitura, FASES_CANONICAS as CANONICAS_DA_LEITURA } from '../src/domain/fases.ts'
import { classificarNome as dosScripts, FASES_CANONICAS as CANONICAS_DOS_SCRIPTS } from '../scripts/equivalencias/fases.js'
import { amostra } from './helpers/fases-leitura.ts'
import { CASOS_DE_FASE, ETAPAS_APROVADAS } from './helpers/fases-casos.ts'

const MAPA = {
  pares: [],
  naoAgentes: [],
  etapas: ETAPAS_APROVADAS.map((nome) => ({ nome, aprovadoEm: '2026-09-21', evidencia: [] })),
}

describe('os dois classificadores dizem o mesmo', () => {
  it('sobre as cinco fases canônicas, na mesma ordem', () => {
    expect(CANONICAS_DOS_SCRIPTS).toEqual([...CANONICAS_DA_LEITURA])
  })

  it.each(CASOS_DE_FASE)('sobre "$bruto"', ({ bruto, esperado }) => {
    expect(dosScripts(bruto, MAPA)).toEqual(daLeitura(bruto, MAPA))
    expect(dosScripts(bruto, MAPA)).toEqual({ ...esperado, bruto })
  })

  it('sobre todo nome das amostras de state.json, com e sem etapas aprovadas', () => {
    const amostras = ['ciclo-tres-com-etapas', 'etapa-em-curso', 'erros-de-grafia', 'prosa-em-pending', 'fases-observadas']
    const semEtapas = { pares: [], naoAgentes: [] }

    for (const nome of amostras) {
      const textos = JSON.stringify(JSON.parse(amostra(nome))).match(/"[^"]*"/g) ?? []
      for (const texto of textos.map((t) => JSON.parse(t) as string)) {
        expect(dosScripts(texto, MAPA), texto).toEqual(daLeitura(texto, MAPA))
        expect(dosScripts(texto, semEtapas), texto).toEqual(daLeitura(texto, semEtapas))
      }
    }
  })
})
