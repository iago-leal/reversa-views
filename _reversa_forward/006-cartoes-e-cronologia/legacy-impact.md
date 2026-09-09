# Impacto no legado: 006-cartoes-e-cronologia

**Data:** 2026-09-09
**Feature:** `006-cartoes-e-cronologia`
**Cenário:** greenfield.

Feature greenfield, sem legado pré-existente. Âncora: `prd.md` + specs SDD.

Não há extração de `/reversa` neste projeto: `_reversa_sdd/` não tem `architecture.md` nem
`domain.md`, e o contexto vem de `_reversa_sdd/prd.md` com as cinco specs de
`_reversa_sdd/sdd/`. Por isso não há regra 🟢 extraída de código existente para preservar ou
quebrar, e as seções "Preservadas" e "Modificadas" ficam vazias.

O que existe de código anterior foi escrito pelo próprio ciclo forward, nas features 001 a 005.
Ele não é legado no sentido do Reversa, mas também não é papel em branco: trinta arquivos já
existentes foram modificados nesta entrega. A tabela abaixo distingue os dois casos em vez de
carimbar `componente-novo` em tudo, porque um rastro que chamasse de novo um arquivo que já
existia mentiria para a próxima auditoria. Arquivo criado nesta feature recebe
`componente-novo`; arquivo anterior que ganhou comportamento recebe `regra-nova`; arquivo
anterior cujo comportamento mudou recebe `regra-alterada`; o contrato da ponte recebe
`delta-de-contrato-externo`.

**Política de edição do legado no momento da execução.** `.reversa/reversa-config.json` declarava
`"allowLegacyEdits": true` com `"allowedPaths": []`. Liberação irrestrita: todo caminho do projeto
estava gravável, e nenhuma escrita foi recusada por política. O arquivo de configuração não foi
criado nem alterado por esta execução.

## Arquivos afetados

