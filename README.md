# reversa-views

Extensão de VS Code que mostra, num painel lateral, em que ponto do processo do
Reversa um projeto está: a descoberta feita, a feature ativa, os artefatos
escritos e as ações executadas. A extensão apenas **lê**; nada do que ela mostra
é escrito por ela.

A leitura não é código próprio. Ela é herdada do `scrum-harness`, copiada para
`src/heranca/` e mantida sob um regime de procedência verificável, descrito
abaixo.

## Como abrir o painel

Uma vez instalada, abrir o painel é um passo só, em qualquer projeto:

> `Cmd+Shift+P` (`Ctrl+Shift+P` no Linux e no Windows), digite `reversa`, escolha
> **Reversa: Abrir o painel do processo**.

Não é preciso estar neste repositório: o painel lê a pasta que estiver aberta no
editor, seja ela qual for. Sem pasta aberta ele diz isso, com todas as letras,
em vez de ficar em branco. Com mais de uma pasta aberta, ele observa a primeira
que tiver o Reversa instalado e declara as outras como não observadas.

Quem prefere o mouse tem o ícone do Reversa na barra de atividades, a coluna
estreita à esquerda da janela. Ele abre a mesma barra lateral, com uma visão só,
chamada **Processo**.

Instalar não abre nada, e é de propósito: a extensão só entra em atividade na
primeira vez que a visão é aberta, e é isso que mantém em zero o custo de tê-la
instalada sem usar.

Depois de aberto, dois comandos importam:

| O que fazer | Como |
|---|---|
| Reler o processo do disco | Botão de reler no próprio painel, ou `Reversa: Reler o processo` na paleta |
| Ver o que a extensão registrou | Painel inferior, aba **Saída**, canal **Reversa Views** |

**Se o comando não aparecer na paleta.** Confirme que a extensão está instalada
com `code --list-extensions | grep reversa`; a resposta esperada é
`iagoleal-local.reversa-views`. Se ela estiver na lista e o comando não,
recarregue a janela pela paleta, com `Developer: Reload Window`. Se não estiver,
a instalação falhou: repita-a e leia a saída, que nomeia a causa. Nada disso
escreve no seu projeto, aqui ou depois: a extensão apenas lê.

## Os dois cartões novos e as quatro ações do cabeçalho

Além do que já mostrava, o painel abre dois cartões que respondem às duas
perguntas de quem retoma o projeto depois de meses.

**Decomposição da feature ativa.** A lista das ações do plano, uma por linha,
com o identificador, se está fechada ou aberta, a fase em que mora e os
arquivos que o registro de progresso associou a ela. A primeira ação aberta
aparece destacada e nomeada como a próxima a executar. Por padrão o cartão
mostra as abertas e as cinco fechadas mais recentes; o resto fica atrás de um
botão, porque uma feature de quarenta ações não cabe numa barra lateral. A
contagem ao lado do título é a do próprio Reversa, e continua sendo a
autoridade: se a lista lida divergir dela, o painel declara a divergência em
vez de escolher um número.

**Histórico das entregas.** Uma linha por pasta de feature, da mais recente
para a mais antiga, com a situação (convergida, entregue sem adendo, em aberto
ou sem ações), a marca do ponteiro do Reversa (ativa ou pausada), quantas ações
fecharam e o adendo vigente, clicável, quando existe. Feature sem adendo não
some da lista: ela aparece dizendo que não tem. Projetos com muitas pastas
param num teto de cinquenta, e o cartão avisa quando parou.

O cabeçalho ganhou quatro ações, ao lado do botão de reler:

| Ação | O que faz |
|---|---|
| **Expandir tudo** | Abre todos os cartões de uma vez |
| **Recolher tudo** | Fecha todos de uma vez |
| **Resumir em documento** | Abre um documento novo, não salvo, com o resumo do processo |
| **Copiar o resumo** | Põe o mesmo texto na área de transferência |

As duas primeiras gravam a preferência: o painel reabre como você o deixou.
Uma ação que não teria efeito, como expandir com tudo já aberto, aparece
indisponível em vez de sumir.

**O que o resumo reúne.** É a parte derivável de uma passagem de bastão: o
projeto, a raiz observada, o momento da leitura, a etapa e o estado da feature
ativa com suas ações abertas, e uma linha por entrega anterior com situação e
adendo. Sai em Markdown, e é o mesmo texto nos dois caminhos, porque a função
que o compõe não consulta o relógio. O documento aberto não é salvo por
ninguém além de você, e a extensão continua sem escrever no projeto. O juízo em
prosa que uma passagem de bastão escrita à mão carrega continua sendo trabalho
humano: o resumo não tenta imitá-lo.

