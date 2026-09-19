import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
const R = '/Users/iagoleal/dev/reversa-views/src'
const { readFeatureFolders } = await import(`${R}/probe/features.ts`)
const { readHistory } = await import(`${R}/domain/history.ts`)
const { REVERSA_FILE_CAP } = await import(`${R}/heranca/reversa-probe/src/index.ts`)
const root = mkdtempSync(path.join(tmpdir(), 'bug11-'))
const dir = path.join(root, '_reversa_forward', '001-grande'); mkdirSync(dir, { recursive: true })
const linhas = ['# Actions', '', '| ID | Descrição | Status |', '|--|--|--|']
let i = 0; let txt = ''
while (Buffer.byteLength(txt = linhas.join('\n')) <= REVERSA_FILE_CAP) linhas.push(`| T${++i} | ${'x'.repeat(200)} | \`[X]\` |`)
writeFileSync(path.join(dir, 'actions.md'), txt + '\n')
const lido = readFeatureFolders({ root, forwardFolder: '_reversa_forward' })
const h = readHistory({ ...lido, activeFeatureDir: null, pausedFeatureDirs: [], addendaFiles: [], addendaBodies: {}, outputFolder: '_reversa_sdd' })
console.log('bytes', Buffer.byteLength(txt), 'cap', REVERSA_FILE_CAP, 'acoes', i)
console.log('naoLidos', JSON.stringify(lido.pastas[0].naoLidos))
console.log('situacao', h.entradas[0].situacao, JSON.stringify(h.entradas[0].acoes))
console.log('anomalias', JSON.stringify(h.anomalias))
rmSync(root, { recursive: true, force: true })
