# Roadmap: visual do painel de linha de comando

> Identificador: `016-visual-do-painel-cli`
> Data: `2026-09-21`
> Requirements: `_reversa_forward/016-visual-do-painel-cli/requirements.md`
> Confidência: 🟢 CONFIRMADO, 🟡 INFERIDO, 🔴 LACUNA

## 1. Resumo da abordagem

A ênfase abstrata da 014 deixa de ser um valor por linha e passa a ser uma lista de **trechos**, cada
um com um **papel** nomeado (acento, destaque, atenuado, borda, concluído, atenção, falha). O desenho
continua sem produzir sequência de escape: ele diz qual papel cada trecho tem, e `src/cli/terminal.ts`
continua sendo o único lugar em que papel vira cor. Entre os dois nasce `src/cli/paleta.ts`, dado puro,
com os tons das duas paletas e as tabelas de degradação para 256 e 16 cores, e `src/cli/ambiente.ts`,
função pura que lê do ambiente o degrau de cor, o fundo e a capacidade de glifo.

No compositor, três mudanças de disposição: o cabeçalho encolhe para um núcleo de quatro fatos, e os
fatos que saem descem para uma décima segunda seção, "Versões e construção", que é do terminal e fica
fora de `sectionOrder()`; cada item separa o dado principal do secundário, que ganha linha própria; e a
linha de estado deixa de ser linha do quadro e passa a ser campo próprio dele, que a borda fixa na
última linha da janela. Moldura e linha de estado só existem na interface viva com 60 colunas ou mais; a
passada recebe o mesmo texto, vestido com a paleta quando o destino é terminal. Todo texto que entra num
trecho passa por um neutralizador de caracteres de controle, num ponto só. A suíte de fronteiras ganha
duas guardas por busca: valor de cor só na paleta, e nenhum nome do produto de referência nos fontes.

## 2. Princípios aplicados

O projeto não tem `.reversa/principles.md`. Como nas features anteriores, os não-objetivos e os
requisitos não funcionais das specs, mais as regras dos adendos, cumprem esse papel.

| Princípio de fato | Como a feature se relaciona | Status |
|-----------|------------------------------|--------|
| D-05 da 014, desenho sem sequência de escape (`addenda/014-cli-do-processo.md#impacto-por-artefato-da-extracao`) | O papel é nome, e não cor. `tests/cli-boundaries.spec.ts` segue exigindo o caractere de escape só em `terminal.ts`, e ganha a exigência análoga para valor de cor só em `paleta.ts` | respeita |
| D-14 da 014, nenhuma regra de apresentação nasce no quadro | Glifo, moldura e papel são forma do terminal. Frase, rótulo, ordem e contagem continuam vindo de `src/webview/domain/` por importação | respeita |
| RN-04 da 014, ordem fixa das onze seções | `sectionOrder()` não é tocada. A seção "Versões e construção" entra por um tipo do terminal, depois das onze, como a faixa de bloqueio entra antes | respeita |
| RN-05 da 014 e `prd.md#6-restricoes`, sem estado entre execuções e sem dependência nova | Tema por bandeira, variável e `COLORFGBG`; nenhum arquivo lido ou escrito para isso; nenhuma entrada nova em `dependencies` | respeita |
| RN-02 da 014, a ferramenta não escreve | As amostras são escritas por um script de `scripts/`, fora de `src/cli/`, como a promoção de equivalências da 012 | respeita |
| G-04 de `sdd/painel-do-processo.md`, painel sem paleta própria | Delimitado pela RN-04 desta feature: vale para o editor. Nenhum arquivo de `src/webview/` recebe cor | respeita |
| RNF-03 de `sdd/painel-do-processo.md`, status distinguível sem cor | Toda distinção tem glifo, texto ou moldura, e uma suíte confere o quadro com a cor desligada | respeita |
| NFR de contraste desta feature contra a RN-04 desta feature | A primeira versão deste plano registrava conflito: o acento único mede 3,15 sobre branco, abaixo de 4,5. A segunda rodada de esclarecimento reescreveu os dois requisitos na forma da D-04: o acento só veste marca, com piso de 3 para 1, e o texto em foco veste o destaque. Os dois cabem juntos | respeita |

Nenhum princípio em conflito.

## 3. Decisões técnicas