**Todo instante está no horário de Brasília.** O Reversa grava os momentos em
tempo universal, que é o certo para um arquivo e o errado para os olhos. O
painel converte todos eles na leitura, e escreve a zona por extenso, como em
`09/09/2026 12:00 (Brasília)`. O valor absoluto não se perde: ele fica no
atributo `data-instant` do elemento, consultável pelo inspetor do editor. Onde
não houver momento registrado, o painel diz isso, em vez de mostrar campo
vazio.

## Instalar, uma vez só

O pacote pronto é o `.vsix` na raiz deste repositório, nomeado pela versão
derivada na construção (a regra está no ritual da atualização, abaixo).
Instalar é um comando:

```bash
code --install-extension reversa-views-0.6.1.vsix
```

A extensão é privada e tem publicador local: ela não fala com o Marketplace,
não pede conta e não pode ser publicada por engano.

Um aviso que vale para quem trabalha em contêiner. O VS Code instala a extensão
do lado da janela em que o comando roda. Rodado dentro de um Dev Container, ele
instala no servidor remoto, e a extensão vale para as pastas abertas naquele
contêiner. Para tê-la também no editor da máquina local, rode o mesmo comando
num terminal da máquina, fora do contêiner.

## Reconstruir o pacote

Isto é trabalho de manutenção, e só é preciso depois de mexer no código.

```bash
npm install            # traz as ferramentas, inclusive o empacotador
npm run build          # confere a herança, compila o host e empacota a tela
npm test               # 1527 testes; nenhum deles abre navegador
npm run empacotar      # regenera o .vsix e lista o que entrou nele
```

Duas paradas valem explicação. O `build` falha se o pacote da tela passar do
teto declarado em `scripts/limites.js`, e falha antes de qualquer
empacotamento, porque um pacote gordo só dá sinal na máquina de quem instalou.
E o `empacotar` imprime, ao final, cada arquivo que entrou no pacote e o
tamanho medido ao lado do teto; a conferência automática do mesmo pacote é
parte do `npm test`.

Para mexer na extensão sem instalar nada, abra este repositório no editor e
pressione `F5`. Uma segunda janela abre com a extensão carregada da pasta de
saída, e a construção roda antes por conta da pré-tarefa configurada em
`.vscode/`.


## O ritual da atualização

A extensão não se atualiza sozinha, e isso é decisão: ela nunca escreve, nem
no workspace nem em si mesma. O que ela faz é **anunciar**, no cabeçalho do
painel, se esta construção está atrás da origem do repositório. Trazer a
novidade é ato seu, no terminal, em dois passos separados de propósito.

### De onde se chama

O ritual mora no clone e é sobre ele que age: `scripts/atualizar.js` ancora a
raiz no arquivo que o contém, e não no diretório de onde você o chamou. Daí
existirem duas grafias do mesmo ato, nenhuma mais verdadeira que a outra.

| Grafia | Vale onde | Segundo ato |
|---|---|---|
| Pelo npm | Dentro do clone, e só dentro dele | `npm run atualizar -- --aplicar` |
| Pelo endereço | De qualquer diretório da máquina | `node <raiz-do-clone>/scripts/atualizar.js --aplicar` |

A faixa do painel anuncia a segunda, com a raiz que o carimbo da construção
declara, e a razão é que o painel abre no workspace que você tem aberto, que
quase nunca é este clone. Anunciar ali a grafia do npm era o `BUG-20260911-FI3O`:
o npm resolve scripts pelo `package.json` do diretório corrente, e recusava com
`Missing script` ou `ENOENT` antes de o ritual começar, sem que nenhum dos três
desfechos nomeados chegasse a existir. Construção que não declare raiz faz a
faixa recuar para a grafia do npm, e é o que as anteriores à correção produzem.

Uma consequência a dizer em voz alta: onde o clone **não existe** na máquina em
que o painel roda, o que inclui container de desenvolvimento e Codespace, não há
endereço alcançável, e grafia alguma o inventa. A atualização se faz onde o clone
está, e o pacote resultante se instala no ambiente remoto com
`code --install-extension`.

### Conferir

```bash
npm run atualizar                                  # de dentro do clone
node /caminho/do/clone/scripts/atualizar.js        # de qualquer diretório
```

