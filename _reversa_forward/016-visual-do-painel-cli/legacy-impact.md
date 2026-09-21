# Impacto sobre o legado: `016-visual-do-painel-cli`

> Data: `2026-09-21`
> Feature: `016-visual-do-painel-cli`
> Cenário: **greenfield**. Feature greenfield, sem legado pré-existente. Âncora: `prd.md` + specs SDD.
> Política de edição no momento da execução: `allowLegacyEdits: true` com `allowedPaths` **vazio**,
> isto é, liberação **irrestrita** de toda a raiz do projeto. Nenhuma escrita foi recusada e nenhum
> arquivo pré-existente foi apagado.

Este projeto nasceu por `/reversa-new` e nunca passou por extração reversa: não há `architecture.md`
nem `domain.md`, e por isso não há regra 🟢 extraída de código a preservar ou a modificar. O mapeamento
abaixo aponta para as specs de `_reversa_sdd/sdd/` e para o adendo 014, `014-cli-do-processo.md`, que é
a âncora real: a ferramenta de terminal não tem spec própria, e é o adendo que a descreve.

A entrega é de **aparência**, e o que a define é o que ela deixou parado: a saída de dados, os códigos
de saída, as frases do quadro, a ordem das onze seções compartilhadas e a paridade com a webview. Dentro
da unidade de terminal, porém, ela **troca o modelo de linha**: a ênfase única por linha deu lugar a
trechos com papel, e todo módulo do quadro foi tocado por isso. Os arquivos alterados vão em tabela
própria, separados dos novos, porque é essa a distinção de que o dia da extração vai precisar.

Resultado da execução: 57 ações de 57, nenhuma falha. Suíte inteira: 145 arquivos, 2625 testes passando;
`tsc` das três unidades e `check:webview` limpos.

## Arquivos afetados

### Componentes novos

| Arquivo afetado | Componente | Tipo | Severidade | Justificativa |
|---|---|---|---|---|
| `src/cli/paleta.ts` | `painel-do-processo` (terminal, adendo 014) | `componente-novo` | HIGH | Único módulo com valor de cor: tons por fundo e por papel, em 24 bits e em 256, e os códigos do jogo de dezesseis (RF-01, D-02 a D-04) |
| `src/cli/ambiente.ts` | `painel-do-processo` (terminal) | `componente-novo` | HIGH | Do ambiente para a apresentação: degrau de cor, fundo e jogo de glifos, como funções puras, sem perguntar nada ao terminal (RF-11, RF-14, RF-20, RF-21) |
| `src/cli/quadro/trechos.ts` | `painel-do-processo` (terminal) | `componente-novo` | HIGH | Construtor único de trecho e de linha; é onde a higiene é aplicada a todo texto que entra no quadro (D-01, D-09) |
| `src/cli/quadro/higiene.ts` | `painel-do-processo` (terminal) | `componente-novo` | HIGH | Troca caractere de controle por representação visível; é a defesa contra texto hostil vindo do disco (RN-05, D-09) |
| `src/cli/quadro/glifos.ts` | `painel-do-processo` (terminal) | `componente-novo` | MEDIUM | Os dois jogos de glifos e de moldura, Unicode e sete bits, e a medida em colunas (RF-04, RF-05, RF-07, RF-14) |
| `src/cli/quadro/moldura.ts` | `painel-do-processo` (terminal) | `componente-novo` | MEDIUM | Moldura de cantos arredondados com o título na borda superior (RF-02, RF-03, RF-09) |
| `src/cli/quadro/linha-de-estado.ts` | `painel-do-processo` (terminal) | `componente-novo` | MEDIUM | A linha de estado fixa: observação, procedência, teclas e posição, com a ordem de sacrifício por largura (RF-08, RF-10, D-17, D-18) |
| `src/cli/quadro/secao-de-versoes.ts` | `painel-do-processo` (terminal) | `componente-novo` | MEDIUM | A décima segunda seção, só do terminal, com os fatos que deixaram o cabeçalho (RF-18, D-15, D-16) |
| `src/cli/amostras.ts` | `empacotamento-e-verificacao` | `componente-novo` | LOW | Função pura de um estado fixo para onze quadros de amostra (RF-17, D-23) |
| `scripts/amostras-do-painel.js` | `empacotamento-e-verificacao` | `componente-novo` | LOW | Casca que grava as amostras; mora fora de `src/cli/` porque a ferramenta não escreve |
| `amostras/painel/estado.json` e onze `*.txt` | `empacotamento-e-verificacao` | `componente-novo` | LOW | Estado fixo e amostras versionadas, fora do pacote instalável |
| `tests/cli-paleta.spec.ts`, `cli-ambiente`, `cli-higiene`, `cli-moldura`, `cli-linha-de-estado`, `cli-amostras` | `empacotamento-e-verificacao` | `componente-novo` | MEDIUM | Seis suítes novas; a da paleta prende o contraste por medida, e a das amostras compara o gerado com o gravado |

### Componentes pré-existentes alterados

Todos pertencem à feature 014, entregue e convergida em adendo. O tipo segue `componente-novo` por
força do cenário greenfield; a coluna de justificativa diz o que mudou.

