# Requirements: verificação de atualização e progresso visível

> Identificador: `007-atualizacao-e-progresso`
> Data: `2026-09-09`
> Pasta da extração reversa: `_reversa_sdd/`
> Confidência: 🟢 CONFIRMADO, 🟡 INFERIDO, 🔴 LACUNA / DÚVIDA

## 1. Resumo executivo

A feature responde a duas queixas de uso corrente e não acrescenta eixo novo ao painel. A primeira
nasce de um fato novo do projeto: o repositório passou a ter origem remota em
`github.com/iago-leal/reversa-views`, e a extensão, distribuída por pacote local e sem Marketplace,
não tem como saber que ficou para trás. A entrega dá ao painel a capacidade de perguntar à origem se
há commits novos e de anunciá-lo, dá ao projeto um comando de terminal que aplica a atualização até
o pacote reinstalável, e faz a versão da extensão crescer sozinha a cada feature entregue, em lugar
do `0.0.1` congelado de hoje. A segunda queixa é defeito de leitura: a decomposição da feature ativa
se apresenta da ação mais antiga para a mais recente, o que obriga a rolar até o fim para achar onde
o trabalho parou, e a razão entre feito e total só existe como texto. A entrega inverte a ordem e
acrescenta uma barra de progresso a três cartões. Quem ganha nas duas frentes é o Retomador, persona
primária, que lê o painel depois de semanas de pausa e precisa do estado recente na primeira tela.

Neste documento, `clone` nomeia a cópia deste repositório na máquina do mantenedor, e `extensão
instalada` nomeia o pacote que o editor carrega. A distinção importa porque as duas frentes de
atualização vivem em lados diferentes: o painel apenas pergunta e anuncia, sem tocar em disco; o
clone é onde a atualização se aplica, por comando explícito.

## 2. Contexto a partir do legado

Este projeto nasceu greenfield pelo `/reversa-new`, de modo que a extração não tem `architecture.md`
nem `domain.md`. As fontes equivalentes são o PRD, as cinco especificações de componente e os seis
adendos vigentes escritos pelo `/reversa-sync` ao fim de cada feature entregue.

| Fonte | Trecho relevante | Confidência |
|-------|------------------|-------------|
| `_reversa_sdd/prd.md#5-nao-objetivos-out` | Telemetria e qualquer tráfego de rede em tempo de execução estão fora do escopo, e a publicação no Marketplace também: a distribuição é por VSIX local, sem publicador. É a restrição que esta feature emenda, por decisão registrada na seção 9. | 🟢 |
| `_reversa_sdd/prd.md#6-restricoes` | "Sem rede em tempo de execução" é restrição técnica declarada, e o invariante que sobrevive à evolução é a extensão nunca escrever arquivo. Ação futura despacha comando ao terminal, jamais edita disco. O segundo invariante permanece intocado por esta feature. | 🟢 |
| `_reversa_sdd/prd.md#7-dependencias-externas` | Nenhuma dependência em tempo de execução: a extensão não fala com serviço, API ou dado remoto. Passa a haver uma, e só uma, nomeada aqui. | 🟢 |
| `_reversa_sdd/prd.md#10-evolucao-prevista-disparar-agentes-pelo-painel` | Quando o painel ganhar superfície de ação, o disparo será por despacho ao terminal integrado, com leitura e despacho em camadas distintas. O lugar reservado já existe no cabeçalho, e esta feature não o ocupa. | 🟢 |
| `_reversa_sdd/prd.md#pendencias-de-cobertura` | A publicação no Marketplace está adiada, e o desenho não deve criar impedimento a ela. Um mecanismo próprio de atualização precisa conviver com essa reabertura. | 🟢 |
| `_reversa_sdd/sdd/heranca-e-sincronia.md#4-non-goals-fora-do-escopo` | NG-01 proíbe automatizar a ressincronização: ela é ritual humano disparado por sinal, porque mudança na origem pode exigir decisão que script nenhum toma. É o precedente do desenho em dois atos adotado aqui. | 🟢 |
| `_reversa_sdd/sdd/heranca-e-sincronia.md#3-objetivos` | G-02 pede medir a defasagem entre cópia e origem por um comando, em menos de dez segundos. O verificador de herança já compara revisões chamando o git fora do processo da extensão. | 🟢 |
| `_reversa_sdd/sdd/ponte-e-host.md#9-modelo-de-dados` | O protocolo entre host e painel cresce por acréscimo: campo novo é permitido, renomear e remover não. É por esse canal que o resultado da consulta desce até a tela. | 🟢 |
| `_reversa_sdd/addenda/005-empacotamento-e-verificacao.md` (vigente) | O empacotamento é comando de terminal com guarda de conteúdo e de tamanho, e o ritual do clone à extensão instalada está escrito no README. O atualizador se encaixa nesse ritual em vez de criar outro. | 🟢 |
| `_reversa_sdd/addenda/006-cartoes-e-cronologia.md` (vigente) | O recorte da decomposição é todas as ações abertas mais as cinco fechadas mais recentes pela trilha, com a contagem total sempre à vista e um controle que revela o resto. A contagem herdada é a autoridade sobre quantas ações existem. | 🟢 |
| `_reversa_sdd/sdd/painel-do-processo.md#11-edge-cases-e-tratamento-de-erros` | EC-02 fixa recorte por volume; a decomposição ganhou regra própria por ali. É onde a regra de ordenação nova se assenta. | 🟢 |
| `_reversa_sdd/sdd/leitura-do-processo.md#7-requisitos-nao-funcionais` | Os tetos do projeto vivem em fonte única, e o pacote da tela tem teto de 409.600 bytes conferido a cada construção. Qualquer acréscimo visual passa por essa guarda. | 🟢 |

