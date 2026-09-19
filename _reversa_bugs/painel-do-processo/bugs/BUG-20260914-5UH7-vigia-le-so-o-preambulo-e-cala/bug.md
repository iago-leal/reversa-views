---
schema_version: 1
id: BUG-20260914-5UH7
display_number: 9
title: O vigia de regressão só procura a tabela antes do primeiro título, e sai vazio sem dizer nada
status: resolved
phase: delivering
severity: low
priority: P3
created: 2026-09-14
updated: 2026-09-19

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
  rate: "14/14"
  suspected_triggers:
    - "tabela ativa do regression-watch.md posta sob um título de seção, e não no preâmbulo"
    - "seção de observações ou de arquivadas com nome estendido, como 'Observações, sem peso de regressão'"
    - "tabela de observações ou de arquivadas com colunas próprias"

blocking: []

relationships:
  - bug: BUG-20260914-DTLI
    type: related-to
    state: confirmed
    evidence: []

traceability:
  specs:
    - _reversa_sdd/sdd/leitura-do-processo.md#6-requisitos-funcionais
    - _reversa_sdd/sdd/painel-do-processo.md#4-non-goals-fora-do-escopo
  affected_code:
    - src/heranca/reversa-domain/src/watch.ts
    - src/heranca/reversa-domain/src/table.ts
  root_cause:
    state: confirmed
    location:
      - src/heranca/reversa-domain/src/watch.ts:67-71
      - src/heranca/reversa-domain/src/watch.ts:77-91
    summary: >-
      WatchContract.read lê a tabela ativa só de sections[''], o preâmbulo, e as seções de
      observações, arquivadas e histórico por igualdade exata do título normalizado; rowsOf devolve
      lista vazia sem anomalia quando não acha tabela. A parte de cabeçalho em comum
      (Regra esperada após a mudança) foi resolvida pelo BUG-20260914-DTLI, e a medição com ela
      aplicada isola o defeito: 14/14 features vazias, contra 226 linhas W###.
    evidence:
      - evidence/reproduction.md
      - evidence/vigia-afla-2026-09-19-antes.txt
  reproduction_tests:
    - tests/leitura-vigia-secoes.spec.ts#a tabela onde o agente a escreve
  regression_tests:
    - tests/leitura-vigia-secoes.spec.ts#o que não muda

spec_verdict:
  verdict: spec-gap
  decided_by: iago
  decided_at: 2026-09-19
  addendum: _reversa_sdd/addenda/bug-BUG-20260914-5UH7-v001.md
delivery:
  branch: master
  commit: 9203e9f
  pull_request: null
  ci: null
  merged: 2026-09-19
  published: 2026-09-19, pacote reversa-views-0.9.11.vsix gerado e instalado por code --install-extension

versions:
  fixed_in: "0.9.11"
  built_from: dae310f
  affected: "0.7.0 a 0.9.4"
  installed: "0.9.4, carimbada em ecbebb9"

backports: []

change_set:
  - id: CHG-001
    kind: code
    artifact: src/heranca/reversa-domain/src/watch.ts
    diff: fix/CHG-001.diff
  - id: CHG-002
    kind: configuration
    artifact: src/heranca/adaptacoes.yml, src/heranca/manifesto.yml, src/heranca/PROCEDENCIA.md
    diff: fix/CHG-002.diff
  - id: CHG-003
    kind: specification
    artifact: _reversa_sdd/addenda/bug-BUG-20260914-5UH7-v001.md

closure:
  policy: package
  satisfied: true
  satisfied_at: 2026-09-19
resolution_kind: fixed
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
| Teste | `tests/leitura-vigia-secoes.spec.ts` |
| Adendo | `_reversa_sdd/addenda/bug-BUG-20260914-5UH7-v001.md` (RF-07.4, RF-07.5, EC-5UH7) |

## Resolution

### Causa raiz, no estado final

`confirmed`. `WatchContract.read` lia a tabela ativa só do preâmbulo e as seções por igualdade
exata do título normalizado, e `rowsOf` devolvia lista vazia sem anomalia. Com a parte de cabeçalho
já resolvida pelo `BUG-20260914-DTLI`, a medição isolou o defeito: 14/14 features vazias, contra
226 linhas `W###`.

