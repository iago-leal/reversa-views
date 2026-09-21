# Actions: painel do processo na linha de comando

> Identificador: `014-cli-do-processo`
> Data: `2026-09-20`
> Roadmap: `_reversa_forward/014-cli-do-processo/roadmap.md`

## Resumo

| Métrica | Valor |
|---------|-------|
| Total de ações | 44 |
| Paralelizáveis (`[//]`) | 25 |
| Maior cadeia de dependência | 10 |

A cadeia mais longa é a que vai do vocabulário ao laço vivo:
`T006 → T011 → T017 → T018 → T023 → T024 → T025 → T028 → T029 → T030`, dez elos. A do ponto de
entrada tem o mesmo comprimento e sai do mesmo tronco, em `T028 → T033 → T041`. Tudo o mais
pendura-se nessa espinha em ramos curtos, e é por isso que as seis suítes da camada pura e as cinco
seções do desenho estão marcadas para rodar em paralelo: são o único lugar onde a largura
compensa.

Os identificadores `T042`, `T043` e `T044` estão fora da ordem posicional de propósito: nasceram
da auditoria, depois da primeira geração, e identificador do Reversa não se renumera. Os três
moram nas fases a que pertencem, e não no fim do documento.

O escopo é o inteiro decidido em 2026-09-20: as onze teclas confirmadas, os cinco requisitos
`Should`, a observação do disco com janela de oitocentos milissegundos e a suspensão por `Ctrl+Z`.
Nada foi adiado.

## Fase 1, Preparação

A unidade de compilação vem antes de tudo, e a razão é dura: `out/` inteiro entra no pacote
instalável, de modo que compilar a ferramenta junto com o host a levaria para dentro da extensão
que se instala. Enquanto a T001 e a T002 não estiverem de pé, nenhuma linha de `src/cli/` pode ser
escrita sem risco de acabar no pacote.

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T001 | Acrescentar `src/cli/**` ao `exclude` do manifesto de compilação do host, pela mesma razão que `src/webview/**` já está lá | - | `[//]` | `tsconfig.json` | 🟢 | `[X]` |
| T002 | Criar a unidade de compilação da ferramenta, com `rootDir` em `src`, saída em `out-cli/` e as mesmas opções estritas do host | - | `[//]` | `tsconfig.cli.json` | 🟢 | `[X]` |
| T003 | Ignorar `out-cli/` no versionamento, ao lado de `out/`, com a nota de que é saída de construção | - | `[//]` | `.gitignore` | 🟢 | `[X]` |
| T004 | Declarar no manifesto de scripts o comando `painel`, tendo a compilação da unidade como passo anterior, e o `compile:cli` que a produz | T002 | - | `package.json` | 🟢 | `[X]` |
| T005 | Escrever a casca fina que resolve os argumentos e chama a unidade compilada, recusando rodar sobre saída ausente e nomeando o comando que a produz, no molde de `scripts/preview.js` | T004 | - | `scripts/painel.js` | 🟢 | `[X]` |
| T006 | Nomear em um só lugar as três estruturas efêmeras do `data-delta.md`, mais a tecla e o efeito: estado de navegação, quadro, linha do quadro, observação, tecla nomeada e efeito nomeado | - | `[//]` | `src/cli/tipos.ts` | 🟢 | `[X]` |

## Fase 2, Testes

