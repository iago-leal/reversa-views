# Vigilância de regressão: 014-cli-do-processo

**Data:** 2026-09-20
**Feature:** `014-cli-do-processo`
**Cenário:** greenfield.

Este projeto não tem extração de `/reversa`: o contexto vem de `_reversa_sdd/prd.md` e das cinco specs
de `_reversa_sdd/sdd/`. Não há regra 🟢 confirmada sobre código existente, e por isso o watch principal
nasce vazio. O que esta entrega deixou de verdades a manter está em "Observações", sem peso de
regressão. Elas ganham peso quando uma `/reversa` futura, rodando sobre o código novo, confirmar cada
uma como 🟢.

Esta feature acrescenta a primeira **segunda superfície** do projeto, e isso muda a natureza do que se
vigia. Até aqui, uma regressão seria a tela deixar de dizer o que dizia. Agora existe um modo novo de
regredir, mais difícil de ver: as duas superfícies continuarem funcionando e passarem a **discordar**.
Uma cópia de função pura que alguém escreva por conveniência dentro de `src/cli/quadro/`, um rótulo
traduzido duas vezes, um título de seção corrigido num lado só, e o projeto ganha duas verdades sobre o
mesmo processo sem que suíte alguma caia. É contra isso que `tests/cli-boundaries.spec.ts` e
`tests/cli-paridade.spec.tsx` existem, e é por isso que afrouxar qualquer uma delas é o sinal de
violação mais grave desta lista.

A segunda ressalva é a da ausência, herdada da 013 e válida aqui com a mesma força. Boa parte do que a
ferramenta promete é o que ela **não** faz: não escreve, não cria processo além do editor, não abre
conexão além da que já existia, não guarda estado entre execuções, não carrega dependência nova e não
conhece caminho de arquivo do Reversa. Ausência é mais difícil de extrair do que presença: uma extração
futura que não achasse estas verdades estaria diante de lacuna de leitura, e não necessariamente de
regressão. Nesses itens, o sinal de violação é a **presença do que deveria faltar**.

## Watch principal

| ID | Origem (arquivo, seção) | Regra esperada após mudança | Tipo de verificação | Sinal de violação |
|---|---|---|---|---|
| | | | | |

Vazio nesta rodada. Nenhuma regra extraída de código existente foi alterada ou removida, porque nenhuma
foi extraída ainda.

## Histórico de re-extrações

Vazio. Será preenchido pelo agente reverso quando `/reversa` rodar de novo sobre este código.

## Arquivadas

Vazio.

## Observações

Sem peso de regressão. São os requisitos e as decisões que esta entrega implementou, com o lugar onde
cada um vive e o sinal pelo qual uma extração futura perceberia que deixou de ser verdade. Todos
nasceram 🟢 em `requirements.md`, exceto RF-12, RF-14 e RF-21, que nasceram 🟡; RF-21, RF-22 e RF-25 são
`Should` e os demais `Must`.

