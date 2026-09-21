# Requirements: fases fora do cânone, ciclo e encerramento não declarado

> Identificador: `015-fases-fora-do-canone`
> Data: `2026-09-21`
> Pasta da extração reversa: `_reversa_sdd/`
> Confidência: 🟢 CONFIRMADO, 🟡 INFERIDO, 🔴 LACUNA / DÚVIDA

## 1. Resumo executivo

A feature ensina o painel a ler o projeto que passou por mais de um ciclo de extração. Hoje, cada
nome de fase fora das cinco canônicas vira uma anomalia `fase-desconhecida`, e um projeto re-extraído
duas vezes aparece com quinze delas, embora nenhuma seja defeito. A entrega reconhece pela forma a
fase canônica com sufixo de ciclo, leva ao mapa de equivalências as etapas que o Reversa grava sem
documentar, mostra em que ciclo o projeto está, reconhece a extração que terminou sem declarar o
fim e passa a contar as anomalias da raiz inteira, por código, num comando próprio, para que o que
fica fora do alcance do mapa não passe por saneado.

Ela serve a quem retoma um projeto antigo e precisa distinguir, numa lista de anomalias, o que é
vocabulário legítimo do que é defeito de gravação, que continua à vista.

## 2. Contexto a partir do legado

| Fonte | Trecho relevante | Confidência |
|-------|------------------|-------------|
| `_reversa_sdd/addenda/011-estado-terminal-e-checkpoints.md#impacto-por-artefato-da-extração` | Adendo vigente. O EC-02 da leitura passou a ser lido em duas partes: valor cuja forma declara encerramento é estado reconhecido; valor fora das cinco canônicas e fora dessa família "continua virando anomalia, com o nome à vista". É essa segunda parte que esta feature emenda. A absorção casa arquivo, código e detalhe ao mesmo tempo, e só olha o valor de `phase` | 🟢 |
| `_reversa_sdd/addenda/011-estado-terminal-e-checkpoints.md#resumo-da-entrega` | Fato sistemático reconhece-se por forma, "nunca por lista literal, que estaria desatualizada assim que a sexta grafia aparecesse"; desvio não se aprende. É o critério que decide aqui a fronteira entre a forma e o mapa | 🟢 |
| `_reversa_sdd/addenda/012-equivalencias-de-checkpoint.md#impacto-por-artefato-da-extração` | Adendo vigente. O mapa aprovado é a única fonte de equivalência que a leitura consulta; o motor local propõe e a pessoa dispõe; o aprendizado escreve apenas a proposta e a promoção apenas o mapa; o que vai ao motor vai elidido; o que a tela mostra é o valor bruto | 🟢 |
| `_reversa_sdd/addenda/012-equivalencias-de-checkpoint.md#o-que-ainda-espera-decisão-humana` | O mapa cobre um eixo só, o do checkpoint. A redução de 25 anomalias para 3, obtida na promoção de 2026-09-20, foi contada dentro desse eixo, e as anomalias de fase nunca entraram na conta | 🟢 |
| `_reversa_sdd/addenda/014-cli-do-processo.md#impacto-por-artefato-da-extração` | O painel de linha de comando desenha a mesma leitura da tela, e a paridade entre os dois é presa por suíte. O que a tela passar a mostrar, o terminal mostra também | 🟢 |
| `_reversa_sdd/sdd/leitura-do-processo.md#4-non-goals-fora-do-escopo` | NG-05 proíbe corrigir, normalizar ou sanear arquivo do Reversa; NG-03 reserva ao painel a decisão do que a tela mostra; NG-01 e NG-04 proíbem escrever e observar o disco por conta própria | 🟢 |
| `_reversa_sdd/sdd/leitura-do-processo.md#11-edge-cases-e-tratamento-de-erros` | EC-02: fase fora do conjunto canônico vira anomalia. Permanece a regra para o erro de grafia, que é o caso que ela existe para pegar | 🟢 |
| `_reversa_sdd/sdd/ponte-e-host.md#9-modelo-de-dados` | A carga enviada à tela cresce só por acréscimo: campo novo é opcional e entra ao fim, e a ausência dele significa host anterior à feature | 🟢 |
| `_reversa_sdd/sdd/heranca-e-sincronia.md#6-requisitos-funcionais` | A camada herdada não se toca para decidir o que a tela mostra; a dívida com a origem fica declarada em `src/heranca/PROCEDENCIA.md`, na subseção de pendências de origem | 🟢 |
| `src/heranca/reversa-domain/src/state.ts`, função `derivePhases` | Registra `fase-desconhecida` sobre cada nome de `completed`, de `pending` e de `phase` que não seja uma das cinco canônicas, e devolve sempre as cinco fases, com situação derivada só dos nomes canônicos | 🟢 |
| `src/domain/discovery-state.ts`, função `absorver` | Desconta a anomalia apenas quando o detalhe é igual ao valor bruto de `phase` e a extração foi reconhecida como encerrada. Nome de fase em `completed` ou `pending` nunca é descontado | 🟢 |
| `scripts/equivalencias/coletar.js` e `scripts/equivalencias/motor.js` | A coleta lê somente a chave `checkpoints` de cada `state.json`, e o enunciado do motor pergunta somente se um campo declara o estado de um agente, com quatro respostas possíveis. Nome de fase não é coletado nem teria resposta que o descrevesse | 🟢 |
| Medição dos 64 projetos com `.reversa/state.json` em `~/dev`, feita em 2026-09-21 | Seis projetos trazem nome fora do cânone em `completed` ou `pending`, descontada a família do encerramento. Em cinco é vocabulário: `afla` (15 nomes), `tcr-ana-luisa` (`re-extracao-003` a `-005`), `aps-inteligente` (`regressao`), `comentarios-concursos` (`verificacao-de-regressao`) e `modelo-empresa` (`documentacao`). No sexto, `DelphiSga`, o `pending` guarda 19 parágrafos de prosa, que é defeito de gravação | 🟢 |
| `~/dev/afla/.reversa/state.json`, lido em 2026-09-21 | Três ciclos declarados (`cycle: 3`, mais `cycle_2` e `cycle_3` com data de início, motivo e política). Dos 15 nomes, dez são fase canônica com sufixo (`reconhecimento-c2` a `revisao-c3`), quatro são etapas sem sufixo (`reconciliacao`, `contrato-insumo`, `decisoes-autor`, `verificacao-regressao`) e um é etapa com sufixo (`verificacao-regressao-c3`). O mesmo arquivo declara `phase: "concluido-c3"` e mantém as cinco fases do terceiro ciclo em `pending` | 🟢 |

