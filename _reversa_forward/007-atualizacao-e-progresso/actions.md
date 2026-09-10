# Actions: verificação de atualização e progresso visível

> Identificador: `007-atualizacao-e-progresso`
> Data: `2026-09-09`
> Roadmap: `_reversa_forward/007-atualizacao-e-progresso/roadmap.md`

## Resumo

| Métrica | Valor |
|---------|-------|
| Total de ações | 47 |
| Paralelizáveis (`[//]`) | 31 |
| Maior cadeia de dependência | 7 |

A cadeia mais longa é `T008 → T017 → T028 → T029 → T030 → T031 → T046`: o comando novo no protocolo
precede a suíte do canal, que precede a ponte da tela, de onde sai o campo de estado, que o ponto de
montagem distribui, que o cabeçalho desenha, e só então o portão visual pode olhar o que foi feito.
É a espinha da frente de atualização.

A feature tem duas frentes quase independentes. Quem tocar apenas a tela pode executar `T014 → T022`
e `T018 → T023 → T024 → T032, T033, T034` sem esperar nada da frente de rede. As duas só se
encontram no portão visual, ao fim.

## Fase 1, Preparação

<!-- Setup, scaffolding, migrações iniciais, configuração de infraestrutura local. -->

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T001 | Confirmar por chamada real a semântica de `status`, `ahead_by` e `behind_by` da rota de comparação, com base no commit de construção e cabeça no ramo padrão, e registrar o achado em seção nova do `investigation.md` (D-03) | - | `[//]` | `_reversa_forward/007-atualizacao-e-progresso/investigation.md` | 🟡 | `[X]` |
| T002 | Confirmar qual cliente de requisição o Node do editor instalado oferece, e se a configuração de proxy do usuário é respeitada sem código nosso, registrando no mesmo lugar (D-05) | - | `[//]` | `_reversa_forward/007-atualizacao-e-progresso/investigation.md` | 🟡 | `[X]` |
| T003 | Escrever o auxiliar único de chamada ao git, com os três usos que o projeto precisa, revisão corrente, primeiro commit que acrescentou um arquivo e contagem entre dois pontos, e erro nomeado quando o comando falha ou não existe (D-13) | - | `[//]` | `scripts/git.js` | 🟢 | `[X]` |
| T004 | Reapontar a leitura da herança para o auxiliar novo, sem mudar comportamento observável nem a suíte que já o cobre (D-13) | T003 | - | `scripts/heranca/leitura.js` | 🟢 | `[X]` |
| T005 | Escrever a derivação da versão pelo maior número de feature com adendo e pela contagem de commits desde o commit que acrescentou aquele arquivo, com recuo declarado para `0.0.0` e causa impressa quando não houver clone ou adendo (D-09, D-10, RF-18, RF-21) | T003 | - | `scripts/versao.js` | 🟢 | `[X]` |
| T006 | Escrever o gerador do carimbo da construção, que grava versão derivada, commit inteiro e origem normalizada para dono e repositório, com origem nula quando não houver remoto conhecido (D-07, RF-17) | T003, T005 | - | `scripts/gerar-carimbo-da-construcao.js` | 🟢 | `[X]` |
| T007 | Encadear a geração do carimbo no build, antes da compilação e no mesmo lugar em que a revisão do modelo já é gerada, declarar o comando avulso e marcar o arquivo gerado como não versionado, que é o que o distingue da revisão do modelo (D-07, D-19) | T006 | - | `package.json` | 🟢 | `[X]` |
| T008 | Declarar as sete variantes do desfecho da consulta e acrescentar `setUpdate` ao fim da lista de comandos do host e da união de mensagens, sem tocar em nome, ordem ou campo existente (D-02) | - | `[//]` | `src/host/protocol.ts` | 🟢 | `[X]` |
| T009 | Declarar a porta de consulta à origem e a porta de configuração, cada uma com um método só, ao lado das portas que já existem e com a prosa que diz por que a rede não é fatia do editor (D-01, D-11) | - | `[//]` | `src/host/ports.ts` | 🟢 | `[X]` |
| T010 | Contribuir a chave de configuração da conferência, booleana e verdadeira por padrão, com título e descrição em português, sob o mesmo prefixo dos comandos já declarados (D-11, RF-14) | - | `[//]` | `package.json` | 🟡 | `[X]` |

