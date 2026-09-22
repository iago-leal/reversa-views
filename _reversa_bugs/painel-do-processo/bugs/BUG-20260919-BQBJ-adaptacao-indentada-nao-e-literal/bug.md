---
schema_version: 1
id: BUG-20260919-BQBJ
display_number: 10
title: Adaptações declaradas com trecho indentado não são literais no YAML, e a ressincronização para em A4
status: active
phase: delivering
severity: medium
priority: P2
created: 2026-09-19
updated: 2026-09-22

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
  rate: "2/2"
  capsule: evidence/reproduction.md
  suspected_triggers:
    - "trecho original ou adaptado de adaptacoes.yml cuja primeira linha começa por espaço, sem indicador de indentação no bloco literal"

blocking: []

relationships:
  - bug: BUG-20260909-FJBD
    type: related-to
    state: confirmed
    evidence:
      - "A4 e A5 foram declaradas pelo fix do nº 1, commit bf238ce"
      - "git log -S sobre o trecho de A4 aponta bf238ce"
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
    - _reversa_sdd/addenda/004-heranca-e-sincronia.md
    - _reversa_sdd/addenda/bug-BUG-20260919-BQBJ-v001.md
  affected_code:
    - src/heranca/adaptacoes.yml
    - scripts/heranca/verificar.js
    - scripts/heranca/adaptacoes.js
    - scripts/heranca/relatorio.js
  root_cause:
    state: confirmed
    hypothesis: >-
      A4 e A5 declaram `original` e `adaptado` em bloco literal sem indicador de indentação (`|`).
      O YAML deduz a indentação do bloco pela primeira linha de conteúdo; como o trecho de código
      começa indentado, a indentação dele é absorvida pela do bloco e sai de toda linha lida. O
      trecho entregue não existe na origem, e `aplicar()` para com `ausente`. A falta de detecção
      nasce ao lado: o modo local do verificador confere carimbo e resumo, e nenhuma das suas
      conferências simula a reaplicação, que só o modo completo faz, com a origem no disco.
    causal_path:
      - "src/heranca/adaptacoes.yml declara A4 e A5 com `|`, primeira linha indentada (bf238ce)"
      - "scripts/heranca/manifesto.js#lerAdaptacoes entrega o trecho sem a indentação"
      - "scripts/heranca/adaptacoes.js#aplicar não encontra o original: motivo ausente"
      - "scripts/heranca/verificar.js#julgarLocalmente não reaplica nada, e o build segue verde"
    evidence:
      - ref: evidence/ida-e-volta-2026-09-22.txt
        observation: "impact.ts para em A4 e impact.spec.ts em A5; com `|2` nas duas, os sete arquivos simulados reproduzem o local"
      - ref: evidence/literalidade-2026-09-19.txt
        observation: "A4 e A5 são as únicas adaptações cujo trecho não ocorre no arquivo por defeito, e não por desenho"
      - ref: evidence/reproduction.md
        observation: "a reconstrução da origem por desfazimento em ordem inversa dispensa o clone"
    code_refs:
      - {file: src/heranca/adaptacoes.yml, symbol: A4, commit: bf238ce}
      - {file: src/heranca/adaptacoes.yml, symbol: A5, commit: bf238ce}
      - {file: scripts/heranca/verificar.js, symbol: julgarLocalmente, commit: a9d29b3}
  regression_analysis:
    culprit_commit: bf238ce
    culprit_pr: null
    method: "git log -S sobre o trecho de A4; bisect dispensado, porque o defeito é da declaração e nasce no commit que a escreveu"
  reproduction_tests:
    - "tests/heranca-verificador-local.spec.ts#trecho declarado sem a indentação do arquivo é apontado, e impede, sem origem alguma"
    - "tests/heranca-adaptacoes-declaradas.spec.ts#A4 é lida com a indentação que o código de impact.ts tem"
    - "tests/heranca-adaptacoes-declaradas.spec.ts#A5 é lida com a indentação que o código de impact.spec.ts tem"
  regression_tests:
    - "tests/heranca-adaptacoes-declaradas.spec.ts#toda declaração reaplica sobre a origem que ela implica, sem precisar da origem"
    - "tests/heranca-verificador-local.spec.ts#o mesmo trecho, declarado com a indentação do arquivo, não é apontado"
    - "tests/heranca-verificador-local.spec.ts#adaptações em sequência sobre a mesma linha, como A12 e A14, não são apontadas"
    - "tests/heranca-verificador-local.spec.ts#supressão pura não se simula, e não é apontada"
    - "tests/heranca-verificador-local.spec.ts#adaptação que ficaria ambígua na origem reconstruída é apontada"
    - "tests/heranca-verificador-local.spec.ts#arquivo editado localmente recebe só editado-localmente, sem repetir o defeito"
    - "tests/heranca-*.spec.ts (suítes existentes da herança, sem linha alterada)"

