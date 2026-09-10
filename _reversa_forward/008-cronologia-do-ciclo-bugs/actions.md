# Actions: cronologia do ciclo de bugs

> Identificador: `008-cronologia-do-ciclo-bugs`
> Data: `2026-09-10`
> Roadmap: `_reversa_forward/008-cronologia-do-ciclo-bugs/roadmap.md`

## Resumo

| Métrica | Valor |
|---------|-------|
| Total de ações | 38 |
| Paralelizáveis (`[//]`) | 30 |
| Maior cadeia de dependência | 9 |

A cadeia mais longa é `T001 → T007 → T008 → T020 → T022 → T023 → T027 → T028 → T036`: a apuração
contra os arquivos reais precede as fixtures, que precedem a suíte do interpretador, que precede o
interpretador, de onde sai o julgamento, que precisa dos grupos, que a camada de leitura consome, que
a sessão põe no payload, e só então o preview alcança os estados que não acontecem por acaso. É a
espinha da frente de leitura.

A feature tem duas frentes quase independentes, e elas só se encontram na integração. A frente de
leitura vai de `T002` a `T028` e não toca a tela. A frente de tela vai de `T005` a `T026` e não
depende de disco: `T012 → T026`, `T014 → T024`, `T015 → T025` e `T013 → T031` podem correr enquanto a
outra frente ainda está no interpretador. Quem tocar apenas a tela consegue trabalhar contra formas
declaradas em `T003`, sem esperar que exista leitura alguma.

## Fase 1, Preparação

<!-- Setup, scaffolding, migrações iniciais, configuração de infraestrutura local. -->

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T001 | Apurar contra os três `bug.md` reais o que o leitor restrito precisa atravessar sem tropeçar, título com dois-pontos, blocos aninhados com listas de objetos em forma de fluxo e `blocking` como lista vazia, e registrar o achado em seção nova do `investigation.md` (D-02, D-03) | - | `[//]` | `_reversa_forward/008-cronologia-do-ciclo-bugs/investigation.md` | 🟡 | `[X]` |
| T002 | Acrescentar o teto de cinquenta bugs por passagem e o nome da pasta do registro, com a prosa que declara a duplicação do literal em relação ao pacote herdado e por que ela é aceita (D-13) | - | `[//]` | `src/domain/limits.ts` | 🟡 | `[X]` |
| T003 | Declarar os tipos do registro, entrada de bug, grupo de contexto e registro do projeto, com os quatro vocabulários fechados de estado, fase, severidade e prioridade, e o par valor reconhecido e valor bruto em cada um deles (`data-delta.md` 4.1 a 4.3) | - | `[//]` | `src/domain/types.ts` | 🟢 | `[X]` |
| T004 | Declarar a união local de códigos de anomalia do registro e a forma estrutural comum que a seção de anomalias passa a receber, sem tocar na união fechada do pacote herdado (D-04) | T003 | - | `src/domain/types.ts` | 🟢 | `[X]` |
| T005 | Acrescentar o nome `bugs` à ordem das seções, logo depois do histórico, e ao conjunto do recolhimento padrão, sem tocar em nome, posição ou derivação existente (D-09, RF-01) | - | `[//]` | `src/webview/domain/types.ts` | 🟢 | `[X]` |
| T006 | Acrescentar o campo `bugs` ao payload da leitura, ao fim dos campos existentes e sem renomear nem reordenar nenhum, com a prosa que diz o que a ausência dele significa (D-10) | T003 | `[//]` | `src/host/protocol.ts` | 🟢 | `[X]` |

## Fase 2, Testes

