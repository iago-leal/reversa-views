/**
 * Suíte do cabeçalho diante dos sete desfechos da consulta (T019).
 *
 * Duas coisas se verificam aqui, e a segunda é a que importa mais.
 *
 * A primeira é RF-10: cada desfecho produz um texto DISTINTO, com atributo
 * consultável que o nomeia, e nenhum deles produz linha vazia. Item em branco
 * ao lado de rótulo é o painel dizendo duas coisas ao mesmo tempo, "não há
 * nada" e "não li isto", e o cabeçalho existe para não fazer isso.
 *
 * A segunda é RF-14, e é uma distinção que se perde com facilidade: conferência
 * DESLIGADA não é o mesmo que estar EM DIA. Quem desligou a chave não recebeu
 * garantia alguma sobre a versão instalada, e um cabeçalho que dissesse "em
 * dia" com a consulta desligada estaria afirmando o que não sabe.
 *
 * A procedência de RF-17 entra junto: versão e commit de construção aparecem ao
 * lado dos itens que já existem, o commit em forma curta e com o valor integral
 * num atributo, porque encurtar na origem destruiria o valor consultável.
 *
 * O comando que a faixa anuncia ganhou bloco próprio depois do BUG-20260910-WIBK:
 * a faixa oferecia o comando que apenas confere, e a asserção que a fixava
 * pedia no nome o comando que aplica. Desde então o rótulo é conferido contra o
 * que o próprio ritual imprime, para que os dois lugares que soletram o segundo
 * ato não voltem a divergir sem que a suíte acuse.
 * @module tests/webview-header
 */

import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { comandoDeAplicacao } from '../scripts/atualizar.js'
import { UPDATE_CAUSES, UPDATE_STATES } from '../src/host/protocol.ts'
import type { UpdateCause, UpdateStatus } from '../src/host/protocol.ts'
import { readingIntegrity } from '../src/webview/domain/integrity.ts'
import { updateCommand, updateLabel } from '../src/webview/domain/labels.ts'
import { COLLAPSIBLE_SECTIONS } from '../src/webview/domain/types.ts'
import type { EffectiveEntry } from '../src/webview/domain/types.ts'
import { Header } from '../src/webview/ui/Header.tsx'
import { payloadFixture } from './helpers/reversa-fixtures.ts'

/** Um desfecho de cada variante, com os campos que ela carrega. */
const DESFECHOS: Record<string, UpdateStatus> = {
  desligada: { estado: 'desligada' },
  consultando: { estado: 'consultando' },
  'em-dia': { estado: 'em-dia' },
  atrasada: { estado: 'atrasada', commits: 4 },
  divergente: { estado: 'divergente', commits: 3 },
  'commit-desconhecido': { estado: 'commit-desconhecido' },
  impossivel: { estado: 'impossivel', causa: 'sem-rede' },
}

/** O estado da tela com uma leitura por trás. */
function entrada(payload = payloadFixture()): EffectiveEntry {
  return {
    kind: 'installed',
    rereading: false,
    loaded: payload,
    message: null,
    root: payload.root,
    update: null,
  }
}

/** O cabeçalho desenhado, sobre um desfecho e uma leitura. */
function cabeçalho(update: UpdateStatus, payload = payloadFixture()): string {
  return renderToStaticMarkup(
    <Header
      entry={entrada(payload)}
      integrity={readingIntegrity(payload)}
      update={update}
      onReload={() => {}}
      collapsedCount={4}
      collapsibleCount={COLLAPSIBLE_SECTIONS.length}
      onExpandAll={() => {}}
      onCollapseAll={() => {}}
      onSummary={() => {}}
      onCopy={() => {}}
    />,
  )
}

/** O trecho da linha do desfecho, com o texto que ela desenha. */
function linhaDoDesfecho(markup: string): { atributo: string | null; texto: string } | null {
  const casou = /<p([^>]*data-item="update"[^>]*)>(.*?)<\/p>/s.exec(markup)
  if (casou === null) return null
  const estado = /data-update="([^"]*)"/.exec(casou[1])
  const texto = casou[2].replace(/<[^>]*>/g, '').trim()
  return { atributo: estado === null ? null : estado[1], texto }
}

