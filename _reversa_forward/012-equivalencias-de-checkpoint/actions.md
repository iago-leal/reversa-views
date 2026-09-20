# Actions: equivalências de checkpoint reconhecidas por aprovação

> Identificador: `012-equivalencias-de-checkpoint`
> Data: `2026-09-20`
> Roadmap: `_reversa_forward/012-equivalencias-de-checkpoint/roadmap.md`

## Resumo

| Métrica | Valor |
|---------|-------|
| Total de ações | 42 |
| Paralelizáveis (`[//]`) | 23 |
| Maior cadeia de dependência | 15 |

A cadeia longa é uma só, e atravessa a feature inteira de ponta a ponta:
`T001 → T002 → T003 → T004 → T008 → T009 → T021 → T022 → T023 → T024 → T033 → T034 → T035 → T036 → T042`.
Ela começa nas formas, passa pelas duas suítes que fixam a precedência, atravessa os quatro passos
do julgamento, chega à tela e só termina na medição, que é o último elo porque não há o que medir
antes do último pixel desenhado. É quase o dobro da cadeia da feature 011, que fechou em oito, e a
razão é estrutural: ali a decisão nova nascia de campos que já estavam no arquivo lido, e aqui ela
depende de um dado que precisa existir, ser tipado e ser ligado antes de qualquer julgamento.

Quatro ações não dependem de nada e podem abrir a execução ao mesmo tempo: `T001`, que inicia a
cadeia longa; `T006`, que grava as fixturas; e `T014` e `T016`, que são as suítes das duas
ferramentas cujo comportamento não depende de forma alguma do domínio.

A feature tem **três** frentes, e não duas como as anteriores. A do julgamento vai de `T001` a
`T024` e não toca a tela nem a rede. A das ferramentas vai de `T013` a `T032`, vive inteira em
`scripts/` e é a única que conhece o motor local. A da tela vai de `T019` a `T036` e trabalha contra
as formas de `T001` a `T003`, sem disco e sem mapa real. As três se encontram apenas em `T033`, que
liga o mapa à leitura, e em `T038`, que declara os comandos.

Uma ordem não é negociável, e vem do plano de migração: **`T033` não entra antes de `T024`**. Ligar
o mapa real a uma leitura que ainda não sabe consultá-lo produziria uma construção intermediária em
que o dado existe e é ignorado, que é o pior dos estados para depurar. Pela mesma razão, `T031` e
`T032` vêm depois das quatro peças que elas costuram, e não antes.

Duas ações merecem leitura atenta antes de serem executadas. `T030` escreve código que gera código,
e o escape dos valores é o ponto em que ela falha silenciosamente: os valores vêm de arquivos de
terceiros e aceitam aspas e barra invertida. E `T037` é a única que fabrica estado doente, sempre
sobre cópia em pasta temporária do sistema, nunca sobre workspace de origem.

## Fase 1, Preparação

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T001 | Acrescentar `falhou` a `CheckpointSituation` e `reconhecidoPor` a `CheckpointState`, com a prosa que registra as três invariantes do `data-delta.md` 1.2 e o fato de que `falhou` nunca nasce do esquema | - | - | `src/domain/types.ts` | 🟢 | `[X]` |
| T002 | Declarar `NonAgentEntry`, acrescentar `registrosNaoAgentes` a `DiscoveryStateAxis` e incluí-lo em `EMPTY_DISCOVERY_STATE`, mantendo a cópia e nunca a constante compartilhada, pelo precedente de `EMPTY_GREENFIELD` | T001 | - | `src/domain/types.ts` | 🟡 | `[X]` |
| T003 | Declarar as formas do mapa, `EquivalenciaDeCampo`, `RegistroNaoAgente` e `MapaDeEquivalencias`, com a chave do par documentada como campo mais valor e a nota de que `nao-e-sinal` não vira registro | T002 | - | `src/domain/types.ts` | 🟢 | `[X]` |
| T004 | Acrescentar `equivalencias` opcional a `DiscoveryStateInput`, registrando na declaração que omitir o campo é o caminho pelo qual a suíte da 011 continua passando | T003 | `[//]` | `src/domain/discovery-state.ts` | 🟢 | `[X]` |
| T005 | Criar o módulo do mapa vazio, com o cabeçalho que diz quem o escreve, que não se edita à mão e que a sua história em git é a trilha de auditoria das aprovações, no molde de `src/heranca/revisao.ts` | T003 | `[//]` | `src/domain/equivalencias.ts` | 🟢 | `[X]` |
| T006 | Gravar as fixturas de `state.json` com as formas medidas em 2026-09-20: os sete vocabulários de conclusão, um checkpoint com `status` de falha, as três entradas que não nomeiam agente, e um checkpoint parcial com `modules_pending` povoado ao lado de `status` de conclusão | - | `[//]` | `tests/fixtures/descoberta/` | 🟢 | `[X]` |
| T007 | Estender os construtores de fixture da carga: eixo com as quatro situações, checkpoint com e sem procedência, lista de registros vazia e povoada, mapa vazio e povoado, e a variante sem os campos novos, que simula host anterior | T001, T002, T003 | `[//]` | `tests/helpers/reversa-fixtures.ts` | 🟢 | `[X]` |

