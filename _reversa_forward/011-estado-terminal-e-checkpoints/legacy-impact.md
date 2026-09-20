# Impacto no legado: 011-estado-terminal-e-checkpoints

**Data:** 2026-09-20
**Feature:** `011-estado-terminal-e-checkpoints`
**Cenário:** greenfield.

Feature greenfield, sem legado pré-existente. Âncora: `prd.md` + specs SDD.

Não há extração de `/reversa` neste projeto: `_reversa_sdd/` não tem `architecture.md` nem
`domain.md`, e o contexto vem de `_reversa_sdd/prd.md` com as cinco specs de `_reversa_sdd/sdd/`.
Por isso não há regra 🟢 extraída de código existente para preservar ou quebrar, e as seções
"Preservadas" e "Modificadas" ficam vazias.

Há, porém, um legado de segunda ordem, e esta feature mexeu nele de modo indireto: a camada
vendorizada de `src/heranca/`, herdada do `scrum-harness`. Os dois defeitos que a feature corrige
nascem lá, e a decisão registrada no roadmap (D-02) foi corrigi-los **fora** dela, na camada local,
sem abrir adaptação. Nenhum arquivo herdado foi tocado, nenhum carimbo mudou e o total de
adaptações declaradas continua dezesseis. O que ficou devendo à origem está escrito em
`src/heranca/PROCEDENCIA.md`, na subseção "Pendências de origem", e é a única coisa desta entrega
que outra cópia do pacote herdado ainda não recebe.

O código anterior foi escrito pelo próprio ciclo forward, nas features 001 a 010. Como nos rastros
anteriores, a tabela distingue arquivo criado (`componente-novo`) de arquivo anterior que ganhou
comportamento (`regra-nova`), arquivo anterior cujo comportamento mudou (`regra-alterada`) e
contrato da ponte (`delta-de-contrato-externo`). Onze arquivos foram criados, cinco deles fixturas
de um mesmo diretório e três suítes, e vinte e um foram modificados; a lista ação por ação está em
`progress.jsonl`.

**Execução.** Trinta e quatro ações concluídas, nenhuma falha e nenhuma linha `corrected` no
rastro. A ordem não negociável do plano de migração foi respeitada: o filtro da anomalia absorvida
(T022 e T024) entrou depois de quem a reconhece (T017), de modo que em nenhum momento existiu
construção intermediária capaz de esconder anomalia legítima.

**Uma mudança além das trinta e quatro ações.** As quatro linhas da tabela de estados do preview no
`README.md` não estavam previstas no `actions.md`, e foram escritas assim mesmo: o auxiliar novo
tem quatro casos, as tabelas do `README.md` listam os casos de todos os auxiliares anteriores, e
deixá-lo de fora tornaria a tabela falsa sobre o que o repositório sabe fazer. A omissão é do
plano, não da entrega, e fica registrada aqui por isso.

**Medidas.** Pacote da tela em 214.288 B, 52,3 % do teto de 409.600 B e 31.472 B abaixo da guarda
de 60 %; a feature custou 1.972 B sobre os 212.316 B medidos na entrega da 010. O comentário de
`tests/webview-build.spec.ts` continua registrando o número da 010, porque nenhuma ação desta
feature pediu para atualizá-lo. Leitura do workspace de referência, no teto de quarenta e nove
pastas: 52,9 ms, contra o teto de 200 ms. A feature não acrescenta leitura de disco alguma: o
`state.json` já vinha no instantâneo da sonda, e o eixo é julgamento puro sobre ele.

**Conferência da herança.** Com o caminho do clone corrigido (T032), `npm run check:heranca` passou
ao modo completo pela primeira vez nesta máquina e trouxe um achado que não é desta feature: as
adaptações A4 e A5 não casam mais com o conteúdo atual de `impact.ts` e `impact.spec.ts` na origem,
com zero ocorrências, e o veredito é "impedido". O `npm run build` não é afetado, porque usa
`check:heranca:local`. Fica registrado aqui como dívida herdada, a tratar em ciclo próprio.

