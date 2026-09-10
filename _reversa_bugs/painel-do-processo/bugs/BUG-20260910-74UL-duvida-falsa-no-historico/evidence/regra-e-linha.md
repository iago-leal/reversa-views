# A regra e a linha que a dispara

## src/heranca/reversa-domain/src/actions.ts, linhas 87-95
/**
 * Count the open questions left in a feature's `requirements.md` (R10):
 * they are what decides between `/reversa-clarify` and `/reversa-plan`.
 * @param md - the file content, or null when it does not exist.
 */
export function countDoubts(md: string | null): number {
  if (md === null) return 0
  return (md.match(/\[DÚVIDA\]/g) ?? []).length
}

## _reversa_forward/007-atualizacao-e-progresso/requirements.md

Linha 392 (seção 10, Lacunas):
Nenhuma lacuna aberta. As três dúvidas da versão inicial foram resolvidas na sessão acima.

Linha 407 (seção 11, Histórico de alterações), a única ocorrência do marcador:
| 2026-09-09 | Sessão de esclarecimentos por `/reversa-clarify`: cinco respostas integradas, três `[DÚVIDA]` resolvidos, emenda ao PRD registrada na seção 2, requisitos renumerados e agrupados por frente | reversa |

## Ocorrências do marcador em todos os requirements do ciclo forward
_reversa_forward/001-leitura-do-processo/requirements.md:0
_reversa_forward/002-ponte-e-host/requirements.md:0
_reversa_forward/004-heranca-e-sincronia/requirements.md:0
_reversa_forward/003-painel-do-processo/requirements.md:0
_reversa_forward/007-atualizacao-e-progresso/requirements.md:1
_reversa_forward/005-empacotamento-e-verificacao/requirements.md:0
_reversa_forward/006-cartoes-e-cronologia/requirements.md:0
