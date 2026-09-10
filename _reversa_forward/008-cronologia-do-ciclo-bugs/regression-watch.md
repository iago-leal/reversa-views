# Vigilância de regressão: 008-cronologia-do-ciclo-bugs

**Data:** 2026-09-10
**Feature:** `008-cronologia-do-ciclo-bugs`
**Cenário:** greenfield.

Este projeto não tem extração de `/reversa`: o contexto vem de `_reversa_sdd/prd.md` e das cinco
specs de `_reversa_sdd/sdd/`. Não há regra 🟢 confirmada sobre código existente, e por isso o watch
principal nasce vazio. O que esta entrega deixou de verdades a manter está em "Observações", sem
peso de regressão. Elas ganham peso quando uma `/reversa` futura, rodando sobre o código novo,
confirmar cada uma como 🟢.

## Watch principal

| ID | Origem (arquivo, seção) | Regra esperada após mudança | Tipo de verificação | Sinal de violação |
|---|---|---|---|---|
| | | | | |

Vazio nesta rodada. Nenhuma regra extraída de código existente foi alterada ou removida, porque
nenhuma foi extraída ainda.

## Histórico de re-extrações

Vazio. Será preenchido pelo agente reverso quando `/reversa` rodar de novo sobre este código.

## Arquivadas

Vazio.

## Observações

Sem peso de regressão. São os requisitos funcionais que esta entrega implementou, com o lugar onde
cada um vive e o sinal pelo qual uma extração futura perceberia que deixou de ser verdade.

| ID | Origem (arquivo, seção) | Regra esperada após mudança | Tipo de verificação | Sinal de violação |
|---|---|---|---|---|
| W001 | `requirements.md` RF-01, `src/webview/domain/types.ts` | O bloco de bugs é a nona seção, logo depois do histórico, recolhível e recolhida por padrão | presença | Ordem do documento renderizado divergindo da lista única de seções |
| W002 | `requirements.md` RF-02, `src/webview/ui/BugsSection.tsx` | Total do projeto repartido por estado no topo, e a mesma repartição no subtítulo de cada contexto, com os zeros escritos por nome | redação | Zero omitido em vez de declarado, que confundiria "nenhum aberto" com "sem contagem" |
| W003 | `requirements.md` RF-03, `src/webview/ui/BugsSection.tsx` | A barra de resolvidos mede a contagem do registro, nunca o comprimento da lista exibida | presença | Barra mudando quando o recorte esconde linhas |
| W004 | `requirements.md` RF-04, `src/webview/ui/BugsSection.tsx` | Cada linha traz identificador, apelido, título, estado, fase, severidade e prioridade, ou declara a ausência de cada um por nome | presença | Campo faltante desenhado como vazio em vez de declarado ausente |
| W005 | `requirements.md` RF-05, `src/webview/domain/instants.ts` | Datas de registro, alteração e encerramento; sem trava, a linha diz que o bug não foi encerrado | presença | Data reformatada com hora, ou encerramento sem trava por trás |
| W006 | `requirements.md` RF-06, `src/webview/domain/bugs-view.ts` | Exatamente uma linha do bloco inteiro traz a marca do próximo a tratar; sem nenhum aberto, o bloco diz que nada aguarda | ausência | Duas marcas simultâneas, ou nenhuma com bug aberto no registro |
| W007 | `requirements.md` RF-07, `src/webview/domain/bugs-view.ts` | Grupos por movimento mais recente; dentro do grupo, RN-07; duas leituras iguais produzem a mesma ordem | presença | Lista remexendo entre leituras idênticas, sinal de comparador que desempata sozinho |
| W008 | `requirements.md` RF-08, `src/webview/domain/bugs-view.ts` | Cada grupo mostra os não encerrados e os cinco encerrados mais recentes, com controle próprio que revela o resto daquele grupo | presença | Revelar um grupo mexendo em outro, ou recorte que seleciona fora da ordem |
| W009 | `requirements.md` RF-09, `src/webview/ui/BugsSection.tsx` | O identificador é o único elemento do bloco que pede a abertura de arquivo, pela mensagem que já existe | ausência | Segundo elemento chamando o host, ou o bloco falando com o editor por outra via |
| W010 | `requirements.md` RF-10, `src/webview/domain/blocking.ts` | Fase de espera por decisão, bloqueio declarado e severidade alta em bug não encerrado levam à faixa, uma linha por bug | redação | Bug com duas razões produzindo duas linhas, ou razão sem identificador ao lado |
| W011 | `requirements.md` RF-11, `src/probe/bugs.ts` | A leitura consome `bug.md` e a trava, e nunca nada sob `generated/` | ausência | Qualquer caminho de projeção alcançado pela sonda |
| W012 | `requirements.md` RF-12, `src/domain/bugs.ts` | Toda perda vira anomalia nomeada, com arquivo, código e detalhe, e o bloco desenha o que conseguiu ler | presença | Linha sumindo da lista sem anomalia correspondente |
| W013 | `requirements.md` RF-13, `src/webview/ui/BugsSection.tsx` | Os três vazios são nomeados à parte: campo ausente na carga, registro ausente no projeto, contexto sem bug | redação | Registro ausente desenhado como registro vazio |
| W014 | `requirements.md` RF-14, `src/webview/domain/bugs-view.ts` | Ordem, recorte, destaque e rótulos vivem em função pura, e o componente apenas os chama | ausência | Decisão de apresentação nascendo dentro do componente |
| W015 | `requirements.md` RF-15, `src/probe/bugs.ts`, `src/domain/limits.ts` | Teto de cinquenta bugs por passagem, com a leitura parcial declarada e a contagem do disco preservada | presença | Teto que para de contar além de parar de ler |
| W016 | `requirements.md` RF-16, `src/domain/bugs.ts` | Bug restrito é contado e não tem campo algum desenhado, e nada dele atravessa o canal | ausência | Título ou identificador de bug restrito presente na carga enviada à tela |

