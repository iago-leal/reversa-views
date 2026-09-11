# Requirements: rastreio do greenfield e panorama das features planejadas

> Identificador: `009-greenfield-e-features-do-prd`
> Data: `2026-09-11`
> Pasta da extração reversa: `_reversa_sdd/`
> Confidência: 🟢 CONFIRMADO, 🟡 INFERIDO, 🔴 LACUNA / DÚVIDA
> Cenário: `greenfield` (âncora `prd.md` + specs em `sdd/`, sem `architecture.md` nem `domain.md`)

## 1. Resumo executivo

O painel lê hoje quatro territórios do disco e desenha nove cartões, mas continua cego para dois fatos que este próprio projeto exibe. O primeiro é a origem: um projeto nascido por `/reversa-new` percorreu brief, ideação, personas, PRD (documento de requisitos do produto) e specs SDD (especificações do desenvolvimento dirigido por spec), e o painel só sabe mostrar as cinco fases da descoberta `/reversa`, todas pendentes, como se nada tivesse acontecido. O segundo é o plano: o PRD e as specs SDD dizem quais componentes o produto terá, e o histórico só lista as pastas que já existem em `_reversa_forward/`, de modo que o que falta construir é invisível. A feature entrega ao Retomador as duas respostas que faltam, de onde este projeto veio e quanto do produto planejado já existe, derivando ambas dos artefatos em disco e cruzando os componentes planejados com as pastas de feature, sem escrever byte algum.

## 2. Contexto a partir do legado

| Fonte | Trecho relevante | Confidência |
|-------|------------------|-------------|
| `_reversa_sdd/prd.md#4-escopo-in` | Seis eixos em núcleo e diagnóstico, derivados de três territórios. Os adendos 006 e 008 já ampliaram a leitura para nove cartões e quatro territórios; esta feature acrescenta a leitura dos artefatos greenfield do próprio `_reversa_sdd/`, território já visitado só pelos adendos. A seção é também fonte do panorama: itens de lista em prosa, marcados com selo de confidência, agrupados por rótulos em negrito (núcleo, diagnóstico, comportamento), sem correspondência de nome com as pastas de feature. | 🟢 |
| `_reversa_sdd/prd.md#5-nao-objetivos-out` | A ideação está entre os cinco eixos adiados por custo de tela. O eixo herdado chamado ideação lê o brainstorm (`.reversa/active-ideation.json`), e não o pipeline `/reversa-new`; o pipeline greenfield não é eixo do modelo herdado e nunca foi adiado, porque nunca foi previsto. | 🟡 |
| `_reversa_sdd/prd.md#3-metricas-de-sucesso` | Retomar projeto parado há trinta dias e identificar o próximo passo sem reler documentação. Sem o panorama, "o próximo passo" só existe dentro da feature ativa, nunca no produto inteiro. | 🟡 |
| `_reversa_sdd/prd.md#pendencias-de-cobertura` | Item 2: eixos adiados podem ser reabertos quando necessários numa retomada concreta. Esta feature não reabre eixo adiado; acrescenta um que a extração não previa, como a 008 fez com os bugs. | 🟡 |
| `_reversa_sdd/newproject-brief.md` e `_reversa_sdd/ideation.md` | O projeto nasceu por `/reversa-new` em modo guiado, com quatro estágios concluídos; `state.json#newproject_progress` registra `stage: done`, `completed_stages` com quatro nomes e uma decomposição em cinco componentes. | 🟢 |
| `_reversa_sdd/sdd/*.md` | Cinco specs, uma por componente, cabeçalho "Componente N de 5", campo `Status: Rascunho` em todas, embora todas estejam implementadas. As cinco viraram, nome a nome, as pastas 001 a 005 do ciclo forward; as pastas 006, 007 e 008 não têm spec correspondente. | 🟢 |
| `_reversa_sdd/sdd/leitura-do-processo.md#6-requisitos-funcionais` | RF-03 e RF-04: fases e estágio são derivados do disco, nunca do campo autodeclarado. RF-07: toda degradação vira anomalia com arquivo, código e detalhe. RF-12: o relatório da sonda nomeia as pastas lidas. | 🟡 |
| `_reversa_sdd/sdd/leitura-do-processo.md#9-modelo-de-dados` | A distinção entre ausência e vazio carrega sentido e não é estilo. | 🟡 |
| `_reversa_sdd/sdd/painel-do-processo.md#4-non-goals-fora-do-escopo` | NG-01 adia a ideação (brainstorm) na tela; NG-02 proíbe interpretar Markdown na webview. | 🟡 |
| `_reversa_sdd/sdd/painel-do-processo.md#6-requisitos-funcionais` | RF-03: a faixa de bloqueio nomeia toda decisão pendente. RF-04: as cinco fases sempre desenhadas. RF-10: abrir artefato por mensagem à ponte. RF-13: decisão de apresentação em função pura. RF-14: ordem das seções fixada. | 🟡 |
| `_reversa_sdd/sdd/ponte-e-host.md#9-modelo-de-dados` | O protocolo cresce por acréscimo: campo novo ao fim de `SetProcessData`, nada renomeado nem reordenado. | 🟡 |
| `_reversa_sdd/addenda/003-painel-do-processo.md` | Toda decisão de apresentação em função pura sem React; ordem declarada uma vez; integridade calculada uma vez. | 🟢 |
| `_reversa_sdd/addenda/006-cartoes-e-cronologia.md` | Histórico de todas as pastas de feature com situação e marca em dois eixos; teto de cinquenta pastas; sonda local reusando as três funções de leitura herdadas; resumo consultável composto na tela. | 🟢 |
| `_reversa_sdd/addenda/007-atualizacao-e-progresso.md` | Barra de progresso em peça única; RN-10: a barra nunca é a única portadora do número. | 🟢 |
| `_reversa_sdd/addenda/008-cronologia-do-ciclo-bugs.md` | Campo ausente na carga distinto de registro vazio (W024); forma estrutural comum de anomalia; literais locais em `src/domain/limits.ts`; estados doentes por cópia adoecida para o portão visual. | 🟢 |
| `.claude/skills/reversa-new/SKILL.md` | Esquema de `newproject_progress` (`mode`, `stage`, `started_at`, `last_checkpoint_at`, `completed_stages`, `brief`); `stage` nomeia o PRÓXIMO agente e só avança depois do CONTINUAR do usuário; estágios `forward-*` só em modo expresso; ambos os modos terminam em `done`. | 🟢 |
| `.claude/skills/reversa-coding/SKILL.md` | Regra da âncora: legado quando há `architecture.md` e `domain.md`; greenfield quando há `prd.md` e pelo menos uma spec em `sdd/`. | 🟢 |
| `.claude/skills/reversa-spec-sdd/SKILL.md` | Um arquivo por componente em `<output_folder>/sdd/<componente-kebab-case>.md`, decomposto a partir do PRD. | 🟢 |

