/**
 * Suíte do terminal (feature 014, RN-08, D-05, D-07).
 *
 * O módulo toca o mundo, mas o que ele promete não precisa de terminal algum
 * para ser exercitado: os dois fluxos chegam como dependência, e uma dupla de
 * mentira registra o que foi pedido a cada um. O que se confere aqui é a
 * DEVOLUÇÃO do terminal, que é a promessa cujo descumprimento o usuário paga
 * com `reset`, e a tradução da ênfase abstrata em sequência, que é a fronteira
 * que o resto da ferramenta não pode atravessar.
 *
 * A pausa da entrada tem teste próprio porque já falhou: pausar não basta para
 * o processo terminar, e a ferramenta ficava de pé depois de `q`, com a tela
 * devolvida e nada mais a fazer. Soltar a referência é o que a derruba.
 */

import { describe, expect, it } from 'vitest'
import { criarTerminal, vestir } from '../src/cli/terminal.ts'
import type { FluxosDoTerminal } from '../src/cli/terminal.ts'
import { ENFASES } from '../src/cli/tipos.ts'

/** Tudo o que se pediu aos fluxos, na ordem em que se pediu. */
interface Registro {
  escrito: string[]
  atos: string[]
  bruto: boolean[]
  ouvintes: { entrada: number; saida: number }
}

/**
 * Uma dupla de fluxos de mentira, que anota em vez de agir.
 * @param opcoes - se a entrada é terminal e que dimensões a saída declara.
 * @returns os fluxos e o registro do que foi pedido a eles.
 */
function fluxos(
  opcoes: { tty?: boolean; colunas?: number; linhas?: number } = {},
): { fluxos: FluxosDoTerminal; registro: Registro } {
  const registro: Registro = { escrito: [], atos: [], bruto: [], ouvintes: { entrada: 0, saida: 0 } }

  const entrada = {
    isTTY: opcoes.tty ?? true,
    setRawMode(ligado: boolean) {
      registro.atos.push(ligado ? 'bruto-liga' : 'bruto-desliga')
      registro.bruto.push(ligado)
      return entrada
    },
    resume() {
      registro.atos.push('resume')
      return entrada
    },
    pause() {
      registro.atos.push('pause')
      return entrada
    },
    ref() {
      registro.atos.push('ref')
      return entrada
    },
    unref() {
      registro.atos.push('unref')
      return entrada
    },
    on(_evento: string, _ouvinte: unknown) {
      registro.ouvintes.entrada += 1
      return entrada
    },
    off(_evento: string, _ouvinte: unknown) {
      registro.ouvintes.entrada -= 1
      return entrada
    },
  }

  const saida = {
    columns: opcoes.colunas,
    rows: opcoes.linhas,
    write(texto: string) {
      registro.escrito.push(texto)
      return true
    },
    on(_evento: string, _ouvinte: unknown) {
      registro.ouvintes.saida += 1
      return saida
    },
    off(_evento: string, _ouvinte: unknown) {
      registro.ouvintes.saida -= 1
      return saida
    },
  }

  return {
    fluxos: { entrada, saida } as unknown as FluxosDoTerminal,
    registro,
  }
}

describe('as dimensões', () => {
  it('são as que a saída declara', () => {
    const { fluxos: f } = fluxos({ colunas: 120, linhas: 40 })
    expect(criarTerminal({ fluxos: f, cor: false }).dimensoes()).toEqual({
      largura: 120,
      altura: 40,
    })
  })

  it('caem no padrão quando a saída não declara nenhuma', () => {
    const { fluxos: f } = fluxos({})
    expect(criarTerminal({ fluxos: f, cor: false }).dimensoes()).toEqual({ largura: 80, altura: 24 })
  })

  it('são relidas a cada chamada, porque a janela muda de tamanho', () => {
    const { fluxos: f } = fluxos({ colunas: 80, linhas: 24 })
    const terminal = criarTerminal({ fluxos: f, cor: false })
    expect(terminal.dimensoes().largura).toBe(80)
    ;(f.saida as unknown as { columns: number }).columns = 100
    expect(terminal.dimensoes().largura).toBe(100)
  })
})

