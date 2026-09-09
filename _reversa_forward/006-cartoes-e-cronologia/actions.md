# Actions: cartões e cronologia

> Identificador: `006-cartoes-e-cronologia`
> Data: `2026-09-09`
> Roadmap: `_reversa_forward/006-cartoes-e-cronologia/roadmap.md`

## Resumo

| Métrica | Valor |
|---------|-------|
| Total de ações | 44 |
| Paralelizáveis (`[//]`) | 30 |
| Maior cadeia de dependência | 9 |

A cadeia mais longa é `T001 → T002 → T006 → T017 → T036 → T039 → T040 → T042 → T044`: o campo novo da
preferência precede o vocabulário das seções, que precede a suíte reescrita, que precede o conjunto
efetivo de recolhidas, de onde saem o cabeçalho e a casca, e só então a renderização, a varredura de
instantes e o portão visual. É a espinha da feature, e tudo o mais pendura nela.

## Fase 1, Preparação

<!-- Setup, scaffolding, migrações iniciais, configuração de infraestrutura local. -->

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T001 | Acrescentar o campo `declared` a `DisplayPreferences` e a `EMPTY_PREFERENCES`, com a prosa que diz por que a lista vazia deixou de bastar (D-01, RF-05) | - | `[//]` | `src/webview/domain/types.ts` | 🟢 | `[X]` |
| T002 | Levar os nomes de seção de seis para oito, inserindo `decomposition` e `history` logo após `forward`, derivar dali a lista dos sete recolhíveis, que é o conjunto sem `blocking`, e acrescentar `history` ao padrão inicial de recolhimento (D-04, D-05, RF-18) | T001 | - | `src/webview/domain/types.ts` | 🟢 | `[X]` |
| T003 | Declarar num módulo local o vocabulário e as formas da decomposição e do histórico, conforme as seções 4.1 e 4.2 do `data-delta.md`, incluindo os dois eixos separados de situação e marca (D-07, D-19) | - | `[//]` | `src/domain/types.ts` | 🟢 | `[X]` |
| T004 | Declarar num módulo próprio os dois limites novos do tempo de execução, cinquenta pastas de feature por leitura e 65.536 bytes de texto de saída, seguindo o precedente de um lugar só para números (D-14, RNF de desempenho) | - | `[//]` | `src/domain/limits.ts` | 🟡 | `[X]` |

## Fase 2, Testes