**Emenda ao PRD, decidida em 2026-09-09.** O não-objetivo "telemetria e qualquer tráfego de rede em
tempo de execução" era uma cláusula com dois conteúdos, e apenas um deles continua valendo. A
telemetria segue proibida sem exceção: nada sai desta máquina sobre o que é lido, sobre qual
workspace está aberto ou sobre quem o abriu. O tráfego de rede deixa de ser proibido em bloco e
passa a ter uma exceção nomeada, a consulta de leitura à origem do próprio repositório, com os
limites que as regras RN-01, RN-08 e RN-09 fixam. A restrição correspondente da seção 6 do PRD e a
seção 7, hoje sem dependência externa alguma, precisam ser lidas com esta emenda ao lado até que a
próxima `/reversa-sync` a absorva.

Cinco observações do código sustentam o diagnóstico e delimitam onde cada peça pode morar.

A ordenação está em `src/webview/domain/decomposition-view.ts`. A função `recent` escolhe as cinco
fechadas mais recentes ordenando por instante decrescente, mas o recorte final devolve as linhas na
ordem do arquivo, porque filtra a lista original por um conjunto de índices. O efeito é que a
seleção é por recência e a exibição é por posição, duas ordens diferentes no mesmo cartão. Revelado
o resto pelo botão, a lista inteira aparece de `T001` em diante, que é exatamente a leitura da qual
a queixa trata.

As contagens de que as três barras precisam já existem. O cartão da decomposição e o do ciclo
forward leem `forward.actions`, com `total`, `fechadas`, `abertas` e `emendas`; o do histórico lê o
total de features e a situação de cada uma, entre convergida, entregue sem adendo, em aberto e sem
ações. Nenhuma barra depende de dado novo: dependem de forma.

A folha `src/webview/theme/theme.css` nomeia hoje dezenove variáveis, todas do conjunto de tokens do
Primer que o podador de `scripts/theme-tokens.js` mantém no pacote. O projeto depende de
`@primer/primitives`, que entrega tokens e não componentes, de modo que a barra do Primer entra aqui
como forma reconstruída sobre os mesmos tokens, não como componente importado.

A rede não cabe na tela, e isso não é preferência de estilo. A política de conteúdo montada em
`src/host/document.ts` não concede permissão de conexão de saída ao painel, e afrouxá-la seria abrir
a superfície inteira do webview para ganhar uma requisição. O processo do host, em Node, não tem
essa restrição, e o canal de mensagens que liga os dois já existe e cresce por acréscimo.

O invariante de não escrever é verificado por suíte: `tests/readonly-local.spec.ts` e a suíte
herdada recusam `child_process`, `execSync` e `spawnSync` na camada de leitura. Essa camada continua
pura, e a consulta à origem nasce fora dela, num módulo próprio do host sem capacidade de escrita
nem de execução.

## 3. Personas e cenários de uso

| Persona | Objetivo | Cenário-chave |
|---------|----------|---------------|
| O Retomador (primária) | Recuperar o estado do projeto depois de semanas de pausa, sem abrir arquivo | Abre o painel, vê a barra cheia até onde o trabalho chegou, lê as ações mais recentes no topo e descobre no cabeçalho que a extensão está atrás da origem |
| O Operador | Confirmar, várias vezes na mesma sessão, que a execução avançou | Relê o processo depois de rodar um agente, vê a barra crescer e encontra a ação recém-fechada na primeira linha |
| O Mantenedor | Manter a extensão instalada alinhada ao repositório remoto, sem ritual decorado | Vê o aviso no painel, roda um comando no clone, aplica a atualização e reinstala o pacote, cujo número de versão cresceu sozinho |
| O Mantenedor em máquina sem rede | Trabalhar num contêiner ou fora da rede sem que o projeto quebre | Abre o painel e lê que a consulta não foi possível, com a causa nomeada, em vez de um painel travado ou de um silêncio que pareça "está em dia" |

