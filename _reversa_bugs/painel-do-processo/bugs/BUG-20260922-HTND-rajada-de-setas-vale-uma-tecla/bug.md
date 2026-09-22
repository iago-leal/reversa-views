---
schema_version: 1
id: BUG-20260922-HTND
display_number: 14
title: Rajada de setas num só bloco de bytes vale uma tecla só no painel de terminal
status: open
phase: triaging
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
  rate: "4/4"
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

Pendente: preenchida pelo `/reversa-debugger-fix`.

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
