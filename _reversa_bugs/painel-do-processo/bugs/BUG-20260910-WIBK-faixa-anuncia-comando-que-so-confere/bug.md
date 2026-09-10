---
schema_version: 1
id: BUG-20260910-WIBK
display_number: 5
title: Faixa de atualização do painel anuncia o comando que apenas confere
status: active
phase: delivering
severity: high
priority: P1
created: 2026-09-10
updated: 2026-09-10

change_risk:
  classification: baixa
  reasons:
    - "Blast radius mínimo: uma constante numa função pura do domínio da tela; host, script e protocolo não mudam"
    - "Sem contrato externo: o texto vai à tela e ninguém o consome por programa"
    - "Sem dados: nada persistido, nada migrado"
    - "Reversível por git: código versionado, sem efeito além do pacote gerado"
    - "Ponto de atenção: em divergente o ritual pode recusar a incorporação (RF-05); a recusa é nomeada pelo próprio script, e o rótulo não precisa antecipá-la"

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
    state: supported
    evidence:
      - { ref: ../BUG-20260910-SVZU-ritual-nao-alcanca-construcao-instalada/fix/plan.html, observation: "o desenho aprovado no nº 4, --aplicar sempre instala, dá ao painel um comando único a anunciar nos dois eixos, e o plano diz que isso destrava o nº 5" }
      - { ref: evidence/reproduction.md, observation: "o comando que o script corrigido imprime como Para aplicar é o que a faixa deveria anunciar; o rótulo ficou com o do primeiro ato" }

traceability:
  specs:
    - _reversa_forward/007-atualizacao-e-progresso/requirements.md#7-criterios-de-aceitacao
    - _reversa_sdd/sdd/painel-do-processo.md#6-requisitos-funcionais
    - _reversa_sdd/addenda/007-atualizacao-e-progresso.md#impacto-por-artefato-da-extracao
  affected_code:
    - src/webview/domain/labels.ts
    - README.md
  root_cause:
    state: confirmed
    hypothesis: "A constante UPDATE_COMMAND em labels.ts nasceu na feature 007 (8457e7f) com o comando do primeiro ato, o que confere, e a suíte fixou esse valor como esperado: o caso `atrasada diz quantos commits, e nomeia o comando que os aplica` pede no nome o comando que aplica e exige na asserção o que confere. Nada cruza o rótulo com o que o script imprime como Para aplicar, e os dois divergiram sem sinal."
    causal_path:
      - "RF-04 separou os dois atos e deu ao segundo o argumento explícito: `npm run atualizar` confere, `npm run atualizar -- --aplicar` aplica"
      - "T019 escreveu a faixa com `UPDATE_COMMAND = 'npm run atualizar'` e entregou a mesma constante em atrasada e em divergente (labels.ts:174, 223, 232)"
      - "A suíte fixou o valor errado: a asserção de webview-header.spec.tsx:110 exige `'npm run atualizar'`, e a de :194 aceita qualquer linha que contenha essa substring"
      - "O script soletra o segundo ato por conta própria em `Para aplicar: npm run atualizar -- --aplicar` (atualizar.js:290), sem verificação cruzada com o rótulo"
      - "Quem copia a linha da faixa roda a conferência, recebe um diagnóstico e o aviso reaparece na recarga seguinte"
    evidence:
      - { ref: evidence/reproduction.md, observation: "a função pura devolve npm run atualizar nos dois desfechos e o script de reprodução sai com 1; constante e asserção nascem no mesmo commit, sem regressão" }
      - { ref: evidence/construcao-instalada.txt, observation: "a saída de npm run atualizar, que confere e nada mais" }
      - { ref: ../../intake/relato-20260910-1240.md, observation: "a captura da faixa real com o comando que confere ao lado do aviso de atraso" }
    code_refs:
      - { file: src/webview/domain/labels.ts, symbol: UPDATE_COMMAND, commit: 849fc5b7e4e1a939a5720debdaa4fecf9e986012 }
      - { file: tests/webview-header.spec.tsx, symbol: "atrasada diz quantos commits, e nomeia o comando que os aplica", commit: 849fc5b7e4e1a939a5720debdaa4fecf9e986012 }
      - { file: scripts/atualizar.js, symbol: relatar, commit: 849fc5b7e4e1a939a5720debdaa4fecf9e986012 }
  reproduction_tests:
    - "fix/reproducao.mjs"
    - "tests/webview-header.spec.tsx :: o comando que a faixa anuncia (BUG-20260910-WIBK) > atrasada anuncia o comando que aplica, e não o que apenas confere"
    - "tests/webview-header.spec.tsx :: atrasada diz quantos commits, e nomeia o comando que os aplica"
  regression_tests:
    - "tests/webview-header.spec.tsx :: o comando que a faixa anuncia (BUG-20260910-WIBK) > divergente anuncia o mesmo comando de atrasada"
    - "tests/webview-header.spec.tsx :: o comando que a faixa anuncia (BUG-20260910-WIBK) > nenhum desfecho oferece a conferência nua como se ela aplicasse"
    - "tests/webview-header.spec.tsx :: o comando que a faixa anuncia (BUG-20260910-WIBK) > o comando anunciado é o que o ritual imprime como \"Para aplicar\""
    - "tests/webview-header.spec.tsx :: o comando que a faixa anuncia (BUG-20260910-WIBK) > o cabeçalho desenha o argumento de aplicação em atrasada e em divergente"
    - "tests/webview-header.spec.tsx :: o comando a copiar aparece quando há o que aplicar, e não aparece quando não há"

