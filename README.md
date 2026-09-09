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

O pacote pronto é o `.vsix` na raiz deste repositório. Instalar é um comando:

```bash
code --install-extension reversa-views-0.0.1.vsix
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
npm test               # 864 testes; nenhum deles abre navegador
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


## Ver a tela antes de empacotar

Suíte verde não confere tela. Cor, contraste, quebra de linha e seção que não
abre passam por teste e aparecem no olho, e é para isso que existe o preview:
ele serve o **pacote real** da webview, sob o **documento real** que o editor
serviria, com a **leitura real** de um workspace, e põe no lugar da extensão um
host fingido que cumpre o mesmo contrato de canal. A faixa vermelha no topo
declara o que ele não simula.

O painel tem sete estados, e cada um se alcança por um comando:

| Estado | Comando |
|---|---|
| Sem pasta aberta | `npm run preview -- --estado=sem-diretorio` |
| Sem Reversa instalado | `npm run preview -- --estado=sem-reversa` |
| Falha de leitura | `npm run preview -- --estado=erro` |
| Carregando | `npm run preview -- --atraso=3000` |
| Relendo | `npm run preview -- --atraso=3000`, e então o botão de reler no painel |
| Instalado | `npm run preview` |
| Instalado e degradado | `node scripts/preview.js --workspace="$(node scripts/estragar-workspace.js)"` |

O último merece nota. Ele copia este workspace para uma pasta temporária do
sistema, trunca lá um arquivo do Reversa e imprime o caminho da cópia. Nem o
repositório nem o workspace de origem são tocados: quem escreve é o auxiliar, e
o preview não escreve nada, em lugar nenhum.

Os demais argumentos são `--tema=` (`claro`, `escuro`, `claro-alto-contraste`,
`escuro-alto-contraste`), `--workspace=` e `--porta=`. Argumento desconhecido
interrompe o comando em vez de ser ignorado.

Enquanto mexe na tela, `npm run observar:webview` reempacota a cada alteração,
com mapa de fontes. Recarregar a página é ato seu: o preview não abre canal para
o navegador.

## O portão visual

**Situação em 2026-09-09: cumprido no navegador.** Os sete estados foram vistos
nos quatro temas, e a conferência achou três defeitos que a suíte verde não
pegava. Todos foram corrigidos e travados por teste antes de o portão fechar:

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
terem sido conferidos na tela. Ela vale para cada versão, não uma vez só: quem
mexer na tela roda os sete comandos de novo, olha cada um e atualiza a data
acima. O que continua **devido** é a conferência dentro do editor, que o
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
