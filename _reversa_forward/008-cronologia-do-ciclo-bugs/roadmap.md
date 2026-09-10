# Roadmap: cronologia do ciclo de bugs

> Identificador: `008-cronologia-do-ciclo-bugs`
> Data: `2026-09-10`
> Requirements: `_reversa_forward/008-cronologia-do-ciclo-bugs/requirements.md`
> Confidência: 🟢 CONFIRMADO, 🟡 INFERIDO, 🔴 LACUNA

## 1. Resumo da abordagem

A feature entra pelas mesmas quatro costuras que a 006 abriu, e não pede arquitetura nova. A
primeira é o par sonda e domínio do código local: `src/probe/bugs.ts` varre `_reversa_bugs/` e
`src/domain/bugs.ts` julga o que ele leu, pelo mesmo corte que `probe/features.ts` e
`domain/history.ts` já praticam. A segunda é o protocolo, que cresce por acréscimo e ganha o campo
`bugs` em `setProcess`. A terceira é o cartão recolhível, onde entra `BugsSection.tsx` alimentado por
uma função pura que decide ordem, recorte e destaque numa passagem só. A quarta é a faixa de
bloqueio, cuja função passa a receber o registro ao lado do processo.

O que é genuinamente novo é uma capacidade de leitura: interpretar front matter. Ela vive num módulo
próprio, `src/domain/front-matter.ts`, restrito aos campos escalares de topo e à distinção entre
lista vazia e lista com itens, que é tudo de que o bloco precisa. O interpretador completo de YAML
não entra no pacote, e a razão é medida, não estética: o pacote é `out/` compilado, sem árvore de
dependências, e embarcá-lo mudaria o empacotamento inteiro para ler dez campos.

## 2. Princípios aplicados

Este projeto não tem `.reversa/principles.md`. O que funciona como princípio aqui são os invariantes
do PRD, verificados por suíte, e é contra eles que a feature se mede.

| Princípio | Como a feature se relaciona | Status |
|-----------|------------------------------|--------|
| A extensão nunca escreve arquivo, em camada alguma | Ler o registro de bugs não regenera projeção, não grava trava e não corrige inconsistência: onde encontra uma, declara. `tests/readonly-local.spec.ts` passa a varrer os módulos novos | respeita |
| A camada de leitura é pura: sem escrita, sem execução de processo, sem rede | Os dois módulos novos não importam módulo de plataforma algum e leem pelas três funções que a sonda herdada exporta | respeita |
| Nada do host sobrevive ao pacote da tela | O registro chega à tela como tipo, pelo protocolo, e o filtro de visibilidade acontece antes do canal | respeita |
| Leitura e despacho em camadas distintas | O bloco não roda comando algum. A faixa nomeia o comando do registrador, e quem o roda é o mantenedor | respeita |
| Nada de vendorizado é editado sem adaptação declarada | Duas consequências aceitas: o literal `_reversa_bugs` é redeclarado no código local, e os códigos de anomalia do registro vivem em união própria, fora da união fechada do herdado | respeita, com duas duplicações declaradas |

## 3. Decisões técnicas

