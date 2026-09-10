/**
 * A página que o preview serve (RF-08, RF-11, RF-17, D-02, D-08, D-09).
 *
 * Ela não é uma segunda tela. O documento vem de `buildDocument` e o corpo de
 * `panelBody`, os mesmos que o host usa dentro do editor, lidos da saída
 * compilada: é isso que faz a conferência valer, porque defeito que a política
 * do editor causaria aparece aqui em vez de aparecer na instalação.
 *
 * O que este módulo acrescenta são três coisas, e todas estão declaradas na
 * faixa: a classe de tema escrita no corpo, com o nome que o editor
 * escreveria; a permissão de conexão com a própria origem, sem a qual não há
 * canal; e o host fingido, carregado antes do pacote porque a interface do
 * painel pede a interface do editor durante a montagem.
 *
 * A faixa é irmã do ponto de montagem e não herda nada da folha do painel. Ela
 * nasce como elemento vazio, e quem a preenche e a estiliza é o host fingido,
 * pelo modelo de objetos: estilo escrito por script não passa pela política de
 * estilo, e assim a faixa existe sem que a política precise afrouxar por causa
 * dela.
 * @module scripts/preview/pagina
 */

const { buildDocument, createNonce } = require('../../out/host/document.js')
const { panelBody } = require('../../out/host/panel.js')

/** As classes que o editor escreve no corpo, por tema da linha de comando. */
const CLASSE_POR_TEMA = {
  claro: 'vscode-light',
  escuro: 'vscode-dark',
  'claro-alto-contraste': 'vscode-high-contrast vscode-high-contrast-light',
  'escuro-alto-contraste': 'vscode-high-contrast',
}

/** O que a faixa diz não simular, e que o preview não tem como simular. */
const LIMITES_DECLARADOS = [
  'a política do editor, que aqui permite conexão com a própria origem',
  'a abertura de arquivo, que vira linha no terminal',
  'o estado guardado entre sessões, que aqui mora no navegador',
]

/**
 * Monta a página inteira do preview.
 * @param {{config: object, origem: string, cliente: string,
 *   nonce?: string}} opcoes - a configuração lida, a origem servida, o texto
 *   do host fingido e, nos testes, um nonce fixo.
 * @returns {string} o documento pronto para servir.
 */
function montarPagina(opcoes) {
  const { config, origem, cliente } = opcoes
  const nonce = opcoes.nonce ?? createNonce()

  const faixa =
    `<div id="preview-faixa"` +
    ` data-workspace="${escapar(config.workspace)}"` +
    ` data-tema="${escapar(config.tema)}"` +
    ` data-estado="${escapar(config.estado)}"` +
    ` data-atualizacao="${escapar(config.atualizacao ?? 'nenhum')}"` +
    ` data-atraso="${config.atraso}"` +
    ` data-limites="${escapar(LIMITES_DECLARADOS.join(' · '))}"></div>`

  const corpo = [
    faixa,
    `<script nonce="${nonce}">${cliente}</script>`,
    panelBody({ nonce, scriptUri: '/main.js', styleUri: '/main.css' }),
  ].join('\n')

  return buildDocument({
    nonce,
    cspSource: origem,
    body: corpo,
    connectSource: origem,
    bodyClass: CLASSE_POR_TEMA[config.tema],
  })
}

/** O mínimo para um valor caber num atributo sem quebrá-lo. */
function escapar(texto) {
  return String(texto).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
}

module.exports = { CLASSE_POR_TEMA, LIMITES_DECLARADOS, montarPagina }
