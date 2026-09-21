# Requirements: botão do prompt de correção na fonte

> Identificador: `013-botao-do-prompt`
> Data: `2026-09-20`
> Pasta da extração reversa: `_reversa_sdd/`
> Confidência: 🟢 CONFIRMADO, 🟡 INFERIDO, 🔴 LACUNA / DÚVIDA

## 1. Resumo executivo

O painel passa a oferecer um botão que compõe, a partir da leitura já feita, o prompt com que o
mantenedor confronta o harness do projeto observado a respeito dos checkpoints que terminaram sem
dizer que terminaram. O texto sai pronto para a área de transferência, ou como documento não salvo,
pelo mesmo par de destinos que o resumo já usa. O problema que resolve é a última milha da feature
012: promovidas as equivalências, as anomalias que sobram não devem ser traduzidas, porque o defeito
está em quem grava, e o conserto é na fonte. Hoje esse prompt é escrito à mão; a partir daqui ele é
derivado do que o painel leu. Para que o texto nomeie o campo culpado, o eixo do estado da descoberta
passa a carregar a forma elidida do checkpoint desviante, e um comando de manutenção, fora da
extensão, cobre o caso de vários projetos numa passada.

## 2. Contexto a partir do legado

| Fonte | Trecho relevante | Confidência |
|-------|------------------|-------------|
| `_reversa_sdd/addenda/012-equivalencias-de-checkpoint.md#o-que-ainda-espera-decisão-humana` | O adendo vigente declara que o mapa entregue estava vazio e que a proposta trazia 6 pares e 17 entradas esperando marcação. Registra também o caso que nenhum par cobre, o `plano_aprovado`, e o classifica como julgamento de quem conhece o projeto, não de quem lê o disco | 🟢 |
| `_reversa_sdd/addenda/012-equivalencias-de-checkpoint.md#resumo-da-entrega` | A causa da deriva está nomeada na fonte: `completed_at` aparece em dois arquivos de referência do Reversa e em nenhum dos mais de vinte `SKILL.md` que mandam salvar checkpoint, de modo que cada sessão inventa o seu nome. É o diagnóstico que esta feature transforma em pedido | 🟢 |
| `_reversa_sdd/addenda/011-estado-terminal-e-checkpoints.md#impacto-por-artefato-da-extração` | A leitura da 011 permanece inteira: checkpoint sem `completed_at` não declara conclusão, e o instante vem apenas do campo canônico. A situação `conclusao-nao-declarada` é exatamente o insumo deste botão | 🟢 |
| `_reversa_sdd/addenda/006-cartoes-e-cronologia.md#resumo-da-entrega` | A entrega que criou o resumo consultável e o par de destinos, documento não salvo e área de transferência, com o texto composto na tela por função pura e o host apenas entregando-o ao editor | 🟢 |
| `_reversa_sdd/sdd/painel-do-processo.md#6-requisitos-funcionais` | RF-08 fixa a lista composta de anomalias com arquivo, código e detalhe; RF-13 exige que toda decisão de apresentação viva em função pura separada do componente; RF-15 reserva no cabeçalho o lugar nomeado e vazio da ação de despacho | 🟢 |
| `_reversa_sdd/sdd/painel-do-processo.md#4-non-goals-fora-do-escopo` | NG-04 mantém fora de escopo o botão de disparar agente, e é a fronteira que esta feature encosta sem atravessar: compor um texto para quem o cole não é despachar agente | 🟢 |
| `_reversa_sdd/sdd/painel-do-processo.md#12-segurança-e-privacidade` | "Nada é enviado a lugar algum, e a política de segurança do documento bloqueia qualquer requisição externa." A promessa continua verdadeira, e ganha um limite a declarar: o que o painel entrega à área de transferência o leitor levará adiante | 🟢 |
| `_reversa_sdd/sdd/leitura-do-processo.md#4-non-goals-fora-do-escopo` | NG-01 proíbe a camada de leitura de escrever, criar, remover ou renomear arquivo; NG-05 proíbe corrigir, normalizar ou sanear o que o Reversa escreveu. Nenhum dos dois é tocado aqui, porque compor texto não escreve arquivo e o conserto fica com o harness | 🟢 |
| `_reversa_sdd/sdd/leitura-do-processo.md#7-requisitos-não-funcionais` | RNF-04 exige que a camada de leitura não tenha nenhuma função capaz de escrever, criar, remover ou executar, verificável por inspeção do módulo que toca o disco | 🟢 |
| `src/host/protocol.ts` | O canal já tem `copyText` e `openDraft` entre os sete comandos da webview, e `SUMMARY_TEXT_CAP` já os limita. Nenhum comando novo é necessário, e `dispatch` segue reservado sem tratador | 🟢 |
| `src/host/adapters.ts`, `src/host/ports.ts`, `src/host/provider.ts` | A área de transferência é porta do host, `vscode.env.clipboard.writeText`, viva desde a feature 006 e apartada da camada de leitura. RNF-04 fala do módulo que lê o disco, e não a alcança | 🟢 |
| `src/webview/domain/summary.ts` | O precedente exato da composição: função pura do payload, determinística por requisito e não por conveniência, com a nota de que um texto que consultasse o relógio faria o documento e a cópia divergirem na mesma sessão | 🟢 |
| `src/domain/types.ts` | `CheckpointState` carrega agente, situação, instante, `camposComLista` e `reconhecidoPor`, e nada do bruto do checkpoint; `DiscoveryStateAxis` carrega os checkpoints, as anomalias, as absorvidas e os registros que não são agentes | 🟢 |
| `src/webview/ui/Header.tsx` | O cabeçalho já abriga os dois botões do resumo, o auxiliar `Action` que desabilita o que não teria efeito, a confirmação de cópia em linha e o lugar vazio do despacho | 🟢 |
| `perguntas/respostas/respostas-equivalencias-2026-09-20.md` | Três das onze respostas de 2026-09-20 dizem a mesma coisa, palavra por palavra: "Está incompleto. É bom gerar um prompt para eu confrontar o agent harness e ele olhar e arrumar". São o pedido que origina esta feature | 🟢 |
| `perguntas/prompt-harness.md` | O prompt escrito à mão em 2026-09-20, com a norma, os quatro pedidos em ordem, a lista do que não fazer e os três casos transcritos. Serve de modelo do texto a compor, e não de fonte a ler: a pasta é ignorada pelo git e não é artefato do Reversa | 🟢 |
| Medição dos 64 projetos com `.reversa/state.json` em `~/dev`, refeita em 2026-09-20 com o mapa já promovido | 229 checkpoints, e exatamente **3** em `conclusao-nao-declarada`, um por projeto: `TECH+/redator_progress`, `ps-iagerasmlk/scout` e `transc_audio_mlx/archaeologist`. Nenhuma raiz acumula mais de um caso, o que iguala hoje o prompt do conjunto e o prompt por linha | 🟢 |
| `src/domain/discovery-state.ts`, função `camposComLista` | Ela devolve apenas campos cujo valor é lista de textos, e apenas quando `files` está ausente. Daí o achado que decidiu a sessão de dúvidas: dos três casos reais, dois chegam ao painel sem campo algum nomeado, e o terceiro chega sem os contadores que sustentam o argumento | 🟢 |
| `scripts/equivalencias/elidir.js` | A elisão da 012, pura e de vinte linhas: preserva as chaves todas e os escalares de até 40 caracteres, e troca lista, texto longo, caminho de sistema e objeto por marcador de forma. `tests/equivalencias-elisao.spec.ts` já a exercita contra estes mesmos checkpoints | 🟢 |
| `src/host/root.ts` e `_reversa_sdd/sdd/ponte-e-host.md#14-open-questions` | `chooseRoot` observa uma raiz por leitura e declara as outras em `ignoredRoots`. Enxergar além dela é a OQ-01 da ponte, feature própria e ainda não decidida | 🟢 |
| `scripts/aprender-equivalencias.js`, função `lerEstados` | A varredura dos `state.json` de uma raiz já existe, com til resolvido e projeto nomeado, fora do `npm run build` e sem nada embarcado no pacote. É sobre ela que o comando agregado se assenta | 🟢 |
| `tests/limites.spec.ts` e `src/heranca/reversa-domain/tests/hook-parity.spec.ts` | Os dois precedentes de duplicação segura: a suíte importa o módulo de `scripts/` e o confronta com a transcrição, de modo que a divergência aparece na hora em que nasce, e não na máquina de quem instalou | 🟢 |

