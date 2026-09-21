---
schema_version: 1
id: BUG-20260921-J2ZK
display_number: 13
title: Bug encerrado com bloqueio declarado ainda sobe à faixa de espera
status: resolved
phase: closed
severity: low
priority: P3
created: 2026-09-21
updated: 2026-09-21
express: true

origin:
  type: manual-report
  external_ref: null

area: webview
module: painel-do-processo
feature: unclassified
labels:
  - mudanca-de-regra
  - registro-de-bugs

visibility: normal
security_suspected: false

reproduction:
  classification: deterministic
  rate: "1/1"
  suspected_triggers:
    - "bug com `DONE.md` na pasta e `blocking` povoado no front matter"

blocking: []

relationships:
  - bug: BUG-20260921-WNU6
    type: related-to
    state: supported
    evidence:
      - "os dois vêm do mesmo relato, sobre o mesmo aviso na faixa; intake/relato-20260921-1620.md"

traceability:
  specs:
    - _reversa_forward/008-cronologia-do-ciclo-bugs/requirements.md#5-requisitos-funcionais
    - _reversa_sdd/addenda/008-cronologia-do-ciclo-bugs.md#impacto-por-artefato-da-extração
  affected_code:
    - src/webview/domain/blocking.ts
  root_cause:
    location:
      - src/webview/domain/blocking.ts#bugConditions
    summary: >-
      Não há defeito de código: `bugConditions` cumpria o RF-10 da 008, que só condiciona ao
      encerramento a terceira das três condições. A causa é a regra, que o mantenedor decidiu mudar.
    state: confirmed
    evidence:
      - evidence/reproduction.md
  reproduction_tests:
    - "tests/webview-blocking.spec.ts#bloqueio declarado em bug encerrado não produz linha (BUG-20260921-J2ZK)"
  regression_tests:
    - "tests/webview-blocking.spec.ts#espera por decisão humana em bug encerrado continua produzindo linha"
    - "tests/webview-blocking.spec.ts#o bloqueio declarado produz linha"

spec_verdict:
  verdict: spec-desatualizada
  decided_by: iago
  decided_at: 2026-09-21
  addendum: _reversa_sdd/addenda/bug-BUG-20260921-J2ZK-v001.md

change_risk:
  level: baixa
  reasons:
    - uma condição numa função pura, compartilhada pela tela e pelo terminal
    - reversível; nenhuma suíte existente foi reescrita

delivery:
  branch: master
  commit: c876920
  pull_request: null
  ci: null
  merged: 2026-09-21
  published: 2026-09-21, pacote reversa-views-0.14.5.vsix gerado e instalado por code --install-extension

versions:
  fixed_in: "0.14.4"
  built_from: b574ce4
  packaged: "2026-09-21, reversa-views-0.14.4.vsix, construído de b574ce4"
  installed: "0.14.5, construída de ebfb5bc, confirmada em iagoleal-local.reversa-views@0.14.5"

backports: []

change_set:
  - id: CHG-001
    kind: code
    artifact: src/webview/domain/blocking.ts
    diff: fix/CHG-001.diff
  - id: CHG-002
    kind: specification
    artifact: _reversa_sdd/addenda/bug-BUG-20260921-J2ZK-v001.md

closure:
  policy: package
  satisfied: true
  satisfied_at: 2026-09-21
resolution_kind: fixed
---

# Bug encerrado com bloqueio declarado ainda sobe à faixa de espera

## Summary

A faixa "Aguardando decisão humana" sobe um bug por três condições. Só a terceira, a severidade
alta, é condicionada a o bug não estar encerrado. Um bug travado por `DONE.md` que ainda declare
`blocking` continua subindo à faixa, com a razão "está bloqueado por condição declarada".

Isto não é divergência entre código e spec: `src/webview/domain/blocking.ts` faz o que o RF-10 da
feature 008 manda, e o comentário acima de `bugConditions` justifica a assimetria, dizendo que um
registro travado que ainda declara bloqueio se contradiz, e que dizê-lo vale uma linha. É mudança de
regra, decidida pelo usuário em 2026-09-21.

## Expected Behavior

Pela decisão do usuário, registrada na pergunta 11 de
`perguntas/respostas/respostas-fases-e-ciclo-2026-09-21.md`: "mudar: bug encerrado não sobe à faixa
por bloqueio". A faixa existe para nomear o que espera uma pessoa, e bug encerrado não espera
ninguém.

A condição de espera por decisão humana, a primeira das três, não foi objeto da decisão e fica como
está.

## Actual Behavior

Bug com trava e `blocking` povoado produz linha na faixa.

## Steps to Reproduce

