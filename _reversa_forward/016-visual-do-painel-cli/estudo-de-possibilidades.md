# Estudo de possibilidades: visual do painel de linha de comando

> Feature: `016-visual-do-painel-cli`
> Data: `2026-09-21`
> Finalidade: instruir a sessão de `/reversa-clarify` com medições, e não com impressão.
> Estatuto: estudo. Nada aqui é decisão até que o `requirements.md` o registre.

## 1. O que foi medido

### 1.1 O terminal em que o projeto é usado

| Variável | Valor | Leitura |
|---|---|---|
| `TERM_PROGRAM` | `iTerm.app` | O terminal de trabalho não é o padrão do sistema |
| `COLORTERM` | `truecolor` | Cor de 24 bits declarada |
| `TERM` | `xterm-256color` | Piso de 256 cores |
| `COLORFGBG` | `15;0` | Primeiro plano claro sobre fundo preto: o fundo é **escuro**, e o terminal o declara |
| `LANG` | `pt_BR.UTF-8` | Unicode disponível |

Correção ao `requirements.md`: a justificativa do RF-11 supunha o terminal padrão do sistema, que não
oferece 24 bits. Ele está instalado, mas não é o que se usa. A degradação continua necessária, pelo
Operador remoto e pelo terminal embutido de outros ambientes, e deixa de ser o caso principal.

### 1.2 A paleta da referência

Extraída das definições de tema do executável instalado (versão 2.1.278), e não estimada de captura de
tela. A referência traz quatro temas: escuro, claro e uma variante de cada para daltonismo.

| Papel na referência | Tema escuro | Tema claro |
|---|---|---|
| Acento | `215,119,87` | `215,119,87` (o mesmo) |
| Texto | `255,255,255` | `0,0,0` |
| Inativo (dado secundário) | `153,153,153` | `102,102,102` |
| Sutil (bordas discretas) | `80,80,80` | `175,175,175` |
| Borda da caixa de entrada | `136,136,136` | `153,153,153` |
| Sucesso | `78,186,101` | `44,122,57` |
| Falha | `255,107,128` | `171,43,63` |
| Atenção | `255,193,7` | `150,108,30` |

Dois fatos saem daí. O acento é um só nos dois fundos, e é o único tom que não muda. Todo o resto muda,
e muda em sentido oposto: o que é claro num tema é escuro no outro.

### 1.3 Contraste, pela fórmula da WCAG

| Cor | Sobre preto | Sobre `30,30,30` | Sobre branco |
|---|---|---|---|
| Acento | 6,67 | 5,29 | **3,15** |
| Inativo do tema escuro | 7,37 | 5,85 | **2,85** |
| Sucesso do tema escuro | 8,54 | 6,78 | **2,46** |
| Falha do tema escuro | 7,67 | 6,09 | **2,74** |
| Atenção do tema escuro | 12,88 | 10,23 | **1,63** |
| Inativo do tema claro | **3,66** | **2,90** | 5,74 |
| Sucesso do tema claro | **3,95** | **3,14** | 5,32 |
| Falha do tema claro | **3,15** | **2,50** | 6,67 |
| Atenção do tema claro | 4,46 | **3,54** | 4,71 |

Em negrito, o que fica abaixo de 4,5 para 1. A tabela responde sozinha à segunda dúvida: **não existe
conjunto único de tons que passe nos dois fundos**. A atenção do tema escuro sobre branco chega a 1,63,
que é ilegível. A saída "tons que sobrevivam aos dois fundos" não é um meio-termo, é uma tela medíocre
nos dois.

### 1.4 Degradação para 256 cores

| Papel | 24 bits | Índice mais próximo | Tom obtido | Distância |
|---|---|---|---|---|
| Acento | `215,119,87` | 173 | `215,135,95` | 17,9 |
| Sucesso | `78,186,101` | 71 | `95,175,95` | 21,1 |
| Falha | `255,107,128` | 204 | `255,95,135` | 13,9 |
| Atenção | `255,193,7` | 214 | `255,175,0` | 19,3 |
| Inativo | `153,153,153` | 246 | `148,148,148` | 8,7 |
| Sutil | `80,80,80` | 239 | `78,78,78` | 3,5 |

