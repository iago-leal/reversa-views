/**
 * Suíte do terminal (feature 014, RN-08, D-05, D-07).
 *
 * O módulo toca o mundo, mas o que ele promete não precisa de terminal algum
 * para ser exercitado: os dois fluxos chegam como dependência, e uma dupla de
 * mentira registra o que foi pedido a cada um. O que se confere aqui é a
 * DEVOLUÇÃO do terminal, que é a promessa cujo descumprimento o usuário paga
 * com `reset`, e a tradução do papel abstrato em sequência, que é a fronteira
 * que o resto da ferramenta não pode atravessar.
 *
 * A pausa da entrada tem teste próprio porque já falhou: pausar não basta para
 * o processo terminar, e a ferramenta ficava de pé depois de `q`, com a tela
 * devolvida e nada mais a fazer. Soltar a referência é o que a derruba.
 */

import { describe, expect, it } from 'vitest'
import { DEZESSEIS, TONS } from '../src/cli/paleta.ts'
import type { PapelComTom } from '../src/cli/paleta.ts'
import { linha, trecho } from '../src/cli/quadro/trechos.ts'
import { criarTerminal, vestirLinha } from '../src/cli/terminal.ts'
import type { FluxosDoTerminal } from '../src/cli/terminal.ts'
import { PAPEIS } from '../src/cli/tipos.ts'
import type { Apresentacao, Papel } from '../src/cli/tipos.ts'

const SEM_COR: Apresentacao = { grau: 'nenhuma', tema: 'escuro', glifos: 'unicode' }
const EM_16: Apresentacao = { grau: '16', tema: 'escuro', glifos: 'unicode' }
const COM_TOM = PAPEIS.filter((papel) => papel !== 'normal' && papel !== 'titulo') as PapelComTom[]

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
    expect(criarTerminal({ fluxos: f, apresentacao: SEM_COR }).dimensoes()).toEqual({
      largura: 120,
      altura: 40,
    })
  })

  it('caem no padrão quando a saída não declara nenhuma', () => {
    const { fluxos: f } = fluxos({})
    expect(criarTerminal({ fluxos: f, apresentacao: SEM_COR }).dimensoes()).toEqual({ largura: 80, altura: 24 })
  })

  it('são relidas a cada chamada, porque a janela muda de tamanho', () => {
    const { fluxos: f } = fluxos({ colunas: 80, linhas: 24 })
    const terminal = criarTerminal({ fluxos: f, apresentacao: SEM_COR })
    expect(terminal.dimensoes().largura).toBe(80)
    ;(f.saida as unknown as { columns: number }).columns = 100
    expect(terminal.dimensoes().largura).toBe(100)
  })
})

describe('entrar e devolver o terminal', () => {
  it('entra em modo bruto, na tela alternativa, sem cursor', () => {
    const { fluxos: f, registro } = fluxos()
    criarTerminal({ fluxos: f, apresentacao: SEM_COR }).entrar()
    expect(registro.atos).toEqual(['bruto-liga', 'ref', 'resume'])
    expect(registro.escrito.join('')).toBe('\u001b[?1049h\u001b[?25l')
  })

  it('devolve tudo o que tomou, na ordem inversa', () => {
    const { fluxos: f, registro } = fluxos()
    const terminal = criarTerminal({ fluxos: f, apresentacao: SEM_COR })
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
    const terminal = criarTerminal({ fluxos: f, apresentacao: SEM_COR })
    terminal.entrar()
    terminal.restaurar()
    expect(registro.atos).toContain('unref')
    expect(registro.atos.indexOf('pause')).toBeLessThan(registro.atos.indexOf('unref'))
  })

  it('não mexe no modo bruto quando a entrada não é terminal', () => {
    const { fluxos: f, registro } = fluxos({ tty: false })
    const terminal = criarTerminal({ fluxos: f, apresentacao: SEM_COR })
    terminal.entrar()
    terminal.restaurar()
    expect(registro.bruto).toEqual([])
    expect(registro.atos).toEqual(['ref', 'resume', 'pause', 'unref'])
  })

  it('devolver duas vezes é inofensivo, e devolver sem ter entrado também', () => {
    const { fluxos: f, registro } = fluxos()
    const terminal = criarTerminal({ fluxos: f, apresentacao: SEM_COR })
    terminal.restaurar()
    expect(registro.atos).toEqual([])
    terminal.entrar()
    terminal.restaurar()
    terminal.restaurar()
    expect(registro.atos.filter((ato) => ato === 'unref')).toHaveLength(1)
  })

  it('entrar duas vezes seguidas toma o terminal uma vez só', () => {
    const { fluxos: f, registro } = fluxos()
    const terminal = criarTerminal({ fluxos: f, apresentacao: SEM_COR })
    terminal.entrar()
    terminal.entrar()
    expect(registro.atos.filter((ato) => ato === 'resume')).toHaveLength(1)
  })

  it('a dança da suspensão devolve e retoma, quantas vezes for', () => {
    const { fluxos: f, registro } = fluxos()
    const terminal = criarTerminal({ fluxos: f, apresentacao: SEM_COR })
    terminal.entrar()
    terminal.restaurar()
    terminal.entrar()
    terminal.restaurar()
    expect(registro.atos.filter((ato) => ato === 'ref')).toHaveLength(2)
    expect(registro.atos.filter((ato) => ato === 'unref')).toHaveLength(2)
  })
})

