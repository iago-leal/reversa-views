# Actions: ponte e host da extensão

> Identificador: `002-ponte-e-host`
> Data: `2026-09-09`
> Roadmap: `_reversa_forward/002-ponte-e-host/roadmap.md`
> Confidência: 🟢 CONFIRMADO, 🟡 INFERIDO, 🔴 LACUNA (herdada da decisão do roadmap entre parênteses)

## Resumo

| Métrica | Valor |
|---------|-------|
| Total de ações | 32 |
| Paralelizáveis (`[//]`) | 27 |
| Maior cadeia de dependência | 10 ações (T005 → T009 → T017 → T018 → T024 → T026 → T027 → T028 → T029 → T031) |

Convenções desta decomposição:

- **Identificadores fixos**, usados em manifesto, código e testes sem variação: contêiner de visão
  `reversa-views`, visão `reversaViews.process`, comando de paleta `reversaViews.reload`, canal de
  saída `Reversa Views`. Quem mudar um deles muda os quatro lugares.
- **Idioma:** identificadores e comentários de código em inglês, documentação em português (D-02).
  Vale para nome de arquivo, de tipo, de função e de campo do protocolo.
- **A fronteira com o editor** é `src/extension.ts` e `src/host/adapters.ts`, e mais nenhum arquivo
  (D-01). Nos demais módulos, `vscode` só entra como `import type`, quando entra.
- **Nada aqui é cópia literal.** RN-08 dispensa o carimbo `/* HERDADO` e o registro em
  `src/heranca/PROCEDENCIA.md`, porque o que se herda do `vscode-kanban` é desenho, não binário.
- Nada aqui comita, instala extensão de IDE, roda lint nem abre PR. O commit fica com o usuário.
- A política de escrita no legado está liberada sem restrição de caminho (`allowLegacyEdits`
  verdadeiro, `allowedPaths` vazio), o que cobre as três ações que tocam `package.json`,
  `package-lock.json` e `tsconfig.json`. Se a política mudar antes da execução, essas ações se
  concluem registrando o trecho pronto em "Notas de execução", sem escrever.

## Fase 1, Preparação

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T001 | Acrescentar `@types/vscode` a `devDependencies` com igualdade exata `1.78.0`, sem acento circunflexo, na mesma forma das três já presentes; rodar a instalação uma vez para atualizar o arquivo de trava e conferir com `npm ls @types/vscode` que a versão resolvida é exatamente 1.78.0. Não herdar o 1.62.0 da origem do kit, que está descasado da versão mínima que ela própria declara | - | `[//]` | `package.json`, `package-lock.json` | 🟢 (D-12) | `[X]` |
| T002 | Acrescentar ao manifesto as seis chaves de extensão e nada mais: `engines.vscode` em `^1.78.0`; `main` apontando `./out/extension.js`; `activationEvents` com o único item `onView:reversaViews.process`; `contributes.viewsContainers.activitybar` com um contêiner de id `reversa-views`, título `Reversa` e ícone `media/reversa.svg`; `contributes.views` com a visão `reversaViews.process` dentro desse contêiner, de tipo `webview` e título `Processo`; `contributes.commands` com `reversaViews.reload`, título `Reversa Views: Reler o processo`. Não acrescentar script de empacotamento, lista de exclusão de VSIX nem empacotador, que são da feature 005 | T001 | `[//]` | `package.json` | 🟡 (D-11) | `[X]` |
| T003 | Acrescentar `"vscode"` ao arranjo `types` da configuração do compilador, que hoje traz apenas `"node"`, deixando todos os demais campos intactos. Rodar `npm run typecheck` logo depois: ele deve continuar verde sobre a camada herdada, e é essa execução que prova que a tipagem do editor foi encontrada | T001 | `[//]` | `tsconfig.json` | 🟢 (D-12) | `[X]` |
| T004 | Criar o ícone do contêiner: desenho monocromático de 24 por 24, em traço único, usando `currentColor` para acompanhar o tema do editor, sem texto e sem preenchimento dependente de tema. Fica em `media/`, e não na pasta de saída, que é ignorada pelo versionamento | - | `[//]` | `media/reversa.svg` | 🟢 (D-14) | `[X]` |
| T005 | Escrever o arquivo de protocolo, só com tipos e constantes, sem lógica e sem importar nada do editor: o envelope de nome e carga; o tipo união dos cinco estados de entrada `no-folder`, `loading`, `no-reversa`, `installed` e `error`; as cargas `SetProcessData` (com `process`, `probe`, `readAt`, `entry`, `root`, `ignoredRoots`), `SetEntryData`, `SetNoticeData`, `OpenFileData`, `LogData` e `DispatchData`; as uniões discriminadas das mensagens de ida e de volta; e a lista dos nomes de comando que a webview pode enviar, com `dispatch` marcado em comentário como reservado. Os tipos `ReversaProcess` e `ProbeReport` são importados da camada herdada por caminho relativo com extensão, e não redeclarados | - | `[//]` | `src/host/protocol.ts` | 🟡 (D-04, D-05) | `[X]` |
| T006 | Escrever o arquivo de portas, só com interfaces, sem importar nada do editor: `MessagingPort` (enviar um envelope, devolvendo se foi entregue; registrar um ouvinte, devolvendo o descartador; consultar visibilidade; assinar mudança de visibilidade), `EditorPort` (abrir um documento por caminho absoluto), `WorkspacePort` (listar os caminhos absolutos das raízes, na ordem do editor) e `LogPort` (escrever uma linha). Cada uma traz, em comentário, a razão de ser dela e o que deliberadamente não expõe | - | `[//]` | `src/host/ports.ts` | 🟢 (D-01) | `[X]` |

