# Cápsula de reprodução, BUG-20260921-J2ZK (nº 13)

- Data: 2026-09-21
- Commit base: `48fb6d4` (master)
- Ambiente: macOS (Darwin 27.0.0), Node v24.13.0
- Comando: `npx vitest run tests/webview-blocking.spec.ts`, com o caso novo aplicado e sem a correção
- Exit code: 1
- Taxa: 1/1
- Classificação: determinística

## Saída

Em `gate1-vermelho.txt`: bug travado com `bloqueado: true` produz uma linha na faixa.

## Leitura

Não há divergência entre código e spec a reproduzir: o comportamento é o que o RF-10 da 008 manda. O
que se reproduz é a regra antiga, para provar que o caso novo a distingue da nova.
