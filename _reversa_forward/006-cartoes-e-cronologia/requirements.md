# Requirements: cartões e cronologia

> Identificador: `006-cartoes-e-cronologia`
> Data: `2026-09-09`
> Pasta da extração reversa: `_reversa_sdd/`
> Confidência: 🟢 CONFIRMADO, 🟡 INFERIDO, 🔴 LACUNA / DÚVIDA

## 1. Resumo executivo

A feature corrige e amplia o painel do processo em três frentes. Primeira, torna possível manter
todas as seções abertas ao mesmo tempo, estado que hoje o painel não sabe representar, e acrescenta
duas ações que abrem e fecham todas de uma vez. Segunda, dá ao painel a cronologia que lhe falta:
a decomposição da feature ativa ação a ação, distinguindo o que está feito do que falta, a trilha do
que já foi executado e o histórico de todas as features do projeto, com um resumo consultável do
conjunto que o editor abre sob comando.
Terceira, passa a exibir todo instante no horário de Brasília, e não no tempo universal cru em que os
arquivos do Reversa o gravam. Quem ganha é o Retomador, persona primária do produto, que hoje sabe
em que estágio a feature está mas não sabe quanto dela foi feito nem o que veio antes.

Neste documento, cartão e seção nomeiam a mesma coisa: cada bloco recolhível do painel, com título
clicável, tal como `src/webview/ui/CollapsibleSection.tsx` o desenha.

## 2. Contexto a partir do legado

Este projeto nasceu greenfield pelo `/reversa-new`, de modo que a extração não tem `architecture.md`
nem `domain.md`. As fontes equivalentes são o PRD, documento de requisitos do produto, as cinco
especificações de componente e os cinco adendos
vigentes que o `/reversa-sync` escreveu ao fim de cada feature entregue.

| Fonte | Trecho relevante | Confidência |
|-------|------------------|-------------|
| `_reversa_sdd/sdd/painel-do-processo.md#6-requisitos-funcionais` | O RF-12 daquela spec pede que cada seção seja recolhível e que a preferência seja guardada no estado da webview. É o requisito que esta feature encontra cumprido pela metade. | 🟢 |
| `_reversa_sdd/sdd/painel-do-processo.md#4-non-goals-fora-do-escopo` | NG-02 proíbe interpretar Markdown dentro da webview: o painel aponta o arquivo e o editor o abre. NG-03 mantém a atualização fora do automático. | 🟢 |
| `_reversa_sdd/sdd/painel-do-processo.md#11-edge-cases-e-tratamento-de-erros` | EC-02 fixa o recorte por volume, com as dez primeiras entradas e a contagem total. EC-09 manda descartar em silêncio nome de seção que não existe mais. | 🟢 |
| `_reversa_sdd/prd.md#5-nao-objetivos-out` | A trilha de execução é um dos cinco eixos adiados por custo de tela, e a escrita de arquivo por conta própria é vedada em camada alguma. | 🟢 |
| `_reversa_sdd/prd.md#pendencias-de-cobertura` | O item 2 manda reabrir um eixo adiado quando ele for necessário numa retomada concreta. Esta feature é essa retomada. | 🟢 |
| `_reversa_sdd/prd.md#6-restricoes` | O invariante que sobrevive à evolução é a extensão nunca escrever arquivo, e a camada de leitura não expõe função capaz de escrever, criar, remover ou executar. | 🟢 |
| `_reversa_sdd/sdd/leitura-do-processo.md#6-requisitos-funcionais` | Daquela spec: o estágio é classificado pelos artefatos presentes (RF-04), adendo superado é tratado como ausente (RF-05), as ações são contadas varrendo o arquivo inteiro (RF-06) e a leitura é abandonada acima do teto de bytes (RF-09). | 🟢 |
| `_reversa_sdd/sdd/ponte-e-host.md#9-modelo-de-dados` | O protocolo entre host e webview cresce por acréscimo: campo novo é permitido, renomear e remover não. | 🟢 |
| `_reversa_sdd/addenda/003-painel-do-processo.md` (vigente) | RF-22 daquela feature fixou o padrão inicial de exibição, com as três seções de diagnóstico recolhidas, e OQ-03 decidiu o relatório da sonda recolhido por padrão. A preferência guardada é a única estrutura que o painel persiste. | 🟢 |
| `_reversa_sdd/addenda/004-heranca-e-sincronia.md` (vigente) | A camada de leitura é vendorizada de duas origens, e todo arquivo herdado carrega carimbo de origem e revisão. Alterá-la exige declarar a adaptação em `src/heranca/PROCEDENCIA.md`. | 🟢 |
| `_reversa_sdd/addenda/005-empacotamento-e-verificacao.md` (vigente) | Existem o preview fora do editor e a guarda de tamanho do pacote da tela, com teto de 409.600 bytes. O portão visual passou a ser cumprível. | 🟢 |

