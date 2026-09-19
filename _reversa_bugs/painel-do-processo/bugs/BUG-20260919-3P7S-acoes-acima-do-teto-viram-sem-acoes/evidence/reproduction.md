# Cápsula de reprodução, BUG-20260919-3P7S (nº 11)

- Data: 2026-09-19
- Commit base: `49747f0718bfdd74ff5dfaace156216fe5ba01fc` (master), com a feature 010 ainda não commitada na árvore
- Ambiente: macOS (Darwin 27.0.0), Node v24.13.0
- Script: `evidence/repro.mts` (cria workspace temporário, lê pela sonda local e julga pelo histórico; apaga ao fim)
- Comando: `node --experimental-transform-types --no-warnings evidence/repro.mts`
- Exit code: 0
- Taxa: 1/1 tentativas reproduziram (mais 1/1 na leitura real do `financas-ali`, ver `leitura-actions-acima-do-teto-2026-09-19.txt`)
- Classificação: determinística

## Saída

```text
bytes 262155 cap 262144 acoes 1191
naoLidos ["actions.md"]
situacao sem-acoes {"total":0,"fechadas":0,"abertas":0,"emendas":0}
anomalias []
```

## Leitura

A sonda local sabe que o `actions.md` existe e não foi lido (`naoLidos`). O julgamento
(`src/domain/history.ts`) ignora esse fato: `situationOf` recebe só o texto nulo e devolve
`sem-acoes`; `deliveryOf` só converte em anomalia o `legacy-impact.md` e o `onboarding.md`.
