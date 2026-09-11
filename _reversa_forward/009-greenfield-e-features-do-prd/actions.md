# Actions: greenfield e features do PRD

> Identificador: `009-greenfield-e-features-do-prd`
> Data: `2026-09-11`
> Roadmap: `_reversa_forward/009-greenfield-e-features-do-prd/roadmap.md`

## Resumo

| Métrica | Valor |
|---------|-------|
| Total de ações | 46 |
| Paralelizáveis (`[//]`) | 40 |
| Maior cadeia de dependência | 9 |

A cadeia mais longa é `T002 → T003 → T007 → T027 → T029 → T033 → T034 → T042 → T043`: as formas
precedem a união de anomalias, que precede a suíte do eixo, que precede o julgamento do estágio, de
onde sai o panorama cruzado, que a camada de leitura consome, que a sessão põe no payload, e só
então o estragador alcança os estados que nenhum projeto saudável produz, e a suíte dele os prova.
É a espinha da frente de leitura.

A feature tem duas frentes quase independentes, como a 008 teve. A frente de leitura vai de `T001`
a `T029` e não toca a tela. A frente de tela vai de `T004` a `T041` e não depende de disco: quem
tocar apenas a tela trabalha contra as formas de `T002` e as fixtures de `T006`, e `T017 → T031`,
`T018 → T030`, `T019 → T032`, `T020 → T035` e `T021 → T036` correm enquanto a outra frente ainda está
no leitor de escopo. As duas se encontram em `T033` e `T037`.

## Fase 1, Preparação

<!-- Setup, scaffolding, migrações iniciais, configuração de infraestrutura local. -->

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T001 | Acrescentar os sete literais dos artefatos greenfield e da âncora legada, `newproject-brief.md`, `ideation.md`, `personas.md`, `prd.md`, `sdd`, `architecture.md` e `domain.md`, e os tetos `SPEC_CAP` e `SCOPE_ITEM_CAP` de cinquenta, com a prosa que declara a duplicação em relação aos skills e por que é aceita (D-18, `data-delta.md` 5) | - | `[//]` | `src/domain/limits.ts` | 🟢 | `[X]` |
| T002 | Declarar as formas do eixo: os seis estágios físicos, os quatro cenários, o metadado tolerante, `GreenfieldAxis`, as quatro situações de componente, `PlannedComponent`, `UnplannedFeature`, `ScopeItem` e `ProductPanorama`, com a tabela de projeção de situação na prosa (`data-delta.md` 4.1 a 4.3) | - | `[//]` | `src/domain/types.ts` | 🟢 | `[X]` |
| T003 | Declarar a união local dos quatro códigos de anomalia do eixo e a forma `GreenfieldAnomaly`, na forma comum que a seção de anomalias já recebe, sem tocar na união fechada do pacote herdado (D-19, `data-delta.md` 4.5) | T002 | - | `src/domain/types.ts` | 🟢 | `[X]` |
| T004 | Acrescentar os nomes `panorama`, depois de `decomposition`, e `origem`, depois de `discovery`, à ordem das seções, e `origem` ao recolhimento padrão, sem tocar em nome, posição ou derivação existente (D-14, RF-13, RF-14) | - | `[//]` | `src/webview/domain/types.ts` | 🟢 | `[X]` |
| T005 | Acrescentar o campo `greenfield` ao payload da leitura, ao fim dos campos existentes e sem renomear nem reordenar nenhum, com a prosa que diz que a ausência dele é leitura não realizada e não projeto legado (D-13, RN-08) | T002 | `[//]` | `src/host/protocol.ts` | 🟢 | `[X]` |
| T006 | Escrever os construtores de fixture do eixo e do panorama, no molde dos de histórico e de bugs: um eixo saudável com os cinco componentes deste projeto, um legado, um sem âncora, um parcial, e um panorama com as quatro situações e uma pasta fora do plano, para as suítes da tela e do host trabalharem contra a mesma forma | T002 | `[//]` | `tests/helpers/reversa-fixtures.ts` | 🟢 | `[X]` |

## Fase 2, Testes

