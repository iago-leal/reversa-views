---
schema_version: 1
id: BUG-20260909-FJBD
display_number: 1
title: Cabeçalho declara leitura degradada por anomalia cenario-ambiguo na nota de impacto greenfield
status: resolved
phase: delivering
severity: low
priority: P2
created: 2026-09-09
updated: 2026-09-10

origin:
  type: manual-report
  external_ref: null

area: leitura
module: leitura-do-processo
feature: anomalias
labels: [codigo-herdado]

visibility: normal
security_suspected: false

reproduction:
  classification: deterministic
  rate: "2/2"
  suspected_triggers: []

blocking: []

relationships: []

traceability:
  specs:
    - _reversa_sdd/sdd/painel-do-processo.md#6-requisitos-funcionais
    - _reversa_sdd/sdd/leitura-do-processo.md#11-edge-cases-e-tratamento-de-erros
    - _reversa_sdd/addenda/006-cartoes-e-cronologia.md#impacto-por-artefato-da-extracao
    - _reversa_sdd/addenda/007-atualizacao-e-progresso.md#resumo-da-entrega
  affected_code:
    - src/heranca/reversa-domain/src/impact.ts
    - src/webview/domain/integrity.ts
    - src/webview/ui/Header.tsx
    - _reversa_forward/006-cartoes-e-cronologia/legacy-impact.md
    - _reversa_forward/007-atualizacao-e-progresso/legacy-impact.md
  root_cause:
    state: confirmed
    hypothesis: "O leitor herdado impact.ts (linha 111) registra cenario-ambiguo sempre que a nota greenfield usa tipo diferente de componente-novo, seguindo reversa-coding/SKILL.md:101; as notas das features 006 e 007 usam outros tipos de propósito, e a anomalia vira degradação permanente no cabeçalho."
    causal_path:
      - "feature 006 passa a distinguir criado de modificado na nota de impacto, mantendo a frase greenfield"
      - "readScenario lê greenfield pela frase; files.some(tipo !== componente-novo) é verdadeiro"
      - "log.add cenario-ambiguo; integrity.ts conta qualquer anomalia como degradação; Header.tsx anuncia"
    evidence:
      - { ref: evidence/reproducao-antes.txt, observation: "função pura sobre a nota real da 007: cenário greenfield, 4 tipos, uma anomalia cenario-ambiguo" }
      - { ref: evidence/regra-e-artefatos.md, observation: "a regra do leitor, o teste herdado que a fixa, a linha do framework e a contagem de tipos nas notas 006 e 007" }
      - { ref: evidence/gate1-vermelho-proposto.txt, observation: "o teste proposto falha contra o código atual acusando cenario-ambiguo" }
      - { ref: evidence/gate2-verde-proposto-suite.txt, observation: "com A4/A5 aplicadas em cópia, 1121 verdes; a única falha é versao.spec sobre o repositório real, porque a cópia não tem .git" }
    code_refs:
      - { file: src/heranca/reversa-domain/src/impact.ts, symbol: ImpactContract.read, commit: 420305d (origem) }
      - { file: src/webview/domain/integrity.ts, symbol: readingIntegrity, commit: 765f3c8 }
  reproduction_tests:
    - fix/reproducao.mjs
  regression_tests:
    - tests/leitura-impacto-nota-greenfield.spec.ts
    - src/heranca/reversa-domain/tests/impact.spec.ts

spec_verdict: spec-correta

change_set:
  - { id: CHG-001, kind: test, artifact: tests/leitura-impacto-nota-greenfield.spec.ts, purpose: "Reprodução e regressão sobre a forma de nota das features 006 e 007", diff: fix/CHG-001.proposto.diff }
  - { id: CHG-002, kind: code, artifact: src/heranca/reversa-domain/src/impact.ts, purpose: "Adaptação A4: retira o bloco de cenario-ambiguo; carimbo declara A4", diff: fix/CHG-002.proposto.diff }
  - { id: CHG-003, kind: test, artifact: src/heranca/reversa-domain/tests/impact.spec.ts, purpose: "Adaptação A5: o caso herdado fixa a aceitação", diff: fix/CHG-003.proposto.diff }
  - { id: CHG-004, kind: configuration, artifact: src/heranca/adaptacoes.yml, purpose: "Declara A4 e A5", diff: fix/CHG-004.proposto.diff }
  - { id: CHG-005, kind: documentation, artifact: src/heranca/PROCEDENCIA.md, purpose: "Prosa de A4 e A5", diff: fix/CHG-005.proposto.diff }
  - { id: CHG-006, kind: configuration, artifact: src/heranca/manifesto.yml, purpose: "Resumos e adaptações das duas entradas", diff: fix/CHG-006.proposto.diff }

