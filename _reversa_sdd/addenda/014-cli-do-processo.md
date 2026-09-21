# Adendo: painel do processo na linha de comando

> Identificador da feature: `014-cli-do-processo`
> Data: `2026-09-20`
> Cenário: `greenfield`
> Gerado por: `/reversa-sync`

Esta é a primeira feature do projeto que acrescenta uma **segunda superfície** sobre a camada de
leitura, e é essa novidade que o adendo precisa deixar registrada. Até a 013, quem lesse a extração
podia supor que o processo do Reversa só se enxergava pela barra lateral do editor; desde a 014 existe
uma interface viva de terminal que desenha o mesmo estado em texto, navegável pelo teclado, e um modo
de uma passada que imprime e termina, para servir a script.

A entrega é superfície nova sobre julgamento existente: nenhuma regra do Reversa nasce nela, nenhum
componente da tela, do host ou do protocolo foi alterado, e a única razão de a segunda superfície ter
saído barata é que a spec do painel já exigia toda decisão de apresentação em função pura fora dos
componentes visuais. O terminal importou essas funções em vez de copiá-las, e escreveu por conta
própria apenas o desenho.

## Vigência

Vigente desde 2026-09-20.

## Resumo da entrega

A ferramenta pede a leitura por `readWorkspace`, recebe as mensagens que `sessionMessages` já compõe e
as dobra sobre a máquina de estados da tela, sem abrir arquivo do Reversa, sem conhecer nome de pasta
do framework e sem reimplementar regra alguma. Desenha as onze seções na ordem de `sectionOrder()`,
com o bloqueio humano antes de tudo e sem nada que o feche, identifica o item sob o cursor sem depender
de cor, abre o artefato apontado no editor da variável de ambiente, e relê o disco agrupando a rajada
numa janela de oitocentos milissegundos, declarando na tela de onde veio a leitura corrente. Devolve o
terminal nos quatro caminhos de saída, inclusive na suspensão por `Ctrl+Z`. Quando a saída não é um
terminal, o modo de uma passada imprime tudo aberto e sem cursor, e a bandeira de dados entrega a mesma
carga em JSON, sem linha de apresentação misturada.

A decisão de maior consequência, porém, é de empacotamento, e não de tela: como o `.vscodeignore`
readmite `out/` inteiro, compilar a ferramenta junto com o anfitrião a levaria para dentro da extensão
instalada. Daí a terceira unidade de compilação, com saída em `out-cli/`, a exclusão recíproca de
`src/cli/**` no manifesto do anfitrião, e a recusa em `tests/vsix-conteudo.spec.ts` que confere o pacote
arquivo a arquivo. O pacote continua em 245,5 KiB, teto de 2048,0 KiB, e nenhuma dependência de tempo de
execução foi acrescentada: controle de terminal, teclado e desenho saem do que o interpretador já oferece.

Quarenta e quatro ações executadas, todas marcadas `[X]` em `actions.md`, nenhuma falha. O
`progress.jsonl` tem 45 linhas, uma delas `corrected`: a fumaça do laço vivo mostrou que devolver o
terminal não bastava para o processo terminar depois de `q`, porque uma entrada que já recebeu dados
segue contando como alça viva do laço de eventos. O `restaurar` passou a soltar a referência da entrada,
o `entrar` a retomá-la, e `tests/cli-terminal.spec.ts`, que o plano não previa, prende os dois caminhos
da devolução.

## Impacto por artefato da extração

