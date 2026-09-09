# Cross-check: painel do processo

> Identificador: `003-painel-do-processo`
> Data: `2026-09-09`
> Executado por: `/reversa-audit`

Artefatos analisados, todos apenas lidos:

- `_reversa_forward/003-painel-do-processo/requirements.md`
- `_reversa_forward/003-painel-do-processo/roadmap.md`
- `_reversa_forward/003-painel-do-processo/actions.md`

Artefatos consultados como contexto: `data-delta.md`, `investigation.md`, `onboarding.md`,
`_reversa_sdd/prd.md`, `_reversa_sdd/sdd/painel-do-processo.md`,
`_reversa_sdd/sdd/empacotamento-e-verificacao.md`,
`_reversa_forward/002-ponte-e-host/interfaces/protocolo-webview.md` e os fontes da camada herdada em
`src/heranca/`.

Este projeto não tem `_reversa_sdd/domain.md` nem `_reversa_sdd/architecture.md`, porque a extração
veio pela rota greenfield. O eixo de coerência com o legado foi aplicado, no lugar deles, contra as
restrições do `prd.md` e contra as specs de componente em `_reversa_sdd/sdd/`.

## Resumo

| Severidade | Achados |
|---|---|
| CRITICAL | 0 |
| HIGH | 4 |
| MEDIUM | 7 |
| LOW | 3 |
| **Total** | **14** |

## Achados

| ID | Severidade | Eixo | Descrição | Onde está |
|----|-----------|------|-----------|-----------|
| A001 | HIGH | Coerência com o legado | A decisão D-02 dispensa o sistema de design externo que a spec do componente lista como dependência obrigatória, e que o `requirements.md` declarou fechado | `roadmap.md` §3 D-02 e §4; `_reversa_sdd/sdd/painel-do-processo.md` §10; `requirements.md` §10 |
| A002 | HIGH | Cobertura | RF-23 e o cenário de construção exigem cópia de recursos estáticos, a decisão D-14 recusa copiar `media/` para a saída, e nenhuma ação copia recurso estático algum | `requirements.md` RF-23 e §7 cenário "Build produz as duas unidades"; `roadmap.md` §3 D-14; `actions.md` T004, T049 |
| A003 | HIGH | Coerência com o legado | A spec do componente manda a seção de anomalias nascer expandida no estado instalado e degradado; RF-22 e o esclarecimento de 2026-09-09 mandam as três de diagnóstico nascerem recolhidas, sem exceção | `_reversa_sdd/sdd/painel-do-processo.md` §8, estados da UI; `requirements.md` RF-22 e §9; `actions.md` T013, T026, T037 |
| A004 | HIGH | Cobertura | RF-16, RF-19 e RF-21 não têm decisão correspondente na tabela do roadmap. Todos os três têm ação, de modo que nada se perde na execução, mas a escolha não ficou registrada onde se procura por ela | `requirements.md` RF-16, RF-19, RF-21; `roadmap.md` §3; `actions.md` T017, T019, T037, T040 |
| A005 | MEDIUM | Consistência | RF-06 anuncia sete itens do ciclo forward e enumera oito: estágio, feature ativa, ações fechadas, ações abertas, emendas, dúvidas, features pausadas e adendo. A ação herdou o número errado | `requirements.md` RF-06; `actions.md` T016, T034 |
| A006 | MEDIUM | Consistência | O cenário de sobrevivência da preferência nomeia "a seção de checkpoints", que não existe no vocabulário de RF-14. Checkpoints é conteúdo da seção de descoberta, conforme RF-05 | `requirements.md` §7, cenário "Preferência de recolhimento sobrevive ao ciclo de visibilidade"; RF-05; RF-14 |
| A007 | MEDIUM | Consistência | A ação de mapeamento fala em vinte e sete cenários de aceitação; o `requirements.md` traz vinte e nove | `actions.md` T055; `requirements.md` §7 |
| A008 | MEDIUM | Cobertura | Os cenários de troca de tema e de painel abaixo de 300 px têm ação de implementação e nenhuma ação de teste. A renderização em servidor não prova repintura nem medida, e nenhuma ação os nomeia como transferidos para a feature 005 | `requirements.md` §7, cenários "Troca de tema com o painel aberto" e "Painel mais estreito que o mínimo"; `actions.md` T027, T028, T055 |
| A009 | MEDIUM | Cobertura | O delta declarado sobre `heranca-e-sincronia`, que reconhece o kit de extensão como terceira origem de padrão, não tem ação correspondente | `roadmap.md` §5, tabela de delta arquitetural; `actions.md` |
| A010 | MEDIUM | Sanidade do actions | O resumo declara maior cadeia de dependência de 11 ações; a cadeia real, calculada sobre a coluna de dependências, tem 13 | `actions.md`, tabela de resumo |
| A011 | MEDIUM | Cobertura | As três telas de entrada sem processo estão subespecificadas nas ações diante do que os cenários exigem: comando de instalação copiável, ausência deliberada de ação na tela sem pasta e ação de tentar de novo na tela de erro | `requirements.md` §7, cenários "Workspace sem Reversa instalado", "Nenhuma pasta aberta no editor" e "Falha capturada na leitura"; `actions.md` T014, T033 |
| A012 | LOW | Consistência | A contagem das funções puras de decisão diverge entre documentos: RF-13 lista cinco com a ressalva de "ao menos", D-10 e o critério de pronto dizem seis, e o cenário de auditoria da forma do código lista quatro | `requirements.md` RF-13 e §7; `roadmap.md` §3 D-10 e §10 |
| A013 | LOW | Cobertura | O cenário de leitura íntegra exige que a seção de anomalias declare que não houve nenhuma; a ação de suíte verifica a lista preenchida e o limite de dez, mas não o caso de zero | `requirements.md` §7, cenário "Leitura íntegra"; `actions.md` T017 |
| A014 | LOW | Sanidade do actions | Duas ações marcadas `[//]` compartilham arquivo alvo com ações `[//]` de fases anteriores. Como as fases correm em sequência, não há conflito de execução, apenas ruído na leitura do marcador | `actions.md` T029 e T053; T040 e T053 |

