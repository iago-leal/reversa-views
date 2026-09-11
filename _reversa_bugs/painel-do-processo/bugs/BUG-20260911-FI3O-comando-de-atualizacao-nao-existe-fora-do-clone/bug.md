---
schema_version: 1
id: BUG-20260911-FI3O
display_number: 6
title: O comando que a faixa anuncia não existe fora do clone, e falha como erro do npm
status: resolved
phase: delivering
severity: high
priority: P1
created: 2026-09-11
updated: 2026-09-11

origin:
  type: manual-report
  external_ref: null

area: webview
module: painel-do-processo
feature: atualizador
labels:
  - spec-gap

visibility: normal
security_suspected: false

reproduction:
  classification: deterministic
  rate: "2/2"
  suspected_triggers:
    - "chamar o comando de qualquer diretório que não seja o clone do reversa-views"

blocking: []

relationships:
  - bug: BUG-20260910-WIBK
    type: related-to
    state: proposed
    evidence:
      - { ref: evidence/reproducao-fora-do-clone.txt, observation: "o nº 5 corrigiu QUAL comando a faixa anuncia; este trata de ONDE ele pode ser executado, e as duas correções vivem na mesma constante UPDATE_COMMAND de labels.ts" }
  - bug: BUG-20260910-SVZU
    type: related-to
    state: proposed
    evidence:
      - { ref: ../../intake/relato-20260911-1656.md, observation: "o nº 4 firmou que --aplicar deixa a instalação em dia com o clone; este pergunta como alcançar esse ato a partir da máquina onde o painel roda, que pode não ser a do clone" }

traceability:
  specs:
    - _reversa_forward/007-atualizacao-e-progresso/requirements.md#7-criterios-de-aceitacao
    - _reversa_sdd/sdd/empacotamento-e-verificacao.md#6-requisitos-funcionais
    - _reversa_sdd/prd.md#6-restricoes
    - _reversa_sdd/addenda/007-atualizacao-e-progresso.md
  affected_code:
    - src/webview/domain/labels.ts
    - package.json
    - README.md
    - scripts/atualizar.js
  root_cause:
    state: confirmed
    hypothesis: "A faixa do painel anuncia um comando cujo alcance é o do diretório corrente, num contexto em que o diretório corrente do leitor quase nunca é o clone. `npm run` resolve scripts pelo `package.json` do diretório de onde se chama, e `atualizar` só existe no `package.json` deste clone; a extensão, porém, roda instalada e o painel abre no workspace de trabalho. Nem a constante `UPDATE_COMMAND` nem a seção do ritual no README dizem de onde rodar, porque a spec da feature 007 nunca fixou o lugar da invocação: ela descreve o ato, não o endereço."
    causal_path:
      - "RF-01 e RF-04 descrevem o ritual como comando de terminal, sem dizer de onde ele é chamado; a spec pressupõe o leitor dentro do clone e não declara a pressuposição"
      - "O script é publicado apenas como script npm local, em package.json:70, e não como executável alcançável pelo caminho do sistema"
      - "RF-22 levou o ritual ao README, documento que se lê no repositório, e o texto herda a mesma pressuposição de lugar"
      - "A faixa do cabeçalho repete o comando nu em labels.ts:183, e essa faixa é lida de dentro de qualquer workspace, inclusive de um container ou de um Codespace onde o clone pode nem existir"
      - "Chamado fora do clone, o comando morre no npm antes do ritual: Missing script onde há package.json, ENOENT onde não há, e nenhum dos três desfechos nomeados se pronuncia"
      - "O ritual, porém, JÁ é independente do diretório corrente: `scripts/atualizar.js` ancora a raiz em `path.resolve(__dirname, '..')`, e não em `process.cwd()`. Chamado pelo caminho absoluto de um diretório neutro, ele confere o clone certo e sai com o código certo. O que prende o comando ao clone é a mediação do `npm run`, e só ela: o defeito está na forma de invocação anunciada, não no percurso executado"
    evidence:
      - { ref: evidence/terminal-erp-mineracao.txt, observation: "a saída original do usuário, em erp-mineracao, com a extensão instalada e o painel aberto" }
      - { ref: evidence/reproducao-fora-do-clone.txt, observation: "reprodução em diretório neutro, e a leitura das duas caras da falha e dos códigos de saída" }
      - { ref: ../../intake/relato-20260911-1656.md, observation: "o relato completo, com os dois pedidos de evolução que acompanham o defeito e não se confundem com ele" }
      - { ref: evidence/reproducao.md, observation: "a cápsula desta sessão, com as três formas de chamada: o caso C prova que o script é independente do diretório corrente e localiza o defeito na invocação anunciada" }
    code_refs:
      - { file: src/webview/domain/labels.ts, symbol: UPDATE_COMMAND, commit: fe6a5ff }
      - { file: package.json, symbol: "scripts.atualizar", commit: fe6a5ff }
      - { file: README.md, symbol: "O ritual da atualização", commit: fe6a5ff }
  reproduction_tests:
    - tests/webview-header.spec.tsx::de onde o comando anunciado se chama (BUG-20260911-FI3O)::havendo raiz carimbada, a linha não é resolvida pelo diretório corrente
    - tests/atualizador.spec.ts::de onde o ritual se chama (BUG-20260911-FI3O)::o relato imprime "Para aplicar" com o endereço da raiz que lhe deram
    - tests/carimbo-da-construcao.spec.ts::as constantes que a construção declara sobre si::a raiz do clone entra como quinta constante (BUG-20260911-FI3O)
  regression_tests:
    - tests/webview-header.spec.tsx::de onde o comando anunciado se chama (BUG-20260911-FI3O)
    - tests/webview-header.spec.tsx::o comando que a faixa anuncia (BUG-20260910-WIBK)::o comando anunciado é o que o ritual imprime como "Para aplicar"
    - tests/atualizador.spec.ts::de onde o ritual se chama (BUG-20260911-FI3O)
    - tests/carimbo-da-construcao.spec.ts::as constantes que a construção declara sobre si
    - tests/host-provider.spec.ts::a consulta à origem::a procedência viaja na carga da leitura, ao lado da revisão herdada (RF-17)

