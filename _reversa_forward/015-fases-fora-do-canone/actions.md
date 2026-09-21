# Actions: fases fora do cânone, ciclo e encerramento não declarado

> Identificador: `015-fases-fora-do-canone`
> Data: `2026-09-21`
> Roadmap: `_reversa_forward/015-fases-fora-do-canone/roadmap.md`

## Resumo

| Métrica | Valor |
|---------|-------|
| Total de ações | 46 |
| Paralelizáveis (`[//]`) | 28 |
| Maior cadeia de dependência | 14 |

A cadeia mais longa é a que vai das formas à medição final:
`T001 → T002 → T006 → T016 → T017 → T018 → T019 → T020 → T021 → T022 → T031 → T032 → T035 → T046`,
catorze elos. Seis deles, de T017 a T022, são passos sobre o mesmo arquivo,
`src/domain/discovery-state.ts`, e por isso não há largura possível ali: o eixo é a espinha da
feature, e cada passo dele entra com a suíte que o cobre já escrita. A largura está nas dez suítes
da fase 2 e nos auxiliares do aprendizado, que só encontram o eixo na contagem.

A ordem respeita os dois pontos de controle do plano de migração. O primeiro: formas e classificador
nascem com o mapa sem etapa alguma, e nesse ponto as suítes da 011, da 012 e da 014 passam sem linha
reescrita (T017). O segundo: o gerador do mapa aprende a carregar `etapas` (T023) **antes** de a
promoção aprender a aprovar uma (T034); invertida a ordem, a primeira promoção de checkpoints
apagaria as etapas.

Nenhuma suíte existente é reescrita. Onde a feature pede asserção nova sobre módulo já coberto, a
asserção nasce em arquivo próprio; a única exceção é `tests/cli-paridade.spec.tsx`, que ganha casos
por acréscimo, como a D-13 determina.

`src/domain/equivalencias.ts` não é alvo de ação alguma: é módulo gerado, e só a promoção o
reescreve. O tipo do mapa vive em `src/domain/types.ts`, e é lá que `etapas` nasce (T002).

## Fase 1, Preparação

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T001 | Acrescentar as formas do eixo: o valor `encerrada-sem-declaracao` em `ExtractionSituation`, o código `encerramento-com-pendencia` em `DiscoveryStateAnomalyCode`, os campos opcionais `ciclo` e `etapas` ao fim de `DiscoveryStateAxis`, e as interfaces `CicloCorrente`, `FaseDoCiclo` e `EtapaReconhecida`, como no `data-delta.md`, seções 2, 3 e 5 (D-07, D-09, D-10) | - | `[//]` | `src/domain/types.ts` | 🟢 | `[X]` |
| T002 | Acrescentar `EtapaAprovada` e o campo **opcional** `etapas` a `MapaDeEquivalencias`, sem tocar em `EMPTY_MAPA_DE_EQUIVALENCIAS`, para que os mapas montados à mão nas suítes da 012 continuem compilando (D-06) | T001 | - | `src/domain/types.ts` | 🟢 | `[X]` |
| T003 | Declarar `contar:anomalias` e os três passos anteriores que constroem a unidade de terminal: `precontar:anomalias`, `preaprender:equivalencias` e `prepromover:equivalencias` (D-20, D-21) | - | `[//]` | `package.json` | 🟡 | `[X]` |
| T004 | Criar os `state.json` de amostra da feature, em arquivos novos: ciclo 3 com etapas e `concluido-c3` com `pending` povoado, no molde do `afla`; encerrada sem declaração com `phase` canônico, de ciclo e de etapa; `phase` concluído com `pending` povoado, no molde do `capacities`; prosa em `pending`, no molde do `DelphiSga`; e erros de grafia com e sem sufixo | - | `[//]` | `tests/fixtures/descoberta/` | 🟢 | `[X]` |
| T005 | Escrever a tabela única de casos do classificador, um por linha dos cinco degraus do `data-delta.md`, seção 1, com os exemplos que casam e os que não casam, inclusive `geracao-c`, `geracao-2a`, `geracao2`, `revisao_concluida` e o par `verificacao` com `verificacao-regressao`. É dela que saem a suíte do domínio e a de paridade (D-19) | - | `[//]` | `tests/helpers/fases-casos.ts` | 🟢 | `[X]` |

