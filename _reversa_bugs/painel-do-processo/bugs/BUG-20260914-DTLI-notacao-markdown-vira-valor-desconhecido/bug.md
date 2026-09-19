---
schema_version: 1
id: BUG-20260914-DTLI
display_number: 8
title: A notação que o próprio Reversa escreve na tabela vira tipo desconhecido e tabela não reconhecida
status: active
phase: delivering
severity: high
priority: P1
created: 2026-09-14
updated: 2026-09-19

origin:
  type: manual-report
  external_ref: null

area: leitura
module: leitura-do-processo
feature: anomalias
labels:
  - leitura-degradada

visibility: normal
security_suspected: false

reproduction:
  classification: deterministic
  rate: "14/14"
  suspected_triggers:
    - "valor canônico de célula escrito entre crases ou em negrito, como `componente-novo` ou **HIGH**"
    - "nome de coluna anotado no cabeçalho, como Componente (`architecture.md`)"
    - "variação de redação no cabeçalho, como 'Regra esperada após a mudança'"

blocking: []

relationships:
  - bug: BUG-20260912-PIPE
    type: related-to
    state: supported
    evidence:
      - "mesmo módulo (table.ts) e mesma classe: notação markdown legítima que o leitor não reconhece"
      - evidence/reproduction.md

traceability:
  specs:
    - _reversa_sdd/sdd/leitura-do-processo.md#6-requisitos-funcionais
    - _reversa_sdd/sdd/leitura-do-processo.md#15-decisões-tomadas-decision-log
    - _reversa_sdd/sdd/painel-do-processo.md#4-non-goals-fora-do-escopo
  affected_code:
    - src/heranca/reversa-domain/src/impact.ts
    - src/heranca/reversa-domain/src/table.ts
    - src/heranca/reversa-domain/src/watch.ts
  root_cause:
    state: confirmed
    location:
      - src/heranca/reversa-domain/src/impact.ts:105-106
      - src/heranca/reversa-domain/src/watch.ts:83
      - src/heranca/reversa-domain/src/table.ts:74
      - src/heranca/reversa-domain/src/impact.ts:125-133
    summary: >-
      Os valores enumerados são comparados crus com o vocabulário, sem reconhecer a marca de
      código inline ou de negrito que envolve o valor inteiro; e o cabeçalho é comparado por
      igualdade estrita do texto normalizado, em que a anotação entre parênteses e o artigo
      viram palavras a mais. hasHeader repete a comparação com divisor próprio, anterior a A6.
    evidence:
      - evidence/reproduction.md
      - evidence/impacto-afla-2026-09-19-antes.txt
  reproduction_tests:
    - tests/leitura-notacao-markdown.spec.ts#valor canônico escrito com notação
    - tests/leitura-notacao-markdown.spec.ts#cabeçalho que anota a coluna ou escreve um artigo
  regression_tests:
    - tests/leitura-notacao-markdown.spec.ts#notação não é tolerância

spec_verdict:
  verdict: spec-gap
  decided_by: iago
  decided_at: 2026-09-19
  addendum: _reversa_sdd/addenda/bug-BUG-20260914-DTLI-v001.md
change_set:
  - id: CHG-001
    kind: code
    artifact: src/heranca/reversa-domain/src/table.ts
    diff: fix/CHG-001.diff
  - id: CHG-002
    kind: code
    artifact: src/heranca/reversa-domain/src/impact.ts
    diff: fix/CHG-002.diff
  - id: CHG-003
    kind: code
    artifact: src/heranca/reversa-domain/src/watch.ts
    diff: fix/CHG-003.diff
  - id: CHG-004
    kind: configuration
    artifact: src/heranca/adaptacoes.yml, src/heranca/manifesto.yml, src/heranca/PROCEDENCIA.md
    diff: fix/CHG-004.diff
  - id: CHG-005
    kind: specification
    artifact: _reversa_sdd/addenda/bug-BUG-20260914-DTLI-v001.md

closure:
  policy: package
  satisfied: false
resolution_kind: null
---

# A notação que o próprio Reversa escreve na tabela vira tipo desconhecido e tabela não reconhecida

## Summary

O `/reversa-coding` escreve a taxonomia de impacto entre crases, e é assim que o próprio
`reversa-coding/SKILL.md` a grafa. O leitor compara a célula crua com o vocabulário: um
`` `componente-novo` `` não é `componente-novo`, e cada linha íntegra vira anomalia
`tipo-de-impacto-desconhecido`. O mesmo rigor recusa `**HIGH**` como severidade e recusa a tabela
inteira quando o cabeçalho anota uma coluna, como `Componente (`architecture.md`)`.

