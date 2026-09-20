# Adendo: estado terminal da extração e os três estados do checkpoint

> Identificador da feature: `011-estado-terminal-e-checkpoints`
> Data: `2026-09-20`
> Cenário: `greenfield`
> Gerado por: `/reversa-sync`

Este adendo é uma ponte, e é o primeiro em que a entrega **contradiz** um pedaço da extração em vez
de aprofundá-lo. As specs de `_reversa_sdd/sdd/` descrevem um painel que reproduz com fidelidade o
que a camada de leitura herdada devolve, e dois pontos dessa fidelidade estavam errados sobre a
realidade medida: a fase que declara o fim da extração era tratada como anomalia, e o checkpoint sem
`completed_at` era dado como trabalho em curso. A feature 011 corrige os dois na camada local, sem
tocar em `src/heranca/`, e a extração continua válida em tudo o mais. O que segue diz como ler cada
artefato enquanto a re-extração não vem, e onde exatamente a leitura mudou de sinal.

## Vigência

Vigente desde 2026-09-20.

## Resumo da entrega

A medição que abre a feature é o seu fundamento, e as duas regras nasceram assimétricas porque os
fatos são assimétricos. Entre os sessenta e quatro projetos com `state.json` sob `~/dev` em
2026-09-20, dezessete declaravam o encerramento da extração num valor de `phase` que o esquema não
documenta, sob cinco grafias distintas e em duas versões do Reversa: fato **sistemático**, e por
isso reconhecido por forma, nunca por lista literal, que estaria desatualizada assim que a sexta
grafia aparecesse. Já o `completed_at` do checkpoint está em 203 dos 229 registros medidos: a
ausência é **desvio**, e por isso o leitor não aprende os sete nomes alternativos que aparecem no
lugar. Ele nomeia o estado com honestidade, sem afirmar que o agente terminou, porque o campo
canônico não está lá, nem que ainda corre, porque nada indica trabalho em curso.

Trinta e quatro ações executadas, todas marcadas `[X]` em `actions.md` e registradas em
`progress.jsonl`, nenhuma falha e nenhuma linha `corrected`. Onze arquivos criados, cinco deles
fixturas de um mesmo diretório e três suítes, e vinte e um modificados. A suíte terminou a entrega
com 1764 casos verdes em 105 arquivos, e o preview ganhou quatro estados doentes, cada um conferido
pela suíte contra a leitura real do host.

Três separações organizam a entrega. A primeira é entre **descrever o disco e decidir a tela**: a
herança continua registrando `fase-desconhecida` sobre a fase de encerramento, e o que o eixo novo
produz não é a correção daquele registro, e sim a identidade da anomalia que o painel decide não
desenhar, pelo NG-03 da spec da leitura. A segunda é entre **reconhecer e sanear**: nada do que se
lê é reescrito, normalizado ou descartado, e o valor bruto viaja ao lado do reconhecido. A terceira
é entre **absorver pela tripla e absorver pelo código**: o desconto casa arquivo, código e detalhe
ao mesmo tempo, porque descontar por código apagaria também a anomalia do erro de digitação, que é
justamente o que o EC-02 existe para pegar.

## Impacto por artefato da extração

