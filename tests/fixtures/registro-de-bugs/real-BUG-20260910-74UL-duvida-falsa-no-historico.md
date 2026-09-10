---
schema_version: 1
id: BUG-20260910-74UL
display_number: 3
title: Painel conta uma dúvida na feature 007 por menção ao marcador no histórico de alterações
status: resolved
phase: delivering
severity: low
priority: P2
created: 2026-09-10
updated: 2026-09-10

origin:
  type: manual-report
  external_ref: null

area: leitura
module: leitura-do-processo
feature: duvidas
labels: [codigo-herdado]

visibility: normal
security_suspected: false

reproduction:
  classification: deterministic
  rate: "2/2"
  suspected_triggers: []

blocking: []

relationships:
  - bug: BUG-20260909-FJBD
    type: related-to
    state: proposed
    evidence: []

traceability:
  specs:
    - _reversa_sdd/sdd/painel-do-processo.md#6-requisitos-funcionais
    - _reversa_sdd/sdd/leitura-do-processo.md#11-edge-cases-e-tratamento-de-erros
    - _reversa_forward/007-atualizacao-e-progresso/requirements.md#10-lacunas
  affected_code:
    - src/heranca/reversa-domain/src/actions.ts
    - src/webview/domain/blocking.ts
    - src/webview/ui/ForwardSection.tsx
    - _reversa_forward/007-atualizacao-e-progresso/requirements.md
  root_cause:
    state: confirmed
    hypothesis: "countDoubts (herdado, R10) conta toda ocorrência literal de [DÚVIDA]; a única ocorrência no requirements da 007 é a citação do marcador entre crases na linha 407 do histórico de alterações, escrita pelo /reversa-clarify."
    causal_path:
      - "sessão de /reversa-clarify registra no histórico: três `[DÚVIDA]` resolvidos"
      - "countDoubts encontra uma ocorrência literal e devolve 1"
      - "blocking.ts (openDoubts) monta a faixa e o cartão do forward mostra Dúvidas: 1"
    evidence:
      - { ref: evidence/regra-e-linha.md, observation: "a função, a linha 392 sem lacuna e a linha 407 com o marcador citado; nenhum outro requirements tem o marcador" }
      - { ref: evidence/reproducao-antes.txt, observation: "countDoubts devolve 1 apontando a linha 407" }
      - { ref: evidence/reproducao-depois.txt, observation: "com a linha reescrita, countDoubts devolve 0" }
      - { ref: evidence/gate1-vermelho.txt, observation: "a suíte nova acusa a linha 407 da 007 e passa nas outras seis features" }
    code_refs:
      - { file: src/heranca/reversa-domain/src/actions.ts, symbol: countDoubts, commit: 420305d (origem) }
      - { file: src/webview/domain/blocking.ts, symbol: openDoubts, commit: 765f3c8 }
  reproduction_tests:
    - fix/reproducao.mjs
  regression_tests:
    - tests/forward-marcador-de-duvida-citado.spec.ts

spec_verdict: spec-correta

change_set:
  - id: CHG-001
    kind: test
    artifact: tests/forward-marcador-de-duvida-citado.spec.ts
    purpose: "Acusar marcador de dúvida citado entre crases em qualquer requirements do ciclo forward; marcador real continua contado"
    diff: fix/CHG-001.diff
  - id: CHG-002
    kind: documentation
    artifact: _reversa_forward/007-atualizacao-e-progresso/requirements.md
    purpose: "Linha 407 do histórico sem o marcador literal"
    diff: fix/CHG-002.diff

change_risk:
  classification: baixa
  reasons:
    - "uma frase de histórico num artefato do ciclo forward; nenhum código muda"
    - "reversível por git checkout do arquivo"

closure:
  policy: local-software
  satisfied: true
resolution_kind: fixed
---
