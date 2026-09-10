<!-- GENERATED, DO NOT EDIT: regenerado por /reversa-debugger-graph em 2026-09-10T11:34:13.415Z a partir de 3 bugs -->
# Grafo de bugs · painel-do-processo

```mermaid
graph LR
  BUG_20260909_FJBD["nº 1 · BUG-20260909-FJBD<br/>Cabeçalho declara leitura degradada por anomalia cenario-ambiguo na nota de impacto greenfield<br/>resolved · low"]
  BUG_20260909_VHII["nº 2 · BUG-20260909-VHII<br/>Extensão instalada anterior à feature 007 não declara procedência nem anuncia atualização<br/>resolved · medium"]
  BUG_20260910_74UL["nº 3 · BUG-20260910-74UL<br/>Painel conta uma dúvida na feature 007 por menção ao marcador no histórico de alterações<br/>resolved · low"]
  BUG_20260909_VHII -. related-to (proposed) .-> BUG_20260909_FJBD
  BUG_20260910_74UL -. related-to (proposed) .-> BUG_20260909_FJBD
```

## Clusters

- `leitura-do-processo`: 2 bug(s): BUG-20260909-FJBD, BUG-20260910-74UL
- `empacotamento-e-verificacao`: 1 bug(s): BUG-20260909-VHII

Nenhum cluster por causa estrutural: não há aresta `supported` ou `confirmed` entre os bugs deste contexto.

## Impact score (heurística de triagem; não substitui priority/severity)

| Bug | Score |
|---|---|


Fórmula: causados×3 + bloqueados×2 + regressões×4 + relacionados×1 (máx. 3), só sobre arestas `supported`/`confirmed`.
