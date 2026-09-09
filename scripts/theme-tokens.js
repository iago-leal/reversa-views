/**
 * Serves the colour sets of the design system trimmed to what the panel's
 * stylesheet actually asks for (RF-24, D-15, D-16).
 *
 * Each set of '@primer/primitives' declares around nine hundred and sixty
 * tokens and weighs about 121 KB, because it is written for every component
 * the design system ships. The panel uses none of them: it is a header, a
 * banner, collapsible sections, lists and text. The four sets RF-11 requires
 * therefore cost 486 KB whole -- more, by themselves, than the 400 KB the
 * whole bundle is allowed.
 *
 * Offering fewer sets would cost the high contrast pair, which is exactly what
 * RF-11 exists to provide. Raising the ceiling would be deciding by writing
 * the decision down. So neither: the sets stay, and what leaves is the part of
 * them nothing can reach. Measured on this repository, the four go from
 * 485.898 B to 20.888 B.
 *
 * The trimming is measured, not guessed. A probe build runs first with the
 * sets emptied out, so that whatever remains naming a token is the interface
 * itself. Those names seed a transitive closure over the set -- a token whose
 * value names another token keeps that one alive -- and every declaration
 * outside the closure is dropped.
 *
 * ORIGIN. The idea, and the guard at the end of it, are taken from
 * 'scripts/theme-tokens.js' of the vscode-kanban kit, declared as a second
 * origin of adopted patterns in 'src/heranca/PROCEDENCIA.md' (D-22). This is
 * a rewrite, not a copy, and it is deliberately half the size: the kit also
 * has to drop the stylesheets of design system components that do not ship,
 * because it uses those components. This project imports '@primer/primitives'
 * and never '@primer/react' (D-02), so there is no component stylesheet to
 * serve empty, and the greedy pattern that once made the kit ship an unstyled
 * interface has nothing to be greedy about here.
 * @module scripts/theme-tokens
 */

const esbuild = require('esbuild')
const fs = require('node:fs')
const path = require('node:path')

/** Where the design system keeps the colour sets. */
const themeDirectory = path.join('@primer', 'primitives', 'dist', 'css', 'functional', 'themes')

/** Matches the path of a colour set, whatever the separator of the platform. */
const themeFile = new RegExp(
  `${themeDirectory.replace(/[\\/]/g, '[\\\\/]')}[\\\\/][a-z-]+\\.css$`,
)

