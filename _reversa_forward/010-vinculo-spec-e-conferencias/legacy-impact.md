# Impacto no legado: 010-vinculo-spec-e-conferencias

**Data:** 2026-09-19
**Feature:** `010-vinculo-spec-e-conferencias`
**Cenário:** greenfield.

Feature greenfield, sem legado pré-existente. Âncora: `prd.md` + specs SDD.

Não há extração de `/reversa` neste projeto: `_reversa_sdd/` não tem `architecture.md` nem
`domain.md`, e o contexto vem de `_reversa_sdd/prd.md` com as cinco specs de `_reversa_sdd/sdd/`.
Por isso não há regra 🟢 extraída de código existente para preservar ou quebrar, e as seções
"Preservadas" e "Modificadas" ficam vazias.

O código anterior foi escrito pelo próprio ciclo forward, nas features 001 a 009. Como nos rastros
anteriores, a tabela distingue arquivo criado (`componente-novo`) de arquivo anterior que ganhou
comportamento (`regra-nova`), arquivo anterior cujo comportamento mudou (`regra-alterada`) e
contrato da ponte (`delta-de-contrato-externo`). Dezoito arquivos foram criados, doze deles fixturas
de um mesmo diretório e três suítes, e trinta e três foram modificados; a lista ação por ação está
em `progress.jsonl`.

**Execução.** Quarenta e quatro ações concluídas, nenhuma falha. A T044 tem uma linha `corrected`
no rastro: a medida de desempenho revelou que o panorama compilava a expressão de `declaresSpec`
para cada par de spec e célula, cerca de 30 ms de julgamento puro no workspace de referência. A
expressão passou a ser compilada uma vez por spec (`declarerOf`), e o julgamento caiu para cerca
de 2 ms. A mesma medida, única, oscilava acima do teto sob a suíte inteira em paralelo, e passou a
tomar o menor de três tempos, com o motivo escrito no teste.

**Medidas.** Pacote da tela em 212.316 B, 51,8 % do teto de 409.600 B e 33.444 B abaixo da guarda
de 60 %; a feature custou 5.694 B. Leitura da referência com os dois arquivos a mais por pasta, no
teto de cinquenta pastas: cerca de 50 ms isolada, de 130 a 155 ms sob a suíte paralela, contra o
teto de 200 ms. Leitura real deste repositório: cerca de 52 ms.

**Política de edição do legado no momento da execução.** `.reversa/reversa-config.json` declarava
`"allowLegacyEdits": true` com `"allowedPaths": []`. Liberação irrestrita: todo caminho do projeto
estava gravável, e nenhuma escrita foi recusada por política. O arquivo de configuração não foi
criado nem alterado por esta execução.

## Arquivos afetados

