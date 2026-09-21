# Requirements: visual do painel de linha de comando

> Identificador: `016-visual-do-painel-cli`
> Data: `2026-09-21`
> Pasta da extração reversa: `_reversa_sdd/`
> Confidência: 🟢 CONFIRMADO, 🟡 INFERIDO, 🔴 LACUNA / DÚVIDA

## 1. Resumo executivo

O painel do processo no terminal, entregue pela 014, diz tudo o que o painel do editor diz, mas o diz
em texto corrido: sem moldura, sem hierarquia visual e com quatro ênfases, das quais só uma é cor.
Esta feature lhe dá uma linguagem visual própria, tomando por referência a do Claude Code: acento
quente sobre texto neutro, molduras de cantos arredondados, glifos de estado, dado secundário
atenuado e linha de estado fixa na última linha da janela. Serve ao Operador, que mantém a ferramenta aberta ao lado
do agente e precisa achar o que mudou num relance. Nenhum fato, frase, ordem ou contagem muda: a
entrega é de apresentação.

Sobre a condição posta no pedido: a referência **é alcançável**. Tudo o que compõe aquele visual
(cor de 24 bits, caracteres de moldura, glifos, atenuação e linha de estado fixa) sai do que o terminal e o
interpretador já oferecem, sem dependência nova. A alternativa inspirada no Ranger fica, portanto,
descartada, e com ela a disposição em colunas, que mudaria a navegação, e não só a aparência.

## 2. Contexto a partir do legado

O projeto nasceu pelo caminho greenfield: não há `architecture.md`, `domain.md`, `inventory.md` nem
`code-analysis.md`, e tampouco `.reversa/principles.md`. O conhecimento vigente está no PRD, nas
cinco specs de `_reversa_sdd/sdd/` e nos adendos, todos sem linha de superação.

| Fonte | Trecho relevante | Confidência |
|-------|------------------|-------------|
| `_reversa_sdd/addenda/014-cli-do-processo.md#resumo-da-entrega` | A ferramenta desenha as onze seções na ordem do painel, com o bloqueio humano antes de tudo, identifica o item sob o cursor sem depender de cor, e tem um modo de uma passada e uma saída de dados para script | 🟢 |
| `_reversa_sdd/addenda/014-cli-do-processo.md#impacto-por-artefato-da-extracao` | O que o terminal escreveu por conta própria é só o desenho: recorte, janela de rolagem, **ênfase abstrata** e a tradução dela em sequência de escape, confinada num módulo único. Os títulos de seção são transcritos do painel e presos por suíte de paridade | 🟢 |
| `_reversa_sdd/addenda/014-cli-do-processo.md#o-que-o-texto-deliberadamente-nao-diz` | A ferramenta não conhece caminho de arquivo do Reversa, não decide fase, não guarda estado entre execuções e não carrega dependência nova, e uma suíte de fronteiras confere isso por busca nos fontes | 🟢 |
| `_reversa_sdd/addenda/014-cli-do-processo.md#regras-sob-vigilancia` | Com duas superfícies, a regressão mais grave é as duas discordarem sem que suíte alguma caia; afrouxar a suíte de fronteiras ou a de paridade é o sinal de violação mais sério | 🟢 |
| `_reversa_sdd/addenda/015-fases-fora-do-canone.md` | A seção da Descoberta do terminal ganhou ciclo, etapas e encerramento sem declaração, com as frases partilhadas com a tela: há conteúdo recente que o visual novo precisa acomodar | 🟢 |
| `_reversa_sdd/sdd/painel-do-processo.md#3-goals-objetivos` | G-04: o painel segue o tema do editor, **sem paleta própria**. No terminal não há tema a seguir, e esta feature declara a primeira paleta do produto | 🟡 |
| `_reversa_sdd/sdd/painel-do-processo.md#6-requisitos-funcionais` | RF-13: toda decisão de apresentação em função pura fora dos componentes visuais, que é o que mantém as duas superfícies de acordo | 🟢 |
| `_reversa_sdd/sdd/painel-do-processo.md#7-requisitos-nao-funcionais` | RNF-03: status distinguível sem cor, e alto contraste como tema suportado, não como exceção | 🟡 |
| `_reversa_sdd/sdd/painel-do-processo.md#8-design-e-interface` | O bloqueio humano recebe destaque que usa forma e texto além de cor | 🟡 |
| `_reversa_sdd/prd.md#6-restricoes` | A doutrina de zero dependência e de não escrever no projeto observado | 🟢 |
| `_reversa_sdd/personas.md#persona-2-o-operador` | Quem roda os agentes no terminal e confere se o estágio avançou | 🟢 |