Três observações do código sustentam o diagnóstico da frente de exibição, e são o motivo de a queixa
ser um defeito e não apenas um pedido. Em `src/webview/domain/sections.ts`, a função que decide o
que abre recolhido devolve o padrão sempre que a lista de seções recolhidas está vazia, de sorte que
a lista vazia significa duas coisas incompatíveis: nunca houve preferência, e o usuário abriu tudo.
Em `src/webview/main.tsx`, a preferência é recalculada a cada alternância, o que faz a segunda
leitura acontecer de imediato. O efeito observável é que expandir a última seção de diagnóstico
recolhe as outras duas na mesma ação, e o estado de tudo aberto nunca se sustenta. A suíte de
`tests/webview-sections.spec.ts` fixa esse comportamento, portanto a correção passa por reescrever o
caso que hoje afirma o defeito.

## 3. Personas e cenários de uso

| Persona | Objetivo | Cenário-chave |
|---------|----------|---------------|
| O Retomador (primária) | Recuperar o estado do projeto depois de semanas de pausa, sem abrir arquivo | Abre o painel, abre tudo com uma ação, lê o que já foi entregue nas features anteriores e onde a atual parou |
| O Operador | Confirmar, várias vezes na mesma sessão, que a execução avançou | Relê o processo depois de rodar um agente e vê quantas ações fecharam, qual é a próxima aberta e a que horas isso foi lido |
| O Retomador em tela estreita | Ler o painel numa barra lateral de 300 px sem perder o essencial | Recolhe tudo com uma ação, mantém à vista apenas os títulos e a faixa de bloqueio, e abre uma seção por vez |

## 4. Regras de negócio novas ou alteradas

1. **RN-01:** A preferência de exibição declarada pelo usuário vence o padrão inicial em qualquer
   caso, inclusive quando declara que nenhuma seção está recolhida. 🟢
   - Origem no legado: `_reversa_sdd/sdd/painel-do-processo.md#9-modelo-de-dados` e RF-22 registrado
     em `_reversa_sdd/addenda/003-painel-do-processo.md`
   - Tipo: alterada
2. **RN-02:** O padrão inicial permanece o de hoje para os cartões que já existem, com os de
   diagnóstico recolhidos e o de anomalias aberto quando a leitura degradou, e vale apenas enquanto
   não houver preferência declarada. 🟢
   - Origem no legado: `_reversa_sdd/sdd/painel-do-processo.md#8-design-e-interface`
   - Tipo: alterada
3. **RN-03:** A faixa de bloqueio humano não é cartão recolhível, e nenhuma ação global pode
   escondê-la. O que aguarda decisão do usuário fica visível em qualquer estado de exibição. 🟢
   - Origem no legado: `_reversa_sdd/sdd/painel-do-processo.md#6-requisitos-funcionais`, RF-03 daquela spec
   - Tipo: nova
