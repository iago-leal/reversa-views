# Investigation: painel do processo

> Identificador: `003-painel-do-processo`
> Data: `2026-09-09`
> Roadmap: `_reversa_forward/003-painel-do-processo/roadmap.md`

## 1. O que foi investigado

Quatro perguntas guiaram a leitura de fontes antes das decisões do roadmap. Como verificar uma tela
sem tela, quanto custa o sistema de design que a spec pediu, como o kit de origem separa as duas
unidades de compilação, e o que o modelo herdado realmente oferece para os seis eixos que o painel
desenha.

A segunda pergunta foi reaberta depois do cross-check e respondida por medição, e é ela que mudou de
conclusão entre a primeira versão deste documento e esta.

## 2. Verificação sem interface gráfica

O ambiente de trabalho é um contêiner sem interface, e foi ele que travou a ação T031 da feature
anterior: o executável do editor disponível ali é o cliente remoto, que não aceita a opção de carregar
extensão em desenvolvimento. O esclarecimento de 2026-09-09 tirou a verificação visual do caminho
crítico desta feature, o que deixou em aberto como provar que a tela está certa.

Três caminhos foram avaliados.

| Caminho | O que prova | Custo | Veredito |
|---|---|---|---|
| Simulador de documento no executor de testes | Interação, foco, evento de clique | Uma dependência grande, e um ambiente que não é o Chromium do editor | Descartado: paga caro por fidelidade que não tem |
| Renderização em servidor pela própria biblioteca de interface | Ordem, texto, presença, estado inicial, isolamento de falha | Nenhuma dependência além da que a interface já traz | Escolhido |
| Somente testar as funções puras | As decisões, e nada da composição | Zero | Insuficiente: a ordem das seções é requisito, e ela vive na composição |

A renderização em servidor não prova estilo, foco nem clique. Isso é limitação declarada, e é
exatamente o que a feature 005 cobre com o preview e a captura dos sete estados. O que ela prova é o
que os cenários de aceitação pedem em palavras: que a ordem das seções corresponde à declarada, que a
faixa aparece quando há razão, que o valor desconhecido aparece bruto em vez de quebrar, e que uma
seção defeituosa não apaga as outras.

Dois cenários escapam mesmo assim, a troca de tema e o painel abaixo de 300 px, porque nenhum dos
dois é marcação. A decisão D-23 os divide: a função de mapeamento de tema e a folha de estilo são
verificáveis aqui, e a confirmação visual fica com o preview.

## 3. Custo do sistema de design externo, medido

A spec do componente lista os tokens do sistema de design como dependência obrigatória, e o teto de
400 KB do bundle vem da mesma origem. A primeira versão deste documento concluiu que os dois números
não conviviam e propôs dispensar o sistema de design, o que virou a decisão D-02 e o achado A001 do
cross-check. A revisão de 2026-09-09 reverteu a conclusão, e a medição abaixo é o que a sustenta.

O script de poda do `vscode-kanban` registra o problema no próprio cabeçalho: cada conjunto de cor
declara cerca de novecentos e sessenta tokens, e os quatro conjuntos custavam 390 KB dos 400 KB
permitidos antes de um único componente ter sido migrado. A medida foi refeita aqui, sobre a versão
que este repositório instalaria, com o mesmo algoritmo de fecho transitivo e uma semente de vinte e
seis tokens plausível para uma folha de painel: fundo, texto, borda, foco, atalho e os quatro pares
de ênfase.

| Conjunto | Bruto | Podado | Tokens retidos |
|---|---|---|---|
| `light` | 121.331 B | 5.185 B | 26 de 959 |
| `dark` | 121.114 B | 5.200 B | 26 de 959 |
| `light-high-contrast` | 121.805 B | 5.231 B | 26 de 959 |
| `dark-high-contrast` | 121.648 B | 5.272 B | 26 de 959 |
| **Total** | **485.898 B** | **20.888 B** | 96% descartado |