## Fase 2, Testes

<!-- As dez suítes são escritas contra os contratos de T005 e T006, antes dos módulos que as satisfazem. Cada ação da fase 3 só se conclui com a suíte correspondente verde. -->

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T007 | Suíte do protocolo: os cinco estados de entrada existem no tipo união e cada um é construível; os cinco nomes de comando da webview estão na lista, incluindo `dispatch`; os três comandos do host têm carga tipada; a carga de dados traz os seis campos de RF-13, RF-03 e RF-04. Cobre os cenários de estados nomeados e de comando reservado declarado | T005 | `[//]` | `tests/host-protocol.spec.ts` | 🟡 (D-04) | `[X]` |
| T008 | Suíte da escolha de raiz: sem raiz alguma, devolve o estado `no-folder` e **não** chama a função de leitura nenhuma vez; com uma raiz instalada, devolve-a como observada, com lista de ignoradas vazia; com duas raízes e instalação só na segunda, devolve a segunda como observada e a primeira como ignorada, e chama a leitura duas vezes; com duas raízes e nenhuma instalada, devolve a primeira como observada, a segunda como ignorada e reaproveita o resultado já lido, sem terceira chamada. A função de leitura entra por parâmetro, como dublê contador | T005, T006 | `[//]` | `tests/host-root.spec.ts` | 🟡 (D-06) | `[X]` |
| T009 | Suíte da leitura: com processo instalado, a carga traz processo, relatório e momento da leitura, e o relatório expõe `workspace`, `featureDir`, `refusals` e `truncated`; com processo não instalado, o estado de entrada vem `no-reversa` e o processo viaja assim mesmo; quando a função de leitura lança, nada escapa, a linha de log traz a pilha e o resultado é o estado `error` com a mensagem da exceção; o momento da leitura é texto ordenável. A leitura e o log entram por parâmetro | T005, T006 | `[//]` | `tests/host-reading.spec.ts` | 🟢 (D-01) | `[X]` |
| T010 | Suíte do roteador: `onLoaded` e `reload` disparam leitura; `openFile` chama a abertura com o caminho recebido; `log` escreve a linha no canal com prefixo de origem; `dispatch` produz exatamente uma linha de rejeição que contém a palavra reservada e não chama nada mais; envelope sem nome de comando, com nome desconhecido, ou com carga faltando o campo obrigatório produz uma linha de rejeição nomeando o problema e nenhum efeito colateral. Todos os colaboradores entram por parâmetro, como dublês contadores | T005, T006 | `[//]` | `tests/host-router.spec.ts` | 🟢 (D-03) | `[X]` |
| T011 | Suíte da abertura de arquivo: caminho relativo válido resolve para o absoluto dentro da raiz e chama a porta do editor uma vez; caminho com travessia, caminho absoluto e caminho com unidade de disco do Windows são recusados **antes** de qualquer chamada à porta, cada um com linha de log que traz o caminho e o motivo; quando a porta do editor lança, por arquivo ausente, a falha é capturada, registrada e vira aviso que nomeia o arquivo. Verificar que a recusa vem de `resolveInside` da sonda herdada, e não de comparação escrita no host | T005, T006 | `[//]` | `tests/host-open-file.spec.ts` | 🟢 (D-07) | `[X]` |
| T012 | Suíte do documento: a política declarada não contém `unsafe-eval`, não contém `unsafe-inline` em `script-src`, não contém `*` em nenhuma cláusula e traz `default-src 'none'` e `connect-src 'none'`; toda etiqueta de script do documento carrega o nonce da sessão; dois documentos gerados em sequência têm nonces diferentes; o nonce tem ao menos 128 bits de entropia em forma hexadecimal. A origem do webview e o gerador de nonce entram por parâmetro | T005 | `[//]` | `tests/host-document.spec.ts` | 🟢 (D-09) | `[X]` |
| T013 | Suíte da ponte: nada é enviado antes da chegada de `onLoaded`, e uma tentativa nesse intervalo registra a retenção; depois do pronto, o envio ocorre uma vez por carga; com a visão oculta, o envio não acontece, a pendência é marcada e a linha de log nomeia o motivo; ao voltar a visibilidade com pendência marcada, uma releitura é pedida, e sem pendência, nenhuma; envio que o editor não confirma gera uma linha de log e nenhuma repetição; um segundo `onLoaded` produz uma segunda carga, conforme EC-07 | T005, T006 | `[//]` | `tests/host-bridge.spec.ts` | 🟢 (D-10) | `[X]` |
| T014 | Suíte do provedor: resolver a visão define o documento, registra o ouvinte uma única vez e **não** lê o disco antes do pronto; chegado o pronto, a sequência de mensagens é o estado `loading` seguido da carga de dados; ocultar e reexibir a visão não dispara leitura nova; a releitura pelo comando de paleta e a pelo botão produzem cargas da mesma forma; o provedor nunca escreve no estado da webview. Toda a interface do editor entra por dublê | T005, T006 | `[//]` | `tests/host-provider.spec.ts` | 🟡 (D-10) | `[X]` |
| T015 | Suíte do manifesto, que lê `package.json` do repositório: a versão mínima do editor é `^1.78.0` e coincide com a da tipagem instalada; o ponto de entrada aponta para a saída compilada; o único evento de ativação é o da visão, e não há evento coringa; existe um contêiner na barra de atividades com o ícone que o arquivo `media/reversa.svg` de fato tem; a visão declarada é de tipo webview e vive nesse contêiner; existe o comando de releitura; **não** existem script de empacotamento, lista de exclusão de VSIX nem empacotador em dependências | T002, T004 | `[//]` | `tests/host-manifest.spec.ts` | 🟡 (D-11) | `[X]` |
| T016 | Suíte das fronteiras, que lê os próprios fontes de `src/`: a importação de valor de `vscode` aparece em exatamente dois arquivos, `src/extension.ts` e `src/host/adapters.ts`, e importação de tipo não conta; a chamada de envio de mensagem e o registro de ouvinte aparecem exatamente uma vez cada, ambos em `src/host/bridge.ts`; nenhum módulo de `src/host/` fora dos adaptadores importa `node:fs`; nenhum módulo do host contém caminho literal de arquivo do Reversa nem cálculo de estágio, o que prova RF-14. A suíte só fica verde depois de T024 | T005 | `[//]` | `tests/host-boundaries.spec.ts` | 🟢 (D-01, D-03) | `[X]` |

