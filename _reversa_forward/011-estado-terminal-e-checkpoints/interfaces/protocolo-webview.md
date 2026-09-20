# Interface: canal de mensagens entre a webview e o host

> Identificador: `011-estado-terminal-e-checkpoints`
> Data: `2026-09-20`
> Tipo: arquivo (mensagens `postMessage` tipadas)
> Declarações do contrato: `src/host/protocol.ts` e `src/domain/types.ts`, presas por `tests/host-protocol.spec.ts`

## 1. O que muda

Só a carga da mensagem `setProcess`, e só por acréscimo. Nenhum comando novo, nenhum campo
renomeado, removido ou reordenado.

| Estrutura | Campo novo, ao fim | Opcional |
|-----------|--------------------|----------|
| `SetProcessData` | `discoveryState` | sim |

As formas estão em `data-delta.md`, seção 2. Nenhuma estrutura existente ganha campo: o eixo viaja
inteiro no campo novo, e o tipo herdado `ReversaProcess` continua atravessando o canal sem
transformação, como a documentação de `protocol.ts` já promete.

## 2. Request

Sem mudança. A webview continua pedindo a leitura por `onLoaded` e `reload`. Não há comando novo,
nem argumento novo em comando existente, porque nada do que a feature mostra é acionável: o estado
da extração e o do checkpoint são leitura, e nenhum deles abre arquivo.

## 3. Response

A carga do `setProcess` ganha o campo ao fim:

```
SetProcessData {
  ... os campos atuais, na ordem atual ...
  discoveryState?: DiscoveryState
}
```

`DiscoveryState` traz a situação da extração com o valor bruto ao lado, a lista de checkpoints já
julgados nos três estados, as anomalias próprias do eixo e a identidade das anomalias herdadas que
ele absorveu. O `process.anomalies` continua chegando inteiro, sem desconto: quem desconta é a
composição de exibição, do lado da webview.

## 4. Compatibilidade

Duas direções, e as duas precisam funcionar.

**Host antigo, webview nova.** O campo não vem. A webview trata a ausência como as features 008,
009 e 010 já tratam: o eixo não contribui com nada, a lista de absorvidas sai vazia, a composição
devolve exatamente a soma de hoje, e a seção Descoberta desenha o que desenhava antes, com os dois
estados de checkpoint e sem frase de encerramento. Nenhuma exceção, nenhum aviso.

**Host novo, webview antiga.** O campo é ignorado, porque o protocolo cresce por acréscimo desde a
feature 004. O painel antigo volta a mostrar a anomalia de fase e os checkpoints em andamento, que
é o comportamento anterior, e não um defeito novo.

## 5. Erros

Nenhum caminho de erro novo. A leitura do eixo roda dentro do mesmo `try` de `readWorkspace`, junto
dos outros quatro ramos locais, e uma exceção ali continua virando o estado `error` com a mensagem
nomeada, jamais uma exceção no editor. `state.json` ausente ou ilegível produz o eixo vazio, e a
anomalia correspondente continua sendo a que a herança já registra.

## 6. Idempotência e tempo limite

Sem mudança. A leitura é síncrona, local e sem rede: não há repetição a tornar idempotente, nem
tempo limite a definir. Reler o mesmo workspace duas vezes produz o mesmo eixo, porque o julgamento
é função pura do que a sonda trouxe.

## 7. Verificação

| O que | Onde |
|---|---|
| O campo é opcional e a ausência não quebra a webview | `tests/host-protocol.spec.ts` |
| A composição devolve a soma de hoje quando o eixo não vem | suíte de `anomalies-view` |
| O tipo herdado atravessa sem transformação | conferência de fronteiras em `tests/host-boundaries.spec.ts` |
