/**
 * Fixtures da herança: árvores temporárias e estados lidos, montados à mão.
 *
 * O carimbo de sete linhas é escrito aqui por template próprio, e não pelo
 * módulo que o código usa. É de propósito: o fixture declara o formato, e a
 * suíte compara o comportamento do código contra essa declaração. Um fixture
 * que chamasse o próprio código comparado provaria apenas que ele concorda
 * consigo mesmo.
 *
 * Nenhuma função aqui toca as origens de verdade. Tudo o que precisa de disco
 * nasce sob a pasta temporária do sistema e morre com `limpar()`.
 * @module tests/helpers/heranca-fixtures
 */

import { createHash } from 'node:crypto'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'

/** Os campos que o carimbo de sete linhas carrega. */
export interface CamposDoCarimbo {
  origem?: string
  endereco?: string
  caminho: string
  revisao?: string
  dataDaRevisao?: string
  copiadoEm?: string
  adaptacoes?: string
}

const REVISAO_PADRAO = '420305daa6cdd10858b720a34cb8db67d8e5c5e9'

/**
 * O carimbo de sete linhas, na forma que `PROCEDENCIA.md` fixa.
 * @param campos - o que cada linha declara.
 * @returns as sete linhas, com quebra final.
 */
export function carimbo(campos: CamposDoCarimbo): string {
  const origem = campos.origem ?? 'scrum-harness'
  const endereco = campos.endereco ?? 'https://github.com/iago-leal/scrum-harness'
  const revisao = campos.revisao ?? REVISAO_PADRAO
  const dataDaRevisao = campos.dataDaRevisao ?? '2026-09-08'
  return [
    '/* HERDADO: não editar sem declarar a adaptação em src/heranca/PROCEDENCIA.md',
    ` * origem:      ${origem} (${endereco})`,
    ` * caminho:     ${campos.caminho}`,
    ` * revisão:     ${revisao} (${dataDaRevisao})`,
    ` * copiado em:  ${campos.copiadoEm ?? '2026-09-09'}`,
    ` * adaptações:  ${campos.adaptacoes ?? 'nenhuma'}`,
    ' */',
    '',
  ].join('\n')
}

/** Um arquivo herdado completo: carimbo mais corpo. */
export function arquivoCarimbado(campos: CamposDoCarimbo, corpo: string): string {
  return carimbo(campos) + corpo
}

/** O resumo do conteúdo, na forma que o manifesto guarda. */
export function resumoDe(conteudo: string): string {
  return `sha256:${createHash('sha256').update(conteudo, 'utf8').digest('hex')}`
}

/** Uma árvore temporária viva, com raiz e destruição. */
export interface Arvore {
  /** Raiz absoluta da árvore. */
  raiz: string
  /** Escreve mais um arquivo, criando as pastas do caminho. */
  escrever(relativo: string, conteudo: string): void
  /** Caminho absoluto de um relativo desta árvore. */
  caminho(relativo: string): string
  /** Apaga tudo. */
  limpar(): void
}

/**
 * Monta uma árvore temporária com os arquivos dados.
 * @param arquivos - mapa de caminho relativo para conteúdo.
 * @param prefixo - prefixo do nome da pasta temporária.
 * @returns a árvore viva.
 */
export function arvoreTemporaria(
  arquivos: Record<string, string> = {},
  prefixo = 'heranca-',
): Arvore {
  const raiz = mkdtempSync(join(tmpdir(), prefixo))
  const escrever = (relativo: string, conteudo: string): void => {
    const destino = join(raiz, relativo)
    mkdirSync(dirname(destino), { recursive: true })
    writeFileSync(destino, conteudo, 'utf8')
  }
  for (const [relativo, conteudo] of Object.entries(arquivos)) escrever(relativo, conteudo)
  return {
    raiz,
    escrever,
    caminho: (relativo: string) => join(raiz, relativo),
    limpar: () => rmSync(raiz, { recursive: true, force: true }),
  }
}

/** Uma entrada de arquivo do manifesto, com os padrões desta suíte. */
export function entradaDeArquivo(
  overrides: Record<string, unknown> & { caminho: string; caminhoNaOrigem: string; resumo: string },
): Record<string, unknown> {
  return {
    origem: 'scrum-harness',
    carimbado: true,
    dataDaCopia: '2026-09-09',
    adaptacoes: [],
    ...overrides,
  }
}

/** A origem de código, como o manifesto a declara. */
export function origemDeCodigo(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    nome: 'scrum-harness',
    tipo: 'codigo',
    endereco: 'https://github.com/iago-leal/scrum-harness',
    revisao: REVISAO_PADRAO,
    dataDaRevisao: '2026-09-08',
    dataDaCopia: '2026-09-09',
    chaveDoCaminhoLocal: 'scrum-harness',
    prefixoNaOrigem: 'packages/',
    ...overrides,
  }
}

/** A origem de padrão, que não tem arquivo algum por definição. */
export function origemDePadrao(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    nome: 'vscode-kanban',
    tipo: 'padrao',
    endereco: 'https://github.com/iago-leal/vscode-kanban',
    versaoObservada: '1.35.2',
    dataDaObservacao: '2026-09-09',
    chaveDoCaminhoLocal: 'vscode-kanban',
    arquivos: [],
    ...overrides,
  }
}

/** Um manifesto inteiro, pronto para o julgamento. */
export function manifestoFixture(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    versao: 1,
    origens: [origemDeCodigo(), origemDePadrao()],
    arquivos: [],
    ...overrides,
  }
}

/** Um arquivo de adaptações inteiro. */
export function adaptacoesFixture(itens: Array<Record<string, unknown>> = []): Record<string, unknown> {
  return { versao: 1, adaptacoes: itens }
}

/** A adaptação de importação que A1 exemplifica. */
export function adaptacaoDeImportacao(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    id: 'A1',
    arquivo: 'src/heranca/reversa-probe/src/snapshot.ts',
    motivo: 'caminho relativo no lugar do nome de espaço de trabalho',
    original: "import { readReversa } from '@scrum-harness/reversa-domain'\n",
    adaptado: "import { readReversa } from '../../reversa-domain/src/index.ts'\n",
    ...overrides,
  }
}