## 3. Personas e cenários de uso

| Persona | Objetivo | Cenário-chave |
|---------|----------|---------------|
| Mantenedor do painel (iago) | Levar ao harness do projeto observado o defeito de gravação, sem transcrever checkpoint à mão | Abre o painel numa raiz cujo checkpoint ficou sem conclusão declarada, clica em copiar o prompt e cola numa sessão aberta naquela raiz |
| Mantenedor do Reversa, no papel de quem conserta a fonte | Descobrir qual `SKILL.md` manda gravar checkpoint sem nomear `completed_at` | Recebe o prompt colado, examina as saídas em disco, grava os campos canônicos e propõe o texto a acrescentar na skill culpada |
| Operador de outro projeto | Entender por que o painel cobra conclusão de um checkpoint que ele considera pronto | Lê o prompt como explicação, antes de pedir conserto a quem quer que seja: o texto declara a norma e diz por que o painel não aceita o campo que está lá |

## 4. Regras de negócio novas ou alteradas

1. **RN-01:** Pedir não é consertar. O painel compõe o texto do pedido e o entrega a quem o leve; não grava campo, não renomeia nada e não invoca ferramenta alguma. 🟢
   - Origem no legado: `_reversa_sdd/sdd/leitura-do-processo.md#4-non-goals-fora-do-escopo`, NG-01 e NG-05
   - Tipo: nova
