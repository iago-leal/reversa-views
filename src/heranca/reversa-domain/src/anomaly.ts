/* HERDADO: não editar sem declarar a adaptação em src/heranca/PROCEDENCIA.md
 * origem:      scrum-harness (https://github.com/iago-leal/scrum-harness)
 * caminho:     packages/reversa-domain/src/anomaly.ts
 * revisão:     420305daa6cdd10858b720a34cb8db67d8e5c5e9 (2026-09-08)
 * copiado em:  2026-09-09
 * adaptações:  nenhuma
 */
/**
 * The anomaly vocabulary of the REVERSA reader (comp-72 R13). The panel
 * observes a framework that keeps evolving, so a field it does not expect
 * must never take the screen down: every parser degrades by recording an
 * anomaly and carrying on with what it could read. The codes are a closed
 * set so the View can translate them and the tests can assert them.
 * @module @scrum-harness/reversa-domain/anomaly
 */

/**
 * Why a piece of REVERSA state could not be read as expected. Extended
 * deliberately by comp-73 with the impact, migration and ideation axes —
 * the union stays closed so the View keeps one translation table and the
 * suite keeps asserting the whole vocabulary.
 */
export type AnomalyCode =
  // Discovery, policy, forward and progress (comp-72).
  | 'config-ausente'
  | 'json-invalido'
  | 'tipo-invalido'
  | 'fase-desconhecida'
  | 'fase-atual-ja-concluida'
  | 'checkbox-nao-canonico'
  | 'actions-sem-acoes'
  | 'adendo-superado'
  | 'corrected-alvo-ambiguo'
  | 'linha-corrompida'
  // Impact, migration and ideation (comp-73).
  | 'linha-de-impacto-incompleta'
  | 'tabela-nao-reconhecida'
  | 'tipo-de-impacto-desconhecido'
  | 'severidade-desconhecida'
  | 'tipo-de-verificacao-desconhecido'
  | 'cenario-ambiguo'
  | 'agente-de-migracao-desconhecido'
  | 'current-agent-nao-objeto'
  | 'sessao-sem-idea'
  | 'estagio-divergente'

/** One recorded degradation: what file, what happened, and any detail worth showing. */
export interface Anomaly {
  file: string
  code: AnomalyCode
  detail?: string
}

/** Accumulator the contracts append to while they read. */
export class AnomalyLog {
  private readonly entries: Anomaly[] = []

  /**
   * Record one degradation.
   * @param file - the REVERSA file being read.
   * @param code - the closed-vocabulary reason.
   * @param detail - optional extra context for the View.
   */
  add(file: string, code: AnomalyCode, detail?: string): void {
    this.entries.push(detail === undefined ? { file, code } : { file, code, detail })
  }

  /** Absorb the anomalies of a nested read. */
  addAll(anomalies: readonly Anomaly[]): void {
    this.entries.push(...anomalies)
  }

  /** The anomalies recorded so far, in the order they happened. */
  list(): Anomaly[] {
    return [...this.entries]
  }
}