## 3. Personas e cenários de uso

| Persona | Objetivo | Cenário-chave |
|---------|----------|---------------|
| O Retomador (`_reversa_sdd/personas.md#persona-1-o-retomador`) | Recuperar o estado de um projeto parado sem repagar o custo do contexto | Abre o painel no `afla` e lê que o projeto está no terceiro ciclo de extração, com uma anomalia que aponta o defeito verdadeiro, em vez de dezoito entre as quais o defeito se perde |
| O Operador (`_reversa_sdd/personas.md#persona-2-o-operador`) | Manter o ritmo do pipeline sem inspecionar disco a cada troca de agente | Durante uma re-extração, vê as fases do ciclo corrente avançarem, e não as cinco do primeiro ciclo paradas em concluído |
| O Mantenedor da extensão | Decidir o vocabulário sem herdar palpite de modelo, e saber o que ainda não foi decidido | Roda o aprendizado, recebe a proposta com uma seção de fases ao lado da de checkpoints, aprova `regressao` e `verificacao-de-regressao` como a mesma etapa, e lê ao fim a contagem de anomalias da raiz por código, que lhe mostra os eixos ainda sem cobertura |

## 4. Regras de negócio novas ou alteradas

1. **RN-01:** Fase de ciclo é uma das cinco fases canônicas seguida de um sufixo numérico, e é
   reconhecida pela forma, sem lista literal e sem consulta ao mapa. Sufixo numérico é um separador,
   um texto opcional sem espaço e um inteiro ao fim: `-c2`, `-2` e `-ciclo-2` têm a forma, e o
   inteiro é o número do ciclo. Ela não é anomalia na tela, esteja em `phase`, em `completed` ou em
   `pending`. 🟢
   - Origem no legado: emenda `_reversa_sdd/addenda/011-estado-terminal-e-checkpoints.md`, linha do
     EC-02
   - Tipo: alterada
   - Justificativa medida: dez dos quinze nomes do `afla` têm essa forma, e o número do ciclo cresce
     a cada re-extração. Uma lista estaria desatualizada no quarto ciclo.
   - Decidido na sessão de 2026-09-21, pergunta 1: qualquer sufixo numérico, e não só `-cN`.

2. **RN-02:** Etapa fora do cânone só é reconhecida por aprovação registrada no mapa. A unidade de
   aprovação é o nome da etapa, comparado sem distinção de caixa e de espaços nas bordas, e cada
   registro guarda a data da aprovação e os projetos em que o nome foi visto. 🟢
   - Origem no legado: estende `_reversa_sdd/addenda/012-equivalencias-de-checkpoint.md`, que fixa
     o mesmo regime para o par de campo e valor
   - Tipo: nova
   - Justificativa medida: `regressao`, `verificacao-regressao` e `verificacao-de-regressao` são
     três grafias em três projetos para o que parece ser uma etapa só. É vocabulário aberto, sem
     fonte normativa, e a 012 já decidiu que a fonte possível é a decisão de quem mantém o painel.