As suítes da camada pura vêm antes do código que elas cobrem, porque é essa camada que carrega a
promessa de paridade com o painel. As suítes de borda não estão aqui: nascem junto dos módulos que
confinam, na fase 4.

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T007 | Suíte do contrato de linha de comando: cada bandeira, a escolha do modo em três degraus, a precedência de `--dados`, os três códigos de saída e a recusa nomeada de argumento desconhecido | T006 | `[//]` | `tests/cli-argumentos.spec.ts` | 🟢 | `[X]` |
| T008 | Suíte do reconhecimento de teclas por bloco de bytes, com o caso que a D-15 decide: bloco igual a `Esc` é saída, bloco que começa por `Esc [` é seta | T006 | `[//]` | `tests/cli-teclas.spec.ts` | 🟡 | `[X]` |
| T009 | Suíte da máquina de navegação, uma asserção por linha da tabela de teclado, de modo que trocar uma tecla faça a suíte falhar nomeando a tecla trocada | T006 | `[//]` | `tests/cli-navegacao.spec.ts` | 🟢 | `[X]` |
| T010 | Suíte da sessão: a sequência de mensagens chega na ordem do host e a entrada corrente é a que `nextEntry` produz, inclusive depois de uma releitura | T006 | `[//]` | `tests/cli-sessao.spec.ts` | 🟢 | `[X]` |
| T011 | Suíte do quadro puro: as onze seções na ordem fixa, o bloqueio antes de tudo, o recorte à largura sem cortar palavra, a rolagem e a ênfase abstrata sem uma sequência de escape | T006 | `[//]` | `tests/cli-quadro.spec.ts` | 🟢 | `[X]` |
| T044 | Acrescentar à suíte do quadro as asserções das duas telas que faltavam: cada uma das quatro situações de entrada com título e corpo próprios, e a linha que declara de onde veio a leitura corrente e quando | T011 | - | `tests/cli-quadro.spec.ts` | 🟢 | `[X]` |
| T012 | Acrescentar à suíte do pacote a asserção explícita que recusa qualquer caminho de `out-cli/` ou de `src/cli/` dentro do pacote gerado | T001, T002 | `[//]` | `tests/vsix-conteudo.spec.ts` | 🟢 | `[X]` |

## Fase 3, Núcleo

Nada aqui toca o mundo. Toda função desta fase recebe dados e devolve dados, e é essa disciplina
que permite conferir a tela inteira sem abrir um terminal.

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T013 | Leitura dos argumentos e escolha do modo, com a raiz resolvida a partir da bandeira ou do diretório corrente e a raiz inexistente recusada | T007 | - | `src/cli/argumentos.ts` | 🟢 | `[X]` |
| T014 | Sessão: pedir ao host a mesma sequência de mensagens que a tela recebe e manter a entrada corrente alimentando `nextEntry`, sem reimplementar regra alguma | T010 | - | `src/cli/sessao.ts` | 🟢 | `[X]` |
| T015 | Reconhecimento puro de bloco de bytes em tecla nomeada, conforme a D-15, sem temporizador | T008 | - | `src/cli/teclas.ts` | 🟡 | `[X]` |
| T016 | Máquina de navegação: tecla mais estado para estado novo mais efeito nomeado entre `nenhum`, `reler`, `abrir-artefato`, `suspender` e `sair`, com o conjunto inicial de seções fechadas vindo de `effectiveCollapsed` | T009, T015 | - | `src/cli/navegacao.ts` | 🟢 | `[X]` |
| T017 | Medidas do quadro: recorte à largura sem cortar palavra, altura total e deslocamento vertical, que é do que todo desenho depende | T011 | - | `src/cli/quadro/medidas.ts` | 🟢 | `[X]` |
| T018 | Cabeçalho: projeto, raiz observada, instante da leitura, carimbo da construção, revisão do modelo herdado e o desfecho da conferência | T017 | `[//]` | `src/cli/quadro/cabecalho.ts` | 🟢 | `[X]` |
| T019 | Faixa de bloqueio, desenhada antes de qualquer seção, com cada razão nomeada e o comando sugerido | T017 | `[//]` | `src/cli/quadro/bloqueio.ts` | 🟢 | `[X]` |
| T020 | As onze seções na ordem que o painel fixa, cada uma delegando rótulo, recorte e ordem às funções puras da tela, sem regra nova | T017 | `[//]` | `src/cli/quadro/secoes.ts` | 🟢 | `[X]` |
| T021 | Bloco de diagnóstico: aviso de leitura degradada com contagem sempre visível, lista de anomalias com arquivo, código e detalhe, e o relatório da sonda com recusas e truncamentos | T017 | `[//]` | `src/cli/quadro/diagnostico.ts` | 🟢 | `[X]` |
| T022 | Painel de ajuda com a tabela de teclas, desenhado sobre o quadro e escondido pelo mesmo gesto que o revela | T017 | `[//]` | `src/cli/quadro/ajuda.ts` | 🟡 | `[X]` |
| T042 | As quatro situações de entrada, cada uma com título e corpo próprios: raiz inexistente, Reversa não instalado, leitura íntegra e falha de leitura. Nenhuma delas produz tela vazia, e a de projeto sem Reversa explica como instalá-lo, por não ser erro | T017, T044 | `[//]` | `src/cli/quadro/entrada.ts` | 🟢 | `[X]` |
| T043 | A linha da procedência: de onde veio a leitura que está na tela, por tecla, por observação ou por ser a primeira, em que instante, e o aviso de que a observação degradou para intervalo, com a razão | T017, T044 | `[//]` | `src/cli/quadro/procedencia.ts` | 🟢 | `[X]` |
| T023 | Composição do quadro inteiro a partir da carga, do estado de navegação e das dimensões, preenchendo em cada linha o artefato que a confirmação abriria | T018, T019, T020, T021, T022, T042, T043 | - | `src/cli/quadro/index.ts` | 🟢 | `[X]` |

