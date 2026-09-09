# Onboarding: painel do processo

> Identificador: `003-painel-do-processo`
> Data: `2026-09-09`
> Roadmap: `_reversa_forward/003-painel-do-processo/roadmap.md`

Passo a passo para quem vai verificar esta feature pela primeira vez, ou para você mesmo daqui a
alguns meses. Os passos 1 a 9 rodam em qualquer ambiente, inclusive num contêiner sem interface
gráfica. Os passos 10 a 15 exigem uma máquina onde o editor tenha janela, e é por isso que estão
separados: foi exatamente essa fronteira que travou a última ação da feature anterior.

## Antes de começar

Você precisa de Node instalado e do repositório clonado. Nada mais: não há serviço para subir, não
há credencial para configurar e não há rede envolvida em tempo de execução. A instalação de
dependências, essa sim, pede rede uma vez, porque esta feature acrescenta a biblioteca de interface,
os tokens do sistema de design e o empacotador.

```bash
cd dev/reversa-views
npm install
```

## Parte 1, verificação sem interface gráfica

### 1. Confirmar que as duas unidades de compilação estão separadas

```bash
npm run typecheck        # o host, em Node
npm run check:webview    # a webview, em navegador
```

Ambos devem terminar sem saída de erro. O segundo comando é a prova de RF-23: ele roda com a lista
de tipos ambientais vazia, e é isso que faz a webview recusar módulo de plataforma.

### 2. Provar que a fronteira recusa o que deve recusar

Acrescente temporariamente, em qualquer arquivo de `src/webview/`, a linha abaixo.

```ts
import { readFileSync } from 'node:fs'
```

Rode `npm run check:webview` de novo. Ele deve falhar dizendo que não encontra o módulo. Desfaça a
alteração antes de seguir. Se ele passar, a separação não está de pé, e nada abaixo tem valor.

### 3. Rodar a suíte inteira

```bash
npm test
```

Espere verde em tudo, sem pulos. A suíte cobre quatro grupos: o modelo e a sonda herdados da feature
001, o host da feature 002, as funções puras desta feature e a marcação que os componentes produzem.

### 4. Conferir a cobertura das funções de decisão

O requisito exige 100% de linhas nas seis funções puras, e apenas nelas. Componentes não entram nessa
conta.

```bash
npx vitest run --coverage --coverage.include='src/webview/domain/**'
```

As seis são as de D-10: estado de entrada, razões de bloqueio, rótulo de estágio, rótulo de fase,
ordem das seções e recolhimento inicial.

### 5. Construir host e webview

```bash
npm run build
```

Ao fim, a pasta de saída deve conter o host compilado e o bundle da webview. Confira:

```bash
ls out/extension.js out/res/webview/
```

### 6. Ler o relatório da poda de tokens

A construção imprime uma linha dizendo quantos conjuntos de cor foram podados e quanto sobrou. Os
quatro conjuntos inteiros pesam cerca de 486 KB; podados, a medida de referência deste plano é de
21 KB, com vinte e seis tokens retidos por conjunto. Um número muito maior significa que a folha do
painel passou a nomear muito mais tokens, o que é legítimo mas merece olhada; zero interrompe a
construção por desenho, conforme D-16.

### 7. Medir o tamanho do bundle

O orçamento é de 400 KB. A verificação que interrompe a construção pertence à feature 005; aqui a
medida é manual e fica registrada em `progress.jsonl`.

```bash
du -h out/res/webview/*
```

### 8. Ver a marcação que o painel produz, sem editor

Este é o substituto da captura de tela nesta feature. A suíte de renderização já faz as asserções,
mas ler a marcação com os próprios olhos é o que revela ordem estranha e texto ausente.

```bash
npx vitest run tests/webview-render.spec.ts --reporter=verbose
```

Confira dois pontos que a revisão de 2026-09-09 fixou: em leitura íntegra, política, anomalias e
relatório da sonda saem recolhidos com a contagem no título; em leitura degradada, a de anomalias sai
expandida junto das duas de núcleo.

### 9. Confirmar que o corpo provisório sumiu

```bash
test -f src/host/provisional.ts && echo "ainda existe, algo ficou para trás" || echo "removido, como previsto"
grep -rn "provisional" src tests || echo "nenhuma menção restante"
```

## Parte 2, verificação no editor, com interface gráfica

Esta parte não roda em contêiner sem janela. O executável remoto do editor não aceita carregar
extensão em desenvolvimento, e foi esse o motivo do bloqueio registrado na feature 002. Faça numa
máquina com o editor instalado.

### 10. Abrir a janela de desenvolvimento

Abra o repositório no editor e inicie a sessão de depuração da extensão. A janela nova abre com a
extensão carregada a partir da pasta de saída, e é nela que tudo abaixo acontece.

### 11. Abrir o painel

Clique no ícone do Reversa na barra de atividades. Sem executar comando algum, o painel deve chegar
preenchido: cabeçalho com projeto, versão, raiz observada e momento da leitura.

### 12. Percorrer a ordem e o recolhimento inicial

Confira, de cima para baixo: faixa de bloqueio quando houver, ciclo forward, descoberta, política,
anomalias e relatório da sonda. As três últimas devem começar recolhidas, com a contagem no título,
a menos que a leitura tenha degradado, caso em que a de anomalias começa aberta.

### 13. Exercitar a faixa de bloqueio

Neste repositório, a feature 002 está pausada com uma ação aberta e a 003 tem dúvidas resolvidas, de
modo que a faixa pode não aparecer. Para vê-la, aponte o editor para um projeto cuja feature ativa
tenha todas as ações fechadas e nenhum adendo. A razão deve trazer o texto, o artefato clicável e o
comando copiável.

### 14. Exercitar a navegação e o aviso

Clique no nome de um artefato: ele abre no editor. Depois renomeie esse arquivo fora do editor e
clique de novo: o painel deve mostrar o aviso nomeando o arquivo, sem perder o conteúdo da tela e sem
abrir caixa de diálogo.

### 15. Trocar o tema

Recolha uma seção, troque o tema do editor para um dos dois de alto contraste e volte. O painel deve
repintar sem releitura, e a seção deve continuar recolhida. Oculte e reexiba o painel: a preferência
sobrevive. Este é o passo que a suíte não faz por você: aqui ela prova o mapeamento e a folha, e a
repintura mesmo só se vê com janela.

## Onde olhar quando algo der errado

| Sintoma | Primeiro lugar a olhar |
|---|---|
| Painel em branco dentro do editor | Ferramentas de desenvolvimento da webview, aba de console: violação de política aparece ali e em nenhum outro lugar |
| Painel preso em "carregando" | Canal de saída `Reversa Views`: se a mensagem de pronto não chegou, o host registra a retenção |
| Estilo ausente, tela sem medidas | Endereço da folha no corpo do documento, e a lista de origens de recurso permitidas na ativação |
| Tela com estrutura certa e cores erradas | Relatório da poda na saída da construção, e os atributos de tema no elemento raiz: o conjunto pedido precisa estar entre os quatro importados |
| Clique em artefato sem efeito | Canal de saída: recusa de caminho é registrada antes de qualquer chamada ao editor |
| Suíte verde e tela errada | Limitação conhecida e declarada: a renderização em servidor não prova estilo nem foco; isso é o preview da feature 005 |
