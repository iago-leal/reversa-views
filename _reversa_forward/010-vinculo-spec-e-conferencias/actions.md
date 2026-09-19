# Actions: vínculo entre spec e entrega, e conferências do onboarding

> Identificador: `010-vinculo-spec-e-conferencias`
> Data: `2026-09-19`
> Roadmap: `_reversa_forward/010-vinculo-spec-e-conferencias/roadmap.md`

## Resumo

| Métrica | Valor |
|---------|-------|
| Total de ações | 44 |
| Paralelizáveis (`[//]`) | 33 |
| Maior cadeia de dependência | 10 |

A cadeia mais longa é `T006 → T007 → T024 → T025 → T026 → T029 → T030 → T033 → T040 → T041`.
As fixtures textuais precedem a suíte do vínculo, que precede o reconhecimento das tabelas de
impacto, a declaração de spec e o vínculo por pasta. Deste sai o cruzamento em duas passagens e
depois os componentes sem spec, que a camada de leitura consome, e só então o estragador alcança os
estados que este repositório não produz, e a suíte dele os prova.

A feature tem duas frentes, como a 009. A frente de leitura vai de `T006` a `T033` e não toca a
tela. A frente de tela vai de `T015` a `T039` e trabalha contra as formas de `T002` e os construtores
de `T005`, sem disco. As duas se encontram na carga, em `T033`, e no pacote medido, em `T043`.

## Fase 1, Preparação

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T001 | Acrescentar os literais `legacy-impact.md` e `onboarding.md` e o teto `CONFERENCE_ROW_CAP` de cem, com a prosa que declara a duplicação em relação aos skills e o precedente de `SCOPE_ITEM_CAP` (D-11, `data-delta.md` 7) | - | `[//]` | `src/domain/limits.ts` | 🟢 | `[X]` |
| T002 | Declarar as formas novas, `DeliveryLinkState`, `ConferenceState`, `ConferenceLine`, `ConferenceRecord`, `ComponentLink` e `UnspecifiedComponent`, e os campos opcionais ao fim de `HistoryEntry` (`vinculo`, `conferencias`), `ProjectHistory` (`anomalias`), `PlannedComponent` (`ligacoes`) e `ProductPanorama` (`semSpec`, `vinculoParcial`), com a prosa de que ausente é leitura não realizada (D-11, D-13, `data-delta.md` 3 a 6) | - | `[//]` | `src/domain/types.ts` | 🟡 | `[X]` |
| T003 | Declarar a união local `DeliveryAnomalyCode`, com `tabela-nao-reconhecida` e `artefato-da-entrega-nao-lido`, e a forma `DeliveryAnomaly` na forma comum `DisplayAnomaly`, sem tocar a união fechada do herdado, com a prosa do que de propósito não é anomalia (D-12, `data-delta.md` 4) | T002 | - | `src/domain/types.ts` | 🟢 | `[X]` |
| T004 | Registrar na declaração do contrato que os campos novos da 010 entram por acréscimo dentro de estruturas existentes, e que o topo de `SetProcessData` continua com dez campos (RF-10, `interfaces/protocolo-webview.md` 1) | T002 | `[//]` | `src/host/protocol.ts` | 🟢 | `[X]` |
| T005 | Estender os construtores de fixture da carga: entrada do histórico com vínculo nos três estados e conferência nos seis, histórico com anomalias do eixo, componente com ligações `nome` e `declarada`, panorama com três componentes sem spec e com vínculo parcial, e as variantes sem os campos novos, que simulam host anterior | T003 | `[//]` | `tests/helpers/reversa-fixtures.ts` | 🟢 | `[X]` |
| T006 | Gravar as fixtures textuais escritas com as formas medidas em 2026-09-19, sem copiar arquivo de terceiro: `legacy-impact.md` com nome nu, com crases e várias specs por célula, com prosa e caminho entre parênteses, com tabela de mapeamento e seis tabelas de impacto, com coluna `Componente (spec de origem)`, e sem tabela de impacto; `onboarding.md` com vinte linhas e duas registradas, sem a seção, com a seção sem coluna `Data`, com tabela vazia, com linha só de traços, e com mais de cem linhas (D-19) | - | `[//]` | `tests/fixtures/vinculo/` | 🟢 | `[X]` |

