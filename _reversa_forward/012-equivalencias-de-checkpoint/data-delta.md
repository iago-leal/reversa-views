# Delta de dados: equivalências de checkpoint

> Identificador: `012-equivalencias-de-checkpoint`
> Data: `2026-09-20`
> Roadmap: `_reversa_forward/012-equivalencias-de-checkpoint/roadmap.md`

Nada aqui é persistido pela extensão. Ela continua sem escrever em disco, e o único arquivo que
nasce no repositório é o módulo do mapa, escrito pelo promotor por ato humano. O que segue é o
delta sobre as formas em memória que a feature 011 declarou em `src/domain/types.ts`, mais as duas
formas novas e os dois formatos de arquivo que as ferramentas de manutenção produzem e consomem.

## 1. Formas alteradas

### 1.1 `CheckpointSituation`: de três valores para quatro

| Valor | Estado na 011 | Estado na 012 | Origem da decisão |
|---|---|---|---|
| `concluido` | `completed_at` presente | `completed_at` presente **ou** par aprovado com leitura `concluido` | esquema, depois mapa |
| `em-andamento` | `modules_pending` não vazio | `modules_pending` não vazio **ou** par aprovado com leitura `em-andamento` | esquema, depois mapa |
| `conclusao-nao-declarada` | todo o resto | o resto que o mapa não reconhece | ausência de ambos |
| `falhou` | não existia | par aprovado com leitura `falhou` | apenas mapa |

O valor `falhou` **nunca** nasce do esquema. Não há campo canônico que declare fracasso, e inventar
um seria o painel afirmar o que nenhuma documentação sustenta. Ele existe porque um par aprovado
pode dizê-lo, e só por isso.

### 1.2 `CheckpointState`: a procedência passa a viajar junto

```
 export interface CheckpointState {
   agent: string
   situacao: CheckpointSituation
   instante: string | null
   camposComLista: string[]
+  /** O par que sustentou a situação, quando ela não veio do esquema; nulo quando veio. */
+  reconhecidoPor: { campo: string; valor: string } | null
 }
```

Três invariantes que a implementação precisa manter, e que a suíte deve fixar:

1. `reconhecidoPor` é nulo sempre que a situação veio de `completed_at` ou de `modules_pending`. A
   procedência é a marca do que **não** foi provado pelo esquema.
2. `instante` permanece nulo quando a situação veio do mapa, qualquer que seja o campo de data ao
   lado. É a RN-06, e é o ponto onde a tentação de afrouxar é maior: `at` está bem ali, com um
   instante válido dentro, e ele não declara fim de trabalho.
3. `situacao` igual a `conclusao-nao-declarada` implica `reconhecidoPor` nulo. Reconhecer e não
   declarar são mutuamente exclusivos por construção.

### 1.3 `DiscoveryStateAxis`: a lista das entradas que não são agentes

```
 export interface DiscoveryStateAxis {
   extracao: ExtractionState
   checkpoints: CheckpointState[]
   anomalias: DiscoveryStateAnomaly[]
   absorvidas: AbsorbedAnomaly[]
+  /** Entradas do mapa de checkpoints aprovadas como registro que não nomeia agente. */
+  registrosNaoAgentes: NonAgentEntry[]
 }
```

Uma entrada aprovada como não-agente **sai** de `checkpoints` e entra aqui. Não aparece nas duas
listas, e é isso que cumpre o RF-17: sair da contagem é sair da lista, não ganhar uma marca que todo
consumidor precisaria lembrar de filtrar.

`EMPTY_DISCOVERY_STATE` ganha `registrosNaoAgentes: []`, e continua sendo copiado, nunca
compartilhado, pelo precedente de `EMPTY_GREENFIELD`.

### 1.4 `DiscoveryStateInput`: o mapa entra por parâmetro

```
 export interface DiscoveryStateInput {
   stateJson: string | null
   anomalias: readonly { file: string; code: string; detail?: string }[]
+  /** O mapa aprovado; ausente ou vazio deixa a leitura idêntica à da feature 011. */
+  equivalencias?: MapaDeEquivalencias
 }
```