## Fase 2, Testes

<!-- Testes que precisam existir antes ou logo após o núcleo. -->

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T011 | Gravar as respostas da origem como fixtures, uma por linha da tabela de desfechos do contrato, incluindo o 404 do commit desconhecido, a recusa por cota e um corpo sem os campos esperados | T001 | `[//]` | `tests/fixtures/consulta-a-origem/` | 🟡 | `[X]` |
| T012 | Escrever a suíte do intérprete sobre as fixtures, um caso por desfecho, verificando também que campo ausente ou de tipo errado vira resposta inesperada em vez de exceção (RF-10, RF-15, RF-16) | T008, T011 | - | `tests/host-update.spec.ts` | 🟡 | `[X]` |
| T013 | Escrever a suíte da derivação da versão: maior número contra quantidade de adendos, monotonicidade com adendo apagado no meio, ausência de clone e ausência de adendo (RF-18, RF-19, RF-21) | T005 | `[//]` | `tests/versao.spec.ts` | 🟢 | `[X]` |
| T014 | Reescrever a suíte do recorte da decomposição para fixar a ordem nova, incluindo o caso de instantes empatados que só passa com ordenação estável, e o de ação sem instante ao fim do bloco (RF-23, RF-25, RF-26) | - | `[//]` | `tests/webview-decomposition-view.spec.ts` | 🟢 | `[X]` |
| T015 | Estender a suíte de fronteiras da camada de leitura para recusar os dois módulos de rede do Node ao lado dos módulos de processo que ela já recusa (RN-02) | - | `[//]` | `tests/readonly-local.spec.ts` | 🟢 | `[X]` |
| T016 | Estender a suíte de fronteiras da tela para recusar endereço de rede e cliente de requisição dentro do pacote da webview, que continua sem falar com serviço algum (RN-01) | - | `[//]` | `tests/webview-boundaries.spec.ts` | 🟢 | `[X]` |
| T017 | Estender a suíte do canal para o comando novo: sai com o nome certo e o dado esperado, e envelope desconhecido continua sendo descartado sem derrubar nada | T008 | `[//]` | `tests/host-bridge.spec.ts` | 🟢 | `[X]` |
| T018 | Escrever a suíte da barra: papel declarado, mínimo, máximo, valor corrente, texto equivalente, ausência de elemento quando o denominador é zero e limitação do numerador ao denominador (RF-31, RF-33) | - | `[//]` | `tests/webview-progress-bar.spec.tsx` | 🟡 | `[X]` |
| T019 | Escrever a suíte do cabeçalho para os sete desfechos, verificando que nenhum produz linha vazia e que a conferência desligada não se confunde com estar em dia (RF-10, RF-14) | T008 | `[//]` | `tests/webview-header.spec.tsx` | 🟡 | `[X]` |

## Fase 3, Núcleo

<!-- Lógica central da feature. -->

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T020 | Escrever o intérprete puro que traduz código de resposta e corpo em desfecho nomeado, seguindo a tabela de tradução do contrato, sem tocar em rede e sem conhecer o editor (D-03, RF-10, RF-15, RF-16) | T012 | `[//]` | `src/host/update.ts` | 🟡 | `[X]` |
| T021 | Escrever o único módulo que abre conexão, com cabeçalhos fixos, tempo limite de cinco segundos, destruição explícita ao estourar, teto de corpo aceito e recusa de redirecionamento para outro domínio (D-01, D-05, RF-11, RF-13) | T002, T009 | `[//]` | `src/host/net.ts` | 🟡 | `[X]` |
| T022 | Reescrever o recorte da decomposição para devolver as linhas já ordenadas, com as abertas à frente na ordem do plano e as fechadas por recência decrescente, encerrando a divergência entre a ordem que seleciona e a que exibe (D-14, RN-07, RF-23, RF-24, RF-25) | T014 | `[//]` | `src/webview/domain/decomposition-view.ts` | 🟢 | `[X]` |
| T023 | Escrever o componente da barra, com propriedades de contagem e rótulo, uma peça só para os três cartões (D-15, RF-30, RF-31) | T018 | `[//]` | `src/webview/ui/ProgressBar.tsx` | 🟢 | `[X]` |
| T024 | Nomear na folha os tokens do trilho e do preenchimento e escrever a regra da barra, conferindo que o podador de tokens os preserva no pacote (D-16, RF-32) | T023 | - | `src/webview/theme/theme.css` | 🟢 | `[X]` |