Estado de partida, medido nesta data sobre o próprio repositório: o cabeçalho ocupa doze linhas de
pares "rótulo: valor" sem separação do corpo; os títulos de seção distinguem-se só por negrito; a
seção fechada é marcada por `[+]` e o cursor por `> `; cada ação traz a descrição, o caminho do
artefato e o instante na mesma linha corrida, de modo que o olho não separa o que é a ação do que é
onde ela mora. A ênfase é uma por linha inteira, em vocabulário de cinco valores: normal, título,
selecionada, atenuada e alerta.

## 3. Personas e cenários de uso

| Persona | Objetivo | Cenário-chave |
|---------|----------|---------------|
| O Operador (primária) 🟢 | Achar num relance o que mudou, com a ferramenta aberta numa divisão da janela ao lado do agente | A contagem de ações muda sozinha; ele localiza a seção pelo título colorido e a ação recém-fechada pelo glifo, sem ler a linha |
| O Retomador 🟢 | Reconhecer em segundos onde o projeto parou e o que aguarda decisão dele | Abre a ferramenta depois de semanas, e a moldura de bloqueio, quando existe, é a primeira coisa que o olho encontra |
| O Operador remoto 🟡 | Ler o processo numa máquina alcançada por terminal, cuja capacidade de cor ele não controla | O terminal remoto só oferece dezesseis cores, e a tela continua hierarquizada e legível |
| O script 🟢 | Consumir a saída sem pessoa diante da tela | O comando encadeado de ontem produz hoje os mesmos bytes |

## 4. Regras de negócio novas ou alteradas

1. **RN-01:** O visual é pele, e não julgamento. Nenhuma frase, rótulo, ordem de seção, contagem ou
   caminho apresentado muda por força desta feature; muda como cada um é desenhado. 🟢
   - Origem no legado: `_reversa_sdd/addenda/014-cli-do-processo.md#resumo-da-entrega` e a RN-01 e a RN-04 da 014
   - Tipo: nova, reafirmando regra vigente
2. **RN-02:** A ênfase continua abstrata. O desenho segue sem produzir sequência de escape, a
   tradução em cor continua num módulo único, e o quadro inteiro continua conferível por comparação
   de texto. O que se altera é o alcance: o vocabulário deixa de ter cinco valores e a ênfase deixa
   de valer obrigatoriamente para a linha inteira, podendo recair sobre um trecho dela. 🟢
   - Origem no legado: `_reversa_sdd/addenda/014-cli-do-processo.md#impacto-por-artefato-da-extracao`, linha de `painel-do-processo.md#8-design-e-interface`
   - Tipo: alterada
3. **RN-03:** A cor nunca é o único portador de uma distinção. Tudo o que a cor separa (item
   selecionado, seção aberta ou fechada, ação fechada, próxima ou aberta, alerta, bloqueio) é
   separado também por glifo, texto ou moldura. 🟢
   - Origem no legado: RF-09 da 014 e `_reversa_sdd/sdd/painel-do-processo.md#7-requisitos-nao-funcionais`, RNF-03
   - Tipo: nova, generalizando regra vigente
4. **RN-04:** O terminal tem paleta própria, em duas versões, uma para fundo escuro e outra para
   fundo claro, e as duas são declaradas num lugar só. O G-04 do painel, que proíbe paleta própria,
   continua valendo para o editor, onde há tema a seguir; no terminal não há, e a paleta passa a ser
   decisão do produto. O acento é o mesmo nas duas versões e veste só marca: glifo de seleção, glifo
   de seção e moldura do cabeçalho. O texto em foco, que é o nome da ferramenta e o título
   selecionado, veste o papel de destaque, igual ao acento no fundo escuro e escurecido no claro. Os
   demais papéis têm um tom por fundo, porque a medição mostrou que nenhum tom único guarda contraste
   nos dois. 🟢
   - Origem no legado: `_reversa_sdd/sdd/painel-do-processo.md#3-goals-objetivos`, G-04
   - Tipo: nova, delimitando o alcance de regra vigente
5. **RN-05:** A apresentação degrada em degraus, e nenhum degrau perde informação. Os degraus de cor
   são quatro: 24 bits, 256 cores, 16 cores e nenhuma. Cada um é escolhido pelo que o ambiente
   declara, e o que some de um degrau para o outro é só fidelidade de tom. 🟡
   - Origem no legado: RF-19 da 014
   - Tipo: alterada (a 014 conhecia dois degraus, com cor e sem cor)
6. **RN-06:** O contrato de máquina não muda, e o texto guarda garantias, não bytes. A saída de
   dados permanece idêntica byte a byte, e os códigos de saída são os mesmos. O texto que não vai
   para um terminal continua sem sequência de escape, sem caractere de moldura, alinhado em oitenta
   colunas e com os mesmos fatos na mesma ordem; a disposição dele pode mudar, e muda com o RF-06,
   para que exista uma disposição só nos três destinos: interface viva, passada diante de terminal e
   passada redirecionada. 🟢
   - Origem no legado: RF-17, RF-19, RF-20 e RF-21 da 014
   - Tipo: nova, reafirmando regra vigente quanto aos dados e delimitando-a quanto ao texto