## Fase 2, Testes

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T007 | Escrever a suíte do vínculo: todas as tabelas de impacto percorridas e a de mapeamento excluída, colunas em qualquer posição com anotação e artigo tolerados; célula que declara nas três formas medidas, com e sem `.md` e `sdd/`, e `painel-do-processo-v2` que não declara `painel-do-processo`; componente sem spec para `assistente` e `` `acesso-e-identidade` ``, e nenhum para "Verificação local", "Tema", "(todos)" e `docker-compose.yml` (D-02 a D-04, RN-01, RN-04) | T006 | `[//]` | `tests/domain-delivery-link.spec.ts` | 🟢 | `[X]` |
| T008 | Escrever a suíte das conferências: seção pelo começo do título sem numeração, tabela pelas colunas `Data` e `Resultado` em qualquer posição, `Marco`, `Item` e `Observação` opcionais, linha registrada com "não executável", linha só de traços ignorada, os seis estados, a anomalia com seção e cabeçalho no detalhe, e o teto de linhas com o total preservado (D-09 a D-11, RN-05, RN-06) | T003, T006 | `[//]` | `tests/domain-conferences.spec.ts` | 🟡 | `[X]` |
| T009 | Estender a suíte da sonda de pastas sobre árvore sintética: os dois arquivos novos lidos, ausente distinto de presente e acima do teto em `naoLidos`, e no máximo cem arquivos novos para cinquenta pastas (D-01, RF-01) | T001 | `[//]` | `tests/probe-features.spec.ts` | 🟢 | `[X]` |
| T010 | Estender a suíte do histórico: cada entrada com `vinculo` e `conferencias`, anomalias do eixo reunidas em `anomalias`, e pasta convergida com linhas pendentes que continua `convergida` (RN-07, RF-06, RF-07) | T005 | `[//]` | `tests/domain-history.spec.ts` | 🟢 | `[X]` |
| T011 | Estender a suíte do panorama: nome com precedência, declaração só para spec sem pasta homônima, este repositório idêntico ao da 009 com 006 a 009 fora do plano, a forma do `financas-ali` com cinco specs ligadas e cinco planejadas, origem de cada ligação, três componentes sem spec com situação da pasta mais avançada e fora do denominador, e vínculo parcial declarado (D-06 a D-08, RN-02 a RN-04, RF-03, RF-05) | T005, T006 | `[//]` | `tests/domain-greenfield-panorama.spec.ts` | 🟢 | `[X]` |
| T012 | Estender a suíte de somente leitura para varrer `delivery-link.ts` e `conferences.ts`, recusando módulo `node:`, escrita e processo (RNF de segurança) | - | `[//]` | `tests/readonly-local.spec.ts` | 🟢 | `[X]` |
| T013 | Estender a suíte de fronteira do host com os literais `legacy-impact.md` e `onboarding.md`, para que nenhum layout do Reversa entre no host por esta feature | - | `[//]` | `tests/host-boundaries.spec.ts` | 🟢 | `[X]` |
| T014 | Estender a suíte do protocolo: topo ainda com dez campos, campos novos opcionais e ao fim das quatro estruturas, e carga sem eles aceita como leitura não realizada (D-13, RF-10) | T004 | `[//]` | `tests/host-protocol.spec.ts` | 🟢 | `[X]` |
| T015 | Estender a suíte da faixa de bloqueio: pasta convergida com conferências pendentes não produz razão, e as razões existentes não mudam de ordem (D-14, RF-08) | T005 | `[//]` | `tests/webview-blocking.spec.ts` | 🟢 | `[X]` |
| T016 | Estender a suíte da função pura do panorama: componentes sem spec ordenados por nome, origem das ligações preservada, duas passagens com a mesma saída, e campo ausente sem bloco (D-16) | T005 | `[//]` | `tests/webview-panorama-view.spec.ts` | 🟢 | `[X]` |
| T017 | Estender a suíte dos rótulos para a origem da ligação ("pelo nome", "declarada") e para os seis estados de conferência, com valor fora do vocabulário desenhado cru e marcado | T002 | `[//]` | `tests/webview-labels.spec.ts` | 🟢 | `[X]` |
| T018 | Estender a suíte de marcação do cartão do panorama: origem em texto em cada pasta, ligação declarada abrindo o `legacy-impact.md`, bloco "Entregues sem spec" entre os grupos e "Fora do plano", frase quando não há componente sem spec, frase de contagem separada, vínculo parcial dito, e "vínculo declarado não lido" sem bloco vazio para host anterior (RF-04, RF-13, D-15, D-16) | T005 | `[//]` | `tests/webview-panorama-section.spec.tsx` | 🟢 | `[X]` |
| T019 | Estender a suíte dos cartões do histórico: "N de M conferências registradas" ao lado da situação, contagem abrindo o `onboarding.md`, "sem registro de conferências" nomeado, os demais estados nomeados, e "conferências não lidas" para host anterior (RF-07, RN-06) | T005 | `[//]` | `tests/webview-progress-cards.spec.tsx` | 🟢 | `[X]` |
| T020 | Estender a suíte do resumo: linhas dos componentes sem spec no bloco do panorama, contagem de conferências por pasta no bloco das entregas, texto idêntico em duas chamadas, e linha de leitura não realizada quando os campos faltam (RF-12, D-17) | T005 | `[//]` | `tests/webview-summary.spec.ts` | 🟢 | `[X]` |
| T021 | Estender a suíte da integridade: anomalias do histórico somadas às do processo, do registro e do eixo greenfield, abrindo a seção de anomalias pelo mesmo caminho, e nada somado quando o campo falta (D-12, RF-11) | T005 | `[//]` | `tests/webview-integrity.spec.ts` | 🟢 | `[X]` |
| T022 | Estender a suíte da camada de leitura: vínculo e conferência na carga, ligação declarada chegando ao panorama, e exceção da leitura nova virando o estado de erro nomeado (RF-10, RF-11) | T005 | `[//]` | `tests/host-reading.spec.ts` | 🟢 | `[X]` |

