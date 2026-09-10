# Impacto no legado: 008-cronologia-do-ciclo-bugs

**Data:** 2026-09-10
**Feature:** `008-cronologia-do-ciclo-bugs`
**Cenário:** greenfield.

Feature greenfield, sem legado pré-existente. Âncora: `prd.md` + specs SDD.

Não há extração de `/reversa` neste projeto: `_reversa_sdd/` não tem `architecture.md` nem
`domain.md`, e o contexto vem de `_reversa_sdd/prd.md` com as cinco specs de `_reversa_sdd/sdd/`.
Por isso não há regra 🟢 extraída de código existente para preservar ou quebrar, e as seções
"Preservadas" e "Modificadas" ficam vazias.

O que existe de código anterior foi escrito pelo próprio ciclo forward, nas features 001 a 007.
Como nos rastros das features 006 e 007, a tabela distingue arquivo criado (`componente-novo`) de
arquivo anterior que ganhou comportamento (`regra-nova`), arquivo anterior cujo comportamento
mudou (`regra-alterada`) e contrato da ponte (`delta-de-contrato-externo`). Vinte e cinco arquivos
foram criados, treze deles fixturas de um mesmo diretório, e vinte e sete foram modificados; a
lista completa, ação por ação, está em `progress.jsonl`.

**Política de edição do legado no momento da execução.** `.reversa/reversa-config.json` declarava
`"allowLegacyEdits": true` com `"allowedPaths": []`. Liberação irrestrita: todo caminho do projeto
estava gravável, e nenhuma escrita foi recusada por política. O arquivo de configuração não foi
criado nem alterado por esta execução.

## Arquivos afetados

