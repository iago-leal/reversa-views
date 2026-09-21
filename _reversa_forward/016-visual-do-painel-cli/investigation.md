# Investigação: visual do painel de linha de comando

> Feature: `016-visual-do-painel-cli`
> Data: `2026-09-21`
> Complementa `estudo-de-possibilidades.md`, que mediu o terminal de trabalho, a paleta da referência,
> o contraste e o quadro de hoje. O que está lá não se repete aqui.

## 1. O que foi lido no código

| Fato | Onde | Consequência para o plano |
|---|---|---|
| A ênfase é um valor por linha, e só a primeira linha de um texto recortado a carrega | `src/cli/quadro/index.ts`, função `empurrar` | O ponto único de criação de linha já existe; é nele que entram os trechos e o neutralizador (D-01, D-20) |
| `indiceDaSelecao` e `artefatoSelecionado` acham a linha por `enfase === 'selecionada'` | `src/cli/quadro/index.ts` | A seleção precisa de campo próprio quando a ênfase deixa de ser da linha (D-01) |
| O glifo de estado da ação, `✓`, `→` ou `·`, é concatenado ao texto dentro de `secoes.ts`, junto com o caminho e o instante | `src/cli/quadro/secoes.ts`, `secaoDaDecomposicao` | Colorir o glifo exige tirá-lo do texto; separar o secundário exige tirá-los também. Os dois pedem o mesmo campo novo em `ItemDaSecao` (D-13) |
| O compositor acrescenta ` · caminho` ao item quando o texto ainda não o contém | `src/cli/quadro/index.ts`, `linhasDaSecao` | A regra geral do secundário já tem lugar: basta que o acréscimo vire linha própria |
| A passada imprime `linha.texto` e ignora a ênfase, mesmo diante de terminal | `src/cli/passada.ts`, `src/cli/index.ts` | O RF-19 é acréscimo pequeno: a passada passa a chamar a vestidura quando `config.cor` é verdadeiro |
| `config.cor` já é `saidaEhTerminal && !--sem-cor && !NO_COLOR` | `src/cli/argumentos.ts` | O degrau "nenhuma" já está decidido; os outros três são refinamento dele (D-07, D-09) |
| O recado do editor ocupa a última linha da janela, e o laço desconta uma linha da altura quando ele existe | `src/cli/laco.ts`, `pedidoDoQuadro` e `desenhar` | A linha de estado fixa é um segundo desconto, no mesmo lugar (D-17) |
| `fundo(contexto)` e o `fim` da navegação dependem de `alturaVisivel` | `src/cli/navegacao.ts` | A altura útil tem de sair de um ponto só, ou o `G` para uma linha antes do fim (risco 1 do roadmap) |
| A guarda do caractere de escape casa as grafias `\u001b`, `\x1b` e `\e[` | `tests/cli-boundaries.spec.ts` | Um neutralizador escrito com intervalo de pontos de código (`\u0000-\u001f`) não dispara a guarda, e pode morar em `quadro/` |
| O `.vscodeignore` exclui tudo e readmite por ato | `.vscodeignore` | `amostras/` nasce fora do pacote sem linha nova |

## 2. O que foi medido nesta etapa

Pela fórmula de contraste da WCAG, sobre preto para a paleta escura e sobre branco para a clara, com o
índice de 256 cores mais próximo por distância euclidiana.

| Papel | Fundo | 24 bits | Contraste | Mais próximo em 256 | Contraste dele |
|---|---|---|---|---|---|
| Acento | escuro | `215,119,87` | 6,67 | 173 | 7,52 |
| Atenuado | escuro | `153,153,153` | 7,37 | 246 | 6,92 |
| Borda | escuro | `80,80,80` | 2,60 | 239 | 2,52 |
| Concluído | escuro | `78,186,101` | 8,54 | 71 | 7,78 |
| Falha | escuro | `255,107,128` | 7,67 | 204 | 7,24 |
| Atenção | escuro | `255,193,7` | 12,88 | 214 | 11,38 |
| Acento | claro | `215,119,87` | **3,15** | 173 | **2,79** |
| Atenuado | claro | `102,102,102` | 5,74 | 241 | 6,10 |
| Borda | claro | `175,175,175` | 2,19 | 145 | 2,19 |
| Concluído | claro | `44,122,57` | 5,32 | **239, um cinza** | 8,32 |
| Falha | claro | `171,43,63` | 6,67 | 125, magenta | 7,03 |
| Atenção | claro | `150,108,30` | 4,71 | 94 | 5,73 |

Dois achados que o estudo não tinha.

**O acento reprova sobre branco.** O NFR de acessibilidade pede 4,5 para todo texto de leitura, e a
RN-04 pede o acento igual nos dois fundos. Escurecendo o acento sem mudar a matiz, o primeiro tom que
passa é `174,96,70`, a 81% do original, com 4,60; o índice de 256 mais próximo dele que ainda passa é o
131, com 4,54. Daí a D-04: o tom único veste marca, onde o piso é 3 para 1, e o texto em foco tem papel
próprio. A segunda rodada de esclarecimento confirmou essa leitura e a levou à RN-04 e ao NFR.
Na redação de então, o NFR pedia 4,5 para todo texto e a RN-04 pedia o acento igual nos dois fundos,
sem distinguir marca de texto.