## 3. Personas e cenários de uso

| Persona | Objetivo | Cenário-chave |
|---------|----------|---------------|
| O Retomador (primária) | Saber, sem abrir arquivo, de onde o projeto veio e quanto do produto planejado já existe | Abre o painel meses depois, vê que o projeto nasceu por `/reversa-new` com o pipeline completo, e lê que quatro dos cinco componentes planejados convergiram, que o quinto está em andamento e que três features nasceram fora do plano |
| O Operador | Confirmar que um estágio do `/reversa-new` avançou, ou escolher qual componente planejado atacar em seguida | Acabou de rodar o `reversa-drafter`, relê o painel e vê o estágio greenfield em "PRD redigido", com o próximo agente nomeado; ao fechar uma feature, vê no panorama qual componente ainda não tem pasta |

## 4. Regras de negócio novas ou alteradas

1. **RN-01:** O estágio do pipeline greenfield é derivado dos artefatos fisicamente presentes em `_reversa_sdd/`, na ordem `newproject-brief.md`, `ideation.md`, `personas.md`, `prd.md` e pelo menos um `.md` em `sdd/`. O artefato mais avançado presente decide o estágio. O objeto `state.json#newproject_progress` é metadado informativo, comparado com o disco e nunca preferido a ele. 🟢
   - Origem no legado: `_reversa_sdd/sdd/leitura-do-processo.md#6-requisitos-funcionais` (RF-03, RF-04), mesma regra que o modelo herdado aplica ao forward e ao brainstorm
   - Tipo: nova
2. **RN-02:** A comparação entre metadado e disco admite, para cada estágio físico, um CONJUNTO de valores de `stage`, e não um só: o agente que produziu o artefato e o agente seguinte, porque o `/reversa-new` só grava o checkpoint depois do CONTINUAR do usuário, de modo que o metadado atrasado em um passo é estado saudável. Com specs presentes, aceitam-se `spec-sdd`, `done` e os quatro `forward-*` do modo expresso. Valor fora do conjunto produz anomalia nomeada, nunca escolha silenciosa. 🟢
   - Origem no legado: `.claude/skills/reversa-new/SKILL.md`, seção "Executando o pipeline (modo guiado)"
   - Tipo: nova
3. **RN-03:** O cenário do projeto segue a regra da âncora do `/reversa-coding`: `legado` quando existem `architecture.md` e `domain.md`; `greenfield` quando existem `prd.md` e pelo menos uma spec em `sdd/` sem a âncora de legado; `misto` quando as duas âncoras coexistem; `sem-ancora` quando nenhuma. O cenário é declarado por nome no cartão e não altera a leitura de nenhum outro eixo. 🟢
   - Origem no legado: `.claude/skills/reversa-coding/SKILL.md`, seção "Âncora de contexto"
   - Tipo: nova
4. **RN-04:** As features planejadas têm duas fontes, de naturezas distintas e nunca fundidas. A primeira são os **componentes**: os arquivos `.md` de `<output_folder>/sdd/`, um por componente, identificados pelo nome do arquivo sem extensão. A segunda é o **escopo declarado**: os itens de lista da seção "Escopo (in)" de `prd.md`, lidos como prosa e exibidos como enunciados, sem casamento com pasta alguma e sem situação derivada, porque um item de escopo é eixo ou comportamento, não unidade de entrega. O campo `Status` do cabeçalho de cada spec NÃO é lido como situação de entrega: neste projeto as cinco specs dizem `Rascunho` e as cinco estão implementadas. O disco, isto é, as pastas do ciclo forward, decide a situação dos componentes. 🟢
   - Origem no legado: `_reversa_sdd/sdd/*.md`, cabeçalhos; `_reversa_sdd/prd.md#4-escopo-in`; `.claude/skills/reversa-spec-sdd/SKILL.md`. Decisão do usuário na sessão de esclarecimentos de 2026-09-11.
   - Tipo: nova