| Arquivo afetado | Componente | Tipo | Severidade | Justificativa |
|---|---|---|---|---|
| `src/domain/front-matter.ts` | leitura-do-processo | componente-novo | HIGH | Leitor restrito de front matter, escrito em vez de embarcar o pacote `yaml` (D-02, medidos 796 KB de distribuição para dez campos escalares). Chave de topo é chave na COLUNA ZERO, achado da apuração de T001 contra os `bug.md` reais: sem essa regra, o `- id:` recuado sob `change_set:` substituiria o identificador do bug em silêncio. Bloco não fechado não é lido pela metade, vira `bloco-truncado`. |
| `src/domain/bugs.ts` | leitura-do-processo | componente-novo | CRITICAL | O que o registro SIGNIFICA: filtra o bug restrito ANTES de montar qualquer coisa (D-11), declara as duas assimetrias da trava sem escolher entre elas (RN-04), confere data por faixa lexical sem construir `Date` (RN-06), e conta o que está em disco medindo a lista contra isso (RN-05, D-15). |
| `src/probe/bugs.ts` | leitura-do-processo | componente-novo | HIGH | A sonda do registro, gêmea de `probe/features.ts`: desce só em `<contexto>/bugs/<ID>/`, nunca em `generated/` (RF-11, D-12), lista uma vez por pasta para responder às duas perguntas, conta tudo e lê até o teto. Não importa módulo de plataforma: `node:fs` continua num arquivo só do repositório. |
| `src/domain/limits.ts` | leitura-do-processo | regra-nova | LOW | `BUG_CAP` e `BUGS_FOLDER`, com a duplicação em relação ao `policy.ts` herdado declarada por escrito ao lado. |
| `src/domain/types.ts` | leitura-do-processo | regra-nova | MEDIUM | Os cinco vocabulários fechados do registro (estado, fase, severidade, prioridade, inconsistência), `BugEntry` com valor reconhecido e valor bruto lado a lado, as contagens, o registro e a forma estrutural comum de anomalia. |
| `src/host/reading.ts` | leitura-do-processo | regra-nova | MEDIUM | A sonda e o julgamento entram no mesmo bloco protegido que já cobria a varredura das features: uma caminhada que lance vira o estado de erro nomeado, e não exceção no editor. |
| `src/host/protocol.ts` | ponte-e-host | delta-de-contrato-externo | HIGH | `SetProcessData` ganhou `bugs`, por acréscimo e ao fim. O campo AUSENTE significa host anterior ao campo, que é caso real deste projeto, e é distinto de registro vazio. Bug restrito não atravessa o canal. |
| `src/host/session.ts` | ponte-e-host | regra-nova | LOW | O registro entra na carga ao lado da decomposição e do histórico, sem tocar no que já viajava. |
| `src/webview/domain/types.ts` | painel-do-processo | regra-alterada | MEDIUM | A lista única de seções passou de oito para nove nomes, e o bloco de bugs entra no recolhimento padrão. Quem conta seções conta a partir daqui, que é o que a suíte de fronteiras mede. |
| `src/webview/domain/bugs-view.ts` | painel-do-processo | componente-novo | HIGH | Ordem, recorte e destaque numa passagem só, que é o remédio de D-14 da feature 007 aplicado antes do defeito nascer: o recorte é PREFIXO da ordem, nunca segunda seleção sobre ela. Comparador devolve zero no empate de propósito, para que a ordem de leitura sobreviva entre duas leituras iguais. |
| `src/webview/domain/blocking.ts` | painel-do-processo | regra-alterada | HIGH | A faixa passou a receber o registro ao lado do processo e a produzir as três condições de RF-10, fundidas numa linha só quando um bug reúne mais de uma. Lê o valor RECONHECIDO, não o bruto: valor que o painel não sabe ler não vira bloqueio. |
| `src/webview/domain/instants.ts` | painel-do-processo | regra-nova | MEDIUM | `readableDate`, que reformata `AAAA-MM-DD` para `DD/MM/AAAA` conferindo faixa lexicalmente e sem construir `Date` (RN-06). Data malformada é declarada ausente; 30 de fevereiro passa e é desenhada como está escrita, porque distingui-la exigiria a construção que a regra proíbe. |
| `src/webview/domain/labels.ts` | painel-do-processo | regra-nova | LOW | Cinco tabelas de rótulo do registro, pela mesma função total que as demais já usam: valor fora do vocabulário sai desenhado e marcado como não reconhecido. |
| `src/webview/domain/integrity.ts` | painel-do-processo | regra-alterada | MEDIUM | As anomalias do registro entram na integridade da leitura: perda na leitura dos bugs abre a seção de anomalias pelo mesmo caminho que as demais perdas. |
| `src/webview/ui/BugsSection.tsx` | painel-do-processo | componente-novo | HIGH | O cartão, que não decide nada: ordem, recorte e destaque chegam prontos. Nomeia por extenso os três vazios (campo ausente, registro ausente, contexto sem bug), escreve os zeros por nome, e o identificador é o único elemento que pede a abertura de arquivo. |
| `src/webview/ui/App.tsx` | painel-do-processo | regra-nova | MEDIUM | Monta o cartão em fronteira de erro própria, entre o histórico e a descoberta; guarda a revelação por contexto como estado do painel, e não como preferência (D-07); passa o registro à faixa e junta as duas origens de anomalia numa lista só. |
| `src/webview/ui/AnomaliesSection.tsx` | painel-do-processo | regra-alterada | MEDIUM | Passou a receber a forma estrutural comum, e não mais o tipo herdado: as duas origens desenham na mesma lista, e código desconhecido não quebra o desenho (D-04, RF-12). |
| `src/webview/theme/theme.css` | painel-do-processo | regra-nova | LOW | Estilos do grupo, do subtítulo, da marca do próximo a tratar e da inconsistência, só com tokens que o podador já preserva; a marca repete a forma que a decomposição já usa, e a palavra na linha carrega o fato sem depender de cor. |
| `scripts/estragar-registro.js` | empacotamento-e-verificacao | componente-novo | MEDIUM | O caminho para os quatro estados do registro que nenhum projeto saudável produz, no molde de `estragar-workspace.js`: copia o workspace para pasta temporária, adoece a cópia e imprime o caminho. Quem escreve é ele; o preview continua sem escrever nada. |
| `scripts/preview.js` | empacotamento-e-verificacao | regra-nova | LOW | O cabeçalho de uso passou a nomear os dois auxiliares e a razão de os estados doentes chegarem por cópia, e não por argumento. |
| `package.json` | empacotamento-e-verificacao | regra-nova | LOW | `estragar:registro` entra na lista; dezoito scripts. |
| `README.md` | empacotamento-e-verificacao | regra-nova | LOW | Quatro linhas novas na tabela do portão visual, uma por estado doente do registro. |
| `tests/helpers/reversa-fixtures.ts` | leitura-do-processo | regra-nova | LOW | Fixturas do registro, com o apelido derivado do valor reconhecido para que atributo e texto de uma linha nunca discordem. A carga de fixture passa a trazer o registro. |
| `tests/fixtures/registro-de-bugs/` | leitura-do-processo | componente-novo | MEDIUM | Três transcrições literais dos `bug.md` reais e nove fixturas sintéticas, cada uma declarada como sintética, mais o `LEIA-ME.md` que diz qual é qual. É o material da apuração de T001. |
| Suítes novas: `tests/domain-front-matter.spec.ts`, `tests/domain-bugs.spec.ts`, `tests/bugs-sem-projecao.spec.ts`, `tests/webview-bugs-view.spec.ts`, `tests/webview-bugs-section.spec.tsx`, `tests/preview-registro.spec.ts` | (todos) | componente-novo | LOW | Seis suítes, 126 casos. A última não estava no plano: o auxiliar que adoece o registro precisava provar que cada caso produz de fato o estado que promete. |
| Suítes estendidas: `tests/readonly-local.spec.ts`, `tests/webview-blocking.spec.ts`, `tests/webview-instants.spec.ts`, `tests/webview-labels.spec.ts`, `tests/webview-sections.spec.ts`, `tests/webview-preferences.spec.ts`, `tests/host-reading.spec.ts`, `tests/host-manifest.spec.ts`, `tests/webview-build.spec.ts`, `tests/desempenho-referencia.spec.ts` | (todos) | regra-nova | LOW | Fronteiras dos módulos novos, nona seção, registro nos dublês da leitura, décimo oitavo script, medida do pacote com a folga registrada e a referência de desempenho com o registro no teto. |

