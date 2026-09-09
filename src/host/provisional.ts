/**
 * PROVISIONAL: the whole file is discarded by feature 003, which brings the
 * real panel. It exists for one reason (RF-19): without a document that
 * loads, the host never receives `onLoaded`, and the channel of this feature
 * would ship unproven.
 *
 * It is deliberately ugly. It prints what arrives, offers the two buttons
 * that exercise the way back, and takes the host interface exactly once —
 * the webview-side twin of RF-17. What survives into feature 003 is
 * `document.ts`, with its policy and its nonce, not this body.
 * @module host/provisional
 */

/** The relative path the demo button asks to open, inside the observed root. */
const DEMO_PATH = '_reversa_forward/002-ponte-e-host/requirements.md'

/**
 * The provisional body of the panel.
 * @param nonce - the nonce of the session; the inline script carries it.
 * @returns the markup that goes inside the document body.
 */
export function provisionalBody(nonce: string): string {
  return `<h1>Reversa Views</h1>
<p>Documento provisório da feature 002. A feature 003 o substitui pelo painel.</p>
<p>
  <button id="reload" type="button">Reler o processo</button>
  <button id="open" type="button">Abrir requirements.md</button>
</p>
<pre id="out">aguardando o host…</pre>
<script nonce="${nonce}">
  const host = acquireVsCodeApi()
  const out = document.getElementById('out')

  window.addEventListener('message', (event) => {
    const envelope = event.data || {}
    out.textContent = envelope.command + '\\n' + JSON.stringify(envelope.data, null, 2)
  })

  document.getElementById('reload').addEventListener('click', () => {
    host.postMessage({ command: 'reload' })
  })

  document.getElementById('open').addEventListener('click', () => {
    host.postMessage({ command: 'openFile', data: { path: '${DEMO_PATH}' } })
  })

  host.postMessage({ command: 'onLoaded' })
</script>`
}
