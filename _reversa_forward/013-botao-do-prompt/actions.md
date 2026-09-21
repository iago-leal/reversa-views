# Actions: botão do prompt de correção na fonte

> Identificador: `013-botao-do-prompt`
> Data: `2026-09-20`
> Roadmap: `_reversa_forward/013-botao-do-prompt/roadmap.md`

## Resumo

| Métrica | Valor |
|---------|-------|
| Total de ações | 32 |
| Paralelizáveis (`[//]`) | 11 |
| Maior cadeia de dependência | 6 |

A cadeia mais longa é `T010 → T021 → T025 → T026 → T027 → T030`, e atravessa a feature de ponta a
ponta: da suíte que decide a disponibilidade até o rastro no canal de saída. Ela é o caminho crítico,
e nenhuma das onze ações paralelas o encurta.

## Fase 1, Preparação

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T001 | Acrescentar `formaElidida` ao fim de `CheckpointState`, opcional, documentando os **três** estados que o campo tem, ausente, nula e preenchida, e as seis invariantes do `data-delta.md` 1 | - | - | `src/domain/types.ts` | 🟢 | `[X]` |
| T002 | Transcrever a elisão para `src/domain/elisao.ts`, com cabeçalho que declara a duplicação, nomeia a origem em `scripts/equivalencias/elidir.js` e explica por que nenhum dos dois pode importar o outro, no molde do cabeçalho de `src/domain/limits.ts` | - | `[//]` | `src/domain/elisao.ts` | 🟢 | `[X]` |
| T003 | Gravar a fixtura dos três casos que restaram depois da primeira promoção, com as formas medidas em 2026-09-20 e a nota de que é o insumo desta feature | - | `[//]` | `tests/fixtures/descoberta/casos-do-prompt.json` | 🟢 | `[X]` |
| T004 | Estender `checkpointStateFixture` com a forma elidida, e acrescentar construtor do caso sem forma, que é o host anterior ao campo | T001 | `[//]` | `tests/helpers/reversa-fixtures.ts` | 🟡 | `[X]` |
| T005 | Extrair `lerEstados` de `scripts/aprender-equivalencias.js` para `scripts/equivalencias/estados.js`, movendo o corpo sem alterá-lo, e apontar o comando de aprendizado para o módulo novo | - | `[//]` | `scripts/equivalencias/estados.js` | 🟡 | `[X]` |