4. **RN-04:** A situação de cada ação vem do marcador da própria linha em `actions.md`, nunca de
   campo autodeclarado do estado, pelo mesmo motivo que faz o estágio ser derivado dos artefatos
   físicos. 🟢
   - Origem no legado: `_reversa_sdd/sdd/leitura-do-processo.md#6-requisitos-funcionais`, RF-04 daquela spec
   - Tipo: nova
5. **RN-05:** Ação aberta na seção de emendas conta como aberta e reabre a feature, e a decomposição
   deve mostrá-la como tal, sem tratamento à parte. 🟢
   - Origem no legado: `_reversa_sdd/sdd/leitura-do-processo.md#6-requisitos-funcionais`, RF-06 daquela spec
   - Tipo: nova
6. **RN-06:** O histórico cobre toda pasta de feature existente em `_reversa_forward/`, tenha ela
   convergido ou não. O adendo vigente qualifica a entrega como convergida, e a sua ausência é
   informação a exibir, jamais motivo para omitir a feature. Adendo superado equivale a adendo
   ausente. 🟢
   - Origem no legado: `_reversa_sdd/sdd/leitura-do-processo.md#6-requisitos-funcionais`, RF-05 daquela spec
   - Tipo: nova
7. **RN-07:** A extensão não escreve arquivo, em camada alguma. O resumo consultável do que já foi
   feito é entregue de duas maneiras que não tocam o disco, um documento não salvo aberto no editor
   e uma cópia para a área de transferência, de sorte que gravar é ato do usuário. 🟢
   - Origem no legado: `_reversa_sdd/prd.md#6-restricoes`
   - Tipo: mantida, e detalhada aqui pela decisão da sessão de esclarecimentos
8. **RN-08:** A webview não interpreta Markdown. A leitura das tabelas de `actions.md` e dos adendos
   acontece na camada que já toca o disco, e o que atravessa a ponte é valor tipado. 🟢
   - Origem no legado: `_reversa_sdd/sdd/painel-do-processo.md#4-non-goals-fora-do-escopo`, NG-02 daquela spec
   - Tipo: mantida, e registrada aqui por decidir onde o novo trabalho de leitura mora
9. **RN-09:** Instante viaja em forma absoluta e ordenável, e é convertido apenas na apresentação,
   para o fuso de Brasília, com deslocamento de três horas a menos que o tempo universal. O painel
   não adota o fuso da máquina, porque o usuário quer sempre o horário de Brasília. O deslocamento
   é constante desde que o país deixou de adotar horário de verão, em 2019, e a conversão deve ser
   feita pelo nome do fuso, e não pelo número, para que uma mudança futura da lei não faça o painel
   mentir. 🟡
   - Origem no legado: nova exigência do usuário, sem regra anterior a alterar
   - Tipo: nova
10. **RN-10:** A recência de uma ação fechada vem do último evento dela na trilha de execução.
    Faltando evento, vale a posição da ação no arquivo, e a linha declara que a data não foi
    registrada em vez de exibir campo vazio. 🟡
    - Origem no legado: `_reversa_sdd/sdd/leitura-do-processo.md#9-modelo-de-dados`, que reduz os
      eventos da trilha por ação e preserva o momento de cada um
    - Tipo: nova
11. **RN-11:** Os dois cartões novos entram na ordem declarada da tela e têm padrão inicial próprio:
    a decomposição da feature ativa abre expandida, por ser núcleo da retomada, e o histórico das
    entregas abre recolhido, com a contagem visível no título, por ser leitura longa. 🟡
    - Origem no legado: `_reversa_sdd/sdd/painel-do-processo.md#8-design-e-interface`
    - Tipo: nova

O projeto não tem `.reversa/principles.md`, de sorte que nenhuma destas regras confronta
princípio declarado. As restrições que fazem o papel de princípio aqui são as do PRD, e estão
citadas uma a uma acima.

Adendo vigente, neste documento, é o adendo cuja seção de vigência não registra superação, tal
como `/reversa-sync` o escreve.

## 5. Requisitos Funcionais

