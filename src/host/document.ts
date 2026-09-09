/**
 * The webview document and the policy it is served under (RF-09, RNF-03,
 * D-09).
 *
 * Two functions and no state: one mints the nonce of the session, the other
 * assembles the document from nonce, webview origin and body. The policy is
 * stricter than the one inherited from the kit — the dynamic evaluation
 * clause is simply absent, because the third-party expression evaluator that
 * justified it there does not exist here.
 *
 * The document declares language, charset and viewport, and nothing else:
 * what it shows comes entirely from the body it is handed.
 * @module host/document
 */

import { randomBytes } from 'node:crypto'

/** What the document is assembled from. */
export interface DocumentOptions {
  /** The nonce of this session; every script tag of the body must carry it. */
  nonce: string
  /** The origin the editor serves this webview from. */
  cspSource: string
  /** The markup that goes inside the body. */
  body: string
  /**
   * Where the panel may open a connection to, when it may at all (D-03).
   *
   * Absent means forbidding it, which is what the editor asks for and what
   * every caller inside the extension passes: inside a webview there is no
   * host to talk to over the network, and allowing it would be a hole with no
   * purpose. The preview of feature 005 is the single caller that fills it,
   * with its own origin, because outside the editor the channel to the
   * pretend host IS a connection. The divergence is one directive wide, and
   * the preview declares it on the banner it shows.
   */
  connectSource?: string
  /** A class written on the body, as the editor writes its theme (D-08). */
  bodyClass?: string
}

/**
 * Mint the nonce of one session: sixteen random bytes, in hexadecimal.
 * @returns 32 hexadecimal characters, 128 bits of entropy.
 */
export function createNonce(): string {
  return randomBytes(16).toString('hex')
}

/**
 * Assemble the document. Pure: same arguments, same string.
 * @param options - nonce, webview origin and body.
 * @returns the whole HTML document, ready to hand to the editor.
 */
export function buildDocument(options: DocumentOptions): string {
  const { nonce, cspSource, body, connectSource, bodyClass } = options
  const policy = [
    "default-src 'none'",
    `img-src ${cspSource} data:`,
    `style-src ${cspSource}`,
    `font-src ${cspSource}`,
    `script-src 'nonce-${nonce}'`,
    `connect-src ${connectSource ?? "'none'"}`,
  ].join('; ')
  const openBody = bodyClass === undefined ? '<body>' : `<body class="${bodyClass}">`

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<meta http-equiv="Content-Security-Policy" content="${policy}" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Reversa</title>
</head>
${openBody}
${body}
</body>
</html>
`
}