No `afla`, a feature ativa gera dez anomalias falsas, e são elas que, somadas às demais, fazem o
cabeçalho declarar leitura degradada. Nas seis features, a contagem por tipo canônico sai zerada
em todas as que têm tabela reconhecida, e em duas a tabela não é reconhecida. O arquivo está certo;
o leitor é que não reconhece a notação.

## Expected Behavior

O RF-07 de `leitura-do-processo.md` manda registrar toda degradação encontrada na leitura, o que
pressupõe distinguir degradação de notação. Um valor canônico continua canônico quando vem
envolvido em marca de ênfase ou de código inline, e a anomalia fica reservada ao valor que de fato
está fora do vocabulário.

A decisão registrada em §15 ("Preservar valores fora do conjunto canônico") continua valendo: o
valor estranho não é normalizado para o mais próximo nem descartado. O que muda é só o
reconhecimento da notação, não a tolerância a conteúdo divergente.

Um cabeçalho cujo nome de coluna traz anotação, ou redação equivalente, identifica a mesma tabela.

## Actual Behavior

- `ImpactContract.read` compara `tipo` e `severidade` crus com `IMPACT_TYPES` e `SEVERITIES`
  (`impact.ts:105-106`).
- `byType` passa a ter chaves fora do vocabulário, como `` `componente-novo` ``, e as canônicas
  saem com contagem zero.
- `findTable` exige igualdade do cabeçalho normalizado (`table.ts`), e `normalizeCell` troca a
  pontuação por espaço, sem remover a anotação: `componente architecture md` difere de
  `componente`, e a tabela sai como `tabela-nao-reconhecida`.
- O mesmo critério recusa `Regra esperada após a mudança` no vigia (ver `BUG-20260914-5UH7`).

## Steps to Reproduce

1. Abrir o painel sobre `/Users/iagoleal/dev/afla`, com a feature 005 ativa.
2. O cabeçalho declara leitura degradada com 21 anomalias.
3. Dez delas são `tipo-de-impacto-desconhecido`, com detalhe `` `componente-novo` ``.

Fora do editor, `ImpactContract.read` sobre cada `legacy-impact.md` de `_reversa_forward/`
reproduz o mesmo nas seis features.

## Evidence

- `evidence/anomalias-afla.txt`: as 21 anomalias do processo, agrupadas por arquivo e código.
- `evidence/impacto-afla.txt`: por feature, o cabeçalho encontrado, os arquivos lidos, a contagem
  por tipo canônico, os tipos fora do vocabulário e as anomalias.

## Suspected Area

A comparação de valor enumerado em `impact.ts` e `watch.ts`, e o casamento de cabeçalho em
`findTable`, de `table.ts`. Todos são da camada herdada.

## Acceptance Criteria

1. Tipo, severidade e tipo de verificação canônicos, escritos entre crases ou em negrito, são
   reconhecidos, contam na chave canônica de `byType` e `bySeverity` e não geram anomalia.
2. Valor de fato fora do vocabulário, como `—` ou `**não tocado**`, continua gerando anomalia, e o
   detalhe preserva o texto como está no arquivo.
3. A tabela de impacto cujo cabeçalho anota uma coluna é reconhecida.
4. Sobre o `afla`, a feature ativa deixa de produzir `tipo-de-impacto-desconhecido`.
5. O painel continua declarando `tabela-nao-reconhecida` quando a tabela de fato não existe.

## Traceability

| Elo | Alvo |
|---|---|
| Spec | `_reversa_sdd/sdd/leitura-do-processo.md#6-requisitos-funcionais` (RF-07), §15 (preservar valores fora do conjunto canônico) |
| Código | `src/heranca/reversa-domain/src/impact.ts`, `src/heranca/reversa-domain/src/table.ts`, `src/heranca/reversa-domain/src/watch.ts` |
| Teste | `tests/leitura-notacao-markdown.spec.ts` |
| Adendo | `_reversa_sdd/addenda/bug-BUG-20260914-DTLI-v001.md` (RF-07.1 a RF-07.3) |

## Resolution

### Causa raiz, no estado final

`confirmed`. Os valores enumerados eram comparados crus com o vocabulário, e o cabeçalho por
igualdade estrita do texto normalizado. Não há hipótese concorrente: cada um dos 207 valores
recusados no `afla` é um valor canônico com marca em volta, ou um cabeçalho com anotação ou artigo.
`hasHeader` repetia a comparação de cabeçalho com divisor próprio, anterior a A6.

### Veredito de spec