change_risk:
  classification: baixa
  reasons:
    - "blast radius restrito ao leitor de impacto; sem contrato externo, sem dado"
    - "duas adaptações semânticas em código herdado, a reaplicar por ressincronização até a origem absorver"
    - "manifesto da herança editado à mão, o que o ritual desaconselha; validado pelo verificador local"

closure:
  policy: local-software
  satisfied: true
resolution_kind: fixed
---

# Cabeçalho declara leitura degradada por anomalia cenario-ambiguo na nota de impacto greenfield

## Summary

Em toda leitura deste workspace, o cabeçalho do painel exibe a faixa "Leitura degradada: 1
anomalias, 0 recusas, 0 truncamentos". A única anomalia é `cenario-ambiguo`, produzida pelo leitor
herdado sobre o `legacy-impact.md` da feature ativa: a nota declara cenário greenfield e usa tipos
de impacto diferentes de `componente-novo`. As notas das features 006 e 007 fazem isso de
propósito, e dizem por quê no próprio cabeçalho. O resultado é uma dúvida permanente no cabeçalho
sobre uma leitura que foi completa.

## Expected Behavior

A spec do painel (`painel-do-processo.md`, RF-08 e Fluxo Alternativo B) manda declarar a
degradação quando o processo chega com anomalias, e o painel obedece: o comportamento em
questão não é o do painel, e sim o do leitor. A spec da leitura (`leitura-do-processo.md`, seção
11) descreve anomalia como o registro de um artefato que não pôde ser lido como esperado: JSON
inválido, fase fora do conjunto, linha corrompida, marcador fora da convenção. A spec efetiva
das entregas (adendos 006 e 007) trata a distinção entre arquivo criado e arquivo modificado
como parte do rastro ("dezoito arquivos criados e quarenta e cinco modificados"), isto é, como
forma legítima da nota, e não como contradição.

Há uma norma em sentido contrário, e ela precisa constar: o framework
(`.claude/skills/reversa-coding/SKILL.md`, linha 101) manda usar `componente-novo` para tudo em
cenário greenfield, e o leitor herdado codifica exatamente essa regra. O comportamento esperado
está, portanto, em disputa entre a regra do framework e a spec efetiva das entregas. A pergunta
"é bug do leitor, do artefato ou da regra?" fica aberta para o veredito de spec do fix.

## Actual Behavior

- O cabeçalho anuncia "Leitura degradada: 1 anomalias, 0 recusas, 0 truncamentos" em toda leitura
  desde a feature 006 (captura de 19:36 com a 006 ativa; reprodução às 21:51 com a 007 ativa).
- A seção de anomalias lista uma linha: `legacy-impact.md`, `cenario-ambiguo`, "nota de greenfield
  com impacto que não é componente-novo".
- A leitura é, no mais, completa: zero recusas, zero truncamentos, todos os eixos preenchidos.

## Steps to Reproduce

1. Abrir este repositório no editor com a extensão instalada e abrir o painel; ou, fora do editor,
   compilar (`npm run compile`) e rodar o trecho de `evidence/leitura-anomalias.txt`, que chama
   `readWorkspace` da saída compilada sobre a raiz do clone.
2. Observar a faixa de integridade no cabeçalho e a seção "Anomalias".
3. Confirmar que a feature ativa (`_reversa_forward/007-atualizacao-e-progresso/legacy-impact.md`)
   traz a nota "Feature greenfield, sem legado pré-existente" e tipos `regra-nova`,
   `regra-alterada`, `delta-de-dados` e `delta-de-contrato-externo` na tabela.

## Evidence