## Impacto dos achados HIGH

### A001, o sistema de design dispensado

É a divergência que o próprio roadmap declara na seção 4, e a única em que dois documentos vigentes
dizem coisas opostas sobre a mesma dependência. A spec do componente a lista como obrigatória e o
`requirements.md` afirma que o ponto não se reabre; a decisão D-02 a dispensa, fundamentada na medida
de 390 KB registrada no kit de origem. Nada nas ações traz os tokens externos, de modo que executar
como está significa executar a divergência.

O custo de errar não é simétrico. Manter a decisão e descobrir depois que a tela precisava dos
componentes prontos custa reescrever a folha de estilo e revisar todos os componentes de `ui/`.
Revertê-la agora custa acrescentar duas ações à fase 1 e nada mais, porque nenhuma linha foi escrita.
O roadmap já mitiga o risco ao concentrar os tokens num único arquivo de tema.

Direção sugerida: decidir explicitamente antes de codar. Confirmando a divergência, ela precisa ser
reconciliada na spec pelo adendo do `/reversa-sync` ao fim da feature. Revertendo-a, `/reversa-plan`
regenera o roadmap e `/reversa-to-do` regenera as ações.

### A002, a cópia de recursos estáticos

RF-23 pede três coisas: a segunda unidade de compilação, o empacotamento do bundle e a cópia dos
recursos estáticos. O cenário de construção repete a terceira em linha própria, separada do bundle,
o que sugere que ela não se refere à folha de estilo emitida ao lado do script. A decisão D-14, por
sua vez, recusa mover `media/` para a saída, com a justificativa de que o manifesto já os referencia
da raiz do pacote. As ações seguem D-14: `T004` emite script e folha, e nenhuma ação copia arquivo
algum.

Sem resolução, o cenário de construção fica insatisfeito por desenho, e quem for fechar `T049`
descobre isso lendo o critério. As duas saídas são legítimas: ou o requisito se lê como já satisfeito
pela emissão da folha, e o texto de RF-23 e do cenário precisa dizê-lo, ou existe recurso estático a
copiar que ninguém nomeou.

Direção sugerida: `/reversa-clarify` para fixar o que conta como recurso estático nesta feature.

### A003, a seção de anomalias em leitura degradada

A spec do componente descreve sete estados da tela, e o sexto deles, instalado e degradado, manda a
seção de anomalias nascer expandida. RF-22 e o esclarecimento de 2026-09-09 mandam as três seções de
diagnóstico nascerem recolhidas, sem abrir exceção para a leitura degradada. As ações seguem RF-22.

O ponto não é cosmético. RN-06 proíbe o painel de omitir degradação, e o desenho atual cumpre a regra
pelo cabeçalho, que declara a degradação, e pela contagem no título da seção recolhida. Isso resolve
o requisito, mas troca uma lista visível por um número, o que é uma decisão de produto que ninguém
tomou explicitamente: o esclarecimento respondeu sobre a primeira abertura, e não sobre a primeira
abertura em estado degradado.

Direção sugerida: `/reversa-clarify` para decidir se a degradação abre a seção, e em caso afirmativo
o requisito muda em RF-22, não apenas nas ações.

### A004, os três requisitos sem decisão no roadmap

RF-16, que exibe o aviso do terceiro comando do canal, RF-19, que ignora mensagem desconhecida com
uma linha de log, e RF-21, que limita a exibição inicial de anomalias a dez, não aparecem na tabela
de decisões técnicas do roadmap nem no delta arquitetural. Os três têm ação e suíte, de modo que a
execução não perde nada.