describe('a tradução de cada desfecho, que é decisão e não desenho', () => {
  it('os sete produzem texto, e nenhum produz texto vazio', () => {
    for (const estado of UPDATE_STATES) {
      const rótulo = updateLabel(DESFECHOS[estado])
      expect(rótulo.text.trim(), `${estado} não tem texto`).not.toBe('')
      expect(rótulo.text.length, `${estado} tem texto curto demais para informar`).toBeGreaterThan(5)
    }
  })

  it('os sete textos são distintos entre si (RF-10)', () => {
    const textos = UPDATE_STATES.map((estado) => updateLabel(DESFECHOS[estado]).text)
    expect(new Set(textos).size).toBe(UPDATE_STATES.length)
  })

  it('desligada NÃO diz nem sugere que está em dia (RF-14)', () => {
    const desligada = updateLabel(DESFECHOS.desligada).text
    const emDia = updateLabel(DESFECHOS['em-dia']).text

    expect(desligada).not.toBe(emDia)
    expect(desligada.toLowerCase()).toContain('desligada')
    expect(desligada.toLowerCase()).not.toContain('em dia')
    expect(desligada.toLowerCase()).not.toContain('atualizada')
  })

  it('atrasada diz quantos commits, e nomeia o comando que os aplica', () => {
    // Sem raiz carimbada, o comando é o RECUO: a forma do clone, que é o que
    // uma construção anterior ao BUG-20260911-FI3O produz. O bloco do fim
    // exercita a forma por endereço, que é a desta correção.
    const rótulo = updateLabel(DESFECHOS.atrasada)
    expect(rótulo.text).toContain('4')
    expect(rótulo.command).toBe('npm run atualizar -- --aplicar')
  })

  it('a contagem de um commit não sai no plural', () => {
    const um = updateLabel({ estado: 'atrasada', commits: 1 }).text
    expect(um).toContain('1 commit ')
    expect(um).not.toContain('commits')
  })

  it('divergente diz que há novidade E que o clone tem commits próprios', () => {
    const texto = updateLabel(DESFECHOS.divergente).text.toLowerCase()
    expect(texto).toContain('3')
    expect(texto).toMatch(/próprio|local/)
  })

  it('divergente e atrasada são dois fatos, e não o mesmo texto com número', () => {
    // O par existe separado de propósito: aplicar a atualização sobre commits
    // locais é o que o atualizador recusa em RF-05.
    expect(updateLabel({ estado: 'divergente', commits: 4 }).text).not.toBe(
      updateLabel({ estado: 'atrasada', commits: 4 }).text,
    )
  })

  it('commit desconhecido diz que a origem não conhece esta construção', () => {
    const texto = updateLabel(DESFECHOS['commit-desconhecido']).text.toLowerCase()
    expect(texto).toMatch(/não conhece|desconhec/)
  })

  it('consulta impossível nomeia a causa, e as quatro causas dão quatro textos', () => {
    const textos = UPDATE_CAUSES.map(
      (causa: UpdateCause) => updateLabel({ estado: 'impossivel', causa }).text,
    )
    expect(new Set(textos).size).toBe(UPDATE_CAUSES.length)
    for (const texto of textos) expect(texto.trim()).not.toBe('')
  })

  it('limite de taxa se distingue de ausência de rede (RF-16)', () => {
    const limite = updateLabel({ estado: 'impossivel', causa: 'limite-de-taxa' }).text
    const semRede = updateLabel({ estado: 'impossivel', causa: 'sem-rede' }).text
    expect(limite).not.toBe(semRede)
    expect(limite.toLowerCase()).toMatch(/limite|cota/)
  })

  it('causa desconhecida não produz linha vazia nem lança (RN-05)', () => {
    const rótulo = updateLabel({ estado: 'impossivel', causa: 'inventada' } as UpdateStatus)
    expect(rótulo.text.trim()).not.toBe('')
  })

  it('estado desconhecido não produz linha vazia nem lança (RN-05)', () => {
    const rótulo = updateLabel({ estado: 'não-existe' } as unknown as UpdateStatus)
    expect(rótulo.text.trim()).not.toBe('')
  })

  it('só atrasada e divergente oferecem comando: os demais não têm o que aplicar', () => {
    for (const estado of UPDATE_STATES) {
      const comando = updateLabel(DESFECHOS[estado]).command
      const esperado = estado === 'atrasada' || estado === 'divergente'
      expect(comando !== null, `${estado} ofereceu comando: ${String(comando)}`).toBe(esperado)
    }
  })
})

