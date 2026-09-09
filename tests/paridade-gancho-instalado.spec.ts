/**
 * Paridade entre o gancho instalado neste repositório e o fixture herdado.
 *
 * A suíte herdada `hook-parity.spec.ts` prova que a transcrição de
 * `globToRegex` e `isValidPattern` concorda com o fixture. Ela não prova que
 * o fixture ainda é o gancho que o Reversa deixou em `.reversa/hooks/`, e a
 * camada de julgamento transcreve mais do que essas duas funções. Este teste
 * fecha a lacuna comparando os dois arquivos byte a byte: qualquer
 * divergência, inclusive fora das funções cobertas pela matriz herdada,
 * aparece aqui.
 *
 * Ele se declara pulado quando o gancho instalado não existe, porque a cópia
 * herdada é hermética por construção e não deve exigir uma instalação do
 * Reversa para rodar. Neste repositório o gancho existe e viaja no clone,
 * então um pulo aqui indica clone incompleto.
 */

import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const GANCHO_INSTALADO = fileURLToPath(new URL('../.reversa/hooks/check-legacy-policy.mjs', import.meta.url))
const FIXTURE_HERDADO = fileURLToPath(
  new URL('../src/heranca/reversa-domain/tests/fixtures/check-legacy-policy.mjs', import.meta.url),
)

describe('paridade com o gancho instalado', () => {
  it.skipIf(!existsSync(GANCHO_INSTALADO))(
    'o fixture herdado é byte a byte o gancho instalado; pulado quando: gancho instalado ausente em .reversa/hooks/',
    () => {
      const gancho = readFileSync(GANCHO_INSTALADO)
      const fixture = readFileSync(FIXTURE_HERDADO)
      expect(
        gancho.equals(fixture),
        [
          'O gancho instalado divergiu do fixture herdado.',
          `  gancho instalado: ${GANCHO_INSTALADO}`,
          `  fixture herdado:  ${FIXTURE_HERDADO}`,
          'Inspecione o diff entre os dois antes de qualquer outra coisa: se o Reversa foi',
          'atualizado, a camada de julgamento pode ter passado a mentir sobre a política.',
        ].join('\n'),
      ).toBe(true)
    },
  )
})