7. **RN-07:** A referência é inspiração, e não imitação de identidade. A ferramenta toma de
   empréstimo tom, proporção e gramática visual, e continua se apresentando como Reversa: não exibe
   nome, mascote, logotipo nem frase do produto de referência. 🟢
   - Tipo: nova
8. **RN-08:** Nenhuma dependência de tempo de execução é acrescentada, e nenhum estado passa a
   sobreviver entre execuções. A preferência de fundo vale pela execução em que foi declarada, por
   bandeira ou por variável de ambiente, e a ferramenta não a guarda em arquivo. 🟢
   - Origem no legado: RF-26 e RN-05 da 014, `_reversa_sdd/prd.md#6-restricoes`
   - Tipo: nova, reafirmando regra vigente

## 5. Requisitos Funcionais

### Linguagem visual

| ID | Requisito | Prioridade | Critério de aceite | Confidência |
|----|-----------|------------|--------------------|-------------|
| RF-01 | O sistema deve usar uma paleta de papéis nomeados: um **acento** quente, na família do laranja-terracota da referência, para as marcas de identidade e de foco; um **destaque**, da mesma matiz, para o texto em foco; um **neutro atenuado** para dado secundário; e três cores de estado, para concluído, atenção e falha. Os tons de partida são os medidos em `estudo-de-possibilidades.md`, seção 1.2 | Must | Cada cor usada na tela corresponde a um papel nomeado, e nenhum valor de cor aparece fora do lugar único em que a paleta é declarada | 🟢 |
| RF-02 | O sistema deve desenhar, dentro de uma moldura de cantos arredondados que rola com o corpo, o **núcleo** do cabeçalho: o nome da ferramenta no destaque e quatro fatos, projeto, raiz observada, instante da leitura e integridade da leitura | Must | A moldura acompanha a largura da janela e nunca a ultrapassa; os fatos exigidos pela RN-06 da 014, raiz observada e instante da leitura, estão dentro dela; a linha de integridade usa a cor de atenção quando a leitura degradou | 🟢 |
| RF-03 | O sistema deve desenhar o bloqueio humano em moldura própria, na cor de atenção, distinguível da moldura do cabeçalho também sem cor | Must | Num terminal sem cor, as duas molduras se distinguem pelo título e por um glifo de atenção; sem bloqueio, a moldura não é desenhada e a frase "Nada aguarda decisão humana" permanece | 🟢 |
| RF-04 | O sistema deve marcar cada título de seção com um glifo que diga se ela está aberta ou fechada, no lugar da marca textual de hoje, e desenhar a contagem ao lado do título no neutro atenuado | Must | Seção aberta e seção fechada trazem glifos diferentes, e o título selecionado recebe o destaque | 🟢 |
| RF-05 | O sistema deve colorir o glifo de estado de cada ação segundo o estado que ele já diz: fechada, próxima e aberta | Must | Os três glifos de hoje continuam sendo três e continuam diferentes entre si; a cor acompanha o glifo, e não o substitui | 🟢 |
| RF-06 | O sistema deve separar, em cada item, o dado principal do dado secundário: o caminho do artefato e o instante passam a ocupar linha própria sob a descrição, recuados, ligados a ela por um glifo de continuação e desenhados no neutro atenuado | Must | Numa ação com artefato e instante, a descrição termina antes deles, e o que vem abaixo é reconhecível como pertencente ao item de cima | 🟡 |
| RF-07 | O sistema deve marcar o item sob o cursor com um glifo de seleção no acento, mantendo-o identificável sem cor | Must | Num terminal sem cor, o item selecionado continua sendo o único a trazer o glifo de seleção | 🟢 |
| RF-08 | O sistema deve manter, na última linha da janela, uma linha de estado fixa, que não rola com o conteúdo, com as teclas principais, a procedência da leitura corrente, que deixa o cabeçalho e passa a morar ali, e a posição da janela dentro do quadro. O nome dela é um só, linha de estado, neste documento e nos identificadores do código | Must | Com o quadro mais alto que a janela, rolar até o fim não tira a linha de estado do lugar, e ela declara que há conteúdo acima ou abaixo; a frase de procedência é a mesma de hoje, recortada à largura quando preciso | 🟢 |
| RF-09 | O sistema deve aplicar a mesma linguagem à ajuda e às quatro situações de entrada que a 014 nomeia: raiz inexistente, Reversa não instalado, leitura íntegra e falha de leitura | Should | As três que chegam à interface viva, Reversa não instalado, leitura íntegra e falha de leitura, têm título próprio dentro de moldura, e a falha de leitura usa a cor de falha; a raiz inexistente, que termina com o código de uso incorreto antes de existir quadro, recebe título na cor de falha, sem moldura, no canal de erro, quando ele é terminal | 🟢 |
| RF-10 | O sistema deve assinalar na linha de estado, por glifo próprio, que a observação do disco está ativa, e, quando ela degradou para intervalo, dizê-lo na cor de atenção | Could | A razão da degradação, que a tela já declara, continua legível por extenso | 🟡 |
| RF-18 | O sistema deve apresentar, ao fim do quadro, uma seção chamada "Versões e construção", com os fatos que deixam o cabeçalho: versão do Reversa, revisão do modelo herdado, versão da extensão, carimbo da construção e o desfecho da conferência de atualização | Must | Nenhum fato que o cabeçalho de hoje afirma deixa de ser afirmado; a seção se abre, se fecha e se alcança pelas teclas já existentes; ela fica declaradamente fora da ordem fixa das onze seções, como a faixa de bloqueio já fica; a palavra procedência fica reservada à origem da leitura corrente, a do RF-08 | 🟢 |
| RF-19 | O sistema deve, na passada diante de um terminal, imprimir o mesmo texto da passada redirecionada, vestido com a paleta, sem moldura e sem linha de estado | Must | Retiradas as sequências de cor, a saída diante do terminal é idêntica à redirecionada; com a cor desligada, é idêntica sem retirar nada | 🟢 |