spec_verdict: spec-gap

change_risk:
  classification: média
  motivos:
    - "blast radius de sete arquivos de código, dois deles com regra dura: o carimbo não versionado e a fronteira que proíbe a tela de importar valor do host"
    - "contrato interno apenas: o campo do protocolo entra por acréscimo ao fim, e a ausência tem leitura declarada"
    - "sem dados, sem migração, sem concorrência; reversível por um commit"

delivery:
  branch: master
  commit: 9f0744a9f74c68509d9d9428bf3f858c4bdef61d
  pull_request: null
  ci: null
  merged: 2026-09-11
  published: 2026-09-11, pacote reversa-views-0.9.1.vsix gerado e instalado por code --install-extension

versions:
  fixed_in: "0.9.1"
  built_from: 9f0744a
  affected: "0.7.0 a 0.9.0"
  installed: "0.9.0, carimbada em fe6a5ff"

backports: []

change_set:
  - id: CHG-001
    kind: code
    artifact: scripts/gerar-carimbo-da-construcao.js
    purpose: O carimbo passa a declarar a raiz do clone que produziu a construção, escapada em vez de interpolada
    diff: fix/CHG-001.diff
  - id: CHG-002
    kind: code
    artifact: src/host/session.ts
    purpose: BuildStamp ganha a raiz, o não carimbado ganha cadeia vazia, e a carga a leva por acréscimo ao fim
    diff: fix/CHG-002.diff
  - id: CHG-003
    kind: api-contract
    artifact: src/host/protocol.ts
    purpose: Declara builtFromRoot e a distingue da raiz observada, que é outro lugar
    diff: fix/CHG-003.diff
  - id: CHG-004
    kind: code
    artifact: src/extension.ts
    purpose: Entrega ao provedor a raiz carimbada, ao lado da versão e do commit
    diff: fix/CHG-004.diff
  - id: CHG-005
    kind: code
    artifact: scripts/preview/leitura.js
    purpose: O preview leva o mesmo carimbo que o host de verdade, para anunciar o mesmo comando
    diff: fix/CHG-005.diff
  - id: CHG-006
    kind: code
    artifact: src/webview/domain/labels.ts
    purpose: A constante fixa vira updateCommand, função total com recuo declarado e aspas para caminho com espaço
    diff: fix/CHG-006.diff
  - id: CHG-007
    kind: code
    artifact: src/webview/ui/Header.tsx
    purpose: Entrega ao rótulo a raiz que veio na carga
    diff: fix/CHG-007.diff
  - id: CHG-008
    kind: code
    artifact: scripts/atualizar.js
    purpose: comandoDeAplicacao passa a ser a única grafia do segundo ato deste lado, e o relato a imprime
    diff: fix/CHG-008.diff
  - id: CHG-009
    kind: documentation
    artifact: README.md
    purpose: Seção "De onde se chama", com as duas grafias e o limite do ambiente sem clone
    diff: fix/CHG-009.diff
  - id: CHG-010
    kind: specification
    artifact: _reversa_sdd/addenda/bug-BUG-20260911-FI3O-v001.md
    purpose: Adendo aditivo com RF-34, RF-35 e RF-36, fechando a lacuna do endereço da invocação
    diff: fix/CHG-010.diff