## Fase 3, Núcleo

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T017 | Escrever a leitura: uma função que recebe a raiz absoluta, a função de leitura da camada herdada e a porta de log, chama `readReversaSnapshot` e em seguida `readReversa` sobre o retrato devolvido, e monta a carga com processo, relatório, momento da leitura em forma ordenável e o estado de entrada derivado do campo `installed`. Toda exceção é capturada ali, com a pilha no log e o estado `error` como resultado. Nenhuma regra de layout ou de estágio é reescrita, conforme RF-14. Concluir com a suíte de T009 verde | T009 | `[//]` | `src/host/reading.ts` | 🟢 (D-01) | `[X]` |
| T018 | Escrever a escolha de raiz: uma função que recebe a lista de raízes na ordem do editor e a função de leitura, devolve o estado `no-folder` quando a lista está vazia, sem ler nada, e nos demais casos percorre as raízes lendo cada uma, para na primeira cujo processo venha instalado e devolve a raiz observada, as ignoradas e o resultado já lido, sem segunda passagem. Não havendo nenhuma instalada, devolve a primeira raiz e o resultado dela, já em mãos desde a primeira iteração. Concluir com a suíte de T008 verde | T008, T017 | `[//]` | `src/host/root.ts` | 🟡 (D-06) | `[X]` |
| T019 | Escrever a contenção e abertura: uma função que recebe a raiz observada, o caminho pedido, a porta do editor e a porta de log, chama `resolveInside` da sonda herdada e, recebendo nulo, registra a recusa com caminho e motivo e retorna sem tocar na porta do editor. Recebendo caminho absoluto, chama a porta, captura falha e devolve o aviso que nomeia o arquivo. Não escrever comparação de prefixo própria. Concluir com a suíte de T011 verde | T011 | `[//]` | `src/host/open-file.ts` | 🟢 (D-07) | `[X]` |
| T020 | Escrever o documento: geração do nonce por dezesseis bytes aleatórios de `node:crypto` em hexadecimal, numa função própria, e montagem do documento numa função pura que recebe nonce, origem do webview e corpo. A política é a de D-09, com `default-src 'none'`, imagem e estilo e fonte apenas da origem do webview, script apenas por nonce e `connect-src 'none'`, sem cláusula de avaliação dinâmica. O documento declara idioma, conjunto de caracteres e área de visão, e nada mais. Concluir com a suíte de T012 verde | T012 | `[//]` | `src/host/document.ts` | 🟢 (D-09) | `[X]` |
| T021 | Escrever o corpo provisório: função pura que recebe o nonce e devolve o corpo do documento, com um bloco de saída, dois botões, e um script embutido sob o nonce que toma a interface do host uma única vez, envia `onLoaded` ao carregar, imprime em texto pré-formatado o que chega em `setProcess`, `setEntry` e `setNotice`, e liga os botões a `reload` e a `openFile` com um caminho relativo fixo apontando o próprio `requirements.md` desta feature. Deixar no topo, em comentário, a nota de que o arquivo inteiro é descartado pela feature 003 | T005 | `[//]` | `src/host/provisional.ts` | 🟡 (D-08) | `[X]` |
| T022 | Escrever a ponte: o único módulo que chama a porta de mensagens. Guarda o sinalizador de pronto e o de releitura pendente, recusa envio antes do pronto registrando a retenção, recusa envio com a visão oculta marcando pendência e registrando o motivo, assina a mudança de visibilidade para pedir releitura quando houver pendência, e registra o envio que o editor não confirma. Deixar no cabeçalho a nota de que nenhum outro módulo pode chamar a porta de mensagens, e por quê, na forma que a origem do kit usa. Concluir com a suíte de T013 verde | T013 | `[//]` | `src/host/bridge.ts` | 🟢 (D-03, D-10) | `[X]` |
| T023 | Escrever o roteador: função que recebe o envelope e os colaboradores, valida que há nome de comando conhecido e que a carga tem os campos obrigatórios, e despacha os cinco comandos da webview. `dispatch` é rejeitado com linha que o nomeia como reservado, sem abrir terminal e sem lançar; nome desconhecido e carga malformada são rejeitados com linha que nomeia o problema. Nenhum caminho do roteador lança para quem o chamou. Concluir com a suíte de T010 verde | T010, T017, T019 | `[//]` | `src/host/router.ts` | 🟢 (D-03) | `[X]` |
| T024 | Escrever o provedor de visão: implementa estruturalmente a interface de provedor, com `vscode` importado apenas como tipo. Ao resolver a visão, habilita script, declara a pasta de saída da extensão como única raiz de recurso local, monta o documento com o corpo provisório, cria a ponte e registra o ouvinte único que entrega ao roteador. Expõe a função de releitura que o comando de paleta usa, de modo que os dois caminhos de RF-07 passem pelo mesmo código. Nunca escreve no estado da webview. Concluir com a suíte de T014 verde | T014, T018, T020, T021, T022, T023 | - | `src/host/provider.ts` | 🟡 (D-10) | `[X]` |

