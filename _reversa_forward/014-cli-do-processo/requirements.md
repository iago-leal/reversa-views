# Requirements: painel do processo na linha de comando

> Identificador: `014-cli-do-processo`
> Data: `2026-09-20`
> Pasta da extração reversa: `_reversa_sdd/`
> Confidência: 🟢 CONFIRMADO, 🟡 INFERIDO, 🔴 LACUNA / DÚVIDA

## 1. Resumo executivo

A feature entrega um segundo consumidor da mesma leitura que a extensão já faz: uma interface viva
de terminal que desenha o processo do Reversa em texto, navegável pelo teclado, sem editor de
permeio. O problema que resolve é de acesso, e não de conhecimento: o estado já está calculado e
testado desde a feature 001, mas só se lê abrindo a barra lateral do editor, o que exclui a sessão
remota de terminal, a máquina sem janela gráfica e, sobretudo, o Operador que já está no terminal
conduzindo os agentes e precisa trocar de janela para confirmar que o estágio avançou. Quando a
saída não é um terminal, a mesma ferramenta imprime uma vez e termina, para servir a script. A
entrega é superfície nova sobre julgamento existente, e nenhuma regra do Reversa nasce nela.

## 2. Contexto a partir do legado

| Fonte | Trecho relevante | Confidência |
|-------|------------------|-------------|
| `_reversa_sdd/prd.md#4-escopo-in` | O produto é definido como leitura dos arquivos que o framework deixa no disco, com releitura sob demanda e estado vazio informativo. Nada nesse escopo é próprio do editor, exceto a superfície | 🟢 |
| `_reversa_sdd/prd.md#5-nao-objetivos-out` | Declara fora de escopo o suporte a outros editores, a publicação no Marketplace e todo tráfego de rede. O primeiro item fala de editores, não de terminal, e a distinção é o que abre espaço para esta feature | 🟢 |
| `_reversa_sdd/prd.md#6-restricoes` | O invariante duro do produto: a extensão nunca escreve arquivo, em camada alguma. A camada de leitura é read-only por construção, com `node:fs` num só módulo | 🟢 |
| `_reversa_sdd/prd.md#10-evolucao-prevista` | A doutrina de camadas: leitura e despacho ficam apartados, e nenhum dos dois alcança a capacidade do outro. É o que rege a abertura do editor desta feature | 🟢 |
| `_reversa_sdd/prd.md#pendencias-de-cobertura` | A observação automática do disco foi adiada para depois do uso real, com instrução de reabrir se a releitura manual incomodar. Esta feature a reabre | 🟢 |
| `_reversa_sdd/sdd/leitura-do-processo.md#4-non-goals` | NG-03 declara que a camada de leitura entrega o processo inteiro e não decide o que a tela mostra. A seleção pertence a quem desenha, o que torna um segundo desenhista previsto pelo modelo | 🟢 |
| `_reversa_sdd/sdd/leitura-do-processo.md#8-design-e-interface` | O componente não tem interface visual: expõe uma leitura de disco, um julgamento e os tipos que os dois trocam. Uma chamada, um resultado, sem estado entre chamadas | 🟢 |
| `_reversa_sdd/sdd/painel-do-processo.md#6-requisitos-funcionais` | RF-13 exige que toda decisão de apresentação viva em função pura fora dos componentes visuais, e RF-14 fixa a ordem das seções. São exatamente as peças que o terminal reaproveita | 🟢 |
| `_reversa_sdd/addenda/005-empacotamento-e-verificacao.md#resumo-da-entrega` | O preview já é um consumidor da leitura fora do editor, em Node puro, chamando `readWorkspace` e `sessionMessages` da saída compilada, e resolveu servidor e documento sem dependência alguma | 🟢 |
| `_reversa_sdd/addenda/006-cartoes-e-cronologia.md`, `008`, `009`, `010` | O painel cresceu de seis eixos para onze cartões, incluindo registro de bugs, panorama do produto e histórico das pastas. O que o terminal deve mostrar não é mais o que o PRD enumerou | 🟢 |
| `_reversa_sdd/addenda/007-atualizacao-e-progresso.md#vigencia` | A única exceção de rede do produto: consulta anônima e de leitura à origem deste repositório, com endereço fixado em tempo de compilação e sete desfechos nomeados | 🟢 |
| `_reversa_sdd/addenda/011-estado-terminal-e-checkpoints.md#vigencia`, `012`, `013` | As correções de leitura mais recentes vivem em `src/domain/`, fora de `src/heranca/`, e a composição de texto determinística já existe em duas frentes, o resumo e o prompt | 🟢 |
| `src/host/reading.ts`, `src/host/session.ts`, `src/host/net.ts` | `readWorkspace` recebe a raiz e devolve o resultado tipado sem nunca lançar; `net.ts` é declaradamente o único módulo que abre conexão. Nenhum dos três importa o editor | 🟢 |
| `tests/host-boundaries.spec.ts`, `tests/webview-boundaries.spec.ts` | As fronteiras são verificadas lendo os próprios fontes: o host não pode conter caminho do Reversa nem cálculo de estágio, e os rótulos legíveis vivem do lado da tela | 🟢 |

