# Adendo: botão do prompt de correção na fonte

> Identificador da feature: `013-botao-do-prompt`
> Data: `2026-09-20`
> Cenário: `greenfield`
> Gerado por: `/reversa-sync`

Este adendo fecha a última milha da 012. Promovidas as equivalências, sobraram três anomalias que
nenhum par aprovado cobre, e o adendo anterior já dizia por quê: o defeito não está em quem lê, e sim
em quem grava, porque `completed_at` aparece em dois arquivos de referência do Reversa e em nenhum dos
mais de vinte `SKILL.md` que mandam salvar checkpoint. A 013 não traduz essas três: ela compõe o texto
com que o mantenedor cobra o conserto na fonte, e entrega esse texto pelos mesmos dois destinos que o
resumo da 006 já usava.

Duas separações sustentam a entrega, e ambas se verificam abrindo um arquivo. **Pedir não é
consertar:** o painel escreve o pedido, e não o campo. **Compor não é despachar:** o texto vai para a
área de transferência ou para um documento não salvo, nunca para um terminal ou uma sessão de agente,
de modo que o NG-04 da spec do painel continua de pé e o lugar reservado do despacho continua vazio.

## Vigência

Vigente desde 2026-09-20.

## Resumo da entrega

O painel passa a oferecer, no cabeçalho, duas ações que compõem a partir da leitura já feita o prompt
com que se confronta o harness do projeto observado a respeito dos checkpoints que terminaram sem
declarar que terminaram. Para que o texto nomeie o campo culpado, o eixo do estado da descoberta passou
a carregar a forma elidida do checkpoint desviante: a medição que decidiu isso está no
`investigation.md`, e mostra que `camposComLista` só reporta campo cujo valor é lista de textos, e só
quando `files` falta, de modo que dois dos três casos reais chegavam ao painel sem campo algum nomeado.
Um comando de manutenção, fora da extensão e fora do `npm run build`, cobre numa passada o caso de
vários projetos, porque o painel observa uma raiz por leitura e os três casos moram em três projetos.

Trinta e duas ações executadas, todas marcadas `[X]` em `actions.md`, nenhuma falha. O `progress.jsonl`
tem 42 linhas, uma delas `corrected`: `PromptCase` perdeu o campo `situacao`, que não está no contrato
de `interfaces/texto-do-prompt.md`, e a frase virou constante presa pela paridade, com `labels.ts`
ficando intocado. A suíte terminou a entrega com 1963 testes verdes em 115 arquivos, e `typecheck`,
`check:webview` e `build` limpos. O comando foi exercitado contra os projetos reais sob `~/dev` antes
de a entrega ser declarada pronta, e a conferência de que nenhum `state.json` foi tocado está
registrada: `TECH+` e `transc_audio_mlx` limpos no git, `ps-iagerasmlk` sem git e com `mtime` de
2026-05-03.

## Impacto por artefato da extração