Dois fatos saem daí. O primeiro é que os quatro conjuntos inteiros hoje custam 486 KB, isto é,
estouram sozinhos o teto de 400 KB, o que torna a poda de RF-24 condição de existência do bundle, e
não otimização. O segundo é que, podados, eles custam 21 KB, o que deixa o orçamento praticamente
intacto para a biblioteca de interface e para o código do painel.

O fecho fechou em uma iteração sobre a semente, sem arrastar cadeia longa, porque os tokens
funcionais do sistema de design referenciam poucos tokens de base. Isso é o que dá confiança na
medida, e é também o que torna a guarda de D-16 barata: um fecho vazio, num sistema em que a semente
sozinha já retém vinte e seis nomes, só pode significar que a sonda não leu a folha.

## 4. Tokens sim, componentes não

A reversão trouxe de volta o sistema de design, e restava decidir quanto dele. A leitura da seção 10
da spec do componente resolve a pergunta: ela lista os tokens de tema e a biblioteca de interface,
e não lista os componentes prontos. O painel também não pede nenhum deles, porque é cabeçalho,
faixa, seções recolhíveis, listas e texto.

A diferença é grande de dois modos. No tamanho, os componentes trazem folhas próprias que sobrevivem
à eliminação de código morto por contarem como efeito colateral, o que custou 190 KB ao kit e exigiu
a segunda metade do podador para ser desfeito. Na complexidade, essa segunda metade é a parte
delicada do script, aquela cuja expressão regular gulosa já serviu, uma vez, uma interface inteira
sem estilo enquanto relatava economia recorde.

Daí a forma reduzida de D-15: o painel importa `@primer/primitives`, os quatro conjuntos num só
arquivo de tema, e o podador porta apenas a poda por fecho transitivo. A guarda de D-16 substitui a
guarda de folhas descartadas do kit, que aqui não teria o que guardar.

O mapeamento entre o tema do editor e o conjunto de cor segue o desenho do kit, em que o elemento
raiz carrega o modo em vigor e os nomes dos conjuntos claro e escuro, e um único arquivo conhece
esses nomes. O painel lê a classe que o editor escreve no corpo do documento, incluindo os dois modos
de alto contraste, e converte isso nos atributos que o sistema de design lê.

## 5. Separação das duas unidades de compilação

O kit resolve com dois arquivos de configuração de compilador. O do host permanece como está. O da
webview tem alvo e biblioteca de navegador, resolução por empacotador, transformação automática de
sintaxe de componente, verificação estrita com as opções adicionais ligadas, e duas escolhas que
carregam o peso da separação: a lista de tipos ambientais vazia, que faz a importação de módulo de
plataforma falhar na verificação, e a ausência de emissão, porque quem emite é o empacotador.

Uma diferença em relação ao kit foi encontrada na leitura do código do host deste repositório. Aqui
os caminhos relativos são escritos com extensão explícita, o que o compilador do host aceita por
reescrevê-los na emissão. Como a webview importa o tipo do protocolo de `src/host/`, a configuração
dela precisa alcançar esse diretório e aceitar a extensão, sob pena de a fronteira de D-06 não passar
na verificação por um detalhe de configuração. É o que a decisão D-21 fixa.

O empacotador é chamado por um script próprio, com alvo fixado no Chromium 108. A razão é registrada
no cabeçalho daquele script: é o que o Electron da versão mínima declarada no manifesto embarca, e
essa versão mínima é a mesma que este repositório declara. O formato é de execução imediata, com nome
de saída estável para que o gerador do documento possa apontá-lo sem adivinhar.

Outra diferença merece nota. Lá, o modo de observação embute o mapa de fontes e desliga a
minificação; aqui esse modo pertence à feature 005, e a primeira versão do script produz apenas a
construção de entrega.

## 6. O que o modelo herdado oferece aos seis eixos

A leitura do código herdado confirmou que os seis eixos do painel já têm produtor, e revelou dois
pontos que o plano precisou acomodar.