## 4. Regras de negócio novas ou alteradas

1. **RN-01:** A consulta à origem remota vive no processo do host e em nenhum outro lugar. A tela
   nunca abre conexão, a política de conteúdo do painel permanece sem permissão de conexão de saída,
   e o resultado desce pelo canal de mensagens que já existe. 🟢
   - Origem no legado: `_reversa_sdd/sdd/ponte-e-host.md#9-modelo-de-dados`; `src/host/document.ts`
   - Tipo: nova
2. **RN-02:** A camada de leitura permanece pura: sem rede, sem escrita, sem execução de processo. A
   consulta nasce em módulo próprio do host, e a suíte de fronteiras passa a impedir que os módulos
   de rede do Node apareçam na camada de leitura, ao lado dos de processo que já recusa. 🟢
   - Origem no legado: `_reversa_sdd/prd.md#6-restricoes`; `tests/readonly-local.spec.ts`
   - Tipo: nova
3. **RN-03:** A extensão continua sem abrir arquivo para escrita em camada alguma. O atualizador
   escreve apenas dentro do clone, isto é, na árvore versionada, na pasta de saída e no pacote
   gerado, e nunca no workspace observado pelo painel. 🟢
   - Origem no legado: `_reversa_sdd/prd.md#6-restricoes`
   - Tipo: nova
4. **RN-04:** Conferir e aplicar são dois atos separados. O painel apenas confere e anuncia; a
   aplicação exige gesto explícito no terminal, pelo mesmo motivo que NG-01 da spec de herança dá:
   mudança na origem pode exigir decisão que script nenhum toma. 🟢
   - Origem no legado: `_reversa_sdd/sdd/heranca-e-sincronia.md#4-non-goals-fora-do-escopo`
   - Tipo: nova
5. **RN-05:** A versão da extensão e o commit de que ela foi construída entram no pacote como
   constantes de tempo de construção, no mesmo regime de `INHERITED_MODEL_REVISION`, para que o
   painel os declare sem abrir arquivo em tempo de execução. 🟢
   - Origem no legado: `src/host/inheritance.ts`; `_reversa_sdd/addenda/004-heranca-e-sincronia.md`
   - Tipo: nova
6. **RN-06:** A versão nunca é escrita à mão. Ela é derivada na construção: o primeiro número
   permanece em zero até decisão explícita do mantenedor, o segundo é o da última feature com adendo
   escrito, e o terceiro conta os commits desde o commit daquele adendo. A derivação usa o MAIOR
   número de feature com adendo, e não a quantidade de adendos, para que adendo superado ou apagado
   não faça a versão recuar. 🟢
   - Origem no legado: `_reversa_sdd/addenda/` e a numeração de `_reversa_forward/`
   - Tipo: nova
7. **RN-07:** A decomposição se ordena do evento mais recente para o mais antigo, com as ações
   abertas encabeçando a lista na ordem do plano. Ação sem instante registrado na trilha vai ao fim
   do bloco a que pertence, mantendo entre si a ordem do arquivo, e sua linha continua declarando
   que o momento não foi registrado, em vez de mostrar campo vazio. 🟢
   - Origem no legado: `_reversa_sdd/addenda/006-cartoes-e-cronologia.md`
   - Tipo: alterada
8. **RN-08:** A contagem declarada segue sendo a autoridade sobre o denominador de cada barra. Na
   decomposição e no ciclo forward, a barra deriva da contagem herdada de ações, e não do
   comprimento da lista exibida, de modo que o recorte padrão não a encolhe. No histórico, deriva do
   total declarado de features, e não das entradas listadas, de modo que o corte por volume não a
   encolhe. Havendo divergência entre contagem e lista, o aviso que já existe permanece e a barra não
   escolhe entre os dois números. 🟢
   - Origem no legado: `_reversa_sdd/addenda/006-cartoes-e-cronologia.md`
   - Tipo: alterada
9. **RN-09:** A consulta à origem é anônima e de leitura: sem credencial, sem identificador de
   máquina, sem nome de workspace, sem qualquer dado sobre o que foi lido. Ela ocorre no máximo uma
   vez por leitura do processo, tem tempo limite curto e não se repete sozinha. Desligada por
   configuração, o painel declara que está desligada, em vez de silenciar. 🟢
   - Origem no legado: `_reversa_sdd/prd.md#5-nao-objetivos-out`, com a emenda da seção 2
   - Tipo: nova