<!-- Testes que precisam existir antes ou logo após o núcleo. -->

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T007 | Escrever a suíte do julgamento do estágio: os seis estágios pela presença contígua, buraco na sequência que não avança e abre anomalia, os conjuntos de tokens aceitos por estágio com o caso do metadado um passo atrás no modo guiado, divergência que nomeia os dois valores, os quatro cenários pela regra de âncora, o metadado ausente, inválido e com tipo errado sem falha, e o resumo em três passos (D-02 a D-05, D-12, RN-01 a RN-03) | T003 | `[//]` | `tests/domain-greenfield.spec.ts` | 🟢 | `[X]` |
| T008 | Escrever a suíte do panorama cruzado: casamento exato após minúsculas e diacríticos, hífen preservado, projeção das quatro situações do histórico, marca ao lado sem se misturar, pasta sem spec como fora do plano, `nomeCurto` nulo que nunca casa, spec duplicada declarada, contagem de convergidos, e o teto de specs declarado ao cortar (D-06 a D-09, RN-05 a RN-07, RN-10) | T003 | `[//]` | `tests/domain-greenfield-panorama.spec.ts` | 🟢 | `[X]` |
| T009 | Gravar as fixtures de PRD, uma por linha da mecânica do leitor: o `prd.md` real transcrito, sem seção de escopo, só com não-objetivos, com título "Escopo" sem parêntese, com selos nos dois lados, com item sem dois-pontos e com mais de cinquenta itens | - | `[//]` | `tests/fixtures/prd/` | 🟡 | `[X]` |
| T010 | Escrever a suíte do leitor restrito de escopo sobre as fixtures: o PRD real com seus grupos e itens, título com e sem "(in)", seção só de não-objetivos que não conta, nome antes do dois-pontos, primeira frase sem dois-pontos, selo de confidência retirado no início e no fim, negrito retirado, subitem recuado ignorado, PRD sem seção como anomalia, PRD ausente sem anomalia, e o teto de itens (D-10, RN-14) | T009 | `[//]` | `tests/domain-prd-scope.spec.ts` | 🟡 | `[X]` |
| T011 | Escrever a suíte da sonda sobre árvore sintética: os quatro artefatos presentes, nenhum presente, `sdd/` ausente, `sdd/` vazia, `sdd/` com arquivo que não é `.md`, corpo acima do teto declarado em truncados, e caminho fora da raiz recusado, provando que só dois corpos são lidos (D-01, D-11, RF-01, RF-22) | T001 | `[//]` | `tests/probe-greenfield.spec.ts` | 🟢 | `[X]` |
| T012 | Estender a suíte de somente leitura do código local para varrer os três módulos novos de sonda e domínio, recusando módulo de plataforma, escrita e execução de processo em todos eles (requisito não funcional de segurança) | - | `[//]` | `tests/readonly-local.spec.ts` | 🟢 | `[X]` |
| T013 | Estender a suíte de fronteira do host com os nomes dos artefatos greenfield e os nomes dos agentes da pipeline, `ideator`, `researcher`, `drafter` e `spec-sdd`, para que nenhum literal do Reversa entre no host por esta feature (RN-09) | - | `[//]` | `tests/host-boundaries.spec.ts` | 🟢 | `[X]` |
| T014 | Estender a suíte das seções para os dois nomes novos: onze na ordem declarada, `panorama` entre decomposição e histórico, `origem` entre extração e política, ambos nos cartões recolhíveis, só `origem` no recolhimento padrão, e ambos alcançados pelas duas ações globais (RF-13, RF-14) | T004 | `[//]` | `tests/webview-sections.spec.ts` | 🟢 | `[X]` |
| T015 | Estender a suíte do protocolo para contar dez campos por nome, os nove anteriores intactos, e o décimo ausente lido como leitura não realizada (D-13) | T005 | `[//]` | `tests/host-protocol.spec.ts` | 🟢 | `[X]` |
| T016 | Estender a suíte das preferências para os dois nomes novos: preferência gravada por versão anterior continua válida e deixa os dois cartões abertos, e `panorama` e `origem` passam a ser nomes aceitos em vez de descartados (plano de migração, passo 4) | T004 | `[//]` | `tests/webview-preferences.spec.ts` | 🟢 | `[X]` |
| T017 | Escrever a suíte da função pura do panorama: grupos na ordem em andamento, planejada, entregue e convergida, ativa à frente do grupo em andamento, nome dentro de cada grupo, duas passagens idênticas com a mesma saída, contagem desenhada medida contra a da leitura, e truncamento declarado (D-15, RF-12) | T006 | `[//]` | `tests/webview-panorama-view.spec.ts` | 🟢 | `[X]` |
| T018 | Estender a suíte dos rótulos para estágio físico, cenário, modo, situação de componente e estado de etapa, verificando que valor fora do vocabulário volta desenhado cru e marcado como não reconhecido (RF-20) | T002 | `[//]` | `tests/webview-labels.spec.ts` | 🟢 | `[X]` |
| T019 | Estender a suíte da faixa de bloqueio para o terceiro argumento: razão com estágio, próximo agente e comando quando o cenário é greenfield antes de `especificado`, com e sem feature ativa; nenhuma razão em legado, sem âncora, `especificado` ou eixo ausente; e a ordem das razões anteriores preservada (D-17, RF-16) | T006 | `[//]` | `tests/webview-blocking.spec.ts` | 🟢 | `[X]` |
| T020 | Escrever a suíte de marcação do cartão do panorama sobre o documento renderizado: a linha de contagem e a barra, cada componente com spec e adendo clicáveis e a marca, o bloco fora do plano, o bloco de escopo recolhido por padrão e aberto pelo controle próprio com `prd.md` clicável, e os três vazios nomeados (RF-11, RF-15, D-16) | T006 | `[//]` | `tests/webview-panorama-section.spec.tsx` | 🟢 | `[X]` |
| T021 | Escrever a suíte de marcação do cartão da origem: estágio no título, cenário, modo, linha de resumo, as quatro etapas sempre desenhadas com concluído, corrente ou pendente, artefatos clicáveis, último checkpoint em Brasília, modo desconhecido cru e marcado, o lugar reservado do brainstorm com seu atributo de dado, e os vazios (RF-10, RF-24, D-20) | T006 | `[//]` | `tests/webview-origin-section.spec.tsx` | 🟢 | `[X]` |
| T022 | Estender a suíte do texto de resumo para o bloco "Panorama do produto" entre a feature ativa e as entregas anteriores, com a contagem, os componentes por situação e os fora do plano, determinístico em duas chamadas, e a linha de leitura não realizada quando o campo falta (RF-18) | T006 | `[//]` | `tests/webview-summary.spec.ts` | 🟢 | `[X]` |
| T023 | Estender a suíte da camada de leitura para o eixo no payload, incluindo o projeto legado que devolve cenário legado sem anomalia, o projeto sem pasta de saída que devolve sem âncora, e a sonda que lança e vira estado de erro nomeado sem derrubar os outros campos (RF-08, RF-09) | T005 | `[//]` | `tests/host-reading.spec.ts` | 🟢 | `[X]` |
| T024 | Escrever a suíte da integridade da leitura com o eixo: anomalias do eixo somadas às do processo e do registro, e uma perda no eixo abrindo a seção de anomalias pelo mesmo caminho que as demais perdas já abrem (RF-19) | T006 | `[//]` | `tests/webview-integrity.spec.ts` | 🟢 | `[X]` |
| T025 | Escrever a suíte de marcação do cartão da extração com a frase de projeto greenfield sem fase concluída, presente apenas nesse caso e ausente em legado, em misto e quando alguma fase foi concluída (RF-17, RN-12) | T006 | `[//]` | `tests/webview-discovery-section.spec.tsx` | 🟢 | `[X]` |

