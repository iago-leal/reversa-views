---
schema_version: 1
id: BUG-20260922-HTND
display_number: 14
title: Rajada de setas num só bloco de bytes vale uma tecla só no painel de terminal
status: active
phase: delivering
severity: medium
priority: P2
created: 2026-09-22
updated: 2026-09-22

origin:
  type: manual-report
  external_ref: null

area: unclassified
module: painel-do-processo
feature: unclassified
labels:
  - teclado
  - interface-viva

visibility: normal
security_suspected: false

reproduction:
  classification: deterministic
  rate: "6/6"
  suspected_triggers:
    - "bloco de bytes com mais de uma sequência de tecla, como a rolagem do trackpad convertida em setas pelo emulador"

blocking: []

relationships: []

traceability:
  specs:
    - _reversa_forward/014-cli-do-processo/interfaces/teclado.md#2-a-tabela-confirmada
    - _reversa_forward/014-cli-do-processo/interfaces/teclado.md#4-como-a-decisão-entra-no-código
    - _reversa_forward/017-tela-cheia-do-painel/interfaces/teclado.md#1-o-que-não-muda
    - _reversa_sdd/addenda/017-tela-cheia-do-painel.md#impacto-por-artefato-da-extração
  affected_code:
    - src/cli/teclas.ts
    - src/cli/laco.ts
  root_cause:
    state: confirmed
    hypothesis: >-
      `reconhecerTecla` devolve no máximo uma tecla por bloco e, num bloco que começa por `Esc [`,
      decide pelo último byte do bloco inteiro; fora do escape, decodifica o bloco inteiro como uma
      chave da tabela. `aoBloco`, em `laco.ts`, aplica uma transição por chamada. O agrupamento de
      várias teclas num só `data` do fluxo de entrada, que o sistema faz livremente, colapsa a rajada.
    causal_path:
      - "o emulador (ou o sistema) entrega N sequências num único evento `data` do stdin"
      - "src/cli/terminal.ts#aoTeclar repassa o pedaço inteiro como um bloco"
      - "src/cli/laco.ts#aoBloco chama reconhecerTecla uma vez"
      - "src/cli/teclas.ts#reconhecerTecla lê o último byte (sequência) ou o bloco inteiro (letra)"
      - "uma tecla, ou nenhuma, e uma transição de navegação"
    evidence:
      - ref: evidence/leitura-rajada-de-setas-2026-09-22.txt
        observation: "a função pura devolve uma tecla para N setas, a última para setas mistas, nulo para jj"
      - ref: evidence/rajada-antes-2026-09-22.txt
        observation: "no painel real, 5 e 40 setas numa escrita movem um passo; jjjjj não move"
      - ref: evidence/reproduction.md
        observation: "o controle com uma tecla por escrita anda um passo por tecla"
    code_refs:
      - {file: src/cli/teclas.ts, symbol: reconhecerTecla, commit: 015dbe2}
      - {file: src/cli/laco.ts, symbol: aoBloco, commit: 015dbe2}
  reproduction_tests:
    - "tests/cli-teclas-rajada.spec.ts#N setas num bloco viram N teclas"
    - "tests/cli-teclas-rajada.spec.ts#setas em sentidos opostos no mesmo bloco valem as duas, em ordem"
    - "tests/cli-teclas-rajada.spec.ts#letras de navegação coladas valem cada uma"
    - "tests/cli-teclas-rajada.spec.ts#letra e seta no mesmo bloco valem as duas"
    - "tests/cli-teclas-rajada.spec.ts#`reconhecerTecla` não devolve mais a última de um bloco com várias"
  regression_tests:
    - "tests/cli-teclas-rajada.spec.ts#o bloco que é exatamente `Esc` continua sendo a saída (D-15)"
    - "tests/cli-teclas-rajada.spec.ts#bloco de uma tecla só continua valendo uma tecla"
    - "tests/cli-teclas-rajada.spec.ts#`Esc` sobrando no fim de um bloco maior não é saída, e não apaga as anteriores"
    - "tests/cli-teclas-rajada.spec.ts#sequência incompleta no fim do bloco não vira tecla, e não apaga as anteriores"
    - "tests/cli-teclas-rajada.spec.ts#sequência desconhecida no meio não vira tecla, e não impede as vizinhas"
    - "tests/cli-teclas-rajada.spec.ts#as teclas de página no meio da rajada seguem lidas pelo número (017, D-06)"
    - "tests/cli-teclas-rajada.spec.ts#`Esc` seguido de outro byte, como Alt com tecla, não vira tecla nem arrasta a vizinha"
    - "tests/cli-teclas-rajada.spec.ts#letra acentuada de vários bytes é uma unidade só, e não vira tecla"
    - "tests/cli-teclas-rajada.spec.ts#bloco vazio não vira tecla alguma"
    - "tests/cli-teclas.spec.ts (suíte inteira, sem linha alterada)"