| Eixo da tela | O que o modelo entrega | Observação |
|---|---|---|
| Identidade e descoberta | Projeto, versão, pastas resolvidas, cinco fases com status derivado, e checkpoints por agente com data e marca de andamento | O status da fase já vem derivado; a tela não recalcula |
| Ciclo forward | Estágio entre sete valores, feature ativa, contagem de ações com emendas à parte, dúvidas, features pausadas e adendo | São oito itens no requisito, com correspondência direta aos campos do modelo |
| Política de escrita | Veredito por caminho, razão do veredito e as seis pastas próprias do Reversa | O modelo decide por caminho consultado; a tela mostra o estado da configuração e as pastas |
| Anomalias | Lista com arquivo, código de vocabulário fechado e detalhe opcional | Vinte códigos possíveis; a tela precisa tolerar código que ainda não conheça |
| Relatório da sonda | Raiz lida, pasta da feature, pasta da sessão de ideação, recusas com motivo e caminhos truncados | Traz um campo a mais do que o requisito pede, a pasta de ideação, que fica fora da primeira versão |
| Bloqueio humano | Não existe como campo: é derivação de quatro sinais espalhados por três eixos | É a função pura de maior valor desta feature |

O primeiro ponto é que o estágio tem sete valores no modelo, e não os cinco que a tabela de detecção
do pipeline sugere: os dois estados de conclusão vêm separados, com adendo e sem adendo, e é
justamente essa separação que sustenta a razão de bloqueio mais importante.

O segundo é que a espera humana da migração aparece em dois lugares distintos, um sinal booleano e
uma lista de decisões pendentes. O esclarecimento de 2026-09-09 decidiu que os dois entram na faixa,
com cada decisão nomeada em linha própria.

## 7. Padrões adotados do kit de origem

Quatro padrões foram adotados por desenho, sem cópia de arquivo. O quinto, o podador, é reescrito na
forma reduzida, e por estar mais perto da origem que os demais ganhou a declaração de procedência de
D-22.

1. **Ponte como único caminho de entrada e saída.** O módulo de ponte do kit declara no próprio
   cabeçalho que nenhum componente chama a interface do host por conta própria, e que é isso que
   mantém o protocolo verificável num arquivo só. A feature 002 já aplicou a regra do lado do host.
2. **Preferências de exibição como funções totais.** O módulo de estado de exibição do kit devolve
   valor usável diante de preferência corrompida, em vez de lançar, com a justificativa de que um
   quadro que se recusa a abrir por causa de uma preferência ruim seria pior que um quadro nos
   padrões.
3. **Tema seguido pela classe do corpo do documento.** O provedor de tema do kit observa a classe que
   o editor escreve, o que permite acompanhar a troca de tema ao vivo, sem comando novo na ponte e
   sem recarregar o painel.
4. **Nenhuma falha silenciosa.** O mesmo módulo de ponte declara que nada ali lança para quem chama,
   e que o usuário descobre o problema por uma linha de log com nome, nunca por painel em branco.
5. **Poda por fecho transitivo, com guarda contra a poda que descarta tudo.** A ideia e a guarda vêm
   do kit; a metade que trata de folhas de componentes fica lá, porque aqui não há componente do
   sistema de design a servir.

## 8. O que não foi investigado

- Desempenho de pintura sob processo grande. O orçamento de 100 ms tem folga larga sobre um processo
  típico abaixo de 50 KB, e medir custaria mais que cumprir.
- Acessibilidade por leitor de tela. O requisito da spec fala em distinguir sem cor e em alcançar por
  teclado, e ambos são verificáveis na marcação renderizada. Auditoria com leitor real fica para
  quando houver preview.
- Internacionalização. O produto tem um usuário, e o idioma da interface acompanha o do projeto.
- Tamanho final do bundle com a biblioteca de interface dentro. A medida da poda cobre os tokens, que
  eram o risco declarado; o resto se mede na primeira construção, e é o número que o critério de
  pronto manda registrar.