describe('entrar e devolver o terminal', () => {
  it('entra em modo bruto, na tela alternativa, sem cursor', () => {
    const { fluxos: f, registro } = fluxos()
    criarTerminal({ fluxos: f, cor: false }).entrar()
    expect(registro.atos).toEqual(['bruto-liga', 'ref', 'resume'])
    expect(registro.escrito.join('')).toBe('\u001b[?1049h\u001b[?25l')
  })

  it('devolve tudo o que tomou, na ordem inversa', () => {
    const { fluxos: f, registro } = fluxos()
    const terminal = criarTerminal({ fluxos: f, cor: false })
    terminal.entrar()
    registro.atos.length = 0
    registro.escrito.length = 0
    terminal.restaurar()
    expect(registro.atos).toEqual(['bruto-desliga', 'pause', 'unref'])
    expect(registro.escrito.join('')).toBe('\u001b[?25h\u001b[?1049l')
  })

  it('solta a referência da entrada, e não só a pausa', () => {
    // A pausa sozinha não derruba o processo: uma entrada que já recebeu dados
    // segue contando como alça viva, e a ferramenta ficava de pé depois de `q`.
    const { fluxos: f, registro } = fluxos()
    const terminal = criarTerminal({ fluxos: f, cor: false })
    terminal.entrar()
    terminal.restaurar()
    expect(registro.atos).toContain('unref')
    expect(registro.atos.indexOf('pause')).toBeLessThan(registro.atos.indexOf('unref'))
  })

  it('não mexe no modo bruto quando a entrada não é terminal', () => {
    const { fluxos: f, registro } = fluxos({ tty: false })
    const terminal = criarTerminal({ fluxos: f, cor: false })
    terminal.entrar()
    terminal.restaurar()
    expect(registro.bruto).toEqual([])
    expect(registro.atos).toEqual(['ref', 'resume', 'pause', 'unref'])
  })

  it('devolver duas vezes é inofensivo, e devolver sem ter entrado também', () => {
    const { fluxos: f, registro } = fluxos()
    const terminal = criarTerminal({ fluxos: f, cor: false })
    terminal.restaurar()
    expect(registro.atos).toEqual([])
    terminal.entrar()
    terminal.restaurar()
    terminal.restaurar()
    expect(registro.atos.filter((ato) => ato === 'unref')).toHaveLength(1)
  })

  it('entrar duas vezes seguidas toma o terminal uma vez só', () => {
    const { fluxos: f, registro } = fluxos()
    const terminal = criarTerminal({ fluxos: f, cor: false })
    terminal.entrar()
    terminal.entrar()
    expect(registro.atos.filter((ato) => ato === 'resume')).toHaveLength(1)
  })

  it('a dança da suspensão devolve e retoma, quantas vezes for', () => {
    const { fluxos: f, registro } = fluxos()
    const terminal = criarTerminal({ fluxos: f, cor: false })
    terminal.entrar()
    terminal.restaurar()
    terminal.entrar()
    terminal.restaurar()
    expect(registro.atos.filter((ato) => ato === 'ref')).toHaveLength(2)
    expect(registro.atos.filter((ato) => ato === 'unref')).toHaveLength(2)
  })
})

describe('o desenho', () => {
  it('apaga antes de escrever, porque o redesenho é integral', () => {
    const { fluxos: f, registro } = fluxos()
    criarTerminal({ fluxos: f, cor: false }).desenhar({
      linhas: [{ texto: 'uma', enfase: 'normal', artefato: null }],
    })
    expect(registro.escrito.join('')).toBe('\u001b[2J\u001b[Huma')
  })

  it('separa as linhas com retorno e avanço, que é o que o modo bruto exige', () => {
    const { fluxos: f, registro } = fluxos()
    criarTerminal({ fluxos: f, cor: false }).desenhar({
      linhas: [
        { texto: 'uma', enfase: 'normal', artefato: null },
        { texto: 'outra', enfase: 'normal', artefato: null },
      ],
    })
    expect(registro.escrito.join('')).toContain('uma\r\noutra')
  })

  it('não veste ênfase alguma quando a cor está desligada', () => {
    const { fluxos: f, registro } = fluxos()
    criarTerminal({ fluxos: f, cor: false }).desenhar({
      linhas: ENFASES.map((enfase) => ({ texto: enfase, enfase, artefato: null })),
    })
    const corpo = registro.escrito.join('').replace('\u001b[2J\u001b[H', '')
    expect(corpo).not.toContain('\u001b')
  })

  it('veste as ênfases que têm vestimenta quando a cor está ligada', () => {
    const { fluxos: f, registro } = fluxos()
    criarTerminal({ fluxos: f, cor: true }).desenhar({
      linhas: [{ texto: 'título', enfase: 'titulo', artefato: null }],
    })
    expect(registro.escrito.join('')).toContain('\u001b[1mtítulo\u001b[0m')
  })
})

describe('a tradução da ênfase', () => {
  it('não devolve sequência alguma com a cor desligada, para nenhuma ênfase', () => {
    for (const enfase of ENFASES) {
      expect(vestir(enfase, false)).toEqual({ abre: '', fecha: '' })
    }
  })

  it('devolve o par fechado para toda ênfase que abre alguma coisa', () => {
    for (const enfase of ENFASES) {
      const { abre, fecha } = vestir(enfase, true)
      if (abre === '') expect(fecha, `a ênfase ${enfase} fecha sem ter aberto`).toBe('')
      else expect(fecha, `a ênfase ${enfase} abre sem fechar`).toBe('\u001b[0m')
    }
  })

  it('deixa a ênfase normal sem vestimenta mesmo com a cor ligada', () => {
    expect(vestir('normal', true)).toEqual({ abre: '', fecha: '' })
  })
})

describe('os ouvintes', () => {
  it('registram e sabem se desfazer', () => {
    const { fluxos: f, registro } = fluxos()
    const terminal = criarTerminal({ fluxos: f, cor: false })
    const pararTeclado = terminal.aoTeclar(() => undefined)
    const pararTamanho = terminal.aoRedimensionar(() => undefined)
    expect(registro.ouvintes).toEqual({ entrada: 1, saida: 1 })
    pararTeclado()
    pararTamanho()
    expect(registro.ouvintes).toEqual({ entrada: 0, saida: 0 })
  })

  it('entregam o bloco de bytes, venha ele como texto ou como buffer', () => {
    const blocos: Uint8Array[] = []
    const entrada = {
      isTTY: true,
      on(_evento: string, ouvinte: (pedaco: Buffer | string) => void) {
        ouvinte('q')
        ouvinte(Buffer.from([0x1b, 0x5b, 0x41]))
        return entrada
      },
      off() {
        return entrada
      },
    }
    const terminal = criarTerminal({
      fluxos: { entrada, saida: fluxos().fluxos.saida } as unknown as FluxosDoTerminal,
      cor: false,
    })
    terminal.aoTeclar((bloco) => blocos.push(bloco))
    expect([...blocos[0]]).toEqual([0x71])
    expect([...blocos[1]]).toEqual([0x1b, 0x5b, 0x41])
  })
})