O comando busca as referências da origem e não toca a árvore de trabalho:
`git status` antes e depois produz a mesma saída. Ele imprime o commit do
clone na forma curta, a mesma que o painel mostra em *Construída de*, para que
a comparação entre o instalado e o clonado seja visual. Três desfechos, cada um
com o próprio código de saída:

| Desfecho | O que diz | Código |
|---|---|---|
| Em dia | Não há commit a trazer | 0 |
| Atrás de N commits | Quantos são, e o comando para aplicar | 1 |
| Impossível conferir | A causa: sem clone, sem remoto, git ausente ou sem rede | 2 |

O painel diz o mesmo, sem terminal: a linha do desfecho no cabeçalho declara
*em dia*, *N commits à frente*, *divergente* (a origem tem novidade e este clone
tem commit próprio), *commit desconhecido* (a construção veio de um commit que a
origem nunca viu) ou *não deu para conferir*, com a causa. A consulta é anônima
e de leitura, ocorre uma vez por leitura do processo, e a chave
`reversaViews.conferirAtualizacao` a desliga; desligada, o cabeçalho declara
que está desligada, e não que está em dia.

Uma ressalva de bootstrap, aprendida com o BUG-20260909-VHII. Instalação
anterior à `0.7.0` não tem a consulta nem o carimbo: o cabeçalho dela não
mostra *Extensão* nem *Construída de*, e nada nela anuncia que ficou atrás,
porque quem anunciaria é a construção que ainda não está instalada.
`code --list-extensions --show-versions` diz qual versão está instalada;
abaixo de `0.7.0`, a primeira atualização é manual, uma vez só: `npm run
build`, `npm test`, `npm run empacotar` e `code --install-extension` com o
pacote gerado, seguidos de recarga da janela do editor. Daí em diante o painel
avisa.

### Aplicar

```bash
npm run atualizar -- --aplicar                              # de dentro do clone
node /caminho/do/clone/scripts/atualizar.js --aplicar       # de qualquer diretório
```

Este ato tem uma frase só: **deixe a instalação em dia com este clone**. Havendo
o que trazer, incorpora antes, por avanço rápido, e roda `npm ci` se o arquivo de
trava mudou. Havendo ou não, percorre construção, suíte e empacotamento, para na
primeira falha, e deixa o pacote anterior intacto porque o empacotamento é o
último passo. Ao fim imprime a linha `code --install-extension <pacote>` já com o
nome gerado, e a executa quando o executável do editor está no caminho; sem ele,
imprime a linha e termina em sucesso.

Que o percurso rode mesmo sem commit a trazer é o que corrige o
`BUG-20260910-SVZU`, e a razão está em quem mede o quê. **A conferência compara o
clone com a origem; o painel compara a construção instalada com a origem.** Os
dois eixos divergem sempre que você constrói ou incorpora sem instalar, e é por
isso que o painel pode pedir atualização com o clone já em dia: quem ficou atrás
é o pacote instalado. Enquanto a aplicação era consequência da incorporação, esse
estado não tinha comando algum que o alcançasse, e o aviso voltava a cada recarga
da janela.

Duas recusas vêm **antes de tocar em qualquer coisa**, e guardam coisas
diferentes, por isso valem em alcances diferentes:

| Recusa | Quando vale | Por quê |
|---|---|---|
| Árvore de trabalho com alteração não registrada, arquivo por arquivo | Sempre, mesmo com o clone em dia | O carimbo da construção declara o commit da cabeça, e um pacote feito daí anunciaria no painel uma procedência que o conteúdo não tem |
| Commit local que a origem não tem, com a contagem | Só quando há incorporação a fazer | Incorporar por cima de trabalho seu é decisão que script nenhum toma; construir o seu próprio trabalho não é |

Não conseguir conferir interrompe tudo, e sai com o código dois: construir às
cegas, sem saber o estado da origem, é o oposto do que o ritual existe para fazer.

### A versão que cresce sozinha

A versão do pacote nunca é escrita à mão. Ela é derivada na construção:

- o primeiro número fica em zero até decisão explícita do mantenedor;
- o segundo é o **maior** número de feature com adendo em `_reversa_sdd/addenda/`,
  e não a quantidade de adendos, para que adendo apagado ou superado não faça
  a versão recuar;
- o terceiro conta os commits desde o commit que **acrescentou** aquele adendo.