<!-- Testes que precisam existir antes ou logo após o núcleo. -->

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T007 | Gravar as fixtures de front matter, uma por linha da tabela de desvios do contrato: os três reais transcritos, sem bloco, bloco truncado, estado fora do vocabulário, data malformada, `blocking` com item, visibilidade restrita e título com dois-pontos | T001 | `[//]` | `tests/fixtures/registro-de-bugs/` | 🟡 | `[X]` |
| T008 | Escrever a suíte do interpretador restrito sobre as fixtures, um caso por desvio, fixando também que bloco aninhado e escalar de várias linhas voltam como campo não lido, e nunca como valor inventado (D-03) | T007 | `[//]` | `tests/domain-front-matter.spec.ts` | 🟢 | `[X]` |
| T009 | Escrever a suíte da sonda e do julgamento sobre árvore sintética: contexto único, dois contextos, contexto sem pasta de bugs, teto estourado, registro ausente, bug restrito, resolvido sem trava e trava sem resolvido | T003, T004 | `[//]` | `tests/domain-bugs.spec.ts` | 🟢 | `[X]` |
| T010 | Escrever a suíte que prova que nenhum caminho sob `generated/`, `intake/` ou `inspections/` é aberto, espionando as três funções de leitura que a sonda usa, e que apagar a projeção não altera o que a leitura devolve (RF-11) | T003 | `[//]` | `tests/bugs-sem-projecao.spec.ts` | 🟢 | `[X]` |
| T011 | Estender a suíte de somente leitura do código local para varrer também os módulos novos, recusando módulo de plataforma, escrita e execução de processo em todos eles (requisito não funcional de segurança) | - | `[//]` | `tests/readonly-local.spec.ts` | 🟢 | `[X]` |
| T012 | Escrever a suíte das funções puras do bloco: ordem entre grupos pelo movimento mais recente, não encerrados à frente dentro do grupo, empate de data preservando a ordem de leitura em duas passagens idênticas, registro sem data ao fim da metade a que pertence, recorte por grupo e destaque único no bloco inteiro (RN-07, RN-10, RF-07, RF-08) | T003 | `[//]` | `tests/webview-bugs-view.spec.ts` | 🟢 | `[X]` |
| T013 | Estender a suíte da faixa de bloqueio para as três condições do registro, fixando que um bug que reúna duas delas ocupa uma linha só com as duas razões nomeadas, e que sem nenhuma a faixa não ganha linha de bug (RF-10) | T003 | `[//]` | `tests/webview-blocking.spec.ts` | 🟢 | `[X]` |
| T014 | Estender a suíte dos instantes com os casos da data: um dia que a conversão de fuso recuaria, data ausente, data vazia e data malformada, cada um declarado por nome em vez de desenhado em branco (D-05, RN-06) | - | `[//]` | `tests/webview-instants.spec.ts` | 🟢 | `[X]` |
| T015 | Estender a suíte dos rótulos para estado, fase, severidade e prioridade, verificando que valor fora do vocabulário volta desenhado cru e marcado como não reconhecido (RF-12) | T003 | `[//]` | `tests/webview-labels.spec.ts` | 🟢 | `[X]` |
| T016 | Escrever a suíte de marcação do cartão sobre o documento renderizado: posição depois do histórico, repartição do topo com os zeros escritos por nome, subtítulo e contagem de cada grupo, três datas na linha encerrada, marca única, e os três estados vazios de RF-13 (RF-02, RF-04, RF-05, RF-06) | T005 | `[//]` | `tests/webview-bugs-section.spec.tsx` | 🟢 | `[X]` |
| T017 | Estender a suíte das seções para o nome novo: entra na ordem depois do histórico, entra nos cartões recolhíveis, entra no recolhimento padrão, e é alcançado pelas duas ações globais (RF-01) | T005 | `[//]` | `tests/webview-sections.spec.ts` | 🟢 | `[X]` |
| T018 | Estender a suíte da camada de leitura para o registro no payload, incluindo o caso de projeto sem pasta de registro, que precisa devolver registro ausente sem anomalia e sem exceção (RF-13) | T006 | `[//]` | `tests/host-reading.spec.ts` | 🟢 | `[X]` |
| T019 | Estender a suíte das preferências para o nome novo: preferência gravada por versão anterior continua válida, e `bugs` passa a ser nome aceito em vez de descartado | T005 | `[//]` | `tests/webview-preferences.spec.ts` | 🟢 | `[X]` |

## Fase 3, Núcleo