## 3. Personas e cenários de uso

| Persona | Objetivo | Cenário-chave |
|---------|----------|---------------|
| O Operador (primária aqui) 🟢 | Confirmar que o estágio avançou sem sair do terminal em que roda os agentes | Deixa a interface aberta numa divisão da janela enquanto o agente trabalha, e vê a contagem de ações mudar |
| O Retomador 🟢 | Saber onde o projeto parou e o que aguarda decisão dele | Abre o repositório depois de semanas, roda o comando antes de abrir editor algum, navega até o artefato apontado e o abre dali mesmo |
| O Operador remoto 🟡 | Ler o processo de um projeto que vive numa máquina sem janela gráfica | Conectado a outra máquina por terminal, obtém o mesmo diagnóstico que o painel daria |
| O script 🟡 | Consumir o estado sem pessoa alguma diante da tela | Um comando encadeado lê a saída de dados, sem que a interface viva chegue a existir |

A inversão de prioridade em relação ao PRD é deliberada e vale registrar: o painel foi ordenado
pelo Retomador, e o terminal serve primeiro a quem já está nele. A ordem das seções, ainda assim,
permanece a do painel, pela razão da RN-04.

## 4. Regras de negócio novas ou alteradas

1. **RN-01:** A ferramenta é consumidora, e nunca coautora, do julgamento. Nenhuma regra de
   derivação de fase, estágio, contagem de ações ou anomalia nasce no código dela: tudo vem de
   `readWorkspace` e das funções puras de apresentação que o painel já usa. 🟢
   - Origem no legado: `_reversa_sdd/sdd/leitura-do-processo.md#4-non-goals`, NG-03
   - Tipo: nova
2. **RN-02:** A ferramenta não escreve. Não abre arquivo para escrever, não cria, não remove e não
   renomeia, em camada alguma, e isso é verificável lendo os fontes. 🟢
   - Origem no legado: `_reversa_sdd/prd.md#6-restricoes`
   - Tipo: nova, por herança de invariante existente
3. **RN-03:** A ferramenta executa um processo, e um só: o editor que o ambiente declara, quando o
   usuário pede, para abrir o artefato selecionado. Essa capacidade vive em módulo apartado, que
   não alcança a camada de leitura e não recebe dela caminho algum que não tenha vindo da própria
   leitura. Quem escreve o arquivo é o editor, sob o comando de quem o abriu, como quem escreve os
   artefatos do Reversa continua sendo o Reversa. 🟢
   - Origem no legado: `_reversa_sdd/prd.md#10-evolucao-prevista`, a doutrina de camadas apartadas
   - Tipo: alterada. É o ponto em que esta feature toca o invariante mais duro do produto. Dentro
     do editor, abrir arquivo é chamada de interface do editor; no terminal, é criação de processo,
     capacidade que a spec da camada de leitura proíbe no NG-01 e no RNF-04. A proibição continua
     valendo onde foi escrita, para a camada de leitura, e a capacidade nova nasce fora dela
