# Actions: Leitura do processo do Reversa

> Identificador: `001-leitura-do-processo`
> Data: `2026-09-09`
> Roadmap: `_reversa_forward/001-leitura-do-processo/roadmap.md`
> Confidência: 🟢 CONFIRMADO, 🟡 INFERIDO, 🔴 LACUNA (herdada da decisão do roadmap entre parênteses)

## Resumo

| Métrica | Valor |
|---------|-------|
| Total de ações | 21 |
| Paralelizáveis (`[//]`) | 17 |
| Maior cadeia de dependência | 4 ações (T011 → T013 → T016 → T017) |

Convenções desta decomposição:

- `ORIGEM` designa `/workspaces/iagoleal/HARNESS/scrum-harness` na revisão
  `420305daa6cdd10858b720a34cb8db67d8e5c5e9`. Toda cópia parte de `ORIGEM/packages/<pacote>/`
  e chega em `src/heranca/<pacote>/`, com o mesmo caminho relativo (D-01).
- "Copiar" significa cópia byte a byte, sem carimbo. O carimbo entra numa única ação (T016),
  depois das adaptações, para que a conferência contra a origem (T020) e a lista de adaptações da
  procedência (T021) partam de arquivos já finais.
- As três adaptações declaradas recebem nomes fixos, reutilizados no `PROCEDENCIA.md`:
  **A1** (importações de `snapshot.ts`), **A2** (importação de `snapshot.spec.ts`),
  **A3** (exportações da rota em `index.ts` da sonda).
- Nada aqui comita, instala IDE, roda lint nem abre PR. O commit fica com o usuário.

## Fase 1, Preparação

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T001 | Criar o manifesto de pacote na raiz: `private: true`, sem `type: module` (CommonJS por omissão), scripts `test` (`vitest run`), `typecheck` (`tsc -p ./ --noEmit`) e `compile` (`tsc -p ./`); `devDependencies` com igualdade exata `typescript` 5.9.3, `vitest` 3.2.7 e `@types/node` 20.19.9, sem acento circunflexo. Nenhuma dependência de produção, nenhum manifesto de extensão (D-11) | - | `[//]` | `package.json` | 🟢 (D-03, D-04) | `[X]` |
| T002 | Criar a configuração do compilador do host: `module` commonjs, `target` e `lib` ES2022, `strict` ligado, `rewriteRelativeImportExtensions` ligado, `verbatimModuleSyntax` desligado, `rootDir` `src`, `outDir` `out`, `types` `["node"]`, `sourceMap` e `skipLibCheck`; `include` `src/**/*.ts`; `exclude` `src/heranca/**/tests/**`, porque as suítes herdadas usam `import.meta.url`, que não existe sob CommonJS, e são exercidas apenas pelo executor de testes. O `tests/` da raiz e `vitest.config.ts` ficam fora do `rootDir` e não são compilados | - | `[//]` | `tsconfig.json` | 🟡 (D-02) | `[X]` |
| T003 | Criar a configuração do executor de testes: `defineConfig` de `vitest/config`, ambiente `node`, sem `globals`, `include` com os dois padrões `src/heranca/**/tests/**/*.spec.ts` e `tests/**/*.spec.ts`. É a única configuração de executor do repositório (D-03) | - | `[//]` | `vitest.config.ts` | 🟢 (D-03) | `[X]` |
| T004 | Estender o `.gitignore` com `out/`, `node_modules/`, `coverage/` e `*.vsix`, na forma do kit `vscode-kanban`, sem tocar nas linhas existentes. Antes de escrever, ler `.reversa/reversa-config.json`: hoje ele traz `allowLegacyEdits: false`, logo a escrita deve ser recusada; nesse caso a ação se conclui registrando, em "Notas de execução", o caminho recusado, o estado da política e o trecho pronto para o usuário colar, e anotando a pendência no progresso. Só editar o arquivo se a política, no momento da execução, liberar | - | `[//]` | `.gitignore` | 🟢 (roadmap §5, risco 7) | `[X]` |
| T005 | Gerar o arquivo de trava com a primeira instalação (`npm install`, única vez em que ele é aceito; daí em diante, `npm ci`). Conferir com `npm ls typescript vitest @types/node` que as três versões instaladas são exatamente 5.9.3, 3.2.7 e 20.19.9, e que o Node local é 20 ou mais recente. Registrar em "Notas de execução" as versões de Node e npm usadas | T001 | - | `package-lock.json` | 🟢 (D-04) | `[X]` |