| ID | Decisão | Justificativa | Alternativas descartadas | Confidência |
|----|---------|----------------|--------------------------|-------------|
| D-01 | `LinhaDoQuadro` troca `enfase` por `trechos`, lista de `{ texto, papel }`, e ganha `selecionada: boolean`. `texto` permanece, como a concatenação dos trechos | RN-02. `indiceDaSelecao` e `artefatoSelecionado` hoje acham a linha por `enfase === 'selecionada'`; com ênfase por trecho, a seleção precisa de campo próprio. Manter `texto` preserva a conferência por comparação de texto e a passada, que só lê esse campo | Marcação embutida no texto, que obrigaria o recorte a conhecer marcação; manter `enfase` ao lado dos trechos, que daria duas autoridades sobre a mesma linha | 🟢 |
| D-02 | O vocabulário de papéis é fechado, em `src/cli/tipos.ts`: `normal`, `titulo`, `acento`, `destaque`, `atenuado`, `borda`, `concluido`, `atencao`, `falha`. `titulo` é peso, e não cor | RF-01: cada cor da tela corresponde a um papel nomeado. Os nove valores, sete dos quais com tom na paleta, cobrem tudo o que os requisitos pedem, e o vocabulário fechado é o que a suíte consegue prender | Papel livre por cadeia; atributos combináveis (cor mais peso mais inversão), que multiplicam os casos sem requisito que os peça | 🟢 |
| D-03 | `src/cli/paleta.ts` é dado puro: para cada papel e cada fundo, o tom de 24 bits, o índice de 256 e o código de 16 cores. Nenhuma sequência de escape, nenhuma função de decisão | RF-01 e NFR de manutenibilidade: trocar um tom é editar um lugar. Separada de `terminal.ts` para que a suíte de fronteiras possa exigir, por busca, que valor de cor só exista ali | Tons dentro de `terminal.ts`, que misturaria o que muda por gosto com o que muda por protocolo | 🟢 |
| D-04 | O acento fica em dois papéis. `acento` é o tom único `215,119,87` nos dois fundos, e só veste **marca**: glifo de seleção, moldura do cabeçalho, glifo de seção. `destaque` veste **texto** em foco, o nome da ferramenta e o título selecionado: no fundo escuro é o mesmo tom do acento; no claro é `174,96,70`, a mesma matiz escurecida a 81%, que mede 4,60 | RN-04, RF-01 e NFR de contraste, que a segunda rodada reescreveu nesta forma (A001): marca com piso de 3 para 1, e 3,15 passa; texto com piso de 4,5 | Acento único também em texto, que reprova o NFR no fundo claro; acento diferente por fundo, que contraria a letra da RN-04 | 🟢 |
| D-05 | A tabela de 256 cores do fundo claro é escolhida **à mão**, e não pelo índice mais próximo: concluído 28, falha 124, atenção 94, destaque 131, atenuado 241, borda 145 | A medição desta etapa mostrou que a distância euclidiana falha no fundo claro: o mais próximo do concluído claro é o índice 239, um cinza. Os escolhidos guardam a matiz e medem 4,70, 7,44, 5,73, 4,54, 6,10 e 2,19 sobre branco. No fundo escuro valem os índices de `estudo-de-possibilidades.md`, seção 1.4 | Algoritmo de conversão, que o estudo já descartava e que aqui erraria a matiz | 🟢 |
| D-06 | No degrau de 16 cores o fundo declarado não importa, porque quem decide o tom é a paleta do terminal: acento e destaque 33, atenção 93, concluído 32, falha 31, e atenuado e borda saem por intensidade reduzida, como a 014 já faz | O preto claro (90) coincide com a cor de fundo em esquemas difundidos e sumiria; a intensidade reduzida é o que o código de hoje usa e já provou. Acento e atenção ficam próximos, e a RN-03 garante que isso não custe leitura | Preto claro para o atenuado; vermelho claro para o acento, que o confundiria com a falha | 🟡 |
| D-07 | `src/cli/ambiente.ts`, função pura sobre o ambiente, decide três coisas. Degrau: sem terminal, `NO_COLOR` ou `--sem-cor` dão nenhum; `COLORTERM` igual a `truecolor` ou `24bit` dá 24 bits; `TERM` contendo `256color` dá 256; `TERM` igual a `dumb` dá nenhum; o resto dá 16. Glifos: a primeira declarada entre `LC_ALL`, `LC_CTYPE` e `LANG`, contendo `UTF-8` sem distinção de caixa, dá Unicode; qualquer outra coisa, inclusive nada, dá sete bits. A função recebe o mapa do ambiente e um booleano de terminal, e **nenhum fluxo**: não tem por onde escrever | RF-11, RF-12 e RF-14: decide-se pelo que o ambiente declara, e a dúvida cai para baixo. Pura, para que cada degrau se exercite sem terminal, como `lerArgumentos` já é. A assinatura sem fluxo é o que torna conferível o critério do RF-20, nenhum byte escrito para descobrir o fundo (A006): `cli-ambiente` afirma a assinatura, e `cli-terminal` afirma que o primeiro byte escrito pelo laço é o do primeiro desenho | Consultar a base de capacidades do sistema por processo filho, que a fronteira de `editor.ts` proíbe; perguntar ao terminal | 🟢 |
| D-08 | O fundo sai, nesta ordem, de `--tema=escuro\|claro`, de `REVERSA_VIEWS_TEMA`, de `COLORFGBG` e do padrão escuro. De `COLORFGBG` lê-se o último campo: 0 a 6 e 8 dão escuro, 7 e 9 a 15 dão claro, e qualquer outra coisa é ignorada | RF-20 e RN-08. O nome da variável segue `REVERSA_VIEWS_SEM_CONFERIR`. A regra dos números é a convenção do editor Vim, a mais antiga em uso para essa variável | Variável sem prefixo, que colidiria com outras ferramentas | 🟡 |
| D-09 | `Configuracao` mantém `cor: boolean` e ganha `apresentacao: { grau, tema, glifos }`. Bandeira de tema inválida é recusa com `CODIGOS.uso`, nomeando o valor; variável inválida vira `aviso` na leitura de argumentos, que `index.ts` escreve no canal de erro antes de entrar na tela | RF-21, confirmado na segunda rodada. `lerArgumentos` continua pura: devolve o aviso em vez de escrevê-lo | Recusar também a variável, que impediria a ferramenta de abrir por causa de um arquivo de inicialização | 🟢 |
| D-10 | `EntradaDoQuadro` ganha `apresentacao: { molduras: boolean; glifos }`. A moldura é desenhada quando `molduras` é verdadeiro **e** a largura é de 60 ou mais. O laço passa verdadeiro; a passada passa falso | RF-13, RF-19 e RN-06. A regra "moldura e linha de estado pertencem à interface viva" vira um campo, e não um segundo compositor: o RF-06 existe para que haja uma disposição só | Compositor próprio para a passada, que é a bifurcação que o estudo, na seção 3, mandou evitar | 🟢 |
| D-11 | A moldura é função pura nova, `src/cli/quadro/moldura.ts`: recebe título, linhas já recortadas à largura interna, papel da borda e o jogo de glifos, e devolve linhas com trechos. O título vai **na borda superior**. O conteúdo é recortado a `largura - 4` | RF-02, RF-03 e RF-09 usam a mesma caixa com três papéis de borda: acento, atenção e falha. Título na borda economiza uma linha por caixa, e é o traço da referência | Caixa desenhada dentro de cada módulo, três vezes | 🟢 |
| D-12 | Os glifos vivem em `src/cli/quadro/glifos.ts`, em dois jogos de mesma forma, Unicode e sete bits, todos de uma coluna exceto onde a tabela declara duas. O de atenção é `!` nos dois jogos. `src/cli/quadro/diagnostico.ts`, que hoje escreve o próprio separador, passa a receber o jogo | RF-14, com o alcance que a segunda rodada fixou (A003): sete bits em glifos e molduras, e a prosa acentuada como está. Os sinais de advertência do Unicode têm largura ambígua e ocupam duas colunas em parte dos terminais, o que desalinharia a borda direita da moldura. Tabela em `data-delta.md`, seção 4 | Sinal de advertência gráfico; transliterar a prosa, que a RN-01 veda | 🟢 |
| D-13 | `ItemDaSecao` ganha `marca` (`fechada`, `proxima`, `aberta` ou nula) e `secundarios: string[]`. O glifo de estado sai do texto e vira marca; o caminho do artefato sai do texto em **toda** seção e vira secundário; o instante vira secundário **só na decomposição**. No título de seção, o glifo de aberta ou fechada e o de seleção são trechos próprios, no `acento`, e o texto selecionado vai no `destaque` | RF-04, RF-05, RF-06 e RF-07. A marca separada é o que permite colorir o glifo sem colorir a linha. O instante dos checkpoints da descoberta fica na linha porque ali não há artefato, e uma linha a mais por checkpoint dobraria a seção sem separar nada | Instante secundário em toda parte; analisar o texto pronto para achar o glifo | 🟡 |
| D-14 | Na faixa de bloqueio, o texto principal é a razão seguida do comando sugerido, e só o artefato desce | O cenário "o bloqueio humano é o que o olho encontra primeiro" exige razão e comando como antes. O comando é o que a pessoa vai fazer, e portanto dado principal | Comando como secundário | 🟡 |
| D-15 | A seção nova é `src/cli/quadro/secao-de-versoes.ts`, com o nome `versoes` num tipo novo do terminal, `SecaoDoTerminal = SectionName \| 'versoes'`, e a ordem navegável sai de `secoesDoTerminal()`, que é `sectionOrder()` mais ela. Título: "Versões e construção". Nasce **aberta** | RF-18, com o nome da segunda rodada (A009): "procedência" fica reservada à origem da leitura, que já dá nome ao tipo `Procedencia` e ao módulo `quadro/procedencia.ts`, e nenhum dos dois muda. `SectionName` e `sectionOrder()` são da apresentação compartilhada e não mudam. Nasce aberta porque está ao fim do quadro, onde não custa a primeira tela, e porque o desfecho da conferência de atualização, que mora nela, não deve depender de gesto para ser visto | Acrescentar o nome a `SectionName`, que tocaria a tela e a suíte de paridade; nascer fechada | 🟡 |
| D-16 | As linhas de `linhasDaProcedencia` vão **inteiras** para o fim da seção "Versões e construção", depois dos cinco fatos do RF-18, e a primeira delas é repetida, recortada, na linha de estado | RN-01 e RN-06: na passada não há linha de estado, e sem isso a frase de procedência sumiria do texto redirecionado. Também é o que mantém a razão da degradação legível por extenso, que o RF-10 exige. A seção guarda, assim, mais do que o RF-18 enumera; o que o RF-18 reserva é a **palavra**, e ela não aparece no título nem no identificador | Procedência só na linha de estado; linhas soltas entre a última seção e a nova, que não se fechariam nem se alcançariam por tecla | 🟡 |
| D-17 | `Quadro` ganha `linhaDeEstado: LinhaDoQuadro \| null`. `comporQuadro` recorta a janela em `altura - 1` e compõe a linha de estado em `src/cli/quadro/linha-de-estado.ts`; `terminal.desenhar` a escreve por posicionamento absoluto na última linha. O recado do editor continua em linha própria, acima dela | RF-08, com o nome único da segunda rodada (A008). Posicionamento absoluto mantém a linha embaixo também quando o quadro é mais curto que a janela. O recado fica como está para que a dança do editor, a parte mais delicada da 014, não mude | Linha de estado como última linha de `linhas`, que a deixaria subir em quadro curto; recado dentro dela | 🟢 |
| D-18 | A linha de estado tem três campos, e quando a largura falta eles cedem nesta ordem: a procedência é recortada com reticências, depois as teclas somem, e a posição nunca some. A posição diz "linhas A–B de N" e traz o glifo de acima, o de abaixo ou os dois. O glifo da observação, e a cor de atenção quando ela degradou, abrem a linha | RF-08 e RF-10: ela declara que há conteúdo acima ou abaixo, e a procedência é recortada quando preciso. O recorte com reticências é função nova em `medidas.ts`, `truncar` | Quebrar a linha de estado em duas | 🟢 |
| D-19 | O deslocamento passa a garantir visível o **bloco** do item selecionado, a linha principal e as secundárias, e não só a linha principal | Com o RF-06, selecionar o último item visível deixaria o caminho dele fora da janela, e é o caminho que diz o que a confirmação abre | Manter o ajuste por linha | 🟢 |
| D-20 | `src/cli/quadro/higiene.ts` exporta `neutralizar`, chamada no único construtor de trecho. C0, DEL e C1 viram texto visível: as figuras de controle do Unicode, ou a notação de circunflexo no jogo de sete bits; espaço em branco de controle vira espaço. Roda **antes** do recorte. Além da suíte da função, `cli-quadro` ganha o caso de ponta a ponta: quadro composto sobre descrição hostil, sem ponto de código de controle em linha alguma (A005) | NFR de segurança. Antes do recorte porque a substituição pode mudar a largura. A expressão usa intervalo de pontos de código e não escreve o caractere de escape, de modo que a guarda de `cli-boundaries` continua valendo sem exceção | Neutralizar em cada módulo que lê texto do disco, que são cinco; neutralizar em `terminal.ts`, tarde demais para a largura | 🟢 |
| D-21 | `vestir` dá lugar a `vestirLinha(linha, apresentacao)`, que funde trechos vizinhos de mesmo papel e fecha a cor ao fim de cada linha. A passada diante de terminal passa a usá-la. O NFR de 50 ms para 500 linhas é caso nomeado de `cli-quadro`, e não nota (A011) | RF-19 e NFR de desempenho: a fusão limita os bytes por linha, e fechar por linha impede que uma cor vaze para a seguinte | Uma sequência por trecho sem fusão | 🟢 |
| D-22 | As molduras só existem no quadro. A raiz inexistente, que termina com código de uso antes de haver quadro, recebe título na cor de falha e nenhuma moldura, no canal de erro, quando ele é terminal. As outras três situações são emolduradas | RF-09, que a segunda rodada reescreveu nesta forma (A002) | Desenhar moldura no canal de erro | 🟢 |
| D-23 | As amostras saem de `src/cli/amostras.ts`, função pura de um estado fixo para um mapa de nome em texto, e são gravadas por `scripts/amostras-do-painel.js` em `amostras/painel/`, com o estado fixo em `amostras/painel/estado.json`. `tests/cli-amostras.spec.ts` compara o gerado com o gravado. São quatro por degrau de cor e **três** por situação de entrada, as que chegam à interface viva; a raiz inexistente não tem quadro e não tem amostra | RF-17, com a ressalva da segunda rodada (A007). A comparação por suíte é o que faz uma mudança de paleta aparecer como diferença. A pasta nasce fora do pacote, porque o `.vscodeignore` exclui tudo e só readmite por ato, e `tests/vsix-conteudo.spec.ts` passa a nomear a recusa | Amostras geradas só sob demanda, sem arquivo gravado, que não mostrariam diferença alguma | 🟢 |
| D-24 | A linha de estado fixa ganha suíte própria, `tests/cli-linha-de-estado.spec.ts`, e a navegação ganha casos para a décima segunda seção | O estudo, seção 4, aponta a linha de estado como o item de maior risco de regressão na navegação: a janela perde uma linha, e `fundo()` depende dela | Cobrir a linha de estado dentro de `cli-quadro.spec.ts` | 🟢 |
| D-25 | `tests/cli-boundaries.spec.ts` ganha um bloco "a identidade da referência não entra nos fontes (RN-07)": a constante `NOMES_VIGIADOS`, declarada ali e só ali, e uma busca sem distinção de caixa sobre todos os fontes de `src/cli/`, pela mesma função que já os enumera. Um segundo caso prova a guarda, aplicando-a a um texto que contém um dos nomes, como os blocos vizinhos fazem. A lista de partida traz o nome do produto de referência, o do fabricante e o do mascote. O bloco não alcança `README.md`, `_reversa_forward/` nem `amostras/` | RF-22 e RN-07 (A004). A suíte é o único arquivo do repositório de código em que os nomes aparecem, e por isso ela se exclui da busca por construção: varre `src/cli/`, e mora em `tests/`. Ficar fora da documentação é deliberado: a Q-018 do requirements registra que nomear a referência em documento é escolha consciente | Lista num módulo de `src/cli/`, que poria os nomes justamente onde a regra os proíbe; busca por expressão genérica de marca, que não se consegue enumerar | 🟢 |

