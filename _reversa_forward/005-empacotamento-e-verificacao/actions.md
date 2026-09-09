# Actions: empacotamento e verificação

> Identificador: `005-empacotamento-e-verificacao`
> Data: `2026-09-09`
> Roadmap: `_reversa_forward/005-empacotamento-e-verificacao/roadmap.md`

## Resumo

| Métrica | Valor |
|---------|-------|
| Total de ações | 34 |
| Paralelizáveis (`[//]`) | 15 |
| Maior cadeia de dependência | 9 |

A cadeia mais longa é `T006 → T013 → T020 → T021 → T023 → T028 → T031 → T032 → T033`: a suíte da
sessão precede a extração, que alimenta a leitura do preview, que alimenta o servidor, a casca de
linha de comando, o manifesto e as três seções do README.

## Fase 1, Preparação

<!-- Setup, scaffolding, migrações iniciais, configuração de infraestrutura local. -->

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T001 | Criar o módulo dos limites do projeto com os quatro valores de hoje: teto do pacote da tela em 409600 bytes, teto do pacote da extensão em 2097152 bytes, versão mínima do editor em `1.78` e alvo do navegador em `chrome108`, com a prosa que explica o par entre a versão mínima e o Chromium que ela embarca (D-10, RN-01, RN-06) | - | `[//]` | `scripts/limites.js` | 🟢 | `[X]` |
| T002 | Declarar a lista de conteúdo do pacote por exclusão universal seguida de reinclusão explícita da pasta de saída, do ícone, do manifesto e do README, com comentário dizendo que pasta nova nasce fora do pacote (D-12, RF-02, RN-07) | - | `[//]` | `.vscodeignore` | 🟢 | `[X]` |
| T003 | Escrever a lista literal do conteúdo previsto do pacote, com os dois prefixos e os quatro arquivos avulsos, como única fonte lida pela suíte de conteúdo (data-delta 2.3) | T002 | - | `scripts/conteudo-esperado.js` | 🟢 | `[X]` |
| T004 | Acrescentar ao manifesto o publicador local, mantendo a marca de pacote privado e deixando licença, repositório e ícone de loja fora (D-15, RF-04) | - | `[//]` | `package.json` | 🟢 | `[X]` |
| T005 | Acrescentar o empacotador oficial como dependência de desenvolvimento em igualdade exata de versão e travá-la no arquivo de trava (D-14, RN-10) | T004 | - | `package.json` | 🟢 | `[X]` |

## Fase 2, Testes

<!-- Testes que precisam existir antes ou logo após o núcleo. -->

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T006 | Escrever a suíte da sequência de mensagens do host antes da extração: ordem carregando seguida de resultado, os envelopes de sem diretório, sem Reversa, erro e processo lido, mais a raiz observada e as raízes ignoradas (D-04, RF-17) | - | `[//]` | `tests/host-session.spec.ts` | 🟢 | `[X]` |
| T007 | Escrever a suíte dos limites: o manifesto declara a mesma versão mínima que o módulo, o empacotamento da webview usa o mesmo alvo, e nenhum dos quatro números aparece uma segunda vez no repositório (RF-15, RF-16, RN-06) | T001 | `[//]` | `tests/limites.spec.ts` | 🟢 | `[X]` |
| T008 | Estender a suíte do empacotamento da webview para cobrir a guarda de tamanho, medindo os dois arquivos emitidos contra o teto do módulo, e trocar a conferência do alvo literal pela do valor lido do módulo (RF-14, RF-15) | T001 | `[//]` | `tests/webview-build.spec.ts` | 🟡 | `[X]` |
| T009 | Escrever a suíte do leitor mínimo do pacote sobre um pacote de fixtura montado no próprio teste: caminhos, tamanho comprimido e tamanho original lidos do índice, sem descompactar conteúdo (D-13) | - | `[//]` | `tests/vsix-leitor.spec.ts` | 🟡 | `[X]` |
| T010 | Escrever a suíte de conteúdo do pacote: lê o pacote que existir na raiz, falha nomeando cada caminho fora da lista prevista, e é pulada com aviso quando não houver pacote (RF-21, RN-07) | T003 | `[//]` | `tests/vsix-conteudo.spec.ts` | 🟡 | `[X]` |
| T011 | Escrever a suíte da configuração do preview: os seis padrões, a recusa de workspace inexistente, a recusa de pacote da tela ausente e a interrupção diante de argumento desconhecido (data-delta 2.1, RF-13) | - | `[//]` | `tests/preview-config.spec.ts` | 🟡 | `[X]` |
| T012 | Escrever a suíte do roteador do preview: 404 que nomeia os cinco caminhos, 405 que nomeia o método aceito, 403 para origem estranha, 413 para corpo grande, e envelope malformado que vira linha no terminal com resposta 204 (interfaces/canal-do-preview.md, seções 5 e 6) | - | `[//]` | `tests/preview-servidor.spec.ts` | 🟡 | `[X]` |