## Fase 2, Testes

<!-- Os dois testes locais são escritos antes de a cópia estar verde e só passam depois dela (T018). -->

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T006 | Escrever o teste de paridade com o gancho instalado: resolver `.reversa/hooks/check-legacy-policy.mjs` a partir da raiz do repositório e o fixture `src/heranca/reversa-domain/tests/fixtures/check-legacy-policy.mjs` a partir de `import.meta.url`; comparar os dois como `Buffer` (igualdade de bytes, não de texto); usar `it.skipIf(!existsSync(ganchoInstalado))` com a razão no nome do teste ("gancho instalado ausente em .reversa/hooks/"); na falha, a mensagem nomeia os dois caminhos absolutos e instrui a inspecionar o diff antes de qualquer outra coisa | T003, T009 | `[//]` | `tests/paridade-gancho-instalado.spec.ts` | 🟢 (D-06) | `[X]` |
| T007 | Escrever o teste de desempenho no workspace de referência: em `beforeEach`, criar pasta com `mkdtempSync` contendo `.reversa/state.json` (versão 1.3.3, pastas padrão), `.reversa/reversa-config.json`, `.reversa/active-requirements.json` apontando para uma feature em `_reversa_forward/`, a pasta dessa feature com os cinco arquivos que a sonda lê (`actions.md`, `requirements.md`, `progress.jsonl`, `legacy-impact.md`, `regression-watch.md`), cada um próximo de 64 KB e abaixo do teto de 256 KB, e `_reversa_sdd/addenda/` com 50 adendos de cerca de 64 KB em ordem de nome; executar uma leitura de aquecimento descartada; medir com `performance.now()` uma chamada de `readReversaSnapshot` seguida de `readReversa`; exigir menos de 200 ms; remover a pasta em `afterEach`; importar a sonda por `../src/heranca/reversa-probe/src/index.ts` e o julgamento por `../src/heranca/reversa-domain/src/index.ts` | T003, T013, T015 | `[//]` | `tests/desempenho-referencia.spec.ts` | 🟢 (D-07) | `[X]` |

