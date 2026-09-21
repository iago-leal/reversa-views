# Impacto sobre o legado: `014-cli-do-processo`

> Data: `2026-09-20`
> Feature: `014-cli-do-processo`
> Cenário: **greenfield**. Feature greenfield, sem legado pré-existente. Âncora: `prd.md` + specs SDD.
> Política de edição no momento da execução: `allowLegacyEdits: true` com `allowedPaths` **vazio**,
> isto é, liberação **irrestrita** de toda a raiz do projeto. Nenhuma escrita foi recusada, nenhum
> arquivo pré-existente foi apagado, e nenhuma linha de comportamento já entregue foi alterada.

Este projeto nasceu por `/reversa-new` e nunca passou por extração reversa: não há `architecture.md`
nem `domain.md`, e por isso não há regra 🟢 extraída de código a preservar ou a modificar. O mapeamento
abaixo aponta para as cinco specs de `_reversa_sdd/sdd/`, que são a âncora real.

Esta entrega tem uma particularidade que as treze anteriores não tinham: ela acrescenta uma **segunda
superfície** sobre a mesma camada de leitura. Tudo o que ela cria é componente novo; o que ela toca de
pré-existente são quatro coisas e nenhuma delas é regra: cabeçalhos de documentação que declaram um
estatuto que mudou, o manifesto de compilação do anfitrião que passa a excluir a pasta nova, os scripts
do `package.json` e duas suítes que fixavam contagens agora diferentes. A tabela separa os dois casos,
porque juntá-los apagaria a distinção que o dia da extração vai precisar.

## Arquivos afetados

### Componentes novos

| Arquivo afetado | Componente | Tipo | Severidade | Justificativa |
|---|---|---|---|---|
| `src/cli/index.ts` | `ponte-e-host` | `componente-novo` | HIGH | O ponto de entrada: escolhe o modo, separa os canais, e é o único que resolve a sessão real por `readWorkspace` |
| `src/cli/sessao.ts` | `leitura-do-processo` | `componente-novo` | HIGH | Dobra as mensagens de `sessionMessages` sobre `nextEntry`; é onde a ferramenta consome o julgamento sem refazê-lo (D-01, D-02) |
| `src/cli/conferencia.ts` | `ponte-e-host` | `componente-novo` | HIGH | Único módulo que nomeia `originPort`; reusa `queryPlan` e `interpretReply` de `src/host/update.ts`, sem cliente de rede próprio (RF-24, RN-10) |
| `src/cli/laco.ts` | `painel-do-processo` | `componente-novo` | HIGH | Único módulo com estado e único que trata sinal; prende a restauração do terminal a quatro caminhos (RF-15, D-16) |
| `src/cli/terminal.ts` | `painel-do-processo` | `componente-novo` | HIGH | Único módulo com sequência de escape; toma e devolve modo bruto, tela alternativa e cursor (RN-08, D-05) |
| `src/cli/editor.ts` | `painel-do-processo` | `componente-novo` | HIGH | Única criação de processo da ferramenta, sem shell e com o caminho resolvido sob a raiz observada (RN-03, D-08, D-09) |
| `src/cli/observacao.ts` | `painel-do-processo` | `componente-novo` | HIGH | Única assinatura de disco; agrupa a rajada em janela e degrada para intervalo declarando a razão (D-10, D-11) |
| `src/cli/navegacao.ts` | `painel-do-processo` | `componente-novo` | MEDIUM | Máquina pura de tecla para estado novo mais efeito nomeado, no molde do `router.ts` (D-06) |
| `src/cli/teclas.ts` | `painel-do-processo` | `componente-novo` | MEDIUM | Reconhecimento por bloco de bytes, sem temporizador, que é o que mantém a função pura (D-15) |
| `src/cli/quadro/index.ts` | `painel-do-processo` | `componente-novo` | HIGH | O quadro como função pura de carga, estado e dimensões, devolvendo linhas com ênfase abstrata (D-05) |
| `src/cli/quadro/secoes.ts` | `painel-do-processo` | `componente-novo` | HIGH | Percorre `sectionOrder()` e transcreve os onze títulos do painel; a duplicação é declarada e presa por paridade |
| `src/cli/quadro/cabecalho.ts` | `heranca-e-sincronia` | `componente-novo` | MEDIUM | Apresenta carimbo da construção e revisão do modelo herdado, como o cabeçalho do painel (RF-22) |
| `src/cli/quadro/bloqueio.ts` | `painel-do-processo` | `componente-novo` | MEDIUM | A faixa do bloqueio humano antes de tudo, e a única seção que nada fecha (RF-05) |
| `src/cli/quadro/diagnostico.ts` | `painel-do-processo` | `componente-novo` | MEDIUM | Política, anomalias e sonda, que são o diagnóstico que justifica a ferramenta existir (RF-07, RF-08) |
| `src/cli/quadro/entrada.ts` | `painel-do-processo` | `componente-novo` | MEDIUM | As quatro situações de entrada nomeadas, nenhuma delas produzindo tela vazia (RF-04) |
| `src/cli/quadro/procedencia.ts` | `painel-do-processo` | `componente-novo` | MEDIUM | Diz de onde veio a leitura que está na tela, que é o que a RN-09 exige da releitura por observação |
| `src/cli/quadro/medidas.ts` | `painel-do-processo` | `componente-novo` | MEDIUM | Recorte por pontos de código, deslocamento e janela; é onde oitenta colunas viram promessa conferível (RF-19) |
| `src/cli/quadro/ajuda.ts` | `painel-do-processo` | `componente-novo` | LOW | A tabela das teclas, para que ninguém precise de documentação para sair (RF-12) |
| `src/cli/passada.ts` | `painel-do-processo` | `componente-novo` | MEDIUM | O modo de uma passada, com tudo aberto e sem cursor, e o código de saída derivado da leitura (RF-17, RF-20) |
| `src/cli/dados.ts` | `leitura-do-processo` | `componente-novo` | MEDIUM | A saída legível por máquina, com a mesma carga que a ponte envia à tela, sem linha de apresentação (RF-21) |
| `src/cli/argumentos.ts` | `painel-do-processo` | `componente-novo` | MEDIUM | Resolve raiz, modo e desligamentos, e fixa os três códigos de saída em um lugar só (RF-03, RF-20, D-12) |
| `src/cli/uso.ts` | `painel-do-processo` | `componente-novo` | LOW | O texto do `--ajuda` e a recusa que nomeia o argumento não reconhecido (RF-25) |
| `src/cli/tipos.ts` | `painel-do-processo` | `componente-novo` | LOW | O vocabulário da ferramenta: ênfase abstrata, efeitos nomeados, teclas e procedência |
| `scripts/painel.js` | `empacotamento-e-verificacao` | `componente-novo` | MEDIUM | Casca fina no molde de `scripts/preview.js`; recusa quando a unidade não foi construída e nomeia o comando que a constrói (D-04) |
| `tsconfig.cli.json` | `empacotamento-e-verificacao` | `componente-novo` | HIGH | A terceira unidade de compilação, com saída em `out-cli/`, fora de `out/`; é o que mantém a ferramenta fora do pacote instalável (D-03) |
| `tests/cli-*.spec.ts(x)` (10 suítes) | todos os cinco | `componente-novo` | LOW | Escritas antes do núcleo; incluem a de fronteiras, a de paridade entre as duas superfícies e a do terminal |