| ID | Requisito | Prioridade | Critério de aceite | Confidência |
|----|-----------|------------|--------------------|-------------|
| RF-01 | O sistema deve permitir que todos os cartões estejam expandidos ao mesmo tempo, e preservar esse estado quando o painel é ocultado e reaberto | Must | Expandir todos os cartões, ocultar o painel e voltar mantém todos expandidos | 🟢 |
| RF-02 | O usuário deve poder expandir todos os cartões com uma única ação | Must | Com quatro cartões recolhidos, uma ação deixa zero recolhidos | 🟢 |
| RF-03 | O usuário deve poder recolher todos os cartões com uma única ação | Must | Com todos expandidos, uma ação deixa todos recolhidos, e apenas os títulos permanecem visíveis | 🟢 |
| RF-04 | As duas ações globais devem declarar o próprio efeito e ficar indisponíveis quando não teriam nenhum | Should | Com tudo expandido, a ação de expandir tudo aparece desabilitada e assim se anuncia à leitura assistiva | 🟡 |
| RF-05 | A preferência guardada deve distinguir a ausência de declaração da declaração de que nada está recolhido, e continuar tolerante a conteúdo escrito por versão anterior | Must | Um estado gravado sem o campo novo produz o padrão inicial, e um estado que declara zero seções recolhidas mantém tudo aberto | 🟢 |
| RF-06 | O sistema deve exibir a decomposição da feature ativa, uma linha por ação, com identificador, descrição, fase de origem e situação entre fechada e aberta | Must | Uma feature com trinta e quatro ações exibe cada linha com os quatro campos, e a situação vem do marcador da própria linha | 🟢 |
| RF-07 | O sistema deve destacar a primeira ação aberta como próxima a executar, e exibir a contagem de fechadas sobre o total | Must | Numa feature com vinte de trinta e quatro fechadas, a vigésima primeira aparece destacada e a contagem diz vinte de trinta e quatro | 🟢 |
| RF-08 | O sistema deve exibir a trilha de execução da feature ativa, por ação, com o momento registrado e os arquivos tocados | Should | Uma ação com evento na trilha mostra o horário e a lista de arquivos; uma sem evento mostra que não há registro | 🟢 |
| RF-09 | O sistema deve exibir o histórico de todas as features do projeto, uma entrada por pasta de `_reversa_forward/`, com identificador, situação entre convergida, pausada e em aberto, data e resumo de uma linha, da mais recente para a mais antiga | Must | Um projeto com seis pastas, cinco adendos vigentes e uma feature pausada mostra seis entradas, e a pausada aparece nomeada como tal | 🟢 |
| RF-10 | Todo artefato nomeado na cronologia deve abrir no editor por clique, pela mesma mensagem que o painel já usa | Must | Clicar no nome de um adendo envia a mensagem de abrir com o caminho relativo, e nenhum componente chama o editor diretamente | 🟢 |
| RF-11 | O sistema deve recortar a decomposição, exibindo por padrão todas as ações abertas mais as cinco fechadas mais recentes, com a contagem total à vista e um controle que revela o resto | Should | Uma feature com sessenta e uma ações, das quais quatro abertas, exibe nove linhas, informa sessenta e uma no total e revela as demais sob comando | 🟢 |
| RF-12 | O sistema deve reunir num documento não salvo, aberto no editor sob comando do usuário, o resumo do que já foi feito no projeto e a situação da feature atual | Must | O comando abre um documento novo e não salvo com o resumo, e nenhuma escrita em disco parte da extensão | 🟢 |
| RF-13 | O sistema deve nomear cada estado vazio da cronologia, em vez de deixar espaço em branco | Must | Sem feature ativa, sem adendo, sem trilha ou sem tabela de ações, cada caso aparece declarado por nome | 🟢 |
| RF-14 | O sistema deve declarar quando a cronologia está incompleta por degradação da leitura, nomeando o arquivo que faltou | Must | Um `actions.md` acima do teto de bytes produz aviso na seção e consta da lista de truncados do relatório da sonda | 🟢 |
| RF-15 | O sistema deve exibir todo instante no horário de Brasília, no formato numérico curto com o fuso declarado, incluindo o momento da leitura, as conclusões de checkpoint, os eventos da trilha e as datas do histórico | Must | Um instante gravado às 20h43 do tempo universal aparece como `09/09/2026 17:43 (Brasília)`, e em nenhum lugar do painel resta texto em tempo universal cru | 🟢 |
| RF-16 | O sistema deve manter o instante absoluto disponível junto do texto convertido, sem exigir cálculo do leitor | Should | O elemento que mostra o horário local carrega o valor original em atributo consultável | 🟡 |
| RF-17 | O usuário deve poder copiar o mesmo resumo para a área de transferência por uma ação do cabeçalho | Should | A ação copia o texto integral do resumo, e o painel confirma a cópia sem abrir documento algum | 🟢 |
| RF-18 | O sistema deve desenhar os sete cartões recolhíveis nesta ordem: ciclo forward, decomposição da feature ativa, histórico das entregas, descoberta, política, anomalias e relatório da sonda, sempre abaixo da faixa de bloqueio humano, que não é cartão | Must | A ordem no documento renderizado corresponde à declarada, e não muda entre releituras | 🟢 |

