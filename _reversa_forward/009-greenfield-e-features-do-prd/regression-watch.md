# Vigilância de regressão: 009-greenfield-e-features-do-prd

**Data:** 2026-09-11
**Feature:** `009-greenfield-e-features-do-prd`
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
| W001 | `requirements.md` RF-01, `src/probe/greenfield.ts` | A sonda lê a presença dos quatro artefatos e das duas âncoras numa listagem da pasta de saída, lista só os `.md` de `sdd/` até o teto, e abre apenas o brief e o PRD | ausência | Qualquer `readText` sobre ideação, personas ou spec; segundo `node:fs` no repositório |
| W002 | `requirements.md` RF-02 e RF-05, `src/domain/greenfield.ts` | `newproject_progress` ausente é metadado nulo sem anomalia; presente e não objeto é `metadado-greenfield-malformado`; campo com tipo errado vira nulo ou lista vazia | presença | Projeto legado produzindo anomalia de metadado, ou tipo errado lançando |
| W003 | `requirements.md` RF-03, `src/domain/greenfield.ts` | Estágio pelo maior contíguo presente a partir do brief; buraco não avança e abre `sequencia-greenfield-com-buraco` nomeando o primeiro ausente | presença | Estágio avançando por artefato posterior com anterior ausente |
| W004 | `requirements.md` RF-04, `src/domain/greenfield.ts` | Cada estágio aceita o agente que o produziu e o próximo; `especificado` aceita `spec-sdd`, `done` e `forward-*`; fora disso, `estagio-greenfield-divergente` com os dois valores e o disco mandando | redação | Anomalia sem um dos dois valores, ou estágio mudando para casar com o metadado |
| W005 | `requirements.md` RF-06, `src/domain/greenfield.ts` | Resumo pela primeira frase de "Ideia original" do brief, depois pelo campo `brief` do metadado, depois nulo | presença | Linha de resumo inventada com brief e metadado ausentes |
| W006 | `requirements.md` RF-07, `src/domain/greenfield.ts` | Casamento por nome exato normalizado (minúsculas, sem diacríticos, hífen preservado); projeção de situação em quatro linhas; pasta mais avançada representa o componente; `nomeCurto` nulo nunca casa | ausência | Prefixo ou sufixo casando; `painel-do-processo-v2` tomado por `painel-do-processo` |
| W007 | `requirements.md` RF-07 e RN-07, `src/domain/greenfield.ts` | `convergidos` conta as specs lidas, nunca as pastas fora do plano; truncado quando o disco tem mais specs do que se leu | presença | Contagem subindo por pasta sem spec |
| W008 | `requirements.md` RF-08, `src/host/protocol.ts` | `greenfield` é o décimo campo de `SetProcessData`, ao fim; ausente significa leitura não realizada, distinto de `cenario: 'legado'` | ausência | Tela lendo a ausência do campo como projeto legado |
| W009 | `requirements.md` RF-09, `src/host/reading.ts` | A sonda do eixo corre dentro do mesmo `try`, depois do histórico, com a pasta de saída do processo e o `state.json` do retrato | presença | Exceção da sonda escapando ao editor, ou caminho do Reversa escrito no host |
| W010 | `requirements.md` RF-10, `src/webview/ui/OriginSection.tsx`, `src/webview/domain/origin-view.ts` | As quatro etapas SEMPRE, na ordem canônica, com estado em palavra; corrente é a primeira ausente após as presentes quando a pipeline começou | presença | Etapa sumindo em projeto legado, ou estado só por cor |
| W011 | `requirements.md` RF-11, `src/webview/ui/PanoramaSection.tsx` | Contagem com barra, linha por componente com spec e adendo clicáveis e pasta só escrita, fora do plano à parte, escopo do PRD recolhido dentro do cartão | ausência | Pasta clicável; escopo aberto por padrão; item de escopo com situação |
| W012 | `requirements.md` RF-12, `src/webview/domain/panorama-view.ts` | Grupos em andamento, planejada, entregue, convergida; a ativa à frente; nome dentro; duas passagens iguais dão a mesma saída | presença | Lista remexendo entre leituras idênticas |
| W013 | `requirements.md` RF-13 e RF-14, `src/webview/domain/types.ts` | Onze seções: `panorama` entre decomposição e histórico, `origem` entre descoberta e política; origem recolhida e panorama aberto por padrão | presença | Ordem relativa das nove anteriores mudando |
| W014 | `requirements.md` RF-15, os dois cartões | Campo ausente, projeto sem `/reversa-new` e `sdd/` vazia são três frases distintas, nunca bloco vazio | redação | `<ul>` vazio em qualquer dos três |
| W015 | `requirements.md` RF-16, `src/webview/domain/blocking.ts` | Razão quando a pipeline começou, o cenário não é legado nem misto e o estágio está antes de `especificado`; comando `/reversa-<agente>`, `spec-sdd` para PRD sem spec; entra depois das razões anteriores | redação | Razão em projeto legado, ou comando `/reversa-new` |
| W016 | `requirements.md` RF-17, `src/webview/ui/DiscoverySection.tsx` | A frase de RN-12 só com cenário greenfield e nenhuma fase concluída; sem o eixo, o cartão é o de antes | ausência | Frase presente com fase concluída |
| W017 | `requirements.md` RF-18, `src/webview/domain/summary.ts` | Bloco "Panorama do produto" depois de "Entregas anteriores", pela mesma função pura do cartão; eixo ausente é frase, nunca rótulo pendurado | presença | Linha terminando em dois-pontos sem conteúdo |
| W018 | `requirements.md` RF-19, `src/webview/domain/integrity.ts` | As anomalias do eixo somam na integridade e chegam à seção de anomalias pela forma comum; host sem o campo contribui com nada | presença | Perda do eixo sem abrir a seção de anomalias |
| W019 | `requirements.md` RF-20, `src/webview/domain/labels.ts` | Seis rótulos totais: valor fora do vocabulário volta cru e marcado como não reconhecido | presença | Rótulo lançando ou devolvendo vazio |
| W020 | `requirements.md` RF-21, `scripts/estragar-greenfield.js` | Seis casos, cada um produzindo de fato o estado que promete; o preview continua sem escrever nada | presença | Caso que adoece pelo motivo errado |
| W021 | `requirements.md` RF-22, `src/probe/greenfield.ts` | Nenhum corpo de spec é lido; o nome do arquivo é a única fonte do componente | ausência | Cabeçalho "Componente N de M" influenciando ordem ou contagem |
| W022 | `requirements.md` RF-23, `src/domain/prd-scope.ts` | Primeira seção de nível dois com "escopo" no título e sem "nao objetivos", "fora do" nem "out"; itens com grupo, nome, detalhe e selo; teto de cinquenta declarado; PRD lido sem seção abre `escopo-do-prd-nao-encontrado` | presença | "Fora do escopo" lido como escopo; PRD ausente abrindo a anomalia |
| W023 | `requirements.md` RF-24, `src/webview/ui/OriginSection.tsx` | Depois das quatro etapas, um elemento vazio com `data-part="origin-brainstorm"` e `data-reserved="brainstorm"` | presença | Lugar reservado com conteúdo, ou ausente |