**Política de edição do legado no momento da execução.** `.reversa/reversa-config.json` declarava
`"allowLegacyEdits": true` com `"allowedPaths": []`. Liberação irrestrita: todo caminho do projeto
estava gravável, e nenhuma escrita foi recusada por política. O arquivo de configuração não foi
criado nem alterado por esta execução.

## Arquivos afetados

| Arquivo afetado | Componente | Tipo | Severidade | Justificativa |
|---|---|---|---|---|
| `src/domain/discovery-state.ts` | leitura-do-processo | componente-novo | CRITICAL | O julgamento inteiro do eixo: a situação da extração com a precedência das cinco canônicas antes da família de encerramento (RN-01, RN-02), o reconhecimento do encerramento por forma e não por lista literal, os três estados do checkpoint na precedência do `checkpoint-guide` (RN-03), a anomalia do terceiro estado (RN-04), os campos de lista preservados em `extra` e a identidade das anomalias herdadas que o eixo absorve. Função pura, sem disco e sem módulo de plataforma. |
| `src/webview/domain/anomalies-view.ts` | painel-do-processo | componente-novo | HIGH | A composição única da lista que a tela desenha: as do processo menos as absorvidas, depois bugs, greenfield, entrega e, por fim, as deste eixo. O desconto casa a tripla inteira, nunca o código sozinho, e acontece na exibição, jamais na leitura (D-02, D-03). |
| `src/domain/types.ts` | ponte-e-host | delta-de-contrato-externo | HIGH | As formas do eixo (`ExtractionState`, `CheckpointState`, `DiscoveryStateAxis`, `AbsorbedAnomaly`), a união local do código de anomalia e a constante `EMPTY_DISCOVERY_STATE`, pelo precedente de `BugAnomalyCode` e `GreenfieldAnomalyCode`. Nada existente muda de nome, de tipo ou de posição. |
| `src/host/protocol.ts` | ponte-e-host | delta-de-contrato-externo | MEDIUM | `discoveryState` opcional ao FIM de `SetProcessData`. Host anterior não manda o campo, e a tela então desenha o que desenhava antes: a anomalia do encerramento de volta e o checkpoint em dois estados. |
| `src/host/reading.ts` | ponte-e-host | regra-nova | MEDIUM | Mais um ramo local dentro do mesmo `try`, alimentado por `snapshot.stateJson` e pelo processo já julgado. É o único ramo que lê o que a camada herdada produziu, porque a absorção precisa das anomalias dela. Nenhum layout do Reversa é escrito aqui (D-01). |
| `src/host/session.ts` | ponte-e-host | regra-nova | LOW | O campo novo entra na carga do `setProcess`, por acréscimo. |
| `src/webview/domain/integrity.ts` | painel-do-processo | regra-alterada | MEDIUM | Passa a contar sobre a lista composta, em vez de somar as quatro listas por conta própria. Duas leituras do mesmo fato acabariam discordando assim que o desconto existisse, e o cabeçalho declararia leitura degradada por anomalia que a seção não mostra (D-03). |
| `src/webview/domain/labels.ts` | painel-do-processo | regra-alterada | MEDIUM | Vocabulário das três situações da extração e dos três estados do checkpoint; `checkpointMark` passa a ler o estado derivado e cai no comportamento herdado quando o eixo não vem. |
| `src/webview/ui/DiscoverySection.tsx` | painel-do-processo | regra-alterada | HIGH | A frase de encerramento como `<p data-part="discovery-closed">` acima das cinco fases, com o valor bruto ao lado (RF-04); o terceiro estado do checkpoint, com `data-situacao` de três valores no lugar de `data-done` (RF-05, RF-06); e a sinalização dos campos de lista, que os nomeia sem chamá-los de saídas nem promovê-los a lista de arquivos (RF-11). As cinco fases continuam desenhadas na ordem do framework, e nenhuma sexta é inventada. |
| `src/webview/ui/App.tsx` | painel-do-processo | regra-alterada | LOW | Deixa de somar as quatro listas no lugar e passa a chamar a composição única. |
| `scripts/estragar-descoberta.js` | empacotamento-e-verificacao | componente-novo | MEDIUM | Quatro casos por cópia adoecida fora do repositório: `fase-estranha`, `parcial`, `terminal-e-estranha` e `saidas-nao-canonicas`. Copia o workspace para pasta temporária do sistema e reescreve só o `state.json` da cópia, preservando a identidade do original. |
| `package.json` | empacotamento-e-verificacao | regra-nova | LOW | `estragar:descoberta` ao lado dos três auxiliares anteriores. |
| `README.md` | empacotamento-e-verificacao | regra-nova | LOW | Quatro linhas novas na tabela de estados do preview, uma por caso do auxiliar. Fora do `actions.md`, pelo motivo escrito acima. |
| `heranca.origens.yml` | heranca-e-sincronia | regra-alterada | MEDIUM | Caminho do clone da origem de código corrigido para onde ele está nesta máquina. Ficou absoluto, e não `~/HARNESS/scrum-harness` como o roadmap escreve, porque quem lê o caminho é `existsSync` e não o shell: o til não se expandiria. O motivo está em comentário no próprio arquivo. |
| `src/heranca/PROCEDENCIA.md` | heranca-e-sincronia | contrato-alterado | HIGH | Subseção "Pendências de origem" ao fim da seção 5, com os dois achados, onde vivem na origem, como foram resolvidos aqui e o que falta levar ao `scrum-harness`. Nenhuma adaptação nova, nenhum carimbo tocado, total em dezesseis. |
| `tests/domain-discovery-state.spec.ts` | leitura-do-processo | componente-novo | MEDIUM | O reconhecimento do encerramento pelas cinco grafias medidas, a precedência das canônicas, os três estados do checkpoint, a anomalia do terceiro e a absorção pela tripla inteira. |
| `tests/webview-anomalies-view.spec.ts` | painel-do-processo | componente-novo | MEDIUM | A composição sem o eixo é exatamente a soma anterior, na mesma ordem; com o eixo, desconta só a absorvida e preserva a ordem das cinco origens. |
| `tests/preview-descoberta.spec.ts` | empacotamento-e-verificacao | componente-novo | MEDIUM | Cada caso do auxiliar produz de fato o estado prometido, julgado pelo `readWorkspace` inteiro e não pelo domínio isolado, porque o caso decisivo é o da absorção, que casa anomalia produzida só pela camada herdada. A cópia sai em pasta temporária e a origem fica intocada. |
| `tests/fixtures/descoberta/` (5 arquivos) | leitura-do-processo | componente-novo | LOW | As formas medidas em `~/dev` em 20/09, escritas e não copiadas: o `med-reversa` com os sete checkpoints, o caso terminal com nome estranho, o parcial documentado, os campos de lista e o catálogo dos valores de `phase` observados. |
| `tests/helpers/reversa-fixtures.ts` | empacotamento-e-verificacao | regra-nova | LOW | Fábricas das formas novas do eixo, incluindo o caso encerrado e o da conclusão não declarada. |
| `tests/heranca-adaptacoes.spec.ts` | heranca-e-sincronia | regra-nova | MEDIUM | A subseção de pendências não é lida como adaptação, e o total declarado continua dezesseis, conferido no dado e na prosa ao mesmo tempo. |
| `tests/host-protocol.spec.ts`, `tests/host-reading.spec.ts`, `tests/readonly-local.spec.ts`, `tests/host-manifest.spec.ts` | ponte-e-host | regra-nova | MEDIUM | O campo novo é o último e é opcional; o eixo aparece na carga do estado `loaded` e a exceção no ramo novo continua virando estado `error` nomeado; o módulo novo entra na varredura de somente leitura; o manifesto passa a declarar vinte scripts. |
| `tests/webview-discovery-section.spec.tsx`, `tests/webview-labels.spec.ts`, `tests/webview-integrity.spec.ts` | painel-do-processo | regra-nova | MEDIUM | Frase de encerramento, três estados do checkpoint, instante só quando canônico, sinalização dos campos de lista, vocabulário e a integridade contando sobre a composição. |

