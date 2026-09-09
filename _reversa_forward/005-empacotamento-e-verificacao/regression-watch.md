# Regression watch: empacotamento e verificação

> Identificador: `005-empacotamento-e-verificacao`
> Data: `2026-09-09`
> Âncora: **greenfield**. Sem extração de legado, não há regra 🟢 a vigiar, e o
> watch principal nasce vazio por isso.

## 1. Watch principal

| ID | Origem (arquivo, seção) | Regra esperada após mudança | Tipo de verificação | Sinal de violação |
|----|--------------------------|------------------------------|---------------------|-------------------|

Vazio. Nenhuma regra 🟢 foi extraída de código existente neste projeto, de modo
que não há nada com peso de regressão a vigiar nesta rodada. Os itens abaixo
ganham esse peso quando uma `/reversa` futura rodar sobre este código e
confirmá-los como 🟢.

## 2. Observações, sem peso de regressão

O que a feature implementou, e que uma extração futura deve encontrar no código.
Os identificadores são estáveis e não serão reciclados. Eles continuam a numeração
da feature 004, que foi até W094, como as features anteriores fizeram entre si.

| ID | Requisito | O que se espera encontrar |
|----|-----------|---------------------------|
| W095 | RF-01, RF-03 | Um comando de empacotamento que gera o VSIX da pasta de saída e imprime, ao final, o conteúdo e o tamanho ao lado do teto |
| W096 | RF-02, RN-07 | `.vscodeignore` com exclusão universal na primeira regra e apenas reinclusões depois |
| W097 | RF-04, RN-09 | Publicador local no manifesto, marca de privado mantida, e nenhum campo que dependa de conta no Marketplace |
| W098 | RF-05 | Empacotador ausente termina o comando com a instrução de instalação, sem deixar arquivo parcial |
| W099 | RF-06, RF-17 | O preview serve o pacote real sob o documento real; nenhuma regra de leitura e nenhuma montagem de página declaradas dentro dele |
| W100 | RF-07 | Os cinco comandos do canal do painel produzem, no preview, o efeito que `002-ponte-e-host/interfaces/protocolo-webview.md` descreve |
| W101 | RF-08 | Os quatro temas escrevem no corpo a classe que `src/webview/theme/contrast.ts` reconhece |
| W102 | RF-09, RF-09a | Os três estados forçados respondem sem tocar disco, e o atraso é observado pelo servidor antes da resposta |
| W103 | RF-09b, RN-02 | Só o auxiliar do estado degradado escreve, e apenas em pasta temporária do sistema |
| W104 | RF-10, RF-18 | O README nomeia os sete estados com o comando de cada um, e leva do clone à extensão instalada |
| W105 | RF-11 | A faixa do preview nomeia preview, workspace, tema e estado forçado, e enumera os limites |
| W106 | RF-12, RN-03 | Escuta apenas em `127.0.0.1`, recusa origem estranha com 403, e porta ocupada sugere o argumento de porta |
| W107 | RF-13 | Sem o pacote da tela, o preview recusa iniciar e não abre porta |
| W108 | RF-14, RF-15, RN-06 | A guarda de tamanho interrompe o build com a medida e o teto, e os quatro números vivem só em `scripts/limites.js` |
| W109 | RF-16, RN-01 | A suíte fixa os catorze comandos do manifesto e confere o par entre alvo do navegador e versão mínima do editor |
| W110 | RF-19 | A configuração de depuração aponta para a pasta de saída e tem a construção como pré-tarefa |
| W111 | RF-20 | O modo de observação reempacota com mapa de fontes, sem abrir canal para o navegador |
| W112 | RF-21 | Uma suíte abre o pacote gerado e nomeia cada caminho que entrou sem estar previsto |
| W113 | RF-22 | As quatro medidas contra os tetos, com o método, registradas no progresso |
| W114 | RN-05 | Nenhum sinal de ambiente dentro do pacote da webview: o host fingido vive fora dele |
| W115 | RN-08 | O portão visual dos sete estados declarado no README como cumprido ou devido, sem ambiguidade |

## 3. Ponto sensível desta entrega

A extração de `src/host/session.ts` tirou a sequência de mensagens de dentro de
`src/host/provider.ts`, que era código estável desde a feature 002. As suítes do
provedor e das fronteiras passaram antes e depois sem alteração, e é essa
paridade que serve de prova. Quem reler isto depois de uma re-extração: se a
ordem das mensagens reaparecer duplicada dentro do provedor, ou dentro do
preview, a extração se desfez e RF-17 deixou de valer.

## 4. Histórico de re-extrações

Vazio. Será preenchido pelo agente reverso quando `/reversa` rodar sobre este
código.

## 5. Arquivadas

Vazia.

## Observações acrescentadas em 2026-09-09

| ID | Origem (arquivo, seção) | Regra esperada após mudança | Tipo de verificação | Sinal de violação |
|----|-------------------------|-----------------------------|---------------------|-------------------|
| W116 | `src/webview/theme/theme.css`, regra `body` | Nenhuma regra acima de `.panel` nomeia token dos conjuntos de cor, porque nenhum conjunto alcança essa altura | presença | Uma declaração `var(--fgColor-*)`, `var(--bgColor-*)` ou `var(--borderColor-*)` em `body`, `html` ou `#root` |
| W117 | `src/webview/theme/theme.css`, regra `.panel` | A raiz do painel fixa `background-color: var(--bgColor-default)` e `color: var(--fgColor-default)`, e preenche a visão | presença | Fundo ou texto herdado saindo de `.panel`, ou o elemento que carrega os atributos de tema deixando de ser o mesmo que pinta |
