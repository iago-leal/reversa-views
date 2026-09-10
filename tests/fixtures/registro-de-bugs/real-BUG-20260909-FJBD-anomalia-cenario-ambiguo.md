---
schema_version: 1
id: BUG-20260909-FJBD
display_number: 1
title: Cabeçalho declara leitura degradada por anomalia cenario-ambiguo na nota de impacto greenfield
status: resolved
phase: delivering
severity: low
priority: P2
created: 2026-09-09
updated: 2026-09-10

origin:
  type: manual-report
  external_ref: null

area: leitura
module: leitura-do-processo
feature: anomalias
labels: [codigo-herdado]

visibility: normal
security_suspected: false

reproduction:
  classification: deterministic
  rate: "2/2"
  suspected_triggers: []

blocking: []

relationships: []

traceability:
  specs:
    - _reversa_sdd/sdd/painel-do-processo.md#6-requisitos-funcionais
    - _reversa_sdd/sdd/leitura-do-processo.md#11-edge-cases-e-tratamento-de-erros
    - _reversa_sdd/addenda/006-cartoes-e-cronologia.md#impacto-por-artefato-da-extracao
    - _reversa_sdd/addenda/007-atualizacao-e-progresso.md#resumo-da-entrega
  affected_code:
    - src/heranca/reversa-domain/src/impact.ts
    - src/webview/domain/integrity.ts
    - src/webview/ui/Header.tsx
    - _reversa_forward/006-cartoes-e-cronologia/legacy-impact.md
    - _reversa_forward/007-atualizacao-e-progresso/legacy-impact.md
  root_cause:
    state: confirmed
    hypothesis: "O leitor herdado impact.ts (linha 111) registra cenario-ambiguo sempre que a nota greenfield usa tipo diferente de componente-novo, seguindo reversa-coding/SKILL.md:101; as notas das features 006 e 007 usam outros tipos de propósito, e a anomalia vira degradação permanente no cabeçalho."
    causal_path:
      - "feature 006 passa a distinguir criado de modificado na nota de impacto, mantendo a frase greenfield"
      - "readScenario lê greenfield pela frase; files.some(tipo !== componente-novo) é verdadeiro"
      - "log.add cenario-ambiguo; integrity.ts conta qualquer anomalia como degradação; Header.tsx anuncia"
    evidence:
      - { ref: evidence/reproducao-antes.txt, observation: "função pura sobre a nota real da 007: cenário greenfield, 4 tipos, uma anomalia cenario-ambiguo" }
      - { ref: evidence/regra-e-artefatos.md, observation: "a regra do leitor, o teste herdado que a fixa, a linha do framework e a contagem de tipos nas notas 006 e 007" }
      - { ref: evidence/gate1-vermelho-proposto.txt, observation: "o teste proposto falha contra o código atual acusando cenario-ambiguo" }
      - { ref: evidence/gate2-verde-proposto-suite.txt, observation: "com A4/A5 aplicadas em cópia, 1121 verdes; a única falha é versao.spec sobre o repositório real, porque a cópia não tem .git" }
    code_refs:
      - { file: src/heranca/reversa-domain/src/impact.ts, symbol: ImpactContract.read, commit: 420305d (origem) }
      - { file: src/webview/domain/integrity.ts, symbol: readingIntegrity, commit: 765f3c8 }
  reproduction_tests:
    - fix/reproducao.mjs
  regression_tests:
    - tests/leitura-impacto-nota-greenfield.spec.ts
    - src/heranca/reversa-domain/tests/impact.spec.ts

spec_verdict: spec-correta

change_set:
  - { id: CHG-001, kind: test, artifact: tests/leitura-impacto-nota-greenfield.spec.ts, purpose: "Reprodução e regressão sobre a forma de nota das features 006 e 007", diff: fix/CHG-001.proposto.diff }
  - { id: CHG-002, kind: code, artifact: src/heranca/reversa-domain/src/impact.ts, purpose: "Adaptação A4: retira o bloco de cenario-ambiguo; carimbo declara A4", diff: fix/CHG-002.proposto.diff }
  - { id: CHG-003, kind: test, artifact: src/heranca/reversa-domain/tests/impact.spec.ts, purpose: "Adaptação A5: o caso herdado fixa a aceitação", diff: fix/CHG-003.proposto.diff }
  - { id: CHG-004, kind: configuration, artifact: src/heranca/adaptacoes.yml, purpose: "Declara A4 e A5", diff: fix/CHG-004.proposto.diff }
  - { id: CHG-005, kind: documentation, artifact: src/heranca/PROCEDENCIA.md, purpose: "Prosa de A4 e A5", diff: fix/CHG-005.proposto.diff }
  - { id: CHG-006, kind: configuration, artifact: src/heranca/manifesto.yml, purpose: "Resumos e adaptações das duas entradas", diff: fix/CHG-006.proposto.diff }

change_risk:
  classification: baixa
  reasons:
    - "blast radius restrito ao leitor de impacto; sem contrato externo, sem dado"
    - "duas adaptações semânticas em código herdado, a reaplicar por ressincronização até a origem absorver"
    - "manifesto da herança editado à mão, o que o ritual desaconselha; validado pelo verificador local"

closure:
  policy: local-software
  satisfied: true
resolution_kind: fixed
---
