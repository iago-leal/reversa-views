# Actions: visual do painel de linha de comando

> Identificador: `016-visual-do-painel-cli`
> Data: `2026-09-21`
> Roadmap: `_reversa_forward/016-visual-do-painel-cli/roadmap.md`

## Resumo

| Métrica | Valor |
|---------|-------|
| Total de ações | 57 |
| Paralelizáveis (`[//]`) | 27 |
| Maior cadeia de dependência | 18 |

Esta é a segunda versão, que segue a segunda versão do roadmap. Os identificadores de T001 a T050 são
os da primeira: nenhum foi reciclado nem renumerado, e as ações novas vão de T051 a T057, postas na
fase a que pertencem, ao fim da tabela dela. Por isso a ordem dos números não é a ordem de execução;
quem manda é a coluna de dependências.

A cadeia mais longa vai do vocabulário ao README, passando pelas amostras gravadas:
`T001 → T004 → T022 → T023 → T024 → T025 → T031 → T036 → T057 → T038 → T041 → T042 → T043 → T044 → T046 → T056 → T047 → T050`,
dezoito elos, conferidos por script sobre a coluna de dependências. Os dois elos a mais vêm da quebra
da T036 e da T046, que a auditoria apontou no limite do atômico. Quatro ações seguidas, de T022 a T025,
são passos sobre o mesmo arquivo, `src/cli/quadro/index.ts`: o compositor é a espinha da feature, e não
há largura possível ali. A largura está nos módulos puros da fase 1, nas suítes da fase 2 e nos módulos
de `quadro/` que o compositor só encontra em T023 e T024.

A ordem tem um ponto de controle que decide tudo o mais. **T001 é só acréscimo**: os campos novos
entram opcionais, `enfase` permanece, e a unidade de terminal compila a cada ação. A remoção de
`enfase` é a T041, depois que o compositor, o terminal, o laço e a passada já não a leem. Invertida a
ordem, a primeira ação quebraria a compilação de doze arquivos e nenhuma das seguintes poderia rodar a
suíte que a cobre.

Cinco suítes existentes mudam de expectativa, e cada uma tem ação própria que **declara a mudança como
de disposição** no próprio arquivo: `cli-quadro` (T026), `cli-navegacao` (T028), `cli-terminal` (T032),
`cli-argumentos` (T034) e `cli-passada` (T040). `tests/cli-paridade.spec.tsx` e as suítes da saída de
dados não são alvo de ação alguma, e é essa ausência que o critério de pronto confere.
`tests/cli-boundaries.spec.ts` só recebe acréscimo, em duas ações, a do valor de cor (T048) e a dos
nomes vigiados (T055).

Não há premissa a vigiar. O acento em dois papéis (D-04), que a primeira versão concentrava na T002
como premissa, foi confirmado na segunda rodada de esclarecimento. A T002 continua 🟡 só pelos códigos
de 16 cores (D-06).

