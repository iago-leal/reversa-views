/**
 * Suíte do atualizador (T035 a T037; RF-01 a RF-08, RN-04, D-12).
 *
 * O ritual tem dois atos, e a suíte guarda a separação entre eles: a
 * conferência nunca escreve, e a aplicação recusa antes de escrever quando a
 * árvore está suja ou há commit local à frente. Os três códigos de saída seguem
 * o esquema de `verificar-heranca.js`, e é o que um script de fora lê.
 *
 * Nada aqui toca rede, clone ou editor. O mundo entra por `FERRAMENTAS`, e cada
 * caso diz o que o git responderia.
 * @module tests/atualizador
 */

import { describe, expect, it } from 'vitest'
import { ErroDeGit } from '../scripts/git.js'
import {
  COMPRIMENTO_CURTO,
  SAIDA_EM_DIA,
  SAIDA_IMPOSSIVEL,
  SAIDA_REPROVADO,
  aplicar,
  conferir,
  encurtar,
  principal,
  relatar,
} from '../scripts/atualizar.js'

const COMMIT = 'a23711d481021a978720c0bc478b6dabed94fec3'
const NOVO = 'b7c9e1f2a3b4c5d6e7f8091a2b3c4d5e6f708192'

/** Um clone de mentira, em dia por padrão, que grava o que o atualizador mandou fazer. */
function mundo(
  opcoes: {
    clone?: boolean
    remoto?: string | null
    ramo?: string | null
    buscar?: () => void
    atras?: number | null
    aFrente?: number | null
    sujeira?: string[]
    lockMudou?: boolean
    falhaEm?: string | null
    editor?: boolean
    pacoteExiste?: boolean
  } = {},
) {
  const feito: string[] = []
  const saida: string[] = []
  const erro: string[] = []
  let cabeca = COMMIT
  const ferramentas = {
    eClone: () => opcoes.clone ?? true,
    remoto: () => (opcoes.remoto === undefined ? 'https://example.test/x.git' : opcoes.remoto),
    ramo: () => (opcoes.ramo === undefined ? 'master' : opcoes.ramo),
    revisao: () => cabeca,
    buscar: () => {
      feito.push('buscar')
      if (opcoes.buscar) opcoes.buscar()
    },
    contar: (_raiz: string, de: string, ate: string) => {
      if (de === 'HEAD') return opcoes.atras === undefined ? 0 : opcoes.atras
      if (ate === 'HEAD') return opcoes.aFrente === undefined ? 0 : opcoes.aFrente
      return null
    },
    sujeira: () => opcoes.sujeira ?? [],
    incorporar: (_raiz: string, referencia: string) => {
      feito.push(`incorporar ${referencia}`)
      cabeca = NOVO
    },
    mudados: () => (opcoes.lockMudou ? ['package-lock.json'] : []),
    rodar: (_raiz: string, comando: string, argumentos: string[]) => {
      const linha = `${comando} ${argumentos.join(' ')}`
      feito.push(linha)
      if (opcoes.falhaEm && linha === opcoes.falhaEm) throw new Error(`reprovou: ${linha}`)
    },
    temEditor: () => opcoes.editor ?? false,
    instalar: (_raiz: string, pacote: string) => {
      feito.push(`instalar ${pacote}`)
    },
    nomeDoPacote: () => 'reversa-views-0.6.2.vsix',
    existe: () => opcoes.pacoteExiste ?? true,
    escrever: (texto: string) => saida.push(texto),
    escreverErro: (texto: string) => erro.push(texto),
  }
  return { ferramentas, feito, saida: () => saida.join(''), erro: () => erro.join('') }
}

describe('a forma curta do commit (RF-08, D-18)', () => {
  it('tem sete caracteres, os mesmos que o painel mostra', () => {
    expect(COMPRIMENTO_CURTO).toBe(7)
    expect(encurtar(COMMIT)).toBe('a23711d')
  })

  it('valor menor que sete volta inteiro, e vazio volta vazio', () => {
    expect(encurtar('abc')).toBe('abc')
    expect(encurtar(null)).toBe('')
  })

  it('o relato imprime o commit na forma curta', () => {
    const m = mundo()
    expect(relatar(conferir('/repo', m.ferramentas))).toContain('a23711d')
    expect(relatar(conferir('/repo', m.ferramentas))).not.toContain(COMMIT)
  })
})

