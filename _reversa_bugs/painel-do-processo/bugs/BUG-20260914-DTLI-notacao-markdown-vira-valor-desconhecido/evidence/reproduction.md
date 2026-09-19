# Cápsula de reprodução: BUG-20260914-DTLI

| Campo | Valor |
|---|---|
| Commit base | `94edec9` (`master`), sem alteração em `src/` desde `ecbebb9`, a construção 0.9.4 instalada |
| Ambiente | macOS 27.0, Node v24.13.0, `out/` recompilado com `npm run compile` |
| Comando | `node repro8.mjs`: `ImpactContract.read` de `out/heranca/reversa-domain/src/impact.js` sobre cada `legacy-impact.md` de `/Users/iagoleal/dev/afla/_reversa_forward/` |
| Saída | exit 0; resultado em `impacto-afla-2026-09-19-antes.txt` |
| Taxa | 14/14 features |
| Classificação | determinística |

## O que a medição mostra

O `afla` cresceu de seis para catorze features desde o relato de 14/09, e o defeito cresceu junto:

- nas doze features cuja tabela é reconhecida, a contagem por tipo canônico sai **zerada**, e
  todas as 207 linhas geram `tipo-de-impacto-desconhecido`;
- nas features 003 e 004, cujo cabeçalho anota `Componente (`architecture.md`)`, a tabela não é
  reconhecida e nenhuma linha é lida;
- das severidades lidas, 6 são canônicas em negrito (`**HIGH**` 2, `**CRITICAL**` 4) e 2 são `—`.

Nos `regression-watch.md`, 12 dos 14 cabeçalhos do vigia escrevem `Regra esperada após a mudança`,
contra `Regra esperada após mudança` do `reversa-coding/SKILL.md:137`, e por isso não casam.

## Valores que devem continuar sendo anomalia

`—`, `**não tocado**`, `` `teste-alterado` `` (fora do vocabulário) e as células compostas
`` `componente-novo` / `regra-alterada` `` e `` `componente-novo`, `regra-alterada` ``, que nomeiam
dois tipos numa linha só.
