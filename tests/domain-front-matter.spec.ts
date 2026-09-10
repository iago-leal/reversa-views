/**
 * O interpretador restrito de front matter (D-02, D-03, RN-01).
 *
 * A suíte trabalha sobre as fixtures de `tests/fixtures/registro-de-bugs/`, e
 * três delas são transcrições literais dos `bug.md` que o registro deste
 * projeto tinha em 2026-09-10. Isso é o ponto, e não conveniência: o risco de
 * maior impacto desta feature é o leitor restrito ler mal um front matter
 * legítimo e o bloco perder um bug de vista, e material sintético sozinho não
 * o cobre, porque ele é escrito por quem já sabe o que o leitor faz.
 *
 * O leitor não julga vocabulário nem forma de data: ele entrega o que leu, com
 * o valor como veio. Quem decide o que é estado conhecido é `domain/bugs.ts`, e
 * separar as duas coisas é o que permite fixar aqui, sem ambiguidade, que um
 * campo em forma que ele não lê volta como NÃO LIDO, e nunca como valor
 * inventado.
 * @module tests/domain-front-matter
 */

import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { readFrontMatter } from '../src/domain/front-matter.ts'

const PASTA = 'tests/fixtures/registro-de-bugs'

/** Uma fixture, pelo nome do arquivo. */
function fixture(nome: string): string {
  return readFileSync(`${PASTA}/${nome}`, 'utf8')
}

/** As três transcrições literais, com o identificador que cada uma declara. */
const REAIS: ReadonlyArray<[string, string]> = [
  ['real-BUG-20260909-FJBD-anomalia-cenario-ambiguo.md', 'BUG-20260909-FJBD'],
  ['real-BUG-20260909-VHII-instalacao-anterior-a-007.md', 'BUG-20260909-VHII'],
  ['real-BUG-20260910-74UL-duvida-falsa-no-historico.md', 'BUG-20260910-74UL'],
]

describe('os três front matters reais, atravessados inteiros', () => {
  it('lê o bloco dos três, sem falha alguma', () => {
    for (const [nome] of REAIS) {
      const lido = readFrontMatter(fixture(nome))
      expect(lido.presente, nome).toBe(true)
      expect(lido.falha, nome).toBeNull()
    }
  })

  it('lê os dez campos consumidos de cada um deles', () => {
    const consumidos = [
      'id',
      'display_number',
      'title',
      'status',
      'phase',
      'severity',
      'priority',
      'created',
      'updated',
      'visibility',
    ]
    for (const [nome] of REAIS) {
      const lido = readFrontMatter(fixture(nome))
      for (const campo of consumidos) {
        expect(lido.escalares[campo], `${nome}: ${campo}`).toEqual(expect.any(String))
        expect(lido.escalares[campo], `${nome}: ${campo} veio vazio`).not.toBe('')
      }
    }
  })

  /**
   * A armadilha que a apuração de T001 encontrou nos arquivos reais.
   *
   * Dois dos três trazem `- id: CHG-001` indentado sob `change_set:`. Um leitor
   * que aparasse o espaço à esquerda e o hífen antes de cortar a chave leria
   * essa linha como chave de topo e trocaria o identificador do bug pelo
   * identificador da última mudança do change set. O bug não sumiria da lista:
   * apareceria com o nome errado, e o clique abriria o arquivo certo sob um
   * nome que não é o dele. Nenhuma anomalia seria registrada por isso.
   */
  it('não confunde `- id:` do change set com o identificador do bug', () => {
    for (const [nome, id] of REAIS) {
      const lido = readFrontMatter(fixture(nome))
      expect(lido.escalares.id, nome).toBe(id)
      expect(lido.escalares.id, nome).not.toMatch(/^CHG-/)
    }
  })

  it('lê `blocking` como lista vazia nos três, que é como o registro a escreve hoje', () => {
    for (const [nome] of REAIS) {
      const lido = readFrontMatter(fixture(nome))
      expect(lido.listas.blocking, nome).toBe(false)
    }
  })

  it('declara não lidos os blocos aninhados, em vez de inventar valor para eles', () => {
    const lido = readFrontMatter(fixture(REAIS[0][0]))
    for (const bloco of ['origin', 'reproduction', 'traceability', 'change_risk', 'closure']) {
      expect(lido.naoLidos, bloco).toContain(bloco)
      expect(lido.escalares[bloco], bloco).toBeUndefined()
    }
  })

  it('retoma a coluna zero depois de um bloco aninhado', () => {
    // `resolution_kind` é escalar de topo escrito DEPOIS de `closure:`. Um
    // leitor que parasse na primeira chave aninhada o perderia, e com ele todo
    // campo de topo que viesse depois.
    const lido = readFrontMatter(fixture(REAIS[0][0]))
    expect(lido.escalares.resolution_kind).toBe('fixed')
    expect(lido.escalares.spec_verdict).toBe('spec-correta')
  })

  it('lê lista de objetos em forma de fluxo como lista com item, sem lê-la', () => {
    const lido = readFrontMatter(fixture(REAIS[1][0]))
    expect(lido.listas.relationships).toBe(true)
    expect(lido.listas.change_set).toBe(true)
  })
})