### Arquivos pré-existentes tocados

Nenhum é regra alterada, e por isso nenhum deles carrega tipo de impacto sobre o legado: não há legado.
A coluna diz o que a execução fez com cada um.

| Arquivo | Componente | Natureza do toque | Severidade | Justificativa |
|---|---|---|---|---|
| `src/webview/domain/*.ts` (15 arquivos) | `painel-do-processo` | declaração de estatuto | LOW | Um parágrafo de cabeçalho por módulo: deixam de servir só à tela e passam a servir às duas superfícies, **sem mudar de lugar** (D-14). Zero linha de comportamento |
| `tsconfig.json` | `empacotamento-e-verificacao` | exclusão nova | HIGH | `src/cli/**` entra no `exclude` do anfitrião; sem isso a ferramenta compilaria para dentro de `out/` e viajaria no pacote |
| `package.json` | `empacotamento-e-verificacao` | três scripts | MEDIUM | `compile:cli`, `prepainel` e `painel`, ao lado dos auxiliares; `build` não invoca nenhum dos três |
| `.gitignore` | `empacotamento-e-verificacao` | ignora a saída nova | LOW | `out-cli/` ao lado de `out/`, com a razão escrita ao lado |
| `README.md` | `empacotamento-e-verificacao` | seção nova | LOW | O painel no terminal: invocação, os dois modos, o teclado, os três códigos de saída e as promessas negativas |
| `tests/host-manifest.spec.ts` | `empacotamento-e-verificacao` | contagens e asserções | MEDIUM | Fixava a lista exata dos scripts e duas unidades de compilação; passou a fixar vinte e seis scripts e três unidades |
| `tests/vsix-conteudo.spec.ts` | `empacotamento-e-verificacao` | recusa nova | HIGH | Passa a recusar qualquer caminho com `out-cli/` ou `src/cli/` dentro do pacote; é a prova de que a D-03 vale |

## Diff conceitual por componente

**`leitura-do-processo`.** Nada mudou nela, e esse é o ponto. A ferramenta não abre arquivo do Reversa,
não conhece o nome de pasta alguma do framework e não reimplementa regra: ela pede a leitura por
`readWorkspace`, recebe as mensagens que o host já compõe e as dobra sobre a máquina de estados da
tela. A suíte de fronteiras confere isso por busca nos fontes, com os comentários removidos antes: o
que vale é o que o código alcança, não o que a prosa cita. O único acréscimo do lado da leitura é a
serialização de `dados.ts`, que é a mesma carga em JSON, sem uma linha de apresentação misturada.