## Fase 2, Testes

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T006 | Escrever a paridade da elisão: as duas implementações concordam sobre uma matriz de valores e sobre os três checkpoints reais, no molde de `tests/limites.spec.ts`, que já importa módulo de `scripts/` de dentro da suíte | T002, T003 | `[//]` | `tests/elisao-paridade.spec.ts` | 🟢 | `[X]` |
| T007 | Escrever a suíte das chaves e dos valores: as chaves de `formaElidida` são exatamente as do disco, inclusive as canônicas, e nenhum valor é lista ou objeto | T001, T003 | - | `tests/domain-discovery-state.spec.ts` | 🟢 | `[X]` |
| T008 | Escrever a suíte da invariante central: a forma nasce **apenas** em `conclusao-nao-declarada`, e é nula nas outras três situações, uma a uma | T007 | - | `tests/domain-discovery-state.spec.ts` | 🟢 | `[X]` |
| T009 | Escrever a suíte das duas invariantes derivadas: forma preenchida implica `reconhecidoPor` nula, e forma preenchida implica `instante` nulo | T008 | - | `tests/domain-discovery-state.spec.ts` | 🟢 | `[X]` |
| T010 | Escrever a suíte da disponibilidade: os elegíveis e a razão, nos três casos que não produzem prompt, leitura sã, eixo ausente e desvio já decidido por gente, com razões distintas entre si | T004 | `[//]` | `tests/webview-prompt.spec.ts` | 🟢 | `[X]` |
| T011 | Escrever a suíte das cinco partes do texto, na ordem do `interfaces/texto-do-prompt.md`, com os quatro pedidos numerados e as quatro proibições | T010 | - | `tests/webview-prompt.spec.ts` | 🟢 | `[X]` |
| T012 | Escrever a suíte do que o texto nunca contém: conteúdo de campo elidido, número de medição que o painel não leu, afirmação de que o guia existe naquela raiz, e menção a checkpoint reconhecido ou a chave aprovada | T011 | - | `tests/webview-prompt.spec.ts` | 🟢 | `[X]` |
| T013 | Escrever a suíte do determinismo: duas montagens sobre a mesma carga dão o mesmo texto byte a byte, e o destino da cópia recebe o mesmo que o do documento | T011 | - | `tests/webview-prompt.spec.ts` | 🟢 | `[X]` |
| T014 | Escrever a suíte do host anterior: eixo presente e campo ausente compõe o bloco sem a forma, sem quebrar e sem inventar campo | T011 | - | `tests/webview-prompt.spec.ts` | 🟡 | `[X]` |
| T015 | Escrever a suíte do cabeçalho: a ação nova existe com `data-action` próprio, desabilita com razão legível em texto, e a confirmação nomeia o que foi copiado em vez de dizer sempre resumo | T004 | `[//]` | `tests/webview-header.spec.tsx` | 🟢 | `[X]` |
| T016 | Escrever a suíte do comando de manutenção: três blocos nomeando projeto e agente, ordem estável entre duas execuções, e nenhuma escrita fora do arquivo de saída | T005, T003 | `[//]` | `tests/prompt-harness.spec.ts` | 🟡 | `[X]` |
| T017 | Escrever a paridade do texto: painel e comando recebem a mesma lista de casos e produzem texto idêntico, comparado inteiro e não por resumo, com fixtura que inclui caso sem forma e caso sem projeto declarado | T011, T016 | - | `tests/prompt-paridade.spec.ts` | 🟢 | `[X]` |
| T018 | Estender a suíte do protocolo: `CheckpointState` termina com o campo novo e ele é o único opcional, e o topo da carga continua com os quinze campos na mesma ordem | T001 | `[//]` | `tests/host-protocol.spec.ts` | 🟢 | `[X]` |

## Fase 3, Núcleo

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T019 | Anexar a forma elidida no ramo de `conclusao-nao-declarada` de `lerCheckpoint`, chamando a elisão do domínio e preservando a precedência das três leituras que decidem antes | T007, T008 | - | `src/domain/discovery-state.ts` | 🟢 | `[X]` |
| T020 | Garantir que os três ramos que decidem antes devolvem a forma nula, explicitamente e não por omissão, para que a invariante se leia no código e não apenas na suíte | T019 | - | `src/domain/discovery-state.ts` | 🟢 | `[X]` |
| T021 | Escrever a apuração da disponibilidade em função única, devolvendo os checkpoints elegíveis e a razão da ausência, para que o botão e o texto nunca discordem, pela lição de `anomalies-view.ts` | T010 | - | `src/webview/domain/prompt.ts` | 🟢 | `[X]` |
| T022 | Escrever a composição do texto: as cinco partes na ordem do contrato, a norma sem número de medição, e a indicação de onde o guia costuma morar sem afirmar que ele existe ali | T021, T011 | - | `src/webview/domain/prompt.ts` | 🟢 | `[X]` |
| T023 | Escrever o bloco do caso: agente, fase quando houver, situação em palavras, campos com lista nomeados sem serem chamados de saídas, e a forma num bloco cercado que desaparece quando a forma falta | T022 | - | `src/webview/domain/prompt.ts` | 🟢 | `[X]` |
| T024 | Acrescentar em `labels.ts` o rótulo da situação em palavras que o prompt precisa, se o vocabulário existente não servir ao texto corrido, mantendo os rótulos da tela intocados | T023 | - | `src/webview/domain/labels.ts` | 🟡 | `[X]` |