| Artefato | Seção | Tipo de impacto | Delta |
|---|---|---|---|
| `_reversa_sdd/sdd/leitura-do-processo.md` | `#9-modelo-de-dados` | delta-de-dados | `CheckpointState` cresceu por acréscimo no fim, pela regra que toda feature desde a 008 segue: o campo `formaElidida` é opcional e tem **três** estados, ausente, nula e preenchida. Ausente significa host anterior a esta feature, e o painel então compõe o bloco sem a forma, sem quebrar e sem inventar campo. Leia o modelo de dados com esse campo ao fim da estrutura, e com as seis invariantes do `data-delta.md` da feature. **Registrado como W015.** |
| `_reversa_sdd/sdd/leitura-do-processo.md` | `#6-requisitos-funcionais` | regra-nova | A precedência de quatro degraus da 011 e da 012 permanece intacta, e ganha um anexo no último deles: só o ramo de `conclusao-nao-declarada` produz a forma elidida, e os três ramos que decidem antes devolvem a forma **nula explicitamente**, ramo a ramo, e não por herança de um objeto comum. A invariante está escrita no código porque a sua leitura é parte da promessa. **Registrado como W017 e W019.** |
| `_reversa_sdd/sdd/leitura-do-processo.md` | `#12-segurança-e-privacidade` | regra-nova | A elisão roda **dentro** de `readDiscoveryState`, no domínio puro, e não no host nem na tela: a webview nunca vê o checkpoint cru, e a promessa de privacidade passa a ser verificável na fronteira em vez de espalhada pelos componentes. O que a elisão protege é o conteúdo, e não o nome do projeto: chaves e escalares de até quarenta caracteres são preservados, e lista, texto longo, caminho de sistema e objeto viram marcador de forma. **Registrado como W016 e W021.** |
| `_reversa_sdd/sdd/leitura-do-processo.md` | `#4-non-goals-fora-do-escopo` | regra-nova | NG-01 e NG-05 sobreviveram inteiros e foram exercidos: compor um texto não escreve arquivo, e o conserto fica com o harness do projeto observado. RNF-04 também permanece verificável por inspeção, porque a camada que toca o disco não ganhou escrita, processo filho nem cliente de rede. A elisão acrescentada a ela é função pura. **Registrado como W021.** |
| `_reversa_sdd/sdd/painel-do-processo.md` | `#6-requisitos-funcionais` | componente-novo | Duas ações novas no cabeçalho, cada uma com `data-action` próprio, entregando texto **idêntico** aos dois destinos da 006. O RF-13 da spec, que exige decisão de apresentação em função pura fora do componente, é honrado por `src/webview/domain/prompt.ts`, que compõe o texto e apura a disponibilidade. O RF-15, que reservava o lugar nomeado e vazio do despacho, continua reservado e vazio: as ações novas ficam ao lado dele, não nele. **Registrado como W001, W002, W003 e W007.** |
| `_reversa_sdd/sdd/painel-do-processo.md` | `#8-design-e-interface` | regra-alterada | A confirmação de cópia deixou de ser booleana e passou a **nomear** o que foi copiado. É defeito pequeno e certo: com dois botões de cópia no mesmo cabeçalho, um booleano diria "resumo copiado" depois do clique no prompt. A razão do botão desabilitado viaja em elemento próprio de texto, e não no aspecto do botão, porque botão cinzento não informa quem não vê cor nem diz por quê a quem vê. As três razões são três fatos distintos entre si. **Registrado como W009 e W010.** |
| `_reversa_sdd/sdd/painel-do-processo.md` | `#4-non-goals-fora-do-escopo` | regra-nova | NG-04 é a fronteira que esta feature encosta sem atravessar: compor um texto para que alguém o cole não é despachar agente. Nenhum processo filho, nenhum terminal, nenhuma sessão iniciada pelo painel. A evolução prevista no PRD continua prevista e não antecipada. **Registrado como W012.** |
| `_reversa_sdd/sdd/painel-do-processo.md` | `#12-segurança-e-privacidade` | regra-nova | A promessa da seção continua verdadeira ao pé da letra, e ganha um limite que convém declarar: nada é enviado a lugar algum, mas o que o painel entrega à área de transferência o leitor levará adiante. Daí a elisão na fronteira, e daí o texto nunca conter conteúdo de campo elidido nem número de medição que o painel não leu. **Registrado como W016.** |
| `_reversa_sdd/sdd/ponte-e-host.md` | `#9-modelo-de-dados` | delta-de-contrato-externo | `SetProcessData` cresceu por acréscimo, e só nisso: cada checkpoint pode trazer `formaElidida`, que é o único campo opcional da estrutura, com os quinze campos do topo da carga na mesma ordem. Ausência significa host anterior a esta feature. **Registrado como W015.** |
| `_reversa_sdd/sdd/ponte-e-host.md` | `#6-requisitos-funcionais` | regra-nova | **Nenhum comando novo no protocolo.** Os sete comandos da webview continuam sete, `dispatch` continua reservado e sem tratador, e o prompt viaja pelo par de destinos do resumo. O teto de bytes do canal segue em vigor e recusa nomeando o tamanho recebido, em vez de truncar calado. O canal de saída passa a registrar quantos casos o prompt cobriu, com a contagem e **sem** o texto. **Registrado como W011, W012 e W013.** |
| `_reversa_sdd/sdd/empacotamento-e-verificacao.md` | `#6-requisitos-funcionais` | componente-novo | Uma ferramenta de manutenção nova, no regime dos dois comandos da 012 e dos quatro `estragar:*`: `npm run prompt:harness` varre a raiz declarada, monta o prompt de todos os casos encontrados num texto e o escreve em `propostas/prompt-harness.md`, nomeando projeto e agente em cada bloco. Três promessas negativas o definem: não fala com motor, não classifica e não escreve em `state.json` de ninguém; sem caso, não deixa arquivo pela metade. O `package.json` declara agora vinte e três scripts, e `build` não invoca este. **Registrado como W018 e W019.** |
| `_reversa_sdd/sdd/empacotamento-e-verificacao.md` | `#8-design-e-interface` | componente-novo | A varredura dos `state.json` de uma raiz saiu de `scripts/aprender-equivalencias.js` para `scripts/equivalencias/estados.js`, com o corpo movido sem alteração e a pasta acrescentada a cada estado, de modo que os dois comandos importem a mesma implementação em vez de uma terceira nascer. O comportamento idêntico está verificado pela suíte da 012. **Registrado como W018.** |
| `_reversa_sdd/sdd/empacotamento-e-verificacao.md` | `#11-edge-cases-e-tratamento-de-erros` | regra-alterada | Duas suítes vizinhas mudaram por consequência, e a mudança é de expectativa, não de regra: `tests/host-manifest.spec.ts` passou a enumerar vinte e três scripts, e `tests/preview-descoberta.spec.ts` passou a exigir a forma **nula** no checkpoint reconhecido por par aprovado, que é a invariante desta feature lida de fora. **Registrado como W017 e W019.** |
| `_reversa_sdd/prd.md` | `#4-escopo-in` | componente-novo | O cartão da Descoberta passa a oferecer uma saída além da leitura: o texto com que se cobra o conserto de quem gravou o checkpoint. Nenhum cartão novo; continuam onze. Leia o escopo com a ressalva de que a saída é texto para uma pessoa colar, e não ação do painel sobre o projeto observado. |
| `_reversa_sdd/prd.md` | `#5-não-objetivos-out` | regra-nova | A proibição de escrita sobreviveu inteira dos dois lados. Do lado da extensão, o painel não grava campo, não renomeia nada e não invoca ferramenta alguma. Do lado da manutenção, o comando escreve **apenas** o seu arquivo de proposta, e a conferência disso é um `git status` logo depois de rodá-lo, que foi feita sobre os projetos reais antes de a entrega ser declarada pronta. |

