---
schema_version: 1
id: BUG-20260919-3P7S
display_number: 11
title: Pasta com actions.md acima do teto de bytes aparece como sem ações, e a perda não é declarada
status: active
phase: delivering
severity: medium
priority: P2
created: 2026-09-19
updated: 2026-09-19

origin:
  type: inspection
  external_ref: null

area: leitura
module: leitura-do-processo
feature: historico
labels:
  - latente

visibility: normal
security_suspected: false

reproduction:
  classification: deterministic
  rate: "2/2"
  capsule: evidence/reproduction.md
  suspected_triggers:
    - "actions.md de uma pasta de feature acima de 262.144 B (REVERSA_FILE_CAP)"

blocking: []

relationships:
  - bug: BUG-20260914-5UH7
    type: related-to
    state: proposed
    evidence: []

traceability:
  specs:
    - _reversa_sdd/sdd/leitura-do-processo.md#11-edge-cases-e-tratamento-de-erros
    - _reversa_sdd/addenda/006-cartoes-e-cronologia.md#impacto-por-artefato-da-extracao
    - _reversa_sdd/addenda/010-vinculo-spec-e-conferencias.md#achado-da-leitura-real-rf-09-nao-se-cumpre-no-financas-ali
  affected_code:
    - src/domain/history.ts
    - src/probe/features.ts
  root_cause:
    location:
      - src/domain/history.ts#situationOf
      - src/domain/history.ts#deliveryOf
    summary: >-
      O julgamento do histórico trata texto nulo como arquivo ausente. `situationOf` recebe só
      `actionsMd` e devolve `sem-acoes` quando ele é nulo, sem consultar `naoLidos`, que a sonda
      local já preenche desde a 010; `deliveryOf` só converte `naoLidos` em anomalia para
      `legacy-impact.md` e `onboarding.md`. O mesmo silêncio vale para `requirements.md`
      (resumo nulo) e `progress.jsonl` (último evento nulo).
    state: confirmed
    evidence:
      - evidence/reproduction.md
      - evidence/leitura-actions-acima-do-teto-2026-09-19.txt
  reproduction_tests:
    - "tests/domain-history.spec.ts#reprodução: `actions.md` acima do teto sai `acoes-nao-lidas`, com a anomalia que nomeia o arquivo"
  regression_tests:
    - "tests/domain-history.spec.ts#`acoes-nao-lidas` vale para qualquer `actions.md` que a sonda marcou como não lido"
    - "tests/domain-history.spec.ts#`requirements.md` e `progress.jsonl` não lidos viram anomalia, sem mudar a situação de ações lidas"
    - "tests/domain-history.spec.ts#as perdas da pasta vêm na ordem dos arquivos, antes das do vínculo e das conferências"
    - "tests/domain-history.spec.ts#pasta sem `actions.md` e arquivo sem linha de ação seguem `sem-acoes`, sem anomalia"
    - "tests/domain-greenfield-panorama.spec.ts#pasta em acoes-nao-lidas faz componente em-andamento"
    - "tests/domain-greenfield-panorama.spec.ts#uma pasta de ações não lidas nunca vence uma pasta lida (bug nº 11)"
    - "tests/webview-progress-cards.spec.tsx#tem rótulo conhecido e não afirma \"0 de 0 ações fechadas\""

spec_verdict:
  verdict: spec-desatualizada
  decided_by: iago
  decided_at: 2026-09-19
  addendum: _reversa_sdd/addenda/bug-BUG-20260919-3P7S-v001.md

change_risk:
  level: media
  reasons:
    - vocabulário novo no contrato host↔tela e no panorama
    - host e tela saem no mesmo .vsix; sem dados persistidos; reversível

delivery:
  branch: master
  commit: null
  pull_request: null
  ci: null
  merged: null
  published: null

versions:
  fixed_in: null
  affected: "desde a feature 006 (regra da situação)"

backports: []

change_set:
  - id: CHG-001
    kind: code
    artifact: src/domain/types.ts
    diff: fix/CHG-001.diff
  - id: CHG-002
    kind: code
    artifact: src/domain/history.ts
    diff: fix/CHG-002.diff
  - id: CHG-003
    kind: code
    artifact: src/domain/greenfield.ts
    diff: fix/CHG-003.diff
  - id: CHG-004
    kind: code
    artifact: src/webview/domain/labels.ts
    diff: fix/CHG-004.diff
  - id: CHG-005
    kind: code
    artifact: src/webview/ui/HistorySection.tsx
    diff: fix/CHG-005.diff
  - id: CHG-006
    kind: specification
    artifact: _reversa_sdd/addenda/bug-BUG-20260919-3P7S-v001.md

closure:
  policy: package
  satisfied: false
resolution_kind: null
---

# Pasta com actions.md acima do teto de bytes aparece como sem ações, e a perda não é declarada

## Summary