spec_verdict:
  verdict: spec-gap
  decided_by: iago
  decided_at: 2026-09-22
  addendum: _reversa_sdd/addenda/bug-BUG-20260922-HTND-v001.md

change_risk:
  level: baixa
  reasons:
    - ferramenta local, sem dado persistido nem contrato externo
    - função pura continua pura; o laço só muda a ordem de aplicação e o número de desenhos
    - reversível; nenhuma suíte existente é reescrita

change_set:
  - id: CHG-001
    kind: code
    artifact: src/cli/teclas.ts
    purpose: fatiar o bloco em unidades e reconhecer cada uma; reconhecerTeclas exportada
    diff: fix/CHG-001.diff
  - id: CHG-002
    kind: code
    artifact: src/cli/laco.ts
    purpose: aplicar cada tecla em ordem, desenhar uma vez, tecla de efeito encerra o bloco
    diff: fix/CHG-002.diff
  - id: CHG-003
    kind: specification
    artifact: _reversa_sdd/addenda/bug-BUG-20260922-HTND-v001.md
    purpose: adendo aditivo com as regras da rajada
    diff: null

closure:
  policy: package
  satisfied: false
resolution_kind: null
---

# Rajada de setas num só bloco de bytes vale uma tecla só no painel de terminal

## Summary

A interface viva de terminal (`scripts/painel.js`) reconhece as teclas por bloco de bytes, pela regra
D-15 da feature 014: `reconhecerTecla`, em `src/cli/teclas.ts`, recebe tudo o que o terminal entregou
de uma vez e devolve no máximo uma tecla. Quando várias sequências chegam juntas no mesmo bloco, o
reconhecedor lê só o último byte e as trata como uma tecla. É o que acontece com a rolagem do
trackpad no iTerm2 com `AlternateMouseScroll` ligado: o emulador converte o gesto numa rajada de
setas, o sistema as agrupa, e a seleção anda uma linha por bloco, e não uma por seta.

## Expected Behavior

O contrato do teclado da 014 (seção 2, tabela confirmada) faz de cada seta um movimento de uma linha,
e a seção 4 põe o reconhecimento dos bytes numa função pura, "o único lugar em que a tabela acima
vira código". O adendo da 017 reafirma, pela RN-04, que o painel não lê mouse e que "a roda funciona
pela conversão em setas que o emulador faz na tela alternativa": a rolagem depende de cada seta
convertida valer uma seta.

Esperado, portanto: cada sequência completa de um bloco é uma tecla, aplicada na ordem em que
chegou; o bloco que é exatamente `Esc` continua sendo a tecla de saída; sequência desconhecida
continua sem virar tecla.

A D-15 decidiu o reconhecimento "por bloco, e não por byte" para distinguir o `Esc` isolado do
começo de uma seta, e o roadmap da 014 registrou como risco apenas a sequência partida em dois
blocos. O caso inverso, várias sequências num bloco só, não foi escrito em lugar algum. A pergunta
"a D-15 proibiu isso ou só não previu?" fica aberta para o veredito de spec do fix.

## Actual Behavior

Reconhecedor da construção `c4a77a2`, chamado direto (`evidence/leitura-rajada-de-setas-2026-09-22.txt`):