## 6. Requisitos Não Funcionais

| Tipo | Requisito | Evidência ou justificativa | Confidência |
|------|-----------|----------------------------|-------------|
| Usabilidade | O painel continua legível em 300 px de largura, sem rolagem horizontal, com os dois cartões novos dentro | `_reversa_sdd/sdd/painel-do-processo.md#7-requisitos-nao-funcionais`, RNF-01 daquela spec | 🟢 |
| Desempenho | O pacote da tela permanece abaixo de 409.600 bytes, medido pela guarda que a feature 005 instalou. A medida atual é de 169.050 bytes somando folha e script | `scripts/limites.js` e `_reversa_sdd/addenda/005-empacotamento-e-verificacao.md` | 🟢 |
| Desempenho | A pintura após receber o processo permanece abaixo de 100 ms, com a feature ativa de maior porte já observada, de sessenta e uma ações e sessenta e três eventos de trilha | `_reversa_sdd/sdd/painel-do-processo.md#7-requisitos-nao-funcionais`, RNF-02 daquela spec, e a medição de `_reversa_forward/003-painel-do-processo/` | 🟡 |
| Desempenho | A leitura ampliada percorre no máximo cinquenta pastas de feature por vez, em ordem de nome, e relata truncamento ao ultrapassar esse número | Precedente do teto de cinquenta adendos em `src/heranca/reversa-probe/src/snapshot.ts` | 🟡 |
| Acessibilidade | Situação de ação e estado de cartão são distinguíveis sem cor, e toda ação nova é acionável por teclado | `_reversa_sdd/sdd/painel-do-processo.md#7-requisitos-nao-funcionais`, RNF-03 daquela spec | 🟢 |
| Manutenibilidade | Toda decisão de apresentação continua em função pura fora dos componentes visuais, com cobertura de 100% de linhas | `_reversa_sdd/sdd/painel-do-processo.md#7-requisitos-nao-funcionais`, RNF-05 daquela spec | 🟢 |
| Segurança | Nenhuma camada abre arquivo para escrita, e a camada de leitura não expõe função capaz de escrever, criar, remover ou executar | `_reversa_sdd/prd.md#6-restricoes` | 🟢 |
| Segurança | A leitura de arquivo respeita o teto de 262.144 bytes por arquivo e relata o truncamento, em vez de carregar sem limite | `src/heranca/reversa-probe/src/files.ts` e `_reversa_sdd/sdd/leitura-do-processo.md#6-requisitos-funcionais`, RF-09 daquela spec | 🟢 |
| Compatibilidade | Todo campo novo do protocolo entre host e webview é acréscimo, sem renomear nem remover o que existe | `_reversa_sdd/sdd/ponte-e-host.md#9-modelo-de-dados` | 🟢 |
| Reprodutibilidade | A leitura ampliada não altera arquivo vendorizado: ela reutiliza as funções de leitura que a sonda herdada já exporta. Se o plano vier a exigir alteração no que é vendorizado, ela só ocorre com adaptação declarada em `src/heranca/PROCEDENCIA.md`, sob o ritual da feature 004 | `src/heranca/reversa-probe/src/index.ts` e `_reversa_sdd/addenda/004-heranca-e-sincronia.md` | 🟢 |
| Observabilidade | Nenhuma versão é empacotada sem passar pelo preview fora do editor, com os estados novos observados na tela | `_reversa_sdd/sdd/painel-do-processo.md#13-plano-de-rollout` | 🟢 |

