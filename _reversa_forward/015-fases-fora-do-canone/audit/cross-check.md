# Auditoria cruzada: fases fora do cânone, ciclo e encerramento não declarado

> Identificador: `015-fases-fora-do-canone`
> Data: `2026-09-21`
> Artefatos analisados: [`requirements.md`](../requirements.md), [`roadmap.md`](../roadmap.md), [`actions.md`](../actions.md)
> Apoio: `data-delta.md`, `interfaces/` (três contratos), e o legado em `_reversa_sdd/sdd/` e `_reversa_sdd/addenda/`

Esta auditoria só lê. Nenhum dos artefatos acima foi alterado.

O legado deste projeto não tem `domain.md` nem `architecture.md`: as regras e os componentes vivem
nas cinco specs de `_reversa_sdd/sdd/` e nos adendos 001 a 014, e foi contra eles que o eixo 3 foi
conferido.

## Resumo

| Severidade | Findings |
|------------|----------|
| CRITICAL | 0 |
| HIGH | 0 |
| MEDIUM | 5 |
| LOW | 6 |

## Findings

| ID | Severidade | Eixo | Descrição | Onde está |
|----|------------|------|-----------|-----------|
| A001 | MEDIUM | 2.1 Consistência | O cenário "etapa aprovada é reconhecida com procedência" diz que `verificacao-regressao-c3` sai reconhecida "com ciclo 3". A RN-03, o RF-05, a D-10 e o `data-delta.md` dizem o contrário: o inteiro de uma etapa é `sufixo`, e nunca entra na conta do ciclo. Quem implementar a partir do Gherkin daria ciclo à etapa, e a RN-08 passaria a contar o que não deve | `requirements.md`, seção 7, linha 243; contra RN-03, RF-05 e `data-delta.md`, seção 1 |
| A002 | MEDIUM | 2.1 Consistência | O delta arquitetural diz que `src/domain/equivalencias.ts` "ganha a lista `etapas`, vazia até a primeira promoção". O tipo do mapa vive em `src/domain/types.ts`, o módulo é gerado, o `data-delta.md`, seção 8, diz que ele segue sem o campo até a primeira promoção, e o critério de pronto exige o arquivo idêntico byte a byte depois do aprendizado. O `actions.md` seguiu o `data-delta.md` (T002), de modo que roadmap e ações divergem na letra | `roadmap.md`, seção 5, linha do mapa; `actions.md`, resumo e T002 |
| A003 | MEDIUM | 2.1 Consistência | A RN-13 descreve a situação da etapa com dois valores, "concluída ou pendente". A D-10, o `data-delta.md` e o contrato do canal usam três: `concluida`, `em-curso` e `pendente`. A etapa em curso existe na própria RN-13, mas como frase, e não como situação da linha | `requirements.md`, RN-13; `roadmap.md`, D-10; `interfaces/protocolo-webview.md`, seção 3 |
| A004 | MEDIUM | 1.3 Cobertura | As quatro ações que mexem nos dois scripts de manutenção (T033 a T036) não têm suíte própria. Ficam sem asserção: "nada é escrito" com a conexão recusada depois de os checkpoints terem passado (RF-17), "`git status` mostra só o mapa" (RF-15), o comportamento sem `out-cli/` (D-21), o critério de pronto do mapa idêntico byte a byte depois do aprendizado, e a última linha do cenário "a contagem final cobre a raiz inteira". As suítes T010, T012, T013 e T014 cobrem os auxiliares, e não a rodada | `actions.md`, fases 2 e 4 |
| A005 | MEDIUM | 2.1 Consistência | A RN-09 promete que "o que sai do processo vai elidido", com o vocabulário da 012. Na passagem das fases, o roadmap e o contrato do motor não falam em elisão: o mecanismo é o filtro da RN-07 sobre os vizinhos (D-18). O efeito pode ser o mesmo, mas nenhum documento diz que o filtro é a elisão desta passagem, e `elidir.js` não é citado em ação alguma | `requirements.md`, RN-09; `roadmap.md`, D-18; `interfaces/motor-local.md`, seção 2 |
| A006 | LOW | 1.1 Cobertura | RF-15, RF-17 e RF-19 não têm decisão própria na tabela da seção 3. Estão cobertos por outros caminhos: o RF-15 pela D-06 e pelo delta arquitetural, o RF-17 pelo contrato do motor, o RF-19 pela linha da procedência. As ações T034, T033 e T045 citam o RF direto, sem decisão intermediária | `roadmap.md`, seções 3 e 5 |
| A007 | LOW | 2.1 Consistência | O critério de aceite do RF-14 ainda pede "a razão do motor e a evidência por nome". A D-17 restringe a razão ao agrupamento, e a seção de lacunas registra a releitura, mas a linha do RF não foi reescrita, e é ela que uma conferência de aceite lê | `requirements.md`, RF-14 e seção 10 |
| A008 | LOW | 1.3 Cobertura | A D-11 é 🟡 sob a justificativa de que "o requirements não trata o caso" da fase ausente das listas no ciclo corrente. O cenário "o ciclo aparece na tela e no terminal" e o aceite do RF-09 tratam: três fases sem registro no ciclo 3 saem pendentes. A decisão tem apoio para 🟢, e T008 e T019 herdaram o 🟡 sem necessidade | `roadmap.md`, D-11; `requirements.md`, RF-09 e seção 7 |
| A009 | LOW | 1.3 Cobertura | A segunda linha do cenário "fase de ciclo não vira anomalia", a lista herdada continuando a trazer a `fase-desconhecida`, não aparece como asserção em ação alguma. T007 confere o desconto, e não a lista bruta intacta, que é a prova da RN-05 | `actions.md`, T007 e T042 |
| A010 | LOW | 4.2 Sanidade | Vinte e dois pares de ações marcadas `[//]` dependem um do outro (por exemplo T024 de T016, T039 de T038, T016 de T006). Nenhum par partilha arquivo alvo, e a 014 usou a marca do mesmo jeito, como "paralela dentro da sua onda"; pela letra do `/reversa-to-do`, porém, `[//]` pede também independência | `actions.md`, coluna de paralelismo |
| A011 | LOW | 4 Sanidade | T046 tem como alvo o próprio `actions.md`, na seção de notas de execução. É o lugar que o template reserva ao `/reversa-coding`, mas uma ação cujo alvo é o documento que a lista é forma incomum, e o `regression-watch.md` seria alvo mais natural para os dois números | `actions.md`, T046 |