## Fase 4, Integração

É onde o mundo entra, e cada capacidade que o toca fica num módulo só, para que a fronteira seja
verificável por leitura dos fontes.

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T024 | Módulo do terminal: modo bruto, tela alternativa, cursor, dimensões, escrita de bytes, tradução de ênfase em cor e a restauração que devolve o terminal como foi encontrado | T023 | - | `src/cli/terminal.ts` | 🟢 | `[X]` |
| T025 | Módulo do editor: criação do processo sem passar pelo shell, com o valor de `VISUAL` ou `EDITOR` dividido em palavras, e a dança da suspensão em quatro passos | T024 | - | `src/cli/editor.ts` | 🟢 | `[X]` |
| T026 | Módulo da observação: assinatura das pastas que importam, agrupamento numa janela de oitocentos milissegundos e degradação para releitura a cada dois segundos, com a razão declarada | T006 | `[//]` | `src/cli/observacao.ts` | 🟡 | `[X]` |
| T027 | Conferência de atualização pelo módulo e pela porta que já existem, desligável por bandeira e por variável de ambiente, sem abrir conexão nova | T013, T014 | - | `src/cli/conferencia.ts` | 🟢 | `[X]` |
| T028 | O laço vivo, ligando sessão, navegação, quadro, terminal, editor e observação, com a restauração presa à saída normal, à falha não prevista e ao sinal de interrupção | T016, T023, T024, T025, T026 | - | `src/cli/laco.ts` | 🟢 | `[X]` |
| T029 | Tratar a suspensão por `Ctrl+Z` no laço com a mesma dança do editor, redesenhando por inteiro ao retomar | T028 | - | `src/cli/laco.ts` | 🟢 | `[X]` |
| T030 | Redesenhar ao redimensionamento da janela preservando a seleção e o conjunto de seções fechadas | T029 | - | `src/cli/laco.ts` | 🟡 | `[X]` |
| T031 | Modo de uma passada: o mesmo quadro, sem tela alternativa, sem cor quando o destino não a aceita, com caminho relativo à raiz em cada artefato apontado | T023, T027 | - | `src/cli/passada.ts` | 🟢 | `[X]` |
| T032 | Saída legível por máquina: um documento JSON com raiz, instante, entrada nomeada, processo, sonda e conferência, sem linha alguma de apresentação | T014, T027 | - | `src/cli/dados.ts` | 🟡 | `[X]` |
| T033 | Ponto de entrada: escolher o modo pelos três degraus do contrato, separar o canal de erro do canal padrão e terminar com o código que cada desfecho pede | T013, T028, T031, T032 | - | `src/cli/index.ts` | 🟢 | `[X]` |
| T034 | Suíte de fronteiras: nenhuma escrita de arquivo em módulo algum, a criação de processo num módulo só, a assinatura do disco num módulo só, e nenhuma sequência de escape fora do módulo do terminal | T024, T025, T026 | `[//]` | `tests/cli-boundaries.spec.ts` | 🟢 | `[X]` |
| T035 | Suíte de paridade: sobre a mesma carga, painel e terminal afirmam os mesmos fatos, com a mesma ordem de seções e os mesmos rótulos | T023 | `[//]` | `tests/cli-paridade.spec.ts` | 🟢 | `[X]` |
| T036 | Suíte da observação: uma rajada de escritas produz uma releitura só, e a degradação declara a razão em vez de silenciar | T026 | `[//]` | `tests/cli-observacao.spec.ts` | 🟡 | `[X]` |
| T037 | Suíte do modo de uma passada: saída sem sequência de escape, JSON válido, e os três códigos de saída conforme o contrato | T031, T032 | `[//]` | `tests/cli-passada.spec.ts` | 🟢 | `[X]` |

