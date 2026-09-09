# Roadmap: cartões e cronologia

> Identificador: `006-cartoes-e-cronologia`
> Data: `2026-09-09`
> Requirements: `_reversa_forward/006-cartoes-e-cronologia/requirements.md`
> Confidência: 🟢 CONFIRMADO, 🟡 INFERIDO, 🔴 LACUNA

## 1. Resumo da abordagem

A feature se resolve em quatro movimentos, e nenhum deles reabre a arquitetura. O primeiro corrige a
ambiguidade da preferência de exibição, fazendo o estado guardado declarar que houve escolha, de modo
que a lista vazia deixe de significar duas coisas e o conjunto de cartões abertos possa ser qualquer
um, inclusive todos. O segundo acrescenta duas leituras novas, o histórico de todas as pastas de
feature e a decomposição da feature ativa, ambas em camadas locais que reutilizam as funções de
leitura já exportadas pela sonda herdada, sem tocar num único arquivo vendorizado. O terceiro leva
esses dados a dois cartões novos e dá ao cabeçalho quatro ações, expandir tudo, recolher tudo,
resumir e copiar, sendo que as duas últimas atravessam o canal como texto pronto, montado por função
pura na tela, para que o host continue sem saber onde o Reversa guarda arquivo. O quarto troca todo
instante cru por texto no fuso de Brasília, numa função pura só, com o valor original preservado em
atributo.

O único ponto em que a superfície do host cresce é o das duas portas novas, rascunho e área de
transferência. Como o invariante do produto é a extensão nunca escrever arquivo, a mesma entrega que
acrescenta a capacidade endurece a guarda que a vigia, passando a proibir por teste a via de escrita
do próprio editor, que hoje ninguém usa e nada impede.

## 2. Princípios aplicados

O projeto não tem `.reversa/principles.md`. Na falta dele, os princípios vigentes são as restrições
declaradas em `_reversa_sdd/prd.md#6-restricoes`, tratadas aqui com o mesmo peso.

| Princípio | Como a feature se relaciona | Status |
|-----------|------------------------------|--------|
| A extensão nunca escreve arquivo, em camada alguma | O resumo é entregue por documento não salvo e por área de transferência, nenhum dos dois toca o disco. A guarda de fronteira é ampliada para cobrir a via de escrita do editor, hoje não vigiada | respeita |
| A camada de leitura é read-only por construção, com `node:fs` num módulo só | A leitura nova importa `listNames`, `readText` e `resolveInside` da sonda herdada, e nenhum módulo novo importa módulo de plataforma | respeita |
| Leitura e despacho ficam em camadas separadas, e a de leitura nunca ganha a de despacho | As portas de rascunho e de área de transferência são portas próprias, entregues ao painel e não à leitura, que segue pura | respeita |
| Todo arquivo herdado carrega carimbo e ritual de ressincronização | Nenhum arquivo de `src/heranca/` é alterado, logo carimbo e manifesto seguem válidos e a próxima ressincronização não ganha conflito | respeita |
| A webview não interpreta Markdown | O leitor das tabelas do Reversa vive na camada que já toca o disco. A tela apenas compõe texto de saída, o que não é interpretar | respeita |
| O painel não escreve o processo no estado da webview | A preferência continua sendo a única coisa guardada, agora com um campo a mais | respeita |

## 3. Decisões técnicas

