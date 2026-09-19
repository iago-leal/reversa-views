# Vigilância de regressão: 010-vinculo-spec-e-conferencias

**Data:** 2026-09-19
**Feature:** `010-vinculo-spec-e-conferencias`
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

Sem peso de regressão. São os requisitos que esta entrega implementou, com o lugar onde cada um vive
e o sinal pelo qual uma extração futura perceberia que deixou de ser verdade. RF-06 e RF-13 nasceram
🟡 em `requirements.md` e continuam aqui pelo mesmo motivo que os demais, sem peso.

| ID | Origem (arquivo, seção) | Regra esperada após mudança | Tipo de verificação | Sinal de violação |
|---|---|---|---|---|
| W001 | `requirements.md` RF-01, `src/probe/features.ts` | A sonda abre `legacy-impact.md` e `onboarding.md` só quando a listagem da pasta os mostra, pelas funções herdadas; arquivo listado e não lido vai para `naoLidos` | ausência | `readText` sobre arquivo que a listagem não mostrou; `node:` importado pela sonda |
| W002 | `requirements.md` RF-02 e RN-01, `src/domain/delivery-link.ts` | Todas as tabelas com `Arquivo afetado` e `Componente`, em qualquer posição; declaração por delimitação, com `.md`, fim ou caractere fora de `[a-z0-9-]` à direita | ausência | `painel-do-processo-v2` declarando `painel-do-processo`; só a primeira tabela lida |
| W003 | `requirements.md` RF-02 e RN-04, `src/domain/delivery-link.ts` | Componente sem spec só quando a célula inteira, sem crases ou negrito, é um nome kebab | presença | "Tema", "(todos)" ou `docker-compose.yml` virando componente |
| W004 | `requirements.md` RF-03 e RN-02, `src/domain/greenfield.ts` | Nome primeiro: spec com pasta homônima liga só a ela; a declaração vale só para spec órfã; cada ligação traz a origem | presença | Panorama deste repositório diferente do da 009; spec com pasta homônima ganhando ligação declarada |
| W005 | `requirements.md` RF-04, `src/webview/ui/PanoramaSection.tsx` | "Entregues sem spec" entre as planejadas e "Fora do plano"; host anterior, vínculo parcial e nenhum componente são três frases distintas | redação | Bloco vazio sem frase, ou fora da ordem |
| W006 | `requirements.md` RF-05, `src/domain/greenfield.ts` | O denominador é o número de specs; componentes sem spec e pastas fora do plano têm frases próprias | presença | Denominador subindo por componente sem spec |
| W007 | `requirements.md` RF-06 e RN-05, `src/domain/conferences.ts` | Seção de nível dois cujo título, sem número, começa por "registro de conferências"; primeira tabela com `Data` e `Resultado`; seis estados; teto de cem linhas com `total` sobre todas | presença | Seção ausente virando anomalia; resultado classificado em vez de exposto |
| W008 | `requirements.md` RF-07, `src/webview/ui/HistorySection.tsx` | "N de M conferências registradas" ao lado da situação, sem alterá-la; host anterior diz "conferências não lidas" | presença | Situação mudando por conferência pendente |
| W009 | `requirements.md` RF-08 e RN-07, `src/webview/domain/blocking.ts` | Conferência pendente não gera razão na faixa nem próxima ação | ausência | Razão nomeando pasta convergida por linhas pendentes |
| W010 | `requirements.md` RF-09 e RN-08, `src/domain/history.ts` | A feature nascida da extração greenfield é classificada como qualquer outra | ausência | Código distinguindo a primeira pasta |
| W011 | `requirements.md` RF-10, `src/domain/types.ts`, `src/host/protocol.ts` | Campos novos opcionais ao fim de `HistoryEntry`, `ProjectHistory`, `PlannedComponent` e `ProductPanorama`; o topo de `SetProcessData` não cresce | ausência | Campo novo no topo, renomeado ou fora do fim da estrutura |
| W012 | `requirements.md` RF-11, `src/domain/conferences.ts`, `src/domain/history.ts` | `tabela-nao-reconhecida` com seção e cabeçalho no detalhe; `artefato-da-entrega-nao-lido` para arquivo não lido e para corte no teto de linhas | presença | Perda de leitura sem anomalia |
| W013 | `requirements.md` RF-12, `src/webview/domain/summary.ts` | Linhas dos componentes sem spec e bloco de conferências por entrega, pela mesma função pura do cartão | presença | Documento e cópia divergindo |
| W014 | `requirements.md` RF-13, `src/webview/ui/PanoramaSection.tsx` | Origem da ligação em texto, "pelo nome" ou "declarada"; a declarada abre o `legacy-impact.md` pela ponte | redação | Origem só por cor, ou link para arquivo errado |
| W015 | `requirements.md` RF-14, `scripts/estragar-vinculo.js` | Cinco casos, cada um produzindo de fato o estado prometido, com a cópia fora do repositório e a origem intocada | presença | Caso adoecendo pelo motivo errado, ou escrita na origem |
| W016 | `requirements.md` RNF de desempenho, `tests/desempenho-referencia.spec.ts` | Leitura da referência com os dois arquivos a mais por pasta, no teto de pastas, abaixo de 200 ms; a expressão de declaração compilada uma vez por spec | presença | Medida subindo para perto do teto; `new RegExp` de volta ao laço de spec por célula |
| W017 | `requirements.md` RNF de tamanho, `tests/webview-build.spec.ts` | Pacote da tela abaixo da guarda de 60 % do teto, com a medida escrita ao lado (212.316 B em 2026-09-19) | presença | Guarda afrouxada sem decisão registrada |