Quando o `actions.md` de uma pasta de feature passa de 262.144 B, o teto de bytes da sonda herdada,
o histórico do painel mostra a pasta como `sem-acoes`, com zero ações. O arquivo existe e tem ações;
ele apenas não foi lido. Nenhuma anomalia aparece, e a lista de truncados fica vazia: o painel afirma
um fato que não verificou e cala a perda. Na leitura real do `financas-ali`, a pasta
`001-fechamento-mensal-mvp`, com 185 ações quase todas fechadas, aparece assim, e o critério de
RF-09 da feature 010 falha por isso.

## Expected Behavior

A spec efetiva cobre o caso. `_reversa_sdd/sdd/leitura-do-processo.md#11-edge-cases-e-tratamento-de-erros`,
EC-06: "Arquivo acima do teto de bytes: o arquivo não é lido, seu caminho consta da lista de
truncados, e o eixo sai vazio em vez de parcial." O eixo vazio é aceitável; o que a EC-06 exige é
que a perda seja dita. A regra geral da seção é degradar declarando, nunca em silêncio.

A feature 010 (RN-09) reafirma a regra para os arquivos que ela passou a ler: "o arquivo truncado é
dito truncado". E a RN-08 da 010 espera ver a 001 do `financas-ali` como `entregue-sem-adendo`,
situação que depende de as ações terem sido lidas.

Esperado, portanto: o painel não classifica como `sem-acoes` uma pasta cujo `actions.md` existe e
não foi lido, e a perda chega à seção de anomalias nomeando o arquivo.

## Actual Behavior

- `situacao: "sem-acoes"`, `acoes: {total: 0, fechadas: 0, abertas: 0, emendas: 0}`
- `history.anomalias`: vazio
- `probe.truncated`: vazio (o arquivo é lido pela sonda local, fora do relatório da sonda herdada)
- Nada na tela indica que houve um arquivo não lido

## Steps to Reproduce

1. Ter um workspace com uma pasta de feature cujo `actions.md` passe de 262.144 B
2. Abrir o painel sobre ele, ou chamar `readWorkspace(root, ...)` de `src/host/reading.ts`
3. Ver a entrada da pasta no histórico: `sem-acoes`, sem anomalia

Reproduzido em 2026-09-19 sobre `~/dev/financas-ali`, somente leitura.

## Evidence

- `evidence/leitura-actions-acima-do-teto-2026-09-19.txt`: tamanhos dos dois `actions.md`, contagem
  de checkboxes da 001, histórico julgado e as três fontes de perda declarada, todas vazias
- Relato bruto: `../../intake/relato-20260919-1655.md`

## Suspected Area

- `src/domain/history.ts`, `situationOf`: `actionsMd === null` devolve `sem-acoes` sem distinguir o
  arquivo ausente do presente e não lido.
- `src/probe/features.ts`: desde a 010, a sonda local já põe em `naoLidos` todo arquivo listado cujo
  texto voltou nulo, inclusive `actions.md`, `requirements.md` e `progress.jsonl`. A informação existe
  na leitura; o julgamento só a usa para `legacy-impact.md` e `onboarding.md`.

## Acceptance Criteria

1. Uma pasta com `actions.md` presente e não lido não sai como `sem-acoes`. Como ela sai (situação
   própria, ou situação desconhecida declarada) é decisão do fix, com a spec ao lado
2. A perda chega à seção de anomalias nomeando o arquivo, pela forma estrutural comum
3. O mesmo vale para `requirements.md` e `progress.jsonl` presentes e não lidos, cuja ausência hoje
   também passa calada (resumo e último evento nulos)
4. Pasta sem `actions.md` e `actions.md` sem linha de ação continuam `sem-acoes`, como hoje
   (`tests/domain-history.spec.ts`, casos "sem-acoes")
5. Teste de reprodução com fixture acima do teto, no molde de `impacto-grande` da 010

## Traceability

- Specs: `_reversa_sdd/sdd/leitura-do-processo.md#11-edge-cases-e-tratamento-de-erros` (EC-06);
  `_reversa_sdd/addenda/006-cartoes-e-cronologia.md` (histórico e situação);
  `_reversa_sdd/addenda/010-vinculo-spec-e-conferencias.md` (achado da leitura real, RF-09, RN-08, RN-09)
- Código afetado: `src/domain/history.ts`, `src/probe/features.ts`
- Testes relacionados existentes: `tests/domain-history.spec.ts`, `tests/probe-features.spec.ts`
- Relação proposta: `related-to` `BUG-20260914-5UH7` (mesma classe de defeito, leitura que perde
  conteúdo e sai vazia sem dizer nada), estado `proposed`

## Resolution

### Causa raiz, no estado final

`confirmed`. `situationOf` recebia só o texto do `actions.md` e tratava o nulo como arquivo ausente,
sem consultar `naoLidos`, que a sonda local já preenche desde a 010; `deliveryOf` convertia
`naoLidos` em anomalia apenas para `legacy-impact.md` e `onboarding.md`. O defeito nasce no domínio
(`src/domain/history.ts`), não na sonda. Reprodução determinística, 2/2 (`evidence/reproduction.md`).

