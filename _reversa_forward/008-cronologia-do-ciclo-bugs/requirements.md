# Requirements: cronologia do ciclo de bugs

> Identificador: `008-cronologia-do-ciclo-bugs`
> Data: `2026-09-10`
> Pasta da extração reversa: `_reversa_sdd/`
> Confidência: 🟢 CONFIRMADO, 🟡 INFERIDO, 🔴 LACUNA / DÚVIDA

## 1. Resumo executivo

O painel já sabe contar o tempo do ciclo forward: a decomposição mostra ação a ação com o instante
do último evento, a próxima aberta destacada e o resto dobrado atrás de um controle, e o histórico
mostra feature a feature com situação, marca e último evento. O ciclo de bugs não tem nada disso,
embora produza registros com a mesma natureza cronológica em `_reversa_bugs/`. Esta feature
acrescenta ao painel um bloco de bugs com a mesma anatomia do bloco forward, para que o Retomador
saiba, sem abrir arquivo, quantos defeitos existem, quais aguardam ele, qual tratar em seguida e
quando cada um se mexeu pela última vez.

## 2. Contexto a partir do legado

| Fonte | Trecho relevante | Confidência |
|-------|------------------|-------------|
| `_reversa_sdd/sdd/painel-do-processo.md#6-requisitos-funcionais` | RF-03 manda a faixa de bloqueio nomear toda decisão pendente; RF-10 fixa a abertura de arquivo por mensagem à ponte; RF-12 guarda o recolhimento como preferência; RF-13 exige decisão de apresentação em função pura; RF-14 fixa a ordem das seções | 🟡 |
| `_reversa_sdd/sdd/painel-do-processo.md#7-requisitos-nao-funcionais` | Largura mínima de 300 px, pintura abaixo de 100 ms, estado distinguível sem cor, bundle abaixo de 400 KB e cobertura integral das funções de decisão | 🟡 |
| `_reversa_sdd/sdd/leitura-do-processo.md#11-edge-cases-e-tratamento-de-erros` | A leitura degrada em vez de falhar, e toda perda vira anomalia com arquivo, código e detalhe | 🟡 |
| `_reversa_sdd/sdd/ponte-e-host.md#6-requisitos-funcionais` | O canal é de mão dupla, com comandos nomeados e envelope desconhecido descartado sem derrubar nada | 🟡 |
| `_reversa_sdd/prd.md#5-nao-objetivos-out` | A extensão nunca abre arquivo para escrever, em camada alguma, e não faz tráfego de rede em tempo de execução | 🟢 |
| `_reversa_sdd/addenda/006-cartoes-e-cronologia.md#resumo-da-entrega` | A cronologia que o ciclo forward ganhou: decomposição ação a ação com trilha, histórico de todas as features, e todo instante no fuso de Brasília com o valor absoluto preservado em atributo | 🟢 |
| `_reversa_sdd/addenda/007-atualizacao-e-progresso.md#resumo-da-entrega` | A ordem unificada do recorte, com abertas na ordem do plano à frente e fechadas por recência, mais a barra de progresso alimentada pela contagem herdada e nunca pelo comprimento da lista exibida | 🟢 |
| `_reversa_bugs/README.md` | Contrato do registro: fonte de verdade em `<contexto>/bugs/<ID>/bug.md`, tudo em `generated/` é projeção regenerável, ciclo `open` para `active` para `resolved`, `phase` detalhando o ativo, bloqueio como condição, trava `DONE.md` no encerramento e bugs `restricted` fora das views | 🟢 |

Dois pontos do código atual sustentam o desenho e não estão em nenhuma spec, porque nasceram no
ciclo forward depois da extração. O primeiro é a autoridade da contagem herdada sobre a lista
exibida, que a decomposição aplica e declara quando os dois números divergem. O segundo é o recorte
como prefixo de uma ordem única, e não como segunda seleção sobre ela, correção que a feature 007
fez depois de o cartão mostrar as ações certas na ordem errada.

