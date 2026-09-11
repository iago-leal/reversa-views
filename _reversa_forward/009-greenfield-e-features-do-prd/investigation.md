# Investigação: greenfield e features do PRD

> Identificador: `009-greenfield-e-features-do-prd`
> Data: `2026-09-11`
> Roadmap: `_reversa_forward/009-greenfield-e-features-do-prd/roadmap.md`

## 1. O que esta investigação apurou

Três coisas, e as três decidem a forma do plano. A primeira é que o "ideation" que o modelo herdado
já lê não é o que o usuário pediu: é o brainstorm de `/reversa-brainstorm`, com seu próprio ponteiro
em `.reversa/active-ideation.json`, e não a pipeline de `/reversa-new`, cujo rastro fica em
`newproject_progress` de `state.json` e nos artefatos de `_reversa_sdd/`. Nada no herdado deriva
estágio dessa pipeline, e o campo é ignorado por `StateContract`. A segunda é que as features
planejadas de um projeto greenfield têm forma física estável, uma spec por componente em
`_reversa_sdd/sdd/`, e que essa forma casa um a um com as cinco primeiras pastas de
`_reversa_forward/` deste projeto, enquanto as três seguintes nasceram fora do plano. A terceira é
que o campo `Status` das specs não é fonte confiável: as cinco dizem "rascunho" com as cinco
convergidas, e ler dali seria desenhar mentira com selo.

## 2. Como o metadado `newproject_progress` se comporta

Apurado no skill `reversa-new` e no `state.json` deste projeto (🟢).

- O campo tem `mode`, `stage`, `started_at`, `last_checkpoint_at`, `completed_stages` e `brief`, e
  uma chave `decisions` livre, cujo conteúdo varia por projeto.
- `stage` nomeia o PRÓXIMO agente a rodar, não o último que rodou, e no modo guiado só é atualizado
  depois do CONTINUAR do usuário. Entre a escrita do artefato e o CONTINUAR, o disco está um passo à
  frente do metadado, e isso é estado normal.
- Os tokens são `ideator`, `researcher`, `drafter`, `spec-sdd` e `done`; no modo expresso entram
  também `forward-requirements`, `forward-plan` e afins.
- `decisions.decomposicao` lista os componentes decididos, mas é chave de decisão livre, e não há
  garantia de que outro projeto a tenha. Por isso a lista de componentes vem de `sdd/`, e não daqui.

A consequência é D-04: comparar por conjunto aceito, e não por igualdade. Cada estágio físico aceita
o agente que o produziu e o próximo; o estágio `especificado` aceita `spec-sdd`, `done` e qualquer
`forward-*`. Fora do conjunto, anomalia que diz os dois valores; o físico manda.

## 3. Como as specs se relacionam com as pastas de feature

Apurado listando `_reversa_sdd/sdd/` e `_reversa_forward/` (🟢).

| Spec | Pasta | Adendo em vigor |
|------|-------|-----------------|
| `leitura-do-processo.md` | `001-leitura-do-processo` | `001-leitura-do-processo.md` |
| `ponte-e-host.md` | `002-ponte-e-host` | `002-ponte-e-host.md` |
| `painel-do-processo.md` | `003-painel-do-processo` | `003-painel-do-processo.md` |
| `heranca-e-sincronia.md` | `004-heranca-e-sincronia` | `004-heranca-e-sincronia.md` |
| `empacotamento-e-verificacao.md` | `005-empacotamento-e-verificacao` | `005-empacotamento-e-verificacao.md` |
| nenhuma | `006-cartoes-e-cronologia` | `006-cartoes-e-cronologia.md` |
| nenhuma | `007-atualizacao-e-progresso` | `007-atualizacao-e-progresso.md` |
| nenhuma | `008-cronologia-do-ciclo-bugs` | `008-cronologia-do-ciclo-bugs.md` |
| nenhuma | `009-greenfield-e-features-do-prd` | ativa, sem adendo |

O casamento é por nome curto, e é exato nas cinco: o `/reversa-requirements` gera o `short-name` em
kebab-case ASCII a partir do argumento livre, e o `/reversa-spec-sdd` nomeia a spec pelo componente
decidido, também em kebab-case. Não há garantia de que as duas cadeias produzam o mesmo nome em todo
projeto; quando não produzem, o painel mostra uma spec planejada e uma pasta fora do plano lado a
lado, e o mantenedor vê o par faltante. Essa é a decisão 5a da sessão de esclarecimento, e a
alternativa, casar por similaridade, produziria pares falsos que ninguém veria.

`domain/history.ts` já entrega tudo o que o cruzamento precisa: `nomeCurto`, `situacao`, `marca`,
`pasta` e `adendo` por entrada. O domínio novo não relê pasta alguma do forward.

## 4. A forma do escopo no PRD deste projeto

Apurado em `_reversa_sdd/prd.md`, linha 60 em diante (🟢).

A seção é `## Escopo (in)`, nível dois, seguida de `## Não-objetivos (out)`. Dentro, parágrafos em
negrito rotulam grupos, e itens de topo listam capacidades, alguns com nome antes de dois-pontos e
selo de confidência no fim. O leitor restrito de D-10 reconhece exatamente esta forma e declara
anomalia quando não a encontra. A marca 🟡 do roadmap é por outros PRDs, escritos por versões
futuras do `/reversa-drafter`, e não por este.

## 5. Onde o painel obriga o bloco a se encaixar

