# Interface: canal do host para a tela

> Identificador: `015-fases-fora-do-canone`
> Data: `2026-09-21`
> Tipo: mensagem interna, `SetProcessData`
> Base: `src/host/protocol.ts`, com o que as features 011 e 012 acrescentaram a `discoveryState`

## 1. O que muda

Nenhum campo novo em `SetProcessData`. O que cresce é o interior de `discoveryState`, que já é
opcional e já está ao fim:

| Campo | Mudança | Ausência significa |
|---|---|---|
| `discoveryState.extracao.situacao` | ganha o valor `encerrada-sem-declaracao` | n/a |
| `discoveryState.anomalias[].code` | ganha o valor `encerramento-com-pendencia` | n/a |
| `discoveryState.absorvidas` | passa a trazer triplas de `fase-desconhecida` sobre fase de ciclo e etapa aprovada, e de `fase-atual-ja-concluida` | n/a |
| `discoveryState.ciclo` | novo, opcional | projeto sem fase de ciclo, ou host anterior |
| `discoveryState.etapas` | novo, opcional | nenhuma etapa aprovada presente, ou host anterior |

As formas estão em `data-delta.md`, seção 5.

## 2. Request

Não há. O canal é de mão única para este dado, como sempre foi.

## 3. Response: o que a tela faz com cada campo

- **`ciclo` presente:** uma frase em texto nomeia o ciclo ("Terceiro ciclo de extração" ou
  "Ciclo 3 de extração"; a redação é de `labels.ts`), e as cinco fases são desenhadas com o `status`
  de `ciclo.fases`, no lugar do de `process.discovery.phases`. O nome bruto acompanha cada fase que
  o tenha. Os ciclos anteriores não aparecem.
- **`ciclo` ausente:** o cartão desenha `process.discovery.phases`, exatamente como antes.
- **`etapas` presente:** uma linha de texto sob as cinco fases lista cada etapa, com o nome bruto,
  a situação e a menção ao mapa como origem do reconhecimento. Se alguma tem situação `em-curso`,
  uma frase a nomeia como etapa em curso. Nesse caso nenhuma das cinco fases está `current`, e isso
  já vem assim da leitura: a tela não apaga marca alguma.
- **`situacao === 'encerrada-sem-declaracao'`:** frase própria, em texto, distinta da do
  encerramento declarado, nomeando o `phase` em que o arquivo parou.
- **`encerramento-com-pendencia`:** entra na lista de anomalias pela composição existente, sem
  tratamento especial.

Tudo é texto. Cor pode acompanhar, nunca substituir.

O terminal desenha o mesmo, com as mesmas frases, e a suíte de paridade cobre os casos novos.

## 4. Erros

Nenhum novo. Campo com forma inesperada é tratado como ausente, pela regra do canal.

## 5. Compatibilidade

| Host | Tela | O que se vê |
|---|---|---|
| anterior | nova | Sem ciclo, sem etapas, e as `fase-desconhecida` de fase de ciclo de volta à tela, porque `absorvidas` não as traz. É o RF-11, e é o comportamento da 014 |
| novo | nova | O descrito acima |
| novo | anterior | Não acontece em instalação real: host e tela viajam no mesmo pacote. Fora do escopo: não há caminho suportado que junte os dois |

O ponto que exige atenção é o valor novo de `situacao`. Todo `switch` sobre `ExtractionSituation`
precisa ganhar o ramo, e o compilador os aponta: a união é fechada e os rótulos são exaustivos.

## 6. Tamanho e tempos

`ciclo` tem tamanho fixo, cinco fases. `etapas` cresce com o arquivo; no `afla`, o maior caso
medido, são cinco entradas. `absorvidas` cresce com as fases de ciclo: quinze triplas no `afla`. O
teto de carga do canal não se aproxima.
