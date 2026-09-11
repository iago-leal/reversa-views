# Roadmap: greenfield e features do PRD

> Identificador: `009-greenfield-e-features-do-prd`
> Data: `2026-09-11`
> Requirements: `_reversa_forward/009-greenfield-e-features-do-prd/requirements.md`
> Confidência: 🟢 CONFIRMADO, 🟡 INFERIDO, 🔴 LACUNA

## 1. Resumo da abordagem

A feature entra pelas mesmas costuras que a 006 abriu e a 008 reforçou, e não pede arquitetura
nova. A primeira é o par sonda e domínio do código local: `src/probe/greenfield.ts` olha o disco e
`src/domain/greenfield.ts` julga o que ele viu, pelo corte que `probe/bugs.ts` e `domain/bugs.ts`
já praticam. A segunda é o protocolo, que cresce por acréscimo e ganha o campo `greenfield` em
`setProcess`. A terceira é o cartão recolhível, onde entram dois componentes novos, cada um
alimentado por função pura: `PanoramaSection.tsx` e `OriginSection.tsx`. A quarta é a faixa de
bloqueio, cuja função passa a receber o eixo greenfield como terceiro argumento.

O que é genuinamente novo são duas leituras. A primeira deriva o estágio da pipeline de
`/reversa-new` dos artefatos físicos em `_reversa_sdd/`, e trata o campo `newproject_progress` de
`state.json` como metadado informativo, que só entra para declarar divergência. A segunda cruza as
specs de `_reversa_sdd/sdd/` com o histórico que `domain/history.ts` já produz, por igualdade exata
de nome, e assim responde, sem inventar autoridade nova, o que está planejado, o que está em curso,
o que foi entregue e o que ficou fora do plano. O bloco de escopo do PRD entra como prosa listada,
sem casamento e sem situação, e é lido por leitor restrito a uma seção e a seus itens de topo.

## 2. Princípios aplicados

Este projeto não tem `.reversa/principles.md`. O que funciona como princípio aqui são os invariantes
do PRD, verificados por suíte, e é contra eles que a feature se mede.

| Princípio | Como a feature se relaciona | Status |
|-----------|------------------------------|--------|
| A extensão nunca escreve arquivo, em camada alguma | Ler a pipeline greenfield e as specs não grava nada, não corrige metadado divergente e não completa estágio faltante: onde encontra desvio, declara. `tests/readonly-local.spec.ts` passa a varrer os dois módulos novos | respeita |
| A camada de leitura é pura: sem escrita, sem execução de processo, sem rede | Os dois módulos novos não importam módulo de plataforma algum e leem pelas três funções que a sonda herdada exporta, `listNames`, `readText` e `resolveInside` | respeita |
| Nada do host sobrevive ao pacote da tela | O eixo greenfield chega à tela como tipo, pelo protocolo. Os nomes dos artefatos e da pasta `sdd` são literais de `src/domain/limits.ts`, jamais do host, e `tests/host-boundaries.spec.ts` segue vigiando | respeita |
| Leitura e despacho em camadas distintas | O bloco não roda agente algum. A faixa nomeia o estágio, o próximo agente e o comando, e quem o roda é o mantenedor | respeita |
| Nada de vendorizado é editado sem adaptação declarada | Duas consequências aceitas, ambas com precedente na 008: os literais dos artefatos são redeclarados no código local, e os códigos de anomalia do eixo vivem em união própria, fora da união fechada do herdado | respeita, com duas duplicações declaradas |
| O que a tela desenha é medido contra o que a leitura encontrou | A contagem "N de M componentes planejados convergidos" vem da leitura, e a lista desenhada é conferida contra ela; o teto de cinquenta specs se declara quando corta | respeita |

## 3. Decisões técnicas