## Fase 4, Integração

<!-- Cola com outras partes do sistema, contratos externos, ganchos. -->

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T025 | Escrever o adaptador da porta de configuração, lendo a chave do editor no momento da leitura e não guardando valor entre leituras (D-11, RF-14) | T009, T010 | `[//]` | `src/host/adapters.ts` | 🟢 | `[X]` |
| T026 | Montar as duas portas novas onde o provedor é construído, de modo que a camada de leitura continue sem enxergá-las (D-01) | T021, T025 | - | `src/extension.ts` | 🟢 | `[X]` |
| T027 | Fazer o provedor enviar o estado de consulta logo após o processo e o desfecho quando a resposta chegar, sem bloquear a leitura, sem repetir sozinho e sem consultar quando não há leitura a acompanhar (D-06, RF-09, RF-11, RF-12) | T020, T026 | - | `src/host/provider.ts` | 🟢 | `[X]` |
| T028 | Acrescentar o comando novo ao sink da ponte da tela, ao lado dos três que já existem | T008, T017 | `[//]` | `src/webview/bridge/messaging.ts` | 🟢 | `[X]` |
| T029 | Acrescentar o campo de desfecho ao estado efetivo do painel, com a regra de releitura que preserva o desfecho anterior na tela até a resposta nova chegar | T028 | - | `src/webview/domain/entry.ts` | 🟢 | `[X]` |
| T030 | Distribuir o desfecho do ponto de montagem até o cabeçalho, sem guardá-lo em preferência e sem escrevê-lo no estado do painel (RN-09) | T029 | - | `src/webview/main.tsx` | 🟢 | `[X]` |
| T031 | Desenhar no cabeçalho a versão da extensão, o commit em forma curta com o valor integral em atributo, e a linha que declara o desfecho da consulta (D-18, RF-10, RF-17) | T019, T030 | - | `src/webview/ui/Header.tsx` | 🟡 | `[X]` |
| T032 | Ligar a barra ao cartão da decomposição, com o par vindo da contagem herdada e não do comprimento da lista exibida (RF-27, RN-08) | T024 | `[//]` | `src/webview/ui/DecompositionSection.tsx` | 🟢 | `[X]` |
| T033 | Ligar a barra ao cartão do ciclo forward, ao lado dos números de ações fechadas e abertas que ele já imprime (RF-28) | T024 | `[//]` | `src/webview/ui/ForwardSection.tsx` | 🟢 | `[X]` |
| T034 | Ligar a barra ao cartão do histórico, medindo features convergidas sobre o total declarado, e não sobre as entradas que o corte por volume deixou à vista (RF-29, RN-08) | T024 | `[//]` | `src/webview/ui/HistorySection.tsx` | 🟡 | `[X]` |
| T035 | Escrever a conferência do atualizador: busca das referências sem alterar a árvore de trabalho, três desfechos nomeados e três códigos de saída no esquema que o verificador de herança já usa (D-12, RF-01, RF-02, RF-03) | T003 | `[//]` | `scripts/atualizar.js` | 🟢 | `[X]` |
| T036 | Acrescentar a aplicação ao mesmo script, atrás de argumento explícito: recusa de árvore suja ou commit local à frente, percurso até o empacotamento parando na primeira falha, e impressão do comando de instalação com o nome do pacote gerado (RF-04, RF-05, RF-06, RF-07) | T035 | - | `scripts/atualizar.js` | 🟢 | `[X]` |
| T037 | Imprimir na conferência o commit do clone na mesma forma curta que o painel exibe, para que a comparação entre instalado e clonado seja visual (D-18, RF-08) | T035 | - | `scripts/atualizar.js` | 🟡 | `[X]` |
| T038 | Fazer o empacotamento derivar a versão, escrevê-la no manifesto antes de chamar o empacotador e restaurá-la em bloco de saída garantida, de modo que a árvore volte limpa (D-08, RF-20) | T005 | `[//]` | `scripts/empacotar.js` | 🟢 | `[X]` |
| T039 | Acrescentar ao preview o argumento que força o desfecho da consulta, com os sete valores aceitos e recusa de valor desconhecido, como os demais argumentos já fazem (D-17) | - | `[//]` | `scripts/preview/config.js` | 🟢 | `[X]` |
| T040 | Emitir no preview a sequência com o desfecho forçado, depois do processo e respeitando o atraso declarado, para que o estado de consulta em curso possa ser visto (D-17) | T008, T039 | - | `scripts/preview/leitura.js` | 🟢 | `[X]` |