Hoje isso dá `0.6.1`, e o pacote se chama `reversa-views-0.6.1.vsix`. O
`package.json` versionado guarda um valor de espera; o empacotamento escreve a
versão derivada nele só em torno da chamada ao empacotador, e a restaura em
bloco de saída garantida, para que a árvore volte limpa mesmo quando o
empacotador falha. Fora de um clone, ou sem adendo algum, a derivação recua
para `0.0.0` e o empacotamento imprime por quê. O carimbo com a versão e o
commit da construção (`src/host/build.ts`) é gerado a cada construção e não é
versionado, pela mesma razão: muda a cada commit.

## Ver a tela antes de empacotar

Suíte verde não confere tela. Cor, contraste, quebra de linha e seção que não
abre passam por teste e aparecem no olho, e é para isso que existe o preview:
ele serve o **pacote real** da webview, sob o **documento real** que o editor
serviria, com a **leitura real** de um workspace, e põe no lugar da extensão um
host fingido que cumpre o mesmo contrato de canal. A faixa vermelha no topo
declara o que ele não simula.

O painel tem sete estados de entrada, e o cabeçalho tem sete desfechos da
consulta à origem. Cada um se alcança por um comando:

| Estado | Comando |
|---|---|
| Sem pasta aberta | `npm run preview -- --estado=sem-diretorio` |
| Sem Reversa instalado | `npm run preview -- --estado=sem-reversa` |
| Falha de leitura | `npm run preview -- --estado=erro` |
| Carregando | `npm run preview -- --atraso=3000` |
| Relendo | `npm run preview -- --atraso=3000`, e então o botão de reler no painel |
| Instalado | `npm run preview` |
| Instalado e degradado | `node scripts/preview.js --workspace="$(node scripts/estragar-workspace.js)"` |
| Sem registro de bugs | `node scripts/preview.js --workspace="$(node scripts/estragar-registro.js --caso=ausente)"` |
| Com bug restrito | `node scripts/preview.js --workspace="$(node scripts/estragar-registro.js --caso=restrito)"` |
| Com registro inconsistente | `node scripts/preview.js --workspace="$(node scripts/estragar-registro.js --caso=inconsistente)"` |
| Com leitura de bugs no teto | `node scripts/preview.js --workspace="$(node scripts/estragar-registro.js --caso=teto)"` |
| Sem âncora alguma (nem extração, nem `/reversa-new`) | `node scripts/preview.js --workspace="$(node scripts/estragar-greenfield.js --caso=sem-ancora)"` |
| Pipeline do `/reversa-new` parada nas personas | `node scripts/preview.js --workspace="$(node scripts/estragar-greenfield.js --caso=parcial)"` |
| Metadado do pipeline divergente do disco | `node scripts/preview.js --workspace="$(node scripts/estragar-greenfield.js --caso=divergente)"` |
| PRD sem decomposição em specs | `node scripts/preview.js --workspace="$(node scripts/estragar-greenfield.js --caso=sdd-vazio)"` |
| PRD sem seção de escopo | `node scripts/preview.js --workspace="$(node scripts/estragar-greenfield.js --caso=sem-escopo)"` |
| Com leitura de specs no teto | `node scripts/preview.js --workspace="$(node scripts/estragar-greenfield.js --caso=teto)"` |
| Specs sem pasta homônima, ligadas às entregas com a origem "declarada" | `node scripts/preview.js --workspace="$(node scripts/estragar-vinculo.js --caso=declarada)"` |
| Componente entregue sem spec, no bloco "Entregues sem spec" com a pasta que o declara | `node scripts/preview.js --workspace="$(node scripts/estragar-vinculo.js --caso=sem-spec)"` |
| "2 de 20 conferências registradas" numa entrega que continua convergida, sem razão nova na faixa | `node scripts/preview.js --workspace="$(node scripts/estragar-vinculo.js --caso=conferencias)"` |
| Registro de conferências sem coluna `Data`: anomalia com a seção e o cabeçalho no detalhe | `node scripts/preview.js --workspace="$(node scripts/estragar-vinculo.js --caso=conferencias-sem-tabela)"` |
| `legacy-impact.md` acima do teto: vínculo declarado parcial, com a anomalia do arquivo não lido | `node scripts/preview.js --workspace="$(node scripts/estragar-vinculo.js --caso=impacto-grande)"` |
| Fase fora das canônicas e fora do encerramento: sem frase de encerramento, e a anomalia `fase-desconhecida` na tela | `node scripts/preview.js --workspace="$(node scripts/estragar-descoberta.js --caso=fase-estranha)"` |
| Checkpoint sem `completed_at` e com `modules_pending`: em andamento, e sem anomalia por isso | `node scripts/preview.js --workspace="$(node scripts/estragar-descoberta.js --caso=parcial)"` |
| Fase terminal com nome estranho em `completed`: frase de encerramento, e exatamente uma anomalia de fase | `node scripts/preview.js --workspace="$(node scripts/estragar-descoberta.js --caso=terminal-e-estranha)"` |
| Checkpoint sem `files` e com campos de lista: os campos nomeados, sem virarem lista de arquivos | `node scripts/preview.js --workspace="$(node scripts/estragar-descoberta.js --caso=saidas-nao-canonicas)"` |