4. **RN-04:** A ordem das seções é a mesma do painel e não depende do processo lido. Duas
   superfícies que ordenam diferente obrigam a aprender duas vezes o mesmo produto. 🟢
   - Origem no legado: `_reversa_sdd/sdd/painel-do-processo.md#6-requisitos-funcionais`, RF-14
   - Tipo: nova
5. **RN-05:** Nenhum estado sobrevive entre execuções. Dentro da sessão viva a preferência de
   seção aberta ou fechada existe em memória; ao sair, ela morre, e a sessão seguinte abre no
   padrão. Guardar exigiria escrever, o que a RN-02 proíbe, e isso é comportamento declarado, não
   limitação acidental. 🟢
   - Origem no legado: `_reversa_sdd/sdd/painel-do-processo.md#6-requisitos-funcionais`, RF-12, que
     no painel guarda a preferência no estado da webview
   - Tipo: alterada
6. **RN-06:** A saída declara sempre a raiz observada e o instante da leitura, como o cabeçalho do
   painel faz, para que um texto colado em outro lugar não perca a procedência. 🟢
   - Origem no legado: `_reversa_sdd/sdd/painel-do-processo.md#6-requisitos-funcionais`, RF-02
   - Tipo: nova
7. **RN-07:** O teclado é o caminho completo. Toda ação da interface viva se alcança por tecla, e
   nenhuma depende de recurso que o terminal possa não ter. 🟢
   - Tipo: nova
8. **RN-08:** O terminal é devolvido como foi encontrado. Modo do teclado, cursor e tela alternativa
   voltam ao estado original em toda saída, inclusive na falha, na interrupção pelo usuário e na
   suspensão para abrir o editor. Interface viva que deixa terminal quebrado é pior que nenhuma. 🟢
   - Tipo: nova
9. **RN-09:** A observação do disco não muda a tela sem dizer. Quando a releitura ocorre por
   conta própria, a interface declara que o que está na tela mudou sozinho e quando, para que o
   usuário nunca leia um número acreditando ser o que ele tinha visto antes. 🟢
   - Origem no legado: `_reversa_sdd/prd.md#pendencias-de-cobertura`, pendência 1, ora reaberta
   - Tipo: alterada
10. **RN-10:** A única conexão continua sendo a que já existe. A consulta à origem é feita pelo
    mesmo módulo que hoje a faz, e nenhum módulo novo abre conexão, de modo que a fronteira siga
    verificável por leitura dos fontes. 🟢
    - Origem no legado: `_reversa_sdd/addenda/007-atualizacao-e-progresso.md`
    - Tipo: nova

## 5. Requisitos Funcionais

### 5.1 Leitura e fidelidade