describe('a linha do desfecho no cabeçalho (RF-10)', () => {
  it('os sete desenham a linha, com o estado no atributo consultável', () => {
    for (const estado of UPDATE_STATES) {
      const linha = linhaDoDesfecho(cabeçalho(DESFECHOS[estado]))
      expect(linha, `${estado} não desenhou linha`).not.toBeNull()
      expect(linha?.atributo, `${estado} sem atributo`).toBe(estado)
      expect(linha?.texto, `${estado} desenhou linha vazia`).not.toBe('')
    }
  })

  it('nenhum dos sete desenha o mesmo texto que outro', () => {
    const textos = UPDATE_STATES.map((estado) => linhaDoDesfecho(cabeçalho(DESFECHOS[estado]))?.texto)
    expect(new Set(textos).size).toBe(UPDATE_STATES.length)
  })

  it('a linha desligada e a linha em dia são visivelmente diferentes na tela', () => {
    expect(linhaDoDesfecho(cabeçalho(DESFECHOS.desligada))?.texto).not.toBe(
      linhaDoDesfecho(cabeçalho(DESFECHOS['em-dia']))?.texto,
    )
  })

  it('o comando a copiar aparece quando há o que aplicar, e não aparece quando não há', () => {
    // A carga da fixture carrega raiz carimbada, e por isso o que o cabeçalho
    // desenha é a forma por endereço (BUG-20260911-FI3O).
    const aplica = comandoDeAplicacao('/home/alguem/dev/reversa-views')
    expect(cabeçalho(DESFECHOS.atrasada)).toContain(aplica)
    expect(cabeçalho(DESFECHOS['em-dia'])).not.toContain('atualizar.js')
    expect(cabeçalho(DESFECHOS['em-dia'])).not.toContain('npm run atualizar')
  })

  it('a linha do desfecho não interrompe: é texto do cabeçalho, e não diálogo', () => {
    // RN-09: o painel não interrompe o usuário. A novidade é uma linha, e não
    // uma notificação nem um botão que age.
    const markup = cabeçalho(DESFECHOS.atrasada)
    expect(markup).not.toMatch(/showInformationMessage|window\.alert|<dialog/)
  })
})

