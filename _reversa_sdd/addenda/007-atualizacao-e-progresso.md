# Adendo: atualização e progresso visível

> Identificador da feature: `007-atualizacao-e-progresso`
> Data: `2026-09-09`
> Cenário: `greenfield`
> Gerado por: `/reversa-sync`

Este adendo é uma ponte. A extração em `_reversa_sdd/` descreve um produto que lê arquivos locais e
não fala com serviço algum: o PRD declara "nenhuma dependência em tempo de execução" e lista
"telemetria e qualquer tráfego de rede em tempo de execução" entre os não-objetivos. A entrega da
feature 007 emendou essa cláusula em um ponto e apenas em um: a extensão passou a consultar a origem
do próprio repositório para saber se ficou atrás, de leitura e sem identificar nada. Junto com a
consulta vieram três coisas que a extração não previa porque não precisava prever: uma versão que se
deriva sozinha a cada feature entregue, um comando de terminal que aplica a atualização até o pacote
reinstalável, e a barra de progresso em três cartões. Uma quarta mudança é correção de leitura, e não
acréscimo: a decomposição da feature ativa deixou de se exibir da ação mais antiga para a mais
recente. O que segue diz como ler cada artefato da extração enquanto a re-extração não vem.

## Vigência

Vigente desde 2026-09-09.

## Resumo da entrega

A feature respondeu a duas queixas de uso corrente sem acrescentar eixo novo ao painel. A primeira
nasceu de um fato novo do projeto: o repositório ganhou origem remota, e a extensão, distribuída por
pacote local e sem Marketplace, não tinha como saber que ficara para trás. A segunda era defeito de
leitura: a decomposição obrigava a rolar até o fim para achar onde o trabalho parou, e a razão entre
feito e total só existia como texto. Quem ganha nas duas frentes é o Retomador, persona primária, que
lê o painel depois de semanas de pausa e precisa do estado recente na primeira tela.

Quarenta e sete ações executadas, todas marcadas `[X]` em `actions.md` e registradas em
`progress.jsonl`, com um evento de medição e uma correção de rastro entre as quarenta e nove linhas
da trilha. Dezoito arquivos criados e quarenta e cinco modificados. A suíte terminou a entrega com
1123 casos verdes em 75 arquivos, e o portão visual rodou sobre os sete desfechos da consulta, os
sete estados de entrada e as três barras, nos quatro conjuntos de cores, em largura de barra lateral.

Duas separações organizam a entrega e valem para a leitura de tudo o que segue. A primeira é entre
**clone** e **extensão instalada**: o painel apenas pergunta e anuncia, sem tocar em disco, e a
atualização se aplica no clone, por comando explícito. A segunda é entre **conferir** e **aplicar**,
que são dois atos separados por argumento, pelo mesmo motivo que a spec de herança já dava para não
automatizar a ressincronização: mudança na origem pode exigir decisão que script nenhum toma.

**Nota de derivação da versão.** RN-06 fixa a versão em `0.<maior número de feature com adendo>.<commits desde o commit que acrescentou aquele adendo>`.
Este adendo é, portanto, parte do número que o próximo pacote vai carregar: enquanto ele não existia,
a derivação produzia `0.6.x`; com ele no histórico, a série passa a `0.7.x`. É a única vez em que um
artefato do `/reversa-sync` participa do produto, e não apenas o descreve.

## Impacto por artefato da extração