| Desfecho da consulta | Comando |
|---|---|
| Conferência desligada | `npm run preview -- --atualizacao=desligada` |
| Consultando | `npm run preview -- --atualizacao=consultando` |
| Em dia | `npm run preview -- --atualizacao=em-dia` |
| Atrás da origem | `npm run preview -- --atualizacao=atrasada` |
| Divergente | `npm run preview -- --atualizacao=divergente` |
| Commit desconhecido | `npm run preview -- --atualizacao=commit-desconhecido` |
| Impossível conferir | `npm run preview -- --atualizacao=impossivel` |

Os cinco desfechos que respondem passam por *consultando* antes: o preview
entrega o processo, depois o estado em curso, e só então o desfecho, com o
atraso declarado ou um mínimo curto, porque entregue no mesmo ciclo o estado em
curso nunca seria visto. O preview não consulta a origem de verdade: o desfecho
é forçado, e sem `--atualizacao` a linha do cabeçalho não aparece.

O último merece nota. Ele copia este workspace para uma pasta temporária do
sistema, trunca lá um arquivo do Reversa e imprime o caminho da cópia. Nem o
repositório nem o workspace de origem são tocados: quem escreve é o auxiliar, e
o preview não escreve nada, em lugar nenhum.

Os demais argumentos são `--tema=` (`claro`, `escuro`, `claro-alto-contraste`,
`escuro-alto-contraste`), `--workspace=` e `--porta=`; `--estado=` e
`--atualizacao=` combinam entre si e com o atraso. Argumento desconhecido, ou
valor fora da lista, interrompe o comando em vez de ser ignorado.

Enquanto mexe na tela, `npm run observar:webview` reempacota a cada alteração,
com mapa de fontes. Recarregar a página é ato seu: o preview não abre canal para
o navegador.

## O painel no terminal

O mesmo processo, sem abrir o editor:

```bash
npm run painel
npm run painel -- --workspace=/caminho/do/projeto
npm run painel -- --passada | head -40
npm run painel -- --dados > processo.json
```

Ele não é um leitor novo: é um terceiro consumidor da mesma leitura, ao lado do
painel e do preview. Pede ao host a mesma sequência de mensagens que a tela
recebe e a dobra sobre a mesma máquina de estados de entrada, de modo que as
onze seções saem na mesma ordem, com os mesmos rótulos e os mesmos números.
Divergência entre as duas superfícies é defeito, e `tests/cli-paridade.spec.tsx`
a pega comparando as duas sobre a mesma carga.

Há dois modos, e a saída escolhe qual. Com terminal, nasce a **interface viva**:
as setas movem a seleção, `←` e `→` fecham e abrem a seção, `Enter` abre o
artefato no editor que `VISUAL` ou `EDITOR` declara, `r` relê, `?` mostra a
tabela inteira de teclas e `q` sai. Ela também relê **sozinha** quando o disco
muda, agrupando uma rajada de escritas numa releitura só, e declara na tela que
a mudança veio da observação, para que ninguém leia um número acreditando ser o
que tinha visto antes. Redirecionada, nasce a **passada**: imprime uma vez, sem
sequência de escape alguma, e termina — `npm run painel > saida.txt` funciona
sem bandeira, que é a razão de a regra existir.

Três códigos de saída, e a distinção do meio é a que importa num script:
`0` quando a leitura ocorreu, **inclusive** sem Reversa instalado na raiz; `1`
quando a leitura falhou; `2` para uso incorreto, que é argumento desconhecido ou
raiz inexistente. `--sem-conferir` e `REVERSA_VIEWS_SEM_CONFERIR` desligam a
consulta à origem, e `--sem-cor` e `NO_COLOR` desligam a cor; `--ajuda` descreve
o resto.