## 3. Personas e cenários de uso

| Persona | Objetivo | Cenário-chave |
|---------|----------|---------------|
| O Retomador | Saber, ao abrir um projeto parado, se algum defeito ficou aberto e qual tratar primeiro | Abre o painel depois de semanas e lê no bloco de bugs que há um registro aguardando decisão humana desde uma data que ele havia esquecido |
| O Operador | Confirmar, durante a sessão, que o bug que acabou de registrar ou de encerrar apareceu no painel | Roda o registrador no terminal, aciona a releitura e vê o bug novo no topo do bloco, com a data de registro |

## 4. Regras de negócio novas ou alteradas

1. **RN-01:** A fonte de verdade de um bug é o `bug.md` da pasta dele, e é dela que o painel lê.
   Tudo em `generated/` é projeção regenerável, que só existe depois de alguém mandar regenerá-la,
   e o painel não a consome em hipótese alguma. A consequência aceita é interpretar front matter em
   YAML dentro do pacote da extensão, custo que a regra de tamanho vigia. 🟢
   - Origem no legado: `_reversa_bugs/README.md`, seção de contrato
   - Tipo: nova
   - Decidida na sessão de esclarecimento de 2026-09-10
2. **RN-02:** Bug com `visibility: restricted` fica fora das views. O painel é uma view, e portanto
   herda a restrição. 🟢
   - Origem no legado: `_reversa_bugs/README.md`, protocolo dos agentes, item 4
   - Tipo: nova
3. **RN-03:** O ciclo de vida tem três estados, `open`, `active` e `resolved`, com `phase`
   detalhando as etapas do ativo. Bloqueio é condição registrada em `blocking`, e nunca um quarto
   estado. O bloco desenha os três estados e mostra o bloqueio ao lado, sem misturá-los. 🟢
   - Origem no legado: `_reversa_bugs/README.md`, ciclo de vida
   - Tipo: nova
4. **RN-04:** O encerramento é a trava `DONE.md` na pasta do bug. Um bug `resolved` sem trava, ou
   uma trava sobre bug não resolvido, é inconsistência do registro: o painel a declara como
   anomalia e não escolhe entre as duas leituras. 🟢
   - Origem no legado: `_reversa_bugs/README.md`, trava de conclusão, e as invariantes de
     `_reversa_bugs/gerar-views.mjs`
   - Tipo: nova
5. **RN-05:** A quantidade de bugs encontrados no disco é a autoridade sobre quantos existem. Onde
   ela e a lista desenhada divergirem, a divergência é declarada em vez de resolvida em silêncio.
   É a mesma regra que a decomposição aplica entre a contagem herdada e as linhas que lista. 🟢
   - Origem no legado: `_reversa_sdd/addenda/006-cartoes-e-cronologia.md#resumo-da-entrega`
   - Tipo: nova, por espelho de regra existente
6. **RN-06:** Os instantes do registro de bugs têm granularidade de dia, e não de instante: o
   contrato grava `created` e `updated` como data, e a trava grava a data do encerramento. O bloco
   exibe data, sem inventar hora, e a conversão de fuso não se aplica a valor que não tem hora. É a
   diferença material entre este ciclo e o forward, cuja trilha grava instante completo. A data de
   modificação do arquivo no disco não é usada nem para exibir nem para desempatar: ela muda por
   motivo que nada tem a ver com o bug, como uma cópia ou uma regeneração. 🟢
   - Origem no legado: front matter dos três `bug.md` de `_reversa_bugs/painel-do-processo/bugs/`
   - Tipo: nova
   - Decidida na sessão de esclarecimento de 2026-09-10