<!-- Lógica central da feature. -->

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T020 | Escrever o interpretador restrito de front matter: recorta o bloco entre as marcas, lê chave e valor escalar de topo, remove aspas, preserva o valor com dois-pontos no meio, distingue lista vazia de lista com itens e devolve como não lido tudo o que não reconhece (D-02, D-03) | T008 | `[//]` | `src/domain/front-matter.ts` | 🟢 | `[X]` |
| T021 | Escrever a sonda do registro: percorre os contextos, desce apenas em `bugs/`, lê os nomes de cada pasta de bug uma vez para achar o `bug.md` e a trava, aplica o teto e devolve quantos existem ao lado de quantos foram lidos, reutilizando as três funções que a sonda herdada exporta (D-01, D-12, D-13) | T002, T009 | `[//]` | `src/probe/bugs.ts` | 🟢 | `[X]` |
| T022 | Escrever o julgamento de um bug: campos reconhecidos ao lado dos brutos, data do encerramento extraída da linha da trava, as duas assimetrias de RN-04 declaradas sem escolher entre elas, filtro do bug restrito antes de qualquer montagem, e uma anomalia nomeada por perda (D-11, D-14, RF-12, RF-16) | T004, T020, T021 | - | `src/domain/bugs.ts` | 🟢 | `[X]` |
| T023 | Agrupar por contexto no mesmo módulo: contagem própria de cada grupo, contagem do projeto contada à parte, último movimento de cada grupo, e a contagem do disco preservada como autoridade sobre a lista (RN-05, RN-09, D-15) | T022 | - | `src/domain/bugs.ts` | 🟢 | `[X]` |
| T024 | Escrever a função irmã da conversão de instante, que reformata a data sem construir `Date` e sem tocar em fuso, com a prosa que diz por que reusar a conversão de instante recuaria um dia (D-05) | T014 | `[//]` | `src/webview/domain/instants.ts` | 🟢 | `[X]` |
| T025 | Escrever os rótulos de estado, fase, severidade e prioridade no mesmo molde dos que já existem, devolvendo valor bruto e marca de não reconhecido para o que estiver fora do vocabulário (RF-12) | T015 | `[//]` | `src/webview/domain/labels.ts` | 🟢 | `[X]` |
| T026 | Escrever a função que decide ordem, recorte e destaque numa passagem só: grupos pelo movimento mais recente, não encerrados à frente, encerrados por recência, sem data ao fim de cada metade, cinco encerrados por grupo no recorte padrão e um único próximo a tratar no bloco inteiro (D-06, D-07, RN-07, RN-10) | T012 | `[//]` | `src/webview/domain/bugs-view.ts` | 🟢 | `[X]` |

## Fase 4, Integração

<!-- Cola com outras partes do sistema, contratos externos, ganchos. -->

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T027 | Ligar a sonda e o julgamento à camada de leitura, dentro do mesmo bloco protegido que já cobre a varredura das pastas de feature, de modo que uma caminhada que lance vire o estado de erro nomeado, e não exceção no editor | T021, T023 | - | `src/host/reading.ts` | 🟢 | `[X]` |
| T028 | Pôr o registro no payload que a sessão monta, ao lado da decomposição e do histórico, sem tocar no que já viaja (D-10) | T006, T027 | - | `src/host/session.ts` | 🟢 | `[X]` |
| T029 | Escrever o cartão do registro, que só chama as funções puras: topo com repartição e barra medida pela contagem do registro, subtítulo e contagem por grupo, linha com os dez campos ou a declaração de ausência de cada um, controle de revelação próprio de cada grupo, e o identificador como o único elemento que pede a abertura do arquivo (RF-02 a RF-09, RF-13, RF-15, RF-16) | T016, T024, T025, T026 | `[//]` | `src/webview/ui/BugsSection.tsx` | 🟢 | `[X]` |
| T030 | Montar o cartão no painel, na posição que a ordem das seções declara, com fronteira de erro própria e a porta de abrir arquivo que os outros cartões já recebem | T029 | - | `src/webview/ui/App.tsx` | 🟢 | `[X]` |
| T031 | Estender a função da faixa de bloqueio para receber o registro ao lado do processo e produzir as três condições, cada uma nomeando a razão e o bug, com fusão numa linha só quando um bug reunir mais de uma (D-08, RF-10) | T013 | `[//]` | `src/webview/domain/blocking.ts` | 🟢 | `[X]` |
| T032 | Passar o registro à faixa a partir do ponto de montagem, mantendo a ordem declarada das razões e sem que o cartão fale com a faixa por outra via | T030, T031 | - | `src/webview/ui/App.tsx` | 🟢 | `[X]` |
| T033 | Fazer a seção de anomalias receber a forma estrutural comum e desenhar as duas origens na mesma lista, sem tabela de tradução nova e sem que um código desconhecido quebre o desenho (D-04, RF-12) | T004 | `[//]` | `src/webview/ui/AnomaliesSection.tsx` | 🟢 | `[X]` |
| T034 | Contar as anomalias do registro na integridade da leitura, de modo que uma perda na leitura dos bugs abra a seção de anomalias pelo mesmo caminho que as demais perdas já abrem | T033 | - | `src/webview/domain/integrity.ts` | 🟢 | `[X]` |
| T035 | Nomear na folha os estilos do bloco, subtítulo de grupo, linha de bug e marca do próximo a tratar, com estado distinguível sem cor e sem rolagem horizontal a 300 px, usando tokens já importados para que o podador os preserve (requisito não funcional de acessibilidade) | T029 | `[//]` | `src/webview/theme/theme.css` | 🟡 | `[X]` |

