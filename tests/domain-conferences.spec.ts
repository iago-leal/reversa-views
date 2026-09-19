/**
 * O registro de conferências do `onboarding.md` (feature 010, RN-05, RN-06,
 * D-09 a D-11).
 *
 * A seção não é prescrita pelo processo: aparece em 1 de 307 onboardings de
 * `~/dev`. Por isso a ausência dela é estado nomeado e nunca anomalia, e só a
 * seção presente e ilegível é defeito a dizer.
 * @module tests/domain-conferences
 */

import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { readConferences } from '../src/domain/conferences.ts'
import { CONFERENCE_ROW_CAP } from '../src/domain/limits.ts'

const ARQUIVO = '_reversa_forward/002-infra/onboarding.md'

/** O texto de uma fixture do vínculo. */
function fixture(nome: string): string {
  return readFileSync(`tests/fixtures/vinculo/${nome}.md`, 'utf8')
}

describe('a seção e a tabela (D-09)', () => {
  it('acha a seção pelo começo do título, sem a numeração, e a tabela pelas colunas', () => {
    const { registro, anomalias } = readConferences(fixture('onboarding-vinte-linhas'), ARQUIVO)
    expect(registro.estado).toBe('lido')
    expect(registro.secao).toBe('9. Registro de conferências')
    expect(registro.arquivo).toBe(ARQUIVO)
    expect(registro.total).toBe(20)
    expect(registro.linhas).toHaveLength(20)
    expect(registro.registradas).toBe(2)
    expect(anomalias).toEqual([])
  })

  it('reconhece o título sem numeração e com texto depois do começo', () => {
    const { registro } = readConferences(fixture('onboarding-tabela-vazia'), ARQUIVO)
    expect(registro.secao).toBe('Registro de conferências e observações')
  })

  it('não confunde seção de nível três nem título que só contém as palavras', () => {
    const md = [
      '## 1. Preparar',
      '### Registro de conferências',
      '| Data | Resultado |',
      '|---|---|',
      '| 2026-09-19 | ok |',
      '## Sobre o registro de conferências',
      'prosa',
    ].join('\n')
    expect(readConferences(md, ARQUIVO).registro.estado).toBe('sem-registro')
  })

  it('acha as colunas em qualquer posição, e as opcionais ausentes dão nulo', () => {
    const { registro } = readConferences(fixture('onboarding-acima-do-teto'), ARQUIVO)
    const primeira = registro.linhas[0]
    expect(primeira).toEqual({
      data: '2026-09-19',
      marco: null,
      item: 'passo 1',
      resultado: 'confere',
      observacao: null,
      registrada: true,
    })
    expect(registro.linhas[1]?.registrada).toBe(false)
  })

  it('lê `Marco`, `Item` e `Observação` pelo nome quando existem', () => {
    const { registro } = readConferences(fixture('onboarding-vinte-linhas'), ARQUIVO)
    expect(registro.linhas[0]).toMatchObject({
      data: '2026-09-19',
      marco: 'M2',
      item: '1 a 11',
      resultado: '11 conferem, 9b após ajuste',
      observacao: 'passo 9b refeito na porta 15445',
      registrada: true,
    })
  })

  it('a primeira tabela com `Data` e `Resultado` é a de registro, e as outras da seção não', () => {
    const md = [
      '## Registro de conferências',
      '| Marco | Descrição |',
      '|---|---|',
      '| M1 | o marco |',
      '',
      '| Resultado | Data |',
      '|---|---|',
      '| ok | 2026-09-19 |',
    ].join('\n')
    const { registro, anomalias } = readConferences(md, ARQUIVO)
    expect(registro.estado).toBe('lido')
    expect(registro.linhas).toEqual([
      { data: '2026-09-19', marco: null, item: null, resultado: 'ok', observacao: null, registrada: true },
    ])
    expect(anomalias).toEqual([])
  })

  it('tolera artigo e anotação no cabeçalho, pelo RF-07.3', () => {
    const md = ['## Registro de conferências', '| A data (dia) | O resultado |', '|---|---|', '| 19/09 | ok |'].join('\n')
    expect(readConferences(md, ARQUIVO).registro.registradas).toBe(1)
  })
})

