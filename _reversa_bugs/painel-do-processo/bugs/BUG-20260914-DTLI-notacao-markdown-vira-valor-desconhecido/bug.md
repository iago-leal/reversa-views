---
schema_version: 1
id: BUG-20260914-DTLI
display_number: 8
title: A notação que o próprio Reversa escreve na tabela vira tipo desconhecido e tabela não reconhecida
status: open
phase: triaging
severity: high
priority: P1
created: 2026-09-14
updated: 2026-09-14

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
  rate: "6/6"
  suspected_triggers:
    - "valor canônico de célula escrito entre crases ou em negrito, como `componente-novo` ou **HIGH**"
    - "nome de coluna anotado no cabeçalho, como Componente (`architecture.md`)"
    - "variação de redação no cabeçalho, como 'Regra esperada após a mudança'"

blocking: []

relationships:
  - bug: BUG-20260912-PIPE
    type: related-to
    state: proposed
    evidence: []

traceability:
  specs:
    - _reversa_sdd/sdd/leitura-do-processo.md#6-requisitos-funcionais
    - _reversa_sdd/sdd/leitura-do-processo.md#15-decisões-tomadas-decision-log
    - _reversa_sdd/sdd/painel-do-processo.md#4-non-goals-fora-do-escopo
  affected_code:
    - src/heranca/reversa-domain/src/impact.ts
    - src/heranca/reversa-domain/src/table.ts
    - src/heranca/reversa-domain/src/watch.ts
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
| Teste | a definir no fix |

## Resolution

Pendente.

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