**`ponte-e-host`.** A ponte ganhou um segundo consumidor, e não ganhou porta. `sessionMessages` já era
a decisão de qual raiz ler e em que ordem contar o que se leu; o terminal a consome como o preview a
consome, e por isso as três superfícies não podem divergir sobre qual raiz é a raiz. A conferência de
atualização entra pelo módulo que já existia, com os mesmos desfechos nomeados, inclusive o de tempo
esgotado; a única liberdade que o terminal tomou foi **não perguntar** quando a conferência está
desligada, e dizer isso com palavras próprias. O desfecho `desligada` do protocolo fala da chave de
configuração do editor, que num terminal não existe: repeti-lo ali seria afirmar um fato falso.

**`painel-do-processo`.** É onde a feature toda mora. A spec já exigia que toda decisão de apresentação
vivesse em função pura fora dos componentes visuais, e essa exigência é o que tornou a segunda
superfície barata: ordem das seções, colapso inicial, rótulos, razões de bloqueio, integridade da
leitura e composição das anomalias vieram das mesmas funções, importadas e não copiadas. O que o
terminal escreveu por conta própria é o **desenho**: recorte de linha, janela de rolagem, ênfase
abstrata e a tradução dela em sequência de escape, confinada num módulo só. Os onze títulos de seção
são a exceção honesta: eles moram como literal dentro de cada componente React, e transcrevê-los foi
mais barato que mexer em onze arquivos de tela para exportá-los. A transcrição está declarada e presa
por `tests/cli-paridade.spec.tsx`, que renderiza o painel e compara, no molde que
`tests/prompt-paridade.spec.ts` já tinha inaugurado.

**`heranca-e-sincronia`.** O cabeçalho do terminal diz o que o cabeçalho do painel diz: versão da
extensão, carimbo da construção, revisão do modelo herdado e instante da leitura em Brasília. Os
valores vêm dos mesmos módulos, de modo que uma divergência entre as duas telas seria defeito de
leitura, nunca de apresentação.

**`empacotamento-e-verificacao`.** A decisão de maior consequência da feature é de empacotamento, e não
de tela: o `.vscodeignore` readmite `out/` inteiro, de modo que compilar a ferramenta junto com o
anfitrião a levaria para dentro da extensão que o usuário instala. Daí a terceira unidade, com saída em
`out-cli/`, a exclusão recíproca no manifesto do anfitrião, e a recusa em `tests/vsix-conteudo.spec.ts`
que confere o pacote de verdade, arquivo a arquivo. O pacote continua em 245,5 KiB, teto de 2048,0 KiB,
e nenhum caminho de `src/cli/` ou de `out-cli/` entrou nele. Nenhuma dependência de tempo de execução
foi acrescentada: controle de terminal, teclado e desenho saem do que o interpretador já oferece.

## Preservadas

Vazio, com a nota do cabeçalho: não há regra 🟢 extraída de código neste projeto, porque nunca houve
extração reversa. O que foi preservado por decisão, e não por extração, fica registrado para o dia em
que a extração vier:

- `src/webview/domain/` **não mudou de lugar**. Mover a pasta tocaria todo componente, toda suíte e
  todo adendo entregue sem alterar uma linha de comportamento; o estatuto novo foi declarado em
  cabeçalho e preso por suíte (D-14).
- Nenhum componente da tela, do host ou do protocolo foi alterado. A ferramenta é consumidora, e a
  prova disso é que a suíte do painel e a do host passaram sem uma linha tocada.
- O protocolo não ganhou comando algum, e `dispatch` continua reservado e sem tratador.
- A porta da origem continua sendo a única conexão do projeto, com os dois controles de desligamento.
- Os onze nomes de seção e a ordem deles seguem decididos em `src/webview/domain/types.ts`, num lugar
  só, para as duas superfícies.

## Modificadas

Vazio, com a mesma nota. Nenhuma regra extraída foi alterada ou removida, porque não há regra extraída.
As duas expectativas vizinhas que mudaram são de suíte, não de regra, e estão declaradas no
`progress.jsonl` e nas notas de execução do `actions.md`: `tests/host-manifest.spec.ts` passou a
enumerar vinte e seis scripts e três unidades de compilação, e `tests/vsix-conteudo.spec.ts` ganhou a
recusa que prende a D-03.

Uma correção de comportamento ocorreu **dentro** da própria feature, e está registrada como
`status: corrected` no `progress.jsonl`: a fumaça do laço vivo mostrou que devolver o terminal não
bastava para o processo terminar, porque uma entrada que já recebeu dados segue contando como alça viva
do laço de eventos. O `restaurar` passou a soltar a referência da entrada, o `entrar` a retomá-la, e
`tests/cli-terminal.spec.ts` prende os dois caminhos da devolução.