7. **RN-07:** A ordem tem dois níveis. Entre grupos, o contexto com movimento mais recente vem
   primeiro. Dentro de cada grupo, os bugs não encerrados vêm à frente, do mais recentemente mexido
   ao mais antigo; os encerrados seguem, na mesma ordem de recência; um registro sem data vai ao fim
   da metade a que pertence, mantendo entre os pares a ordem em que foi lido. Empates preservam a
   ordem de leitura pela estabilidade da ordenação da linguagem, porque uma lista que se remexe
   entre duas leituras idênticas é defeito intermitente. 🟢
   - Origem no legado: `_reversa_sdd/addenda/007-atualizacao-e-progresso.md#resumo-da-entrega`
   - Tipo: nova, por espelho de regra existente
8. **RN-08:** A extensão continua sem escrever arquivo, em camada alguma, e sem tráfego de rede. Ler
   o registro de bugs não abre exceção: nem para regenerar as views, nem para gravar a trava, nem
   para corrigir a inconsistência que ela encontrar. 🟢
   - Origem no legado: `_reversa_sdd/prd.md#5-nao-objetivos-out` e
     `_reversa_sdd/prd.md#6-restricoes`
   - Tipo: herdada, inalterada
9. **RN-09:** O bloco é organizado por contexto, que é como o registro se organiza no disco. Cada
   grupo traz subtítulo com o nome do contexto e contagem própria, e o topo do bloco traz o total do
   projeto. Contagem de grupo e total do projeto nunca são apresentados como a mesma coisa. 🟢
   - Origem no legado: `_reversa_bugs/README.md`, seção de estrutura
   - Tipo: nova
   - Decidida na sessão de esclarecimento de 2026-09-10
10. **RN-10:** O destaque de próximo a tratar é único no bloco inteiro, e não um por grupo: é o
    primeiro bug não encerrado do primeiro grupo. Vários destaques simultâneos devolveriam ao leitor
    a escolha que o painel existe para fazer por ele. 🟡
    - Origem no legado: espelho da ação destacada em
      `_reversa_sdd/addenda/006-cartoes-e-cronologia.md#resumo-da-entrega`
    - Tipo: nova

## 5. Requisitos Funcionais

