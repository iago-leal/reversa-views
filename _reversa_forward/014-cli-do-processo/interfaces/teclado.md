# Contrato: teclado da interface viva

> Feature `014-cli-do-processo`. As teclas abaixo foram **confirmadas pelo usuário** em 2026-09-20,
> pelo formulário de `perguntas/teclado-e-escopo.html`, antes da decomposição em ações. Alterar este
> arquivo ainda custa uma linha; o código já escrito custa mais.

## 1. Princípio

O teclado é o caminho completo: toda ação se alcança por tecla, e nenhuma depende de recurso que o
terminal possa não ter. Não há mouse, e a seleção se move com tecla e se confirma com enter.

## 2. A tabela confirmada

| Tecla | Efeito | Razão da escolha |
|---|---|---|
| `↑` `↓` e `k` `j` | Move a seleção entre as linhas navegáveis | As setas são o óbvio, e as letras existem para quem tem o hábito do editor modal |
| `←` `→` e `h` `l` | Fecha e abre a seção sob a seleção | Simetria com o movimento vertical |
| `Enter` | Abre no editor o artefato da linha selecionada | Foi a escolha do usuário na sessão de esclarecimento |
| `Tab` e `Shift+Tab` | Salta para a próxima seção e para a anterior | Atravessar onze seções linha a linha é lento numa leitura longa |
| `r` | Relê agora, sem esperar a observação | O gesto do Operador, que acabou de rodar um agente |
| `a` | Abre todas as seções | Espelha a ação global que o painel já tem |
| `z` | Fecha todas as seções | Idem, e a tecla evita colisão com o `A` maiúsculo |
| `?` | Mostra e esconde a ajuda com esta tabela | Para que nada disto precise ser decorado |
| `g` e `G` | Vai ao topo e ao fim do quadro | Convenção antiga de paginador, barata de implementar |
| `q` e `Esc` | Sai, restaurando o terminal | Duas saídas, porque as duas são hábito |
| `Ctrl+C` | Sai, restaurando o terminal | Não é atalho: é o sinal de interrupção, e a restauração é obrigação dele também |
| `Ctrl+Z` | Suspende para o shell devolvendo o terminal, e retoma inteiro ao `fg` | Também não é atalho: é o sinal de suspensão. Suspender não é sair, mas deixa o terminal em modo bruto do mesmo jeito, e a dança de restaurar e redesenhar é a mesma da abertura do editor |

### 2.1 Duas arestas que a tabela não resolvia

**O `Esc`.** As setas chegam ao terminal como `Esc [ A`, de modo que um `Esc` sozinho só se
distingue do começo de uma seta pelo que vem depois dele. O reconhecimento é **por bloco de bytes**,
e não por byte: um bloco que seja exatamente `Esc` é a tecla de saída, e um bloco que comece por
`Esc [` é seta. Não há temporizador, e a razão é de desenho: um relógio dentro do reconhecimento
tiraria a pureza da única função que o contrato exige pura, e o atraso apareceria em toda tecla de
seta. O preço é um caso raro, o da sequência partida em dois blocos por ligação lenta, que fica
registrado como risco no roadmap, com a espera curta como saída caso ele apareça.

**O `Ctrl+Z`.** A RN-08 exige devolver o terminal como foi encontrado em toda saída, e suspender não
é sair: sem tratamento, o processo para em segundo plano e deixa o terminal mudo, sem cursor, até
alguém digitar `fg`. A interface trata o sinal com a mesma dança da suspensão que já existe para o
editor, o que custa uma ação e nenhum mecanismo novo.

## 3. O que nenhuma tecla faz

- Escrever arquivo
- Editar o processo do Reversa
- Disparar agente. O lugar do despacho continua reservado e vazio, como o NG-04 da spec do painel
  determina, e esta feature não o ocupa

## 4. Como a decisão entra no código

A máquina de navegação recebe a tecla **já reconhecida**, como um valor nomeado, e devolve o estado
novo mais um efeito nomeado entre `nenhum`, `reler`, `abrir-artefato`, `suspender` e `sair`. O reconhecimento dos
bytes que o terminal envia acontece antes, também em função pura, e é o único lugar em que a tabela
acima vira código. Trocar uma tecla é trocar uma entrada dessa tabela, e a suíte que a cobre falha
nomeando a tecla trocada.