5. **RN-05:** O casamento entre componente planejado e pasta de feature é por igualdade exata entre o nome da spec e o nome curto da pasta (`NNN-<nome-curto>`), após normalização para minúsculas ASCII, sem tolerância a prefixo, sufixo ou troca de separador. Uma spec pode casar com mais de uma pasta; todas são listadas e a situação mais avançada representa o componente. Uma pasta sem spec correspondente é uma feature **fora do plano**, listada à parte e nunca omitida. Os itens do escopo declarado do PRD nunca entram no casamento. 🟢
   - Origem no legado: correspondência um a um observada entre `sdd/` e as pastas 001 a 005; `_reversa_sdd/addenda/006-cartoes-e-cronologia.md`. Confirmada pelo usuário na sessão de esclarecimentos de 2026-09-11.
   - Tipo: nova
6. **RN-06:** A situação de um componente planejado deriva da entrada do histórico com que ele casou, sem segunda autoridade: sem pasta é `planejada`; pasta em `sem-acoes` ou `em-aberto` é `em-andamento`; pasta em `entregue-sem-adendo` é `entregue`; pasta em `convergida` é `convergida`. A marca da pasta (`ativa`, `pausada`) viaja ao lado, em eixo separado, como o histórico já faz. 🟢
   - Origem no legado: `_reversa_sdd/addenda/006-cartoes-e-cronologia.md`, dois eixos de situação e marca
   - Tipo: nova
7. **RN-07:** A contagem do panorama é "N de M componentes planejados convergidos", em que M é o número de specs lidas e nunca inclui as features fora do plano, contadas numa frase própria. Os zeros são escritos por nome, e a barra de progresso nunca é a única portadora do número. 🟢
   - Origem no legado: `_reversa_sdd/addenda/007-atualizacao-e-progresso.md`, RN-10 daquela feature
   - Tipo: nova
8. **RN-08:** Ausência e vazio são três estados nomeados e distintos: campo ausente na carga significa host anterior a esta feature; projeto sem artefato greenfield algum significa que o projeto não nasceu por `/reversa-new`; pasta `sdd/` presente e vazia significa decomposição ainda não feita. Nenhum dos três é desenhado como bloco vazio. 🟢
   - Origem no legado: `_reversa_sdd/sdd/leitura-do-processo.md#9-modelo-de-dados`; `_reversa_sdd/addenda/008-cronologia-do-ciclo-bugs.md` (W024)
   - Tipo: nova
9. **RN-09:** A leitura nova nunca escreve, não importa módulo de plataforma e lê apenas pelas três funções que a sonda herdada exporta, de modo que `node:fs` continua num arquivo só do repositório. Nenhum arquivo de `src/heranca/` é tocado. Os literais dos nomes de artefato greenfield e da pasta `sdd/` vivem em `src/domain/limits.ts`, e nunca no host, cuja suíte de fronteiras proíbe caminho do Reversa e cálculo de estágio. 🟢
   - Origem no legado: `_reversa_sdd/sdd/leitura-do-processo.md#6-requisitos-funcionais` (RF-01); `_reversa_sdd/addenda/008-cronologia-do-ciclo-bugs.md`
   - Tipo: nova
10. **RN-10:** No máximo cinquenta specs são lidas por passagem, no mesmo teto e pelo mesmo motivo das pastas de feature e dos bugs; acima dele a leitura declara-se parcial, dizendo quantas existem ao lado de quantas foram lidas. 🟢
    - Origem no legado: `_reversa_sdd/addenda/006-cartoes-e-cronologia.md` (teto de cinquenta pastas); `src/domain/limits.ts`
    - Tipo: nova
11. **RN-11:** Um pipeline greenfield que o disco mostra incompleto é decisão pendente do usuário, porque em modo guiado cada agente aguarda o CONTINUAR dele. A faixa de bloqueio ganha uma razão que nomeia o estágio físico e o próximo agente a rodar, com o comando para copiar e sem executá-lo, e a razão aparece haja ou não feature ativa no ciclo forward. Pipeline completo, ou projeto sem artefato greenfield, não produz razão alguma. 🟢
    - Origem no legado: `_reversa_sdd/sdd/painel-do-processo.md#6-requisitos-funcionais` (RF-03). Confirmada pelo usuário na sessão de esclarecimentos de 2026-09-11.
    - Tipo: alterada (a faixa passa a receber o eixo greenfield ao lado do processo e do registro de bugs)
12. **RN-12:** O cartão da descoberta continua sempre desenhado com as cinco fases. Em cenário `greenfield` com nenhuma fase concluída, ele ganha uma frase que declara que a descoberta não foi percorrida porque o projeto nasceu por `/reversa-new`. Nada é escondido nem muda de lugar. 🟡
    - Origem no legado: `_reversa_sdd/sdd/painel-do-processo.md#6-requisitos-funcionais` (RF-04)
    - Tipo: alterada
