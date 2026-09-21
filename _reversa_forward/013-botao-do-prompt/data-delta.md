# Delta de dados: botão do prompt de correção na fonte

> Identificador: `013-botao-do-prompt`
> Data: `2026-09-20`
> Roadmap: `_reversa_forward/013-botao-do-prompt/roadmap.md`

Nada é escrito em disco pela extensão, e por isso este documento não descreve migração de dado
persistido: ele descreve o que cresce nas estruturas em memória e no canal, e as invariantes que a
suíte precisa prender. O único arquivo novo em disco é o texto que o comando de manutenção escreve,
tratado na seção 4.

## 1. O campo novo de `CheckpointState`

`src/domain/types.ts`, ao fim da estrutura, opcional, pelo mesmo acréscimo que a 012 fez com
`reconhecidoPor` e a 011 com a estrutura inteira.

| Campo | Tipo | Quando é preenchido | Origem |
|-------|------|---------------------|--------|
| `formaElidida` | `Record<string, string \| number \| boolean \| null> \| null` | **Apenas** quando `situacao` é `conclusao-nao-declarada` | O objeto do checkpoint como o `state.json` o traz, passado pela elisão |

O tipo do valor merece nota, porque é o que a elisão devolve e não uma escolha livre: texto curto sai
como texto, número e booleano saem inteiros, `null` atravessa como `null`, e lista, objeto, texto
longo e caminho de sistema saem como texto de marcador. Não há aninhamento, e essa ausência é o ponto:
um objeto dentro do checkpoint vira a palavra `<objeto>`, de modo que a estrutura que viaja é sempre
rasa e sempre legível numa linha.

### As formas medidas em 2026-09-20

São os três casos que restaram depois da primeira promoção, e são o que a fixtura de D-11 deve conter.
Valem como teste de mesa do formato antes de escrever uma linha.

| Projeto e agente | `formaElidida` |
|---|---|
| `TECH+` / `redator_progress` | `{"items_total":6,"items_done":3,"items_pending":"<lista de 3>","items_completed":"<lista de 16>","last_completed_at":"2026-04-28T20:10:00Z"}` |
| `ps-iagerasmlk` / `scout` | `{"timestamp":"2026-05-03T12:10:19Z","files":"<lista de 3>"}` |
| `transc_audio_mlx` / `archaeologist` | `{"modules_analyzed":"<lista de 1>","modules_pending":"<lista de 0>"}` |

Duas coisas se leem nessa tabela, e as duas justificam o campo. A primeira é que o único dado que
resolve o caso do `scout` é o `timestamp`, e ele não chega ao painel hoje por nenhuma outra via,
porque `camposComLista` se cala quando `files` está presente. A segunda é que o argumento do
`redator_progress`, que é o trabalho não ter terminado, mora em `items_done` e `items_total`, dois
escalares que nenhum campo atual transporta.

### Invariantes a prender em suíte

1. `formaElidida` não nula implica `situacao === 'conclusao-nao-declarada'`.
2. `situacao !== 'conclusao-nao-declarada'` implica `formaElidida` nula, para as três outras situações,
   uma a uma.
3. `formaElidida` não nula implica `reconhecidoPor` nula, que é consequência da primeira invariante e
   da terceira invariante já vigente de `reconhecidoPor`, e vale prender em separado porque é a
   afirmação que um leitor procura.
4. Nenhum valor de `formaElidida` é objeto ou lista: a estrutura é rasa por construção da elisão.
5. Nenhum valor de texto excede quarenta caracteres, salvo os marcadores de forma, cujo tamanho é
   função do que substituíram.
6. As chaves de `formaElidida` são exatamente as chaves do checkpoint em disco, sem acréscimo e sem
   supressão, inclusive as canônicas: a elisão preserva chave e elide valor.

## 2. O canal, e o que não muda nele

| O que | Antes | Depois |
|---|---|---|
| Campos do topo de `SetProcessData` | quinze, com `discoveryState` por último | idênticos, e `tests/host-protocol.spec.ts` continua provando que a lista e a ordem não mudaram |
| Comandos da webview | sete, com `dispatch` reservado sem tratador | idênticos |
| Comandos do host | quatro | idênticos |
| `DiscoveryStateAxis` | cinco campos | idênticos: o crescimento é por dentro de `CheckpointState` |
| `CheckpointState` | cinco campos | seis, o sexto opcional e último |

O caso de compatibilidade é um só e já tem forma conhecida: host anterior ao campo não o envia, a tela
lê a ausência como forma não lida e compõe o bloco sem ela. A distinção entre ausente e vazio, que
toda feature desde a 008 mantém, aqui se lê assim: `undefined` é forma não lida, `null` é situação que
não pede forma, e objeto é forma lida. São três estados e não dois, e a suíte deve tratá-los como
três.

## 3. O que **não** entra no eixo

Registro digno de nota, porque a tentação é simétrica e estaria errada. `NonAgentEntry` **não** ganha
a forma elidida: a chave aprovada como registro que não é agente saiu da cobrança de conclusão por
decisão de gente, e carregar a sua forma seria preparar um prompt que RN-16 do requirements proíbe
compor. O mesmo vale para o checkpoint reconhecido por par aprovado, que é o caso mais delicado:
carregar a forma dele permitiria, amanhã, um prompt que questiona a aprovação, e a decisão registrada
não se revisita por acidente de payload.

## 4. O arquivo que o comando de manutenção escreve

Fora da extensão, e por isso fora do canal.

| Caminho | Quem escreve | Formato | Regime |
|---|---|---|---|
| `propostas/prompt-harness.md` | `scripts/prompt-harness.js` | O texto do prompt, com um bloco por caso encontrado na varredura, cada um nomeando projeto e agente | Reescrito a cada execução, no mesmo regime de `propostas/equivalencias.md` da 012 |

Ele não é lido por ninguém em tempo de execução: existe para ser aberto, lido e copiado por uma
pessoa. Nenhum `state.json` é tocado pelo comando, e essa é a conferência que o `onboarding.md` manda
fazer com `git status` logo depois de rodá-lo, exatamente como a 012 fez com o seu aprendizado.

## 5. Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-09-20 | Versão inicial gerada por `/reversa-plan` | reversa |