## Fase 1, Preparação

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T001 | Acrescentar o vocabulário novo **sem remover nada**: `PAPEIS` e `Papel`, `Trecho`, `MarcaDeEstado`, `SecaoDoTerminal` com o nome `versoes`, `GrauDeCor`, `Fundo`, `JogoDeGlifos` e `Apresentacao`; e, como campos **opcionais**, `trechos` e `selecionada` em `LinhaDoQuadro`, `linhaDeEstado` em `Quadro`, `marca` e `secundarios` em `ItemDaSecao` (D-01, D-02, D-15, D-17, `data-delta.md` seções 1 a 3) | - | - | `src/cli/tipos.ts` | 🟢 | `[X]` |
| T002 | Criar a paleta como dado puro: para cada papel e cada fundo, o tom de 24 bits, o índice de 256 e o código de 16 cores, pela tabela de `data-delta.md` seção 5, com `acento` e `destaque` separados; nenhuma sequência de escape e nenhuma função de decisão (RN-04, D-03, D-04, D-05, D-06) | T001 | `[//]` | `src/cli/paleta.ts` | 🟡 | `[X]` |
| T003 | Criar os dois jogos de glifos, Unicode e sete bits, de mesma forma, pela tabela de `data-delta.md` seção 4, com a largura em colunas de cada um (D-12) | T001 | `[//]` | `src/cli/quadro/glifos.ts` | 🟢 | `[X]` |
| T004 | Criar `neutralizar`: C0, DEL e C1 viram figuras de controle do Unicode ou notação de circunflexo conforme o jogo de glifos, e espaço em branco de controle vira espaço; a expressão usa intervalo de pontos de código e não escreve o caractere de escape (D-20) | T001 | `[//]` | `src/cli/quadro/higiene.ts` | 🟢 | `[X]` |
| T005 | Criar a decisão pura do degrau de cor e do jogo de glifos sobre o ambiente declarado: `NO_COLOR`, `COLORTERM`, `TERM`, e a primeira declarada entre `LC_ALL`, `LC_CTYPE` e `LANG`; a função recebe o mapa do ambiente e um booleano de terminal, e nenhum fluxo (RF-11, RF-12, D-07) | T001 | `[//]` | `src/cli/ambiente.ts` | 🟢 | `[X]` |
| T006 | Acrescentar a decisão pura do fundo: bandeira, variável, `COLORFGBG` pelo último campo, e escuro; valor de variável não reconhecido devolve o aviso em vez de escrevê-lo (RN-08, D-08) | T005 | - | `src/cli/ambiente.ts` | 🟡 | `[X]` |
| T007 | Acrescentar `truncar`, o recorte de uma linha só com reticências recebidas por parâmetro, contando pontos de código como `recortar` (D-18) | - | `[//]` | `src/cli/quadro/medidas.ts` | 🟢 | `[X]` |
| T008 | Fazer `ajustarDeslocamento` aceitar o tamanho do bloco a manter visível, com o valor padrão de uma linha, de modo que nenhuma chamada existente mude de resultado (D-19) | T007 | - | `src/cli/quadro/medidas.ts` | 🟢 | `[X]` |

## Fase 2, Testes

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T009 | Suíte da paleta: todo papel tem valor nos dois fundos e nos três degraus; o contraste de cada papel de texto, medido pela fórmula da WCAG sobre preto e sobre branco, em 24 bits e no tom do índice de 256, é de ao menos 4,5; o da borda, ao menos 2; o do `acento`, que só veste marca, ao menos 3; o `acento` é o mesmo nos dois fundos, e o `destaque` difere dele só no claro (RF-01, RN-04, NFR de contraste) | T002 | `[//]` | `tests/cli-paleta.spec.ts` | 🟢 | `[X]` |
| T010 | Suíte do ambiente: cada degrau de cor, a queda para o inferior na dúvida, os dois jogos de glifos com a localidade `C` e sem localidade, a precedência do fundo nos quatro degraus, `COLORFGBG` ilegível, e o aviso da variável inválida (RF-11, RF-14, RF-20, RF-21) | T006 | `[//]` | `tests/cli-ambiente.spec.ts` | 🟢 | `[X]` |
| T011 | Suíte da higiene: a sequência de limpar a tela sai como texto visível nos dois jogos; C1 e DEL são neutralizados; texto acentuado em português passa intacto; o resultado não contém ponto de código de controle (NFR de segurança) | T004 | `[//]` | `tests/cli-higiene.spec.ts` | 🟢 | `[X]` |
| T012 | Suíte da moldura e dos glifos, escrita antes do módulo: os dois jogos têm as mesmas chaves; toda linha da caixa mede exatamente a largura pedida; o título vai na borda superior; o conteúdo é recortado a `largura - 4`; o jogo de sete bits só produz caracteres de sete bits; seção aberta, seção fechada e seleção são distintas entre si nos dois jogos (RF-02, RF-03, RF-14, RN-03) | T003 | `[//]` | `tests/cli-moldura.spec.ts` | 🟢 | `[X]` |
| T013 | Suíte da linha de estado, escrita antes do módulo: com o quadro mais alto que a janela, a linha de estado não entra em `linhas` nem em `alturaTotal`; a janela tem `altura - 1` linhas; a posição declara acima, abaixo ou os dois; a procedência é truncada antes de as teclas sumirem, e a posição nunca some; a observação degradada aparece no papel de atenção; os casos de `truncar` (RF-08, RF-10, D-17, D-18, D-24) | T007 | `[//]` | `tests/cli-linha-de-estado.spec.ts` | 🟢 | `[X]` |
| T053 | Acrescentar à suíte do ambiente a asserção de que a decisão não tem por onde escrever: a função aceita só o mapa do ambiente e o booleano de terminal, e decide o fundo sem fluxo algum (RF-20, D-07) | T010 | - | `tests/cli-ambiente.spec.ts` | 🟢 | `[X]` |

