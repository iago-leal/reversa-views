/**
 * The single table of cases for the phase-name classifier (feature 015, D-19).
 *
 * Two classifiers exist, and they must not drift: `src/domain/fases.ts`, which
 * the reading uses, and `scripts/equivalencias/fases.js`, which the learning
 * uses because maintenance scripts are CommonJS and cannot import TypeScript
 * source. Both suites -- the one of the domain and the one of parity -- walk
 * THIS table, so a case added here is exercised on both sides at once.
 *
 * One row per line of the five-step table in `data-delta.md`, section 1, with
 * the examples that match and the ones that do not.
 * @module tests/helpers/fases-casos
 */

/** What a case expects, in the shape `classificarNome` returns minus `bruto`. */
export type Esperado =
  | { tipo: 'canonica'; canonica: string }
  | { tipo: 'encerramento' }
  | { tipo: 'ciclo'; canonica: string; ciclo: number }
  | { tipo: 'etapa'; base: string; sufixo: number | null }
  | { tipo: 'desconhecida' }

/** One case: the raw name, what it reads as, and why it is in the table. */
export interface CasoDeFase {
  bruto: string
  esperado: Esperado
  porque: string
}

/** The stages the table takes as approved; one is a prefix of another on purpose. */
export const ETAPAS_APROVADAS = ['verificacao', 'verificacao-regressao', 're-extracao', 'documentacao']

/** Every case, in the order of the precedence. */
export const CASOS_DE_FASE: CasoDeFase[] = [
  // 1. canonical: exact equality with one of the five.
  { bruto: 'escavacao', esperado: { tipo: 'canonica', canonica: 'escavacao' }, porque: 'igualdade exata' },
  { bruto: 'revisao', esperado: { tipo: 'canonica', canonica: 'revisao' }, porque: 'igualdade exata' },
  { bruto: 'Escavacao', esperado: { tipo: 'desconhecida' }, porque: 'a canônica é exata: caixa diferente é erro de grafia' },
  { bruto: 'escavacão', esperado: { tipo: 'desconhecida' }, porque: 'diacrítico a mais é erro de grafia' },

  // 2. closure: as feature 011 wrote it, and BEFORE the cycle.
  { bruto: 'concluido', esperado: { tipo: 'encerramento' }, porque: 'a raiz do encerramento' },
  { bruto: 'concluido-c3', esperado: { tipo: 'encerramento' }, porque: 'tem sufixo numérico e ainda assim é encerramento' },
  { bruto: 'revisao_concluida', esperado: { tipo: 'encerramento' }, porque: 'começa por fase canônica, mas um segmento declara o fim' },
  { bruto: 'concluido-escopado', esperado: { tipo: 'encerramento' }, porque: 'grafia medida na 011' },

  // 3. cycle: a canonical phase, then `^[-_]\S*?(\d+)$`.
  { bruto: 'geracao-c2', esperado: { tipo: 'ciclo', canonica: 'geracao', ciclo: 2 }, porque: 'a forma medida no afla' },
  { bruto: 'geracao-2', esperado: { tipo: 'ciclo', canonica: 'geracao', ciclo: 2 }, porque: 'qualquer sufixo numérico' },
  { bruto: 'geracao-ciclo-2', esperado: { tipo: 'ciclo', canonica: 'geracao', ciclo: 2 }, porque: 'texto entre o separador e o inteiro' },
  { bruto: 'escavacao_c2', esperado: { tipo: 'ciclo', canonica: 'escavacao', ciclo: 2 }, porque: 'sublinhado como separador' },
  { bruto: 'reconhecimento-c12', esperado: { tipo: 'ciclo', canonica: 'reconhecimento', ciclo: 12 }, porque: 'o inteiro inteiro, e não o último algarismo' },
  { bruto: 'geracao-c', esperado: { tipo: 'desconhecida' }, porque: 'sem inteiro ao fim' },
  { bruto: 'geracao-2a', esperado: { tipo: 'desconhecida' }, porque: 'o inteiro não está ao fim' },
  { bruto: 'geracao2', esperado: { tipo: 'desconhecida' }, porque: 'sem separador' },
  { bruto: 'geracao-c 2', esperado: { tipo: 'desconhecida' }, porque: 'espaço no sufixo' },

  // 4. stage: equal to an approved one, or starting with it, same remainder.
  { bruto: 'verificacao-regressao', esperado: { tipo: 'etapa', base: 'verificacao-regressao', sufixo: null }, porque: 'a igualdade inteira vem antes do prefixo' },
  { bruto: 'verificacao-regressao-c3', esperado: { tipo: 'etapa', base: 'verificacao-regressao', sufixo: 3 }, porque: 'vence a base mais longa, e o 3 é sufixo, não ciclo' },
  { bruto: 'verificacao-2', esperado: { tipo: 'etapa', base: 'verificacao', sufixo: 2 }, porque: 'a base curta ainda casa quando a longa não' },
  { bruto: 're-extracao-005', esperado: { tipo: 'etapa', base: 're-extracao', sufixo: 5 }, porque: 'o número acompanha a feature entregue' },
  { bruto: ' Documentacao ', esperado: { tipo: 'etapa', base: 'documentacao', sufixo: null }, porque: 'sem distinção de caixa e de espaços nas bordas' },
  { bruto: 'documentação', esperado: { tipo: 'desconhecida' }, porque: 'diacríticos não são removidos: é outra grafia, a aprovar em separado' },
  { bruto: 'verificacao-regressao-final', esperado: { tipo: 'desconhecida' }, porque: 'o resto não tem forma de sufixo' },

  // 5. unknown: whatever is left.
  { bruto: 'reconciliacao', esperado: { tipo: 'desconhecida' }, porque: 'etapa sem aprovação' },
  { bruto: 'regressao-c3', esperado: { tipo: 'desconhecida' }, porque: 'sufixo sobre base que ninguém aprovou' },
  { bruto: '', esperado: { tipo: 'desconhecida' }, porque: 'texto vazio' },
]