10. **RN-10:** A barra nunca é a única portadora da informação. O texto que conta as unidades
    permanece onde está em cada um dos três cartões, e a barra o acompanha, porque cor e comprimento
    sozinhos não servem a quem lê em alto contraste nem a quem lê por leitor de tela. 🟡
    - Tipo: nova

## 5. Requisitos Funcionais

### A. O comando de atualização, no clone

| ID | Requisito | Prioridade | Critério de aceite | Confidência |
|----|-----------|------------|--------------------|-------------|
| RF-01 | Um comando de terminal confere se o clone está atrás da origem remota, buscando as referências sem alterar a árvore de trabalho | Must | `git status` antes e depois do comando produz a mesma saída | 🟢 |
| RF-02 | A conferência distingue três desfechos e os nomeia: em dia, atrás de N commits, e impossível conferir | Must | Cada desfecho tem código de saída próprio e mensagem que diz o que houve e o que fazer a seguir | 🟢 |
| RF-03 | A impossibilidade de conferir é falha barulhenta e nomeada: sem rede, sem remoto configurado ou com git ausente, o comando diz qual das três causas ocorreu | Must | Com a origem removida, o comando termina em menos de dez segundos nomeando a ausência do remoto | 🟢 |
| RF-04 | A aplicação da atualização é um segundo ato, disparado por argumento explícito | Must | `npm run atualizar` nunca traz commits; `npm run atualizar -- --aplicar` traz | 🟢 |
| RF-05 | A aplicação recusa árvore suja: havendo alteração não registrada ou commit local à frente da origem, o comando para antes de tocar em qualquer coisa e nomeia o que encontrou | Must | Com um arquivo modificado, o comando termina com código de recusa, sem executar a incorporação | 🟢 |
| RF-06 | A aplicação executa, na ordem, a incorporação dos commits, a instalação de dependências quando o arquivo de trava mudou, a construção, a suíte e o empacotamento, parando na primeira falha | Must | Suíte vermelha interrompe o percurso antes do empacotamento, e o pacote anterior permanece intacto | 🟢 |
| RF-07 | Ao fim da aplicação, o comando imprime o comando de instalação já com o nome do pacote gerado, e tenta a instalação quando o executável do editor estiver no caminho | Should | Sem o executável no caminho, o comando termina em sucesso e imprime a linha a copiar, em vez de falhar | 🟡 |
| RF-08 | O comando imprime o commit do clone na mesma forma curta que o painel exibe | Should | As duas cadeias têm o mesmo comprimento e a mesma regra de truncamento | 🟡 |

### B. A consulta do painel à origem

| ID | Requisito | Prioridade | Critério de aceite | Confidência |
|----|-----------|------------|--------------------|-------------|
| RF-09 | O processo do host consulta a origem remota e envia o resultado pelo canal de mensagens existente, por acréscimo ao protocolo | Must | Nenhuma conexão parte da tela, e a política de conteúdo do painel permanece sem permissão de conexão de saída | 🟢 |
| RF-10 | O painel declara o desfecho da consulta em três formas: em dia, atrás de N commits, e consulta impossível com a causa nomeada | Must | Cada forma é um texto distinto no cabeçalho, com atributo consultável que a nomeia | 🟢 |
| RF-11 | A consulta ocorre no máximo uma vez por leitura do processo, com tempo limite de cinco segundos e sem retentativa automática | Must | Duas leituras seguidas produzem no máximo duas requisições, e o gesto de reler é o que as repete | 🟡 |
| RF-12 | A consulta não bloqueia a leitura: o painel desenha o processo antes e recebe o resultado depois | Must | Com a origem inacessível, o painel completo aparece dentro do prazo normal de leitura | 🟢 |
| RF-13 | A requisição é anônima: sem credencial, sem identificador de máquina, sem nome de workspace e sem dado algum sobre o que foi lido | Must | A requisição carrega apenas o endereço do repositório e o commit de construção, e nenhum corpo | 🟢 |
| RF-14 | Uma chave de configuração do editor desliga a consulta, e desligada o painel declara isso em vez de silenciar | Must | Com a chave em falso, nenhuma requisição parte e o cabeçalho diz que a conferência está desligada | 🟢 |
| RF-15 | Commit de construção desconhecido pela origem, caso de commit local nunca enviado, é desfecho próprio e nomeado, distinto de atraso e de estar em dia | Must | Construído de um commit ausente na origem, o painel declara essa situação | 🟡 |
| RF-16 | Recusa por limite de taxa da origem é tratada como consulta impossível, com essa causa nomeada | Should | A mensagem distingue limite de taxa de ausência de rede | 🟡 |
| RF-17 | O painel declara, no cabeçalho, a versão da extensão instalada e o commit de que ela foi construída, em forma curta, com o valor integral consultável por atributo | Must | Os dois itens aparecem ao lado dos que já existem, como o do modelo herdado | 🟢 |