## Fase 3, Núcleo

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T008 | Copiar os 14 módulos de `ORIGEM/packages/reversa-domain/src/*.ts` (`actions`, `anomaly`, `forward`, `glob`, `ideation`, `impact`, `index`, `json`, `migration`, `policy`, `progress`, `state`, `table`, `watch`) para `src/heranca/reversa-domain/src/`, byte a byte; conferir com `diff -r` contra a origem que nada difere | - | `[//]` | `src/heranca/reversa-domain/src/` | 🟢 (D-01) | `[X]` |
| T009 | Copiar os 3 fixtures de `ORIGEM/packages/reversa-domain/tests/fixtures/` (`check-legacy-policy.mjs`, `reversa-config.real.json`, `state.real.json`) para `src/heranca/reversa-domain/tests/fixtures/`, byte a byte e sem carimbo, porque JSON não admite comentário e o gancho precisa seguir idêntico ao instalado; conferir com `cmp` cada um contra a origem e o `.mjs` também contra `.reversa/hooks/check-legacy-policy.mjs` | - | `[//]` | `src/heranca/reversa-domain/tests/fixtures/` | 🟢 (D-05) | `[X]` |
| T010 | Copiar as 14 suítes de `ORIGEM/packages/reversa-domain/tests/*.spec.ts` (`actions`, `compose`, `forward`, `glob`, `hook-parity`, `ideation`, `impact`, `migration`, `policy`, `progress`, `readonly`, `state`, `table`, `watch`) para `src/heranca/reversa-domain/tests/`, byte a byte; elas resolvem `../src` e `./fixtures` sem alteração | - | `[//]` | `src/heranca/reversa-domain/tests/` | 🟢 (D-01) | `[X]` |
| T011 | Copiar `files.ts`, `index.ts` e `snapshot.ts` de `ORIGEM/packages/reversa-probe/src/` para `src/heranca/reversa-probe/src/`, byte a byte, deixando `route.ts` deliberadamente de fora (RF-15) | - | `[//]` | `src/heranca/reversa-probe/src/` | 🟢 (D-01, D-09) | `[X]` |
| T012 | Copiar `files.spec.ts`, `readonly.spec.ts` e `snapshot.spec.ts` de `ORIGEM/packages/reversa-probe/tests/` para `src/heranca/reversa-probe/tests/`, byte a byte, deixando `route.spec.ts` deliberadamente de fora (RF-15) | - | `[//]` | `src/heranca/reversa-probe/tests/` | 🟢 (D-01, D-09) | `[X]` |
| T013 | Adaptação A1: em `snapshot.ts` da sonda, substituir o especificador `'@scrum-harness/reversa-domain'` das duas importações consecutivas (a de valores `EMPTY_SNAPSHOT, StateContract, asRecord, asString, parseJsonSafe` e a de tipo `ReversaSnapshot`) por `'../../reversa-domain/src/index.ts'`, mantendo a forma `import type` da segunda; nada mais muda no arquivo. Guardar as duas linhas originais e as duas adaptadas para o `PROCEDENCIA.md` | T011 | `[//]` | `src/heranca/reversa-probe/src/snapshot.ts` | 🟢 (RF-14) | `[X]` |
| T014 | Adaptação A2: em `snapshot.spec.ts` da sonda, substituir o especificador da importação de `readReversa` de `'@scrum-harness/reversa-domain'` por `'../../reversa-domain/src/index.ts'`; nada mais muda. Guardar linha original e adaptada para o `PROCEDENCIA.md` | T012 | `[//]` | `src/heranca/reversa-probe/tests/snapshot.spec.ts` | 🟢 (RF-14) | `[X]` |
| T015 | Adaptação A3: em `index.ts` da sonda, remover apenas as duas linhas finais que reexportam a rota (`export { answerReversa } from './route.ts'` e `export type { ReversaAnswer, ReversaAnswerBody, ReversaProcessWire } from './route.ts'`); o cabeçalho `@module` e as 21 menções ao nome de pacote da origem em comentários permanecem (D-10). Guardar as duas linhas removidas para o `PROCEDENCIA.md` | T011 | `[//]` | `src/heranca/reversa-probe/src/index.ts` | 🟢 (D-09) | `[X]` |
| T016 | Prefixar, por script e numa única passada, o carimbo de sete linhas de D-05 nos 34 arquivos `.ts` de `src/heranca/` (28 da camada de julgamento, 6 da sonda): primeira linha exatamente `/* HERDADO: não editar sem declarar a adaptação em src/heranca/PROCEDENCIA.md`, depois `origem`, `caminho` (o caminho relativo na origem, `packages/<pacote>/<resto>`), `revisão` com a data 2026-09-08, `copiado em` 2026-09-09 e `adaptações`, com `nenhuma` em 31 arquivos e `A1`, `A2` ou `A3` nos três adaptados; os fixtures não recebem carimbo. O carimbo não pode conter `from 'node:fs'` nem `require('fs')`, para não disparar as suítes `readonly`. Conferir ao final que `grep -rL "^/\* HERDADO" src/heranca --include=*.ts` retorna vazio | T008, T010, T013, T014, T015 | - | `src/heranca/**/*.ts` | 🟢 (D-05) | `[X]` |

