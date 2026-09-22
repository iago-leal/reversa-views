const { readFileSync } = require('node:fs')
const raiz = process.cwd()
const { lerDeclaracoes } = require(raiz + '/scripts/heranca/leitura')
const { aplicar } = require(raiz + '/scripts/heranca/adaptacoes')
const { conteudoHerdado } = require(raiz + '/scripts/heranca/carimbo')
const { manifesto, adaptacoes } = lerDeclaracoes(raiz)
for (const e of manifesto.arquivos) {
  const ids = e.adaptacoes ?? []
  if (!ids.length) continue
  const itens = adaptacoes.adaptacoes.filter(i => ids.includes(i.id))
  const local = conteudoHerdado(readFileSync(raiz + '/' + e.caminho, 'utf8'), e.carimbado !== false)
  if (itens.some(i => i.adaptado === '')) { console.log(e.caminho, 'supressão pura, pula'); continue }
  const inv = itens.slice().reverse().map(i => ({ id: i.id, original: i.adaptado, adaptado: i.original }))
  const volta = aplicar(local, inv)
  if (!volta.ok) { console.log(e.caminho, 'desfazer:', volta.id, volta.motivo); continue }
  const ida = aplicar(volta.conteudo, itens)
  console.log(e.caminho, ida.ok ? (ida.conteudo === local ? 'reproduz' : 'DIFERE') : 'reaplicar: ' + ida.id + ' ' + ida.motivo)
}