3. **RN-03:** O sufixo numérico aplica-se também à etapa aprovada, na mesma forma da RN-01:
   aprovada `verificacao-regressao`, o nome `verificacao-regressao-c3` é reconhecido sem aprovação
   própria; aprovada `re-extracao`, o mesmo vale para `re-extracao-003` e para a `re-extracao-006`
   que ainda não existe. Sem a aprovação da etapa de base, o nome com sufixo continua anomalia. 🟢
   - Tipo: nova
   - Decidido na sessão de 2026-09-21, pergunta 2. `re-extracao-NNN` não é fase de ciclo: não contém
     fase canônica, e no `tcr-ana-luisa` o número acompanha a feature entregue, não o ciclo. Por
     isso o inteiro de uma etapa com sufixo não entra na conta do ciclo da RN-08.

4. **RN-04:** O desconto de anomalia continua a casar arquivo, código e detalhe ao mesmo tempo. Nome
   que não seja fase de ciclo nem etapa aprovada continua produzindo `fase-desconhecida` na tela,
   com o nome à vista, e isso inclui o erro de grafia de fase canônica. 🟢
   - Origem no legado: `_reversa_sdd/addenda/011-estado-terminal-e-checkpoints.md`, terceira
     separação do resumo da entrega
   - Tipo: alterada, no alcance: o desconto deixa de olhar só `phase`

5. **RN-05:** Reconhecer não é sanear. A camada herdada continua registrando `fase-desconhecida`
   sobre todo nome fora do cânone, nenhum `state.json` é reescrito, e o nome que a tela mostra é o
   bruto do disco. 🟢
   - Origem no legado: `_reversa_sdd/sdd/leitura-do-processo.md#4-non-goals-fora-do-escopo`, NG-05
     e NG-03
   - Tipo: nova, por reafirmação

6. **RN-06:** Declarar o encerramento com fase ainda pendente é defeito de gravação, e tem anomalia
   própria. Quando a extração é reconhecida como encerrada e `pending` ainda lista fase canônica,
   fase de ciclo ou etapa aprovada, a leitura registra a inconsistência, nomeando o valor de `phase`
   e o que ficou pendente. 🟢
   - Tipo: nova
   - Justificativa: hoje o defeito do `afla` só aparece por acidente, sob a forma de cinco
     `fase-desconhecida` em `pending`. Reconhecidas as fases de ciclo pela RN-01, ele sumiria da
     tela sem que ninguém o tivesse corrigido.

7. **RN-07:** Só é candidato a fase o valor com forma de identificador: texto sem espaço e com até
   40 caracteres. O que passa disso não é perguntado ao motor nem oferecido à aprovação, e continua
   anomalia. 🟡
   - Tipo: nova
   - Justificativa medida: os 19 parágrafos no `pending` do `DelphiSga` são defeito de gravação na
     fonte. Traduzi-los no painel esconderia o defeito, e o caminho deles é o prompt de correção da
     feature 013.

8. **RN-08:** O ciclo corrente é o maior inteiro entre as fases de ciclo reconhecidas em `phase`,
   `completed` e `pending`, e nenhuma chave de topo do `state.json` é lida para isso. Havendo ciclo,
   as cinco fases mostram a situação do ciclo corrente, com uma frase que o nomeia, e os ciclos
   anteriores não aparecem. Continuam sendo cinco: nenhuma sexta é inventada. Projeto sem fase de
   ciclo desenha exatamente o que desenhava antes. 🟢
   - Tipo: nova
   - Decidido na sessão de 2026-09-21, perguntas 5 e 6. A pergunta 5 veio como "decida você", e a
     decisão foi não ler `cycle` nem `cycle_N`: onze projetos re-extraíram, só o `afla` usa essas
     chaves, e os outros dez gravaram a re-extração sob nove grafias de topo. Adotar uma delas seria
     escolher a grafia de um projeto contra nove. As nove ficam como dívida medida, porque são
     desvio sem fonte normativa, e o remédio é o Reversa normatizar.

9. **RN-09:** Propor não é dispor, e a regra vale para as fases como vale para os pares. O motor
   local roda só no aprendizado, a proposta não toca o mapa, a promoção não conhece o motor, e o que
   sai do processo vai elidido. 🟢
   - Origem no legado: `_reversa_sdd/addenda/012-equivalencias-de-checkpoint.md#resumo-da-entrega`
   - Tipo: nova, por extensão

10. **RN-10:** Toda contagem de anomalias que uma ferramenta de manutenção apresente é a da raiz
    inteira, discriminada por código, com a indicação de quais códigos o mapa alcança. 🟢
    - Tipo: nova
    - Justificativa: o "25 para 3" de 2026-09-20 era verdadeiro dentro do eixo do checkpoint e foi
      lido como retrato de `~/dev`, enquanto o `afla` sozinho trazia quinze anomalias de outro eixo.
    - Decidido na sessão de 2026-09-21, pergunta 8: a contagem é comando próprio, só de leitura, que
      o aprendizado e a promoção chamam ao fim.

