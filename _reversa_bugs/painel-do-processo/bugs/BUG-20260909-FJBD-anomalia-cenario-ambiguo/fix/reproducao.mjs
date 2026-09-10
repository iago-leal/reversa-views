// Reprodução do BUG-20260909-FJBD: o leitor herdado marca `cenario-ambiguo` na nota de impacto
// da feature ativa. Sai com 1 quando a anomalia aparece, 0 quando não. Só lê.
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const raiz = process.argv[2] ?? process.cwd()
const { ImpactContract } = require(`${raiz}/out/heranca/reversa-domain/src/index.js`)
const nota = `${raiz}/_reversa_forward/007-atualizacao-e-progresso/legacy-impact.md`
const impacto = ImpactContract.read(readFileSync(nota, 'utf8'))
console.log('cenário lido:', impacto.cenario)
console.log('tipos na tabela:', impacto.byType.filter(t => t.count > 0).map(t => `${t.key}=${t.count}`).join(', '))
console.log('anomalias:', JSON.stringify(impacto.anomalies))
const presente = impacto.anomalies.some(a => a.code === 'cenario-ambiguo')
console.log(presente ? 'DEFEITO PRESENTE: cenario-ambiguo' : 'ok: sem cenario-ambiguo')
process.exit(presente ? 1 : 0)
