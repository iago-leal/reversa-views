/**
 * The narrowest possible platform surface, declared only for the type check of
 * the Webview (D-21).
 *
 * WHY THIS EXISTS. The Webview imports the shape of the process from
 * `src/host/protocol.ts` as a type, never as a value (D-06), and that shape is
 * reached through the inherited probe, which reads disk. Type checking the
 * Webview therefore drags `src/heranca/reversa-probe/` into the program, and
 * that layer names `node:fs` and `node:path` — modules the Webview
 * configuration deliberately cannot resolve, because its `types` list is empty
 * (RF-23). Without these declarations the check fails on the inherited layer,
 * for reasons that have nothing to do with the panel.
 *
 * WHY IT IS THIS SMALL. Exactly the six symbols the inherited layer names, and
 * nothing else. A wider shim — `types: ["node"]`, or the whole of `node:fs` —
 * would hand the Webview a platform it must never touch. Anything outside this
 * file still fails to resolve, which is what keeps the boundary provable:
 * `vscode`, `node:child_process`, `node:os` and every other platform module
 * are as unreachable from the Webview as they were before.
 *
 * The boundary suite (T020) is the other half: it forbids ANY `node:` import
 * in `src/webview/`, including the six symbols below, by reading the sources
 * rather than the types.
 *
 * This file is NEVER part of the host build: `tsconfig.json` compiles `src/`
 * with the real `@types/node`, and only `tsconfig.webview.json` includes it.
 */

declare module 'node:fs' {
  export function readFileSync(path: string, encoding: 'utf8'): string
  export function readdirSync(path: string): string[]
  export function statSync(path: string): { isFile(): boolean; isDirectory(): boolean; size: number }
}

declare module 'node:path' {
  export function isAbsolute(path: string): boolean
  export function resolve(...parts: string[]): string
  export function join(...parts: string[]): string
  export const sep: string
}
