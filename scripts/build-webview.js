/**
 * Bundles the Webview interface (RF-23, D-04, D-15).
 *
 * The extension itself is compiled by 'tsc' into 'out/'. The Webview is a
 * separate unit: a browser bundle, built by esbuild out of
 * 'src/webview/main.tsx' into 'out/res/webview/', with the stylesheet emitted
 * beside it under a stable name, so that 'src/host/panel.ts' can point at both
 * without guessing.
 *
 * Usage:
 *     node ./scripts/build-webview.js
 *
 * Watch mode, source maps and the size ceiling that stops the build belong to
 * feature 005, not here. What this script owns is the minimum that makes the
 * panel run inside the editor.
 * @module scripts/build-webview
 */

const esbuild = require('esbuild')
const path = require('node:path')

const { trimColourSets } = require('./theme-tokens')

const root = path.resolve(__dirname, '..')

/**
 * VS Code 1.78 ships Electron 22, whose Chromium is 108: nothing newer than
 * that may be emitted. The floor is the one the manifest declares, and
 * diverging from it produces an error only on the user's machine.
 */
const browserTarget = 'chrome108'

const options = {
  absWorkingDir: root,
  entryPoints: [path.join('src', 'webview', 'main.tsx')],
  outdir: path.join('out', 'res', 'webview'),
  bundle: true,
  format: 'iife',
  platform: 'browser',
  target: browserTarget,
  jsx: 'automatic',
  minify: true,
  sourcemap: false,
  // stable names, so that the body of the panel can point at them
  entryNames: '[name]',
  assetNames: '[name]',
  // '.css' covers the panel stylesheet and the colour sets the theme imports:
  // '@primer/primitives' ships plain compiled CSS, not CSS modules, so one
  // loader resolves the lot and it is emitted as the single 'main.css'
  loader: { '.css': 'css' },
  define: { 'process.env.NODE_ENV': '"production"' },
  logLevel: 'info',
}

/**
 * The colour sets are served trimmed to the tokens the stylesheet names: whole,
 * the four of them are larger than the entire budget. The reasoning is in
 * 'theme-tokens.js'.
 *
 * The plugin runs a probe build of its own, and therefore receives the options
 * WITHOUT itself in them.
 */
const buildOptions = { ...options, plugins: [trimColourSets(options)] }

async function main() {
  await esbuild.build(buildOptions)
  console.log(`Webview bundled into ${path.join('out', 'res', 'webview')}: main.js, main.css`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
