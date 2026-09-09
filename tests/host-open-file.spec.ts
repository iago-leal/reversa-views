/**
 * Suíte da contenção e abertura (T011), contra `src/host/open-file.ts`.
 *
 * RF-08 exige recusar caminho que escape da raiz observada, e D-07 exige que
 * a recusa venha de `resolveInside`, herdada da sonda, e não de comparação
 * escrita no host. A prova disso é indireta e deliberada: os casos de borda
 * aqui são exatamente os que a suíte herdada de `files.spec.ts` fixa, e a
 * suíte de fronteiras confere que o módulo importa a função herdada.
 */

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import { openFile } from '../src/host/open-file.ts'
import type { EditorPort, LogPort } from '../src/host/ports.ts'

const ROOT = '/w/projeto'

function bancada(open: EditorPort['open'] = vi.fn(async () => {})) {
  const lines: string[] = []
  const log: LogPort = { write: (line) => void lines.push(line) }
  const editor: EditorPort = { open }
  return { lines, log, editor, open: open as ReturnType<typeof vi.fn> }
}

describe('caminho válido', () => {
  it('resolve para o absoluto dentro da raiz e abre uma vez', async () => {
    const b = bancada()
    const aviso = await openFile(ROOT, '_reversa_forward/002/requirements.md', b.editor, b.log)

    expect(aviso).toBeNull()
    expect(b.open).toHaveBeenCalledTimes(1)
    expect(b.open).toHaveBeenCalledWith(join(ROOT, '_reversa_forward/002/requirements.md'))
  })
})

describe('caminhos recusados', () => {
  const casos: Array<[string, string]> = [
    ['travessia', '../fora/segredo.md'],
    ['travessia disfarçada', 'dentro/../../fora.md'],
    ['caminho absoluto', '/etc/passwd'],
    ['unidade de disco do Windows', 'C:\\Windows\\System32\\config'],
    ['caminho vazio', '   '],
  ]

  for (const [nome, caminho] of casos) {
    it(`recusa ${nome} antes de qualquer chamada à porta do editor`, async () => {
      const b = bancada()
      const aviso = await openFile(ROOT, caminho, b.editor, b.log)

      expect(b.open).not.toHaveBeenCalled()
      // A recusa fica no canal de saída, e não vira aviso na tela: só o
      // arquivo que sumiu chega à webview, conforme a tabela de erros.
      expect(aviso).toBeNull()
      expect(b.lines).toHaveLength(1)
      expect(b.lines[0]).toContain('fora da raiz')
      if (caminho.trim() !== '') expect(b.lines[0]).toContain(caminho)
    })
  }
})

describe('arquivo que não existe mais', () => {
  it('captura a falha, registra e devolve aviso que nomeia o arquivo (EC-05)', async () => {
    const b = bancada(
      vi.fn(async () => {
        throw new Error('ENOENT: no such file or directory')
      }),
    )
    const aviso = await openFile(ROOT, 'sumiu.md', b.editor, b.log)

    expect(aviso).toEqual({ level: 'warning', message: expect.stringContaining('sumiu.md') })
    expect(b.lines).toHaveLength(1)
    expect(b.lines[0]).toContain('sumiu.md')
    expect(b.lines[0]).toContain('ENOENT')
  })

  it('nenhuma exceção escapa para quem chamou', async () => {
    const b = bancada(
      vi.fn(async () => {
        throw new Error('editor recusou')
      }),
    )
    await expect(openFile(ROOT, 'sumiu.md', b.editor, b.log)).resolves.not.toThrow()
  })
})

describe('procedência da contenção (D-07)', () => {
  it('o módulo reusa resolveInside da sonda, sem regra própria de travessia', () => {
    const fonte = readFileSync('src/host/open-file.ts', 'utf8')
    expect(fonte).toContain('resolveInside')
    expect(fonte).toContain('reversa-probe')
    expect(fonte).not.toMatch(/startsWith\s*\(/)
    expect(fonte).not.toContain('isAbsolute')
  })
})