## Fase 3, Núcleo

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T014 | Criar a moldura como função pura: título, linhas já recortadas, papel da borda e jogo de glifos entram, linhas com trechos saem, com o título na borda superior (D-11) | T003, T012 | `[//]` | `src/cli/quadro/moldura.ts` | 🟢 | `[X]` |
| T015 | Criar a linha de estado: glifo da observação, primeira frase de `linhasDaProcedencia` truncada, teclas principais e posição "linhas A–B de N" com os glifos de acima e abaixo, cedendo espaço na ordem da D-18 (RF-08, RF-10) | T003, T007, T013 | `[//]` | `src/cli/quadro/linha-de-estado.ts` | 🟢 | `[X]` |
| T016 | Criar a seção de versões, com o nome `versoes` e o título "Versões e construção": versão do Reversa, revisão do modelo herdado, versão da extensão, carimbo, desfecho da conferência ou a frase de conferência desligada, e, ao fim, as linhas inteiras de `linhasDaProcedencia`, com os rótulos e as funções de origem de hoje; `quadro/procedencia.ts` e o tipo `Procedencia` não são tocados (RF-18, D-15, D-16, `data-delta.md` seção 6) | T001 | `[//]` | `src/cli/quadro/secao-de-versoes.ts` | 🟡 | `[X]` |
| T017 | Reduzir o cabeçalho ao núcleo: o nome da ferramenta e os quatro fatos, projeto, raiz observada, instante e integridade, devolvendo também se a leitura degradou, para que o compositor escolha o papel da linha (RF-02) | T016 | - | `src/cli/quadro/cabecalho.ts` | 🟢 | `[X]` |
| T018 | Na decomposição e no registro de bugs, tirar o glifo de estado do texto e devolvê-lo em `marca`; na decomposição, tirar do texto o caminho e o instante e devolvê-los em `secundarios`; na origem, tirar o caminho do texto (RF-05, RF-06, D-13) | T001 | `[//]` | `src/cli/quadro/secoes.ts` | 🟡 | `[X]` |
| T019 | Fazer `secoesDoQuadro` receber o jogo de glifos e usar o separador de campos dele no lugar do ` · ` literal, sem mudar frase alguma (D-12) | T018, T003 | - | `src/cli/quadro/secoes.ts` | 🟢 | `[X]` |
| T020 | Na faixa de bloqueio, compor o texto principal com a razão e o comando sugerido, pelo separador do jogo de glifos, e deixar o artefato só no campo `artefato` (D-14) | T003 | `[//]` | `src/cli/quadro/bloqueio.ts` | 🟡 | `[X]` |
| T021 | Dar o mesmo tratamento do separador às três seções de diagnóstico, política, anomalias e sonda, que passam a receber o jogo de glifos (RF-14, D-12) | T003 | `[//]` | `src/cli/quadro/diagnostico.ts` | 🟢 | `[X]` |
| T022 | No compositor, criar o construtor único de trecho, que chama `neutralizar`, e fazer `empurrar` produzir `trechos` e `selecionada` ao lado de `enfase`; `indiceDaSelecao` e `artefatoSelecionado` passam a achar a linha por `selecionada` (D-01, D-20) | T004 | - | `src/cli/quadro/index.ts` | 🟢 | `[X]` |
| T023 | No compositor, receber `apresentacao` em `EntradaDoQuadro` e desenhar os itens na linguagem nova: glifo de seção antes do título, com a contagem no papel atenuado (RF-04); marca de estado no papel do estado (RF-05); cada secundário em linha própria, recuado, atrás do glifo de continuação, no atenuado (RF-06); glifo de seleção no `acento` com o texto no `destaque` (RF-07) (D-10, D-13) | T022, T019, T020, T021 | - | `src/cli/quadro/index.ts` | 🟢 | `[X]` |
| T024 | No compositor, emoldurar o núcleo do cabeçalho no `acento`, a situação de entrada no papel dela, com `falha` na falha de leitura, e a faixa de bloqueio em `atencao` com o glifo de atenção no título, só quando `molduras` for verdadeiro e a largura for de 60 ou mais; sem bloqueio, a frase de hoje e nenhuma moldura; acrescentar a seção de versões ao fim, por `secoesDoTerminal()` (RF-02, RF-03, RF-09, RF-13, RF-18, D-15) | T023, T014, T017 | - | `src/cli/quadro/index.ts` | 🟢 | `[X]` |
| T025 | No compositor, fazer `comporQuadro` recortar a janela em `altura - 1` quando houver linha de estado, compô-la por `linha-de-estado.ts`, devolvê-la em `Quadro.linhaDeEstado`, e exportar o tamanho do bloco do item selecionado, a linha principal mais as secundárias (D-17, D-19) | T024, T015, T008 | - | `src/cli/quadro/index.ts` | 🟢 | `[X]` |
| T026 | Reescrever as expectativas de **disposição** da suíte do quadro, declarando no cabeçalho do arquivo e em cada caso tocado que a mudança é de disposição; acrescentar os casos do núcleo em moldura, do bloqueio, dos glifos de seção e de ação, do secundário em linha própria, da janela de 59 colunas, da cor desligada e da invariante `trechos` igual a `texto`; nenhuma expectativa de fato, de ordem ou de ausência de escape é afrouxada (RF-15, RF-12) | T025 | - | `tests/cli-quadro.spec.ts` | 🟢 | `[X]` |
| T027 | Fazer a navegação andar sobre `SecaoDoTerminal`: doze seções navegáveis, `z` e `a` alcançando a de versões, nenhuma tecla nova nem trocada (RF-18) | T001 | `[//]` | `src/cli/navegacao.ts` | 🟢 | `[X]` |
| T028 | Acrescentar à suíte da navegação os casos da décima segunda seção, o salto circular por doze, o `fim` com a janela uma linha menor e o ajuste de deslocamento por bloco; o que for reescrito é declarado como de disposição (D-19, D-24) | T027, T008 | - | `tests/cli-navegacao.spec.ts` | 🟢 | `[X]` |
| T029 | Emoldurar o painel de ajuda sob o título "Teclas", com a coluna das teclas no `acento` e as promessas no atenuado, passando todo texto pelo construtor de trecho (RF-09) | T014, T022 | `[//]` | `src/cli/quadro/ajuda.ts` | 🟢 | `[X]` |
| T030 | Criar `vestirLinha`: traduz papel, degrau e fundo em sequência a partir de `paleta.ts`, funde trechos vizinhos de mesmo papel e fecha a cor ao fim de cada linha; com o degrau "nenhuma", devolve o texto cru; `vestir` permanece até a T041 (D-21) | T002, T022 | `[//]` | `src/cli/terminal.ts` | 🟢 | `[X]` |
| T031 | Fazer `criarTerminal` receber a `Apresentacao`, desenhar as linhas por `vestirLinha` e escrever a linha de estado por posicionamento absoluto na última linha da janela (D-17) | T030, T025 | - | `src/cli/terminal.ts` | 🟢 | `[X]` |
| T032 | Atualizar a suíte do terminal: a tradução de cada papel nos quatro degraus e nos dois fundos, a fusão de trechos, o fechamento por linha, a cor desligada sem sequência alguma, e a linha de estado na última linha; os casos de `vestir` reescritos são declarados como de disposição (RF-11, RF-12) | T031 | - | `tests/cli-terminal.spec.ts` | 🟢 | `[X]` |
| T051 | Acrescentar à suíte do quadro o caso de ponta a ponta do texto hostil: um quadro composto sobre uma ação cuja descrição traz a sequência de limpar a tela não contém ponto de código de controle em linha alguma, nem em `texto` nem em `trechos`, e a sequência aparece como texto visível (NFR de segurança, D-20) | T026 | - | `tests/cli-quadro.spec.ts` | 🟢 | `[X]` |
| T052 | Acrescentar à suíte do quadro o caso nomeado de desempenho: compor um quadro de 500 linhas, já com a ênfase por trecho, leva menos de 50 ms (NFR de desempenho, D-21) | T051 | - | `tests/cli-quadro.spec.ts` | 🟢 | `[X]` |
| T054 | Acrescentar à suíte do terminal a asserção de que o primeiro byte escrito pelo laço é o do primeiro desenho: nenhuma pergunta ao terminal o antecede (RF-20, D-07) | T032 | - | `tests/cli-terminal.spec.ts` | 🟢 | `[X]` |