## Fase 4, Integração

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T025 | Escrever os adaptadores: a única implementação das quatro portas sobre a interface do editor, num arquivo só. A porta de mensagens sobre o objeto de webview, a do editor sobre a abertura de documento sem roubar o foco, a de workspace sobre as pastas abertas, devolvendo caminho absoluto do sistema de arquivos, e a de log sobre o canal de saída, cada linha prefixada com instante e origem. Nenhuma lógica de decisão entra aqui: o arquivo traduz e nada mais | T006 | `[//]` | `src/host/adapters.ts` | 🟢 (D-01) | `[X]` |
| T026 | Escrever a ativação: cria o canal de saída `Reversa Views`, monta os adaptadores, registra o provedor na visão `reversaViews.process` com retenção de contexto ligada, registra o comando `reversaViews.reload` apontando para a função de releitura do provedor, e empurra os três descartáveis para a lista de descarte do contexto. Nada mais roda na ativação, e nenhuma leitura acontece nela | T002, T024, T025 | - | `src/extension.ts` | 🟡 (D-11) | `[X]` |
| T027 | Verificar a construção: rodar `npm run typecheck` e `npm test`, exigindo verificação de tipos sem erro, as dezenove suítes herdadas sem regressão e as dez novas verdes; depois `npm run compile` e conferir que existem `out/extension.js` e a pasta `out/host/`. Registrar em "Notas de execução" a contagem final de arquivos de teste, casos e pulos | T026 | - | `out/` | 🟢 (roadmap §10) | `[X]` |
| T028 | Verificar as duas fronteiras por busca, além da suíte: a importação de valor de `vscode` aparece em exatamente dois arquivos, e a chamada de envio e o registro de ouvinte, uma vez cada. Rodar a suíte de T016, que agora deve ficar verde. Divergência aqui é defeito de desenho, e não de teste: corrigir o código, jamais afrouxar a suíte | T016, T027 | - | `src/host/`, `src/extension.ts` | 🟢 (D-01, D-03) | `[X]` |