describe('a procedência desta construção (RF-17, D-18)', () => {
  const PAYLOAD = payloadFixture({
    extensionVersion: '0.6.1',
    builtFromCommit: 'a23711d481021a978720c0bc478b6dabed94fec3',
  })

  it('a versão instalada aparece como item próprio', () => {
    const markup = cabeçalho(DESFECHOS['em-dia'], PAYLOAD)
    expect(markup).toMatch(/data-item="extension-version"[^>]*>0\.6\.1</)
  })

  it('o commit aparece em forma curta, a mesma do modelo herdado', () => {
    const markup = cabeçalho(DESFECHOS['em-dia'], PAYLOAD)
    const casou = /data-item="built-from"[^>]*>([^<]*)</.exec(markup)
    expect(casou?.[1]).toBe('a23711d')
  })

  it('o valor integral do commit fica num atributo consultável', () => {
    const markup = cabeçalho(DESFECHOS['em-dia'], PAYLOAD)
    expect(markup).toContain('data-full="a23711d481021a978720c0bc478b6dabed94fec3"')
  })

  it('sem leitura por trás, os dois itens declaram ausência em vez de ficar em branco', () => {
    const semLeitura: EffectiveEntry = {
      kind: 'no-folder',
      rereading: false,
      loaded: null,
      message: null,
      root: null,
    }
    const markup = renderToStaticMarkup(
      <Header
        entry={semLeitura}
        integrity={{ degraded: false, anomalies: 0, refusals: 0, truncated: 0 }}
        update={DESFECHOS.desligada}
        onReload={() => {}}
        collapsedCount={0}
        collapsibleCount={COLLAPSIBLE_SECTIONS.length}
        onExpandAll={() => {}}
        onCollapseAll={() => {}}
        onSummary={() => {}}
        onCopy={() => {}}
      />,
    )
    expect(markup).toMatch(/data-item="extension-version"[^>]*>não declarado</)
    expect(markup).toMatch(/data-item="built-from"[^>]*>não declarado</)
  })

  it('os itens que já existiam continuam onde estavam', () => {
    const markup = cabeçalho(DESFECHOS['em-dia'], PAYLOAD)
    for (const item of ['project', 'version', 'revision', 'root', 'read-at']) {
      expect(markup, `sumiu o item ${item}`).toContain(`data-item="${item}"`)
    }
  })
})

describe('o comando que a faixa anuncia (BUG-20260910-WIBK)', () => {
  // Os dois atos do ritual, soletrados como o README os ensina (RF-04). O
  // primeiro nunca traz commit algum, e foi ele que a faixa anunciou durante
  // toda a feature 007: quem o copiava recebia um diagnóstico, e o aviso
  // voltava na recarga seguinte.
  //
  // As duas formas do segundo ato convivem desde o BUG-20260911-FI3O: a do
  // clone, que é o recuo de quem não tem raiz carimbada, e a do endereço, que
  // é a que o painel anuncia quando sabe de onde veio a construção.
  const RAIZ = '/home/alguem/dev/reversa-views'
  const CONFERE_NO_CLONE = 'npm run atualizar'
  const APLICA_NO_CLONE = 'npm run atualizar -- --aplicar'
  const CONFERE_POR_ENDEREÇO = `node ${RAIZ}/scripts/atualizar.js`

  it('atrasada anuncia o comando que aplica, e não o que apenas confere', () => {
    // Reprodução do defeito do nº 5: vermelho enquanto a faixa oferecer a
    // conferência. Vale nas duas formas, com raiz e sem ela.
    expect(updateLabel(DESFECHOS.atrasada, RAIZ).command).not.toBe(CONFERE_POR_ENDEREÇO)
    expect(updateLabel(DESFECHOS.atrasada, RAIZ).command).toContain('--aplicar')
    expect(updateLabel(DESFECHOS.atrasada).command).toBe(APLICA_NO_CLONE)
  })

  it('divergente anuncia o mesmo comando de atrasada', () => {
    // A spec manda o mesmo comando nos dois desfechos que pedem ação. A recusa
    // de RF-05 sobre commit próprio é nomeada pelo script no momento de
    // aplicar, e não cabe ao rótulo antecipá-la.
    expect(updateLabel(DESFECHOS.divergente, RAIZ).command).toBe(
      updateLabel(DESFECHOS.atrasada, RAIZ).command,
    )
  })

  it('nenhum desfecho oferece a conferência nua como se ela aplicasse', () => {
    for (const estado of UPDATE_STATES) {
      expect(updateLabel(DESFECHOS[estado]).command, estado).not.toBe(CONFERE_NO_CLONE)
      expect(updateLabel(DESFECHOS[estado], RAIZ).command, estado).not.toBe(CONFERE_POR_ENDEREÇO)
    }
  })

  it('o comando anunciado é o que o ritual imprime como "Para aplicar"', () => {
    // Verificação cruzada, e a ponte que o nº 5 deixou. Ela era uma expressão
    // regular sobre o TEXTO do script, e o BUG-20260911-FI3O a promove: o
    // rótulo e o ritual passam a ser comparados PELA FUNÇÃO, importada dos dois
    // lados e alimentada com a mesma raiz. Texto lido por expressão regular
    // confere a grafia; função confere a regra.
    expect(updateLabel(DESFECHOS.atrasada, RAIZ).command).toBe(comandoDeAplicacao(RAIZ))
    expect(updateCommand(RAIZ)).toBe(comandoDeAplicacao(RAIZ))
  })

  it('o cabeçalho desenha o argumento de aplicação em atrasada e em divergente', () => {
    // A asserção por substring que já existia passava com qualquer dos dois
    // comandos; esta exige o argumento no markup.
    const aplica = comandoDeAplicacao(RAIZ)
    expect(cabeçalho(DESFECHOS.atrasada)).toContain(aplica)
    expect(cabeçalho(DESFECHOS.divergente)).toContain(aplica)
  })
})