## Fase 2, Testes

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T008 | Escrever a suíte da precedência: `completed_at` vence o mapa mesmo havendo par aprovado, e `modules_pending` não vazio vence o mapa sem sequer consultá-lo (RN-02, RF-02) | T004, T006 | - | `tests/domain-discovery-state.spec.ts` | 🟢 | `[X]` |
| T009 | Escrever a suíte das três leituras que reconhecem: `concluido`, `falhou` e `em-andamento` produzem cada uma a sua situação, a procedência nomeia campo e valor, e o instante permanece nulo em todas, mesmo com `at` no checkpoint (RF-03, RF-06, RF-16) | T008 | - | `tests/domain-discovery-state.spec.ts` | 🟢 | `[X]` |
| T010 | Escrever a suíte do que o mapa não alcança: par ausente do mapa mantém a conclusão não declarada com a anomalia da 011 intacta, e mapa vazio ou ausente produz resultado idêntico ao da feature 011 (RF-05, RF-15) | T009 | - | `tests/domain-discovery-state.spec.ts` | 🟢 | `[X]` |
| T011 | Escrever a suíte das entradas que não são agentes: a chave aprovada sai de `checkpoints`, entra em `registrosNaoAgentes`, não gera anomalia e não é contada; a não aprovada continua exatamente como hoje (RF-17) | T010 | - | `tests/domain-discovery-state.spec.ts` | 🟡 | `[X]` |
| T012 | Escrever a suíte das invariantes do `data-delta.md` 1.2: procedência nula sempre que a situação veio do esquema, instante não nulo implicando procedência nula, e uma chave jamais nas duas listas | T011 | - | `tests/domain-discovery-state.spec.ts` | 🟢 | `[X]` |
| T013 | Escrever a suíte da elisão sobre os checkpoints reais medidos: chaves preservadas, escalares curtos preservados, e listas, textos longos e caminhos de sistema substituídos por marcador de forma (RF-11, RN-09) | T006 | `[//]` | `tests/equivalencias-elisao.spec.ts` | 🟢 | `[X]` |
| T014 | Escrever a suíte do cliente do motor com transporte duplo: resposta válida, resposta que não é JSON, resposta que nomeia campo ausente do checkpoint enviado, e tempo-limite estourado, cada uma com o desfecho que `interfaces/motor-local.md` declara | - | `[//]` | `tests/equivalencias-motor.spec.ts` | 🟢 | `[X]` |
| T015 | Escrever a suíte do coletor: pares inéditos isolados por campo mais valor, pares já decididos pulados, chaves de entrada não-agente coletadas à parte, e segunda passada sobre o mesmo disco devolvendo nada (RF-13) | T005, T006 | `[//]` | `tests/equivalencias-coletor.spec.ts` | 🟢 | `[X]` |
| T016 | Escrever a suíte da proposta nos dois sentidos: a escrita produz caixas desmarcadas com o bloco de dados sob cada item, e a leitura devolve só o que está marcado, ignorando prosa, anotação do usuário e itens não marcados (RF-12, RF-19) | - | `[//]` | `tests/equivalencias-proposta.spec.ts` | 🟡 | `[X]` |
| T017 | Escrever a suíte do gerador do mapa: valor com aspas e com barra invertida produz módulo que compila, par divergente do já mapeado é recusado com o conflito nomeado, e a ordenação da saída é estável entre execuções (D-11, RF-18) | T003 | `[//]` | `tests/equivalencias-mapa.spec.ts` | 🟢 | `[X]` |
| T018 | Escrever a suíte do protocolo: os dois campos novos ausentes são lidos como nulo e lista vazia, e situação desconhecida é tratada como `conclusao-nao-declarada`, que é o estado mais conservador dos quatro | T007 | `[//]` | `tests/host-protocol.spec.ts` | 🟢 | `[X]` |
| T019 | Escrever a suíte da tela: as quatro situações desenhadas com texto distinto, a procedência legível sem depender de cor, e a lista dos registros que não são agentes aparecendo apartada dos checkpoints (RF-08, RF-16, RF-17) | T007 | `[//]` | `tests/webview-sections.spec.ts` | 🟡 | `[X]` |
| T020 | Escrever a suíte do preview para o caso de falha, julgando pelo `readWorkspace` inteiro e não pelo domínio isolado, como a 011 fez com `terminal-e-estranha`, porque o caso só tem sentido contra a leitura real | T006 | `[//]` | `tests/preview-descoberta.spec.ts` | 🟢 | `[X]` |