| ID | Decisão | Justificativa | Alternativas descartadas | Confidência |
|----|---------|----------------|--------------------------|-------------|
| D-01 | A leitura se divide em `src/probe/bugs.ts`, que varre, e `src/domain/bugs.ts`, que julga, reutilizando `listNames`, `readText` e `resolveInside` do pacote herdado | É o corte que a casa já faz entre olhar e decidir, e é o que mantém `node:fs` num arquivo só do repositório inteiro | um módulo único; varrer de dentro de `probe/features.ts`; tocar o pacote herdado | 🟢 |
| D-02 | O front matter é lido por interpretador próprio e restrito, `src/domain/front-matter.ts`, e não pelo pacote `yaml` | Medida, não preferência: o pacote é `out/**`, `media/**`, manifesto e README, montado com `--no-dependencies`. Embarcar `yaml` exigiria dependência de produção, reinclusão em `.vscodeignore`, novo prefixo em `scripts/conteudo-esperado.js` e revisão do empacotamento, e levaria 796 KB de distribuição para dentro do teto de 2 MiB, para ler dez campos escalares. É a saída que o requisito não funcional de tamanho já previa | embarcar `yaml` como dependência de produção; empacotar o host com esbuild só para embutir a biblioteca; voltar a ler `generated/`, que RF-11 proíbe | 🟢 |
| D-03 | O interpretador reconhece escalar de topo e distingue lista vazia de lista com itens; bloco aninhado é campo que ele declaradamente não lê | Todos os dez campos que o bloco desenha são escalares de topo, e de `blocking` o bloco só precisa saber se há item, porque RF-10 nomeia a condição e não o texto dela | interpretar o documento inteiro; ler o corpo em Markdown além do front matter | 🟢 |
| D-04 | Os códigos de anomalia do registro vivem em união local, em `src/domain/types.ts`, com a mesma forma de `Anomaly`, e a seção de anomalias passa a receber a forma estrutural comum | `AnomalyCode` é união fechada em arquivo vendorizado: estendê-la custaria adaptação declarada e conflito na próxima ressincronização, para ganhar nada que a forma comum não dê | acrescentar códigos ao herdado; reaproveitar um código existente com sentido torcido; seção de anomalias própria do bloco | 🟢 |
| D-05 | A data ganha função irmã em `src/webview/domain/instants.ts`, que reformata sem construir `Date` e sem converter fuso | `new Date('2026-09-10')` é meia-noite em tempo universal, e convertida para Brasília mostraria o dia anterior. RN-06 já diz que conversão de fuso não se aplica a valor sem hora; a armadilha é que o código erraria em silêncio | reusar `brasiliaInstant`; converter no host; exibir a data crua | 🟢 |
| D-06 | Ordem, recorte e destaque saem de uma função só, `bugsView()` em `src/webview/domain/bugs-view.ts`, que devolve os grupos já ordenados e já recortados | É o remédio de D-14 da feature 007, aplicado antes de o defeito nascer: selecionar num lugar e exibir noutro é o que faz a lista certa aparecer na ordem errada | ordenar no componente; ordenar na camada de leitura; recortar em função separada da que ordena | 🟢 |
| D-07 | Revelar o resto de um grupo é estado do componente, por grupo, e não preferência guardada | Precedente de D-17 da feature 003 e da lista de anomalias: o que se expande para olhar agora não é escolha a sobreviver ao painel | guardar por grupo na preferência; um controle único para todos os grupos | 🟢 |
| D-08 | `blockingReasons()` passa a receber o registro como segundo argumento, ao lado do processo | O registro não vive dentro do processo, e enfiá-lo lá criaria uma segunda autoridade sobre o que o leitor herdado devolve | ler o registro de dentro da função; faixa própria do bloco | 🟢 |
| D-09 | O nome `bugs` entra em `SECTION_NAMES` logo depois de `history` e em `DEFAULT_COLLAPSED`; `sections.ts` não muda | A ordem e o recolhimento padrão são declarados num arquivo só, e a suíte de marcação lê o documento contra ele | escrever o nome no componente; ordem calculada a partir do conteúdo | 🟢 |
| D-10 | O registro viaja como campo novo `bugs` de `SetProcessData`, por acréscimo | Regra do contrato fixada na feature 002: acrescentar é permitido, renomear e remover não. Uma tela anterior ignora o campo, e um host anterior não o envia, o que a tela nova trata como leitura não realizada | comando de host próprio; segundo `setProcess` | 🟢 |
| D-11 | O bug restrito é filtrado na camada de leitura, e o registro carrega apenas a contagem dos omitidos | O requisito não funcional de privacidade exige que o conteúdo não atravesse o canal, e não apenas que a tela não o desenhe. Filtrar na tela deixaria título e identificador viajarem | filtrar no componente; enviar tudo e marcar o restrito | 🟢 |
| D-12 | A varredura desce apenas em `<contexto>/bugs/<ID>/` e lê dois arquivos por pasta: `bug.md` e `DONE.md` | RF-11 proíbe consumir `generated/`, e `intake/` e `inspections/` não têm nada que o bloco desenhe. Uma passagem de `listNames` por pasta de bug responde às duas perguntas | varrer o contexto inteiro; usar a projeção `catalog.jsonl`, que RF-11 proíbe | 🟢 |
| D-13 | `BUG_CAP` de cinquenta e o literal `_reversa_bugs` ficam em `src/domain/limits.ts`, ao lado de `FEATURE_FOLDER_CAP` | O módulo existe exatamente para o número escrito no ponto de uso não divergir depois. O literal é duplicação em relação a `policy.ts` herdado, aceita porque editar vendorizado custa adaptação declarada | número escrito na sonda; importar do herdado, que não o exporta | 🟡 |
| D-14 | A data de encerramento sai do texto do `DONE.md`, pela linha `Data:`; sem ela, o bloco declara a trava sem data | A trava é o fato do encerramento e traz a data escrita. A data de modificação do arquivo está recusada por RN-06 | usar a modificação do arquivo; usar `updated` como data de encerramento | 🟢 |
| D-15 | A contagem que a barra e os subtítulos usam vem do que a leitura encontrou no disco, e a lista desenhada é medida contra ela | RN-05 e o precedente da decomposição: onde os dois números divergirem, a divergência é declarada | contar o que a tela desenha; recontar na tela | 🟢 |