## Fase 2, Testes

As suítes da camada pura e dos auxiliares vêm antes do código que cobrem. As de desenho e de preview
não estão aqui: nascem na fase 4, junto do que confinam.

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T006 | Suíte do classificador sobre a tabela de casos: a precedência dos cinco degraus, `concluido-c3` como encerramento, a comparação da etapa sem caixa e sem bordas mas com diacríticos, a canônica exata, e a etapa mais longa vencendo quando uma é prefixo da outra (D-01, D-02, D-03, D-05) | T002, T005 | `[//]` | `tests/domain-fases.spec.ts` | 🟢 | `[X]` |
| T007 | Suíte do desconto e da anomalia nova: toda `fase-desconhecida` de ciclo ou etapa descontada nas três listas, `escavacão` ao lado de `escavacao-c2` continuando à vista, o mesmo nome em duas listas descontado duas vezes, e a `encerramento-com-pendencia` uma vez por projeto, com o detalhe no formato do `data-delta.md`, seção 3, sem o nome desconhecido (D-08, D-09) | T001, T004 | `[//]` | `tests/domain-fases-desconto.spec.ts` | 🟢 | `[X]` |
| T008 | Suíte do ciclo e das etapas: o maior inteiro como ciclo corrente, as cinco fases com `status` e nome bruto, a fase ausente lendo como pendente, duas grafias do mesmo ciclo, o sufixo de etapa fora da conta do ciclo, a ordem e a ausência de duplicata em `etapas`, e os dois campos ausentes quando não há o que informar (D-10, D-11) | T001, T004 | `[//]` | `tests/domain-fases-ciclo.spec.ts` | 🟡 | `[X]` |
| T009 | Suíte do encerramento sem declaração: as três condições, uma a uma, o caso do `capacities` ficando de fora, a precedência de `encerrada`, o desconto da `fase-atual-ja-concluida`, e a leitura idêntica à anterior para projeto sem ciclo com o mapa sem etapas (D-12, RF-04) | T001, T004 | `[//]` | `tests/domain-fases-encerramento.spec.ts` | 🟢 | `[X]` |
| T010 | Suíte do mapa com etapas: `lerMapaDeModulo` devolve `etapas`, o módulo gerado as escreve sempre, depois de `naoAgentes` e por ordem de nome, a fusão não duplica e une a evidência, e promover um par de checkpoint sobre mapa com etapa deixa a etapa intacta (D-06) | T002 | `[//]` | `tests/equivalencias-mapa-etapas.spec.ts` | 🟢 | `[X]` |
| T011 | Suíte da coleta das fases: os quatro filtros na ordem, o valor com espaço ou com 41 caracteres fora, o erro de grafia medido sobre o nome inteiro e sobre cada base possível, `re-extracao-003`, `-004` e `-005` como um candidato só com três evidências, e os vizinhos já filtrados (D-04, D-14, D-18) | T005 | `[//]` | `tests/equivalencias-fases-coleta.spec.ts` | 🟡 | `[X]` |
| T012 | Suíte das duas perguntas do motor, com o duplo por tabela: as quatro leituras, a resposta sobre outro nome, a resposta sobre outro par, o corpo inválido, o estouro de tempo e a conexão recusada na segunda pergunta de natureza (D-15) | - | `[//]` | `tests/equivalencias-motor-fases.spec.ts` | 🟢 | `[X]` |
| T013 | Suíte da seção de fases da proposta: caixas desmarcadas, uma por nome, o grupo como fecho dos pares `mesma`, a razão só na comparação, a evidência medida na natureza, as listas sem caixa (erro de grafia e recusados pelo motor), o não classificado com caixa, e a leitura das caixas marcadas de volta (D-17) | - | `[//]` | `tests/equivalencias-proposta-fases.spec.ts` | 🟢 | `[X]` |
| T014 | Suíte da contagem: a soma por código igual à das leituras individuais, inclusive com anomalia de linha longa, o `--json` com `porProjeto`, o projeto sem leitura contado à parte, os códigos de saída 0 e 2, o mapa recebido por parâmetro, a coluna do alcance do mapa e nenhuma escrita (D-20, D-22) | T004 | `[//]` | `tests/cli-contagem.spec.ts` | 🟢 | `[X]` |
| T015 | Suíte de paridade entre o classificador da leitura e o dos scripts, sobre a mesma tabela de casos, no molde de `elisao-paridade.spec.ts` (D-19) | T005 | `[//]` | `tests/fases-paridade.spec.ts` | 🟢 | `[X]` |