| Artefato | Seção | Tipo de impacto | Delta |
|---|---|---|---|
| `_reversa_sdd/prd.md` | `#4-escopo-in` | componente-novo | O produto deixa de ter uma superfície e passa a ter duas sobre a mesma leitura. Leia o escopo sabendo que o que ele descreve como painel vale igualmente para o terminal, e que a superfície é o único ponto do escopo que era próprio do editor. **Registrado como W003.** |
| `_reversa_sdd/prd.md` | `#5-nao-objetivos-out` | regra-nova | O não-objetivo fala de **outros editores**, e essa literalidade é o que abriu espaço para a feature: um terminal não é editor. Os outros dois sobreviveram inteiros, sem publicação em Marketplace e sem tráfego novo, porque a conferência de atualização entra pela porta que já existia. **Registrado como W027 e W032.** |
| `_reversa_sdd/prd.md` | `#pendencias-de-cobertura` | regra-nova | A observação automática do disco, ali adiada até que a releitura manual incomodasse, foi **reaberta e entregue** nesta feature, com janela de agrupamento de 800 ms e degradação para intervalo de 2000 ms que declara a razão em vez de silenciar. Essa pendência deixa de estar aberta. **Registrado como W015 e W016.** |
| `_reversa_sdd/sdd/leitura-do-processo.md` | `#4-non-goals-fora-do-escopo` | componente-novo | O NG-03 dizia que a camada entrega o processo inteiro e não decide o que a tela mostra, com a seleção pertencendo a quem desenha. O segundo desenhista previsto pelo modelo existe agora, e a camada não mudou uma linha para recebê-lo. **Registrado como W001.** |
| `_reversa_sdd/sdd/leitura-do-processo.md` | `#8-design-e-interface` | componente-novo | Uma chamada, um resultado, sem estado entre chamadas: a descrição continua exata e ganha um consumidor. O acréscimo do lado da leitura é `src/cli/dados.ts`, que serializa a mesma carga que a ponte envia à tela, sem apresentação misturada. **Registrado como W024.** |
| `_reversa_sdd/sdd/ponte-e-host.md` | `#6-requisitos-funcionais` | componente-novo | A ponte ganhou um segundo consumidor e **não ganhou comando**: `sessionMessages` decide qual raiz ler e em que ordem contar o que se leu, e o terminal a consome como o preview a consome, de modo que as três superfícies não podem divergir sobre qual raiz é a raiz. `dispatch` continua reservado e sem tratador. **Registrado como W001 e W033.** |
| `_reversa_sdd/sdd/ponte-e-host.md` | `#10-integracoes-e-dependencias` | delta-de-contrato-externo | A conferência de atualização entra por `conferencia.ts`, único módulo que nomeia `originPort`, reusando `queryPlan` e `interpretReply` sem cliente de rede próprio, com os mesmos desfechos nomeados, inclusive o de tempo esgotado. A única liberdade tomada foi **não perguntar** quando a conferência está desligada: o desfecho `desligada` do protocolo fala de uma chave de configuração do editor, que num terminal não existe, e repeti-lo ali afirmaria um fato falso. **Registrado como W027.** |
| `_reversa_sdd/sdd/painel-do-processo.md` | `#6-requisitos-funcionais` | componente-novo | O RF-13, que exige decisão de apresentação em função pura fora dos componentes visuais, e o RF-14, que fixa a ordem das seções, são exatamente as peças que tornaram a segunda superfície barata: ordem, colapso inicial, rótulos, razões de bloqueio, integridade e composição das anomalias vieram das mesmas funções, **importadas e não copiadas**. Leia os requisitos do painel como requisitos das duas superfícies. **Registrado como W002, W006, W007 e W011.** |
| `_reversa_sdd/sdd/painel-do-processo.md` | `#8-design-e-interface` | componente-novo | O que o terminal escreveu por conta própria é o desenho: recorte por pontos de código, janela de rolagem, ênfase abstrata e a tradução dela em sequência de escape, confinada em `src/cli/terminal.ts`. Os onze títulos de seção são a exceção honesta, transcritos porque moram como literal dentro de cada componente React; a transcrição está declarada e presa por `tests/cli-paridade.spec.tsx`, que renderiza o painel e compara, no molde que `tests/prompt-paridade.spec.ts` inaugurou. **Registrado como W003, W010 e W022.** |
| `_reversa_sdd/sdd/painel-do-processo.md` | `#9-modelo-de-dados` | delta-de-dados | Nenhum campo da carga foi acrescentado, removido ou renomeado, e nada é persistido. O que nasce são estruturas efêmeras nomeadas em `src/cli/tipos.ts`, estado de navegação, quadro, linha do quadro e observação, nenhuma delas atravessando o fim do processo, por força da RN-02, que proíbe escrever, e da RN-05, segundo a qual nenhum estado sobrevive entre execuções. **Registrado como W030 e W032.** |
| `_reversa_sdd/sdd/painel-do-processo.md` | `#4-non-goals-fora-do-escopo` | regra-nova | A única criação de processo da ferramenta é o editor, sem shell e com o caminho resolvido sob a raiz observada; faltando `VISUAL` e `EDITOR`, ela **diz qual definir** em vez de falhar calada. Despachar agente continua fora, e o lugar reservado segue vazio. **Registrado como W012 e W013.** |
| `_reversa_sdd/sdd/heranca-e-sincronia.md` | `#6-requisitos-funcionais` | componente-novo | O cabeçalho do terminal diz o que o cabeçalho do painel diz, versão da extensão, carimbo da construção, revisão do modelo herdado e instante da leitura em Brasília, e os valores vêm dos mesmos módulos. Uma divergência entre as duas telas seria, portanto, defeito de leitura, nunca de apresentação. **Registrado como W025 e W033.** |
| `_reversa_sdd/sdd/empacotamento-e-verificacao.md` | `#6-requisitos-funcionais` | componente-novo | Uma terceira unidade de compilação, `tsconfig.cli.json`, com saída em `out-cli/`, fora de `out/`, e a exclusão de `src/cli/**` no manifesto do anfitrião. O `package.json` declara agora vinte e seis scripts, entre eles `compile:cli`, `prepainel` e `painel`, e `build` não invoca nenhum dos três. **Registrado como W035.** |
| `_reversa_sdd/sdd/empacotamento-e-verificacao.md` | `#8-design-e-interface` | componente-novo | `scripts/painel.js` é casca fina no molde de `scripts/preview.js`: confere a unidade construída, recusa rodar sobre saída ausente nomeando o comando que a produz, e entrega os argumentos crus sem decidir nada. **Registrado como W036.** |
| `_reversa_sdd/sdd/empacotamento-e-verificacao.md` | `#11-edge-cases-e-tratamento-de-erros` | regra-alterada | Duas suítes vizinhas mudaram de expectativa, e a mudança é de expectativa, não de regra: `tests/host-manifest.spec.ts` passou a enumerar vinte e seis scripts e três unidades de compilação, e `tests/vsix-conteudo.spec.ts` ganhou a recusa de qualquer caminho de `src/cli/` ou `out-cli/` dentro do pacote gerado, que é a prova de que a decisão de empacotamento vale. **Registrado como W035.** |