2. **RN-02:** Compor não é despachar. O texto vai para a área de transferência ou para um documento não salvo, e nunca para um terminal, uma sessão de agente ou um processo filho. NG-04 do painel continua de pé, e o lugar reservado do despacho continua vazio. 🟢
   - Origem no legado: `_reversa_sdd/sdd/painel-do-processo.md#4-non-goals-fora-do-escopo`, NG-04
   - Tipo: nova
3. **RN-03:** O prompt afirma apenas o que esta leitura leu, e o que a norma do Reversa documenta. Pode dizer que o par canônico é `completed_at` com `files`, porque o `checkpoint-guide.md` o manda; não pode dizer quantos projetos desviam nem em quantos vocabulários, porque isso é medição de um conjunto que o painel não observa. 🟢
   - Origem no legado: `_reversa_sdd/sdd/leitura-do-processo.md#4-non-goals-fora-do-escopo`, NG-03, que reserva ao painel decidir o que a tela mostra, e não inventar o que ela não leu
   - Tipo: nova
4. **RN-04:** O insumo do prompt é o checkpoint em `conclusao-nao-declarada`, e só ele. Checkpoint concluído não tem defeito a relatar; em andamento declarou-se pelo campo que o esquema tem; reconhecido por equivalência já foi decidido por gente, e o prompt que o questionasse desfaria a decisão da 012. A situação `falhou` também fica fora, pela mesma razão. 🟢
   - Origem no legado: `_reversa_sdd/addenda/011-estado-terminal-e-checkpoints.md#impacto-por-artefato-da-extração` e `_reversa_sdd/addenda/012-equivalencias-de-checkpoint.md#resumo-da-entrega`
   - Tipo: nova
5. **RN-05:** Sem insumo não há prompt. Não havendo checkpoint em `conclusao-nao-declarada`, a ação fica desabilitada, como já ficam as de expandir e recolher quando não teriam efeito. Um prompt vazio é pior que ausência de botão, porque pede conserto de coisa nenhuma. 🟢
   - Origem no legado: `src/webview/ui/Header.tsx`, auxiliar `Action`, e `_reversa_sdd/sdd/painel-do-processo.md#6-requisitos-funcionais`, RF-04
   - Tipo: nova
6. **RN-06:** Ausência de eixo não é ausência de defeito. Host anterior à feature 011 não manda `discoveryState`, e nesse caso a ação fica desabilitada declarando que a leitura do estado não aconteceu, nunca que o projeto está são. É a distinção que toda feature desde a 008 mantém entre ausente e vazio. 🟢
   - Origem no legado: `src/host/protocol.ts`, comentário de `discoveryState`
   - Tipo: nova
7. **RN-07:** O texto é função pura da leitura. O mesmo payload produz o mesmo prompt, byte a byte, na cópia e no documento; nada consulta relógio, ambiente ou aleatoriedade. 🟢
   - Origem no legado: `src/webview/domain/summary.ts`, que documenta o risco de divergência entre os dois destinos
   - Tipo: nova
8. **RN-08:** O prompt nomeia a raiz observada, porque o pedido só faz sentido numa sessão aberta nela. O painel já recebe `root` no payload, e o prompt manual abre justamente dizendo onde colar. 🟢
   - Origem no legado: `src/host/protocol.ts`, campo `root` de `SetProcessData`
   - Tipo: nova
9. **RN-09:** O prompt pede o conserto na fonte e proíbe o conserto silencioso. A ordem dos quatro pedidos é a do texto manual, e o quarto termina em "não aplique sem eu ver", porque a proposta de alteração de skill é decisão de quem mantém o Reversa. 🟢
   - Origem no legado: `perguntas/prompt-harness.md`
   - Tipo: nova
10. **RN-10:** A confirmação da cópia é linha, não diálogo. O painel não interrompe quem lê, e a confirmação vive no cabeçalho, como a do resumo. 🟢
    - Origem no legado: `src/webview/ui/Header.tsx`, estado `copied`, e `src/host/ports.ts`, nota da porta da área de transferência
    - Tipo: nova
11. **RN-11:** O que entra no prompt sai do computador. A promessa de que nada é enviado a lugar algum continua verdadeira do painel para fora, e ganha aqui um limite declarado por escrito: o texto entregue será colado numa sessão de agente e lido por um modelo, de modo que cada campo transcrito é um campo publicado por decisão de quem cola. O que torna a decisão defensável é a elisão da RN-12, e não a confiança de quem clica. 🟢
    - Origem no legado: `_reversa_sdd/sdd/painel-do-processo.md#12-segurança-e-privacidade`
    - Tipo: nova
