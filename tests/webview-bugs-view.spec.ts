/**
 * Ordem, recorte e destaque do bloco de bugs, numa função só (RN-07, RN-10,
 * RF-07, RF-08, D-06).
 *
 * A fusão das três decisões numa passagem é o remédio de D-14 da feature 007,
 * aplicado antes de o defeito nascer: selecionar num lugar e exibir noutro é o
 * que fez o cartão da decomposição mostrar as ações certas na ordem errada. Por
 * isso o recorte aqui é PREFIXO da lista ordenada, e não uma segunda seleção
 * sobre ela, e é isso que o caso do recorte fixa.
 *
 * A estabilidade dos empates não é detalhe. As datas do registro têm
 * granularidade de dia, e dois bugs mexidos no mesmo dia são o caso comum, não
 * o excepcional. Uma lista que se remexe entre duas leituras idênticas é
 * defeito intermitente, que é a pior classe deles, e o comparador devolve zero
 * no empate de propósito para que a ordem de leitura sobreviva.
 * @module tests/webview-bugs-view
 */

import { describe, expect, it } from 'vitest'
import type { BugContext, BugEntry, BugRegistry } from '../src/domain/types.ts'
import { EMPTY_BUG_COUNTS } from '../src/domain/types.ts'
import { BUGS_CLOSED_CUT, bugsView } from '../src/webview/domain/bugs-view.ts'

/** Ninguém revelou grupo algum, que é o estado em que o bloco nasce. */
const NADA_REVELADO: ReadonlySet<string> = new Set()

/** Um bug do registro, com só o que cada caso precisa dizer. */
function bug(partes: Partial<BugEntry> & { id: string }): BugEntry {
  return {
    pasta: `_reversa_bugs/ctx/bugs/${partes.id}`,
    arquivo: `_reversa_bugs/ctx/bugs/${partes.id}/bug.md`,
    apelido: null,
    titulo: `Defeito ${partes.id}`,
    estado: 'open',
    estadoBruto: 'open',
    fase: 'triaging',
    faseBruta: 'triaging',
    severidade: 'low',
    severidadeBruta: 'low',
    prioridade: 'P3',
    prioridadeBruta: 'P3',
    registrado: '2026-09-01',
    alterado: '2026-09-01',
    travado: false,
    encerrado: null,
    bloqueado: false,
    inconsistencia: null,
    ...partes,
  }
}

/** Um bug encerrado, que é o que a trava faz dele. */
function encerrado(id: string, alterado: string | null): BugEntry {
  return bug({
    id,
    estado: 'resolved',
    estadoBruto: 'resolved',
    alterado,
    travado: true,
    encerrado: alterado,
  })
}

/** Um bug em aberto. */
function aberto(id: string, alterado: string | null): BugEntry {
  return bug({ id, alterado })
}

/** Um grupo de contexto, com a contagem derivada dos bugs que recebe. */
function grupo(contexto: string, bugs: BugEntry[], ultimoMovimento?: string | null): BugContext {
  const datas = bugs.map((item) => item.alterado).filter((data): data is string => data !== null)
  return {
    contexto,
    pasta: `_reversa_bugs/${contexto}`,
    bugs,
    contagem: {
      ...EMPTY_BUG_COUNTS,
      total: bugs.length,
      abertos: bugs.filter((item) => item.estado === 'open').length,
      resolvidos: bugs.filter((item) => item.estado === 'resolved').length,
    },
    ultimoMovimento:
      ultimoMovimento === undefined
        ? datas.length === 0
          ? null
          : datas.reduce((maior, data) => (data > maior ? data : maior))
        : ultimoMovimento,
  }
}

/** O registro do projeto, montado a partir dos grupos. */
function registro(contextos: BugContext[], partes: Partial<BugRegistry> = {}): BugRegistry {
  const bugs = contextos.flatMap((contexto) => contexto.bugs)
  return {
    presente: true,
    contextos,
    contagem: {
      ...EMPTY_BUG_COUNTS,
      total: bugs.length,
      abertos: bugs.filter((item) => item.estado === 'open').length,
      resolvidos: bugs.filter((item) => item.estado === 'resolved').length,
    },
    lidos: bugs.length,
    truncado: false,
    anomalias: [],
    ...partes,
  }
}