13. **RN-13:** O eixo herdado de ideação, que lê o brainstorm em `.reversa/active-ideation.json` e em `brainstorms/`, continua fora da tela por esta feature. O cartão Origem do projeto reserva para ele um lugar nomeado e vazio, no mesmo molde em que o cabeçalho reservou o despacho de agentes, de modo que desenhá-lo depois seja acréscimo e não deslocamento. 🟢
    - Origem no legado: `_reversa_sdd/sdd/painel-do-processo.md#4-non-goals-fora-do-escopo` (NG-01) e `#6-requisitos-funcionais` (RF-15, o lugar reservado). Decisão do usuário na sessão de esclarecimentos de 2026-09-11.
    - Tipo: nova
14. **RN-14:** A leitura da seção "Escopo (in)" do PRD é restrita e tolerante, porque o PRD é escrito por agente a partir de gabarito. A seção é a primeira cujo título, em forma normalizada, contém "escopo" e não contém "não-objetivos" nem "out". Cada item de lista de primeiro nível vira um enunciado: o selo de confidência inicial é removido e guardado à parte, o texto até o primeiro dois-pontos é o nome e o restante é o detalhe; sem dois-pontos, a primeira frase é o nome. Um parágrafo em negrito que preceda um bloco de itens é o rótulo do grupo. Seção ausente produz anomalia nomeada; PRD ausente não produz anomalia, porque não ter PRD não é defeito de leitura. Nada além dessa seção é interpretado. 🟡
    - Origem no legado: `_reversa_sdd/prd.md#4-escopo-in`; `_reversa_sdd/addenda/006-cartoes-e-cronologia.md`, leitura tolerante do `actions.md` escrito por agente
    - Tipo: nova

## 5. Requisitos Funcionais

