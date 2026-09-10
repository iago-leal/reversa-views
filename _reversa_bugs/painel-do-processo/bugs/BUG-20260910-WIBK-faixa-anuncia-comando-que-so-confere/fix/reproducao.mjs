// Reprodução do BUG-20260910-WIBK sobre a função pura, sem editor nem rede.
// Uso, da raiz do clone: node _reversa_bugs/painel-do-processo/bugs/BUG-20260910-WIBK-faixa-anuncia-comando-que-so-confere/fix/reproducao.mjs
// Sai com 1 enquanto a faixa anunciar o comando que apenas confere; com 0 quando anunciar o que aplica.
import { readFileSync } from 'node:fs'
import { updateLabel } from '../../../../../src/webview/domain/labels.ts'

const APLICA = 'npm run atualizar -- --aplicar'
const script = readFileSync('scripts/atualizar.js', 'utf8')
const linhaDoScript = script.match(/Para aplicar: ([^']+)'/)?.[1] ?? '(não encontrada)'

let defeito = false
for (const status of [
  { estado: 'atrasada', commits: 2 },
  { estado: 'divergente', commits: 2 },
]) {
  const rotulo = updateLabel(status)
  const ok = rotulo.command === APLICA
  defeito ||= !ok
  console.log(`${status.estado.padEnd(11)} texto:   ${rotulo.text}`)
  console.log(`${''.padEnd(11)} comando: ${rotulo.command}   ${ok ? 'OK, aplica' : 'DEFEITO: apenas confere'}`)
}
console.log(`\nO que o script imprime como "Para aplicar": ${linhaDoScript}`)
console.log(`Comando esperado na faixa:                   ${APLICA}`)
process.exit(defeito ? 1 : 0)