## Fase 3, Núcleo

<!-- Lógica central da feature. -->

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T026 | Escrever a sonda do eixo: presença dos seis arquivos de `limits.ts` sob a pasta de saída, lista de `sdd/` filtrada a `.md` com o teto e a contagem total ao lado, corpo do brief e do PRD por `readText` sob o teto herdado, truncados declarados, caminho fora da raiz recusado, reutilizando as três funções da sonda herdada (D-01, D-11) | T001, T011 | `[//]` | `src/probe/greenfield.ts` | 🟢 | `[X]` |
| T027 | Escrever o julgamento do estágio e do metadado: `newproject_progress` lido de `snapshot.stateJson` pelos utilitários herdados de JSON, estágio como maior contíguo presente, anomalia de buraco, conjuntos de tokens por estágio e anomalia de divergência, cenário pela regra de âncora, resumo em três passos e caminhos relativos para abrir (D-02 a D-05, D-12) | T003, T007 | `[//]` | `src/domain/greenfield.ts` | 🟢 | `[X]` |
| T028 | Escrever o leitor restrito de escopo do PRD: seções de nível dois, reutilizando `splitSections` do herdado se a chave permitir normalizar o título e divisão local caso contrário, escolha da seção pela regra de RN-14, grupo por parágrafo em negrito, item de topo por marcador sem recuo, selo e negrito retirados, nome antes do dois-pontos ou primeira frase, anomalia de seção ausente, e o teto declarado (D-10) | T001, T010 | `[//]` | `src/domain/prd-scope.ts` | 🟡 | `[X]` |
| T029 | Cruzar as specs com o histórico no mesmo módulo do julgamento: chave normalizada dos dois lados, projeção da situação pela tabela, marca ao lado, fora do plano para o que não casa, spec duplicada, contagem de convergidos e total de specs preservado como autoridade sobre a lista, e o escopo do leitor de T028 acoplado ao panorama (D-06 a D-09, RN-05 a RN-07) | T027, T028, T008 | - | `src/domain/greenfield.ts` | 🟢 | `[X]` |
| T030 | Escrever os rótulos de estágio físico, cenário, modo, situação de componente e estado de etapa no mesmo molde dos que já existem, devolvendo valor bruto e marca de não reconhecido para o que estiver fora do vocabulário (RF-20) | T018 | `[//]` | `src/webview/domain/labels.ts` | 🟢 | `[X]` |
| T031 | Escrever a função que decide ordem e agrupamento do panorama numa passagem só: os quatro grupos na ordem declarada, ativa à frente, nome dentro do grupo, a contagem da leitura conferida contra a lista e a divergência declarada, o truncamento nomeado (D-15, RF-12) | T017 | `[//]` | `src/webview/domain/panorama-view.ts` | 🟢 | `[X]` |
| T032 | Estender a função da faixa de bloqueio para receber o eixo como terceiro argumento, opcional, e produzir a razão da pipeline incompleta nomeando estágio, próximo agente e comando, mantendo a ordem das razões existentes (D-17, RF-16) | T019 | `[//]` | `src/webview/domain/blocking.ts` | 🟢 | `[X]` |

