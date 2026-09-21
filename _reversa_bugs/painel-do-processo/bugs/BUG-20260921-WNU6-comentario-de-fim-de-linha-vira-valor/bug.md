---
schema_version: 1
id: BUG-20260921-WNU6
display_number: 12
title: Comentário de fim de linha no front matter é lido como valor, e lista vazia vira bloqueio
status: resolved
phase: delivering
severity: medium
priority: P2
created: 2026-09-21
updated: 2026-09-21
express: true

origin:
  type: manual-report
  external_ref: null

area: leitura
module: leitura-do-processo
feature: unclassified
labels:
  - falso-positivo
  - registro-de-bugs

visibility: normal
security_suspected: false

reproduction:
  classification: deterministic
  rate: "1/1"
  suspected_triggers:
    - "linha de primeiro nível do front matter com `#` precedido de espaço depois do valor"

blocking: []

relationships: []

traceability:
  specs:
    - _reversa_sdd/addenda/008-cronologia-do-ciclo-bugs.md#impacto-por-artefato-da-extração
    - _reversa_sdd/sdd/leitura-do-processo.md#11-edge-cases-e-tratamento-de-erros
  affected_code:
    - src/domain/front-matter.ts
    - src/webview/domain/blocking.ts
  root_cause:
    location:
      - src/domain/front-matter.ts#readBlock
    summary: >-
      `readBlock` aparava o valor da linha e o entregava aos três ramos (chave sem valor, lista em
      linha, escalar) com o comentário de fim de linha dentro. Nenhum dos três o descartava, e por
      isso os três erravam: a lista vazia saía povoada, o escalar saía com o comentário, e a chave
      cujo valor era só comentário deixava de abrir a lista abaixo dela.
    state: confirmed
    evidence:
      - evidence/reproduction.md
      - evidence/leitor-antes-2026-09-21.txt
      - evidence/leitor-depois-2026-09-21.txt
  reproduction_tests:
    - "tests/domain-front-matter.spec.ts#a linha real do SRSK do afla lê como lista vazia"
  regression_tests:
    - "tests/domain-front-matter.spec.ts#lista em linha povoada, com comentário, continua povoada"
    - "tests/domain-front-matter.spec.ts#escalar com comentário devolve só o escalar"
    - "tests/domain-front-matter.spec.ts#chave cujo valor é só comentário abre a lista que vem abaixo"
    - "tests/domain-front-matter.spec.ts#cerquilha dentro de aspas continua no valor"
    - "tests/domain-front-matter.spec.ts#aspa escapada não fecha o valor antes da hora"
    - "tests/domain-front-matter.spec.ts#cerquilha sem espaço antes continua no valor"
    - "tests/domain-front-matter.spec.ts#apóstrofo no meio de escalar simples não abre aspas"

spec_verdict:
  verdict: spec-correta
  decided_by: iago
  decided_at: 2026-09-21
  addendum: null

change_risk:
  level: baixa
  reasons:
    - função pura, um ponto só, sem contrato externo nem dado persistido
    - reversível; nenhuma suíte existente foi reescrita

delivery:
  branch: master
  commit: 00001d0
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
    artifact: src/domain/front-matter.ts
    diff: fix/CHG-001.diff

closure:
  policy: package
  satisfied: true
  satisfied_at: 2026-09-21
resolution_kind: fixed
---

# Comentário de fim de linha no front matter é lido como valor, e lista vazia vira bloqueio

## Summary

O leitor restrito de front matter, em `src/domain/front-matter.ts`, toma por valor tudo o que vem
depois do primeiro separador da linha, inclusive o comentário que o YAML permite ao fim dela. Em
`blocking: []   # bloqueio externo [...] levantado pelo mantenedor`, o valor lido é a lista seguida
do comentário; sem os espaços, ele é diferente de `[]`, e a lista sai como povoada. O painel então
leva o bug à faixa "Aguardando decisão humana" com a razão "está bloqueado por condição declarada",
sobre um bug que não tem bloqueio algum.

O mesmo corte errado alcança os outros dois ramos do leitor: o escalar (`severity: high  # nota`
vira a severidade desconhecida `high  # nota`) e a chave que abre lista (`blocking:   # nota` vira o
escalar `# nota`, e a lista abaixo dela deixa de ser lida).

## Expected Behavior

O adendo da feature 008 descreve um leitor restrito que lê escalares e listas de primeiro nível de
um `bug.md` cujo front matter é YAML. Em YAML, `#` precedido de espaço, fora de aspas, abre
comentário até o fim da linha, e comentário não é valor. Lista vazia com comentário ao lado é lista
vazia; escalar com comentário ao lado é o escalar.

`#` dentro de aspas, e `#` sem espaço antes, continuam sendo parte do valor.

## Actual Behavior

Saída do leitor da construção `48fb6d4`, em `evidence/leitor-antes-2026-09-21.txt`:

- `blocking: []   # bloqueio externo [...]` devolve `listas.blocking: true`.
- `severity: high  # nota` devolve `escalares.severity: "high  # nota"`.
- `blocking:   # nota`, com item de lista abaixo, devolve `escalares.blocking: "# nota"`.
- `title: "Painel # 3: a contagem diverge"` e `title: cor#fff sem espaco` saem certos, e precisam
  continuar saindo.

## Steps to Reproduce