## Fase 4, Integração

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T033 | Reconhecer `--tema=<fundo>`, recusar valor desconhecido ou vazio como uso incorreto nomeando o valor, e acrescentar a `Configuracao` o campo `apresentacao` e à leitura o campo `aviso`, ambos por `ambiente.ts`, mantendo `cor: boolean` (D-09, `interfaces/contrato-de-linha-de-comando.md` seções 1 a 4) | T006 | `[//]` | `src/cli/argumentos.ts` | 🟢 | `[X]` |
| T034 | Acrescentar à suíte dos argumentos os casos do tema: bandeira válida, bandeira inválida com código de uso, bandeira vencendo a variável, variável inválida com aviso e sem recusa, e a invariante entre `cor` e o degrau; as expectativas de `config` que ganham campo são declaradas como acréscimo (RF-20, RF-21) | T033 | - | `tests/cli-argumentos.spec.ts` | 🟢 | `[X]` |
| T035 | Descrever `--tema=` e `REVERSA_VIEWS_TEMA` no texto de uso, e dizer que `--sem-cor` preserva molduras e glifos (RF-12) | T033 | `[//]` | `src/cli/uso.ts` | 🟢 | `[X]` |
| T036 | No laço, tirar a altura útil de um ponto só, descontando a linha de estado e o recado; passar `apresentacao` com `molduras` verdadeiro; desenhar o recado como trecho de atenção acima da linha de estado (D-10, D-17) | T031, T027 | - | `src/cli/laco.ts` | 🟢 | `[X]` |
| T037 | Na passada, passar `apresentacao` com `molduras` falso e o jogo de glifos recebido, e oferecer o texto vestido por `vestirLinha` quando o degrau não for "nenhuma", sem que sequência alguma nasça neste módulo (RF-19, D-10) | T030, T025 | `[//]` | `src/cli/passada.ts` | 🟢 | `[X]` |
| T038 | No ponto de entrada, entregar a `Apresentacao` ao terminal, ao laço e à passada; escrever o aviso de tema no canal de erro antes de entrar na tela (RF-21, D-09) | T033, T057, T037 | - | `src/cli/index.ts` | 🟢 | `[X]` |
| T039 | No ponto de entrada, desenhar o título da raiz inexistente no papel de falha quando o canal de erro for terminal com cor, sem moldura; fora de terminal, o texto de hoje, sem sequência alguma (RF-09, D-22, `interfaces/contrato-de-linha-de-comando.md` seção 8) | T038 | - | `src/cli/index.ts` | 🟢 | `[X]` |
| T040 | Reescrever as expectativas de **disposição** da suíte da passada, declaradas como tais, e acrescentar as garantias da RN-06: nenhuma sequência de escape e nenhum caractere de moldura no texto redirecionado, nenhuma linha além de oitenta colunas, a seção "Versões e construção" ao fim com a frase de procedência, o secundário em linha própria, e o texto vestido igual ao redirecionado depois de retiradas as sequências de cor (RF-15, RF-19, RN-06) | T037 | `[//]` | `tests/cli-passada.spec.ts` | 🟢 | `[X]` |
| T041 | Remover `enfase`, `ENFASES` e `Enfase`, tornar obrigatórios `trechos`, `selecionada` e `linhaDeEstado`, e retirar `vestir` e o que mais ainda os lia, com a unidade de terminal compilando limpa | T026, T028, T029, T032, T036, T057, T038, T040 | - | `src/cli/tipos.ts` | 🟢 | `[X]` |
| T042 | Criar a função pura das amostras: de um estado fixo para um mapa de nome em texto, com um quadro por degrau de cor no fundo escuro, o de 24 bits no fundo claro, um por situação de entrada que chega à interface viva, que são três, a ajuda, a janela de 59 colunas e o jogo de sete bits; a raiz inexistente não tem quadro e não tem amostra (RF-17, D-23) | T041 | - | `src/cli/amostras.ts` | 🟢 | `[X]` |
| T043 | Criar a casca que grava as amostras: confere `out-cli/`, recusa rodar sem ela nomeando `npm run compile:cli`, lê `amostras/painel/estado.json` e escreve um arquivo por amostra em `amostras/painel/` | T042 | - | `scripts/amostras-do-painel.js` | 🟢 | `[X]` |
| T044 | Declarar `preamostras:painel`, com `npm run compile:cli`, e `amostras:painel`, sem tocar em `dependencies` nem em `build` | T043 | - | `package.json` | 🟢 | `[X]` |
| T045 | Atualizar a enumeração de scripts do manifesto, de trinta para trinta e dois, como mudança de expectativa, e não de regra | T044 | `[//]` | `tests/host-manifest.spec.ts` | 🟢 | `[X]` |
| T046 | Gravar o estado fixo: uma carga de leitura com bloqueio, decomposição com ações fechadas, próxima e abertas, e instante congelado | T044 | - | `amostras/painel/estado.json` | 🟢 | `[X]` |
| T047 | Suíte das amostras: o gerado duas vezes é idêntico, o gerado coincide com o gravado, e existe uma amostra por degrau de cor e uma por situação de entrada que chega à interface viva, três, sem amostra para a raiz inexistente (RF-17) | T056 | - | `tests/cli-amostras.spec.ts` | 🟢 | `[X]` |
| T048 | Acrescentar à suíte de fronteiras, **sem alterar bloco existente**, a guarda de que tripla de cor, índice de 256 e código de cor só aparecem em `src/cli/paleta.ts`, com o caso que prova que a guarda reconhece o que procura (RF-01, RF-16) | T041 | `[//]` | `tests/cli-boundaries.spec.ts` | 🟢 | `[X]` |
| T049 | Acrescentar à recusa nomeada do pacote o caminho `amostras/`, ao lado de `out-cli/` e `src/cli/` (D-23) | T046 | `[//]` | `tests/vsix-conteudo.spec.ts` | 🟢 | `[X]` |
| T055 | Acrescentar à suíte de fronteiras, **sem alterar bloco existente**, o bloco da identidade da referência: a constante `NOMES_VIGIADOS`, declarada ali e só ali, com o nome do produto de referência, o do fabricante e o do mascote; a busca sem distinção de caixa sobre todos os fontes de `src/cli/`, pela função que já os enumera; e o caso que prova que a guarda reprova um texto que contém um dos nomes (RF-22, RN-07, D-25) | T048 | - | `tests/cli-boundaries.spec.ts` | 🟢 | `[X]` |
| T056 | Gerar, pelo script `amostras:painel`, as amostras a partir do estado fixo, e versioná-las ao lado dele | T046 | - | `amostras/painel/` | 🟢 | `[X]` |
| T057 | No laço, usar o tamanho do bloco do item selecionado no ajuste de deslocamento, e nascer com a seção de versões aberta (D-15, D-19) | T036 | - | `src/cli/laco.ts` | 🟡 | `[X]` |

