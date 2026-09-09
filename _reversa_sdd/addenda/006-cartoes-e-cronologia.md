# Adendo: cartões e cronologia

> Identificador da feature: `006-cartoes-e-cronologia`
> Data: `2026-09-09`
> Cenário: `greenfield`
> Gerado por: `/reversa-sync`

Este adendo é uma ponte. A extração em `_reversa_sdd/` descreve o produto como ele foi
especificado, com seis eixos de tela e um painel que sabe em que estágio a feature está; a entrega
da feature 006 acrescentou dois eixos, corrigiu um defeito que a spec não previa porque não o
imaginava, e mudou a forma de todo instante exibido. Em três pontos o código foi além do que as
specs previam, e num ponto ele consumiu uma pendência que o PRD deixara em aberto. O que segue diz
como ler cada artefato da extração enquanto a re-extração não vem.

## Vigência

Vigente desde 2026-09-09.

## Resumo da entrega

A feature corrige e amplia o painel do processo em três frentes. A primeira é a exibição: o painel
passou a saber representar o estado de tudo aberto, que antes se desfazia na releitura seguinte,
porque a lista vazia de seções recolhidas significava ao mesmo tempo nunca houve preferência e o
usuário abriu tudo. A preferência guardada ganhou marca de declaração, e com ela o cabeçalho ganhou
duas ações que abrem e fecham todos os cartões de uma vez. A segunda frente é a cronologia que
faltava: a decomposição da feature ativa ação a ação, com a próxima aberta destacada e a trilha de
execução por ação, e o histórico de todas as features do projeto, com situação, marca e resumo,
mais um resumo consultável que o editor abre em documento não salvo ou que vai para a área de
transferência. A terceira é o horário: todo instante aparece no fuso de Brasília, com o valor
absoluto preservado em atributo, em vez do tempo universal cru em que os arquivos do Reversa o
gravam.

Duas decisões de forma ordenam o resto. A primeira é que a leitura nova não substitui a herdada,
mas corre ao lado dela: a herdada continua sendo a autoridade sobre quantas ações existem e em que
estágio a feature está, e a nova responde a quais são as ações e o que já foi entregue antes. A
divisão entre olhar e julgar foi mantida como a herança a faz, com `src/probe/` tocando disco e
`src/domain/` decidindo, e nenhum arquivo vendorizado mudou. A segunda é que a extensão passou a
entregar texto para fora sem escrever byte algum, por duas portas novas, o documento não salvo e a
área de transferência, de sorte que gravar continua sendo ato do usuário e o invariante de nunca
escrever arquivo sobrevive intacto.

**44 ações concluídas de 44 previstas**, conforme `actions.md` e as 47 linhas de `progress.jsonl`,
das quais duas registram evidência do portão de saída e uma registra correção sobre ação já
fechada. Nenhuma ação ficou aberta, e por isso **esta é uma sincronização total**. Dez módulos de
código nasceram, em `src/domain/`, `src/probe/`, `src/webview/domain/` e `src/webview/ui/`, ao
lado de oito suítes novas; trinta arquivos já existentes foram modificados, e nove suítes
existentes foram reescritas ou estendidas, mais o auxiliar de fixtures.

O portão de saída deste projeto é visual e foi cumprido: o preview fora do editor foi observado nos
estados novos, com os dois cartões desenhados, as quatro ações do cabeçalho presentes e a ação de
expandir tudo indisponível quando nada havia a expandir, e a 280 px de largura as quatro ações
quebram em linha sem corte. O pacote da tela ficou em 176,4 KiB contra o teto de 400,0 KiB, com
folga de 44%.

## Impacto por artefato da extração