### C. A versão que cresce sozinha

| ID | Requisito | Prioridade | Critério de aceite | Confidência |
|----|-----------|------------|--------------------|-------------|
| RF-18 | A versão do pacote é derivada na construção, sem edição manual, a partir do maior número de feature com adendo escrito e da contagem de commits desde o commit daquele adendo | Must | Com seis adendos e um commit posterior, a derivação produz `0.6.1` | 🟢 |
| RF-19 | A derivação nunca faz a versão recuar entre duas construções do mesmo clone | Must | Apagado um adendo intermediário, o número permanece o mesmo ou cresce | 🟢 |
| RF-20 | A construção escreve a versão derivada no manifesto antes de empacotar, e o nome do pacote gerado passa a refleti-la | Must | O pacote de hoje se chamaria `reversa-views-0.6.1.vsix` | 🟢 |
| RF-21 | Fora de um clone git, ou sem adendo algum, a derivação recua para um valor declarado e o empacotamento diz por que recuou | Must | Num diretório sem histórico, o empacotamento termina imprimindo a causa, sem inventar número | 🟢 |
| RF-22 | O ritual de atualização entra no README, ao lado do de instalação e do de herança | Must | Existe seção própria com os dois atos, os desfechos da conferência, a recusa da árvore suja e a regra da versão derivada | 🟢 |

### D. A ordem da decomposição

| ID | Requisito | Prioridade | Critério de aceite | Confidência |
|----|-----------|------------|--------------------|-------------|
| RF-23 | A decomposição da feature ativa se exibe do evento mais recente para o mais antigo | Must | Com trilha em que `T044` é o evento mais recente, `T044` é a primeira linha entre as fechadas | 🟢 |
| RF-24 | As ações abertas encabeçam a lista, na ordem do plano, e a próxima a executar continua marcada por atributo e por palavra | Must | Com três abertas, as três aparecem antes de qualquer fechada, e a primeira delas traz a marca de próxima | 🟢 |
| RF-25 | Ação sem instante registrado vai ao fim do bloco a que pertence, preservando entre si a ordem do arquivo | Must | Duas ações sem instante aparecem depois de todas as que têm instante, e na ordem do arquivo | 🟢 |
| RF-26 | O recorte padrão e o controle que revela o resto continuam como estão, e passam a exibir na mesma ordem em que selecionam | Must | Antes e depois de revelar o resto, a ordem das linhas comuns às duas listas é a mesma | 🟢 |

### E. A barra de progresso

| ID | Requisito | Prioridade | Critério de aceite | Confidência |
|----|-----------|------------|--------------------|-------------|
| RF-27 | O cartão da decomposição exibe uma barra com a razão entre ações fechadas e total | Must | Com 44 de 44 fechadas, a barra aparece cheia; com 22 de 44, pela metade | 🟢 |
| RF-28 | O cartão do ciclo forward exibe a mesma razão, ao lado dos números que já imprime | Must | A barra concorda com os pares "ações fechadas" e "ações abertas" do cartão | 🟢 |
| RF-29 | O cartão do histórico exibe a razão entre features convergidas e o total declarado de features | Must | Com seis features das quais cinco convergidas, a barra aparece em cinco sextos | 🟡 |
| RF-30 | A barra é uma peça só, usada pelos três cartões, e não três trechos parecidos | Must | Existe um componente próprio com propriedades de contagem, e os três cartões o chamam | 🟢 |
| RF-31 | A barra declara papel, valor mínimo, valor máximo, valor corrente e texto equivalente | Must | O elemento traz `role="progressbar"` com os quatro atributos, e o texto equivalente repete a contagem escrita ao lado | 🟡 |
| RF-32 | A barra se desenha sobre os tokens do Primer já usados no projeto, sem dependência nova e sem componente importado | Must | Nenhum pacote entra no arquivo de trava, e os tokens novos aparecem nomeados em `theme.css` | 🟢 |
| RF-33 | Cada barra tem estados de borda declarados: denominador zero não desenha barra, cartão sem leitura não desenha barra, e divergência entre contagem e lista mantém o aviso existente | Must | Os três casos têm teste que verifica ausência de barra ou permanência do aviso | 🟢 |