### Veredito de spec

`spec-desatualizada`, decidido pelo usuário. A EC-06 já exigia declarar a perda, e nisso o código
divergia; mas o vocabulário de quatro situações da 006 e o alcance da anomalia fixado pela 010 não
comportavam a correção. O adendo `_reversa_sdd/addenda/bug-BUG-20260919-3P7S-v001.md` registra a
quinta situação, sua projeção no panorama, os três arquivos novos da anomalia e a leitura da EC-06.

### Estratégia

Correção direta, com situação nova, decidida pelo usuário. `acoes-nao-lidas` (rótulo "ações não
lidas") tem precedência sobre as outras quatro; no panorama avança 0 e se projeta `em-andamento`; a
linha de contagem da tela diz que as ações não foram lidas em vez de "0 de 0". A perda de
`actions.md`, `requirements.md` e `progress.jsonl` sai como `artefato-da-entrega-nao-lido`, código
que já existia, com detalhe que diz o que ficou sem julgamento.

### Correction Change Set

| CHG | Tipo | Artefato | Propósito |
|---|---|---|---|
| CHG-001 | code | `src/domain/types.ts` | Quinta situação em `FEATURE_SITUATIONS`; comentários da anomalia e de `anomalias` |
| CHG-002 | code | `src/domain/history.ts` | `situationOf` consulta `naoLidos`; `lossesOf` declara os três arquivos |
| CHG-003 | code | `src/domain/greenfield.ts` | `ADVANCE` 0 e `PROJECTION` `em-andamento` |
| CHG-004 | code | `src/webview/domain/labels.ts` | Rótulo "ações não lidas" |
| CHG-005 | code | `src/webview/ui/HistorySection.tsx` | Linha de contagem que declara a leitura faltante |
| CHG-006 | specification | `_reversa_sdd/addenda/bug-BUG-20260919-3P7S-v001.md` | O veredito `spec-desatualizada` |

Diffs em `fix/CHG-001.diff` a `fix/CHG-005.diff`; o dos testes em `fix/tests.diff`.

### Testes, e a prova vermelho → verde

**Vermelho**, com os testes aplicados e nenhuma linha de correção: 7 falhas em 97, exatamente os
casos que dependem da correção; o do critério 4 passa, como guarda (`evidence/gate1-vermelho.txt`).

**Verde**, com o change set aplicado: 97 de 97 nos três arquivos; `tsc --noEmit` com saída zero;
suíte inteira com 1687 de 1690, e as 3 falhas restantes são anteriores à correção e falham igual sem
ela: `preview-vinculo.spec.ts` (casos `conferencias` e `conferencias-sem-tabela`) e `versao.spec.ts`
(`evidence/gate2-verde.txt`).

### Os cinco critérios de aceite

| # | Critério | Estado |
|---|---|---|
| 1 | `actions.md` presente e não lido não sai como `sem-acoes` | atendido: `acoes-nao-lidas` |
| 2 | A perda chega às anomalias nomeando o arquivo | atendido |
| 3 | O mesmo para `requirements.md` e `progress.jsonl` | atendido |
| 4 | Sem `actions.md` e sem linha de ação seguem `sem-acoes` | atendido, casos antigos e caso próprio |
| 5 | Teste de reprodução com fixture acima do teto | atendido, pasta real em diretório temporário |

Sobre o `financas-ali`, somente leitura: a 001 passa de `sem-acoes` sem anomalia a `acoes-nao-lidas`
com a anomalia que nomeia o `actions.md`.

### A entrega, pendente

A closure policy `package` exige registro, empacotamento e instalação. A correção se apoia no
`naoLidos` da feature 010, ainda não commitada, e toca os mesmos arquivos que ela; por isso o commit
da correção depende de a 010 ser registrada antes ou junto, decisão do usuário. Até lá o bug fica
`active` / `delivering`, sem `DONE.md`.

## Agent Notes

- Severidade e prioridade decididas pelo usuário em 2026-09-19 (medium, P2).
- O defeito é anterior à feature 010: a regra de situação vem da 006. A 010 apenas o tornou visível,
  porque o seu RF-09 dependia da leitura das ações da 001 do `financas-ali`.
- Não confundir com o teto de pastas (`FEATURE_FOLDER_CAP`), que já é declarado por `truncado`.
- Cuidado com o contrato: uma situação nova em `FeatureSituation` é mudança de vocabulário que a
  tela, os rótulos (`labels.ts`), a faixa de bloqueio e o panorama (`projectionOf`, tabela
  `ADVANCE`) precisam conhecer; a alternativa de manter a situação e só declarar a anomalia é mais
  barata, mas deixa na tela o "sem ações" falso. A escolha é do fix, com o usuário.
- A anomalia `artefato-da-entrega-nao-lido` da 010 é candidata natural para a perda, com um detalhe
  próprio; reaproveitá-la evita código novo no vocabulário de anomalias.