| Arquivo afetado | Componente | Tipo | Severidade | Justificativa |
|---|---|---|---|---|
| `src/cli/tipos.ts` | `painel-do-processo` (terminal) | `componente-novo` | HIGH | `Enfase` e `LinhaDoQuadro.enfase` **removidos**; entram `Papel`, `Trecho`, `LinhaDoQuadro.trechos`, `Quadro.linhaDeEstado`, `MarcaDeEstado`, `SecaoDoTerminal`, `Apresentacao` e os tipos de degrau, fundo e jogo |
| `src/cli/terminal.ts` | `painel-do-processo` (terminal) | `componente-novo` | HIGH | `vestir` e `cor` dão lugar a `vestirLinha`, que funde trechos e fecha a veste por linha; a linha de estado é escrita por posicionamento absoluto na última linha |
| `src/cli/quadro/index.ts` | `painel-do-processo` (terminal) | `componente-novo` | HIGH | Compositor reescrito: molduras, glifos, dado secundário em linha própria, seleção por bloco, seção de versões, `apresentacao` opcional |
| `src/cli/quadro/cabecalho.ts` | `painel-do-processo` (terminal) | `componente-novo` | MEDIUM | `linhasDoCabecalho` sai, `nucleoDoCabecalho` entra: quatro fatos e a integridade; o resto foi para a seção de versões |
| `src/cli/quadro/secoes.ts`, `bloqueio.ts`, `diagnostico.ts` | `painel-do-processo` (terminal) | `componente-novo` | MEDIUM | Itens ganham `marca` e `secundarios`; o separador vem do jogo de glifos; o caminho deixa o texto do item |
| `src/cli/quadro/ajuda.ts`, `medidas.ts` | `painel-do-processo` (terminal) | `componente-novo` | LOW | Ajuda em moldura e em dois jogos; `truncar` recebe as reticências, `ajustarDeslocamento` recebe o bloco |
| `src/cli/navegacao.ts` | `painel-do-processo` (terminal) | `componente-novo` | MEDIUM | A seção de versões entra nas recolhíveis; os tipos alargam para `SecaoDoTerminal` |
| `src/cli/argumentos.ts`, `uso.ts`, `index.ts` | `ponte-e-host` (linha de comando) | `componente-novo` | MEDIUM | Bandeira `--tema=`, `Configuracao.apresentacao`, aviso de tema no canal de erro; **delta de contrato** descrito em `interfaces/contrato-de-linha-de-comando.md` |
| `src/cli/laco.ts`, `passada.ts` | `painel-do-processo` (terminal) | `componente-novo` | MEDIUM | O laço pede molduras e reserva a linha de estado; a passada veste por trecho e segue sem moldura |
| `tests/cli-quadro`, `cli-navegacao`, `cli-terminal`, `cli-argumentos`, `cli-passada` | `empacotamento-e-verificacao` | `componente-novo` | MEDIUM | Disposição declarada, casos novos de moldura, glifo, texto hostil e desempenho; três casos reescritos, o resto acréscimo |
| `tests/cli-boundaries.spec.ts` | `empacotamento-e-verificacao` | `componente-novo` | MEDIUM | **Só acréscimo**: a guarda do valor de cor e a dos nomes vigiados |
| `tests/host-manifest.spec.ts`, `tests/vsix-conteudo.spec.ts` | `empacotamento-e-verificacao` | `componente-novo` | LOW | Trinta e dois scripts no lugar de trinta; recusa nomeada de `amostras/` no pacote |
| `package.json` | `empacotamento-e-verificacao` | `componente-novo` | LOW | Scripts `preamostras:painel` e `amostras:painel`; nenhuma dependência nova |
| `README.md` | documentação | `componente-novo` | LOW | Subseção "A aparência, e o que ela não muda" |

Intocados de propósito, e conferidos: `tests/cli-paridade.spec.tsx`, as suítes da saída de dados e dos
códigos de saída, `src/webview/`, `src/host/`, `sectionOrder()` e `SectionName`.

## Diff conceitual por componente

**Modelo de linha.** Antes, uma linha do quadro tinha um texto e uma ênfase. Agora tem um texto e uma
lista de trechos, cada um com papel: normal, título, acento, destaque, atenuado, borda, concluído,
atenção e falha. O campo `texto` continua existindo e continua sendo a soma dos trechos, que é o que
mantém a paridade e a passada redirecionada comparáveis por texto. O desenho nomeia papel; só
`terminal.ts` sabe transformar papel em sequência, e só `paleta.ts` sabe que cor um papel tem. As duas
fronteiras são conferidas por busca nos fontes.

**Apresentação.** Três eixos independentes, todos decididos antes do primeiro desenho e sem escrever
nada no terminal: degrau de cor, fundo e jogo de glifos. `--sem-cor` e `NO_COLOR` zeram o primeiro e só
ele.

**Quadro.** O cabeçalho encolheu para um núcleo emoldurado, e o que saiu dele foi para a seção
"Versões e construção", que só o terminal tem e que fica fora de `sectionOrder()`. O bloqueio ganhou
moldura própria na cor de atenção, com glifo de atenção no título. Cada item separa o dado principal do
secundário, que desce para linha própria atrás de um glifo de continuação. A seleção passou a ser um
bloco de linhas, e a rolagem o mantém inteiro na janela.

**Linha de estado.** Última linha da janela, fora da rolagem. A janela útil perde uma linha por causa
dela, e `alturaUtil()` é o único lugar que sabe disso.

**Passada.** O mesmo quadro sem cursor, sem moldura e sem linha de estado. Diante de terminal sai
vestida; redirecionada, sai sem sequência alguma. A garantia passou de identidade de bytes a identidade
de texto.

**Amostras.** Onze quadros gerados de um estado fixo e versionados; a suíte reprova quando o gravado
não acompanha o gerado.

Os desvios em relação ao plano estão em "Notas de execução" do `actions.md`, doze ao todo.

## Preservadas

Vazia. Feature greenfield, sem legado pré-existente: não há `domain.md`, e portanto não há regra 🟢
extraída a listar como intacta.

## Modificadas

Vazia, pela mesma razão. O que esta entrega muda em relação ao adendo 014 está na tabela de componentes
alterados acima, e cabe ao `/reversa-sync` levá-lo ao adendo da 016.