`spec-gap`, decidido pelo usuário. A spec dizia o que fazer com o valor fora do conjunto canônico e
não dizia o que ele é, nem como casar cabeçalho. O adendo aditivo especifica RF-07.1 (notação
reconhecida), RF-07.2 (notação não é tolerância) e RF-07.3 (casamento de cabeçalho) e o caso
EC-DTLI, sem tocar a spec original.

### Estratégia

Correção direta, sem debate: não havia hipóteses concorrentes. A regra nasce uma vez em `table.ts`
e os três leitores a usam, pela razão que o próprio módulo declara.

### Correction Change Set

| CHG | Tipo | Artefato | Propósito |
|---|---|---|---|
| CHG-001 | code | `src/heranca/reversa-domain/src/table.ts` | A8: `canonicalOf` e `matchesHeader`; `findTable` usa a regra |
| CHG-002 | code | `src/heranca/reversa-domain/src/impact.ts` | A9 a A11: tipo e severidade por `canonicalOf`; `hasHeader` pela regra única |
| CHG-003 | code | `src/heranca/reversa-domain/src/watch.ts` | A12 e A13: tipo de verificação por `canonicalOf` |
| CHG-004 | configuration | `adaptacoes.yml`, `manifesto.yml`, `PROCEDENCIA.md` | Declaração de A8 a A13, resumos e carimbos |
| CHG-005 | specification | `_reversa_sdd/addenda/bug-BUG-20260914-DTLI-v001.md` | O veredito `spec-gap` |

### O núcleo da correção

```ts
const WRAPPERS = [/^`([^`]+)`$/, /^\*\*(.+)\*\*$/] as const
const ANNOTATION = /\s*\([^()]*\)\s*$/
const ARTICLES = new Set(['a', 'o', 'as', 'os'])
// por coluna: columnKey(cell) === want || columnKey(cell sem anotação final) === want
```

### Testes, e a prova vermelho → verde

**Vermelho**, com os testes aplicados e nenhuma linha de correção: 5 de 10 falham, exatamente os
cinco de reprodução; os cinco de regressão, que fixam o limite, já passavam
(`evidence/gate1-vermelho.txt`).

**Verde**, com o change set aplicado: 10 de 10; suíte inteira com 98 arquivos e 1542 casos;
`typecheck` com saída zero; `check:heranca:local` sem impedimento, com o mesmo aviso informativo
de antes (`evidence/gate2-verde.txt`).

### Os cinco critérios de aceite

| # | Critério | Estado |
|---|---|---|
| 1 | Canônico com crases ou negrito conta na chave canônica, sem anomalia | atendido |
| 2 | Valor de fato fora do vocabulário segue anomalia, com o texto do arquivo | atendido, com caso próprio |
| 3 | Tabela de impacto com coluna anotada é reconhecida | atendido |
| 4 | No `afla`, a feature ativa deixa de produzir `tipo-de-impacto-desconhecido` | atendido: a 005 sai sem anomalia; no total, 207 viram 12, todas genuínas |
| 5 | Tabela que de fato não existe segue `tabela-nao-reconhecida` | atendido |

Medição antes e depois em `evidence/impacto-afla-2026-09-19-antes.txt` e `-depois.txt`.

### A entrega, que é o que a closure policy `package` exige

Pendente: commit, pacote e instalação.

## Agent Notes

Descoberto ao conferir o painel sobre o `afla`, a pedido do usuário, que queria o painel fiel ao
código daquele projeto. Relato em `intake/relato-20260914-1140.md`.

Restrições para quem corrigir:

- A camada herdada será tocada. A correção precisa ser declarada como adaptação nova em
  `src/heranca/adaptacoes.yml`, `src/heranca/manifesto.yml` e `src/heranca/PROCEDENCIA.md`, como
  A6 e A7 no `BUG-20260912-PIPE`.
- Não normalizar valor divergente para o canônico mais próximo: a §15 da spec descarta isso
  expressamente. A remoção de notação deve ser estrita, só marcas que envolvem o valor inteiro.
- O casamento de cabeçalho é a parte de maior risco: afrouxá-lo demais pode fazer uma tabela
  qualquer passar por tabela de impacto. Nome da coluna seguido de anotação entre parênteses é o
  caso medido; qualquer tolerância além disso precisa de caso concreto.
- Severidade e prioridade high/P1 foram decididas pelo usuário, informado de que a tela não
  desenha o eixo de impacto (NG-01) e de que o efeito visível são as anomalias falsas no cabeçalho.
- O `afla` não deve ser editado para contornar o leitor: os artefatos dele seguem a grafia do
  próprio skill.

Relação `related-to` com `BUG-20260912-PIPE` proposta por parentesco de classe: o mesmo módulo
`table.ts` não reconhecia notação markdown legítima dentro de célula.

Nenhum termo novo de taxonomia foi preciso.