### 3.1 Rastreabilidade

A primeira versão cobria a substância de oito requisitos sem citá-los por identificador (A012). A
correspondência, para que o cruzamento por script feche:

| Requisito | Onde se decide |
|-----------|----------------|
| RF-04, RF-07 | D-12 e D-13: glifo de seção, glifo de seleção e os papéis de cada um |
| RF-12 | D-07: `NO_COLOR` e `--sem-cor` dão o degrau nenhum; D-10: a moldura independe do degrau |
| RF-15 | D-01, que mantém `texto`; D-10, disposição única; seção 5, suítes de dados intocadas |
| RF-16 | Seção 2, D-14 da 014; seção 5, `cli-paridade` intocada; seção 10 |
| RF-22, RN-07 | D-25 |
| RN-06 | D-10 e D-16 |
| RN-08 | D-08 e D-09: nada lido nem escrito em arquivo para o tema |

## 4. Premissas

O `requirements.md` chegou sem marcador `[DÚVIDA]`, e esta versão não carrega premissa. A única que a
primeira versão registrava, a leitura do "acento único" como marca, foi confirmada na segunda rodada de
esclarecimento, e a D-04 passou a 🟢; o mesmo se deu com a D-22.

As decisões que continuam 🟡 são deduções sem dúvida registrada, todas de custo baixo de reversão: os
códigos de 16 cores (D-06), a regra de `COLORFGBG` (D-08), o alcance do instante secundário (D-13), o
comando na faixa de bloqueio (D-14), o nascimento aberto da seção nova (D-15) e a morada das linhas de
procedência dentro dela (D-16).

