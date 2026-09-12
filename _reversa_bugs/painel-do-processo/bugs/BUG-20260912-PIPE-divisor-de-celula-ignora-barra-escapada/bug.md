---
schema_version: 1
id: BUG-20260912-PIPE
display_number: 7
title: O divisor de célula parte na barra escapada, e perde a linha inteira em silêncio
status: resolved
phase: delivering
severity: high
priority: P1
created: 2026-09-12
updated: 2026-09-12

origin:
  type: manual-report
  external_ref: null

area: leitura
module: leitura-do-processo
feature: decomposicao
labels:
  - leitura-degradada

visibility: normal
security_suspected: false

reproduction:
  classification: deterministic
  rate: "8/8"
  suspected_triggers:
    - "célula de tabela cuja prosa cita uma barra vertical, escrita escapada como o markdown exige"

blocking: []

relationships: []

traceability:
  specs:
    - _reversa_sdd/sdd/leitura-do-processo.md#6-requisitos-funcionais
    - _reversa_forward/001-leitura-do-processo/requirements.md
  affected_code:
    - src/heranca/reversa-domain/src/table.ts
    - src/heranca/reversa-domain/src/index.ts
    - src/domain/decomposition.ts
  root_cause:
    state: confirmed
    hypothesis: "O divisor de linha de tabela parte em toda barra vertical, sem reconhecer o escape que o markdown define para a barra literal dentro de célula. A linha ganha colunas que não existem, as verdadeiras saem da posição e o leitor a descarta: na decomposição, porque a sétima célula deixa de ser o marcador de status; na tabela de impacto, porque a leitura por posição toma as cinco primeiras e a justificativa fica cortada na primeira barra."
    causal_path:
      - "cellsOf divide por `|` sem lookbehind (table.ts:40), e nenhuma das duas pontas do escape é tratada"
      - "findTable devolve as células cruas, e fromCells de decomposition.ts lê o status por posição fixa; com colunas a mais, o status cai fora e a ação é descartada sem anomalia"
      - "ImpactContract lê as cinco primeiras células e não valida o excedente, de modo que tipo e severidade permanecem certos e só a justificativa chega truncada"
      - "fromLines de decomposition.ts repetia o mesmo split por conta própria, e ali a ação sobrevivia porque o marcador é buscado no fim da linha; o que se perdia era a descrição"
      - "A divergência entre a contagem herdada, que varre por marcador e acerta, e a lista, que divide por coluna e erra, é declarada pelo painel; nada dizia, porém, que a lista é que estava errada"
    evidence:
      - { ref: evidence/contagem-erp-mineracao.txt, observation: "as oito features de erp-mineracao, com perdidas == linhas com barra escapada em todas" }
      - { ref: evidence/justificativa-cortada.txt, observation: "a justificativa lida contra a que o arquivo traz, na feature ativa" }
    code_refs:
      - { file: src/heranca/reversa-domain/src/table.ts, symbol: cellsOf, commit: 878b22c }
      - { file: src/domain/decomposition.ts, symbol: fromLines, commit: 878b22c }
  reproduction_tests:
    - tests/leitura-tabela-barra-escapada.spec.ts::a barra vertical escapada dentro de célula (BUG-20260912-PIPE)::não parte a célula, e a devolve sem a notação que a carregou
    - tests/leitura-tabela-barra-escapada.spec.ts::a barra vertical escapada dentro de célula (BUG-20260912-PIPE)::preserva a posição das colunas na tabela de impacto, e a justificativa inteira
    - tests/leitura-tabela-barra-escapada.spec.ts::a barra vertical escapada dentro de célula (BUG-20260912-PIPE)::mantém a ação na decomposição lida por cabeçalho, sem divergência com a contagem
    - tests/leitura-tabela-barra-escapada.spec.ts::a barra vertical escapada dentro de célula (BUG-20260912-PIPE)::mantém a ação também na varredura, quando o cabeçalho não é o canônico
  regression_tests:
    - tests/leitura-tabela-barra-escapada.spec.ts::a barra vertical escapada dentro de célula (BUG-20260912-PIPE)
    - tests/leitura-tabela-barra-escapada.spec.ts::a barra vertical escapada dentro de célula (BUG-20260912-PIPE)::continua acusando a divergência quando a lista de fato perde uma linha
    - src/heranca/reversa-domain/tests/table.spec.ts
    - tests/domain-decomposition.spec.ts

spec_verdict: code-defect