| ID | Decisão | Justificativa | Alternativas descartadas | Confidência |
|----|---------|----------------|--------------------------|-------------|
| D-01 | A preferência guardada ganha o campo `declared`, e a leitura dela passa a distinguir escolha de ausência de escolha | É a causa exata do defeito: hoje `initialCollapsed` devolve o padrão sempre que a lista está vazia, e a preferência é recalculada a cada alternância, então abrir a última seção de diagnóstico fecha as outras duas | Guardar a lista de expandidas em vez das recolhidas, que só inverte a ambiguidade; guardar o conjunto inteiro por seção, que cresce a cada cartão novo | 🟢 |
| D-02 | Estado guardado por versão anterior é lido assim: lista não vazia conta como escolha declarada, lista vazia ou ausente conta como ausência | Preserva a preferência de quem já usa o painel e resolve a ambiguidade só daqui para frente, sem migração e sem perguntar nada ao usuário | Descartar todo estado antigo, que apagaria preferência legítima; gravar migração no primeiro uso, que exigiria escrever antes de o usuário mexer | 🟢 |
| D-03 | `initialCollapsed` vira `effectiveCollapsed`, função pura que continua sendo chamada a cada desenho | Com a escolha declarada, recalcular deixa de ser problema, e a decisão permanece testável sem navegador, como exige o requisito de manutenibilidade | Guardar o conjunto efetivo em estado de componente, que criaria uma segunda verdade sobre o que está aberto | 🟢 |
| D-04 | Os nomes de seção passam de seis para oito, com `decomposition` e `history` inseridos após `forward`, e um derivado novo lista os sete recolhíveis, isto é, todos menos a faixa de bloqueio | A ordem já é declarada num lugar só, e a suíte de marcação a lê de lá. As ações globais precisam saber quais cartões existem, e a faixa não é um deles | Tratar a faixa como cartão, que a tornaria ocultável e violaria a regra de bloqueio sempre visível | 🟢 |
| D-05 | O padrão inicial passa a recolher histórico, política, anomalias e sonda, mantendo anomalias aberta quando a leitura degradou, e deixa a decomposição aberta | A decomposição é núcleo da retomada, e o histórico é leitura longa. O padrão só vale enquanto não houver escolha declarada | Abrir os dois, que encheria a primeira dobra; fechar os dois, que esconderia a resposta central da feature | 🟡 |
| D-06 | A leitura das demais features vive em `src/probe/features.ts`, módulo local que importa `listNames`, `readText` e `resolveInside` de `src/heranca/reversa-probe/src/index.ts` | Mantém `node:fs` no único módulo que já o tinha, não altera arquivo vendorizado e não cria conflito para a próxima ressincronização | Adaptar `snapshot.ts`, que exigiria adaptação declarada e tornaria a ressincronização mais cara; abrir `node:fs` num módulo novo, que quebraria a construção read-only | 🟢 |
| D-07 | O julgamento das novas leituras vive em `src/domain/history.ts` e `src/domain/decomposition.ts`, puros, consumindo `findTable`, `splitSections` e `scanActions` do domínio herdado | Repete o corte que já existe entre sonda e domínio, e deixa as duas regras testáveis sem disco | Escrever o julgamento dentro da sonda, misturando quem lê com quem decide | 🟢 |
| D-08 | A contagem de ações exibida continua vindo de `scanActions`; a lista nova apenas acrescenta descrição e fase, e uma divergência entre as duas vira anomalia declarada | A contagem herdada varre o arquivo inteiro sem depender de cabeçalho, e é ela que o framework usa para decidir o estágio. Duas contagens que discordam em silêncio produziriam painel que mente | Substituir a contagem herdada pela nova, criando segunda verdade sobre o estágio | 🟢 |
| D-09 | O leitor da tabela de ações casa o cabeçalho normalizado e lê as células por posição, com queda para varredura linha a linha quando a tabela não casar | O arquivo é escrito por agente a partir de um template, e não emitido por código: acento, caixa ou coluna extra são divergências plausíveis. A queda garante que a lista nunca fique vazia por causa de um cabeçalho diferente | Casar o cabeçalho literalmente, que quebraria na primeira variação | 🟢 |
| D-10 | O protocolo cresce por acréscimo: `setProcess` ganha `history` e `decomposition`, e a webview ganha os comandos `openDraft` e `copyText` | A regra do contrato permite acrescentar, e proíbe renomear e remover. O comando reservado de despacho continua intocado | Reaproveitar `openFile` para o rascunho, que confundiria abrir um arquivo do projeto com abrir um documento novo | 🟢 |
| D-11 | O texto do resumo é montado por função pura na webview e viaja pronto até o host, que só o entrega ao editor | A suíte de fronteiras proíbe o host de conter caminho do Reversa ou nome de estágio, e montar o resumo lá dentro quebraria isso. A tela já tem os rótulos legíveis | Montar no host, que quebraria a fronteira; montar na camada de leitura, que a faria conhecer apresentação | 🟢 |
| D-12 | Duas portas novas, `DraftPort` e `ClipboardPort`, separadas de `EditorPort`, que continua expondo apenas abrir | Deixa a auditoria legível: quem lê os ports vê que abrir arquivo, abrir rascunho e copiar são capacidades distintas, e nenhuma delas escreve | Ampliar `EditorPort`, que apagaria a leitura de que ela só abre | 🟢 |
| D-13 | A suíte de fronteiras do host passa a proibir também a via de escrita do editor e a de sistema de arquivos assíncrona | Hoje a guarda cobre `writeFileSync` e vizinhos, e não cobre `workspace.fs`, `applyEdit`, `WorkspaceEdit` nem `fs/promises`. A entrega que acrescenta capacidade é o momento certo de fechar a porta | Deixar a guarda como está, apostando em disciplina | 🟢 |
| D-14 | O texto que a webview manda para rascunho ou cópia é validado no roteador: precisa ser texto e caber em 65.536 bytes, e é recusado com linha de log acima disso | O roteador é a fronteira de confiança e não presume forma. O teto é folgado para dezenas de features e barra envio absurdo | Aceitar qualquer tamanho, que faria o canal carregar o que ninguém lê | 🟡 |
| D-15 | O horário de Brasília sai de uma função pura só, que formata pelo nome do fuso e devolve declaração de ausência para entrada inválida | Um lugar só evita que cabeçalho, checkpoint, trilha e histórico divirjam. Formatar pelo nome do fuso, e não subtraindo três horas, mantém o painel correto se a lei mudar | Subtrair o deslocamento na mão, que envelhece mal; converter na leitura, que perderia a forma ordenável no fio | 🟢 |
| D-16 | O histórico é ordenado pelo nome da pasta, em ordem decrescente | O prefixo é sequencial ou de data conforme `setup.json`, e nos dois casos o nome ordena cronologicamente. Não depende de interpretar data escrita por agente | Ordenar pela data do adendo, que falta em feature sem adendo e pode vir malformada | 🟢 |
| D-17 | O recorte da decomposição é estado do componente, e não preferência guardada | Mesma decisão que a feature 003 tomou para a lista de anomalias: revelar o resto é gesto de momento, não configuração | Guardar o recorte, que somaria estado sem valor de retomada | 🟢 |
| D-18 | O resumo de uma linha de cada feature sai da seção de resumo do adendo; na falta dele, da primeira frase do resumo executivo do `requirements.md` da pasta; na falta das duas, a tela mostra o nome curto | Os adendos já chegam com corpo na leitura de hoje, e o `requirements.md` da pasta é um arquivo a mais por feature. A queda em três degraus evita linha vazia sem obrigar a ler tudo | Resumir por conta própria o texto da feature, o que faria a tela inventar conteúdo; não ter resumo, deixando só identificadores | 🟡 |
| D-19 | Situação e marca são dois eixos separados no histórico, e nenhum deles se chama estágio | Uma feature pausada pode estar em qualquer situação, e fundir os eixos obrigaria a escolher qual verdade contar. Nomes distintos evitam criar segunda autoridade sobre o estágio, que continua vindo do contrato herdado | Um só campo com valores combinados, que multiplicaria o vocabulário e colidiria com o estágio | 🟢 |