## 5. Delta arquitetural

O projeto não tem `architecture.md`; a coluna de origem aponta o adendo ou a spec que descreve o componente.

| Componente | Arquivo de origem no legado | Tipo de mudança | Resumo |
|------------|------------------------------|-----------------|--------|
| Vocabulário do terminal, `src/cli/tipos.ts` | `addenda/014-cli-do-processo.md#impacto-por-artefato-da-extracao` | contrato-alterado | Ênfase por linha dá lugar a trechos com papel; `Quadro` ganha `linhaDeEstado`; `ItemDaSecao` ganha marca e secundários; nasce `SecaoDoTerminal` |
| Paleta, `src/cli/paleta.ts` | novo | componente-novo | Os tons das duas paletas e as tabelas de 256 e de 16 cores, em dado puro |
| Ambiente, `src/cli/ambiente.ts` | novo | componente-novo | Degrau de cor, fundo e jogo de glifos, decididos por função pura sobre o ambiente, sem fluxo de escrita |
| Argumentos, `src/cli/argumentos.ts` e `src/cli/uso.ts` | `014/interfaces/contrato-de-linha-de-comando.md` | contrato-alterado | `--tema=`, `REVERSA_VIEWS_TEMA`, o campo `apresentacao` e o aviso de variável inválida |
| Terminal, `src/cli/terminal.ts` | `addenda/014-cli-do-processo.md#impacto-por-artefato-da-extracao` | regra-alterada | Traduz papel, degrau e fundo em sequência; escreve a linha de estado por posicionamento absoluto. Continua o único com caractere de escape |
| Compositor, `src/cli/quadro/index.ts` | idem | regra-alterada | Cabeçalho em núcleo, molduras, marca e secundários por item, glifo de seção, seção "Versões e construção" ao fim, linha de estado fora das linhas |
| Moldura, glifos, higiene, linha de estado e seção de versões, em `src/cli/quadro/` | novo | componente-novo | Cinco módulos puros: `moldura.ts`, `glifos.ts`, `higiene.ts`, `linha-de-estado.ts`, `secao-de-versoes.ts` |
| Cabeçalho, `src/cli/quadro/cabecalho.ts` | `sdd/heranca-e-sincronia.md#6-requisitos-funcionais` | regra-alterada | Devolve só o núcleo de quatro fatos; os demais passam à seção "Versões e construção", com os mesmos rótulos e as mesmas funções de origem |
| Seções, bloqueio, entrada e ajuda, em `src/cli/quadro/` | `addenda/014-cli-do-processo.md`, `addenda/015-fases-fora-do-canone.md` | regra-alterada | Itens com marca e secundários; bloqueio, entrada e ajuda emoldurados. Nenhuma frase muda |
| Diagnóstico, `src/cli/quadro/diagnostico.ts` | `addenda/014-cli-do-processo.md` | regra-alterada | As três seções de diagnóstico recebem o jogo de glifos no lugar do separador literal (D-12) |
| Procedência, `src/cli/quadro/procedencia.ts` | `addenda/014-cli-do-processo.md` | sem mudança | Dito para que a ausência se leia como escolha: o módulo e o tipo `Procedencia` ficam como estão; muda só quem chama |
| Medidas, `src/cli/quadro/medidas.ts` | `addenda/014-cli-do-processo.md` | regra-alterada | `truncar`, e o ajuste de deslocamento por bloco |
| Navegação, `src/cli/navegacao.ts` | `014/interfaces/teclado.md` | regra-alterada | Doze seções navegáveis; nenhuma tecla nova nem trocada |
| Laço e passada, `src/cli/laco.ts`, `src/cli/passada.ts`, `src/cli/index.ts` | `addenda/014-cli-do-processo.md#resumo-da-entrega` | regra-alterada | O laço reserva a última linha para a linha de estado; a passada diante de terminal veste a paleta; `index.ts` escreve o aviso de tema e o título da raiz inexistente |
| Amostras, `src/cli/amostras.ts`, `scripts/amostras-do-painel.js`, `amostras/painel/` | novo | componente-novo | Quadros de amostra reproduzíveis, presos por suíte |
| Manifesto, `package.json` | `sdd/empacotamento-e-verificacao.md#6-requisitos-funcionais` | contrato-alterado | Dois scripts novos, `preamostras:painel` e `amostras:painel`; nenhuma dependência |
| Documentação de uso, `README.md` | `sdd/empacotamento-e-verificacao.md` | regra-alterada | A seção do painel de terminal descreve tema, degraus, o que `--sem-cor` preserva, as garantias do texto da passada e as amostras |