| ID | Requisito | Prioridade | Critério de aceite | Confidência |
|----|-----------|------------|--------------------|-------------|
| RF-01 | A sonda local lê a presença dos quatro artefatos greenfield e os nomes dos arquivos `.md` de `sdd/` sob a pasta de saída declarada pelo processo, reusando as três funções de leitura herdadas | Must | Com a pasta de saída personalizada em `state.json`, a leitura acha os artefatos sem configuração; nenhum módulo `node:` é importado pela sonda nova | 🟢 |
| RF-02 | O julgamento local lê `newproject_progress` do texto do `state.json` que o retrato bruto já expõe, tolerando chaves desconhecidas e tratando objeto ausente, inválido ou com tipo errado como metadado ausente, com anomalia apenas quando o objeto existe e está malformado | Must | `state.json` deste projeto, que traz a chave extra `decisions`, é lido sem anomalia; objeto com `stage` numérico produz anomalia que nomeia o campo | 🟢 |
| RF-03 | O julgamento deriva o estágio físico greenfield entre seis valores nomeados: `ausente`, `aberto` (só brief), `ideado`, `pesquisado`, `redigido` e `especificado`, pelo artefato mais avançado presente | Must | Pasta com `prd.md` e `sdd/` vazia classifica `redigido`, qualquer que seja o `stage` do metadado | 🟢 |
| RF-04 | O julgamento compara o `stage` do metadado com o conjunto aceito para o estágio físico (RN-02) e registra anomalia `estagio-greenfield-divergente` com os dois valores quando não casa | Must | `ideation.md` presente com `stage: ideator` não produz anomalia; com `stage: spec-sdd` produz uma, nomeando metadado e disco | 🟢 |
| RF-05 | O julgamento declara o cenário do projeto (RN-03) e expõe modo, brief, instante de início, último checkpoint e estágios concluídos do metadado, cada um ao lado do valor bruto quando fora do vocabulário | Must | Modo `expresso` e modo `guiado` recebem rótulo legível; modo `xyz` sai desenhado cru e marcado como não reconhecido | 🟢 |
| RF-06 | A linha do brief vem, nesta ordem, da primeira frase da seção "Ideia original" de `newproject-brief.md`, depois do campo `brief` do metadado, depois de nada; o painel nunca inventa linha | Should | Projeto com brief em arquivo e no metadado mostra a frase do arquivo; sem os dois, mostra a declaração de ausência | 🟢 |
| RF-07 | O julgamento cruza cada spec com as entradas do histórico (RN-05, RN-06) e produz a lista de componentes planejados com nome, situação, marca, pastas casadas, contagem de ações da pasta mais avançada, caminho da spec e caminho do adendo vigente quando houver, mais a lista de features fora do plano e a lista de itens do escopo declarado do PRD (RN-14), esta com grupo, nome, detalhe e selo | Must | Neste repositório: cinco planejados, todos `convergida`, três fora do plano e os itens de escopo em três grupos; uma spec sem pasta aparece como `planejada` com contagem de ações declarada ausente por nome | 🟢 |
| RF-08 | A carga `SetProcessData` ganha o campo `greenfield`, com origem do projeto e panorama, ACRESCENTADO ao fim dos campos existentes, sem renomear nem reordenar nada; as duas declarações do contrato, uma de cada lado da fronteira de compilação, acompanham o campo, e a suíte que as prende continua verde | Must | Tela nova contra host antigo declara o campo ausente sem quebrar; tela antiga contra host novo ignora o campo | 🟢 |
| RF-09 | A sessão monta o campo no mesmo bloco protegido que já cobre a varredura das pastas de feature e do registro de bugs, de modo que uma caminhada que lance vira o estado de erro nomeado, e não exceção no editor | Must | Um dublê da sonda que lança produz `entry: error` com a mensagem, e a suíte de leitura do host o prova | 🟢 |
| RF-10 | O painel ganha o cartão **Origem do projeto**, que desenha o cenário, o modo, o brief, os quatro estágios do pipeline greenfield SEMPRE, na ordem canônica, com status `concluído`, `corrente` ou `pendente` distinguível sem cor, o último checkpoint no fuso de Brasília e, em cada estágio concluído, o nome do artefato clicável que pede a abertura por mensagem à ponte | Must | Os quatro estágios aparecem mesmo em projeto sem artefato greenfield, todos `pendente`, com a frase que declara que o projeto não nasceu por `/reversa-new` | 🟢 |
| RF-11 | O painel ganha o cartão **Panorama do produto**, em três blocos nesta ordem: a frase de contagem com a barra de progresso reusando a peça existente e uma linha por componente planejado; a subseção "Fora do plano" com uma linha por feature sem spec; e a subseção "Escopo declarado no PRD", recolhida por padrão dentro do cartão, com os itens agrupados pelo rótulo do PRD, cada um com nome, detalhe e selo. A spec, o adendo e o próprio `prd.md` são os únicos elementos clicáveis | Must | A marcação renderizada traz `data-part` por linha e por bloco, situação e marca como texto, e a barra declara mínimo, máximo e valor com o total como denominador; os itens de escopo não trazem situação | 🟢 |
| RF-12 | A ordem das linhas do panorama é por grupo de situação, `em-andamento` (a `ativa` primeiro) antes de `planejada`, depois `entregue`, depois `convergida`, e por nome dentro do grupo; a ordem é função pura e estável entre duas leituras idênticas | Must | Duas leituras idênticas produzem a mesma ordem; a feature ativa encabeça o cartão | 🟡 |
| RF-13 | Os dois cartões entram na lista única de seções: **Panorama do produto** logo depois da decomposição e antes do histórico, por ser a visão geral que antecede a cronologia; **Origem do projeto** logo depois da descoberta; nenhum nome existente é renomeado nem removido, e a posição relativa entre os nomes existentes é preservada; ambos entram nos cartões recolhíveis e nas duas ações globais sem trabalho próprio | Must | A suíte das seções lê onze nomes na ordem `blocking`, `forward`, `decomposition`, panorama, `history`, `bugs`, `discovery`, origem, `policy`, `anomalies`, `probe`; expandir tudo e recolher tudo alcançam os dois cartões | 🟢 |
| RF-14 | O recolhimento padrão: o Panorama abre expandido, por ser a resposta à segunda pergunta do Retomador; a Origem abre recolhida, com o estágio físico no título, por ser leitura estável depois de `done`. Preferência gravada por versão anterior continua válida e os dois nomes passam a ser aceitos | Should | Sem preferência declarada, o Panorama está aberto e a Origem fechada; preferência que recolhe o Panorama é respeitada | 🟢 |
| RF-15 | Os três vazios de RN-08 são desenhados por frase própria em cada cartão, e nunca como bloco vazio | Must | Fixture sem o campo produz "não lido por esta leitura"; projeto legado produz "não nasceu por `/reversa-new`"; `sdd/` vazia produz "decomposição ainda não feita" | 🟢 |
| RF-16 | A faixa de bloqueio recebe o eixo greenfield ao lado do processo e do registro (RN-11) e produz uma razão com o estágio físico, o próximo agente e o comando para copiar, independentemente de haver feature ativa; pipeline completo no disco não produz razão | Must | Projeto com `prd.md` e sem spec produz uma linha que nomeia `/reversa-spec-sdd`, mesmo com feature ativa em curso; este repositório não produz linha greenfield | 🟢 |
| RF-17 | O cartão da descoberta ganha a frase de RN-12 quando o cenário é `greenfield` e nenhuma fase está concluída | Should | Este repositório mostra a frase; um projeto com `reconhecimento` concluído não a mostra | 🟡 |
| RF-18 | O resumo consultável ganha, depois de "Entregas anteriores", o bloco "Panorama do produto" com a linha de origem, uma linha por componente planejado, uma por feature fora do plano e uma por item do escopo declarado, composto pela mesma função pura e determinístico | Should | Documento e cópia produzem texto idêntico; o bloco lista os cinco planejados, os três fora do plano e os itens de escopo deste repositório | 🟢 |
| RF-19 | Toda anomalia do eixo novo, divergência de estágio, metadado malformado, spec ilegível e leitura acima do teto, chega à seção de anomalias pela forma estrutural comum e conta na integridade da leitura pelo mesmo caminho das demais | Must | Uma divergência abre a seção de anomalias por padrão, como qualquer outra perda | 🟢 |
| RF-20 | Todo rótulo do eixo novo (estágio físico, cenário, modo, situação do componente) é função pura no molde dos existentes, devolvendo valor bruto e marca de não reconhecido para o que estiver fora do vocabulário | Must | Situação `foo` é desenhada crua e marcada, e o desenho não quebra | 🟢 |
| RF-21 | O preview alcança os estados que nenhum projeto saudável produz, projeto sem artefato greenfield, pipeline parado em cada um dos cinco estágios intermediários, metadado divergente e `sdd/` vazia, por cópia adoecida no molde de `estragar:registro`, sem que o preview escreva coisa alguma; o README ganha uma linha por estado na tabela do portão visual | Should | Cada estado tem comando escrito, e uma suíte prova que cada cópia produz o estado que promete | 🟢 |
| RF-22 | A leitura da spec limita-se ao NOME do arquivo; nenhum corpo de spec é lido nem interpretado, e o cabeçalho "Componente N de M" não é fonte de ordem nem de contagem. Os únicos textos lidos pelo eixo novo são `newproject-brief.md` e `prd.md`, ambos sob o teto de bytes da sonda herdada | Must | A sonda nova chama a função de leitura de texto apenas para esses dois arquivos; uma spec de 10 MB não altera o tempo da leitura; um PRD acima do teto volta como truncado no relatório da sonda e o escopo declarado é dito ausente por esse motivo | 🟢 |
| RF-23 | O julgamento lê a seção "Escopo (in)" do PRD pela regra de RN-14 e devolve os itens com grupo, nome, detalhe e selo, no máximo cinquenta, registrando anomalia `escopo-do-prd-nao-encontrado` quando o PRD existe sem a seção e anomalia de leitura parcial acima do teto | Must | O PRD deste repositório produz os grupos núcleo, diagnóstico e comportamento com seus itens; um PRD sem a seção produz a anomalia e um bloco que declara a ausência por nome | 🟡 |
| RF-24 | O cartão Origem do projeto reserva, depois dos quatro estágios, o lugar nomeado e vazio do eixo de brainstorm (RN-13), com atributo de dados próprio e sem conteúdo, de modo que a inclusão futura não desloque os demais itens | Should | A estrutura do cartão tem o lugar nomeado e vazio, e a suíte de marcação o encontra pelo atributo | 🟢 |

