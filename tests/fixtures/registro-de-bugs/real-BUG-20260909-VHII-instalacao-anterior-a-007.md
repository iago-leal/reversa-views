---
schema_version: 1
id: BUG-20260909-VHII
display_number: 2
title: Extensão instalada anterior à feature 007 não declara procedência nem anuncia atualização
status: resolved
phase: delivering
severity: medium
priority: P1
created: 2026-09-09
updated: 2026-09-10

origin:
  type: manual-report
  external_ref: null

area: empacotamento
module: empacotamento-e-verificacao
feature: atualizador
labels: []

visibility: normal
security_suspected: false

reproduction:
  classification: deterministic
  rate: "1/1"
  suspected_triggers: []

blocking: []

relationships:
  - bug: BUG-20260909-FJBD
    type: related-to
    state: proposed
    evidence: []

traceability:
  specs:
    - _reversa_sdd/addenda/007-atualizacao-e-progresso.md#impacto-por-artefato-da-extracao
    - _reversa_sdd/sdd/painel-do-processo.md#6-requisitos-funcionais
    - _reversa_sdd/sdd/empacotamento-e-verificacao.md#6-requisitos-funcionais
    - _reversa_sdd/prd.md#8-riscos
  affected_code:
    - src/webview/ui/Header.tsx
    - scripts/empacotar.js
    - scripts/atualizar.js
    - README.md
  root_cause:
    state: confirmed
    hypothesis: "A extensão instalada (0.0.1, 19:31) foi empacotada antes do código da feature 007 (commit 21:43) e não carrega a consulta nem o carimbo; o último passo do ritual, instalar o pacote, é manual e não foi executado após a feature, e nenhuma construção anterior à feature tem como anunciar que ficou atrás."
    causal_path:
      - "19:31 pacote 0.0.1 gerado e instalado, sem out/host/update.js, net.js e build.js"
      - "21:29 pacote 0.6.1 gerado de a23711d com os três módulos, nunca instalado"
      - "21:43 commit da feature 007; nenhum pacote gerado dele"
      - "o painel instalado só desenha o que o host da mesma construção envia: sem os módulos, sem procedência e sem desfecho"
    evidence:
      - { ref: evidence/extensao-instalada.txt, observation: "instalação 0.0.1 de 19:31 sem os três módulos; pacotes 0.0.1 e 0.6.1 na raiz" }
      - { ref: evidence/git-cronologia.txt, observation: "feature 007 em 8457e7f às 21:43; HEAD igual a origin/master" }
      - { ref: evidence/reproducao-antes.txt, observation: "fix/reproducao.sh sai com 1: três módulos ausentes" }
      - { ref: evidence/reproducao-depois.txt, observation: "após instalar a 0.7.0, sai com 0: três módulos presentes" }
    code_refs:
      - { file: src/webview/ui/Header.tsx, symbol: Header, commit: 8457e7f }
      - { file: scripts/empacotar.js, symbol: principal, commit: 8457e7f }
  reproduction_tests:
    - fix/reproducao.sh
  regression_tests:
    - tests/vsix-conteudo.spec.ts

spec_verdict: spec-gap

change_set:
  - id: CHG-001
    kind: test
    artifact: tests/vsix-conteudo.spec.ts
    purpose: "Exigir out/host/update.js, net.js e build.js no pacote gerado"
    diff: fix/CHG-001.diff
  - id: CHG-002
    kind: documentation
    artifact: README.md
    purpose: "Ressalva do bootstrap no ritual da atualização: instalação anterior à 0.7.0 não anuncia e se atualiza à mão uma vez"
    diff: fix/CHG-002.diff
  - id: CHG-003
    kind: infrastructure
    artifact: reversa-views-0.7.0.vsix
    purpose: "Construir, testar, empacotar e instalar a 0.7.0 no editor"
    diff: evidence/chg-003-ritual.log
  - id: CHG-004
    kind: specification
    artifact: _reversa_sdd/addenda/bug-BUG-20260909-VHII-v001.md
    purpose: "Adendo aditivo: o anúncio de atualização é garantia da construção instalada; instalação anterior à 0.7.0 se atualiza à mão uma vez"
    diff: fix/CHG-004.diff

change_risk:
  classification: baixa
  reasons:
    - "nenhum código de produção muda"
    - "instalação local e reversível: os pacotes anteriores ficam na raiz"
    - "sem contrato externo, sem dado, sem concorrência"

closure:
  policy: local-software
  satisfied: true
resolution_kind: fixed
---