describe('o desenho', () => {
  // Disposição (feature 016, T032): a linha deixou de ter uma ênfase e passou
  // a ter trechos com papel, e o terminal deixou de receber "há cor" e passou
  // a receber o degrau e o fundo. O que os casos prendiam continua preso:
  // apagar antes de escrever, separar com retorno e avanço, nenhuma sequência
  // com a cor desligada, e a vestimenta fechada quando há cor.
  it('apaga antes de escrever, porque o redesenho é integral', () => {
    const { fluxos: f, registro } = fluxos()
    criarTerminal({ fluxos: f, apresentacao: SEM_COR }).desenhar({
      linhas: [linha([trecho('uma')])],
      alturaTotal: 1,
      linhaDeEstado: null,
    })
    expect(registro.escrito.join('')).toBe('\u001b[2J\u001b[Huma')
  })

  it('separa as linhas com retorno e avanço, que é o que o modo bruto exige', () => {
    const { fluxos: f, registro } = fluxos()
    criarTerminal({ fluxos: f, apresentacao: SEM_COR }).desenhar({
      linhas: [linha([trecho('uma')]), linha([trecho('outra')])],
      alturaTotal: 2,
      linhaDeEstado: null,
    })
    expect(registro.escrito.join('')).toContain('uma\r\noutra')
  })

  it('não veste papel algum quando a cor está desligada, e o texto sai inteiro (RF-12)', () => {
    const { fluxos: f, registro } = fluxos()
    criarTerminal({ fluxos: f, apresentacao: SEM_COR }).desenhar({
      linhas: PAPEIS.map((papel) => linha([trecho('╭─ ', 'acento'), trecho(papel, papel)])),
      alturaTotal: PAPEIS.length,
      linhaDeEstado: null,
    })
    const corpo = registro.escrito.join('').replace('\u001b[2J\u001b[H', '')
    expect(corpo).not.toContain('\u001b')
    expect(corpo).toContain('╭─ acento')
  })

  it('veste os papéis que têm vestimenta quando a cor está ligada', () => {
    const { fluxos: f, registro } = fluxos()
    criarTerminal({ fluxos: f, apresentacao: EM_16 }).desenhar({
      linhas: [linha([trecho('título', 'titulo')])],
      alturaTotal: 1,
      linhaDeEstado: null,
    })
    expect(registro.escrito.join('')).toContain('\u001b[1mtítulo\u001b[0m')
  })

  it('escreve a linha de estado na última linha da janela, por posicionamento, depois do corpo', () => {
    const { fluxos: f, registro } = fluxos({ linhas: 24, colunas: 80 })
    criarTerminal({ fluxos: f, apresentacao: SEM_COR }).desenhar({
      linhas: [linha([trecho('corpo')])],
      alturaTotal: 300,
      linhaDeEstado: linha([trecho('linhas 1–23 de 300 ↓')]),
    })
    expect(registro.escrito.join('')).toBe('\u001b[2J\u001b[Hcorpo\u001b[24;1Hlinhas 1–23 de 300 ↓')
  })

  it('a linha de estado fica embaixo também quando o quadro é mais curto que a janela', () => {
    const { fluxos: f, registro } = fluxos({ linhas: 50 })
    criarTerminal({ fluxos: f, apresentacao: SEM_COR }).desenhar({
      linhas: [linha([trecho('só uma')])],
      alturaTotal: 1,
      linhaDeEstado: linha([trecho('estado')]),
    })
    expect(registro.escrito.join('')).toContain('\u001b[50;1Hestado')
  })

  it('sem linha de estado, nada é posicionado', () => {
    const { fluxos: f, registro } = fluxos({ linhas: 24 })
    criarTerminal({ fluxos: f, apresentacao: EM_16 }).desenhar({
      linhas: [linha([trecho('uma')])],
      alturaTotal: 1,
      linhaDeEstado: null,
    })
    expect(registro.escrito.join('')).not.toMatch(/\u001b\[\d+;1H/)
  })
})

describe('a tradução do papel, nos quatro degraus e nos dois fundos (feature 016, RF-11, D-21)', () => {
  const ABRE = /\u001b\[([\d;]+)m/

  /** Os parâmetros com que um papel é aberto, ou nulo quando sai cru. */
  function aberto(papel: Papel, apresentacao: Apresentacao): string | null {
    return ABRE.exec(vestirLinha(linha([trecho('x', papel)]), apresentacao))?.[1] ?? null
  }

  it('com o degrau nenhuma, nenhum papel produz sequência, em nenhum dos fundos', () => {
    for (const tema of ['escuro', 'claro'] as const) {
      for (const papel of PAPEIS) {
        expect(vestirLinha(linha([trecho('x', papel)]), { ...SEM_COR, tema })).toBe('x')
      }
    }
  })

  it('em 24 bits, cada papel sai no tom da paleta do fundo declarado', () => {
    for (const tema of ['escuro', 'claro'] as const) {
      for (const papel of COM_TOM) {
        const esperado = `38;2;${TONS[tema][papel].vinteEQuatroBits.join(';')}`
        expect(aberto(papel, { grau: '24bits', tema, glifos: 'unicode' })).toContain(esperado)
      }
    }
  })

  it('em 256 cores, cada papel sai no índice da paleta do fundo declarado', () => {
    for (const tema of ['escuro', 'claro'] as const) {
      for (const papel of COM_TOM) {
        const esperado = `38;5;${TONS[tema][papel].duzentasECinquentaESeis}`
        expect(aberto(papel, { grau: '256', tema, glifos: 'unicode' })).toContain(esperado)
      }
    }
  })

  it('em 16 cores o fundo não importa, e atenuado e borda saem por intensidade reduzida', () => {
    for (const papel of COM_TOM) {
      expect(aberto(papel, { ...EM_16, tema: 'claro' })).toBe(aberto(papel, EM_16))
    }
    expect(aberto('atenuado', EM_16)).toBe('2')
    expect(aberto('borda', EM_16)).toBe('2')
    expect(aberto('falha', EM_16)).toBe(String(DEZESSEIS.falha))
  })

  it('`normal` não leva cor em degrau algum, e `titulo` leva peso e nenhuma cor', () => {
    for (const grau of ['16', '256', '24bits'] as const) {
      const apresentacao: Apresentacao = { grau, tema: 'claro', glifos: 'unicode' }
      expect(aberto('normal', apresentacao)).toBeNull()
      expect(aberto('titulo', apresentacao)).toBe('1')
    }
  })

  it('o destaque leva peso além da cor, e o acento não', () => {
    const apresentacao: Apresentacao = { grau: '256', tema: 'claro', glifos: 'unicode' }
    expect(aberto('destaque', apresentacao)).toBe(`1;38;5;${TONS.claro.destaque.duzentasECinquentaESeis}`)
    expect(aberto('acento', apresentacao)).toBe(`38;5;${TONS.claro.acento.duzentasECinquentaESeis}`)
  })

  it('um terminal de 256 cores nunca recebe sequência de 24 bits', () => {
    for (const papel of PAPEIS) {
      expect(vestirLinha(linha([trecho('x', papel)]), { grau: '256', tema: 'escuro', glifos: 'unicode' })).not.toContain('38;2;')
    }
  })

  it('funde trechos vizinhos de mesmo papel numa sequência só', () => {
    const vestida = vestirLinha(
      linha([trecho('│ ', 'acento'), trecho('  ', 'acento'), trecho('meio'), trecho(' │', 'acento')]),
      EM_16,
    )
    expect(vestida).toBe('\u001b[33m│   \u001b[0mmeio\u001b[33m │\u001b[0m')
  })

  it('fecha a cor ao fim de cada linha, para que um tom não vaze para a seguinte', () => {
    for (const papel of COM_TOM) {
      expect(vestirLinha(linha([trecho('x', papel)]), EM_16).endsWith('\u001b[0m')).toBe(true)
    }
    expect(vestirLinha(linha([trecho('x', 'falha'), trecho(' y')]), EM_16)).toBe('\u001b[31mx\u001b[0m y')
  })

  it('retiradas as sequências, o que sobra é o texto da linha', () => {
    const desenhada = linha([trecho('❯ ', 'acento'), trecho('▾ ', 'acento'), trecho('Título', 'destaque'), trecho(' (5)', 'atenuado')])
    for (const grau of ['16', '256', '24bits'] as const) {
      const vestida = vestirLinha(desenhada, { grau, tema: 'escuro', glifos: 'unicode' })
      expect(vestida.replace(/\u001b\[[\d;]*m/g, '')).toBe(desenhada.texto)
    }
  })
})

describe('nada é escrito antes do primeiro desenho (feature 016, T054, RF-20, D-07)', () => {
  it('montar o terminal não escreve byte algum', () => {
    const { fluxos: f, registro } = fluxos()
    criarTerminal({ fluxos: f, apresentacao: { grau: '24bits', tema: 'claro', glifos: 'unicode' } })
    expect(registro.escrito).toEqual([])
  })

  it('entrar escreve só a tela alternativa e o cursor, e nenhuma pergunta ao terminal', () => {
    const { fluxos: f, registro } = fluxos()
    criarTerminal({ fluxos: f, apresentacao: EM_16 }).entrar()
    expect(registro.escrito.join('')).toBe('\u001b[?1049h\u001b[?25l')
  })

  it('o primeiro byte depois de entrar é o do primeiro desenho', () => {
    const { fluxos: f, registro } = fluxos()
    const terminal = criarTerminal({ fluxos: f, apresentacao: EM_16 })
    terminal.entrar()
    terminal.desenhar({ linhas: [linha([trecho('uma')])], alturaTotal: 1, linhaDeEstado: null })
    expect(registro.escrito[1].startsWith('\u001b[2J')).toBe(true)
  })

  it('nenhuma escrita é consulta: nem cor de fundo, nem atributos, nem posição do cursor', () => {
    const { fluxos: f, registro } = fluxos({ linhas: 24 })
    const terminal = criarTerminal({ fluxos: f, apresentacao: EM_16 })
    terminal.entrar()
    terminal.desenhar({
      linhas: [linha([trecho('uma', 'acento')])],
      alturaTotal: 1,
      linhaDeEstado: linha([trecho('estado')]),
    })
    terminal.restaurar()
    const tudo = registro.escrito.join('')
    // As consultas do protocolo: a de cor, que começa pelo comando de sistema
    // operacional, e as de estado e de atributos, que terminam em `n` e em `c`.
    expect(tudo).not.toContain('\u001b]')
    expect(tudo).not.toMatch(/\u001b\[[\d;?]*[nc]/)
  })
})

describe('os ouvintes', () => {
  it('registram e sabem se desfazer', () => {
    const { fluxos: f, registro } = fluxos()
    const terminal = criarTerminal({ fluxos: f, apresentacao: SEM_COR })
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
      apresentacao: SEM_COR,
    })
    terminal.aoTeclar((bloco) => blocos.push(bloco))
    expect([...blocos[0]]).toEqual([0x71])
    expect([...blocos[1]]).toEqual([0x1b, 0x5b, 0x41])
  })
})