## 6. Requisitos Não Funcionais

| Tipo | Requisito | Evidência ou justificativa | Confidência |
|------|-----------|----------------------------|-------------|
| Privacidade | A consulta não carrega dado algum sobre o usuário, a máquina ou o workspace. Telemetria continua proibida sem exceção, e a emenda ao PRD abre apenas a consulta de leitura à origem do próprio repositório | Emenda registrada na seção 2; `_reversa_sdd/prd.md#5-nao-objetivos-out` | 🟢 |
| Segurança | A capacidade de rede vive num módulo próprio do host, sem escrita e sem execução de processo, e a suíte de fronteiras impede que a camada de leitura a ganhe | `tests/readonly-local.spec.ts`; `_reversa_sdd/prd.md#6-restricoes` | 🟢 |
| Segurança | O endereço consultado é o da origem já configurada no repositório, embutido na construção. Nem o atualizador nem a consulta aceitam endereço por argumento ou por variável de ambiente | Evita que manutenção vire vetor de busca de código arbitrário | 🟡 |
| Segurança | A política de conteúdo do painel permanece sem permissão de conexão de saída, e a suíte que a verifica continua verde | `src/host/document.ts`; suíte do documento | 🟢 |
| Compatibilidade | A versão mínima de editor declarada embarca um Node que não traz cliente HTTP global, o que empurra a consulta para o módulo nativo de requisição em vez do global moderno | `scripts/limites.js` fixa a versão mínima e o alvo do navegador; verificar na implementação | 🟡 |
| Desempenho | A consulta tem tempo limite de cinco segundos no painel e falha nesse prazo sem rede. O comando de terminal mantém o prazo de dez segundos herdado do objetivo análogo | `_reversa_sdd/sdd/heranca-e-sincronia.md#3-objetivos` | 🟡 |
| Desempenho | A ordenação nova é feita uma vez por leitura, sobre lista já em memória, e não altera o teto de cinquenta pastas de feature por leitura | `src/domain/limits.ts`; `_reversa_sdd/sdd/leitura-do-processo.md#7-requisitos-nao-funcionais` | 🟢 |
| Resiliência | Nem a consulta nem o atualizador fazem retentativa automática: falham uma vez, nomeiam a causa e devolvem o controle ao mantenedor | Retentativa silenciosa esconde defeito de rede e de credencial, e o projeto prefere erro barulhento | 🟢 |
| Tamanho | O pacote da tela continua abaixo de 409.600 bytes com as três barras dentro, e a guarda do build continua sendo o portão | `scripts/limites.js`; `_reversa_sdd/addenda/005-empacotamento-e-verificacao.md` | 🟢 |
| Acessibilidade | O preenchimento da barra tem contraste de ao menos 3:1 contra o trilho nos quatro conjuntos de cores, incluindo os dois de alto contraste | `src/webview/theme/primer-themes.ts` importa os quatro conjuntos; regra de contraste de elemento não textual | 🟡 |
| Observabilidade | Toda parada do atualizador imprime causa, arquivo ou comando envolvido e código de saída, sem depender de leitura de log | Princípio de erros barulhentos, já aplicado no verificador de herança | 🟢 |
| Reprodutibilidade | Rodar o atualizador duas vezes seguidas com o clone já em dia produz o mesmo desfecho, sem efeito colateral na segunda vez | Manutenção intermitente por mantenedor único | 🟢 |
| Compatibilidade | O desenho não cria impedimento à publicação futura no Marketplace: a consulta é um acréscimo ao painel, e o ritual de clone não substitui canal oficial de atualização | `_reversa_sdd/prd.md#pendencias-de-cobertura`, item 3 | 🟡 |

## 7. Critérios de Aceitação