spec_verdict: spec-correta

change_set:
  - id: CHG-001
    kind: test
    artifact: tests/webview-header.spec.tsx
    purpose: "Reprodução e regressão: a faixa anuncia o comando que aplica, igual nos dois desfechos, conferido contra o que o script imprime; seis vermelhos antes"
    diff: fix/CHG-001.diff
  - id: CHG-002
    kind: code
    artifact: src/webview/domain/labels.ts
    purpose: "A constante UPDATE_COMMAND soletra o segundo ato; comentários dizem por quê"
    diff: fix/CHG-002.diff

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
- `evidence/reproduction.md`: a cápsula sobre a função pura, com `fix/reproducao.mjs` saindo em 1 nos dois
  desfechos e a datação que descarta regressão
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

## Resolution

### Causa raiz (estado final: confirmed)

A constante `UPDATE_COMMAND` em `src/webview/domain/labels.ts` nasceu na feature 007 (commit `8457e7f`)
com o comando do primeiro ato, o que confere, e a suíte fixou esse valor como esperado: o caso
`atrasada diz quantos commits, e nomeia o comando que os aplica` pedia no nome o comando que aplica e
exigia na asserção o que confere. O script do ritual soletrava o segundo ato por conta própria em
"Para aplicar", sem verificação cruzada com o rótulo, e os dois divergiram sem sinal. Constante e
asserção nascem no mesmo commit: não houve regressão, e não coube bisect.

### Veredito de spec

`spec-correta`, aprovado por iago em 2026-09-10 sobre a recomendação do fix. O critério de aceitação
da feature 007 diz que o cabeçalho "nomeia o comando que aplica a atualização"; RF-04 fixa qual é; o
adendo 007 repete que o comando a copiar aparece só em atrasada e em divergente, e o adendo do
`BUG-20260910-SVZU` confirma que o segundo ato serve aos dois eixos. A spec já definia o certo e o
código divergiu. Nenhum adendo foi gerado e nenhuma spec foi tocada.

### Change set

| CHG | Tipo | Artefato | Propósito |
|---|---|---|---|
| CHG-001 | test | `tests/webview-header.spec.tsx` | Reprodução e regressão: o comando que aplica, igual nos dois desfechos, conferido contra o que o script imprime; seis vermelhos antes |
| CHG-002 | code | `src/webview/domain/labels.ts` | A constante soletra o segundo ato; os comentários dizem por quê |
| CHG-003 | infrastructure | `reversa-views-<versão>.vsix` | Commit, envio à origem e `npm run atualizar -- --aplicar`: construção, suíte, empacotamento e instalação |

Diffs em `fix/CHG-001.diff` e `fix/CHG-002.diff`. O plano aprovado antes de qualquer escrita está em
`fix/plan.html`. O README, listado como código afetado na triagem, já documentava os dois atos e não
descreve a faixa: ficou intocado.

### A mudança, em uma frase

```diff
-const UPDATE_COMMAND = 'npm run atualizar'
+const UPDATE_COMMAND = 'npm run atualizar -- --aplicar'
```

### Prova vermelho a verde

Antes da correção, com os testes aplicados (`evidence/gate1-vermelho.txt`):

```
 Test Files  1 failed (1)
      Tests  6 failed | 22 passed (28)
```

Os seis vermelhos eram a asserção antiga da linha 110, a asserção por substring da linha 194, agora
exigindo o argumento, e quatro dos cinco casos do bloco novo. O quinto, `divergente anuncia o mesmo
comando de atrasada`, já passava, porque os dois desfechos erravam igual.

Depois da correção (`evidence/gate2-verde.txt`):

```
 Test Files  1 passed (1)
      Tests  28 passed (28)
```

E a suíte inteira do projeto, mais a verificação de tipos da tela:

```
 Test Files  83 passed (83)
      Tests  1318 passed (1318)
```

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