## 6. Requisitos Não Funcionais

| Tipo | Requisito | Evidência ou justificativa | Confidência |
|------|-----------|----------------------------|-------------|
| Desempenho | A leitura do eixo novo custa uma listagem de `sdd/`, quatro testes de presença e a leitura de dois arquivos, o brief e o PRD; a leitura completa do workspace de referência permanece abaixo do teto de 200 ms, com a medida registrada ao lado do teto | `_reversa_sdd/addenda/001-leitura-do-processo.md`, RNF-01 medido em 44 ms; `_reversa_sdd/addenda/008-cronologia-do-ciclo-bugs.md`, 24 ms no teto | 🟢 |
| Desempenho | A pintura dos dois cartões depois da chegada do processo fica abaixo de 100 ms, medida na suíte de referência já existente | `_reversa_sdd/sdd/painel-do-processo.md#7-requisitos-nao-funcionais`, RNF-02 | 🟡 |
| Tamanho | O pacote da tela continua abaixo de 409.600 bytes com os dois cartões dentro, com o número medido escrito ao lado do teto, e a guarda da suíte continua medindo metade do teto | `_reversa_sdd/addenda/008-cronologia-do-ciclo-bugs.md` (194.018 B medidos; W028) | 🟢 |
| Segurança | Nenhum módulo novo abre arquivo para escrita, importa `node:`, rede ou processo; as suítes de somente leitura do código local e de fronteiras do host são estendidas para varrer os módulos novos | `tests/readonly-local.spec.ts`, `tests/host-boundaries.spec.ts`; `_reversa_sdd/prd.md#6-restricoes` | 🟢 |
| Segurança | O host não contém caminho do Reversa nem cálculo de estágio; nomes de artefato e da pasta `sdd/` vivem em `src/domain/limits.ts` e a derivação em `src/domain/` | `tests/host-boundaries.spec.ts`, regras de caminho e de estágio | 🟢 |
| Herança | Nenhum arquivo de `src/heranca/` é criado, alterado ou apagado; a leitura nova corre ao lado da herdada e reusa o que ela exporta | `_reversa_sdd/sdd/heranca-e-sincronia.md#6-requisitos-funcionais`; `_reversa_sdd/addenda/006-cartoes-e-cronologia.md` | 🟢 |
| Contrato | O protocolo cresce por acréscimo, com as duas declarações em sincronia presa por teste | `_reversa_sdd/sdd/ponte-e-host.md#9-modelo-de-dados` | 🟢 |
| Acessibilidade | Status de estágio e situação de componente distinguíveis sem cor; sem rolagem horizontal a 300 px; a barra nunca é a única portadora do número; toda ação acionável por teclado | `_reversa_sdd/sdd/painel-do-processo.md#7-requisitos-nao-funcionais`, RNF-01 e RNF-03; RN-10 da feature 007 | 🟢 |
| Testabilidade | Toda decisão de apresentação em função pura, fora de qualquer componente visual, com 100% de linhas cobertas; os componentes só chamam | `_reversa_sdd/sdd/painel-do-processo.md#6-requisitos-funcionais`, RF-13; RNF-05 | 🟢 |
| Observabilidade | Toda perda de leitura vira anomalia com arquivo, código e detalhe; nenhuma degradação silenciosa | `_reversa_sdd/sdd/leitura-do-processo.md#6-requisitos-funcionais`, RF-07 | 🟢 |
| Limites | Teto de cinquenta specs por passagem, declarado em `src/domain/limits.ts` como fonte única, com a leitura parcial dita por nome | RN-10; `_reversa_sdd/addenda/006-cartoes-e-cronologia.md` | 🟢 |

## 7. Critérios de Aceitação