| ID | Decisão | Justificativa | Alternativas descartadas | Confidência |
|----|---------|----------------|--------------------------|-------------|
| D-01 | A leitura se divide em `src/probe/greenfield.ts`, que olha o disco, e `src/domain/greenfield.ts`, que julga, reutilizando `listNames`, `readText` e `resolveInside` do pacote herdado | É o corte que a casa já faz entre olhar e decidir, e o que mantém `node:fs` em um arquivo só do repositório | um módulo único; ler de dentro de `probe/features.ts`; tocar `snapshot.ts` herdado para que a sonda vendorizada lesse os artefatos | 🟢 |
| D-02 | O estágio físico sai da presença dos artefatos, na ordem `newproject-brief.md`, `ideation.md`, `personas.md`, `prd.md`, `sdd/*.md`, e é o maior contíguo presente. Um buraco na sequência não avança o estágio e vira anomalia | RN-01: a detecção por artefato é resistente a agente que esquece de atualizar metadado, e é a mesma filosofia que `/reversa-requirements` aplica ao ciclo forward | confiar no `stage` do metadado; considerar o maior artefato presente, ignorando buracos | 🟢 |
| D-03 | `newproject_progress` é lido de `snapshot.stateJson` pelo domínio local, com `parseJsonSafe`, `asRecord`, `asString` e `asStringList` do pacote herdado; campo ausente, tipo errado ou JSON inválido resultam em metadado ausente, nunca em falha | O leitor herdado `StateContract` não conhece o campo, e o texto cru do `state.json` já viaja no snapshot: ler dali não custa segunda passagem no disco nem adaptação no vendorizado | estender `StateContract` no herdado; segunda leitura do `state.json` pela sonda local | 🟢 |
| D-04 | A divergência entre estágio físico e metadado é decidida por conjuntos de tokens aceitos por estágio (RN-02), e não por igualdade: cada estágio físico aceita o agente que o produziu e o próximo, e o estágio `especificado` aceita `spec-sdd`, `done` e qualquer `forward-*` | No modo guiado o `stage` só avança após o CONTINUAR do usuário, e ficar um passo atrás do disco é estado normal, não defeito. Igualdade estrita acusaria anomalia em todo projeto saudável entre dois checkpoints | igualdade estrita; ignorar o metadado de vez | 🟢 |
| D-05 | O cenário do projeto sai da regra de âncora de `/reversa-coding`: legado quando há `architecture.md` e `domain.md`, greenfield quando há `prd.md` e ao menos uma spec, misto quando ambos, sem âncora quando nenhum | RN-03 fixa a regra, e ela já é a que os agentes aplicam; inventar outra criaria segunda autoridade sobre o que é um projeto | cenário só pelo metadado `mode`; cenário pela presença de `newproject-brief.md` | 🟢 |
| D-06 | As features planejadas são as specs de `_reversa_sdd/sdd/`, identificadas pelo nome do arquivo sem `.md`; o campo `Status` de cada spec não é lido | RN-04: o `Status` das cinco specs deste projeto ainda diz "rascunho" com as cinco entregues, e ler um campo que ninguém atualiza seria desenhar mentira com selo de verdade. A situação vem do cruzamento com o histórico | ler o `Status` da spec; ler a lista `decisions.decomposicao` do metadado, que não existe em todo projeto | 🟢 |
| D-07 | O cruzamento spec e pasta é por igualdade exata do nome da spec com o `nomeCurto` da entrada do histórico, após minúsculas e remoção de diacríticos; o que não casa de um lado é "planejada", do outro é "fora do plano" | Resposta 5a da sessão de esclarecimento. Similaridade parcial casaria `painel-do-processo` com uma futura `painel-do-processo-v2`, e um falso par é pior que um par faltante declarado | prefixo; distância de edição; casamento manual num arquivo de configuração | 🟢 |
| D-08 | A situação de cada componente é projeção da situação do histórico: `convergida` fica `convergida`; `entregue-sem-adendo` vira `entregue`; `em-aberto` e `sem-acoes` viram `em-andamento`; sem pasta é `planejada`. A marca (`ativa`, `pausada`) viaja ao lado, sem se misturar | RN-06 e o precedente de D-19 da feature 006: situação e marca são dois eixos, e fundir os dois obriga a escolher qual verdade contar | quatro situações novas calculadas do zero; ler `actions.md` de novo | 🟢 |
| D-09 | A contagem do cartão é "N de M componentes planejados convergidos", onde M são as specs lidas e N as convergidas; a barra reutiliza `ProgressBar` | RN-07 fixa a métrica, e "convergida" é o único estado que o histórico já chama de encerrado com adendo. Entregue sem adendo não conta porque a extração ainda não a absorveu | contar entregues; contar ações fechadas somadas | 🟢 |
| D-10 | O escopo do PRD é lido por leitor restrito local: acha a seção de nível dois cujo título normalizado contém "escopo" e não contém "não-objetivos" nem "out", pega os itens de topo da lista, retira o selo de confidência, nomeia pelo texto antes do primeiro dois-pontos ou pela primeira frase, e trata parágrafo em negrito como rótulo de grupo. `splitSections` do herdado serve para achar a seção, se a normalização do título couber; senão a busca fica local | RN-14 fixa a leitura, e o PRD deste projeto tem exatamente essa forma na linha 60. O leitor é restrito de propósito: não interpreta Markdown, só reconhece uma seção e seus itens. Seção ausente é anomalia `escopo-do-prd-nao-encontrado`; PRD ausente não é anomalia | interpretador de Markdown completo; ler o escopo do metadado, que não o guarda; casar item do escopo com pasta de feature, que RN-04 proíbe | 🟡 |
| D-11 | Só dois corpos são lidos: `newproject-brief.md`, para a linha de resumo, e `prd.md`, para o escopo; `ideation.md`, `personas.md` e as specs são apenas listados, e cada leitura obedece ao `REVERSA_FILE_CAP` de 256 KiB do herdado | RF-22 e o requisito não funcional de desempenho: o teto de 200 ms de leitura e julgamento não sobrevive a abrir cinco specs e três documentos longos a cada leitura. Um arquivo acima do teto é declarado truncado, não lido pela metade | ler as specs para o `Status`; ler `ideation.md` para o resumo | 🟢 |
| D-12 | A linha de resumo vem, nesta ordem, da primeira frase da seção "Ideia original" do brief, do campo `brief` do metadado, e de nada | RF-06 e D-18 da feature 006, que já derivou o resumo do histórico em três passos com a mesma economia | só do metadado; do título do PRD | 🟢 |
| D-13 | O eixo viaja como campo novo `greenfield` de `SetProcessData`, por acréscimo, e o host o monta dentro do mesmo `try` de `reading.ts` em que já montam histórico e bugs | Regra do contrato fixada na feature 002: acrescentar é permitido, renomear e remover não. Campo ausente na tela é "leitura não realizada", nunca projeto sem greenfield (RN-08). A suíte de protocolo passa a contar dez campos | comando de host próprio; segundo `setProcess`; campo dentro de `process`, que é autoridade do herdado | 🟢 |
| D-14 | `SECTION_NAMES` cresce para onze: `panorama` entra depois de `decomposition` e `origem` depois de `discovery`; `DEFAULT_COLLAPSED` ganha `origem`; `sections.ts` não muda | RF-13 e RF-14 fixam ordem e recolhimento, e a resposta 3c da sessão de esclarecimento pôs o panorama antes do histórico. A ordem é declarada em um arquivo só, e `tests/webview-sections.spec.ts` lê o documento contra ele | escrever a ordem nos componentes; um cartão só com as duas coisas | 🟢 |
| D-15 | Ordem, agrupamento e destaque do panorama saem de uma função só, `panoramaView()` em `src/webview/domain/panorama-view.ts`: grupos `em-andamento` (ativa primeiro), `planejada`, `entregue`, `convergida`, e nome dentro de cada grupo | Remédio de D-14 da feature 007, aplicado antes de o defeito nascer: selecionar num lugar e exibir noutro faz a lista certa aparecer na ordem errada | ordenar no componente; ordenar na camada de leitura | 🟢 |
| D-16 | O bloco "Escopo declarado no PRD" é recolhível dentro do cartão, fechado por padrão, e o estado é do componente, não preferência guardada | Precedente de D-07 da feature 008 e D-17 da 003: o que se expande para olhar agora não é escolha a sobreviver ao painel. O escopo é longo, e aberto por padrão empurraria os componentes para fora da primeira tela | terceira preferência guardada; sempre aberto; cartão separado | 🟢 |
| D-17 | `blockingReasons()` passa a receber o eixo greenfield como terceiro argumento, e emite razão quando o cenário é greenfield e o estágio físico está antes de `especificado`, nomeando estágio, próximo agente e o comando do agente que falta, `/reversa-<agente>` (reconciliado na execução: retomar a pipeline é rodar o agente ausente, e para PRD sem spec RF-16 exige `/reversa-spec-sdd`; a razão também exige que a pipeline tenha começado, para que projeto legado e projeto sem artefato algum não a produzam) | Resposta 4a da sessão: pipeline greenfield incompleta bloqueia o projeto inteiro, com ou sem feature ativa, porque sem PRD e sem spec não há âncora para `/reversa-coding`. O precedente é D-08 da feature 008, que já pôs o registro ao lado do processo em vez de dentro dele | ler o eixo de dentro da função; faixa própria do cartão de origem; só avisar no cartão | 🟢 |
| D-18 | Os literais `newproject-brief.md`, `ideation.md`, `personas.md`, `prd.md`, `sdd`, `architecture.md`, `domain.md`, e os tetos `SPEC_CAP` e `SCOPE_ITEM_CAP`, ambos cinquenta, ficam em `src/domain/limits.ts` | O módulo existe para o número escrito no ponto de uso não divergir depois. Os literais duplicam o que os skills do Reversa escrevem, e a duplicação é aceita por viver em exatamente um lugar do lado local | literais na sonda; importar do herdado, que não os conhece | 🟢 |
| D-19 | Os códigos de anomalia do eixo vivem em união local, `GreenfieldAnomalyCode`, com a forma comum `DisplayAnomaly` que a seção de anomalias já recebe, e `readingIntegrity()` passa a contá-los ao lado dos do processo e do registro de bugs | Precedente de D-04 da feature 008: `AnomalyCode` é união fechada em arquivo vendorizado, e a forma comum já foi criada para isto | acrescentar códigos ao herdado; seção de anomalias própria do cartão | 🟢 |
| D-20 | O cartão de origem reserva lugar nomeado e vazio para o brainstorm, com atributo de dado que a suíte confere, sem ler `.reversa/active-ideation.json` | Resposta 2d da sessão: o brainstorm fica fora agora, e o lugar reservado impede que a próxima feature reorganize o cartão. O leitor herdado `IdeationContract` já produz o eixo, e ligá-lo ali é uma feature futura de uma linha | ligar o brainstorm agora; nada reservar | 🟢 |
| D-21 | Os estados que nenhum projeto saudável produz são alcançados por `scripts/estragar-greenfield.js`, que copia o workspace para pasta temporária e o adoece por caso: `sem-ancora`, `parcial`, `divergente`, `sdd-vazio`, `sem-escopo` e `teto` | É o terceiro caminho que `estragar-workspace.js` abriu e `estragar-registro.js` repetiu: nem adoecer o projeto de verdade, nem versionar um doente. O preview segue sem escrever nada | fixtures versionadas; adoecer o workspace real | 🟢 |