| ID | Requisito | Prioridade | Critério de aceite | Confidência |
|----|-----------|------------|--------------------|-------------|
| RF-01 | O sistema deve obter o processo pela mesma camada de leitura que sustenta o painel, sem reimplementar regra alguma do Reversa | Must | Uma busca pelos fontes da ferramenta não encontra caminho literal de arquivo do Reversa, nome de estágio derivado nem cálculo de fase, no molde de `tests/host-boundaries.spec.ts` | 🟢 |
| RF-02 | O sistema deve derivar rótulo, razão de bloqueio, recorte e ordem das mesmas funções puras que o painel usa, e não de cópias delas | Must | A suíte de fronteiras declara a permissão de importar essas funções fora da tela, e uma suíte de paridade mostra que os fatos afirmados pelas duas superfícies coincidem | 🟢 |
| RF-03 | O sistema deve resolver a raiz a observar a partir de um argumento explícito e, na ausência dele, do diretório corrente, declarando qual raiz usou | Must | Executar de dentro de um subdiretório do projeto produz a mesma leitura que executar da raiz | 🟢 |
| RF-04 | O sistema deve nomear cada situação de entrada nos dois modos: raiz inexistente, Reversa não instalado, leitura íntegra e falha de leitura | Must | Nenhuma das quatro produz tela vazia, e cada uma tem título próprio | 🟢 |
| RF-05 | O sistema deve apresentar o bloqueio humano antes de qualquer outra seção, nomeando cada razão e o comando sugerido | Must | Uma feature com todas as ações fechadas e sem adendo produz o bloco com a razão nomeada | 🟢 |
| RF-06 | O sistema deve apresentar as seções na ordem que o painel fixa, sem que ela varie com o conteúdo lido | Must | Duas leituras de processos diferentes produzem a mesma sequência de títulos | 🟢 |
| RF-07 | O sistema deve declarar quando a leitura degradou, com a contagem sempre visível e a lista de anomalias alcançável | Must | Um workspace adoecido por `scripts/estragar-workspace.js` mostra o aviso e permite chegar a arquivo, código e detalhe de cada anomalia | 🟢 |
| RF-08 | O sistema deve expor o relatório da sonda, com as pastas lidas, os caminhos recusados e os arquivos truncados | Must | Uma recusa aparece com o caminho e o motivo | 🟢 |

### 5.2 Interface viva

| ID | Requisito | Prioridade | Critério de aceite | Confidência |
|----|-----------|------------|--------------------|-------------|
| RF-09 | O sistema deve permitir mover a seleção entre os itens apresentados usando o teclado, com o item sob o cursor distinguível sem depender de cor | Must | Num terminal sem cor, o item selecionado continua identificável | 🟢 |
| RF-10 | O sistema deve permitir abrir e fechar cada seção pelo teclado, e oferecer o gesto que abre ou fecha todas | Must | Fechar uma seção reduz o que ocupa a tela, e reabri-la devolve o conteúdo na mesma posição | 🟢 |
| RF-11 | O sistema deve abrir, ao receber a tecla de confirmação sobre um artefato, o editor que o ambiente declara, suspendendo a interface enquanto ele estiver aberto e retomando-a ao fechar | Must | Com editor declarado no ambiente, o arquivo abre nele; sem nenhum declarado, a interface diz qual variável definir, em vez de falhar em silêncio | 🟢 |
| RF-12 | O sistema deve manter visível a lista das teclas disponíveis, ou o gesto que a revela | Must | Um usuário que nunca viu a ferramenta sai dela sem consultar documentação | 🟡 |
| RF-13 | O sistema deve reler sob demanda por tecla, e também por conta própria quando o disco mudar, declarando na tela que a última mudança veio da observação e quando ocorreu | Must | Um agente fechando uma ação faz a contagem mudar sem intervenção, e a tela diz que mudou sozinha | 🟢 |
| RF-14 | O sistema deve redesenhar ao redimensionamento da janela, preservando a seleção e o estado das seções | Must | Estreitar a janela não perde o cursor nem reabre seção fechada | 🟡 |
| RF-15 | O sistema deve restaurar o terminal ao estado anterior em toda saída, incluindo falha não prevista, interrupção pelo usuário e suspensão para o editor | Must | Depois de interromper a ferramenta, o terminal ecoa o que se digita e mostra o cursor, sem precisar de comando de conserto | 🟢 |
| RF-16 | O sistema deve sair por tecla declarada, com código de saída zero | Must | A tecla de saída encerra sem mensagem de erro | 🟢 |

### 5.3 Modo de uma passada

