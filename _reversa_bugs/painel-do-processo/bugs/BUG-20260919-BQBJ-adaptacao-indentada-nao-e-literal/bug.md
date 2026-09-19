---
schema_version: 1
id: BUG-20260919-BQBJ
display_number: 10
title: Adaptações declaradas com trecho indentado não são literais no YAML, e a ressincronização para em A4
status: open
phase: triaging
severity: medium
priority: P2
created: 2026-09-19
updated: 2026-09-19

origin:
  type: inspection
  external_ref: null

area: heranca
module: heranca-e-sincronia
feature: 004-heranca-e-sincronia
labels:
  - latente
  - codigo-herdado

visibility: normal
security_suspected: false

reproduction:
  classification: deterministic
  rate: "1/1"
  suspected_triggers:
    - "trecho original ou adaptado de adaptacoes.yml cuja primeira linha começa por espaço, sem indicador de indentação no bloco literal"

blocking: []

relationships:
  - bug: BUG-20260909-FJBD
    type: related-to
    state: supported
    evidence:
      - "A4 e A5 foram declaradas pelo fix do nº 1, commit bf238ce"
      - evidence/literalidade-2026-09-19.txt
  - bug: BUG-20260914-DTLI
    type: related-to
    state: supported
    evidence:
      - "o mesmo defeito, em A10 e A13, foi corrigido no nº 8 pelo CHG-006, commit 89bf5ce"

traceability:
  specs:
    - _reversa_sdd/sdd/heranca-e-sincronia.md#6-requisitos-funcionais
    - _reversa_sdd/sdd/heranca-e-sincronia.md#11-edge-cases-e-tratamento-de-erros
  affected_code:
    - src/heranca/adaptacoes.yml
    - scripts/heranca/verificar.js
    - scripts/heranca/adaptacoes.js
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

# Adaptações declaradas com trecho indentado não são literais no YAML, e a ressincronização para em A4

## Summary

O `adaptacoes.yml` guarda cada adaptação como um par de trechos, `original` e `adaptado`, em bloco
literal do YAML. O bloco literal deduz a indentação pela primeira linha do conteúdo: quando o trecho
de código começa indentado, a indentação dele é tomada como a do bloco e sai do texto lido. A4 e A5,
declaradas pelo fix do nº 1 em 2026-09-10, estão nessa situação.

O ressincronizador procura o `original` na origem por igualdade exata. Sem a indentação, o trecho
não existe lá, e a ressincronização de `impact.ts` para em A4 com o motivo `ausente`, como se a
origem tivesse mudado. A falha é segura, porque nada é escrito, mas a ressincronização está quebrada
e o relatório aponta um conflito que não há.

Nada acusou o defeito durante nove dias. O `check:heranca:local` confere resumos e carimbos, e não se
as adaptações, aplicadas em sequência sobre a origem, reproduzem o arquivo local; e o modo completo
não roda nesta máquina, porque o clone da origem não está no caminho declarado.

## Expected Behavior

O RF-04 de `heranca-e-sincronia.md` manda registrar toda adaptação como delta declarado, com o
trecho; o RF-05 manda o ressincronizador reaplicá-las e parar só quando uma não puder ser
reaplicada. O trecho declarado é, portanto, o texto exato que a reaplicação procura e insere.

Uma adaptação que a origem não mudou reaplica sem parada. E uma declaração que não pode reaplicar
nem sobre a própria origem da cópia atual deveria ser apontada antes do dia da ressincronização.

## Actual Behavior

- `yaml.parse` entrega A4 e A5 sem a indentação inicial de cada linha.
- A ressincronização simulada de `impact.ts` para em A4, motivo `ausente`; com A4 lida com a
  indentação certa, ela reproduz o arquivo exatamente.
- `check:heranca:local` termina sem impedimento.

## Steps to Reproduce

1. Ler `src/heranca/adaptacoes.yml` com o pacote `yaml`, como faz `scripts/heranca/manifesto.js`.
2. Reconstruir a origem de `impact.ts` desfazendo as adaptações, com o texto indentado correto.
3. Aplicar as adaptações declaradas com `aplicar()` de `scripts/heranca/adaptacoes.js`: para em A4.

## Evidence

- `evidence/literalidade-2026-09-19.txt`: por adaptação, se o trecho lido ocorre no arquivo, a
  ressincronização simulada de `impact.ts` e o veredito do `check:heranca:local`, com a ressalva
  sobre A12, que só parece não literal porque A14 reescreve a mesma linha depois.

## Suspected Area

A declaração de A4 e A5 em `src/heranca/adaptacoes.yml`, e a ausência, em `scripts/heranca/`, de uma
conferência local que simule a reaplicação.

## Acceptance Criteria

1. A ressincronização simulada de cada arquivo herdado, com as adaptações declaradas aplicadas em
   ordem sobre a origem reconstruída, reproduz o arquivo local exatamente.
2. A4 e A5 são lidas com a indentação que o código tem.
3. Uma declaração cujo trecho perca a indentação é apontada pela conferência local, sem depender da
   origem na máquina.

## Traceability

| Elo | Alvo |
|---|---|
| Spec | `_reversa_sdd/sdd/heranca-e-sincronia.md#6-requisitos-funcionais` (RF-03, RF-04, RF-05); §11 (EC-03) |
| Código | `src/heranca/adaptacoes.yml`, `scripts/heranca/verificar.js`, `scripts/heranca/adaptacoes.js` |
| Teste | a definir no fix |

## Resolution

Pendente.

## Agent Notes

Achado pela sessão do `/reversa-debugger-fix` do `BUG-20260914-5UH7`, quando a declaração de A15
foi recusada como YAML inválido. Relato em `intake/relato-20260919-1534.md`.

Severidade `medium` e prioridade `P2` propostas pela sessão e aceitas pelo usuário ao escolher o
registro: o defeito é latente, porque não há ressincronização em curso, mas bloqueia a primeira que
houver, e a correção da parte de dados é pequena.

Restrições para quem corrigir:

- O `BUG-20260909-FJBD` está travado com `DONE.md`. A correção mexe no `adaptacoes.yml`, não na pasta
  daquele bug, e por isso não exige reabri-lo; a relação é `related-to`, e não `regression-of`,
  porque o comportamento que ele corrigiu continua correto.
- Uma conferência de "o adaptado ocorre no arquivo" é o teste errado: adaptações em sequência sobre
  a mesma linha, como A12 e A14, deixam o adaptado da primeira fora do arquivo final por desenho. O
  teste certo simula a aplicação em ordem sobre a origem reconstruída; decidir no plano do fix como
  reconstruí-la sem a origem na máquina.
- O verificador e o ressincronizador são código próprio deste projeto (`scripts/heranca/`), e não
  herdado: mudança ali não cria adaptação.

Nenhum termo novo de taxonomia foi preciso.
