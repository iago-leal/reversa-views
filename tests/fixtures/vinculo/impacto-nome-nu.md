# Legacy impact: cartões e cronologia

> Feature greenfield, sem legado pré-existente. Âncora: prd.md + specs SDD.

## Tabela de impacto

| Arquivo afetado | Componente | Tipo | Severidade | Justificativa |
|---|---|---|---|---|
| `src/probe/features.ts` | leitura-do-processo | componente-novo | MEDIUM | sonda nova sobre as pastas de feature |
| `src/domain/history.ts` | leitura-do-processo | componente-novo | MEDIUM | julgamento do histórico |
| `src/webview/ui/HistorySection.tsx` | painel-do-processo | componente-novo | LOW | cartão do histórico |
| `src/host/protocol.ts` | ponte-e-host | delta-de-contrato-externo | MEDIUM | dois campos acrescentados |
| `src/webview/ui/Legado.tsx` | painel-do-processo-v2 | componente-novo | LOW | nome que começa por uma spec e não é ela |

## Diff conceitual

Prosa que não é tabela.