| Artefato | Seção | Tipo de impacto | Delta |
|---|---|---|---|
| `_reversa_sdd/sdd/leitura-do-processo.md` | `#11-edge-cases-e-tratamento-de-erros` | regra-alterada | **É aqui que a extração deixou de valer como está escrita.** O EC-02 diz que fase fora do conjunto canônico "vira anomalia", sem ressalva. Leia-o agora em duas partes: valor cuja forma declara encerramento é **estado reconhecido**, desenhado como tal e sem anomalia na tela; valor fora das cinco canônicas e fora dessa família continua virando anomalia, com o nome à vista. As cinco fases seguem saindo na ordem do framework, e nenhuma sexta é inventada. **Registrado como W001 e W003.** |
| `_reversa_sdd/sdd/leitura-do-processo.md` | `#6-requisitos-funcionais` | regra-nova | O estado do checkpoint passou de dois valores para três, na precedência do `checkpoint-guide.md` do Reversa: `completed_at` presente é concluído; ausente com `modules_pending` não vazio é em andamento, que é a assinatura documentada do trabalho parcial; ausente com os dois é **conclusão não declarada**. O terceiro estado não passa em silêncio: registra `checkpoint-sem-conclusao-declarada` nomeando o agente e o campo que falta, que é o que o RF-07 desta spec já cobrava. **Registrado como W005 e W007.** |
| `_reversa_sdd/sdd/leitura-do-processo.md` | `#8-design-e-interface` | componente-novo | `src/domain/discovery-state.ts`, módulo puro novo na divisão que a seção já fixava: a sonda olha, o julgamento decide. Ele não substitui a leitura herdada de `state.ts`, que segue intocada e fiel ao `state-schema.md`; julga **ao lado** dela, sobre o mesmo arquivo bruto, e chega a conclusão diferente nos dois pontos acima. Sem disco, sem módulo de plataforma e sem exceção para entrada alguma. **Registrado como W001, W002 e W005.** |
| `_reversa_sdd/sdd/leitura-do-processo.md` | `#9-modelo-de-dados` | delta-de-dados | Três formas novas em memória, nada persistido. `ExtractionState` traz a situação (`nao-iniciada`, `em-curso`, `encerrada`) com o valor bruto ao lado; `CheckpointState` traz o agente, a situação entre três valores, o instante **apenas** quando vem de `completed_at`, e os campos preservados cujo valor é lista de textos; `DiscoveryStateAxis` reúne os dois, mais as anomalias próprias e as herdadas que absorve. A distinção que mais pesa na leitura: os campos de lista são nomeados e **nunca** chamados de saídas, porque `achados`, `lacunas` e `adrs` têm a mesma forma e não são arquivos. **Registrado como W002, W006 e W011.** |
| `_reversa_sdd/sdd/leitura-do-processo.md` | `#4-non-goals-fora-do-escopo` | regra-nova | Dois não-objetivos foram exercidos, não reabertos. Pelo NG-05, nenhum valor lido é reescrito, normalizado ou descartado, e o bruto acompanha o reconhecido até a tela. Pelo NG-03, decidir o que a tela mostra pertence ao painel: é por isso que a supressão da anomalia absorvida acontece na camada de exibição, e não na leitura, que continua reportando o disco inteiro. **Registrado como W008 e W012.** |
| `_reversa_sdd/sdd/ponte-e-host.md` | `#9-modelo-de-dados` | delta-de-contrato-externo | `SetProcessData` cresceu por acréscimo, pela regra que toda feature desde a 008 seguiu: `discoveryState` é opcional e entra ao **fim** da estrutura. Ausência significa leitura que não aconteceu, isto é, host anterior a esta feature, e jamais projeto sem descoberta; nesse caso a tela desenha o que desenhava antes, com a anomalia do encerramento de volta e o checkpoint em dois estados. O `process` continua cruzando o canal sem transformação, com `anomalies` inteiro. **Registrado como W009.** |
| `_reversa_sdd/sdd/ponte-e-host.md` | `#6-requisitos-funcionais` | regra-nova | Mais um ramo local na leitura do workspace, dentro do mesmo bloco protegido dos outros quatro, alimentado por `snapshot.stateJson` e pelo processo já julgado. É o único ramo que consome o resultado da camada herdada, porque a absorção precisa das anomalias dela. Nenhum layout do Reversa é escrito aqui, e exceção no ramo novo continua virando o estado `error` nomeado, jamais exceção no editor. |
| `_reversa_sdd/sdd/painel-do-processo.md` | `#6-requisitos-funcionais` | regra-alterada | Três requisitos passam a ser lidos com acréscimo. O RF-04 ganha, acima das cinco fases, a frase de encerramento com o valor bruto ao lado, no molde da frase de projeto greenfield da 009. O RF-05 ganha o terceiro estado do checkpoint, com `data-situacao` de três valores no lugar de `data-done`, e o instante só aparece quando vem do campo canônico e já convertido de fuso. O RF-08 passa a desenhar a **lista composta**, sem a anomalia absorvida, em vez da soma em linha das listas de cada eixo. **Registrado como W004, W005, W006 e W012.** |
| `_reversa_sdd/sdd/painel-do-processo.md` | `#11-edge-cases-e-tratamento-de-erros` | regra-nova | O cabeçalho e a seção de anomalias passaram a contar sobre a mesma composição. Antes da feature as duas concordavam por coincidência, porque ambas eram concatenação simples; com o desconto, a coincidência acabaria no primeiro projeto com extração encerrada, e o cabeçalho declararia leitura degradada por anomalia que a seção não mostra. Checkpoint que não é objeto continua sendo assunto da camada herdada, que já registra `tipo-invalido`, e o eixo novo não o registra de novo. |
| `_reversa_sdd/sdd/painel-do-processo.md` | `#7-requisitos-nao-funcionais` | regra-nova | O pacote da tela mede 214.288 B, 52,3 % do teto de 409.600 B e 31.472 B abaixo da guarda de 60 %; a feature custou 1.972 B. A leitura da referência mede 52,9 ms contra o teto de 200 ms, e não cresceu: o `state.json` já vinha no instantâneo da sonda, e o eixo é julgamento puro sobre ele. A frase de encerramento, a situação do checkpoint e o nome dos campos de lista são texto, nunca só cor. **Registrado como W014.** |
| `_reversa_sdd/sdd/empacotamento-e-verificacao.md` | `#6-requisitos-funcionais` | componente-novo | `scripts/estragar-descoberta.js`, quarto auxiliar no molde dos anteriores: copia o workspace para pasta temporária do sistema, reescreve só o `state.json` da cópia e imprime o caminho dela, preservando a identidade do original. Quatro estados que um projeto saudável não produz: `fase-estranha`, `parcial`, `terminal-e-estranha` e `saidas-nao-canonicas`. A suíte `tests/preview-descoberta.spec.ts` julga pelo `readWorkspace` inteiro, e não pelo domínio isolado, porque o caso `terminal-e-estranha` só tem sentido contra as anomalias que a camada herdada de fato produz. **Registrado como W012.** |
| `_reversa_sdd/sdd/empacotamento-e-verificacao.md` | `#8-design-e-interface` | regra-nova | O `package.json` declara agora vinte scripts, com `estragar:descoberta` ao lado dos três auxiliares anteriores, e o `README.md` ganhou quatro linhas na tabela de estados do preview, uma por caso. Essas quatro linhas foram escritas **fora** do `actions.md`, e o `legacy-impact.md` registra por quê. |
| `_reversa_sdd/sdd/heranca-e-sincronia.md` | `#6-requisitos-funcionais` | regra-nova | Nenhum arquivo vendorizado foi tocado, nenhum carimbo mudou e o total de adaptações declaradas continua dezesseis. Os dois defeitos que a feature corrige nascem na origem `scrum-harness`, e a decisão foi corrigi-los na camada local sem abrir adaptação, porque o que ambos pedem é decidir o que a tela mostra. A dívida com a origem ficou declarada em `src/heranca/PROCEDENCIA.md`, na subseção "Pendências de origem", que não é adaptação e tem suíte fixando isso. O caminho do clone em `heranca.origens.yml` voltou a apontar para a origem real. **Registrado como W013.** |
| `_reversa_sdd/prd.md` | `#4-escopo-in` | componente-novo | O cartão da Descoberta, o primeiro que o painel desenhou, passa a responder uma pergunta que não respondia: se a extração acabou. Leia-o agora como "as cinco fases na ordem do framework, com a frase de encerramento acima delas quando a extração declarou o fim, e os checkpoints em três estados". Nenhum cartão novo; continuam onze. |
| `_reversa_sdd/prd.md` | `#5-nao-objetivos-out` | regra-nova | Nenhum não-objetivo foi reaberto. A proibição de escrita sobreviveu inteira: quem fabrica os quatro estados doentes é `scripts/estragar-descoberta.js`, sobre cópia fora do repositório e fora do workspace de origem. E o painel continua sem julgar o que lê: um campo de saída sob nome não canônico é declarado como existente, sem que se afirme o que ele contém. |