## Fase 4, Integração

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T017 | Provar a emissão CommonJS antes de qualquer outra verificação (risco 1 do roadmap): rodar `npm run typecheck` e `npm run compile`; carregar `out/heranca/reversa-probe/src/index.js` com `require` em Node; executar `readReversaSnapshot(process.cwd())` e, sobre o retrato, `readReversa` do índice compilado da camada de julgamento; esperado `installed` verdadeiro, `featureDir` igual a `_reversa_forward/001-leitura-do-processo`, `refusals`, `truncated` e `anomalies` vazios. Se a saída não carregar, não improvisar: registrar a falha em "Notas de execução" e apontar a alternativa ESM do roadmap como decisão a tomar no `/reversa-audit` | T002, T005, T016 | - | `out/` | 🟡 (D-02) | `[X]` |
| T018 | Rodar `npm test` e conferir o resultado contra o onboarding: 19 arquivos de teste (17 herdados e 2 locais), 45 blocos de suíte herdados, 213 casos herdados, 0 falhas e 0 pulados, com `paridade-gancho-instalado` executado e verde neste repositório. Se `readonly.spec.ts` de qualquer pacote falhar, a causa provável é o carimbo, e a correção é no carimbo, nunca na suíte. Registrar em "Notas de execução" o tempo medido pelo teste de desempenho | T005, T006, T007, T016 | - | `src/heranca/` e `tests/` | 🟢 (roadmap §10) | `[X]` |
| T019 | Conferir as invariantes por busca textual, com os comandos da seção 5 do onboarding: nenhuma instrução `import` ou `export` em `src/heranca/` referencia `@scrum-harness/`; `find src/heranca -name "route.*"` vazio; nenhum arquivo `.ts` sem `/* HERDADO` na primeira linha; nenhum `from 'node:fs'` em `src/heranca/reversa-domain/src`. Registrar os quatro resultados em "Notas de execução" | T016 | `[//]` | `src/heranca/` | 🟢 (RF-14, RF-15) | `[X]` |
| T020 | Conferir a fidelidade contra a origem, que está presente nesta máquina: para cada `.ts` de `src/heranca/`, `diff <(tail -n +8 arquivo) ORIGEM/packages/<caminho>` deve ser vazio, exceto nos três adaptados (`snapshot.ts` e `index.ts` da sonda, `snapshot.spec.ts` da sonda), cujo diff deve conter só as linhas de A1, A2 e A3; `cmp` dos três fixtures contra a origem deve ser vazio. Registrar a lista dos que diferem em "Notas de execução" | T016 | `[//]` | `src/heranca/` | 🟢 (D-05, D-08) | `[X]` |

## Fase 5, Polimento

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T021 | Escrever o arquivo de procedência com as seções: origem (repositório `scrum-harness`, endereço `https://github.com/iago-leal/scrum-harness`, revisão `420305daa6cdd10858b720a34cb8db67d8e5c5e9` de 2026-09-08, versão 1.3.3 do Reversa que ela acompanhava, data da cópia 2026-09-09); estrutura da cópia e regra do caminho espelhado; contrato do carimbo, com o formato de sete linhas e o prefixo `/* HERDADO` como marca que a feature 004 reconhecerá; descartes deliberados (`packages/reversa-probe/src/route.ts`, 88 linhas, e `tests/route.spec.ts`, 12 casos, com o motivo); adaptações A1, A2 e A3, cada uma com arquivo, trecho original e trecho adaptado; os três fixtures sem carimbo, com a nota de que o `.mjs` deve seguir idêntico ao gancho instalado; e o que fica para a feature 004 (manifesto com resumo criptográfico, verificador, ressincronizador). A lista de arquivos copiados não entra (D-08) | T013, T014, T015, T016 | `[//]` | `src/heranca/PROCEDENCIA.md` | 🟢 (D-08) | `[X]` |

## Notas de execução

<!--
Reservado para /reversa-coding registrar avisos ou observações que surgiram durante a execução.
Não use isso para corrigir ações, edits manuais ficam fora desse arquivo, vão direto no código.
-->