## Fase 5, Polimento

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T029 | Uniformizar as linhas de log num formato único, com origem, ato e motivo, e conferir que os oito casos da tabela de erros do contrato produzem linha legível: comando desconhecido, carga malformada, caminho recusado, arquivo ausente, exceção da leitura, envio a visão oculta, envio não confirmado e comando reservado. Nenhum deles pode produzir linha vazia, mensagem genérica ou captura silenciosa | T028 | `[//]` | `src/host/` | 🟡 (roadmap §2) | `[X]` |
| T030 | Escrever o cabeçalho de cada um dos onze módulos novos do host, dizendo em três a seis linhas o que ele resolve, o que deliberadamente não faz e a qual requisito responde. É a documentação para quem retornar em doze meses, e substitui o carimbo de herança, que RN-08 dispensa por não haver cópia literal | T028 | `[//]` | `src/host/`, `src/extension.ts` | 🟢 (RN-08) | `[X]` |
| T031 | Percorrer o `onboarding.md` desta feature, dos passos 6 a 11, na janela de desenvolvimento do editor, e registrar em "Notas de execução" o resultado de cada verificação: ícone na barra, painel preenchido, os dois botões, comando de paleta com a visão visível e com ela oculta, canal de saída, e os cinco casos de borda da tabela do passo 11. É a única verificação que nenhuma suíte substitui | T027, T029 | - | `_reversa_forward/002-ponte-e-host/onboarding.md` | 🟡 (D-13) | `[ ]` |
| T032 | Montar o mapa dos dezoito cenários de aceitação do `requirements.md` para as suítes que os cobrem, um por linha, e registrá-lo em "Notas de execução". Cenário sem teste correspondente é lacuna a reportar ali, não a esconder; cenário coberto apenas pela verificação manual de T031 deve dizê-lo | T027 | `[//]` | `_reversa_forward/002-ponte-e-host/actions.md` | 🟢 (roadmap §10) | `[X]` |

