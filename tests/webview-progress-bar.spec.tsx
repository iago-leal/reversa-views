/**
 * Suíte da barra de progresso (T018), contra `src/webview/ui/ProgressBar.tsx`.
 *
 * A barra é uma peça só, chamada pelos três cartões (D-15, RF-30), e o que
 * esta suíte guarda é o que a torna informação e não decoração.
 *
 * Duas exigências de acessibilidade a moldam. A primeira é o papel declarado:
 * o elemento precisa anunciar-se como barra de progresso, com mínimo, máximo,
 * valor corrente e um texto equivalente, porque a informação não pode existir
 * apenas como comprimento (RF-31). A segunda vem de RN-10 e é a razão de a
 * barra nunca ser o único portador: o texto que conta as unidades permanece no
 * cartão, e a barra o acompanha.
 *
 * Os estados de borda de RF-33 são o resto: denominador zero não desenha barra
 * alguma, e numerador acima do denominador é limitado para o desenho, porque a
 * divergência entre contagem e lista já tem aviso próprio e a barra não escolhe
 * entre os dois números.
 * @module tests/webview-progress-bar
 */

import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { ProgressBar } from '../src/webview/ui/ProgressBar.tsx'

/** A barra desenhada, como marcação estática. */
function desenhar(props: { feitos: number; total: number; rotulo: string }): string {
  return renderToStaticMarkup(<ProgressBar {...props} />)
}

/** O valor de um atributo na marcação, ou nulo quando ele não está lá. */
function atributo(markup: string, nome: string): string | null {
  const casou = new RegExp(`${nome}="([^"]*)"`).exec(markup)
  return casou === null ? null : casou[1]
}

/** A largura do preenchimento, que é o comprimento desenhado. */
function largura(markup: string): string | null {
  const casou = /class="progress__fill"[^>]*width="([^"]*)"/.exec(markup)
  return casou === null ? null : casou[1]
}

const METADE = { feitos: 22, total: 44, rotulo: '22 de 44 ações fechadas' }

describe('o papel e os quatro atributos que ele exige (RF-31)', () => {
  const markup = desenhar(METADE)

  it('anuncia-se como barra de progresso', () => {
    expect(atributo(markup, 'role')).toBe('progressbar')
  })

  it('declara mínimo, máximo e valor corrente', () => {
    expect(atributo(markup, 'aria-valuemin')).toBe('0')
    expect(atributo(markup, 'aria-valuemax')).toBe('44')
    expect(atributo(markup, 'aria-valuenow')).toBe('22')
  })

  it('o máximo é o total, e não cem: a barra conta unidades, não porcentagem', () => {
    const markup = desenhar({ feitos: 3, total: 7, rotulo: '3 de 7' })
    expect(atributo(markup, 'aria-valuemax')).toBe('7')
    expect(atributo(markup, 'aria-valuenow')).toBe('3')
  })

  it('carrega o texto equivalente, que repete a contagem em palavras', () => {
    expect(atributo(markup, 'aria-valuetext')).toBe('22 de 44 ações fechadas')
  })

  it('o texto equivalente não é o comprimento traduzido em número solto', () => {
    // A informação tem de existir sem a barra. Rótulo que dissesse "50%"
    // deixaria quem ouve sem a contagem que quem vê tem ao lado.
    const texto = atributo(markup, 'aria-valuetext') ?? ''
    expect(texto).toContain('44')
    expect(texto).not.toMatch(/^\d+%$/)
  })
})