describe('quando não há bloco a ler', () => {
  it('arquivo que não abre com a marca não tem front matter', () => {
    const lido = readFrontMatter(fixture('sem-front-matter.md'))

    expect(lido.presente).toBe(false)
    expect(lido.falha).toBe('sem-bloco')
    expect(lido.escalares).toEqual({})
  })

  it('não lê chave alguma de fora do bloco, mesmo que pareça front matter', () => {
    // A fixture traz `id:` e `status:` no corpo, depois do título. Ler fora do
    // bloco seria ler o Markdown do bug, que D-03 exclui por inteiro.
    const lido = readFrontMatter(fixture('sem-front-matter.md'))
    expect(lido.escalares.id).toBeUndefined()
    expect(lido.escalares.status).toBeUndefined()
  })

  it('bloco que abre e nunca fecha é ilegível, e não meio lido', () => {
    const lido = readFrontMatter(fixture('bloco-truncado.md'))

    expect(lido.presente).toBe(false)
    expect(lido.falha).toBe('bloco-truncado')
    expect(lido.escalares).toEqual({})
  })

  it('texto ausente e texto vazio devolvem a mesma ausência, sem lançar', () => {
    for (const entrada of [null, '', '   \n  \n']) {
      const lido = readFrontMatter(entrada)
      expect(lido.presente).toBe(false)
      expect(lido.falha).toBe('sem-bloco')
    }
  })
})

describe('o valor como veio, sem julgamento de vocabulário', () => {
  it('entrega estado, fase, severidade e prioridade fora do vocabulário sem alterá-los', () => {
    const lido = readFrontMatter(fixture('estado-desconhecido.md'))

    expect(lido.escalares.status).toBe('quase-resolvido')
    expect(lido.escalares.phase).toBe('quase-la')
    expect(lido.escalares.severity).toBe('gravissimo')
    expect(lido.escalares.priority).toBe('P9')
  })

  it('entrega data fora da forma de data sem tentar corrigi-la', () => {
    const lido = readFrontMatter(fixture('data-malformada.md'))

    expect(lido.escalares.created).toBe('ontem')
    expect(lido.escalares.updated).toBe('10/09/2026')
  })

  it('preserva inteiro o título com dois-pontos no meio, cortando no primeiro separador', () => {
    const lido = readFrontMatter(fixture('titulo-com-dois-pontos.md'))

    expect(lido.escalares.title).toBe('Painel: a contagem do topo diverge da lista desenhada')
  })

  it('remove as aspas de um escalar entre aspas, e só elas', () => {
    const texto = ['---', 'title: "Um título: entre aspas"', "id: 'BUG-20260910-ASPA'", '---'].join(
      '\n',
    )
    const lido = readFrontMatter(texto)

    expect(lido.escalares.title).toBe('Um título: entre aspas')
    expect(lido.escalares.id).toBe('BUG-20260910-ASPA')
  })

  it('lê visibilidade restrita como qualquer outro escalar: o filtro é do julgamento', () => {
    const lido = readFrontMatter(fixture('visibilidade-restrita.md'))
    expect(lido.escalares.visibility).toBe('restricted')
  })

  it('não inventa chave que o bloco não trouxe', () => {
    const lido = readFrontMatter(fixture('sem-identificador.md'))

    expect(lido.presente).toBe(true)
    expect(lido.escalares.id).toBeUndefined()
    expect(lido.escalares.title).toBe('Bloco legível que não traz identificador')
  })
})