### Escolhas registradas nesta entrega

Não são requisitos: são decisões tomadas diante de ambiguidade, e é por elas que uma leitura futura
pode estranhar o código sem entender por quê.

| ID | Origem (arquivo, seção) | Escolha registrada | Tipo de verificação | Sinal de que precisa mudar |
|---|---|---|---|---|
| W024 | `src/domain/greenfield.ts`, `readMetadata` | O metadado é lido mesmo quando a pasta de saída não existe, porque "pipeline começou" também vale pelo ponteiro; o resto do eixo fica vazio | presença | Projeto com `newproject_progress` e sem pasta de saída sem razão na faixa |
| W025 | `src/domain/greenfield.ts`, `markOf` | Com várias pastas casadas, a marca é `ativa` se alguma for, senão `pausada` se alguma for, senão `nenhuma` | presença | Componente com pasta ativa mostrado como pausado |
| W026 | `src/domain/greenfield.ts`, `panoramaOf` | Escopo parado no teto de itens é `artefato-greenfield-truncado` sobre `prd.md`, sem campo próprio no panorama | redação | Cinquenta itens exatos desenhados sem declarar que há mais |
| W027 | `tests/webview-build.spec.ts` | A guarda de folga do pacote é 60 % do teto (245.760 B), decidida pelo usuário em 2026-09-11 quando o pacote mediu 206.403 B; a fração e a razão estão escritas no caso | presença | Fração alterada sem a medida e a razão escritas ao lado |
