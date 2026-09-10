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

# Extensão instalada anterior à feature 007 não declara procedência nem anuncia atualização

## Summary

O painel instalado no editor não mostra os itens "Extensão" e "Construída de" nem a linha do
desfecho da consulta à origem, que a feature 007 entregou. A extensão instalada é a `0.0.1`,
instalada às 19:31 de 2026-09-09, antes do commit da feature (21:43): o pacote não contém
`out/host/update.js`, `net.js` nem `build.js`. Um pacote `0.6.1` com o código da feature foi
gerado às 21:29, mas nunca foi instalado, e nada no produto avisa que a instalação ficou para
trás, porque quem avisaria é justamente a construção que não está instalada.

## Expected Behavior

Pela spec efetiva (adendo 007 sobre `painel-do-processo.md#6-requisitos-funcionais` e
`prd.md#8-riscos`; requisitos RF-10 e RF-17 da feature), o cabeçalho declara a versão da
extensão e o commit curto de que foi construída, e uma linha diz se a construção está em dia,
atrás de N commits, divergente, feita de commit desconhecido, ou se não deu para conferir e por
quê. A spec de empacotamento (`empacotamento-e-verificacao.md#6-requisitos-funcionais`, fluxo
principal, passos 5 e 6) fecha o ritual com "instala o VSIX no editor e abre o painel".

O que nenhuma spec cobre é o bootstrap: uma instalação anterior à 0.7 não tem como anunciar que
ficou atrás, e a primeira atualização depois da feature é, por construção, manual. Esse é o
comportamento não especificado que o veredito de spec precisa decidir (candidato a `spec-gap`
com adendo aditivo).

## Actual Behavior

- Cabeçalho capturado às 19:36: "Reversa: 1.3.3", "Modelo herdado: 420305d", "Raiz observada",
  "Lido em". Sem "Extensão", sem "Construída de", sem linha de desfecho.
- `~/.vscode/extensions/iagoleal-local.reversa-views-0.0.1`: instalada 19:31, versão `0.0.1`,
  sem `update.js`, `net.js`, `build.js` e sem ocorrência de `setUpdate`.
- Raiz do clone: `reversa-views-0.0.1.vsix` (19:31) e `reversa-views-0.6.1.vsix` (21:29,
  construído de `a23711d`, com os três módulos). Nenhum pacote do commit `543f0bd` da feature.
- O clone está em dia com a origem, e a origem responde à consulta anônima com HTTP 200 e
  `identical`: instalada a construção atual, o painel diria "em dia".

## Steps to Reproduce

1. `code --list-extensions --show-versions | grep reversa` mostra `iagoleal-local.reversa-views@0.0.1`.
2. Abrir o painel neste workspace e ler o cabeçalho: faltam os dois itens de procedência e a
   linha do desfecho.
3. `sh fix/reproducao.sh` sai com 1 e nomeia os três módulos ausentes.

## Evidence

- `evidence/captura-transcrita.md`: o cabeçalho capturado, sem os itens da feature 007.
- `evidence/extensao-instalada.txt`: inventário da instalação e dos dois pacotes da raiz.
- `evidence/git-cronologia.txt`: os commits com hora, HEAD e a origem.
- `evidence/origem-compare.json`: a resposta anônima da origem para a construção atual.
- `evidence/reproduction.md`, `reproducao-antes.txt`, `reproducao-depois.txt`: a cápsula e o
  script de reprodução, vermelho antes e verde depois.
- `evidence/gate1-vermelho-contra-0.0.1.txt`, `gate1-verde-contra-0.7.0.txt`: o teste de
  regressão contra o pacote antigo e contra o novo.
- `evidence/chg-003-ritual.log`: construção, suíte (1123 verdes), empacotamento e instalação.
- `evidence/painel-0.7.0-cartao-forward.png`: captura do usuário em 2026-09-10 com a 0.7.0 carregada
  (47 ações, barra de progresso, adendo da 007): a instalação chegou à tela.

## Suspected Area

- Onde aparece: `src/webview/ui/Header.tsx`, que só desenha o que o host da mesma construção envia.
- Onde nasce: o passo final do ritual (`code --install-extension`), manual por decisão da spec
  de empacotamento, sem nada que o dispare ou lembre quando a instalação é anterior à feature.
  `scripts/atualizar.js` não ajuda aqui: o clone está em dia, e o comando só constrói e empacota
  quando há commit a trazer.

## Acceptance Criteria

1. Com a construção do commit atual instalada, o cabeçalho mostra "Extensão: 0.7.0", "Construída
   de: 543f0bd" (integral em `data-full`) e a linha "Esta construção está em dia com a origem."
2. O ritual do README diz o que fazer quando a instalação é anterior à 0.7, ou a spec efetiva
   registra que o bootstrap é manual.
3. Um teste protege o que não pode voltar a acontecer: pacote gerado sem os módulos da consulta
   e do carimbo.

## Traceability