Suítes: nascem `cli-paleta`, `cli-ambiente`, `cli-moldura`, `cli-higiene`, `cli-linha-de-estado` e
`cli-amostras`. Mudam de **expectativa de disposição**, declaradamente: `cli-quadro` (35 casos),
`cli-passada` (22), `cli-terminal`, `cli-argumentos` e `cli-navegacao`. Só **ganham**, sem linha
reescrita: `cli-boundaries`, com a guarda do valor de cor e a dos nomes vigiados (D-25);
`vsix-conteudo`, com a recusa nomeada de `amostras/`; e `host-manifest`, que passa a enumerar dois
scripts a mais. `cli-paridade`, `cli-sessao`, `cli-observacao`, `cli-teclas`, `cli-contagem` e as da
saída de dados não são tocadas.

## 6. Delta no modelo de dados

- Resumo das mudanças: nada persistido muda, porque a ferramenta não persiste nada. Mudam cinco
  estruturas efêmeras de `src/cli/tipos.ts`, e nascem a paleta, o jogo de glifos e a apresentação. A
  carga do protocolo e o documento de `--dados` não mudam um campo
- Detalhe completo em: `_reversa_forward/016-visual-do-painel-cli/data-delta.md`

## 7. Delta de contratos externos

| Contrato | Tipo | Arquivo de detalhe |
|----------|------|--------------------|
| Linha de comando: bandeira e variável de tema, degraus de cor, garantias do texto da passada | arquivo (processo e ambiente) | `_reversa_forward/016-visual-do-painel-cli/interfaces/contrato-de-linha-de-comando.md` |