- `evidence/captura-transcrita.md`: a captura do usuário, transcrita, com a faixa âmbar.
- `evidence/leitura-anomalias.txt`: a leitura reproduzida fora do editor, com a única anomalia.
- `evidence/regra-e-artefatos.md`: a regra do leitor, o teste herdado que a fixa, a linha do
  framework e a contagem de tipos nas notas das features 006 e 007.

## Suspected Area

- Onde aparece: `src/webview/ui/Header.tsx` (linha de integridade) e
  `src/webview/domain/integrity.ts` (qualquer anomalia conta como degradação).
- Onde nasce: `src/heranca/reversa-domain/src/impact.ts`, linha 111 (regra `cenario-ambiguo`),
  código HERDADO do scrum-harness, revisão `420305d`, sem adaptação declarada.
- Os artefatos que disparam a regra: `legacy-impact.md` das features 006 e 007.

## Acceptance Criteria

1. Com o processo deste workspace, o cabeçalho declara "Leitura íntegra." ou, se a decisão for
   manter a anomalia, a faixa deixa de chamar de degradada uma leitura completa.
2. Nenhuma anomalia legítima (JSON inválido, linha corrompida, fase desconhecida) deixa de ser
   contada: a suíte herdada continua verde, ou a adaptação é declarada em
   `src/heranca/adaptacoes.yml` e `PROCEDENCIA.md`.
3. Teste de regressão cobrindo a forma de nota que este workspace usa.

## Traceability

| Eixo | Valor |
|---|---|
| Spec (painel) | `_reversa_sdd/sdd/painel-do-processo.md#6-requisitos-funcionais` (RF-08, Fluxo B) |
| Spec (leitura) | `_reversa_sdd/sdd/leitura-do-processo.md#11-edge-cases-e-tratamento-de-erros` |
| Spec efetiva (adendos) | `006-cartoes-e-cronologia.md#impacto-por-artefato-da-extracao`, `007-atualizacao-e-progresso.md#resumo-da-entrega` |
| Norma do framework | `.claude/skills/reversa-coding/SKILL.md`, linha 101 (greenfield: tudo `componente-novo`) |
| Código afetado | `impact.ts:111` (herdado), `integrity.ts`, `Header.tsx` |
| Testes existentes | `src/heranca/reversa-domain/tests/impact.spec.ts:136` (fixa a anomalia), `tests/webview-header.spec.tsx` |

## Resolution

**Causa raiz (confirmed).** `src/heranca/reversa-domain/src/impact.ts`, linha 111: em nota
greenfield, qualquer tipo diferente de `componente-novo` registra `cenario-ambiguo`. As notas das
features 006 e 007 usam quatro tipos além dele, de propósito. `integrity.ts` conta toda anomalia
como degradação e `Header.tsx` anuncia. Reprodução isolada em `fix/reproducao.mjs` (exit 1 sobre a
nota real). Não é regressão: a regra é a da cópia (`420305d`); a forma da nota mudou na 006.

**Estratégia: PENDENTE (decisão humana).** Três caminhos em `fix/plan.html`, com recomendação pela
estratégia A: adaptação declarada do leitor herdado (A4) e do caso herdado (A5), teste local novo,
`adaptacoes.yml`, `PROCEDENCIA.md` e `manifesto.yml` atualizados. Alternativas: B, conformar as
notas 006 e 007 à regra do framework (perde informação; tende a voltar); C, declarar cenário de
legado próprio nas notas (contradiz a ancoragem do `/reversa-coding`). Debate multiagente não foi
oferecido em sessão sem interlocutor; `/reversa-debugger-debate` em modo `spec` cabe aqui se você
quiser contraditório entre a regra do framework e a spec efetiva.

**Change set proposto, NÃO aplicado ao projeto** (estratégia A; diffs em `fix/`, todos aprovados
por `git apply --check` contra a árvore atual; aplicação por `sh fix/aplicar-proposta.sh`):

