# Legacy impact: fechamento mensal

> Feature greenfield, sem legado pré-existente.

| Arquivo afetado | Componente (spec de origem) | Tipo | Severidade | Justificativa |
|---|---|---|---|---|
| `package.json` | `fundacao-persistencia.md` | componente-novo | MEDIUM | fixa a pilha |
| `infra/migrations/001` a `008` | `fundacao-persistencia.md`, `ajustes.md`, `ingestao-transacoes.md`, `acerto-mensal.md` | componente-novo, delta-de-dados | CRITICAL | esquema aplicado |
| `infra/seed.ts` | `fundacao-persistencia.md`, `acerto-mensal.md` | componente-novo | MEDIUM | dados iniciais |
| `pages/index.tsx` | `telas-e-navegacao.md` | componente-novo | HIGH | tela inicial |
| `models/core/fechamento.ts` | `sdd/acerto-mensal` | componente-novo | HIGH | caminho sem extensão |