### Degradação

| ID | Requisito | Prioridade | Critério de aceite | Confidência |
|----|-----------|------------|--------------------|-------------|
| RF-11 | O sistema deve escolher o degrau de cor pelo que o ambiente declara, e cair para o degrau inferior na dúvida. O terminal de trabalho declara 24 bits; a degradação serve ao Operador remoto e a terminais embutidos, cuja capacidade ele não escolhe | Must | Um terminal que declara 256 cores e nada diz sobre 24 bits recebe os índices de `estudo-de-possibilidades.md`, seção 1.4, e a tela não apresenta cor trocada nem sequência impressa como texto | 🟢 |
| RF-12 | O sistema deve manter `NO_COLOR` e a bandeira que desliga a cor com o efeito de hoje sobre a cor, preservando molduras e glifos | Must | Com a cor desligada, a saída para terminal não contém sequência de cor, e contém as molduras | 🟢 |
| RF-13 | O sistema deve abandonar as molduras, e só elas, quando a janela tiver menos de 60 colunas, mantendo cor, glifos e conteúdo | Must | A 59 colunas nenhuma linha estoura a largura e nenhum dos quatro fatos do núcleo some; a 80 colunas o alinhamento é íntegro e nenhuma palavra é cortada ao meio | 🟡 |
| RF-14 | O sistema deve trocar os glifos e os caracteres de moldura por equivalentes de sete bits quando o ambiente não declarar codificação capaz de representá-los | Should | Com a localidade em `C`, nenhum glifo e nenhum caractere de moldura desenhado pela ferramenta sai dos sete bits, e as distinções da RN-03 sobrevivem; a prosa, que é português acentuado, não é transliterada, por força da RN-01, e esse é o limite conhecido deste degrau | 🟢 |
| RF-15 | O sistema deve manter a saída de dados idêntica byte a byte, e manter no texto redirecionado as garantias da RN-06 | Must | As suítes da saída de dados e dos códigos de saída passam sem linha reescrita; nas da passada e do quadro, o que se reescreve é expectativa de disposição, declarada como tal, e nenhuma expectativa de fato, de ordem ou de ausência de sequência de escape | 🟢 |
| RF-20 | O sistema deve escolher entre a paleta de fundo escuro e a de fundo claro por esta precedência: bandeira de tema; variável de ambiente de tema; a variável `COLORFGBG`, quando o terminal a declara; e, na falta de tudo, fundo escuro. O sistema não pergunta ao terminal a cor do fundo | Must | Com a bandeira e a variável em desacordo, vale a bandeira; sem nenhuma das duas e com `COLORFGBG` indicando fundo claro, vale a paleta clara; nenhum byte é escrito no terminal antes do primeiro desenho para descobrir o fundo | 🟢 |
| RF-21 | O sistema deve recusar valor de tema que não reconhece: na bandeira, como uso incorreto, com mensagem que nomeia o valor; na variável de ambiente, ignorando-a, avisando uma vez no canal de erro e seguindo a precedência | Should | A bandeira inválida termina com o código de uso incorreto da 014, sem leitura pela metade; a variável inválida não impede a ferramenta de abrir | 🟢 |

### Conferência