| CHG | Tipo | Artefato | Propósito |
|---|---|---|---|
| CHG-001 | test | `tests/leitura-impacto-nota-greenfield.spec.ts` (novo) | reprodução e regressão sobre a forma de nota das features 006 e 007 |
| CHG-002 | code | `src/heranca/reversa-domain/src/impact.ts` | adaptação A4: retira o bloco; carimbo declara A4 |
| CHG-003 | test | `src/heranca/reversa-domain/tests/impact.spec.ts` | adaptação A5: o caso fixa a aceitação |
| CHG-004 | configuration | `src/heranca/adaptacoes.yml` | declara A4 e A5 |
| CHG-005 | documentation | `src/heranca/PROCEDENCIA.md` | prosa de A4 e A5 |
| CHG-006 | configuration | `src/heranca/manifesto.yml` | resumos e adaptações das duas entradas |

**Prova em cópia isolada** (`evidence/`): `gate1-vermelho-proposto.txt`, o teste novo falha contra
o código atual nos dois casos, ambos acusando `cenario-ambiguo`; `gate2-verde-proposto-suite.txt`,
suíte inteira com A4/A5 aplicadas: 1121 verdes, 3 pulados (sem pacote na cópia) e 1 falha em
`versao.spec.ts` "sobre o repositório real", que exige `.git` e a cópia não o tem. O verificador de
herança local terminou sem impedimento.

**Veredito de spec: PENDENTE.** Com A, recomendação `spec-correta` (os adendos 006 e 007 já
tratam a distinção como forma legítima; o leitor divergia); com B, `spec-desatualizada` e adendo de
bug; com C, `spec-gap`. Fechamento pela policy `local-software` exige regressão aplicada e verde
mais o veredito; `DONE.md` só depois.

**Decisão registrada em 2026-09-10.** Estratégia A e veredito `spec-correta`, aprovados por iago
(CONTINUAR sobre a recomendação). Os seis diffs de `fix/` (nomeados `.proposto.diff` na proposta,
agora aplicados) entraram por `fix/aplicar-proposta.sh`: `git apply` limpo, verificador de herança
local sem impedimento, 28 testes da rodada dirigida verdes (`evidence/gate2-aplicacao.txt`).
Reprodução depois: `reproducao-depois.txt` (exit 0, sem anomalia) e `leitura-depois.txt` (leitura
completa do workspace com zero anomalias). Suíte inteira em `gate2-verde-suite.txt`. Nada muda na
spec: os adendos 006 e 007 já descreviam a nota como legítima. Closure policy `local-software`
satisfeita; `resolution_kind: fixed`; `DONE.md` gravado.

**Entrega à tela.** A extensão 0.7.0 instalada foi construída antes desta correção: o cabeçalho
só deixa de dizer "degradada" depois de commit, `npm run build`, `npm run empacotar` e
`code --install-extension` com o pacote novo (a versão derivada passa a 0.7.1 com o commit).

## Agent Notes

- `impact.ts` é arquivo HERDADO: qualquer mudança nele exige adaptação declarada em
  `src/heranca/adaptacoes.yml` (com trecho `original` único) e prosa em `PROCEDENCIA.md`, e o
  verificador de herança (`npm run check:heranca:local`) precisa continuar verde. O teste herdado
  `impact.spec.ts:136` fixa a anomalia e precisaria da mesma adaptação.
- Três caminhos de correção a pesar no veredito de spec: (a) adaptar o leitor herdado para não
  chamar de ambígua a nota greenfield com tipos distintos; (b) conformar os artefatos das
  features 006 e 007 à regra do framework (perde informação que os adendos citam); (c) manter a
  anomalia e mudar só a forma de declará-la no cabeçalho (deixa de ser "degradada"). Nenhum deles
  é decisão de agente.
- Observado, não registrado: a frase de integridade não flexiona o número ("1 anomalias").
- Se a estratégia A for aprovada, o caminho para aposentar A4/A5 é levar a mesma mudança ao
  `scrum-harness` (clone local em `~/HARNESS/scrum-harness`, revisão `420305d`) e ressincronizar;
  `heranca.origens.yml` ainda aponta para o caminho do contêiner (`/workspaces/...`), e precisa
  apontar para o clone desta máquina antes de `npm run check:heranca` ou `sync:heranca`.
- Severidade e prioridade assumidas pelo registrador em sessão sem interlocutor: low, P2.