| ID | Requisito | Prioridade | Critério de aceite | Confidência |
|----|-----------|------------|--------------------|-------------|
| RF-01 | O painel deve ganhar um bloco de bugs logo depois do histórico de features, recolhível como os outros cartões e recolhido por padrão enquanto nenhuma preferência tiver sido declarada | Must | O nome novo aparece na lista única de seções, entra nas recolhíveis e no conjunto do recolhimento padrão, e a ordem do documento renderizado corresponde à declarada | 🟢 |
| RF-02 | O bloco deve exibir no topo o total do projeto repartido por estado, com abertos, ativos e resolvidos contados separadamente, e repetir a mesma repartição no subtítulo de cada contexto | Must | Com três bugs resolvidos num único contexto, o topo mostra total três e resolvidos três, o subtítulo do contexto mostra o mesmo, e zero abertos e zero ativos são declarados por nome em vez de omitidos | 🟢 |
| RF-03 | O bloco deve exibir uma barra de progresso de resolvidos sobre o total, alimentada pela contagem do registro e nunca pelo comprimento da lista exibida | Must | Com o recorte padrão escondendo parte da lista, a barra continua medindo o total; com total zero, nenhum elemento de barra é desenhado | 🟢 |
| RF-04 | O bloco deve listar bug a bug dentro do grupo do contexto dele, com identificador, apelido humano, título, estado, fase, severidade e prioridade | Must | Cada campo aparece na linha, ou é declarado ausente por nome, para os três bugs do registro atual, e nenhum bug aparece fora do grupo a que pertence | 🟢 |
| RF-05 | Cada linha deve exibir a data de registro e a data da última alteração, e a data de encerramento quando houver trava | Must | Um bug encerrado mostra as três datas; um sem trava mostra duas e declara que não foi encerrado | 🟢 |
| RF-06 | O bloco deve destacar um único próximo bug a tratar, o primeiro não encerrado do primeiro grupo, marcando-o por atributo e por palavra | Must | Com bugs não encerrados em dois contextos, exatamente uma linha do bloco traz a marca; sem nenhum, a marca não aparece e o bloco diz que nada aguarda tratamento | 🟢 |
| RF-07 | O bloco deve ordenar os grupos pelo movimento mais recente de cada contexto, e os bugs dentro do grupo pela regra RN-07 | Must | Duas leituras seguidas do mesmo registro produzem a mesma ordem de grupos e de linhas, inclusive com datas empatadas; um bug sem data fica ao fim da metade a que pertence | 🟢 |
| RF-08 | Cada grupo deve mostrar por padrão os não encerrados dele e os cinco encerrados mais recentes, com um controle próprio que revela o resto daquele grupo e a contagem do que ficou oculto | Should | O controle revela e recolhe sem releitura, o que ele revela é o resto da mesma ordem, revelar um grupo não mexe nos outros, e o estado dele não é guardado como preferência | 🟢 |
| RF-09 | O usuário deve poder clicar no identificador de um bug e ter o `bug.md` dele aberto no editor, pela mensagem de abrir arquivo que já existe | Must | O clique envia a mensagem com o caminho relativo do arquivo, e nenhum componente do bloco chama o host diretamente | 🟢 |
| RF-10 | Três condições devem levar um bug à faixa de bloqueio humano, cada uma nomeando a razão e o bug: a fase de espera por decisão, o bloqueio declarado, e a severidade alta enquanto o bug não estiver encerrado | Must | Cada uma das três produz sua linha na faixa, com identificador e comando sugerido; um bug que reúna duas delas produz uma linha só, nomeando as duas razões; sem nenhuma, a faixa não ganha linha de bugs | 🟢 |
| RF-11 | A leitura deve consumir apenas os `bug.md` e a trava de cada pasta, sem tocar em nada de `generated/`, de modo que uma projeção defasada ou ausente não altere o que o painel mostra | Must | Com a pasta `generated/` apagada, o bloco desenha o mesmo conteúdo; a suíte prova que nenhum caminho sob `generated/` é lido | 🟢 |
| RF-12 | Toda perda ou degradação na leitura do registro deve virar anomalia na seção que já existe, com arquivo, código e detalhe | Must | Um `bug.md` sem front matter, com front matter inválido ou com estado desconhecido produz anomalia nomeada, e o bloco desenha o que conseguiu ler | 🟢 |
| RF-13 | O bloco deve declarar por nome cada estado vazio: registro ausente, contexto sem bug, e bug oculto por restrição de visibilidade | Must | Num projeto sem a pasta de bugs, o bloco explica que o registro não existe, em vez de sumir ou aparecer vazio | 🟢 |
| RF-14 | Toda decisão de apresentação do bloco deve viver em função pura, separada do componente visual, incluindo a ordem, o recorte, o próximo a tratar e os rótulos de estado e fase | Must | As funções são importáveis e testáveis sem navegador, com cobertura integral de linhas, e o componente apenas as chama | 🟢 |
| RF-15 | A leitura do registro deve respeitar um teto de cinquenta bugs por passagem, declarando a leitura parcial quando o teto cortar a varredura | Should | Acima de cinquenta, o bloco informa quantos existem e quantos foram lidos, como o histórico de features já faz com o teto de pastas | 🟢 |
| RF-16 | Bug com visibilidade restrita não deve aparecer na lista nem ter título, identificador ou qualquer campo seu desenhado | Must | Um bug restrito é contado no total e ausente da lista, e o bloco declara que há registro omitido por restrição | 🟢 |

## 6. Requisitos Não Funcionais

