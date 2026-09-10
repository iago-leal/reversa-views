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

# Painel conta uma dúvida na feature 007 por menção ao marcador no histórico de alterações

## Summary

Com a extensão 0.7.0 instalada, o cartão do ciclo forward mostra "Dúvidas: 1" e a faixa de
bloqueio diz "A feature ativa tem 1 dúvida sem resposta no requirements", com o comando
`/reversa-clarify`. O `requirements.md` da 007 declara, na seção 10, "Nenhuma lacuna aberta. As
três dúvidas da versão inicial foram resolvidas". A única ocorrência do marcador `[DÚVIDA]` no
arquivo está na linha 407, dentro do histórico de alterações, na frase "três `[DÚVIDA]`
resolvidos": é menção ao marcador, não dúvida aberta, e o contador a lê como dúvida.

## Expected Behavior

RF-06 da spec do painel (`painel-do-processo.md#6-requisitos-funcionais`) manda exibir "o número
de dúvidas" da feature ativa, e RF-03 manda a faixa de bloqueio nomear decisões pendentes. A
regra herdada R10 (`actions.ts`, `countDoubts`) define dúvida como ocorrência de `[DÚVIDA]` no
requirements, porque é o marcador que o `/reversa-requirements` grava e o `/reversa-clarify`
resolve. O requirements da 007, na seção 10, afirma que não há lacuna aberta. O esperado é
"Dúvidas: 0" e nenhuma faixa. O comportamento em disputa: se um marcador citado em texto (entre
crases, no histórico) conta como dúvida. Nenhuma spec diz; o contador é literal.

## Actual Behavior

- Cartão "Ciclo forward": Estágio "Entregue, com adendo", 47 fechadas, 0 abertas, 0 emendas,
  **Dúvidas 1**, pausada `ponte-e-host`, adendo `007-atualizacao-e-progresso.md`.
- Faixa de bloqueio: "A feature ativa tem 1 dúvida sem resposta no requirements", link para o
  requirements e o comando `/reversa-clarify`.
- `countDoubts` sobre o arquivo devolve 1; a única linha com o marcador é a 407.

## Steps to Reproduce

1. Abrir o painel neste workspace com a 0.7.0 e ler o cartão do ciclo forward e a faixa.
2. `grep -n "\[DÚVIDA\]" _reversa_forward/007-atualizacao-e-progresso/requirements.md`: uma linha, a
   407, no histórico de alterações.
3. `node fix/reproducao.mjs <raiz>` sai com 1.

## Evidence

- `evidence/faixa-de-bloqueio-clarify.png` e `evidence/cartao-ciclo-forward-duvidas-1.png`: as
  capturas do usuário (painel 0.7.0).
- `evidence/regra-e-linha.md`: a função, a linha 392 (sem lacuna) e a linha 407 (o marcador citado).
- `evidence/reproducao-antes.txt`, `reproduction.md`: a reprodução isolada.

## Suspected Area

- Onde aparece: `src/webview/domain/blocking.ts` (`openDoubts`) e o cartão do ciclo forward.
- Onde nasce: `src/heranca/reversa-domain/src/actions.ts`, `countDoubts` (herdado, sem
  adaptação), que conta toda ocorrência literal do marcador, inclusive entre crases; e a linha 407
  do requirements da 007, escrita pelo `/reversa-clarify` ao registrar a sessão.

## Acceptance Criteria

1. Com o requirements da 007 como está semanticamente (nenhuma lacuna), o painel mostra
   "Dúvidas: 0" e nenhuma faixa de clarify.
2. Um marcador real `[DÚVIDA]` fora de crases continua contado.
3. Teste de regressão cobrindo o marcador citado em texto.

## Traceability

| Eixo | Valor |
|---|---|
| Spec (painel) | `_reversa_sdd/sdd/painel-do-processo.md#6-requisitos-funcionais` (RF-03, RF-06) |
| Spec (leitura) | `_reversa_sdd/sdd/leitura-do-processo.md#11-edge-cases-e-tratamento-de-erros` |
| Artefato | `_reversa_forward/007-atualizacao-e-progresso/requirements.md#10-lacunas` e `#11-historico-de-alteracoes` |
| Código afetado | `actions.ts` (`countDoubts`, herdado), `blocking.ts`, `ForwardSection.tsx` |
| Testes existentes | `src/heranca/reversa-domain/tests/actions.spec.ts` (`countDoubts (R10)`), `tests/webview-blocking.spec.ts` |

## Resolution

**Causa raiz (confirmed).** `countDoubts` conta o marcador literal; a linha 407 do histórico da
007 o citava entre crases. Sem hipótese concorrente; sem regressão de código: o contador é o da
cópia (`420305d`), e a citação nasceu na sessão de `/reversa-clarify` de 2026-09-09.

**Estratégia.** Correção direta no artefato (risco baixo; debate dispensado). Plano em
`fix/plan.html`. O endurecimento do contador herdado (ignorar marcador entre crases) fica como
opção declarada, não aplicada, pelo mesmo critério do nº 1: adaptação de herança é decisão sua, e
o lugar certo dela é a origem.

**Change set aplicado** (gates 1 e 2 executados em sessão sem interlocutor, sob o objetivo
"corrigir os bugs" e com `allowLegacyEdits: true` sem `allowedPaths`, liberação irrestrita):

| CHG | Tipo | Artefato | Propósito | Diff |
|---|---|---|---|---|
| CHG-001 | test | `tests/forward-marcador-de-duvida-citado.spec.ts` | regressão sobre os requirements reais | `fix/CHG-001.diff` |
| CHG-002 | documentation | `_reversa_forward/007-.../requirements.md`, linha 407 | "três marcadores de dúvida resolvidos" | `fix/CHG-002.diff` |

**Prova vermelho → verde.** `gate1-vermelho.txt`: 1 failed, nomeando a linha 407, e as outras seis
features verdes. `gate2-verde.txt`: 28 passed, incluindo a suíte herdada de `countDoubts` e a da
faixa de bloqueio. `reproducao-antes.txt` exit 1 → `reproducao-depois.txt` exit 0. Na próxima
leitura o painel deve mostrar "Dúvidas: 0" e nenhuma faixa de clarify.

**Veredito de spec: PENDENTE (decisão humana).** Recomendação: `spec-correta`, porque RF-06 e a
regra R10 estavam certas e o artefato carregava um marcador que não era dúvida. Alternativa:
`spec-gap`, se você quiser que a spec de leitura passe a dizer que marcador entre crases não
conta, o que pediria o endurecimento do contador.

**Fechamento.** Regressão aplicada e verde; falta o veredito. `status` fica `active`/
`awaiting-human`; `DONE.md` depois.

**Decisão registrada em 2026-09-10.** Veredito `spec-correta`, aprovado por iago (CONTINUAR sobre
a recomendação): RF-06 e a regra R10 definiam o certo; o artefato carregava um marcador que não era
dúvida. Nada muda na spec. Closure policy `local-software` satisfeita: regressão verde e veredito.
`resolution_kind: fixed`; `DONE.md` gravado.

## Agent Notes

- Este é o problema que o usuário chamou de "dúvida" no relato original; o registrador o leu
  primeiro como a anomalia do cabeçalho (`BUG-20260909-FJBD`), que existe, mas é outra coisa. A
  relação `related-to` registra só a origem comum no relato.
- `actions.ts` é herdado: endurecer `countDoubts` (ignorar marcador entre crases) exige
  adaptação declarada, como no bug nº 1. A correção do artefato (reescrever a linha 407 sem o
  marcador literal) não toca herança.
- Severidade e prioridade assumidas em sessão sem interlocutor: low, P2.
