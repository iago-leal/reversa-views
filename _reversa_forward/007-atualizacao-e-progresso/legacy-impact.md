# Impacto no legado: 007-atualizacao-e-progresso

**Data:** 2026-09-09
**Feature:** `007-atualizacao-e-progresso`
**Cenário:** greenfield.

Feature greenfield, sem legado pré-existente. Âncora: `prd.md` + specs SDD.

Não há extração de `/reversa` neste projeto: `_reversa_sdd/` não tem `architecture.md` nem
`domain.md`, e o contexto vem de `_reversa_sdd/prd.md` com as cinco specs de
`_reversa_sdd/sdd/`. Por isso não há regra 🟢 extraída de código existente para preservar ou
quebrar, e as seções "Preservadas" e "Modificadas" ficam vazias.

O que existe de código anterior foi escrito pelo próprio ciclo forward, nas features 001 a 006.
Como no rastro da feature 006, a tabela distingue arquivo criado (`componente-novo`) de arquivo
anterior que ganhou comportamento (`regra-nova`), arquivo anterior cujo comportamento mudou
(`regra-alterada`) e contrato da ponte (`delta-de-contrato-externo`). Dezoito arquivos foram
criados e quarenta e cinco modificados; a lista completa, ação por ação, está em `progress.jsonl`.

**Política de edição do legado no momento da execução.** `.reversa/reversa-config.json` declarava
`"allowLegacyEdits": true` com `"allowedPaths": []`. Liberação irrestrita: todo caminho do projeto
estava gravável, e nenhuma escrita foi recusada por política. O arquivo de configuração não foi
criado nem alterado por esta execução.

## Arquivos afetados

