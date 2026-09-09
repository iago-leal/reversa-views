# Onboarding: empacotamento e verificação

> Identificador: `005-empacotamento-e-verificacao`
> Data: `2026-09-09`
> Para quem: o mantenedor que vai exercer esta feature pela primeira vez, ou de novo depois de meses

Este roteiro leva do clone à extensão instalada, passando pela conferência da tela. Ele pressupõe
apenas Node e o gerenciador de pacotes na máquina. Nada aqui exige conta, serviço ou ferramenta
instalada globalmente. Os nomes de comando são os que o plano fixa; se algum divergir do que o
`package.json` mostrar, o `package.json` é a verdade e este arquivo é que está velho.

## 1. Preparar

```bash
cd ~/dev/reversa-views
npm ci                # instalação limpa pelo arquivo de trava, e não 'npm install'
npm run build         # confere a herança, gera a revisão, compila o host e empacota a webview
npm test              # a suíte inteira
```

O que esperar: o build imprime a poda dos conjuntos de cor, o tamanho do pacote da tela e o teto ao
lado dele. A suíte fecha sem falha e sem pulo. Se o build parar dizendo que a herança não confere,
resolva isso primeiro pelo ritual descrito no README; esta feature não muda aquele regime.

## 2. Ver a tela fora do editor

```bash
npm run preview
```

O comando imprime o endereço, que por padrão é `http://127.0.0.1:8778`. Dentro de um contêiner de
desenvolvimento, o editor encaminha a porta sozinho, e o endereço abre no navegador da sua máquina.
Se a porta estiver ocupada, o comando para e sugere o argumento de porta, em vez de escolher outra
por conta própria.

A página traz, no topo, uma faixa que não pertence ao painel: ela diz que aquilo é o preview, qual
workspace foi lido, qual tema está em vigor, qual estado foi forçado, e o que o preview não simula.
Abaixo dela, o painel, exatamente o que o editor mostraria.

## 3. Percorrer os sete estados

Esta é a conferência que o portão de saída da feature 003 pede. Faça uma captura de cada um.

| # | Estado | Comando |
|---|---|---|
| 1 | Sem diretório | `npm run preview -- --estado sem-diretorio` |
| 2 | Carregando | `npm run preview -- --atraso 2000` e olhe o primeiro instante |
| 3 | Sem Reversa | `npm run preview -- --estado sem-reversa` |
| 4 | Erro | `npm run preview -- --estado erro` |
| 5 | Instalado e íntegro | `npm run preview` |
| 6 | Instalado e degradado | veja o passo 4 |
| 7 | Relendo | `npm run preview -- --atraso 2000`, depois clique em reler no painel |

Os quatro temas se combinam com qualquer um deles:

```bash
npm run preview -- --tema claro
npm run preview -- --tema escuro
npm run preview -- --tema claro-alto-contraste
npm run preview -- --tema escuro-alto-contraste
```

O que olhar em cada tema: contraste do texto sobre o fundo, a faixa de bloqueio humano continuando
legível por forma e por texto e não apenas por cor, e as seções recolhíveis mantendo posição entre
uma releitura e outra.

## 4. Ver o estado degradado

```bash
npm run estragar:workspace
```

O comando copia este repositório para uma pasta temporária do sistema, trunca um arquivo do Reversa
dentro da cópia e imprime o caminho dela. Nada no repositório é tocado. Depois:

```bash
npm run preview -- --workspace /caminho/que/o/comando/imprimiu
```

O painel deve aparecer com aviso de degradação no cabeçalho e a seção de anomalias já expandida,
nomeando o arquivo e o motivo. Apagar a pasta temporária depois é opcional; o sistema a recolhe.

## 5. Mexer na tela sem reinstalar nada

Em dois terminais:

```bash
npm run observar:webview     # reempacota a cada arquivo salvo, com mapa de fontes
npm run preview              # no outro terminal
```

Salve um arquivo de `src/webview/` e recarregue a página. O recarregamento é seu: o preview não abre
canal para o navegador, por decisão registrada na sessão de esclarecimentos.

## 6. Empacotar

Só depois do passo 3 cumprido. O portão de saída existe porque três defeitos visuais da origem do
kit passaram por suíte verde.

```bash
npm run empacotar
```

O comando gera o arquivo de pacote na raiz, lista o que entrou nele e imprime o tamanho ao lado do
teto. Confira a listagem: ela deve conter a pasta de saída, o ícone, o manifesto e o README, e nada
mais. A suíte de conteúdo confere o mesmo automaticamente, e é ela que impede material interno de
viajar dentro da extensão.

Se o comando disser que o empacotador não está instalado, rode `npm ci` de novo: ele é dependência de
desenvolvimento e vem no arquivo de trava.

## 7. Instalar e olhar dentro do editor

```bash
code --install-extension reversa-views-0.0.1.vsix
```

Abra um projeto com Reversa instalado, clique no ícone do Reversa na barra de atividades e confira,
agora dentro do editor, o que você já viu no preview. Esta é também a ocasião de fechar a verificação
manual que ficou pendente desde a feature 002.

Para desinstalar:

```bash
code --uninstall-extension iagoleal.reversa-views
```

## 8. Depurar dentro do editor

Abra este repositório no editor e rode a configuração de depuração da extensão. Ela constrói antes de
abrir, de modo que a janela de desenvolvimento nunca carrega saída velha. Os pontos de parada valem
para o host; a tela continua sendo conferida pelo preview, que é mais rápido e não exige janela nova.

## 9. Quando algo falhar

| Sintoma | O que é | O que fazer |
|---|---|---|
| O preview recusa iniciar dizendo que não há pacote | Clone sem build | `npm run build` |
| O build para com tamanho e teto | O pacote da tela passou do limite | Ver o que entrou; a poda dos conjuntos de cor é a primeira suspeita |
| A suíte de conteúdo falha nomeando caminhos | Algo novo entrou no pacote | Ou o caminho não devia entrar, e a lista de conteúdo o exclui, ou devia, e a lista prevista muda junto |
| O painel aparece sem estilo no preview | A folha não foi servida ou a política recusou | Olhar o console do navegador: violação de política aparece nomeada ali |
| A porta está ocupada | Outro preview aberto | `npm run preview -- --porta 8779` |
