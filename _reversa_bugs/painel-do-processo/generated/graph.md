<!-- GENERATED, DO NOT EDIT: regenerado por /reversa-debugger-graph em 2026-09-11T19:59:01.985Z a partir de 6 bugs -->
# Grafo de bugs · painel-do-processo

```mermaid
graph LR
  BUG_20260909_FJBD["nº 1 · BUG-20260909-FJBD<br/>Cabeçalho declara leitura degradada por anomalia cenario-ambiguo na nota de impacto greenfield<br/>resolved · low"]
  BUG_20260909_VHII["nº 2 · BUG-20260909-VHII<br/>Extensão instalada anterior à feature 007 não declara procedência nem anuncia atualização<br/>resolved · medium"]
  BUG_20260910_74UL["nº 3 · BUG-20260910-74UL<br/>Painel conta uma dúvida na feature 007 por menção ao marcador no histórico de alterações<br/>resolved · low"]
  BUG_20260910_SVZU["nº 4 · BUG-20260910-SVZU<br/>Ritual de atualização não alcança a construção instalada quando o clone já está em dia<br/>resolved · high"]
  BUG_20260910_WIBK["nº 5 · BUG-20260910-WIBK<br/>Faixa de atualização do painel anuncia o comando que apenas confere<br/>resolved · high"]
  BUG_20260911_FI3O["nº 6 · BUG-20260911-FI3O<br/>O comando que a faixa anuncia não existe fora do clone, e falha como erro do npm<br/>open · high"]
  BUG_20260909_VHII -. related-to (proposed) .-> BUG_20260909_FJBD
  BUG_20260910_74UL -. related-to (proposed) .-> BUG_20260909_FJBD
  BUG_20260910_SVZU -. related-to (proposed) .-> BUG_20260909_VHII
  BUG_20260910_WIBK -- related-to --> BUG_20260910_SVZU
  BUG_20260911_FI3O -. related-to (proposed) .-> BUG_20260910_WIBK
  BUG_20260911_FI3O -. related-to (proposed) .-> BUG_20260910_SVZU
```

## Clusters

- `leitura-do-processo`: 2 bug(s): BUG-20260909-FJBD, BUG-20260910-74UL
- `empacotamento-e-verificacao`: 2 bug(s): BUG-20260909-VHII, BUG-20260910-SVZU
- `painel-do-processo`: 2 bug(s): BUG-20260910-WIBK, BUG-20260911-FI3O

Nenhum cluster por causa estrutural: não há aresta `supported` ou `confirmed` entre os bugs deste contexto.

## Impact score (heurística de triagem; não substitui priority/severity)

| Bug | Score |
|---|---|
| BUG-20260911-FI3O | 0 |

Fórmula: causados×3 + bloqueados×2 + regressões×4 + relacionados×1 (máx. 3), só sobre arestas `supported`/`confirmed`.
