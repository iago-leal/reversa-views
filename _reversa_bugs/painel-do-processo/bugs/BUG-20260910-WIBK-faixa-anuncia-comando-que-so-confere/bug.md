---
schema_version: 1
id: BUG-20260910-WIBK
display_number: 5
title: Faixa de atualização do painel anuncia o comando que apenas confere
status: open
phase: triaging
severity: high
priority: P1
created: 2026-09-10
updated: 2026-09-10

origin:
  type: manual-report
  external_ref: null

area: webview
module: painel-do-processo
feature: cabecalho
labels: []

visibility: normal
security_suspected: false

reproduction:
  classification: deterministic
  rate: "1/1"
  suspected_triggers: []

blocking: []

relationships:
  - bug: BUG-20260910-SVZU
    type: related-to
    state: proposed
    evidence: []

traceability:
  specs:
    - _reversa_forward/007-atualizacao-e-progresso/requirements.md#7-criterios-de-aceitacao
    - _reversa_sdd/sdd/painel-do-processo.md#6-requisitos-funcionais
    - _reversa_sdd/addenda/007-atualizacao-e-progresso.md#impacto-por-artefato-da-extracao
  affected_code:
    - src/webview/domain/labels.ts
    - README.md
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

# Faixa de atualização do painel anuncia o comando que apenas confere

## Summary

Nos desfechos `atrasada` e `divergente`, o cabeçalho oferece `npm run atualizar` como o comando a
copiar. Esse comando, por desenho e por spec, apenas confere: nunca traz commit algum. Quem lê o
aviso, copia a linha e a roda recebe um diagnóstico e nenhuma atualização, e o aviso reaparece na
recarga seguinte. O comando que aplica é `npm run atualizar -- --aplicar`, e ele não aparece na tela.

## Expected Behavior

O critério de aceitação da feature 007, em
`_reversa_forward/007-atualizacao-e-progresso/requirements.md#7-criterios-de-aceitacao`, é explícito:

```gherkin
Cenário: o painel anuncia que há novidade
  Dado um painel construído do commit a23711d e uma origem com três commits à frente
  Quando o processo é lido
  Então o cabeçalho declara que há três commits novos desde a23711d
  E nomeia o comando que aplica a atualização
```

O adendo 007 repete a exigência ao descrever o impacto no painel: "O comando a copiar aparece só em
atrasada e em divergente". Comando a copiar, num aviso de que há novidade, é o que traz a novidade.
Aqui não há lacuna de spec: o comportamento esperado está escrito e é o oposto do observado.

RF-04 da mesma spec fixa a distinção entre os dois atos com as palavras que decidem este bug:
"`npm run atualizar` nunca traz commits; `npm run atualizar -- --aplicar` traz".

## Actual Behavior

`src/webview/domain/labels.ts:174` define `const UPDATE_COMMAND = 'npm run atualizar'`, sem o
argumento de aplicação, e as linhas 223 e 232 o entregam nos dois desfechos que pedem ação. A captura
do cabeçalho no relato mostra a faixa exibindo exatamente essa linha ao lado de "A origem está 2
commits à frente desta construção".

## Steps to Reproduce

1. Ter a extensão instalada carimbada num commit atrás da origem
2. Abrir o painel e ler o cabeçalho no desfecho `atrasada`
3. Copiar o comando anunciado e rodá-lo no terminal
4. Observar que ele apenas confere, sem incorporar, construir, empacotar ou instalar

## Evidence

- `evidence/construcao-instalada.txt`: a saída de `npm run atualizar`, que confere e nada mais
- `../../intake/relato-20260910-1240.md`: a captura do cabeçalho, com a faixa e o comando anunciado

## Suspected Area

`UPDATE_COMMAND` em `src/webview/domain/labels.ts`, e a decisão de qual comando cabe em cada desfecho.
O texto do README já documenta os dois atos corretamente, então o defeito parece confinado ao rótulo.

## Acceptance Criteria

```gherkin
Cenário: a faixa nomeia o comando que aplica
  Dado um painel no desfecho atrasada
  Quando o cabeçalho é desenhado
  Então o comando a copiar é o que aplica a atualização, e não o que apenas confere

Cenário: o mesmo vale para divergente
  Dado um painel no desfecho divergente
  Quando o cabeçalho é desenhado
  Então o comando a copiar é o mesmo do desfecho atrasada
```

## Traceability

| Eixo | Locator |
|---|---|
| Spec | `_reversa_forward/007-atualizacao-e-progresso/requirements.md#7-criterios-de-aceitacao` |
| Spec | `_reversa_sdd/sdd/painel-do-processo.md#6-requisitos-funcionais` |
| Spec | `_reversa_sdd/addenda/007-atualizacao-e-progresso.md#impacto-por-artefato-da-extracao` |
| Código | `src/webview/domain/labels.ts` |
| Código | `README.md` |

Relação `related-to` com `BUG-20260910-SVZU`, em estado `proposed`: os dois nasceram do mesmo relato
e do mesmo laço, mas são defeitos distintos. Este é de rótulo e tem spec clara; aquele é de ritual e
tem lacuna de spec.

## Agent Notes

Restrições para quem for corrigir:

- A ordem de correção importa. Se `BUG-20260910-SVZU` mudar o desenho do ritual, o comando correto a
  anunciar pode deixar de ser `npm run atualizar -- --aplicar`. Corrigir este bug antes daquele
  arrisca ter de refazer o rótulo.
- Em `divergente` o comando que aplica é recusado por desenho, porque a aplicação não incorpora sobre
  commit local (RF-05). Verificar, ao corrigir, se o mesmo comando serve aos dois desfechos ou se o
  divergente pede frase própria. A spec manda o mesmo comando nos dois; o comportamento do script,
  não.
- Severidade `high` e prioridade `P1` foram decididas pelo usuário na triagem de 2026-09-10.