## Notas de execução

<!--
Reservado para /reversa-coding registrar avisos ou observações que surgiram durante a execução.
Não use isso para corrigir ações, edits manuais ficam fora desse arquivo, vão direto no código.
-->

### Contagem final da verificação (T027)

| Grandeza | Valor |
|---|---|
| Arquivos de teste | 29 (17 herdados, 12 locais) |
| Casos | 308 |
| Falhas | 0 |
| Pulados | 0 |
| Módulos compilados em `out/host/` | 11 |

`npm run typecheck` e `npm run compile` fecharam sem erro, e `out/extension.js` existe no lugar que
o manifesto aponta. A saída compilada resolve `vscode` só dentro do editor, como se espera de uma
extensão: fora dele, `require` do módulo falha com módulo não encontrado, e é esse o comportamento
correto.

### As duas fronteiras, por busca (T028)

A importação de valor do editor aparece em `src/extension.ts` e `src/host/adapters.ts`, e em mais
nenhum lugar. A chamada de envio e o registro de ouvinte aparecem uma vez cada, ambas em
`src/host/bridge.ts`.

Uma ressalva sobre a busca do passo 5 do `onboarding.md`, que é textual e por isso encontra mais do
que os dois pontos de travessia: `src/host/ports.ts` traz os dois nomes na **declaração** da
interface, que não é chamada, e `src/host/provisional.ts` os traz três vezes dentro do documento da
webview, que é o **outro lado** do canal, embutido em texto. A suíte de fronteiras separa os dois
casos: conta chamadas sobre objeto (`.postMessage(`) apenas nos módulos do host e, do lado da
webview, exige que a interface seja tomada uma única vez.

### Desvios do plano, todos declarados

1. **T006 corrigido depois de escrito.** A porta de mensagens passou a ter a forma estrutural do
   objeto de webview do editor, e a visibilidade saiu dela para uma porta própria. A razão é
   direta: com portas de nomes neutros, a chamada de envio cairia em `adapters.ts`, e T016 exige
   que ela viva em `bridge.ts`. Com a forma estrutural, o objeto real satisfaz a porta como está,
   dispensa adaptador e a chamada fica onde o requisito manda. São cinco portas, e não quatro,
   mas continuam quatro adaptadores.
2. **`ports.ts` ganhou uma função.** `logLine` fixa o formato único da linha de log ao lado do
   contrato de log, em vez de virar um décimo segundo módulo. T029 verifica o resultado.