11. **RN-11:** Extração com as cinco fases canônicas em `completed`, `pending` vazio e `phase` numa
    fase canônica já concluída é reconhecida pela forma como encerrada sem declaração. A tela diz
    isso em texto, distinto do encerramento declarado, e a `fase-atual-ja-concluida` correspondente
    é descontada pela mesma regra da tripla. 🟢
    - Origem no legado: estende `_reversa_sdd/addenda/011-estado-terminal-e-checkpoints.md`, que
      reconhece o encerramento só pelo valor de `phase`
    - Tipo: nova
    - Justificativa medida: 11 dos 64 projetos têm exatamente essa forma, com `phase: "revisao"`. É
      fato mais sistemático que o ciclo, e pelo critério da 011 vai pela forma.
    - Decidido na sessão de 2026-09-21, pergunta 7, que veio como "decida você": entra na 015, como
      Should.

12. **RN-12:** Nome a até 2 caracteres de distância de edição de uma fase canônica é erro de grafia,
    e não candidato a etapa. A proposta o lista à parte, sem caixa de aprovação, e ele não é
    perguntado ao motor. No painel continua anomalia, como manda a RN-04. 🟢
    - Tipo: nova
    - Decidido na sessão de 2026-09-21, pergunta 4.

## 5. Requisitos Funcionais