## 7. Critérios de Aceitação

```gherkin
Cenário: todos os cartões abertos ao mesmo tempo (RF-01)
  Dado um painel com processo lido e as três seções de diagnóstico recolhidas
  Quando o usuário expande a última delas
  Então todos os cartões ficam expandidos e nenhum volta a recolher sozinho

Cenário: a preferência de tudo aberto sobrevive ao painel ser ocultado (RF-01, RF-05)
  Dado um painel com todos os cartões expandidos
  Quando o usuário oculta o painel e o reabre
  Então todos continuam expandidos

Cenário: expandir tudo numa ação (RF-02)
  Dado um painel com quatro cartões recolhidos
  Quando o usuário aciona expandir tudo
  Então nenhum cartão permanece recolhido

Cenário: recolher tudo numa ação (RF-03)
  Dado um painel com todos os cartões expandidos
  Quando o usuário aciona recolher tudo
  Então todos ficam recolhidos e apenas os títulos permanecem visíveis

Cenário: recolher tudo não esconde o que aguarda decisão (RN-03)
  Dado um processo com entrega concluída e sem adendo
  Quando o usuário aciona recolher tudo
  Então a faixa de bloqueio humano continua visível com a razão nomeada

Cenário: ação global sem efeito fica indisponível (RF-04)
  Dado um painel com todos os cartões expandidos
  Quando o usuário observa o cabeçalho
  Então a ação de expandir tudo aparece desabilitada e a de recolher tudo, disponível

Cenário: preferência escrita por versão anterior não quebra o painel (RF-05)
  Dado um estado guardado sem o campo que declara a preferência
  Quando o painel é aberto
  Então vale o padrão inicial, com os cartões de diagnóstico recolhidos

Cenário: os dois cartões novos e a ordem da tela (RF-18, RN-11)
  Dado um painel com processo lido e nenhuma preferência declarada
  Quando o painel é desenhado
  Então os sete cartões recolhíveis aparecem na ordem declarada, abaixo da faixa de bloqueio,
  com a decomposição expandida
  E o histórico recolhido, com a contagem de features no título

Cenário: a decomposição da feature ativa (RF-06, RN-04)
  Dado uma feature ativa com trinta e quatro ações, das quais vinte fechadas
  Quando o usuário revela a decomposição por inteiro
  Então cada linha mostra identificador, descrição, fase e situação lida do marcador da própria linha

Cenário: a próxima ação a executar (RF-07)
  Dado a mesma feature com vinte ações fechadas
  Quando o painel é lido
  Então a vigésima primeira aparece destacada como próxima e a contagem diz vinte de trinta e quatro

Cenário: o recorte padrão da decomposição (RF-11, RN-10)
  Dado uma feature com sessenta e uma ações, das quais quatro abertas
  Quando o painel é lido
  Então aparecem as quatro abertas e as cinco fechadas mais recentes pela trilha
  E a contagem total informa sessenta e uma, com um controle que revela as demais

Cenário: fechada sem evento na trilha (RN-10)
  Dado uma ação fechada cuja trilha não registra evento
  Quando a decomposição a ordena por recência
  Então ela é posicionada pela ordem do arquivo e a linha declara que a data não foi registrada

Cenário: emenda aberta reabre a feature (RN-05)
  Dado uma feature com todas as ações do corpo fechadas e uma emenda aberta
  Quando o painel é lido
  Então a emenda aparece como ação aberta e o estágio continua o de execução em progresso

Cenário: a trilha de execução por ação (RF-08)
  Dado uma feature cuja trilha registra quarenta e quatro eventos
  Quando o usuário abre a cronologia
  Então cada ação com evento mostra o horário e os arquivos tocados, e as demais declaram que não há registro

Cenário: o histórico cobre toda pasta de feature (RF-09, RN-06)
  Dado um projeto com seis pastas em `_reversa_forward/`, cinco adendos vigentes e uma feature pausada
  Quando o painel é lido
  Então as seis entradas aparecem da mais recente para a mais antiga
  E a feature sem adendo aparece nomeada como pausada, não omitida

Cenário: adendo superado não conta como convergência (RN-06)
  Dado um projeto com cinco adendos, um deles marcado como superado
  Quando o painel é lido
  Então a feature correspondente aparece no histórico como entrega ainda não convergida

Cenário: leitura ampliada acima do teto de pastas (RNF de desempenho)
  Dado um projeto com mais de cinquenta pastas de feature
  Quando o painel é lido
  Então cinquenta são percorridas em ordem de nome, e o relatório da sonda declara o truncamento

Cenário: abrir o artefato apontado (RF-10)
  Dado o histórico com o adendo da feature 003 listado
  Quando o usuário clica no nome do arquivo
  Então a mensagem de abrir é enviada com o caminho relativo, e o editor abre o arquivo

Cenário: resumo em documento não salvo (RF-12, RN-07)
  Dado um projeto com cinco features entregues e uma em execução
  Quando o usuário aciona o comando de resumo no cabeçalho
  Então um documento novo e não salvo abre no editor com as entregas anteriores e a situação da atual
  E nenhuma escrita de arquivo parte da extensão

Cenário: resumo na área de transferência (RF-17, RN-07)
  Dado o mesmo projeto
  Quando o usuário aciona a ação de copiar o resumo
  Então o texto integral vai para a área de transferência e o painel confirma a cópia
  E nenhum documento é aberto e nenhuma escrita parte da extensão

Cenário: sem feature ativa a cronologia não fica em branco (RF-13)
  Dado um projeto sem feature ativa registrada
  Quando o painel é lido
  Então a cronologia declara por nome que não há feature ativa, e o histórico segue visível

Cenário: leitura truncada é declarada (RF-14)
  Dado um arquivo de ações acima do teto de 262.144 bytes
  Quando o painel é lido
  Então a cronologia avisa que a decomposição está incompleta, nomeia o arquivo, e o relatório da sonda o lista como truncado

Cenário: duas releituras em sequência (RF-01, RF-06)
  Dado um painel com a cronologia aberta e a lista de ações revelada por inteiro
  Quando o usuário aciona a releitura duas vezes em sequência rápida
  Então vale a última leitura recebida, o momento exibido é o mais recente
  E os cartões abertos continuam abertos, sem mudar de lugar

Cenário: instante exibido no horário de Brasília (RF-15, RN-09)
  Dado uma leitura registrada às 20h43 do tempo universal de 9 de setembro de 2026
  Quando o cabeçalho mostra o momento da leitura
  Então o texto diz `09/09/2026 17:43 (Brasília)`
  E nenhum instante do painel aparece em tempo universal cru

Cenário: o instante absoluto continua disponível (RF-16)
  Dado o mesmo momento de leitura
  Quando alguém inspeciona o elemento que o mostra
  Então o valor original em forma absoluta e ordenável está no atributo consultável do elemento

Cenário: instante ausente ou ilegível (RF-13, RF-15)
  Dado um evento de trilha sem momento registrado
  Quando a cronologia o desenha
  Então a linha declara que o momento não foi registrado, em vez de mostrar campo vazio ou data inválida
```