O prejuízo é de rastreabilidade, e ele aparece depois. Quem retomar o projeto em doze meses vai ler o
roadmap para entender por que o painel corta em dez anomalias, e não vai encontrar resposta ali; vai
achar o número dentro de uma ação, sem a justificativa. É exatamente o tipo de perda que o Reversa
existe para evitar.

Direção sugerida: acrescentar as três decisões ao roadmap por `/reversa-plan`, ou aceitar a lacuna
conscientemente e registrar a aceitação no adendo do `/reversa-sync`.

## O que passou

### Cobertura

- Os vinte e três requisitos funcionais, de RF-01 a RF-23, têm pelo menos uma ação correspondente.
- Vinte dos vinte e três têm também decisão no roadmap; as três exceções são o achado A004.
- As quatorze decisões técnicas do roadmap, de D-01 a D-14, têm ação correspondente, com a ressalva
  de A002 quanto a D-14.
- Os nove casos de borda da spec do componente, de EC-01 a EC-09, aparecem nas ações: EC-01 em T016,
  EC-02 em T017 e T037, EC-03 e EC-04 em T027, EC-05 em T011 e T037, EC-06 em T028, EC-07 em T009,
  EC-08 em T018 e T029, EC-09 em T012 e T025.
- Vinte e cinco dos vinte e nove cenários de aceitação têm ação de teste. Os quatro restantes são os
  achados A008, A011 e A013.
- As nove regras de negócio, de RN-01 a RN-09, têm ação: RN-01 em T020, RN-02 em T020, RN-03 em T019
  e T040, RN-04 em T007 e T024, RN-05 em T011 e T037, RN-06 em T015, RN-07 em T018 e T053, RN-08 em
  T009 e T022, RN-09 em T012 e T025.

### Consistência

- Todos os identificadores citados existem. Os RF referenciados no roadmap e nas ações estão no
  `requirements.md`; as decisões D-01 a D-14 citadas na coluna de confidência das ações estão no
  roadmap; os EC citados estão na spec do componente.
- O contrato do canal descrito em `_reversa_forward/002-ponte-e-host/interfaces/protocolo-webview.md`
  aparece no roadmap, seção 7, com delta declarado como nenhum, e as ações o consomem sem acrescentar
  comando, campo ou ordem.
- Os nomes das seis seções são os mesmos nos três documentos, na ordem de RF-14, com a exceção
  pontual do achado A006.
- Os identificadores fixados pelo `onboarding.md` são os mesmos nas ações: os scripts `build`,
  `build:webview` e `check:webview`, a configuração `tsconfig.webview.json`, a saída
  `out/res/webview/`, a suíte `tests/webview-render.spec.ts` e a pasta de cobertura
  `src/webview/domain/**`.
- Os cinco estados de entrada nomeados nas ações são os mesmos cinco de `src/host/protocol.ts`.

### Coerência com o legado

- O invariante do `prd.md` de que a extensão nunca escreve arquivo é respeitado: nenhuma ação dá à
  webview acesso a disco, e T020 o verifica por varredura de fonte.
- A restrição de nenhum tráfego de rede em tempo de execução é respeitada: a política do documento
  declara `connect-src 'none'`, e nenhuma ação carrega recurso remoto.
- Os seis campos que a feature 002 fixou na carga de dados permanecem intactos, como o
  `data-delta.md` afirma pelo negativo e como `src/host/protocol.ts` confirma.
- Os campos que o `data-delta.md` declara disponíveis e não usados existem de fato na camada
  herdada: `impact`, `watch`, `ideation`, `progress` e `migrationStatePath` estão em `ReversaProcess`,
  e `sessionDir` no relatório da sonda.
- O vocabulário de sete estágios que as ações T011 e T024 assumem corresponde exatamente ao tipo
  `Stage` da camada herdada: `sem-feature-ativa`, `vazio`, `requirements`, `plan`,
  `coding-em-progresso`, `done-sem-adendo` e `done-com-adendo`.
- As cinco fases da descoberta que RF-04 e T035 assumem correspondem à constante `PHASES` da camada
  herdada.
- Os três componentes do `_reversa_sdd/sdd/` citados no delta arquitetural existem:
  `painel-do-processo.md`, `ponte-e-host.md` e `empacotamento-e-verificacao.md`.

### Sanidade do actions

- As cinquenta e cinco ações têm identificador único, sem buraco e sem reciclagem, de T001 a T055.
- Todas as dependências apontam para identificadores existentes.
- Todas as dependências apontam para trás, de modo que não há ciclo.
- Nenhuma ação `[//]` compartilha arquivo alvo com outra `[//]` da mesma fase, com a ressalva de
  A014 quanto às fases distintas.
- Todas as cinquenta e cinco ações têm status inicial `[ ]`.
- Nenhuma ação de configurar IDE, rodar lint, comitar ou abrir PR entrou na decomposição.

## Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-09-09 | Versão inicial gerada por `/reversa-audit` | reversa |