## Fase 3, Núcleo

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T021 | Implementar a consulta ao mapa em `lerCheckpoint`, na precedência do `data-delta.md` 1.1: campo canônico, depois assinatura documentada do trabalho parcial, e só então o par aprovado | T008, T009 | - | `src/domain/discovery-state.ts` | 🟢 | `[X]` |
| T022 | Implementar a procedência: preencher `reconhecidoPor` apenas quando a situação veio do mapa, e garantir que o instante permaneça nulo nesse caminho, qualquer que seja o campo de data ao lado | T021 | - | `src/domain/discovery-state.ts` | 🟢 | `[X]` |
| T023 | Implementar a separação das entradas aprovadas como registro que não é agente, que saem de `checkpoints` e entram em `registrosNaoAgentes`, preservando os campos de lista pela mesma regra da 011 | T022 | - | `src/domain/discovery-state.ts` | 🟡 | `[X]` |
| T024 | Restringir `anomaliasDosCheckpoints` ao que o mapa não reconheceu, de modo que o par aprovado cale a anomalia e o não aprovado a mantenha inteira (RN-05, RF-04) | T023 | - | `src/domain/discovery-state.ts` | 🟢 | `[X]` |
| T025 | Implementar a elisão como função pura, com o marcador de forma para lista, texto longo e caminho de sistema, e sem nenhuma outra responsabilidade, para que a promessa de privacidade caiba numa leitura de vinte linhas | T013 | `[//]` | `scripts/equivalencias/elidir.js` | 🟢 | `[X]` |
| T026 | Implementar o cliente do motor com transporte injetável, temperatura zero, semente fixa, resposta em JSON e tempo-limite de 60 s por par, descartando com aviso a resposta que nomeia campo ausente do checkpoint enviado | T014 | `[//]` | `scripts/equivalencias/motor.js` | 🟢 | `[X]` |
| T027 | Implementar o coletor, que varre os `state.json` da raiz declarada, isola os pares campo mais valor fora do esquema e as chaves que não nomeiam agente, e descarta o que o mapa já decidiu | T015 | `[//]` | `scripts/equivalencias/coletar.js` | 🟢 | `[X]` |
| T028 | Implementar a escrita da proposta em Markdown, com caixa desmarcada por item, a justificativa do motor, os projetos de evidência, o bloco de dados cercado sob cada item, e a seção final dos não classificados | T016 | `[//]` | `scripts/equivalencias/proposta.js` | 🟡 | `[X]` |
| T029 | Implementar a leitura das marcações, que devolve apenas os blocos cujos itens estão marcados e ignora todo o resto do arquivo, inclusive anotação escrita ao lado do item | T028 | - | `scripts/equivalencias/proposta.js` | 🟡 | `[X]` |
| T030 | Implementar o gerador do módulo do mapa, com os valores **escapados** e jamais interpolados, pela lição já registrada no gerador do carimbo, e com recusa nomeada do par divergente em vez de sobrescrita | T017 | `[//]` | `scripts/equivalencias/gerar-mapa.js` | 🟢 | `[X]` |
| T031 | Escrever a casca do comando de aprendizado, que costura coletor, elisão e motor, aceita a raiz e o modelo por argumento, e termina com causa nomeada e sem arquivo pela metade quando o motor não responde | T025, T026, T027, T028 | - | `scripts/aprender-equivalencias.js` | 🟢 | `[X]` |
| T032 | Escrever a casca do comando de promoção, que lê as marcações e regenera o mapa sem importar o cliente do motor, de modo que a separação entre propor e dispor seja verificável por inspeção do arquivo | T029, T030 | `[//]` | `scripts/promover-equivalencias.js` | 🟢 | `[X]` |