closure:
  policy: package
  satisfied: true
  satisfied_at: 2026-09-11
resolution_kind: fixed
---

# O comando que a faixa anuncia não existe fora do clone, e falha como erro do npm

## Summary

O cabeçalho do painel anuncia `npm run atualizar -- --aplicar` para quem está atrasado, e o anuncia
sem dizer de onde rodar. Como o painel abre no workspace de trabalho, e não no clone do
`reversa-views`, quem copia a linha a executa onde o script não existe e recebe um erro do npm, não
uma resposta do ritual. O aviso de atualização fica, na prática, inexequível para o uso normal da
extensão, que é exatamente o uso em outro projeto.

## Expected Behavior

A spec não fixa o ponto, e é aí que está a lacuna. RF-01 e RF-04 descrevem os dois atos do ritual e
RF-22 manda o README documentá-los, mas nenhum requisito diz de onde o comando é chamado nem o que
deve acontecer quando alguém o chama de fora. A pressuposição de que o leitor está no clone nunca foi
escrita, e por isso a faixa herdou-a sem que revisão alguma a pudesse questionar. O rótulo
`spec-gap` registra isso.

O que o comportamento esperado deveria dizer, e que fica como pergunta para o conserto, é uma entre
três respostas de custo bem diferente:

1. A faixa anuncia um comando executável onde o leitor está, carregando o endereço do clone.
2. O ritual passa a ser alcançável de qualquer diretório, por invocação que não dependa do
   diretório corrente.
3. O comando continua sendo do clone, e tanto a faixa quanto o README passam a dizê-lo, com recusa
   nomeada em vez do erro cru do npm.

O usuário declarou preferir a segunda, e acrescentou o desejo de que a extensão se atualize sozinha
conforme a origem. A segunda parte do desejo colide com o invariante da seção 6 do PRD, a extensão
nunca escreve arquivo, reafirmado em cinco adendos e declarado no README como decisão. Isso não é
defeito e não está registrado aqui: é evolução, e está anotado no relato de intake para o ciclo
forward.

## Actual Behavior

Chamado de qualquer diretório que não seja o clone, o comando termina no npm, antes de o ritual
existir. Onde há `package.json` sem o script, o erro é `Missing script: "atualizar"`, com saída 1.
Onde não há `package.json` algum, é `ENOENT`, com saída 254. Nenhum dos três códigos que o ritual
define chega a ser produzido, e a saída 1 do primeiro caso colide com a de recusa do ritual, o que
torna a falha indistinguível de uma recusa legítima para quem chame o comando por script.

## Steps to Reproduce

1. Instalar a extensão e abrir, em outro projeto qualquer, o painel do processo com a faixa de
   atualização visível.
2. Copiar da faixa a linha `npm run atualizar -- --aplicar`.
3. Colá-la no terminal aberto naquele projeto, sem entrar no clone do `reversa-views`.
4. O npm recusa, e o ritual não roda.

## Evidence

- `evidence/terminal-erp-mineracao.txt`: a saída original do usuário.
- `evidence/reproducao-fora-do-clone.txt`: reprodução em diretório neutro, com a leitura das duas
  caras da falha.
- `../../intake/relato-20260911-1656.md`: o relato integral desta sessão.

## Suspected Area

A constante `UPDATE_COMMAND` de `src/webview/domain/labels.ts`, que é onde a faixa soletra o
comando; a declaração do script em `package.json`, que é o que limita o alcance ao clone; e a seção
do ritual no `README.md`, que repete a pressuposição de lugar.

## Acceptance Criteria

1. Estando a construção instalada atrás da origem, a linha que a faixa oferece é executável tal como
   está, a partir do diretório em que o leitor tem o painel aberto.
2. Chamado onde não possa cumprir o ritual, o comando recusa dizendo por quê e com código de saída
   distinto do de recusa legítima, em vez de morrer no erro do npm.
3. A spec da feature declara de onde o ritual se chama, fechando a lacuna que este bug expôs.
4. A suíte lê a linha anunciada contra a forma de invocação que o projeto passar a suportar, como já
   faz com o valor impresso em "Para aplicar", para que as duas não voltem a divergir sem vermelho.

## Traceability