## 4. Premissas

Nenhuma. As três dúvidas do `requirements.md` foram resolvidas na sessão de esclarecimentos de
2026-09-09, e o documento chegou a este plano sem marcador `[DÚVIDA]`.

Duas decisões acima são inferidas e não confirmadas por fonte, e por isso vão marcadas 🟡: o padrão
inicial dos dois cartões novos, em D-05, e o teto de bytes do texto enviado ao rascunho, em D-14.

## 5. Delta arquitetural

A extração deste projeto é greenfield e não tem `architecture.md`. A coluna de origem aponta a spec
de componente correspondente em `_reversa_sdd/sdd/`.

| Componente | Arquivo de origem no legado | Tipo de mudança | Resumo |
|------------|------------------------------|-----------------|--------|
| painel-do-processo, preferência de exibição | `_reversa_sdd/sdd/painel-do-processo.md#9-modelo-de-dados` | regra-alterada | A preferência ganha a marca de escolha declarada, e a decisão do que abre recolhido deixa de reimpor o padrão sobre a escolha do usuário |
| painel-do-processo, ordem das seções | `_reversa_sdd/sdd/painel-do-processo.md#6-requisitos-funcionais` | regra-alterada | De seis nomes de seção para oito, com a lista dos sete recolhíveis derivada num lugar só |
| painel-do-processo, cabeçalho | `_reversa_sdd/sdd/painel-do-processo.md#8-design-e-interface` | componente-novo | Quatro ações novas: expandir tudo, recolher tudo, resumir em documento não salvo e copiar o resumo. O lugar reservado do despacho continua vazio e no mesmo ponto |
| painel-do-processo, cartão da decomposição | `_reversa_sdd/sdd/painel-do-processo.md#4-non-goals-fora-do-escopo` | componente-novo | Reabre o eixo da trilha de execução, que o PRD adiou, e acrescenta a lista de ações com fase, descrição e situação |
| painel-do-processo, cartão do histórico | `_reversa_sdd/prd.md#5-nao-objetivos-out` | componente-novo | Entrega o que já foi feito no projeto inteiro, uma linha por pasta de feature |
| painel-do-processo, instantes | `_reversa_sdd/sdd/painel-do-processo.md#8-design-e-interface` | regra-alterada | Todo instante passa pelo fuso de Brasília antes de ser desenhado |
| ponte-e-host, protocolo | `_reversa_sdd/sdd/ponte-e-host.md#9-modelo-de-dados` | contrato-alterado | Dois campos novos em `setProcess` e dois comandos novos da webview, por acréscimo. Detalhe em `interfaces/protocolo-webview.md` |
| ponte-e-host, portas | `_reversa_sdd/sdd/ponte-e-host.md#6-requisitos-funcionais` | componente-novo | `DraftPort` e `ClipboardPort`, com adaptadores no único arquivo que já importa o editor |
| ponte-e-host, guarda de fronteira | `_reversa_sdd/prd.md#6-restricoes` | regra-alterada | A suíte passa a proibir a via de escrita do editor, além da de sistema de arquivos que já proibia |
| leitura-do-processo, sonda local | `_reversa_sdd/sdd/leitura-do-processo.md#6-requisitos-funcionais` | componente-novo | `src/probe/features.ts`, que percorre as pastas de feature reutilizando as três funções de leitura da sonda herdada |
| leitura-do-processo, domínio local | `_reversa_sdd/sdd/leitura-do-processo.md#9-modelo-de-dados` | componente-novo | `src/domain/history.ts` e `src/domain/decomposition.ts`, puros, que julgam o que a sonda local leu |
| heranca-e-sincronia | `_reversa_sdd/sdd/heranca-e-sincronia.md#6-requisitos-funcionais` | sem mudança | Nenhum arquivo de `src/heranca/` é tocado, e as verificações de carimbo e manifesto seguem verdes |

