# Delta de dados: estado terminal da extração e conclusão dos checkpoints

> Identificador: `011-estado-terminal-e-checkpoints`
> Data: `2026-09-20`
> Roadmap: `_reversa_forward/011-estado-terminal-e-checkpoints/roadmap.md`

## 1. O que não muda

Nada é persistido, aqui como no resto da extensão. Não há banco, arquivo de saída, cache nem
migração: o delta abaixo descreve formas em memória e o campo que viaja na carga do `setProcess`.
Nenhum campo existente muda de nome, de tipo ou de posição, e nenhum é removido. A união fechada
`AnomalyCode` do pacote vendorizado fica intacta, pelo precedente das features 008 e 009.

O tipo herdado `Checkpoint`, de `src/heranca/reversa-domain/src/state.ts`, continua exatamente como
está, com `completedAt`, `inProgress`, `files`, `modulesAnalyzed`, `modulesPending` e `extra`. O
eixo novo não o substitui: julga ao lado, e o `extra` que a herança já preserva é a matéria-prima
do julgamento.

## 2. Formas novas, em `src/domain/types.ts`

### 2.1 A situação da extração

```
ExtractionSituation = 'nao-iniciada' | 'em-curso' | 'encerrada'

ExtractionState {
  situacao: ExtractionSituation
  bruto: texto ou vazio        // o `phase` como o disco o traz, sem normalizar
}
```

A derivação, em precedência: `phase` ausente e nenhuma fase concluída dá `nao-iniciada`; `phase`
reconhecido como encerramento dá `encerrada`; qualquer outra coisa dá `em-curso`. O `bruto` viaja
sempre, inclusive quando a situação é reconhecida, porque valor reconhecido ao lado do valor bruto
é a regra da casa desde a feature 008.

### 2.2 O estado do checkpoint

```
CheckpointSituation = 'concluido' | 'em-andamento' | 'conclusao-nao-declarada'

CheckpointState {
  agent: texto
  situacao: CheckpointSituation
  instante: texto ou vazio     // só quando vem de `completed_at`
  camposComLista: lista de nomes   // vazia na maioria dos casos
}
```

A precedência é a do `checkpoint-guide.md` do Reversa: `completed_at` presente dá `concluido`;
ausente com `modules_pending` não vazio dá `em-andamento`; o resto dá `conclusao-nao-declarada`.

O `instante` é deliberadamente estreito: só existe quando veio do campo canônico. Um instante
tirado de `at`, `data` ou `timestamp` seria o painel afirmando conclusão pelo campo que não a
declara, e a feature inteira existe para não fazer isso.

`camposComLista` nomeia os campos preservados em `extra` cujo valor é lista de textos, e só quando
`files` está ausente. Não são chamados de saídas em lugar nenhum, porque `achados`, `lacunas` e
`adrs` têm a mesma forma e não são arquivos. Com `files` presente, a lista sai vazia: a lista
canônica está lá e não há o que sinalizar.

### 2.3 A anomalia própria do eixo

```
DiscoveryStateAnomalyCode = 'checkpoint-sem-conclusao-declarada'

DiscoveryStateAnomaly {
  file: texto      // sempre `.reversa/state.json`
  code: DiscoveryStateAnomalyCode
  detail: texto    // o agente, e o campo que falta
}
```

União local, pelo precedente de `BugAnomalyCode` e `GreenfieldAnomalyCode`, com a mesma forma
estrutural de `DisplayAnomaly`, de modo que a seção de anomalias desenhe o código sem conhecê-lo.

### 2.4 O eixo

```
DiscoveryState {
  extracao: ExtractionState
  checkpoints: lista de CheckpointState
  anomalias: lista de DiscoveryStateAnomaly
  absorvidas: lista de AbsorbedAnomaly
}

AbsorbedAnomaly {
  file: texto
  code: texto
  detail: texto ou vazio
}
```

`EMPTY_DISCOVERY_STATE` acompanha, no molde de `EMPTY_GREENFIELD`, para o caso de o `state.json`
não existir ou não ser legível.

## 3. A absorção, que é o campo de maior consequência

`absorvidas` carrega a identidade das anomalias **herdadas** que este eixo reconheceu e que o painel
não deve desenhar. A identidade é a tripla inteira, `file`, `code` e `detail`, e não só o código:
absorver por código apagaria toda `fase-desconhecida`, inclusive a do erro de digitação que o EC-02
existe para pegar.

Na prática, o eixo só absorve a anomalia cujo `code` é `fase-desconhecida` e cujo `detail` é
exatamente o valor que ele reconheceu como encerramento. Um `state.json` com fase terminal e, ao
mesmo tempo, um nome estranho em `completed` produz duas anomalias: uma é absorvida, a outra
continua na tela.

Nada é removido da lista herdada. `process.anomalies` chega ao painel como sempre chegou; quem
desconta é a composição de exibição, descrita na seção 4.

## 4. A composição da lista exibida

Forma nova em `src/webview/domain/anomalies-view.ts`, sem campo persistido:

```
composeAnomalies(payload) -> lista de DisplayAnomaly
```

Ela faz o que `App.tsx` faz hoje em linha, na mesma ordem, com um desconto a mais: as anomalias do
processo menos as absorvidas, depois as do registro de bugs, as do eixo greenfield, as do eixo de
entrega e, por fim, as deste eixo. `readingIntegrity` passa a contar sobre o resultado dela, em vez
de somar as quatro listas por conta própria, para que o cabeçalho e a seção nunca discordem.

Um host anterior a esta feature não envia o eixo, a lista de absorvidas sai vazia, e a composição
devolve exatamente a soma de hoje.

## 5. O campo na carga do `setProcess`

| Estrutura | Campo novo, ao fim | Opcional |
|-----------|--------------------|----------|
| `SetProcessData` | `discoveryState` | sim |

Detalhe do contrato em `interfaces/protocolo-webview.md`.

## 6. Migrações necessárias

Não. Nenhum dado persistido, nenhuma leitura de versão anterior a converter. A compatibilidade que
importa é a do protocolo, e ela é resolvida pelo campo opcional e pela queda para o desenho
anterior, como nas features 004, 006, 008, 009 e 010.