## Fase 4, Integração

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T033 | Ligar o mapa real ao ramo do eixo em `readWorkspace`, dentro do mesmo bloco protegido dos demais, sem escrever layout do Reversa e sem que exceção no ramo novo deixe de virar o estado `error` nomeado | T024 | - | `src/host/reading.ts` | 🟢 | `[X]` |
| T034 | Desenhar as quatro situações do checkpoint, com rótulo próprio para a falha, e tratar situação desconhecida como `conclusao-nao-declarada` em vez de quebrar ou de escolher a mais favorável | T019, T033 | - | `src/webview/ui/DiscoverySection.tsx` | 🟢 | `[X]` |
| T035 | Desenhar a procedência na linha do checkpoint reconhecido, nomeando campo, valor e o fato de estarem fora do esquema, em texto e nunca só em cor | T034 | - | `src/webview/ui/DiscoverySection.tsx` | 🟢 | `[X]` |
| T036 | Desenhar a lista dos registros que não são agentes, apartada dos checkpoints e sem situação, porque não se cobra conclusão de quem não é agente | T035 | - | `src/webview/ui/DiscoverySection.tsx` | 🟡 | `[X]` |
| T037 | Acrescentar o caso `falha` ao auxiliar do estado doente, no molde dos quatro existentes: copiar o workspace para pasta temporária do sistema, reescrever só o `state.json` da cópia e imprimir o caminho dela | T020 | `[//]` | `scripts/estragar-descoberta.js` | 🟢 | `[X]` |
| T038 | Declarar os dois comandos no manifesto de scripts, ao lado dos auxiliares existentes, e conferir que nenhum deles é invocado por `npm run build` | T031, T032 | `[//]` | `package.json` | 🟢 | `[X]` |

## Fase 5, Polimento

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T039 | Registrar no canal de saída quantos checkpoints foram reconhecidos por equivalência na leitura, para que a trilha de auditoria da própria leitura inclua o que o mapa decidiu | T033 | - | `src/host/reading.ts` | 🟡 | `[X]` |
| T040 | Documentar o mapa e o rito das duas ferramentas: o que cada comando faz, por que aprovar é marcar, e por que o aprendizado nunca escreve no mapa | T038 | `[//]` | `README.md` | 🟢 | `[X]` |
| T041 | Conferir e fixar que `out/domain/equivalencias.js` entra no pacote e que nenhum caminho novo aparece fora do previsto por `scripts/conteudo-esperado.js` | T005, T038 | `[//]` | `tests/vsix-conteudo.spec.ts` | 🟢 | `[X]` |
| T042 | Medir e registrar os dois números do critério de pronto: o tamanho do pacote da tela contra a guarda de 60 % do teto, e o tempo da leitura da referência contra os 200 ms | T036 | `[//]` | `_reversa_forward/012-equivalencias-de-checkpoint/` | 🟢 | `[X]` |

## Notas de execução

- **T019 mudou de arquivo alvo**, de `tests/webview-sections.spec.ts` para
  `tests/webview-labels.spec.ts`. A suíte de seções confere funções de domínio da tela, e não
  renderiza componente algum; a decisão de rótulo do checkpoint mora em `src/webview/domain/labels.ts`
  e é lá que ela é testável. O alvo declarado no plano teria produzido um teste no lugar errado.

## Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-09-20 | Versão inicial gerada por `/reversa-to-do` | reversa |