```gherkin
Cenário: projeto nascido por /reversa-new com o pipeline completo
  Dado um workspace com newproject-brief.md, ideation.md, personas.md, prd.md e cinco specs em sdd/
  E state.json com newproject_progress em stage "done" e modo "guiado"
  Quando o painel é lido
  Então o cartão Origem do projeto declara o cenário "greenfield", o modo "guiado" e os quatro estágios concluídos
  E o título do cartão traz o estágio físico "especificado"
  E a faixa de bloqueio não traz linha greenfield

Cenário: panorama cruza specs com pastas de feature
  Dado cinco specs em sdd/ cujos nomes casam com as pastas 001 a 005
  E três pastas 006, 007 e 008 sem spec correspondente
  E as oito pastas com todas as ações fechadas e adendo vigente
  Quando o painel é lido
  Então o Panorama do produto diz "5 de 5 componentes planejados convergidos"
  E diz "3 features fora do plano"
  E cada linha planejada traz a spec clicável e o adendo clicável

Cenário: componente planejado ainda sem pasta
  Dado seis specs em sdd/ e apenas cinco pastas casadas
  Quando o painel é lido
  Então a sexta spec aparece com situação "planejada"
  E a contagem de ações dela é declarada ausente por nome
  E a linha dela vem antes das linhas "entregue" e "convergida"

Cenário: pipeline greenfield parado no PRD
  Dado prd.md presente e sdd/ ausente
  E newproject_progress com stage "spec-sdd"
  Quando o painel é lido
  Então o estágio físico é "redigido" e não há anomalia de divergência
  E a faixa de bloqueio traz uma razão que nomeia "/reversa-spec-sdd" com o comando para copiar
  E o Panorama diz que a decomposição ainda não foi feita

Cenário: metadado atrasado em um passo é saudável
  Dado ideation.md presente e personas.md ausente
  E newproject_progress com stage "ideator"
  Quando o painel é lido
  Então o estágio físico é "ideado" e nenhuma anomalia é registrada

Cenário: metadado à frente do disco é divergência
  Dado ideation.md presente e personas.md ausente
  E newproject_progress com stage "spec-sdd"
  Quando o painel é lido
  Então uma anomalia "estagio-greenfield-divergente" nomeia "spec-sdd" e "ideado"
  E a seção de anomalias abre por padrão

Cenário: projeto legado sem artefato greenfield
  Dado um workspace com architecture.md e domain.md e sem prd.md
  Quando o painel é lido
  Então o cartão Origem do projeto declara o cenário "legado"
  E os quatro estágios aparecem como "pendente" com a frase de que o projeto não nasceu por /reversa-new
  E o cartão da descoberta não ganha a frase de RN-12

Cenário: host anterior a esta feature
  Dado uma carga SetProcessData sem o campo greenfield
  Quando o painel desenha
  Então os dois cartões dizem que o eixo não foi lido por esta leitura
  E nenhum bloco vazio é desenhado

Cenário: campo Status da spec é ignorado
  Dado uma spec com "Status: Rascunho" e a pasta casada em situação convergida
  Quando o painel é lido
  Então a situação do componente é "convergida"

Cenário: leitura acima do teto de specs
  Dado cinquenta e uma specs em sdd/
  Quando o painel é lido
  Então cinquenta são listadas e o cartão declara que existem cinquenta e uma
  E uma anomalia de leitura parcial é registrada

Cenário: nenhum módulo novo escreve nem toca a herança
  Dado o código completo da extensão
  Quando as suítes de somente leitura e de fronteiras rodam
  Então a sonda e o julgamento novos não importam módulo "node:" algum
  E o host não contém caminho do Reversa nem cálculo de estágio
  E nenhum arquivo de src/heranca/ difere do manifesto

Cenário: a linha do brief vem do arquivo antes do metadado
  Dado newproject-brief.md com a seção "Ideia original" e newproject_progress com o campo brief
  Quando o painel é lido
  Então a linha do brief é a primeira frase da seção do arquivo
  E sem os dois a linha declara a ausência por nome

Cenário: caminhada do disco que lança vira estado de erro
  Dado uma sonda greenfield substituída por um dublê que lança
  Quando o host lê o workspace
  Então o resultado é o estado de erro com a mensagem
  E nenhuma exceção alcança o editor

Cenário: os dois cartões entram na ordem e no recolhimento padrão
  Dado a lista única de seções
  Quando o painel desenha sem preferência declarada
  Então Panorama do produto vem logo depois da decomposição e antes do histórico, expandido
  E Origem do projeto vem logo depois da descoberta, recolhida, com o estágio físico no título
  E expandir tudo e recolher tudo alcançam os dois

Cenário: o escopo declarado do PRD entra no panorama sem situação
  Dado prd.md com a seção "Escopo (in)" em três grupos em negrito e itens com selo e dois-pontos
  Quando o painel é lido
  Então o bloco "Escopo declarado no PRD" lista os itens sob os três grupos, com nome, detalhe e selo
  E nenhum item traz situação nem casa com pasta de feature
  E o único elemento clicável do bloco é o prd.md

Cenário: PRD sem a seção de escopo
  Dado prd.md presente sem título que contenha "escopo"
  Quando o painel é lido
  Então uma anomalia "escopo-do-prd-nao-encontrado" é registrada
  E o bloco declara a ausência por nome, sem quebrar os outros dois blocos

Cenário: pipeline incompleto bloqueia mesmo com feature ativa
  Dado prd.md presente, sdd/ ausente e uma feature ativa em estágio de plano
  Quando o painel é lido
  Então a faixa de bloqueio traz a razão greenfield que nomeia "/reversa-spec-sdd"
  E traz também a razão do ciclo forward, cada uma em sua linha

Cenário: o lugar do brainstorm está reservado e vazio
  Dado uma carga com o campo greenfield
  Quando o cartão Origem do projeto desenha
  Então existe um elemento com o atributo do brainstorm, sem conteúdo
  E o eixo herdado de ideação não é desenhado

Cenário: o resumo consultável ganha o panorama
  Dado a carga com o campo greenfield
  Quando o usuário pede o resumo em documento e depois em cópia
  Então os dois textos são idênticos
  E trazem o bloco "Panorama do produto" com a linha de origem, os planejados e os fora do plano

Cenário: valor fora do vocabulário não quebra o desenho
  Dado uma carga com modo "xyz" e um componente com situação "foo"
  Quando o painel desenha
  Então os dois valores aparecem crus e marcados como não reconhecidos

Cenário: o preview alcança os estados doentes por cópia adoecida
  Dado o auxiliar que copia o workspace para pasta temporária
  Quando ele adoece a cópia com sdd/ vazia e com metadado divergente
  Então o preview desenha cada estado prometido
  E o preview não escreve byte algum no workspace observado

Cenário: o corpo da spec não é lido
  Dado uma spec de 10 MB em sdd/
  Quando o painel é lido
  Então a spec aparece pelo nome e a leitura não abre o arquivo
  E o tempo da leitura não muda
```

