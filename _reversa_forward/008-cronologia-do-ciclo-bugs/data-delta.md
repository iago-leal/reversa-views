# Delta de dados: cronologia do ciclo de bugs

> Identificador: `008-cronologia-do-ciclo-bugs`
> Data: `2026-09-10`
> Modelo extraído: `_reversa_sdd/sdd/leitura-do-processo.md`, `_reversa_sdd/sdd/painel-do-processo.md`
> Confidência: 🟢 CONFIRMADO, 🟡 INFERIDO, 🔴 LACUNA

## 1. O que muda, em uma frase

🟢 Nada persistido muda, porque a extensão não escreve. O que entra é modelo em memória, derivado de
arquivos que outro agente escreveu, mais um nome válido a mais na única coisa que o painel guarda.

## 2. Nada de persistente muda

| Depósito | Mudança | Observação |
|---|---|---|
| Arquivos do projeto | nenhuma | RN-08 mantém a proibição de escrever, em camada alguma |
| `_reversa_bugs/` | nenhuma | O painel lê `bug.md` e `DONE.md` e não regenera projeção, não grava trava e não corrige inconsistência |
| Estado guardado da tela | um nome a mais | `bugs` passa a ser nome de seção válido na preferência de recolhimento |

🟢 A preferência já tolera o que não reconhece: `readPreferences` descarta nome de seção
desconhecido, de modo que preferência gravada por versão anterior continua válida, e preferência
gravada por esta versão não quebra a anterior.

## 3. Campos lidos do registro, e os que ficam de fora

🟢 Lidos, todos escalares de topo do front matter do `bug.md`:

| Campo | Forma no arquivo | Uso no bloco |
|---|---|---|
| `id` | `BUG-<AAAAMMDD>-<sufixo>` | Identificador da linha e alvo do clique que abre o arquivo |
| `display_number` | inteiro | Apelido humano, ao lado do identificador |
| `title` | texto de uma linha | Título da linha |
| `status` | `open`, `active`, `resolved` | Estado, contagem e metade da ordem |
| `phase` | uma das dez do schema | Fase, e uma das três condições de bloqueio |
| `severity` | `critical`, `high`, `medium`, `low` | Rótulo, e uma das três condições de bloqueio |
| `priority` | `P0` a `P3` | Rótulo |
| `created` | data | Data de registro |
| `updated` | data | Data da última alteração, e o que ordena |
| `visibility` | `normal`, `internal`, `restricted` | Filtro de RN-02, aplicado antes do canal |
| `blocking` | lista | Apenas vazia ou não vazia, que é a condição de bloqueio declarado |

🟢 Lido do `DONE.md`: a data escrita na linha `Data:`. A presença do arquivo é o fato do encerramento;
a linha é a data dele.

🟢 Fora, deliberadamente: `origin`, `area`, `module`, `feature`, `labels`, `security_suspected`,
`reproduction`, `relationships`, `traceability`, `spec_verdict`, `change_set`, `closure`,
`resolution_kind` e todo bloco opcional. Nada em `generated/`, nada em `intake/`, nada em
`inspections/`, nada do corpo em Markdown do `bug.md`.

🟡 `resolution_kind` é o campo mais provável de ser pedido depois, porque o `graph.html` do registro o
mostra ao lado da trava. Fica de fora agora porque RF-04 e RF-05 não o pedem, e o custo de
acrescentá-lo depois é uma linha no interpretador restrito.

## 4. Formas novas em memória

### 4.1 A entrada de um bug

🟢 Todo campo pode faltar, e faltar é diferente de estar vazio: o que não foi lido é declarado
ausente por nome, nunca desenhado em branco.

| Campo | Forma | Significado |
|---|---|---|
| `pasta` | texto | Caminho da pasta do bug, relativo à raiz observada |
| `arquivo` | texto | Caminho do `bug.md`, que é o que a mensagem de abrir arquivo recebe |
| `id` | texto ou nulo | O identificador canônico |
| `apelido` | número ou nulo | `display_number` |
| `titulo` | texto ou nulo | |
| `estado` | um dos três, ou nulo | Nulo quando ausente |
| `estadoBruto` | texto ou nulo | O valor como veio, inclusive quando não reconhecido |
| `fase` | uma das dez, ou nulo | |
| `faseBruta` | texto ou nulo | |
| `severidade` | uma das quatro, ou nulo | |
| `prioridade` | uma das quatro, ou nulo | |
| `registrado` | data ou nulo | `created` |
| `alterado` | data ou nulo | `updated` |
| `travado` | verdadeiro ou falso | Presença de `DONE.md` |
| `encerrado` | data ou nulo | Data escrita na trava; nulo com trava presente significa trava sem data |
| `bloqueado` | verdadeiro ou falso | `blocking` com ao menos um item |
| `inconsistencia` | `resolvido-sem-trava`, `trava-sem-resolvido` ou nulo | RN-04: declarada, jamais resolvida |