## Fase 5, Polimento

<!-- Logs, mensagens de erro, documentação curta. -->

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T041 | Escrever no canal de saída uma linha por falha da consulta, com origem, ato e razão, na forma única que o projeto já usa para as demais falhas do host | T027 | `[//]` | `src/host/provider.ts` | 🟢 | `[X]` |
| T042 | Escrever a suíte do empacotamento: o manifesto volta ao valor versionado ao fim, inclusive quando o empacotador falha, e o pacote sai nomeado pela versão derivada (D-08, RF-20) | T038 | `[//]` | `tests/empacotamento-versao.spec.ts` | 🟢 | `[X]` |
| T043 | Conferir que a suíte de conteúdo do pacote segue verde com os arquivos novos, ajustando a lista prevista apenas se algum deles passou a entrar legitimamente | T038 | `[//]` | `tests/vsix-conteudo.spec.ts` | 🟢 | `[X]` |
| T044 | Escrever no README a seção do ritual de atualização, com os dois atos separados, os desfechos da conferência, a recusa da árvore suja e a regra pela qual a versão cresce sozinha (RF-22) | T036 | `[//]` | `README.md` | 🟢 | `[X]` |
| T045 | Acrescentar à tabela de estados do preview as linhas dos desfechos da consulta, cada uma com o comando que a alcança (D-17) | T040, T044 | - | `README.md` | 🟢 | `[X]` |
| T046 | Rodar o portão visual sobre o que a feature acrescenta, os desfechos da consulta e as três barras, nos quatro conjuntos de cores e em largura de barra lateral, corrigir o que aparecer e atualizar a data da seção (D-17, RNF de acessibilidade) | T031, T032, T033, T034, T040, T045 | - | `README.md` | 🟡 | `[X]` |
| T047 | Medir o pacote da tela e o da extensão depois das peças novas e registrar as duas medidas ao lado dos tetos, como a feature 005 fez com as suas (RNF de tamanho) | T038 | `[//]` | `_reversa_forward/007-atualizacao-e-progresso/progress.jsonl` | 🟢 | `[X]` |

## Notas de execução

<!--
Reservado para /reversa-coding registrar avisos ou observações que surgiram durante a execução.
-->

Duas observações para quem executar, e nenhuma delas é ação:

1. `T001` e `T002` são confirmações que mudam o interior de `T020` e `T021`, não a arquitetura. Se
   nenhuma das duas puder ser feita por falta de rede ou de editor instalado, execute-as com o que a
   documentação já diz, registre a limitação no `investigation.md` e siga: o intérprete é puro e o
   custo de corrigi-lo depois é uma tabela de tradução.