describe('a conferência e seus três desfechos (RF-01, RF-02)', () => {
  it('em dia: código zero, e nada além de buscar foi feito', () => {
    const m = mundo()
    expect(principal([], '/repo', m.ferramentas)).toBe(SAIDA_EM_DIA)
    expect(m.feito).toEqual(['buscar'])
    expect(m.saida()).toContain('Em dia')
  })

  it('atrás de N commits: código um, a contagem e o comando para aplicar', () => {
    const m = mundo({ atras: 3 })
    expect(principal([], '/repo', m.ferramentas)).toBe(SAIDA_REPROVADO)
    expect(m.saida()).toContain('3 commit')
    expect(m.saida()).toContain('npm run atualizar -- --aplicar')
    expect(m.feito).toEqual(['buscar'])
  })

  it('atrás e com commit próprio: avisa que a aplicação vai recusar', () => {
    const m = mundo({ atras: 3, aFrente: 1 })
    principal([], '/repo', m.ferramentas)
    expect(m.saida()).toMatch(/próprio/)
    expect(m.saida()).not.toContain('npm run atualizar -- --aplicar')
  })

  it('a conferência nunca incorpora nem roda passo algum', () => {
    const m = mundo({ atras: 5 })
    principal([], '/repo', m.ferramentas)
    expect(m.feito.filter((f) => f !== 'buscar')).toEqual([])
  })
})

describe('impossível conferir, com a causa nomeada (RF-03)', () => {
  it('fora de um clone', () => {
    const m = mundo({ clone: false })
    const r = conferir('/repo', m.ferramentas)
    expect(r.desfecho).toBe('impossivel')
    expect(r.causa).toBe('sem-clone')
    expect(principal([], '/repo', m.ferramentas)).toBe(SAIDA_IMPOSSIVEL)
  })

  it('sem remoto configurado, e diz como criá-lo', () => {
    const m = mundo({ remoto: null })
    const r = conferir('/repo', m.ferramentas)
    expect(r.causa).toBe('sem-remoto')
    expect(r.explicacao).toContain('git remote add')
    expect(m.feito).toEqual([])
  })

  it('git ausente', () => {
    const m = mundo({
      buscar: () => {
        throw new ErroDeGit('não há git', { causa: 'ausente', comando: 'git fetch' })
      },
    })
    expect(conferir('/repo', m.ferramentas).causa).toBe('git-ausente')
  })

  it('sem rede, seja por tempo esgotado ou por busca reprovada', () => {
    const tempo = mundo({
      buscar: () => {
        throw new ErroDeGit('demorou', { causa: 'tempo-esgotado', comando: 'git fetch' })
      },
    })
    const reprovada = mundo({
      buscar: () => {
        throw new ErroDeGit('reprovou', {
          causa: 'falhou',
          comando: 'git fetch',
          saidaDeErro: 'Could not resolve host',
        })
      },
    })
    expect(conferir('/repo', tempo.ferramentas).causa).toBe('sem-rede')
    expect(conferir('/repo', reprovada.ferramentas).causa).toBe('sem-rede')
    expect(conferir('/repo', reprovada.ferramentas).explicacao).toContain('Could not resolve host')
  })

  it('ramo que a origem não tem', () => {
    const m = mundo({ atras: null })
    expect(conferir('/repo', m.ferramentas).causa).toBe('sem-ramo-na-origem')
  })

  it('cabeça solta compara contra o ramo de recuo', () => {
    const m = mundo({ ramo: null })
    expect(conferir('/repo', m.ferramentas).ramo).toBe('master')
  })

  it('todo desfecho impossível sai com código dois e explica', () => {
    for (const m of [mundo({ clone: false }), mundo({ remoto: null }), mundo({ atras: null })]) {
      expect(principal([], '/repo', m.ferramentas)).toBe(SAIDA_IMPOSSIVEL)
      expect(m.saida()).toContain('Impossível conferir')
    }
  })
})

describe('a aplicação é um segundo ato (RF-04)', () => {
  it('sem --aplicar, nada é incorporado mesmo estando atrás', () => {
    const m = mundo({ atras: 2 })
    principal([], '/repo', m.ferramentas)
    expect(m.feito).not.toContain('incorporar origin/master')
  })

  it('argumento que não é --aplicar é recusado, nomeando o aceito', () => {
    const m = mundo()
    expect(principal(['--forca'], '/repo', m.ferramentas)).toBe(SAIDA_REPROVADO)
    expect(m.erro()).toContain('--aplicar')
    expect(m.feito).toEqual([])
  })

  it('em dia, --aplicar não tem o que aplicar e sai em zero', () => {
    const m = mundo()
    expect(principal(['--aplicar'], '/repo', m.ferramentas)).toBe(SAIDA_EM_DIA)
    expect(m.feito).toEqual(['buscar'])
  })
})

