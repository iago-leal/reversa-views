# Leitura do processo em /Users/iagoleal/dev/financas-ali, 2026-09-19

Leitura feita à mão, contra o código da construção 0.9.4 (`ecbebb9`), aplicando ao disco do
projeto as regras de `forward.ts`, `actions.ts`, `history.ts`, `domain/greenfield.ts` e
`domain/prd-scope.ts`. Nenhum dos achados abaixo é defeito de implementação: o código faz o
que os requisitos das features 006 e 009 mandam. São insumo para a **feature 010**, e não
para o registrador de bugs.

## O que o disco contém

- Ponteiro: feature ativa `002-infra-remota-auth-assistente`, sem pausadas. `current-stage`
  diz `to-do`, o que é ignorado por desenho (`forward.ts:12`).
- `_reversa_forward/`: `001-fechamento-mensal-mvp` e `002-infra-remota-auth-assistente`, cada
  uma com 183 linhas `[X]` e nenhuma `[ ]`.
- `_reversa_sdd/addenda/`: só `002-infra-remota-auth-assistente.md`.
- `_reversa_sdd/sdd/`: dez specs com nome de componente: `acerto-mensal`, `ajustes`,
  `boletos-faturas`, `categorizacao-regras`, `fundacao-persistencia`, `ingestao-transacoes`,
  `investimentos-patrimonio`, `metas`, `recorrentes-assinaturas`, `telas-e-navegacao`.
- `prd.md`: seção `## 4. Escopo (in)` com 13 itens; é reconhecida.
- `state.json`: `newproject_progress.stage = done`, cenário greenfield.

## O que o painel mostra, e por que engana

### A. As dez specs aparecem como planejadas, e as duas entregas como fora do plano

`panoramaOf` casa a spec com a pasta pelo nome normalizado (`comparable`, D-07). Aqui as specs
têm nome de componente e as pastas têm nome de entrega, e uma entrega cobre vários
componentes. Nenhum nome coincide, e o panorama diz que nada foi entregue. O vínculo existe no
disco, mas declarado pela feature, e não pelo nome. Contagem de 2026-09-19 dos caminhos
`sdd/<nome>.md` citados:

| Fonte | Specs citadas |
|---|---|
| `001/requirements.md` | acerto-mensal, ajustes, boletos-faturas, categorizacao-regras, fundacao-persistencia, ingestao-transacoes, telas-e-navegacao (7 de 10) |
| `001/legacy-impact.md` | fundacao-persistencia |
| `002/requirements.md` | ajustes, categorizacao-regras, fundacao-persistencia, telas-e-navegacao |
| `002/legacy-impact.md` | ajustes, fundacao-persistencia, telas-e-navegacao |
| adendo da 002, coluna `Artefato` | ajustes, fundacao-persistencia, telas-e-navegacao |

Metas, recorrentes e investimentos não são citados por nenhuma das duas entregas: são os
candidatos reais a "planejada". Há ruído nessas fontes. A busca ingênua por `sdd/` casa também
`_reversa_sdd/prd.md`, `architecture.md` e `personas.md`, que não são specs, e o
`requirements.md` cita specs de passagem, sem que a feature as entregue. A leitura precisa
filtrar pelos nomes presentes em `sdd/` e decidir que fonte tem peso de entrega.

### B. Componentes entregues sem spec não aparecem

A 002 criou três componentes, `acesso-e-identidade`, `operacao-de-producao` e `assistente`, que
não têm spec em `sdd/`: os contratos vivem em
`_reversa_forward/002-.../interfaces/`, até que uma re-extração os incorpore. O adendo declara a
lacuna (linha `sdd/ (conjunto) | — | componente-novo`), e o panorama, que só parte das specs, não
tem como mostrá-la.

### C. "Convergida" enquanto a conferência operacional está inteira em branco

O `actions.md` da 002, linha 83, diz que o critério de pronto do `roadmap.md#10` exige **ações
em `[X]` e onboarding conferido**. O `onboarding.md`, seção `## 9. Registro de conferências`,
tem uma tabela `Data | Marco | Item | Resultado | Observação` com 20 linhas, **todas com
`Data` e `Resultado` vazios**: M0 a M6, as provas de imagem, a verificação em duas etapas, o dump
com restauração, os cenários com o modelo real e a conferência de segredos. O painel classifica
a feature como `done-com-adendo` e não mostra próxima ação nenhuma. O trabalho que falta de fato
está em lugar que ele não lê.

A mesma forma existe na 001: a seção 4 do `onboarding.md` traz o roteiro manual por marco, nunca
executado inteiro.

### D. A 001 aparece como "entregue sem adendo"

A 001 nasceu com a extração greenfield (`/reversa-new`), e seu conteúdo **é** a extração: não
há adendo porque não havia o que adendar. O histórico não distingue esse caso de um
`/reversa-sync` esquecido.

## Perguntas para a feature 010

1. De onde tirar o vínculo spec ↔ entrega: tabela de impacto do adendo, `legacy-impact.md`,
   citações em `requirements.md`? Qual prevalece quando divergem, e o nome continua valendo como
   última alternativa?
2. Um componente sem spec, citado como `componente-novo` no adendo, entra no panorama como linha
   própria, marcada como sem spec?
3. A tabela de conferências do onboarding vira eixo próprio do veredito (convergida com
   conferência pendente) ou só um aviso? Como reconhecê-la com tolerância, dado que o formato
   é prosa de agente (ver os bugs nº 7 e nº 8 sobre a notação das células)?
4. A feature que nasce do greenfield se reconhece por qual sinal: o `newproject_progress`, o id
   001 ou a ausência de `legacy-impact.md` anterior?