| Eixo | Valor |
|---|---|
| Spec efetiva | `_reversa_sdd/addenda/007-atualizacao-e-progresso.md#impacto-por-artefato-da-extracao` (linhas de `painel-do-processo.md#6` e `prd.md#8-riscos`) |
| Spec (painel) | `_reversa_sdd/sdd/painel-do-processo.md#6-requisitos-funcionais` |
| Spec (ritual) | `_reversa_sdd/sdd/empacotamento-e-verificacao.md#6-requisitos-funcionais` (fluxo principal, passos 5 e 6) |
| Requisitos da feature | `_reversa_forward/007-atualizacao-e-progresso/requirements.md` RF-07, RF-10, RF-17, RF-20, RF-22 |
| Código afetado | `Header.tsx` (onde aparece), `scripts/empacotar.js`, `scripts/atualizar.js`, `README.md` |
| Testes | reprodução `fix/reproducao.sh`; regressão `tests/vsix-conteudo.spec.ts` ("leva o que a extensão precisa para rodar") |

## Resolution

**Causa raiz (confirmed).** A instalação `0.0.1` foi empacotada às 19:31, antes do código da
feature 007 (commit 8457e7f, 21:43), e não carrega `out/host/update.js`, `net.js` e `build.js`. O
pacote `0.6.1` das 21:29 já tinha os três, mas o passo de instalar é manual e não foi dado. O
caminho causal fecha com a reprodução: `fix/reproducao.sh` sai com 1 sobre a `0.0.1` e com 0
sobre a `0.7.0`. Sem hipótese concorrente; sem `git bisect`, porque não há commit culpado: o
código estava certo, e o que faltou foi o ato final do ritual.

**Estratégia.** Correção direta (risco baixo; debate dispensado; `/reversa-debugger-debate`
disponível se você quiser contraditório). Plano em `fix/plan.html`.

**Change set aplicado (gates 1 e 2 executados em sessão sem interlocutor, sob o objetivo
"corrigir os bugs" e com `allowLegacyEdits: true` sem `allowedPaths`, isto é, liberação
irrestrita).**

| CHG | Tipo | Artefato | Propósito | Diff |
|---|---|---|---|---|
| CHG-001 | test | `tests/vsix-conteudo.spec.ts` | exige os três módulos da feature 007 no pacote | `fix/CHG-001.diff` |
| CHG-002 | documentation | `README.md` | ressalva do bootstrap no ritual da atualização | `fix/CHG-002.diff` |
| CHG-003 | infrastructure | `reversa-views-0.7.0.vsix` + instalação | build, 1123 testes verdes, empacotamento, `code --install-extension` | `evidence/chg-003-ritual.log` |

**Prova vermelho → verde.**

- Reprodução: `reproducao-antes.txt` (exit 1, três módulos ausentes) → `reproducao-depois.txt`
  (exit 0, `0.7.0` instalada com os três).
- Regressão: `gate1-vermelho-contra-0.0.1.txt` (1 failed: "extension/out/host/update.js ficou de
  fora do pacote") → `gate1-verde-contra-0.7.0.txt` (4 passed).

**O que a instalação muda para você.** O editor precisa recarregar a janela para carregar a
`0.7.0` (comando "Developer: Reload Window"). Depois, o cabeçalho deve mostrar "Extensão: 0.7.0",
"Construída de: 543f0bd" e "Esta construção está em dia com a origem."

**Veredito de spec: PENDENTE (decisão humana).** Recomendação: `spec-gap`, porque nenhuma spec
dizia o que acontece com uma instalação anterior à feature; o adendo aditivo está rascunhado em
`fix/adendo-proposto.md` e só entra em `_reversa_sdd/addenda/` com a sua aprovação. Alternativa:
`spec-correta`, se você entender que o passo 6 do fluxo principal ("instala o VSIX") já cobria
o caso; então nada muda na spec e CHG-002 basta como documentação.

**Fechamento.** Closure policy `local-software` exige regressão verde (feita) + veredito
(pendente). `status` fica `active`/`awaiting-human` até o veredito; `DONE.md` só depois.

**Decisão registrada em 2026-09-10.** Veredito `spec-gap`, aprovado por iago (CONTINUAR sobre a
recomendação). Adendo aditivo gravado em `_reversa_sdd/addenda/bug-BUG-20260909-VHII-v001.md`
(CHG-004, diff em `fix/CHG-004.diff`), ao lado dos diffs de código e documentação. Closure policy
`local-software` satisfeita: regressão verde e veredito. `resolution_kind: fixed`; `DONE.md` gravado.

## Agent Notes

- Não usar `npm run atualizar -- --aplicar` como correção: com o clone em dia ele termina em
  "em dia" sem construir nem empacotar.
- A relação com `BUG-20260909-FJBD` é só de origem (mesmo relato, mesma tela); nenhuma hipótese
  causal entre os dois.
- Severidade e prioridade assumidas pelo registrador em sessão sem interlocutor: medium, P1.
- Os pacotes `0.0.1` e `0.6.1` ficaram na raiz de propósito: `code --install-extension
  reversa-views-0.0.1.vsix` desfaz a instalação, se preciso.