3. **Recusa de caminho não vira aviso na tela.** A tabela de erros do contrato manda a recusa só
   para o canal de saída; à webview vai apenas o arquivo que sumiu. T011 fixa isso.
4. **Cabeçalhos maiores que o previsto.** T030 pedia de três a seis linhas por módulo; os doze
   ficaram entre nove e doze linhas de prosa. A escolha é deliberada e responde ao princípio de
   documentar para quem retorna depois de meses.

### Os oito casos da tabela de erros (T029)

Exercitados sobre a saída compilada, produziram oito linhas, todas no formato `origem · ato: motivo`
e nenhuma vazia ou genérica:

```
router    · comando desconhecido: "formatarDisco"
router    · carga malformada: openFile sem o campo path em texto
open-file · caminho recusado: "../fora.md" fora da raiz observada /w
open-file · abertura falhou: sumiu.md: ENOENT
reading   · leitura lançou: /w: Error: disco recusou (com a pilha)
bridge    · envio adiado: setEntry com a visão oculta, releitura pendente
bridge    · entrega incerta: o editor não confirmou setEntry
router    · comando recusado: "dispatch" é reservado e não tem tratador nesta versão
```

### Mapa dos dezoito cenários de aceitação (T032)

| # | Cenário do `requirements.md` | Onde é verificado |
|---|---|---|
| 1 | painel preenchido na abertura | `tests/host-provider.spec.ts`, "envia o estado de carregando e depois a carga de dados" |
| 2 | nada é enviado antes do pronto | `tests/host-provider.spec.ts`, "não lê o disco antes do pronto"; `tests/host-bridge.spec.ts`, "nada é enviado antes da chegada do pronto" |
| 3 | releitura pelos dois caminhos | `tests/host-provider.spec.ts`, "o botão e o comando de paleta produzem cargas da mesma forma" |
| 4 | editor aberto sem pasta | `tests/host-root.spec.ts`, "devolve no-folder e não chama a leitura"; `tests/host-provider.spec.ts`, "sem pasta alguma" |
| 5 | várias raízes com Reversa apenas na segunda | `tests/host-root.spec.ts`, "observa a segunda, ignora a primeira e lê duas vezes" |
| 6 | abrir arquivo apontado pelo painel | `tests/host-open-file.spec.ts`, "resolve para o absoluto dentro da raiz e abre uma vez" |
| 7 | caminho com travessia de diretório | `tests/host-open-file.spec.ts`, os cinco casos de recusa |
| 8 | comando desconhecido | `tests/host-router.spec.ts`, "com nome desconhecido, nomeando o que recebeu" |
| 9 | comando reservado de despacho | `tests/host-router.spec.ts`, "produz exatamente uma linha nomeando-o reservado" |
| 10 | camada de leitura lança exceção | `tests/host-reading.spec.ts`, "captura, registra a pilha e devolve o estado de erro"; `tests/host-provider.spec.ts`, "leitura que falhou vira estado de erro" |
| 11 | painel alcançável sem comando de paleta | `tests/host-manifest.spec.ts`, contêiner e ícone. **Lacuna parcial:** que o ícone apareça de fato na barra só se vê na tela, e isso é T031 |
| 12 | ativação restrita à visão | `tests/host-manifest.spec.ts`, "um único evento, o da visão, e nenhum coringa". **Lacuna parcial:** que o editor não carregue a extensão antes disso só se vê na tela |
| 13 | workspace sem instalação do Reversa | `tests/host-reading.spec.ts`, "nomeia o estado como no-reversa e envia o processo assim mesmo" |
| 14 | documento servido com política restrita | `tests/host-document.spec.ts`, o bloco inteiro da política |
| 15 | retorno à visão sem nova leitura | `tests/host-provider.spec.ts`, "ocultar e reexibir não dispara leitura nova"; `tests/host-bridge.spec.ts`, "ao voltar a visibilidade sem pendência, não pede nada" |
| 16 | ponto único de travessia | `tests/host-boundaries.spec.ts`, os três casos do bloco de RF-17 |
| 17 | documento provisório prova o canal | **Lacuna:** só a verificação manual de T031 fecha este cenário. `tests/host-boundaries.spec.ts` cobre a metade estática, que a interface do host é tomada uma única vez |
| 18 | host exercitado sem o editor real | A suíte inteira: nenhum caso abre o editor, e `tests/host-boundaries.spec.ts` prova que só dois arquivos o importam. A configuração do executor segue sem apelido de módulo |