| Tipo | Requisito | Evidência ou justificativa | Confidência |
|------|-----------|----------------------------|-------------|
| Segurança | A leitura do registro de bugs não abre arquivo para escrever, não executa processo e não fala com rede | `_reversa_sdd/prd.md#5-nao-objetivos-out`; a suíte de fronteiras da camada de leitura já recusa os módulos de processo e de rede e passa a cobrir também este leitor | 🟢 |
| Privacidade | Nenhum conteúdo de bug restrito atravessa o canal do host para a tela, e não apenas deixa de ser desenhado | `_reversa_bugs/README.md`, item 4 do protocolo dos agentes: o que não vai a view também não vai a harness externo | 🟢 |
| Desempenho | A pintura do bloco depois de receber o processo fica abaixo de 100 ms, e a leitura do registro respeita o teto de bugs e o teto de bytes já vigentes | `_reversa_sdd/sdd/painel-do-processo.md#7-requisitos-nao-funcionais` e `src/domain/limits.ts` | 🟡 |
| Manutenibilidade | A leitura do registro não altera arquivo herdado, para não criar carimbo novo nem adaptação a declarar na próxima ressincronização | A feature 006 já enfrentou a mesma restrição ao varrer as pastas de features | 🟢 |
| Tamanho | Ler a fonte de verdade exige interpretar front matter em YAML no pacote, e o acréscimo precisa manter o pacote abaixo do teto vigente; se o interpretador completo o estourar, a saída é um leitor restrito aos campos que o bloco usa, e nunca voltar a ler projeção | `_reversa_sdd/sdd/painel-do-processo.md#7-requisitos-nao-funcionais`; hoje o interpretador de YAML é dependência de desenvolvimento, usada só pelo gerador de views | 🟢 |
| Acessibilidade | Estado, fase e destaque do próximo a tratar são distinguíveis sem cor, e o bloco funciona a 300 px sem rolagem horizontal | `_reversa_sdd/sdd/painel-do-processo.md#7-requisitos-nao-funcionais` | 🟢 |
| Observabilidade | Toda degradação na leitura aparece na seção de anomalias com arquivo e código, e nada falha em silêncio | `_reversa_sdd/sdd/leitura-do-processo.md#11-edge-cases-e-tratamento-de-erros` | 🟢 |

## 7. Critérios de Aceitação

