# Adendo: equivalências de checkpoint, propostas por agente local e aprovadas por gente

> Identificador da feature: `012-equivalencias-de-checkpoint`
> Data: `2026-09-20`
> Cenário: `greenfield`
> Gerado por: `/reversa-sync`

Este adendo continua o da feature 011, e o emenda num ponto só. A 011 decidiu que checkpoint sem
`completed_at` não declara conclusão, e essa leitura permanece inteira; o que a 012 acrescenta é um
quarto degrau depois dela: se alguém já examinou e aprovou um par campo mais valor, o painel passa a
reconhecê-lo, dizendo na linha de onde veio o reconhecimento. Nada foi afrouxado por conveniência.
A precedência do campo canônico é a mesma, a anomalia sobrevive onde ninguém decidiu, e o que mudou
não foi o rigor da leitura: foi a existência de um lugar onde uma pessoa pode registrar o que sabe.

A entrega traz também o que o repositório não tinha: uma ferramenta que fala com um modelo. Ela mora
inteiramente fora da extensão e fora do `npm run build`, e a seção 12 da spec da leitura continua
verdadeira ao pé da letra, porque a camada que ela descreve não conhece esse motor nem pode passar a
conhecer. O modelo propõe; quem dispõe é quem marca a caixa.

## Vigência

Vigente desde 2026-09-20.

## Resumo da entrega

A medição que abre a feature é a mesma de sempre, e é o que a sustenta. Entre os 64 projetos com
`state.json` sob `~/dev` em 2026-09-20, nove declaram a conclusão do checkpoint por um nome que o
esquema não documenta, em **sete vocabulários distintos**: `status: "concluido"`, `concluido_em`,
`done: true`, `status: "completed"`, `status: "completo"`, `status: "success"` e `timestamp`. A
causa está na fonte, e não nos projetos: `completed_at` aparece em dois arquivos de referência do
Reversa e em nenhum dos mais de vinte `SKILL.md` que mandam salvar checkpoint, de modo que cada
sessão inventa o seu nome. A 011 recusou deliberadamente a lista fechada de sinônimos, por ser
vocabulário sem fonte normativa que nasceria desatualizado; a 012 aceita o mesmo diagnóstico e
responde de outro jeito, dando ao vocabulário a única fonte normativa que ele pode ter neste
projeto, que é a decisão registrada de quem mantém o painel.

Quarenta e duas ações executadas, todas marcadas `[X]` em `actions.md`, nenhuma falha. O
`progress.jsonl` tem 45 linhas, três delas `corrected`, e essas três são o resultado de exercitar a
ferramenta contra os 64 projetos reais antes de declarar a entrega pronta. Dezoito arquivos criados,
entre eles sete módulos de script, seis suítes e quatro fixturas, e dezessete modificados. A suíte
terminou a entrega com 1860 casos verdes em 111 arquivos, todos com o motor local desligado.

Três separações organizam a entrega, e nenhuma delas é documental: as três são verificáveis abrindo
um arquivo. **Propor não é dispor**, e quem promove não importa o cliente do motor. **Aprender não é
ler**, e o modelo roda numa ferramenta que o `build` não invoca e que o pacote não carrega.
**Reconhecer não é sanear**, e o valor que aparece na tela é o bruto do disco, não a forma
normalizada com que o mapa o encontrou.

## Impacto por artefato da extração

