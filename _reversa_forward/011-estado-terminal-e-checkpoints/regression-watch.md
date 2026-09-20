# Vigilância de regressão: 011-estado-terminal-e-checkpoints

**Data:** 2026-09-20
**Feature:** `011-estado-terminal-e-checkpoints`
**Cenário:** greenfield.

Este projeto não tem extração de `/reversa`: o contexto vem de `_reversa_sdd/prd.md` e das cinco
specs de `_reversa_sdd/sdd/`. Não há regra 🟢 confirmada sobre código existente, e por isso o watch
principal nasce vazio. O que esta entrega deixou de verdades a manter está em "Observações", sem
peso de regressão. Elas ganham peso quando uma `/reversa` futura, rodando sobre o código novo,
confirmar cada uma como 🟢.

Uma ressalva própria desta feature. Duas das verdades abaixo são o **contrário** do que a camada
herdada de `src/heranca/` afirma sobre o mesmo arquivo, e é assim de propósito: a herança descreve
o disco com fidelidade, o painel decide o que disso merece a atenção de quem lê. Uma extração
futura que encontrasse essas duas regras dentro de `src/heranca/` estaria diante de mudança de
decisão, e não de regressão, porque significaria que a pendência declarada em
`src/heranca/PROCEDENCIA.md` foi enfim levada à origem.

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

Sem peso de regressão. São os requisitos que esta entrega implementou, com o lugar onde cada um
vive e o sinal pelo qual uma extração futura perceberia que deixou de ser verdade. Todos nasceram
🟢 em `requirements.md`, RF-10 e RF-11 como `Should` e os demais como `Must`.

| ID | Origem (arquivo, seção) | Regra esperada após mudança | Tipo de verificação | Sinal de violação |
|---|---|---|---|---|
| W001 | `requirements.md` RF-01 e RN-01, `src/domain/discovery-state.ts` | Valor de `phase` cuja forma declara encerramento é estado terminal, reconhecido por família e não por lista literal: o valor é partido em `-` e `_`, cada parte é normalizada e basta uma começar pela raiz | presença | Lista literal das cinco grafias no lugar da raiz; sexta grafia virando anomalia |
| W002 | `requirements.md` RF-02, `src/domain/discovery-state.ts` | Três situações distintas e nomeadas, `nao-iniciada`, `em-curso` e `encerrada`, com o valor bruto ao lado do reconhecido | presença | Painel voltando a inspecionar `phase` para decidir; valor bruto normalizado ou descartado |
| W003 | `requirements.md` RF-03 e RN-02, `src/domain/discovery-state.ts` | As cinco canônicas são testadas ANTES da família de encerramento, e valor fora das duas continua produzindo `fase-desconhecida` com o nome à vista | ausência | `geracaoo` deixando de ser anomalia; precedência invertida |
| W004 | `requirements.md` RF-04, `src/webview/ui/DiscoverySection.tsx` | Frase de encerramento como `<p data-part="discovery-closed">` acima das cinco fases, com o valor bruto ao lado, e só quando a extração encerrou | redação | Frase em extração não encerrada; sexta fase desenhada; fases fora da ordem do framework |
| W005 | `requirements.md` RF-05 e RN-03, `src/domain/discovery-state.ts` | Três estados do checkpoint na precedência do `checkpoint-guide`: `completed_at` presente, `modules_pending` não vazio, e conclusão não declarada | presença | Volta ao binário `inProgress`; `at` ou `status` promovidos a declaração de conclusão |
| W006 | `requirements.md` RF-06, `src/webview/ui/DiscoverySection.tsx` | Instante só quando vem de `completed_at`, e passando pela conversão de fuso já vigente | ausência | Instante universal cru na tela; checkpoint em conclusão não declarada exibindo instante |
| W007 | `requirements.md` RF-07 e RN-04, `src/domain/discovery-state.ts` | O terceiro estado registra `checkpoint-sem-conclusao-declarada`, nomeando o agente e o campo que falta | presença | Terceiro estado silencioso; anomalia sem o nome do agente |
| W008 | `requirements.md` RF-08 e RN-05, `src/heranca/reversa-domain/src/state.ts` | Todo campo do checkpoint que não participa da decisão de estado sobrevive em `extra` | ausência | Campo de saída descartado na leitura |
| W009 | `requirements.md` RF-09, `src/domain/discovery-state.ts`, `src/webview/domain/labels.ts` | Projeto com `phase` nulo ou canônico e checkpoints com `completed_at` lê exatamente como antes da feature; sem o eixo na carga, a tela cai no comportamento herdado | ausência | Painel deste repositório diferente do da 010; host anterior mudando de desenho |
| W010 | `requirements.md` RF-10, `tests/fixtures/descoberta/` | A verificação inclui a forma real medida no `med-reversa` em 20/09, com os sete checkpoints e a fase terminal, escrita e não copiada | presença | Suíte só com caso sintético; fixtura ajustada ao caso imaginado |
| W011 | `requirements.md` RF-11 e RN-05, `src/domain/discovery-state.ts`, `src/webview/ui/DiscoverySection.tsx` | Campo preservado cujo valor é lista de textos é nomeado, e só quando `files` está ausente; nada é chamado de saída nem promovido a lista de arquivos | presença | `achados` ou `lacunas` virando lista de arquivos; sinalização em checkpoint que já tem `files` |
| W012 | `roadmap.md` D-02 e D-03, `src/webview/domain/anomalies-view.ts`, `src/webview/domain/integrity.ts` | A absorção casa arquivo, código e detalhe, nunca o código sozinho; a composição é única, e a contagem do cabeçalho sai dela | presença | Absorção por código, apagando `fase-desconhecida` de erro de digitação; soma em linha de volta ao `App.tsx`; cabeçalho e seção discordando |
| W013 | `requirements.md` RNF de manutenibilidade, `src/heranca/PROCEDENCIA.md` | Nada em `src/heranca/` é tocado por esta regra, o total de adaptações declaradas continua dezesseis, e a pendência de levar os dois achados à origem fica escrita em seção que não é adaptação | ausência | Décima sétima adaptação aberta por esta regra; carimbo alterado; pendência com trecho original e adaptado |
| W014 | `requirements.md` RNF de desempenho e de tamanho, `tests/desempenho-referencia.spec.ts`, `tests/webview-build.spec.ts` | Leitura da referência abaixo de 200 ms, sem leitura de disco nova, e pacote da tela abaixo da guarda de 60 % do teto (52,9 ms e 214.288 B em 2026-09-20) | presença | Eixo abrindo arquivo por conta própria; guarda afrouxada sem decisão registrada |
