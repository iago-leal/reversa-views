# Leitura do processo em /Users/iagoleal/dev/med-reversa, 2026-09-20

Leitura feita chamando `readWorkspace` da construção instalada **0.10.1** (`7f31d99`) sobre o
disco do `med-reversa`, sem escrever nada lá. O projeto é uma extração pura: rodou o `/reversa`
de ponta a ponta, não tem `_reversa_forward/` nem registro de bugs, e declara o Reversa 1.3.3,
a mesma versão que a origem `scrum-harness` trazia quando a herança foi copiada.

Os dois achados abaixo têm a mesma raiz e desfechos opostos: o agente do Reversa grava no
`.reversa/state.json` chaves e valores que o esquema do próprio Reversa não declara, e o leitor
ora os acusa, ora os engole calado. Insumo para a **feature 011**; o achado B pode valer bug à
parte, e a decisão é do usuário.

## O que o disco contém

- `entry`: `installed`. A sonda não recusou nem truncou arquivo algum.
- `.reversa/state.json`: `version 1.3.3`, `phase "concluido"`, `completed` com as cinco fases,
  `pending` vazio, sete checkpoints.
- `_reversa_sdd/`: a extração inteira, com specs por assunto; cenário `legado`, eixo greenfield
  ausente, como esperado.
- Sem `_reversa_forward/` e sem `_reversa_bugs/`: histórico e registro saem vazios, corretamente.

## O que o painel mostra, e por que engana

### A. A fase terminal vira anomalia

A leitura devolve **uma** anomalia:

```
.reversa/state.json · fase-desconhecida · "concluido"
```

`derivePhases` compara `phase` com `PHASES`, as cinco fases da extração
(`heranca/reversa-domain/src/state.ts:130`). O valor `concluido` cai fora, e vira anomalia.

O efeito visível para por aí: as cinco fases saem todas `done`, porque quem as decide é o
`completed`. Nada se perde, mas o painel acusa como estranho o estado mais normal que um
projeto de extração pode ter, que é o de extração terminada.

O `state-schema.md` do Reversa declara cinco fases válidas e `null` para "não iniciado". Não há
valor para "terminado", e foi o agente que inventou `concluido` ao fechar o fluxo. O painel,
portanto, não erra: ele flagra um nome que o esquema não define. O que falta é distinguir o
nome inventado por engano do estado terminal que o fluxo produz sempre.

### B. Sete checkpoints concluídos aparecem como em andamento, e em silêncio

`readCheckpoints` deriva `inProgress` de uma chave só, `completed_at`
(`heranca/reversa-domain/src/state.ts:162`), e `checkpointMark` escreve "em andamento" quando
ela falta (`webview/domain/labels.ts:128`). O `med-reversa` não gravou essa chave em nenhum dos
sete checkpoints:

| Checkpoint | Instante | Conclusão declarada | Saídas |
|---|---|---|---|
| `plano_aprovado` | `at` | não declara | — |
| `scout` | `at` | `status: concluido` | `outputs` |
| `archaeologist` | `at` | `status: concluido` | `outputs` |
| `detective` | `at` | `status: concluido` | `outputs` |
| `architect` | `at` | `status: concluido` | `outputs` |
| `writer` | `at` | `status: concluido` | `arquivos_canonicos` |
| `reviewer` | `at` | `status: concluido` | `artefatos` |

Sete de sete trazem `at`, seis de sete trazem `status: "concluido"`, e **nenhum** traz
`completed_at`. O painel desenha os sete como "em andamento", num projeto cuja extração acabou
há oito dias. De `files` acontece o mesmo: nenhum checkpoint a usa, e o nome da saída muda de
agente para agente, entre `outputs`, `arquivos_canonicos` e `artefatos`.

Tudo isso vai para `extra`, que o leitor preserva. A informação está lá; o julgamento é que não
a consulta.

O que separa B de A é o silêncio. O RF-07 manda registrar toda degradação, e aqui não há
anomalia alguma: o painel afirma um estado falso com a mesma confiança com que afirmaria o
verdadeiro. É o padrão dos bugs nº 11 e `BUG-20260914-5UH7`, o da leitura que perde conteúdo e
não avisa.

## O precedente do afla

Em 14/09 o mesmo código apareceu dez vezes no `afla`, com `reconciliacao`, `reconhecimento-c2`,
`revisao-c2` e `concluido-c2`, e está em `relato-20260914-1140.md`, sob "Problema 3, que não é
bug". Ali ficou decidido que o comportamento atual é o especificado, pelo EC-02 de
`leitura-do-processo.md` e pelo critério de aceite do RF-07, e que a mudança entraria como
feature forward nova. Este é o segundo projeto independente a produzir o caso, agora com o
Reversa 1.3.3, e não mais com o 1.2.58.

Vale o registro de que o `afla` também guarda `cycle` e `cycle_2` no `state.json`, que são o
ponto de partida para o painel reconhecer ciclos de extração.

## O que a feature precisa decidir

1. **Estado terminal.** `concluido` passa a ser reconhecido como fim da extração, com desenho
   próprio, ou continua anomalia? Se for reconhecido, o vocabulário aceita só esse nome, ou
   também os de ciclo do `afla`?
2. **Conclusão do checkpoint.** O `status: "concluido"` com `at` conta como conclusão, ou a
   ausência de `completed_at` passa a gerar anomalia em vez de "em andamento" calado? As duas
   coisas não se excluem.
3. **Saídas do checkpoint.** `outputs`, `arquivos_canonicos` e `artefatos` entram como fonte de
   arquivos, ou ficam onde estão, em `extra`? O nome varia por agente, e adivinhar tem limite.
4. **Onde a mudança mora.** A regra dos dois achados está no módulo herdado do `scrum-harness`,
   e mexer lá cria adaptação nova, com a dívida de reaplicá-la a cada ressincronização, como
   custaram os bugs nº 8 e nº 9. O `heranca.origens.yml` desta máquina ainda aponta o clone da
   origem para `/workspaces/iagoleal/dev/scrum-harness`, que não existe aqui. Reclassificar na
   camada local, antes da tela, evita a adaptação; decidir na origem resolve para quem mais a
   herda.
5. **Spec.** Reconhecer o estado terminal contraria o EC-02 como ele está escrito, e por isso a
   feature pede adendo. O achado B, ao contrário, é cobrado pelo RF-07 que já vige.

## Como reproduzir

```bash
node -e "
const { readWorkspace } = require('/Users/iagoleal/dev/reversa-views/out/host/reading.js')
const r = readWorkspace('/Users/iagoleal/dev/med-reversa', { log: { write: () => {} } })
console.log(JSON.stringify(r.process.anomalies, null, 1))
console.log(JSON.stringify(r.process.discovery.checkpoints.map(c => [c.agent, c.completedAt, c.inProgress])))
"
```