## 6. Delta no modelo de dados

- Resumo das mudanças: a preferência guardada ganha um campo, o payload do processo ganha dois
  ramos novos, e nasce um vocabulário para a situação de cada feature no histórico. Nenhuma
  migração é necessária, porque a leitura da preferência antiga é total e o payload é reconstruído
  a cada leitura.
- Detalhe completo em: `_reversa_forward/006-cartoes-e-cronologia/data-delta.md`

## 7. Delta de contratos externos

| Contrato | Tipo | Arquivo de detalhe |
|----------|------|--------------------|
| Canal de mensagens entre a webview e o host | mensagem entre processos, mediada pelo editor | `_reversa_forward/006-cartoes-e-cronologia/interfaces/protocolo-webview.md` |

## 8. Plano de migração

Não há migração de dado persistido, e o motivo é que o único dado persistido é a preferência de
exibição, cuja leitura é total por construção. A ordem de execução, porém, importa, e é esta:

1. Corrigir a preferência e a decisão de recolhimento, com a suíte que hoje afirma o defeito
   reescrita para afirmar o comportamento correto. Sem isso, qualquer ação global seria desfeita no
   desenho seguinte.
2. Acrescentar os dois nomes de seção e o derivado dos recolhíveis, ajustando o padrão inicial.
3. Entregar as ações globais de expandir e recolher tudo, que já ficam corretas sobre a base acima.
4. Escrever a sonda local e o domínio local, com suíte própria de somente leitura, antes de haver
   qualquer tela que os consuma.