| Arquivo afetado | Componente | Tipo | Severidade | Justificativa |
|---|---|---|---|---|
| `src/domain/types.ts` | leitura-do-processo | componente-novo | LOW | Vocabulário das duas leituras novas: decomposição da feature ativa e histórico do projeto. Campos em português, como `data-delta.md` os nomeia. |
| `src/domain/limits.ts` | leitura-do-processo | componente-novo | LOW | Os dois tetos da feature, o de pastas percorridas e o de bytes do resumo, num lugar só. |
| `src/probe/features.ts` | leitura-do-processo | componente-novo | MEDIUM | Percorre as pastas de feature reusando as três funções da sonda herdada, sem abrir `node:fs` fora da herança. Aplica o teto de cinquenta pastas. |
| `src/domain/decomposition.ts` | leitura-do-processo | componente-novo | MEDIUM | Lê a tabela de ações por cabeçalho normalizado, com varredura linha a linha como plano B, e declara divergência contra a contagem herdada em vez de escolher um número. |
| `src/domain/history.ts` | leitura-do-processo | componente-novo | MEDIUM | Julga cada pasta em situação e marca, dois eixos e não um, e ordena por nome de pasta em ordem decrescente. |
| `src/host/protocol.ts` | ponte-e-host | delta-de-contrato-externo | HIGH | `SetProcessData` ganha `decomposition` e `history`; o vocabulário de comandos ganha `openDraft` e `copyText`. Crescimento por acréscimo: nada foi renomeado nem removido. |
| `src/host/reading.ts` | ponte-e-host | regra-nova | MEDIUM | A leitura passa a compor os dois ramos novos, derivando as pastas de `process.discovery` para que nenhum literal de caminho do Reversa entre no host. |
| `src/host/session.ts` | ponte-e-host | regra-nova | LOW | Os dois ramos novos entram na carga que a sessão envia à tela. |
| `src/host/ports.ts` | ponte-e-host | componente-novo | HIGH | Duas portas novas, de documento não salvo e de área de transferência. É a primeira vez que a extensão entrega texto para fora, ainda que sem tocar o disco. |
| `src/host/adapters.ts` | ponte-e-host | componente-novo | HIGH | Implementação das duas portas sobre a API do editor, sem foco roubado e sem diálogo. O título do documento é aceito e registrado, e deliberadamente não aplicado. |
| `src/host/router.ts` | ponte-e-host | regra-nova | MEDIUM | Valida o texto que chega das duas mensagens novas: presença, tipo, não vazio e teto de bytes, com a recusa registrada no log nomeando medida e teto. |
| `src/host/provider.ts` | ponte-e-host | regra-nova | LOW | Recebe as duas portas e captura a falha de cada uma no log em vez de deixá-la subir. |
| `src/extension.ts` | ponte-e-host | regra-nova | LOW | Constrói as duas portas e as entrega ao provedor. |
| `src/webview/bridge/messaging.ts` | painel-do-processo | regra-nova | MEDIUM | A ponte da tela ganha os dois envios novos, que continuam sendo o único ponto de travessia. |
| `src/webview/domain/types.ts` | painel-do-processo | delta-de-dados | MEDIUM | Duas seções novas no vocabulário da tela, e o campo `declared` na preferência de exibição. |
| `src/webview/domain/preferences.ts` | painel-do-processo | regra-alterada | MEDIUM | É a correção do defeito que originou a queixa: a preferência passa a carregar a marca de declaração, e lista vazia declarada deixa de ser lida como ausência de escolha. |
| `src/webview/domain/sections.ts` | painel-do-processo | regra-alterada | MEDIUM | `initialCollapsed` vira `effectiveCollapsed`: preferência declarada vence o padrão inicial em qualquer caso, inclusive vazia. |
| `src/webview/domain/instants.ts` | painel-do-processo | componente-novo | MEDIUM | Converte todo instante para o fuso de Brasília pelo nome do fuso, compondo a partir das partes, e é total para qualquer entrada. |
| `src/webview/domain/decomposition-view.ts` | painel-do-processo | componente-novo | LOW | O recorte da decomposição para a tela: abertas mais as cinco fechadas mais recentes, com a recência vinda da trilha. |
| `src/webview/domain/summary.ts` | painel-do-processo | componente-novo | MEDIUM | Compõe o resumo consultável como função pura da carga, para que documento e cópia não possam divergir. |
| `src/webview/domain/labels.ts` | painel-do-processo | regra-nova | LOW | Rótulos legíveis de situação e marca, e o instante do checkpoint separado do texto do estado. |
| `src/webview/ui/DecompositionSection.tsx` | painel-do-processo | componente-novo | MEDIUM | Cartão da decomposição da feature ativa, com a próxima ação marcada por atributo e por palavra. |
| `src/webview/ui/HistorySection.tsx` | painel-do-processo | componente-novo | MEDIUM | Cartão do histórico das entregas, uma linha por pasta, com o adendo clicável pela mesma mensagem de sempre. |
| `src/webview/ui/Header.tsx` | painel-do-processo | regra-nova | MEDIUM | As quatro ações novas do cabeçalho, a indisponibilidade anunciada pelo atributo do botão e o instante da leitura convertido. |
| `src/webview/ui/App.tsx` | painel-do-processo | regra-nova | LOW | Monta os dois cartões novos, cada um sob a sua própria barreira de erro, e repassa os contadores e as quatro portas ao cabeçalho. |
| `src/webview/ui/DiscoverySection.tsx` | painel-do-processo | regra-alterada | LOW | O instante do checkpoint passa pela conversão, com o valor absoluto no atributo. |
| `src/webview/main.tsx` | painel-do-processo | regra-nova | MEDIUM | A casca guarda a preferência com a marca de declaração e compõe o texto do resumo antes de enviá-lo ao host. |
| `src/webview/theme/theme.css` | painel-do-processo | regra-nova | LOW | Estilos dos dois cartões, do destaque da próxima ação e da ação indisponível, sem medida em pixel e sem paleta própria. |
| `README.md` | painel-do-processo | regra-nova | LOW | Seção nova sobre os dois cartões, as quatro ações do cabeçalho, o horário de Brasília e o que o resumo reúne. |
| `scripts/preview/leitura.js` | empacotamento-e-verificacao | regra-nova | LOW | O estado forçado sem Reversa passa a enviar os dois ramos novos na forma vazia. |
| `tests/probe-features.spec.ts` | leitura-do-processo | componente-novo | LOW | Guarda a varredura de pastas contra diretório real, inclusive o teto e o que não é diretório. |
| `tests/domain-decomposition.spec.ts` | leitura-do-processo | componente-novo | LOW | Guarda a leitura da tabela de ações, o plano B da varredura e a divergência declarada. |
| `tests/domain-history.spec.ts` | leitura-do-processo | componente-novo | LOW | Guarda a situação, a marca, o adendo superado, o resumo em três degraus e a ordem decrescente. |
| `tests/webview-instants.spec.ts` | painel-do-processo | componente-novo | LOW | Guarda a conversão para Brasília, inclusive entrada malformada e ausente. |
| `tests/webview-decomposition-view.spec.ts` | painel-do-processo | componente-novo | LOW | Guarda o recorte e a ordem de recência. |
| `tests/webview-summary.spec.ts` | painel-do-processo | componente-novo | LOW | Guarda o texto do resumo e a sua determinação. |
| `tests/webview-instants-render.spec.tsx` | painel-do-processo | componente-novo | MEDIUM | Varre o documento renderizado atrás de instante em tempo universal cru, e prova a própria varredura antes de confiar nela. |
| `tests/readonly-local.spec.ts` | heranca-e-sincronia | componente-novo | HIGH | Impede que módulo local toque arquivo vendorizado a não ser importando dele, que é o que mantém a herança intacta enquanto o código novo cresce ao redor. |
| `tests/webview-preferences.spec.ts` | painel-do-processo | regra-alterada | MEDIUM | Reescrita para a preferência com marca de declaração. |
| `tests/webview-sections.spec.ts` | painel-do-processo | regra-alterada | MEDIUM | Reescrita para `effectiveCollapsed` e para o conjunto inicial de quatro recolhidas. |
| `tests/host-boundaries.spec.ts` | ponte-e-host | regra-nova | HIGH | Endurecida: além das fronteiras que já media, passa a proibir edição de espaço de trabalho no host. |
| `tests/host-router.spec.ts` | ponte-e-host | regra-nova | MEDIUM | Estendida com a validação das duas mensagens novas, inclusive o teto de bytes. |
| `tests/host-protocol.spec.ts` | ponte-e-host | delta-de-contrato-externo | MEDIUM | Atualizada porque afirmava a lista exata de campos e de comandos, e o contrato cresceu. Não constava de `actions.md`. |
| `tests/host-session.spec.ts` | ponte-e-host | regra-nova | LOW | Estendida para os dois ramos novos da carga. |
| `tests/host-provider.spec.ts` | ponte-e-host | regra-nova | LOW | A bancada ganha as duas portas novas. |
| `tests/webview-labels.spec.ts` | painel-do-processo | regra-nova | LOW | Estendida para os rótulos de situação e marca e para o instante do checkpoint. |
| `tests/webview-render.spec.tsx` | painel-do-processo | regra-nova | MEDIUM | Estendida para os dois cartões, as quatro ações do cabeçalho e a ordem dos sete recolhíveis. |
| `tests/helpers/reversa-fixtures.ts` | painel-do-processo | regra-alterada | LOW | A tabela de ações da fixture passa a ser a canônica de sete colunas, e a carga ganha os dois ramos novos. |