| ID | Requisito | Prioridade | Critério de aceite | Confidência |
|----|-----------|------------|--------------------|-------------|
| RF-16 | O sistema deve manter as duas superfícies de acordo: o que o terminal afirma continua coincidindo com o que o painel afirma | Must | A suíte de paridade e a de fronteiras passam sem afrouxamento; a de paridade compara fatos, de modo que glifo, moldura, cor e a mudança de lugar dos fatos do cabeçalho não entram na comparação | 🟢 |
| RF-17 | O sistema deve oferecer um modo de conferir a aparência sem pessoa diante de cada terminal: quadros de amostra, um por degrau de cor e um por situação de entrada que chega à interface viva, produzidos a partir de estado fixo | Should | As amostras são reproduzíveis, e uma mudança de paleta aparece como diferença nelas; a raiz inexistente, que não tem quadro, não tem amostra | 🟡 |
| RF-22 | O sistema deve vigiar a RN-07 por busca nos fontes da ferramenta: nenhum fonte de `src/cli/` contém nome, frase ou marca do produto de referência | Must | A suíte de fronteiras ganha a busca e reprova quando um dos nomes vigiados aparece num fonte da ferramenta; a lista dos nomes vigiados é declarada num lugar só, na própria suíte | 🟢 |

Fora do escopo, e dito para que a ausência se leia como escolha: a disposição em colunas do Ranger;
teclas novas ou trocadas; o comando de contagem de anomalias, que é de terminal mas não é o painel;
seleção de tema persistida em arquivo; pergunta ao terminal pela cor do fundo; variantes de paleta para daltonismo, que a RN-03 torna dispensáveis para a leitura; animação; suporte a mouse.

## 6. Requisitos Não Funcionais

| Tipo | Requisito | Evidência ou justificativa | Confidência |
|------|-----------|----------------------------|-------------|
| Desempenho | O primeiro desenho continua abaixo de um segundo desde a invocação, e compor um quadro de 500 linhas, já com a ênfase por trecho, leva menos de 50 ms | NFR de desempenho da 014; o redesenho é integral por decisão registrada, e mais sequências por linha aumentam os bytes escritos a cada quadro | 🟡 |
| Acessibilidade | Todo par de primeiro plano e fundo usado para texto de leitura guarda contraste de ao menos 4,5 para 1 em cada paleta contra o fundo dela, preto ou branco; o acento, que só veste marca, ao menos 3 para 1, piso de elemento não textual; o papel de borda discreta, ao menos 2 para 1, por não ser texto | `_reversa_sdd/sdd/painel-do-processo.md#7-requisitos-nao-funcionais`, RNF-03, e `estudo-de-possibilidades.md`, seção 1.3. O destaque da paleta clara mede 4,60 sobre branco e é o texto mais justo da tabela, seguido do tom de atenção, com 4,71; o acento mede 3,15 sobre branco e por isso não veste texto | 🟢 |
| Acessibilidade | Nenhuma distinção depende só de matiz entre verde e vermelho | RN-03; a referência mantém tema próprio para daltonismo, sinal de que o problema é real nesse gênero de tela | 🟡 |
| Segurança | Nenhum texto lido do disco chega ao terminal com sequência de escape interpretável: o que vem do projeto observado é dado, e não comando de tela | Com mais sequências legítimas na saída, uma sequência vinda de um nome de arquivo ou de uma descrição de ação passaria despercebida | 🟡 |
| Portabilidade | Nenhuma dependência nova | RN-08 | 🟢 |
| Testabilidade | O quadro continua função pura do estado lido mais o estado de navegação, conferível por comparação de texto e sem terminal | NFR de testabilidade da 014 e RN-02 | 🟢 |
| Manutenibilidade | Trocar um tom é editar um lugar; acrescentar seção ao painel continua não exigindo decisão visual nova no terminal | RN-04 e NFR de manutenibilidade da 014 | 🟢 |

## 7. Critérios de Aceitação