| Artefato | Seção | Tipo de impacto | Delta |
|---|---|---|---|
| `_reversa_sdd/sdd/leitura-do-processo.md` | `#6-requisitos-funcionais` | regra-nova | O checkpoint passou de três estados para quatro, e o quarto é `falhou`, que **jamais** vem do esquema: só de um par aprovado. A decisão ganhou um degrau ao fim da precedência da 011: `completed_at` presente decide; ausente com `modules_pending` não vazio decide; ausente com os dois, o mapa é consultado; e só então, não achando par aprovado, sobra a conclusão não declarada com a anomalia intacta. **Registrado como W002, W003 e W005.** |
| `_reversa_sdd/sdd/leitura-do-processo.md` | `#8-design-e-interface` | componente-novo | `src/domain/equivalencias.ts`, módulo gerado e versionado que carrega o mapa aprovado, e é a única fonte de equivalência que a leitura consulta. Ele é módulo, e não arquivo de dados, por uma razão de empacotamento e não de gosto: o `.vscodeignore` readmite apenas `out/**` e `media/**`, e um `.json` sob `src/` nunca chegaria ao `.vsix`, de modo que as aprovações valeriam só para quem tem o repositório. **Registrado como W001 e W019.** |
| `_reversa_sdd/sdd/leitura-do-processo.md` | `#9-modelo-de-dados` | delta-de-dados | Formas novas em memória, nada persistido pela leitura. `CheckpointState` ganhou `reconhecidoPor`, que nomeia campo e valor quando o reconhecimento veio do mapa e é nulo quando veio do esquema; `NonAgentEntry` separa a entrada que ninguém deve cobrar por conclusão; `MapaDeEquivalencias` reúne os pares e as entradas não-agente, cada registro com data de aprovação e evidência. O detalhe que mais pesa: o casamento é feito sobre o valor normalizado, e o que se guarda para exibir é o **bruto**, porque mostrar a forma normalizada seria reescrever o arquivo na tela. **Registrado como W008 e W020.** |
| `_reversa_sdd/sdd/leitura-do-processo.md` | `#4-non-goals-fora-do-escopo` | regra-nova | Os não-objetivos foram exercidos, e nenhum reaberto. NG-05 continua valendo ao pé da letra: nenhum `state.json` é reescrito, nem pela leitura, nem pelo aprendizado, nem pela promoção, e a tradução acontece em memória e sobre o mapa. NG-01 e NG-04 continuam valendo: a camada não escreve e não observa disco. NG-03 aparece aqui do mesmo modo que apareceu na 011: quem decide que a anomalia reconhecida não vai à tela é o painel, e não o disco. **Registrado como W004, W007 e W022.** |
| `_reversa_sdd/sdd/leitura-do-processo.md` | `#7-requisitos-não-funcionais` | regra-nova | RNF-01 medido de novo, e com folga que não deixa dúvida: a consulta ao mapa e o julgamento dos checkpoints levam **0,14 ms** contra o teto de 200 ms, no pior caso deliberado de 50 pares e 50 checkpoints, metade deles casando apenas no último par do mapa. RNF-04 permanece verificável por inspeção: a camada não ganhou escrita, processo filho nem cliente de rede. **Registrado como W007 e W021.** |
| `_reversa_sdd/sdd/leitura-do-processo.md` | `#10-integrações-e-dependências` | regra-nova | A linha "Rede, serviço remoto ou API: Nenhuma" continua verdadeira **para a camada de leitura**, e passa a exigir uma leitura atenta do repositório como um todo: existe agora um cliente HTTP em `scripts/equivalencias/motor.js`, e ele é o único arquivo daqui que fala com um serviço. Ele não é importado por módulo algum de `src/`, não entra no `build` e não entra no pacote. O contrato completo desse serviço está em `_reversa_forward/012-equivalencias-de-checkpoint/interfaces/motor-local.md`. **Registrado como W009 e W010.** |
| `_reversa_sdd/sdd/leitura-do-processo.md` | `#12-segurança-e-privacidade` | regra-nova | A promessa da seção é da camada de leitura e sobrevive intacta. Quanto à ferramenta nova, que mora fora dela, o que se pode afirmar é mais fraco e está escrito: o destino é o próprio computador, e o que sai do processo é o checkpoint **elidido**, com listas, textos longos e caminhos de sistema substituídos por marcador de forma. Os checkpoints medidos carregam caminhos de scratchpad e achados sobre código de terceiros, e é por isso que a elisão existe. **Registrado como W011.** |
| `_reversa_sdd/sdd/ponte-e-host.md` | `#6-requisitos-funcionais` | regra-nova | A leitura do workspace passa o mapa real ao eixo da descoberta e registra no log quantos reconhecimentos e quantas entradas não-agente houve na passada. O host não ganhou capacidade nenhuma: continua sem escrita, sem processo filho e sem rede, e o mapa chega a ele como módulo importado, e não como arquivo aberto em tempo de execução. **Registrado como W007.** |
| `_reversa_sdd/sdd/ponte-e-host.md` | `#9-modelo-de-dados` | delta-de-contrato-externo | `SetProcessData` cresceu por acréscimo, pela regra que toda feature desde a 008 segue: o eixo da descoberta ganhou `registrosNaoAgentes`, e cada checkpoint ganhou `reconhecidoPor`. Ausência dos dois significa host anterior a esta feature, e a tela então desenha o que desenhava na 011, sem procedência e sem o bloco das entradas. **Registrado como W016.** |
| `_reversa_sdd/sdd/painel-do-processo.md` | `#6-requisitos-funcionais` | regra-alterada | O RF-05 passa a ser lido com dois acréscimos. `data-situacao` tem agora quatro valores, com a falha desenhada em texto próprio e distinto da conclusão não declarada; e a linha do checkpoint reconhecido traz a **procedência**, nomeando o campo e o valor brutos que o sustentaram. Há ainda um bloco à parte, abaixo dos checkpoints, para as entradas aprovadas como não sendo agente, desenhadas sem situação alguma, porque nada se cobra de conclusão de quem não é agente. Situação desconhecida recua para o rótulo conservador em vez de quebrar a tela. **Registrado como W003, W008 e W016.** |
| `_reversa_sdd/sdd/painel-do-processo.md` | `#7-requisitos-não-funcionais` | regra-nova | O pacote da tela mede 215.258 B, 52,6 % do teto de 409.600 B e 30.502 B abaixo da guarda de 60 %; a feature custou 970 B, porque o mapa não pesa na tela: ele vive na camada de domínio do host, e a webview recebe o eixo já julgado. A procedência e o bloco das entradas são texto, nunca só cor. **Registrado como W021.** |
| `_reversa_sdd/sdd/empacotamento-e-verificacao.md` | `#6-requisitos-funcionais` | componente-novo | Duas ferramentas de manutenção novas, fora do `build` e fora do pacote, no regime dos quatro `estragar:*`. `npm run aprender:equivalencias` varre os `state.json` de uma raiz, isola os pares que ninguém decidiu, elide o conteúdo, consulta o motor local e escreve `propostas/equivalencias.md`, sem tocar o mapa em passo algum. `npm run promover:equivalencias` lê as caixas marcadas e regenera o módulo, com a data e a evidência, sem conhecer o motor. O `package.json` declara agora vinte e dois scripts. **Registrado como W009, W012, W017 e W018.** |
| `_reversa_sdd/sdd/empacotamento-e-verificacao.md` | `#8-design-e-interface` | regra-nova | A pergunta ao motor tem **duas passagens**, e a ordem entre elas foi medida, não suposta. Primeiro cada checkpoint distinto é perguntado inteiro, sem apontar campo algum, e o motor elege qual campo fala de estado; só depois, e só nos campos eleitos, ele é perguntado campo a campo. Perguntando sempre do primeiro modo, a rodada real sobre os 64 projetos propôs 4 pares e perdeu três dos sete vocabulários; sempre do segundo, propôs 39, dos quais 32 eram ruído, com `verde: 569` classificado como conclusão; com as duas na ordem, propôs 6 sem ruído aparente, e a rodada caiu de 4 min 20 s para 1 min 13 s. **Registrado como W023.** |
| `_reversa_sdd/sdd/empacotamento-e-verificacao.md` | `#11-edge-cases-e-tratamento-de-erros` | regra-alterada | A suíte do conteúdo do pacote escolhia o `.vsix` mais recente por ordem alfabética, e `0.9.4` vem depois de `0.11.0`: desde que a segunda casa da versão chegou a dois dígitos, ela vinha conferindo um pacote de 12 de setembro, e o erro era silencioso, porque pacote velho passa em tudo que já passava quando foi construído. A escolha passou a ser pela data de modificação, e a lista de caminhos exigidos passou a incluir `extension/out/domain/equivalencias.js`. **Registrado como W019.** |
| `_reversa_sdd/sdd/empacotamento-e-verificacao.md` | `#10-integrações-e-dependências` | delta-de-contrato-externo | Uma integração externa nova entra no repositório, e ela é a primeira: um motor de inferência em `http://localhost:11434`, com `qwen2.5:7b` como padrão e o modelo configurável por argumento, temperatura zero, semente fixa e tempo-limite de 60 s. O consumidor é um só, e a suíte substitui o transporte por um duplo, de modo que nenhum teste desta feature exige motor no ar. **Registrado como W010 e W014.** |
| `_reversa_sdd/prd.md` | `#4-escopo-in` | componente-novo | O cartão da Descoberta responde agora, para o checkpoint, uma pergunta a mais: por que ele está no estado em que está. Leia-o como "os checkpoints em quatro estados, com a procedência ao lado quando o reconhecimento veio de par aprovado, e as entradas que não são agente à parte". Nenhum cartão novo; continuam onze. |
| `_reversa_sdd/prd.md` | `#5-nao-objetivos-out` | regra-nova | A proibição de escrita sobreviveu inteira do lado da extensão, e do lado das ferramentas de manutenção ela ganhou contorno nítido: o aprendizado escreve **apenas** a proposta, e a promoção escreve **apenas** o mapa. Nenhum dos dois toca arquivo de projeto observado, e a conferência disso é um `git status` logo depois de rodar o aprendizado, que foi feita nas três rodadas reais de 2026-09-20. |