| ID | Requisito | Prioridade | Critério de aceite | Confidência |
|----|-----------|------------|--------------------|-------------|
| RF-17 | O sistema deve imprimir uma vez e terminar quando a saída não for um terminal, ou quando a bandeira correspondente for passada, sem nunca tentar tomar o controle da tela | Must | Redirecionar a saída para arquivo produz texto completo e o processo termina sozinho | 🟢 |
| RF-18 | O sistema deve, nesse modo, imprimir o caminho relativo à raiz de cada artefato apontado, já no formato que se cola num editor | Must | O artefato da feature ativa aparece como caminho relativo, sem prefixo absoluto | 🟢 |
| RF-19 | O sistema deve degradar a formatação conforme o destino: sem cor quando `NO_COLOR` está declarado ou a saída não é terminal, e sem quebrar alinhamento em oitenta colunas | Must | O arquivo redirecionado não contém sequência de escape, e a janela estreita não corta palavra ao meio | 🟢 |
| RF-20 | O sistema deve terminar com código zero quando a leitura ocorreu, e diferente de zero quando a raiz não existe ou a leitura falhou | Must | Encadear o comando com `&&` funciona no caso bom e interrompe no ruim | 🟢 |
| RF-21 | O sistema deve oferecer uma saída legível por máquina, com a mesma carga que a ponte envia à tela | Should | A saída é um documento JSON válido, sem nenhuma linha de apresentação misturada | 🟡 |

### 5.4 Procedência, rede e uso

| ID | Requisito | Prioridade | Critério de aceite | Confidência |
|----|-----------|------------|--------------------|-------------|
| RF-22 | O sistema deve apresentar o carimbo da construção e a revisão do modelo herdado, como o cabeçalho do painel faz | Should | Os dois valores aparecem, e coincidem com os do painel na mesma árvore | 🟢 |
| RF-23 | O sistema deve consultar a origem por padrão, para dizer se a instalação ficou atrás, e permitir desligar a consulta por bandeira e por variável de ambiente | Must | Com a consulta desligada, nenhuma conexão é aberta, e a tela declara que está desligada em vez de silenciar | 🟢 |
| RF-24 | O sistema deve fazer essa consulta pelo mesmo módulo que hoje a faz, apresentando os mesmos desfechos nomeados, inclusive o de tempo esgotado | Must | Nenhum módulo novo importa cliente de requisição, e a fronteira continua verificável por busca nos fontes | 🟢 |
| RF-25 | O sistema deve descrever o próprio uso quando pedido, e recusar com mensagem nomeada um argumento que não reconhece | Should | Um argumento inválido nomeia o argumento e termina com código diferente de zero, sem imprimir leitura pela metade | 🟢 |
| RF-26 | O sistema não deve acrescentar dependência de tempo de execução, resolvendo controle de terminal, teclado e desenho com o que o interpretador já oferece | Must | O manifesto do projeto não ganha dependência nova, e a ferramenta roda numa cópia recém-clonada sem instalação adicional | 🟢 |

## 6. Requisitos Não Funcionais