Dezesseis dos dezoito cenários têm teste automatizado. Os cenários 11 e 12 têm prova documental no
manifesto e prova visual pendente; o 17 depende só da verificação manual.

### T031 não executada: por quê

O ambiente desta sessão é um contêiner de desenvolvimento sem interface gráfica. O comando `code`
disponível aqui é o cliente remoto do servidor do editor, e o `--help` dele, com 54 linhas, não traz
`--extensionDevelopmentPath`: ele encaminha aberturas de arquivo para a janela do cliente, e não
inicia janela de desenvolvimento, que precisa do processo de interface rodando na máquina do
usuário. Não há automação que substitua isso, e o passo 7 do onboarding termina em "olhe a tela",
que nenhum script cumpre.

A ação permanece `[ ]`. Para fechá-la, o mantenedor roda, na máquina onde o editor tem interface:

```
npm ci && npm run compile
code --extensionDevelopmentPath="$PWD" "$PWD"
```

e percorre os passos 6 a 11 do `onboarding.md`.

### T031 em parte cumprida, pelo preview da 005 (2026-09-09, máquina local)

A nota acima previa uma verificação indivisível. Ela não é: o preview entregue pela feature 005
alcança tudo o que é da tela, e sobra para o editor só o que o preview declara não simular. Numa
sessão na máquina local, com navegador, a metade da tela foi percorrida.

**Conferido, e verde:**

| Passo do onboarding | O que foi visto |
|---|---|
| 7, painel preenchido | Os seis itens do cabeçalho, os cinco blocos e as duas seções recolhidas, idênticos à captura do painel dentro do editor |
| 8, o botão de reler | A releitura muda o momento da leitura e conserva o conteúdo, como RN-08 exige |
| 11, sem pasta aberta | Título, explicação e nenhuma ação oferecida |
| 11, pasta sem Reversa | Campos em não declarado, e as duas anomalias de configuração ausente nomeando os arquivos |
| Estado degradado | Cópia do workspace com o estado truncado: cabeçalho vazio, ciclo forward intacto, duas anomalias |
| Falha de leitura | Mensagem em bloco, sem interpretação de marcação, e a ação de tentar de novo |
| Carregando e relendo | Alcançados pelo atraso, cada um no seu quadro |
| Os quatro temas | Claro, escuro e os dois de alto contraste, todos legíveis |

**Três defeitos achados e corrigidos**, cada um travado por teste novo: o cabeçalho declarava
leitura íntegra sobre a tela de falha; os títulos das telas de entrada saíam no tamanho que o
navegador dá a `h1`; e a releitura não tinha sinal na tela, porque a mensagem que abre a sequência
chegava no mesmo ciclo do resultado. O registro em prosa está na seção do portão visual do
`README.md`.

**Continua devido, e só o editor resolve:** o ícone na barra de atividades, o comando de paleta com
a visão visível e com ela oculta, o canal de saída com a linha da postergação, o caso da segunda
raiz do workspace e o do arquivo apagado que o painel aponta. São exatamente os três limites que a
faixa do preview declara em toda tela.

## Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-09-09 | Versão inicial gerada por `/reversa-to-do` | reversa |
| 2026-09-09 | T031 cumprida pela metade da tela, pelo preview da 005; três defeitos corrigidos | reversa |