12. **RN-12:** O prompt transcreve a **forma** do checkpoint, e não o seu conteúdo. Vale a regra já escrita e já testada da feature 012: chaves todas preservadas, escalares de até quarenta caracteres preservados, e lista, texto longo, caminho de sistema e objeto substituídos por marcador que diz a forma. É o que faz o prompt nomear `timestamp` e os contadores de `items_done` sem carregar achados, caminhos de scratchpad nem listas de arquivos do projeto. 🟢
    - Origem no legado: `scripts/equivalencias/elidir.js` e `tests/equivalencias-elisao.spec.ts`
    - Tipo: nova
13. **RN-13:** A elisão acontece na leitura, uma vez, e nunca na tela. O eixo entrega o checkpoint já elidido, de modo que a webview jamais vê o bruto e a promessa de privacidade se verifica olhando a fronteira, não os componentes. 🟢
    - Origem no legado: `src/host/reading.ts`, onde o eixo é montado, e `_reversa_sdd/sdd/leitura-do-processo.md#12-segurança-e-privacidade`
    - Tipo: nova
14. **RN-14:** A forma elidida viaja **apenas** para o checkpoint em `conclusao-nao-declarada`, e é nula nas outras três situações. Quem concluiu, quem trabalha e quem foi reconhecido por par aprovado não têm prompt a compor, e carregar a forma deles seria publicar sem propósito. A invariante é da mesma natureza das três que já prendem `reconhecidoPor`, e a suíte a prende do mesmo modo. 🟢
    - Origem no legado: `src/domain/types.ts`, nota das três invariantes de `reconhecidoPor`
    - Tipo: nova
15. **RN-15:** O caso de vários projetos mora fora do painel. Um comando de manutenção varre a raiz declarada, monta o prompt de todos os casos num texto e o escreve em disco; o painel continua com uma raiz por leitura, e enxergar além dela segue sendo a OQ-01 da ponte. O comando não conhece motor, rede nem serviço algum: ele apenas formata o que já está no disco, no mesmo regime dos auxiliares `estragar:*`. 🟢
    - Origem no legado: `scripts/aprender-equivalencias.js` e `_reversa_sdd/sdd/empacotamento-e-verificacao.md#6-requisitos-funcionais`
    - Tipo: nova
16. **RN-16:** Duas implementações do mesmo texto ficam presas por suíte de paridade. O painel compõe em TypeScript compilado e o comando em CommonJS, e nenhum dos dois pode importar o outro sem arrastar um mundo, exatamente como `scripts/limites.js` e `src/domain/limits.ts` já documentam. A divergência entre os dois textos é defeito, e aparece na suíte no dia em que nasce. 🟢
    - Origem no legado: `tests/limites.spec.ts` e `src/heranca/reversa-domain/tests/hook-parity.spec.ts`
    - Tipo: nova
17. **RN-17:** O prompt indica onde a norma costuma morar, sem afirmar que ela está ali. A sonda não lê `.claude/skills/`, logo o texto pode dizer que o guia de checkpoint fica, nas instalações, em `.claude/skills/reversa/references/checkpoint-guide.md`, e não pode afirmar que aquele arquivo existe naquela raiz. É a mesma disciplina da RN-03. 🟢
    - Origem no legado: RN-03 desta feature, e a medição de que as skills estão vendorizadas nos três projetos
    - Tipo: nova

## 5. Requisitos Funcionais

