# Delta de dados: fases fora do cânone, ciclo e encerramento não declarado

> Feature: `015-fases-fora-do-canone`
> Data: `2026-09-21`
> Base: `_reversa_sdd/sdd/leitura-do-processo.md#9-modelo-de-dados`, com os adendos 011 e 012

Nada aqui é persistido pela extensão. As formas vivem em memória entre a leitura e o desenho; o
único dado escrito em disco é o módulo do mapa, e quem o escreve é a promoção.

## 1. O julgamento de um nome (novo, `src/domain/fases.ts`)

```diff
+ export type NomeDeFase =
+   | { tipo: 'canonica'; bruto: string; canonica: FaseCanonica }
+   | { tipo: 'encerramento'; bruto: string }
+   | { tipo: 'ciclo'; bruto: string; canonica: FaseCanonica; ciclo: number }
+   | { tipo: 'etapa'; bruto: string; base: string; sufixo: number | null }
+   | { tipo: 'desconhecida'; bruto: string }
+
+ export function classificarNome(bruto: string, mapa: MapaDeEquivalencias): NomeDeFase
```

| Degrau | Regra | Exemplos que casam | Exemplos que não casam |
|---|---|---|---|
| 1. canônica | igualdade exata com uma das cinco | `escavacao` | `Escavacao`, `escavacão` |
| 2. encerramento | como na 011: um segmento começa por `conclu` | `concluido-c3`, `revisao_concluida` | |
| 3. ciclo | começa por fase canônica, e o resto casa `^[-_]\S*?(\d+)$` | `geracao-c2`, `geracao-2`, `geracao-ciclo-2`, `escavacao_c2` | `geracao-c`, `geracao-2a`, `geracao2` |
| 4. etapa | igual a uma etapa aprovada, sem distinção de caixa e de espaços nas bordas; ou começa por ela, com o mesmo resto do degrau 3 | `verificacao-regressao`, `verificacao-regressao-c3`, `re-extracao-005` | qualquer um deles sem a base aprovada |
| 5. desconhecida | o que sobra | `reconciliacao` sem aprovação, `escavacão`, a prosa do `DelphiSga` | |

`base` é o nome como o mapa o guarda; `bruto` é o do disco, e é o que a tela mostra. O `sufixo` da
etapa nunca entra na conta do ciclo (RN-03).

Havendo duas etapas aprovadas em que uma é prefixo da outra (`verificacao` e
`verificacao-regressao`), vence a mais longa. A igualdade inteira é testada antes do prefixo.

## 2. A situação da extração

```diff
  export type ExtractionSituation =
    | 'nao-iniciada'
    | 'em-curso'
    | 'encerrada'
+   /** `phase` reconhecido e já concluído, `pending` vazio e as cinco fases do ciclo corrente concluídas. */
+   | 'encerrada-sem-declaracao'
```

`ExtractionState.bruto` continua sendo o `phase` do disco. As condições, todas necessárias:

1. `pending` vazio;
2. `phase` presente, de tipo `canonica`, `ciclo` ou `etapa`, e presente em `completed`;
3. as cinco fases do ciclo corrente em `completed`: as canônicas quando não há ciclo, e as cinco com
   o sufixo do ciclo corrente quando há.

`encerrada` tem precedência: `phase` de tipo `encerramento` nunca chega a este teste.

## 3. As anomalias do eixo

```diff
  export type DiscoveryStateAnomalyCode =
    | 'checkpoint-sem-conclusao-declarada'
+   /** Encerramento declarado com nome reconhecido ainda em `pending`; detalhe: o `phase` e os nomes pendentes. */
+   | 'encerramento-com-pendencia'
```

Uma por projeto. Detalhe no formato `concluido-c3: pending ainda lista escavacao-c3, interpretacao-c3, geracao-c3, revisao-c3`.
Só quando `situacao === 'encerrada'` e `pending` contém ao menos um nome de tipo `canonica`, `ciclo`
ou `etapa`. Nome `desconhecida` em `pending` não entra no detalhe.

## 4. O desconto

`AbsorbedAnomaly` não muda de forma. O conjunto cresce:

| Tripla descontada | Condição | Desde |
|---|---|---|
| `fase-desconhecida`, detalhe igual ao `phase` | extração `encerrada` | 011, sem alteração |
| `fase-desconhecida`, detalhe de tipo `ciclo` ou `etapa` | sempre, venha de `phase`, `completed` ou `pending` | 015 |
| `fase-atual-ja-concluida`, detalhe igual ao `phase` | extração `encerrada-sem-declaracao` | 015 |

