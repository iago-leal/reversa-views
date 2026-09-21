/**
 * A faixa de bloqueio humano, desenhada antes de qualquer seção (RF-05).
 *
 * Cada razão vira três coisas, como na tela: a frase que a nomeia, o artefato
 * que a confirmação abriria e o comando sugerido. A ferramenta NÃO executa o
 * comando: o lugar do despacho continua reservado e vazio, e esta feature não
 * o ocupa.
 *
 * As razões vêm inteiras de `blockingReasons`, que é a mesma função que o
 * painel chama. Lista vazia não desenha faixa, e não desenha faixa vazia
 * tampouco.
 * @module cli/quadro/bloqueio
 */

import { blockingReasons } from '../../webview/domain/blocking.ts'
import type { SetProcessData } from '../../host/protocol.ts'
import type { ItemDaSecao, SecaoDesenhada } from '../tipos.ts'
import { GLIFOS, juntar } from './glifos.ts'
import type { Glifos } from './glifos.ts'

/** Como a faixa se chama no quadro, quando há razão para ela existir. */
export const TITULO_DO_BLOQUEIO = 'Aguardando decisão humana'

/**
 * A faixa, na forma de seção.
 *
 * Ela ocupa nome de seção pelo mesmo motivo que no painel, o isolamento de
 * falha, e NÃO é cartão: a RN-03 proíbe ação global que esconda o que aguarda
 * decisão do usuário, e `recolhivel: false` é essa proibição em código.
 * @param carga - a leitura que o host entregou.
 * @param glifos - o jogo em uso, que decide o separador de campos.
 * @returns a faixa; sem razão alguma, ela vem sem item e sem corpo.
 */
export function faixaDeBloqueio(
  carga: SetProcessData,
  glifos: Glifos = GLIFOS.unicode,
): SecaoDesenhada {
  const razoes = blockingReasons(carga.process, carga.bugs, carga.greenfield)

  const itens: ItemDaSecao[] = razoes.map((razao) => ({
    // Feature 016, D-14: a razão e o comando são o dado principal, porque o
    // comando é o que a pessoa vai fazer; o artefato desce para linha própria,
    // pelo campo `artefato`, como em toda seção.
    texto: juntar([razao.text, razao.command], glifos),
    artefato: razao.artifact,
    alerta: true,
  }))

  return {
    nome: 'blocking',
    titulo: TITULO_DO_BLOQUEIO,
    contagem: razoes.length === 0 ? null : razoes.length,
    corpo: razoes.length === 0 ? ['Nada aguarda decisão humana.'] : [],
    itens,
    recolhivel: false,
  }
}