🟢 O par valor reconhecido e valor bruto repete o padrão de `Label`, que a tela já usa: o painel
desenha o que leu e marca como não reconhecido o que não conhece, em vez de fingir que leu.

### 4.2 O grupo de um contexto

| Campo | Forma | Significado |
|---|---|---|
| `contexto` | texto | Nome da pasta do contexto, que é como o registro se organiza |
| `pasta` | texto | Caminho do contexto, relativo à raiz observada |
| `bugs` | lista de entradas | Já sem os restritos |
| `contagem` | total, abertos, ativos, resolvidos, restritos | Do contexto, nunca do projeto |
| `ultimoMovimento` | data ou nulo | A maior data de alteração do grupo, que ordena os grupos |

### 4.3 O registro do projeto

| Campo | Forma | Significado |
|---|---|---|
| `presente` | verdadeiro ou falso | Falso quando não há pasta de registro, que RF-13 manda nomear |
| `contextos` | lista de grupos | |
| `contagem` | total, abertos, ativos, resolvidos, restritos | Do projeto inteiro |
| `lidos` | número | Quantos bugs a passagem chegou a ler |
| `truncado` | verdadeiro ou falso | Verdadeiro quando o teto cortou a varredura |
| `anomalias` | lista | O que a leitura perdeu, com arquivo, código e detalhe |

🟢 `contagem.total` é a autoridade de RN-05 e conta o que existe no disco, restritos inclusive.
`lidos` conta o que a passagem leu. Onde os dois divergirem, a divergência é declarada, que é a
mesma regra que a decomposição aplica entre a contagem herdada e as linhas que lista.

### 4.4 Códigos de anomalia do registro

🟢 União local, em `src/domain/types.ts`, com a mesma forma de `Anomaly` do pacote herdado: arquivo,
código e detalhe opcional.

| Código | Quando |
|---|---|
| `bug-sem-front-matter` | O arquivo existe e não tem o bloco entre marcas |
| `front-matter-ilegivel` | O bloco existe e não pôde ser lido, truncado inclusive |
| `bug-sem-identificador` | O bloco foi lido e não trouxe `id` |
| `estado-de-bug-desconhecido` | `status` fora dos três |
| `fase-de-bug-desconhecida` | `phase` fora das dez |
| `severidade-de-bug-desconhecida` | `severity` fora das quatro |
| `data-de-bug-invalida` | `created`, `updated` ou a data da trava fora da forma de data |
| `trava-sem-data` | `DONE.md` presente e sem linha de data |
| `bug-inconsistente` | As duas assimetrias de RN-04, com o detalhe dizendo qual |
| `bug-ilegivel` | O `bug.md` não pôde ser lido: ausente, sem permissão ou acima do teto de bytes |

🟢 A união é local, e não um acréscimo ao vocabulário fechado do pacote herdado, porque estender
aquele custaria adaptação declarada em `src/heranca/PROCEDENCIA.md` e conflito na próxima
ressincronização. A seção de anomalias passa a receber a forma estrutural comum, que é arquivo,
código como texto e detalhe opcional, e desenha as duas origens na mesma lista.

🟡 O painel passa a conhecer o vocabulário de estado, fase e severidade do registrador, que é
declarado no schema do `/reversa-debugger`. A autoridade continua sendo aquele schema: aqui o
vocabulário só decide o que é rótulo conhecido, e o valor que não estiver na lista é desenhado cru e
marcado como não reconhecido.

## 5. Limites novos

| Nome | Valor | Onde | Razão |
|---|---|---|---|
| `BUG_CAP` | 50 | `src/domain/limits.ts` | Mesmo teto de pastas de feature e de adendos, pela mesma razão: uma leitura do painel não pode virar caminhada ilimitada pelo disco |
| `BUGS_FOLDER` | `_reversa_bugs` | `src/domain/limits.ts` | O literal existe também em `policy.ts` do pacote herdado, que não o exporta. A duplicação é aceita e declarada: editar vendorizado custaria adaptação e conflito |

🟢 O teto de bytes por arquivo continua sendo o herdado, 256 KiB, e um `bug.md` acima dele vira
anomalia, não exceção.

## 6. O que a leitura não faz

🟢 Não desce em `generated/`, `intake/` nem `inspections/`. A varredura entra em cada contexto,
desce apenas em `bugs/`, e em cada pasta de bug lê os nomes uma vez, o que responde de uma só
passagem onde está o `bug.md` e se há `DONE.md`.

🟢 Não usa a data de modificação do arquivo, nem para exibir nem para desempatar, porque ela muda por
motivo alheio ao bug, como uma cópia ou uma regeneração.

🟢 Não escreve, não executa processo e não fala com rede.
