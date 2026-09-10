# Investigação: cronologia do ciclo de bugs

> Identificador: `008-cronologia-do-ciclo-bugs`
> Data: `2026-09-10`
> Confidência: 🟢 CONFIRMADO, 🟡 INFERIDO, 🔴 LACUNA

## 1. O que esta investigação apurou

🟢 Três perguntas decidiam o desenho, e as três foram respondidas contra o repositório, não contra a
memória: quanto custa embarcar um interpretador de YAML no pacote, o que o registro de bugs de fato
escreve nos arquivos que o painel vai ler, e onde as regras já vigentes do painel obrigam o bloco
novo a se encaixar.

## 2. O custo de embarcar o interpretador de YAML

🟢 O pacote da extensão não contém árvore de dependências. Três fatos independentes confirmam isso e
convergem: `.vscodeignore` exclui tudo e reinclui apenas `out/**`, `media/**`, `package.json` e
`README.md`; `scripts/empacotar.js` chama o empacotador oficial com `--no-dependencies`, comentando
que "o projeto não tem dependência de produção"; e `scripts/conteudo-esperado.js` fixa os prefixos
`extension/out/` e `extension/media/` como o que pode existir dentro do pacote, com suíte que abre o
pacote gerado e recusa qualquer caminho fora deles.

🟢 O host é compilado por `tsc`, arquivo a arquivo, e não empacotado: `tsconfig.json` emite em `out/`
com `module: commonjs`. Uma importação de `yaml` no host resolveria em tempo de execução para
`node_modules`, que não viaja no pacote. Fazê-la viajar exigiria quatro mudanças coordenadas: mover
`yaml` para dependência de produção, retirar `--no-dependencies`, reincluir a árvore em
`.vscodeignore` e acrescentar prefixo em `scripts/conteudo-esperado.js`.

🟢 O tamanho medido em disco: `node_modules/yaml` ocupa 1,2 MB, dos quais 796 KB são a distribuição
em CommonJS. O teto do pacote da extensão é 2 MiB em `scripts/limites.js`, e a saída atual de `out/`
ocupa 596 KB. O acréscimo não estouraria o teto, mas gastaria mais de um terço da folga restante
para ler dez campos escalares.

🟡 A alternativa de empacotar o host com esbuild, que o projeto já usa para a tela, resolveria o
tamanho por sacudida de árvore, ao custo de trocar o regime de emissão do host inteiro. É mudança
maior que a feature, e fora do escopo dela.

🟢 A conclusão que virou D-02: interpretador próprio e restrito. O requisito não funcional de tamanho
do `requirements.md` já previa esta saída, e a apuração apenas confirmou que ela é a primeira, não a
última.

## 3. O que o registro de bugs escreve, de fato

🟢 O registro tem hoje um contexto, `painel-do-processo`, com três bugs, todos `resolved` e todos com
`DONE.md`. Os três front matters foram lidos na íntegra, e não por amostra.

🟢 Os dez campos que o bloco desenha são escalares de topo em todos eles: `id`, `display_number`,
`title`, `status`, `phase`, `severity`, `priority`, `created`, `updated` e `visibility`. Nenhum deles
aparece aninhado, e nenhum usa bloco escalar de várias linhas.

🟢 `blocking` aparece como lista vazia nos três, escrita em forma de fluxo, `blocking: []`. O schema
em `.claude/skills/reversa-debugger/references/bug-schema.md` mostra a forma cheia, com itens que
trazem `kind` e `reason` ou `target`. Como RF-10 nomeia a condição e não o texto dela, distinguir
lista vazia de lista com itens basta, o que reduz muito o interpretador.

🟢 O que o interpretador restrito precisa atravessar sem tropeçar, apurado nos arquivos reais: um
título com dois-pontos no meio; blocos aninhados profundos, como `traceability`, com listas de
objetos em forma de fluxo e escalares entre aspas; e uma chave `origin` cujo valor é um bloco. Nada
disso é campo que o bloco lê, mas tudo isso está entre as linhas que ele precisa atravessar.

🟢 `DONE.md` traz a data do encerramento na linha `Data: 2026-09-10` e o `resolution_kind` na linha
seguinte. É a única fonte da data de encerramento, o que sustenta D-14.

🟢 As invariantes que `_reversa_bugs/gerar-views.mjs` verifica ao regenerar as projeções incluem
exatamente as duas assimetrias que RN-04 manda o painel declarar: trava presente sem `status:
resolved`, e fechamento sem trava. O gerador para com erro; o painel, que não escreve, declara.

