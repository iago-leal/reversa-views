// Gerador determinístico das views do registro de bugs, pelo protocolo do /reversa-debugger-graph.
// Guardado aqui para que a regeneração não dependa de sessão: `node _reversa_bugs/gerar-views.mjs . [contexto]`.
// Lê só os front matters dos bug.md; escreve apenas em <contexto>/generated/ e _reversa_sdd/traceability/bugs.md.
// Uso: node gerar-views.mjs <raiz-do-projeto> [contexto]
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync, renameSync, statSync } from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const raiz = path.resolve(process.argv[2] ?? '.')
const yaml = require(path.join(raiz, 'node_modules/yaml'))
const REG = path.join(raiz, '_reversa_bugs')
const OUT = path.join(raiz, '_reversa_sdd')
const agora = new Date().toISOString()
const so = process.argv[3] ?? null

function atomico(arquivo, texto) {
  mkdirSync(path.dirname(arquivo), { recursive: true })
  const tmp = `${arquivo}.tmp-${process.pid}`
  writeFileSync(tmp, texto, 'utf8'); renameSync(tmp, arquivo)
}
function esc(s) { return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;') }
function frontMatter(md) {
  const m = md.match(/^---\n([\s\S]*?)\n---\n/); if (!m) throw new Error('sem front matter')
  return yaml.parse(m[1])
}

// 1. varredura global
const contextos = readdirSync(REG).filter(n => statSync(path.join(REG, n)).isDirectory())
const bugs = []
for (const ctx of contextos) {
  const dir = path.join(REG, ctx, 'bugs'); if (!existsSync(dir)) continue
  for (const pasta of readdirSync(dir).sort()) {
    const arq = path.join(dir, pasta, 'bug.md'); if (!existsSync(arq)) continue
    const fm = frontMatter(readFileSync(arq, 'utf8'))
    bugs.push({ ...fm, _ctx: ctx, _pasta: pasta, _path: `_reversa_bugs/${ctx}/bugs/${pasta}`, _done: existsSync(path.join(dir, pasta, 'DONE.md')) })
  }
}
// 2. invariantes
const erros = []
const porId = new Map()
for (const b of bugs) {
  if (porId.has(b.id)) erros.push({ bug: b.id, campo: 'id', problema: `ID duplicado (${porId.get(b.id)._path} e ${b._path})` })
  porId.set(b.id, b)
}
for (const b of bugs) {
  if (b.schema_version !== 1) erros.push({ bug: b.id, campo: 'schema_version', problema: `desconhecida: ${b.schema_version}` })
  if (b.status === 'resolved' && (!b.resolution_kind || b.closure?.satisfied !== true)) erros.push({ bug: b.id, campo: 'status', problema: 'resolved sem resolution_kind ou sem closure.satisfied' })
  if (b.resolution_kind === 'fixed') {
    if (b.traceability?.root_cause?.state !== 'confirmed') erros.push({ bug: b.id, campo: 'root_cause', problema: 'fixed sem root_cause confirmed' })
    if (!(b.traceability?.regression_tests?.length > 0)) erros.push({ bug: b.id, campo: 'regression_tests', problema: 'fixed sem teste de regressão' })
    if (!b.spec_verdict) erros.push({ bug: b.id, campo: 'spec_verdict', problema: 'fixed sem veredito de spec' })
  }
  for (const r of b.relationships ?? []) {
    if (r.bug === b.id) erros.push({ bug: b.id, campo: 'relationships', problema: 'autorrelação' })
    else if (!porId.has(r.bug)) erros.push({ bug: b.id, campo: 'relationships', problema: `alvo inexistente ${r.bug}` })
  }
  if (b._done && b.status !== 'resolved') erros.push({ bug: b.id, campo: 'DONE.md', problema: 'trava presente sem status resolved' })
  if (!b._done && b.status === 'resolved' && b.closure?.satisfied === true) erros.push({ bug: b.id, campo: 'DONE.md', problema: 'fechamento sem trava' })
}
// ciclo de duplicate-of
for (const b of bugs) { const vistos = new Set([b.id]); let atual = b
  for (;;) { const d = (atual.relationships ?? []).find(r => r.type === 'duplicate-of'); if (!d) break
    if (vistos.has(d.bug)) { erros.push({ bug: b.id, campo: 'relationships', problema: 'ciclo de duplicate-of' }); break }
    vistos.add(d.bug); atual = porId.get(d.bug); if (!atual) break } }
const invalidos = new Set(erros.map(e => e.bug))
const validos = bugs.filter(b => !invalidos.has(b.id))

// arestas canônicas + inversas derivadas
const INV = { 'caused-by': 'causes', 'blocked-by': 'blocks', 'duplicate-of': 'duplicated-by', 'regression-of': 'regressed-by' }
const SIM = new Set(['related-to', 'conflicts-with'])
function arestas(ctxBugs) {
  const lista = []
  for (const b of validos) for (const r of b.relationships ?? []) {
    lista.push({ origem: b.id, tipo: r.type, destino: r.bug, state: r.state ?? 'proposed', evid: (r.evidence ?? []).length, derivada: false })
    if (SIM.has(r.type)) lista.push({ origem: r.bug, tipo: r.type, destino: b.id, state: r.state ?? 'proposed', evid: (r.evidence ?? []).length, derivada: true })
    else if (INV[r.type]) lista.push({ origem: r.bug, tipo: INV[r.type], destino: b.id, state: r.state ?? 'proposed', evid: (r.evidence ?? []).length, derivada: true })
  }
  const ids = new Set(ctxBugs.map(b => b.id))
  return lista.filter(a => ids.has(a.origem) || ids.has(a.destino))
}
function impacto(b, todas) {
  const forte = todas.filter(a => (a.state === 'supported' || a.state === 'confirmed') && a.origem === b.id)
  const c = t => forte.filter(a => a.tipo === t).length
  return c('causes') * 3 + c('blocks') * 2 + c('regressed-by') * 4 + Math.min(c('related-to'), 3)
}
const CAB = n => `<!-- GENERATED, DO NOT EDIT: regenerado por /reversa-debugger-graph em ${agora} a partir de ${n} bugs -->`
const rotuloCtx = (b, ctx) => b._ctx === ctx ? b.id : `${b.id} (${b._ctx})`
const nome = id => porId.get(id)?.title ?? id

// 3. views por contexto
for (const ctx of contextos) {
  if (so && ctx !== so) continue
  const meus = validos.filter(b => b._ctx === ctx)
  const meusInvalidos = bugs.filter(b => b._ctx === ctx && invalidos.has(b.id))
  const todos = bugs.filter(b => b._ctx === ctx)
  if (todos.length === 0) continue
  const G = path.join(REG, ctx, 'generated'); mkdirSync(G, { recursive: true })
  const publicos = meus.filter(b => b.visibility !== 'restricted')
  const restritos = meus.filter(b => b.visibility === 'restricted')
  const abertos = publicos.filter(b => b.status !== 'resolved')
  const resolvidos = publicos.filter(b => b.status === 'resolved')
  const A = arestas(meus)
  const N = todos.length

  // catalog.jsonl
  const linhas = [JSON.stringify({ _meta: 'GENERATED, DO NOT EDIT', gerado_por: '/reversa-debugger-graph', em: agora, bugs: N })]
  for (const b of todos) { const { _ctx, _pasta, _done, ...fm } = b; linhas.push(JSON.stringify({ ...fm, context: _ctx, path: b._path, done: _done })) }
  atomico(path.join(G, 'catalog.jsonl'), linhas.join('\n') + '\n')

  // index.md
  const conta = (lista, chave) => { const m = new Map(); for (const b of lista) m.set(b[chave] ?? '-', (m.get(b[chave] ?? '-') ?? 0) + 1); return [...m] }
  let idx = `${CAB(N)}\n# Índice de bugs · ${ctx}\n\n`
  idx += `## Resumo\n\n| Status | Bugs |\n|---|---|\n${conta(meus, 'status').map(([k, v]) => `| ${k} | ${v} |`).join('\n')}\n\n`
  idx += `| Phase | Bugs |\n|---|---|\n${conta(meus, 'phase').map(([k, v]) => `| ${k} | ${v} |`).join('\n')}\n\n`
  idx += `## Abertos e ativos\n\n| # | ID | Prioridade | Severidade | area/module/feature | Título | Caminho | Bloqueado |\n|---|---|---|---|---|---|---|---|\n`
  idx += abertos.map(b => `| ${b.display_number} | ${b.id} | ${b.priority} | ${b.severity} | ${b.area}/${b.module}/${b.feature} | ${b.title} | \`${b._path}\` | ${(b.blocking ?? []).length > 0 ? 'sim' : 'não'} |`).join('\n') + '\n\n'
  idx += `## Resolvidos\n\n${resolvidos.length === 0 ? 'Nenhum.' : conta(resolvidos, 'resolution_kind').map(([k, v]) => `- ${k}: ${v}`).join('\n') + '\n\n' + resolvidos.map(b => `- ${b.id} (nº ${b.display_number}, ${b.resolution_kind}${b._done ? ', travado' : ''}): ${b.title}`).join('\n')}\n\n`
  if (restritos.length) idx += `## Restritos\n\n${restritos.map(b => `- ${b.id}: restrito`).join('\n')}\n\n`
  if (meusInvalidos.length) idx += `## Inconsistências\n\n${erros.filter(e => meusInvalidos.some(b => b.id === e.bug)).map(e => `- ${e.bug} · ${e.campo}: ${e.problema}`).join('\n')}\n`
  atomico(path.join(G, 'index.md'), idx)

  // matrix.md
  let mx = `${CAB(N)}\n# Matriz de relações · ${ctx}\n\nLista esparsa de arestas. Inversas derivadas estão marcadas. Relação \`proposed\` é hipótese e não entra em priorização.\n\n| Origem | Tipo | Destino | Estado | Evidências | Derivada |\n|---|---|---|---|---|---|\n`
  mx += (A.length ? A.map(a => `| ${rotuloCtx(porId.get(a.origem), ctx)} | ${a.tipo} | ${rotuloCtx(porId.get(a.destino), ctx)} | ${a.state} | ${a.evid} | ${a.derivada ? 'sim' : 'não'} |`).join('\n') : '| (nenhuma aresta) | | | | | |') + '\n'
  atomico(path.join(G, 'matrix.md'), mx)

  // graph.md
  const canon = A.filter(a => !a.derivada)
  let gm = `${CAB(N)}\n# Grafo de bugs · ${ctx}\n\n\`\`\`mermaid\ngraph LR\n`
  for (const b of publicos) gm += `  ${b.id.replace(/-/g, '_')}["nº ${b.display_number} · ${b.id}<br/>${b.title.replace(/"/g, "'")}<br/>${b.status} · ${b.severity}"]\n`
  for (const a of canon) gm += a.state === 'proposed' ? `  ${a.origem.replace(/-/g, '_')} -. ${a.tipo} (proposed) .-> ${a.destino.replace(/-/g, '_')}\n` : `  ${a.origem.replace(/-/g, '_')} -- ${a.tipo} --> ${a.destino.replace(/-/g, '_')}\n`
  gm += '```\n\n## Clusters\n\n'
  const porModulo = new Map(); for (const b of publicos) porModulo.set(b.module, [...(porModulo.get(b.module) ?? []), b])
  gm += [...porModulo].map(([m, l]) => `- \`${m}\`: ${l.length} bug(s): ${l.map(b => b.id).join(', ')}`).join('\n') + '\n\n'
  gm += 'Nenhum cluster por causa estrutural: não há aresta `supported` ou `confirmed` entre os bugs deste contexto.\n\n'
  gm += '## Impact score (heurística de triagem; não substitui priority/severity)\n\n| Bug | Score |\n|---|---|\n' + abertos.map(b => `| ${b.id} | ${impacto(b, A)} |`).join('\n') + '\n\nFórmula: causados×3 + bloqueados×2 + regressões×4 + relacionados×1 (máx. 3), só sobre arestas `supported`/`confirmed`.\n'
  atomico(path.join(G, 'graph.md'), gm)

  // spec-matrix.md
  const specs = new Map()
  for (const b of publicos) { const ls = b.traceability?.specs ?? []; if (ls.length === 0) specs.set('spec-gap', [...(specs.get('spec-gap') ?? []), b]); for (const s of ls) specs.set(s, [...(specs.get(s) ?? []), b]) }
  const adendosBug = existsSync(path.join(OUT, 'addenda')) ? readdirSync(path.join(OUT, 'addenda')).filter(n => n.startsWith('bug-')) : []
  let sm = `${CAB(N)}\n# Matriz BUG ↔ SPEC · ${ctx}\n\n| Seção de spec | open | active | resolved |\n|---|---|---|---|\n`
  for (const [s, l] of [...specs].sort((x, y) => x[0].localeCompare(y[0]))) { const f = st => l.filter(b => b.status === st).map(b => b.id).join(', ') || '-'; sm += `| \`${s}\` | ${f('open')} | ${f('active')} | ${f('resolved')} |\n` }
  if (!specs.has('spec-gap')) sm += '| spec-gap | - | - | - |\n'
  sm += `\nAdendos de bug vigentes em \`_reversa_sdd/addenda/\`: ${adendosBug.length ? adendosBug.map(a => `\`${a}\``).join(', ') : 'nenhum'}.\n`
  atomico(path.join(G, 'spec-matrix.md'), sm)

  // graph.html
  const nos = publicos
  const W = 960, H = Math.max(360, 140 * Math.ceil(nos.length / 3) + 120)
  const pos = new Map(); nos.forEach((b, i) => pos.set(b.id, { x: 160 + (i % 3) * 320, y: 90 + Math.floor(i / 3) * 140 }))
  const cor = b => b.status === 'resolved' ? '#3fb950' : (b.status === 'active' || b.phase === 'awaiting-human') ? '#d29922' : '#f85149'
  const borda = b => (b.severity === 'high' || b.severity === 'critical') ? '#f85149' : b.severity === 'medium' ? '#d29922' : '#30363d'
  const stTexto = b => b.status === 'resolved' ? `resolved · ${b.resolution_kind}` : b.phase === 'awaiting-human' ? 'active · awaiting-human' : `${b.status} · ${b.phase}`
  let svg = `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Grafo de bugs">`
  svg += `<defs><marker id="seta" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#8b949e"/></marker></defs>`
  for (const a of canon) { const p = pos.get(a.origem), q = pos.get(a.destino); if (!p || !q) continue
    const dx = q.x - p.x, dy = q.y - p.y, len = Math.hypot(dx, dy) || 1, ux = dx / len, uy = dy / len
    const x1 = p.x + ux * 130, y1 = p.y + uy * 50, x2 = q.x - ux * 130, y2 = q.y - uy * 50
    svg += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#8b949e" stroke-width="1.5" ${a.state === 'proposed' ? 'stroke-dasharray="6 4"' : ''} marker-end="url(#seta)"/>`
    svg += `<text x="${(x1 + x2) / 2}" y="${(y1 + y2) / 2 - 6}" fill="#8b949e" font-size="11" text-anchor="middle">${esc(a.tipo)}${a.state === 'proposed' ? ' (proposed)' : ''}</text>` }
  for (const b of nos) { const p = pos.get(b.id)
    svg += `<a href="../bugs/${esc(b._pasta)}/bug.md"><rect x="${p.x - 130}" y="${p.y - 48}" width="260" height="96" rx="8" fill="#161b22" stroke="${borda(b)}" stroke-width="2"/>`
    svg += `<text x="${p.x - 118}" y="${p.y - 26}" fill="#e6edf3" font-size="13" font-weight="600">nº ${b.display_number} · ${esc(b.id.slice(-4))}</text>`
    const t = b.title.length > 38 ? b.title.slice(0, 37) + '…' : b.title
    svg += `<text x="${p.x - 118}" y="${p.y - 6}" fill="#c9d1d9" font-size="11">${esc(t)}</text>`
    svg += `<text x="${p.x - 118}" y="${p.y + 14}" fill="#8b949e" font-size="11">${esc(b.severity)} · ${esc(b.area)}</text>`
    svg += `<text x="${p.x - 118}" y="${p.y + 34}" fill="${cor(b)}" font-size="11" font-weight="600">${esc(stTexto(b))}</text></a>` }
  svg += '</svg>'
  const adendos = adendosBug.length
  const central = abertos.slice().sort((x, y) => impacto(y, A) - impacto(x, A))[0]
  let html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Grafo de Bugs · ${esc(ctx)}</title>