## Diff conceitual por componente

### leitura-do-processo

O componente ganhou um quinto território, e o que ele tem de próprio é a relação com a herança.
Todos os territórios anteriores julgavam sobre o que a sonda trouxera; este julga **ao lado** de um
julgamento herdado que continua valendo, sobre o mesmo arquivo bruto, e chega a conclusão diferente
em dois pontos. A camada de `src/heranca/reversa-domain/src/state.ts` segue intocada e continua
descrevendo o disco com fidelidade, `fase-desconhecida` sobre a fase de encerramento inclusive. O
que o eixo novo produz não é uma correção daquele resultado, e sim a identidade do que o painel
decide não desenhar, o que o NG-03 da spec da leitura reserva ao painel.

As duas regras nasceram de medição, e a assimetria entre elas é deliberada. A fase de encerramento
é **sistemática**: dezessete projetos em sessenta e quatro, cinco grafias, em duas versões do
Reversa, para um valor que o esquema não documenta. Por isso o reconhecimento é por forma, e não
por lista literal, que estaria desatualizada assim que a sexta grafia aparecesse. Já o checkpoint
sem `completed_at` é **desvio**: o campo documentado está em 203 dos 229 registros medidos. Por
isso o leitor não aprende os sete nomes alternativos que vieram no lugar; ele nomeia o estado com
honestidade, sem afirmar que terminou, porque o campo canônico não está lá, nem que corre, porque
nada indica trabalho em curso.