**A distância euclidiana perde a matiz no fundo claro.** Os tons escuros e pouco saturados ficam mais
perto da rampa de cinzas do que do cubo de cores. Candidatos escolhidos à mão, com o contraste sobre
branco: concluído 28 (`0,135,0`, 4,70), falha 124 (`175,0,0`, 7,44), atenção 94 (`135,95,0`, 5,73),
destaque 131 (`175,95,95`, 4,54). Recusados: 65 para o concluído (4,10) e 29 (4,53, mas azulado).

## 3. Alternativas avaliadas

| Tema | Alternativa | Por que não |
|---|---|---|
| Modelo da linha | Marcação embutida no texto, no estilo de etiquetas | O recorte teria de contar largura ignorando marcação, e a comparação de texto das suítes deixaria de ser comparação de texto |
| Modelo da linha | Manter a ênfase da linha e acrescentar só uma "marca" colorida à esquerda | Não alcança o RF-04, contagem atenuada ao lado do título, nem o RF-02, nome no acento dentro da borda |
| Detecção de cor | Consultar a base de capacidades do sistema | Exige processo filho, que a fronteira confina ao editor, ou leitura de base binária sem dependência, custo sem proporção |
| Detecção de fundo | Perguntar ao terminal | Descartada no requirements; registrada como evolução possível |
| Linha de estado | Última linha do quadro, preenchendo com linhas em branco | Inventa linha, o que `janela` promete não fazer, e sobe em quadro curto |
| Linha de estado | Região de rolagem do terminal | Mais sequências e mais estado de terminal a restaurar nos quatro caminhos de saída; o redesenho integral da 014 torna isso desnecessário |
| Seção "Versões e construção" | Entrar em `SectionName` | Tocaria a apresentação compartilhada e a tela por uma seção que a tela não tem |
| Largura de célula | Tabela de caracteres largos para alinhar a borda direita | Sem dependência, é tabela grande para um caso raro; a 014 já conta pontos de código e o risco é só estético |
| Amostras | Imagens de captura de tela | Não reproduzíveis sem terminal, e não comparáveis por suíte |
| Guarda da RN-07 | Lista de nomes vigiados num módulo de `src/cli/` | Poria os nomes justamente onde a regra os proíbe; na suíte, a busca varre `src/cli/` e a lista mora em `tests/` |
| Guarda da RN-07 | Estender a busca ao README e aos documentos do ciclo | A Q-018 do requirements registra que nomear a referência em documento é escolha consciente; a regra fala do que a ferramenta exibe |

## 4. Padrões aplicáveis

- **Núcleo puro, borda fina.** É o padrão da 014 e continua: paleta, ambiente, moldura, glifos e
  higiene são funções ou dados puros; só `terminal.ts` fala com o terminal.
- **Fronteira verificável por busca.** Cada confinamento desta feature vira uma busca nos fontes: valor
  de cor só em `paleta.ts`, caractere de escape só em `terminal.ts`.
- **Degradação graciosa declarada pelo ambiente.** `NO_COLOR`, `COLORTERM`, `TERM` e as variáveis de
  localidade são convenções, e a ferramenta só as lê.
- **Arquivo de referência conferido por suíte.** As amostras seguem o molde das suítes de paridade da
  casa: o gerado é comparado ao gravado, e divergência é decisão a revisar, não ruído.
- **Texto do mundo é dado.** Neutralização de caracteres de controle antes de qualquer escrita em
  terminal, como se faz com marcação antes de escrever em página.

## 5. Fontes

- `_reversa_forward/016-visual-do-painel-cli/estudo-de-possibilidades.md`
- `_reversa_forward/014-cli-do-processo/roadmap.md`, decisões D-05, D-07, D-12 e D-14
- `_reversa_forward/014-cli-do-processo/interfaces/contrato-de-linha-de-comando.md`
- `_reversa_sdd/addenda/014-cli-do-processo.md` e `_reversa_sdd/addenda/015-fases-fora-do-canone.md`
- WCAG 2.1, critérios 1.4.3, contraste de texto, e 1.4.11, contraste de elemento não textual: https://www.w3.org/TR/WCAG21/
- Convenção `NO_COLOR`: https://no-color.org
- ECMA-48, funções de controle e seleção de representação gráfica: https://ecma-international.org/publications-and-standards/standards/ecma-48/
- Documentação do Vim sobre a opção `background` e a leitura de `COLORFGBG`: https://vimhelp.org/options.txt.html#%27background%27
- Bloco Unicode de figuras de controle, U+2400 a U+2426: https://www.unicode.org/charts/PDF/U2400.pdf