describe('a linha registrada (D-10, RN-05)', () => {
  it('"não executável" é registro, exposto como escrito', () => {
    const { registro } = readConferences(fixture('onboarding-vinte-linhas'), ARQUIVO)
    const ultima = registro.linhas[19]
    expect(ultima?.resultado).toBe('não executável')
    expect(ultima?.registrada).toBe(true)
  })

  it('data sem resultado, ou resultado só com traço, é pendente', () => {
    const { registro } = readConferences(fixture('onboarding-vinte-linhas'), ARQUIVO)
    const rf07 = registro.linhas[18]
    expect(rf07?.data).toBe('2026-09-19')
    expect(rf07?.resultado).toBe('—')
    expect(rf07?.registrada).toBe(false)
  })

  it('linha só de traços não é linha', () => {
    const { registro } = readConferences(fixture('onboarding-tracos'), ARQUIVO)
    expect(registro.total).toBe(2)
    expect(registro.linhas.map((linha) => linha.registrada)).toEqual([true, false])
  })

  it('célula vazia vira nulo, e não texto vazio', () => {
    const { registro } = readConferences(fixture('onboarding-tracos'), ARQUIVO)
    expect(registro.linhas[1]).toEqual({
      data: null,
      marco: null,
      item: null,
      resultado: null,
      observacao: 'aguarda',
      registrada: false,
    })
  })
})

describe('os seis estados (D-11, RN-06)', () => {
  it('onboarding ausente é `sem-registro`, sem arquivo e sem anomalia', () => {
    const { registro, anomalias } = readConferences(null, null)
    expect(registro).toEqual({
      estado: 'sem-registro',
      arquivo: null,
      secao: null,
      linhas: [],
      registradas: 0,
      total: 0,
    })
    expect(anomalias).toEqual([])
  })

  it('onboarding sem a seção é `sem-registro`, com o arquivo e sem anomalia', () => {
    const { registro, anomalias } = readConferences(fixture('onboarding-sem-secao'), ARQUIVO)
    expect(registro.estado).toBe('sem-registro')
    expect(registro.arquivo).toBe(ARQUIVO)
    expect(anomalias).toEqual([])
  })

  it('tabela sem linha alguma é `vazio`, distinto dos dois anteriores', () => {
    const { registro, anomalias } = readConferences(fixture('onboarding-tabela-vazia'), ARQUIVO)
    expect(registro.estado).toBe('vazio')
    expect(registro.total).toBe(0)
    expect(anomalias).toEqual([])
  })

  it('seção sem tabela reconhecível é `nao-reconhecido`, com a seção e o cabeçalho no detalhe', () => {
    const { registro, anomalias } = readConferences(fixture('onboarding-sem-data'), ARQUIVO)
    expect(registro.estado).toBe('nao-reconhecido')
    expect(registro.secao).toBe('9. Registro de conferências')
    expect(anomalias).toHaveLength(1)
    expect(anomalias[0]?.code).toBe('tabela-nao-reconhecida')
    expect(anomalias[0]?.file).toBe(ARQUIVO)
    expect(anomalias[0]?.detail).toContain('9. Registro de conferências')
    expect(anomalias[0]?.detail).toContain('Marco | Item | Resultado')
  })

  it('seção sem tabela alguma também é `nao-reconhecido`, e o detalhe diz que não há cabeçalho', () => {
    const { registro, anomalias } = readConferences('## Registro de conferências\n\nsó prosa\n', ARQUIVO)
    expect(registro.estado).toBe('nao-reconhecido')
    expect(anomalias[0]?.detail).toContain('nenhuma tabela')
  })

  it('onboarding presente e não lido é `nao-lido`, parcial, com anomalia', () => {
    const { registro, anomalias } = readConferences(null, ARQUIVO)
    expect(registro.estado).toBe('nao-lido')
    expect(registro.arquivo).toBe(ARQUIVO)
    expect(anomalias).toEqual([
      expect.objectContaining({ file: ARQUIVO, code: 'artefato-da-entrega-nao-lido' }),
    ])
    expect(anomalias[0]?.detail).toContain('conferência')
  })

  it('acima do teto de linhas é `truncado`: as primeiras cem lidas, o total preservado', () => {
    const { registro, anomalias } = readConferences(fixture('onboarding-acima-do-teto'), ARQUIVO)
    expect(registro.estado).toBe('truncado')
    expect(registro.linhas).toHaveLength(CONFERENCE_ROW_CAP)
    expect(registro.total).toBe(120)
    // A contagem cobre todas as linhas: o teto limita o que viaja, e não o
    // que se conta, e "N de M" mede as duas pontas sobre o mesmo conjunto.
    expect(registro.registradas).toBe(60)
    expect(anomalias).toHaveLength(1)
    expect(anomalias[0]?.code).toBe('artefato-da-entrega-nao-lido')
    expect(anomalias[0]?.detail).toContain('100 de 120')
  })

  it('nunca lança, para entrada alguma', () => {
    for (const md of ['', '##', '## Registro de conferências\n|', '|||\n|-|', '\u0000']) {
      expect(() => readConferences(md, ARQUIVO)).not.toThrow()
    }
  })
})
