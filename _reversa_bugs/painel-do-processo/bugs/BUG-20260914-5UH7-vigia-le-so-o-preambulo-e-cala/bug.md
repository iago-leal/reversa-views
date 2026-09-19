---
schema_version: 1
id: BUG-20260914-5UH7
display_number: 9
title: O vigia de regressão só procura a tabela antes do primeiro título, e sai vazio sem dizer nada
status: open
phase: triaging
severity: low
priority: P3
created: 2026-09-14
updated: 2026-09-14

origin:
  type: manual-report
  external_ref: null

area: leitura
module: leitura-do-processo
feature: 001-leitura-do-processo
labels:
  - leitura-degradada
  - latente

visibility: normal
security_suspected: false

reproduction:
  classification: deterministic
  rate: "6/6"
  suspected_triggers:
    - "tabela ativa do regression-watch.md posta sob um título de seção, e não no preâmbulo"
    - "seção de observações ou de arquivadas com nome estendido, como 'Observações, sem peso de regressão'"
    - "tabela de observações ou de arquivadas com colunas próprias"

blocking: []

relationships:
  - bug: BUG-20260914-DTLI
    type: related-to
    state: proposed
    evidence: []

traceability:
  specs:
    - _reversa_sdd/sdd/leitura-do-processo.md#6-requisitos-funcionais
    - _reversa_sdd/sdd/painel-do-processo.md#4-non-goals-fora-do-escopo
  affected_code:
    - src/heranca/reversa-domain/src/watch.ts
    - src/heranca/reversa-domain/src/table.ts
  root_cause: null
  reproduction_tests: []
  regression_tests: []

spec_verdict: null
change_set: []

closure:
  policy: package
  satisfied: false
resolution_kind: null
---

# O vigia de regressão só procura a tabela antes do primeiro título, e sai vazio sem dizer nada

## Summary

`WatchContract.read` procura a tabela ativa do `regression-watch.md` apenas no preâmbulo, isto é,
antes do primeiro título `##`, e reconhece as seções de observações e de arquivadas pelo nome
exato. O `/reversa-coding` manda escrever "cabeçalho, tabela, seção de histórico, seção de
arquivadas", sem proibir título sobre a tabela, e o `afla` a põe sob `Itens de vigia`, `Itens
vigiados` ou `Watch items`, conforme a feature.

Nas seis features do `afla` a leitura devolve zero itens, zero observações e zero arquivadas,
embora os arquivos tragam de 7 a 15 linhas `W###`. E nada é dito: ao contrário do leitor de
impacto, o do vigia não emite `tabela-nao-reconhecida`.

O defeito é **latente**. A tela não desenha o eixo de vigia (NG-01 de `painel-do-processo.md`), e
nenhum consumidor atual lê `watch`. Ele passa a ter efeito no dia em que o eixo for desenhado.

## Expected Behavior

O RF-07 de `leitura-do-processo.md` manda registrar toda degradação encontrada na leitura. Um
`regression-watch.md` presente cuja tabela não foi encontrada é degradação e precisa virar
anomalia.

A tabela ativa deveria ser encontrada também sob um título que não seja o de observações, de
arquivadas ou de histórico, e as seções deveriam ser reconhecidas pelo nome com que começam.

## Actual Behavior

- `splitSections` põe o texto sob a chave do título normalizado, e `WatchContract` lê a tabela
  ativa só de `sections['']`.
- `sections[normalizeCell('Observações')]` não casa `observacoes sem peso de regressao`.
- `rowsOf` usa `findTable` com o cabeçalho exato, que recusa `Regra esperada após a mudança`
  (parte comum com `BUG-20260914-DTLI`) e as colunas próprias das tabelas de observações e de
  arquivadas do `afla`.
- Quando nenhuma tabela é encontrada, `rowsOf` devolve lista vazia sem registrar nada.

## Steps to Reproduce

1. Chamar `WatchContract.read` sobre `_reversa_forward/005-refatorar-exibicao-dashboard/regression-watch.md`
   do `afla`.
2. O resultado tem `items`, `observacoes` e `arquivadas` vazios, e `anomalies` vazio.
3. O arquivo traz seis observações (W001 a W006) e duas arquivadas (W004 e W005).

## Evidence

- `evidence/vigia-afla.txt`: por feature, os títulos e cabeçalhos de tabela com número de linha,
  a contagem de linhas `W###` e o que a leitura devolveu.

## Suspected Area

`WatchContract.read` e `rowsOf`, em `src/heranca/reversa-domain/src/watch.ts`, e a convenção de
preâmbulo documentada em `splitSections`, de `table.ts`.

## Acceptance Criteria

1. Um `regression-watch.md` presente, sem tabela reconhecível, produz anomalia que nomeia o
   arquivo.
2. A tabela ativa posta sob título próprio é lida como watch principal.
3. Seções cujo título começa por `Observações` ou por `Arquivadas` são reconhecidas.
4. Linhas de observação e de arquivada continuam fora do watch principal, como a spec do Reversa
   exige.

## Traceability

| Elo | Alvo |
|---|---|
| Spec | `_reversa_sdd/sdd/leitura-do-processo.md#6-requisitos-funcionais` (RF-07); `painel-do-processo.md` NG-01 |
| Código | `src/heranca/reversa-domain/src/watch.ts`, `src/heranca/reversa-domain/src/table.ts` |
| Teste | a definir no fix |

## Resolution

Pendente.

## Agent Notes

Descoberto na mesma conferência do `afla` que produziu `BUG-20260914-DTLI`. Relato em
`intake/relato-20260914-1140.md`.

Severidade low/P3 decidida pelo usuário depois de informado de que o eixo não aparece na tela. A
primeira proposta, high/P1, partia da premissa errada de que o vigia vazio era visível.

Restrições para quem corrigir:

- Corrigir só o critério 1 acrescenta ao painel do `afla` uma anomalia verdadeira, porque as
  tabelas de observações da 005 e da 006 usam colunas próprias. Isso é esperado e não deve ser
  "resolvido" silenciando a anomalia.
- Ler tabelas de colunas arbitrárias pela primeira coluna `ID` é uma hipótese de desenho, não um
  requisito: decidir no plano do fix, com caso concreto, e não por extrapolação.
- A camada herdada será tocada, com adaptação declarada, como no `BUG-20260914-DTLI`.
- Faz sentido corrigir depois do `BUG-20260914-DTLI`, que resolve a parte do cabeçalho em comum.

Rótulo `latente` proposto aqui, para defeito real da leitura sem consumidor que o exponha hoje.
