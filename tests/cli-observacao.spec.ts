/**
 * Suíte da observação do disco (T036, feature 014, D-10, D-11, RN-09).
 *
 * Duas promessas, e as duas são sobre tempo: uma rajada de escritas produz uma
 * releitura só, e a degradação declara a razão em vez de silenciar. Nenhuma
 * delas precisa de disco para ser exercitada, e é por isso que a assinatura e
 * os temporizadores chegam como mundo declarado.
 */

import { describe, expect, it } from 'vitest'
import {
  INTERVALO_MS,
  JANELA_MS,
  observar,
  pastasQueImportam,
  RAZAO_SEM_ASSINATURA,
} from '../src/cli/observacao.ts'
import type { MundoDaObservacao, Temporizador } from '../src/cli/observacao.ts'
import { payloadFixture } from './helpers/reversa-fixtures.ts'

/**
 * Um relógio de mentira, com os temporizadores na mão.
 *
 * Ele não avança sozinho: `avancar` é o único jeito de o tempo passar, o que
 * torna a suíte determinística onde um `setTimeout` de verdade a tornaria
 * intermitente.
 */
function relogio() {
  let proximo = 1
  const agendados = new Map<number, { quando: number; acao: () => void; repete: number | null }>()
  let agora = 0

  const mundo = {
    agendar: (ms: number, acao: () => void): Temporizador => {
      const id = proximo++
      agendados.set(id, { quando: agora + ms, acao, repete: null })
      return id as unknown as Temporizador
    },
    cancelar: (t: Temporizador): void => {
      agendados.delete(t as unknown as number)
    },
    repetir: (ms: number, acao: () => void): Temporizador => {
      const id = proximo++
      agendados.set(id, { quando: agora + ms, acao, repete: ms })
      return id as unknown as Temporizador
    },
    pararRepeticao: (t: Temporizador): void => {
      agendados.delete(t as unknown as number)
    },
    agora: () => new Date(agora * 1000).toISOString(),
  }

  /** Avança o tempo, disparando o que vencer no caminho. */
  const avancar = (ms: number): void => {
    agora += ms
    for (const [id, item] of [...agendados]) {
      if (item.quando > agora) continue
      if (item.repete === null) agendados.delete(id)
      else agendados.set(id, { ...item, quando: agora + item.repete })
      item.acao()
    }
  }

  return { mundo, avancar, pendentes: () => agendados.size }
}

/** Uma assinatura que instala e guarda o ouvinte, para a rajada. */
function assinaturaQueInstala() {
  const ouvintes: Array<() => void> = []
  const assinar = (_caminho: string, aoEvento: () => void): (() => void) => {
    ouvintes.push(aoEvento)
    return () => undefined
  }
  return { assinar, escrever: () => ouvintes.forEach((ouvinte) => ouvinte()) }
}

/** Uma assinatura que não instala em sistema algum. */
const assinaturaQueFalha = (): never => {
  throw new Error('recursive watch não é suportado aqui')
}

describe('as pastas que importam saem da leitura (RN-01)', () => {
  it('são a raiz mais as pastas que o próprio processo declarou graváveis', () => {
    const carga = payloadFixture()
    const pastas = pastasQueImportam('/w', carga)
    expect(pastas[0]).toBe('/w')
    for (const pasta of carga.process.writableFolders) {
      expect(pastas).toContain(`/w/${pasta}`)
    }
  })

  it('sem leitura, observa a raiz e nada mais', () => {
    expect(pastasQueImportam('/w', null)).toEqual(['/w'])
  })

  it('não repete caminho algum', () => {
    const pastas = pastasQueImportam('/w', payloadFixture())
    expect(new Set(pastas).size).toBe(pastas.length)
  })
})

