# Cápsula de reprodução · BUG-20260909-VHII

| Item | Valor |
|---|---|
| Commit base | 543f0bdb633a2b9bf28d856ee733e17ab62cc679 (master) |
| Ambiente | macOS 26.5.2 (Darwin 25.5.0), Node v24.13.0, npm 11.6.2, VS Code 1.136.1 |
| Comando | `sh fix/reproducao.sh` (lê a pasta da extensão instalada; não instala nada) |
| Código de saída | 1 (1 = defeito presente) |
| Tentativas / falhas | 1 / 1 |
| Determinismo | deterministic: depende só de qual pacote está instalado |

Saída integral em `reproducao-antes.txt`. A instalação encontrada é a `0.0.1` de 2026-09-09 19:31,
sem `out/host/update.js`, `net.js` e `build.js`; o commit da feature 007 é de 21:43.