| Arquivo afetado | Componente | Tipo | Severidade | Justificativa |
|---|---|---|---|---|
| `scripts/git.js` | empacotamento-e-verificacao | componente-novo | MEDIUM | A única porta de entrada para o git em toda a família de scripts (D-13): `executar` lança `ErroDeGit` com causa distinguível (ausente, falhou, tempo esgotado), `tentar` devolve nulo. Nada nele escreve na árvore. |
| `scripts/heranca/leitura.js` | heranca-e-sincronia | regra-alterada | LOW | A chamada ao git que vivia aqui passou a usar `scripts/git.js`; o comportamento observável é o mesmo. |
| `scripts/versao.js` | empacotamento-e-verificacao | componente-novo | HIGH | A derivação da versão (RN-06): maior número de adendo, e não quantidade; commit que ACRESCENTOU o adendo, e não o que o tocou; quatro causas de recuo nomeadas. É a autoridade sobre o número que vai no pacote. |
| `scripts/gerar-carimbo-da-construcao.js` | empacotamento-e-verificacao | componente-novo | MEDIUM | Gera `src/host/build.ts` a cada construção com versão, commit inteiro, origem e ramo padrão. O arquivo gerado não é versionado (D-19). |
| `src/host/build.ts` | ponte-e-host | componente-novo | MEDIUM | Gerado e ignorado pelo git. Constantes de tempo de construção no regime de `inheritance.ts` (RN-05); `extension.ts` o importa, e por isso `pretest` o gera antes da suíte. |
| `.gitignore` | empacotamento-e-verificacao | regra-nova | LOW | `src/host/build.ts` entra na lista, com o porquê escrito ao lado (D-19). |
| `package.json` | empacotamento-e-verificacao | regra-nova | MEDIUM | Três acréscimos: `gerar:carimbo` no `build`, `pretest`, `atualizar`; e a chave de configuração `reversaViews.conferirAtualizacao` (RF-14). Dezessete scripts. |
| `src/host/protocol.ts` | ponte-e-host | delta-de-contrato-externo | HIGH | `UPDATE_STATES`, `UPDATE_CAUSES`, a união discriminada `UpdateStatus` e o quarto comando `setUpdate`, por acréscimo. E dois campos a mais em `SetProcessData` (`extensionVersion`, `builtFromCommit`), contra o que `interfaces/delta-do-canal.md` previa: ver nota 4 de `actions.md`. |
| `src/host/ports.ts` | ponte-e-host | componente-novo | HIGH | Duas portas novas, `ConfigPort` e `OriginPort`. A segunda é a primeira porta de rede da extensão, e expõe só leitura (`compare`). |
| `src/host/update.ts` | ponte-e-host | componente-novo | HIGH | O intérprete puro da resposta da origem: lê o código HTTP ANTES do corpo, porque o corpo do 404 real carrega `"status": "404"`; `queryPlan` decide quando não consultar (desligada, sem origem, sem commit). |
| `src/host/net.ts` | ponte-e-host | componente-novo | CRITICAL | O único módulo que abre conexão. Valida repositório, commit e ramo antes de qualquer socket; dois cabeçalhos apenas; nenhum redirecionamento seguido; teto de bytes e de tempo; nenhum `node:fs` nem `child_process`. É a fronteira que RN-01, RN-02 e RN-09 exigem. |
| `src/host/adapters.ts` | ponte-e-host | regra-nova | LOW | `configPort` lê a chave no momento de perguntar, sem memorizar, e recua para verdadeiro diante de tipo estranho. |
| `src/host/session.ts` | ponte-e-host | regra-nova | LOW | `sessionMessages` recebe o carimbo por parâmetro (`BuildStamp`) e o põe na carga; por parâmetro porque `build.ts` não é versionado e o preview o passa por conta própria. |
| `src/host/provider.ts` | ponte-e-host | regra-nova | HIGH | A consulta à origem depois do processo, uma por leitura, com geração para descartar resposta de leitura anterior; uma linha de log por falha (T041). Nunca bloqueia a leitura. |
| `src/extension.ts` | ponte-e-host | regra-nova | MEDIUM | Monta as duas portas novas e o carimbo onde o provedor é construído; a camada de leitura continua sem enxergá-las (D-01). |
| `src/webview/bridge/messaging.ts` | painel-do-processo | regra-nova | LOW | O quarto comando no sink e no `switch`; a guarda `never` fez o que existia para fazer. |
| `src/webview/domain/entry.ts` | painel-do-processo | regra-alterada | MEDIUM | O estado efetivo ganha `update`, nulo enquanto nada foi dito. O processo novo PRESERVA o desfecho anterior; a releitura também; estado sem leitura por trás o apaga. |
| `src/webview/domain/types.ts` | painel-do-processo | regra-nova | LOW | `EffectiveEntry.update` e `UpdateLabel`. |
| `src/webview/domain/labels.ts` | painel-do-processo | regra-nova | MEDIUM | `updateLabel`: sete frases distintas, total, com "desligada" que não diz "em dia" e "commit desconhecido" que não diz "atrasada"; comando a copiar só em atrasada e divergente. |
| `src/webview/domain/decomposition-view.ts` | painel-do-processo | regra-alterada | HIGH | A ordem nova de RF-23 a RF-25: abertas na ordem do plano, fechadas por recência decrescente, sem instante ao fim do bloco; o recorte é um PREFIXO da ordem unificada. Muda o que se vê em trilha sem instantes (nota 7 de `actions.md`). |
| `src/webview/main.tsx` | painel-do-processo | regra-nova | LOW | O quarto tratador do sink, que não apaga o aviso nem escreve preferência; o desfecho desce como propriedade. |
| `src/webview/ui/App.tsx` | painel-do-processo | regra-nova | LOW | Repassa `update` ao cabeçalho, sem decidir nada. |
| `src/webview/ui/Header.tsx` | painel-do-processo | regra-nova | MEDIUM | Dois itens de procedência (versão e commit curto com `data-full`) e a linha do desfecho, com `data-update` e o comando em `code`. Desfecho ausente ou indefinido não desenha linha (RN-05). |
| `src/webview/ui/ProgressBar.tsx` | painel-do-processo | componente-novo | MEDIUM | A barra única (D-15), em SVG porque a política de estilo do painel descarta estilo em linha; papel, mínimo, máximo, valor corrente limitado e texto equivalente não limitado (RF-31, RF-33). |
| `src/webview/ui/DecompositionSection.tsx` | painel-do-processo | regra-nova | LOW | A barra sobre a contagem herdada, nunca sobre a lista em vista (RN-08). |
| `src/webview/ui/ForwardSection.tsx` | painel-do-processo | regra-nova | LOW | A barra ao lado dos pares de fechadas e abertas, do mesmo par herdado. |
| `src/webview/ui/HistorySection.tsx` | painel-do-processo | regra-nova | MEDIUM | A barra de convergidas sobre o total DECLARADO, e a frase que conta as features, acrescentada porque RN-10 proíbe a barra de ser a única portadora do número. |
| `src/webview/theme/theme.css` | painel-do-processo | regra-nova | LOW | Estilos da barra e da linha do desfecho, só com tokens que o podador já preserva; nenhum token de tipografia, que o podador não alcança. |
| `scripts/empacotar.js` | empacotamento-e-verificacao | regra-alterada | HIGH | Deriva a versão, escreve-a no manifesto em torno do empacotador e a restaura em `finally` (D-08); o pacote sai nomeado por ela; recuo é impresso (RF-21). Acesso ao mundo injetável para a suíte. |
| `scripts/atualizar.js` | empacotamento-e-verificacao | componente-novo | CRITICAL | O ritual: conferir sem tocar a árvore, com três desfechos e três códigos (D-12); aplicar atrás de `--aplicar`, com duas recusas antes de qualquer escrita e percurso que para na primeira falha (RF-04 a RF-07). É o único script que ESCREVE na árvore versionada, e só por avanço rápido. |
| `scripts/preview/config.js` | empacotamento-e-verificacao | regra-nova | LOW | `--atualizacao` com os sete nomes mais "nenhum", recusando valor fora da lista (D-17). |
| `scripts/preview/leitura.js` | empacotamento-e-verificacao | regra-nova | MEDIUM | A sequência em duas partes: "consultando" junto do processo, o desfecho num bloco "depois" que o cliente segura pelo atraso; o carimbo real na carga; o desfecho só acompanha um processo. |
| `scripts/preview/cliente.js` | empacotamento-e-verificacao | regra-nova | LOW | Entrega o bloco "depois" após o atraso, e mostra o desfecho forçado na faixa. |
| `scripts/preview/pagina.js`, `scripts/preview.js` | empacotamento-e-verificacao | regra-nova | LOW | O desfecho forçado no atributo da faixa e na linha do terminal. |
| `README.md` | empacotamento-e-verificacao | regra-nova | MEDIUM | A seção do ritual da atualização (RF-22), a tabela dos sete desfechos do preview (D-17), a situação do portão visual e a linha de instalação com a versão derivada. |
| `tests/helpers/reversa-fixtures.ts` | leitura-do-processo | regra-nova | LOW | A carga de fixture ganha os dois campos de procedência. |
| `tests/fixtures/consulta-a-origem/` | ponte-e-host | componente-novo | LOW | Dez respostas da origem, uma por linha da tabela de desfechos, com o 404 real e o corpo sem campos. |
| Suítes novas: `tests/host-update.spec.ts`, `tests/host-net.spec.ts`, `tests/versao.spec.ts`, `tests/webview-progress-bar.spec.tsx`, `tests/webview-header.spec.tsx`, `tests/webview-progress-cards.spec.tsx`, `tests/atualizador.spec.ts`, `tests/empacotamento-versao.spec.ts`, `tests/preview-leitura.spec.ts` | (todos) | componente-novo | LOW | Nove suítes, 189 casos; as quatro últimas não estavam no plano (nota 8 de `actions.md`). |
| Suítes estendidas: `tests/host-protocol.spec.ts`, `tests/host-manifest.spec.ts`, `tests/host-boundaries.spec.ts`, `tests/webview-boundaries.spec.ts`, `tests/readonly-local.spec.ts`, `tests/host-bridge.spec.ts`, `tests/host-provider.spec.ts`, `tests/webview-decomposition-view.spec.ts`, `tests/webview-theme-tokens.spec.ts`, `tests/webview-messaging.spec.ts`, `tests/webview-entry.spec.ts`, `tests/webview-render.spec.tsx`, `tests/webview-instants-render.spec.tsx`, `tests/preview-config.spec.ts` | (todos) | regra-nova | LOW | Fronteiras novas (rede fora da camada de leitura e fora da tela; único módulo de conexão), contagens novas, o quarto comando, o campo `update` nos dublês de estado. |