## 4. Onde o painel obriga o bloco a se encaixar

🟢 A ordem das seções vive em `SECTION_NAMES`, em `src/webview/domain/types.ts`, e `sections.ts` a
devolve intacta. `COLLAPSIBLE_SECTIONS` deriva dela por exclusão da faixa de bloqueio, de modo que o
nome novo entra nos cartões sem trabalho adicional. `DEFAULT_COLLAPSED` é lista própria, e é onde o
recolhimento padrão de RF-01 precisa ser escrito.

🟢 A preferência de recolhimento descarta nome de seção que não reconhece, em `readPreferences`, o
que torna o acréscimo do nome compatível com uma preferência gravada por versão anterior.

🟢 A barra de progresso já é componente próprio, `ProgressBar.tsx`, usada por três cartões desde a
feature 007, e o histórico já pratica o que RF-03 pede: medir sobre o total declarado, e não sobre as
entradas em vista.

🟢 A abertura de arquivo já tem via única, a mensagem `openFile` com caminho relativo à raiz
observada, e o histórico já a usa a partir de um botão com `data-action="open-file"`. RF-09 é reuso,
não construção.

🟢 A conversão de instante é centralizada em `brasiliaInstant`, com a nota explícita de que uma
segunda conversão em outro lugar acabaria mostrando o mesmo momento como dois. A data de RN-06 não é
instante, e é por isso que ela entra como função irmã no mesmo módulo, em vez de reusar aquela.

## 5. Alternativas avaliadas e descartadas

| Alternativa | Por que foi descartada |
|---|---|
| Consumir `generated/catalog.jsonl`, que já traz o registro em linhas de JSON | RF-11 proíbe. A projeção só existe depois que alguém a regenera, e o painel passaria a mostrar o passado sem dizer que é passado |
| Embarcar `yaml` como dependência de produção | Custo medido na seção 2, desproporcional a dez campos escalares |
| Reusar `brasiliaInstant` para as datas do registro | `new Date('2026-09-10')` é meia-noite em tempo universal, e a conversão para Brasília mostraria o dia anterior |
| Estender `AnomalyCode` do pacote herdado com os códigos do registro | Custaria adaptação declarada em `PROCEDENCIA.md` e conflito na próxima ressincronização, sem ganho sobre a união local |
| Filtrar o bug restrito na tela | O requisito não funcional de privacidade exige que o conteúdo não atravesse o canal, e não apenas que não seja desenhado |
| Um controle único de revelação para todos os grupos | O critério de aceitação exige que revelar um grupo não mexa nos outros |
| Guardar a revelação como preferência | Precedente de D-17 da feature 003: o que se abre para olhar agora não é escolha que sobreviva ao painel |

## 6. Padrões aplicáveis, já praticados nesta casa

🟢 **Sonda que olha e domínio que julga.** `probe/features.ts` lê e não decide; `domain/history.ts`
decide e não lê. A dupla nova repete o par, e é o que permite testar o julgamento sem disco.

🟢 **Uma função decide ordem e recorte.** A feature 007 corrigiu o defeito de selecionar por recência
e exibir por posição fundindo as duas responsabilidades em `decompositionView()`. O bloco nasce com a
fusão feita.

🟢 **Ordenação estável como contrato.** A ordenação da linguagem é exigida estável desde 2019, e o
comparador devolve zero em empate de propósito, para que a ordem de leitura sobreviva. RN-07 pede
exatamente isso, e o precedente é literal em `decomposition-view.ts`.

🟢 **Degradar em vez de falhar.** Toda perda vira anomalia com arquivo, código e detalhe, e a leitura
segue com o que conseguiu. É a regra de `_reversa_sdd/sdd/leitura-do-processo.md#11-edge-cases-e-tratamento-de-erros`.

🟢 **Contrato que só cresce.** Acrescentar campo é permitido; renomear e remover não. As features
004, 006 e 007 acrescentaram cinco campos e um comando sem quebrar tela antiga.

## 7. Fontes