```gherkin
Cenário: o painel anuncia que há novidade
  Dado um painel construído do commit a23711d e uma origem com três commits à frente
  Quando o processo é lido
  Então o cabeçalho declara que há três commits novos desde a23711d
  E nomeia o comando que aplica a atualização

Cenário: o painel sem rede não mente
  Dado um painel numa máquina sem acesso à origem
  Quando o processo é lido
  Então o painel inteiro aparece dentro do prazo normal de leitura
  E o cabeçalho declara que a consulta não foi possível, nomeando a causa
  E em nenhum momento diz que a extensão está em dia

Cenário: a consulta desligada por configuração
  Dado a chave de configuração da conferência em falso
  Quando o processo é lido
  Então nenhuma requisição parte do editor
  E o cabeçalho declara que a conferência está desligada

Cenário: construído de um commit que a origem não conhece
  Dado um pacote construído de um commit local nunca enviado
  Quando a consulta responde que desconhece aquele commit
  Então o painel declara essa situação
  E não a apresenta como atraso nem como estar em dia

Cenário: a tela nunca abre conexão
  Dado o pacote da tela pronto para empacotamento
  Quando a política de conteúdo do painel é inspecionada
  Então ela não concede permissão de conexão de saída
  E nenhuma chamada de rede aparece no pacote da tela

Cenário: o clone está atrás da origem
  Dado um clone cujo ramo local tem três commits a menos que a origem
  Quando o mantenedor roda o comando de conferência
  Então a saída diz que há três commits novos, nomeia o ramo e não altera arquivo algum
  E o código de saída distingue esse desfecho do desfecho "em dia"

Cenário: aplicar a atualização até o pacote
  Dado um clone atrás da origem e com árvore de trabalho limpa
  Quando o mantenedor roda o comando com o argumento de aplicação
  Então os commits são incorporados, a construção e a suíte rodam, o pacote é regenerado
  E a última linha traz o comando de instalação já com o nome do pacote

Cenário: árvore suja recusa a aplicação
  Dado um clone com um arquivo modificado e não registrado
  Quando o mantenedor roda o comando com o argumento de aplicação
  Então nada é incorporado, a mensagem nomeia o arquivo encontrado
  E o código de saída indica recusa, não erro interno

Cenário: a versão cresce sem que ninguém a escreva
  Dado um repositório com adendos das features 001 a 006 e um commit após o último
  Quando o pacote é gerado
  Então a versão do manifesto é 0.6.1 e o pacote leva esse número no nome
  E nenhum arquivo precisou ser editado à mão para isso

Cenário: adendo apagado não faz a versão recuar
  Dado o mesmo repositório com o adendo da feature 003 removido
  Quando o pacote é gerado
  Então a versão permanece 0.6.1
  E a derivação continua ancorada no maior número de feature com adendo

Cenário: a decomposição do mais recente ao mais antigo
  Dado uma feature ativa com quarenta e quatro ações fechadas e trilha completa
  Quando o cartão da decomposição é lido
  Então a primeira linha é a ação de evento mais recente
  E a barra de progresso aparece cheia, ao lado do texto que diz quarenta e quatro de quarenta e quatro

Cenário: as ações abertas encabeçam a lista
  Dado uma feature com três ações abertas e vinte fechadas
  Quando o cartão da decomposição é lido
  Então as três abertas aparecem antes de qualquer fechada, na ordem do plano
  E a primeira delas traz a marca de próxima a executar

Cenário: ação sem instante registrado
  Dado uma feature em que duas ações não têm evento na trilha
  Quando o cartão é lido
  Então as duas aparecem depois de todas as que têm instante
  E cada uma continua declarando que o momento não foi registrado

Cenário: revelar o resto não reordena o que já estava à vista
  Dado o cartão no recorte padrão, com as fechadas mais recentes à mostra
  Quando o leitor aciona o controle que revela as demais
  Então as linhas que já apareciam mantêm entre si a mesma ordem
  E as reveladas entram nos lugares que a recência lhes dá

Cenário: a mesma barra nos três cartões
  Dado um projeto com seis features, cinco delas convergidas, e uma feature ativa pela metade
  Quando os cartões da decomposição, do ciclo forward e do histórico são lidos
  Então cada um exibe sua barra, e as duas primeiras concordam entre si
  E a do histórico mede features convergidas sobre o total declarado

Cenário: a barra anunciada a quem não a vê
  Dado o cartão com vinte e duas de quarenta e quatro ações fechadas
  Quando o elemento da barra é inspecionado
  Então ele declara papel de barra de progresso, os limites e o valor corrente
  E o texto equivalente repete a contagem que está escrita ao lado

Cenário: feature ativa sem ação alguma
  Dado uma feature ativa cujo arquivo de ações não tem linha de ação
  Quando o cartão é lido
  Então nenhuma barra é desenhada
  E a frase que já existe para esse caso continua sendo a única resposta da seção

Cenário: o ritual encontrado depois de meses
  Dado o mantenedor que voltou ao projeto após uma pausa longa
  Quando ele abre o README
  Então encontra a seção do ritual de atualização, com os dois atos separados
  E a regra pela qual a versão cresce sozinha
```

## 8. Prioridade MoSCoW

