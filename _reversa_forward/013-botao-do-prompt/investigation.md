# Investigação: botão do prompt de correção na fonte

> Identificador: `013-botao-do-prompt`
> Data: `2026-09-20`
> Roadmap: `_reversa_forward/013-botao-do-prompt/roadmap.md`

## 1. A pesquisa que decidiu a feature

A investigação desta feature não foi bibliográfica: foi medição sobre o próprio disco, e o resultado
inverteu a recomendação que o requirements trazia na sua primeira versão. Fica registrado com o método,
porque o número sozinho não persuade ninguém dentro de seis meses.

**Método.** Um script de uso único aplicou, sobre os 64 projetos com `.reversa/state.json` em `~/dev`,
as duas regras do esquema que `src/domain/discovery-state.ts` aplica, mais o mapa de equivalências já
promovido em `src/domain/equivalencias.ts`, e separou os checkpoints que restam em
`conclusao-nao-declarada`. Para cada um deles, apurou três coisas: o que `camposComLista` devolveria, o
que os campos fora do esquema com valor escalar contêm, e o que `scripts/equivalencias/elidir.js`
produziria.

**Resultado.** 229 checkpoints, três na situação que interessa, um por projeto. E o achado que decidiu
tudo: **`camposComLista` se cala nos dois casos em que o campo culpado é o que resolve o caso**. Ela só
reporta campo cujo valor é lista de textos, e só quando `files` está ausente; o `scout` tem `files`, e
o `archaeologist` só tem campos que o esquema conhece.

| Caso | O que chegaria ao prompt sem campo novo | O que o conserto exige saber |
|---|---|---|
| `TECH+` / `redator_progress` | `items_completed`, `items_pending` | `items_done: 3` de `items_total: 6` |
| `ps-iagerasmlk` / `scout` | nada | `timestamp: "2026-05-03T12:10:19Z"` |
| `transc_audio_mlx` / `archaeologist` | nada | `modules_pending` presente e vazio |

Dito de outro modo: a alternativa barata produziria, em dois de três casos, um prompt que diz apenas
"este agente não declarou conclusão", que é justamente o que o painel já mostra na tela. O prompt
existiria sem servir.

## 2. Alternativas avaliadas, e por que caíram

### 2.1 Para o insumo do prompt

| Alternativa | Por que caiu |
|---|---|
| Compor com o que o eixo já entrega, e mandar o harness abrir o arquivo | Cega em dois dos três casos. O arquivo está de fato na máquina de quem cola, mas um prompt que não nomeia o campo transfere ao harness o trabalho de descobrir do que se trata, e era esse trabalho que a feature vinha eliminar |
| Carregar apenas os campos fora do esquema, com valor elidido | Cobre dois dos três. O `archaeologist` não tem campo fora do esquema: o defeito dele é `modules_pending` **vazio**, que é campo canônico, e sinalizá-lo exigiria um booleano à parte. Regra nova, suíte nova, e um caso a menos coberto que a opção escolhida |
| Carregar o checkpoint bruto, sem elidir | Publica caminho de scratchpad com identificador de sessão, achados que descrevem sistema de cliente e listas de arquivos do projeto num texto destinado a um modelo. A 012 já recusou isso para um motor local; recusar para um destino possivelmente remoto é a mesma recusa, com mais razão |
| Recompor a forma na tela, a partir do bruto atravessando o canal | Faz o conteúdo cruzar a fronteira para ser descartado do outro lado. Elidir na leitura deixa a promessa verificável no lugar onde ela é feita |

### 2.2 Para a unicidade do texto

O problema é concreto: duas implementações, uma compilada no pacote e outra carregada por `node` sem
construir. Quatro caminhos foram considerados.

| Alternativa | Por que caiu |
|---|---|
| Um gabarito em `.md` lido pelas duas partes | A webview não lê disco, e não vai passar a ler. Impossível, não indesejável |
| A webview importando de `scripts/` | Rompe a fronteira que `tests/webview-boundaries.spec.ts` prende e sujaria o empacotamento, que `tests/webview-build.spec.ts` mede |
| O comando importando a saída compilada em `out/` | Obriga a construir antes de rodar manutenção. Um comando de diagnóstico que exige build funcional é um comando que não serve quando mais se precisa dele |
| Duas implementações presas por suíte de paridade | **Escolhida.** É o preço da fronteira, e o repositório já o paga duas vezes, com precedente documentado em `src/domain/limits.ts` sobre `scripts/limites.js` |