## Diff conceitual por componente

### ponte-e-host

O componente ganhou a primeira porta de rede da extensão, e a ganhou cercada. Um módulo só abre
conexão, e ele valida os três valores da requisição antes de qualquer socket, manda dois
cabeçalhos, não segue redirecionamento, limita bytes e tempo, e não importa sistema de arquivos
nem processo. A interpretação da resposta é função pura, e a regra que a sustenta foi conferida
contra a origem real na fase de preparação: o código HTTP se lê antes do corpo, porque o 404
verdadeiro traz um campo `status` com texto que confunde. O plano de consulta decide quando NÃO
consultar, e a chave do editor é lida no momento de perguntar, não capturada na ativação.

O contrato cresceu por acréscimo, e num ponto cresceu além do que o delta previa: a carga do
processo passou a carregar a versão e o commit da construção. A alternativa, ler o carimbo pela
tela, colidia com a fronteira que proíbe o pacote da webview de importar valor de `src/host/`, e
RF-17 pede os dois itens "como o do modelo herdado", que viaja na carga. O desfecho da consulta,
esse sim, viaja fora dela, depois do processo, porque é assíncrono.

O provedor consulta uma vez por leitura, só quando há processo a acompanhar, e descarta a resposta
de uma leitura que já não é a corrente. A leitura nunca espera a origem.