| Tipo | Requisito | Evidência ou justificativa | Confidência |
|------|-----------|----------------------------|-------------|
| Desempenho | A leitura completa permanece abaixo de 200 ms, e o primeiro desenho da interface abaixo de um segundo desde a invocação | `_reversa_sdd/sdd/leitura-do-processo.md#7-requisitos-nao-funcionais`, RNF-01, já vigiado por `tests/desempenho-referencia.spec.ts` | 🟢 |
| Desempenho | A releitura disparada pela observação não pode redesenhar a cada escrita de um agente ativo; mudanças próximas no tempo se agrupam numa releitura só | O ciclo de codificação escreve muitas vezes em sequência, e uma tela que pisca a cada escrita é ilegível | 🟡 |
| Segurança | Nenhuma função capaz de escrever, criar, remover ou renomear é alcançável, e a única criação de processo é a do editor, isolada em módulo declarado | `_reversa_sdd/prd.md#6-restricoes` e a RN-03 | 🟢 |
| Segurança | O caminho entregue ao editor provém sempre da leitura, nunca de texto digitado pelo usuário, e é resolvido sob a raiz observada | `_reversa_sdd/sdd/leitura-do-processo.md#12-seguranca-e-privacidade`, que já recusa ponteiro que escape da raiz | 🟢 |
| Privacidade | A consulta à origem permanece anônima e de leitura, com endereço fixado em tempo de compilação, e nada do que foi lido no disco a acompanha | `_reversa_sdd/addenda/007-atualizacao-e-progresso.md` | 🟢 |
| Concorrência | A leitura de um arquivo sendo escrito por um agente é tratada como degradação nomeada, e nunca como falha da ferramenta | `_reversa_sdd/sdd/leitura-do-processo.md#11-edge-cases-e-tratamento-de-erros`, EC-01 e EC-04 | 🟢 |
| Portabilidade | Nenhuma dependência nova; a ferramenta roda com o interpretador que o repositório já exige | A doutrina declarada em `scripts/preview.js`: dependência é dívida futura em projeto de atenção intermitente | 🟢 |
| Observabilidade | Falha vai para o canal de erro e leitura para o canal padrão, de modo que redirecionar um não contamine o outro | Consequência do RF-17 e do RF-20 | 🟢 |
| Testabilidade | O desenho de cada quadro é função pura do estado lido mais o estado de navegação, testável sem terminal; o que sobra de fato interativo é conferido por portão visual, como a tela já é | `_reversa_sdd/sdd/painel-do-processo.md#6-requisitos-funcionais`, RF-13, e o portão visual da feature 005 | 🟢 |
| Manutenibilidade | Acrescentar seção ao painel não deve exigir reescrever a mesma decisão no terminal | `_reversa_sdd/sdd/painel-do-processo.md#6-requisitos-funcionais`, RF-13 | 🟢 |

## 7. Critérios de Aceitação