### Veredito de spec

`spec-gap`, decidido pelo usuário. Declarar o vigia ilegível já era exigido pelo RF-07; onde
procurar o vigia, como reconhecer as seções e o que fazer com a linha vazia nunca foram
especificados. O adendo aditivo especifica RF-07.4, RF-07.5 e EC-5UH7.

### Estratégia

Correção direta. Seções pelo começo do título; toda seção sem nome especial é vigia ativo; o que
não se lê, se diz, com o código `tabela-nao-reconhecida`, que já existia; tabelas de colunas
próprias são sinalizadas, e não lidas. O ensaio estreitou a regra duas vezes antes do plano: a grade
de metadados sob o título deixou de ser acusada, e a linha só de travessões deixou de ser item.

### Correction Change Set

| CHG | Tipo | Artefato | Propósito |
|---|---|---|---|
| CHG-001 | code | `src/heranca/reversa-domain/src/watch.ts` | A14 importação; A15 seções e anomalias; A16 linha de travessões |
| CHG-002 | configuration | `adaptacoes.yml`, `manifesto.yml`, `PROCEDENCIA.md` | Declaração de A14 a A16, resumo e carimbo |
| CHG-003 | specification | `_reversa_sdd/addenda/bug-BUG-20260914-5UH7-v001.md` | O veredito `spec-gap` |

A15 foi declarada com o indicador de indentação `|2`, e a ressincronização simulada de `watch.ts`,
com A12 a A16, reproduz o arquivo exatamente. O defeito de indentação achado no ensaio foi corrigido
em A10 e A13 pelo `BUG-20260914-DTLI` (CHG-006) e segue aberto em A4 e A5, registrado à parte.

### Testes, e a prova vermelho → verde

**Vermelho**, com os testes aplicados e nenhuma linha de correção: 5 de 11 falham, exatamente os de
reprodução (`evidence/gate1-vermelho.txt`).

**Verde**, com o change set aplicado: 11 de 11; suíte inteira com 99 arquivos e 1553 casos;
`typecheck` com saída zero; `check:heranca:local` sem impedimento (`evidence/gate2-verde.txt`).

### Os quatro critérios de aceite

| # | Critério | Estado |
|---|---|---|
| 1 | Vigia presente sem tabela reconhecível produz anomalia que nomeia o arquivo | atendido |
| 2 | Tabela ativa sob título próprio é lida como watch principal | atendido |
| 3 | Seções que começam por `Observações` ou `Arquivadas` são reconhecidas | atendido |
| 4 | Observações e arquivadas continuam fora do watch principal | atendido, com caso próprio |

No `afla`, os itens ativos lidos passam de 0 para 76, em dez features; as outras quatro têm o vigia
vazio declarado. Surgem 12 anomalias verdadeiras: 9 tabelas de observações e 2 de arquivadas com
colunas próprias, e 1 tipo de verificação escrito em prosa. No cabeçalho do painel, a feature ativa
contribui com uma delas, como a nota de quem registrou previa (`evidence/vigia-afla-2026-09-19-depois.txt`).

### A entrega, que é o que a closure policy `package` exige

| Passo | Resultado |
|---|---|
| Registro | commit 9203e9f em `master` |
| Construção, suíte e empacotamento | `npm run atualizar -- --aplicar`, percurso inteiro sem parada, a partir de `dae310f` |
| Pacote | `reversa-views-0.9.11.vsix`, 210,7 KiB sobre teto de 2048,0 KiB |
| Instalação | `code --install-extension`, confirmada em `iagoleal-local.reversa-views@0.9.11` |

A versão salta de 0.9.4 para 0.9.11 porque a série deriva da contagem de commits, e sete se somaram
desde a construção 0.9.4: dois de registro do nº 7 e cinco da sessão que corrigiu os nº 8 e nº 9.
Os dois foram entregues no mesmo pacote.

Conferência com a construção instalada: sobre o `afla`, os itens ativos lidos passam de 0 para 76, e as 12 tabelas ou valores que o leitor não lê passam a ser declarados.

A origem **não** recebeu push: o clone fica à frente de `origin/master` até que o usuário decida
enviar.

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