## Fase 5, Polimento

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T050 | Na seção do painel de terminal do README, descrever `--tema=`, `REVERSA_VIEWS_TEMA`, os degraus de cor, o que `--sem-cor` preserva, a garantia do texto da passada no lugar da identidade de bytes, e `npm run amostras:painel`, sem nomear o produto de referência | T047, T035 | `[//]` | `README.md` | 🟢 | `[X]` |

A fumaça em terminal de verdade é o `onboarding.md`, que é passo humano e não ação.

## Notas de execução

Desvios do plano registrados por `/reversa-coding` em 2026-09-21. Nenhum muda requisito; todos ficam
para o `/reversa-sync` levar ao adendo.

1. **`apresentacao` é opcional na entrada do quadro (T024, T057).** O padrão é sem molduras e com o jogo
   Unicode, que é o que mantém `tests/cli-paridade.spec.tsx` intocada: ela compõe o quadro sem dizer
   apresentação alguma. O laço declara `molduras: true`; a passada não declara.
2. **O glifo de seção e a coluna do cursor só existem com cursor (T057).** A paridade exige que a linha
   de título comece pelo título. Na passada, toda seção sai aberta e sem glifo, e a seção fechada leva a
   marca ao fim do título, como antes.
3. **O construtor de trecho mora em `src/cli/quadro/trechos.ts`, e não no compositor (T022).** A ajuda e
   a moldura precisam dele, e o compositor as importa: no compositor, haveria ciclo.