## Diff conceitual por componente

### leitura-do-processo

O componente ganhou um segundo território de leitura, e o ganhou pela mesma divisão que já
praticava: uma sonda que olha e um julgamento que decide, com o sistema de arquivos confinado ao
único arquivo herdado que o importa. A sonda desce apenas onde a fonte de verdade mora, e a
recusa de descer em `generated/` é requisito, não economia: painel que lesse a projeção mostraria
o passado sem dizer que é o passado.

O leitor de front matter é a peça que mais quase deu errado. A apuração da fase de preparação
mediu os três `bug.md` reais em vez de assumir sua forma, e achou que dois deles trazem uma chave
`id` recuada dentro de um bloco aninhado. Um leitor que aparasse a linha antes de cortar a chave
teria trocado o identificador do bug pelo do conjunto de mudanças, sem anomalia e sem sintoma. A
regra passou a ser posicional: chave de topo começa na coluna zero.

Do lado do julgamento, três regras merecem ser lembradas. O bug restrito é filtrado antes de
qualquer montagem, porque a exigência é que o conteúdo não atravesse o canal, e não que a tela
deixe de desenhá-lo. As duas assimetrias da trava são declaradas e nunca resolvidas: o painel diz
qual das duas achou e não escolhe entre as leituras, que é o papel de quem nunca escreve. E a
contagem é do disco: acima do teto de leitura, o que existe e o que foi lido divergem por
construção, e a divergência é dita em vez de alisada.

### ponte-e-host

O contrato cresceu por acréscimo, como manda a regra da casa: um campo a mais ao fim da carga do
processo. O que esse campo acrescenta de sutil é uma terceira distinção, além de cheio e vazio: o
campo AUSENTE significa que a leitura não aconteceu, porque o host é anterior ao campo. Esse caso
já ocorreu neste projeto, e a tela o nomeia por extenso em vez de desenhar um bloco vazio que
mentiria por omissão.

### painel-do-processo

O painel ganhou a nona seção, e a ganhou sem que nenhum componente passasse a saber quantas
seções existem: a lista única continua sendo a única fonte, e o cartão entra nela, no recolhimento
padrão e na ordem declarada.

A decisão de apresentação inteira mora fora do componente, e numa função só. Ordem entre grupos,
ordem dentro do grupo, corte dos encerrados e marca do próximo a tratar saem juntos, porque a
feature 007 já pagou o preço de calcular seleção e ordem em lugares que discordavam. Duas
delicadezas ficaram registradas no código: o empate de datas devolve zero de propósito, para que a
ordem de leitura sobreviva a duas leituras idênticas, e a marca do próximo é o primeiro não
encerrado do BLOCO, porque um grupo pode liderar por movimento de um bug já encerrado e deixar o
painel sem marca enquanto alguém espera.

A faixa de bloqueio passou a falar de bugs, com uma linha por bug e as razões fundidas quando há
mais de uma. Ela lê o valor reconhecido, e não o bruto: fase que o painel não sabe ler não vira
bloqueio, porque o painel não pode afirmar o que ela significa.

### empacotamento-e-verificacao

O preview continua sem escrever nada, e o caminho para os estados doentes do registro veio pelo
molde que a feature 005 abriu: um auxiliar copia o workspace para pasta temporária, adoece a cópia
e imprime o caminho. Os quatro estados são registro ausente, bug restrito, registro inconsistente
e leitura parada no teto, e cada um é conferido pela suíte contra a leitura de verdade, para que
quem confere a tela esteja conferindo o estado que pediu.

As duas medidas de orçamento foram refeitas com o cartão novo dentro. O pacote da tela somou
194018 B, pouco menos da metade do teto, e o custo do bloco de bugs foi de cerca de 13 KiB sobre a
medida da feature 006. A leitura do registro no teto de cinquenta bugs levou 24 ms contra o teto
de 200, e a pintura do bloco, 3 ms contra o teto de 100. As duas ficaram escritas ao lado do teto,
para que perda de folga apareça como perda, e não como teste que passou raspando.

## Preservadas

Vazio. Não há extração de legado neste projeto, e portanto não há regra 🟢 de `domain.md` a
preservar. Quando uma futura `/reversa` extrair o código escrito por este ciclo, as regras que ela
confirmar passam a caber aqui.

## Modificadas

Vazio, pelo mesmo motivo. Nenhuma regra extraída foi alterada ou removida, porque nenhuma foi
extraída.