| ID | Origem (arquivo, seção) | Regra esperada após mudança | Tipo de verificação | Sinal de violação |
|---|---|---|---|---|
| W001 | `requirements.md` RF-01 e RN-01, `src/cli/sessao.ts` | O processo chega por `sessionMessages` e `readWorkspace`; nenhum fonte da ferramenta carrega caminho literal de arquivo do Reversa, nome de estágio derivado ou cálculo de fase | ausência | Um `.reversa/` ou `_reversa_forward/` escrito no código da ferramenta; uma fase decidida em `src/cli/`; `tests/cli-boundaries.spec.ts` afrouxada |
| W002 | `requirements.md` RF-02 e D-14, `src/cli/quadro/`, `src/webview/domain/` | Rótulo, razão de bloqueio, colapso inicial, integridade e ordem vêm das funções puras do painel, **importadas** e não copiadas | presença | Uma regra de apresentação nascida dentro de `src/cli/quadro/`; uma lista de fases, estágios ou situações escrita ali como literal |
| W003 | `requirements.md` RF-02, `tests/cli-paridade.spec.tsx` | Painel e terminal afirmam os mesmos fatos sobre a mesma carga: mesma ordem de seções, mesmos títulos de cartão, mesmos rótulos | presença | Comparação reduzida a contagem ou a primeiras linhas; um lado alterado sem o outro; a suíte marcada como pulada |
| W004 | `requirements.md` RF-03 e D-12, `src/cli/argumentos.ts` | A raiz vem do argumento explícito e, sem ele, do diretório corrente, e a saída declara qual raiz usou | presença | Raiz adivinhada por subida de diretório sem dizer; leitura sem declarar a raiz |
| W005 | `requirements.md` RF-04, `src/cli/quadro/entrada.ts` | As quatro situações de entrada têm título próprio e corpo próprio, nos dois modos: raiz inexistente, Reversa não instalado, leitura íntegra e falha de leitura | presença | Tela vazia em qualquer uma das quatro; duas situações compartilhando a mesma frase |
| W006 | `requirements.md` RF-05 e RN-03 do painel, `src/cli/quadro/bloqueio.ts` | O bloqueio humano vem antes de qualquer outra seção, com cada razão nomeada e o comando sugerido, e **nada** o fecha | presença | Faixa recolhível; faixa depois de outra seção; razão sem comando quando há comando a sugerir |
| W007 | `requirements.md` RF-06 e RN-04, `src/cli/quadro/secoes.ts` | A ordem das seções é a de `sectionOrder()` e não varia com o processo lido | presença | Ordem decidida por conteúdo; lista de seções escrita à mão na ferramenta |
| W008 | `requirements.md` RF-07, `src/cli/quadro/cabecalho.ts`, `src/cli/quadro/diagnostico.ts` | A leitura degradada é declarada com a contagem sempre visível, e a lista de anomalias é alcançável com arquivo, código e detalhe | presença | Contagem escondida atrás de seção fechada; anomalia sem o detalhe que a torna acionável |
| W009 | `requirements.md` RF-08, `src/cli/quadro/diagnostico.ts` | A sonda expõe pastas lidas, caminhos recusados e arquivos truncados, cada recusa com caminho e motivo | presença | Recusa contada sem ser nomeada; relatório da sonda ausente do modo de uma passada |
| W010 | `requirements.md` RF-09 e RNF de acessibilidade, `src/cli/quadro/index.ts` | O item sob o cursor é identificável **sem cor**, pelo prefixo que ocupa as mesmas duas colunas do recuo | presença | Seleção marcada só por cor ou só por inversão; prefixo que desloca a linha para a direita |
| W011 | `requirements.md` RF-10, `src/cli/navegacao.ts` | Cada seção abre e fecha por tecla, e existe o gesto que abre e o que fecha todas, sobre `COLLAPSIBLE_SECTIONS` | presença | Gesto global alcançando a faixa do bloqueio; lista de recolhíveis escrita à mão |
| W012 | `requirements.md` RF-11, D-08 e D-09, `src/cli/editor.ts` | O editor é criado sem shell, com o caminho resolvido sob a raiz observada, e sem variável declarada a ferramenta **diz qual definir** em vez de falhar calada | presença | `shell: true`; caminho concatenado sem resolver; falha silenciosa quando `VISUAL` e `EDITOR` faltam |
| W013 | `requirements.md` RF-11 e RN-08, `src/cli/laco.ts` | Abrir o editor suspende a interface e a retoma ao fechar, com redesenho **integral** | presença | Redesenho incremental depois do editor; interface que não volta ao modo bruto |
| W014 | `requirements.md` RF-12, `src/cli/quadro/ajuda.ts` | A lista das teclas está a um gesto de distância, e nomeia toda ação alcançável | presença | Tecla existente fora da tabela; ajuda que só o README documenta |
| W015 | `requirements.md` RF-13, RN-09, D-10 e D-11, `src/cli/observacao.ts` | A releitura por observação agrupa a rajada numa janela de 800 ms, e a degradação relê a cada 2000 ms **declarando a razão** | presença | Uma releitura por evento de disco; degradação silenciosa; janela ou intervalo alterados sem a suíte |
| W016 | `requirements.md` RF-13 e RN-09, `src/cli/quadro/procedencia.ts` | A tela diz de onde veio o que está nela: primeira leitura, tecla ou observação, e quando a mudança ocorreu | presença | Tela que muda sozinha sem dizer; procedência afirmada sem instante |
| W017 | `requirements.md` RF-14, `src/cli/laco.ts` | Redimensionar refaz as contas de largura e altura **sem tocar no estado**: seleção e seções fechadas sobrevivem | presença | Seleção reiniciada ao estreitar a janela; seção fechada reaberta pelo redesenho |
| W018 | `requirements.md` RF-15 e RN-08, `src/cli/terminal.ts`, `src/cli/laco.ts` | O terminal é devolvido nos quatro caminhos: saída normal, falha não prevista, interrupção e suspensão; a devolução é idempotente | presença | Um caminho de saída sem restauração; restauração que quebra ao rodar duas vezes; terminal exigindo `reset` do usuário |
| W019 | `requirements.md` RF-16, `src/cli/terminal.ts`, `tests/cli-terminal.spec.ts` | A tecla de saída encerra com código zero **e o processo termina**: devolver a tela não basta, a referência da entrada é solta | presença | Ferramenta de pé depois de `q`, com a tela devolvida; `process.exit` posto no lugar da devolução; `unref` removido do `restaurar` |
| W020 | `requirements.md` RF-17 e D-12, `src/cli/index.ts`, `src/cli/passada.ts` | Sem terminal na saída, ou com a bandeira, a ferramenta imprime uma vez e termina, sem jamais tomar o controle da tela | ausência | Tela alternativa aberta num destino redirecionado; modo vivo escolhido por ausência de bandeira |
| W021 | `requirements.md` RF-18, `src/cli/quadro/index.ts` | Cada artefato apontado aparece como caminho **relativo à raiz**, no formato que se cola num editor | presença | Prefixo absoluto na saída; caminho encurtado com til ou reticências |
| W022 | `requirements.md` RF-19 e D-05, `src/cli/terminal.ts`, `src/cli/quadro/medidas.ts` | Sem cor quando `NO_COLOR` está declarado ou a saída não é terminal, e sem palavra cortada ao meio em oitenta colunas | ausência | Sequência de escape no arquivo redirecionado; sequência de escape em módulo que não seja `terminal.ts`; palavra quebrada na janela estreita |
| W023 | `requirements.md` RF-20, `src/cli/argumentos.ts`, `src/cli/passada.ts` | Três códigos e só três: zero quando a leitura ocorreu, inclusive degradada e inclusive sem Reversa instalado; um quando a leitura falhou; dois quando o uso está incorreto | presença | Leitura degradada terminando em código diferente de zero; raiz inexistente terminando em zero; quarto código inventado |
| W024 | `requirements.md` RF-21, `src/cli/dados.ts` | A saída legível por máquina é JSON válido com a mesma carga que a ponte envia à tela, sem uma linha de apresentação misturada | ausência | Título de seção ou rótulo traduzido dentro do documento; carga recomposta em vez de serializada |
| W025 | `requirements.md` RF-22, `src/cli/quadro/cabecalho.ts` | Carimbo da construção e revisão do modelo herdado aparecem e **coincidem** com os do painel na mesma árvore | presença | Um dos dois ausente; valor recalculado em vez de lido do mesmo módulo |
| W026 | `requirements.md` RF-23 e D-13, `src/cli/index.ts`, `src/cli/conferencia.ts` | A conferência é padrão e se desliga por bandeira **e** por variável de ambiente; desligada, nenhuma conexão é aberta e a tela declara isso nas palavras do terminal | ausência | Conexão aberta com a conferência desligada; o desfecho `desligada` do editor repetido no terminal, que afirmaria uma chave de configuração inexistente |
| W027 | `requirements.md` RF-24 e RN-10, `src/cli/conferencia.ts` | A consulta passa pelo módulo que já existia, com os mesmos desfechos nomeados, inclusive o de tempo esgotado; nenhum módulo novo importa cliente de requisição | ausência | Um segundo lugar no projeto nomeando `originPort`; cliente de rede em `src/cli/`; desfecho novo que o painel não conhece |
| W028 | `requirements.md` RF-25, `src/cli/uso.ts` | O `--ajuda` descreve o uso, e o argumento não reconhecido é **nomeado** na recusa, com código dois e sem leitura pela metade | presença | Recusa genérica; leitura impressa antes da recusa; argumento novo sem entrada no texto de uso |
| W029 | `requirements.md` RF-26, `package.json` | Nenhuma dependência de tempo de execução foi acrescentada: terminal, teclado e desenho saem do que o interpretador oferece | ausência | Biblioteca de terminal no manifesto; a ferramenta exigindo instalação numa cópia recém-clonada |
| W030 | `requirements.md` RN-02, `src/cli/` inteiro | A ferramenta **não escreve**: nenhuma função capaz de criar, escrever, remover ou renomear é alcançável em módulo algum | ausência | Qualquer escrita de arquivo em `src/cli/`; preferência de seções guardada em disco entre execuções |
| W031 | `requirements.md` RN-03 e D-07, `src/cli/editor.ts`, `src/cli/observacao.ts`, `src/cli/terminal.ts` | Três capacidades, três módulos, uma cada: criação de processo, assinatura de disco e controle de terminal, confinadas e verificáveis por busca nos fontes | ausência | `spawn` fora de `editor.ts`; `watch` fora de `observacao.ts`; sequência de escape fora de `terminal.ts` |
| W032 | `requirements.md` RN-05, `src/cli/laco.ts` | Nenhum estado sobrevive entre execuções: o colapso inicial é o que `effectiveCollapsed` decide, com a preferência vazia, toda vez | ausência | Arquivo de preferência lido ou escrito; colapso inicial divergindo do que o painel decide para a mesma carga |
| W033 | `requirements.md` RN-06, `src/cli/quadro/cabecalho.ts` | A saída declara sempre a raiz observada e o instante da leitura em Brasília, nos dois modos | presença | Leitura impressa sem raiz; instante em fuso do sistema em vez do declarado |
| W034 | `requirements.md` RN-07, `src/cli/teclas.ts`, `src/cli/navegacao.ts` | Toda ação da interface viva se alcança por tecla, e o reconhecimento é por **bloco de bytes**, sem temporizador: bloco igual a `Esc` é sair, bloco iniciado por `Esc [` é seta | presença | Um relógio dentro do reconhecimento; ação alcançável só por mouse; `Esc` e seta confundidos |
| W035 | `roadmap.md` D-03, `tsconfig.json`, `tsconfig.cli.json`, `tests/vsix-conteudo.spec.ts` | A ferramenta compila numa unidade própria, com saída em `out-cli/`, e **nenhum** caminho de `src/cli/` ou `out-cli/` entra no pacote instalável | ausência | `src/cli/**` fora do `exclude` do anfitrião; saída da ferramenta dentro de `out/`; a asserção do pacote afrouxada |
| W036 | `roadmap.md` D-04, `scripts/painel.js`, `package.json` | A casca não decide nada: confere a unidade construída, nomeia o comando que a constrói e entrega os argumentos crus | presença | Lógica de leitura ou de desenho migrando para a casca; `build` passando a invocar a ferramenta |
| W037 | `roadmap.md` D-14, `src/webview/domain/*.ts` | Os quinze módulos da apresentação compartilhada declaram o estatuto em cabeçalho, e a pasta **não se move** | presença | Um módulo sem a declaração; a pasta movida, o que tocaria toda a tela e todo adendo sem mudar comportamento |
| W038 | `onboarding.md` passo 3 | Os caminhos que nenhuma suíte substitui seguem verdadeiros em terminal de verdade: sair por `q`, por `Ctrl+C` e por `kill`, e suspender por `Ctrl+Z` | presença | Terminal sem eco depois de qualquer um dos quatro; retomada sem redesenho integral |
