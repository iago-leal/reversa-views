# Cápsula de reprodução · BUG-20260910-74UL

| Item | Valor |
|---|---|
| Commit base | 543f0bdb633a2b9bf28d856ee733e17ab62cc679 (master), com README e um teste modificados sem commit |
| Ambiente | macOS 26.5.2, Node v24.13.0, extensão 0.7.0 instalada |
| Comando | `node fix/reproducao.mjs <raiz-do-clone>` (função pura sobre o requirements real) |
| Código de saída | 1 (1 = dúvida contada) |
| Tentativas / falhas | 2 / 2 (painel 0.7.0 na captura do usuário; reprodução isolada) |
| Determinismo | deterministic |
