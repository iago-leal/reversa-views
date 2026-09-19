# Roadmap: vínculo entre spec e entrega, e conferências do onboarding

> Identificador: `010-vinculo-spec-e-conferencias`
> Data: `2026-09-19`
> Requirements: `_reversa_forward/010-vinculo-spec-e-conferencias/requirements.md`
> Confidência: 🟢 CONFIRMADO, 🟡 INFERIDO, 🔴 LACUNA

## 1. Resumo da abordagem

A feature não abre costura nova: entra pelas quatro que a 009 deixou. A sonda de pastas,
`src/probe/features.ts`, passa a ler mais dois arquivos por pasta, `legacy-impact.md` e
`onboarding.md`, e a distinguir o arquivo ausente do arquivo presente e não lido. Dois módulos
puros novos julgam o que ela leu: `src/domain/delivery-link.ts` extrai da coluna `Componente` de
todas as tabelas de impacto as células que declaram componentes, e `src/domain/conferences.ts` lê a
seção de registro de conferências. O histórico (`domain/history.ts`) ganha, por pasta, a
conferência e o estado da leitura do vínculo; o panorama (`domain/greenfield.ts`) passa a ligar
spec e pasta por dois caminhos, nome primeiro e declaração só para spec sem pasta homônima, e a
listar os componentes entregues sem spec.

O protocolo cresce por acréscimo, com campos opcionais ao fim de `HistoryEntry`, `ProjectHistory`,
`PlannedComponent` e `ProductPanorama`. A tela desenha a origem de cada ligação, o bloco "Entregues
sem spec" e a contagem de conferências, sempre em texto. A faixa de bloqueio e a situação do
histórico não mudam: a conferência pendente é contagem, e nunca razão de bloqueio (RN-07).

## 2. Princípios aplicados

Este projeto não tem `.reversa/principles.md`. Valem, como na 009, os invariantes do PRD
verificados por suíte.

| Princípio | Como a feature se relaciona | Status |
|-----------|------------------------------|--------|
| A extensão nunca escreve arquivo, em camada alguma | O vínculo e a conferência são lidos e declarados; nenhum `legacy-impact.md` ou `onboarding.md` é corrigido, completado ou reformatado. `tests/readonly-local.spec.ts` passa a varrer os dois módulos novos | respeita |
| A camada de leitura é pura: sem escrita, processo ou rede | Os módulos novos não importam `node:`; a sonda continua usando só `listNames`, `readText` e `resolveInside` do pacote herdado | respeita |
| Nada do host sobrevive ao pacote da tela | Os campos novos chegam à tela como tipos, pelo protocolo; os literais `legacy-impact.md` e `onboarding.md` e o teto de linhas vivem em `src/domain/limits.ts` | respeita |
| Leitura e despacho em camadas distintas | A conferência pendente não vira comando nem próxima ação: o painel só conta | respeita |
| Nada de vendorizado é editado sem adaptação declarada | Uma duplicação aceita: a chave de coluna do RF-07.3 (normalização, artigo e anotação final) é redeclarada localmente, porque o herdado só exporta a comparação de cabeçalho inteiro, `matchesHeader`, e a regra nova precisa achar colunas por nome em qualquer posição. `ImpactContract`, que lê só a primeira tabela, não é tocado | respeita, com uma duplicação declarada |
| O que a tela desenha é medido contra o que a leitura encontrou | "N de M conferências registradas" vem da contagem da leitura; o teto de linhas se declara quando corta | respeita |

## 3. Decisões técnicas