```gherkin
Cenário: o cabeçalho em moldura, num terminal de 24 bits
  Dado um terminal de 100 colunas que declara cor de 24 bits
  Quando o Operador abre o painel sobre um projeto com Reversa instalado
  Então o cabeçalho aparece dentro de uma moldura de cantos arredondados
  E o nome da ferramenta está no destaque
  E o projeto, a raiz observada, o instante e a integridade da leitura estão dentro da moldura
  E a versão da extensão não está na moldura, e está na seção "Versões e construção", ao fim do quadro

Cenário: o bloqueio humano é o que o olho encontra primeiro
  Dado uma feature com todas as ações fechadas e sem adendo
  Quando o Retomador abre o painel
  Então o bloqueio aparece em moldura própria, antes de qualquer seção
  E a razão e o comando sugerido são os mesmos de antes desta feature

Cenário: o item selecionado sem cor
  Dado a variável NO_COLOR declarada
  Quando o Operador move a seleção para a terceira ação da decomposição
  Então só essa linha traz o glifo de seleção
  E a saída não contém sequência de cor
  E as molduras continuam desenhadas

Cenário: o dado secundário em linha própria
  Dado uma ação fechada com artefato e instante
  Quando a seção da decomposição está aberta
  Então a descrição da ação ocupa as primeiras linhas do item
  E o caminho e o instante vêm abaixo, recuados, atrás de um glifo de continuação

Cenário: a linha de estado não rola
  Dado um quadro de 300 linhas numa janela de 24
  Quando o Operador vai ao fim do quadro
  Então a última linha da janela continua sendo a linha de estado
  E ela declara que há conteúdo acima
  E a procedência da leitura corrente está nela, e não no cabeçalho

Cenário: terminal que não declara 24 bits
  Dado um terminal que declara 256 cores e nada diz sobre 24 bits
  Quando o painel é aberto
  Então o acento é desenhado no tom mais próximo das 256 cores
  E nenhuma sequência aparece impressa como texto

Cenário: janela estreita
  Dado uma janela de 59 colunas
  Quando o painel é desenhado
  Então nenhuma moldura é desenhada
  E nenhuma linha ultrapassa 59 colunas
  E os quatro fatos do núcleo continuam presentes

Cenário: a saída de dados não muda
  Dado o mesmo projeto e o mesmo instante de leitura
  Quando a saída de dados é gerada antes e depois desta feature
  Então os dois documentos são idênticos byte a byte

Cenário: o texto redirecionado guarda as garantias
  Dado a saída redirecionada para arquivo
  Quando a passada termina
  Então o arquivo não contém sequência de escape nem caractere de moldura
  E nenhuma linha passa de oitenta colunas
  E os fatos e a ordem deles são os de antes desta feature
  E o caminho e o instante de cada ação vêm em linha própria, como na interface viva

Cenário: a passada diante de terminal
  Dado a bandeira de passada e a saída num terminal com cor
  Quando a passada termina
  Então o texto, retiradas as sequências de cor, é idêntico ao da passada redirecionada
  E não há moldura nem linha de estado

Cenário: fundo claro declarado por variável de ambiente
  Dado a variável de tema declarando fundo claro
  Quando o painel é aberto
  Então os papéis de estado usam os tons da paleta clara
  E o acento é o mesmo da paleta escura
  E o texto em foco usa o destaque da paleta clara

Cenário: a bandeira vence a variável
  Dado a variável de tema declarando fundo claro e a bandeira de tema declarando fundo escuro
  Quando o painel é aberto
  Então vale a paleta escura

Cenário: nada declarado e o terminal informa o fundo
  Dado nenhuma bandeira e nenhuma variável de tema
  E a variável COLORFGBG indicando fundo claro
  Quando o painel é aberto
  Então vale a paleta clara
  E nada foi escrito no terminal para descobrir o fundo

Cenário: tema não reconhecido na bandeira
  Dado a bandeira de tema com um valor que a ferramenta não conhece
  Quando o comando é executado
  Então a mensagem nomeia o valor recusado
  E o processo termina com o código de uso incorreto, sem imprimir leitura

Cenário: texto hostil vindo do disco
  Dado uma ação cuja descrição contém uma sequência de escape que limparia a tela
  Quando a seção que a lista é desenhada
  Então a sequência aparece neutralizada, como texto visível
  E a tela não é limpa

Cenário: localidade sem Unicode
  Dado a localidade C declarada no ambiente
  Quando o painel é aberto
  Então molduras e glifos usam caracteres de sete bits
  E seção aberta, seção fechada e item selecionado continuam distinguíveis entre si
  E a prosa acentuada sai como está, sem transliteração

Cenário: glifos de seção e de ação
  Dado uma decomposição com ações fechadas, uma próxima e ações abertas
  Quando o Operador fecha a seção e a reabre
  Então o glifo do título muda ao fechar e volta ao reabrir
  E cada ação traz um de três glifos distintos, na cor do seu estado

Cenário: falha de leitura
  Dado uma raiz cuja leitura falha
  Quando o painel é aberto
  Então a situação aparece com título próprio, em moldura, na cor de falha
  E o processo termina com o mesmo código de saída de antes desta feature

Cenário: raiz inexistente
  Dado uma raiz que não existe e o canal de erro num terminal com cor
  Quando o comando é executado
  Então a situação aparece com título próprio, na cor de falha, sem moldura
  E o processo termina com o código de uso incorreto, sem desenhar quadro

Cenário: observação degradada na linha de estado
  Dado um ambiente em que a assinatura do disco não instala
  Quando o painel cai para releitura por intervalo
  Então a linha de estado assinala a degradação na cor de atenção
  E a razão continua legível por extenso na tela

Cenário: as duas superfícies continuam de acordo
  Dado a suíte de paridade e a suíte de fronteiras como estavam antes desta feature
  Quando a suíte inteira roda depois dela
  Então as duas passam sem que nenhuma expectativa tenha sido afrouxada

Cenário: amostras reproduzíveis
  Dado um estado fixo de leitura e de navegação
  Quando as amostras são geradas duas vezes
  Então os dois conjuntos são idênticos
  E existe uma amostra por degrau de cor e uma por situação de entrada que chega à interface viva

Cenário: a identidade do produto de referência não entra nos fontes
  Dado a lista de nomes vigiados declarada na suíte de fronteiras
  Quando a suíte roda sobre os fontes da ferramenta
  Então nenhum fonte contém um dos nomes vigiados
  E acrescentar um deles a um fonte faz a suíte reprovar
```