## Fase 3, Núcleo

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T023 | Estender a sonda de pastas: guardar a listagem já feita no teste de diretório, ler `legacy-impact.md` e `onboarding.md` por `readText`, e declarar em `naoLidos` o arquivo listado cujo texto voltou nulo, sem importar módulo de plataforma (D-01, RF-01, RN-09) | T001, T009 | `[//]` | `src/probe/features.ts` | 🟢 | `[X]` |
| T024 | Escrever o reconhecimento das tabelas de impacto: chave de coluna local com `normalizeCell`, sem artigo e sem anotação final, a duplicação declarada na prosa, todas as tabelas percorridas por `cellsOf`, e as linhas da coluna `Componente` com o número de tabelas (D-02) | T007 | - | `src/domain/delivery-link.ts` | 🟢 | `[X]` |
| T025 | Escrever `declaresSpec`, pela delimitação de D-03 após minúsculas e diacríticos, e `soleComponent`, pelo padrão kebab de D-04 após retirar crases e negrito que envolvam a célula inteira | T024 | - | `src/domain/delivery-link.ts` | 🟢 | `[X]` |
| T026 | Escrever `readDeliveryLinks(pastas)`: por pasta, estado `lido`, `ausente` ou `nao-lido`, caminho do arquivo, número de tabelas e células distintas na ordem de leitura (D-05, `data-delta.md` 2) | T025, T023 | - | `src/domain/delivery-link.ts` | 🟢 | `[X]` |
| T027 | Escrever `readConferences()`: seção, tabela, colunas por nome, regra de linha registrada, os seis estados, as duas anomalias com detalhe e o teto de linhas com o total preservado (D-09 a D-11, RN-05, RN-06) | T008 | `[//]` | `src/domain/conferences.ts` | 🟡 | `[X]` |
| T028 | Anexar a cada entrada do histórico o `vinculo`, vindo do vínculo por pasta, e as `conferencias`, vindas de `readConferences()`, e reunir as anomalias do eixo em `ProjectHistory.anomalias`, sem alterar a regra de situação (D-05, D-12, RN-07) | T026, T027, T010 | - | `src/domain/history.ts` | 🟢 | `[X]` |
| T029 | Ligar spec e pasta em duas passagens em `panoramaOf()`: nome primeiro; declaração só para spec sem pasta homônima; `ligacoes` com a origem e o `legacy-impact.md`; "Fora do plano" pelos dois caminhos (D-06, D-07, RN-02, RN-03) | T026, T011 | - | `src/domain/greenfield.ts` | 🟢 | `[X]` |
| T030 | Produzir `semSpec` e `vinculoParcial`, com `componentOf()` generalizado para servir às duas listas pela mesma projeção e pela mesma regra de avanço, fora de `convergidos` e do denominador (D-08, RN-04, RF-04, RF-05) | T029 | - | `src/domain/greenfield.ts` | 🟢 | `[X]` |
| T031 | Escrever os rótulos da origem da ligação e dos seis estados de conferência no molde dos existentes, com valor bruto e marca para o que estiver fora do vocabulário | T017 | `[//]` | `src/webview/domain/labels.ts` | 🟢 | `[X]` |
| T032 | Estender `panoramaView()` com a lista de componentes sem spec ordenada por nome, na mesma passagem que ordena os grupos (D-16) | T016 | `[//]` | `src/webview/domain/panorama-view.ts` | 🟢 | `[X]` |

