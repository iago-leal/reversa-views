// Reprodução: countDoubts do leitor herdado sobre o requirements real da feature ativa.
// Sai com 1 quando conta dúvida que a seção "Lacunas" nega; 0 quando não. Só lê.
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const raiz = process.argv[2] ?? process.cwd()
const { countDoubts } = require(`${raiz}/out/heranca/reversa-domain/src/actions.js`)
const md = readFileSync(`${raiz}/_reversa_forward/007-atualizacao-e-progresso/requirements.md`, 'utf8')
const n = countDoubts(md)
const linhas = md.split('\n').map((l, i) => [i + 1, l]).filter(([, l]) => l.includes('[DÚVIDA]'))
console.log('countDoubts:', n)
for (const [i, l] of linhas) console.log(`linha ${i}: ${l.slice(0, 140)}`)
console.log('seção Lacunas diz:', /Nenhuma lacuna aberta/.test(md) ? '"Nenhuma lacuna aberta"' : '(outra coisa)')
console.log(n > 0 ? 'DEFEITO PRESENTE: dúvida contada sem dúvida aberta' : 'ok: zero dúvidas')
process.exit(n > 0 ? 1 : 0)