| ID | Requisito | Prioridade | Critério de aceite | Confidência |
|----|-----------|------------|--------------------|-------------|
| RF-01 | A leitura reconhece a fase de ciclo pela forma, em `phase`, `completed` e `pending` | Must | Para o `state.json` do `afla`, os dez nomes de `reconhecimento-c2` a `revisao-c3` saem reconhecidos, cada um com a fase canônica, o número do ciclo e o nome bruto; `geracao-2` e `geracao-ciclo-2` saem reconhecidos com ciclo 2; `geracao-c` e `geracao-2a` não | 🟢 |
| RF-02 | A fase canônica é testada antes da fase de ciclo, e a família do encerramento continua reconhecida como na 011 | Must | `escavacao` lê como lia; `concluido-c3` lê como encerramento, e não como fase de ciclo; as suítes da 011 passam sem linha reescrita | 🟢 |
| RF-03 | O mapa de equivalências ganha um segundo conjunto de registros, o das etapas aprovadas, e a leitura o consulta para todo nome que não seja canônico, de encerramento nem de ciclo | Must | Com `verificacao-regressao` aprovada, o nome sai reconhecido como etapa, com a procedência do mapa; sem aprovação, sai como anomalia | 🟢 |
| RF-04 | Com o mapa sem etapa alguma aprovada, a leitura de um projeto sem fase de ciclo é idêntica à de antes da feature | Must | Suíte compara a leitura dos projetos de referência antes e depois, com mapa vazio, e não acha diferença | 🟢 |
| RF-05 | O sufixo numérico sobre etapa aprovada é reconhecido pela aprovação da etapa de base, e o inteiro dele não conta como ciclo | Must | Aprovada `verificacao-regressao`, `verificacao-regressao-c3` sai reconhecida; aprovada `re-extracao`, `re-extracao-005` sai reconhecida e o ciclo corrente do `tcr-ana-luisa` continua ausente; retirada a aprovação, os nomes voltam a ser anomalia | 🟢 |
| RF-06 | O desconto de anomalia alcança toda `fase-desconhecida` cujo detalhe seja nome reconhecido, e só essas | Must | No `afla`, com as quatro etapas aprovadas, nenhuma `fase-desconhecida` chega à tela; num `state.json` com `escavacao-c2` e `escavacão` em `completed`, a primeira é descontada e a segunda aparece | 🟢 |
| RF-07 | A leitura registra anomalia própria quando a extração está encerrada e `pending` ainda lista fase reconhecida | Must | No `afla`, a anomalia aparece uma vez, nomeando `concluido-c3` e as cinco fases pendentes; em projeto encerrado com `pending` vazio, não aparece | 🟢 |
| RF-08 | Valor sem forma de identificador não é candidato a fase | Must | Os 19 valores do `pending` do `DelphiSga` continuam anomalia, não entram na proposta e não são enviados ao motor | 🟡 |
| RF-09 | O eixo da descoberta informa o ciclo corrente, que é o maior inteiro entre as fases de ciclo reconhecidas, e a situação das cinco fases nesse ciclo | Must | Para o `afla`, a leitura traz ciclo 3, com `reconhecimento` concluída e as outras quatro pendentes; para projeto sem fase de ciclo, o campo vem ausente; nenhuma chave de topo além de `phase`, `completed` e `pending` é lida | 🟢 |
| RF-10 | Havendo ciclo, o cartão da Descoberta mostra as cinco fases na situação do ciclo corrente, sob uma frase em texto que nomeia o ciclo, e o painel de linha de comando mostra o mesmo; ciclos anteriores não aparecem | Must | No `afla`, os dois mostram o terceiro ciclo e as cinco fases dele; num projeto sem ciclo, o cartão é idêntico ao de antes; a suíte de paridade entre tela e terminal passa | 🟢 |
| RF-11 | A carga enviada à tela cresce só por acréscimo, com campos opcionais ao fim | Must | Tela nova com host anterior desenha o que desenhava na 014, sem ciclo e com as anomalias de fase de volta | 🟢 |
| RF-12 | O aprendizado coleta os nomes de `phase`, `completed` e `pending` que ninguém decidiu, acumulando os projetos em que cada um aparece, e não pergunta de novo o que o mapa já decide nem o que a forma já reconhece | Must | Sobre `~/dev`, a coleta devolve os nomes de etapa dos cinco projetos medidos, cada um com a sua evidência, e nenhuma fase de ciclo | 🟢 |
| RF-13 | O motor local recebe, para cada nome de etapa, uma pergunta própria, com vocabulário de três respostas (etapa legítima fora do cânone, mesma etapa que outra já vista, não é fase), e a resposta que não seja sobre o nome perguntado é descartada. O vocabulário só é fixado depois da prova de viabilidade, que antecede o plano | Must | A prova de viabilidade sobre os nomes reais da raiz, mais casos negativos, está registrada na pasta da feature com o placar; com o motor substituído por duplo, cada resposta do vocabulário produz o item correspondente na proposta, e resposta sobre outro nome não produz item | 🟡 |
| RF-14 | A proposta ganha uma seção de fases, no formato de caixas da seção de checkpoints, agrupando os nomes que o motor apontou como a mesma etapa | Must | A proposta gerada sobre `~/dev` traz a seção, com a razão do motor e a evidência por nome; o mapa não muda | 🟢 |
| RF-15 | A promoção lê as caixas da seção de fases e regenera o mapa com as etapas aprovadas, sem conhecer o motor | Must | Marcadas duas etapas, o mapa passa a trazê-las com data e evidência; `git status` mostra só o mapa alterado | 🟢 |
| RF-16 | Um comando próprio, só de leitura, conta as anomalias que o painel exibe em cada projeto de uma raiz, por código e por número de projetos, e indica quais códigos o mapa alcança; o aprendizado e a promoção o chamam ao fim | Must | Sobre `~/dev`, a saída lista cada código com ocorrências e projetos, a soma bate com a das leituras individuais dos 64 projetos, inclusive nas anomalias de linha longa, e `git status` não acusa arquivo alterado | 🟢 |
| RF-17 | Motor fora do ar encerra a rodada sem proposta pela metade, como na 012, também na passagem das fases | Must | Com o transporte recusando conexão na segunda pergunta, nada é escrito e a causa é nomeada | 🟢 |
| RF-18 | O preview ganha estados doentes que exercitam a feature sobre cópia do workspace, no molde do `estragar:descoberta` | Should | Existem ao menos os estados "ciclo com etapa não aprovada" e "encerrada com pendência", cada um conferido por suíte contra a leitura real do host | 🟡 |
| RF-19 | A pendência de origem fica declarada em `src/heranca/PROCEDENCIA.md`, sem adaptação nova | Should | A subseção de pendências de origem nomeia a fase de ciclo; o total de adaptações declaradas não muda | 🟢 |
| RF-20 | A leitura reconhece pela forma a extração encerrada sem declaração, e a tela e o terminal a nomeiam em texto próprio | Should | Nos 11 projetos medidos, a extração sai como encerrada sem declaração e a `fase-atual-ja-concluida` não chega à tela; no `capacities`, com `pending` povoado, a anomalia continua; as suítes da 011 passam sem linha reescrita | 🟢 |
| RF-21 | A proposta lista à parte, sem caixa de aprovação, o nome a até 2 caracteres de distância de edição de uma fase canônica, e esse nome não é enviado ao motor | Must | Com `escavacão` e `interpretaçao` na raiz, os dois saem na lista de erros de grafia, cada um com a fase canônica vizinha, e a promoção não tem como aprová-los | 🟢 |

## 6. Requisitos Não Funcionais