change_risk:
  classification: baixa
  motivos:
    - "três arquivos, uma função de verdade; as outras duas mudanças são a exportação e o uso dela"
    - "sem contrato externo, sem dados, sem migração; reversível por um commit"
    - "a camada herdada foi tocada, o que cobra duas adaptações a reaplicar em cada ressincronização"

delivery:
  branch: master
  commit: ecbebb90f8a5422f038420e2be6cd1dcc34ede10
  pull_request: null
  ci: null
  merged: 2026-09-12
  published: 2026-09-12, pacote reversa-views-0.9.4.vsix gerado e instalado por code --install-extension

versions:
  fixed_in: "0.9.4"
  built_from: ecbebb9
  affected: "0.7.0 a 0.9.3"
  installed: "0.9.3, carimbada em 878b22c"

backports: []

change_set:
  - id: CHG-001
    kind: code
    artifact: src/heranca/reversa-domain/src/table.ts
    purpose: "Adaptação A6: o divisor honra o escape e devolve a célula desescapada; passa a ser exportado"
    diff: fix/CHG-001.diff
  - id: CHG-002
    kind: code
    artifact: src/heranca/reversa-domain/src/index.ts
    purpose: "Adaptação A7: o divisor exportado chega ao domínio próprio pelo índice do pacote"
    diff: fix/CHG-002.diff
  - id: CHG-003
    kind: code
    artifact: src/domain/decomposition.ts
    purpose: A varredura passa a usar o divisor único, em vez de repetir a regra por conta própria
    diff: fix/CHG-003.diff

closure:
  policy: package
  satisfied: true
  satisfied_at: 2026-09-12
resolution_kind: fixed
---

# O divisor de célula parte na barra escapada, e perde a linha inteira em silêncio

## Summary

A barra vertical dentro de uma célula de tabela se escreve escapada. É assim que o markdown diz
"aqui vai uma barra literal", e é a única forma de a linha sobreviver a qualquer renderizador. O
divisor de células parte em toda barra, sem reconhecer o escape: a linha ganha colunas que não
existem, as verdadeiras saem da posição e o leitor a descarta sem dizer nada.

O efeito apareceu no `erp-mineracao`, onde o Reversa escreve mensagem de erro e linha de log com
campos separados por barra. Nas oito features do projeto, 63 ações sumiram da decomposição, e nas
quatro tabelas de impacto 11 justificativas chegaram cortadas na primeira barra. Nenhum arquivo
estava errado, e o Reversa escreveu o que devia: o leitor é que não reconhecia a notação.

## Expected Behavior

A célula que cita uma barra continua sendo uma célula. As colunas permanecem na posição, a ação
entra na lista e a justificativa chega inteira. O texto exibido é o que a célula quer dizer, sem a
contrabarra que o carregou, porque o painel mostra prosa, e não notação.

## Actual Behavior

Na decomposição por cabeçalho, a sétima célula deixa de ser o marcador de status e a ação é
descartada sem anomalia própria. Na varredura, a ação sobrevive, porque o marcador é buscado no fim
da linha, mas a descrição chega cortada. Na tabela de impacto, tipo e severidade continuam certos,
porque o escape sempre cai na última coluna, e só a justificativa é truncada, deixando uma
contrabarra solta na tela.

A única voz que o painel tinha sobre isso era a divergência entre a contagem e a lista, que ele
declara sem poder dizer qual das duas erra.

## Steps to Reproduce

1. Abrir o painel sobre um projeto cujo `actions.md` tenha ação com barra escapada na descrição.
2. Expandir a decomposição da feature ativa.
3. A faixa anuncia que a contagem e a lista discordam, e as ações com barra não aparecem na lista.

## Evidence

- `evidence/contagem-erp-mineracao.txt`: as oito features, com perdidas igual a linhas com escape
  em todas as oito.
- `evidence/justificativa-cortada.txt`: a justificativa lida contra a que o arquivo traz.
- `evidence/gate1-vermelho.txt` e `evidence/gate2-verde.txt`: a suíte antes e depois.

## Suspected Area

`cellsOf`, em `src/heranca/reversa-domain/src/table.ts`, e a cópia da mesma regra em `fromLines`,
de `src/domain/decomposition.ts`.

## Acceptance Criteria

1. A ação cuja descrição cita barra entra na lista, e a contagem e a lista não divergem por isso.
2. A justificativa de impacto chega inteira, sem a contrabarra.
3. A célula volta desescapada, como texto.
4. A divergência entre contagem e lista continua sendo declarada quando de fato existir.

## Traceability