| ID | Decisão | Justificativa | Alternativas descartadas | Confidência |
|----|---------|----------------|--------------------------|-------------|
| D-01 | `readFeatureFolders()` passa a ler `legacy-impact.md` e `onboarding.md` de cada pasta e devolve, por pasta, `naoLidos`: os arquivos presentes na listagem e cujo `readText` voltou nulo. A listagem já é feita para o teste de diretório e é reaproveitada | RF-01 e RN-09: `readText` devolve nulo tanto para ausente quanto para acima do teto, e só a listagem separa os dois. Reaproveitá-la não custa leitura extra. Com cinquenta pastas, são no máximo cem arquivos novos | segunda sonda só para os dois arquivos; `stat` direto, que exigiria `node:fs` fora do herdado | 🟢 |
| D-02 | Tabela de impacto é a que tem, em qualquer posição, colunas cuja chave é `arquivo afetado` e `componente`. A chave de coluna é `normalizeCell` do herdado, sem artigo definido e sem anotação final entre parênteses, a regra do RF-07.3 redeclarada em `delivery-link.ts`. Todas as tabelas do arquivo são percorridas, e as linhas vêm por `cellsOf` | RN-01 e a resposta 5a: o esquema prescrito pelo `/reversa-coding` distingue a tabela de impacto da tabela de mapeamento. `findTable` para na primeira tabela e exige o cabeçalho inteiro, e a 002 do `financas-ali` tem seis | estender `findTable` no herdado; exigir o cabeçalho de cinco colunas na ordem; aceitar qualquer tabela com `Componente` | 🟢 |
| D-03 | Uma célula declara a spec `S` quando, após minúsculas e remoção de diacríticos, contém `S` delimitado à esquerda por início ou caractere fora de `[a-z0-9-]` e à direita por `.md`, fim ou caractere fora de `[a-z0-9-]`. A regra é aplicada contra a lista de specs lida pela sonda da 009 | RN-01: cobre as três formas medidas, o nome nu, o nome entre crases com extensão e várias specs por célula, e a prosa com caminho entre parênteses. A delimitação impede que `painel-do-processo-v2` declare `painel-do-processo` | tokenizar a célula; exigir o caminho `sdd/`; similaridade de nome | 🟢 |
| D-04 | Componente sem spec é a célula que, sem as crases ou o negrito que a envolvem por inteiro, casa `^[a-z0-9]+(-[a-z0-9]+)*$` e não é nome de spec. Uma palavra só basta | RN-04 e a resposta 4a: `assistente` precisa entrar; maiúscula, parênteses, espaço e extensão excluem "Tema", "(todos)", "Verificação local" e `docker-compose.yml` | exigir hífen; aceitar só entre crases; aceitar células com vários nomes | 🟢 |
| D-05 | O julgamento do vínculo é separado do histórico: `readDeliveryLinks(pastas)` produz, por pasta, as células de componente distintas, o número de tabelas de impacto e o estado da leitura (`lido`, `ausente`, `nao-lido`). `reading.ts` o chama uma vez e passa o resultado ao julgamento greenfield, e só o estado e o caminho entram no histórico | As células são insumo do cruzamento, e não informação que a tela desenhe: mandá-las pela carga incharia o protocolo com prosa. O histórico diz apenas se o vínculo foi lido, para a tela declarar vínculo parcial e abrir o arquivo | células no `HistoryEntry`; extração dentro de `greenfield.ts` a partir do texto cru | 🟢 |
| D-06 | O cruzamento em `panoramaOf()` faz duas passagens. A primeira é a da 009, por nome, e marca as specs com pasta homônima. A segunda liga, a cada spec **sem** pasta homônima, as pastas cujas células a declaram. Cada ligação guarda a origem, `nome` ou `declarada`, em `PlannedComponent.ligacoes`, e `pastas` continua a lista de todas as pastas ligadas | RN-02 e a resposta 1b: o casamento por nome tem precedência, e este repositório, em que toda spec tem pasta homônima, fica idêntico ao da 009. No `financas-ali`, todo vínculo vem da declaração | somar os dois caminhos para toda spec; declarar só quando nenhuma spec casa pelo nome em todo o projeto | 🟢 |
| D-07 | "Fora do plano" continua sendo a pasta que nenhuma ligação alcança, agora pelos dois caminhos (RN-03). A pasta que só declara specs com pasta homônima continua fora do plano | Consequência direta de D-06. As pastas 006 a 009 deste repositório continuam no grupo, como espera o cenário da 009 | tirar do grupo toda pasta que declare alguma spec | 🟢 |
| D-08 | `ProductPanorama.semSpec` lista cada componente sem spec com as pastas que o declaram e a situação e a marca da pasta mais avançada, pela mesma projeção e pela mesma regra de avanço de `componentOf()`, que passa a servir às duas listas. Não entra em `convergidos` nem no denominador | RN-04, RF-04 e RF-05: o denominador continua sendo o número de specs; o bloco tem frase de contagem própria | contar sem spec no denominador; calcular situação nova | 🟢 |
| D-09 | A seção de conferências é a de nível 2 cujo título, por `normalizeCell` e sem a numeração inicial, começa por `registro de conferencias`. Dentro dela, a primeira tabela com colunas de chave `data` e `resultado` é a de registro; `marco`, `item` e `observacao` são lidas pelo nome quando existem. Linha só de traços não é linha, pelo precedente do EC-5UH7 | RN-05, e o molde do RF-07.4: título reconhecido pelo começo, tabela reconhecida pelas colunas, nada por posição | posição fixa das colunas; qualquer tabela da seção; exigir o número "9" do título | 🟢 |
| D-10 | Uma linha é registrada quando `Data` e `Resultado` têm conteúdo diferente de traço isolado; o `Resultado` é exposto como escrito, sem classificação | RN-05: "não executável" e "10 conferem; 10 divergente" são registros. Classificar o resultado seria o painel julgando o teste | contar só resultados positivos; exigir data válida | 🟢 |
| D-11 | A conferência tem seis estados: `sem-registro` (onboarding ausente ou sem a seção), `vazio` (tabela sem linha), `lido`, `nao-reconhecido` (seção sem tabela com `Data` e `Resultado`, com anomalia `tabela-nao-reconhecida`), `nao-lido` (onboarding presente e acima do teto, declarado parcial) e `truncado` (linhas acima do teto `CONFERENCE_ROW_CAP`, cem) | RN-06 e RN-09: ausência e vazio não se confundem, e a seção não prescrita não gera anomalia. O teto de linhas segue o precedente de `SCOPE_ITEM_CAP` e limita a carga; a maior tabela medida tem vinte linhas | um estado só para "não lido"; sem teto de linhas | 🟡 |
| D-12 | As perdas do eixo viajam em `ProjectHistory.anomalias`, união local `DeliveryAnomalyCode` com `tabela-nao-reconhecida` e `artefato-da-entrega-nao-lido`, na forma comum `DisplayAnomaly`. `readingIntegrity()` passa a contá-las ao lado das do processo, do registro de bugs e do eixo greenfield | RF-11 e o precedente de D-19 da 009: a união herdada é fechada, e a forma comum já existe para isto. O código `tabela-nao-reconhecida` repete o nome do herdado de propósito, porque nomeia o mesmo defeito | acrescentar códigos ao herdado; anomalias dentro de cada entrada | 🟢 |
| D-13 | Os campos novos são opcionais e entram ao fim das estruturas: `HistoryEntry.vinculo?` e `HistoryEntry.conferencias?`, `ProjectHistory.anomalias?`, `PlannedComponent.ligacoes?`, `ProductPanorama.semSpec?`. A tela trata ausência como "não lido" e declara por frase, sem desenhar bloco vazio | RF-10: tela nova contra host antigo declara; tela antiga contra host novo ignora. Campo novo no topo da carga seria um eixo à parte, e o vínculo e a conferência são do histórico e do panorama | campo `vinculo` no topo de `SetProcessData`; campos obrigatórios | 🟢 |
| D-14 | A conferência pendente não entra em `blockingReasons()`, que não muda. Uma suíte prende a regra: pasta convergida com linhas pendentes não produz razão | RN-07 e a resposta 2a: a faixa continua reservada ao que o processo prescreve | razão de bloqueio sempre; razão só na falta de outras | 🟢 |
| D-15 | Na tela, cada pasta ligada a um componente mostra a origem em texto ("pelo nome", "declarada"). A pasta declarada abre o `legacy-impact.md` dela pela mensagem `openFile` existente; a contagem de conferências no histórico abre o `onboarding.md` | RF-13 e o RNF de acessibilidade: origem em texto, nunca só cor. `openFile` já contém o caminho pela `resolveInside` herdada, e não há mensagem nova | cor ou ícone para a origem; mensagem nova de abertura | 🟢 |
| D-16 | O bloco "Entregues sem spec" fica em `PanoramaSection.tsx`, entre os grupos de componentes e "Fora do plano", com a ordem dada por `panoramaView()`, que ganha a lista ordenada por nome. Sem componente sem spec, o bloco é uma frase | RF-04 e o remédio de D-15 da 009: ordem decidida num lugar só | ordenar no componente; bloco só quando houver itens | 🟢 |
| D-17 | O resumo consultável (`summaryText()`) ganha, no bloco do panorama, uma linha por componente sem spec e, no bloco das entregas, a contagem de conferências por pasta, compostas pela mesma função pura | RF-12: documento e cópia continuam idênticos | função própria para cada saída | 🟢 |
| D-18 | Os estados que este repositório não produz são alcançados por `scripts/estragar-vinculo.js`, que copia o workspace para pasta temporária e aplica um caso: `declarada` (renomeia as specs da cópia e declara os nomes novos nos `legacy-impact.md`), `sem-spec`, `conferencias` (seção com vinte linhas, duas registradas), `conferencias-sem-tabela` e `impacto-grande` (acima do teto de bytes) | RF-14 e o precedente de `estragar-greenfield.js` e `estragar-registro.js`: nem adoecer o projeto de verdade, nem versionar um projeto doente | novos casos em `estragar-greenfield.js`, que já tem seis e trata de outro eixo; fixtures versionadas | 🟢 |
| D-19 | As suítes de domínio usam fixtures textuais escritas com as formas medidas em 2026-09-19, e não o `financas-ali` vivo | O `financas-ali` muda: o critério do RF-07 fala em "2 de 20", e o disco dele já dava 3 de 20 às 15h47 do mesmo dia, depois do commit `38e6cc5`. Uma suíte que lesse o projeto vivo mudaria de veredito sem mudança de código | ler o `financas-ali` em teste; copiar os arquivos inteiros, com dado de terceiro | 🟢 |