O teclado (`014/interfaces/teclado.md`) e a abertura no editor não mudam.

## 8. Plano de migração

Não há dado a migrar. A ordem de construção importa, porque o tipo central muda:

1. `tipos.ts`, `paleta.ts`, `ambiente.ts`, `glifos.ts`, `higiene.ts` e `moldura.ts`, com as suítes novas, sem tocar o compositor
2. O compositor e os módulos de `quadro/`, junto com a reescrita declarada de `cli-quadro` e `cli-passada`
3. `terminal.ts`, a linha de estado, o laço e a navegação com a décima segunda seção
4. Argumentos, uso, passada diante de terminal, o aviso de tema e o título da raiz inexistente
5. Amostras, as duas guardas novas em `cli-boundaries`, o README, e a fumaça em terminal de verdade pelo `onboarding.md`

## 9. Riscos e mitigações

| Risco | Impacto | Probabilidade | Mitigação |
|-------|---------|---------------|-----------|
| A linha de estado fixa desloca a conta da janela e a seleção some sob ela, ou o fim do quadro fica inalcançável | alto | médio | D-17 e D-24: a altura útil sai de um lugar só, e `cli-linha-de-estado` exercita topo, fim e redimensionamento |
| A reescrita de 57 casos de disposição esconde uma mudança de fato ou de ordem | alto | médio | Cada caso reescrito é declarado como disposição no próprio teste; `cli-paridade` e as suítes de dados ficam intocadas e são a prova de que os fatos não mudaram |
| A renomeação desta versão fica pela metade, e `rodape` ou `procedencia` como nome de seção sobrevivem em identificador | médio | médio | O `actions.md` é anterior a esta versão e precisa de nova passada de `/reversa-to-do`; o critério de pronto traz a busca pelos dois nomes |
| A lista de nomes vigiados envelhece, e um nome novo da referência passa | baixo | baixo | A lista mora num lugar só (D-25), e acrescentar um nome é uma linha. A guarda vigia o que se conhece, e não promete mais que isso |
| Caractere de duas colunas vindo do disco desalinha a borda direita da moldura | baixo | baixo | O recorte conta pontos de código, como a 014; o conteúdo das molduras é curto. Aceito e registrado, sem medição de largura de célula nesta feature |
| Com a localidade sem Unicode, a prosa em português continua com acento, e só glifos e molduras caem para sete bits | baixo | baixo | É o limite que o próprio RF-14 declara desde a segunda rodada. Registrado no `onboarding.md` |
| Multiplexador que não repassa `COLORTERM` rebaixa a tela para 256 cores | baixo | médio | É o degrau inferior na dúvida, que o RF-11 pede; a perda é de tom |
| Sequência de cor por trecho encarece o redesenho integral | baixo | baixo | D-21 funde trechos; o NFR de 50 ms para 500 linhas é caso nomeado de `cli-quadro` |
| Afrouxamento de `cli-boundaries` ou de `cli-paridade` para acomodar o visual | alto | baixo | Critério de pronto: as duas passam com o arquivo de antes, e a de fronteiras só recebe acréscimo |