```gherkin
Cenário: o Operador confere o avanço sem trocar de janela
  Dado um repositório com Reversa instalado e uma feature ativa em codificação
  Quando o Operador abre a interface na mesma janela em que conduz os agentes
  Então ela nomeia a feature ativa, o estágio em linguagem legível e a contagem de ações
    fechadas, abertas e emendas, na mesma ordem em que o painel as mostra

Cenário: o bloqueio humano vem antes de tudo
  Dado um projeto cuja feature tem todas as ações fechadas e nenhum adendo vigente
  Quando a interface é aberta
  Então a primeira seção é a do bloqueio, nomeando a convergência que falta e o comando sugerido

Cenário: navegação e abertura pelo teclado
  Dada a interface aberta sobre um projeto com feature ativa
  Quando o usuário move a seleção até o artefato e confirma
  Então a interface se suspende, o editor declarado no ambiente abre aquele arquivo, e ao fechá-lo
    a interface volta com a mesma seleção e as mesmas seções abertas

Cenário: nenhum editor declarado no ambiente
  Dado um ambiente sem editor declarado
  Quando o usuário confirma sobre um artefato
  Então a interface informa qual variável definir e segue viva, em vez de falhar em silêncio

Cenário: a tela muda sozinha e diz que mudou
  Dada a interface aberta e um agente do Reversa fechando ações no disco
  Quando a escrita ocorre
  Então a contagem se atualiza sem intervenção, e a interface declara que a mudança veio da
    observação e em que instante

Cenário: escrita em rajada
  Dado um agente que grava muitas vezes em poucos segundos
  Quando a observação percebe as mudanças
  Então elas se agrupam numa releitura só, e a tela não pisca a cada escrita

Cenário: o terminal é devolvido inteiro
  Dada a interface viva em execução
  Quando o usuário a interrompe pelo teclado
  Então o terminal volta a ecoar o que se digita, com o cursor visível, sem comando de conserto

Cenário: saída redirecionada escolhe o outro modo
  Dado um terminal em que a saída é redirecionada para arquivo
  Quando a ferramenta é executada
  Então ela imprime uma vez, termina sozinha, e o arquivo não contém nenhuma sequência de escape

Cenário: paridade com a tela
  Dada uma mesma carga de leitura
  Quando a tela é montada e o quadro do terminal é desenhado
  Então os fatos que as duas superfícies afirmam são idênticos, e a diferença está só na forma

Cenário: leitura degradada
  Dado um workspace cujo arquivo de estado foi corrompido
  Quando a ferramenta é executada
  Então ela declara que a leitura degradou, informa quantas anomalias encontrou, permite chegar à
    lista com arquivo, código e detalhe, e não finge integridade

Cenário: leitura durante a escrita de um agente
  Dado um agente gravando um artefato no mesmo instante da leitura
  Quando o arquivo é lido pela metade
  Então a degradação vira anomalia nomeada e o que foi lido é apresentado, sem lançar erro

Cenário: raiz sem Reversa instalado
  Dado um diretório em que o Reversa nunca foi instalado
  Quando a ferramenta é executada ali
  Então ela explica que não há instalação e como criá-la, em vez de imprimir erro ou nada

Cenário: raiz inexistente
  Dado um caminho de raiz que não existe no disco
  Quando a ferramenta é executada apontando para ele
  Então a mensagem nomeia o caminho recusado, vai para o canal de erro, e o código de saída é
    diferente de zero

Cenário: consulta à origem desligada
  Dada a bandeira que desliga a conferência de atualização
  Quando a ferramenta é executada
  Então nenhuma conexão é aberta, e a interface declara que a conferência está desligada

Cenário: a origem não responde
  Dada uma máquina sem acesso à rede
  Quando a conferência de atualização é tentada
  Então o desfecho aparece nomeado, a leitura do disco permanece inteira na tela, e nada trava
    além do tempo limite já declarado

Cenário: argumento que a ferramenta não reconhece
  Dado um argumento inexistente
  Quando ela é executada
  Então a mensagem nomeia o argumento recusado, nada de leitura é impresso, e o código de saída é
    diferente de zero

Cenário: a ferramenta não escreve
  Dado o código completo da ferramenta
  Quando ele é auditado
  Então nenhuma abertura de arquivo para escrita é encontrada, e a única criação de processo é a
    do editor, num módulo que não alcança a camada de leitura
```

## 8. Prioridade MoSCoW

| Item | MoSCoW | Justificativa |
|------|--------|---------------|
| RF-01, RF-02 | Must | São o que impede a segunda superfície de virar uma segunda verdade, que é o risco de maior impacto do produto inteiro |
| RF-03 a RF-08 | Must | Sem eles a ferramenta não responde as perguntas que justificam existir, e o diagnóstico entrou na primeira versão do painel pela mesma razão |
| RF-09, RF-10, RF-11, RF-16 | Must | São a interface viva pedida; sem elas a entrega vira outra coisa |
| RF-15 | Must | Terminal quebrado é dano ao ambiente do usuário, e não defeito de tela |
| RF-13 | Must | A releitura por conta própria é o que distingue esta superfície do painel, e foi decidida sabendo que reabre uma pendência do PRD |
| RF-12, RF-14 | Should | Descoberta das teclas e redimensionamento; a ausência atrapalha sem impedir |
| RF-17 a RF-20 | Must | Definem o comportamento quando não há pessoa diante da tela, que é metade do uso previsto |
| RF-21 | Should | Abre uso que ninguém pediu ainda; entra se o custo for o de serializar o que já existe |
| RF-22, RF-25 | Should | Procedência e descoberta do próprio uso |
| RF-23, RF-24 | Must | A conferência foi pedida com paridade plena, e a fronteira da conexão é o que mantém a privacidade verificável |
| RF-26 | Must | A doutrina de zero dependência é o que permite clonar e rodar depois de meses de pausa |
| RNF de segurança | Must | É o invariante do produto, e não uma qualidade desejável dele |
| RNF de testabilidade | Must | A interface viva é a primeira coisa deste repositório que suíte pura não alcança sozinha |