| Fonte | O que sustenta |
|---|---|
| `_reversa_bugs/README.md` | Contrato do registro: fonte de verdade, ciclo de vida, trava, restrição de visibilidade |
| `.claude/skills/reversa-debugger/references/bug-schema.md` | Vocabulário completo de estado, fase, severidade, prioridade e visibilidade |
| `_reversa_bugs/gerar-views.mjs` | As invariantes que o gerador verifica, entre elas as duas assimetrias da trava |
| `_reversa_bugs/painel-do-processo/bugs/*/bug.md` | As três amostras reais de front matter que o interpretador precisa atravessar |
| `scripts/limites.js`, `.vscodeignore`, `scripts/conteudo-esperado.js`, `scripts/empacotar.js` | Tetos e composição do pacote, que sustentam D-02 |
| `src/webview/domain/types.ts`, `sections.ts`, `preferences.ts` | Ordem, cartões, recolhimento padrão e tolerância a nome desconhecido |
| `src/webview/domain/decomposition-view.ts` | O precedente de ordem, recorte e estabilidade |
| `src/probe/features.ts`, `src/domain/history.ts` | O par sonda e domínio, e o teto de pastas |
| `src/webview/domain/instants.ts` | A centralização da conversão, e por que a data fica fora dela |

Nenhuma fonte externa foi consultada: toda decisão desta feature se resolve dentro do repositório, e
buscar fora traria opinião onde já há evidência.

## 8. Apuração de implementação: o que o leitor restrito atravessa (T001)

🟢 Os três `bug.md` reais foram medidos linha a linha, e não lidos de relance. Os três têm bloco de
front matter entre marcas, com 86, 103 e 90 linhas, e exatamente **vinte e seis chaves de topo** em
cada um. Os dez campos que o bloco desenha estão todos entre elas, todos escalares, nenhum entre
aspas e nenhum em forma de bloco.

🟢 **`blocking` é lista vazia em forma de fluxo nos três**, escrita `blocking: []` na linha 29 de
cada arquivo. Distinguir `[]` de `[item]` é, hoje, a totalidade do que RF-10 pede desse campo.

🟢 **Seis a sete chaves de topo abrem bloco aninhado** em cada arquivo: `origin`, `reproduction`,
`relationships` (nos dois que a têm cheia), `traceability`, `change_set`, `change_risk` e `closure`.
Todas se apresentam como chave de topo com valor vazio, que é a forma pela qual o leitor as
reconhece: chave de topo sem valor é abertura de bloco, e não escalar vazio.

🟢 **O nível de topo volta depois do bloco.** `resolution_kind` e `spec_verdict` são escalares de topo
escritos *depois* de blocos aninhados, o que impede o atalho de parar a leitura na primeira chave
aninhada. O leitor precisa atravessar o bloco e retomar a coluna zero.

🟢 Listas de objetos em forma de fluxo aparecem doze vezes no primeiro arquivo e seis nos outros dois,
sempre indentadas, dentro de `traceability.root_cause.evidence`, `code_refs` e `change_set`. Nenhum
campo consumido aparece nessa forma.

🔴 **A armadilha que a apuração encontrou, e que o plano não previa.** Dois dos três arquivos trazem,
indentadas em dois espaços sob `change_set:`, as linhas `- id: CHG-001`, `- id: CHG-002` e seguintes.
Um leitor que normalizasse a linha antes de cortar a chave, aparando espaço à esquerda e o hífen de
item, leria `id: CHG-001` como chave de topo e **sobrescreveria o identificador do bug pelo
identificador da última mudança do change set**. O bug não sumiria da lista: apareceria com o
identificador errado, e o clique abriria o arquivo certo sob um nome que não é o dele. É a pior
classe de defeito deste bloco, porque não produz anomalia nem linha faltante.

🟢 A consequência normativa para o interpretador de D-02: **chave de topo é a que começa na coluna
zero**, sem espaço à esquerda e sem hífen. Nada de aparar a linha antes de decidir o nível. A suíte de
T008 fixa o caso `- id: CHG-001` por nome, e não por amostra.

🟡 **O título com dois-pontos não existe nos arquivos de hoje.** Nenhum dos três títulos reais tem
dois-pontos, e a forma aparece apenas em valores aninhados e entre aspas, como
`purpose: "Adaptação A4: retira o bloco…"`, que o leitor não lê. A regra do corte no primeiro
separador continua valendo, e passa a ser fixada por fixture sintética, declarada como tal: um título
com dois-pontos é forma legítima do contrato, e o leitor precisa preservá-lo inteiro antes que o
primeiro apareça no registro.

🟢 `DONE.md` é idêntico nos três: cabeçalho, linha em branco, `Data: 2026-09-10`, `resolution_kind:
fixed` e o aviso de somente leitura. A data está na linha `Data:` e em nenhum outro lugar, o que
confirma D-14 contra o arquivo, e não contra a memória.