A ferramenta **não escreve arquivo algum**, em modo algum, por argumento algum,
e `tests/cli-boundaries.spec.ts` o confere lendo os próprios fontes. O único
processo que ela cria é o do editor, num módulo apartado e sem passar pelo
shell. O terminal é devolvido como foi encontrado em toda saída, inclusive na
interrupção por `Ctrl+C`, na suspensão por `Ctrl+Z` e na falha não prevista:
interface viva que deixa terminal quebrado é pior que nenhuma.

Como o preview e o auxiliar de prompt, ela vive fora do pacote instalável. A
unidade de compilação é própria, `tsconfig.cli.json`, e a saída vai para
`out-cli/`, fora de `out/`, que é o que o `.vscodeignore` readmite; `npm run
painel` a constrói antes de rodar, e a suíte do conteúdo do pacote recusa por
nome qualquer caminho de `out-cli/` ou de `src/cli/` lá dentro.

## O portão visual

**Situação em 2026-09-09, feature 007: cumprido no navegador.** Os sete
estados de entrada, os sete desfechos da consulta e as três barras foram vistos
nos quatro conjuntos de cores, em largura de barra lateral (380 px). Nenhum
defeito novo apareceu; o que a rodada confirmou foi a decisão de desenhar a
barra em SVG: a largura do preenchimento resolve sob a política de estilo do
painel, onde um atributo de estilo em linha seria descartado e toda barra
nasceria vazia. A rodada anterior, da feature 005, achou três defeitos que a
suíte verde não pegava, todos corrigidos e travados por teste antes de o portão
fechar:

| O que a tela mostrava | Onde estava | Como ficou |
|---|---|---|
| Falha de leitura sob a declaração de leitura íntegra | `src/webview/ui/Header.tsx` | Sem leitura, o cabeçalho não declara integridade nenhuma |
| Título das telas de entrada no tamanho que o navegador dá a `h1`, duas vezes o resto | `src/webview/theme/theme.css` | Regra própria, do tamanho do título do cabeçalho |
| Releitura sem sinal na tela, com o atraso servindo para nada | `scripts/preview/cliente.js` | A abertura da sequência sai antes do pedido, e o botão diz *Relendo…* |

O terceiro é o mais instrutivo: o canal do preview responde uma vez só, e a
mensagem que abre a sequência chegava no mesmo ciclo do resultado. O painel
nunca tinha um quadro para pintar a releitura, e o atraso, cuja razão de ser
era justamente deixá-la ver, não alcançava o estado que prometia.

A regra é que nenhuma versão seja empacotada para uso antes de os sete estados
e os sete desfechos terem sido conferidos na tela. Ela vale para cada versão,
não uma vez só: quem mexer na tela roda os comandos das duas tabelas de novo,
olha cada um nos quatro temas e atualiza a data acima. O que continua **devido** é a conferência dentro do editor, que o
preview declara não simular: o ícone na barra de atividades, o comando de
paleta com a visão oculta e o canal de saída.

## O ritual da herança

`src/heranca/` guarda 37 arquivos copiados de outros repositórios. Cada um traz
um carimbo de sete linhas dizendo de onde veio e em que revisão, e o manifesto
em `src/heranca/manifesto.yml` guarda o resumo criptográfico do conteúdo de cada
um. O registro em prosa, com o porquê de cada escolha, está em
`src/heranca/PROCEDENCIA.md`.

### Quando rodar o ritual

Três sinais disparam a conferência, e nenhum deles é o calendário:

1. **Anomalia de campo desconhecido no painel.** A camada de leitura encontrou
   no estado do Reversa um campo que não conhece. Ou o Reversa mudou, ou a cópia
   ficou para trás.
2. **Versão nova do Reversa instalada** no projeto observado. O que a leitura
   entende pode ter mudado com ela.
3. **Release nova da origem do kit de extensão.** O padrão de webview que esta
   extensão segue veio de lá, e vale reler o que mudou.

### Os dois comandos

```bash
npm run check:heranca         # confronta a cópia com as origens configuradas
npm run check:heranca:local   # confere só o que está versionado aqui
npm run sync:heranca          # planeja a ressincronização; escreve com --aplicar
```