2. `T007` toca dois arquivos, o manifesto de scripts e o `.gitignore`, e o segundo é o ponto
   delicado: o carimbo da construção muda a cada commit, e versioná-lo deixaria a árvore suja depois
   de toda construção. Isso é D-19, acrescentada ao roadmap durante esta decomposição.
3. `T038` mexe no manifesto em tempo de execução do empacotamento. Enquanto ela não estiver com a
   restauração coberta por `T042`, evite interromper `npm run empacotar` no meio: o manifesto pode
   ficar com a versão derivada escrita, e o atualizador passará a recusar a árvore por sujeira.

Registro de `/reversa-coding`, 2026-09-09, ao fim da execução das 47 ações. Quatro desvios do plano
e uma consequência não discutida nele, para `/reversa-sync` reconciliar:

4. **Dois campos a mais em `SetProcessData`** (`extensionVersion` e `builtFromCommit`), contra o
   que `interfaces/delta-do-canal.md` diz ("nenhum campo novo em `SetProcessData`"). A razão é
   RF-17, que pede os dois itens "como o do modelo herdado", e o modelo herdado
   (`inheritedRevision`) viaja na carga; a fronteira da tela proíbe importar VALOR de `src/host/`,
   então `build.ts` não pode ser lido pelo painel. O desfecho da consulta continua fora da carga, em
   `setUpdate`, como o contrato manda. O delta do canal precisa de emenda.
5. **`DEFAULT_BRANCH` no carimbo da construção**, quarta constante ao lado das três do plano: a
   comparação da consulta precisa de um ramo, e lê-lo do git em tempo de execução seria a leitura
   que RN-05 proíbe. Recua para `master` quando o git não responde.
6. **`pretest` no manifesto**, chamando `gerar:carimbo`: `extension.ts` importa `build.ts`, que não é
   versionado (D-19), e sem o passo um clone recém-feito reprovaria em `npm test` e em `tsc` antes da
   primeira construção. São dezessete scripts, e não dezesseis.
7. **Consequência da ordem nova da decomposição (RF-23 a RF-25):** o recorte passou a ser um PREFIXO
   da ordem unificada. Numa trilha que não registra instante algum, as cinco fechadas exibidas são as
   PRIMEIRAS do arquivo, e não as últimas, como o código antigo fazia ao usar o índice como
   substituto de recência. É o que RN-07 diz ("mantendo entre si a ordem do arquivo"), mas muda o
   que se vê em projeto sem trilha, e vai para `regression-watch.md`.
8. **Suítes além das nove planejadas na fase 2**, escritas junto das ações que verificam:
   `tests/webview-progress-cards.spec.tsx` (as três barras e os casos de borda de RF-33),
   `tests/atualizador.spec.ts` (os dois atos e os três códigos), `tests/preview-leitura.spec.ts` (a
   sequência do desfecho forçado) e a extensão de `tests/webview-entry.spec.ts` (a regra de
   releitura do desfecho). Sem elas, RF-33 e RF-05 teriam critério de aceite sem prova.
9. **`ErroDeGit` ganhou a causa `tempo-esgotado`** e `executar` ganhou a opção `tempoLimite`, para
   que a busca de referências do atualizador termine em dez segundos sem rede (RF-03). O
   atualizador reconhece o erro pelo NOME, e não só por `instanceof`, porque a suíte carrega os
   módulos por dois caminhos (ES e CommonJS) e as duas cópias da classe não se reconhecem.
10. **O portão visual (T046)** foi rodado com o preview real (`--atualizacao=atrasada`, tema escuro,
    380 px) e, sobre a mesma página, com os outros seis desfechos e os outros três conjuntos de
    cores injetados pelo mesmo caminho de entrega que o cliente do preview usa (`postMessage` e a
    classe do `body`). Os comandos das duas tabelas do README continuam sendo a forma documentada.

## Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-09-09 | Versão inicial gerada por `/reversa-to-do` | reversa |
| 2026-09-09 | 47 ações marcadas `[X]` e notas de execução 4 a 10 por `/reversa-coding` | reversa |