### 2.3 Para o lugar do botão

Pesou um fato medido e não uma preferência: **nenhuma raiz acumula mais de um caso**, de modo que o
prompt do cabeçalho e o prompt por linha de checkpoint produziriam hoje textos idênticos. Diante de
duas opções equivalentes no resultado, venceu a mais barata, que reaproveita o auxiliar `Action`, o
par de destinos e a confirmação em linha, e não exige porta nova atravessando `App` e
`DiscoverySection`. A opção da linha fica anotada, não recusada: no dia em que um projeto acumular
vários casos, um prompt por caso passa a dizer algo que o do conjunto não diz.

### 2.4 Para o caso de vários projetos

O painel observa uma raiz por leitura, e `src/host/root.ts` escolhe a primeira instalada. Enxergar
além dela é a OQ-01 da spec da ponte, ainda não decidida, e seria feature própria com seletor na tela.
Ao mesmo tempo, o caso real de hoje são três projetos distintos, e o texto manual os reuniu. A saída foi
notar que a varredura já existe: `scripts/aprender-equivalencias.js` tem `lerEstados`, que percorre os
`state.json` de uma raiz resolvendo o til e nomeando o projeto. Um comando de manutenção sobre ela
custa pouco, não toca o painel e não antecipa a OQ-01.

## 3. Padrões do repositório que a feature aplica

Nenhum deles é importado de fora: são precedentes internos, e citá-los é mais forte do que citar
literatura, porque a suíte que os prende está no repositório.

| Padrão | Onde já vive | Como esta feature o usa |
|---|---|---|
| Composição de texto por função pura na tela, viajando pronto ao host | `src/webview/domain/summary.ts` | `prompt.ts` é irmão dele, com a mesma exigência de determinismo e a mesma nota sobre os dois destinos |
| Crescimento do contrato por acréscimo no fim, opcional | Features 004 a 012, e `tests/host-protocol.spec.ts` que o prende | `formaElidida` entra como sexto campo de `CheckpointState` |
| Ausente, vazio e nulo são três estados distintos | Features 008 em diante | `undefined` é forma não lida, `null` é situação que não pede forma, objeto é forma lida |
| Uma apuração, um consumidor de cada fato | `src/webview/domain/anomalies-view.ts`, escrito na 011 para acabar com duas somas do mesmo fato | A disponibilidade do botão e o conteúdo do texto saem da mesma função |
| Duplicação declarada, presa por suíte | `src/domain/limits.ts` e `scripts/limites.js`, com `tests/limites.spec.ts` | A elisão e o texto do prompt, cada um com a sua paridade |
| Transcrição confrontada com a origem, em vez de confiada | `src/heranca/reversa-domain/tests/hook-parity.spec.ts` | A suíte de paridade carrega as duas implementações e compara a saída |
| Ferramenta de manutenção fora do `build` e fora do pacote | Os quatro `estragar:*`, o preview e os dois comandos da 012 | `npm run prompt:harness` |
| Aprovar é marcar, e a decisão de gente não se revisita por acidente | Feature 012, em `propostas/equivalencias.md` | O prompt ignora o que foi reconhecido por par aprovado e as chaves aprovadas como registro |

## 4. Fontes externas

Nenhuma consultada, e a ausência é informativa. A feature não introduz biblioteca, formato de terceiro,
protocolo de rede nem integração: ela compõe texto a partir de dado já lido e o entrega a duas portas
que existem desde a feature 006. As duas normas que o texto cita são internas ao Reversa, o
`checkpoint-guide.md` e o `state-schema.md`, e é delas que sai a afirmação de que `completed_at` com
`files` é o par que declara conclusão.

## 5. O que ficou anotado para depois

- Um prompt por linha de checkpoint, quando algum projeto acumular vários casos na mesma raiz.
- O seletor de raízes da OQ-01 da ponte, que tornaria o comando de manutenção dispensável.
- A causa na fonte, que é a correção do `SKILL.md` do Reversa. Está deliberadamente fora desta feature:
  o prompt pede a proposta, e aplicá-la é ato humano num repositório que não é este.

## 6. Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-09-20 | Versão inicial gerada por `/reversa-plan` | reversa |
