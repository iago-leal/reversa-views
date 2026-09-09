/**
 * The editor API, made unreachable from the Webview by declaring it empty
 * (RF-23, D-21).
 *
 * An empty `types` list stops the AMBIENT platform modules — every `node:*`
 * — from resolving, and that is what the boundary rests on. It does NOT stop
 * `vscode` from resolving, because `@types/vscode` is a package and module
 * resolution finds it by name whether or not it was listed. So the Webview
 * configuration maps the name here instead: the module exists, has nothing in
 * it, and every use of it fails to type check.
 *
 * The panel never wants this module. What it needs from the editor arrives
 * through `acquireVsCodeApi()`, taken exactly once, in `bridge/messaging.ts`.
 */

declare module 'vscode' {}