| Item | MoSCoW | Justificativa |
|------|--------|---------------|
| RF-01 a RF-06 | Must | Sem conferência e sem aplicação separadas não há mecanismo de atualização, que é a queixa de origem |
| RF-09 a RF-15, RF-17 | Must | A consulta pelo painel é a forma escolhida para a conferência, e sem os desfechos nomeados ela informa menos do que confunde |
| RF-18 a RF-21 | Must | Versão congelada em 0.0.1 não distingue um pacote do outro, e o pedido é explícito quanto a ela crescer sem ato deliberado |
| RF-22 | Must | Ritual não escrito é ritual perdido na próxima pausa longa, que é o modo de trabalho deste projeto |
| RF-23 a RF-26 | Must | A ordem invertida é o defeito relatado, e o recorte só faz sentido se selecionar e exibir na mesma ordem |
| RF-27 a RF-33 | Must | A barra é o segundo pedido, e sem peça única, estados de borda e acessibilidade ela é regressão de qualidade |
| RF-07, RF-08, RF-16 | Should | Conveniências que encurtam o ritual ou afinam a mensagem, sem as quais ele continua completo |
| RNF de privacidade, segurança e tamanho | Must | São portões que o projeto já aplica, e a frente de rede é justamente a que poderia afrouxá-los |
| RNF de desempenho da consulta | Should | Prazos herdados de objetivo análogo, ainda não medidos nesta máquina |
| Corrigir o recorte de cinquenta pastas do histórico, registrado como W019 | Won't | Defeito da mesma família, ordem crescente no corte contra exibição decrescente, mas sem efeito abaixo de cinquenta features; este projeto tem seis |
| Atualizar o framework Reversa do workspace ou a herança vendorizada | Won't | Decidido em 2026-09-09: esta feature cobre apenas o código desta extensão. A herança tem ritual próprio, já escrito |
| Botão no painel que dispare o atualizador no terminal | Won't | Depende da camada de despacho prevista na seção 10 do PRD, ainda não construída. O painel anuncia e nomeia o comando; quem o roda é o mantenedor |
| Baixar e instalar a atualização a partir do painel | Won't | Contraria o invariante de a extensão nunca escrever, que esta feature preserva intacto |

## 9. Esclarecimentos

### Sessão 2026-09-09

- **Q:** Fronteira de rede: quem confere se há versão nova, o painel ou apenas um comando de
  terminal?
  **R:** O painel consulta a origem remota por conta própria e anuncia a novidade, com emenda ao
  PRD. A emenda está registrada na seção 2, a consulta vive no host por RN-01, e os limites de
  privacidade e frequência estão em RN-09.
- **Q:** O que "atualizar-se" abrange: só esta extensão, o framework Reversa do workspace, a herança
  vendorizada, ou os três?
  **R:** Apenas o código desta extensão. O framework instalado no workspace e a herança vendorizada
  ficam de fora, esta última por já ter ritual próprio de ressincronização.
- **Q:** Onde ficam as ações abertas na ordem nova?
  **R:** Encabeçando a lista, na ordem do plano, com as fechadas ordenadas por recência decrescente.
  Fixado em RN-07, RF-23 e RF-24.
- **Q:** Como o pacote passa a ser identificado, já que a versão não pode ficar em 0.0.1 nem exigir
  ato deliberado do mantenedor?
  **R:** A versão é derivada na construção, pela contagem de features entregues: o segundo número é
  o da última feature com adendo, o terceiro conta os commits desde aquele adendo, e o primeiro
  permanece em zero. Hoje daria 0.6.1. A comparação com a origem continua sendo por commit, e não
  por esse número, que é rótulo legível e não critério.
- **Q:** Onde a barra de progresso aparece?
  **R:** Nos três cartões: decomposição da feature ativa, ciclo forward e histórico das entregas. A
  repetição da mesma razão nos dois primeiros é deliberada, porque cada cartão é recolhível e
  precisa se bastar quando os outros estão fechados.

## 10. Lacunas

Nenhuma lacuna aberta. As três dúvidas da versão inicial foram resolvidas na sessão acima.

Duas decisões foram deliberadamente adiadas para o `/reversa-plan`, por serem de implementação e não
de requisito:

- Como a versão derivada chega ao manifesto sem sujar a árvore de trabalho, isto é, se o número
  escrito volta ao repositório como commit ou se é escrito e revertido em torno do empacotamento.
- Qual rota da origem responde à consulta e em que forma, entre comparar dois commits ou ler a
  ponta do ramo, decisão que muda a mensagem exibida quando a comparação não é possível.

## 11. Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-09-09 | Versão inicial gerada por `/reversa-requirements` | reversa |
| 2026-09-09 | Sessão de esclarecimentos por `/reversa-clarify`: cinco respostas integradas, três `[DÚVIDA]` resolvidos, emenda ao PRD registrada na seção 2, requisitos renumerados e agrupados por frente | reversa |