Fora da tabela, por não serem código do projeto: `_reversa_forward/006-cartoes-e-cronologia/actions.md` e
`progress.jsonl`, escritos por este skill, e `.reversa/active-requirements.json`, que o Reversa
mantém. Os arquivos de `out/` são produto da construção e não são versionados.

## Diff conceitual por componente

### leitura-do-processo

O componente ganhou uma segunda camada de leitura, paralela à herdada e sem substituí-la. A
herdada continua sendo a autoridade sobre quantas ações existem e em que estágio a feature está;
a nova responde a duas perguntas que ela não respondia, quais são as ações e o que já foi
entregue antes. A divisão entre olhar e julgar foi mantida como a herança a faz: `src/probe/`
toca disco, `src/domain/` decide, e nenhum dos dois importa o outro ao contrário. Nenhum arquivo
vendorizado mudou; as três funções da sonda herdada foram reusadas como estão, e o teste de
diretório é a própria listagem devolver nulo.

O ponto delicado é a leitura da tabela de ações. `actions.md` é escrito por agente a partir de
gabarito, e não emitido por código: acento a mais, caixa diferente, coluna solta são divergências
plausíveis. Por isso o cabeçalho casa normalizado, as células são lidas por posição, e onde nada
casa há varredura linha a linha pelo mesmo marcador de fim de linha que a herança já usa. Quando
a lista e a contagem herdada divergem, a divergência é declarada na tela em vez de resolvida em
silêncio.

