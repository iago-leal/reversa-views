# Cápsula de reprodução, BUG-20260921-WNU6 (nº 12)

- Data: 2026-09-21
- Commit base: `48fb6d4` (master), com a feature 015 aberta e sem código
- Ambiente: macOS (Darwin 27.0.0), Node v24.13.0
- Comando: `npm run compile:cli` e, em seguida, `readFrontMatter` de `out-cli/domain/front-matter.js` sobre seis blocos de uma linha
- Exit code: 0
- Taxa: 1/1, mais 1/1 na leitura real do `afla` pelo painel de linha de comando
- Classificação: determinística

## Saída, antes da correção

Em `leitor-antes-2026-09-21.txt`. As três primeiras linhas com comentário saem erradas, uma em cada
ramo do leitor; as duas últimas, com cerquilha que não é comentário, saem certas.

## Saída, depois da correção

Em `leitor-depois-2026-09-21.txt`. As seis saem certas.

## Alcance

Em `alcance-em-dev-2026-09-21.txt`: seis linhas em cinco dos 61 `bug.md` de `~/dev`.

## No painel

Antes, `npm run painel -- --passada --sem-conferir --workspace=~/dev/afla` mostrava "Aguardando
decisão humana (2)", com o `BUG-20260914-SRSK` pela razão de bloqueio. Depois, mostra (1), só o
`BUG-20260914-RQLK`, que tem bloqueio de verdade e severidade alta em aberto.
