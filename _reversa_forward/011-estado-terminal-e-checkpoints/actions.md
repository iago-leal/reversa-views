# Actions: estado terminal da extração e conclusão dos checkpoints

> Identificador: `011-estado-terminal-e-checkpoints`
> Data: `2026-09-20`
> Roadmap: `_reversa_forward/011-estado-terminal-e-checkpoints/roadmap.md`

## Resumo

| Métrica | Valor |
|---------|-------|
| Total de ações | 34 |
| Paralelizáveis (`[//]`) | 23 |
| Maior cadeia de dependência | 8 |

Duas cadeias empatam em oito, e ambas terminam na tela. Pelo julgamento,
`T005 → T006 → T007 → T016 → T025 → T026 → T027 → T028`; pelas formas,
`T001 → T002 → T004 → T011 → T025 → T026 → T027 → T028`. Na primeira, as fixturas de
estado precedem a suíte do reconhecimento, que precede a dos três estados do checkpoint, de onde
sai a derivação que o vocabulário consome; só então a seção Descoberta ganha a frase de
encerramento, o terceiro estado e, por último, a sinalização dos campos de lista.

A feature tem duas frentes. A de julgamento vai de `T001` a `T021` e não toca a tela. A de tela vai
de `T009` a `T028` e trabalha contra as formas de `T001` e os construtores de `T004`, sem disco. As
duas se encontram na carga, em `T020`, e na composição da lista exibida, em `T022`.

Uma ordem não é negociável, e está no plano de migração do roadmap: o filtro da anomalia absorvida,
em `T022` e `T024`, não entra antes de `T017`, que é quem a reconhece. Ligá-lo antes produziria uma
construção intermediária que esconde anomalia legítima.

## Fase 1, Preparação

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T001 | Declarar as formas do eixo: `ExtractionSituation` e `ExtractionState` com o bruto ao lado do reconhecido, `CheckpointSituation` e `CheckpointState` com instante e `camposComLista`, `AbsorbedAnomaly`, `DiscoveryState` e a constante `EMPTY_DISCOVERY_STATE`, no molde de `EMPTY_GREENFIELD` (`data-delta.md` 2) | - | `[//]` | `src/domain/types.ts` | 🟢 | `[X]` |
| T002 | Declarar a união local `DiscoveryStateAnomalyCode`, com `checkpoint-sem-conclusao-declarada`, e a forma `DiscoveryStateAnomaly` na forma comum `DisplayAnomaly`, sem tocar a união fechada do herdado, com a prosa do precedente de `BugAnomalyCode` e `GreenfieldAnomalyCode` (D-02, `data-delta.md` 2.3) | T001 | - | `src/domain/types.ts` | 🟢 | `[X]` |
| T003 | Acrescentar `discoveryState` como campo opcional ao fim de `SetProcessData`, registrando na declaração que o protocolo cresce por acréscimo e que o tipo herdado continua atravessando sem transformação (D-07, `interfaces/protocolo-webview.md` 1) | T001 | `[//]` | `src/host/protocol.ts` | 🟢 | `[X]` |
| T004 | Estender os construtores de fixture da carga: eixo com as três situações da extração, checkpoints nos três estados, lista de absorvidas vazia e povoada, e a variante sem o campo, que simula host anterior | T002 | `[//]` | `tests/helpers/reversa-fixtures.ts` | 🟢 | `[X]` |
| T005 | Gravar as fixturas de `state.json` escritas aqui com as formas medidas em 2026-09-20, sem copiar arquivo de projeto de terceiro: a forma do `med-reversa`, com sete checkpoints em `at` e `status` e fase `concluido`; as cinco grafias de encerramento; fase com erro de digitação; checkpoint parcial com `modules_pending`; checkpoint sem `files` e com campos de lista de textos; e fase terminal com nome estranho em `completed` | - | `[//]` | `tests/fixtures/descoberta/` | 🟢 | `[X]` |