## Fase 3, Núcleo

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T016 | Escrever `classificarNome(bruto, mapa)` e o tipo `NomeDeFase`, função pura com a precedência de cinco degraus e o reconhecimento do sufixo por prefixo conhecido, com o resto na forma `^[-_]\S*?(\d+)$` (D-01, D-02, D-03, D-05) | T006 | `[//]` | `src/domain/fases.ts` | 🟢 | `[X]` |
| T017 | Fazer `lerExtracao` julgar `phase`, `completed` e `pending` por `classificarNome`, mantendo os dois primeiros degraus como a 011 os escreveu. Ponto de controle: com o mapa sem etapas, as suítes da 011, da 012 e da 014 passam sem linha reescrita (D-01, D-02) | T016 | - | `src/domain/discovery-state.ts` | 🟢 | `[X]` |
| T018 | Ampliar `absorvidas` com a tripla de toda `fase-desconhecida` cujo detalhe classifique como ciclo ou etapa, venha de qualquer das três listas, deixando a regra antiga do encerramento como está (D-08) | T017, T007 | - | `src/domain/discovery-state.ts` | 🟢 | `[X]` |
| T019 | Derivar `ciclo`: o maior inteiro entre as fases de ciclo, as cinco fases na ordem canônica com `status` pela precedência de `derivePhases`, o nome bruto que sustenta cada uma, e a fase ausente como pendente (D-10, D-11) | T018, T008 | - | `src/domain/discovery-state.ts` | 🟡 | `[X]` |
| T020 | Derivar `etapas`: nome bruto, base, sufixo e situação, na ordem do arquivo e sem duplicata, com o campo ausente quando nenhuma etapa aprovada está presente (D-10) | T019 | - | `src/domain/discovery-state.ts` | 🟢 | `[X]` |
| T021 | Reconhecer a situação `encerrada-sem-declaracao` pelas três condições, depois do teste de `encerrada`, e descontar a `fase-atual-ja-concluida` cujo detalhe seja o `phase` (D-12, D-08) | T020, T009 | - | `src/domain/discovery-state.ts` | 🟢 | `[X]` |
| T022 | Registrar a anomalia `encerramento-com-pendencia`, uma por projeto, só com extração `encerrada` e nome reconhecido em `pending`, com o `phase` e os nomes pendentes no detalhe (D-09) | T021 | - | `src/domain/discovery-state.ts` | 🟢 | `[X]` |
| T023 | Fazer `lerMapaDeModulo`, `fundir` e `gerarModulo` carregarem `etapas`: lidas quando presentes, escritas sempre, ordenadas por nome, sem duplicata e com a evidência unida. É o passo 2 da migração, e vem antes de a promoção saber aprovar etapa (D-06) | T010 | `[//]` | `scripts/equivalencias/gerar-mapa.js` | 🟢 | `[X]` |
| T024 | Duplicar o classificador em CommonJS, preso à fonte pela suíte de paridade (D-19) | T015, T016 | `[//]` | `scripts/equivalencias/fases.js` | 🟢 | `[X]` |
| T025 | Escrever a distância de edição e o percurso das bases possíveis de um nome, que testa o que sobra à esquerda de cada separador quando o resto tem forma de sufixo (D-14) | T011 | `[//]` | `scripts/equivalencias/grafia.js` | 🟢 | `[X]` |
| T026 | Escrever a coleta das fases: os nomes de `phase`, `completed` e `pending` de cada projeto, os filtros de forma, de decisão pela forma ou pelo mapa e de grafia, a base candidata pelo sufixo estreito `[-_][a-z]*\d+$`, a evidência acumulada por projeto e os vizinhos já filtrados (D-04, D-14, D-18) | T024, T025 | - | `scripts/equivalencias/coletar-fases.js` | 🟡 | `[X]` |
| T027 | Acrescentar à coleta os pares elegíveis para a comparação: candidatos julgados `etapa` entre si e contra as etapas aprovadas, com ao menos uma palavra em comum, descontadas `de`, `da`, `do`, `e` e `em`, ordenados e sem repetição (D-16) | T026 | - | `scripts/equivalencias/coletar-fases.js` | 🟢 | `[X]` |
| T028 | Fatorar o pedido e o tempo-limite para os três classificadores e acrescentar as perguntas de natureza e de comparação, com os enunciados das rodadas 3A e 3B da prova e o descarte da resposta sobre outro nome ou outro par (D-15) | T012 | `[//]` | `scripts/equivalencias/motor.js` | 🟢 | `[X]` |
| T029 | Escrever a seção de fases da proposta: grupos pelo fecho dos pares `mesma`, caixa desmarcada por nome, evidência medida na natureza, razão só sob o grupo, e as listas sem caixa do erro de grafia e do que o motor recusou (D-17) | T013 | `[//]` | `scripts/equivalencias/proposta.js` | 🟢 | `[X]` |
| T030 | Ler de volta as caixas marcadas da seção de fases, devolvendo cada nome aprovado com a sua evidência, sem noção de grupo | T029 | - | `scripts/equivalencias/proposta.js` | 🟢 | `[X]` |
| T031 | Escrever a contagem: cada subpasta direta da raiz com `.reversa/state.json`, lida por `readWorkspace` e composta por `composeAnomalies` com o mapa recebido, somada por código e por projeto, com a constante dos códigos ao alcance do mapa, o progresso na saída de erro e o projeto sem leitura contado à parte (D-20, D-22) | T014, T022 | `[//]` | `src/cli/contagem.ts` | 🟢 | `[X]` |
| T032 | Escrever a casca do comando: a raiz obrigatória, `--json`, a recusa nomeada de raiz inválida e de `out-cli/` ausente com código 2, no molde de `scripts/painel.js` (D-20) | T031, T003 | - | `scripts/contar-anomalias.js` | 🟢 | `[X]` |