O verificador precisa saber onde as origens estão clonadas **nesta máquina**.
Isso não entra no manifesto nem no código: copie `heranca.origens.exemplo.yml`
para `heranca.origens.yml`, que o git ignora, e aponte cada chave para a pasta
correspondente. Sem esse arquivo o verificador não falha: ele relata a origem
como indisponível e conclui as conferências que não dependem dela.

O relatório separa o que **impede** de prosseguir do que apenas **informa**.
Origem que avançou informa, e é o sinal para ressincronizar. Arquivo editado
localmente impede, porque ninguém além de quem editou sabe se aquilo era uma
adaptação ou um descuido.

### Quando o ressincronizador para

Ele para em três situações, e nenhuma delas é resolvível por script:

- **Edição local não declarada.** Um arquivo herdado difere do resumo do
  manifesto. Há duas saídas, e escolher é seu: **declarar a adaptação** em
  `src/heranca/adaptacoes.yml`, com o trecho original e o adaptado, ou
  **descartar a edição**, restaurando o arquivo pela cópia da origem.
- **Adaptação que deixou de casar.** O trecho original de uma adaptação não
  aparece mais, ou aparece mais de uma vez, no conteúdo atual da origem. A
  ferramenta mostra o esperado e o encontrado; atualize o trecho declarado ou
  remova a adaptação, se a origem já resolveu o que ela corrigia.
- **Arquivo preso por paridade externa.** Um dos fixtures herdados é conferido
  byte a byte contra um arquivo instalado fora da pasta da herança. Mexer só de
  um lado quebraria a paridade, e a ferramenta prefere parar a escolher por você.

Depois de aplicar uma ressincronização, rode `npm run gerar:revisao-heranca`
para que a revisão que o painel mostra volte a coincidir com o manifesto. O
`build` faz isso sozinho.

## O limite conhecido do regime

O resumo criptográfico prova que o **texto** de um arquivo herdado é o mesmo que
foi copiado. Ele não prova que o **comportamento** é o mesmo, e essa distinção
importa mais do que parece.

O caso claro é a **dependência transitiva**: um arquivo herdado que importa uma
biblioteca continua com o resumo intacto quando essa biblioteca muda de versão
por baixo dele. Nada no manifesto acusa isso, porque nada no arquivo mudou.

A rede que resta são as **suítes herdadas**, copiadas junto com o código que
elas testam e rodadas aqui a cada `npm test`. Elas exercitam o comportamento, e
não o texto, e é por isso que valeu copiá-las. Elas não cobrem tudo, mas são o
que separa o regime de uma promessa.

## O mapa das equivalências de checkpoint

O Reversa manda o checkpoint declarar sua conclusão em `completed_at`, mas esse
nome aparece em dois arquivos de referência e em nenhum dos mais de vinte
`SKILL.md` que mandam salvar checkpoint. O resultado é medível: dos 64 projetos
com `.reversa/state.json`, nove declaram conclusão por outro nome, em sete
vocabulários distintos (`status: "concluido"`, `concluido_em`, `done: true`,
`status: "completed"`, `status: "completo"`, `timestamp`, `status: "success"`).
Para a leitura, um checkpoint assim não declarou conclusão alguma, e vira
anomalia.

O mapa em `src/domain/equivalencias.ts` é onde essas equivalências ficam depois
de **uma pessoa** aprová-las. Ele guarda pares de campo e valor, nunca campos
soltos: `status: "failed"` e `status: "success"` moram no mesmo campo e dizem o
oposto, e um mapa por campo faria projeto que falhou aparecer como concluído.
Guarda também as entradas que não são agente nenhum, como o `plano_aprovado`
que mora no mapa de checkpoints sem ser checkpoint.

Achando par aprovado, o checkpoint aparece concluído **com a procedência na
linha**, dizendo por qual campo e valor fora do esquema ele foi reconhecido.
Não achando, o comportamento é o de sempre: conclusão não declarada, com
anomalia. O `completed_at` continua tendo precedência sobre tudo.

### Propor e dispor são dois comandos

```bash
npm run aprender:equivalencias   # PROPÕE, consultando um modelo local
npm run promover:equivalencias   # DISPÕE, a partir do que você marcou
```

O primeiro varre os `state.json` de uma raiz (`--raiz=~/dev`, por padrão o
próprio repositório), isola os pares que ninguém decidiu ainda, elide o
conteúdo, pergunta a um modelo local por Ollama (`--modelo=`, por padrão
`qwen2.5:7b`) e escreve `propostas/equivalencias.md`, com a leitura sugerida, a
razão do modelo e os projetos onde o par foi visto.