A perda é de tom, imperceptível sem comparação lado a lado. O degrau de 256 cores sai por uma tabela de
seis linhas, e não por algoritmo de conversão.

### 1.5 O quadro de hoje

| Medida | Valor |
|---|---|
| Linhas do quadro deste repositório, tudo aberto, a 80 colunas | 237 |
| Bytes do mesmo quadro | 12 916 |
| Linhas do cabeçalho | 12 |
| Rodapé fixo | **não existe**: a ajuda é um painel desenhado sobre o quadro |
| Ênfase da passada diante de terminal | **nenhuma**: imprime só o texto da linha |
| Consumidor do texto da passada fora das suítes | **nenhum** encontrado em `scripts/`, `src/` e `package.json` |

Duas correções ao `requirements.md` saíram daqui. A primeira já foi aplicada: a primeira lacuna dizia
que a passada diante de terminal recebia cor, e não recebe. A segunda é a seção 3 deste estudo.

## 2. As três dúvidas

### 2.1 A passada diante de terminal

| Opção | O que é | A favor | Contra |
|---|---|---|---|
| A | Fica como está | Custo zero | Quem roda `--passada` num terminal vê a versão pobre da mesma ferramenta |
| **B** | **O mesmo texto da passada, vestido com a paleta** | Um texto só, com e sem cor; o que se copia do terminal é o que iria para o arquivo; `vestir` já existe | Não tem moldura nem rodapé |
| C | Linguagem inteira, com molduras | Coerência total | Moldura no histórico de rolagem atrapalha copiar e buscar; o rodapé fixo não tem sentido fora da tela alternativa |

**Recomendação: B.** A regra que resulta é curta e se explica sozinha: moldura e rodapé pertencem à tela
alternativa, e a paleta pertence a qualquer terminal. A cor some pelos mesmos caminhos de hoje.

### 2.2 Fundo claro

| Opção | O que é | A favor | Contra |
|---|---|---|---|
| A | Só fundo escuro, declarado | Menor custo; é o fundo em uso | Num terminal claro a atenção fica a 1,63 de contraste |
| B | Tons únicos para os dois fundos | Sem detecção | A tabela 1.3 mostra que não existe |
| **C** | **Duas paletas, escolhidas por declaração da execução** | Fiel à referência nos dois fundos; respeita a RN-08 | Uma bandeira e uma variável a mais |
| D | C, mais pergunta ao terminal pela cor de fundo | Acerta sem ninguém declarar | Exige ler resposta do terminal em modo bruto com tempo-limite; falha de modos diferentes sob multiplexador e sob conexão remota; é a parte mais frágil para o menor ganho |

**Recomendação: C, com o escuro como padrão, e a precedência abaixo.**

1. Bandeira de tema, quando passada.
2. Variável de ambiente de tema, quando declarada. Posta uma vez no arquivo de inicialização do
   interpretador de comandos, vale para sempre sem que a ferramenta guarde estado, e a RN-08 sobrevive.
3. `COLORFGBG`, quando o terminal a declara, como o desta máquina declara. É leitura de variável, sem
   conversa com o terminal.
4. Escuro.

A opção D fica registrada como evolução possível, fora desta feature. As variantes para daltonismo
também: a RN-03 já garante que nenhuma distinção dependa de cor, que é a proteção que importa.

### 2.3 Tamanho do cabeçalho

Doze linhas, mais duas de moldura, são catorze; numa janela de 24 sobra menos da metade para o corpo.
Só que o cabeçalho de hoje **rola com o quadro**, e isso muda a conta.