## Fase 4, Integração

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T033 | Acrescentar ao aprendizado a passagem das fases, depois da dos checkpoints: coleta, pergunta de natureza por candidato, comparação por par elegível, e a seção na proposta. Conexão recusada em qualquer pergunta encerra a rodada sem escrever nada, mesmo com os checkpoints já classificados (D-14, RF-17) | T027, T028, T029 | - | `scripts/aprender-equivalencias.js` | 🟢 | `[X]` |
| T034 | Fazer a promoção ler as caixas da seção de fases e fundir as etapas aprovadas no mapa, um registro independente por nome, sem importar o motor (RF-15) | T023, T030 | - | `scripts/promover-equivalencias.js` | 🟢 | `[X]` |
| T035 | Chamar a contagem ao fim do aprendizado, com o mapa vigente, e imprimir a tabela; sem `out-cli/`, nomear `npm run compile:cli` e terminar com o código que a rodada teria (D-21) | T033, T032 | - | `scripts/aprender-equivalencias.js` | 🟡 | `[X]` |
| T036 | Chamar a contagem ao fim da promoção, com o mapa que acabou de ser fundido passado por parâmetro, sob a mesma regra da falta de `out-cli/` (D-21) | T034, T032 | - | `scripts/promover-equivalencias.js` | 🟡 | `[X]` |
| T037 | Escrever as frases novas, partilhadas pela tela e pelo terminal: o ciclo, a etapa em curso, a linha das etapas com a menção ao mapa, e o encerramento sem declaração, com o ramo novo em `EXTRACTION_LABELS` (D-13) | T001 | `[//]` | `src/webview/domain/labels.ts` | 🟢 | `[X]` |
| T038 | Suíte do cartão com os campos novos: `ciclo` presente trocando a fonte das cinco fases e ausente deixando o cartão como era, a linha das etapas, a etapa em curso sem fase `current`, e a frase do encerramento sem declaração distinta da do declarado, tudo em texto | T037 | `[//]` | `tests/webview-discovery-section-fases.spec.tsx` | 🟢 | `[X]` |
| T039 | Desenhar no cartão da Descoberta a frase do ciclo, as cinco fases do ciclo corrente com o nome bruto, a linha das etapas, a etapa em curso e o encerramento sem declaração (D-13) | T038, T022 | `[//]` | `src/webview/ui/DiscoverySection.tsx` | 🟢 | `[X]` |
| T040 | Desenhar o mesmo na seção da Descoberta do painel de linha de comando, com as frases de `labels.ts` (D-13) | T037, T022 | `[//]` | `src/cli/quadro/secoes.ts` | 🟢 | `[X]` |
| T041 | Acrescentar à suíte de paridade os casos novos: ciclo, etapas, etapa em curso e encerramento sem declaração, sem tocar nos casos existentes (D-13) | T039, T040 | - | `tests/cli-paridade.spec.tsx` | 🟢 | `[X]` |
| T042 | Suíte do canal: os campos novos cruzam `SetProcessData` por dentro de `discoveryState`, e a carga de um host anterior, sem `ciclo`, sem `etapas` e sem as triplas novas, faz a tela desenhar o que desenhava na 014, com as `fase-desconhecida` de volta (RF-11) | T022 | `[//]` | `tests/host-protocol-fases.spec.ts` | 🟢 | `[X]` |
| T043 | Acrescentar os três casos doentes: `ciclo-com-etapa`, `encerramento-com-pendencia` e `encerrada-sem-declaracao`, sobre cópia do workspace (D-23) | T022 | `[//]` | `scripts/estragar-descoberta.js` | 🟢 | `[X]` |
| T044 | Suíte que confere cada um dos três casos doentes contra a leitura real do host, em arquivo novo ao lado de `preview-descoberta.spec.ts` (RF-18) | T043 | - | `tests/preview-descoberta-fases.spec.ts` | 🟢 | `[X]` |