- uma, duas, sete ou quarenta setas abaixo num bloco devolvem sempre uma só tecla `abaixo`;
- seta abaixo seguida de seta acima no mesmo bloco devolve só `acima`;
- `jj` no mesmo bloco, digitado depressa, não devolve tecla alguma.

No painel real, na sessão de 2026-09-21: quarenta `Esc [ B` em escritas consecutivas num
pseudoterminal produziram seis redesenhos.

## Steps to Reproduce

1. `npm run compile:cli`
2. Em Node, chamar `reconhecerTecla` de `out-cli/cli/teclas.js` com o bloco
   `Uint8Array.from([0x1b,0x5b,0x42, 0x1b,0x5b,0x42, 0x1b,0x5b,0x42])`.
3. Observar uma única tecla `abaixo`, onde deviam ser três.

No emulador: ligar `AlternateMouseScroll` no iTerm2 (Settings → Advanced, "Scroll wheel sends arrow
keys when in alternate screen mode"), abrir `npm run painel` num painel novo e rolar o trackpad sobre
uma lista longa; a seleção anda bem menos que o gesto.

## Evidence

- `evidence/leitura-rajada-de-setas-2026-09-22.txt`: os seis blocos de teste, o que o reconhecedor
  devolve e a medição de seis redesenhos para quarenta setas.
- Relato bruto em `../../intake/relato-20260922-1651.md`; origem na nota 5 das "Notas de execução" de
  `_reversa_forward/017-tela-cheia-do-painel/actions.md` e no `handoff.md` da mesma pasta.

## Suspected Area

`reconhecerTecla`, em `src/cli/teclas.ts`, que devolve uma tecla por bloco; e `aoBloco`, em
`src/cli/laco.ts` (perto da linha 243), que aplica uma transição por bloco.

## Acceptance Criteria

1. Um bloco com N setas completas move a seleção N linhas, na ordem em que chegaram.
2. Um bloco com setas em sentidos diferentes aplica cada uma, e não só a última.
3. Letras de navegação coladas no mesmo bloco (`jj`) valem cada uma.
4. O bloco que é exatamente `Esc` continua sendo a saída; sequência desconhecida, sozinha ou no meio
   de um bloco, continua sem virar tecla, e não impede as conhecidas vizinhas.
5. As sequências terminadas em til continuam lidas pelo número (D-06 da 017).
6. O reconhecimento continua puro e sem temporizador.
7. A rajada de N setas não dispara N redesenhos completos se isso degradar o desenho; o critério de
   quantos quadros sai de uma rajada fica para o plano do fix.
8. Nenhuma suíte existente de `tests/cli-teclas.spec.ts` é reescrita para passar.

## Traceability

| Elo | Alvo |
|---|---|
| Spec | contrato do teclado da 014, seções 2 e 4; adendo do contrato da 017, seção 1; adendo `017-tela-cheia-do-painel.md`, impacto sobre o teclado (RN-04, D-06) |
| Código | `src/cli/teclas.ts#reconhecerTecla`; `src/cli/laco.ts#aoBloco` |
| Teste | `tests/cli-teclas.spec.ts`, a estender no fix |

## Resolution

### Causa raiz, no estado final

`confirmed`. `reconhecerTecla`, em `src/cli/teclas.ts`, devolvia no máximo uma tecla por bloco: num
bloco que começa por `Esc [`, decidia pelo último byte do bloco inteiro; fora do escape, procurava o
bloco inteiro na tabela de letras. `aoBloco`, em `src/cli/laco.ts`, aplicava uma transição por bloco.
Reprodução determinística em `evidence/reproduction.md`.

### Veredito de spec

`spec-gap`, decidido pelo usuário em 2026-09-22, sobre a recomendação da sessão. O contrato do
teclado faz de cada seta uma linha, e a D-15 só previa a sequência partida; o bloco com várias teclas
nunca foi escrito, e a regra da tecla de efeito nasceu nesta correção. Adendo aditivo em
`_reversa_sdd/addenda/bug-BUG-20260922-HTND-v001.md` (CHG-003).

### Estratégia

Correção direta, escolhida pelo usuário. O bloco é fatiado em unidades completas por função pura, e
cada unidade é reconhecida pela lógica de antes, intacta. O laço aplica cada tecla em ordem, ajusta a
janela depois de cada movimento como o desenho faria, e desenha uma vez. Tecla de efeito executa e
encerra o bloco, por decisão do usuário.

### Correction Change Set

| CHG | Tipo | Artefato | Propósito |
|---|---|---|---|
| CHG-001 | code | `src/cli/teclas.ts` | `fatiar` e `reconhecerTeclas`; `reconhecerTecla` só para bloco de uma unidade |
| CHG-002 | code | `src/cli/laco.ts` | `ajustarJanela` extraída; `aoBloco` por tecla, um desenho; `executar` com os efeitos |
| CHG-003 | specification | `_reversa_sdd/addenda/bug-BUG-20260922-HTND-v001.md` | as seis regras da rajada |

Diffs de código em `fix/CHG-001.diff` e `fix/CHG-002.diff`; o dos testes em `fix/tests.diff`. O
adendo de spec é o próprio arquivo do CHG-003.

### Testes, e a prova vermelho → verde

**Vermelho**, com a suíte nova aplicada e nenhuma linha de correção: 14 de 14 falham, porque
`reconhecerTeclas` não existe; a suíte antiga, 26 de 26 verde (`evidence/gate1-vermelho.txt`).

**Verde**, com o change set aplicado: suíte inteira com 2674 de 2674 em 146 arquivos; `typecheck`,
`check:webview` e o `tsc` da CLI sem erro (`evidence/gate2-verde.txt`).

**Painel real**, no pseudoterminal, antes e depois (`evidence/rajada-antes-2026-09-22.txt`,
`evidence/rajada-depois-2026-09-22.txt`):

| Rajada numa escrita | Antes | Depois |
|---|---|---|
| 5 setas abaixo | 1 passo (T023) | 5 passos (T019), 1 quadro |
| 40 setas abaixo | 1 passo | 40 passos, a mesma posição de 40 setas uma a uma |
| 3 abaixo e 1 acima | 1 passo acima | 2 passos abaixo (T021) |
| `jjjjj` | nada | 5 passos (T019) |

### Critérios de aceite

| # | Critério | Estado |
|---|---|---|
| 1 | N setas movem N linhas, em ordem | cumprido |
| 2 | Sentidos diferentes, cada uma aplicada | cumprido |
| 3 | Letras coladas valem cada uma | cumprido |
| 4 | `Esc` exato é saída; desconhecida não vira tecla nem impede vizinhas | cumprido |
| 5 | Til lido pelo número | cumprido |
| 6 | Puro e sem temporizador | cumprido |
| 7 | Rajada não dispara N redesenhos | cumprido, um quadro por bloco |
| 8 | Nenhuma suíte existente reescrita | cumprido |

### Fechamento

Política `package`: falta a entrega. O bug segue `active`/`delivering` até commit, pacote e
instalação por `npm run atualizar -- --aplicar`.

## Agent Notes

Severidade `medium` e prioridade `P2` escolhidas pelo usuário em 2026-09-22.

Propostas de termo para a taxonomia, que não tem vocabulário para a interface de terminal:
`area: cli` (`src/cli`, `scripts/painel.js`) e `feature: 014-cli-do-processo`. A lista de features
para na 007.

Restrições para quem corrigir: a D-15 existe para distinguir `Esc` isolado do começo de uma seta e
deve continuar valendo; a pureza da função é exigência do contrato. O caminho provável, anotado no
handoff da 017, é fatiar o bloco em sequências completas e devolver uma lista de teclas, preservando
a regra de que sequência desconhecida não é tecla. Um resto incompleto no fim do bloco (sequência
partida) é o risco já registrado no roadmap da 014 e não precisa ser resolvido aqui.

Este bug não é da 017: o reconhecimento por bloco vem da 014. A 017 apenas tornou o caminho visível,
ao fazer da rolagem pelo trackpad o uso natural do painel.