describe('a rajada produz uma releitura só (D-10)', () => {
  it('vinte escritas seguidas relêem uma vez, e não vinte', () => {
    const { mundo, avancar } = relogio()
    const disco = assinaturaQueInstala()
    let releituras = 0

    observar(['/w'], () => (releituras += 1), { ...mundo, assinar: disco.assinar })

    for (let i = 0; i < 20; i += 1) {
      disco.escrever()
      avancar(10)
    }
    expect(releituras).toBe(0)

    avancar(JANELA_MS)
    expect(releituras).toBe(1)
  })

  it('a janela é de oitocentos milissegundos, contados da última escrita', () => {
    const { mundo, avancar } = relogio()
    const disco = assinaturaQueInstala()
    let releituras = 0

    observar(['/w'], () => (releituras += 1), { ...mundo, assinar: disco.assinar })

    disco.escrever()
    avancar(JANELA_MS - 1)
    expect(releituras).toBe(0)
    avancar(1)
    expect(releituras).toBe(1)
  })

  it('escritas afastadas produzem uma releitura cada', () => {
    const { mundo, avancar } = relogio()
    const disco = assinaturaQueInstala()
    let releituras = 0

    observar(['/w'], () => (releituras += 1), { ...mundo, assinar: disco.assinar })

    disco.escrever()
    avancar(JANELA_MS)
    disco.escrever()
    avancar(JANELA_MS)
    expect(releituras).toBe(2)
  })

  it('a observação que instalou se declara ativa, sem razão de degradação', () => {
    const { mundo } = relogio()
    const disco = assinaturaQueInstala()
    const vigia = observar(['/w'], () => undefined, { ...mundo, assinar: disco.assinar })
    expect(vigia.estado().ativa).toBe(true)
    expect(vigia.estado().razaoDaDegradacao).toBeNull()
  })

  it('registra o instante da última mudança, que é o que a tela declara (RN-09)', () => {
    const { mundo, avancar } = relogio()
    const disco = assinaturaQueInstala()
    const vigia = observar(['/w'], () => undefined, { ...mundo, assinar: disco.assinar })

    expect(vigia.estado().ultimaMudanca).toBeNull()
    disco.escrever()
    avancar(JANELA_MS)
    expect(vigia.estado().ultimaMudanca).not.toBeNull()
  })
})

describe('a degradação declara a razão, em vez de silenciar (D-11)', () => {
  const semAssinatura = (mundo: MundoDaObservacao): MundoDaObservacao => ({
    ...mundo,
    assinar: assinaturaQueFalha,
  })

  it('a observação que não instalou se declara inativa', () => {
    const { mundo } = relogio()
    const vigia = observar(['/w'], () => undefined, semAssinatura(mundo))
    expect(vigia.estado().ativa).toBe(false)
  })

  it('a razão nomeia a degradação e carrega o erro do sistema', () => {
    const { mundo } = relogio()
    const vigia = observar(['/w'], () => undefined, semAssinatura(mundo))
    const razao = vigia.estado().razaoDaDegradacao ?? ''
    expect(razao).toContain(RAZAO_SEM_ASSINATURA)
    expect(razao).toContain('recursive watch')
  })

  it('cai para releitura por intervalo, de dois em dois segundos', () => {
    const { mundo, avancar } = relogio()
    let releituras = 0
    observar(['/w'], () => (releituras += 1), semAssinatura(mundo))

    avancar(INTERVALO_MS)
    expect(releituras).toBe(1)
    avancar(INTERVALO_MS)
    expect(releituras).toBe(2)
  })

  it('uma pasta que instala basta para não degradar', () => {
    const { mundo } = relogio()
    const disco = assinaturaQueInstala()
    const vigia = observar(['/w', '/w/some'], () => undefined, {
      ...mundo,
      assinar: (caminho, aoEvento) => {
        if (caminho === '/w') return assinaturaQueFalha()
        return disco.assinar(caminho, aoEvento)
      },
    })
    expect(vigia.estado().ativa).toBe(true)
  })
})

describe('parar desfaz tudo o que foi instalado', () => {
  it('cancela a janela pendente e a repetição', () => {
    const { mundo, avancar, pendentes } = relogio()
    let releituras = 0
    const vigia = observar(['/w'], () => (releituras += 1), semAssinaturaDe(mundo))

    vigia.parar()
    avancar(INTERVALO_MS * 3)
    expect(releituras).toBe(0)
    expect(pendentes()).toBe(0)
  })

  it('desfaz cada assinatura instalada', () => {
    const { mundo } = relogio()
    let desfeitas = 0
    const vigia = observar(['/a', '/b'], () => undefined, {
      ...mundo,
      assinar: () => () => {
        desfeitas += 1
      },
    })
    vigia.parar()
    expect(desfeitas).toBe(2)
  })

  it('parar duas vezes não desfaz duas vezes', () => {
    const { mundo } = relogio()
    let desfeitas = 0
    const vigia = observar(['/a'], () => undefined, {
      ...mundo,
      assinar: () => () => {
        desfeitas += 1
      },
    })
    vigia.parar()
    vigia.parar()
    expect(desfeitas).toBe(1)
  })
})

/** A mesma degradação do bloco acima, disponível para o bloco de baixo. */
function semAssinaturaDe(mundo: MundoDaObservacao): MundoDaObservacao {
  return { ...mundo, assinar: assinaturaQueFalha }
}
