/**
 * Suíte do contrato de linha de comando (T007, feature 014).
 *
 * O contrato está escrito em
 * `_reversa_forward/014-cli-do-processo/interfaces/contrato-de-linha-de-comando.md`,
 * e alterá-lo é alterar comportamento observável. Esta suíte é a forma
 * executável dele: cada bandeira, a escolha do modo em três degraus, a
 * precedência de `--dados`, os três códigos de saída e a recusa nomeada.
 */

import { describe, expect, it } from 'vitest'
import type { MundoDosArgumentos } from '../src/cli/argumentos.ts'
import { CODIGOS, lerArgumentos } from '../src/cli/argumentos.ts'

/** Um mundo previsível, com o disco e o terminal declarados em vez de medidos. */
function mundo(partes: Partial<MundoDosArgumentos> = {}): MundoDosArgumentos {
  return {
    diretorioCorrente: '/projeto',
    eDiretorio: () => true,
    saidaEhTerminal: true,
    ambiente: {},
    ...partes,
  }
}

/** A configuração de uma leitura que deu certo, ou o teste falha dizendo o quê. */
function config(argumentos: string[], partes: Partial<MundoDosArgumentos> = {}) {
  const leitura = lerArgumentos(argumentos, mundo(partes))
  if (leitura.kind !== 'config') throw new Error(`esperava configuração, veio ${leitura.kind}`)
  return leitura.config
}

describe('os três códigos de saída', () => {
  it('nomeia zero para a leitura, um para a falha e dois para o uso incorreto', () => {
    expect(CODIGOS).toEqual({ ok: 0, falha: 1, uso: 2 })
  })
})

describe('a raiz observada', () => {
  it('sem bandeira, é o diretório corrente', () => {
    expect(config([]).raiz).toBe('/projeto')
  })

  it('com a bandeira, é o caminho pedido, resolvido sob o diretório corrente', () => {
    expect(config(['--workspace=sub']).raiz).toBe('/projeto/sub')
    expect(config(['--workspace=/outro']).raiz).toBe('/outro')
  })

  it('caminho inexistente é recusado com o código de uso incorreto, nomeando-o', () => {
    const leitura = lerArgumentos(['--workspace=/nao/existe'], mundo({ eDiretorio: () => false }))
    expect(leitura.kind).toBe('uso-incorreto')
    if (leitura.kind !== 'uso-incorreto') return
    expect(leitura.mensagem).toContain('/nao/existe')
    expect(leitura.codigo).toBe(CODIGOS.uso)
  })
})

describe('a escolha do modo, em três degraus', () => {
  it('`--dados` vence tudo, inclusive `--vivo`', () => {
    expect(config(['--dados']).modo).toBe('dados')
    expect(config(['--vivo', '--dados']).modo).toBe('dados')
    expect(config(['--dados', '--vivo']).modo).toBe('dados')
  })

  it('a bandeira presente decide, contra o que a saída diz', () => {
    expect(config(['--passada'], { saidaEhTerminal: true }).modo).toBe('passada')
    expect(config(['--vivo'], { saidaEhTerminal: false }).modo).toBe('vivo')
  })

  it('sem bandeira, a interface viva só nasce se a saída for um terminal', () => {
    expect(config([], { saidaEhTerminal: true }).modo).toBe('vivo')
    expect(config([], { saidaEhTerminal: false }).modo).toBe('passada')
  })
})

describe('a conferência de atualização', () => {
  it('é feita por padrão', () => {
    expect(config([]).conferir).toBe(true)
  })

  it('a bandeira e a variável são equivalentes, e qualquer uma basta', () => {
    expect(config(['--sem-conferir']).conferir).toBe(false)
    expect(config([], { ambiente: { REVERSA_VIEWS_SEM_CONFERIR: '1' } }).conferir).toBe(false)
    expect(config([], { ambiente: { REVERSA_VIEWS_SEM_CONFERIR: '' } }).conferir).toBe(false)
  })
})

describe('a cor', () => {
  it('existe em terminal e some quando a saída é redirecionada', () => {
    expect(config([], { saidaEhTerminal: true }).cor).toBe(true)
    expect(config(['--passada'], { saidaEhTerminal: false }).cor).toBe(false)
  })

  it('some pela bandeira e pela variável, com qualquer valor', () => {
    expect(config(['--sem-cor']).cor).toBe(false)
    expect(config([], { ambiente: { NO_COLOR: '1' } }).cor).toBe(false)
    expect(config([], { ambiente: { NO_COLOR: '' } }).cor).toBe(false)
  })
})

describe('a descrição do próprio uso', () => {
  it('`--ajuda` termina com código zero, sem ler coisa alguma', () => {
    const leitura = lerArgumentos(['--ajuda'], mundo())
    expect(leitura.kind).toBe('ajuda')
    if (leitura.kind !== 'ajuda') return
    expect(leitura.codigo).toBe(CODIGOS.ok)
  })
})