## O que ainda espera decisão humana

Vale registrar, porque a extração não tem como adivinhar. O mapa entregue está **vazio**: a feature
constrói o lugar da decisão, não a decisão. Enquanto ninguém promover um par, o painel lê exatamente
como lia na 011, e é esse o comportamento que RF-15 fixa em suíte. A proposta gerada em
`propostas/equivalencias.md` traz 6 pares e 17 entradas esperando marcação, e é ela que, aprovada,
faz as sete anomalias do `med-reversa` caírem para uma. A que sobra é a do `plano_aprovado`, que não
declara conclusão de coisa alguma e sequer é um agente: é um registro de decisão morando no mapa de
checkpoints, e se deve ou não sair da contagem é julgamento de quem conhece aquele projeto.

## Regras sob vigilância

O watch principal de `regression-watch.md` continua **vazio**, pelo mesmo motivo das features 001 a
011: sem extração `/reversa` sobre este repositório não há regras 🟢 a vigiar. Na seção
"Observações", sem peso de regressão, os identificadores **W001 a W020** cobrem os requisitos
funcionais `RF-01` a `RF-20` e a decisão D-07 do roadmap, **W021** cobre desempenho e tamanho, e
**W022** e **W023** cobrem, respectivamente, o NG-05 da spec da leitura e a ordem das duas passagens
do aprendizado. Os que mais pesam sobre a leitura da entrega aparecem nomeados na tabela acima.