| Artefato | Seção | Tipo de impacto | Delta |
|---|---|---|---|
| `_reversa_sdd/prd.md` | `#5-nao-objetivos-out` | regra-alterada | **A emenda central desta feature, decidida em 2026-09-09.** O último não-objetivo era uma cláusula com dois conteúdos, e apenas um continua valendo integralmente. A telemetria segue proibida sem exceção: nada sai desta máquina sobre o que é lido, sobre qual workspace está aberto ou sobre quem o abriu. O tráfego de rede deixa de ser proibido em bloco e passa a ter uma exceção nomeada, a consulta de leitura à origem do próprio repositório, com os limites que RN-01 e RN-09 da feature fixam. Leia o item como duas proibições, uma intacta e uma com exceção única. |
| `_reversa_sdd/prd.md` | `#6-restricoes` | regra-alterada | A restrição técnica "Sem rede em tempo de execução" deixou de ser literal, pela emenda acima. O invariante da mesma seção, a extensão nunca escreve arquivo, sobreviveu intacto a uma feature cujo nome é atualizar: o atualizador é script de terminal e escreve apenas dentro do clone, isto é, na árvore versionada, na pasta de saída e no pacote gerado, e nunca no workspace que o painel observa. A restrição da camada de leitura pura também sobreviveu, e ganhou guarda: a suíte de fronteiras passou a recusar os dois módulos de rede do Node ao lado dos módulos de processo que já recusava. |
| `_reversa_sdd/prd.md` | `#7-dependencias-externas` | regra-nova | A seção abre com "Nenhuma em tempo de execução. A extensão não fala com serviço, API ou dado remoto". Passou a haver uma dependência, e só uma: a rota de comparação de commits da origem já configurada no repositório. Ela é opcional por configuração, anônima, de leitura, com tempo limite de cinco segundos e sem retentativa, e sua ausência não impede o painel de desenhar. Nenhum pacote novo entrou no arquivo de trava para atendê-la. |
| `_reversa_sdd/prd.md` | `#8-riscos` | regra-nova | Dois riscos da tabela ganharam mitigação que era proposta e agora é código. O do modelo vendorizado que diverge do framework pedia "carimbo de versão visível no painel": o cabeçalho passou a declarar a versão da extensão e o commit de que ela foi construída, em forma curta, com o valor integral em atributo consultável. O da ressincronização que depende de disciplina humana e não de garantia técnica ganhou o sinal que faltava: o painel diz, sem que ninguém pergunte, que o clone ficou atrás. |
| `_reversa_sdd/prd.md` | `#3-metricas-de-sucesso` | regra-nova | A métrica única, retomar projeto parado há trinta dias sem reler documentação nem inspecionar arquivos, ganhou duas peças que atacam o custo da primeira tela. A decomposição passou a se ordenar do evento mais recente para o mais antigo, com as abertas encabeçando na ordem do plano, de modo que onde o trabalho parou está no alto e não no fim da rolagem. A barra de progresso põe a razão entre feito e total em forma que se lê sem contar. Leia a métrica como instrumentada e agora servida por ordenação, não ainda como aferida. |
| `_reversa_sdd/prd.md` | `#pendencias-de-cobertura` | regra-alterada | O item 3, publicação no Marketplace adiada com a ressalva de que "o desenho não deve criar impedimento a ela", foi exercido e respeitado. O ritual de atualização é ritual de clone, disparado no terminal, e não canal de distribuição: se a publicação for reaberta, ele conviverá com o canal oficial em vez de competir com ele, porque a comparação com a origem é por commit, e não pelo número de versão, que é rótulo legível e não critério. Os itens 1, 2 e 4 seguem intocados. |
| `_reversa_sdd/sdd/ponte-e-host.md` | `#9-modelo-de-dados` | delta-de-contrato-externo | O protocolo cresceu por acréscimo, que é a única forma que a seção admite, e num ponto cresceu além do que o delta previa. Entraram `UPDATE_STATES`, `UPDATE_CAUSES`, a união discriminada `UpdateStatus` e o quarto comando do host, `setUpdate`, ao fim da lista. **Divergência a reconciliar, registrada como W032:** `SetProcessData` ganhou `extensionVersion` e `builtFromCommit`, contra o que `interfaces/delta-do-canal.md` da feature declara ("Nenhum campo novo em `SetProcessData`, `SetEntryData` ou `SetNoticeData`"). A razão é RF-17, que pede os dois itens de procedência "como o do modelo herdado", e o modelo herdado viaja na carga; a fronteira da tela proíbe importar valor de `src/host/`, de sorte que o carimbo não pode ser lido pelo painel. O desfecho da consulta, esse sim, viaja fora da carga, como o contrato manda, porque é assíncrono. O delta do canal precisa de emenda. |
| `_reversa_sdd/sdd/ponte-e-host.md` | `#8-design-e-interface` | componente-novo | Duas portas novas em `src/host/ports.ts`. `ConfigPort` lê a chave do editor no momento de perguntar, sem memorizar na ativação, e recua para verdadeiro diante de tipo estranho. `OriginPort` é a primeira porta de rede da extensão e expõe um método só, de leitura. A implementação de rede vive num módulo separado, `src/host/net.ts`, o único que abre conexão em todo o projeto. |
| `_reversa_sdd/sdd/ponte-e-host.md` | `#6-requisitos-funcionais` | regra-nova | O provedor passou a consultar a origem depois de entregar o processo, uma vez por leitura, apenas quando há processo a acompanhar, com geração que descarta a resposta de uma leitura que já não é a corrente. Uma linha de log por falha. A leitura nunca espera a origem: com a origem inacessível, o painel completo aparece dentro do prazo normal. |
| `_reversa_sdd/sdd/ponte-e-host.md` | `#11-edge-cases-e-tratamento-de-erros` | regra-nova | Sete desfechos nomeados para a consulta, e a distinção entre eles é o conteúdo desta linha. **Achado confirmado contra a origem real na fase de preparação, registrado como W015:** o código HTTP se lê antes do corpo, porque o corpo do 404 verdadeiro carrega um campo `status` com texto que confunde o intérprete se lido primeiro. Commit desconhecido pela origem é desfecho próprio, distinto de atraso e de estar em dia. Limite de taxa é impossibilidade com causa própria, distinta de ausência de rede. Campo ausente ou de tipo errado vira resposta inesperada, e não exceção. O intérprete é função pura, sobre dez fixtures gravadas da origem. |
| `_reversa_sdd/sdd/ponte-e-host.md` | `#12-seguranca-e-privacidade` | regra-nova | A seção continua verdadeira quanto ao que importa, e ganhou uma fronteira que não tinha. O módulo único de conexão valida repositório, commit e ramo antes de qualquer socket, manda dois cabeçalhos e nenhum corpo, não segue redirecionamento, limita bytes e tempo, e não importa sistema de arquivos nem processo. O endereço consultado é o da origem embutida na construção: nem a consulta nem o atualizador aceitam endereço por argumento ou por variável de ambiente, para que manutenção não vire vetor de busca de código arbitrário. Nenhuma credencial, nenhum identificador de máquina, nenhum nome de workspace, nenhum dado sobre o que foi lido. |
| `_reversa_sdd/sdd/ponte-e-host.md` | `#10-integracoes-e-dependencias` | regra-nova | A seção passa a ter uma integração de tempo de execução, e o lugar dela é este componente e nenhum outro. A capacidade de rede não desceu para a camada de leitura nem subiu para a tela, e duas suítes de fronteira guardam as duas bordas: a camada de leitura recusa os módulos de rede do Node, e o pacote da webview recusa endereço de rede e cliente de requisição. |
| `_reversa_sdd/sdd/painel-do-processo.md` | `#6-requisitos-funcionais` | regra-nova | O cabeçalho ganhou duas coisas. A procedência, com a versão da extensão e o commit curto de sete caracteres, o inteiro em `data-full`, ao lado dos itens que já existiam. E a linha do desfecho da consulta, em sete frases distintas decididas no domínio e apenas colocadas pelo componente. Duas distinções sustentam as frases, e são o que W010 e W014 vigiam: conferência desligada não é estar em dia, e commit desconhecido não é estar atrasado. O comando a copiar aparece só em atrasada e em divergente. |
| `_reversa_sdd/sdd/painel-do-processo.md` | `#8-design-e-interface` | componente-novo | A barra de progresso é uma peça só, `src/webview/ui/ProgressBar.tsx`, chamada pelos três cartões, e não três trechos parecidos. **Escolha de implementação registrada como W038:** ela é SVG, com a largura em atributo de apresentação, porque a política de estilo do painel não concede estilo em linha e classes só dariam passos grosseiros. Declara papel, mínimo, máximo (o total, não cem), valor corrente limitado ao denominador e texto equivalente não limitado, que repete a contagem escrita ao lado. |
| `_reversa_sdd/sdd/painel-do-processo.md` | `#9-modelo-de-dados` | delta-de-dados | O estado efetivo da tela ganhou o campo `update`, e a regra que o governa é a mesma da releitura que a seção já fixava: processo novo preserva o desfecho anterior, releitura também, e estado sem leitura por trás o apaga. **Distinção registrada como W036:** `update` nulo não é um oitavo estado, é ausência, e ausência não desenha linha. Workspace sem pasta nunca recebe desfecho, e um cabeçalho dizendo "consultando" ali descreveria consulta que não acontece. |
| `_reversa_sdd/sdd/painel-do-processo.md` | `#11-edge-cases-e-tratamento-de-erros` | regra-alterada | O EC-02, recorte por volume, e a regra própria que a feature 006 lhe deu na decomposição continuam de pé, e a ordem sob eles mudou. Abertas encabeçam na ordem do plano; fechadas seguem por recência decrescente, com ordenação estável em empate; ação sem instante vai ao fim do bloco a que pertence, preservando entre si a ordem do arquivo. **Consequência registrada como W033, e é a linha mais importante desta tabela para quem for reler código:** o recorte passou a ser um PREFIXO da ordem unificada, de modo que numa trilha que não registra instante algum as cinco fechadas exibidas são as PRIMEIRAS do arquivo, e não as últimas, como o código antigo fazia ao usar o índice como substituto de recência. |
| `_reversa_sdd/sdd/painel-do-processo.md` | `#7-requisitos-nao-funcionais` | regra-nova | Duas regras de acessibilidade entraram com a barra. A primeira, RN-10 da feature, proíbe a barra de ser a única portadora do número: o texto que conta as unidades permanece onde está em cada cartão, e o histórico ganhou a frase que conta as features, acrescentada por causa dessa proibição. A segunda pede contraste de ao menos 3:1 entre preenchimento e trilho nos quatro conjuntos de cores, incluindo os dois de alto contraste. O teto de 409.600 bytes do pacote da tela continua sendo o portão, e continua respeitado com as três barras dentro. |
| `_reversa_sdd/sdd/painel-do-processo.md` | `#12-seguranca-e-privacidade` | regra-nova | A tela continua sem abrir conexão, e a política de conteúdo do painel permanece sem permissão de conexão de saída. **Registrado como W031:** o desfecho da consulta não é escrito no estado que o editor guarda nem em preferência alguma, porque descreve este instante e não a configuração do usuário. Estado guardado carregando `update` é o sinal de violação. |
| `_reversa_sdd/sdd/empacotamento-e-verificacao.md` | `#6-requisitos-funcionais` | componente-novo | O ritual da atualização, em `scripts/atualizar.js`, é o componente novo desta seção e o único script do projeto que escreve na árvore versionada. Nasceu em dois atos separados por argumento explícito. A conferência busca as referências sem alterar a árvore de trabalho e termina em três desfechos com três códigos de saída, no vocabulário que o verificador de herança já usava. A aplicação, atrás de `--aplicar`, recusa árvore suja e commit local à frente antes de tocar em qualquer coisa, e depois percorre incorporação por avanço rápido, instalação de dependências quando a trava mudou, construção, suíte e empacotamento, parando na primeira falha, com o pacote anterior intacto. Ao fim imprime a linha de instalação já com o nome do pacote gerado. |
| `_reversa_sdd/sdd/empacotamento-e-verificacao.md` | `#9-modelo-de-dados` | delta-de-dados | A versão do pacote deixou de ser dado escrito à mão e passou a ser valor derivado, e essa é a mudança de modelo desta seção. `scripts/versao.js` é a autoridade sobre o número: maior número de feature com adendo, e não quantidade de adendos, para que adendo apagado ou superado não faça a versão recuar; commit que ACRESCENTOU o adendo, o mais antigo do histórico do arquivo, e não o último que o tocou. O número é escrito no manifesto apenas em torno do empacotador e restaurado em bloco de saída garantida, de modo que a árvore não fique suja. O pacote passa a se chamar pelo número derivado. |
| `_reversa_sdd/sdd/empacotamento-e-verificacao.md` | `#8-design-e-interface` | regra-nova | Três acréscimos à superfície de comandos. O carimbo da construção é gerado antes da compilação, no mesmo lugar em que a revisão do modelo já era gerada, e o arquivo gerado não é versionado. **Registrado como W035:** `pretest` também o gera, porque `extension.ts` importa arquivo não versionado e sem esse passo um clone recém-feito reprovaria em `npm test` antes da primeira construção. O preview ganhou `--atualizacao`, com os sete nomes de desfecho mais "nenhum", recusando valor fora da lista, e o README ganhou a seção própria do ritual, com os dois atos, os desfechos, a recusa da árvore suja e a regra da versão derivada. |
| `_reversa_sdd/sdd/empacotamento-e-verificacao.md` | `#11-edge-cases-e-tratamento-de-erros` | regra-nova | Casos de borda novos, todos com falha barulhenta e nenhum com recuo silencioso. Fora de clone git, ou sem adendo algum, a derivação recua para `0.0.0` e o empacotamento imprime qual das quatro causas ocorreu, em vez de inventar número. A impossibilidade de conferir nomeia a causa entre sem clone, sem remoto, git ausente e sem rede, e termina em dez segundos sem rede. **Registrado como W039:** o atualizador reconhece o erro do git pelo NOME além de `instanceof`, porque a suíte carrega os módulos por ES e por CommonJS e as duas cópias da classe não se reconhecem. |
| `_reversa_sdd/sdd/empacotamento-e-verificacao.md` | `#7-requisitos-nao-funcionais` | regra-nova | Duas exigências de manutenção intermitente entraram como requisito verificado. Rodar o atualizador duas vezes seguidas com o clone já em dia produz o mesmo desfecho, sem efeito colateral na segunda vez. E nem a consulta nem o atualizador fazem retentativa automática: falham uma vez, nomeiam a causa e devolvem o controle ao mantenedor, porque retentativa silenciosa esconde defeito de rede e de credencial. |
| `_reversa_sdd/sdd/heranca-e-sincronia.md` | `#6-requisitos-funcionais` | regra-alterada | Mudança única e de forma, não de comportamento: a chamada ao git que vivia em `scripts/heranca/leitura.js` passou a atravessar a porta única de `scripts/git.js`, que é agora a única entrada para o git em toda a família de scripts, com três usos e erro nomeado por causa distinguível. Nenhum arquivo vendorizado foi tocado, e a revisão do modelo herdado continua a mesma (`420305d`). |
| `_reversa_sdd/sdd/heranca-e-sincronia.md` | `#3-goals-objetivos` | regra-nova | O G-02, medir por um comando a defasagem entre cópia e origem em menos de dez segundos, ganhou um irmão de forma idêntica e objeto diferente: a conferência da atualização mede a defasagem entre clone e origem remota no mesmo prazo, com o mesmo vocabulário de códigos de saída. O painel tem prazo próprio e mais curto, cinco segundos, porque espera dentro de uma leitura. |
| `_reversa_sdd/sdd/heranca-e-sincronia.md` | `#4-non-goals-fora-do-escopo` | regra-nova | O NG-01, que proíbe automatizar a ressincronização porque mudança na origem pode exigir decisão que script nenhum toma, foi o precedente explícito do desenho em dois atos adotado aqui, e passa a valer para duas coisas em vez de uma. Nada se incorpora sem gesto do mantenedor, e o painel apenas anuncia. A pergunta de escopo foi respondida na sessão de esclarecimentos: "atualizar-se" abrange apenas o código desta extensão, e não o framework instalado no workspace nem a herança vendorizada, esta última por já ter ritual próprio. |
| `_reversa_sdd/sdd/leitura-do-processo.md` | `#7-requisitos-nao-funcionais` | regra-nova | A camada continua pura, e a fronteira que a mantém pura ficou mais larga: a suíte passou a recusar os dois módulos de rede do Node ao lado dos de processo que já recusava, que é a forma verificável de RN-02 enquanto a capacidade de rede cresce no host ao lado. A ordenação nova é feita uma vez por leitura, sobre lista já em memória, e não altera o teto de cinquenta pastas de feature por leitura. |
| `_reversa_sdd/sdd/leitura-do-processo.md` | `#9-modelo-de-dados` | delta-de-dados | Nenhuma mudança de comportamento na camada. O carimbo da construção entrou como constante de tempo de construção, no regime de `INHERITED_MODEL_REVISION` que RN-05 exige, e por isso não é lido em tempo de execução por ninguém. **Registrado como W034:** o ramo padrão é a quarta constante do carimbo, recuando para `master`, porque lê-lo do git em tempo de execução seria exatamente a leitura que RN-05 proíbe. A carga de fixture da suíte ganhou os dois campos de procedência. |