## Fase 2, Testes

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T006 | Escrever a suíte do reconhecimento da extração: as cinco grafias de encerramento reconhecidas, as cinco fases canônicas testadas antes e nunca confundidas com encerramento, o erro de digitação continuando desconhecido, fase ausente com nada concluído dando não iniciada, fase ausente com alguma concluída dando em curso, e o bruto preservado em todos os casos (D-04, D-05, RF-01 a RF-03) | T001, T005 | `[//]` | `tests/domain-discovery-state.spec.ts` | 🟢 | `[X]` |
| T007 | Escrever a suíte dos três estados do checkpoint: `completed_at` vencendo tudo, ausência dele com `modules_pending` não vazio dando em andamento e sem anomalia, o resto dando conclusão não declarada com anomalia que nomeia agente e campo, e o instante existindo apenas quando veio do campo canônico (D-06, RF-05 a RF-07) | T006 | - | `tests/domain-discovery-state.spec.ts` | 🟢 | `[X]` |
| T008 | Escrever a suíte da absorção: só `fase-desconhecida` é absorvida, só quando o detalhe é o valor reconhecido como encerramento, a identidade casa arquivo, código e detalhe, e a fixtura de fase terminal com nome estranho em `completed` deixa exatamente uma anomalia de fase em pé (D-02, `data-delta.md` 3) | T007 | - | `tests/domain-discovery-state.spec.ts` | 🟢 | `[X]` |
| T009 | Escrever a suíte da composição: sem o eixo, a lista devolvida é idêntica à soma de hoje, na mesma ordem; com ele, as absorvidas saem e as do eixo entram por último; e um host anterior não altera contagem nenhuma (D-03, `data-delta.md` 4) | T004 | `[//]` | `tests/webview-anomalies-view.spec.ts` | 🟢 | `[X]` |
| T010 | Estender a suíte da integridade: a contagem passa a vir da composição, o cabeçalho e a seção nunca discordam, e o processo com anomalia absorvida e nada mais deixa de declarar leitura degradada (D-03) | T004 | `[//]` | `tests/webview-integrity.spec.ts` | 🟢 | `[X]` |
| T011 | Estender a suíte dos rótulos: vocabulário das três situações da extração e dos três estados do checkpoint, `checkpointMark` lendo o estado derivado quando ele vem e caindo no comportamento herdado quando não vem, e o valor bruto sempre disponível ao lado do reconhecido | T004 | `[//]` | `tests/webview-labels.spec.ts` | 🟢 | `[X]` |
| T012 | Estender a suíte da seção Descoberta: a frase de encerramento aparecendo só com a extração encerrada, as cinco fases desenhadas em qualquer caso, `data-situacao` nos três valores, o instante ausente no terceiro estado, e a frase de projeto greenfield e a de encerramento nunca convivendo (D-09, RF-04) | T004 | `[//]` | `tests/webview-discovery-section.spec.tsx` | 🟢 | `[X]` |
| T013 | Conferir que os dois módulos novos caem sozinhos nas varreduras que já existem, `src/domain/discovery-state.ts` na de somente leitura, que percorre `src/domain` inteiro, e `src/webview/domain/anomalies-view.ts` na de fronteiras do webview; se caírem, nenhuma das duas suítes muda, e é isso que a ação registra | - | `[//]` | `tests/readonly-local.spec.ts` | 🟢 | `[X]` |
| T014 | Estender a suíte do protocolo: o campo novo é opcional, a ausência dele não quebra a webview, e nenhum campo existente muda de nome, tipo ou posição (D-07, `interfaces/protocolo-webview.md` 4) | T003 | `[//]` | `tests/host-protocol.spec.ts` | 🟢 | `[X]` |

## Fase 3, Núcleo

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T015 | Escrever o reconhecimento da situação da extração: partir o valor por `-` e `_`, normalizar cada segmento sem diacrítico e em caixa baixa, reconhecer encerramento quando algum segmento começa pela raiz `conclu`, com as cinco fases canônicas testadas antes, e preservar o bruto sem normalizar o disco (D-04, D-05, NG-05) | T006 | - | `src/domain/discovery-state.ts` | 🟢 | `[X]` |
| T016 | Escrever a derivação dos três estados do checkpoint, na precedência do `checkpoint-guide` do Reversa, com o instante lido apenas de `completed_at`, porque tirá-lo de `at` ou `data` seria afirmar conclusão pelo campo que não a declara (D-06) | T007, T015 | - | `src/domain/discovery-state.ts` | 🟢 | `[X]` |
| T017 | Escrever a anomalia própria do eixo e a lista de absorvidas, casando a tripla inteira e nunca o código sozinho, com a prosa de que absorver por código apagaria a anomalia do erro de digitação que o EC-02 existe para pegar (D-02, `data-delta.md` 3) | T008, T016 | - | `src/domain/discovery-state.ts` | 🟢 | `[X]` |
| T018 | Escrever `camposComLista`: os campos preservados em `extra` cujo valor é lista de textos, e apenas quando `files` está ausente, sem chamá-los de saídas em lugar nenhum, porque `achados`, `lacunas` e `adrs` têm a mesma forma e não são arquivos (D-08) | T016 | - | `src/domain/discovery-state.ts` | 🟡 | `[X]` |
| T019 | Escrever o caminho degradado do eixo: `state.json` ausente, ilegível ou sem objeto de checkpoints devolve `EMPTY_DISCOVERY_STATE` sem exceção, e a anomalia correspondente continua sendo a que a herança já registra, sem duplicata | T017 | - | `src/domain/discovery-state.ts` | 🟢 | `[X]` |