| Arquivo afetado | Componente | Tipo | Severidade | Justificativa |
|---|---|---|---|---|
| `src/domain/delivery-link.ts` | leitura-do-processo | componente-novo | CRITICAL | O vínculo entre spec e entrega (RN-01 a RN-04): todas as tabelas de impacto de um `legacy-impact.md`, reconhecidas pelas colunas `Arquivo afetado` e `Componente` em qualquer posição; declaração por delimitação (D-03), com `painel-do-processo-v2` sem declarar `painel-do-processo`; componente sem spec só quando a célula inteira é um nome kebab; leitura única por pasta, com estado `lido`, `ausente` ou `nao-lido`. `declarerOf` compila a expressão uma vez por spec. |
| `src/domain/conferences.ts` | leitura-do-processo | componente-novo | HIGH | O registro de conferências (RN-05 a RN-07): primeira seção de nível dois cujo título, sem número, começa por "registro de conferências"; primeira tabela com `Data` e `Resultado`; linha registrada quando as duas células dizem algo além de traço; seis estados; teto de cem linhas declarado; nada classificado, o resultado sai como foi escrito. |
| `src/domain/limits.ts` | leitura-do-processo | regra-nova | LOW | Os nomes `legacy-impact.md` e `onboarding.md` e o teto de linhas do registro, no mesmo lugar dos outros literais do pipeline, com a duplicação declarada da chave de coluna herdada. |
| `src/domain/types.ts` | ponte-e-host | delta-de-contrato-externo | HIGH | Estado do vínculo, registro de conferências, ligação com origem, componente sem spec e anomalia da entrega; todos entram como campos opcionais ao FIM de `HistoryEntry`, `ProjectHistory`, `PlannedComponent` e `ProductPanorama`. |
| `src/domain/history.ts` | leitura-do-processo | regra-nova | HIGH | Cada entrada ganha `vinculo` e `conferencias`, e o histórico ganha `anomalias`, na ordem das entradas. A situação da pasta não muda por causa da conferência (RN-07). |
| `src/domain/greenfield.ts` | leitura-do-processo | regra-alterada | CRITICAL | O panorama passou a ter duas passagens: a do nome, com precedência, e a da declaração, só para spec sem pasta homônima (RN-02). Cada ligação diz a origem; os componentes sem spec saem em `semSpec`, fora do denominador; a projeção de situação foi extraída para `projectionOf`, comum aos dois. Neste repositório o panorama segue idêntico ao da 009. |
| `src/probe/features.ts` | leitura-do-processo | regra-nova | HIGH | A sonda lê os dois arquivos novos de cada pasta pelas funções herdadas, só quando a listagem os mostra; o arquivo listado e não lido vai para `naoLidos`, o que distingue ausência de perda. |
| `src/host/reading.ts` | ponte-e-host | regra-nova | MEDIUM | O vínculo é extraído UMA vez, depois das pastas, dentro do mesmo `try`, e passa ao histórico e ao panorama (D-05). A dependência é injetável para as suítes. |
| `src/host/protocol.ts` | ponte-e-host | delta-de-contrato-externo | LOW | Só o comentário: os campos da 010 entram dentro de estruturas existentes, e o topo de `SetProcessData` mantém os campos que já tinha. |
| `src/webview/ui/PanoramaSection.tsx` | painel-do-processo | regra-nova | HIGH | Cada ligação com a origem em texto e, se declarada, o `legacy-impact.md` clicável; o bloco "Entregues sem spec" entre as planejadas e "Fora do plano", com as três frases de vazio: host anterior, vínculo parcial e nenhum componente sem spec. |
| `src/webview/ui/HistorySection.tsx` | painel-do-processo | regra-nova | MEDIUM | "N de M conferências registradas" ao lado da situação, abrindo o onboarding; nota do vínculo não lido ou sem tabela reconhecida. |
| `src/webview/domain/panorama-view.ts` | painel-do-processo | regra-nova | MEDIUM | `semSpec` ordenado por nome e `vinculoParcial`, com ausência distinta de lista vazia. |
| `src/webview/domain/labels.ts` | painel-do-processo | regra-nova | LOW | Rótulos da origem da ligação e dos seis estados do registro, totais como os anteriores. |
| `src/webview/domain/summary.ts` | painel-do-processo | regra-nova | MEDIUM | O resumo consultável ganha a linha dos componentes sem spec no panorama e o bloco de conferências por entrega, pela mesma função pura (RF-12). |
| `src/webview/domain/integrity.ts` | painel-do-processo | regra-nova | LOW | As anomalias da entrega somam na integridade; host sem o campo contribui com nada. |
| `src/webview/ui/App.tsx` | painel-do-processo | regra-nova | LOW | As anomalias do histórico entram na seção de anomalias depois das do eixo greenfield. |
| `src/webview/theme/theme.css` | painel-do-processo | regra-nova | LOW | Estilos da ligação, da marca "sem spec" e da contagem de conferências, com quebra em 300 px. |
| `scripts/estragar-vinculo.js` | empacotamento-e-verificacao | componente-novo | MEDIUM | Cinco casos por cópia adoecida fora do repositório: `declarada`, `sem-spec`, `conferencias`, `conferencias-sem-tabela` e `impacto-grande` (RF-14). |
| `README.md` | empacotamento-e-verificacao | regra-nova | LOW | Cinco linhas novas na tabela de estados do preview. |
| `tests/domain-delivery-link.spec.ts` | leitura-do-processo | componente-novo | MEDIUM | Extração, delimitação, componente sem spec e as formas medidas no `financas-ali`. |
| `tests/domain-conferences.spec.ts` | leitura-do-processo | componente-novo | MEDIUM | Os seis estados, as anomalias e o teto de linhas. |
| `tests/preview-vinculo.spec.ts` | empacotamento-e-verificacao | componente-novo | MEDIUM | Cada caso do auxiliar produz de fato o estado prometido, e a origem sai intocada. |
| `tests/fixtures/vinculo/` (12 arquivos) | leitura-do-processo | componente-novo | LOW | LEIA-ME, cinco impactos e seis onboardings sintéticos, um por forma ou desvio. |
| `tests/helpers/reversa-fixtures.ts` | empacotamento-e-verificacao | regra-nova | LOW | Fábricas das estruturas novas do histórico e do panorama. |
| `tests/desempenho-referencia.spec.ts` | empacotamento-e-verificacao | regra-nova | MEDIUM | Medida no teto de pastas com os dois arquivos a mais, menor de três sob a suíte paralela, medida escrita ao lado do teto. |
| `tests/webview-build.spec.ts` | empacotamento-e-verificacao | regra-nova | LOW | A medida do pacote depois da 010, ao lado da guarda. |
| `tests/host-protocol.spec.ts` | ponte-e-host | regra-nova | MEDIUM | Os campos novos são os últimos e opcionais nas suas estruturas; o topo da carga é comparado pela lista exata. |
| `tests/host-boundaries.spec.ts`, `tests/readonly-local.spec.ts` | ponte-e-host | regra-nova | MEDIUM | Os módulos novos entram na varredura de somente leitura, e o host fica proibido de escrever os dois nomes de arquivo. |
| `tests/host-reading.spec.ts`, `tests/probe-features.spec.ts`, `tests/domain-history.spec.ts`, `tests/domain-greenfield-panorama.spec.ts` | leitura-do-processo | regra-nova | MEDIUM | Leitura única do vínculo, contagem de `readText`, anomalias em ordem e as duas passagens, inclusive a identidade deste repositório com a 009. |
| `tests/webview-*.spec.ts(x)` (7 suítes, além da de build) | painel-do-processo | regra-nova | MEDIUM | Faixa sem razão nova por conferência pendente, rótulos, vista do panorama, seção, cartões de progresso, resumo e integridade. |