| Artefato | Seção | Tipo de impacto | Delta |
|---|---|---|---|
| `_reversa_sdd/prd.md` | `#3-metricas-de-sucesso` | componente-novo | A métrica única do produto, retomar projeto parado há trinta dias sem reler documentação nem inspecionar arquivos, ganhou a peça que faltava para ser mensurável: o resumo consultável reúne num só texto o que já foi entregue e onde a feature ativa parou. Leia a métrica como instrumentada, não ainda como aferida. |
| `_reversa_sdd/prd.md` | `#4-escopo-in` | componente-novo | O escopo declara seis eixos, agrupados em núcleo e diagnóstico. Leia como oito: a decomposição da feature ativa e o histórico das entregas entraram no núcleo, e com eles o comportamento de entregar texto ao editor sob comando do usuário, que a seção não previa. |
| `_reversa_sdd/prd.md` | `#5-nao-objetivos-out` | regra-alterada | Dos cinco eixos adiados por custo de tela, a trilha de execução deixou de estar fora e passou a ser exibida por ação dentro do cartão da decomposição. Os outros quatro, impacto no legado, regressão vigiada, migração e ideação, seguem fora do escopo. |
| `_reversa_sdd/prd.md` | `#6-restricoes` | regra-nova | O invariante de a extensão nunca escrever arquivo sobreviveu a uma feature que entrega texto para fora. As duas portas novas existem nessa forma justamente por isso: o documento chega ao editor sem arquivo, a cópia vai para a área de transferência, e gravar continua sendo ato do usuário. `tests/readonly-local.spec.ts` e a suíte de fronteiras do host verificam a restrição sobre o código local novo. |
| `_reversa_sdd/prd.md` | `#pendencias-de-cobertura` | regra-alterada | O item 2, que mandava reabrir um eixo adiado quando ele fosse necessário numa retomada concreta, foi exercido pela primeira vez. Leia-o como parcialmente consumido: um dos cinco eixos voltou, e o critério de reabertura continua valendo para os quatro restantes. |
| `_reversa_sdd/sdd/leitura-do-processo.md` | `#6-requisitos-funcionais` | componente-novo | O componente ganhou uma segunda camada de leitura, local e paralela à herdada, em `src/probe/features.ts`, `src/domain/decomposition.ts` e `src/domain/history.ts`. Ela reusa as três funções de leitura exportadas pela sonda herdada sem abrir `node:fs` por conta própria, e nenhum arquivo de `src/heranca/` foi tocado. |
| `_reversa_sdd/sdd/leitura-do-processo.md` | `#7-requisitos-nao-funcionais` | regra-nova | Dois tetos novos entraram, num módulo próprio que é a fonte única deles: cinquenta pastas de feature por leitura, irmão do RNF-03 que já limitava adendos, e 65.536 bytes de texto de saída, que é o teto do resumo entregue ao editor. **Ponto de atenção registrado como W019:** o corte das cinquenta pastas é feito em ordem crescente de nome, e a tela exibe em ordem decrescente, de modo que num projeto com mais de cinquenta features as que caem fora são as mais novas. |
| `_reversa_sdd/sdd/leitura-do-processo.md` | `#9-modelo-de-dados` | delta-de-dados | **Leia esta seção com o `data-delta.md` da feature ao lado.** `ProcessoDoReversa` já previa o eixo de progresso com eventos e redução por ação, mas nada nomeava a decomposição nem o histórico. Duas formas novas entraram em `src/domain/types.ts`, com campos em português, e a situação de cada entrega é declarada em dois eixos separados, o da situação e o da marca, e não num só. |
| `_reversa_sdd/sdd/leitura-do-processo.md` | `#11-edge-cases-e-tratamento-de-erros` | regra-nova | Um caso novo, e é o mais delicado da entrega: `actions.md` é escrito por agente a partir de gabarito, não emitido por código, de sorte que acento a mais, caixa diferente e coluna solta são divergências plausíveis. O cabeçalho casa por forma normalizada, as células são lidas por posição, e onde nada casa há varredura linha a linha. Quando a lista e a contagem herdada divergem, a divergência é declarada na tela em vez de resolvida em silêncio. |
| `_reversa_sdd/sdd/ponte-e-host.md` | `#9-modelo-de-dados` | delta-de-contrato-externo | O protocolo cresceu por acréscimo, que é a única forma que a seção admite. `setProcess` ganhou `decomposition` e `history`; o vocabulário da webview para o host ganhou `openDraft` e `copyText`. Nada foi renomeado nem removido, o comando `dispatch` continua reservado e sem tratador, e por isso tela antiga contra host novo ignora o que não conhece, e tela nova contra host antigo declara o campo ausente sem quebrar. |
| `_reversa_sdd/sdd/ponte-e-host.md` | `#6-requisitos-funcionais` | regra-nova | O roteador passou a validar o texto que chega das duas mensagens novas antes de tocar qualquer colaborador: presença, tipo textual, conteúdo não vazio e teto de bytes, com cada recusa registrada no log nomeando o comando, a medida e o teto. Mensagem vinda da tela é entrada não confiável mesmo quando a tela é nossa. |
| `_reversa_sdd/sdd/ponte-e-host.md` | `#8-design-e-interface` | componente-novo | Duas portas novas em `src/host/ports.ts`, uma que abre documento não salvo e outra que escreve na área de transferência, implementadas em `src/host/adapters.ts` sem decisão alguma dentro delas, sem roubar foco e sem diálogo. **Limite conhecido, registrado como W020:** o título do documento viaja no contrato e é registrado no log, mas não é aplicado, porque nomear documento sem arquivo exigiria edição de espaço de trabalho, que a suíte de fronteira do host passou a proibir. |
| `_reversa_sdd/sdd/ponte-e-host.md` | `#12-seguranca-e-privacidade` | regra-nova | A seção continua verdadeira e ganhou uma direção que não tinha: até esta feature nada saía da extensão, e agora sai texto, ainda que só para o editor e para a área de transferência da própria máquina. Nenhum dado deixa o computador, o estado guardado no host segue sem conter o processo, e a auditoria por log cobre as recusas novas. |
| `_reversa_sdd/sdd/painel-do-processo.md` | `#6-requisitos-funcionais` | regra-alterada | Duas mudanças. O RF-12 daquela spec, que pede seções recolhíveis com a preferência guardada, estava cumprido pela metade e foi corrigido: a preferência declarada vence o padrão inicial em qualquer caso, inclusive quando declara que nada está recolhido. O RF-14, que fixa a ordem de seis seções, passa a valer para sete cartões recolhíveis, com a decomposição e o histórico inseridos logo após o ciclo forward; a faixa de bloqueio continua fora do conjunto e nenhuma ação global pode escondê-la. O RF-15, o lugar reservado do despacho, não foi deslocado. |
| `_reversa_sdd/sdd/painel-do-processo.md` | `#8-design-e-interface` | componente-novo | Dois cartões novos e quatro ações de cabeçalho, expandir tudo, recolher tudo, resumir e copiar, com a indisponibilidade anunciada pelo atributo do botão e não apenas pela cor. Os padrões iniciais dos cartões novos diferem entre si por decisão: a decomposição abre expandida, por ser núcleo da retomada, e o histórico abre recolhido, com a contagem no título, por ser leitura longa. |
| `_reversa_sdd/sdd/painel-do-processo.md` | `#9-modelo-de-dados` | delta-de-dados | A única estrutura persistida do painel mudou de forma. `PreferenciasDeExibicao` deixou de ser apenas a lista de seções recolhidas e ganhou a marca de declaração. Não houve migração: estado escrito por versão anterior é lido pela regra de que lista não vazia é escolha e lista vazia é ausência de escolha, e a ambiguidade termina daqui para a frente. |
| `_reversa_sdd/sdd/painel-do-processo.md` | `#11-edge-cases-e-tratamento-de-erros` | regra-alterada | O EC-02, que fixa o recorte por volume com as dez primeiras entradas e a contagem total, ganhou uma regra própria na decomposição, porque ali as dez primeiras seriam as menos úteis: o padrão passa a ser todas as ações abertas mais as cinco fechadas mais recentes pela trilha, com a contagem total sempre à vista e um controle que revela o resto. O EC-09, que manda descartar em silêncio nome de seção que não existe mais, continua valendo. |
| `_reversa_sdd/sdd/painel-do-processo.md` | `#7-requisitos-nao-funcionais` | regra-nova | Todo instante exibido passa por uma conversão só, feita pelo nome do fuso e não pelo deslocamento numérico, e o valor absoluto fica no atributo consultável ao lado do texto. `tests/webview-instants-render.spec.tsx` varre o documento renderizado atrás de instante em tempo universal cru e falha se encontrar qualquer um, e prova a própria varredura antes de confiar nela. |
| `_reversa_sdd/sdd/painel-do-processo.md` | `#4-non-goals-fora-do-escopo` | regra-nova | O NG-02, que proíbe interpretar Markdown dentro da webview, sobreviveu a uma feature que exibe o conteúdo de `actions.md` e compõe um texto de resumo. O que atravessa a ponte continua sendo valor tipado, lido e julgado do lado do host, e o resumo é composto na tela porque é lá que moram os rótulos legíveis, em função pura, de modo que documento e cópia não possam divergir. |
| `_reversa_sdd/sdd/empacotamento-e-verificacao.md` | `#8-design-e-interface` | regra-nova | Mudança única e pequena: o estado forçado sem Reversa, que o preview usa para desenhar a tela fora do editor, passou a enviar os dois ramos novos na forma vazia, para que o preview continue desenhando o mesmo documento que o editor desenha. O teto do pacote da tela não foi tocado. |
| `_reversa_sdd/sdd/heranca-e-sincronia.md` | `#6-requisitos-funcionais` | regra-nova | Nenhum arquivo de `src/heranca/` foi criado, alterado ou apagado, e nenhuma adaptação nova precisou ser declarada. O componente aparece nesta entrega apenas do lado de fora, por uma suíte nova que impede módulo local de tocar arquivo vendorizado a não ser importando dele, o que é a forma verificável do regime enquanto código novo cresce ao redor da cópia. |

