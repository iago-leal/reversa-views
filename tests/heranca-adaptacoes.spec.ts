/**
 * Suíte da reaplicação das adaptações (T009).
 *
 * A busca é exata de propósito. Num regime com dezenas de correções isso seria
 * proibitivo; com três, todas de importação, a rigidez é a propriedade
 * desejada, porque é ela que produz a parada de RN-09 quando a origem mexe no
 * trecho.
 */

import { describe, expect, it } from 'vitest'
import { aplicar } from '../scripts/heranca/adaptacoes.js'
import { adaptacaoDeImportacao } from './helpers/heranca-fixtures.ts'

const ORIGINAL = "import { readReversa } from '@scrum-harness/reversa-domain'\n"
const ADAPTADO = "import { readReversa } from '../../reversa-domain/src/index.ts'\n"
const CONTEUDO = `// topo\n${ORIGINAL}// resto\n`

describe('aplicação bem-sucedida', () => {
  it('substitui o trecho original pelo adaptado', () => {
    const resultado = aplicar(CONTEUDO, [adaptacaoDeImportacao()])
    expect(resultado.ok).toBe(true)
    expect(resultado.conteudo).toBe(`// topo\n${ADAPTADO}// resto\n`)
  })

  it('trecho adaptado vazio é remoção declarada', () => {
    const resultado = aplicar(CONTEUDO, [adaptacaoDeImportacao({ adaptado: '' })])
    expect(resultado.conteudo).toBe('// topo\n// resto\n')
  })

  it('aplica na ordem de declaração quando há mais de uma no mesmo arquivo', () => {
    const conteudo = 'um\ndois\n'
    const resultado = aplicar(conteudo, [
      adaptacaoDeImportacao({ id: 'A1', original: 'um\n', adaptado: 'UM\n' }),
      adaptacaoDeImportacao({ id: 'A2', original: 'dois\n', adaptado: 'DOIS\n' }),
    ])
    expect(resultado.conteudo).toBe('UM\nDOIS\n')
  })

  it('tolera a ausência da quebra final no trecho declarado', () => {
    const resultado = aplicar(CONTEUDO, [
      adaptacaoDeImportacao({ original: ORIGINAL.trimEnd(), adaptado: ADAPTADO.trimEnd() }),
    ])
    expect(resultado.ok).toBe(true)
    expect(resultado.conteudo).toContain('../../reversa-domain/src/index.ts')
  })
})

describe('recusas', () => {
  it('trecho ausente interrompe, nomeando a adaptação', () => {
    const resultado = aplicar('nada aqui\n', [adaptacaoDeImportacao()])
    expect(resultado.ok).toBe(false)
    expect(resultado.id).toBe('A1')
    expect(resultado.motivo).toBe('ausente')
  })

  it('trecho que aparece duas vezes interrompe, porque a escolha não é da ferramenta', () => {
    const resultado = aplicar(`${ORIGINAL}${ORIGINAL}`, [adaptacaoDeImportacao()])
    expect(resultado.ok).toBe(false)
    expect(resultado.motivo).toBe('ambiguo')
    expect(resultado.ocorrencias).toBe(2)
  })

  it('a recusa não devolve conteúdo parcial', () => {
    const resultado = aplicar('nada aqui\n', [
      adaptacaoDeImportacao({ id: 'A1', original: 'nada aqui\n', adaptado: 'trocado\n' }),
      adaptacaoDeImportacao({ id: 'A2', original: 'não existe\n', adaptado: 'x\n' }),
    ])
    expect(resultado.ok).toBe(false)
    expect(resultado.conteudo).toBeUndefined()
  })
})