4. **O acento de 256 cores no fundo claro é o índice 167, e não o 173 (T002, T009).** O 173 mede 2,79
   sobre branco, abaixo do piso de 3 que a D-04 fixa para marca; o 167 mede 3,69. O tom de 24 bits segue
   único nos dois fundos, que é o que a RN-04 pede, e a suíte da paleta explica a exceção num caso próprio.
5. **A coluna das teclas na ajuda vai no papel `destaque`, e não no `acento` (T040).** Pela D-04, o
   acento veste marca, e não texto de leitura.
6. **Só a seção de anomalias recebe o jogo de glifos entre as do diagnóstico (T021).** Política de
   escrita e relatório da sonda não têm separador no texto.
7. **O jogo de glifos ganhou a chave `intervalo`** (`–` e `-`), usada pela posição da rolagem na linha de
   estado, que o `data-delta.md` não listava (T005, T025).
8. **A seção "Versões e construção" aparece sempre**, inclusive sem carga, com os campos como "não
   declarado": nas situações sem Reversa e de falha ela é a única seção navegável (T016, T027).
9. **Na moldura do bloqueio, a coluna do cursor só entra no título quando o cursor está nele (T042).**
   Visto nas amostras: vazia, ela afastava o título do canto da borda.
10. **O estado fixo das amostras bloqueia por dúvida aberta, e não por entrega sem adendo (T046).** O
    segundo exigiria todas as ações fechadas, e a decomposição ficaria sem ação aberta nem próxima, que a
    ação também pede. O arquivo saiu das fixtures da suíte, `payloadFixture` com
    `processFixture({ requirementsMd: requirementsMd(2) })`, e é versionado como dado.