## Achado da conferência da herança

A correção do caminho do clone teve um efeito colateral que vale registrar, porque ele não é desta
feature e não foi resolvido por ela. Com a origem enfim ao alcance, `npm run check:heranca` passou
ao modo completo pela primeira vez nesta máquina e devolveu veredito **impedido**: as adaptações A4
e A5 não casam mais com o conteúdo atual de `impact.ts` e `impact.spec.ts` na origem, com zero
ocorrências, o que significa que o `scrum-harness` mexeu no trecho que elas tocavam. É exatamente a
parada que a RN-09 da feature 004 projetou, e a decisão de atualizar o trecho ou descartar a
adaptação é de quem conhece a mudança, não de script. O `npm run build` não é afetado, porque usa
`check:heranca:local`. Fica como dívida herdada, a tratar em ciclo próprio.

## Regras sob vigilância

O watch principal de `regression-watch.md` continua **vazio**, pelo mesmo motivo das features 001 a
010: sem extração `/reversa` sobre este repositório não há regras 🟢 a vigiar. Na seção
"Observações", sem peso de regressão, os identificadores **W001 a W011** cobrem os requisitos
funcionais `RF-01` a `RF-11`, **W012** cobre as decisões D-02 e D-03 do roadmap, e **W013** e
**W014** cobrem os requisitos de manutenibilidade, desempenho e tamanho. Os que mais pesam sobre a
leitura da entrega aparecem nomeados na tabela acima.

Uma ressalva própria desta feature acompanha o arquivo e vale repetir aqui: W001 e W005 são o
**contrário** do que a camada herdada afirma sobre o mesmo `state.json`, e é assim de propósito. Uma
extração futura que as encontrasse dentro de `src/heranca/` estaria diante de mudança de decisão, e
não de regressão, porque significaria que a pendência declarada na `PROCEDENCIA.md` foi enfim levada
à origem.

Como nas features anteriores, a numeração recomeça em W001, e o identificador só é legível junto do
nome da feature que o escreveu.

Conteúdo integral em `_reversa_forward/011-estado-terminal-e-checkpoints/regression-watch.md`.

## Fontes

- `_reversa_forward/011-estado-terminal-e-checkpoints/legacy-impact.md`
- `_reversa_forward/011-estado-terminal-e-checkpoints/regression-watch.md`
- `_reversa_forward/011-estado-terminal-e-checkpoints/requirements.md`
- `_reversa_forward/011-estado-terminal-e-checkpoints/roadmap.md`
- `_reversa_forward/011-estado-terminal-e-checkpoints/actions.md`
- `_reversa_forward/011-estado-terminal-e-checkpoints/progress.jsonl`