## 8. Prioridade MoSCoW

| Item | MoSCoW | Justificativa |
|------|--------|---------------|
| RF-01 a RF-05, RF-07 | Must | São a linguagem visual pedida; sem eles a entrega não é reconhecível como o que se pediu |
| RF-06 | Must | É a mudança de maior ganho de leitura: hoje descrição, caminho e instante disputam a mesma linha |
| RF-08 | Must | A linha de estado fixa é traço definidor da referência e resolve, de passagem, a descoberta das teclas em quadro longo |
| RF-11, RF-12, RF-13 | Must | O Operador remoto e os terminais embutidos não escolhem a própria capacidade de cor; sem degradação, a tela sai com cor trocada ou com sequência impressa como texto justamente onde não há como consertá-la |
| RF-15, RF-16 | Must | São o que impede uma feature de aparência de virar regressão de contrato ou de paridade |
| RF-22 | Must | A RN-07 era a única regra sem vigia, e a guarda custa uma busca na suíte de fronteiras |
| RF-18 | Must | Sem ela o núcleo do RF-02 faria fatos sumirem, e a RN-01 seria violada |
| RF-19 | Must | É o que torna verdadeira a disposição única da RN-06 |
| RF-20 | Must | A medição mostrou que a paleta escura é ilegível sobre fundo claro; sem escolha de paleta, a ferramenta falha num terminal claro |
| RF-21 | Should | Coerência com o tratamento de argumento da 014 |
| RF-09 | Should | Coerência; as telas de entrada são vistas raramente |
| RF-14 | Should | Ambiente sem Unicode é raro entre as personas, mas o Operador remoto não o escolhe |
| RF-17 | Should | Sem amostras, conferir a paleta depende de alguém abrir quatro terminais |
| RF-10 | Could | Informação que a tela já dá por extenso |
| NFR de segurança | Must | O risco cresce justamente com esta feature |
| NFR de contraste | Must | Com duas paletas, cada uma responde pelo fundo dela, e os tons de partida já foram medidos |

## 9. Esclarecimentos

### Sessão 2026-09-21

As respostas vieram depois de um estudo com medições, registrado em `estudo-de-possibilidades.md`,
cujas quatro recomendações o usuário aceitou por inteiro.

- **Q:** A passada diante de um terminal ganha a linguagem nova inteira, só a paleta, ou fica como está?
  **R:** Só a paleta, sobre o mesmo texto da passada redirecionada. Moldura e linha de estado pertencem
  à interface viva; a paleta pertence a qualquer terminal. Integrado no RF-19.
- **Q:** Como tratar terminal de fundo claro, se a RN-08 veda tema guardado em configuração?
  **R:** Duas paletas, com o fundo escuro como padrão, escolhidas por bandeira, variável de ambiente,
  `COLORFGBG` e padrão, nessa ordem. Sem pergunta ao terminal e sem variantes para daltonismo nesta
  feature. Integrado na RN-04, na RN-08, no RF-20 e no NFR de contraste.
- **Q:** O cabeçalho entra integral na moldura, ou só um núcleo?
  **R:** Núcleo de quatro fatos, projeto, raiz observada, instante e integridade, em moldura que rola
  com o corpo. O restante desce para uma seção ao fim do quadro ("Versões e construção", nome da segunda rodada), fora da ordem fixa das
  onze, e a procedência da leitura vai para a linha de estado. Integrado no RF-02, no RF-08 e no RF-18.
- **Q:** A saída redirecionada precisa mesmo ficar idêntica byte a byte, se isso obriga o desenho a
  manter duas disposições para sempre?
  **R:** Não. Identidade de bytes fica só para a saída de dados; o texto guarda garantias. Não se achou
  consumidor do texto da passada fora das suítes. Integrado na RN-06 e no RF-15, com a justificativa do
  RF-11 trocada no mesmo passo, porque o terminal de trabalho declara 24 bits.

Resolvido por analogia com a 014, sem pergunta, e marcado 🟡 por isso: o tratamento do valor de tema
não reconhecido, no RF-21. A segunda rodada confirmou-o, e ele passou a 🟢.

### Sessão 2026-09-21, segunda rodada