## 9. Esclarecimentos

### Sessão 2026-09-20

- **Q:** A ferramenta imprime uma vez e termina, ou é uma interface que fica viva no terminal, com
  releitura e seções que abrem e fecham?
  **R:** Interface viva, com releitura. Os dois modos convivem: viva por padrão, e uma passada
  quando a saída não for terminal ou quando a bandeira for passada, para que o uso em script
  sobreviva. Integrado na seção 5.2 e 5.3, e na RN-05.
- **Q:** O terminal mostra os onze cartões do painel, ou um recorte na saída curta com o resto sob
  bandeira?
  **R:** Interface viva e navegável: tudo está presente, e a economia de tela vem de abrir e fechar
  seção pelo teclado, com seleção movida por tecla e confirmação que abre o artefato. Não há
  recorte por bandeira. Integrado nos RF-09 e RF-10, e a antiga regra que convertia cartão em
  bandeira foi retirada.
- **Q:** O comando faz a consulta de atualização da feature 007, que é a única exceção de rede do
  produto e depende de uma chave de configuração que não existe fora do editor?
  **R:** Consulta sempre, com bandeira para desligar. Integrado nos RF-23 e RF-24, com a variável
  de ambiente acrescentada como segundo controle, já que não há painel de configuração no terminal.
- **Q:** Onde vive a decisão de apresentação que as duas superfícies compartilham?
  **R:** A interface de terminal importa direto as funções puras que a tela já usa, e a suíte de
  fronteiras passa a declarar essa permissão. Nenhuma regra é duplicada. Integrado no RF-02.
- **Q:** A interface viva pode trazer dependência nova?
  **R:** Nenhuma. Controle de terminal, teclado e desenho se resolvem à mão, como o preview
  resolveu servidor e documento. Integrado no RF-26 e no não funcional de portabilidade.
- **Q:** O que a confirmação faz com o artefato selecionado?
  **R:** Abre no editor declarado no ambiente, suspendendo a interface e retomando-a ao fechar. Foi
  o que obrigou a RN-03, porque no terminal isso é criação de processo, capacidade que a camada de
  leitura proíbe e que passa a viver fora dela. Integrado no RF-11 e no RF-15.
- **Q:** A releitura é só por tecla, ou a interface também observa o disco?
  **R:** Tecla e observação do disco. A decisão reabre a pendência 1 do PRD, que adiara a observação
  automática, e traz consigo a exigência de agrupar rajadas de escrita e de declarar na tela que a
  mudança veio sozinha. Integrado no RF-13, na RN-09 e no não funcional de desempenho.
- **Q:** A seleção precisa de mouse?
  **R:** Não. Teclado basta, com confirmação sobre o item selecionado. Integrado na RN-07, que faz
  do teclado o caminho completo.

## 10. Lacunas

Nenhuma dúvida pendente. As premissas abaixo foram assumidas por terem resposta no que já existe, e
seguem reabríveis:

- A distribuição segue o precedente das ferramentas de terminal da feature 005 e da 012: um comando
  declarado no manifesto de scripts do repositório, executado com o interpretador que já é exigência
  de construção, sem publicação, sem binário global e sem dependência nova.
- A ferramenta vive fora da extensão instalada e fora da construção do pacote, como o auxiliar de
  prompt vive, de modo que nada do que ela faça possa entrar no pacote que o usuário instala.
- As teclas exatas de cada gesto são decisão de desenho, a tomar no `/reversa-plan` junto com o
  traçado de cada quadro.

## 11. Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-09-20 | Versão inicial gerada por `/reversa-requirements` | reversa |
| 2026-09-20 | Oito respostas integradas por `/reversa-clarify`: interface viva com dois modos, navegação e abertura pelo teclado, observação do disco, consulta à origem por padrão, apresentação compartilhada com a tela e nenhuma dependência nova | reversa |