### painel-do-processo

O cabeçalho passou a declarar procedência (versão e commit curto, com o inteiro no atributo) e o
desfecho da consulta, em sete frases distintas decididas no domínio e apenas colocadas pelo
componente. Duas distinções sustentam as frases: conferência desligada não é estar em dia, e
commit desconhecido não é estar atrasado. O desfecho vive no mesmo estado efetivo que o resto da
tela, e obedece à regra da releitura: o anterior fica até o novo chegar; sem leitura por trás,
some, porque o cabeçalho não tem construção a nomear.

As três barras são uma peça só, e a peça é SVG por causa da política de estilo do painel, que
descartaria a largura em atributo de estilo. Cada barra responde à mesma autoridade que o texto ao
lado dela: contagem herdada na decomposição e no ciclo forward, total declarado no histórico; a
lista em vista nunca é o denominador. O histórico ganhou a frase que conta as features, porque a
barra não pode ser a única portadora do número.

A ordem da decomposição mudou: abertas na ordem do plano, fechadas da mais recente para a mais
antiga, e sem instante ao fim do bloco. O recorte passou a ser prefixo dessa ordem, o que altera o
que se vê em projeto cuja trilha não registra instante algum.

### empacotamento-e-verificacao

A versão deixou de ser escrita à mão. Ela é derivada por regra monotônica, escrita no manifesto só
em torno do empacotador e restaurada em bloco de saída garantida, e o pacote passa a se chamar
pelo número derivado. O carimbo com esse número e o commit entra no bundle como constante gerada
a cada construção e não versionada; a suíte o gera antes de rodar, para que um clone recém-feito
não reprove antes da primeira construção.

O ritual da atualização nasceu em dois atos separados por argumento explícito, com três códigos
de saída no vocabulário que o verificador de herança já usava. A conferência não toca a árvore e
termina em dez segundos sem rede; a aplicação recusa árvore suja e commit local antes de tocar em
qualquer coisa, e o percurso para na primeira falha com o pacote anterior intacto. O git passou a
ter uma porta única para todos os scripts.

O preview ganhou o argumento que força cada desfecho, e a sequência sai em duas partes para que o
estado em curso exista na tela por um instante. O portão visual rodou sobre os sete desfechos, os
sete estados de entrada e as três barras, nos quatro conjuntos de cores, em largura de barra
lateral; nenhum defeito novo apareceu.

### heranca-e-sincronia

Mudança única: a chamada ao git que vivia em `scripts/heranca/leitura.js` passou a atravessar a
porta única de `scripts/git.js`. Nenhum arquivo vendorizado mudou, e a revisão do modelo herdado
continua a mesma (`420305d`).

### leitura-do-processo

Nenhuma alteração de comportamento. A camada continua pura: a suíte de fronteira passou a recusar
também os dois módulos de rede do Node ao lado dos de processo (RN-02), e a fixture da carga ganhou
os dois campos de procedência.

## Preservadas

Vazio: não há regra 🟢 extraída de código existente neste projeto.

## Modificadas

Vazio: não há regra 🟢 extraída de código existente neste projeto.