spec_verdict:
  verdict: spec-desatualizada
  decided_by: iago
  decided_at: 2026-09-22
  addendum: _reversa_sdd/addenda/bug-BUG-20260919-BQBJ-v001.md
  note: "spec-correta quanto a A4 e A5 (RF-04, RF-05); desatualizada quanto às contagens do adendo 004 e à falta do RF-03.1"

change_risk:
  level: baixa
  reasons:
    - ferramenta local de manutenção da herança, sem contrato externo nem dado persistido
    - nenhum arquivo herdado, resumo ou carimbo muda; a extensão se comporta como na 0.17.3
    - a conferência nova impede o build, e foi medida sem falso positivo na árvore real
    - reversível por revert do commit

change_set:
  - id: CHG-001
    kind: configuration
    artifact: src/heranca/adaptacoes.yml
    purpose: indicador |2 nos quatro blocos de A4 e A5, e a regra do indicador no cabeçalho
    diff: fix/CHG-001.diff
  - id: CHG-002
    kind: code
    artifact: scripts/heranca/verificar.js
    purpose: sétima conferência local, a ida e volta (falhaDeReaplicacao), e o tipo adaptacao-nao-reaplica em IMPEDEM
    diff: fix/CHG-002.diff
  - id: CHG-003
    kind: code
    artifact: scripts/heranca/relatorio.js
    purpose: ação seguinte do tipo novo
    diff: fix/CHG-003.diff
  - id: CHG-004
    kind: specification
    artifact: _reversa_sdd/addenda/bug-BUG-20260919-BQBJ-v001.md
    purpose: delta das contagens do adendo 004 e o RF-03.1
    diff: null

delivery:
  branch: master
  commit: null
  pull_request: null
  ci: null
  merged: null
  published: null

versions:
  fixed_in: null
  built_from: null
  packaged: null
  installed: null

backports: []

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
| Teste | `tests/heranca-verificador-local.spec.ts` (ida e volta), `tests/heranca-adaptacoes-declaradas.spec.ts` (árvore real) |

## Resolution

**Causa raiz (confirmed).** A4 e A5, declaradas em `bf238ce`, usavam bloco literal `|` com a primeira
linha indentada; o YAML absorvia a indentação do código na do bloco, e o trecho lido não existia na
origem. O modo local do verificador, único que roda no build, não simulava a reaplicação, e o defeito
passou doze dias sem acusação.

**Veredito de spec: `spec-desatualizada`** (decisão de iago, 2026-09-22). Quanto a A4 e A5 a spec
estava certa (RF-04, RF-05), e o dado divergiu. Quanto à conferência, o adendo 004 contava dez tipos
de achado e seis conferências locais, e passam a ser onze e sete; o RF-03.1 especifica a ida e volta.
Adendo: `_reversa_sdd/addenda/bug-BUG-20260919-BQBJ-v001.md`.

**resolution_kind:** `fixed`.

| CHG | Tipo | Artefato | Propósito | Diff |
|---|---|---|---|---|
| CHG-001 | configuration | `src/heranca/adaptacoes.yml` | `\|2` em A4 e A5; regra no cabeçalho | [fix/CHG-001.diff](fix/CHG-001.diff) |
| CHG-002 | code | `scripts/heranca/verificar.js` | ida e volta; `adaptacao-nao-reaplica` impede | [fix/CHG-002.diff](fix/CHG-002.diff) |
| CHG-003 | code | `scripts/heranca/relatorio.js` | ação seguinte do tipo novo | [fix/CHG-003.diff](fix/CHG-003.diff) |
| CHG-004 | specification | `_reversa_sdd/addenda/bug-BUG-20260919-BQBJ-v001.md` | delta das contagens e RF-03.1 | o próprio adendo |

O diff da spec e o do código ficam juntos nesta tabela: o adendo é o CHG-004.

**Prova vermelho → verde.**

- Gate 1 ([evidence/gate1-vermelho.txt](evidence/gate1-vermelho.txt)): 4 falhas em 20, os casos de
  A4 e A5 na árvore real, o trecho sem indentação e a ambiguidade na origem reconstruída. O caso da
  árvore real passava por vacuidade, porque o tipo de achado ainda não existia.
- Gate 2 ([evidence/gate2-verde.txt](evidence/gate2-verde.txt)): 147 arquivos e 2683 testes verdes,
  `tsc` sem erro, `check:heranca:local` em `divergente (0 impedem, 1 apenas informam)`, como antes.
- Contraprova, numa cópia fora do projeto: o verificador novo com o YAML antigo dá `impedido (2
  impedem)`, nomeando A4 em `impact.ts` e A5 em `impact.spec.ts`. É o critério 3 sem origem.

**Dados:** nenhum reparo; nenhum arquivo herdado, resumo ou carimbo mudou.

**Entrega:** pendente (política `package`).

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