## Fase 5, Polimento

<!-- Logs, telemetria, mensagens de erro, documentação curta. -->

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T036 | Dar ao preview um caminho para os estados do registro que nenhum projeto saudável produz, registro ausente, bug restrito, bug inconsistente e leitura acima do teto, no mesmo molde do estragador de workspace que já existe, sem que o preview escreva coisa alguma | T028 | `[//]` | `scripts/preview.js` | 🟡 | `[X]` |
| T037 | Medir o pacote da tela contra o teto na suíte que já o mede, registrando o número medido ao lado do teto, e confirmar que o cartão novo cabe no orçamento em vez de afrouxá-lo | T029 | `[//]` | `tests/webview-build.spec.ts` | 🟢 | `[X]` |
| T038 | Estender a referência de desempenho para o payload com registro, de modo que a pintura do bloco depois da chegada do processo continue abaixo do teto declarado na spec do painel | T028 | `[//]` | `tests/desempenho-referencia.spec.ts` | 🟡 | `[X]` |

## Notas de execução

<!--
Reservado para /reversa-coding registrar avisos ou observações que surgiram durante a execução.
Não use isso para corrigir ações, edits manuais ficam fora desse arquivo, vão direto no código.
-->

Seis decisões foram tomadas durante a execução, cada uma diante de ambiguidade que a spec não
resolvia. Ficam aqui porque quem reler o código daqui a meses vai encontrar a decisão, e não a
dúvida que a produziu.

**Chave de topo é chave na coluna zero (T001).** A apuração contra os três `bug.md` reais achou
que dois deles trazem `- id: CHG-001` recuado sob `change_set:`. Um leitor que aparasse a linha
antes de cortar a chave trocaria o identificador do bug pelo do conjunto de mudanças, em silêncio
e sem anomalia alguma. O leitor de front matter passou então a exigir coluna zero, e a suíte fixa
o caso. Era achado que o plano não previa, e teria virado defeito invisível.

**A marca do próximo a tratar é o primeiro não encerrado do bloco, não do primeiro grupo.** RN-10
escreve "o primeiro não encerrado do primeiro grupo", e as duas leituras coincidem sempre que o
primeiro grupo tem um. Elas se separam quando ele não tem: a ordem entre grupos é por movimento
mais recente, e um bug encerrado também produz movimento, de modo que o grupo da frente pode não
ter nada aguardando ninguém. Ler a regra ao pé da letra deixaria o bloco sem marca enquanto um bug
espera, que é o oposto do que RF-06 pede.

**"Severidade alta" em RF-10 cobre `critical` e `high`.** O vocabulário tem quatro severidades, e
a expressão da regra não nomeia nenhuma. Tratar só `high` deixaria o mais grave de fora, que é
leitura que ninguém defenderia.

**A assimetria de RF-10 foi preservada.** Só a condição de severidade é condicionada a "enquanto
não estiver encerrado"; a fase de espera e o bloqueio declarado não são. A regra está escrita
assim, e o painel a cumpre como está escrita, em vez de uniformizar por conta própria. Se a
assimetria for engano da spec, o conserto é na spec.

**A contagem do projeto soma a repartição dos grupos, e o total vem do disco.** Acima do teto de
leitura as duas coisas divergem por construção, e é `lidos` mais `truncado` que declaram a
diferença. Uniformizar as duas esconderia justamente o que RF-15 manda mostrar.

**A guarda de orçamento do pacote da tela mede metade do teto, e não o teto.** Repetir o número do
teto no teste violaria RN-06 da feature 005, que manda o valor morar num lugar só, e a suíte de
limites pegou a repetição. Exigir metade dá à próxima feature o mesmo espaço que esta encontrou,
sem duplicar constante alguma.

## Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-09-10 | Versão inicial gerada por `/reversa-to-do` | reversa |
