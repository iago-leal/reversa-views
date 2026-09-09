# Investigação: ponte e host da extensão

> Identificador: `002-ponte-e-host`
> Data: `2026-09-09`
> Confidência: 🟢 CONFIRMADO, 🟡 INFERIDO, 🔴 LACUNA

## 1. O que se foi investigar

Quatro perguntas ordenaram a pesquisa. Onde o painel deve morar, se em contêiner de visão próprio
ou em painel de editor, dado que a origem do kit escolheu o segundo. Como testar um host de
extensão sem abrir o editor, sabendo que a spec de empacotamento descartou o harness de ponta a
ponta. Quanto da política de segurança da origem sobrevive quando se removem as bibliotecas que a
afrouxavam. E o que exatamente a interface do editor promete a respeito de mensagem enviada a uma
visão oculta, ponto de que dependem dois requisitos ao mesmo tempo.

## 2. Fontes consultadas

| Fonte | O que se extraiu | Confidência |
|-------|------------------|-------------|
| `/workspaces/iagoleal/dev/vscode-kanban/src/webview/bridge/vscode-bridge.ts` | O lado da webview inteiro, com envelope de nome e carga, captura em cada chamada, log que nunca loga a falha do próprio log, e a tomada única da interface do host | 🟢 |
| `/workspaces/iagoleal/dev/vscode-kanban/src/webview/bridge/messages.ts` | A forma do envelope e a disciplina de declarar num arquivo só todo comando de ida e de volta | 🟢 |
| `/workspaces/iagoleal/dev/vscode-kanban/src/html.ts` | A montagem do documento, a geração do nonce por bytes aleatórios e a política de segurança com as cláusulas nomeadas uma a uma | 🟢 |
| `/workspaces/iagoleal/dev/vscode-kanban/src/boards.ts` | O lado do host: painel de editor criado por comando, contexto retido, raízes de recurso local declaradas e um método de envio por onde tudo passa | 🟢 |
| `/workspaces/iagoleal/dev/vscode-kanban/package.json` | Versão mínima do editor em 1.78, ponto de entrada compilado, ativação irrestrita e tipagem em 1.62 | 🟢 |
| `node_modules/@types/vscode/index.d.ts` da origem, linhas 7886 a 8001 e 9218 a 9245 | A declaração literal do provedor de visão, das opções de webview e da visibilidade | 🟢 |
| `src/heranca/reversa-probe/src/files.ts` deste repositório | A função de contenção de caminho já pronta, com a natureza lexical documentada | 🟢 |
| `src/heranca/reversa-probe/src/index.ts` e `src/heranca/reversa-domain/src/index.ts` | As duas funções que o host consome e a forma exata do resultado de cada uma | 🟢 |
| `_reversa_sdd/addenda/001-leitura-do-processo.md` | A confirmação de que a emissão em CommonJS foi fixada e provada, e que ela condiciona o host desta feature | 🟢 |

## 3. Alternativas avaliadas

### 3.1 Onde o painel mora

A origem do kit abre um painel de editor por comando de paleta, e o faz porque um quadro Kanban
ocupa a tela inteira e é aberto deliberadamente. O painel do Reversa tem uso oposto: ele é
consultado de relance, e a persona primária, o Retomador, não lembra comando algum, conforme a
seção 5 da spec do componente. A escolha do contêiner de visão na barra de atividades já estava no
registro de decisões da spec, e a pesquisa apenas confirmou que ela custa duas contribuições de
manifesto e um provedor, contra um comando e a criação manual do painel na alternativa. A questão
OQ-02 da spec, que hesitava entre contêiner próprio e visão dentro do explorador, resolve-se pelo
mesmo argumento: um contêiner próprio tem ícone próprio na barra, e é o ícone que a persona
procura.

### 3.2 Como testar sem o editor

Três caminhos existem, e dois foram descartados. O harness com o editor real, que a origem mantém,
está explicitamente fora de escopo por NG-03 da spec de empacotamento, e o custo dele já foi pago
uma vez naquele repositório. O apelido de módulo na configuração do executor, que faz o nome do
editor resolver para um dublê, funciona e é comum, mas contraria RF-20, que exige a configuração
compartilhada sem apelido, e teria efeito sobre as dezenove suítes herdadas, que não pediram nada.

Resta a injeção por parâmetro, decidida na sessão de esclarecimentos e adotada em D-01. O ponto
que a pesquisa acrescenta é o critério de verificação: se a dependência de valor sobre o editor
existe em exatamente dois arquivos, e nenhum dos dois é alcançado pelas suítes, então todo módulo
testado roda em Node puro por construção, e não por convenção. A busca textual que prova isso é a
mesma que RF-17 já pede para a interface de mensagens, de modo que uma suíte cobre os dois.

### 3.3 Quanto da política de segurança sobrevive