## Fase 3, Núcleo

<!-- Lógica central da feature. -->

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T013 | Extrair a sequência de mensagens do provedor para uma função pura que recebe as raízes e o leitor e devolve as mensagens em ordem mais a raiz observada, sem tocar em nada do editor (D-04, RF-17) | T006 | - | `src/host/session.ts` | 🟡 | `[X]` |
| T014 | Fazer a releitura do provedor consumir a sequência extraída, mantendo com ele o envio, a visibilidade e a abertura de arquivo, e confirmar que a suíte do provedor segue verde sem alteração (D-04) | T013 | - | `src/host/provider.ts` | 🟡 | `[X]` |
| T015 | Acrescentar ao documento o campo opcional de origem de conexão, com a ausência significando a proibição de hoje e a política do provedor permanecendo idêntica byte a byte (D-03, data-delta 3) | - | `[//]` | `src/host/document.ts` | 🟢 | `[X]` |
| T016 | Fazer o empacotamento da webview ler o alvo do navegador do módulo dos limites, removendo o literal que a suíte conferia (D-10, RF-15) | T001 | - | `scripts/build-webview.js` | 🟢 | `[X]` |
| T017 | Acrescentar ao fim do empacotamento da webview a guarda de tamanho, que soma os dois arquivos emitidos e interrompe o build com o tamanho medido e o teto na mensagem quando o teto for excedido (D-11, RF-14) | T016, T008 | - | `scripts/build-webview.js` | 🟢 | `[X]` |
| T018 | Escrever a tradução e a validação dos argumentos do preview, com os seis campos, os padrões e as duas recusas anteriores à abertura de porta (data-delta 2.1, RF-13) | T011 | `[//]` | `scripts/preview/config.js` | 🟢 | `[X]` |
| T019 | Montar a página servida pelo preview a partir da saída compilada do host, com nonce por sessão, classe de tema escrita no corpo e faixa irmã do ponto de montagem que nomeia preview, workspace, tema, estado forçado e limites (D-02, D-08, D-09, RF-08, RF-11) | T015, T018 | - | `scripts/preview/pagina.js` | 🟡 | `[X]` |
| T020 | Escrever a leitura do preview: chama a sequência de mensagens compilada, devolve o envelope único quando há estado forçado, observa o atraso antes de responder, e transforma exceção de leitura em envelope de erro em vez de 500 (D-07, RF-09, RF-09a, RF-17) | T013, T018 | - | `scripts/preview/leitura.js` | 🟡 | `[X]` |
| T021 | Escrever o servidor do preview com as cinco rotas, escuta apenas na interface local, recusa de origem estranha, limite de corpo do canal e as linhas de terminal dos três comandos que chegam ao servidor (D-06, RF-07, RF-12, RN-03) | T012, T019, T020 | - | `scripts/preview/servidor.js` | 🟡 | `[X]` |
| T022 | Escrever o host fingido servido como script irmão, que define a interface do editor antes de o pacote carregar, guarda o estado no armazenamento local do navegador e traduz os cinco comandos do canal em requisições ao servidor (D-05, RF-07, RN-05) | T021 | - | `scripts/preview/cliente.js` | 🟢 | `[X]` |
| T023 | Escrever a casca de linha de comando do preview: valida, recusa iniciar sem o pacote da tela, abre o servidor, imprime o endereço e para com mensagem própria e sugestão de porta quando a porta estiver ocupada (D-01, RF-06, RF-12, RF-13) | T018, T021 | - | `scripts/preview.js` | 🟢 | `[X]` |
| T024 | Escrever o auxiliar do estado degradado, que copia o workspace para pasta temporária do sistema, trunca um arquivo do Reversa, imprime o caminho da cópia e não toca no repositório nem no workspace de origem (D-17, RF-09b, RN-02) | - | `[//]` | `scripts/estragar-workspace.js` | 🟡 | `[X]` |
| T025 | Escrever o leitor mínimo do índice do pacote, que devolve caminho, tamanho comprimido e tamanho original de cada entrada, sem dependência e sem descompactar conteúdo (D-13) | T009 | `[//]` | `scripts/vsix.js` | 🟡 | `[X]` |

## Fase 4, Integração