### ponte-e-host

O contrato cresceu por acréscimo, que é a única forma que a fronteira admite: dois campos novos
na carga e dois comandos novos no vocabulário. Nada foi renomeado nem removido, de sorte que uma
tela antiga contra um host novo ignora o que não conhece, e uma tela nova contra um host antigo
encontra o campo ausente e o declara na seção, sem quebrar.

A novidade de posição é que a extensão passou a entregar texto para fora. Duas portas novas, uma
que abre documento não salvo e outra que escreve na área de transferência. O invariante de não
escrever arquivo continua de pé, e é justamente por isso que as duas portas existem nessa forma:
gravar continua sendo ato do usuário. O roteador ganhou a validação do texto que chega, com teto
de bytes, porque mensagem vinda da tela é entrada não confiável mesmo quando a tela é nossa.

Um limite conhecido ficou registrado no adaptador: o editor não nomeia documento não salvo sem
uma edição de espaço de trabalho, e a suíte de fronteira passou a proibir essa edição no host. O
título viaja no contrato, é registrado no log e não é aplicado.

### painel-do-processo

Três mudanças, de naturezas diferentes. A primeira é a correção do defeito: a preferência de
exibição passou a distinguir a ausência de declaração da declaração de que nada está recolhido,
e essa distinção é o que faz expandir tudo sobreviver à releitura. Nada foi migrado; estado
escrito por versão anterior é lido pela regra de que lista não vazia é escolha e lista vazia é
ausência de escolha, e a ambiguidade termina daqui para a frente.

A segunda são os dois cartões novos, que entram na ordem declarada dos sete recolhíveis, com
padrão inicial próprio: a decomposição abre expandida, por ser núcleo da retomada, e o histórico
abre recolhido, com a contagem no título, por ser leitura longa.

A terceira é o horário. Todo instante que aparece na tela passa por uma conversão só, feita pelo
nome do fuso e não pelo número, e o valor absoluto fica no atributo consultável ao lado do texto.
A tela continua sem interpretar Markdown: o que atravessa a ponte é valor tipado, e o resumo é
composto do lado da tela porque é lá que moram os rótulos legíveis.

### empacotamento-e-verificacao

Mudança única e pequena: o estado forçado do preview passou a enviar os dois ramos novos na forma
vazia, para que a tela fora do editor continue desenhando o mesmo documento que o editor desenha.
O teto do pacote da tela não foi tocado, e a medida da entrega ficou em 176.4 KiB contra os
400.0 KiB do teto.

### heranca-e-sincronia

Nenhum arquivo de `src/heranca/` foi criado, alterado ou apagado. O componente aparece nesta
entrega apenas do lado de fora: uma suíte nova passou a impedir que módulo local toque arquivo
vendorizado a não ser importando dele, o que é a forma verificável do regime enquanto código
novo cresce ao redor da cópia.

## Preservadas

Vazio. Não há extração de legado neste projeto, e portanto não há regra 🟢 de `domain.md` a
declarar intacta. As regras que fazem esse papel aqui são as restrições do PRD e as regras de
negócio de `requirements.md` desta feature, todas registradas em `regression-watch.md` sem peso
de regressão.

## Modificadas

Vazio, pelo mesmo motivo. Nenhuma regra extraída de código existente foi alterada ou removida,
porque nenhuma foi extraída ainda. A primeira `/reversa` sobre este código dará peso de regressão
ao que hoje é observação.