| Tipo | Requisito | Evidência ou justificativa | Confidência |
|------|-----------|----------------------------|-------------|
| Desempenho | A leitura completa da referência continua abaixo de 200 ms, e o julgamento das fases não abre arquivo que a sonda já não tenha trazido | `_reversa_sdd/sdd/leitura-do-processo.md#7-requisitos-não-funcionais`, RNF-01; o `state.json` já vem no instantâneo | 🟢 |
| Tamanho | O pacote da tela permanece abaixo da guarda de 60 % do teto de 409.600 B | `_reversa_sdd/addenda/012-equivalencias-de-checkpoint.md`, linha do RNF do painel; o mapa vive no host e não pesa na tela | 🟢 |
| Segurança | A camada de leitura continua sem escrita, sem processo filho e sem rede, verificável por inspeção; o único cliente de serviço do repositório continua sendo o do motor local, fora do pacote | `_reversa_sdd/sdd/leitura-do-processo.md#7-requisitos-não-funcionais`, RNF-04; `_reversa_sdd/addenda/012-equivalencias-de-checkpoint.md` | 🟢 |
| Privacidade | Do `state.json` alheio, só o nome candidato a fase e os nomes vizinhos da mesma lista chegam ao motor, e o motor é local. Os blocos de ciclo (`cycle_N`, com `motivo` e `politica`) não são lidos por parte alguma desta feature | Os blocos de ciclo do `afla` descrevem o projeto em prosa; a elisão da 012 existe pela mesma razão, e a pergunta 5 da sessão de 2026-09-21 os tirou da leitura | 🟢 |
| Manutenibilidade | Nenhum arquivo de `src/heranca/` é tocado, e nenhuma suíte das features 011, 012 e 014 é reescrita para passar | `_reversa_sdd/sdd/heranca-e-sincronia.md#6-requisitos-funcionais`; precedente do campo opcional na 012 | 🟢 |
| Acessibilidade | O ciclo, a procedência da etapa e a anomalia nova são texto, nunca só cor | `_reversa_sdd/addenda/011-estado-terminal-e-checkpoints.md`, linha do RNF do painel | 🟢 |
| Determinismo | A mesma raiz e o mesmo mapa produzem a mesma proposta; a suíte inteira passa com o motor desligado | Semente fixa e temperatura zero da 012; transporte injetável | 🟢 |

## 7. Critérios de Aceitação

```gherkin
Cenário: fase de ciclo não vira anomalia
  Dado um state.json com "escavacao-c2" em completed e o mapa sem etapa aprovada
  Quando o painel lê o projeto
  Então nenhuma anomalia fase-desconhecida sobre "escavacao-c2" chega à tela
  E a leitura herdada continua trazendo essa anomalia na lista bruta

Cenário: erro de grafia continua anomalia
  Dado um state.json com "escavacão" em completed
  Quando o painel lê o projeto
  Então a tela mostra fase-desconhecida com o nome "escavacão" à vista

Cenário: etapa fora do cânone espera aprovação
  Dado um state.json com "reconciliacao" em completed e o mapa sem etapa aprovada
  Quando o painel lê o projeto
  Então a tela mostra fase-desconhecida sobre "reconciliacao"

Cenário: etapa aprovada é reconhecida com procedência
  Dado o mapa com a etapa "verificacao-regressao" aprovada
  E um state.json com "verificacao-regressao" e "verificacao-regressao-c3" em completed
  Quando o painel lê o projeto
  Então as duas saem reconhecidas, a segunda com ciclo 3
  E a tela nomeia o mapa como origem do reconhecimento, com o nome bruto do disco

Cenário: encerramento declarado com fase pendente
  Dado um state.json com phase "concluido-c3" e "geracao-c3" em pending
  Quando o painel lê o projeto
  Então a extração aparece como encerrada
  E a tela mostra uma anomalia que nomeia "concluido-c3" e "geracao-c3"

Cenário: prosa no lugar de fase não é candidata
  Dado um state.json cujo pending guarda um parágrafo de 600 caracteres
  Quando o aprendizado varre a raiz
  Então o parágrafo não entra na proposta nem é enviado ao motor
  E o painel continua mostrando a anomalia

Cenário: qualquer sufixo numérico sobre fase canônica
  Dado um state.json com "geracao-2" e "revisao-ciclo-2" em completed
  Quando o painel lê o projeto
  Então os dois nomes saem reconhecidos como fases do ciclo 2
  E "geracao-2a" no mesmo arquivo continua fase-desconhecida

Cenário: o ciclo aparece na tela e no terminal
  Dado um state.json com as cinco fases canônicas e "reconhecimento-c3" em completed
  E "escavacao-c3" em pending
  Quando o painel lê o projeto, na tela e na linha de comando
  Então os dois declaram o terceiro ciclo em texto
  E as cinco fases mostram Reconhecimento concluída e as outras quatro pendentes

Cenário: número de etapa não é número de ciclo
  Dado o mapa com a etapa "re-extracao" aprovada
  E um state.json com "re-extracao-005" em completed e nenhuma fase de ciclo
  Quando o painel lê o projeto
  Então "re-extracao-005" sai reconhecida
  E o painel não declara ciclo algum

Cenário: extração encerrada sem declaração
  Dado um state.json com phase "revisao", as cinco fases em completed e pending vazio
  Quando o painel lê o projeto
  Então a extração aparece como encerrada sem declaração, em texto
  E a anomalia fase-atual-ja-concluida não chega à tela

Cenário: fase atual já concluída com trabalho pendente continua anomalia
  Dado um state.json com phase "interpretacao" em completed e pending povoado
  Quando o painel lê o projeto
  Então a tela mostra fase-atual-ja-concluida

Cenário: erro de grafia não é oferecido à aprovação
  Dado uma raiz com um projeto que grava "escavacão" em completed
  Quando o aprendizado roda
  Então a proposta lista "escavacão" entre os erros de grafia, ao lado de "escavacao"
  E o nome não tem caixa de aprovação nem é enviado ao motor

Cenário: projeto sem ciclo lê como antes
  Dado um state.json sem cycle, com as cinco fases canônicas e o mapa sem etapa aprovada
  Quando o painel lê o projeto
  Então a leitura é idêntica à de antes da feature

Cenário: o aprendizado propõe etapas sem tocar o mapa
  Dado uma raiz com três projetos que gravam "regressao", "verificacao-regressao" e "verificacao-de-regressao"
  Quando o aprendizado roda com o motor no ar
  Então a proposta traz a seção de fases com os três nomes e a evidência de cada um
  E o mapa não é alterado

Cenário: a contagem final cobre a raiz inteira
  Dado uma raiz com anomalias de checkpoint, de fase e de configuração
  Quando o comando de contagem roda sobre a raiz
  Então a saída lista, por código, as ocorrências e os projetos de todas as anomalias exibidas
  E indica quais códigos o mapa alcança
  E o aprendizado e a promoção terminam com a mesma contagem

Cenário: motor fora do ar na passagem das fases
  Dado o motor local indisponível
  Quando o aprendizado chega à pergunta sobre as etapas
  Então nada é escrito e a causa é nomeada

Cenário: host anterior à feature
  Dado uma tela nova recebendo a carga de um host que não conhece o ciclo
  Quando a tela desenha
  Então ela desenha o que desenhava antes, sem ciclo e com as anomalias de fase
```