A política da origem tem sete cláusulas, e uma delas admite avaliação dinâmica de código. O
comentário no topo daquele arquivo nomeia os dois responsáveis, o avaliador de expressões de filtro,
que compila a expressão do usuário, e a biblioteca de diagramas. Nenhum dos dois entra aqui, e o
RNF-03 desta feature manda por isso remover a cláusula.

Duas outras cláusulas mereceram exame. A de imagem, que na origem admite qualquer origem segura,
porque cartões trazem imagem da rede; aqui nada vem da rede, e a cláusula encolhe para a origem do
próprio webview mais dados embutidos. E a de atributo de estilo, que a origem admite embutido; o
painel desta feature ainda não tem estilo, e a decisão de admitir ou não atributo embutido pertence
à feature 003, que desenha a tela. A política de D-09 fica portanto no menor conjunto que serve ao
documento provisório, e a feature 003 a alarga se precisar, com a justificativa registrada.

### 3.4 Mensagem para visão oculta

Este foi o achado que mudou o desenho. A declaração da opção de retenção de contexto, na linha 9233
do arquivo de tipagem da origem, diz que não se envia mensagem a uma webview oculta ainda que a
retenção esteja ligada. RF-07 exige que a releitura pela paleta e pelo botão produzam o mesmo
resultado, e o botão só existe com a visão visível, ao passo que a paleta funciona com ela oculta.
Sem tratamento, o comando de paleta pareceria não funcionar, e o pior é que falharia em silêncio.

Três respostas foram consideradas. Enviar mesmo assim e aceitar a perda foi descartado por
contrariar a preferência do projeto por erros barulhentos. Guardar a carga lida e reenviá-la quando
a visão voltasse foi descartado por aproximar-se do que RN-06 proíbe, que é pintar retrato antigo
como se fosse atual. Restou marcar a pendência e ler de novo ao voltar a visibilidade, que é o que
D-10 fixa: nada se guarda além de um sinalizador, e o log registra a postergação com o motivo.

## 4. Padrões aplicáveis

**Ponte única em cada lado.** O nome corrente é fachada, e a razão de ser dele aqui é a auditoria: o
protocolo só é congelável quando há um lugar só para olhar. A origem escreveu essa regra no
cabeçalho do próprio módulo, e o efeito visível é que o arquivo de mensagens dela pôde ser
declarado congelado sem medo.

**Portas e adaptadores.** As quatro fatias que o host usa da interface do editor, mensagem, editor
de texto, pastas do workspace e canal de saída, são pequenas e estáveis. Declará-las como interfaces
próprias e implementá-las num arquivo só é o que torna os demais módulos independentes do editor.
O mesmo corte já existe dentro da camada herdada, entre a sonda que olha e o julgamento que decide,
o que dá continuidade de desenho ao repositório inteiro.

**Estado nomeado em vez de exceção.** O G-03 da spec pede que ausência de workspace, várias raízes
e falha de leitura sejam estados nomeados. A camada herdada já opera assim, devolvendo anomalias em
lista em vez de lançar, e o host apenas estende o hábito à sua própria fronteira.

**Envelope sem correlação.** É herança consciente, registrada no log de decisões da spec. A primeira
versão tem uma resposta possível para cada pedido, e acrescentar identificador de correlação agora
custaria complexidade em troca de nada. O arquivo do contrato registra o que mudaria se um dia
houvesse duas respostas possíveis.

## 5. Pontos que a investigação deixou em aberto

Nenhum bloqueia o plano. Dois merecem registro para quando a feature 003 chegar.

O primeiro é o estilo do documento. A política de D-09 não admite atributo de estilo embutido, e é
possível que a biblioteca de interface escolhida pela feature 003 o exija. A decisão de alargar a
política pertence àquela feature, e o lugar de registrá-la é o mesmo arquivo de documento.

O segundo é o tamanho do processo que atravessa o canal. A carga inclui o processo inteiro, o
relatório da sonda e os adendos lidos, e nenhuma medida existe do peso disso em serialização. A
feature 001 mediu a leitura, não a travessia. Se o painel ficar lento com cinquenta adendos, o lugar
de olhar é este, e a resposta provável é enviar os corpos dos adendos sob demanda, o que o protocolo
comporta por acréscimo de um comando.

## 6. Referências

- `_reversa_sdd/sdd/ponte-e-host.md`, seções 6, 9, 11, 12 e 15
- `_reversa_sdd/sdd/painel-do-processo.md`, seções 9 e 10, para o que o consumidor espera
- `_reversa_sdd/sdd/empacotamento-e-verificacao.md`, seções 4 e 6, para a fronteira com a feature 005
- `_reversa_sdd/prd.md`, seções 6, 7 e 10
- `_reversa_sdd/addenda/001-leitura-do-processo.md`, para o que já existe em código
- `_reversa_forward/001-leitura-do-processo/roadmap.md`, para a forma da decisão de compilação
- Origem do kit de extensão: `/workspaces/iagoleal/dev/vscode-kanban`