Resumo: 28 impactos registrados. Dezesseis de tipo `regra-nova`, cinco de `regra-alterada`, três de
`componente-novo`, três de `delta-de-dados` e um de `delta-de-contrato-externo`. Nenhum
`componente-extinto` nem `regra-removida`. A ausência dos dois merece uma frase, porque esta foi a
primeira feature a mexer numa restrição do PRD: nada foi retirado do produto, e a cláusula emendada
não foi removida, foi partida em duas, das quais uma segue absoluta. As cinco `regra-alterada` se
concentram no PRD e num ponto do painel, e nenhuma delas contradiz o invariante que a extração trata
como não negociável: a extensão nunca escreve arquivo.

## Regras sob vigilância

O watch principal de `regression-watch.md` continua **vazio**, pelo mesmo motivo das features 001 a
006: sem extração `/reversa` sobre este repositório não há regras 🟢, e sem regras 🟢 não há o que
vigiar. O que esta entrega deixou de verdades a manter está sem peso de regressão, e ganha peso
quando a primeira `/reversa` sobre este código confirmar cada uma.

Na seção "Observações", os identificadores **W001 a W030** cobrem os requisitos funcionais desta
feature, cada um com origem, regra esperada, tipo de verificação e sinal de violação. A
correspondência é um a um de `W001` a `W022`, sobre `RF-01` a `RF-22`, e de `W024` a `W030`, sobre
`RF-27` a `RF-33`; `W023` abrange três requisitos de uma vez, `RF-23` a `RF-25`, porque a ordem da
decomposição é regra única partida em três enunciados; e `W031` não é requisito funcional, e sim
RN-09, a regra de anonimato da consulta. **`RF-26` ficou sem identificador próprio**, que é a única
lacuna de rastro desta entrega: o requisito manda o recorte padrão e o controle que revela o resto
exibirem na mesma ordem em que selecionam, e quem o verifica é a suíte do recorte, não um watch
item. Os identificadores **W032 a W041** estão na subseção "Limitações e escolhas
conhecidas" e registram as dez decisões que uma extração futura leria como estranheza se não
estivessem escritas. Quatro delas são as que mais pesam sobre a leitura desta entrega, e por isso
aparecem nomeadas na tabela acima: a divergência do delta do canal (W032), o recorte que virou
prefixo da ordem unificada (W033), o ramo padrão no carimbo em vez de lido do git (W034) e a barra em
SVG por causa da política de estilo (W038).