<style>body{margin:0;background:#0d1117;color:#e6edf3;font:14px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif;padding:24px}h1{font-size:20px;margin:0 0 4px}h2{font-size:16px;margin:28px 0 8px;border-bottom:1px solid #30363d;padding-bottom:4px}.meta{color:#8b949e;font-size:12px}.cards{display:flex;flex-wrap:wrap;gap:12px;margin:16px 0}.card{background:#161b22;border:1px solid #30363d;border-radius:8px;padding:12px 16px;min-width:140px}.card b{display:block;font-size:24px}.card span{color:#8b949e;font-size:12px}table{border-collapse:collapse;width:100%;font-size:13px}th,td{border:1px solid #30363d;padding:6px 8px;text-align:left;vertical-align:top}th{background:#161b22}a{color:#58a6ff}.svgwrap{background:#0d1117;border:1px solid #30363d;border-radius:8px;padding:8px;overflow-x:auto}.ok{color:#3fb950}.warn{color:#d29922}.bad{color:#f85149}</style></head><body>
<h1>Grafo de Bugs · ${esc(ctx)}</h1>
<p class="meta">Gerado por /reversa-debugger-graph em ${agora} · ${N} bugs · ${meusInvalidos.length} inconsistências · arestas tracejadas = relação proposed (hipótese)</p>
<div class="cards"><div class="card"><b>${N}</b><span>bugs</span></div><div class="card"><b>${resolvidos.filter(b => b.resolution_kind === 'fixed').length}</b><span>resolved · fixed</span></div><div class="card"><b>${abertos.length}</b><span>abertos / ativos</span></div><div class="card"><b>${adendos}</b><span>adendos de spec</span></div><div class="card"><b>${meusInvalidos.length}</b><span>inconsistências</span></div></div>
<div class="svgwrap">${svg}</div>
<p>${central ? `O nó central é <a href="../bugs/${esc(central._pasta)}/bug.md">${esc(central.id)}</a> (nº ${central.display_number}, impact score ${impacto(central, A)}). ` : ''}${canon.some(a => a.state !== 'proposed') ? 'As relações confirmadas contam a história abaixo.' : 'Nenhuma relação confirmada ainda: as arestas existentes são hipóteses de origem comum, não de causa.'}</p>
<h2>Bugs abertos / ativos</h2>
<table><tr><th>#</th><th>ID</th><th>Severidade</th><th>Prioridade</th><th>Título</th><th>area/module/feature</th><th>Status</th></tr>
${abertos.map(b => `<tr><td>${b.display_number}</td><td><a href="../bugs/${esc(b._pasta)}/bug.md">${esc(b.id)}</a></td><td>${esc(b.severity)}</td><td>${esc(b.priority)}</td><td>${esc(b.title)}</td><td>${esc(b.area)}/${esc(b.module)}/${esc(b.feature)}</td><td class="${b.phase === 'awaiting-human' ? 'warn' : 'bad'}">${esc(stTexto(b))}</td></tr>`).join('\n') || '<tr><td colspan="7">Nenhum.</td></tr>'}
</table>
<h2>Concluídos (travados)</h2>
<table><tr><th>#</th><th>ID</th><th>Fechado em</th><th>resolution_kind</th><th>Título</th></tr>
${publicos.filter(b => b._done).map(b => `<tr><td>${b.display_number}</td><td><a href="../bugs/${esc(b._pasta)}/bug.md">${esc(b.id)}</a></td><td>${esc(b.updated)}</td><td class="ok">${esc(b.resolution_kind)}</td><td>${esc(b.title)}</td></tr>`).join('\n') || '<tr><td colspan="5">Nenhum bug travado com DONE.md.</td></tr>'}
</table>
${meusInvalidos.length ? `<h2>Inconsistências</h2><ul>${erros.filter(e => meusInvalidos.some(b => b.id === e.bug)).map(e => `<li class="bad">${esc(e.bug)} · ${esc(e.campo)}: ${esc(e.problema)}</li>`).join('')}</ul>` : ''}
</body></html>\n`
  atomico(path.join(G, 'graph.html'), html)
  console.log(`contexto ${ctx}: ${N} bugs, ${meus.length} válidos, ${meusInvalidos.length} inconsistências; views em ${path.relative(raiz, G)}`)
}

// 4. espelho do lado da spec
const porSpec = new Map()
for (const b of validos.filter(b => b.visibility !== 'restricted')) {
  for (const s of b.traceability?.specs ?? []) { const art = s.split('#')[0]; porSpec.set(art, [...(porSpec.get(art) ?? []), { b, s }]) }
}
let esp = `${CAB(validos.length)}\n# Bugs por artefato de spec\n\nEspelho gerado pelo registro de bugs. Registra o vínculo; conteúdo de spec muda só por adendo.\n\n`
for (const [art, l] of [...porSpec].sort((x, y) => x[0].localeCompare(y[0]))) {
  esp += `## \`${art}\`\n\n` + l.map(({ b, s }) => `- ${b.id} (${b.status}${b.resolution_kind ? '/' + b.resolution_kind : ''}, ${b.priority}): ${b.title}\n  - seção \`#${s.split('#')[1] ?? ''}\` · pasta \`${b._path}\``).join('\n') + '\n\n'
}
atomico(path.join(OUT, 'traceability', 'bugs.md'), esp)
if (erros.length) { console.log('INCONSISTÊNCIAS:'); for (const e of erros) console.log(` - ${e.bug} · ${e.campo}: ${e.problema}`) }
console.log(`espelho: _reversa_sdd/traceability/bugs.md (${validos.length} bugs)`)