## 8. Prioridade MoSCoW

| Item | MoSCoW | Justificativa |
|------|--------|---------------|
| RF-01, RF-05 | Must | É a correção do defeito que originou a queixa. Sem ela, as ações globais teriam efeito revertido no render seguinte |
| RF-02, RF-03 | Must | São o pedido literal do usuário, e o que torna o painel utilizável em tela estreita |
| RF-06, RF-07 | Must | Respondem à pergunta central da segunda queixa: o que está feito e o que falta |
| RF-09 | Must | É o histórico do que já foi feito, e a matéria-prima do resumo consultável |
| RF-12 | Must | Substitui o arquivo que o usuário pediu, pela única forma que não viola o invariante de não escrever |
| RF-10, RF-13, RF-14 | Must | Herdados do painel: nome de artefato abre no editor, nada fica em branco, degradação é declarada |
| RF-15 | Must | Pedido explícito do usuário, e condição para que a cronologia seja legível em vez de decifrável |
| RF-18 | Must | Ordem estável é o que permite aprender o painel; dois cartões novos sem ordem declarada a desfariam |
| RF-04, RF-08, RF-11, RF-16, RF-17 | Should | Melhoram a leitura sem que a ausência delas invalide a entrega |
| RNF de teto de pastas | Should | Protege a leitura de um projeto grande, e hoje seis pastas estão longe do limite de cinquenta |
| RNF de desempenho do pacote | Should | A folga atual é de mais de 240.000 bytes, e a guarda automática já falha o build se o teto for rompido |
| RNF de pintura abaixo de 100 ms | Should | A medida exige o painel aberto, e o portão visual da entrega é o lugar onde ela cabe |