| ID | Requisito | Prioridade | Critério de aceite | Confidência |
|----|-----------|------------|--------------------|-------------|
| RF-01 | O painel oferece, no cabeçalho, a ação de copiar o prompt de correção, ao lado das duas do resumo | Must | O botão existe com `data-action` próprio e é acionável por teclado como os demais | 🟢 |
| RF-02 | O painel oferece o mesmo prompt como documento não salvo, pelo par de destinos que o resumo já usa | Should | Os dois destinos recebem texto idêntico na mesma leitura | 🟢 |
| RF-03 | O prompt é composto por função pura da leitura, em módulo próprio do domínio da webview, importável e testável sem navegador | Must | A função é chamada pelo componente e não contém nenhuma decisão de layout; a suíte a exercita direto | 🟢 |
| RF-04 | O prompt traz um bloco por checkpoint em `conclusao-nao-declarada`, na ordem em que o eixo os entrega | Must | Dois checkpoints nesse estado produzem dois blocos; um produz um; nenhum desabilita a ação | 🟢 |
| RF-05 | Cada bloco nomeia o agente, a situação lida e a forma elidida do checkpoint, com os campos com lista de textos ainda nomeados e sem serem chamados de saídas | Must | O bloco do `scout` nomeia `timestamp` com o seu valor; o do `redator_progress` nomeia `items_done` e `items_total`; nenhum deles usa a palavra saídas | 🟢 |
| RF-06 | O prompt declara a norma do Reversa: `completed_at` com `files` é o único par que declara conclusão no esquema | Must | O texto nomeia os dois campos e atribui a exigência ao guia de checkpoint | 🟢 |
| RF-07 | O prompt declara a raiz observada e o caminho do `state.json` dentro dela, dizendo em que sessão deve ser colado | Must | O texto contém a raiz recebida no payload, sem abreviação | 🟢 |
| RF-08 | O prompt faz os quatro pedidos na ordem do modelo: confirmar a conclusão pelas saídas em disco, gravar os campos canônicos preservando o que já existe, nomear o `SKILL.md` que causou o desvio e propor a correção na fonte sem aplicá-la | Must | Os quatro aparecem numerados e na ordem declarada | 🟢 |
| RF-09 | O prompt fecha com o que não fazer: não renomear campo existente, não normalizar valor, não reescrever o arquivo inteiro e não mexer em checkpoint de outro agente | Must | As quatro proibições aparecem no texto | 🟢 |
| RF-10 | A ação fica desabilitada, com razão nomeada em texto, quando não há checkpoint em `conclusao-nao-declarada` ou quando o eixo não veio na leitura | Must | Os dois casos produzem botão desabilitado e razões distintas entre si | 🟢 |
| RF-11 | A cópia é confirmada por linha no cabeçalho, sem diálogo e sem notificação | Must | Clicar produz a linha de confirmação e nenhuma interrupção | 🟢 |
| RF-12 | O envio respeita o teto de bytes já existente do canal, e o painel declara a recusa em vez de truncar em silêncio | Must | Texto acima de `SUMMARY_TEXT_CAP` é recusado pelo roteador, com o tamanho recebido ao lado do teto | 🟢 |
| RF-13 | A composição usa os comandos existentes do protocolo, sem acrescentar comando algum, e `dispatch` permanece reservado e sem tratador | Must | A suíte do protocolo continua contando sete comandos da webview | 🟢 |
| RF-14 | O painel registra no canal de saída que o prompt foi composto, e para quantos checkpoints, sem escrever o texto no log | Should | A linha do canal traz a contagem e não traz o conteúdo do prompt | 🟡 |
| RF-15 | Havendo checkpoint reconhecido por equivalência na mesma leitura, o prompt não o menciona nem pede revisão da aprovação | Must | Uma leitura com um reconhecido e um não declarado produz um bloco só | 🟢 |
| RF-16 | Os registros que não são agentes ficam fora do prompt, porque não se cobra conclusão de quem não é agente | Must | Uma leitura com registro aprovado e nenhum checkpoint não declarado desabilita a ação | 🟢 |
| RF-17 | O checkpoint judiciado carrega a forma elidida do que está em disco, acrescentada ao fim da estrutura como toda feature desde a 008 fez | Must | Um host anterior a este campo não o envia, e o painel compõe o prompt sem ele em vez de quebrar | 🟢 |
| RF-18 | A elisão preserva as chaves todas e os escalares de até quarenta caracteres, e substitui lista, texto longo, caminho de sistema e objeto por marcador de forma | Must | Os três checkpoints reais medidos produzem exatamente a forma registrada na seção 2 | 🟢 |
| RF-19 | A forma elidida é preenchida apenas no checkpoint em `conclusao-nao-declarada`, e é nula nas outras três situações | Must | Um checkpoint concluído, um em andamento e um reconhecido por par aprovado chegam com o campo nulo | 🟢 |
| RF-20 | Um comando de manutenção varre a raiz declarada, monta o prompt de todos os casos encontrados num texto e o escreve em disco, nomeando projeto e agente em cada bloco | Should | Rodado sobre `~/dev`, o comando produz um texto com os três casos e nenhuma chamada de rede | 🟢 |
| RF-21 | O comando não é invocado por `npm run build`, não importa cliente de motor e não escreve em nenhum `state.json` | Must | Verificável por inspeção do manifesto de scripts e do próprio arquivo, como a 012 já exige dos seus dois comandos | 🟢 |
| RF-22 | Uma suíte de paridade confronta o texto composto pelo painel com o composto pelo comando, sobre a mesma fixtura | Must | Alterar um dos dois sem alterar o outro faz a suíte falhar nomeando a divergência | 🟢 |

## 6. Requisitos Não Funcionais