## Fase 5, Polimento

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T045 | Nomear a fase de ciclo na subseção "Pendências de origem", como pendência e não como adaptação, de modo que o total de adaptações declaradas não mude (RF-19) | - | `[//]` | `src/heranca/PROCEDENCIA.md` | 🟢 | `[X]` |
| T046 | Medir e registrar, nas notas de execução deste documento, os dois números do critério de pronto, a leitura da referência contra os 200 ms e o pacote da tela contra a guarda de 60 %, com a suíte inteira rodada de motor local desligado | T035, T036, T041, T042, T044 | - | `_reversa_forward/015-fases-fora-do-canone/actions.md` | 🟢 | `[X]` |

## Notas de execução

<!--
Reservado para /reversa-coding registrar avisos ou observações que surgiram durante a execução.
Não use isso para corrigir ações, edits manuais ficam fora desse arquivo, vão direto no código.
-->

Execução de 2026-09-21, em rodada única, com as 46 ações concluídas.

**Os números do critério de pronto (T046).**

| Medida | Valor | Limite | Como foi medido |
|---|---|---|---|
| Suíte inteira | 2424 testes em 139 arquivos, todos passando | n/a | `npx vitest run`; a linha de base, antes da feature, era de 2189 em 125 |
| Motor local desligado | 0 chamadas ao endereço do motor durante a suíte | 0 | O serviço estava no ar na máquina. A medição substituiu o `fetch` por um que recusa e anota toda chamada à porta 11434, e a suíte passou inteira sem anotar nenhuma |
| Leitura completa da referência | 10,3 ms de mediana, 12,1 ms no pior de nove | 200 ms | `readWorkspace` sobre este repositório, pela unidade compilada em `out-cli/` |
| Pacote da tela | 222.788 B, 54,4 % do teto | 60 % de 409.600 B, isto é, 245.760 B | `npm run build:webview` |
| Contagem sobre `~/dev` | 64 projetos, nenhum sem leitura, 250 anomalias exibidas, em 0,8 s | n/a | `node scripts/contar-anomalias.js ~/dev --json`; a soma de `porProjeto` confere com o total, e a impressão digital dos 64 `state.json` (instante, tamanho e caminho) é a mesma antes e depois |