## Fase 4, Integração

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T033 | Chamar `readDeliveryLinks()` na camada de leitura, dentro do mesmo `try`, e passar o resultado a `readHistory()` e a `readGreenfield()`, sem escrever layout do Reversa no host (D-05, RF-10) | T028, T030, T022 | - | `src/host/reading.ts` | 🟢 | `[X]` |
| T034 | Desenhar no cartão do panorama a origem de cada ligação em texto, a ligação declarada clicável por `openFile`, o bloco "Entregues sem spec" com frase de contagem própria, a frase de vínculo parcial e a de vínculo não lido (RF-04, RF-13, D-15, D-16) | T031, T032, T018 | `[//]` | `src/webview/ui/PanoramaSection.tsx` | 🟢 | `[X]` |
| T035 | Desenhar no histórico "N de M conferências registradas" ao lado da situação, clicável para o `onboarding.md`, e os demais estados por frase, com "conferências não lidas" para host anterior (RF-07, RN-06) | T031, T019 | `[//]` | `src/webview/ui/HistorySection.tsx` | 🟢 | `[X]` |
| T036 | Acrescentar ao resumo as linhas dos componentes sem spec e a contagem de conferências por pasta, pela mesma função pura, sem tocar nas linhas existentes (RF-12, D-17) | T020, T032 | `[//]` | `src/webview/domain/summary.ts` | 🟢 | `[X]` |
| T037 | Contar as anomalias do histórico na integridade da leitura, ao lado das demais, e nada quando o campo falta (D-12, RF-11) | T021 | `[//]` | `src/webview/domain/integrity.ts` | 🟢 | `[X]` |
| T038 | Mesclar as anomalias do histórico na lista da seção de anomalias, depois das do eixo greenfield (RF-11) | T003 | `[//]` | `src/webview/ui/App.tsx` | 🟢 | `[X]` |
| T039 | Nomear na folha os estilos da origem da ligação, do bloco "Entregues sem spec" e da contagem de conferências, distinguíveis sem cor e sem rolagem horizontal a 300 px, com tokens já importados (RNF de acessibilidade) | T034, T035 | - | `src/webview/theme/theme.css` | 🟢 | `[X]` |

## Fase 5, Polimento

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T040 | Escrever o estragador do vínculo no molde de `estragar-greenfield.js`, copiando o workspace para pasta temporária, com os casos `declarada`, `sem-spec`, `conferencias`, `conferencias-sem-tabela` e `impacto-grande`, e recusando caso inválido com a lista dos existentes (D-18, RF-14) | T033 | - | `scripts/estragar-vinculo.js` | 🟢 | `[X]` |
| T041 | Escrever a suíte do estragador: cada caso produz o estado que o `onboarding.md` descreve, pela leitura real, o workspace de origem fica intocado e a cópia fica fora do repositório (RF-14) | T040 | - | `tests/preview-vinculo.spec.ts` | 🟢 | `[X]` |
| T042 | Acrescentar à tabela do gate visual do README as cinco linhas dos casos novos, com o que cada uma prova (RF-14) | T040 | `[//]` | `README.md` | 🟢 | `[X]` |
| T043 | Medir o pacote da tela na suíte que já o mede, com o número escrito ao lado do teto de 409.600 bytes e da guarda de 60 % (RNF de tamanho) | T038, T039 | `[//]` | `tests/webview-build.spec.ts` | 🟢 | `[X]` |
| T044 | Estender a referência de desempenho para a leitura com os dois arquivos a mais por pasta, abaixo de 200 ms, com a medida registrada (RNF de desempenho) | T033 | `[//]` | `tests/desempenho-referencia.spec.ts` | 🟢 | `[X]` |

## Notas de execução

## Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-09-19 | Versão inicial gerada por `/reversa-to-do` | reversa |