## Diff conceitual por componente

### leitura-do-processo

O componente ganhou um quarto território, e o ganhou pela divisão de sempre: a sonda olha, o
julgamento decide. O que este território tem de próprio é a fonte. O vínculo entre spec e entrega
não é declarado pelo pipeline em lugar nenhum; ele é inferido da coluna `Componente` das tabelas de
impacto que o `/reversa-coding` escreve. Por isso a leitura é tolerante na forma (qualquer posição
de coluna, várias tabelas, várias specs por célula) e estrita no casamento: a delimitação é o que
impede um nome de declarar outro que o contém.

A precedência do nome preserva o que a 009 já mostrava. Uma spec com pasta homônima liga-se a ela e
a nenhuma outra, e só a spec órfã procura quem a declara. Neste repositório, onde toda spec tem a
sua pasta, o panorama saiu idêntico; no `financas-ali`, cinco specs deixaram de ser planejadas e
três componentes apareceram sem spec.

O registro de conferências é prática do agente, não prescrição do processo, e o tom do código segue
isso: seção ausente é estado nomeado, nunca anomalia. Só a seção presente e ilegível é defeito a
declarar. O resultado de cada linha sai como foi escrito, porque classificá-lo seria o painel
julgando o teste.

### ponte-e-host

O contrato cresceu por acréscimo, agora DENTRO das estruturas existentes: nenhum campo novo no topo
de `SetProcessData`. Campo ausente continua significando host anterior, e a tela o diz em frase
própria. O host ganhou uma única chamada, a extração do vínculo, feita uma vez e compartilhada pelo
histórico e pelo panorama.

### painel-do-processo

Duas informações novas, cada uma ao lado da pergunta que responde: a origem da ligação e o bloco
"Entregues sem spec" no panorama, a contagem de conferências no histórico. As três são texto, nunca
só cor. A conferência pendente não entra na faixa de bloqueio nem muda a situação da pasta: é eixo
ao lado, e uma pasta convergida com linhas pendentes continua convergida.

### empacotamento-e-verificacao

O auxiliar que adoece o vínculo segue o molde dos anteriores, com uma suíte que prova, caso a caso,
que a cópia produz o estado prometido. A medida de desempenho foi a promessa que exigiu trabalho: no
teto de pastas, com quase cem arquivos a mais, ela pegou um custo evitável no julgamento do panorama
antes de ele chegar a um projeto real.

## Preservadas

Vazia. Não há regra 🟢 extraída de código existente neste projeto.

## Modificadas

Vazia. Não há regra 🟢 extraída de código existente neste projeto.