| Opção | O que é | A favor | Contra |
|---|---|---|---|
| A | Integral, em moldura, rolando com o corpo | Nenhum fato muda de lugar | Primeira tela quase toda de procedência |
| B | Integral e fixo | Procedência sempre à vista | Inviável em 24 linhas |
| **C** | **Núcleo em moldura, rolando; o restante numa seção de procedência ao fim do quadro** | Primeira tela útil; a referência faz o mesmo, com caixa de abertura curta | Cria uma seção que o painel do editor não tem |
| D | Núcleo em moldura; o restante na ajuda | Sem seção nova | Procedência não é ajuda; esconde fato sob tecla |

**Recomendação: C, com duas cautelas.** O núcleo é o que a RN-06 da 014 exige e o que muda a leitura:
projeto, raiz observada, instante e a linha de integridade. O restante (versões, carimbo, revisão do
modelo herdado, conferência) desce. A primeira cautela: a seção nova é do terminal, e a suíte de
paridade compara fatos, não posição, de modo que ela passa; ainda assim a RN-04 da 014 fixa a ordem das
onze seções, e a seção de procedência precisa ficar declaradamente fora dessa ordem, como a faixa de
bloqueio já fica. A segunda: a linha de procedência da leitura ("esta é a primeira leitura", "mudou
sozinha às…") sai do cabeçalho e vai para o rodapé fixo do RF-08, que é onde um fato que muda a cada
releitura deve morar.

## 3. Um quarto ponto, que o estudo levantou

A RN-06, como escrita, exige que a saída redirecionada não mude **um byte**. O RF-06, ao mesmo tempo,
muda a disposição dos itens, pondo caminho e instante em linha própria. Juntos, os dois obrigam a função
de desenho a manter duas disposições para sempre: a antiga para o arquivo, a nova para a tela. É o tipo
de bifurcação que a 014 evitou com cuidado.

Não se achou consumidor do texto da passada. O contrato de máquina da ferramenta é outro: a saída de
dados em JSON e os códigos de saída.

**Recomendação: afrouxar a RN-06 de identidade de bytes para identidade de garantias.** A saída
redirecionada continua sem sequência de escape, sem caractere de moldura, alinhada em oitenta colunas e
com os mesmos fatos na mesma ordem; a saída de dados, essa sim, não muda um byte. A disposição do RF-06
passa a valer nos três destinos, e a recomendação B da seção 2.1 fica literalmente verdadeira: um texto
só. O custo é reescrever expectativas de disposição em `tests/cli-passada.spec.ts` (22 casos) e em
`tests/cli-quadro.spec.ts` (35 casos), o que se deve declarar como mudança de expectativa, e não de
regra.

## 4. O que o estudo confirma sem ressalva

- A referência é alcançável sem dependência nova: tudo o que ela usa é sequência de cor, caractere de
  moldura e glifo.
- O custo de escrita não preocupa: um quadro inteiro tem 13 KiB, a janela desenhada é uma fração disso,
  e a ênfase por trecho acrescenta algumas dezenas de bytes por linha.
- O rodapé fixo é acréscimo estrutural, e não cosmético: hoje não há rodapé, e a janela de rolagem
  passa a ter uma linha a menos. É o item de maior risco de regressão na navegação, e merece suíte
  própria no plano.

## 5. Resumo das recomendações

| Ponto | Recomendação |
|---|---|
| Passada diante de terminal | O mesmo texto, com a paleta; sem moldura e sem rodapé |
| Fundo claro | Duas paletas; bandeira, variável, `COLORFGBG`, escuro, nessa ordem; sem pergunta ao terminal |
| Cabeçalho | Núcleo de quatro fatos em moldura; o restante numa seção de procedência ao fim; a procedência da leitura no rodapé |
| RN-06 | Identidade de garantias para o texto, identidade de bytes só para a saída de dados |
| RF-11 | Trocar a justificativa: a degradação serve ao Operador remoto, não à máquina de desenvolvimento |