1. Um `bug.md` com `blocking` povoado, numa pasta que tenha `DONE.md`.
2. Ler o workspace e compor as razões da faixa.
3. Observar a linha do bug, com a razão de bloqueio.

## Evidence

- `src/webview/domain/blocking.ts`, função `bugConditions`, e o comentário que a precede.
- `_reversa_forward/008-cronologia-do-ciclo-bugs/requirements.md`, RF-10.

## Suspected Area

`bugConditions`, em `src/webview/domain/blocking.ts`.

## Acceptance Criteria

1. Bug travado com `blocking` povoado não produz linha na faixa por bloqueio.
2. Bug aberto com `blocking` povoado continua produzindo.
3. Bug travado em fase de espera por decisão humana continua produzindo, porque a decisão não
   alcançou essa condição.
4. O comentário de `bugConditions` diz a regra nova e a data da decisão.
5. O painel de linha de comando mostra o mesmo que a tela.

## Traceability

| Elo | Alvo |
|---|---|
| Spec | RF-10 do `requirements.md` da 008; adendo `008-cronologia-do-ciclo-bugs.md` |
| Código | `src/webview/domain/blocking.ts` |
| Teste | a suíte da faixa de espera, a localizar no fix |

## Resolution

### Causa raiz, no estado final

`confirmed`, e não é defeito de código: `bugConditions` cumpria o RF-10 da 008 à letra. A causa é a
regra, mudada por decisão de quem mantém o painel.

### Veredito de spec

`spec-desatualizada`, que é o nome da decisão que o usuário já tinha tomado por escrito, contra a
recomendação da sessão. O adendo `_reversa_sdd/addenda/bug-BUG-20260921-J2ZK-v001.md` registra como o
RF-10 passa a ser lido, que encerrado quer dizer travado, e que a primeira condição não mudou.

### Estratégia

Correção direta, em modo expresso: a condição do bloqueio ganha a mesma guarda que a da severidade
já tinha, e o comentário da função passa a dizer a regra nova, a data e o que ficou de fora.

### Correction Change Set

| CHG | Tipo | Artefato | Propósito |
|---|---|---|---|
| CHG-001 | code | `src/webview/domain/blocking.ts` | A guarda `!bug.travado` na segunda condição, e o comentário reescrito |
| CHG-002 | specification | `_reversa_sdd/addenda/bug-BUG-20260921-J2ZK-v001.md` | O veredito `spec-desatualizada` |

Diff em `fix/CHG-001.diff`; o dos testes em `fix/tests.diff`.

### Testes, e a prova vermelho → verde

**Vermelho**, com os testes aplicados e nenhuma linha de correção: 1 falha nos 2 casos novos; o
outro passa, como guarda da primeira condição (`evidence/gate1-vermelho.txt`).

**Verde**, com o change set aplicado: as duas suítes tocadas com 62 de 62; suíte inteira com 2189 de
2189 em 125 arquivos; `typecheck` e `check:webview` sem erro (`evidence/gate2-verde.txt`).

### Os cinco critérios de aceite

| # | Critério | Estado |
|---|---|---|
| 1 | Bug travado com bloqueio não sobe por bloqueio | cumprido |
| 2 | Bug aberto com bloqueio continua subindo | cumprido, pelo caso que já existia |
| 3 | Bug travado em espera por decisão continua subindo | cumprido |
| 4 | O comentário diz a regra nova e a data | cumprido |
| 5 | O terminal mostra o mesmo que a tela | cumprido: os dois compõem a faixa por `blockingReasons` |

### Fechamento

Política `package`, satisfeita em 2026-09-21: commit `c876920`, pacote `reversa-views-0.14.4.vsix` e
instalação confirmada em `iagoleal-local.reversa-views@0.14.5`, construída de `ebfb5bc`, que contém a
correção. Trava gravada em `DONE.md`.

## Agent Notes

Registrado pela rota expressa. Relato em `intake/relato-20260921-1620.md`.

Severidade `low` e prioridade `P3` assumidas na rota expressa, sem menu: o comportamento atual é o
especificado, e muda por decisão, não por dano.

A recomendação da sessão era manter a regra, pelo argumento do próprio comentário do código. O
usuário decidiu o contrário, e vale a decisão. O veredito de spec esperado é `spec-desatualizada`,
com adendo sobre o RF-10 da 008.

Relação `related-to` com o `BUG-20260921-WNU6`, e não `caused-by`: corrigido aquele, o caso do SRSK
some sozinho, mas esta regra continua valendo para o bug travado que declare bloqueio de verdade.

Proposta de termo para a taxonomia: `feature: 008-cronologia-do-ciclo-bugs`.