## 4. Premissas

Nenhuma premissa herdada de `[DÚVIDA]`. As três lacunas da versão inicial do `requirements.md` foram
fechadas na sessão de esclarecimento de 2026-09-10, registrada na seção 9 daquele documento.

| Premissa | Origem (`requirements.md` seção) | Risco se errada |
|----------|----------------------------------|-----------------|
| n/a | n/a | n/a |

Duas verificações precisam acontecer nas primeiras ações do `actions.md`, e são de implementação, não
de requisito. A primeira é o custo real do cartão novo no pacote da tela, medido contra o teto de
400 KiB de `scripts/limites.js`. A segunda é o comportamento do interpretador restrito contra os três
`bug.md` que existem hoje, que trazem títulos com dois-pontos e listas de objetos aninhados: é o
material que separa o leitor suficiente do leitor ingênuo.

## 5. Delta arquitetural

| Componente | Arquivo de origem no legado | Tipo de mudança | Resumo |
|------------|------------------------------|-----------------|--------|
| Sonda do registro de bugs | `_reversa_sdd/sdd/leitura-do-processo.md#5-componentes` | componente-novo | `src/probe/bugs.ts` varre `_reversa_bugs/<contexto>/bugs/` até o teto, sem tocar em `generated/` |
| Interpretador de front matter | `_reversa_sdd/sdd/leitura-do-processo.md#5-componentes` | componente-novo | `src/domain/front-matter.ts`, restrito a escalares de topo, puro e sem disco |
| Julgamento do registro | `_reversa_sdd/sdd/leitura-do-processo.md#5-componentes` | componente-novo | `src/domain/bugs.ts` monta grupos, contagens, inconsistências e anomalias |
| Vocabulário do domínio local | `src/domain/types.ts` | contrato-alterado | Ganha os tipos do registro e a união local de códigos de anomalia |
| Limites do tempo de execução | `src/domain/limits.ts` | regra-alterada | Ganha o teto de bugs por passagem e o nome da pasta do registro |
| Camada de leitura do host | `_reversa_sdd/sdd/leitura-do-processo.md#5-componentes` | regra-alterada | `readWorkspace()` chama a sonda nova dentro do mesmo `try` e devolve o registro no payload |
| Protocolo host e tela | `_reversa_sdd/sdd/ponte-e-host.md#6-requisitos-funcionais` | contrato-alterado | `SetProcessData` ganha `bugs`, por acréscimo; detalhe em `interfaces/protocolo-webview.md` |
| Ordem das seções | `_reversa_sdd/sdd/painel-do-processo.md#6-requisitos-funcionais` | regra-alterada | `SECTION_NAMES` ganha `bugs` depois de `history`, e `DEFAULT_COLLAPSED` também |
| Decisão de apresentação do bloco | `_reversa_sdd/sdd/painel-do-processo.md#6-requisitos-funcionais` | componente-novo | `src/webview/domain/bugs-view.ts` decide ordem, recorte e próximo a tratar |
| Cartão do registro | `_reversa_sdd/sdd/painel-do-processo.md#6-requisitos-funcionais` | componente-novo | `src/webview/ui/BugsSection.tsx`, que só chama as funções puras |
| Faixa de bloqueio | `_reversa_sdd/sdd/painel-do-processo.md#6-requisitos-funcionais` | contrato-alterado | `blockingReasons()` passa a receber o registro e ganha as três condições de RF-10 |
| Seção de anomalias | `_reversa_sdd/sdd/painel-do-processo.md#6-requisitos-funcionais` | contrato-alterado | Passa a receber a forma estrutural comum, para desenhar as duas origens |
| Integridade da leitura | `src/webview/domain/integrity.ts` | regra-alterada | Passa a contar também as anomalias do registro |
| Rótulos e datas | `src/webview/domain/labels.ts`, `src/webview/domain/instants.ts` | regra-alterada | Rótulos de estado, fase, severidade e prioridade; função de data sem fuso |