/** Os identificadores de um grupo da vista, na ordem em que ele os desenha. */
function ids(vista: ReturnType<typeof bugsView>, indice = 0): (string | null)[] {
  return vista.grupos[indice].linhas.map((linha) => linha.bug.id)
}

describe('ordem entre grupos, pelo movimento mais recente (RN-07)', () => {
  it('o contexto que se mexeu por último vem primeiro', () => {
    const vista = bugsView(
      registro([
        grupo('antigo', [aberto('BUG-A', '2026-09-02')]),
        grupo('recente', [aberto('BUG-B', '2026-09-09')]),
      ]),
      NADA_REVELADO,
    )

    expect(vista.grupos.map((item) => item.contexto)).toEqual(['recente', 'antigo'])
  })

  it('grupo sem movimento algum vai ao fim, e não ao começo', () => {
    const vista = bugsView(
      registro([
        grupo('sem-data', [aberto('BUG-A', null)], null),
        grupo('com-data', [aberto('BUG-B', '2026-09-01')]),
      ]),
      NADA_REVELADO,
    )

    expect(vista.grupos.map((item) => item.contexto)).toEqual(['com-data', 'sem-data'])
  })

  it('empate entre grupos preserva a ordem de leitura, nas duas passagens', () => {
    const entrada = registro([
      grupo('primeiro', [aberto('BUG-A', '2026-09-05')]),
      grupo('segundo', [aberto('BUG-B', '2026-09-05')]),
      grupo('terceiro', [aberto('BUG-C', '2026-09-05')]),
    ])
    const uma = bugsView(entrada, NADA_REVELADO)
    const outra = bugsView(entrada, NADA_REVELADO)

    expect(uma.grupos.map((item) => item.contexto)).toEqual(['primeiro', 'segundo', 'terceiro'])
    expect(outra.grupos.map((item) => item.contexto)).toEqual(uma.grupos.map((i) => i.contexto))
  })
})

describe('ordem dentro do grupo (RN-07)', () => {
  it('os não encerrados vêm à frente dos encerrados, seja qual for a data', () => {
    const vista = bugsView(
      registro([
        grupo('ctx', [
          encerrado('BUG-FECHADO', '2026-09-30'),
          aberto('BUG-ABERTO', '2026-09-01'),
        ]),
      ]),
      NADA_REVELADO,
    )

    expect(ids(vista)).toEqual(['BUG-ABERTO', 'BUG-FECHADO'])
  })

  it('dentro de cada metade, do mais recentemente mexido ao mais antigo', () => {
    const vista = bugsView(
      registro([
        grupo('ctx', [
          aberto('BUG-A1', '2026-09-01'),
          aberto('BUG-A3', '2026-09-03'),
          aberto('BUG-A2', '2026-09-02'),
          encerrado('BUG-F1', '2026-09-01'),
          encerrado('BUG-F3', '2026-09-03'),
          encerrado('BUG-F2', '2026-09-02'),
        ]),
      ]),
      NADA_REVELADO,
    )

    expect(ids(vista)).toEqual(['BUG-A3', 'BUG-A2', 'BUG-A1', 'BUG-F3', 'BUG-F2', 'BUG-F1'])
  })

  it('registro sem data vai ao fim da METADE a que pertence, e não ao fim do grupo', () => {
    const vista = bugsView(
      registro([
        grupo('ctx', [
          aberto('BUG-SEM-DATA', null),
          aberto('BUG-COM-DATA', '2026-09-02'),
          encerrado('BUG-FECHADO-SEM-DATA', null),
          encerrado('BUG-FECHADO-COM-DATA', '2026-09-05'),
        ]),
      ]),
      NADA_REVELADO,
    )

    expect(ids(vista)).toEqual([
      'BUG-COM-DATA',
      'BUG-SEM-DATA',
      'BUG-FECHADO-COM-DATA',
      'BUG-FECHADO-SEM-DATA',
    ])
  })

  it('empate de data preserva a ordem de leitura, e é igual nas duas passagens', () => {
    const entrada = registro([
      grupo('ctx', [
        aberto('BUG-PRIMEIRO', '2026-09-05'),
        aberto('BUG-SEGUNDO', '2026-09-05'),
        aberto('BUG-TERCEIRO', '2026-09-05'),
      ]),
    ])

    expect(ids(bugsView(entrada, NADA_REVELADO))).toEqual([
      'BUG-PRIMEIRO',
      'BUG-SEGUNDO',
      'BUG-TERCEIRO',
    ])
    expect(ids(bugsView(entrada, NADA_REVELADO))).toEqual(ids(bugsView(entrada, NADA_REVELADO)))
  })

  it('a função não remexe a lista que recebeu', () => {
    const entrada = registro([
      grupo('ctx', [encerrado('BUG-F', '2026-09-30'), aberto('BUG-A', '2026-09-01')]),
    ])
    const antes = entrada.contextos[0].bugs.map((item) => item.id)
    bugsView(entrada, NADA_REVELADO)

    expect(entrada.contextos[0].bugs.map((item) => item.id)).toEqual(antes)
  })
})