## O que passou

### 1. Cobertura

- Os 22 requisitos funcionais têm caminho até o roadmap: 19 por decisão da seção 3, e os três do A006 pelas seções 5 e 7.
- As 23 decisões (D-01 a D-23) têm ao menos uma ação cada, conferido por busca do identificador no `actions.md`.
- Os 22 cenários Gherkin têm ação que os alcança; as ressalvas são as linhas isoladas de A004 e A009.
- Os cinco passos com código do plano de migração estão na ordem das ações: T017 é o ponto de controle do mapa sem etapas, e T023 precede T034.
- Os oito riscos do roadmap têm mitigação com ação: a promoção que apagaria etapas (T010, T023), a paridade dos classificadores (T015, T024), a contagem com progresso (T031).

### 2. Consistência

- Todo RF, RN, RNF e NG citado no roadmap existe, no `requirements.md` ou em `_reversa_sdd/sdd/leitura-do-processo.md`. Toda decisão e todo RF citados no `actions.md` existem.
- Os três contratos de `interfaces/` constam da seção 7 do roadmap, e cada um tem ação: o canal em T042, o motor em T012 e T028, a contagem em T014, T031 e T032.
- Os nomes de código são os mesmos nos três documentos e nos contratos: `encerrada-sem-declaracao`, `encerramento-com-pendencia`, `fase-desconhecida`, `fase-atual-ja-concluida`, `classificarNome`, `etapas`, `ciclo`.
- A ordem dos quatro filtros é a mesma na D-14 e no contrato do motor, e o limite de 40 caracteres é o mesmo na RN-07, no contrato e em T011.
- Os códigos ao alcance do mapa são os mesmos na RN-10, na D-22 e no contrato da contagem.

### 3. Coerência com o legado

- NG-01, NG-03, NG-04, NG-05, RNF-01 e RNF-04 existem em `leitura-do-processo.md`, e nenhuma decisão os contraria: o classificador é função pura, o desconto continua do lado da tela, e a camada herdada não é tocada.
- As cinco specs e os adendos 011, 012 e 014, citados como origem, existem.
- Os componentes citados existem: `lerExtracao` e `valorComparavel` em `src/domain/discovery-state.ts`, `composeAnomalies` em `src/webview/domain/anomalies-view.ts`, `derivePhases` na camada herdada, `lerMapaDeModulo` e `fundir` em `scripts/equivalencias/gerar-mapa.js`, `labels.ts`, `DiscoverySection.tsx`, `src/cli/quadro/secoes.ts`, `estragar-descoberta.js`, `elisao-paridade.spec.ts` e a subseção "Pendências de origem" de `PROCEDENCIA.md`.
- `readWorkspace` já aceita o mapa por `deps.equivalencias`, o que sustenta a D-20 sem mudança na leitura.
- O risco que a D-06 aponta é real no código de hoje: `lerMapaDeModulo` devolve só `pares` e `naoAgentes`.

### 4. Sanidade do actions

- 46 ações, 28 marcadas `[//]`, maior cadeia de 14 elos, como o resumo declara.
- Nenhuma dependência aponta para identificador inexistente.
- Nenhuma dependência aponta para a frente, e portanto não há ciclo.
- Nenhuma dupla de ações `[//]` partilha arquivo alvo; os seis passos sobre `discovery-state.ts` e os pares sobre `types.ts`, `coletar-fases.js`, `proposta.js` e os dois scripts de manutenção estão em sequência.