<!-- Testes que precisam existir antes ou logo após o núcleo. -->

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T005 | Escrever a suíte da leitura da preferência com os seis casos da tabela do `data-delta.md`: estado ausente, lista não vazia sem o campo novo, lista vazia sem o campo, escolha declarada de nada recolhido, campo com tipo errado e nome de seção desconhecido (D-02, RF-05) | T001 | `[//]` | `tests/webview-preferences.spec.ts` | 🟢 | `[X]` |
| T006 | Reescrever a suíte das seções para o comportamento novo, trocando o caso que hoje afirma o defeito, e cobrir o conjunto efetivo de recolhidas, a lista dos recolhíveis e as duas transformações de expandir tudo e recolher tudo (D-01, D-03, RF-01, RF-02, RF-03) | T002 | `[//]` | `tests/webview-sections.spec.ts` | 🟢 | `[X]` |
| T007 | Escrever a suíte do instante em horário de Brasília: o formato com fuso declarado, a meia-noite, a virada de dia que o deslocamento provoca, o instante ausente e o texto que não é instante (D-15, RF-15, RF-16) | - | `[//]` | `tests/webview-instants.spec.ts` | 🟢 | `[X]` |
| T008 | Escrever a suíte da sonda local sobre pastas de fixtura: pastas lidas em ordem de nome, teto de cinquenta com truncamento relatado, pasta de feature ausente, e caminho que escapa da raiz recusado (D-06, RF-09, RNF de desempenho) | T003, T004 | `[//]` | `tests/probe-features.spec.ts` | 🟢 | `[X]` |
| T009 | Escrever a suíte do histórico: as quatro situações, as três marcas, a ordenação decrescente por nome de pasta, o adendo superado que não conta como convergência e os três degraus da derivação do resumo (D-16, D-18, D-19, RF-09, RN-06) | T003 | `[//]` | `tests/domain-history.spec.ts` | 🟢 | `[X]` |
| T010 | Escrever a suíte do leitor da decomposição: cabeçalho reconhecido por forma normalizada, cabeçalho divergente que cai para varredura linha a linha, linha da seção de emendas marcada como emenda, e divergência entre a contagem herdada e o comprimento da lista (D-08, D-09, RF-06, RN-04, RN-05) | T003 | `[//]` | `tests/domain-decomposition.spec.ts` | 🟢 | `[X]` |
| T011 | Escrever a suíte do recorte da decomposição: todas as abertas mais as cinco fechadas mais recentes pela trilha, ação fechada sem evento posicionada pela ordem do arquivo, contagem total preservada e revelação do resto (D-13, D-17, RF-07, RF-11, RN-10) | T003 | `[//]` | `tests/webview-decomposition-view.spec.ts` | 🟢 | `[X]` |
| T012 | Escrever a suíte do texto do resumo: composição a partir do histórico e da feature ativa, projeto sem feature alguma, determinismo entre duas montagens sobre o mesmo processo (D-11, RF-12, RF-17) | T003 | `[//]` | `tests/webview-summary.spec.ts` | 🟢 | `[X]` |
| T013 | Estender a suíte do roteador com os dois comandos novos e as quatro regras de validação: texto ausente, texto vazio, texto acima do teto e título não textual, cada recusa sem efeito e com linha de log (D-14, contrato seção 3.1) | T004 | `[//]` | `tests/host-router.spec.ts` | 🟢 | `[X]` |
| T014 | Escrever a suíte de somente leitura do código local novo, análoga à herdada: módulo de plataforma apenas onde a leitura acontece, nenhuma interface exportada com nome que sugira escrita, nenhuma chamada de escrita ou de execução (D-06, RNF de segurança) | - | `[//]` | `tests/readonly-local.spec.ts` | 🟢 | `[X]` |
| T015 | Endurecer a suíte de fronteiras do host para recusar também a via de escrita do próprio editor e a de sistema de arquivos assíncrona, com caso que falha se qualquer uma delas for usada (D-13, RNF de segurança) | - | `[//]` | `tests/host-boundaries.spec.ts` | 🟢 | `[X]` |

## Fase 3, Núcleo

<!-- Lógica central da feature. -->

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T016 | Reescrever a leitura da preferência para honrar o campo novo e acrescentar a transformação que recolhe ou expande todas as seções de uma vez, devolvendo sempre preferência declarada (D-01, D-02, RF-02, RF-03, RF-05) | T005 | `[//]` | `src/webview/domain/preferences.ts` | 🟢 | `[X]` |
| T017 | Substituir a decisão de recolhimento inicial pela do conjunto efetivo, que só aplica o padrão quando não há escolha declarada, e expor a lista dos cartões recolhíveis que as ações globais percorrem (D-03, D-04, RF-01) | T006 | `[//]` | `src/webview/domain/sections.ts` | 🟢 | `[X]` |
| T018 | Escrever a função que converte instante para o fuso de Brasília, montando o texto pelas partes do formatador, e devolvendo declaração de ausência para entrada que não é instante (D-15, RF-15) | T007 | `[//]` | `src/webview/domain/instants.ts` | 🟢 | `[X]` |
| T019 | Escrever a sonda local que percorre as pastas de feature reutilizando as três funções de leitura exportadas pela sonda herdada, sem importar módulo de plataforma e sem tocar arquivo vendorizado (D-06, RF-09) | T008 | `[//]` | `src/probe/features.ts` | 🟢 | `[X]` |
| T020 | Escrever o leitor da tabela de ações, com cabeçalho casado por forma normalizada, células lidas por posição, fase herdada do título de segundo nível e queda para varredura quando o cabeçalho não casar (D-09, RF-06) | T010 | `[//]` | `src/domain/decomposition.ts` | 🟢 | `[X]` |
| T021 | Acrescentar ao leitor da decomposição a conferência contra a contagem herdada, preenchendo o campo de divergência quando os dois números discordarem, sem que a lista jamais mude a contagem (D-08, RF-14) | T020 | - | `src/domain/decomposition.ts` | 🟢 | `[X]` |
| T022 | Escrever o domínio do histórico: situação derivada da contagem e do adendo, marca derivada do ponteiro do Reversa, ordenação decrescente por nome de pasta e resumo em três degraus (D-16, D-18, D-19, RF-09) | T009 | `[//]` | `src/domain/history.ts` | 🟢 | `[X]` |
| T023 | Escrever o recorte da decomposição para a tela: abertas mais as cinco fechadas mais recentes, recência tirada do último evento da trilha, e a contagem total sempre à vista (D-13, RF-07, RF-11, RN-10) | T011 | `[//]` | `src/webview/domain/decomposition-view.ts` | 🟢 | `[X]` |
| T024 | Escrever a composição do texto do resumo a partir do histórico e da feature ativa, em função pura, com os rótulos legíveis que a tela já tem (D-11, RF-12, RF-17) | T012 | `[//]` | `src/webview/domain/summary.ts` | 🟢 | `[X]` |