## Fase 4, Integração

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T020 | Acrescentar o ramo do eixo em `readWorkspace`, dentro do mesmo `try` dos outros quatro ramos locais, alimentado por `snapshot.stateJson` e pelo processo já julgado, com a prosa de que nenhum layout do Reversa é escrito aqui (D-01) | T017 | `[//]` | `src/host/reading.ts` | 🟢 | `[X]` |
| T021 | Estender a suíte de leitura do host: o eixo aparece na carga do estado `loaded`, e uma exceção no ramo novo continua virando o estado `error` nomeado, jamais uma exceção no editor | T020 | `[//]` | `tests/host-reading.spec.ts` | 🟢 | `[X]` |
| T022 | Escrever `composeAnomalies`, que devolve a lista exibida: as do processo menos as absorvidas, depois as do registro de bugs, as do eixo greenfield, as do eixo de entrega e, por fim, as deste eixo, preservando a ordem de hoje (D-03) | T009, T017 | `[//]` | `src/webview/domain/anomalies-view.ts` | 🟢 | `[X]` |
| T023 | Passar `readingIntegrity` a contar sobre a composição, em vez de somar as quatro listas por conta própria, com a prosa de que duas leituras do mesmo fato acabariam discordando (D-03) | T010, T022 | `[//]` | `src/webview/domain/integrity.ts` | 🟢 | `[X]` |
| T024 | Trocar a composição em linha da seção de anomalias pela chamada única, deixando de somar as quatro listas no lugar | T022 | `[//]` | `src/webview/ui/App.tsx` | 🟢 | `[X]` |
| T025 | Escrever o vocabulário das três situações da extração e dos três estados do checkpoint, e passar `checkpointMark` a ler o estado derivado, caindo no comportamento herdado quando o eixo não vem | T011, T016 | `[//]` | `src/webview/domain/labels.ts` | 🟢 | `[X]` |
| T026 | Desenhar a frase de encerramento como `<p data-part="discovery-closed">` acima das cinco fases, no molde literal da frase de projeto greenfield da feature 009, com o valor bruto ao lado (D-09, RF-04) | T012, T025 | - | `src/webview/ui/DiscoverySection.tsx` | 🟢 | `[X]` |
| T027 | Desenhar o terceiro estado do checkpoint, trocando `data-done` por `data-situacao` com os três valores, e mostrando instante apenas quando ele existe (RF-05, RF-06) | T026 | - | `src/webview/ui/DiscoverySection.tsx` | 🟢 | `[X]` |
| T028 | Desenhar a sinalização dos campos de lista ao lado do checkpoint, nomeando-os sem afirmar que são saídas e sem promovê-los a lista de arquivos (D-08, RF-11) | T018, T027 | - | `src/webview/ui/DiscoverySection.tsx` | 🟡 | `[X]` |

## Fase 5, Polimento

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T029 | Escrever o auxiliar que alcança os quatro estados que nenhum projeto saudável produz, copiando o workspace para pasta temporária do sistema e reescrevendo o `state.json` da cópia, com os casos `fase-estranha`, `parcial`, `terminal-e-estranha` e `saidas-nao-canonicas`, no molde de `estragar-workspace.js` | T005 | `[//]` | `scripts/estragar-descoberta.js` | 🟢 | `[X]` |
| T030 | Registrar o script `estragar:descoberta` ao lado dos três que já existem | T029 | `[//]` | `package.json` | 🟢 | `[X]` |
| T031 | Escrever a suíte do auxiliar: os quatro casos produzem o estado esperado, a cópia sai em pasta temporária, e nada é escrito no repositório nem no workspace de origem | T029 | `[//]` | `tests/preview-descoberta.spec.ts` | 🟢 | `[X]` |
| T032 | Corrigir o caminho do clone da origem para onde ele está nesta máquina, `~/HARNESS/scrum-harness`, no lugar do caminho de ambiente que não existe aqui (D-10) | - | `[//]` | `heranca.origens.yml` | 🟢 | `[X]` |
| T033 | Acrescentar a seção de pendências de origem, registrando que os dois achados desta feature foram resolvidos na camada local e que levá-los ao `scrum-harness` continua devido, sem criar adaptação e sem alterar carimbo algum (D-10) | - | `[//]` | `src/heranca/PROCEDENCIA.md` | 🟢 | `[X]` |
| T034 | Estender a suíte das adaptações para fixar que a seção de pendências não é lida como adaptação e que o total declarado continua dezesseis | T033 | `[//]` | `tests/heranca-adaptacoes.spec.ts` | 🟢 | `[X]` |

## Notas de execução

## Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-09-20 | Versão inicial gerada por `/reversa-to-do` | reversa |