```gherkin
Cenário: o bloco desenha o registro atual
  Dado um projeto com um contexto e três bugs encerrados nele
  Quando o painel é aberto
  Então o topo do bloco mostra total três, resolvidos três, abertos zero e ativos zero
  E o grupo do contexto traz subtítulo com o nome dele e a mesma repartição
  E cada linha traz identificador, título, estado, data de registro e data de encerramento
  E nenhuma linha carrega a marca de próximo a tratar

Cenário: o próximo a tratar é um só, no primeiro grupo
  Dado um registro com dois contextos, cada um com um bug aberto e cinco encerrados
  Quando o painel é aberto
  Então o grupo com movimento mais recente aparece primeiro
  E dentro de cada grupo os abertos aparecem à frente dos encerrados
  E exatamente uma linha do bloco carrega a marca de próximo a tratar, por atributo e por palavra
  E essa linha é a do bug aberto do primeiro grupo

Cenário: o recorte esconde e revela sem mudar a ordem
  Dado dois contextos, cada um com dez bugs encerrados
  Quando o painel é aberto e o controle de revelar de um dos grupos é acionado
  Então antes do clique cada grupo mostra os cinco mais recentes e a contagem dos cinco ocultos
  E depois do clique o grupo acionado mostra os dez na mesma ordem em que os cinco apareciam
  E o outro grupo continua recortado

Cenário: as três condições de bloqueio sobem para a faixa
  Dado um bug em fase de espera por decisão, um com bloqueio declarado e um de severidade alta ainda aberto
  Quando o painel é aberto
  Então a faixa de bloqueio traz uma linha por bug, nomeando a razão de cada um
  E cada linha aponta o arquivo do bug
  E um bug que reúna duas dessas condições ocupa uma linha só, com as duas razões nomeadas

Cenário: a barra mede o registro e não a lista
  Dado um registro com dez bugs, sete deles encerrados
  Quando o recorte padrão esconde parte da lista
  Então a barra do topo mostra sete de dez
  E o texto equivalente da barra diz o mesmo número

Cenário: o bloco entra depois do histórico e nasce recolhido
  Dado um painel com processo instalado e nenhuma preferência de recolhimento declarada
  Quando o painel é desenhado
  Então o bloco de bugs aparece logo depois do histórico de features
  E aparece recolhido, como o histórico
  E as ações de abrir e fechar todos os cartões o alcançam como alcançam os outros
  E o recolhimento escolhido pelo usuário sobrevive a ocultar e reabrir o painel

Cenário: o identificador abre o arquivo do bug
  Dado um bloco com pelo menos um bug listado
  Quando o usuário aciona o identificador de um deles
  Então a mensagem de abrir arquivo sai com o caminho relativo do bug.md daquele bug
  E nenhum componente do bloco fala com o editor por outra via

Cenário: a projeção regenerável não influencia o que o painel mostra
  Dado um registro cuja projeção em generated está defasada, e outro sem essa pasta
  Quando o painel é lido nos dois
  Então o bloco desenha o mesmo conteúdo, derivado apenas dos bug.md e das travas
  E nenhum caminho sob generated é lido

Cenário: leitura parcial acima do teto
  Dado um registro com sessenta bugs
  Quando o painel é lido
  Então o bloco informa que existem sessenta e que cinquenta foram lidos
  E declara a leitura parcial em vez de apresentar cinquenta como o total

Cenário: releitura durante a sessão
  Dado um painel já desenhado e um bug registrado no terminal depois disso
  Quando o usuário aciona a releitura
  Então o conteúdo anterior permanece na tela enquanto a leitura corre
  E ao chegar a leitura nova o bug aparece no bloco, sem que a ordem dos demais se remexa

Cenário: a decisão do bloco é verificável sem navegador
  Dado o conjunto de funções que decidem ordem, recorte, próximo a tratar e rótulos
  Quando a suíte as exercita fora do navegador
  Então cada uma responde a partir dos dados recebidos, sem tocar disco nem editor
  E a cobertura de linhas dessas funções é integral

Cenário: dois movimentos no mesmo dia
  Dado dois bugs do mesmo contexto com a mesma data de última alteração
  Quando o painel é lido duas vezes seguidas
  Então os dois aparecem na ordem em que foram lidos, e igual nas duas leituras
  E a data exibida é a declarada no registro, e não a de modificação do arquivo no disco

Cenário negativo: registro ausente
  Dado um projeto sem a pasta do registro de bugs
  Quando o painel é aberto
  Então o bloco explica que não há registro de bugs neste projeto
  E nenhuma anomalia é registrada por essa ausência

Cenário negativo: front matter ilegível
  Dado um bug cujo front matter está truncado
  Quando o painel é lido
  Então o bloco desenha os demais bugs
  E a seção de anomalias traz o arquivo, o código e o detalhe do que não pôde ser lido

Cenário negativo: bug restrito
  Dado um bug marcado com visibilidade restrita
  Quando o painel é lido
  Então nenhum campo desse bug aparece na tela
  E o bloco declara que há registro omitido por restrição de visibilidade

Cenário negativo: registro inconsistente
  Dado um bug com estado resolvido e sem a trava de encerramento
  Quando o painel é lido
  Então o bloco mostra o bug e declara a inconsistência
  E não escolhe entre o estado declarado e a ausência da trava
```

## 8. Prioridade MoSCoW

