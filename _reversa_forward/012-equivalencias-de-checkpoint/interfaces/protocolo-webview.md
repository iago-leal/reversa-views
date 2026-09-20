# Interface: canal de mensagens entre a webview e o host

> Identificador: `012-equivalencias-de-checkpoint`
> Data: `2026-09-20`
> Tipo: arquivo (mensagens `postMessage` tipadas)
> Declarações do contrato: `src/host/protocol.ts` e `src/domain/types.ts`, presas por `tests/host-protocol.spec.ts`

## 1. O que muda

Nenhum comando novo e nenhum campo novo em `SetProcessData`. A feature 011 já abriu `discoveryState`
ao fim da carga, e a 012 cresce **dentro** dele. É uma diferença que vale enunciar: até aqui o
protocolo crescia acrescentando eixos; desta vez um eixo existente muda de forma por dentro.

| Estrutura | Mudança | Compatível com host anterior |
|---|---|---|
| `SetProcessData` | nenhuma | — |
| `DiscoveryStateAxis` | ganha `registrosNaoAgentes` ao fim | sim, por ausência tratada como lista vazia |
| `CheckpointState` | ganha `reconhecidoPor` ao fim | sim, por ausência tratada como nulo |
| `CheckpointSituation` | ganha o valor `falhou` | **ver a seção 5** |

As formas completas estão em `data-delta.md`, seções 1 e 2.

## 2. Request

Sem mudança. A webview continua pedindo a leitura por `onLoaded` e `reload`. Nada do que a feature
mostra é acionável: a situação do checkpoint, a procedência do reconhecimento e a lista dos registros
que não são agentes são leitura, e nenhum deles abre arquivo nem dispara comando.

Em particular, e por construção, **não há** comando que peça aprendizado, promoção ou releitura do
mapa. As duas ferramentas vivem fora da extensão, e dar à tela um botão que as chamasse exigiria
capacidade de executar processo, que o RNF-04 proíbe e que a suíte confere por inspeção.

## 3. Response

A carga do `setProcess` continua com os mesmos campos. O que muda viaja dentro de `discoveryState`:

```
discoveryState: {
  extracao: { situacao, bruto },
  checkpoints: [
    {
      agent, situacao, instante, camposComLista,
      reconhecidoPor: { campo, valor } | null      // novo
    }
  ],
  anomalias: [...],
  absorvidas: [...],
  registrosNaoAgentes: [ { chave, camposComLista } ]   // novo
}
```

Três invariantes que o contrato carrega e que `tests/host-protocol.spec.ts` deve prender:

1. `reconhecidoPor` não nulo implica situação vinda do mapa, nunca do esquema.
2. `instante` não nulo implica `reconhecidoPor` nulo: o instante só existe quando veio de
   `completed_at`.
3. Uma chave aparece em `checkpoints` **ou** em `registrosNaoAgentes`, nunca nas duas.

## 4. Erros

Nenhum caminho de erro novo. Mapa ausente, vazio ou com par desconhecido não é falha: é o
comportamento anterior, que continua disponível e continua correto. Exceção em qualquer ramo da
leitura segue virando o estado `error` nomeado, como desde a feature 002.

## 5. Compatibilidade, e o ponto que exige atenção

Os dois campos novos crescem por acréscimo e são seguros: host anterior não os envia, e a tela os lê
como ausentes.

O valor novo de `CheckpointSituation` é de outra natureza, e é o único risco real de
incompatibilidade desta feature. Uma tela antiga diante de um host novo receberia `falhou` num campo
cuja união ela não conhece. No empacotamento real isso não acontece, porque host e tela viajam no
mesmo `.vsix` e são construídos juntos; mas o preview serve a tela construída contra a leitura
corrente, e é lá que a combinação pode existir por engano.

Mitigação: a tela trata situação desconhecida como `conclusao-nao-declarada`, que é o estado mais
conservador dos quatro, em vez de quebrar ou de escolher o mais favorável. A suíte fixa esse
comportamento com um valor inventado, do mesmo modo que as suítes anteriores fixam campo ausente.

## 6. Idempotência e tempos

Idempotência: inalterada. Duas leituras seguidas do mesmo disco, com o mesmo mapa, produzem a mesma
carga byte a byte. É mais verdadeiro nesta feature do que nas anteriores, porque a consulta ao mapa
é busca por chave em estrutura imutável, sem relógio, sem disco e sem ordem de sistema de arquivos.

Tempos: inalterados. O orçamento de 200 ms do RNF-01 continua valendo e não é disputado por esta
feature, que não acrescenta entrada e saída alguma ao caminho da leitura. A referência media 52,9 ms
na entrega da 011, e a medição faz parte do critério de pronto.

Nenhum tempo-limite existe deste lado. O único tempo-limite da feature é o do motor local, que vive
em `interfaces/motor-local.md` e nunca é atravessado pela extensão.