describe('recorte por grupo (RF-08)', () => {
  /** Um grupo com um aberto e a quantidade pedida de encerrados. */
  function grupoCom(contexto: string, fechados: number): BugContext {
    const bugs: BugEntry[] = [aberto(`${contexto}-ABERTO`, '2026-09-20')]
    for (let i = 0; i < fechados; i += 1) {
      bugs.push(encerrado(`${contexto}-F${String(i).padStart(2, '0')}`, `2026-09-${String(i + 1).padStart(2, '0')}`))
    }
    return grupo(contexto, bugs)
  }

  it('mostra todos os não encerrados e os cinco encerrados mais recentes', () => {
    const vista = bugsView(registro([grupoCom('ctx', 10)]), NADA_REVELADO)

    expect(vista.grupos[0].linhas).toHaveLength(1 + BUGS_CLOSED_CUT)
    expect(vista.grupos[0].linhas.filter((linha) => linha.bug.travado)).toHaveLength(
      BUGS_CLOSED_CUT,
    )
  })

  it('declara quantos o recorte deixou de fora, e quantos o grupo tem', () => {
    const vista = bugsView(registro([grupoCom('ctx', 10)]), NADA_REVELADO)

    expect(vista.grupos[0].ocultas).toBe(10 - BUGS_CLOSED_CUT)
    expect(vista.grupos[0].total).toBe(11)
  })

  it('grupo abaixo do recorte não esconde nada', () => {
    const vista = bugsView(registro([grupoCom('ctx', 3)]), NADA_REVELADO)

    expect(vista.grupos[0].ocultas).toBe(0)
    expect(vista.grupos[0].linhas).toHaveLength(4)
  })

  it('o que o recorte revela é o resto da MESMA ordem, e não outra seleção', () => {
    const entrada = registro([grupoCom('ctx', 10)])
    const recortada = ids(bugsView(entrada, NADA_REVELADO))
    const inteira = ids(bugsView(entrada, new Set(['ctx'])))

    expect(inteira.slice(0, recortada.length)).toEqual(recortada)
    expect(inteira).toHaveLength(11)
  })

  it('revelar um grupo não mexe nos outros', () => {
    const entrada = registro([grupoCom('alfa', 10), grupoCom('beta', 10)])
    const vista = bugsView(entrada, new Set(['alfa']))
    const por = (contexto: string) => vista.grupos.find((item) => item.contexto === contexto)

    expect(por('alfa')?.linhas).toHaveLength(11)
    expect(por('alfa')?.ocultas).toBe(0)
    expect(por('beta')?.linhas).toHaveLength(1 + BUGS_CLOSED_CUT)
    expect(por('beta')?.ocultas).toBe(10 - BUGS_CLOSED_CUT)
  })

  it('o recorte não corta bug em aberto, por mais que existam', () => {
    const bugs: BugEntry[] = []
    for (let i = 0; i < 12; i += 1) bugs.push(aberto(`BUG-A${i}`, '2026-09-01'))
    const vista = bugsView(registro([grupo('ctx', bugs)]), NADA_REVELADO)

    expect(vista.grupos[0].linhas).toHaveLength(12)
    expect(vista.grupos[0].ocultas).toBe(0)
  })
})