## 9. Esclarecimentos

### Sessão 2026-09-09

- **Q:** Como entregar o resumo consultável do que já foi feito, dado que a extensão não pode
  escrever arquivo em camada alguma?
  **R:** As três formas juntas. O histórico dos adendos fica sempre visível no painel, e o cabeçalho
  ganha duas ações: abrir um documento não salvo com o resumo reunido, e copiar o resumo para a área
  de transferência. Integrado em RF-12, RF-17 e RN-07.
- **Q:** Qual o alcance do histórico das features entregues?
  **R:** Todas as pastas de `_reversa_forward/`, inclusive feature sem adendo e feature pausada.
  Integrado em RF-09, RN-06 e no requisito de reprodutibilidade da seção 6.
- **Q:** Onde a cronologia mora na tela?
  **R:** Em dois cartões novos, um para a decomposição da feature ativa e outro para o histórico das
  entregas anteriores, porque se leem em momentos diferentes. Integrado em RF-18 e RN-11.
- **Q:** Em que formato o instante deve aparecer no horário de Brasília?
  **R:** Numérico curto com o fuso declarado, na forma `09/09/2026 17:43 (Brasília)`. Integrado em
  RF-15.
- **Q:** Quantas ações mostrar antes do corte, na decomposição da feature ativa?
  **R:** Todas as abertas mais as cinco fechadas mais recentes, com a contagem total à vista e um
  controle que revela o resto. Integrado em RF-11 e RN-10.

## 10. Lacunas

Nenhuma lacuna em aberto. As três dúvidas do documento inicial foram resolvidas na sessão de
esclarecimentos de 2026-09-09 e estão integradas aos requisitos.

## 11. Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-09-09 | Versão inicial gerada por `/reversa-requirements` | reversa |
| 2026-09-09 | Cinco esclarecimentos integrados por `/reversa-clarify`: forma do resumo, alcance do histórico, lugar da cronologia, formato do horário e recorte da decomposição. Acrescentados RF-17, RF-18, RN-10 e RN-11 | reversa |
| 2026-09-09 | Reconciliação durante `/reversa-plan`: a faixa de bloqueio ocupa nome de seção mas não é cartão recolhível, logo RF-18 fala em sete cartões; e a leitura ampliada dispensa alteração no código vendorizado | reversa |