1. `npm run compile:cli`
2. Chamar `readFrontMatter` de `out-cli/domain/front-matter.js` sobre
   `---\nblocking: []   # nota\n---\n`.
3. Observar `listas.blocking: true`.

No painel: `npm run painel -- --passada --sem-conferir --workspace=~/dev/afla` mostra o
`BUG-20260914-SRSK` na faixa de espera com a razão de bloqueio.

## Evidence

- `evidence/leitor-antes-2026-09-21.txt`: seis linhas de front matter e o que o leitor devolve.
- A linha real: `~/dev/afla/_reversa_bugs/painel-indicadores/bugs/BUG-20260914-SRSK-par-orcamento-u9-cfop-5999-fora-da-expedicao/bug.md`, linha 30. O arquivo é de outro projeto, é YAML válido e está travado: não se toca.

## Suspected Area

`readBlock`, em `src/domain/front-matter.ts`, na linha que apara o valor antes dos três ramos.

## Acceptance Criteria

1. A linha real do SRSK devolve `listas.blocking: false`.
2. Escalar com comentário ao fim devolve só o escalar.
3. Chave cujo valor é só comentário se comporta como chave sem valor, e abre lista ou bloco pelo que
   vem abaixo.
4. `#` dentro de aspas simples ou duplas, e `#` sem espaço antes, continuam no valor.
5. Nenhuma suíte existente do front matter, do registro de bugs ou da faixa de espera é reescrita
   para passar.

## Traceability

| Elo | Alvo |
|---|---|
| Spec | adendo `008-cronologia-do-ciclo-bugs.md`, linhas sobre `leitura-do-processo.md` §8 e §11 |
| Código | `src/domain/front-matter.ts`; efeito visível por `src/webview/domain/blocking.ts` |
| Teste | `tests/domain-front-matter.spec.ts`, a estender no fix |

## Resolution

### Causa raiz, no estado final

`confirmed`. `readBlock`, em `src/domain/front-matter.ts`, aparava o valor e o entregava aos três
ramos com o comentário de fim de linha dentro. O defeito nasce no leitor, e aparece na faixa de
espera por `src/webview/domain/blocking.ts`, que só consome o que o leitor entrega. Reprodução
determinística (`evidence/reproduction.md`).

### Veredito de spec

`spec-correta`, aprovado pelo usuário em 2026-09-21, sobre a recomendação da sessão. A D-03 do
roadmap da 008 já dizia que o interpretador "distingue lista vazia de lista com itens" e "reconhece
escalar de topo"; `[]` seguido de comentário é lista vazia em YAML, e o código divergiu. Nada muda
na spec, e não há adendo.

### Estratégia

Correção direta, em modo expresso. Uma função nova, `dropComment`, chamada uma vez, antes dos três
ramos. Aspas só contam onde o YAML as conta, em valor que começa entre aspas ou em lista em linha, de
modo que o apóstrofo no meio de um escalar simples não segura o comentário. O leitor continua
restrito: aprendeu comentário, e nada mais.

### Correction Change Set

| CHG | Tipo | Artefato | Propósito |
|---|---|---|---|
| CHG-001 | code | `src/domain/front-matter.ts` | `dropComment`, e a chamada dela em `readBlock` |

Diff em `fix/CHG-001.diff`; o dos testes em `fix/tests.diff`.

### Testes, e a prova vermelho → verde

**Vermelho**, com os testes aplicados e nenhuma linha de correção: 5 falhas nos 8 casos novos; os
outros 3 passam, como guarda do que não podia quebrar (`evidence/gate1-vermelho.txt`).

**Verde**, com o change set aplicado: as duas suítes tocadas com 62 de 62; suíte inteira com 2189 de
2189 em 125 arquivos; `typecheck` e `check:webview` sem erro (`evidence/gate2-verde.txt`).

### Os cinco critérios de aceite

| # | Critério | Estado |
|---|---|---|
| 1 | A linha real do SRSK devolve lista vazia | cumprido, por teste e pela passada do painel sobre o `afla` |
| 2 | Escalar com comentário devolve só o escalar | cumprido |
| 3 | Chave cujo valor é só comentário abre o que vem abaixo | cumprido |
| 4 | Cerquilha entre aspas, e sem espaço antes, continuam no valor | cumprido |
| 5 | Nenhuma suíte existente reescrita | cumprido |

### Fechamento

Política `package`, satisfeita em 2026-09-21: commit `00001d0`, pacote `reversa-views-0.14.4.vsix` e
instalação confirmada em `iagoleal-local.reversa-views@0.14.5`, construída de `ebfb5bc`, que contém a
correção. Trava gravada em `DONE.md`.

## Agent Notes

Registrado pela rota expressa. Relato em `intake/relato-20260921-1620.md`.

Severidade `medium` e prioridade `P2` assumidas na rota expressa, sem menu: aviso falso na faixa que
existe para nomear o que espera decisão humana, sem escrita nem perda de dado.

O relato de origem apontava só o ramo da lista em linha. A reprodução desta sessão mostrou os outros
dois ramos, que entram no mesmo bug por terem a mesma causa e a mesma correção, num ponto só.

Proposta de termo para a taxonomia: `feature: 008-cronologia-do-ciclo-bugs`. A lista de features do
`taxonomy.yaml` para na 007, e este é o primeiro bug sobre código da 008.

Restrição para quem corrigir: o leitor é restrito de propósito, e não deve virar um leitor de YAML.
A correção é descartar o comentário, e nada além.