## 8. Prioridade MoSCoW

| Item | MoSCoW | Justificativa |
|------|--------|---------------|
| RF-01 a RF-05, RF-07 a RF-11, RF-13, RF-15, RF-19, RF-20, RF-22, RF-23 | Must | Sem leitura, derivação, contrato e os dois cartões não há feature; sem os vazios nomeados e as anomalias o painel mentiria por omissão, o que a extração trata como pior que painel nenhum |
| RF-12 | Must | A ordem é o que faz o Retomador achar o próximo componente sem rolar; sem ela o panorama é inventário |
| RF-16 | Must | Decisão do usuário: pipeline greenfield incompleto é decisão pendente e a faixa existe para nomear decisões pendentes |
| RF-06, RF-14, RF-17, RF-18, RF-21, RF-24 | Should | Refinam a leitura sem condicionar a existência dela; o portão visual, o resumo e o lugar reservado seguem o precedente das features 003 e 006 a 008 |
| RNF de desempenho e tamanho | Must | Tetos já declarados e medidos pelas features anteriores; perder a folga em silêncio contraria a fonte única de limites |
| RNF de segurança, herança e contrato | Must | Invariantes não negociáveis do produto |
| RNF de acessibilidade e testabilidade | Should | Precedente das features 003, 007 e 008, verificado por suíte |

## 9. Esclarecimentos

### Sessão 2026-09-11

- **Q:** Qual é a fonte das features planejadas no panorama: só as specs em `sdd/`, as specs mais `decisions.decomposicao`, as specs mais a prosa de "Escopo (in)" do PRD, ou as três fontes?
  **R:** As specs em `sdd/` mais os itens da seção "Escopo (in)" do PRD, lidos como prosa. O campo `decisions.decomposicao` fica fora, por não ser prescrito pelo skill. Integrado em RN-04, RN-14, RF-07, RF-11, RF-18, RF-22 e RF-23.
- **Q:** O eixo de brainstorm (`.reversa/active-ideation.json` e `brainstorms/`), já lido pelo modelo herdado e adiado pela NG-01, entra nesta feature?
  **R:** Fica fora agora, mas o cartão Origem do projeto reserva o lugar nomeado e vazio, como o cabeçalho reservou o despacho. Integrado em RN-13 e RF-24.
- **Q:** Como o panorama se apresenta: cartão próprio depois do histórico, fundido ao histórico, cartão próprio antes do histórico, ou no lugar do histórico?
  **R:** Cartão próprio, posicionado antes do histórico, por ser a visão geral. Integrado em RF-13: o Panorama entra logo depois da decomposição e antes do histórico.
- **Q:** Um pipeline greenfield que o disco mostra incompleto entra na faixa de bloqueio humano?
  **R:** Sim, como razão que nomeia o estágio físico e o próximo agente, com o comando para copiar, haja ou não feature ativa. Integrado em RN-11 e RF-16, que passou a Must.
- **Q:** Qual a regra de casamento entre uma spec e uma pasta de feature?
  **R:** Igualdade exata entre o nome da spec e o nome curto da pasta, após minúsculas ASCII, sem tolerância a prefixo, sufixo ou separador trocado. Integrado em RN-05, confirmada como 🟢.

## 10. Lacunas

Nenhuma lacuna aberta. As três dúvidas da versão inicial foram resolvidas na sessão de 2026-09-11.

## 11. Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-09-11 | Versão inicial gerada por `/reversa-requirements` | reversa |
| 2026-09-11 | Sessão de esclarecimentos por `/reversa-clarify`: cinco respostas integradas, RN-14, RF-23 e RF-24 acrescentados, RF-16 promovido a Must, ordem das seções alterada, lacunas zeradas | reversa |