## Fase 4, Integração

<!-- Cola com outras partes do sistema, contratos externos, ganchos. -->

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T033 | Ligar a sonda e o julgamento à camada de leitura, dentro do mesmo bloco protegido que já cobre histórico e registro, passando ao julgamento o histórico já lido e o `stateJson` do snapshot, de modo que uma leitura que lance vire o estado de erro nomeado, e não exceção no editor (D-13, RF-09) | T026, T029, T023 | - | `src/host/reading.ts` | 🟢 | `[X]` |
| T034 | Pôr o eixo no payload que a sessão monta, ao lado do registro de bugs, sem tocar no que já viaja (D-13) | T005, T033 | - | `src/host/session.ts` | 🟢 | `[X]` |
| T035 | Escrever o cartão do panorama, que só chama as funções puras: linha de contagem com `ProgressBar`, componentes por grupo com spec e adendo abrindo por `openFile`, bloco fora do plano, bloco de escopo recolhível com estado próprio e `prd.md` clicável, e os três vazios (RF-11, RF-15, D-15, D-16) | T030, T031, T020 | `[//]` | `src/webview/ui/PanoramaSection.tsx` | 🟢 | `[X]` |
| T036 | Escrever o cartão da origem: estágio no título, cenário, modo, resumo, as quatro etapas com estado e artefato clicável, último checkpoint por `brasiliaInstant`, o lugar reservado do brainstorm com atributo de dado, e os vazios (RF-10, RF-24, D-20) | T030, T021 | `[//]` | `src/webview/ui/OriginSection.tsx` | 🟢 | `[X]` |
| T037 | Montar os dois cartões no painel nas posições que a ordem das seções declara, cada um com fronteira de erro própria e a porta de abrir arquivo, passar o eixo à faixa de bloqueio como terceiro argumento, passar o cenário à extração, e mesclar as anomalias do eixo na lista da seção de anomalias (RF-13, RF-16, RF-19) | T035, T036, T032 | - | `src/webview/ui/App.tsx` | 🟢 | `[X]` |
| T038 | Acrescentar ao cartão da extração a frase de projeto greenfield sem fase concluída, condicionada ao cenário recebido e à ausência de fase concluída, sem tocar no resto do desenho (RF-17) | T025 | `[//]` | `src/webview/ui/DiscoverySection.tsx` | 🟢 | `[X]` |
| T039 | Contar as anomalias do eixo na integridade da leitura, ao lado das do processo e do registro, de modo que uma perda no eixo abra a seção de anomalias pelo mesmo caminho (D-19, RF-19) | T024 | `[//]` | `src/webview/domain/integrity.ts` | 🟢 | `[X]` |
| T040 | Acrescentar ao texto de resumo o bloco "Panorama do produto" entre os dois blocos existentes, com contagem, componentes por situação, fora do plano e a linha de leitura não realizada quando o campo falta, sem tocar nos blocos anteriores (RF-18) | T022 | `[//]` | `src/webview/domain/summary.ts` | 🟢 | `[X]` |
| T041 | Nomear na folha os estilos dos dois cartões, etapa com estado, linha de componente, grupo de situação, bloco de escopo recolhível e lugar reservado, com estado distinguível sem cor e sem rolagem horizontal a 300 px, usando tokens já importados para que o podador os preserve (requisito não funcional de acessibilidade) | - | `[//]` | `src/webview/theme/theme.css` | 🟢 | `[X]` |