| Elo | Alvo |
|---|---|
| Spec | `_reversa_forward/007-atualizacao-e-progresso/requirements.md#7-criterios-de-aceitacao` (RF-01, RF-04, RF-22) |
| Spec | `_reversa_sdd/sdd/empacotamento-e-verificacao.md#6-requisitos-funcionais` |
| Restrição | `_reversa_sdd/prd.md#6-restricoes` (a extensão nunca escreve arquivo) |
| Código | `src/webview/domain/labels.ts`, `package.json`, `README.md`, `scripts/atualizar.js` |
| Teste | nenhum cobre o alcance da invocação |

## Resolution

### Causa raiz, no estado final

`confirmed`. O ritual **já era** independente do diretório corrente: `scripts/atualizar.js` deriva a
raiz de `path.resolve(__dirname, '..')`, o clone onde o próprio arquivo mora, e nunca de
`process.cwd()`. A cápsula de reprodução provou-o antes de qualquer correção, chamando o script pelo
caminho absoluto de um diretório temporário: ele conferiu o clone certo e saiu com o código certo.

O que prendia o comando ao clone era a **grafia anunciada**, e só ela. `npm run` resolve scripts pelo
`package.json` do diretório corrente, e `atualizar` só existe no deste clone. O defeito estava no
endereço que a faixa soletrava, e não no percurso que ela disparava, e é isso que manteve o raio da
mudança pequeno o bastante para o risco ficar em média.

### Veredito de spec aprovado

`spec-gap`, aprovado por iago em 2026-09-11. A spec da feature 007 descrevia o ato e nunca o
endereço: RF-01, RF-04 e RF-22 não dizem de onde o comando se chama. A pressuposição existia no
**título** do bloco, "O comando de atualização, no clone", e título não é requisito, não tem critério
de aceite e não produz vermelho. O adendo é aditivo, e está em
`_reversa_sdd/addenda/bug-BUG-20260911-FI3O-v001.md`, com RF-34, RF-35, RF-36 e quatro regras sob
vigilância. A spec original não foi tocada.

### resolution_kind

`fixed`.

### Estratégia

Endereço carimbado, escolhida pelo usuário no menu da sessão, sem debate multiagente. A faixa passa a
anunciar o ritual pelo endereço do clone que produziu a construção instalada, e esse endereço entra
no carimbo da construção como quinta constante. As outras duas respostas possíveis foram recusadas:
o executável global exigiria um ato de instalação por máquina, e manter o comando do clone deixaria o
leitor tendo de trocar de diretório, que era a queixa.

### Correction Change Set

| CHG | Tipo | Artefato | Propósito |
|---|---|---|---|
| CHG-001 | code | `scripts/gerar-carimbo-da-construcao.js` | A quinta constante do carimbo, escapada em vez de interpolada |
| CHG-002 | code | `src/host/session.ts` | `BuildStamp` ganha a raiz; a carga a leva por acréscimo ao fim |
| CHG-003 | api-contract | `src/host/protocol.ts` | Declara `builtFromRoot`, distinta da raiz observada |
| CHG-004 | code | `src/extension.ts` | Entrega a raiz carimbada ao provedor |
| CHG-005 | code | `scripts/preview/leitura.js` | O preview leva o mesmo carimbo do host |
| CHG-006 | code | `src/webview/domain/labels.ts` | `updateCommand`, função total com recuo e aspas |
| CHG-007 | code | `src/webview/ui/Header.tsx` | Entrega a raiz ao rótulo |
| CHG-008 | code | `scripts/atualizar.js` | `comandoDeAplicacao`, única grafia do ato deste lado |
| CHG-009 | documentation | `README.md` | Seção "De onde se chama", com as duas grafias e o limite |
| CHG-010 | specification | `_reversa_sdd/addenda/bug-BUG-20260911-FI3O-v001.md` | O adendo aditivo do veredito |

Os diffs estão em `fix/CHG-001.diff` a `fix/CHG-010.diff`, e o dos testes em `fix/gate1-testes.diff`.

### O núcleo da correção

A mesma regra, escrita dos dois lados da fronteira, porque a tela não pode importar valor do host:

```js
if (typeof raiz !== 'string' || raiz === '') return 'npm run atualizar -- --aplicar'
const caminho = `${raiz.replace(/\/+$/, '')}/scripts/atualizar.js`
return /\s/.test(caminho) ? `node "${caminho}" --aplicar` : `node ${caminho} --aplicar`
```

O que ela produz:

| Raiz | Linha anunciada |
|---|---|
| `/Users/iagoleal/dev/reversa-views` | `node /Users/iagoleal/dev/reversa-views/scripts/atualizar.js --aplicar` |
| `/Users/alguem/Meus Projetos/reversa-views` | `node "/Users/alguem/Meus Projetos/reversa-views/scripts/atualizar.js" --aplicar` |
| ausente, nula ou vazia | `npm run atualizar -- --aplicar` (o recuo) |

### Testes, e a prova vermelho → verde

**Vermelho** (`evidence/gate1-vermelho.txt`), com os testes aplicados e nenhuma linha de correção:

```
❯ tests/carimbo-da-construcao.spec.ts  (5 tests | 3 failed)
❯ tests/atualizador.spec.ts           (39 tests | 7 failed)
❯ tests/webview-header.spec.tsx       (35 tests | 9 failed)
❯ tests/host-provider.spec.ts         (29 tests | 1 failed)
 Test Files  4 failed (4)
      Tests  20 failed | 88 passed (108)
```

**Verde** (`evidence/gate2-verde.txt`), com o change set aplicado:

```
 Test Files  96 passed (96)
      Tests  1527 passed (1527)
npm run typecheck      saída 0
npm run check:webview  saída 0
```

E o ritual, chamado por endereço de um diretório temporário neutro, conferiu o clone e saiu com
código zero, onde antes morria em `Missing script` com saída 1 ou em `ENOENT` com saída 254.

### A ponte do bug nº 5, reforçada

A verificação cruzada que o `BUG-20260910-WIBK` deixou lia o **texto** de `scripts/atualizar.js` por
expressão regular e o comparava com a constante da tela. Ela conferia a grafia. Agora as duas
funções são importadas dos dois lados e comparadas com a mesma raiz, em cinco formas de entrada, o
que confere a regra. É o critério de aceite nº 4 deste bug.

### Os quatro critérios de aceite

| # | Critério | Estado |
|---|---|---|
| 1 | A linha oferecida é executável do diretório em que o leitor está | atendido, com a ressalva de que o clone precisa existir naquela máquina |
| 2 | Chamado onde não possa cumprir o ritual, recusa nomeada com código distinto | atendido pelo desfecho `impossivel` com saída 2, que já existia e agora é alcançado; caminho inexistente continua morrendo no `node`, e o limite está declarado no adendo |
| 3 | A spec declara de onde o ritual se chama | atendido por RF-34, RF-35 e RF-36 do adendo |
| 4 | A suíte lê a linha anunciada contra a forma de invocação suportada | atendido pela ponte por função |

### A entrega, que é o que a closure policy `package` exige

A suíte verde não encerra nada neste projeto, porque o defeito segue vivo na extensão instalada até
o pacote novo existir e estar instalado. A entrega foi feita nesta mesma sessão, em 2026-09-11:

| Passo | Resultado |
|---|---|
| Registro | commit `9f0744a` em `master`, com código, testes, adendo e a pasta do bug |
| Construção, suíte e empacotamento | `npm run atualizar -- --aplicar`, percurso inteiro sem parada |
| Pacote | `reversa-views-0.9.1.vsix`, 207,8 KiB sobre teto de 2048,0 KiB |
| Instalação | `code --install-extension`, confirmada em `iagoleal-local.reversa-views@0.9.1` |
| Carimbo da construção instalada | versão `0.9.1`, commit `9f0744a`, raiz `/Users/iagoleal/dev/reversa-views` |

O carimbo é a prova de que a correção chegou ao lugar onde o defeito aparecia: a constante nova está
no pacote instalado, e é dela que a faixa tira o endereço que anuncia.

A origem **não** recebeu push, por escolha do usuário nesta sessão: o clone fica um commit à frente
de `origin/master` até que ele decida enviar. Isso não afeta a instalação, que é o eixo que esta
política mede.


## Agent Notes

Severidade `high` e prioridade `P1` foram escolhidas pelo usuário no menu desta sessão, na mesma
altura do nº 5, com a razão de que o aviso fica inexequível no uso normal da extensão.

Duas perguntas ficam abertas para o conserto, e nenhuma delas se responde sem o usuário. A primeira:
nos ambientes citados, container de desenvolvimento e Codespace, o clone do `reversa-views` existe
na máquina onde o painel roda? Se não existir, a resposta 1 do Expected Behavior não basta, porque
não há endereço a embutir. A segunda: qual das três respostas o projeto adota, sabendo que a
preferência declarada do usuário tangencia o invariante do PRD e que emendá-lo é ato do ciclo
forward, não do conserto de um bug.

Nenhum termo novo de taxonomia foi preciso: `area: webview`, `module: painel-do-processo` e
`feature: atualizador` já existem no vocabulário.