Resumo: 21 impactos registrados. Nove de tipo `regra-nova`, cinco de `componente-novo`, quatro de
`regra-alterada`, dois de `delta-de-dados` e um de `delta-de-contrato-externo`. Nenhum
`componente-extinto` nem `regra-removida`, e a ausência dos dois é o que se espera de uma feature
que só cresceu: nada foi retirado do produto, e a única regra que mudou de sentido, a da
preferência de exibição, mudou por ser defeito.

## Regras sob vigilância

O watch principal de `regression-watch.md` continua **vazio**, pelo mesmo motivo das features 001 a
005: sem extração `/reversa` sobre este repositório não há regras 🟢, e sem regras 🟢 não há o que
vigiar. O que esta entrega deixou de verdades a manter está sem peso de regressão, e ganha peso
quando a primeira `/reversa` sobre este código confirmar cada uma.

Os identificadores **W001 a W018** cobrem, um a um, os dezoito requisitos funcionais desta feature,
na seção "Observações". Os identificadores **W019 a W022** estão na subseção "Limitações e escolhas
conhecidas" e registram decisões que uma extração futura leria como estranheza se não estivessem
escritas: o corte das cinquenta pastas em ordem crescente contra a exibição decrescente, o título
do documento não salvo que viaja e não é aplicado, a numeração `RN-NN` local a cada feature, e o
resumo de entrega que é a primeira frase e não a primeira linha física.

**Ponto de atenção para quem rodar a próxima extração:** esta feature reiniciou a numeração em
W001, ao contrário da 005, que seguiu a contínua e foi até W117. O mesmo identificador nomeia,
portanto, regras diferentes em features diferentes, exatamente como o W021 desta feature observa a
respeito de `RN-NN`. Citação de identificador só é legível junto do nome da feature que o escreveu.

Conteúdo integral em `_reversa_forward/006-cartoes-e-cronologia/regression-watch.md`.

## Fontes

- `_reversa_forward/006-cartoes-e-cronologia/legacy-impact.md`
- `_reversa_forward/006-cartoes-e-cronologia/regression-watch.md`
- `_reversa_forward/006-cartoes-e-cronologia/requirements.md`
- `_reversa_forward/006-cartoes-e-cronologia/roadmap.md`
- `_reversa_forward/006-cartoes-e-cronologia/data-delta.md`
- `_reversa_forward/006-cartoes-e-cronologia/investigation.md`
- `_reversa_forward/006-cartoes-e-cronologia/actions.md`
- `_reversa_forward/006-cartoes-e-cronologia/progress.jsonl`
