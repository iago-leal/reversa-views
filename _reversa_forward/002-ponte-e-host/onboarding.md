# Onboarding: ponte e host da extensão

> Identificador: `002-ponte-e-host`
> Data: `2026-09-09`
> Roadmap: `_reversa_forward/002-ponte-e-host/roadmap.md`
> Para quem: o mantenedor que vai verificar a feature pela primeira vez, ou que retorna meses depois

Este roteiro vale **depois** do `/reversa-coding`. Antes disso os passos 4 em diante falham, porque
o código ainda não existe.

## 1. Pré-requisitos

- Node 20 ou mais recente e npm, os mesmos da feature 001.
- O VS Code instalado na máquina, com o comando `code` disponível no caminho de execução. Confira
  com `code --version`. Se o comando não existir, o passo 6 tem alternativa.
- Este repositório clonado. A árvore `dev/vscode-kanban` **não** é necessária: dela veio decisão de
  desenho, não código.

## 2. Instalar as dependências pelo arquivo de trava

```
cd dev/reversa-views
npm ci
```

Quatro dependências de desenvolvimento devem ficar instaladas, as três da feature 001 e a tipagem
da interface do editor, em 1.78.0. Use `npm ci` e não `npm install`, pelo mesmo motivo de sempre: o
primeiro obedece ao arquivo de trava e falha se ele estiver desatualizado, o segundo o reescreve em
silêncio.

## 3. Verificar tipos e rodar a suíte

```
npm run typecheck
npm test
```

A verificação de tipos precisa passar **antes** de qualquer coisa: é ela que prova que a tipagem do
editor foi encontrada, o que depende do arranjo `types` do compilador incluir `vscode`. Se aparecer
erro dizendo que o módulo `vscode` não foi encontrado, é esse o campo a olhar, e não a instalação.

A suíte deve fechar com as dezenove suítes herdadas da feature 001 mais as nove desta, todas verdes.

## 4. Compilar o host

```
npm run compile
```

O resultado é a pasta `out/`, com `out/extension.js` no lugar que o manifesto aponta. Confira:

```
ls out/extension.js out/host/
```

## 5. Conferir as duas fronteiras por busca

Dois requisitos desta feature se verificam lendo o próprio código, e as suítes já os cobrem. Vale
repetir à mão na primeira vez, porque é assim que se entende o desenho:

```
grep -rn "from 'vscode'" src/ --include='*.ts' | grep -v "import type"
grep -rn "postMessage\|onDidReceiveMessage" src/host/
```

A primeira busca deve encontrar exatamente dois arquivos, `src/extension.ts` e
`src/host/adapters.ts`. A segunda deve encontrar exatamente uma chamada de envio e um registro de
ouvinte, ambos em `src/host/bridge.ts`.

## 6. Abrir o editor de desenvolvimento

```
code --extensionDevelopmentPath="$PWD" "$PWD"
```

Uma segunda janela do editor abre com a extensão carregada a partir de `out/`. Não há configuração
de depuração neste repositório, e a ausência é deliberada: ela é RF-11 da spec de empacotamento e
pertence à feature 005.

Sem o comando `code` disponível, use o menu do próprio editor, em Executar, e a opção de iniciar
depuração após criar uma configuração de extensão. Isso serve para verificar, mas **não** crie o
arquivo de configuração no repositório, para não antecipar escopo da feature 005.

## 7. O caminho feliz

1. Na janela nova, olhe a barra de atividades, a coluna de ícones à esquerda. Um ícone novo deve
   estar lá, sem que você tenha executado comando algum. Isso é RF-01.
2. Clique nele. O painel abre e, em menos de um segundo, imprime o processo deste próprio
   repositório, que tem Reversa instalado.
3. Confira que o texto impresso traz os três campos de RF-13: o processo, o relatório da sonda com
   `workspace`, `featureDir`, `refusals` e `truncated`, e o momento da leitura.

## 8. Os dois botões

O documento desta feature é provisório e feio de propósito: ele existe para provar o canal, e a
feature 003 o substitui pelo painel de verdade.

1. Clique em reler. O momento da leitura muda, o que prova que a volta funciona.
2. Clique em abrir arquivo. O arquivo apontado abre no editor, o que prova o outro caminho de volta.

## 9. O comando de paleta

Abra a paleta de comandos e execute o comando de releitura da extensão. O resultado precisa ser
idêntico ao do botão, e é isso que RF-07 exige.

Faça também a variante que a documentação da interface obriga a tratar: recolha o painel para outra
visão, execute o comando pela paleta e volte. A releitura deve acontecer no retorno, e o canal de
saída deve registrar a postergação com o motivo. Não se envia mensagem a webview oculta, e o
desenho contorna isso marcando pendência em vez de perder o pedido.

## 10. O canal de saída

Abra o painel de saída do editor e escolha o canal da extensão. Ele deve existir com nome próprio,
conforme RF-11, e conter ao menos as linhas das leituras que você acabou de disparar.

Deixe-o aberto para os próximos passos: é nele que aparecem as rejeições.

## 11. Os casos de borda

| O que fazer | O que esperar | Requisito |
|---|---|---|
| Abrir uma janela do editor sem pasta alguma, com a extensão carregada | O painel mostra o estado de sem diretório, e o canal de saída não registra leitura | RF-15, EC-01 |
| Abrir uma pasta qualquer que não tenha `.reversa/` | O painel mostra o processo marcado como não instalado, com o estado de sem Reversa | cenário 13 do `requirements.md` |
| Adicionar uma segunda raiz ao workspace, sem Reversa na primeira e com Reversa na segunda | O painel nomeia a segunda como observada e a primeira como ignorada | RF-04, RN-05 |
| Alternar para outra visão e voltar, com o painel já preenchido | Nenhuma leitura nova no canal de saída, e o conteúdo permanece | RF-10 |
| Apagar o arquivo que o painel aponta e clicar para abri-lo | Um aviso nomeando o arquivo, sem notificação do editor | EC-05, RN-09 |

Os dois casos que não dá para provocar pela tela, o comando desconhecido e o comando reservado de
despacho, estão cobertos pelas suítes do roteador. Se quiser vê-los à mão, o caminho é o console de
desenvolvimento do webview, enviando o envelope diretamente.

## 12. O que ainda não funciona, e por quê

| Ausência | Onde ela mora |
|---|---|
| Painel de verdade, com fases, estágio e artefatos | feature 003 |
| Manifesto de herança, verificador e ressincronizador | feature 004 |
| Comando de build, VSIX, preview fora do editor e configuração de depuração | feature 005 |
| Observação automática do disco | decisão adiada, premissa 2 do `ideation.md` |
| Botão que dispara agentes | decisão adiada, seção 10 do PRD; o comando existe reservado no protocolo |

## 13. Como desfazer

Feche a janela de desenvolvimento. Nada foi instalado, nada foi escrito no workspace e nenhuma
preferência do editor mudou. `rm -rf out/` devolve o repositório ao estado anterior à compilação, e
a pasta já é ignorada pelo versionamento.