| Item | MoSCoW | Justificativa |
|------|--------|---------------|
| RF-01, RF-02, RF-04, RF-05 | Must | São o bloco em si: sem o cartão, a contagem e a lista datada, não há rastreamento temporal algum |
| RF-06, RF-07 | Must | O que o Retomador precisa é saber qual tratar em seguida, e isso é a ordem mais o destaque, não a lista crua |
| RF-03 | Must | A barra é o espelho declarado do ciclo forward, e a autoridade da contagem sobre a lista é regra, não enfeite |
| RF-09, RF-12, RF-13, RF-16 | Must | Navegar até o arquivo, degradar com anomalia nomeada, nomear o vazio e respeitar a restrição de visibilidade são contratos já vigentes no painel |
| RF-10 | Must | A faixa existe para nomear o que aguarda decisão humana; espera declarada, bloqueio registrado e severidade alta em aberto são as três formas disso no registro |
| RF-14 | Must | A separação entre decisão e desenho é o que torna o bloco testável sem navegador, e a cobertura integral é requisito da spec |
| RF-11 | Must | Ler só a fonte de verdade é o que impede o painel de depender de alguém ter regenerado as views |
| RF-08, RF-15 | Should | Recorte e teto pesam pouco com três bugs e passam a pesar quando o registro crescer |
| Desempenho e tamanho do pacote | Should | Herdados da spec do painel; o risco real é o interpretador de YAML embarcado, com o leitor restrito aos campos usados como saída caso o teto seja estourado |

## 9. Esclarecimentos

### Sessão 2026-09-10

- **Q:** Escopo dos contextos. O registro agrupa bugs por contexto e hoje existe um só. Como o
  bloco deve tratar vários?
  **R:** Agrupado por contexto, com subtítulo por grupo e contagem própria de cada um. Fixado em
  RN-09, com a ordem entre grupos em RN-07 e o desdobramento em RF-02, RF-04, RF-07 e RF-08. O
  destaque de próximo a tratar permanece único no bloco, o que o agrupamento tornou uma decisão a
  registrar, e virou RN-10.
- **Q:** Fonte da leitura. De onde o painel lê o registro?
  **R:** Do `bug.md` de cada pasta, que é a fonte de verdade, aceitando embarcar a leitura de front
  matter em YAML no pacote da extensão. Fixado em RN-01 e em RF-11, que passou a proibir o consumo
  de qualquer projeção de `generated/`. O custo de tamanho ficou vigiado no requisito não funcional
  correspondente, com um leitor restrito aos campos usados como saída se o teto do pacote for
  estourado.
- **Q:** Granularidade do tempo. As datas do registro têm precisão de dia. Como ordenar dentro do
  mesmo dia?
  **R:** Assumir a precisão de dia e desempatar pela ordem de leitura, que é estável. Confirma
  RN-06 e RN-07, e acrescenta a RN-06 a recusa explícita da data de modificação do arquivo no
  disco, que muda por motivo alheio ao bug.
- **Q:** Posição do bloco. Onde ele entra na ordem fixa das seções, e como começa?
  **R:** Depois do histórico de features, recolhido por padrão, como o próprio histórico. Fixado em
  RF-01, o que acrescenta o nome novo ao conjunto do recolhimento padrão.
- **Q:** Faixa de bloqueio. Que condição de bug sobe para a faixa que nomeia o que aguarda você?
  **R:** A espera por decisão humana, o bloqueio declarado e a severidade alta enquanto o bug não
  estiver encerrado. Fixado em RF-10, com a regra de que um bug que reúna mais de uma condição
  ocupa uma linha só, nomeando as razões.

## 10. Lacunas

Nenhuma lacuna aberta. As três dúvidas da versão inicial foram resolvidas na sessão de
esclarecimento de 2026-09-10, registrada na seção anterior, e as decisões estão incorporadas às
regras de negócio e aos requisitos funcionais.

## 11. Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-09-10 | Versão inicial gerada por `/reversa-requirements` | reversa |
| 2026-09-10 | Sessão de esclarecimento por `/reversa-clarify`: cinco perguntas respondidas, três lacunas fechadas, RN-01, RN-06 e RN-07 reescritas, RN-09 e RN-10 acrescentadas, RF-01, RF-02, RF-04, RF-06, RF-07, RF-08, RF-10 e RF-11 revistos | reversa |