describe('a recusa nomeada (RF-25)', () => {
  it('nomeia o argumento que não reconhece', () => {
    const leitura = lerArgumentos(['--dados', '--inventado'], mundo())
    expect(leitura.kind).toBe('uso-incorreto')
    if (leitura.kind !== 'uso-incorreto') return
    expect(leitura.mensagem).toContain('--inventado')
    expect(leitura.codigo).toBe(CODIGOS.uso)
  })

  it('recusa também o que não é bandeira alguma', () => {
    const leitura = lerArgumentos(['solto'], mundo())
    expect(leitura.kind).toBe('uso-incorreto')
    if (leitura.kind !== 'uso-incorreto') return
    expect(leitura.mensagem).toContain('solto')
  })

  it('recusa `--workspace` sem valor, que é uso incorreto e não caminho vazio', () => {
    const leitura = lerArgumentos(['--workspace'], mundo())
    expect(leitura.kind).toBe('uso-incorreto')
  })
})

describe('o tema, por bandeira e por variável (feature 016, T034, RF-20, RF-21, D-09)', () => {
  // Acréscimo, e não reescrita: a configuração ganhou o campo `apresentacao` e
  // a leitura ganhou o campo `aviso`. Nenhuma expectativa de antes mudou.

  /** A leitura inteira, e não só a configuração, porque o aviso mora nela. */
  function leitura(argumentos: string[], partes: Partial<MundoDosArgumentos> = {}) {
    return lerArgumentos(argumentos, mundo(partes))
  }

  it('sem nada declarado, vale o fundo escuro', () => {
    expect(config([]).apresentacao.tema).toBe('escuro')
  })

  it('a bandeira válida decide o fundo', () => {
    expect(config(['--tema=claro']).apresentacao.tema).toBe('claro')
    expect(config(['--tema=escuro']).apresentacao.tema).toBe('escuro')
  })

  it('a bandeira vence a variável', () => {
    const lida = config(['--tema=escuro'], { ambiente: { REVERSA_VIEWS_TEMA: 'claro' } })
    expect(lida.apresentacao.tema).toBe('escuro')
  })

  it('sem bandeira, vale a variável, e sem as duas vale o que `COLORFGBG` declara', () => {
    expect(config([], { ambiente: { REVERSA_VIEWS_TEMA: 'claro' } }).apresentacao.tema).toBe('claro')
    expect(config([], { ambiente: { COLORFGBG: '0;15' } }).apresentacao.tema).toBe('claro')
  })

  it('a bandeira inválida é uso incorreto, nomeia o valor, e nada é lido pela metade', () => {
    const lida = leitura(['--tema=roxo'])
    expect(lida.kind).toBe('uso-incorreto')
    if (lida.kind !== 'uso-incorreto') return
    expect(lida.codigo).toBe(CODIGOS.uso)
    expect(lida.motivo).toBe('argumento')
    expect(lida.mensagem).toContain('roxo')
  })

  it('a bandeira sem valor também é uso incorreto', () => {
    const lida = leitura(['--tema='])
    expect(lida.kind).toBe('uso-incorreto')
  })

  it('a variável inválida não impede a ferramenta de abrir: avisa, e a precedência segue', () => {
    const lida = leitura([], { ambiente: { REVERSA_VIEWS_TEMA: 'roxo', COLORFGBG: '0;15' } })
    expect(lida.kind).toBe('config')
    if (lida.kind !== 'config') return
    expect(lida.aviso).toContain('roxo')
    expect(lida.config.apresentacao.tema).toBe('claro')
  })

  it('sem nada de errado, o aviso é nulo', () => {
    const lida = leitura(['--tema=claro'])
    expect(lida.kind === 'config' && lida.aviso).toBeNull()
  })

  it('`cor` e o degrau dizem a mesma coisa, em todo caso', () => {
    const casos: [string[], Partial<MundoDosArgumentos>][] = [
      [[], {}],
      [['--sem-cor'], {}],
      [[], { ambiente: { NO_COLOR: '' } }],
      [[], { saidaEhTerminal: false }],
      [[], { ambiente: { COLORTERM: 'truecolor' } }],
      [[], { ambiente: { TERM: 'xterm-256color' } }],
      [[], { ambiente: { TERM: 'dumb' } }],
    ]
    for (const [argumentos, partes] of casos) {
      const lida = config(argumentos, partes)
      expect(lida.cor, JSON.stringify([argumentos, partes])).toBe(lida.apresentacao.grau !== 'nenhuma')
    }
  })

  it('o degrau e o jogo de glifos saem do ambiente, e não de bandeira', () => {
    const lida = config([], { ambiente: { COLORTERM: 'truecolor', LANG: 'pt_BR.UTF-8' } })
    expect(lida.apresentacao).toEqual({ grau: '24bits', tema: 'escuro', glifos: 'unicode' })
    expect(config([], { ambiente: { LC_ALL: 'C' } }).apresentacao.glifos).toBe('sete-bits')
  })
})
