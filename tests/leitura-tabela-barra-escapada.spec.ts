/**
 * Regressão do BUG-20260912-PIPE: a linha de tabela cuja célula cita uma barra vertical é lida
 * inteira. A barra dentro de célula se escreve escapada, que é como o markdown diz "aqui vai uma
 * barra literal" e a única forma de a tabela sobreviver a qualquer renderizador; o divisor herdado
 * partia em toda barra, inventava colunas, tirava as verdadeiras da posição e perdia a linha em
 * silêncio. É o teste de reprodução (vermelho antes das adaptações A6 e A7) e o de regressão, sobre
 * os três leitores que dividem linha: o impacto, a decomposição por cabeçalho e a por varredura.
 *
 * As formas vêm do que `/reversa-coding` deixou em `erp-mineracao`: mensagem de erro com campos
 * separados por barra, e linha de log no mesmo desenho.
 */
import { describe, expect, it } from 'vitest'
import { ImpactContract, cellsOf } from '../src/heranca/reversa-domain/src/index.ts'
import { readDecomposition } from '../src/domain/decomposition.ts'

const IMPACTO = [
  '# Legacy impact: 004-modelo-de-negocio',
  '',
  '> Feature greenfield, sem legado pré-existente.',
  '',
  '| Arquivo afetado | Componente | Tipo | Severidade | Justificativa |',
  '|---|---|---|---|---|',
  '| `erros.py` | spec#11 | componente-novo | HIGH |' +
    ' `ErroNegocio` base com `alvo \\| motivo \\| instrução`; nenhum código 2. |',
  '| `registro.py` | spec#12 | componente-novo | MEDIUM |' +
    ' Linha `HH:MM:SS \\| comando \\| código` em `logs/<AAAA-MM-DD>.log`. |',
  '',
].join('\n')

const CABECALHO =
  '| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |'
const SEPARADOR = '|----|-----------|--------------|-------------|--------------|---|--------|'
const ACAO =
  '| T035 | Escrever `registro.py`: grava `HH:MM:SS \\| comando \\| código` por execução. |' +
  ' T006 | `[//]` | `registro.py` | CONFIRMADO | `[X]` |'

/** Um `actions.md` de uma fase só, com as linhas dadas. */
function arquivo(linhas: string[], cabecalho = CABECALHO): string {
  return ['# Actions: fixtura', '', '## Fase 4, Integração', '', cabecalho, SEPARADOR, ...linhas, ''].join('\n')
}

describe('a barra vertical escapada dentro de célula (BUG-20260912-PIPE)', () => {
  it('não parte a célula, e a devolve sem a notação que a carregou', () => {
    expect(cellsOf('| a | b \\| c | d |')).toEqual(['a', 'b | c', 'd'])
  })

  it('preserva a posição das colunas na tabela de impacto, e a justificativa inteira', () => {
    const impacto = ImpactContract.read(IMPACTO)

    expect(impacto.files).toHaveLength(2)
    expect(impacto.files.map((f) => f.tipo)).toEqual(['componente-novo', 'componente-novo'])
    expect(impacto.files.map((f) => f.severidade)).toEqual(['HIGH', 'MEDIUM'])
    expect(impacto.files[0]?.justificativa).toBe(
      '`ErroNegocio` base com `alvo | motivo | instrução`; nenhum código 2.',
    )
    expect(impacto.anomalies).toEqual([])
  })

  it('mantém a ação na decomposição lida por cabeçalho, sem divergência com a contagem', () => {
    const lido = readDecomposition(arquivo([ACAO]), 1)

    expect(lido.origem).toBe('tabela')
    expect(lido.acoes.map((a) => a.id)).toEqual(['T035'])
    expect(lido.acoes[0]?.fechada).toBe(true)
    expect(lido.acoes[0]?.descricao).toBe(
      'Escrever `registro.py`: grava `HH:MM:SS | comando | código` por execução.',
    )
    expect(lido.divergencia).toBeNull()
  })

  it('mantém a ação também na varredura, quando o cabeçalho não é o canônico', () => {
    const outro = '| ID | O que fazer | Dep | Par | Alvo | Conf | Status |'
    const lido = readDecomposition(arquivo([ACAO], outro), 1)

    expect(lido.origem).toBe('varredura')
    expect(lido.acoes.map((a) => a.id)).toEqual(['T035'])
    // Aqui a linha nunca se perdia, porque a varredura acha a ação pelo marcador
    // de fim de linha; o que se perdia era a descrição, cortada na primeira barra.
    expect(lido.acoes[0]?.descricao).toBe(
      'Escrever `registro.py`: grava `HH:MM:SS | comando | código` por execução.',
    )
    expect(lido.divergencia).toBeNull()
  })

  it('continua acusando a divergência quando a lista de fato perde uma linha', () => {
    const lido = readDecomposition(arquivo([ACAO]), 2)

    expect(lido.divergencia).toEqual({ contadas: 2, listadas: 1 })
  })
})