| Tipo | Requisito | Evidência ou justificativa | Confidência |
|------|-----------|----------------------------|-------------|
| Determinismo | O mesmo payload produz o mesmo texto, byte a byte, entre chamadas e entre destinos | `src/webview/domain/summary.ts` fixa o precedente e explica o defeito que ele evita | 🟢 |
| Desempenho | A composição não altera o tempo de pintura já exigido, abaixo de 100 ms depois de receber o processo | `_reversa_sdd/sdd/painel-do-processo.md#7-requisitos-não-funcionais`, RNF-02; o texto é composto sob clique, e não a cada pintura | 🟢 |
| Tamanho | Nenhuma dependência nova entra no bundle da webview, que segue abaixo de 400 KB | `_reversa_sdd/sdd/painel-do-processo.md#7-requisitos-não-funcionais`, RNF-04 | 🟢 |
| Segurança | Nenhuma rede, nenhum processo filho, nenhuma escrita em disco; a única saída é a porta da área de transferência e a do documento não salvo, ambas já existentes | `src/host/adapters.ts` e `src/host/ports.ts`; a camada de leitura continua sem função capaz de escrever, como RNF-04 da spec da leitura exige | 🟢 |
| Privacidade | O prompt carrega a forma do checkpoint desviante e nunca o seu conteúdo, pela regra de elisão da feature 012, aplicada na leitura e não na tela | RN-11 a RN-14; `scripts/equivalencias/elidir.js`, já exercitado por `tests/equivalencias-elisao.spec.ts` contra estes mesmos arquivos | 🟢 |
| Tamanho do payload | A forma elidida viaja apenas para o checkpoint que a precisa, e os três casos medidos pesam menos de duzentos bytes cada | RN-14; medição de 2026-09-20, com 229 checkpoints e 3 na situação que preenche o campo | 🟢 |
| Manutenibilidade | Nenhuma das duas implementações do texto pode divergir em silêncio | RN-16; precedente de `tests/limites.spec.ts`, que importa o módulo de `scripts/` dentro da suíte | 🟢 |
| Acessibilidade | A razão de o botão estar desabilitado é legível em texto, nunca apenas pelo aspecto do botão | `_reversa_sdd/sdd/painel-do-processo.md#7-requisitos-não-funcionais`, RNF-03 | 🟢 |
| Observabilidade | A composição deixa rastro no canal de saída, com contagem e sem conteúdo | RF-14; precedente da ponte de log em `src/webview/bridge/log.ts` | 🟡 |
| Cobertura | A função de composição tem cobertura de linhas integral, como as demais funções de decisão do painel | `_reversa_sdd/sdd/painel-do-processo.md#7-requisitos-não-funcionais`, RNF-05 | 🟢 |

### Nota sobre concorrência, retentativa e tempo-limite

Nada disso se aplica, e vale dizê-lo em vez de omiti-lo. A composição é síncrona, ocorre sob clique
sobre a leitura que já está em memória, e não consulta rede, disco nem processo algum: não há
resposta que demore, nem chamada a repetir. Dois cliques seguidos compõem o mesmo texto duas vezes,
pela regra do determinismo, e o segundo apenas substitui o conteúdo da área de transferência. A
releitura do processo durante a composição não a corrompe, porque o texto é função do payload que
o componente tem na mão, e o payload é substituído por inteiro, nunca alterado no lugar.

---

## 7. Critérios de Aceitação