Na contagem real, o `afla` passou de quinze `fase-desconhecida` para cinco, que são os cinco nomes de
etapa ainda sem aprovação, e ganhou a `encerramento-com-pendencia`. A raiz traz 33
`fase-desconhecida` em 6 projetos e 3 `fase-atual-ja-concluida` em 3 projetos.

**Desvios em relação ao plano, todos por acréscimo.**

1. Duas guardas de INVENTÁRIO foram atualizadas, e não são suítes das features 011, 012 ou 014 no
   sentido do requisito de manutenibilidade: `tests/host-manifest.spec.ts`, que enumera os scripts do
   `package.json` e passou de vinte e seis para trinta, e `tests/host-protocol.spec.ts`, que conta os
   campos de `DiscoveryStateAxis` e passou de cinco para sete, exigindo que os dois novos sejam
   opcionais e venham ao fim. A 014 atualizou a primeira do mesmo modo. Os quatro scripts novos foram
   postos ao fim do manifesto para que a lista da guarda crescesse só por acréscimo.
2. `scripts/estragar-descoberta.js` ganhou os três casos em lista própria, `CASOS_DAS_FASES`, porque
   `CASOS` é inventário que `tests/preview-descoberta.spec.ts` prende em cinco. O comando aceita as duas.
3. `lerMapaDeModulo` devolve o mapa vazio com a forma da 012, sem `etapas`, porque uma suíte da 012 a
   compara por igualdade. O campo é opcional, e ausente lê como nenhuma etapa aprovada.
4. A leitura das caixas da seção de fases é função própria, `lerEtapasMarcadas`, e `lerMarcados`
   continua devolvendo as duas listas da 012.
5. A contagem decide o que é projeto pela leitura do host (`process.installed`), e não por caminho de
   arquivo: `tests/cli-boundaries.spec.ts` proíbe caminho literal do Reversa em `src/cli/`. O efeito é o
   do contrato, porque instalado é exatamente o workspace que tem o arquivo de estado.
6. A proposta anota ao fim, em comentário, a raiz varrida, com o til no lugar da pasta pessoal. É o que
   permite à promoção contar a mesma raiz sem argumento, como o `onboarding.md`, seção 6, supõe.
   `--raiz=` a substitui.
7. O aprendizado que recebe o classificador de checkpoints injetado e não recebe o das fases roda sem a
   passagem das fases e sem a contagem. É o que mantém `tests/equivalencias-aprendizado.spec.ts` sem
   linha reescrita e sem depender do motor nem de `out-cli/`.
8. A promoção ganhou `--destino=`, para que a suíte promova sobre cópia: o módulo de verdade é a trilha
   de auditoria das aprovações.

**O que a auditoria apontou e esta execução resolveu.** O A004 do `audit/cross-check.md` pedia suíte
para a rodada inteira, e ela nasceu em `tests/equivalencias-rodada-fases.spec.ts`, registrada no
progresso junto da T033. O A001 foi resolvido no código pela regra, e não pelo cenário: o inteiro de
`verificacao-regressao-c3` é `sufixo`, nunca ciclo, como mandam a RN-03, o RF-05 e o `data-delta.md`. O
texto do cenário no `requirements.md` continua dizendo "com ciclo 3", e corrigi-lo é tarefa de
`/reversa-clarify` ou de edição manual. O A002 foi resolvido a favor do `data-delta.md`:
`src/domain/equivalencias.ts` não foi tocado, e segue sem `etapas` até a primeira promoção.

**O que não foi feito aqui, por ser seu.** Nenhuma etapa foi aprovada: o mapa vigente continua sem
`etapas`, e o passo 4 do plano de migração (aprender sobre `~/dev`, marcar e promover) é decisão de quem
mantém o painel. A re-extração reversa do critério de pronto também não foi disparada.

## Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-09-21 | Versão inicial gerada por `/reversa-to-do` | reversa |
| 2026-09-21 | As 46 ações executadas por `/reversa-coding`, com as notas de execução | reversa |