5. Ampliar o protocolo e a leitura do host, mantendo a webview capaz de ignorar os campos novos.
6. Desenhar os dois cartões novos e a formatação de instante.
7. Acrescentar as portas de rascunho e de área de transferência, e no mesmo passo endurecer a
   guarda de fronteira.
8. Rodar o preview fora do editor e observar os estados novos, que é o portão de saída herdado.

## 9. Riscos e mitigações

| Risco | Impacto | Probabilidade | Mitigação |
|-------|---------|---------------|-----------|
| A tabela de ações de uma feature vem com cabeçalho diferente do template, e a lista sai vazia | médio | média | Cabeçalho casado por forma normalizada, leitura por posição e queda para varredura linha a linha, conforme D-09 |
| A lista nova e a contagem herdada discordam, e o painel mostra números que se contradizem | alto | baixa | A contagem herdada continua sendo a autoridade, e a divergência vira anomalia visível, conforme D-08 |
| A capacidade de abrir rascunho erode o invariante de não escrever, agora ou numa feature futura | alto | média | Portas separadas, e guarda de fronteira ampliada para a via de escrita do editor, conforme D-12 e D-13 |
| Ler seis pastas de feature encarece a leitura e atrasa a primeira pintura | médio | baixa | Teto de cinquenta pastas, teto de bytes por arquivo herdado da sonda, e medição no portão visual. Hoje são seis pastas e 138 KB de tabelas |
| A formatação por nome de fuso falha num ambiente sem dados de fuso completos | médio | baixa | Verificar na investigação qual base de fuso o editor e o executor de teste embarcam, e declarar a queda para o texto original quando a conversão não for possível |
| O bundle da tela cresce além do teto com dois cartões e três módulos novos | baixo | baixa | A guarda automática do teto já falha o build, e a folga atual é de 240.550 bytes |
| O texto do resumo cresce sem limite num projeto com muitas features | baixo | média | Teto de 65.536 bytes validado no roteador, com recusa registrada em log, conforme D-14 |

## 10. Critério de pronto

- [ ] Todas as ações do `actions.md` marcadas `[X]`
- [ ] `cross-check.md` (se executado) sem CRITICAL nem HIGH
- [ ] `regression-watch.md` gerado
- [ ] O estado de todos os cartões abertos sobrevive a ocultar e reabrir o painel
- [ ] Nenhum instante em tempo universal cru resta na tela, verificado por busca no documento renderizado
- [ ] A suíte de fronteiras recusa a via de escrita do editor, com caso que falha se ela for usada
- [ ] Nenhum arquivo de `src/heranca/` alterado, com as verificações de carimbo e manifesto verdes
- [ ] Preview fora do editor executado, com os dois cartões novos e as quatro ações do cabeçalho observados na tela
- [ ] Re-extração reversa executada e sem regressão vermelha (recomendado, não obrigatório)

## 11. Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-09-09 | Versão inicial gerada por `/reversa-plan` | reversa |