```gherkin
Cenário: um checkpoint sem conclusão declarada produz o prompt
  Dado um projeto cujo state.json tem um checkpoint sem completed_at e sem modules_pending
  E nenhum par aprovado que o reconheça
  Quando o mantenedor clica em copiar o prompt de correção
  Então a área de transferência recebe um texto com um bloco para aquele agente
  E o texto nomeia completed_at e files como o par que declara conclusão
  E o texto nomeia a raiz observada e o caminho do state.json
  E o cabeçalho confirma a cópia em uma linha, sem diálogo

Cenário: os dois destinos entregam o mesmo texto
  Dado uma leitura com dois checkpoints sem conclusão declarada
  Quando o mantenedor copia o prompt e depois o abre como documento
  Então os dois textos são idênticos byte a byte
  E ambos trazem dois blocos, na ordem em que o eixo entregou os checkpoints
  E os dois caminhos chamaram a mesma função de composição, exercitável sem navegador

Cenário: o checkpoint reconhecido por equivalência não entra no prompt
  Dado uma leitura com um checkpoint reconhecido por par aprovado e um sem conclusão declarada
  Quando o prompt é composto
  Então ele traz um bloco só, o do não declarado
  E não menciona o reconhecido nem pede revisão da aprovação

Cenário: o registro que não é agente não entra no prompt
  Dado uma leitura cujo único desvio é uma chave aprovada como registro que não é agente
  Quando o painel desenha o cabeçalho
  Então a ação de copiar o prompt está desabilitada
  E a razão em texto diz que não há checkpoint sem conclusão declarada

Cenário: leitura sã desabilita a ação
  Dado um projeto cujos checkpoints todos declaram conclusão pelo campo canônico
  Quando o painel desenha o cabeçalho
  Então a ação de copiar o prompt está desabilitada
  E nenhum prompt vazio é composto

Cenário: host anterior ao eixo não é lido como projeto são
  Dado um host que não envia o eixo do estado da descoberta
  Quando o painel desenha o cabeçalho
  Então a ação está desabilitada
  E a razão em texto diz que a leitura do estado da descoberta não aconteceu
  E não diz que o projeto está sem defeito

Cenário: host que envia o eixo mas não a forma elidida compõe o prompt sem ela
  Dado um host anterior ao campo da forma elidida, que envia o eixo sem ele
  Quando o prompt é composto sobre um checkpoint sem conclusão declarada
  Então o bloco nomeia o agente e a situação, e omite a forma
  E o painel não quebra nem inventa campo algum

Cenário: texto acima do teto é recusado, e não truncado
  Dado um prompt composto acima do teto de bytes do canal
  Quando a webview o envia
  Então o roteador recusa o envio
  E registra o tamanho recebido ao lado do teto
  E a área de transferência permanece intocada

Cenário: o bloco do caso nomeia o que foi lido, e nada além
  Dado um checkpoint sem conclusão declarada que preservou o campo achados
  Quando o prompt é composto
  Então o bloco nomeia o agente, a situação lida e o campo achados
  E não chama achados de saídas
  E o prompt não afirma quantos projetos declaram conclusão fora do esquema

Cenário: o prompt pede na ordem e proíbe o conserto silencioso
  Dado qualquer leitura com checkpoint sem conclusão declarada
  Quando o prompt é composto
  Então ele traz os quatro pedidos numerados, começando por confirmar a conclusão pelas saídas em disco
  E o quarto pedido proíbe aplicar a correção da fonte sem revisão humana
  E o texto fecha com as quatro proibições, entre elas não renomear campo existente

Cenário: o canal registra a composição sem registrar o texto
  Dado uma leitura com dois checkpoints sem conclusão declarada
  Quando o mantenedor copia o prompt
  Então o canal de saída recebe uma linha com a contagem de dois
  E nenhuma linha do canal contém o conteúdo do prompt
  E nenhum comando novo trafega no canal entre a webview e o host

Cenário: o prompt nomeia o campo culpado, e não o conteúdo do trabalho
  Dado o checkpoint scout, que carrega timestamp com um instante válido e files com três caminhos
  Quando o prompt é composto
  Então o bloco nomeia timestamp com o seu valor, que é o campo que resolve o caso
  E files aparece como marcador de forma, dizendo que são três, sem os caminhos
  E nenhum caminho de sistema de arquivos aparece no texto

Cenário: a forma elidida só viaja onde há prompt a compor
  Dado uma leitura com um checkpoint concluído, um em andamento e um reconhecido por par aprovado
  Quando o eixo é montado
  Então a forma elidida dos três é nula
  E apenas o checkpoint sem conclusão declarada a carrega

Cenário: o comando de manutenção cobre os vários projetos numa passada
  Dado uma raiz com três projetos, cada um com um checkpoint sem conclusão declarada
  Quando o comando de manutenção é executado sobre essa raiz
  Então ele escreve um texto com três blocos, cada um nomeando o seu projeto e o seu agente
  E nenhuma requisição de rede é feita
  E nenhum state.json é alterado

Cenário: as duas implementações do texto não divergem
  Dado a mesma fixtura de checkpoint entregue ao painel e ao comando
  Quando a suíte de paridade compara os dois textos
  Então eles são idênticos
  E alterar apenas um dos dois faz a suíte falhar nomeando a divergência

Cenário: o painel não conserta nada
  Dado qualquer leitura com checkpoint sem conclusão declarada
  Quando o mantenedor usa a ação
  Então nenhum arquivo do projeto é criado, alterado ou removido
  E nenhum processo é executado
  E nenhuma requisição de rede é feita
```

## 8. Prioridade MoSCoW

| Item | MoSCoW | Justificativa |
|------|--------|---------------|
| RF-01, RF-03, RF-04 | Must | São a feature: o botão, a função pura e o bloco por caso. Sem os três não há entrega |
| RF-05 a RF-09 | Must | São o conteúdo do prompt. Um prompt que não declare a norma, a raiz e os quatro pedidos não faz o harness trabalhar, e o trabalho manual continuaria |
| RF-10, RF-15, RF-16 | Must | São a disciplina do insumo. Um prompt sobre caso já decidido desfaz a feature 012, e um prompt vazio desmoraliza o botão |
| RF-11, RF-12, RF-13 | Must | Herdados de contratos vigentes: a confirmação em linha, o teto do canal e os sete comandos. Violá-los custaria adaptação declarada e conflito na próxima ressincronização |
| RF-02 | Should | O segundo destino é conveniência real, e o resumo já provou que ela se paga; ainda assim, copiar basta para o fluxo que motivou a feature |
| RF-14 | Should | O rastro no canal ajuda a depurar, e a sua falta não impede o uso |
| RNF de privacidade e de acessibilidade | Must | O primeiro decide o que pode ser transcrito, e portanto o escopo; o segundo é contrato do painel desde a primeira versão |
| RNF de desempenho e de tamanho | Should | Nenhum dos dois está sob pressão: a composição ocorre sob clique e não entra dependência nova |
| RF-17 a RF-19 | Must | São a decisão da sessão de dúvidas. Sem a forma elidida no eixo, dois dos três casos reais chegam ao prompt sem campo algum nomeado, e o texto deixa de servir a quem conserta |
| RF-22 | Must | A paridade é o que torna a duplicação aceitável. Sem ela, os dois textos divergem calados, e o prompt do comando deixa de ser o prompt do painel |
| RF-20, RF-21 | Should | O comando agregado resolve o caso real de hoje, que são três projetos distintos, e mora fora da extensão; a feature ainda se sustenta sem ele, com um prompt por raiz aberta |