Execução de 2026-09-09, pelo `/reversa-coding`. As 21 ações fecharam na mesma rodada, sem falha.

**T004, política de edição do legado.** A ação previa recusa, porque no momento do planejamento
`.reversa/reversa-config.json` trazia `allowLegacyEdits: false`. Na execução a config estava em
`allowLegacyEdits: true` com `allowedPaths` vazio, ou seja, liberação irrestrita, e o `.gitignore`
foi estendido normalmente. Nenhuma pendência ficou aberta por política.

**T005, ambiente.** Node v24.21.0 e npm 11.19.0. O `npm install` instalou 53 pacotes e o
`npm ls typescript vitest @types/node` confirmou as três versões exatas: 5.9.3, 3.2.7 e 20.19.9.
O npm avisou que o `postinstall` do `esbuild@0.28.2` não foi executado por política de scripts do
ambiente; o binário funciona assim mesmo, e o executor de testes rodou sem problema.

**T016, carimbo.** 34 arquivos `.ts` carimbados numa passada, 28 da camada de julgamento e 6 da
sonda, com `nenhuma` em 31 e `A1`, `A2` ou `A3` nos três adaptados. A busca por `.ts` sem carimbo
voltou vazia. Os três fixtures ficaram sem carimbo, como previsto.

**T017, emissão CommonJS.** O risco 1 do roadmap não se materializou. `npm run typecheck` e
`npm run compile` passaram sem diagnóstico, e a saída em `out/` carregou por `require`. Sobre este
próprio repositório: `installed` verdadeiro, `featureDir` igual a `_reversa_forward/001-leitura-do-processo`,
`refusals`, `truncated` e `anomalies` vazios, `forward.stage` em `coding-em-progresso`. A alternativa
ESM do roadmap não precisou ser considerada.

**T018, suíte.** 19 arquivos de teste, 17 herdados e 2 locais; 45 blocos de suíte herdados;
215 casos, sendo 213 herdados e 2 locais; 0 falhas e 0 pulados. O teste de paridade com o gancho
instalado executou e passou. As duas suítes `readonly` passaram, ou seja, o carimbo não introduziu
nenhuma menção proibida a `node:fs`.

**T018, desempenho.** O caso inteiro, incluindo a leitura de aquecimento descartada, levou 44 ms
contra o teto de 200 ms. A montagem do workspace de referência fica fora dessa medida, no
`beforeEach`.

**T019, invariantes.** Os quatro comandos da seção 5 do onboarding voltaram vazios: nenhuma
instrução `import` ou `export` referencia `@scrum-harness/`; nenhum arquivo `route.*` existe em
`src/heranca/`; nenhum `.ts` está sem carimbo; nenhum `from 'node:fs'` aparece na camada de
julgamento.

**T020, fidelidade.** Dos 34 arquivos `.ts`, exatamente 3 diferem da origem a partir da linha 8, e
são os três adaptados: `reversa-probe/src/snapshot.ts` (A1, duas linhas), `reversa-probe/src/index.ts`
(A3, duas linhas removidas) e `reversa-probe/tests/snapshot.spec.ts` (A2, uma linha). Nenhum outro
diff apareceu. Os três fixtures saíram idênticos por `cmp`, e o `.mjs` é idêntico também ao gancho
instalado em `.reversa/hooks/`.

**D-10, contagem.** As menções ao nome de pacote da origem somam 21 linhas de comentário, conforme a
decisão, distribuídas em 17 arquivos. A contagem por ocorrência dá 22, porque uma linha do cabeçalho
do índice da sonda cita dois pacotes.

**Fora de escopo, como previsto.** Nada foi comitado, nenhum manifesto de extensão foi criado,
nenhum lint rodou. O commit inicial segue com o usuário, pelo passo 7 do `onboarding.md`.

## Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-09-09 | Versão inicial gerada por `/reversa-to-do` | reversa |