## 8. Prioridade MoSCoW

| Item | MoSCoW | Justificativa |
|------|--------|---------------|
| RF-01, RF-02, RF-05, RF-06 | Must | São o reconhecimento pela forma, que sozinho tira dez das quinze anomalias do `afla` sem custo de motor e sem decisão pendente |
| RF-07 | Must | Sem ele a feature esconde o único defeito verdadeiro do `afla`, que hoje só se vê por acidente |
| RF-03, RF-04, RF-12 a RF-15, RF-17, RF-21 | Must | São o segundo eixo do mapa. Sem ele as etapas fora do cânone ficam sem caminho de decisão, e a alternativa seria a lista literal que a 011 recusou. O RF-13 é Must por decisão da sessão de 2026-09-21, pergunta 3, contra a recomendação de deixá-lo para depois, e por isso a prova de viabilidade do motor antecede o `/reversa-plan` |
| RF-08 | Must | Impede que o defeito de gravação do `DelphiSga` chegue à proposta como vocabulário |
| RF-09, RF-10, RF-11 | Must | O ciclo é o estado real do projeto re-extraído; sem ele o cartão mostra cinco fases concluídas de um ciclo que já passou |
| RF-16 | Must | Fecha a lacuna de processo que deixou estas anomalias invisíveis depois da primeira promoção |
| RF-20 | Should | Alcança 11 projetos com a mesma mudança de código; fica abaixo do Must porque a feature se sustenta sem ele |
| RF-18, RF-19 | Should | Verificação no preview e dívida com a origem, no molde das features anteriores |
| RNF de desempenho e de tamanho | Must | Tetos já fixados e medidos a cada entrega desde a 011 |

Fora de escopo, a avaliar em separado: `tipo-de-impacto-desconhecido` sobre `componente-novo` e
`regra-alterada`; `tabela-nao-reconhecida` sobre a tabela de observações sem peso de regressão; e as
nove grafias de chave de topo com que os projetos registram a re-extração. Nenhuma é de fase, e cada
uma pede medição própria.

`config-ausente` também fica fora, por decisão da sessão de 2026-09-21, pergunta 9, que veio como
"decida você": ela responde por 56 das 184 anomalias da raiz, uma por projeto instalado antes da
política configurável, e merece avaliação própria sobre ser desenhada como estado da política, e não
como anomalia. Misturá-la aqui mudaria a leitura de 56 projetos numa feature que trata de seis.