### ponte-e-host

O contrato cresceu por acréscimo, pela regra que toda feature desde a 008 seguiu: campo opcional ao
fim, ausência significando host anterior e nunca projeto sem descoberta. O `process` continua
cruzando o canal sem transformação, com `anomalies` inteiro: nada é descontado na travessia, e o
que viaja em `absorvidas` é apenas a identidade do que a tela então deixa de desenhar.

### painel-do-processo

Três informações novas, cada uma ao lado da pergunta que responde, e todas em texto, nunca só em
cor: a frase de encerramento acima das cinco fases, o terceiro estado do checkpoint e o nome dos
campos de lista. A quarta mudança é invisível e é a que mais importava: a lista de anomalias passou
a ter uma composição só, consumida pela seção e pela contagem do cabeçalho. Antes da feature, as
duas concordavam por coincidência, porque ambas eram concatenação simples; com o desconto, a
coincidência teria acabado no primeiro projeto com extração encerrada.

### empacotamento-e-verificacao

O quarto auxiliar segue o molde dos três anteriores e a suíte que o acompanha prova, caso a caso,
que a cópia produz o estado prometido. A diferença de método está em quem julga: aqui a suíte passa
pelo `readWorkspace` inteiro, porque o caso `terminal-e-estranha` só tem sentido contra as anomalias
que a camada herdada de fato produz. Julgar o eixo isolado provaria o que a suíte do domínio já
prova, e deixaria justamente o encontro sem prova.

### heranca-e-sincronia

Nada foi herdado, reaplicado ou carimbado nesta feature, e é esse o ponto. O componente registra
duas coisas: que o caminho do clone voltou a apontar para a origem real, o que devolveu o
verificador ao modo completo, e que os dois achados desta feature são dívida com a origem, escrita
onde a procedência já define o caminho de aposentadoria. A subseção de pendências existe para não
ser confundida com adaptação, e há suíte fixando exatamente isso.

## Preservadas

Vazia. Não há regra 🟢 extraída de código existente neste projeto.

## Modificadas

Vazia. Não há regra 🟢 extraída de código existente neste projeto.