## Fase 4, Integração

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T025 | Desenhar a ação no cabeçalho, ao lado das duas do resumo, com a razão do desabilitado em texto e a confirmação de cópia trocada de booleana para o valor que nomeia o que foi copiado | T015, T021 | - | `src/webview/ui/Header.tsx` | 🟢 | `[X]` |
| T026 | Passar as duas portas novas por `App`, opcionais como as do resumo, sem que o componente decida coisa alguma sobre elas | T025 | - | `src/webview/ui/App.tsx` | 🟢 | `[X]` |
| T027 | Compor o texto e despachá-lo em `main.tsx`, escolhendo entre cópia e documento, e recusando com linha de log quando não há leitura, no molde exato de `summarise` | T026, T023 | - | `src/webview/main.tsx` | 🟢 | `[X]` |
| T028 | Escrever o comando de manutenção, costurando a varredura, as duas regras do esquema, o mapa aprovado e a elisão, e terminando com causa nomeada e sem arquivo pela metade quando a raiz não existe | T005, T016 | - | `scripts/prompt-harness.js` | 🟢 | `[X]` |
| T029 | Declarar `prompt:harness` no manifesto de scripts, ao lado dos auxiliares existentes, e conferir que `npm run build` não o invoca | T028 | - | `package.json` | 🟢 | `[X]` |

## Fase 5, Polimento

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T030 | Registrar no canal de saída quantos casos o prompt cobriu, com a contagem e sem o conteúdo do texto, para que a trilha diga o que foi pedido sem repetir o que foi dito | T027 | - | `src/webview/main.tsx` | 🟡 | `[X]` |
| T031 | Documentar no README o botão e o comando: o que cada um faz, por que o prompt pede a causa e não só o dado, e por que o painel não conserta nada | T029 | `[//]` | `README.md` | 🟢 | `[X]` |
| T032 | Exercitar o comando contra os 64 projetos reais sob `~/dev` e conferir, com `git status`, que nenhum `state.json` foi tocado, como a 012 fez antes de declarar a sua entrega pronta | T028 | `[//]` | `propostas/prompt-harness.md` | 🟢 | `[X]` |

## Notas de execução

Três avisos para quem executar, todos tirados do que o plano descobriu e nenhum deles óbvio no
código.

O primeiro é sobre T020: a forma nula nos três ramos que decidem antes precisa estar **escrita**, e
não herdada de um objeto comum. A leitura do código é parte da promessa de privacidade, e um leitor
que precise inferir a nulidade não a verificou.

O segundo é sobre T025: a troca da confirmação de booleana para valor nomeado toca um estado que hoje
serve ao resumo. É mudança pequena com efeito visível, e a suíte do cabeçalho precisa cobrir os dois
botões, não apenas o novo.

O terceiro é sobre T005: a extração de `lerEstados` é movimento de arquivo sem mudança de corpo, e
vale rodar `npm run aprender:equivalencias` uma vez depois dela, contra `~/dev`, antes de seguir. A
suíte cobre o caminho, e o comando da 012 é o único consumidor de hoje.

### Dois requisitos sem ação própria, e por quê

Vale o registro, para que a ausência não seja lida como esquecimento numa auditoria. O RF-12, do teto
de bytes, e o RF-13, de não acrescentar comando ao protocolo, são satisfeitos por código que **já
existe**: `acceptedText` em `src/host/router.ts` mede o teto em bytes e recusa nomeando o tamanho
recebido, para `copyText` e `openDraft` igualmente, e `tests/host-router.spec.ts` já cobre os dois
casos. Não há o que escrever, e escrever algo seria duplicar guarda. O que a feature precisa é não
quebrá-los, e disso cuidam T018, que confere a forma do contrato, e a suíte do roteador, que continua
onde está.

## Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-09-20 | Versão inicial gerada por `/reversa-to-do` | reversa |
