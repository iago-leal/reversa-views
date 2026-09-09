/**
 * The body of the panel: a mount point, a stylesheet and a script (D-09,
 * D-13).
 *
 * Nothing more. What the panel shows comes entirely from the bundle, and the
 * host's share of the drawing ends here.
 *
 * The two addresses arrive ALREADY RESOLVED by the editor, and are not built
 * from disk paths: the policy `document.ts` declares serves scripts by nonce
 * and stylesheets from the webview origin, and a disk path would simply be
 * refused. `document.ts` does not change for this feature.
 * @module host/panel
 */

/** What the body is assembled from. */
export interface PanelOptions {
  /** The nonce of this session; the script tag carries it. */
  nonce: string
  /** The address of the bundle, as the editor rewrote it. */
  scriptUri: string
  /** The address of the stylesheet, as the editor rewrote it. */
  styleUri: string
}

/**
 * The body of the panel. Pure: same arguments, same string.
 * @param options - nonce and the two resolved addresses.
 * @returns the markup that goes inside the document body.
 */
export function panelBody(options: PanelOptions): string {
  const { nonce, scriptUri, styleUri } = options

  return `<link rel="stylesheet" href="${styleUri}" />
<div id="root"></div>
<script nonce="${nonce}" src="${scriptUri}"></script>`
}