## 10. Critério de pronto

- [ ] Todas as ações do `actions.md` marcadas `[X]`
- [ ] `cross-check.md` (se executado) sem CRITICAL nem HIGH
- [ ] `regression-watch.md` gerado
- [ ] `tests/cli-paridade.spec.tsx` e as suítes da saída de dados passam sem linha alterada
- [ ] `tests/cli-boundaries.spec.ts` só recebeu acréscimo, o caractere de escape continua só em `terminal.ts`, e a guarda dos nomes vigiados reprova quando provocada
- [ ] Toda expectativa reescrita em `cli-quadro` e `cli-passada` está declarada como de disposição
- [ ] Contraste medido em `cli-paleta`, nos dois fundos e nos degraus de 24 bits e de 256: 4,5 para papel de texto, 3 para o `acento`, 2 para a `borda`
- [ ] Nenhum identificador de `src/cli/` ou de `tests/` contém `rodape`, e `procedencia` só nomeia a origem da leitura
- [ ] `package.json` sem entrada nova em `dependencies`, e o pacote sem `amostras/`
- [ ] O `onboarding.md` percorrido num terminal de verdade, inclusive `Ctrl+Z` com a linha de estado
- [ ] Re-extração reversa executada e sem regressão vermelha (recomendado, não obrigatório)

## 11. Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-09-21 | Versão inicial gerada por `/reversa-plan` | reversa |
| 2026-09-21 | Segunda versão, depois da segunda rodada de esclarecimento e da auditoria cruzada. D-04 e D-22 passam a 🟢, e a premissa e o conflito de princípio saem (A001, A002); D-12 e D-23 seguem o alcance novo do RF-14 e do RF-17 (A003, A007); D-25 nova, para o RF-22 (A004); "rodapé" vira linha de estado em D-17, D-18 e D-24, com `Quadro.linhaDeEstado`, `linha-de-estado.ts` e `cli-linha-de-estado` (A008); a seção nova vira "Versões e construção", `versoes`, `secao-de-versoes.ts` (A009); `diagnostico.ts`, `vsix-conteudo` e `README.md` entram no delta (A010); caso de ponta a ponta do texto hostil, asserção de escrita nenhuma e medição de desempenho ganham lugar em decisão (A005, A006, A011); seção 3.1, de rastreabilidade (A012); "sucesso" vira "concluído" na D-05 (A013). A014 e A015 ficam para `/reversa-to-do` e `/reversa-sync` | reversa |