## 6. Delta no modelo de dados

- Resumo das mudanças: nada persistido muda, porque a extensão não escreve. O que muda é o modelo
  em memória: entram o registro, o grupo por contexto e a entrada de bug, todos derivados de arquivo
  que outro agente escreveu, e todos com campo declarável como ausente. A preferência de
  recolhimento ganha um nome válido a mais, `bugs`, e o leitor de preferência já descarta nome que
  não reconhece.
- Detalhe completo em: `_reversa_forward/008-cronologia-do-ciclo-bugs/data-delta.md`

## 7. Delta de contratos externos

| Contrato | Tipo | Arquivo de detalhe |
|----------|------|--------------------|
| Canal de mensagens entre a tela e o host | mensagem entre processos | `_reversa_forward/008-cronologia-do-ciclo-bugs/interfaces/protocolo-webview.md` |
| Registro de bugs em disco | arquivo | `_reversa_forward/008-cronologia-do-ciclo-bugs/interfaces/registro-de-bugs.md` |

## 8. Plano de migração

Não há dado a migrar: a extensão nada persiste além da preferência de recolhimento, que cresce por
nome novo e já tolera nome desconhecido. O que existe é ordem de implantação, e ela importa porque
cada passo é verificável sozinho.

1. Limites e vocabulário: `limits.ts` e `types.ts` ganham o teto, o nome da pasta e os tipos do
   registro, sem que nada os consuma ainda.
2. Interpretador restrito de front matter, com suíte contra os três `bug.md` reais e contra as formas
   degradadas: sem front matter, truncado, campo desconhecido, bloco aninhado.
3. Sonda e julgamento, com suíte sobre árvore sintética: contexto único, dois contextos, teto
   estourado, `generated/` apagado, restrito, resolvido sem trava e trava sem resolvido.
4. Camada de leitura e protocolo: o registro passa a viajar, e a suíte de paridade do contrato
   confere as duas declarações.
5. Funções puras da tela: ordem, recorte, destaque e rótulos, com cobertura integral de linhas.
6. Cartão, faixa de bloqueio e anomalias, com a suíte de marcação lendo o documento renderizado.
7. Medição do pacote da tela contra o teto, e do pacote da extensão contra o dele.

## 9. Riscos e mitigações

| Risco | Impacto | Probabilidade | Mitigação |
|-------|---------|---------------|-----------|
| O interpretador restrito lê mal um front matter legítimo, e o bloco perde um bug de vista | alto | médio | Suíte contra os três `bug.md` reais antes de qualquer componente, e toda falha de leitura vira anomalia nomeada em vez de linha ausente em silêncio |
| A data exibida recua um dia por conversão indevida de fuso | alto | médio | D-05 proíbe construir `Date` a partir da data; a suíte fixa o caso de um dia de fronteira |
| O painel vira segunda autoridade sobre o vocabulário de estado e fase do registrador | médio | alto | Valor desconhecido é desenhado cru e marcado como não reconhecido, como RF-12 pede, e o data-delta registra que a autoridade continua sendo o schema do registrador |
| O cartão novo empurra o pacote da tela contra o teto de 400 KiB | médio | baixo | Medição na primeira e na última ação; o cartão reusa a barra de progresso e a seção recolhível que já existem |
| Um `bug.md` acima do teto de 256 KiB do leitor herdado não é lido | baixo | baixo | Vira anomalia com arquivo e código, e o bloco desenha o resto, que é a degradação já normativa |
| A duplicação do literal `_reversa_bugs` diverge do herdado numa ressincronização futura | baixo | baixo | O nome fica em `limits.ts`, num lugar só do código local, e o data-delta declara a duplicação |

## 10. Critério de pronto

- [ ] Todas as ações do `actions.md` marcadas `[X]`
- [ ] `cross-check.md` (se executado) sem CRITICAL nem HIGH
- [ ] `regression-watch.md` gerado
- [ ] Cobertura integral de linhas nas funções puras do bloco
- [ ] Pacote da tela e pacote da extensão medidos abaixo dos tetos de `scripts/limites.js`
- [ ] Re-extração reversa executada e sem regressão vermelha (recomendado, não obrigatório)

## 11. Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-09-10 | Versão inicial gerada por `/reversa-plan` | reversa |
