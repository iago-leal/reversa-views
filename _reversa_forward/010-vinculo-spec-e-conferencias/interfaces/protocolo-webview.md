# Interface: canal de mensagens entre a webview e o host

> Identificador: `010-vinculo-spec-e-conferencias`
> Data: `2026-09-19`
> Tipo: arquivo (mensagens `postMessage` tipadas)
> Declarações do contrato: `src/host/protocol.ts` e `src/domain/types.ts`, presas por `tests/host-protocol.spec.ts`

## 1. O que muda

Só a carga da mensagem `setProcess`, e só por acréscimo. Nenhum comando novo, nenhum campo
renomeado, removido ou reordenado. O topo de `SetProcessData` continua com dez campos.

| Estrutura | Campo novo, ao fim | Opcional |
|-----------|--------------------|----------|
| `HistoryEntry` | `vinculo` | sim |
| `HistoryEntry` | `conferencias` | sim |
| `ProjectHistory` | `anomalias` | sim |
| `PlannedComponent` | `ligacoes` | sim |
| `ProductPanorama` | `semSpec` | sim |
| `ProductPanorama` | `vinculoParcial` | sim |

As formas estão em `data-delta.md`, seções 3 a 6.

## 2. Request

A webview continua pedindo a leitura por `onLoaded` e `reload`, sem mudança. A abertura dos
arquivos citados usa a mensagem existente `openFile` com o caminho relativo que a carga traz
(`vinculo.arquivo`, `ligacoes[].impacto`, `semSpec[].impactos[]`, `conferencias.arquivo`); a
contenção continua sendo a `resolveInside` herdada.

## 3. Response

`setProcess` com os campos acima preenchidos pelo host desta feature. Um host que leu e não achou
nada envia o campo com o estado nomeado (`ausente`, `sem-registro`, lista vazia), e nunca o omite.

## 4. Compatibilidade

| Tela | Host | Comportamento |
|------|------|---------------|
| nova | novo | desenha origem, bloco "Entregues sem spec" e contagem de conferências |
| nova | anterior à 010 | campos ausentes: o panorama diz "vínculo declarado não lido", o histórico diz "conferências não lidas", nenhum bloco vazio é desenhado |
| anterior à 010 | novo | ignora os campos; o panorama fica como o da 009, com as pastas ligadas por declaração já fora de "Fora do plano" |

A última linha é a única mudança visível para uma tela antiga, e ela é correta: a lista
`foraDoPlano` é calculada pelo host.

## 5. Erros

Nenhum erro novo no canal. Perda de leitura vira anomalia em `history.anomalias`, contada por
`readingIntegrity()`. Exceção na leitura dos arquivos novos acontece dentro do mesmo `try` de
`host/reading.ts` e produz o estado de erro nomeado que já existe.

## 6. Idempotência e tempo

A leitura é pura e sem escrita: repetir `reload` produz a mesma carga sobre o mesmo disco. O teto
de 200 ms da leitura de referência continua valendo com até cem arquivos a mais, medido por
`tests/desempenho-referencia.spec.ts`.