A pergunta é feita em duas passagens, e a ordem importa. Primeiro cada
checkpoint é perguntado inteiro, sem apontar campo algum, e o modelo diz qual
dos campos fala de estado. Só depois, e só nos campos que essa primeira
passagem elegeu, ele é perguntado campo a campo, o que recupera um segundo
valor como `status: "success"` ao lado de `status: "concluido"`. Perguntar
direto campo a campo faria o modelo concordar que `verde: 569` declara
conclusão; perguntar só do jeito amplo perderia o segundo valor. Na rodada
sobre os 64 projetos, a ordem devolveu seis pares em 1 min 13 s. **Ele nunca escreve no
mapa**, e a conferência disso é um `git status` logo depois de rodar.

O segundo não conhece o motor: abra `scripts/promover-equivalencias.js` e olhe
os `require` do topo. Ele lê as caixas que você marcou na proposta e regenera o
módulo, com a data da aprovação e a evidência. Marcar a caixa é o ato de
aprovar; o que ficou desmarcado não entra, e o que o modelo não soube
classificar a proposta nomeia à parte, sem caixa.

O modelo roda no tempo do aprendizado, jamais no tempo da leitura. A extensão
não fala com o Ollama, não fala com serviço algum e continua sem qualquer
superfície de escrita: a suíte inteira roda sem modelo instalado. O mapa vai ao
pacote porque é módulo, e não arquivo de dados; `.vscodeignore` só readmite
`out/`, e uma aprovação que não chegasse ao `.vsix` valeria apenas para quem
tem o repositório.

Nenhum `state.json` é reescrito em passo algum, nem pelo aprendizado, nem pela
promoção, nem pela leitura. A tradução acontece em memória e sobre o mapa.

### O prompt de correção: o painel pede, e não conserta

A primeira promoção do mapa derrubou vinte e cinco anomalias a três, e as três
que sobraram **não devem ser traduzidas**. Nelas o defeito não está na leitura
nem na falta de um par aprovado: está em quem gravou o checkpoint. Traduzir uma
delas no mapa esconderia a causa e a deixaria repetir no próximo projeto.

Por isso o cabeçalho ganhou duas ações, ao lado das duas do resumo:

- **Prompt de correção em documento**, que abre o texto num documento não salvo;
- **Copiar o prompt de correção**, que põe o mesmo texto na área de transferência.

O texto é um pedido pronto para colar no chat do agente que mantém o projeto
observado. Ele diz onde colar, nomeando a raiz; declara a norma, que é
`completed_at` com `files`; mostra um bloco por caso, com a **forma elidida** do
checkpoint, nunca o conteúdo; faz quatro pedidos numerados, sendo o último
propor a correção na fonte sem aplicá-la; e fecha com quatro proibições. As duas
ações nascem apagadas quando não há caso, e a **razão** de estarem apagadas sai
escrita, porque botão cinzento não informa quem não vê cor nem diz por quê a
quem vê. As três razões são três fatos distintos: nada foi lido, o host não
mandou o eixo, ou a leitura não tem caso.

O painel não conserta nada, e isso é desenho e não limitação: ele não escreve em
`state.json` de projeto algum, e o `SKILL.md` que causou o defeito mora fora da
raiz observada. O que ele faz é dar à pessoa o pedido inteiro, com a causa junto
do dado.

O painel lê uma raiz por vez, e os três casos moram em três projetos. Para vê-los
de uma vez há um comando de manutenção:

```bash
npm run prompt:harness -- --raiz=~/dev
```

Ele varre os `state.json` da raiz, aplica as duas regras do esquema e o mapa
aprovado, elide cada checkpoint e escreve **o mesmo texto** do painel em
`propostas/prompt-harness.md` (`--saida=` troca o destino). Mesmo texto, e não
texto parecido: `tests/prompt-paridade.spec.ts` compara os dois lados inteiros, e
divergência ali é defeito de código. Ele não fala com motor algum, não classifica
coisa alguma e não toca `state.json` de ninguém; a conferência disso é um
`git status` na raiz varrida logo depois de rodar. Sem caso algum, ele não deixa
arquivo pela metade: nomeia a causa e sai.

Um cuidado ao usar a varredura: o texto nomeia projeto e caminho absoluto de cada
caso, e por isso o destino padrão fica de fora do que se versiona por reflexo. A
elisão protege o conteúdo dos campos, não o nome do projeto onde eles moram.
