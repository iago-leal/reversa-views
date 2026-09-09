/**
 * O host fingido, servido dentro da página do preview (RF-07, RN-05, D-05).
 *
 * Este arquivo NÃO é módulo de Node e não entra no pacote da webview. Ele é
 * lido como texto e injetado na página antes do pacote, porque a interface do
 * painel pede a interface do editor durante a montagem, e ela precisa existir
 * quando esse pedido acontecer. O pacote continua byte a byte o que o editor
 * recebe: nenhum sinal de ambiente entra nele, e nada nele sabe que está fora
 * do editor.
 *
 * O que ele faz é traduzir: o pronto e a releitura viram uma busca da leitura,
 * que volta como as mensagens que o host enviaria; o resto vira uma linha no
 * terminal do preview. O estado que o editor guardaria mora no armazenamento
 * local do navegador, e é por isso que a preferência de seção sobrevive a
 * recarregar a página.
 *
 * A faixa é preenchida e estilizada daqui, pelo modelo de objetos: estilo
 * escrito por script não passa pela política de estilo, e assim a faixa existe
 * sem que a política precise afrouxar por causa dela.
 */
;(function hostFingido() {
  var CHAVE = 'reversa-views.preview.estado'

  function guardado() {
    try {
      var cru = window.localStorage.getItem(CHAVE)
      return cru === null ? undefined : JSON.parse(cru)
    } catch (erro) {
      return undefined
    }
  }

  function guardar(estado) {
    try {
      window.localStorage.setItem(CHAVE, JSON.stringify(estado))
    } catch (erro) {
      /* navegador sem armazenamento é caso de preview, não de painel */
    }
  }

  /** Entrega um envelope ao painel pelo mesmo caminho que o editor usa. */
  function entregar(envelope) {
    window.postMessage(envelope, '*')
  }

  /** Busca a leitura e entrega, em ordem, o que o host enviaria. */
  function buscarProcesso() {
    fetch('/processo', { headers: { accept: 'application/json' } })
      .then(function (resposta) {
        return resposta.json()
      })
      .then(function (carga) {
        ;(carga.mensagens || []).forEach(entregar)
      })
      .catch(function (erro) {
        entregar({
          command: 'setEntry',
          data: { kind: 'error', message: 'o preview não respondeu: ' + erro.message },
        })
      })
  }

  /** Manda ao servidor o que só ele pode registrar. */
  function mandarAoServidor(envelope) {
    fetch('/canal', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(envelope),
    }).catch(function () {
      /* o terminal do preview é o destino; perder uma linha não para a tela */
    })
  }

  window.acquireVsCodeApi = function () {
    return {
      postMessage: function (envelope) {
        if (envelope && (envelope.command === 'onLoaded' || envelope.command === 'reload')) {
          buscarProcesso()
          return
        }
        mandarAoServidor(envelope)
      },
      getState: guardado,
      setState: function (estado) {
        guardar(estado)
        return estado
      },
    }
  }

  /** Preenche e pinta a faixa, que já nasceu no documento como irmã do painel. */
  function montarFaixa() {
    var faixa = document.getElementById('preview-faixa')
    if (faixa === null) return

    var estado = faixa.getAttribute('data-estado')
    var atraso = faixa.getAttribute('data-atraso')
    var partes = [
      'PREVIEW, não é o editor',
      'workspace: ' + faixa.getAttribute('data-workspace'),
      'tema: ' + faixa.getAttribute('data-tema'),
    ]
    if (estado !== 'nenhum') partes.push('estado forçado: ' + estado)
    if (atraso !== '0') partes.push('atraso: ' + atraso + ' ms')

    var titulo = document.createElement('div')
    titulo.textContent = partes.join('  ·  ')
    var limites = document.createElement('div')
    limites.textContent = 'não simula: ' + faixa.getAttribute('data-limites')

    faixa.appendChild(titulo)
    faixa.appendChild(limites)

    // Estilo próprio, nenhum herdado da folha do painel: a faixa precisa
    // existir sem alterar o que se está conferindo.
    faixa.style.position = 'sticky'
    faixa.style.top = '0'
    faixa.style.zIndex = '9999'
    faixa.style.padding = '6px 10px'
    faixa.style.background = '#7a1f1f'
    faixa.style.color = '#ffffff'
    faixa.style.font = '12px/1.5 ui-monospace, SFMono-Regular, Menlo, monospace'
    faixa.style.borderBottom = '2px solid #ffb4b4'
    limites.style.opacity = '0.85'
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', montarFaixa)
  } else {
    montarFaixa()
  }
})()