11. **A guarda do valor de cor reconhece quatro grafias (T048):** tripla, hexadecimal, campo de tom com
    valor, e código do jogo de dezesseis em literal de texto. Os prefixos `38;2` e `38;5` de
    `terminal.ts` dizem como uma cor se escreve, e não que cor ela é, e um caso prova que não casam.
12. **A previsão de 57 casos de disposição a reescrever não se confirmou:** foram dois em `cli-quadro` e
    um em `cli-navegacao`; `cli-passada` não precisou de nenhum. O restante do trabalho de suíte foi
    acréscimo.

Observação de uso, sem ação: a cerca de 100 colunas, a procedência na linha de estado é truncada
justamente na parte informativa ("esta é a primeira leitura…"), por força da ordem de sacrifício da D-18.
A seção de versões repete a frase inteira, de modo que nada se perde, mas a ordem merece ser revista.

## Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-09-21 | Versão inicial gerada por `/reversa-to-do` | reversa |
| 2026-09-21 | Segunda versão, sobre a segunda versão do roadmap, sem reciclar identificador. Renomeadas para linha de estado e seção de versões: T001, T013, T015, T016, T024, T025, T027, T031, T032, T036, T040 e T041 (A008, A009). T009 e T039 passam a 🟢, com a D-04 e a D-22 confirmadas (A001, A002). T042 e T047 dizem três situações de entrada (A007). T023 cita RF-04 a RF-07 um a um, e outras ações ganham o identificador que cobriam sem citar (A012). Quebradas: a T036, que cede o bloco e a seção aberta à T057, e a T046, que cede a geração das amostras à T056 (A014). Novas: T051, texto hostil de ponta a ponta (A005); T052, desempenho, no lugar da nota solta (A011); T053 e T054, escrita nenhuma antes do primeiro desenho (A006); T055, nomes vigiados (A004, RF-22) | reversa |
| 2026-09-21 | Execução por `/reversa-coding`: 57 ações de 57 fechadas, nenhuma falha. Doze desvios registrados em "Notas de execução" | reversa |