Opcional de propósito: omitir o campo é o caminho pelo qual a suíte da 011 continua passando sem
uma linha reescrita, e é também o comportamento correto para qualquer chamador que ainda não conheça
o mapa.

## 2. Formas novas

### 2.1 `EquivalenciaDeCampo`, a unidade que traduz um par

| Campo | Tipo | Significado |
|---|---|---|
| `campo` | `string` | O nome do campo, exatamente como o `state.json` o escreve |
| `valor` | `string` | O valor, normalizado apenas em caixa e espaços das bordas, nunca em acentuação |
| `leitura` | `'concluido' \| 'falhou' \| 'em-andamento'` | A situação que o par declara. `nao-e-sinal` **não** aparece aqui: o que não é sinal não vira registro, apenas deixa de ser reperguntado |
| `aprovadoEm` | `string` | A data da aprovação, em `YYYY-MM-DD` |
| `evidencia` | `string[]` | Os projetos onde o par foi visto quando a proposta nasceu, para leitura humana |

A chave é o par `campo` mais `valor`, e ela é única no mapa. O valor `true` booleano chega aqui como
a cadeia `"true"`, porque `done: true` e `done: "true"` declaram a mesma coisa e distingui-los
multiplicaria registros sem multiplicar significado.

### 2.2 `RegistroNaoAgente`, a unidade que classifica uma chave

| Campo | Tipo | Significado |
|---|---|---|
| `chave` | `string` | O nome da entrada no mapa de checkpoints, como `plano_aprovado` |
| `aprovadoEm` | `string` | A data da aprovação |
| `evidencia` | `string[]` | Os projetos onde a chave foi vista |

Duas variantes e não uma, pela RN-10: uma entrada sem campo de estado não tem par a traduzir, e
forçá-la ao formato do par exigiria inventar um valor.

### 2.3 `NonAgentEntry`, o que a leitura devolve

| Campo | Tipo | Significado |
|---|---|---|
| `chave` | `string` | A entrada encontrada no `state.json` |
| `camposComLista` | `string[]` | Os mesmos campos preservados que um checkpoint traria, pela regra da 011 |

Ela não tem situação, e é esse o ponto: não se cobra conclusão de quem não é agente.

## 3. Formato da proposta

Markdown legível com um bloco de dados por item. A caixa nasce **desmarcada**, e marcar é aprovar.

````markdown
## Pares novos

- [ ] `status: "concluido"` → **concluído**
      _o motor disse:_ campo de status com valor concluído
      _visto em:_ med-reversa, afla
      ```equivalencia
      {"campo":"status","valor":"concluido","leitura":"concluido"}
      ```

## Entradas que não parecem agentes

- [ ] `plano_aprovado` → **não é agente**
      _o motor disse:_ registro de decisão, sem campo de estado
      _visto em:_ med-reversa
      ```nao-agente
      {"chave":"plano_aprovado"}
      ```

## Não classificados nesta rodada

- `status: "success"` — o motor não respondeu dentro de 60 s
````

A promoção lê apenas os blocos cercados cujos itens estão marcados, e ignora todo o resto do
arquivo, inclusive a prosa. Isso deixa você livre para anotar ao lado do item sem quebrar o
processamento.

## 4. Formato do mapa

Módulo TypeScript gerado, no molde de `src/heranca/revisao.ts` produzido por
`gerar-revisao-heranca.js`: cabeçalho que diz quem o escreveu e que não se edita à mão, duas
constantes tipadas e nada mais. Versionado, porque a sua história em git **é** a trilha de auditoria
das aprovações.

Os valores entram escapados, jamais interpolados. A lição está registrada no gerador do carimbo,
onde um caminho com aspas produziria módulo que não compila, e aqui o risco é maior: os valores vêm
de arquivos de terceiros.

## 5. Migração

Não há migração de dados a fazer. O mapa nasce vazio, e mapa vazio é leitura idêntica à da 011. O
crescimento é por acréscimo e por ato humano, registro antigo não é reescrito por rodada nova, e a
promoção recusa par divergente em vez de sobrescrever.

Nenhum `state.json` de projeto algum é lido para escrita, nesta feature ou em qualquer momento
posterior a ela.