## Fase 5, Polimento

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T038 | Declarar no cabeçalho dos módulos de apresentação o estatuto novo: deixam de ser exclusivos da tela e passam a servir às duas superfícies, sem mudar de lugar | T035 | `[//]` | `src/webview/domain/*.ts` | 🟡 | `[X]` |
| T039 | Prender esse estatuto por suíte, de modo que uma regra nova de apresentação nascida em `src/cli/quadro/` faça a suíte falhar | T034, T038 | - | `tests/cli-boundaries.spec.ts` | 🟡 | `[X]` |
| T040 | Texto do `--ajuda`, descrevendo o uso, e a mensagem de recusa que nomeia o argumento não reconhecido | T013 | `[//]` | `src/cli/uso.ts` | 🟢 | `[X]` |
| T041 | Seção curta sobre o comando novo, ao lado do que já se diz do preview e do auxiliar de prompt | T033 | `[//]` | `README.md` | 🟢 | `[X]` |

## Notas de execução

<!--
Reservado para /reversa-coding registrar avisos ou observações que surgiram durante a execução.
Não use isso para corrigir ações, edits manuais ficam fora desse arquivo, vão direto no código.
-->

Duas observações que a decomposição deixou para quem executar:

1. A T038 toca arquivos fora de `src/cli/`, e é a única que o faz. São cabeçalhos de documentação,
   sem uma linha de comportamento alterada, e a T039 existe para que a mudança de estatuto não
   fique só na prosa.
2. O `onboarding.md` é o portão desta feature, e três dos seus passos não têm suíte que os
   substitua: a saída por `q`, por `Ctrl+C` e por `kill`, mais a suspensão por `Ctrl+Z`. Suíte
   verde não fecha a feature; terminal são, sim.

Três divergências entre o plano e o que a execução exigiu, registradas aqui porque nenhuma
delas cabe no código:

3. A suíte da T035 nasceu como `tests/cli-paridade.spec.tsx`, e não `.spec.ts` como o plano
   escreveu. Ela RENDERIZA o painel para comparar o que as duas superfícies afirmam sobre a
   mesma carga, de modo que carrega JSX, e o `esbuild` do Vitest só o reconhece pela extensão.
   O passo 9 do `onboarding.md` nomeia o arquivo no comando que manda rodar: quem for pelo
   portão roda `npx vitest run tests/cli-paridade.spec.tsx`.
4. A T012 previa tocar só `tests/vsix-conteudo.spec.ts`, mas `tests/host-manifest.spec.ts`
   também precisou mudar, e não por escolha: ela fixa a lista EXATA dos scripts do
   `package.json`, que a T004 aumentou em três, e fixava duas unidades de compilação, que a
   T001 e a T002 tornaram três. Deixá-la como estava seria deixar a suíte vermelha. O bloco
   ganhou, junto, as asserções que faltavam sobre a unidade nova: o `tsconfig.cli.json`, a
   exclusão de `src/cli/**` no anfitrião, a ordem do `prepainel`, o `out-cli/` no `.gitignore`
   e o `.vscodeignore` que não o readmite.
5. A fumaça do laço vivo achou um defeito que nenhuma suíte pegava, porque nenhuma suíte
   cobria o `terminal.ts`: depois de `q`, a tela voltava, o terminal era devolvido e o
   processo NÃO terminava. Pausar a entrada não basta quando ela já recebeu dados, e a alça
   viva segurava o laço de eventos de pé. O `restaurar` passou a soltar a referência da
   entrada, e o `entrar` a retomá-la, o que mantém a dança da suspensão simétrica. A correção
   trouxe `tests/cli-terminal.spec.ts`, que o plano não previa e que prende a devolução do
   terminal nos dois caminhos, com fluxos de mentira e sem terminal nenhum.

## Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-09-20 | Versão inicial gerada por `/reversa-to-do`, depois de aplicadas as nove decisões do formulário `perguntas/teclado-e-escopo.html` | reversa |
| 2026-09-20 | Achados A001 e A003 do `audit/cross-check.md` aplicados: T042, as quatro situações de entrada; T043, a linha da procedência que a RN-09 exige; T044, as asserções das duas na suíte do quadro. A T023 passou a depender das duas telas novas | reversa |