## O que o texto deliberadamente não diz

Vale registrar, porque a extração não tem como adivinhar que uma ausência foi escolhida.
`src/webview/domain/` **não mudou de lugar**, embora tenha deixado de servir só à tela: mover a pasta
tocaria todo componente, toda suíte e todo adendo entregue sem alterar uma linha de comportamento, e
por isso o estatuto novo foi declarado em cabeçalho, um parágrafo por módulo nos quinze arquivos, e
preso por suíte. A ferramenta também não conhece caminho de arquivo do Reversa, não decide fase, não
guarda estado entre execuções e não carrega dependência nova; `tests/cli-boundaries.spec.ts` confere
isso por busca nos fontes, com os comentários removidos antes, de modo que o que vale é o que o código
alcança, não o que a prosa cita.

## Regras sob vigilância

O watch principal de `regression-watch.md` continua **vazio**, pelo mesmo motivo das features 001 a 013:
sem extração `/reversa` sobre este repositório não há regras 🟢 a vigiar. Na seção "Observações", sem
peso de regressão, os identificadores **W001 a W034** cobrem os requisitos `RF-01` a `RF-26` e `RN-01` a
`RN-10`, **W035 a W037** cobrem as decisões D-03, D-04 e D-14 do roadmap, e **W038** cobre os quatro
caminhos que o `onboarding.md` manda exercer em terminal de verdade, porque suíte alguma os substitui.

A esta feature o arquivo acrescenta um modo de regredir que as anteriores não tinham: com duas
superfícies, a regressão pode deixar de ser a tela calar-se e passar a ser as duas **discordarem**, sem
que suíte alguma caia. É contra isso que `tests/cli-boundaries.spec.ts` e `tests/cli-paridade.spec.tsx`
existem, e afrouxar qualquer uma das duas é o sinal de violação mais grave da lista.

Vale ainda a ressalva herdada da 012 e da 013, aqui com força maior: boa parte do que a ferramenta
promete é **ausência**. Uma extração futura que não achasse estas verdades estaria diante de lacuna de
leitura, e não necessariamente de regressão; nesses itens, o sinal de violação é a **presença do que
deveria faltar**.

Como nas features anteriores, a numeração recomeça em W001, e o identificador só é legível junto do nome
da feature que o escreveu.

Conteúdo integral em `_reversa_forward/014-cli-do-processo/regression-watch.md`.

## Fontes

- `_reversa_forward/014-cli-do-processo/legacy-impact.md`
- `_reversa_forward/014-cli-do-processo/regression-watch.md`
- `_reversa_forward/014-cli-do-processo/requirements.md`
- `_reversa_forward/014-cli-do-processo/roadmap.md`
- `_reversa_forward/014-cli-do-processo/investigation.md`
- `_reversa_forward/014-cli-do-processo/data-delta.md`
- `_reversa_forward/014-cli-do-processo/onboarding.md`
- `_reversa_forward/014-cli-do-processo/interfaces/contrato-de-linha-de-comando.md`
- `_reversa_forward/014-cli-do-processo/interfaces/teclado.md`
- `_reversa_forward/014-cli-do-processo/interfaces/abertura-no-editor.md`
- `_reversa_forward/014-cli-do-processo/actions.md`
- `_reversa_forward/014-cli-do-processo/progress.jsonl`
