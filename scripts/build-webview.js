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
 *     node ./scripts/build-webview.js --observar
 *
 * The browser target and the size ceiling come from './limites', which is the
 * single source of both (RF-15, RN-06): the target has to match the Electron
 * the minimum editor ships, and the ceiling has to be the same number the test
 * suite checks. Watch mode belongs to feature 005 and lives at the bottom.
 * @module scripts/build-webview
 */

const { statSync } = require('node:fs')
const path = require('node:path')

const esbuild = require('esbuild')

const { ALVO_DO_NAVEGADOR, TETO_DO_PACOTE_DA_TELA, formatarTamanho } = require('./limites')
const { trimColourSets } = require('./theme-tokens')

const root = path.resolve(__dirname, '..')

/** The two files the panel is served from, and what the ceiling measures. */
const emitted = ['main.js', 'main.css']

const options = {
  absWorkingDir: root,
  entryPoints: [path.join('src', 'webview', 'main.tsx')],
  outdir: path.join('out', 'res', 'webview'),
  bundle: true,
  format: 'iife',
  platform: 'browser',
  target: ALVO_DO_NAVEGADOR,
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

/**
 * The size guard (RF-14, D-11).
 *
 * It runs at the end of the bundling because the bundling is what knows what
 * it emitted, and failing here is failing before the build goes on. The two
 * files are summed because the stylesheet and the script travel together: the
 * panel loads both, and a ceiling on one of them alone measures nothing.
 *
 * It stops the process rather than warning. A warning about a bundle that will
 * only misbehave on the user's machine is a warning nobody reads.
 * @param {string} outdir - where the bundling wrote, relative to the root.
 * @returns {number} the measured total, in bytes.
 */
function conferirTamanho(outdir) {
  const total = emitted.reduce(
    (soma, nome) => soma + statSync(path.join(root, outdir, nome)).size,
    0,
  )
  const medida = `${formatarTamanho(total)}, teto ${formatarTamanho(TETO_DO_PACOTE_DA_TELA)}`
  if (total > TETO_DO_PACOTE_DA_TELA) {
    console.error(`O pacote da tela estourou o teto: ${medida}`)
    console.error('Corte peso na webview ou reveja o teto em scripts/limites.js.')
    process.exit(1)
  }
  console.log(`Pacote da tela: ${medida}`)
  return total
}

/**
 * The watch mode (RF-20, D-16).
 *
 * It reuses this very configuration, trimmer included, so that there is no
 * second place where the webview is bundled. The source map exists only here:
 * the installed package ships without it, and the ceiling is not measured in
 * this mode, because a source map is exactly what would blow it.
 * @returns {Promise<void>} resolves when the watcher is running.
 */
async function observar() {
  const contexto = await esbuild.context({ ...buildOptions, sourcemap: 'inline', minify: false })
  await contexto.watch()
  console.log('Observando src/webview: cada alteração reempacota. Ctrl+C encerra.')
  console.log('Recarregar a página do preview é ato seu: não há canal para o navegador.')
}

async function main() {
  if (process.argv.includes('--observar')) return observar()
  await esbuild.build(buildOptions)
  console.log(`Webview bundled into ${options.outdir}: ${emitted.join(', ')}`)
  conferirTamanho(options.outdir)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
