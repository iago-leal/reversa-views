# Contrato: o registro de bugs em disco

> Identificador: `008-cronologia-do-ciclo-bugs`
> Data: `2026-09-10`
> Tipo: arquivo, consumido apenas para leitura
> Contrato de origem: `_reversa_bugs/README.md` e `.claude/skills/reversa-debugger/references/bug-schema.md`
> Confidência: 🟢 CONFIRMADO, 🟡 INFERIDO, 🔴 LACUNA

## 1. O que este documento é

🟢 O que a extensão lê do registro de bugs, e o que ela faz quando o que encontra não é o que
esperava. O contrato é de outro agente, o `/reversa-debugger`, e este documento não o define: apenas
declara a fatia consumida e o comportamento diante de cada desvio.

🟢 A relação é de mão única. A extensão lê e nunca escreve, nem para regenerar projeção, nem para
gravar trava, nem para corrigir a inconsistência que encontrar.

## 2. O que é lido

| Caminho | Papel | Confidência |
|---|---|---|
| `_reversa_bugs/` | Raiz do registro; ausente significa projeto sem registro, o que é estado nomeado e não anomalia | 🟢 |
| `_reversa_bugs/<contexto>/bugs/<ID>/bug.md` | Fonte de verdade de um bug; dele sai o front matter | 🟢 |
| `_reversa_bugs/<contexto>/bugs/<ID>/DONE.md` | Trava de encerramento; a presença é o fato, a linha `Data:` é a data | 🟢 |

🟢 Nada mais é aberto. `generated/`, `intake/`, `inspections/`, `evidence/`, `fix/`, `debate/`,
`README.md` e `taxonomy.yaml` não são lidos, e a varredura sequer desce neles.

## 3. Os campos consumidos

🟢 Do front matter, apenas escalares de topo: `id`, `display_number`, `title`, `status`, `phase`,
`severity`, `priority`, `created`, `updated`, `visibility`. De `blocking`, apenas se há item ou não.
A lista completa e o que fica de fora estão em `data-delta.md`, seção 3.

🟢 Do `DONE.md`, apenas a data escrita na linha `Data:`.

## 4. Como o front matter é lido

🟢 O bloco é o que estiver entre a primeira linha de três hifens e a próxima linha de três hifens no
começo do arquivo. Fora dele nada é lido.

🟢 O leitor é restrito por decisão declarada em D-02, e reconhece três coisas: chave e valor escalar
no nível de topo, lista vazia escrita em forma de fluxo, e lista com itens. Um valor entre aspas tem
as aspas removidas; um valor com dois-pontos no meio é preservado inteiro, porque o corte é no
primeiro separador.

🟢 O que ele deliberadamente não lê: bloco aninhado, lista de objetos, escalar de várias linhas e
âncora. Nenhum dos campos consumidos aparece nessas formas nos arquivos reais, e um campo consumido
que apareça numa delas é tratado como não lido, o que gera anomalia em vez de valor inventado.

## 5. Comportamento diante de cada desvio

| Desvio | O que a extensão faz | Confidência |
|---|---|---|
| `_reversa_bugs/` ausente | Declara que não há registro neste projeto; nenhuma anomalia | 🟢 |
| Contexto sem pasta `bugs/`, ou com ela vazia | Declara o contexto sem bug; nenhuma anomalia | 🟢 |
| `bug.md` ausente, ilegível ou acima do teto de bytes | Anomalia `bug-ilegivel`; o bug não entra na lista e o resto é desenhado | 🟢 |
| Arquivo sem o bloco de front matter | Anomalia `bug-sem-front-matter` | 🟢 |
| Bloco truncado ou ilegível | Anomalia `front-matter-ilegivel` | 🟢 |
| Sem `id` | Anomalia `bug-sem-identificador`; a linha é desenhada pela pasta | 🟢 |
| `status`, `phase` ou `severity` fora do vocabulário | Anomalia própria; o valor é desenhado cru e marcado como não reconhecido | 🟢 |
| Data fora da forma de data | Anomalia `data-de-bug-invalida`; a linha declara a data ausente | 🟢 |
| `DONE.md` sem linha de data | Anomalia `trava-sem-data`; o encerramento continua sendo fato | 🟢 |
| `status: resolved` sem trava, ou trava sem `status: resolved` | A inconsistência é declarada na linha e vira anomalia `bug-inconsistente`; o painel não escolhe entre as duas leituras | 🟢 |
| `visibility: restricted` | O bug é contado no total e não atravessa o canal; o bloco declara que há registro omitido | 🟢 |
| Mais de cinquenta bugs | A varredura para no teto; o bloco informa quantos existem e quantos foram lidos | 🟢 |

## 6. O que este contrato deixa em aberto

🟡 O vocabulário de estado, fase, severidade e prioridade é do schema do `/reversa-debugger`, e o
painel passa a carregar uma cópia dele para decidir o que é rótulo conhecido. Se o schema crescer, o
painel desenha o valor novo cru e marcado como não reconhecido, que é degradação declarada e não
falha. Reconciliar as duas listas é trabalho de uma linha, e o lugar de registrar a necessidade é o
adendo que o `/reversa-sync` gerar.

🟡 `blocking` é consumido apenas como presença. Se um dia o painel precisar dizer **por que** um bug
está bloqueado, e não apenas que está, o leitor restrito precisa aprender item de lista com pares de
chave e valor. É acréscimo contido, e nada do que existe muda por causa dele.