## O que o texto deliberadamente não diz

Vale registrar, porque a extração não tem como adivinhar que uma ausência foi escolhida. O prompt **não**
menciona checkpoint reconhecido por par aprovado nem registro aprovado como não-agente, e não pede
revisão de decisão que uma pessoa já tomou. Não afirma que o guia de checkpoint existe naquela raiz:
diz onde ele **costuma** morar. Não carrega número de medição que o painel não leu, nem conteúdo de
campo elidido. E não promove instante algum a prova de conclusão: a norma declarada é `completed_at`
com `files`, e nada além dela.

A duplicação do texto fixo entre o painel, em TypeScript, e o comando, em CommonJS, é consequência
inevitável de duas decisões do roadmap, D-03 e D-07, e está declarada em vez de escondida.
`tests/prompt-paridade.spec.ts` compara o texto **inteiro**, e não por resumo nem por primeiras linhas,
de modo que alterar um lado sem o outro faz a suíte falhar na hora em que a divergência nasce.

## Regras sob vigilância

O watch principal de `regression-watch.md` continua **vazio**, pelo mesmo motivo das features 001 a
012: sem extração `/reversa` sobre este repositório não há regras 🟢 a vigiar. Na seção "Observações",
sem peso de regressão, os identificadores **W001 a W020** cobrem os requisitos funcionais `RF-01` a
`RF-22`, e **W021**, **W022** e **W023** cobrem, respectivamente, a decisão D-04 do roadmap, o
determinismo exigido pela seção 4 de `interfaces/texto-do-prompt.md` e o cuidado com o destino da
varredura documentado no README. Os que mais pesam sobre a leitura da entrega aparecem nomeados na
tabela acima.

A ressalva da 012 vale aqui com força maior, e o próprio arquivo a repete: a maior parte do que esta
feature promete é **ausência**. Uma extração futura que não achasse estas verdades estaria diante de
lacuna de leitura, e não necessariamente de regressão; nesses itens, o sinal de violação é a **presença
do que deveria faltar**.

Como nas features anteriores, a numeração recomeça em W001, e o identificador só é legível junto do
nome da feature que o escreveu.

Conteúdo integral em `_reversa_forward/013-botao-do-prompt/regression-watch.md`.

## Fontes

- `_reversa_forward/013-botao-do-prompt/legacy-impact.md`
- `_reversa_forward/013-botao-do-prompt/regression-watch.md`
- `_reversa_forward/013-botao-do-prompt/requirements.md`
- `_reversa_forward/013-botao-do-prompt/roadmap.md`
- `_reversa_forward/013-botao-do-prompt/investigation.md`
- `_reversa_forward/013-botao-do-prompt/data-delta.md`
- `_reversa_forward/013-botao-do-prompt/interfaces/texto-do-prompt.md`
- `_reversa_forward/013-botao-do-prompt/actions.md`
- `_reversa_forward/013-botao-do-prompt/progress.jsonl`