## 4. Premissas

Nenhuma premissa herdada de `[DÚVIDA]`. As três lacunas da versão inicial do `requirements.md` foram
fechadas na sessão de esclarecimento de 2026-09-11, registrada na seção 9 daquele documento, que
também fixou duas decisões além delas: a faixa de bloqueio para pipeline incompleta e o casamento
exato de nomes.

## 5. Delta arquitetural

Este projeto nasceu greenfield: não há `architecture.md`, e os componentes são os cinco de
`_reversa_sdd/sdd/`, corrigidos pelos adendos 001 a 008. A tabela cita spec e adendo vigente.

| Componente | Arquivo de origem no legado | Tipo de mudança | Resumo |
|------------|------------------------------|-----------------|--------|
| leitura-do-processo | `_reversa_sdd/sdd/leitura-do-processo.md`, adendos 006 e 008 | componente-novo | `src/probe/greenfield.ts` olha os quatro artefatos e lista `sdd/`; `src/domain/greenfield.ts` deriva estágio, cenário, divergência, escopo do PRD e panorama cruzado com o histórico |
| leitura-do-processo | `_reversa_sdd/sdd/leitura-do-processo.md`, adendo 008 | regra-alterada | `src/domain/limits.ts` ganha os literais dos artefatos e dois tetos; `src/domain/types.ts` ganha as formas `GreenfieldAxis`, `PlannedComponent`, `ScopeItem` e a união de anomalias |
| ponte-e-host | `_reversa_sdd/sdd/ponte-e-host.md`, adendos 002 e 008 | contrato-alterado | `SetProcessData` ganha o campo `greenfield`, por acréscimo; `reading.ts` o monta no mesmo `try`; `session.ts` o envia |
| painel-do-processo | `_reversa_sdd/sdd/painel-do-processo.md`, adendos 003, 006, 007 e 008 | componente-novo | `PanoramaSection.tsx` e `OriginSection.tsx`, alimentados por `panorama-view.ts` e por rótulos novos em `labels.ts` |
| painel-do-processo | `_reversa_sdd/sdd/painel-do-processo.md`, adendos 006 e 008 | regra-alterada | `SECTION_NAMES` com onze nomes; `DEFAULT_COLLAPSED` com `origem`; `blockingReasons()` com terceiro argumento; `readingIntegrity()` contando o eixo; `summaryText()` com bloco "Panorama do produto"; `DiscoverySection` com a frase de RF-17; `App.tsx` desenhando dois cartões a mais |
| empacotamento-e-verificacao | `_reversa_sdd/sdd/empacotamento-e-verificacao.md`, adendos 005 e 008 | regra-alterada | `scripts/estragar-greenfield.js` novo; README com seis linhas no gate visual; suítes de fronteira, de seções, de protocolo, de desempenho e de construção estendidas |
| heranca-e-sincronia | `_reversa_sdd/sdd/heranca-e-sincronia.md` | nenhuma | Nada de vendorizado é tocado. As duas duplicações de D-18 e D-19 ficam do lado local |