### Nota sobre princípios

`.reversa/principles.md` não existe neste projeto, e o skill de princípios nunca rodou sobre ele.
Não há, portanto, princípio ativo a respeitar ou a contrariar, e o registro fica aqui para que a
ausência não seja lida como omissão da auditoria. O que faz o papel de princípio nesta entrega são
as separações herdadas e verificáveis por inspeção de arquivo: ler não escreve, propor não dispõe, e
agora pedir não conserta.

---

## 9. Esclarecimentos

### Sessão 2026-09-20

A sessão foi precedida de estudo do código e de nova medição dos 64 projetos, e o estudo derrubou a
recomendação que a versão inicial trazia na primeira lacuna. Fica registrado, porque a decisão só se
entende com o achado ao lado.

- **Q:** O que o prompt deve transcrever de cada checkpoint?
  **R:** O checkpoint elidido inteiro, carregado pelo eixo. A medição mostrou por quê: `camposComLista`
  devolve campo apenas quando o valor é lista de textos e `files` está ausente, de modo que, dos três
  casos reais, `ps-iagerasmlk/scout` e `transc_audio_mlx/archaeologist` chegariam ao painel sem campo
  algum nomeado, e `TECH+/redator_progress` chegaria sem os contadores que sustentam o argumento de
  que o trabalho não terminou. A variante estreita, só os campos fora do esquema, foi recusada por
  exigir regra e suíte novas para cobrir o mesmo terreno que a elisão da 012 já cobre e já tem
  exercitado contra estes mesmos arquivos.
- **Q:** O prompt agregado, que cobre vários projetos numa passada, deve existir?
  **R:** Sim, e fora do painel. O botão cobre a raiz aberta; um comando de manutenção reusa a
  varredura que `scripts/aprender-equivalencias.js` já tem e monta o texto dos três casos de uma vez.
  O painel continua com uma raiz por leitura, e enxergar além dela segue sendo a OQ-01 da ponte.
- **Q:** Onde o botão do prompt deve viver?
  **R:** No cabeçalho, ao lado dos dois do resumo. Pesou o fato medido de que nenhuma raiz acumula
  mais de um caso, o que torna hoje idênticos o prompt do conjunto e o prompt por linha, e o fato de
  que a linha exigiria porta nova atravessando `App` e `DiscoverySection`, que hoje não recebem porta
  de cópia. A linha do checkpoint fica anotada como melhoria para o dia em que um projeto acumular
  vários casos.
- **Q:** O prompt deve pedir o conserto do dado e a causa na fonte no mesmo texto?
  **R:** Um prompt só, com os quatro pedidos do modelo escrito à mão. Os três projetos têm as skills
  do Reversa vendorizadas em `.claude/skills/`, logo o harness aberto naquela raiz alcança o
  `SKILL.md` culpado sem sair do lugar. A aplicação da correção na origem do framework fica como
  passo seguinte e humano, fora desta feature.

### Decisões tomadas por padrão, sem pergunta

- O prompt indica onde o guia de checkpoint costuma morar, e não afirma que ele existe naquela raiz,
  porque a sonda não lê `.claude/skills/`. Está escrito como RN-17.
- O caso do `TECH+` entra no prompt com a pergunta que antecede a correção, se aquilo é agente ou
  registro de progresso, porque foi assim que o texto manual o tratou e é o que os contadores
  sustentam.
- O destino do texto do comando agregado segue o regime da 012, que escreve a sua proposta em
  `propostas/`. O nome do arquivo e do comando é detalhe de plano, e fica para `/reversa-plan`.

## 10. Lacunas

Nenhuma lacuna aberta. As três da versão inicial foram resolvidas na sessão de 2026-09-20, e a
resposta de cada uma está registrada na seção anterior, com o achado que a sustentou.

Fica anotado, sem peso de lacuna, o que é escolha de plano e não de escopo: o nome do campo novo do
eixo, o nome do comando de manutenção e o caminho do arquivo que ele escreve. Nenhum dos três muda o
que a feature entrega, e todos pertencem a `/reversa-plan`.

## 11. Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-09-20 | Versão inicial gerada por `/reversa-requirements` | reversa |
| 2026-09-20 | Quatro dúvidas resolvidas por `/reversa-clarify`, precedidas de estudo do código e de nova medição dos 64 projetos. Acrescentadas as regras RN-12 a RN-17 e os requisitos RF-17 a RF-22; a recomendação da primeira lacuna foi invertida pelo achado sobre `camposComLista` | reversa |