describe('as duas recusas, antes de tocar em qualquer coisa (RF-05)', () => {
  it('árvore suja: código de recusa, os arquivos nomeados, nada incorporado', () => {
    const m = mundo({ atras: 2, sujeira: [' M src/a.ts', '?? novo.md'] })
    expect(aplicar('/repo', m.ferramentas)).toBe(SAIDA_REPROVADO)
    expect(m.erro()).toContain('src/a.ts')
    expect(m.erro()).toContain('novo.md')
    expect(m.feito).toEqual(['buscar'])
  })

  it('commit local à frente: código de recusa, a contagem nomeada, nada incorporado', () => {
    const m = mundo({ atras: 2, aFrente: 1 })
    expect(aplicar('/repo', m.ferramentas)).toBe(SAIDA_REPROVADO)
    expect(m.erro()).toContain('1 commit')
    expect(m.feito).toEqual(['buscar'])
  })
})

describe('o percurso da aplicação (RF-06)', () => {
  it('incorpora por avanço rápido e roda construção, suíte e empacotamento, nessa ordem', () => {
    const m = mundo({ atras: 2 })
    expect(aplicar('/repo', m.ferramentas)).toBe(SAIDA_EM_DIA)
    expect(m.feito).toEqual([
      'buscar',
      'incorporar origin/master',
      'npm run build',
      'npm test',
      'npm run empacotar',
    ])
  })

  it('reinstala as dependências só quando o arquivo de trava mudou', () => {
    const m = mundo({ atras: 2, lockMudou: true })
    aplicar('/repo', m.ferramentas)
    expect(m.feito.slice(0, 3)).toEqual(['buscar', 'incorporar origin/master', 'npm ci'])
  })

  it('para na primeira falha, e o empacotamento não acontece', () => {
    const m = mundo({ atras: 2, falhaEm: 'npm test' })
    expect(aplicar('/repo', m.ferramentas)).toBe(SAIDA_REPROVADO)
    expect(m.feito).not.toContain('npm run empacotar')
    expect(m.erro()).toContain('suíte')
  })

  it('a incorporação que reprova para o percurso antes de qualquer passo', () => {
    const m = mundo({ atras: 2 })
    m.ferramentas.incorporar = () => {
      throw new ErroDeGit('não avança', { causa: 'falhou', comando: 'git merge', saidaDeErro: 'not possible to fast-forward' })
    }
    expect(aplicar('/repo', m.ferramentas)).toBe(SAIDA_REPROVADO)
    expect(m.feito).toEqual(['buscar'])
    expect(m.erro()).toContain('fast-forward')
  })

  it('o relato imprime o commit de antes e o de depois, na forma curta', () => {
    const m = mundo({ atras: 2 })
    aplicar('/repo', m.ferramentas)
    expect(m.saida()).toContain('a23711d')
    expect(m.saida()).toContain('b7c9e1f')
  })
})

describe('o fecho: a linha de instalação (RF-07)', () => {
  it('imprime o comando com o nome do pacote gerado', () => {
    const m = mundo({ atras: 1 })
    aplicar('/repo', m.ferramentas)
    expect(m.saida()).toContain('code --install-extension reversa-views-0.6.2.vsix')
  })

  it('sem o editor no caminho, termina em zero e diz para copiar a linha', () => {
    const m = mundo({ atras: 1, editor: false })
    expect(aplicar('/repo', m.ferramentas)).toBe(SAIDA_EM_DIA)
    expect(m.feito.some((f) => f.startsWith('instalar'))).toBe(false)
    expect(m.saida()).toMatch(/copie a linha/)
  })

  it('com o editor no caminho, tenta instalar', () => {
    const m = mundo({ atras: 1, editor: true })
    expect(aplicar('/repo', m.ferramentas)).toBe(SAIDA_EM_DIA)
    expect(m.feito).toContain('instalar reversa-views-0.6.2.vsix')
  })

  it('se o pacote não apareceu na raiz, é falha nomeada e não instalação de fantasma', () => {
    const m = mundo({ atras: 1, pacoteExiste: false })
    expect(aplicar('/repo', m.ferramentas)).toBe(SAIDA_REPROVADO)
    expect(m.erro()).toContain('reversa-views-0.6.2.vsix')
  })
})