Rodada aberta pela auditoria cruzada (`audit/cross-check.md`), que remeteu a esta etapa os achados em
que o plano se afastou da letra deste documento. As perguntas estão em
`perguntas/visual-e-auditoria.html`, versão `2676fee272cd`, e a decisão, registrada em
`perguntas/respostas/respostas-visual-e-auditoria-2026-09-21.md`, veio na conversa, em bloco: as sete
pela opção recomendada.

- **Q:** O acento único nos dois fundos e o contraste de 4,5 para 1 não cabem juntos no fundo claro. Qual dos dois cede? (A001)
  **R:** Nenhum: confirmada a D-04 do plano. O acento único só veste marca, com piso de 3 para 1, e o
  texto em foco usa o papel de destaque, com tom próprio no fundo claro. Integrado na RN-04, no RF-01,
  no RF-02, no RF-04, no NFR de contraste e em dois cenários.
- **Q:** A raiz inexistente recebe moldura, como o RF-09 escrevia, ou só título na cor de falha? (A002, A007)
  **R:** Só título na cor de falha, sem moldura, porque ela termina antes de existir quadro. Integrado
  no RF-09 e no RF-17, com cenário próprio.
- **Q:** Com a localidade em `C`, o RF-14 promete sete bits só em glifos e molduras, ou na tela inteira? (A003)
  **R:** Só em glifos e molduras. A prosa acentuada não é transliterada, por força da RN-01, e o
  critério declara isso como limite conhecido. Integrado no RF-14, que passa a 🟢, e no cenário.
- **Q:** A RN-07 precisa de vigia? (A004)
  **R:** Sim, por busca nos fontes da ferramenta, na suíte de fronteiras. Integrado no RF-22, novo, com
  cenário e linha na tabela de prioridade.
- **Q:** Como se chama a última linha da janela: "linha de estado" ou "rodapé"? (A008)
  **R:** Linha de estado, em tudo: `Quadro.linhaDeEstado`, suíte `cli-linha-de-estado`, módulo
  `linha-de-estado.ts`. Integrado no RF-08, no resumo e na tabela de prioridade; os identificadores são
  assunto do plano e da decomposição.
- **Q:** "Procedência" nomeia a origem da leitura e também a seção nova. A seção troca de nome? (A009)
  **R:** Sim: "Versões e construção". Procedência fica só para a origem da leitura. Integrado no RF-18
  e no primeiro cenário.
- **Q:** Variável de ambiente de tema com valor não reconhecido: avisa e segue, segue calada, ou recusa?
  **R:** Avisa uma vez no canal de erro e segue a precedência, como estava. Integrado no RF-21, que
  passa a 🟢.

## 10. Lacunas

Nenhuma lacuna aberta. As três dúvidas da versão inicial foram resolvidas na sessão de 2026-09-21, e a
medição dos tons da referência, que a versão inicial adiava para o plano, está em
`estudo-de-possibilidades.md`, seção 1.2. A segunda rodada do mesmo dia resolveu os achados A001 a
A004 e A007 a A009 da auditoria cruzada.

Ficam fora deste documento, por serem de cobertura do plano e da decomposição, os achados A005, A006
e A010 a A015. O `roadmap.md` e o `actions.md` foram escritos antes desta rodada, e precisam segui-la:
a D-04 deixa de ser premissa, a D-22 passa a ter respaldo no RF-09, o RF-22 pede decisão e ação, e os
identificadores de "rodapé" e da seção de "procedência" trocam de nome.

## 11. Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-09-21 | Versão inicial gerada por `/reversa-requirements` | reversa |
| 2026-09-21 | Correção de fato na primeira lacuna: a passada diante de terminal não recebe cor hoje | reversa |
| 2026-09-21 | Sessão de esclarecimento: três dúvidas resolvidas e a RN-06 delimitada; RF-18 a RF-21 acrescentados; RN-04, RN-08, RF-01, RF-02, RF-08, RF-11, RF-13, RF-15 e RF-16 reescritos | reversa |
| 2026-09-21 | Segunda rodada de esclarecimento, aberta pela auditoria cruzada (A001 a A004, A007 a A009): RN-04, RF-01, RF-02, RF-04, RF-08, RF-09, RF-14, RF-17, RF-18, RF-21 e o NFR de contraste reescritos; RF-22 acrescentado; três cenários novos e quatro ajustados. Origem: `perguntas/respostas/respostas-visual-e-auditoria-2026-09-21.md` | reversa |

## Pendências de Qualidade

- **Q-018, nome de produto no documento.** O requirements nomeia o Claude Code e o Ranger. A
  reprovação é consciente: a referência visual é o próprio objeto do pedido, e descrevê-la sem nome
  tornaria o documento menos verificável, e não mais. Os requisitos funcionais, em compensação,
  descrevem os traços em termos neutros, de modo que nenhum critério de aceite depende de consultar
  o produto de referência.
- **Q-019 e Q-020, princípios.** Não se aplicam: `.reversa/principles.md` não existe neste projeto.