## Fase 5, Polimento

<!-- Logs, telemetria, mensagens de erro, documentação curta. -->

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T042 | Dar ao preview um caminho para os estados que nenhum projeto saudável produz, `sem-ancora`, `parcial`, `divergente`, `sdd-vazio`, `sem-escopo` e `teto`, no mesmo molde do estragador do registro, copiando o workspace para pasta temporária e adoecendo a cópia, sem que o preview escreva coisa alguma (D-21, RF-21) | T034 | `[//]` | `scripts/estragar-greenfield.js` | 🟢 | `[X]` |
| T043 | Escrever a suíte do estragador: cada caso produz a árvore que o onboarding descreve, o caso inválido é recusado nomeando os que existem, o workspace de origem não é tocado e a cópia fica fora do repositório | T042 | - | `tests/preview-greenfield.spec.ts` | 🟢 | `[X]` |
| T044 | Acrescentar à tabela do gate visual do README as seis linhas dos casos novos, no molde das linhas do registro de bugs, e uma frase sobre o que cada uma prova (RF-21) | T042 | `[//]` | `README.md` | 🟢 | `[X]` |
| T045 | Medir o pacote da tela contra o teto na suíte que já o mede, registrando o número medido ao lado do teto, e confirmar que os dois cartões cabem no orçamento em vez de afrouxá-lo (requisito não funcional de tamanho) | T037 | `[//]` | `tests/webview-build.spec.ts` | 🟢 | `[X]` |
| T046 | Estender a referência de desempenho para a leitura com o eixo e para a pintura com os dois cartões, de modo que leitura e julgamento sigam abaixo de 200 ms e a pintura abaixo de 100 ms com os artefatos deste projeto (requisito não funcional de desempenho) | T034 | `[//]` | `tests/desempenho-referencia.spec.ts` | 🟡 | `[X]` |

## Notas de execução

<!--
Reservado para /reversa-coding registrar avisos ou observações que surgiram durante a execução.
Não use isso para corrigir ações, edits manuais ficam fora desse arquivo, vão direto no código.
-->

## Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-09-11 | Versão inicial gerada por `/reversa-to-do` | reversa |