describe('listas: só se há item, que é tudo o que RF-10 pede', () => {
  it('lista vazia em forma de fluxo é lista sem item', () => {
    const lido = readFrontMatter(['---', 'blocking: []', '---'].join('\n'))
    expect(lido.listas.blocking).toBe(false)
  })

  it('lista com itens em forma de bloco é lista com item', () => {
    const lido = readFrontMatter(fixture('bloqueio-declarado.md'))
    expect(lido.listas.blocking).toBe(true)
  })

  it('lista com itens em forma de fluxo é lista com item', () => {
    const lido = readFrontMatter(['---', 'labels: [codigo-herdado]', '---'].join('\n'))
    expect(lido.listas.labels).toBe(true)
  })

  it('não lê o conteúdo do item, nem o expõe como escalar', () => {
    const lido = readFrontMatter(fixture('bloqueio-declarado.md'))

    expect(lido.escalares.kind).toBeUndefined()
    expect(lido.escalares.reason).toBeUndefined()
    expect(lido.escalares.since).toBeUndefined()
  })
})

describe('o que o leitor declaradamente não lê (D-03)', () => {
  it('campo consumido escrito como bloco aninhado volta como não lido, jamais como valor', () => {
    const lido = readFrontMatter(fixture('campo-em-bloco-aninhado.md'))

    expect(lido.naoLidos).toContain('title')
    expect(lido.escalares.title).toBeUndefined()
    // O que estava dentro do bloco não pode vazar para o nível de topo: um
    // título montado a partir de `texto:` seria valor inventado com aparência
    // de valor lido, que é o defeito que esta suíte existe para impedir.
    expect(lido.escalares.texto).toBeUndefined()
    expect(lido.escalares.idioma).toBeUndefined()
  })

  it('escalar de várias linhas volta como não lido', () => {
    const texto = [
      '---',
      'id: BUG-20260910-MULT',
      'title: |',
      '  Primeira linha do título',
      '  Segunda linha do título',
      'status: open',
      '---',
    ].join('\n')
    const lido = readFrontMatter(texto)

    expect(lido.naoLidos).toContain('title')
    expect(lido.escalares.title).toBeUndefined()
    // O campo depois do escalar de várias linhas continua sendo lido: o bloco
    // não lido não pode engolir o resto do documento.
    expect(lido.escalares.status).toBe('open')
  })

  it('valor nulo é ausência declarada, e não a palavra "null"', () => {
    const lido = readFrontMatter(['---', 'id: BUG-20260910-NULO', 'spec_verdict: null', '---'].join('\n'))

    expect(lido.escalares.spec_verdict).toBeUndefined()
    expect(lido.escalares.id).toBe('BUG-20260910-NULO')
  })
})

describe('totalidade: entrada alguma faz o leitor lançar', () => {
  it('atravessa cada fixture da pasta sem lançar', () => {
    const nomes = [
      ...REAIS.map(([nome]) => nome),
      'sem-front-matter.md',
      'bloco-truncado.md',
      'estado-desconhecido.md',
      'data-malformada.md',
      'bloqueio-declarado.md',
      'visibilidade-restrita.md',
      'titulo-com-dois-pontos.md',
      'sem-identificador.md',
      'campo-em-bloco-aninhado.md',
    ]
    for (const nome of nomes) {
      expect(() => readFrontMatter(fixture(nome)), nome).not.toThrow()
    }
  })

  it('atravessa lixo binário e linha sem separador sem lançar', () => {
    const lixo = ['---', 'linha sem separador algum', ' ', 'id: BUG-1', '---'].join(
      '\n',
    )
    expect(() => readFrontMatter(lixo)).not.toThrow()
    expect(readFrontMatter(lixo).escalares.id).toBe('BUG-1')
  })
})