<!-- Cola com outras partes do sistema, contratos externos, ganchos. -->

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T026 | Acrescentar ao empacotamento da webview o modo de observação por opção, que liga o mapa de fontes e mantém o empacotador vivo, sem alterar o caminho do build normal (D-16, RF-20) | T017 | - | `scripts/build-webview.js` | 🟢 | `[X]` |
| T027 | Escrever a casca do empacotamento sobre o empacotador oficial: invoca sem resolução de dependências e sem exigir repositório declarado, recusa com a instrução de instalação quando ele estiver ausente, não deixa arquivo parcial e imprime ao final o conteúdo do pacote e o tamanho medido ao lado do teto (D-14, RF-01, RF-03, RF-05) | T001, T005, T025 | - | `scripts/empacotar.js` | 🟡 | `[X]` |
| T028 | Declarar no manifesto os quatro comandos novos, `preview`, `empacotar`, `observar:webview` e `estragar:workspace`, levando a lista de dez para catorze (D-19, RF-16) | T023, T024, T026, T027 | - | `package.json` | 🟢 | `[X]` |
| T029 | Atualizar a suíte do manifesto para fixar os catorze scripts e para conferir, pelo módulo dos limites, que o alvo do empacotador e a versão mínima do editor apontam para o mesmo Electron, falhando com os dois valores na mensagem quando divergirem (D-19, RF-16) | T028, T001 | - | `tests/host-manifest.spec.ts` | 🟢 | `[X]` |
| T030 | Criar a configuração de depuração que abre a janela de desenvolvimento com a extensão carregada da pasta de saída, tendo a tarefa de build como pré-tarefa (D-18, RF-19) | - | `[//]` | `.vscode/launch.json` | 🟢 | `[X]` |

## Fase 5, Polimento

<!-- Logs, telemetria, mensagens de erro, documentação curta. -->

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T031 | Escrever no README o percurso do clone à extensão instalada, com instalação de dependências, build, preview, empacotamento e instalação do pacote no editor, em passos que dispensam conhecimento prévio do repositório (RF-18) | T028 | - | `README.md` | 🟢 | `[X]` |
| T032 | Escrever no README a seção dos sete estados da tela, nomeando cada um e o comando exato que o produz: três por estado forçado, dois por atraso, um pelo workspace real e um pela cópia estragada (RF-10) | T031, T023 | - | `README.md` | 🟢 | `[X]` |
| T033 | Registrar no README o portão visual dos sete estados como cumprido ou como devido, sem ambiguidade, junto do limite de o ambiente dos agentes não ter navegador (RN-08, critério de pronto) | T032 | - | `README.md` | 🟢 | `[X]` |
| T034 | Medir e registrar no progresso as quatro grandezas contra os tetos, tempo do build completo, tamanho do pacote da tela, tamanho do pacote da extensão e o método de medição de cada uma (RF-22) | T017, T027 | - | `_reversa_forward/005-empacotamento-e-verificacao/progress.jsonl` | 🟡 | `[X]` |

## Emendas

<!-- Acrescentadas depois do fechamento das ações, com o mesmo formato de tabela. -->

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| E001 | Escrever no README como abrir o painel depois de instalado: o ícone da barra de atividades, o comando de foco da paleta, a janela de desenvolvimento por `F5`, o comando de releitura, o canal de saída e o que fazer quando o ícone não aparece (detalha RF-18) | T031 | - | `README.md` | 🟢 | `[X]` |
| E002 | Declarar no manifesto o comando `reversaViews.abrir`, título `Abrir o painel do processo`, e dar a categoria `Reversa` aos dois comandos, encurtando o título do de releitura para `Reler o processo` | E001 | `[//]` | `package.json` | 🟢 | `[X]` |
| E003 | Registrar o comando de abertura na ativação, delegando ao comando de foco que o próprio editor gera para a visão contribuída | E002 | - | `src/extension.ts` | 🟢 | `[X]` |
| E004 | Fixar por inteiro a lista de comandos na suíte do manifesto, com identificadores e categoria, como o cabeçalho dela já prometia | E002 | `[//]` | `tests/host-manifest.spec.ts` | 🟢 | `[X]` |
| E005 | Reorganizar o README para que o uso diário venha primeiro e caiba num passo: abrir pela paleta, instalar uma vez, e só então a reconstrução do pacote, marcada como manutenção | E003 | - | `README.md` | 🟢 | `[X]` |
| E006 | Instalar a extensão no editor pela linha de comando, a partir do pacote gerado | E003 | - | (nenhum, ato de instalação) | 🟢 | `[X]` |
| E007 | Corrigir a cor do painel sob o tema escuro: mover fundo e texto herdado do corpo do documento para `.panel`, que é o elemento onde os conjuntos de cor são definidos, e fazer a raiz preencher a visão | E006 | - | `src/webview/theme/theme.css` | 🟢 | `[X]` |
| E008 | Fixar em suíte o alcance dos conjuntos de cor: o corpo não nomeia token, a raiz do painel fixa fundo e texto | E007 | - | `tests/webview-theme.spec.ts` | 🟢 | `[X]` |

## Notas de execução

<!--
Reservado para /reversa-coding registrar avisos ou observações que surgiram durante a execução.
Não use isso para corrigir ações, edits manuais ficam fora desse arquivo, vão direto no código.
-->

## Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-09-09 | Versão inicial gerada por `/reversa-to-do` | reversa |
| 2026-09-09 | Emendas E002 a E006: comando de paleta para abrir o painel, README reordenado, extensão instalada | reversa |
| 2026-09-09 | Emendas E007 e E008: correção da cor do painel no tema escuro | reversa |