| Elo | Alvo |
|---|---|
| Spec | `_reversa_sdd/sdd/leitura-do-processo.md#6-requisitos-funcionais` |
| Código | `src/heranca/reversa-domain/src/table.ts`, `src/heranca/reversa-domain/src/index.ts`, `src/domain/decomposition.ts` |
| Teste | `tests/leitura-tabela-barra-escapada.spec.ts` |

## Resolution

### Causa raiz, no estado final

`confirmed`. Uma linha: `inner.split('|')`. A prova está na correspondência exata, nas oito
features, entre o número de ações perdidas e o número de linhas com barra escapada. Não há hipótese
concorrente que produza oito coincidências.

### Veredito de spec

`code-defect`. A spec da leitura manda ler as células por posição, e é o que o código tenta fazer;
o que falha é a separação das células, anterior a qualquer regra de posição. Nada na spec precisa
mudar.

### Estratégia

Divisor único, que honra o escape. A alternativa de tratar o escape em cada leitor foi descartada
pelo motivo que o próprio cabeçalho de `table.ts` declara: uma regra lida em dois lugares é a
divergência que aquele módulo existe para evitar. Por isso `cellsOf` passou a ser exportado, e
`fromLines` deixou de ter divisor próprio.

### Correction Change Set

| CHG | Tipo | Artefato | Propósito |
|---|---|---|---|
| CHG-001 | code | `src/heranca/reversa-domain/src/table.ts` | A6: honra o escape, devolve desescapado, e exporta |
| CHG-002 | code | `src/heranca/reversa-domain/src/index.ts` | A7: o divisor chega ao domínio próprio pelo índice |
| CHG-003 | code | `src/domain/decomposition.ts` | A varredura usa o divisor único |

Duas das três tocam a camada herdada, e estão declaradas como A6 e A7 em `src/heranca/adaptacoes.yml`,
`src/heranca/manifesto.yml` e `src/heranca/PROCEDENCIA.md`. A conferência local aprova.

### O núcleo da correção

```ts
const inner = trimmed.replace(/^\|/, '').replace(/(?<!\\)\|$/, '')
return inner.split(/(?<!\\)\|/).map(cell => cell.trim().replace(/\\\|/g, '|'))
```

### Testes, e a prova vermelho → verde

A regressão foi fixada em suíte local, e não na herdada, porque um caso na suíte herdada seria mais
uma adaptação a reaplicar em cada ressincronização, e nada do que a origem fixa deixou de valer. O
motivo está registrado em `PROCEDENCIA.md`.

**Vermelho**, com os testes aplicados e nenhuma linha de correção: 5 de 5 falham.

**Verde**, com o change set aplicado: 97 arquivos, 1532 asserções, `typecheck` e
`check:heranca:local` com saída zero.

### Os quatro critérios de aceite

| # | Critério | Estado |
|---|---|---|
| 1 | A ação com barra entra na lista, sem divergência | atendido |
| 2 | A justificativa de impacto chega inteira | atendido |
| 3 | A célula volta desescapada | atendido |
| 4 | A divergência real continua sendo declarada | atendido, com caso próprio |

### A entrega, que é o que a closure policy `package` exige

| Passo | Resultado |
|---|---|
| Registro | commit `ecbebb9` em `master`, com código, testes, adaptações e a pasta do bug |
| Construção, suíte e empacotamento | `npm run atualizar -- --aplicar`, percurso inteiro sem parada |
| Pacote | `reversa-views-0.9.4.vsix`, 208,2 KiB sobre teto de 2048,0 KiB |
| Instalação | `code --install-extension`, confirmada em `iagoleal-local.reversa-views@0.9.4` |

Conferência sobre `erp-mineracao` com a construção instalada: nas oito features a contagem e a
lista coincidem, sem divergência alguma, onde antes faltavam 63 ações. A justificativa que chegava
cortada na primeira barra chega inteira.

A origem **não** recebeu push: o clone fica um commit à frente de `origin/master` até que o usuário
decida enviar.

## Agent Notes

Descoberto durante uma investigação no `erp-mineracao`, a partir da faixa que anunciava 44 ações
contadas e 38 listadas. O usuário perguntou se o Reversa havia sumido com as tarefas; a resposta é
que não, e a pergunta é a melhor descrição do defeito: um leitor que descarta linha em silêncio faz
o leitor humano duvidar do arquivo.

Nenhum termo novo de taxonomia foi preciso. O rótulo `leitura-degradada` é proposto aqui, por
descrever a classe: leitura que perde conteúdo íntegro sem nomear a perda.
