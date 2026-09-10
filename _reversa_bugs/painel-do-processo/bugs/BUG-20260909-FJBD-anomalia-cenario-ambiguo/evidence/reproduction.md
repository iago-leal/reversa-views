# Cápsula de reprodução · BUG-20260909-FJBD

| Item | Valor |
|---|---|
| Commit base | 543f0bdb633a2b9bf28d856ee733e17ab62cc679 (master) |
| Ambiente | macOS 26.5.2 (Darwin 25.5.0), Node v24.13.0 |
| Comando | `node fix/reproducao.mjs <raiz-do-clone>` (usa a saída compilada em `out/`; só lê) |
| Código de saída | 1 (1 = anomalia presente) |
| Tentativas / falhas | 2 / 2 (leitura completa às 21:51 e leitura isolada do contrato de impacto às 22:1x) |
| Determinismo | deterministic: função pura sobre o texto da nota |

Saída integral em `reproducao-antes.txt`. A nota da feature ativa declara cenário greenfield e
usa quatro tipos de impacto além de `componente-novo`; o leitor herdado registra `cenario-ambiguo`.