describe('o comprimento desenhado', () => {
  it('metade de metade, cheia no total, vazia em zero feito', () => {
    expect(largura(desenhar(METADE))).toBe('50%')
    expect(largura(desenhar({ feitos: 44, total: 44, rotulo: 'todas' }))).toBe('100%')
    expect(largura(desenhar({ feitos: 0, total: 44, rotulo: 'nenhuma' }))).toBe('0%')
  })

  it('a proporção é a razão entre os dois números, e não uma escala própria', () => {
    expect(largura(desenhar({ feitos: 5, total: 6, rotulo: '5 de 6' }))).toBe('83.33%')
  })

  it('o trilho ocupa a largura inteira, e o preenchimento é que varia', () => {
    const markup = desenhar(METADE)
    expect(markup).toMatch(/class="progress__track"[^>]*width="100%"/)
  })

  it('o comprimento NÃO viaja por estilo em linha, que a política recusaria', () => {
    // A política do documento declara `style-src` sem permissão de estilo em
    // linha, de modo que um atributo `style` seria descartado pelo navegador
    // embarcado e a barra apareceria sempre vazia. Daí o desenho em SVG: a
    // largura é ATRIBUTO DE APRESENTAÇÃO, que a política não alcança, e o valor
    // continua contínuo em vez de cair em degraus de classe.
    const markup = desenhar(METADE)
    expect(markup).not.toContain('style=')
    expect(markup).toMatch(/<svg[^>]*role="progressbar"/)
  })

  it('a cor vem de classe, e portanto da folha e dos tokens', () => {
    const markup = desenhar(METADE)
    expect(markup).not.toMatch(/fill="#|stroke="#/)
  })
})

describe('denominador zero não desenha barra alguma (RF-33)', () => {
  it('com total zero, não há elemento', () => {
    expect(desenhar({ feitos: 0, total: 0, rotulo: 'nada a contar' })).toBe('')
  })

  it('com total negativo, tampouco: número impossível não vira desenho', () => {
    expect(desenhar({ feitos: 0, total: -3, rotulo: 'impossível' })).toBe('')
  })

  it('total zero com feitos acima de zero continua sem barra', () => {
    // Seria estado incoerente, e desenhar barra cheia sobre um total que não
    // existe diria ao leitor que tudo está pronto num cartão vazio.
    expect(desenhar({ feitos: 4, total: 0, rotulo: 'incoerente' })).toBe('')
  })
})

describe('o numerador é limitado ao denominador (RF-33)', () => {
  it('acima do total, desenha cheia em vez de estourar o trilho', () => {
    expect(largura(desenhar({ feitos: 50, total: 44, rotulo: '50 de 44' }))).toBe('100%')
  })

  it('o valor corrente anunciado também é limitado, e não mente para cima', () => {
    const markup = desenhar({ feitos: 50, total: 44, rotulo: '50 de 44' })
    expect(atributo(markup, 'aria-valuenow')).toBe('44')
    expect(atributo(markup, 'aria-valuemax')).toBe('44')
  })

  it('o texto equivalente conserva o que o cartão diz, sem limitar', () => {
    // O aviso de divergência é do cartão, e a barra não o apaga: o rótulo
    // chega pronto e atravessa. Limitar o TEXTO esconderia a incoerência.
    const markup = desenhar({ feitos: 50, total: 44, rotulo: '50 de 44 ações fechadas' })
    expect(atributo(markup, 'aria-valuetext')).toBe('50 de 44 ações fechadas')
  })

  it('abaixo de zero, desenha vazia', () => {
    const markup = desenhar({ feitos: -5, total: 44, rotulo: 'negativo' })
    expect(largura(markup)).toBe('0%')
    expect(atributo(markup, 'aria-valuenow')).toBe('0')
  })

  it('número que não é número desenha vazia, e não quebra o cartão', () => {
    for (const feitos of [Number.NaN, Number.POSITIVE_INFINITY]) {
      const markup = desenhar({ feitos, total: 44, rotulo: 'torto' })
      expect(largura(markup), String(feitos)).toBe('0%')
    }
  })
})

describe('é uma peça só, e nomeável na marcação', () => {
  it('traz atributo de parte, para que a suíte de marcação a encontre', () => {
    expect(atributo(desenhar(METADE), 'data-part')).toBe('progress')
  })

  it('o trilho e o preenchimento são dois elementos, e ambos de classe própria', () => {
    const markup = desenhar(METADE)
    expect(markup).toContain('class="progress"')
    expect(markup).toContain('class="progress__track"')
    expect(markup).toContain('class="progress__fill"')
  })

  it('duas barras iguais desenham igual: o componente não guarda estado', () => {
    expect(desenhar(METADE)).toBe(desenhar(METADE))
  })

  it('não injeta marcação crua, e nem precisa', () => {
    expect(desenhar({ ...METADE, rotulo: '<script>x</script>' })).not.toContain('<script>')
  })
})