**Ponto de atenção para quem rodar a próxima extração.** Esta feature reiniciou a numeração em W001,
como a 006 fez, e ao contrário da 005, que seguiu a contínua. O mesmo identificador nomeia, portanto,
regras diferentes em features diferentes, e citação de identificador só é legível junto do nome da
feature que o escreveu. Vale o mesmo para os `RF-NN` e `RN-NN`, que são locais a cada
`requirements.md`.

Conteúdo integral em `_reversa_forward/007-atualizacao-e-progresso/regression-watch.md`.

## Fontes

- `_reversa_forward/007-atualizacao-e-progresso/legacy-impact.md`
- `_reversa_forward/007-atualizacao-e-progresso/regression-watch.md`
- `_reversa_forward/007-atualizacao-e-progresso/requirements.md`
- `_reversa_forward/007-atualizacao-e-progresso/roadmap.md`
- `_reversa_forward/007-atualizacao-e-progresso/investigation.md`
- `_reversa_forward/007-atualizacao-e-progresso/data-delta.md`
- `_reversa_forward/007-atualizacao-e-progresso/onboarding.md`
- `_reversa_forward/007-atualizacao-e-progresso/interfaces/consulta-a-origem.md`
- `_reversa_forward/007-atualizacao-e-progresso/interfaces/delta-do-canal.md`
- `_reversa_forward/007-atualizacao-e-progresso/actions.md`
- `_reversa_forward/007-atualizacao-e-progresso/progress.jsonl`