## 6. Delta no modelo de dados

- Resumo das mudanças: nada persistente muda. Em memória nascem o eixo `GreenfieldAxis`, com
  estágio físico, cenário, metadado tolerante, linha de resumo e divergência; o panorama, com os
  componentes planejados cruzados com o histórico, os fora do plano e os itens de escopo do PRD; e
  uma união local de quatro códigos de anomalia. Dois tetos e sete literais entram em `limits.ts`.
- Detalhe completo em: `_reversa_forward/009-greenfield-e-features-do-prd/data-delta.md`

## 7. Delta de contratos externos

| Contrato | Tipo | Arquivo de detalhe |
|----------|------|--------------------|
| Canal de mensagens entre a webview e o host | arquivo (mensagens `postMessage` tipadas) | `_reversa_forward/009-greenfield-e-features-do-prd/interfaces/protocolo-webview.md` |

Os artefatos de `_reversa_sdd/` que a feature lê não são contrato externo desta extensão: são saída
dos skills do Reversa, e o que este projeto faz com eles está fixado em RN-01, RN-04 e RN-14 do
`requirements.md`, com o leitor restrito de D-10 descrito no `data-delta.md`.

## 8. Plano de migração

n/a para dados: nada persistente muda, e o painel não grava.

Para o protocolo, a migração é a mesma da feature 008, e é feita pela regra de acréscimo:

1. Uma tela anterior que receba `setProcess` com o campo `greenfield` o ignora.
2. Uma tela nova que receba `setProcess` sem o campo desenha os dois cartões em "leitura não
   realizada", e não em "projeto legado" (RN-08).
3. A suíte `tests/host-protocol.spec.ts` passa a contar dez campos, e a suíte de seções, onze nomes.
4. As preferências guardadas de recolhimento seguem valendo: uma preferência declarada que não
   conheça `origem` nem `panorama` deixa os dois abertos, pela regra de `effectiveCollapsed()` que
   D-03 da feature 006 fixou, e isso é aceito.

## 9. Riscos e mitigações

| Risco | Impacto | Probabilidade | Mitigação |
|-------|---------|---------------|-----------|
| O leitor restrito do escopo do PRD não reconhece a seção em PRDs escritos por versão futura do `/reversa-drafter` | médio | médio | Seção ausente é anomalia nomeada, nunca falha; o cartão segue desenhando componentes e origem. O caso `sem-escopo` do script de degradação prova o estado |
| O estágio físico e o metadado divergem em projeto saudável por token que RN-02 não previu | baixo | médio | A anomalia diz os dois valores, o físico manda, e ampliar o conjunto de tokens é uma linha em `domain/greenfield.ts` |
| O pacote da tela cruza o teto de 409.600 bytes com dois cartões a mais | médio | baixo | O último pacote medido tem 194.018 bytes. `tests/webview-build.spec.ts` mede, e o script `limites.js` recusa |
| A leitura de `prd.md` e do brief empurra o tempo acima de 200 ms em projeto com PRD longo | médio | baixo | Só dois corpos são lidos, sob o teto de 256 KiB; `tests/desempenho-referencia.spec.ts` mede com os artefatos deste projeto |
| A pasta `sdd/` tem spec sem pasta correspondente por diferença de grafia, e o painel a mostra como planejada quando já foi entregue | médio | médio | É o que a decisão 5a aceitou, e o cartão mostra a pasta "fora do plano" ao lado, de modo que o par faltante fique visível para o mantenedor renomear ou não |
| A preferência guardada dos cartões colapsados foi declarada antes desta feature e não conhece os nomes novos | baixo | alto | Aceito e documentado: os dois cartões abrem, e o usuário recolhe uma vez |
| O nome `origem` colide com o campo `origem` de `ActiveDecomposition` na leitura de quem mantém | baixo | baixo | São namespaces distintos, o de seções e o de decomposição; o `onboarding.md` nomeia a coincidência |

## 10. Critério de pronto

- [ ] Todas as ações do `actions.md` marcadas `[X]`
- [ ] `cross-check.md` (se executado) sem CRITICAL nem HIGH
- [ ] `regression-watch.md` gerado
- [ ] Re-extração reversa executada e sem regressão vermelha (recomendado, não obrigatório)
- [ ] Os cinco componentes deste projeto aparecem no panorama como convergidos, e as pastas 006, 007
      e 008 como fora do plano
- [ ] `tests/host-boundaries.spec.ts`, `tests/readonly-local.spec.ts` e
      `tests/webview-boundaries.spec.ts` verdes com os módulos novos varridos
- [x] Pacote da tela abaixo de 409.600 bytes, medido: 206.403 B (a guarda de metade do teto falhou por 1.603 B; o usuário decidiu afrouxá-la para 60 %)
- [ ] Os seis casos de `scripts/estragar-greenfield.js` conferidos no preview e listados no README

## 11. Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-09-11 | Versão inicial gerada por `/reversa-plan` | reversa |