describe('de onde o comando anunciado se chama (BUG-20260911-FI3O)', () => {
  // O defeito: a faixa anunciava uma linha cuja resolução depende do diretório
  // corrente de quem a colou, e o painel abre no workspace de trabalho, que
  // quase nunca é o clone. O ritual, esse, já é independente do diretório: ele
  // ancora a raiz no arquivo que o contém. O que se corrige aqui é o endereço
  // anunciado, e não o percurso disparado.
  const RAIZ = '/home/alguem/dev/reversa-views'
  const RAIZ_COM_ESPAÇO = '/Users/alguem/Meus Projetos/reversa-views'

  it('havendo raiz carimbada, a linha não é resolvida pelo diretório corrente', () => {
    // Reprodução: vermelho enquanto a faixa anunciar a forma do `npm run`, que
    // só existe dentro do clone.
    const comando = updateLabel(DESFECHOS.atrasada, RAIZ).command
    expect(comando).not.toMatch(/^npm run /)
    expect(comando).toBe(`node ${RAIZ}/scripts/atualizar.js --aplicar`)
  })

  it('a linha carrega o endereço do clone que produziu esta construção', () => {
    expect(updateCommand(RAIZ)).toContain(RAIZ)
    expect(updateCommand(RAIZ)).toContain('scripts/atualizar.js')
  })

  it('sem raiz carimbada a faixa recua para o comando do clone, e não inventa caminho', () => {
    // Construção anterior a esta correção, host anterior ao campo, ou preview
    // sem carimbo: os três chegam aqui, e nenhum deles pode receber um caminho
    // plausível e falso.
    for (const ausente of [null, undefined, '']) {
      expect(updateCommand(ausente), String(ausente)).toBe('npm run atualizar -- --aplicar')
    }
  })

  it('caminho com espaço sai entre aspas, para sobreviver ao terminal', () => {
    expect(updateCommand(RAIZ_COM_ESPAÇO)).toBe(
      `node "${RAIZ_COM_ESPAÇO}/scripts/atualizar.js" --aplicar`,
    )
  })

  it('a barra final da raiz não vira barra dupla no caminho', () => {
    expect(updateCommand(`${RAIZ}/`)).toBe(updateCommand(RAIZ))
  })

  it('o rótulo e o ritual soletram a mesma linha para toda raiz', () => {
    for (const raiz of [RAIZ, RAIZ_COM_ESPAÇO, `${RAIZ}/`, '', null]) {
      expect(updateCommand(raiz), String(raiz)).toBe(comandoDeAplicacao(raiz))
    }
  })

  it('os desfechos que nada pedem continuam sem comando, com raiz ou sem ela', () => {
    for (const estado of ['desligada', 'consultando', 'em-dia', 'commit-desconhecido', 'impossivel']) {
      expect(updateLabel(DESFECHOS[estado], RAIZ).command, estado).toBeNull()
    }
  })
})