Apurado nos módulos da tela e nas suítes (🟢).

- `SECTION_NAMES` em `src/webview/domain/types.ts` é a única fonte da ordem, e
  `tests/webview-sections.spec.ts` confere o documento renderizado contra ela. Hoje são nove nomes;
  passam a onze.
- `DEFAULT_COLLAPSED` decide o recolhimento inicial; `effectiveCollapsed()` em `sections.ts` não
  muda. Uma preferência já declarada que não conheça os nomes novos deixa os dois cartões abertos, e
  isso é a regra de D-03 da feature 006 funcionando como desenhada.
- `blockingReasons(process, registry?)` em `blocking.ts` já recebe o registro de bugs ao lado do
  processo; ganha o eixo greenfield como terceiro argumento, opcional, pelo mesmo motivo.
- `readingIntegrity()` soma anomalias do processo e do registro; passa a somar as do eixo.
- `AnomaliesSection` já recebe `DisplayAnomaly[]` mesclado; a mescla ganha uma terceira lista.
- `summaryText()` tem os blocos "Feature ativa" e "Entregas anteriores"; ganha "Panorama do produto"
  entre os dois, com a contagem, os componentes por situação e os fora do plano.
- `DiscoverySection` desenha as fases da extração; ganha a frase de RF-17 quando o cenário é
  greenfield e nenhuma fase foi concluída.
- `tests/host-protocol.spec.ts` conta os campos de `SetProcessData` por nome; passa a esperar dez.

## 6. O custo de desempenho

Apurado em `tests/desempenho-referencia.spec.ts` e no `REVERSA_FILE_CAP` herdado (🟢).

O teto de leitura e julgamento é 200 ms, medido com os artefatos deste projeto. A leitura nova custa
seis `stat` de presença, um `listNames` e dois `readText`, e o PRD deste projeto tem poucas dezenas
de KiB. O que a tornaria cara seria ler as specs, e é o que D-11 recusa. O julgamento é linear no
número de specs somado ao de entradas do histórico, ambos com teto de cinquenta.

O pacote da tela tem 194.018 bytes na última medição, contra teto de 409.600. Dois componentes e uma
função pura cabem com folga, e `tests/webview-build.spec.ts` mede.

## 7. Alternativas avaliadas e descartadas

| Alternativa | Por que não |
|-------------|-------------|
| Estender `StateContract` do herdado para ler `newproject_progress` | Adaptação declarada em arquivo vendorizado e conflito na próxima ressincronização, para ganhar o que `parseJsonSafe` sobre `snapshot.stateJson` já dá |
| Ler o `Status` de cada spec | Fonte que ninguém atualiza; provado pelas cinco specs deste projeto |
| Listar componentes por `decisions.decomposicao` | Chave livre, sem garantia de existir em outro projeto |
| Casar spec e pasta por prefixo ou similaridade | Pares falsos invisíveis; decisão 5a |
| Ligar o brainstorm agora | O usuário pediu que fique fora; o cartão reserva o lugar e a próxima feature liga com uma linha |
| Um cartão só para origem e panorama | O panorama é o que se olha sempre e a origem raramente; recolher um esconderia o outro |
| Fixtures versionadas para os estados doentes | Contra o precedente de `estragar-workspace.js` e `estragar-registro.js`; o script gera a doença fora do repositório |

## 8. Padrões aplicáveis, já praticados nesta casa

- Sonda que olha e domínio que julga, com `node:fs` em um arquivo só (feature 006, D-01 da 008).
- Protocolo por acréscimo, com as duas declarações do payload mantidas em sincronia por suíte
  (feature 002, D-10 da 008).
- Ausente não é vazio: campo faltante no payload é "leitura não realizada" (RN-08, e RN-04 da 008).
- Anomalia em forma comum `DisplayAnomaly`, união local fora do herdado (D-04 da 008).
- Função pura que ordena, agrupa e recorta numa passagem só, componente que só chama (D-06 da 008).
- Literais e tetos em `limits.ts` (D-14 da 006, D-13 da 008).
- Instante absoluto convertido só na tela por `brasiliaInstant` (feature 003).
- Rótulo por `lookUp`, com valor desconhecido desenhado cru e marcado (feature 006).
- Estado doente por cópia do workspace, nunca pelo preview (feature 005, D-21).

## 9. Fontes

- `.claude/skills/reversa-new/SKILL.md`, seções sobre `newproject_progress`, modos e estágios.
- `.claude/skills/reversa-coding/SKILL.md`, regra de âncora legado e greenfield.
- `.claude/skills/reversa-spec-sdd/SKILL.md` e `reversa-drafter/SKILL.md`, forma das specs e do PRD.
- `.claude/skills/reversa-brainstorm/SKILL.md`, para confirmar que o eixo "ideation" herdado é outro.
- `src/heranca/reversa-domain/src/state.ts`, `ideation.ts`, `json.ts`, `table.ts`, `index.ts`.
- `src/heranca/reversa-probe/src/files.ts` e `snapshot.ts`.
- `src/domain/history.ts`, `bugs.ts`, `types.ts`, `limits.ts`.
- `src/webview/domain/types.ts`, `sections.ts`, `blocking.ts`, `integrity.ts`, `summary.ts`.
- `_reversa_sdd/prd.md`, `sdd/*.md`, `addenda/*.md`, `.reversa/state.json`.
- `_reversa_forward/008-cronologia-do-ciclo-bugs/`, como precedente de forma.