## Fase 4, Integração

<!-- Cola com outras partes do sistema, contratos externos, hooks. -->

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T025 | Acrescentar ao protocolo os dois campos de `setProcess` e os dois comandos da webview, por acréscimo, mantendo intactos os nomes, a ordem e o comando reservado de despacho (D-10, contrato seções 2 e 3) | T003 | - | `src/host/protocol.ts` | 🟢 | `[X]` |
| T026 | Compor na leitura do host o ramo local ao lado do herdado, chamando a sonda local e os dois domínios novos, e mantendo toda exceção capturada como está (D-06, D-07, RF-09) | T019, T021, T022, T025 | - | `src/host/reading.ts` | 🟢 | `[X]` |
| T027 | Levar os dois ramos novos ao payload da sessão, sem alterar a ordem das mensagens nem o tratamento de erro e de pasta ausente (D-10, contrato seção 2) | T026 | - | `src/host/session.ts` | 🟢 | `[X]` |
| T028 | Declarar as duas portas novas, uma para abrir documento não salvo e outra para a área de transferência, deixando a porta que abre arquivo exatamente como está (D-12, RF-12, RF-17) | T025 | `[//]` | `src/host/ports.ts` | 🟢 | `[X]` |
| T029 | Implementar as duas portas novas no único arquivo que já traduz o editor, sem decisão alguma dentro delas (D-12, RF-12, RF-17) | T028 | - | `src/host/adapters.ts` | 🟢 | `[X]` |
| T030 | Tratar no roteador os dois comandos novos, aplicando as quatro regras de validação antes de tocar qualquer colaborador, e registrando cada recusa com o comando nomeado (D-14, contrato seção 3.1) | T013, T025, T028 | - | `src/host/router.ts` | 🟢 | `[X]` |
| T031 | Receber as duas portas novas no provedor da view e repassá-las ao roteador, sem que ele ganhe conhecimento do que o texto contém (D-12) | T028 | - | `src/host/provider.ts` | 🟢 | `[X]` |
| T032 | Fiar as portas novas na ativação, ao lado das que já existem, mantendo a ativação sem leitura de disco (D-12) | T029, T031 | - | `src/extension.ts` | 🟢 | `[X]` |
| T033 | Acrescentar à ponte da webview os dois comandos de saída, mantendo o ponto único de travessia e a recusa de caminho absoluto que já existe (D-10, D-11) | T025 | `[//]` | `src/webview/bridge/messaging.ts` | 🟢 | `[X]` |
| T034 | Desenhar o cartão da decomposição, com a lista recortada, a próxima ação destacada, a fase de cada linha, a trilha por ação e o controle que revela o resto (RF-06, RF-07, RF-08, RF-11, RF-13) | T018, T023 | `[//]` | `src/webview/ui/DecompositionSection.tsx` | 🟢 | `[X]` |
| T035 | Desenhar o cartão do histórico, uma linha por pasta de feature, com situação, marca, contagem, resumo e o nome do artefato clicável, mais a declaração de truncamento quando houver (RF-09, RF-10, RF-13) | T018, T022 | `[//]` | `src/webview/ui/HistorySection.tsx` | 🟢 | `[X]` |
| T036 | Acrescentar ao cabeçalho as quatro ações novas, expandir tudo, recolher tudo, resumir e copiar, com a indisponibilidade declarada quando a ação não teria efeito, e sem deslocar o lugar reservado do despacho (RF-02, RF-03, RF-04, RF-12, RF-17) | T017, T024, T033 | - | `src/webview/ui/Header.tsx` | 🟢 | `[X]` |
| T037 | Montar os dois cartões novos na ordem declarada, cada um dentro do seu limite de erro, sem que nenhum componente passe a nomear mais de uma seção (RF-18, RN-11) | T034, T035, T017 | - | `src/webview/ui/App.tsx` | 🟢 | `[X]` |
| T038 | Trocar o instante cru pelo texto convertido no cabeçalho e nos checkpoints da descoberta, guardando o valor original no atributo consultável (RF-15, RF-16) | T018 | `[//]` | `src/webview/ui/DiscoverySection.tsx` | 🟢 | `[X]` |
| T039 | Segurar na casca o estado da preferência com o campo novo e ligar os quatro gestos do cabeçalho, gravando sempre preferência declarada e enviando o texto pronto ao host (D-01, D-11, RF-01, RF-12, RF-17) | T016, T033, T036 | - | `src/webview/main.tsx` | 🟢 | `[X]` |
| T040 | Estender a suíte de renderização para os dois cartões novos, as quatro ações do cabeçalho e a ordem dos sete recolhíveis, verificando por atributo de dados e não por texto (RF-18, RNF de manutenibilidade) | T037, T039 | - | `tests/webview-render.spec.tsx` | 🟢 | `[X]` |