/** A token named from somewhere: `var(--x)`, with or without a fallback. */
const reference = /var\(\s*(--[A-Za-z0-9_-]+)/g

/** A declaration of a token, one per line in the files of the design system. */
const declaration = /^(\s*)(--[A-Za-z0-9_-]+)\s*:/

/**
 * Every token named by a piece of text.
 * @param {string} text - the text to read.
 * @param {Set<string>} into - where to collect the names.
 * @returns {Set<string>} the same set, for chaining.
 */
function collectReferences(text, into) {
  reference.lastIndex = 0
  let match = reference.exec(text)
  while (match) {
    into.add(match[1])
    match = reference.exec(text)
  }
  return into
}

/**
 * Reads a colour set into the declarations it makes, keeping every other line
 * as it is.
 *
 * The files are generated, one declaration per line, so a line is enough of a
 * unit to work with: anything that is not a declaration is structure -- a
 * selector, an at-rule, a brace -- and is kept verbatim.
 * @param {string} text - the stylesheet.
 * @returns {Array<{line: string, token?: string, references: string[]}>} the lines.
 */
function readSet(text) {
  return text.split('\n').map((line) => {
    const match = declaration.exec(line)
    if (!match) return { line, references: [] }
    return {
      line,
      token: match[2],
      references: Array.from(collectReferences(line, new Set())),
    }
  })
}

/**
 * Grows a set of names until it names nothing new.
 *
 * A token kept alive by the interface may itself be written in terms of
 * another one, and dropping that one would leave the first resolving to
 * nothing. The closure is what makes the trimming safe rather than merely
 * small.
 * @param {Array<{line: string, token?: string, references: string[]}>} lines - the set, as `readSet` returns it.
 * @param {Set<string>} seed - the names the interface asks for.
 * @returns {Set<string>} every name that has to survive.
 */
function closeOver(lines, seed) {
  const byToken = new Map()
  for (const line of lines) {
    if (line.token) byToken.set(line.token, line.references)
  }

  const kept = new Set()
  const pending = Array.from(seed)
  while (pending.length) {
    const name = pending.pop()
    if (kept.has(name) || !byToken.has(name)) continue
    kept.add(name)
    for (const referenced of byToken.get(name)) {
      if (!kept.has(referenced)) pending.push(referenced)
    }
  }
  return kept
}

/**
 * Drops from a colour set every declaration nothing can reach.
 * @param {string} text - the stylesheet.
 * @param {Set<string>} kept - the names that survive.
 * @returns {string} the trimmed stylesheet.
 */
function trimSet(text, kept) {
  return readSet(text)
    .filter((line) => !line.token || kept.has(line.token))
    .map((line) => line.line)
    .join('\n')
}

/**
 * Learns what the interface actually names, by building it once with the
 * colour sets emptied out, so that a set cannot keep itself alive by naming
 * its own tokens.
 * @param {object} options - the options of the real build.
 * @returns {Promise<Set<string>>} the tokens the interface names.
 */
async function probeTokens(options) {
  const emptySets = {
    name: 'empty-colour-sets',
    setup(build) {
      build.onLoad({ filter: themeFile }, () => ({ contents: '', loader: 'css' }))
    },
  }

  const probe = await esbuild.build({
    ...options,
    plugins: [emptySets],
    metafile: false,
    // the probe is read, never served
    write: false,
    minify: false,
    sourcemap: false,
    logLevel: 'silent',
  })

  const tokens = new Set()
  for (const file of probe.outputFiles) collectReferences(file.text, tokens)
  return tokens
}

/**
 * Reports what the trimming saved, so that a build that stops saving is
 * visible instead of silent.
 * @param {Array<{name: string, before: number, after: number}>} sets - what was trimmed.
 */
function report(sets) {
  const before = sets.reduce((sum, set) => sum + set.before, 0)
  const after = sets.reduce((sum, set) => sum + set.after, 0)
  const drop = (from, to) => `${from} B -> ${to} B (${Math.round(100 - (to / from) * 100)}% dropped)`

  console.log('Colour sets trimmed to what the panel asks for:')
  for (const set of sets.slice().sort((a, b) => a.name.localeCompare(b.name))) {
    console.log(`  ${set.name}: ${drop(set.before, set.after)}`)
  }
  console.log(`  ${sets.length} sets in total: ${drop(before, after)}`)
}

/**
 * Stops a build whose closure kept nothing.
 *
 * A closure that keeps NOTHING has not saved anything: it has served a panel
 * with no colour at all, and said so with the most impressive number the
 * report can print. The kit learned this from a real defect, and the failure
 * was invisible because it looked like a record saving.
 *
 * The panel names tokens; if the closure comes back empty, the probe did not
 * read the stylesheet.
 * @param {Set<string>} kept - the names the closure retained.
 * @param {string} file - the colour set being trimmed, for the message.
 */
function assertClosureNotEmpty(kept, file) {
  if (kept.size > 0) return

  throw new Error(
    `The transitive closure over '${file}' kept no token at all, which means the probe build ` +
      `found nothing naming one. The panel would be served without colour. Check that ` +
      `'src/webview/theme/theme.css' is reached by the entry point, and that 'themeFile' in ` +
      `'scripts/theme-tokens.js' still matches the layout of ` +
      `'@primer/primitives/dist/css/functional/themes'.`,
  )
}

/**
 * The plugin that keeps the colour sets down to what the stylesheet uses.
 * @param {object} options - the options of the real build, used for the probe.
 * @returns {object} an esbuild plugin.
 */
function trimColourSets(options) {
  return {
    name: 'trim-colour-sets',
    setup(build) {
      let tokens = null
      const trimmed = []

      build.onStart(async () => {
        tokens = await probeTokens(options)
      })

      build.onLoad({ filter: themeFile }, (args) => {
        const text = fs.readFileSync(args.path, 'utf8')
        const kept = closeOver(readSet(text), tokens)

        assertClosureNotEmpty(kept, path.basename(args.path))

        const output = trimSet(text, kept)
        trimmed.push({ name: path.basename(args.path), before: text.length, after: output.length })
        return { contents: output, loader: 'css' }
      })

      build.onEnd(() => {
        if (trimmed.length) report(trimmed.splice(0, trimmed.length))
      })
    },
  }
}

module.exports = {
  themeFile,
  assertClosureNotEmpty,
  collectReferences,
  readSet,
  closeOver,
  trimSet,
  trimColourSets,
}