## 4. Premissas

Nenhuma premissa herdada de `[DÚVIDA]`: as cinco foram decididas na sessão de esclarecimento de
2026-09-19, registrada na seção 9 do `requirements.md`.

Há uma divergência de medida a registrar sem mudar o requisito. O critério do RF-07 ("2 de 20
conferências registradas") descreve o estado do `financas-ali` no momento do insumo; hoje a 002
daquele projeto tem três linhas registradas, e o painel mostrará "3 de 20". As suítes fixam o
estado do insumo por fixture (D-19), e a conferência manual do `onboarding.md` usa o número do dia.

## 5. Delta arquitetural

Como na 009, não há `architecture.md`: os componentes são as cinco specs de `_reversa_sdd/sdd/`,
corrigidas pelos adendos 001 a 009 e pelos adendos de bug.

| Componente | Arquivo de origem no legado | Tipo de mudança | Resumo |
|------------|------------------------------|-----------------|--------|
| leitura-do-processo | `_reversa_sdd/sdd/leitura-do-processo.md`, adendos 006 e 009 | regra-alterada | `src/probe/features.ts` lê `legacy-impact.md` e `onboarding.md` e declara `naoLidos`; `src/domain/limits.ts` ganha os dois literais e `CONFERENCE_ROW_CAP` |
| leitura-do-processo | `_reversa_sdd/sdd/leitura-do-processo.md`, adendos de bug DTLI e 5UH7 | componente-novo | `src/domain/delivery-link.ts` (tabelas de impacto, células, declaração de spec, componente sem spec) e `src/domain/conferences.ts` (seção, tabela, linhas, estados) |
| leitura-do-processo | `_reversa_sdd/addenda/009-greenfield-e-features-do-prd.md` | regra-alterada | `domain/history.ts` anexa `vinculo` e `conferencias` a cada entrada e junta as anomalias do eixo; `domain/greenfield.ts` liga por nome e por declaração e produz `semSpec`; `domain/types.ts` ganha as formas novas e a união `DeliveryAnomalyCode` |
| ponte-e-host | `_reversa_sdd/sdd/ponte-e-host.md`, adendos 002 e 009 | contrato-alterado | Campos opcionais ao fim de quatro estruturas da carga `setProcess`; `host/reading.ts` chama `readDeliveryLinks()` no mesmo `try` e passa o resultado a `readGreenfield()` |
| painel-do-processo | `_reversa_sdd/sdd/painel-do-processo.md`, adendos 006 e 009 | regra-alterada | `PanoramaSection.tsx` com origem das ligações e bloco "Entregues sem spec"; `HistorySection.tsx` com a contagem de conferências; `panorama-view.ts`, `labels.ts`, `summary.ts` e `integrity.ts` estendidos; `blocking.ts` intocado e preso por suíte |
| empacotamento-e-verificacao | `_reversa_sdd/sdd/empacotamento-e-verificacao.md`, adendos 005 e 009 | regra-alterada | `scripts/estragar-vinculo.js` novo; README com os cinco casos no gate visual; suítes de fronteira, protocolo, desempenho e construção estendidas |
| heranca-e-sincronia | `_reversa_sdd/sdd/heranca-e-sincronia.md` | nenhuma | Nada de vendorizado é tocado; a duplicação da chave de coluna (D-02) fica do lado local |

## 6. Delta no modelo de dados

- Resumo das mudanças: nada persistente muda. Em memória, cada entrada do histórico ganha o estado
  da leitura do vínculo e o registro de conferências; o histórico ganha a lista de anomalias do eixo;
  cada componente planejado ganha as ligações com origem; o panorama ganha os componentes sem spec.
  Uma estrutura intermediária, fora da carga, leva as células de componente de cada pasta da
  leitura ao julgamento greenfield.
- Detalhe completo em: `_reversa_forward/010-vinculo-spec-e-conferencias/data-delta.md`

## 7. Delta de contratos externos

| Contrato | Tipo | Arquivo de detalhe |
|----------|------|--------------------|
| Canal de mensagens entre a webview e o host | arquivo (mensagens `postMessage` tipadas) | `_reversa_forward/010-vinculo-spec-e-conferencias/interfaces/protocolo-webview.md` |

O `legacy-impact.md` e o `onboarding.md` são saída dos skills do Reversa, e não contrato desta
extensão; o que o painel faz com eles está nas RN-01, RN-04 e RN-05 e no `data-delta.md`.

## 8. Plano de migração

n/a para dados: nada persistente muda.

Para o protocolo, a regra de acréscimo da 002:

1. A tela anterior ignora os campos novos.
2. A tela nova, diante de carga sem os campos, declara no panorama "vínculo declarado não lido" e no
   histórico "conferências não lidas", sem desenhar bloco vazio.
3. `tests/host-protocol.spec.ts` continua contando dez campos no topo da carga, e passa a verificar
   que os campos novos estão ao fim de cada estrutura e são opcionais nos tipos.

## 9. Riscos e mitigações

| Risco | Impacto | Probabilidade | Mitigação |
|-------|---------|---------------|-----------|
| A delimitação de D-03 aceita caminho que não é de spec, como `interfaces/ajustes.md`, e liga a pasta à spec `ajustes` | médio | baixo | Só a coluna `Componente` das tabelas de impacto é lida, e nela o caminho de interface não aparece nas formas medidas. O caso entra na suíte como comportamento aceito e documentado |
| Um agente escreve a coluna com outro nome (`Módulo`, `Spec`) e o vínculo some sem aviso | médio | médio | O estado `lido` com zero tabelas de impacto é distinto de `ausente`; a tela diz "nenhuma tabela de impacto reconhecida" na pasta. Tolerância nova exige caso concreto e adendo, como fixa o RF-07.3 |
| Cem arquivos a mais empurram a leitura acima de 200 ms | médio | baixo | `tests/desempenho-referencia.spec.ts` mede com este repositório, e a medida entra no `legacy-impact.md` |
| O pacote da tela cruza a guarda de 60 % | médio | baixo | Dois blocos de tela e rótulos; `tests/webview-build.spec.ts` mede e o número vai ao lado do teto |
| O card de impacto da feature ativa continua lendo só a primeira tabela, pelo `ImpactContract` herdado | baixo | alto | Fora do escopo desta feature, que trata do panorama; registrado para o ciclo de bugs, sem tocar o herdado aqui |
| O número de conferências do `financas-ali` muda antes da conferência manual | baixo | alto | D-19: as suítes usam fixture; o `onboarding.md` pede o número do dia |

## 10. Critério de pronto

- [ ] Todas as ações do `actions.md` marcadas `[X]`
- [ ] `cross-check.md` (se executado) sem CRITICAL nem HIGH
- [ ] `regression-watch.md` gerado
- [ ] Re-extração reversa executada e sem regressão vermelha (recomendado, não obrigatório)
- [ ] Neste repositório, panorama e "Fora do plano" idênticos aos da 009, e o bloco "Entregues sem
      spec" dizendo por frase que não há componente sem spec
- [ ] No `financas-ali`, cinco specs ligadas por declaração, três componentes sem spec e a 002
      `convergida` com a contagem de conferências do dia
- [ ] `tests/host-boundaries.spec.ts`, `tests/readonly-local.spec.ts` e
      `tests/webview-boundaries.spec.ts` verdes com os módulos novos varridos
- [ ] Pacote da tela abaixo de 409.600 bytes e da guarda de 60 %, com a medida escrita
- [ ] Os cinco casos de `scripts/estragar-vinculo.js` conferidos no preview e listados no README

## 11. Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-09-19 | Versão inicial gerada por `/reversa-plan` | reversa |