describe('o próximo a tratar é único no bloco inteiro (RN-10, RF-06)', () => {
  it('marca exatamente uma linha quando há aberto em dois contextos', () => {
    const vista = bugsView(
      registro([
        grupo('antigo', [aberto('BUG-ANTIGO', '2026-09-02')]),
        grupo('recente', [aberto('BUG-RECENTE', '2026-09-09')]),
      ]),
      NADA_REVELADO,
    )
    const marcadas = vista.grupos.flatMap((item) =>
      item.linhas.filter((linha) => linha.proximo).map((linha) => linha.bug.id),
    )

    expect(marcadas).toEqual(['BUG-RECENTE'])
    expect(vista.proximo).toBe('BUG-RECENTE')
  })

  it('a linha marcada é a do primeiro não encerrado do primeiro grupo', () => {
    const vista = bugsView(
      registro([
        grupo('ctx', [
          encerrado('BUG-FECHADO', '2026-09-30'),
          aberto('BUG-ANTIGO', '2026-09-01'),
          aberto('BUG-NOVO', '2026-09-05'),
        ]),
      ]),
      NADA_REVELADO,
    )

    expect(vista.proximo).toBe('BUG-NOVO')
    expect(vista.grupos[0].linhas[0].proximo).toBe(true)
  })

  /**
   * A leitura de RN-10 que este caso fixa. A regra escreve "o primeiro não
   * encerrado do primeiro grupo", e a ordem entre grupos é pelo movimento mais
   * recente, que um bug ENCERRADO também produz. Um grupo pode portanto vir
   * primeiro sem ter aberto algum, e a leitura literal deixaria o bloco sem
   * destaque tendo bug à espera — que é justamente o contrário do que RF-06
   * pede. O destaque é, então, o primeiro não encerrado na ordem do bloco.
   */
  it('sem aberto no primeiro grupo, marca o primeiro aberto do bloco', () => {
    const vista = bugsView(
      registro([
        grupo('recente', [encerrado('BUG-FECHADO', '2026-09-30')]),
        grupo('antigo', [aberto('BUG-ESPERANDO', '2026-09-01')]),
      ]),
      NADA_REVELADO,
    )

    expect(vista.grupos[0].contexto).toBe('recente')
    expect(vista.proximo).toBe('BUG-ESPERANDO')
  })

  it('sem bug não encerrado algum, marca nenhum', () => {
    const vista = bugsView(
      registro([
        grupo('alfa', [encerrado('BUG-F1', '2026-09-01')]),
        grupo('beta', [encerrado('BUG-F2', '2026-09-02')]),
      ]),
      NADA_REVELADO,
    )
    const marcadas = vista.grupos.flatMap((item) => item.linhas.filter((linha) => linha.proximo))

    expect(marcadas).toEqual([])
    expect(vista.proximo).toBeNull()
  })

  it('bug sem identificador é nomeado pela pasta, e continua marcável', () => {
    const semId = bug({ id: 'BUG-X' })
    const vista = bugsView(
      registro([grupo('ctx', [{ ...semId, id: null }])]),
      NADA_REVELADO,
    )

    expect(vista.proximo).toBe(semId.pasta)
  })
})

describe('registro vazio e registro ausente', () => {
  it('registro ausente não produz grupo algum', () => {
    const vista = bugsView(
      { presente: false, contextos: [], contagem: EMPTY_BUG_COUNTS, lidos: 0, truncado: false, anomalias: [] },
      NADA_REVELADO,
    )

    expect(vista.grupos).toEqual([])
    expect(vista.proximo).toBeNull()
  })

  it('contexto sem bug algum continua sendo um grupo, com zero linhas', () => {
    const vista = bugsView(registro([grupo('vazio', [])]), NADA_REVELADO)

    expect(vista.grupos).toHaveLength(1)
    expect(vista.grupos[0].linhas).toEqual([])
    expect(vista.grupos[0].total).toBe(0)
  })

  it('a contagem do grupo atravessa intacta, porque a autoridade é do disco (D-15)', () => {
    const entrada = registro([grupo('ctx', [aberto('BUG-A', '2026-09-01')])])
    entrada.contextos[0].contagem = { ...entrada.contextos[0].contagem, total: 9, restritos: 8 }
    const vista = bugsView(entrada, NADA_REVELADO)

    expect(vista.grupos[0].contagem.total).toBe(9)
    expect(vista.grupos[0].contagem.restritos).toBe(8)
  })
})