### Escolhas registradas nesta entrega

Não são requisitos: são decisões tomadas diante de ambiguidade, e é por elas que uma leitura futura
pode estranhar o código sem entender por quê.

| ID | Origem (arquivo, seção) | Escolha registrada | Tipo de verificação | Sinal de que precisa mudar |
|---|---|---|---|---|
| W017 | `src/domain/front-matter.ts`, `investigation.md` seção 8 | Chave de topo é chave que começa na COLUNA ZERO. Dois dos três `bug.md` reais trazem `- id:` recuado sob `change_set:`, e aparar a linha antes de cortar a chave trocaria o identificador do bug pelo do conjunto de mudanças, sem anomalia alguma | presença | Identificador do painel divergindo do `id` do front matter em bug com bloco aninhado |
| W018 | `src/domain/front-matter.ts` | Leitor restrito em vez do pacote `yaml`, que custaria 796 KB de distribuição para dez campos escalares (D-02). Bloco não fechado não é lido pela metade: vira falha nomeada | redação | Campo de front matter que o registrador passe a escrever em forma que o leitor restrito não alcança |
| W019 | `src/webview/domain/bugs-view.ts` | A marca do próximo a tratar é o primeiro não encerrado do BLOCO, e não do primeiro grupo. Um grupo pode liderar por movimento de bug já encerrado, e a leitura literal de RN-10 deixaria o bloco sem marca enquanto alguém espera | presença | Bloco sem marca com bug aberto na lista |
| W020 | `src/webview/domain/blocking.ts` | "Severidade alta" de RF-10 cobre `critical` e `high`; e só a condição de severidade é condicionada a "não encerrado", fielmente à assimetria da regra | redação | Spec uniformizando as três condições, o que tornaria esta leitura obsoleta |
| W021 | `src/webview/domain/blocking.ts` | As condições leem o valor RECONHECIDO, não o bruto: fase que o painel não sabe ler não vira bloqueio, porque o painel não pode afirmar o que ela significa | ausência | Valor fora do vocabulário levando um bug à faixa |
| W022 | `src/domain/bugs.ts`, `src/webview/domain/instants.ts` | Data é conferida por faixa lexical, sem construir `Date` (RN-06). Mês treze não é data e vira anomalia; 30 de fevereiro passa e é desenhado como está escrito, porque distingui-lo exigiria a construção que a regra proíbe | ausência | `new Date(` aparecendo em qualquer dos dois módulos |
| W023 | `src/domain/bugs.ts` | A contagem do projeto soma a repartição dos grupos e toma o total do disco; acima do teto as duas divergem por construção, e `lidos` mais `truncado` declaram a diferença | presença | Total igual ao lido em registro truncado, que esconderia o que RF-15 manda mostrar |
| W024 | `src/host/protocol.ts` | O campo `bugs` AUSENTE significa host anterior ao campo, e é distinto de registro vazio. O caso já ocorreu neste projeto | redação | Bloco desenhando registro vazio onde a leitura não aconteceu |
| W025 | `src/webview/ui/App.tsx` | A revelação por contexto é estado do painel, e não preferência guardada: lembrar a expansão de um grupo que já não existe seria lembrar a coisa errada (D-07) | ausência | Revelação sobrevivendo ao fechamento do painel |
| W026 | `src/webview/theme/theme.css`, `src/webview/ui/BugsSection.tsx` | A marca do próximo a tratar repete a forma da decomposição e vem acompanhada da palavra na linha: cor nunca carrega o fato sozinha | presença | Estado distinguível só por cor, que reprovaria o requisito de acessibilidade |
| W027 | `scripts/estragar-registro.js` | Os quatro estados doentes do registro chegam por cópia adoecida em pasta temporária, e não por argumento do preview, que continua sem escrever nada | ausência | Preview ganhando argumento que fabrique registro doente |
| W028 | `tests/webview-build.spec.ts` | A guarda de orçamento do pacote da tela mede METADE do teto, e não o teto: repetir a constante violaria a fonte única de limites (RN-06 da feature 005) | redação | Número do teto reaparecendo fora de `scripts/limites.js` |
| W029 | `tests/desempenho-referencia.spec.ts` | O workspace de referência passou a ter cinquenta bugs, e as medidas ficaram escritas ao lado dos tetos: 24 ms de leitura contra 200, 3 ms de pintura contra 100 | presença | Folga caindo sem que ninguém perceba, por medida que só aparece na falha |

### O que a próxima extração deve confirmar

As dezesseis observações e as treze escolhas acima descrevem comportamento coberto por suíte
(1307 casos verdes em 83 arquivos ao fim desta entrega), mas cobertura não é extração: nenhuma
delas foi lida de volta a partir do código por um agente reverso. A primeira `/reversa` sobre este
repositório é o que as promove a 🟢 e lhes dá peso de regressão.