Dois assuntos do registro de bugs foram decididos na mesma sessão e seguem pelo `/reversa-debugger`,
fora desta feature: o leitor de front matter que toma `blocking: []   # comentário` por bloqueio, e
a regra da faixa de espera, que deixa de subir por bloqueio o bug já encerrado.

## 9. Esclarecimentos

### Sessão 2026-09-21

Colhida por formulário escrito. Perguntas em `perguntas/fases-e-ciclo.json`, versão `84f90f5c4780`;
respostas em `perguntas/respostas/respostas-fases-e-ciclo-2026-09-21.md`. Três perguntas vieram como
"decida você e me mostre o resultado", e a decisão tomada está dita em cada uma.

- **Q:** O que o painel reconhece pela forma, sem aprovação de ninguém, como fase de ciclo?
  **R:** Fase canônica seguida de qualquer sufixo numérico (`-c2`, `-2`, `-ciclo-2`). Aplicada na
  RN-01 e no RF-01.
- **Q:** Como tratar `re-extracao-NNN` e o sufixo sobre etapa aprovada em geral?
  **R:** Etapa `re-extracao` no mapa; sufixo numérico sobre etapa aprovada é reconhecido sem nova
  aprovação. Aplicada na RN-03 e no RF-05, que subiu a Must.
- **Q:** A segunda pergunta ao motor local entra nesta feature?
  **R:** Com motor agora, como Must, com prova de viabilidade antes do plano. Aplicada no RF-13 e na
  seção 8. A recomendação era deixá-la para depois; a decisão foi a contrária.
- **Q:** O erro de grafia de fase canônica é apontado na proposta por regra determinística?
  **R:** Sim, por distância de edição até 2, em lista à parte e sem caixa de aprovação. Virou a
  RN-12 e o RF-21, e tirou do vocabulário do motor a resposta "erro de grafia".
- **Q:** De onde o painel tira o número do ciclo?
  **R:** Decida você. Decidido: do maior sufixo entre as fases de ciclo reconhecidas, sem ler chave
  de topo alguma. Aplicada na RN-08 e no RF-09, que perdeu a data de início e o motivo do ciclo.
- **Q:** Num projeto com mais de um ciclo, o que as cinco fases mostram?
  **R:** A situação do ciclo corrente, com uma frase nomeando o ciclo; os anteriores não aparecem.
  Aplicada na RN-08 e no RF-10.
- **Q:** A extração que terminou sem declarar o fim entra nesta feature?
  **R:** Decida você. Decidido: entra, como Should, reconhecida pela forma. Virou a RN-11 e o RF-20,
  e o título da feature ganhou o encerramento não declarado.
- **Q:** A contagem de anomalias da raiz, por código, vira comando próprio?
  **R:** Comando próprio, só de leitura, chamado também pelo aprendizado e pela promoção. Aplicada
  na RN-10 e no RF-16.
- **Q:** O que fazer com `config-ausente`?
  **R:** Decida você. Decidido: fora da 015, com avaliação própria depois. Registrada na seção 8.
- **Q:** O defeito do leitor de front matter segue por qual caminho?
  **R:** Em texto livre: "Se o reversa já fechou o debug, então o problema é a extensão ler o YAML
  'de forma equivocada'. Precisamos corrigir a extensão." Lida como ordem de corrigir a extensão, o
  que neste repositório se faz pelo `/reversa-debugger`, fora desta feature. Registrada na seção 8.
- **Q:** O aviso de bloqueio deve passar a ignorar o bug já encerrado?
  **R:** Mudar: bug encerrado não sobe à faixa por bloqueio. A recomendação era manter a regra; a
  decisão foi a contrária. Segue junto com o defeito acima, fora desta feature.

## 10. Lacunas

Nenhuma dúvida em aberto. Duas premissas foram adotadas para aplicar as respostas, e ficam à vista
para contestação antes do plano:

- 🟡 O separador do sufixo numérico é o hífen ou o sublinhado. Nas listas de fases medidas só
  aparece o hífen; o sublinhado entra porque os checkpoints do `afla` o usam (`scout_c2`).
- 🟡 O vocabulário de três respostas do RF-13 é o ponto de partida da prova de viabilidade, e não o
  resultado dela. Na 012, foi a prova que mostrou que quatro valores acertavam onde dois erravam.

## 11. Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-09-21 | Versão inicial gerada por `/reversa-requirements`, a partir da apuração das 18 anomalias do `afla` | reversa |
| 2026-09-21 | Sessão de esclarecimento por formulário escrito, onze perguntas respondidas: sufixo numérico amplo na RN-01, RN-03 generalizada, RF-13 mantido como Must com prova de viabilidade antes do plano, ciclo derivado do sufixo, e três regras novas (RN-11, RN-12) com os RF-20 e RF-21. Origem: `perguntas/respostas/respostas-fases-e-ciclo-2026-09-21.md` | reversa, sobre respostas de iago |