Uma ressalva própria desta feature acompanha o arquivo e vale repetir aqui: boa parte destes itens é
sobre o que o código **não** faz, e ausência é mais difícil de extrair do que presença. Uma extração
futura que não os encontrasse estaria diante de uma lacuna de leitura, não necessariamente de uma
regressão; o sinal de violação, nesses casos, é a presença do que deveria faltar.

Como nas features anteriores, a numeração recomeça em W001, e o identificador só é legível junto do
nome da feature que o escreveu.

Conteúdo integral em `_reversa_forward/012-equivalencias-de-checkpoint/regression-watch.md`.

## Fontes

- `_reversa_forward/012-equivalencias-de-checkpoint/legacy-impact.md`
- `_reversa_forward/012-equivalencias-de-checkpoint/regression-watch.md`
- `_reversa_forward/012-equivalencias-de-checkpoint/requirements.md`
- `_reversa_forward/012-equivalencias-de-checkpoint/roadmap.md`
- `_reversa_forward/012-equivalencias-de-checkpoint/medidas.md`
- `_reversa_forward/012-equivalencias-de-checkpoint/interfaces/motor-local.md`
- `_reversa_forward/012-equivalencias-de-checkpoint/actions.md`
- `_reversa_forward/012-equivalencias-de-checkpoint/progress.jsonl`
