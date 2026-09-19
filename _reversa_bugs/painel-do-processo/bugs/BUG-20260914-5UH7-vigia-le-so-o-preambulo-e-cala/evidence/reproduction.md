# Cápsula de reprodução: BUG-20260914-5UH7

| Campo | Valor |
|---|---|
| Commit base | `a734b8d` (`master`), com a correção do `BUG-20260914-DTLI` já aplicada |
| Ambiente | macOS 27.0, Node v24.13.0, `out/` recompilado com `npm run compile` |
| Comando | `node repro9.mjs`: `WatchContract.read` de `out/heranca/reversa-domain/src/watch.js` sobre cada `regression-watch.md` de `/Users/iagoleal/dev/afla/_reversa_forward/` |
| Saída | exit 0; resultado em `vigia-afla-2026-09-19-antes.txt` |
| Taxa | 14/14 features |
| Classificação | determinística |

## O que a medição mostra

Com o cabeçalho `Regra esperada após a mudança` já reconhecido pelo nº 8, o defeito aparece
isolado: nas catorze features a leitura devolve zero itens, zero observações, zero arquivadas e
**nenhuma anomalia**, contra 226 linhas `W###` nos arquivos.

A tabela ativa mora sempre sob título próprio (`Itens ativos`, `Watch items`, `Itens vigiados`,
`Itens de vigia`), e o leitor só a procura no preâmbulo. Doze das catorze seções de observações se
chamam `Observações, sem peso de regressão` ou `Observações (sem peso de regressão)`, e o leitor só
reconhece `Observações` exato.

O `reversa-coding/SKILL.md` prescreve as colunas só da tabela principal. As tabelas de observações
de 005 a 014 usam colunas próprias (`ID | Origem | O que precisa continuar verdadeiro | Por que não
é vigia`), e as de arquivadas de 002 e 005 também.