A identidade continua sendo arquivo, código e detalhe ao mesmo tempo. O mesmo nome em duas listas
produz duas anomalias herdadas com a mesma tripla, e a composição já desconta as duas.

## 5. O eixo

```diff
  export interface DiscoveryStateAxis {
    extracao: ExtractionState
    checkpoints: CheckpointState[]
    anomalias: DiscoveryStateAnomaly[]
    absorvidas: AbsorbedAnomaly[]
    registrosNaoAgentes: NonAgentEntry[]
+   /** Ausente quando nenhuma fase de ciclo foi reconhecida. */
+   ciclo?: CicloCorrente
+   /** Ausente quando nenhuma etapa aprovada está presente no arquivo. */
+   etapas?: EtapaReconhecida[]
  }

+ export interface CicloCorrente {
+   /** O maior inteiro entre as fases de ciclo de `phase`, `completed` e `pending`. */
+   numero: number
+   /** Sempre cinco, na ordem canônica. */
+   fases: FaseDoCiclo[]
+ }
+
+ export interface FaseDoCiclo {
+   canonica: FaseCanonica
+   /** Os mesmos três valores da camada herdada. */
+   status: 'done' | 'current' | 'pending'
+   /** O nome do disco que sustenta a situação; nulo quando a fase não aparece com o sufixo do ciclo. */
+   bruto: string | null
+ }
+
+ export interface EtapaReconhecida {
+   bruto: string
+   base: string
+   sufixo: number | null
+   situacao: 'concluida' | 'em-curso' | 'pendente'
+ }
```

Regras de derivação:

- `status` da fase do ciclo: `done` se o nome com o sufixo do ciclo corrente está em `completed`;
  senão `current` se é o `phase`; senão `pending`, inclusive quando o nome não aparece em lista
  alguma (D-11). A precedência é a de `derivePhases`.
- Havendo duas grafias do mesmo ciclo para a mesma fase (`geracao-c2` e `geracao-2`), vale a
  primeira em `completed`, depois o `phase`, depois a primeira em `pending`.
- `situacao` da etapa: `concluida` se está em `completed`; senão `em-curso` se é o `phase`; senão
  `pendente`. Uma etapa que é o `phase` e também está em `completed` lê como `concluida`, e é esse
  o caso que a condição 2 do encerramento sem declaração procura.
- `etapas` segue a ordem do arquivo: `completed`, depois `phase` se ainda não listado, depois
  `pending`. Sem duplicata por nome bruto.
- Os campos são **opcionais**, e não listas vazias, para que as suítes que montam o eixo à mão
  continuem compilando.

## 6. O mapa

```diff
  export interface MapaDeEquivalencias {
    pares: readonly EquivalenciaDeCampo[]
    naoAgentes: readonly RegistroNaoAgente[]
+   /** Ausente ou vazio: nenhuma etapa aprovada, e a leitura das fases é a da forma. */
+   etapas?: readonly EtapaAprovada[]
  }

+ export interface EtapaAprovada {
+   /** Aparado e em minúsculas; diacríticos preservados. */
+   nome: string
+   aprovadoEm: string
+   /** Projetos em que o nome, ou uma variante com sufixo, foi visto. */
+   evidencia: string[]
+ }
```

Cada nome é registro independente (RN-02): não há campo de sinônimo nem de grupo. No módulo gerado,
`etapas` é escrito sempre, depois de `naoAgentes`, ordenado por nome.

A fusão na promoção: etapa já presente não é duplicada, e a evidência é unida. Não há conflito
possível entre etapas, porque o registro não carrega leitura; a recusa por conflito da 012 continua
valendo só para os pares.

## 7. O que não muda

- `process.discovery.phases`, herdado, continua cruzando o canal como sempre. O cartão o usa quando
  `ciclo` está ausente.
- `process.anomalies` continua inteiro, com toda `fase-desconhecida` que a camada herdada registrou.
- Nenhuma chave de topo do `state.json` além de `phase`, `completed`, `pending` e `checkpoints` é
  lida. `cycle`, `cycle_N` e as nove grafias de re-extração ficam fora.

## 8. Migração

Não há dado a migrar. O módulo do mapa vigente não tem `etapas`, e o tipo o aceita assim; a primeira
promoção depois da feature o reescreve com o campo, vazio ou não.