## Fase 5, Polimento

<!-- Logs, telemetria, mensagens, documentação curta. -->

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T041 | Escrever os estilos dos dois cartões novos, do destaque da próxima ação, da linha de situação do histórico e da ação de cabeçalho indisponível, sem medida em pixel e sem paleta própria (RNF de usabilidade, RNF de acessibilidade) | T037 | `[//]` | `src/webview/theme/theme.css` | 🟢 | `[X]` |
| T042 | Escrever a suíte que varre o documento renderizado atrás de instante em tempo universal cru, e falha se encontrar qualquer um, que é o critério de pronto do horário (RF-15) | T038, T040 | `[//]` | `tests/webview-instants-render.spec.tsx` | 🟡 | `[X]` |
| T043 | Acrescentar ao README a seção das quatro ações do cabeçalho, do horário de Brasília e do que o resumo reúne, em prosa curta para quem volta depois de meses (RNF de manutenibilidade) | T039 | `[//]` | `README.md` | 🟢 | `[X]` |
| T044 | Rodar o preview fora do editor nos estados novos, observar os dois cartões e as quatro ações na tela, medir o pacote contra o teto e registrar as duas evidências, que é o portão de saída herdado (RNF de observabilidade, critério de pronto) | T041, T042 | - | `_reversa_forward/006-cartoes-e-cronologia/progress.jsonl` | 🟢 | `[X]` |

## Notas de execução

O teste de renderização, T040, e o do instante no documento, T042, vivem fora da fase de testes de
propósito: eles exercitam a cola, e não a decisão, de modo que só existem depois dos componentes.
Toda regra que pode estar errada sozinha tem teste na fase 2, antes do código correspondente, e é
essa a ordem que a entrega deve respeitar.

T006 troca um caso que hoje passa. Isso é esperado e está justificado no `investigation.md`: o caso
descreve a regra antiga, que o `requirements.md` alterou por decisão registrada. Nenhum outro caso
verde deve ser afrouxado durante esta feature, e nenhum arquivo de `src/heranca/` pode ser tocado.

T044 não é encerrável por suíte verde. O portão de saída deste projeto é visual por decisão da spec
do painel, e a evidência é a observação da tela no preview, registrada na trilha.

## Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-09-09 | Versão inicial gerada por `/reversa-to-do` | reversa |
